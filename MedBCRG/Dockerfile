# ==============================================================================
# Étape 1 : Construction de l'application frontend (Vite / React / Tailwind)
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --fetch-timeout=300000

# Variables de build injectées dans le bundle Vite
ARG VITE_API_URL=""
ARG VITE_BCRG_HUB_URL=""

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BCRG_HUB_URL=$VITE_BCRG_HUB_URL

COPY . ./
RUN npm run build

# ==============================================================================
# Étape 2 : Serveur Web Haute Performance Nginx
# ==============================================================================
FROM nginx:alpine AS runner

# Installation de curl pour le healthcheck
RUN apk add --no-cache curl

# Copie de la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers compilés depuis l'étape de build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
