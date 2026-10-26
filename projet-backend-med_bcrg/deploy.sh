#!/bin/bash
# ==============================================================================
# Script de déploiement et mise à jour automatique - Backend MedBCRG
# Cible : AlmaLinux 10 / RedHat / Docker Compose
# ==============================================================================
set -e

echo "Début du déploiement MedBCRG Backend..."

# Vérification des prérequis Docker
if ! command -v docker &> /dev/null; then
    echo "Erreur : Docker n'est pas installé sur ce serveur."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "Erreur : docker compose n'est pas disponible."
    exit 1
fi

# Gestion du fichier d'environnement .env
if [ ! -f .env ]; then
    echo "Fichier .env introuvable. Génération à partir de .env.production.example..."
    cp .env.production.example .env

    # Génération automatique de clés secrètes aléatoires fortes si openssl est présent
    if command -v openssl &> /dev/null; then
        RAND_ACCESS=$(openssl rand -hex 48)
        RAND_REFRESH=$(openssl rand -hex 48)
        RAND_DB_PASS=$(openssl rand -hex 16)

        sed -i "s/changer_par_une_cle_secrete_jwt_access_64_chars_min/$RAND_ACCESS/" .env
        sed -i "s/changer_par_une_cle_secrete_jwt_refresh_64_chars_min/$RAND_REFRESH/" .env
        sed -i "s/choisir_un_mot_de_passe_robuste_db_2026/$RAND_DB_PASS/" .env
        echo "Clés JWT et mot de passe de base de données générés de façon sécurisée."
    else
        echo "Veuillez éditer le fichier .env pour définir des clés de sécurité uniques."
    fi
fi

# Construction et lancement des conteneurs
echo "Construction de l'image Docker et démarrage des services..."
docker compose up -d --build --remove-orphans

echo "Attente du démarrage des services..."
sleep 8

# Affichage des statuts
echo "Statut des conteneurs :"
docker compose ps

# Vérification du Health Check
echo "Vérification de la disponibilité de l'API..."
if curl -s http://localhost:5003/api/health | grep -q "UP"; then
    echo "Deploiement reussi ! Le backend est operationnel sur http://localhost:5003"
    echo "Documentation Swagger disponible sur : http://localhost:5003/api/docs"
else
    echo "Le service est en cours d'initialisation. Consultez les logs avec : docker compose logs -f backend"
fi

echo "============================================================"
echo "Conseils pour AlmaLinux / Firewalld :"
echo "Pour ouvrir le port 5003 sur le reseau :"
echo "  sudo firewall-cmd --permanent --add-port=5003/tcp"
echo "  sudo firewall-cmd --reload"
echo "============================================================"
