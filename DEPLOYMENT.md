# Guide de Deploiement Global - Infirmerie MedBCRG (Tout-en-un)

Ce guide decrit le deploiement complet de l'application MedBCRG (Frontend React + Backend Express/Prisma + Base de donnees PostgreSQL) sur le serveur on-premise AlmaLinux 10.2 (srv-homologation).

---

## 1. Architecture des Services et Ports

| Service | Role | Port Interne | Port Public / Serveur |
| :--- | :--- | :--- | :--- |
| **frontend** | Interface Web (React / Vite / Nginx) | `80` | **`3003`** |
| **backend** | API REST (Node.js / Express / Prisma) | `5000` | **`5003`** |
| **postgres** | Base de donnees PostgreSQL 16 Alpine | `5432` | `5432` (optionnel) |

> **Fonctionnement du Proxy Transparent :**
> Le conteneur frontend integre un serveur Nginx configure pour servir le build React et relayer automatiquement les requetes `/api/` vers le backend. Les utilisateurs accedent a l'application complete directement via le port 3003, tandis que les developpeurs ou integrateurs peuvent egalement interroger le backend ou Swagger directement sur le port 5003.

---

## 2. Procedure de Deploiement Rapide (1 Commande)

### Etape 1 : Cloner ou deposer le projet sur le serveur

Sur `srv-homologation` :
```bash
cd /opt
git clone <URL_DU_DEPOT_PARENT_MEDBCRG> MedBCRG
cd MedBCRG
```

### Etape 2 : Lancer le deploiement automatise

```bash
chmod +x deploy.sh
./deploy.sh
```

Le script `deploy.sh` effectue automatiquement :
- La creation du fichier `.env` a partir de `.env.production.example`.
- La generation de cles de securite cryptographiques aleatoires (`openssl rand -hex`).
- La construction des images Docker (`frontend` et `backend`).
- L'initialisation du schema PostgreSQL (`prisma db push`) et des comptes par defaut (`seed`).
- La verification du bon fonctionnement des services sur les ports 3003 et 5003.

---

## 3. Configuration du Pare-feu AlmaLinux (firewalld)

Executez les commandes suivantes pour autoriser l'acces aux ports 3003 et 5003 depuis le reseau de la BCRG :

```bash
sudo firewall-cmd --permanent --add-port=3003/tcp
sudo firewall-cmd --permanent --add-port=5003/tcp
sudo firewall-cmd --reload
```

Pour verifier les ports ouverts :
```bash
sudo firewall-cmd --list-ports
```

---

## 4. Liens d'acces aux services

Une fois deploye :
- **Application Web (Frontend)** : `http://<IP-DE-SRV-HOMOLOGATION>:3003`
- **API REST Backend** : `http://<IP-DE-SRV-HOMOLOGATION>:5003`
- **Health Check** : `http://<IP-DE-SRV-HOMOLOGATION>:5003/api/health`
- **Documentation Swagger** : `http://<IP-DE-SRV-HOMOLOGATION>:5003/api/docs`

---

## 5. Commandes Utiles d'Exploitation

### Suivi des journaux (Logs en temps reel)
```bash
# Tous les services
docker compose logs -f

# Uniquement le frontend
docker compose logs -f frontend

# Uniquement l'API backend
docker compose logs -f backend

# Uniquement la base PostgreSQL
docker compose logs -f postgres
```

### Mettre a jour l'application (Apres modification de code)
```bash
cd /opt/MedBCRG
git pull
docker compose up -d --build
```

### Sauvegarde complete de la base de donnees PostgreSQL
```bash
docker exec -t medbcrg-postgres pg_dumpall -c -U infirmerie_admin > backup_medbcrg_$(date +%F_%H%M%S).sql
```

### Restauration d'une sauvegarde
```bash
cat backup_medbcrg_YYYY-MM-DD.sql | docker exec -i medbcrg-postgres psql -U infirmerie_admin -d infirmerie_bcrg
```

### Arreter ou redemarrer la pile
```bash
# Arreter sans perdre les donnees
docker compose down

# Redemarrer
docker compose up -d
```
