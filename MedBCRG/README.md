# MedBCRG — Application Frontend (React 19 / TypeScript / Vite PWA)

Interface web progressive (**PWA**) du système de gestion médicale **MedBCRG** de la Banque Centrale de la République de Guinée (BCRG).

Pour la documentation globale du projet, consultez :
- [**README Général du Projet**](../README.md)
- [**Documentation Fonctionnelle**](../docs/DOCUMENTATION_FONCTIONNELLE.md)
- [**Documentation Technique & Architecture**](../docs/DOCUMENTATION_TECHNIQUE_ARCHITECTURE.md)

---

## Prérequis & Commandes

- **Node.js** : `>= 20.x`

```bash
# Installation des dépendances
npm install

# Serveur de développement avec HMR (port 5173 par défaut)
npm run dev

# Vérification du typage TypeScript et compilation de production (génère dist/ + Service Worker PWA)
npm run build

# Analyse statique du code (Oxlint)
npm run lint

# Prévisualisation locale du build de production
npm run preview
```

---

## Architecture du Code (`src/`)

```text
src/
├── assets/                 # Logos officiels BCRG et illustrations médicales
├── components/
│   └── common/             # Composants transverses (Header, Sidebar, Badge, StatCard)
├── context/                # Contextes globaux React (AuthContext, NotificationContext)
├── hooks/                  # Hooks personnalisés (useAuth, useNotifications)
├── layout/                 # Squelette de mise en page responsive (MainLayout)
├── pages/
│   ├── Admin/              # Portail RH : Tableau de bord, Périodicité, Gestion des Comptes & Import CSV
│   ├── Auth/               # Authentification par Matricule/Mot de passe et SSO BCRG Hub
│   ├── Consultations/      # Gestion des consultations, constantes, glycémie, allergies et actes PDF
│   ├── Dashboard/          # Tableau de bord Médecin, KPIs cliniques et suivi diabète mensuel
│   ├── Patient/            # Portail Collaborateur : Espace santé, Prise de RDV, Documents médicaux
│   ├── Patients/           # Répertoire des dossiers médicaux complets (vue Médecin)
│   ├── Pharmacie/          # Suivi du stock de bandelettes glycémiques (GLUCOSE_STRIPS) et consommations
│   ├── RendezVous/         # Agenda médical (Jour / Semaine / Mois), validation et report de RDV
│   └── Settings/           # Profil utilisateur et changement de mot de passe
├── routes/                 # Routage protégé par rôle RBAC (AppRoutes.tsx)
├── services/               # Client HTTP centralisé, gestion automatique du Refresh Token et mapping API (api.ts)
├── types/                  # Interfaces et contrats TypeScript (index.ts)
└── utils/                  # Formatage de dates et constantes métier
```
