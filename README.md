# MedBCRG — Système de Gestion Médicale & Santé au Travail (BCRG)

Plateforme intégrée de gestion de l'infirmerie et de la médecine du travail de la **Banque Centrale de la République de Guinée (BCRG)**.

L'application **MedBCRG** digitalise l'ensemble du parcours de santé au travail : suivi médical des collaborateurs, consultations cliniques, suivi spécifique du diabète et des stocks de bandelettes glycémiques, planification des rendez-vous, génération automatisée des actes médicaux (ordonnances, certificats d'aptitude, repos médicaux) et pilotage RH de la périodicité des visites obligatoires dans le strict respect du secret médical.

---

## Documentation du Projet

| Document | Description |
| :--- | :--- |
| [**Documentation Fonctionnelle**](./docs/DOCUMENTATION_FONCTIONNELLE.md) | Rôles acteurs (`MEDECIN`, `ADMIN/RH`, `PATIENT`), parcours utilisateurs, règles métiers (visites périodiques Standard/SMR, suivi diabète, documents PDF, confidentialité). |
| [**Documentation Technique & Architecture**](./docs/DOCUMENTATION_TECHNIQUE_ARCHITECTURE.md) | Architecture applicative et conteneurisée, schéma de base de données PostgreSQL/Prisma, sécurité JWT & SSO BCRG Hub, cartographie complète de l'API REST et du Frontend React PWA. |
| [**Guide de Déploiement**](./DEPLOYMENT.md) | Procédure de déploiement Docker Compose tout-en-un sur serveur AlmaLinux / On-Premise, configuration pare-feu, sauvegardes et restauration PostgreSQL. |

---

## Structure du Dépôt

```text
MedBCRG/
├── MedBCRG/                        # Application Frontend (React 19, TypeScript, Vite 8, Tailwind CSS 4, PWA)
├── projet-backend-med_bcrg/        # API Backend REST (Node.js 22, Express 4, Prisma 7, PostgreSQL, PDFKit)
├── docs/                           # Documentation fonctionnelle et technique/architecture
│   ├── DOCUMENTATION_FONCTIONNELLE.md
│   └── DOCUMENTATION_TECHNIQUE_ARCHITECTURE.md
├── docker-compose.yml              # Orchestration multi-conteneurs (PostgreSQL 16 + Backend + Frontend Nginx)
├── deploy.sh                       # Script d'installation et de déploiement automatisé
├── DEPLOYMENT.md                   # Guide d'exploitation et de déploiement serveur
└── .env.production.example         # Modèle des variables d'environnement de production
```

---

## Démarrage Rapide

### Option 1 : Déploiement Complet via Docker Compose (Recommandé)

Lance simultanément la base **PostgreSQL 16**, l'**API Backend** (avec migration et seed automatiques) et le **Frontend Nginx** :

```bash
docker compose up --build -d
```

- **Application Web (Frontend + Proxy API)** : `http://localhost:3003`
- **API Backend directe** : `http://localhost:5003`
- **Documentation interactive Swagger (OpenAPI)** : `http://localhost:5003/api/docs`
- **Healthcheck API** : `http://localhost:5003/api/health`

### Option 2 : Exécution en Mode Développement Local

1. **Démarrer le Backend (`projet-backend-med_bcrg`)** :
   ```bash
   cd projet-backend-med_bcrg
   npm install
   npx prisma db push
   npm run db:seed
   npm run dev
   ```

2. **Démarrer le Frontend (`MedBCRG`)** :
   ```bash
   cd MedBCRG
   npm install
   npm run dev
   ```
   L'interface de développement est accessible sur `http://localhost:5173`.

---

## Comptes Initiaux (Seed par défaut)

Lors de l'initialisation de la base de données (`AUTO_SEED=true` ou `npm run db:seed`), les comptes suivants sont créés avec le mot de passe initial temporaire **`ChangeMe@2026!`** :

| Rôle | Matricule | Identité | E-mail | Portail attribué |
| :--- | :--- | :--- | :--- | :--- |
| **Administrateur RH** | `2007` | Mamadou BANO BARRY | `mamadoub.barry@bcrg.guinee.org` | Portail RH & Admin (`/admin`) |
| **Médecin du Travail** | `2008` | Dr. Mamadou Dabo | `dabo@bcrg-guinee.org` | Portail Médecin (`/dashboard`) |
| **Responsable RH** | `2009` | Mohamed Senia Soumah | `mohameds.soumah@bcrg-guinee.org` | Portail RH & Admin (`/admin`) |

> **Note :** Tout nouveau collaborateur créé depuis le Portail RH ou le Portail Médecin reçoit également le mot de passe initial `ChangeMe@2026!` (modifiable dès la première connexion) et accède au **Portail Collaborateur / Patient** (`/patient`).

---

## Technologies Principales

- **Frontend** : React 19, TypeScript 6, Vite 8, Tailwind CSS 4, React Router 7, Lucide Icons, Vite PWA (Service Worker Workbox).
- **Backend** : Node.js 22, Express 4, TypeScript, Prisma ORM 7 (`@prisma/adapter-pg`), Zod, JSON Web Tokens (JWT + JWKS SSO BCRG Hub), PDFKit, Multer, Swagger UI.
- **Base de données & Infrastructure** : PostgreSQL 16 Alpine, Docker & Docker Compose, Nginx Alpine (Reverse Proxy + Compression Gzip + Cache statique).

