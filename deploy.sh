#!/bin/bash
# ==============================================================================
# Script de deploiement tout-en-un - MedBCRG (Frontend + Backend + PostgreSQL)
# Cible : AlmaLinux 10 / Docker Compose
# ==============================================================================
set -e

echo "============================================================"
echo "[INFO] Debut du deploiement MedBCRG Tout-en-Un (Frontend & Backend)..."
echo "============================================================"

# Verification des prerequis Docker
if ! command -v docker &> /dev/null; then
    echo "[ERREUR] Docker n'est pas installe sur ce serveur."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "[ERREUR] docker compose n'est pas disponible."
    exit 1
fi

# Gestion du fichier d'environnement global .env
if [ ! -f .env ]; then
    echo "[ATTENTION] Fichier .env introuvable. Generation a partir de .env.production.example..."
    cp .env.production.example .env

    # Generation automatique de cles fortes aleatoires
    if command -v openssl &> /dev/null; then
        RAND_ACCESS=$(openssl rand -hex 48)
        RAND_REFRESH=$(openssl rand -hex 48)
        RAND_DB_PASS=$(openssl rand -hex 16)

        sed -i "s/changer_par_une_cle_secrete_jwt_access_64_chars_min/$RAND_ACCESS/" .env
        sed -i "s/changer_par_une_cle_secrete_jwt_refresh_64_chars_min/$RAND_REFRESH/" .env
        sed -i "s/choisir_un_mot_de_passe_robuste_db_2026/$RAND_DB_PASS/" .env
        echo "[OK] Cles JWT et mot de passe PostgreSQL securises generes avec succes."
    fi
fi

# Construction et lancement de toute la pile de conteneurs
echo "[BUILD] Construction des images et demarrage des services Docker..."
docker compose up -d --build --remove-orphans

echo "[ATTENTE] Demarrage des services en cours (PostgreSQL, Backend, Frontend)..."
sleep 10

# Affichage du statut des conteneurs
echo "[STATUT] Statut des conteneurs MedBCRG :"
docker compose ps

# Verification des endpoints
echo "[CHECK] Verification de l'etat des services :"
if curl -s http://localhost:5003/api/health | grep -q "UP"; then
    echo "  [OK] Backend operationnel sur le port 5003 (http://localhost:5003/api/health)"
else
    echo "  [ATTENTE] Backend en cours d'initialisation..."
fi

if curl -s http://localhost:3003 | grep -q "html"; then
    echo "  [OK] Frontend operationnel sur le port 3003 (http://localhost:3003)"
else
    echo "  [ATTENTE] Frontend en cours de demarrage..."
fi

echo "============================================================"
echo "[SUCCES] Deploiement termine."
echo "Frontend (Interface Web) : http://<IP-DE-SRV-HOMOLOGATION>:3003"
echo "Backend (API REST)       : http://<IP-DE-SRV-HOMOLOGATION>:5003"
echo "Documentation Swagger    : http://<IP-DE-SRV-HOMOLOGATION>:5003/api/docs"
echo "------------------------------------------------------------"
echo "Pare-feu AlmaLinux (firewalld) - Commandes a executer si requis :"
echo "  sudo firewall-cmd --permanent --add-port=3003/tcp"
echo "  sudo firewall-cmd --permanent --add-port=5003/tcp"
echo "  sudo firewall-cmd --reload"
echo "============================================================"
