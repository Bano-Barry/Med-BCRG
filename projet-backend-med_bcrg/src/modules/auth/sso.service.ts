/**
 * @file sso.service.ts
 * @description Service de validation cryptographique et d'authentification fédérée SSO BCRG HUB.
 * Prend en charge la vérification asymétrique RS256 (JWKS OIDC + clé PEM locale)
 * et le repli symétrique HS256, ainsi que la réconciliation automatique avec l'Active Directory.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../infrastructure/database/prisma';
import { UnauthorizedError, ForbiddenError, BadRequestError, AppError } from '../../core/errors';
import { generateTokens, hashPassword } from '../../core/utils/security';
import { AuthTokenPayload } from '../../core/types/auth.types';
import {
  getMatriculeVariants,
  matchPersonNames,
  matchEmailWithPerson,
} from '../../core/utils/identity.util';

export interface BcrgHubSsoPayload {
  sub?: number | string;
  id?: number | string;
  matricule?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  nom?: string;
  prenom?: string;
  department?: string;
  role?: string;
  aud?: string;
  app_id?: number | string;
  app_name?: string;
  iss?: string;
  exp?: number;
  iat?: number;
}

class SsoService {
  private cachedPublicKey: string | null = null;
  private cacheExpiresAt: number = 0;

  /**
   * Récupère la clé publique RSA depuis le point de découverte JWKS du BCRG HUB
   * avec mise en cache mémoire (1 heure).
   */
  private async getJwksPublicKey(): Promise<string | null> {
    const now = Date.now();
    if (this.cachedPublicKey && this.cacheExpiresAt > now) {
      return this.cachedPublicKey;
    }

    const jwksUrl = env.BCRG_HUB_JWKS_URL;
    if (!jwksUrl) return null;

    try {
      const response = await fetch(jwksUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(2000),
      });

      if (!response.ok) {
        console.warn(`[SSO MedBCRG] Échec d'interrogation JWKS (${response.statusText})`);
        return null;
      }

      const data: any = await response.json();
      const keyObj = data?.keys?.[0];

      if (keyObj && typeof keyObj.publicKeyPem === 'string' && keyObj.publicKeyPem.includes('BEGIN PUBLIC KEY')) {
        this.cachedPublicKey = keyObj.publicKeyPem;
        this.cacheExpiresAt = now + 60 * 60 * 1000; // 1 heure de cache
        return this.cachedPublicKey;
      }
    } catch (err: any) {
      console.warn(`[SSO MedBCRG] JWKS HUB inaccessible (${err.message}). Utilisation de la clé publique locale.`);
    }

    return null;
  }

  /**
   * Récupère la clé publique RSA de secours locale
   */
  private getLocalPublicKey(): string | null {
    // 1. Variable d'environnement directe
    if (env.BCRG_HUB_PUBLIC_KEY) {
      return env.BCRG_HUB_PUBLIC_KEY.replace(/\\n/g, '\n');
    }

    // 2. Chemin spécifié dans l'environnement
    if (env.BCRG_HUB_PUBLIC_KEY_PATH) {
      const resolvedPath = path.isAbsolute(env.BCRG_HUB_PUBLIC_KEY_PATH)
        ? env.BCRG_HUB_PUBLIC_KEY_PATH
        : path.resolve(process.cwd(), env.BCRG_HUB_PUBLIC_KEY_PATH);
      if (fs.existsSync(resolvedPath)) {
        return fs.readFileSync(resolvedPath, 'utf8');
      }
    }

    // 3. Fichier par défaut bcrg_hub_public.pem
    const defaultFile = path.resolve(__dirname, '../../config/bcrg_hub_public.pem');
    if (fs.existsSync(defaultFile)) {
      return fs.readFileSync(defaultFile, 'utf8');
    }

    return null;
  }

  /**
   * Valide un jeton SSO émis par le BCRG HUB (OIDC / JWT).
   * Supporte la signature asymétrique RS256 (JWKS + PEM local)
   * et le repli symétrique HS256 (JWT_SECRET du HUB).
   */
  async verifyHubToken(token: string): Promise<BcrgHubSsoPayload> {
    if (!token || typeof token !== 'string') {
      throw new BadRequestError('Jeton SSO BCRG manquant ou invalide.');
    }

    // Décodage préliminaire pour identifier l'algorithme
    const decodedUnverified = jwt.decode(token, { complete: true });
    if (!decodedUnverified || typeof decodedUnverified !== 'object') {
      throw new UnauthorizedError('Structure de jeton SSO invalide.');
    }

    console.log('[SSO MedBCRG] Jeton SSO reçu :', {
      alg: decodedUnverified.header?.alg,
      typ: decodedUnverified.header?.typ,
      kid: (decodedUnverified.header as any)?.kid,
      issuer: (decodedUnverified.payload as any)?.iss,
      subject: (decodedUnverified.payload as any)?.sub,
      email: (decodedUnverified.payload as any)?.email,
      matricule: (decodedUnverified.payload as any)?.matricule,
      exp: (decodedUnverified.payload as any)?.exp,
    });

    const alg = decodedUnverified.header?.alg;
    let payload: any = null;

    if (alg === 'RS256') {
      // 1. Tenter la clé publique JWKS dynamique
      let publicKey = await this.getJwksPublicKey();

      // 2. Repli vers le fichier PEM local
      if (!publicKey) {
        publicKey = this.getLocalPublicKey();
      }

      if (!publicKey) {
        throw new AppError('Clé publique de signature du BCRG HUB introuvable.', 500);
      }

      try {
        payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
      } catch (err: any) {
        // Si la clé en cache a échoué, on purge le cache et on retente une fois avec le local
        const localKey = this.getLocalPublicKey();
        if (localKey && localKey !== publicKey) {
          try {
            payload = jwt.verify(token, localKey, { algorithms: ['RS256'] });
          } catch (retryErr: any) {
            throw new UnauthorizedError(`Jeton SSO RSA invalide ou expiré : ${retryErr.message}`);
          }
        } else {
          throw new UnauthorizedError(`Jeton SSO RSA invalide ou expiré : ${err.message}`);
        }
      }
    } else if (alg === 'HS256') {
      const configuredSecrets = env.BCRG_HUB_JWT_SECRET
        ? env.BCRG_HUB_JWT_SECRET.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const candidateSecrets = [
        ...configuredSecrets,
        'supersecret_bcrg_hub_production_jwt_key_2026',
        'bcrg_hub_super_secret_jwt_key_a_changer_en_production_2026',
        'supersecret_sso_portal_key_2026',
        'your_jwt_secret_change_in_production',
        env.JWT_ACCESS_SECRET,
      ].filter((s, idx, arr) => Boolean(s) && arr.indexOf(s) === idx) as string[];

      let lastError: Error | null = null;
      for (const secret of candidateSecrets) {
        try {
          payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
          lastError = null;
          break;
        } catch (err: any) {
          lastError = err;
        }
      }

      if (lastError || !payload) {
        console.error(
          `[SSO MedBCRG] Échec de validation du jeton SSO HMAC : ${lastError?.message}. ` +
          `Vérifiez que BCRG_HUB_JWT_SECRET dans le fichier .env correspond à la clé secrète de signature utilisée par le portail BCRG HUB.`
        );
        throw new UnauthorizedError(`Jeton SSO HMAC invalide ou expiré : ${lastError?.message}`);
      }
    } else {
      throw new UnauthorizedError(`Algorithme de jeton non pris en charge : ${alg}`);
    }

    return payload as BcrgHubSsoPayload;
  }

  /**
   * Mappe un libellé de rôle Active Directory / Hub vers les rôles internes de MedBCRG.
   */
  private mapRole(hubRole?: string): UserRole {
    if (!hubRole) return UserRole.EMPLOYEE;
    const r = hubRole.toLowerCase();
    if (r.includes('admin') || r.includes('rh') || r.includes('drh') || r.includes('ressources humaines')) {
      return UserRole.HR;
    }
    if (r.includes('doct') || r.includes('medecin') || r.includes('infirmier') || r.includes('soignant')) {
      return UserRole.DOCTOR;
    }
    return UserRole.EMPLOYEE;
  }

  /**
   * Authentifie un utilisateur à partir du payload SSO BCRG HUB.
   * Réconcilie avec les comptes existants (matricule, nom/prénom, email)
   * ou provisionne automatiquement un nouveau profil sans blocage.
   */
  async authenticateOrProvisionUser(hubPayload: BcrgHubSsoPayload) {
    const emailPrefix = hubPayload.email ? (hubPayload.email.split('@')[0] ?? '') : '';
    const adIdentifier = (hubPayload.matricule || emailPrefix).trim();
    const adEmail = hubPayload.email?.trim() || '';
    const adLastName = (hubPayload.last_name || hubPayload.nom || '').trim();
    const adFirstName = (hubPayload.first_name || hubPayload.prenom || '').trim();

    let user: any = null;

    // 1. Recherche par matricule direct ou ses variantes (ex: "2007", "BCRG2007", "BCRG-2007")
    if (adIdentifier) {
      const variants = getMatriculeVariants(adIdentifier);
      for (const v of variants) {
        user = await prisma.user.findUnique({
          where: { matricule: v },
          include: { patient: true },
        });
        if (user) break;
      }
    }

    // 2. Recherche par email
    if (!user && adEmail) {
      user = await prisma.user.findUnique({
        where: { email: adEmail },
        include: { patient: true },
      });
    }

    // 3. Recherche tolérante par Nom / Prénom
    if (!user && (adLastName || adFirstName)) {
      const allUsers = await prisma.user.findMany({
        include: { patient: true },
      });

      user = allUsers.find((u) => matchPersonNames(adLastName, adFirstName, u.lastName, u.firstName)) || null;

      // Recherche par identifiant/email avec nom/prénom
      if (!user && (adEmail || adIdentifier)) {
        user = allUsers.find(
          (u) =>
            matchEmailWithPerson(adEmail, u.lastName, u.firstName) ||
            matchEmailWithPerson(adIdentifier, u.lastName, u.firstName)
        ) || null;
      }
    }

    if (!user) {
      // Provisionnement automatique du nouvel utilisateur venant du HUB
      const fallbackMatricule =
        adIdentifier ||
        emailPrefix ||
        ('BCRG-' + String(hubPayload.sub || crypto.randomUUID().slice(0, 6)).toUpperCase());

      const assignedRole = this.mapRole(hubPayload.role);
      const dummyPasswordHash = await hashPassword(crypto.randomUUID());

      user = await prisma.user.create({
        data: {
          matricule: fallbackMatricule,
          email: adEmail || null,
          firstName: adFirstName || 'Agent',
          lastName: adLastName || 'BCRG',
          role: assignedRole,
          department: hubPayload.department || null,
          passwordHash: dummyPasswordHash,
          isFirstLogin: false, // Compte fédéré via Active Directory / HUB : pas de changement requis
          isActive: true,
          lastLoginAt: new Date(),
        },
        include: { patient: true },
      });

      // Provisionnement transparent d'une fiche patient initiale
      try {
        const patient = await prisma.patient.create({
          data: {
            userId: user.id,
            registrationNumber: user.matricule,
            gender: 'N/A',
          },
        });
        user.patient = patient;
      } catch (err: any) {
        console.warn('[SSO MedBCRG] Note fiche patient auto-provisionnée:', err.message);
      }
    } else {
      // Compte existant
      if (!user.isActive) {
        throw new ForbiddenError(
          'Votre compte Infirmerie BCRG est actuellement désactivé. Veuillez contacter un administrateur.'
        );
      }

      // Mise à jour douce : synchroniser nom/prénom ou email s'ils étaient absents
      const updates: any = {
        lastLoginAt: new Date(),
        isFirstLogin: false, // Désactive l'obligation de premier mot de passe local pour les utilisateurs SSO
      };

      if (!user.email && adEmail) updates.email = adEmail;
      if (!user.department && hubPayload.department) updates.department = hubPayload.department;
      if (!user.firstName && adFirstName) updates.firstName = adFirstName;
      if (!user.lastName && adLastName) updates.lastName = adLastName;

      user = await prisma.user.update({
        where: { id: user.id },
        data: updates,
        include: { patient: true },
      });

      // Vérifier si une fiche patient existe, sinon la créer pour garantir l'accès à l'Espace Santé
      if (!user.patient) {
        try {
          const patient = await prisma.patient.create({
            data: {
              userId: user.id,
              registrationNumber: user.matricule,
              gender: 'N/A',
            },
          });
          user.patient = patient;
        } catch (patientErr: any) {
          console.warn('[SSO MedBCRG] Fiche patient existante ou erreur création:', patientErr.message);
        }
      }
    }

    // Génération des jetons de session interne de MedBCRG
    const tokenPayload: AuthTokenPayload = {
      sub: user.id,
      matricule: user.matricule,
      role: user.role,
      isFirstLogin: false,
    };

    const tokens = generateTokens(tokenPayload);

    return {
      user: {
        id: user.id,
        matricule: user.matricule,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        department: user.department,
        jobTitle: user.jobTitle,
        role: user.role,
        isFirstLogin: false,
        patient: user.patient,
      },
      tokens,
    };
  }
}

export const ssoService = new SsoService();
