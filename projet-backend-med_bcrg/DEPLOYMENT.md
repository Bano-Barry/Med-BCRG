# Guide de Déploiement On-Premise - Backend Infirmerie BCRG

Ce guide détaille la procédure de déploiement et d'exploitation du backend sur votre serveur **AlmaLinux 10.2 (srv-homologation)** utilisant l'environnement conteneurisé **Docker & Docker Compose**.

---

## Prérequis sur le serveur (Déjà validés)
- **Système d'exploitation** : AlmaLinux 10.2 (Kernel Linux 6.12 x86_64)
- **Docker CE** : Version 29+ (`/usr/bin/docker`)
- **Docker Compose** : Plugin v5.6+ (`docker compose`)
- **Git** : Installé

---

## Étape 1 : Cloner ou transférer le projet sur le serveur

Connectez-vous en SSH sur `srv-homologation` puis clonez le dépôt :

```bash
cd /opt # ou dans votre répertoire de projet
git clone https://github.com/Bano-Barry/projet-backend-med_bcrg.git
cd projet-backend-med_bcrg
```

---

## Étape 2 : Configuration des variables d'environnement

Copiez le modèle de configuration pour la production :

```bash
cp .env.production.example .env
```

Éditez le fichier `.env` :

```bash
nano .env
```

### Variables clés à ajuster :
| Variable | Description | Exemple / Valeur recommandée |
| :--- | :--- | :--- |
| `PORT` | Port exposé sur l'hôte | `5003` |
| `DB_USER` | Utilisateur PostgreSQL | `infirmerie_admin` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | *Choisir un mot de passe fort* |
| `DB_NAME` | Nom de la base de données | `infirmerie_bcrg` |
| `JWT_ACCESS_SECRET` | Clé secrète JWT Access | Clé aléatoire de 64+ caractères |
| `JWT_REFRESH_SECRET` | Clé secrète JWT Refresh | Clé aléatoire de 64+ caractères |
| `CORS_ORIGIN` | Origines autorisées pour le frontend | `*` ou `http://srv-homologation:5173,http://192.168.1.x:5173` |
| `AUTO_MIGRATE` | Synchronisation automatique du schéma Prisma au boot | `true` |
| `AUTO_SEED` | Création des utilisateurs initiaux au boot | `true` (premier démarrage) |

**Astuce pour générer des clés secrètes aléatoires fortes :**
> ```bash
> openssl rand -hex 64
> ```

---

## Étape 3 : Ouverture du port dans le pare-feu (Firewalld AlmaLinux)

Par défaut, AlmaLinux active le pare-feu `firewalld`. Pour rendre l'API accessible depuis les autres machines ou le frontend :

```bash
sudo firewall-cmd --permanent --add-port=5003/tcp
sudo firewall-cmd --reload
```

Pour vérifier que le port est bien ouvert :
```bash
sudo firewall-cmd --list-ports
```

---

## Étape 4 : Lancement du déploiement

Vous pouvez soit utiliser le script automatisé :

```bash
chmod +x deploy.sh
./deploy.sh
```

Ou lancer les commandes Docker Compose manuellement :

```bash
docker compose up -d --build
```

---

## Étape 5 : Vérification du bon fonctionnement

### 1. Statut des conteneurs
```bash
docker compose ps
```
Les conteneurs `medbcrg-postgres` et `medbcrg-backend` doivent être au statut `Up (healthy)`.

### 2. Test du Health Check
```bash
curl -i http://localhost:5000/api/health
```
Réponse attendue :
```json
{"status":"UP","service":"backend-med-bcrg","timestamp":"...","environment":"production"}
```

### 3. Consultation des journaux (Logs)
```bash
# Suivre les logs de l'API backend
docker compose logs -f backend

# Suivre les logs de PostgreSQL
docker compose logs -f postgres
```

### 4. Accès à la documentation interactive Swagger
Ouvrez dans votre navigateur :
`http://<IP-DE-SRV-HOMOLOGATION>:5000/api/docs`

---

## Opérations d'exploitation et maintenance

### Mise à jour de l'application (Nouveau code Git)
```bash
cd /opt/projet-backend-med_bcrg
git pull
docker compose up -d --build
```

### Sauvegarde de la base de données PostgreSQL
Pour exporter un dump complet :
```bash
docker exec -t medbcrg-postgres pg_dumpall -c -U infirmerie_admin > backup_medbcrg_$(date +%F_%H%M%S).sql
```

### Restauration d'une sauvegarde
```bash
cat backup_medbcrg_YYYY-MM-DD.sql | docker exec -i medbcrg-postgres psql -U infirmerie_admin -d infirmerie_bcrg
```

### Accès au shell de la base de données PostgreSQL
```bash
docker exec -it medbcrg-postgres psql -U infirmerie_admin -d infirmerie_bcrg
```

### Réinitialiser / Re-jouer le seed des comptes initiaux
```bash
docker exec -it medbcrg-backend node dist/infrastructure/database/seed.js
```

### Arrêter les services
```bash
docker compose down
```
*(Les données de la base et les fichiers uploadés restent conservés dans les volumes `medbcrg_postgres_data` et `medbcrg_uploads_data`)*.
