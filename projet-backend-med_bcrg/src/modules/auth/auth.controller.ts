/**
 * @file auth.controller.ts
 * @description Controleur HTTP du module d'authentification.
 * Traite les requetes HTTP entrantes, appelle les services correspondants
 * et formate les reponses renvoyees au client.
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { ssoService } from './sso.service';
import { sessionRevocationService } from './session-revocation.service';
import { prisma } from '../../infrastructure/database/prisma';
import { getMatriculeVariants } from '../../core/utils/identity.util';
import { env } from '../../config/env';
import { BadRequestError } from '../../core/errors';

export class AuthController {
  /**
   * Traite la connexion d'un utilisateur par son matricule.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { matricule, password } = req.body;
      const result = await authService.login(matricule, password);

      // Stockage du refresh token dans un cookie securise httpOnly
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      });

      res.status(200).json({
        success: true,
        message: 'Bienvenue, Vous êtes connecté !',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Traite la connexion Single Sign-On (SSO) fédérée émise par le BCRG HUB.
   */
  async ssoLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let ssoToken = req.body?.sso_token || req.body?.token;
      if (!ssoToken && req.headers.authorization?.startsWith('Bearer ')) {
        ssoToken = req.headers.authorization.split(' ')[1];
      }

      if (!ssoToken) {
        throw new BadRequestError("Jeton d'authentification SSO (sso_token) requis.");
      }

      // 1. Validation cryptographique du jeton du BCRG HUB
      const hubPayload = await ssoService.verifyHubToken(ssoToken);

      // 2. Réconciliation ou provisionnement de l'utilisateur
      const result = await ssoService.authenticateOrProvisionUser(hubPayload);

      // 3. Stockage du refresh token dans un cookie sécurisé
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: 'Authentification SSO BCRG Hub réussie',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récepteur du signal Single Logout (SLO) émis par le BCRG HUB.
   * Révoque immédiatement tous les jetons actifs associés à l'utilisateur ciblé.
   */
  async singleLogout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { matricule, email, user_id, logout_token } = req.body || {};
      let targetMatricule = matricule;
      let targetEmail = email;
      let targetUserId = user_id;

      if (logout_token) {
        try {
          const decoded: any = await ssoService.verifyHubToken(logout_token);
          const u = decoded.user || decoded;
          targetMatricule = u.matricule || targetMatricule;
          targetEmail = u.email || targetEmail;
          targetUserId = u.id || u.sub || targetUserId;
        } catch (err: any) {
          console.warn('[SLO MedBCRG] Avertissement décodage logout_token:', err.message);
        }
      }

      const now = Date.now();
      console.log(`[SLO MedBCRG] Réception signal SLO : matricule=${targetMatricule}, email=${targetEmail}, userId=${targetUserId}`);

      // 1. Révocation immédiate en mémoire
      if (targetMatricule) {
        sessionRevocationService.revoke(targetMatricule, now);
        const variants = getMatriculeVariants(targetMatricule);
        variants.forEach((v) => sessionRevocationService.revoke(v, now));
      }

      if (targetUserId) {
        sessionRevocationService.revoke(String(targetUserId), now);
      }

      if (targetEmail) {
        sessionRevocationService.revoke(targetEmail, now);
      }

      // 2. Recherche en base de données pour identifier et révoquer l'utilisateur correspondant
      try {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              ...(targetMatricule ? [{ matricule: targetMatricule }] : []),
              ...(targetEmail ? [{ email: targetEmail }] : []),
            ],
          },
        });

        if (user) {
          sessionRevocationService.revoke(user.id, now);
          sessionRevocationService.revoke(user.matricule, now);
          if (user.email) sessionRevocationService.revoke(user.email, now);

          // Actualiser la date de mise à jour pour invalider toute session persistante
          await prisma.user.update({
            where: { id: user.id },
            data: { updatedAt: new Date() },
          });
          console.log(`[SLO MedBCRG] Compte utilisateur ${user.matricule} (${user.id}) marqué comme déconnecté.`);
        }
      } catch (dbErr: any) {
        console.warn('[SLO MedBCRG] Note mise à jour base de données:', dbErr.message);
      }

      // 3. Suppression des cookies résiduels
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(200).json({
        success: true,
        message: `Signal SLO traité avec succès. Session révoquée pour ${targetMatricule || targetEmail || 'utilisateur'}.`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Traite la modification obligatoire du mot de passe initial.
   */
  async changeInitialPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      const result = await authService.changeInitialPassword(userId, currentPassword, newPassword);

      // Renouvellement du cookie de rafraichissement
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Renouvelle les jetons de session.
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies.refreshToken || req.body.refreshToken;

      if (!token) {
        throw new BadRequestError('Jeton de rafraichissement manquant');
      }

      const tokens = await authService.refreshSession(token);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: 'Session renouvelee avec succes.',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recupere les informations de l'utilisateur actuellement authentifie.
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await authService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deconnecte l'utilisateur en supprimant le cookie de session.
   */
  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      message: 'Deconnexion reussie.',
    });
  }
}

export const authController = new AuthController();

