export const BCRG_DEPARTMENTS = [
  'Direction Générale',
  'Direction Informatique & Télécoms',
  'Caisse Générale & Opérations',
  'Ressources Humaines & Formation',
  'Contrôle de Gestion & Audit',
  'Sécurité & Surveillance',
  'Services Généraux & Logistique',
  'Études & Recherche Économique',
];

export const PATIENT_CATEGORIES_LABEL = {
  AGENT_BCRG: 'Agent BCRG',
  AYANT_DROIT: 'Ayant-Droit',
  RETRAITE: 'Retraité BCRG',
  STAGIAIRE: 'Stagiaire / Prestataire',
};

export const CONSULTATION_TYPES_LABEL: Record<string, string> = {
  GENERAL: 'Consultation Générale',
  INSTANT: 'Urgence Médicale',
  PERIODIC: 'Visite de Suivi / Contrôle',
};

export const APPOINTMENT_STATUS_COLOR = {
  PROGRAMME: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRME: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ANNULE: 'bg-rose-100 text-rose-800 border-rose-200',
  TERMINE: 'bg-blue-100 text-blue-800 border-blue-200',
};

/**
 * Détermine dynamiquement l'URL de redirection vers l'espace BCRG HUB (front) de l'utilisateur.
 * Cible par défaut le portail applicatif (port 3001 en prod / 5173 en dev) sur la route /dashboard.
 */
export const getBcrgHubUrl = (): string => {
  const envHubUrl = (import.meta.env.VITE_BCRG_HUB_URL || '').trim();

  if (envHubUrl) {
    // Si l'URL a été renseignée avec le port API backend (5001), basculer automatiquement sur le port portail web (3001)
    let url = envHubUrl.replace(':5001', ':3001');

    // Si configuré avec 'localhost' mais accédé depuis une IP distante (ex: 172.16.100.51), adapter l'hôte
    if (url.includes('localhost') && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      url = url.replace('localhost', window.location.hostname);
    }

    url = url.replace(/\/+$/, '');

    // Cibler le dashboard de l'espace utilisateur dans le Hub
    if (!url.endsWith('/dashboard') && !url.endsWith('/login') && !url.endsWith('/admin')) {
      url = `${url}/dashboard`;
    }
    return url;
  }

  // Détection dynamique selon l'hôte courant accédé par le navigateur
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5173/dashboard';
  }
  return `${protocol}//${hostname}:3001/dashboard`;
};

