/**
 * @file prisma.ts
 * @description Instance unique (singleton) du client Prisma ORM avec Driver Adapter PostgreSQL.
 * Requis par Prisma 7 pour gerer le pool de connexions directes PostgreSQL.
 */

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from '../../config/env';

const pool = new Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);

/**
 * Instance partagee de PrismaClient pour l'ensemble de l'application.
 */
export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
