#!/bin/sh
set -e

echo "============================================================"
echo "    Initialisation du conteneur Backend MedBCRG"
echo "============================================================"

# Attente et synchronisation du schéma de la base de données
if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
  echo "[1/3] Synchronisation du schéma PostgreSQL (prisma db push)..."
  npx prisma db push --skip-generate
else
  echo "[1/3] Synchronisation du schéma désactivée (AUTO_MIGRATE=false)."
fi

# Exécution de l'ensemencement (seed) initial si activé
if [ "${AUTO_SEED:-false}" = "true" ]; then
  echo "[2/3] Exécution de l'ensemencement des données (seed)..."
  node dist/infrastructure/database/seed.js || echo "[Warning] L'ensemencement a retourné une alerte (peut-être déjà initialisé)."
else
  echo "[2/3] Ensemencement automatique désactivé (AUTO_SEED=false)."
fi

echo "[3/3] Démarrage du serveur Node.js..."
exec "$@"
