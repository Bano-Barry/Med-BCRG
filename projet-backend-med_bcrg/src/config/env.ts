/**
 * @file env.ts
 * @description Module de chargement et de validation des variables d'environnement.
 * Utilise la bibliotheque Zod pour garantir que toutes les configurations
 * requises sont presentes et valides des le demarrage du serveur backend.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Chargement des variables definies dans le fichier .env
dotenv.config();

/**
 * Schema de validation Zod pour l'environnement applicatif.
 */
const envSchema = z.object({
  /** Environnement d'execution du serveur */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  /** Port d'ecoute du serveur HTTP */
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),

  /** URL de connexion a la base de donnees PostgreSQL */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est requise'),

  /** Cle secrete pour la signature des jetons d'acces JWT */
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET doit comporter au moins 16 caracteres'),

  /** Cle secrete pour la signature des jetons de rafraichissement JWT */
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET doit comporter au moins 16 caracteres'),

  /** Duree de validite du jeton d'acces */
  JWT_ACCESS_EXPIRES_IN: z.string().default('1h'),

  /** Duree de validite du jeton de rafraichissement */
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  /** Origine autorisee pour les requetes transverses (CORS) */
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  /** Dossier de stockage des fichiers et documents televerses */
  UPLOAD_DIR: z.string().default('./uploads'),

  /** Configuration SSO BCRG HUB */
  BCRG_HUB_URL: z.string().default('http://localhost:5001'),
  BCRG_HUB_JWKS_URL: z.string().default('http://localhost:5001/api/security/.well-known/jwks.json'),
  BCRG_HUB_JWT_SECRET: z.string().default('supersecret_bcrg_hub_production_jwt_key_2026'),
  BCRG_HUB_PUBLIC_KEY_PATH: z.string().optional(),
  BCRG_HUB_PUBLIC_KEY: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Configuration d\'environnement invalide :');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

/**
 * Objet contenant les variables d'environnement validees et typees.
 */
export const env = parsedEnv.data;
