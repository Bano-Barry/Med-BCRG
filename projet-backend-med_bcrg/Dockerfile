# ==============================================================================
# Étape 1 : Construction (Builder)
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Dépendances système requises par Prisma sur Alpine Linux
RUN apk add --no-cache openssl libc6-compat

# Copie des fichiers de dépendances et de configuration Prisma (requis par postinstall: prisma generate)
COPY package.json package-lock.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

# Installation des dépendances et exécution du postinstall (prisma generate)
RUN npm ci

# Copie des fichiers sources et de configuration TypeScript
COPY tsconfig.json ./
COPY src ./src
COPY public ./public

# Compilation du code TypeScript vers ./dist
RUN npm run build

# Élagage des dépendances pour ne conserver que la production
RUN npm prune --production

# ==============================================================================
# Étape 2 : Image d'Exécution Minimale (Production Runner)
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Dépendances système d'exécution (OpenSSL pour Prisma, curl pour healthcheck)
RUN apk add --no-cache openssl libc6-compat curl

ENV NODE_ENV=production
ENV PORT=5000

# Création des dossiers nécessaires et configuration des permissions
RUN mkdir -p /app/uploads/temp && chown -R node:node /app

# Copie des modules de production et du client Prisma
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/dist ./dist

# Copie du script d'entrée Docker
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Bascule sur l'utilisateur non-root sécurisé
USER node

# Exposition du port applicatif
EXPOSE 5000

# Surveillance de la santé du conteneur (Healthcheck)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
