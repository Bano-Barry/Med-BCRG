export const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';

import {
  Patient,
  Consultation,
  Medication,
  Appointment,
  DashboardStats,
  DoctorDashboardData,
  HrDashboardData,
  HrStatisticsData,
  HrDiabetesStatisticsData,
  MedicalDocument,
  PatientVitalsResponse,
  PatientMedicalRecord,
  VisitPeriodicitySettings,
  DueEmployeeItem,
  DueEmployeesSummary,
  AvailableDaysResponse,
  AvailableSlotsResponse
} from '../types';
import { getBcrgHubUrl } from '../utils/constants';

const INITIAL_MEDICATIONS: Medication[] = [];
const INITIAL_CONSULTATIONS: Consultation[] = [];
const INITIAL_APPOINTMENTS: Appointment[] = [];

// Helper global pour injecter le jeton JWT et intercepter les erreurs 401 (Session expirée)
export const fetchAuth = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const token = sessionStorage.getItem('bcrg_access_token');
  const headers = new Headers(init?.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ne pas définir Content-Type si c'est du FormData (le navigateur gère automatiquement le boundary)
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let target = input;
  if (typeof input === 'string' && input.startsWith('/')) {
    target = `${API_BASE_URL}${input}`;
  }

  const response = await fetch(target, {
    ...init,
    headers,
    credentials: 'omit', // Sur Render cross-origin sans cookies indispensables, 'omit' évite les conflits CORS
  });

  if (response.status === 401) {
    sessionStorage.removeItem('bcrg_access_token');
    sessionStorage.removeItem('bcrg_auth_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = getBcrgHubUrl();
    }
  }

  return response;
};

// Helper pour récupérer le blob d'un document pour prévisualisation in-app (sans ouvrir de nouvel onglet)
export const fetchDocumentBlob = async (url: string): Promise<{ success: boolean; blobUrl?: string; error?: string }> => {
  try {
    let targetUrl = url;
    if (url && url.startsWith('/')) {
      targetUrl = `${API_BASE_URL}${url}`;
    }

    let res = await fetchAuth(targetUrl);

    // Fallback patient si 403 (utilisateur non médecin)
    if (res.status === 403 && targetUrl.includes('/api/doctor/documents/')) {
      const fallbackUrl = targetUrl.replace('/api/doctor/documents/', '/api/patient/documents/');
      const retryRes = await fetchAuth(fallbackUrl);
      if (retryRes.ok) {
        res = retryRes;
      }
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.message || (res.status === 404 ? 'Le fichier physique associé est introuvable sur le serveur.' : `Erreur ${res.status}`);
      return { success: false, error: errMsg };
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    return { success: true, blobUrl };
  } catch (e: any) {
    console.error('Erreur fetchDocumentBlob:', e);
    return { success: false, error: e.message || 'Erreur réseau lors de la récupération du document' };
  }
};

// Helper pour visualiser un document PDF / image sécurisé dans un nouvel onglet sans blocage popup
export const viewDocumentBlob = async (url: string): Promise<boolean> => {
  let targetUrl = url;
  if (url && url.startsWith('/')) {
    targetUrl = `${API_BASE_URL}${url}`;
  }

  // Pré-ouvrir la fenêtre pour éviter que le bloqueur de popups du navigateur n'intercepte l'appel
  const newTab = window.open('about:blank', '_blank');
  if (newTab) {
    newTab.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Visualisation du Document — BCRG</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
            .card { background: white; padding: 32px 48px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); text-align: center; }
            .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #1b3b31; border-radius: 50%; margin: 0 auto 16px; animation: spin 0.8s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <div style="font-weight: 600; font-size: 16px;">Chargement du document PDF...</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 6px;">Vérification de l'autorisation</div>
          </div>
        </body>
      </html>
    `);
  }

  try {
    let res = await fetchAuth(targetUrl);

    // Fallback patient si 403 (utilisateur non médecin)
    if (res.status === 403 && targetUrl.includes('/api/doctor/documents/')) {
      const fallbackUrl = targetUrl.replace('/api/doctor/documents/', '/api/patient/documents/');
      const retryRes = await fetchAuth(fallbackUrl);
      if (retryRes.ok) {
        res = retryRes;
      }
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.message || `Le document n'est pas encore disponible sur le serveur (code ${res.status}).`;
      if (newTab && !newTab.closed) {
        newTab.document.body.innerHTML = `
          <div style="font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fff1f2;color:#9f1239;">
            <div style="background:white;padding:32px 40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.06);text-align:center;max-width:440px;">
              <h3 style="margin-top:0;font-size:18px;">Document indisponible</h3>
              <p style="font-size:14px;color:#64748b;line-height:1.5;">${errMsg}</p>
              <button onclick="window.close()" style="margin-top:12px;padding:8px 18px;background:#1b3b31;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:500;">Fermer</button>
            </div>
          </div>
        `;
      }
      return false;
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    if (newTab && !newTab.closed) {
      newTab.location.href = blobUrl;
    } else {
      window.open(blobUrl, '_blank');
    }
    return true;
  } catch (e: any) {
    console.error('Erreur viewDocumentBlob:', e);
    if (newTab && !newTab.closed) {
      newTab.close();
    }
    return false;
  }
};

// Helper pour télécharger un fichier sécurisé
export const downloadDocumentBlob = async (url: string, filename: string): Promise<boolean> => {
  try {
    let targetUrl = url;
    if (url && url.startsWith('/')) {
      targetUrl = `${API_BASE_URL}${url}`;
    }

    let res = await fetchAuth(targetUrl);

    // Fallback patient si 403
    if (res.status === 403 && targetUrl.includes('/api/doctor/documents/')) {
      const fallbackUrl = targetUrl.replace('/api/doctor/documents/', '/api/patient/documents/');
      const retryRes = await fetchAuth(fallbackUrl);
      if (retryRes.ok) {
        res = retryRes;
      }
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Impossible de télécharger le fichier (code ${res.status})`);
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    return true;
  } catch (e: any) {
    console.error('Erreur downloadDocumentBlob:', e);
    alert(e.message || 'Le document demandé est introuvable ou indisponible sur le serveur.');
    return false;
  }
};

// Helper functions pour localStorage (uniquement cache de secours hors-ligne)
const loadStorage = <T,>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    const parsed = JSON.parse(data);
    // Filtrer les anciens faux rendez-vous de démo éventuellement restés en cache
    if (key === 'bcrg_appointments_v4' && Array.isArray(parsed)) {
      return parsed.filter((a: any) => !['APT-1001', 'APT-1002', 'APT-1003'].includes(a?.id)) as unknown as T;
    }
    return parsed;
  } catch {
    return fallback;
  }
};

const saveStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Erreur sauvegarde localStorage', err);
  }
};

function normalizeBackendPatient(emp: any): Patient {
  return {
    ...emp,
    id: emp.id,
    matricule: emp.matricule || emp.registrationNumber || emp.user?.matricule || '',
    firstName: emp.firstName || emp.user?.firstName || '',
    lastName: emp.lastName || emp.user?.lastName || '',
    email: emp.email || emp.user?.email || '',
    category: emp.category || emp.user?.role || 'AGENT_BCRG',
    department: emp.department || emp.user?.department || emp.departement || emp.user?.departement || '',
    jobTitle: emp.jobTitle || emp.user?.jobTitle || emp.jobtitle || emp.user?.jobtitle || '',
    gender: emp.gender || emp.user?.gender || 'M',
    birthDate: emp.birthDate || '',
    phone: emp.phone || emp.user?.phone || '',
    bloodGroup: emp.bloodGroup,
    allergies: (emp.allergies || []).map((a: any) => typeof a === 'string' ? a : a.substance || a.allergyType || 'Allergie'),
    chronicConditions: emp.medicalHistory ? [emp.medicalHistory] : (emp.chronicConditions || []),
    createdAt: emp.createdAt || new Date().toISOString()
  };
}

function normalizeBackendAppointment(item: any): Appointment {
  const dateStr = item.appointmentDate
    ? (typeof item.appointmentDate === 'string'
        ? item.appointmentDate.split('T')[0]
        : new Date(item.appointmentDate).toISOString().split('T')[0])
    : '';
  const timeStr = item.scheduledTime || '09:00';
  const dateTime = dateStr ? `${dateStr}T${timeStr}` : (item.dateTime || new Date().toISOString());

  let status: Appointment['status'] = 'PROGRAMME';
  const s = String(item.status || '').toUpperCase();
  if (s === 'CONFIRMED' || s === 'CONFIRME') status = 'CONFIRME';
  else if (s === 'CANCELLED' || s === 'ANNULE') status = 'ANNULE';
  else if (s === 'COMPLETED' || s === 'TERMINE' || s === 'TERMINEE') status = 'TERMINE';
  else status = 'PROGRAMME';

  return {
    id: item.id,
    patientId: item.patientId || item.patient?.id || '',
    patientName: item.patientName || (item.patient?.user ? `${item.patient.user.firstName} ${item.patient.user.lastName}` : (item.patient?.firstName ? `${item.patient.firstName} ${item.patient.lastName}` : 'Patient BCRG')),
    patientMatricule: item.patientMatricule || item.patient?.registrationNumber || item.patient?.user?.matricule || '',
    doctorName: item.doctorName || (item.doctor ? `Dr. ${item.doctor.firstName} ${item.doctor.lastName}` : 'Médecin BCRG'),
    dateTime,
    appointmentDate: dateStr,
    scheduledTime: timeStr,
    durationMinutes: item.durationMinutes || 30,
    type: item.type || 'GENERAL',
    typeLabel: item.typeLabel || (item.type === 'PERIODIC' ? 'Visite périodique' : item.type === 'INSTANT' ? 'Consultation urgente' : 'Consultation générale'),
    reason: item.reason || 'Consultation médicale',
    doctorNotes: item.doctorNotes || null,
    cancellationReason: item.cancellationReason || null,
    status,
  };
}

function normalizeDueEmployee(emp: any): DueEmployeeItem {
  const rawStatus = String(emp.status || '').toUpperCase();
  let status: DueEmployeeItem['status'] = 'A_JOUR';
  if (rawStatus === 'OVERDUE' || rawStatus === 'EN_RETARD') {
    status = 'EN_RETARD';
  } else if (rawStatus === 'DUE_SOON' || rawStatus === 'BIENTOT_DUE') {
    status = 'BIENTOT_DUE';
  } else {
    status = 'A_JOUR';
  }

  return {
    id: emp.patientId || emp.id || emp.matricule,
    patientId: emp.patientId || emp.id,
    matricule: emp.matricule || '',
    fullName: emp.fullName || '',
    department: emp.department || '',
    jobTitle: emp.jobTitle || '',
    isSmr: Boolean(emp.isSmr),
    smrReason: emp.smrReason || null,
    frequencyMonths: emp.frequencyMonths,
    lastVisitDate: emp.lastVisitDate || null,
    lastVisitFormatted: emp.lastVisitFormatted,
    nextDueDate: emp.nextDueDate || null,
    nextDueDateFormatted: emp.nextDueDateFormatted,
    daysRemaining: emp.daysRemaining,
    status,
    statusLabel: emp.statusLabel
  };
}

export const apiService = {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. EMPLOYES & DOSSIERS PATIENTS (/api/employees)
  // ──────────────────────────────────────────────────────────────────────────
  getPatients: async (params?: { search?: string; department?: string; page?: number; limit?: number }): Promise<Patient[]> => {
    try {
      const buildUrl = (pageNum: number) => {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.append('search', params.search);
        if (params?.department && params.department !== 'ALL') searchParams.append('department', params.department);
        searchParams.append('page', String(pageNum));
        searchParams.append('limit', String(params?.limit || 10));
        const qs = searchParams.toString();
        return `${API_BASE_URL}/api/employees${qs ? `?${qs}` : ''}`;
      };

      const firstPage = params?.page || 1;
      const response = await fetchAuth(buildUrl(firstPage));
      const json = await response.json();

      if (response.ok && json.success) {
        let allRaw: any[] = Array.isArray(json.data) ? [...json.data] : [];
        const totalPages = json.pagination?.totalPages || 1;

        // Si aucune page spécifique n'a été demandée et que le backend pagine (max 10/page),
        // récupérer automatiquement les pages suivantes pour restituer la liste complète.
        if (!params?.page && totalPages > 1) {
          const pagePromises: Promise<any[]>[] = [];
          for (let p = 2; p <= totalPages; p++) {
            pagePromises.push(
              fetchAuth(buildUrl(p))
                .then(r => r.json())
                .then(j => (j?.success && Array.isArray(j.data) ? j.data : []))
                .catch(() => [])
            );
          }
          const remainingPages = await Promise.all(pagePromises);
          for (const pageItems of remainingPages) {
            allRaw = allRaw.concat(pageItems);
          }
        }

        return allRaw.map(normalizeBackendPatient);
      }
      return [];
    } catch (e) {
      console.error('Erreur getPatients:', e);
      return [];
    }
  },

  getPatientById: async (id: string): Promise<Patient | null> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/employees/${id}`);
      const json = await response.json();
      if (response.ok && json.success) {
        return normalizeBackendPatient(json.data);
      }
      return null;
    } catch (e) {
      console.error('Erreur getPatientById:', e);
      return null;
    }
  },

  searchPatients: async (query: string, limit: number = 10): Promise<Patient[]> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/doctor/patients/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      const json = await response.json();
      if (response.ok && json.success) {
        return (json.data || []).map(normalizeBackendPatient);
      }
      return [];
    } catch (e) {
      console.error('Erreur searchPatients:', e);
      return [];
    }
  },

  savePatient: async (patient: any): Promise<{ success: boolean; data?: Patient; error?: string }> => {
    try {
      const isUpdate = Boolean(patient.id);
      const url = isUpdate ? `${API_BASE_URL}/api/employees/${patient.id}` : `${API_BASE_URL}/api/employees`;
      const method = isUpdate ? 'PUT' : 'POST';

      const payload = isUpdate
        ? {
            phone: patient.phone || undefined,
            department: patient.department || undefined,
            jobTitle: patient.jobTitle || undefined,
            bloodGroup: patient.bloodGroup || undefined,
            medicalHistory: Array.isArray(patient.chronicConditions)
              ? patient.chronicConditions.join(', ')
              : patient.medicalHistory !== undefined ? patient.medicalHistory : undefined
          }
        : {
            matricule: String(patient.matricule || '').trim(),
            firstName: patient.firstName?.trim(),
            lastName: patient.lastName?.trim(),
            email: patient.email?.trim() || undefined,
            phone: patient.phone?.trim() || undefined,
            gender: patient.gender || 'M',
            department: patient.department?.trim(),
            jobTitle: patient.jobTitle?.trim(),
            bloodGroup: patient.bloodGroup || undefined,
            medicalHistory: Array.isArray(patient.chronicConditions)
              ? patient.chronicConditions.join(', ')
              : patient.medicalHistory || undefined
          };

      const response = await fetchAuth(url, {
        method,
        body: JSON.stringify(payload)
      });
      const json = await response.json();

      if (response.ok && json.success) {
        return { success: true, data: json.data };
      }
      const fieldError = Array.isArray(json.errors) && json.errors.length > 0 ? json.errors[0].message : null;
      return { success: false, error: fieldError || json.message || 'Erreur lors de la sauvegarde du patient' };
    } catch (e: any) {
      console.error('Erreur savePatient:', e);
      return { success: false, error: e.message || 'Erreur réseau' };
    }
  },

  getMyPatientProfile: async (): Promise<any | null> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/employees/me`);
      const json = await response.json();
      if (response.ok && json.success) {
        return json.data;
      }
      return null;
    } catch (e) {
      console.error('Erreur getMyPatientProfile:', e);
      return null;
    }
  },

  addPatientAllergy: async (
    patientId: string,
    allergy: {
      allergyType: 'DRUG' | 'FOOD' | 'OCCUPATIONAL' | 'OTHER';
      substance: string;
      reactionDetails?: string;
      severity?: 'MILD' | 'MODERATE' | 'SEVERE';
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/employees/${patientId}/allergies`, {
        method: 'POST',
        body: JSON.stringify({
          allergyType: allergy.allergyType,
          substance: allergy.substance.trim(),
          reactionDetails: allergy.reactionDetails?.trim() || '',
          severity: allergy.severity || 'MODERATE'
        })
      });
      const json = await response.json();
      if (response.ok && json.success) {
        return { success: true, data: json.data };
      }
      return { success: false, error: json.message || "Impossible d'enregistrer l'allergie" };
    } catch (e: any) {
      console.error('Erreur addPatientAllergy:', e);
      return { success: false, error: e.message || 'Erreur réseau' };
    }
  },

  deletePatientAllergy: async (patientId: string, allergyId: string): Promise<boolean> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/employees/${patientId}/allergies/${allergyId}`, {
        method: 'DELETE'
      });
      const json = await response.json();
      return Boolean(response.ok && json.success);
    } catch (e) {
      console.error('Erreur deletePatientAllergy:', e);
      return false;
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. CONSULTATIONS DU MEDECIN (/api/doctor/consultations)
  // ──────────────────────────────────────────────────────────────────────────
  getConsultationsStats: async (): Promise<{ consultationsThisMonth: number; recentEmergencies: number; waitingOrInProgressToday: number } | null> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/doctor/consultations/stats`);
      const json = await response.json();
      if (response.ok && json.success) {
        return json.data;
      }
      return null;
    } catch (e) {
      console.error('Erreur getConsultationsStats:', e);
      return null;
    }
  },

  getConsultations: async (params?: { search?: string; status?: string; type?: string; date?: string; page?: number; limit?: number }): Promise<Consultation[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append('search', params.search);
      if (params?.status && params.status !== 'ALL') {
        const mappedStatus =
          params.status === 'TERMINEE' ? 'COMPLETED' :
          params.status === 'EN_COURS' ? 'IN_PROGRESS' :
          params.status === 'EN_ATTENTE' ? 'WAITING' :
          params.status;
        searchParams.append('status', mappedStatus);
      }
      if (params?.type && params.type !== 'ALL') searchParams.append('type', params.type);
      if (params?.date) searchParams.append('date', params.date);
      if (params?.page) searchParams.append('page', String(params.page));
      searchParams.append('limit', String(params?.limit || 100));

      const qs = searchParams.toString();
      const url = `${API_BASE_URL}/api/doctor/consultations${qs ? `?${qs}` : ''}`;
      const response = await fetchAuth(url);
      const json = await response.json();

      if (response.ok && json.success) {
        return (json.data || []).map((c: any) => ({
          ...c,
          id: c.id,
          type: c.type || 'GENERAL',
          symptoms: c.reason || c.symptoms || '',
          notes: c.advice || c.notes || '',
          diagnosis: c.diagnosis || '',
          status: c.status === 'COMPLETED' ? 'TERMINEE' : c.status === 'WAITING' ? 'EN_ATTENTE' : 'EN_COURS',
          patientName: c.fullName || c.patientName || c.patient?.fullName || c.patient?.user?.fullName || (c.patient?.user?.firstName ? `${c.patient.user.firstName} ${c.patient.user.lastName}` : (c.patient?.firstName ? `${c.patient.firstName} ${c.patient.lastName}` : 'Patient')),
          patientMatricule: c.matricule || c.patientMatricule || c.patient?.matricule || c.patient?.registrationNumber || c.patient?.user?.matricule || '',
          patientId: c.patientId || c.patient?.id || '',
          doctorName: c.doctorName || c.doctor?.name || (c.doctor?.firstName ? `Dr. ${c.doctor.firstName} ${c.doctor.lastName}` : 'Dr. BCRG'),
          doctorId: c.doctorId || c.doctor?.id || '',
          date: c.consultationDate || c.createdAt || c.date || new Date().toISOString(),
          vitals: c.vitalSigns || c.vitals ? {
            tension: c.vitalSigns?.bloodPressure || c.vitals?.tension || '',
            temperature: c.vitalSigns?.temperatureC ?? c.vitals?.temperature,
            height: c.vitalSigns?.heightCm ?? c.vitals?.height,
            weight: c.vitalSigns?.weightKg ?? c.vitals?.weight,
            bloodGroup: c.vitalSigns?.bloodGroup ?? c.vitals?.bloodGroup
          } : { tension: '' },
          glycemia: c.glycemiaCheck ? {
            performed: c.glycemiaCheck.performed,
            value: c.glycemiaCheck.value !== null && c.glycemiaCheck.value !== undefined ? Number(c.glycemiaCheck.value) : undefined,
            unit: c.glycemiaCheck.unit || 'g/L',
            measuredAt: c.glycemiaCheck.measuredAt
          } : (c.glycemia ? {
            performed: c.glycemia.performed,
            value: c.glycemia.value !== null && c.glycemia.value !== undefined ? Number(c.glycemia.value) : undefined,
            unit: c.glycemia.unit || 'g/L'
          } : undefined),
          prescriptions: (c.prescriptions || []).map((p: any) => ({
            medicationId: p.id || p.medicationId,
            medicationName: p.medicationName,
            dosage: p.dosage,
            duration: p.duration,
            quantity: p.quantity || 1
          }))
        }));
      }
      return INITIAL_CONSULTATIONS;
    } catch (e) {
      console.error('Erreur getConsultations:', e);
      return INITIAL_CONSULTATIONS;
    }
  },

  getConsultationById: async (id: string): Promise<Consultation | null> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/doctor/consultations/${id}`);
      const json = await response.json();
      if (response.ok && json.success) {
        const c = json.data;
        const latestVital = Array.isArray(c.vitalSigns) ? c.vitalSigns[0] : (c.latestVitalsSummary || c.vitalSigns);
        return {
          ...c,
          id: c.id,
          type: c.type || 'GENERAL',
          symptoms: c.reason || c.symptoms || '',
          notes: c.advice || c.notes || '',
          status: c.status === 'COMPLETED' ? 'TERMINEE' : c.status === 'WAITING' ? 'EN_ATTENTE' : 'EN_COURS',
          patientName: c.patient?.user ? `${c.patient.user.firstName} ${c.patient.user.lastName}` : (c.patient?.fullName || 'Patient'),
          patientMatricule: c.patient?.registrationNumber || c.patient?.user?.matricule || '',
          patientId: c.patientId || c.patient?.id || '',
          doctorName: c.doctor?.name || (c.doctor?.firstName ? `Dr. ${c.doctor.firstName} ${c.doctor.lastName}` : 'Dr. BCRG'),
          date: c.consultationDate || c.createdAt,
          vitals: latestVital ? {
            tension: latestVital.bloodPressure || '',
            temperature: latestVital.temperatureC,
            height: latestVital.heightCm,
            weight: latestVital.weightKg,
            bloodGroup: latestVital.bloodGroup || c.patient?.bloodGroup
          } : { tension: '' },
          glycemia: c.glycemiaCheck ? {
            performed: c.glycemiaCheck.performed,
            value: c.glycemiaCheck.value !== null && c.glycemiaCheck.value !== undefined ? Number(c.glycemiaCheck.value) : undefined,
            unit: c.glycemiaCheck.unit || 'g/L',
            measuredAt: c.glycemiaCheck.measuredAt
          } : (c.glycemia ? {
            performed: c.glycemia.performed,
            value: c.glycemia.value !== null && c.glycemia.value !== undefined ? Number(c.glycemia.value) : undefined,
            unit: c.glycemia.unit || 'g/L'
          } : undefined),
          prescriptions: (c.prescriptions || []).map((p: any) => ({
            medicationId: p.id,
            medicationName: p.medicationName,
            dosage: p.dosage,
            duration: p.duration,
            quantity: 1
          }))
        };
      }
      return null;
    } catch (e) {
      console.error('Erreur getConsultationById:', e);
      return null;
    }
  },

  addConsultation: async (consultation: Omit<Consultation, 'id' | 'date'>): Promise<Consultation | null> => {
    try {
      const payload: any = {
        patientId: consultation.patientId,
        type: consultation.type || 'GENERAL',
        reason: consultation.symptoms || 'Consultation médicale',
        diagnosis: consultation.diagnosis || undefined,
        advice: consultation.notes || undefined,
      };

      if (consultation.vitals) {
        payload.vitals = {
          bloodPressure: consultation.vitals.tension || undefined,
          temperatureC: consultation.vitals.temperature ? Number(consultation.vitals.temperature) : undefined,
          heightCm: consultation.vitals.height ? Number(consultation.vitals.height) : undefined,
          weightKg: consultation.vitals.weight ? Number(consultation.vitals.weight) : undefined,
          bloodGroup: consultation.vitals.bloodGroup || undefined
        };
      }

      if (consultation.glycemia && consultation.glycemia.performed) {
        payload.glycemia = {
          performed: true,
          value: consultation.glycemia.value !== undefined ? Number(consultation.glycemia.value) : undefined,
          unit: consultation.glycemia.unit ? consultation.glycemia.unit.trim() : 'g/L'
        };
      }

      const response = await fetchAuth(`${API_BASE_URL}/api/doctor/consultations`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const json = await response.json();

      if (response.ok && json.success) {
        return {
          ...json.data,
          id: json.data.id,
          symptoms: json.data.reason || consultation.symptoms,
          vitals: consultation.vitals,
          glycemia: json.data.glycemiaCheck ? {
            performed: json.data.glycemiaCheck.performed,
            value: json.data.glycemiaCheck.value !== null && json.data.glycemiaCheck.value !== undefined ? Number(json.data.glycemiaCheck.value) : undefined,
            unit: json.data.glycemiaCheck.unit || 'g/L'
          } : consultation.glycemia,
          patientName: consultation.patientName,
          patientMatricule: consultation.patientMatricule,
          doctorName: consultation.doctorName,
          date: json.data.consultationDate || new Date().toISOString(),
          prescriptions: [],
          status: 'EN_COURS'
        } as Consultation;
      }
      console.error('Consultation API error:', json);
      return null;
    } catch (e) {
      console.error('Erreur addConsultation:', e);
      return null;
    }
  },

  updateConsultation: async (id: string, updates: Partial<Consultation>): Promise<Consultation | null> => {
    try {
      const payload: any = {};
      if (updates.diagnosis !== undefined) payload.diagnosis = updates.diagnosis;
      if (updates.notes !== undefined) payload.advice = updates.notes;
      if (updates.symptoms !== undefined) payload.reason = updates.symptoms;
      if (updates.status === 'TERMINEE') payload.status = 'COMPLETED';
      else if (updates.status === 'EN_ATTENTE') payload.status = 'WAITING';
      else if (updates.status === 'EN_COURS') payload.status = 'IN_PROGRESS';

      if (updates.vitals) {
        payload.vitals = {
          bloodPressure: updates.vitals.tension || undefined,
          temperatureC: updates.vitals.temperature ? Number(updates.vitals.temperature) : undefined,
          heightCm: updates.vitals.height ? Number(updates.vitals.height) : undefined,
          weightKg: updates.vitals.weight ? Number(updates.vitals.weight) : undefined,
          bloodGroup: updates.vitals.bloodGroup || undefined
        };
      }

      const response = await fetchAuth(`${API_BASE_URL}/api/doctor/consultations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      const json = await response.json();

      if (response.ok && json.success) {
        return {
          ...json.data,
          notes: json.data.advice || updates.notes,
          diagnosis: json.data.diagnosis || updates.diagnosis,
          status: updates.status || (json.data.status === 'COMPLETED' ? 'TERMINEE' : 'EN_COURS'),
          prescriptions: updates.prescriptions || json.data.prescriptions || []
        } as Consultation;
      }
      console.error('Update Consultation API error:', json);
      return null;
    } catch (e) {
      console.error('Erreur updateConsultation:', e);
      return null;
    }
  },

  // Prescriptions ordonnance du médecin
  addPrescription: async (
    consultationId: string,
    prescription: {
      medicationName: string;
      dosage: string;
      frequency?: string;
      duration: string;
      instructions?: string;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/doctor/consultations/${consultationId}/prescriptions`, {
        method: 'POST',
        body: JSON.stringify({
          medicationName: prescription.medicationName.trim(),
          dosage: prescription.dosage.trim(),
          frequency: prescription.frequency?.trim() || '',
          duration: prescription.duration.trim(),
          instructions: prescription.instructions?.trim() || ''
        })
      });
      const json = await response.json();
      if (response.ok && json.success) {
        return { success: true, data: json.data };
      }
      return { success: false, error: json.message || 'Impossible d\'ajouter la prescription' };
    } catch (e: any) {
      console.error('Erreur addPrescription:', e);
      return { success: false, error: e.message || 'Erreur réseau' };
    }
  },

  deletePrescription: async (consultationId: string, prescriptionId: string): Promise<boolean> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/doctor/consultations/${consultationId}/prescriptions/${prescriptionId}`, {
        method: 'DELETE'
      });
      const json = await response.json();
      return Boolean(response.ok && json.success);
    } catch (e) {
      console.error('Erreur deletePrescription:', e);
      return false;
    }
  },

  generatePrescriptionPdf: async (consultationId: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/doctor/consultations/${consultationId}/prescription/generate`, {
        method: 'POST'
      });
      const json = await response.json();
      if (response.ok && json.success) {
        return { success: true, data: json.data };
      }
      return { success: false, error: json.message || 'Erreur lors de la génération de l\'ordonnance PDF' };
    } catch (e: any) {
      console.error('Erreur generatePrescriptionPdf:', e);
      return { success: false, error: e.message || 'Erreur réseau' };
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. TABLEAU DE BORD MEDECIN (/api/doctor/dashboard & stats)
  // ──────────────────────────────────────────────────────────────────────────
  getDoctorDashboard: async (): Promise<DoctorDashboardData | null> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/doctor/dashboard`);
      const json = await response.json();
      if (response.ok && json.success) {
        return json.data as DoctorDashboardData;
      }
      return null;
    } catch (e) {
      console.error('Erreur getDoctorDashboard:', e);
      return null;
    }
  },

  getPatientDocuments: async (patientId: string): Promise<MedicalDocument[]> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/doctor/patients/${patientId}/documents`);
      const json = await response.json();
      if (response.ok && json.success) {
        return (json.data || []).map((d: any) => ({
          id: d.id,
          title: d.documentName || d.title,
          documentType: d.documentType,
          mimeType: d.mimeType,
          fileSizeBytes: d.fileSizeBytes,
          createdAt: d.createdAt,
          isDoctorGenerated: d.isDoctorGenerated,
          downloadUrl: `${API_BASE_URL}/api/doctor/documents/${d.id}/download`,
          viewUrl: `${API_BASE_URL}/api/doctor/documents/${d.id}/view`
        }));
      }
      return [];
    } catch (e) {
      console.error('Erreur getPatientDocuments:', e);
      return [];
    }
  },

  getPatientMedicalRecord: async (patientId: string): Promise<PatientMedicalRecord | null> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/doctor/patients/${patientId}/medical-record`);
      const json = await response.json();
      if (response.ok && json.success) {
        const data = json.data;
        return {
          ...data,
          vitalSigns: data.vitalSigns || data.vitalSignsHistory || [],
          glycemiaChecks: data.glycemiaChecks || data.glycemiaHistory || []
        } as PatientMedicalRecord;
      }
      return null;
    } catch (e) {
      console.error('Erreur getPatientMedicalRecord:', e);
      return null;
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. ESPACE COLLABORATEUR / PATIENT (/api/patient)
  // ──────────────────────────────────────────────────────────────────────────
  getMyVitals: async (): Promise<PatientVitalsResponse | null> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/patient/vitals`);
      const json = await response.json();
      if (response.ok && json.success) {
        return json.data as PatientVitalsResponse;
      }
      return null;
    } catch (e) {
      console.error('Erreur getMyVitals:', e);
      return null;
    }
  },

  getMyDocuments: async (): Promise<MedicalDocument[]> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/patient/documents`);
      const json = await response.json();
      if (response.ok && json.success) {
        return (json.data || []).map((d: any) => ({
          id: d.id,
          title: d.title || d.documentName,
          documentType: d.documentType,
          mimeType: d.mimeType,
          fileSizeBytes: d.fileSizeBytes,
          createdAt: d.createdAt,
          isDoctorGenerated: d.isDoctorGenerated,
          downloadUrl: `${API_BASE_URL}/api/patient/documents/${d.id}/download`,
          viewUrl: `${API_BASE_URL}/api/patient/documents/${d.id}/view`
        }));
      }
      return [];
    } catch (e) {
      console.error('Erreur getMyDocuments:', e);
      return [];
    }
  },

  uploadMyDocument: async (
    documentType: string,
    file: File
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('file', file);

      const response = await fetchAuth(`${API_BASE_URL}/api/patient/documents/upload`, {
        method: 'POST',
        body: formData
      });
      const json = await response.json();

      if (response.ok && json.success) {
        return { success: true, data: json.data };
      }
      return { success: false, error: json.message || 'Échec du téléversement du document' };
    } catch (e: any) {
      console.error('Erreur uploadMyDocument:', e);
      return { success: false, error: e.message || 'Erreur réseau' };
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. ESPACE ADMINISTRATION RH & REPORTING (/api/hr)
  // ──────────────────────────────────────────────────────────────────────────
  getHrDashboard: async (): Promise<HrDashboardData | null> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/hr/dashboard`);
      const json = await response.json();
      if (response.ok && json.success) {
        return json.data as HrDashboardData;
      }
      return null;
    } catch (e) {
      console.error('Erreur getHrDashboard:', e);
      return null;
    }
  },

  getHrStatistics: async (startDate?: string, endDate?: string): Promise<HrStatisticsData | null> => {
    try {
      const searchParams = new URLSearchParams();
      if (startDate) searchParams.append('startDate', startDate);
      if (endDate) searchParams.append('endDate', endDate);

      const qs = searchParams.toString();
      const url = `${API_BASE_URL}/api/hr/statistics${qs ? `?${qs}` : ''}`;
      const response = await fetchAuth(url);
      const json = await response.json();

      if (response.ok && json.success) {
        return json.data as HrStatisticsData;
      }
      return null;
    } catch (e) {
      console.error('Erreur getHrStatistics:', e);
      return null;
    }
  },

  getHrDiabetesStatistics: async (): Promise<HrDiabetesStatisticsData | null> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/hr/statistics/diabetes`);
      const json = await response.json();
      if (response.ok && json.success) {
        return json.data as HrDiabetesStatisticsData;
      }
      return null;
    } catch (e) {
      console.error('Erreur getHrDiabetesStatistics:', e);
      return null;
    }
  },

  exportHrReportPdf: async (): Promise<void> => {
    await downloadDocumentBlob(`${API_BASE_URL}/api/hr/reports/export`, `Rapport_Synthese_RH_BCRG_${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. AUTHENTIFICATION AVANCEE (Mot de passe initial, SSO, Logout)
  // ──────────────────────────────────────────────────────────────────────────
  changeInitialPassword: async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetchAuth(`${API_BASE_URL}/api/auth/change-initial-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const json = await response.json();
      if (response.ok && json.success) {
        return { success: true };
      }
      const fieldError = Array.isArray(json.errors) && json.errors.length > 0 ? json.errors[0].message : null;
      return { success: false, error: fieldError || json.message || 'Échec de la modification du mot de passe' };
    } catch (e: any) {
      console.error('Erreur changeInitialPassword:', e);
      return { success: false, error: e.message || 'Erreur réseau' };
    }
  },

  loginWithSso: async (ssoToken: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sso-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sso_token: ssoToken.trim() }),
      });
      const json = await response.json();
      if (response.ok && json.success) {
        return { success: true, data: json.data };
      }
      return { success: false, error: json.message || 'Échec de la validation SSO' };
    } catch (e: any) {
      console.error('Erreur loginWithSso:', e);
      return { success: false, error: e.message || 'Erreur réseau lors de la validation SSO' };
    }
  },

  logoutServer: async (): Promise<void> => {
    try {
      await fetchAuth(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
    } catch {
      // Ignore network errors during logout
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 8. AGENDA & RENDEZ-VOUS MEDECIN (/api/doctor/agenda)
  // ──────────────────────────────────────────────────────────────────────────
  getDoctorAgenda: async (startDate?: string, endDate?: string): Promise<Appointment[]> => {
    try {
      const now = new Date();
      const defaultStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0];

      const queryParams = new URLSearchParams();
      queryParams.set('startDate', startDate || defaultStart);
      queryParams.set('endDate', endDate || defaultEnd);

      const res = await fetchAuth(`${API_BASE_URL}/api/doctor/agenda?${queryParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const rawItems: any[] = Array.isArray(json.data) ? json.data : (json.data?.appointments || []);
        const list = rawItems.map(normalizeBackendAppointment);
        saveStorage('bcrg_appointments_v4', list);
        return list;
      }
    } catch (e) {
      console.warn('Erreur getDoctorAgenda:', e);
    }
    return [];
  },

  getDayAgenda: async (date: string): Promise<Appointment[]> => {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/api/doctor/agenda/day/${date}`);
      if (res.ok) {
        const json = await res.json();
        const rawItems = json.data?.appointments || [];
        return rawItems.map(normalizeBackendAppointment);
      }
    } catch (e) {
      console.warn('Erreur getDayAgenda:', e);
    }
    return [];
  },

  approveDoctorAppointment: async (id: string, doctorNotes?: string): Promise<boolean> => {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/api/doctor/agenda/appointments/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ doctorNotes: doctorNotes || 'Validé par le médecin' })
      });
      if (res.ok) return true;
    } catch (e) {
      console.error('Erreur approveDoctorAppointment:', e);
    }
    return false;
  },

  rescheduleDoctorAppointment: async (id: string, newDate: string, newTime: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/api/doctor/agenda/appointments/${id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({ newDate, newTime, reason })
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        return { success: true };
      }
      return { success: false, error: json?.message || 'Impossible de reprogrammer ce rendez-vous' };
    } catch (e: any) {
      console.error('Erreur rescheduleDoctorAppointment:', e);
      return { success: false, error: e.message || 'Erreur réseau' };
    }
  },

  cancelDoctorAppointment: async (id: string, reason: string): Promise<boolean> => {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/api/doctor/agenda/appointments/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: reason && reason.length >= 3 ? reason : 'Annulé par le praticien' })
      });
      if (res.ok) return true;
    } catch (e) {
      console.error('Erreur cancelDoctorAppointment:', e);
    }
    return false;
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 9. RENDEZ-VOUS PATIENT (/api/patient/appointments)
  // ──────────────────────────────────────────────────────────────────────────
  getMyPatientAppointments: async (): Promise<Appointment[]> => {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/api/patient/appointments/my`);
      if (res.ok) {
        const json = await res.json();
        const rawItems = Array.isArray(json.data) ? json.data : [];
        return rawItems.map(normalizeBackendAppointment);
      }
    } catch (e) {
      console.warn('Erreur getMyPatientAppointments:', e);
    }
    return [];
  },

  getAvailableAppointmentDays: async (month: string): Promise<AvailableDaysResponse | null> => {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/api/patient/appointments/available-days?month=${encodeURIComponent(month)}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch (e) {
      console.warn('Erreur getAvailableAppointmentDays:', e);
    }
    return null;
  },

  getAvailableAppointmentSlots: async (date: string): Promise<AvailableSlotsResponse | null> => {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/api/patient/appointments/available-slots?date=${date}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch (e) {
      console.warn('Erreur getAvailableAppointmentSlots:', e);
    }
    return null;
  },

  bookPatientAppointment: async (data: {
    appointmentDate: string;
    scheduledTime: string;
    type?: string;
    reason?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      let mappedType = 'GENERAL';
      const t = (data.type || '').toUpperCase();
      if (t.includes('PERIODIC') || t.includes('ANNUEL') || t.includes('SYSTEMATIQUE') || t.includes('EMBAUCHE')) mappedType = 'PERIODIC';
      else if (t.includes('URGENT') || t.includes('INSTANT')) mappedType = 'INSTANT';

      const res = await fetchAuth(`${API_BASE_URL}/api/patient/appointments`, {
        method: 'POST',
        body: JSON.stringify({
          appointmentDate: data.appointmentDate,
          scheduledTime: data.scheduledTime,
          type: mappedType,
          reason: data.reason || 'Consultation médicale'
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, data: json.data };
      }
      const fieldError = Array.isArray(json.errors) && json.errors.length > 0 ? json.errors[0].message : null;
      return { success: false, error: fieldError || json.message || 'Impossible de réserver le créneau' };
    } catch (e: any) {
      console.error('Erreur bookPatientAppointment:', e);
      return { success: false, error: e.message || 'Erreur réseau lors de la réservation' };
    }
  },

  cancelPatientAppointment: async (id: string, cancellationReason?: string): Promise<boolean> => {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/api/patient/appointments/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: cancellationReason || 'Annulation demandée par le patient' })
      });
      if (res.ok) return true;
    } catch (e) {
      console.error('Erreur cancelPatientAppointment:', e);
    }
    return false;
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 10. CLÔTURE DE CONSULTATION (/api/doctor/consultations/:id/complete)
  // ──────────────────────────────────────────────────────────────────────────
  completeConsultation: async (id: string, data?: {
    diagnosis?: string;
    advice?: string;
    physicalExamination?: string;
    vitals?: any;
    glycemia?: any;
  }): Promise<Consultation | null> => {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/api/doctor/consultations/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(data || {})
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return {
            ...json.data,
            id: json.data.id || id,
            notes: json.data.advice ?? data?.advice ?? '',
            diagnosis: json.data.diagnosis ?? data?.diagnosis ?? '',
            status: 'TERMINEE'
          } as Consultation;
        }
      }
    } catch (e) {
      console.warn('Fallback vers updateConsultation:', e);
    }
    return apiService.updateConsultation(id, {
      diagnosis: data?.diagnosis,
      notes: data?.advice,
      status: 'TERMINEE'
    });
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 11. PÉRIODICITÉ DES VISITES RH (/api/hr/periodicity)
  // ──────────────────────────────────────────────────────────────────────────
  getHrPeriodicitySettings: async (): Promise<VisitPeriodicitySettings | null> => {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/api/hr/periodicity/settings`);
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch (e) {
      console.warn('Erreur getHrPeriodicitySettings:', e);
    }
    return null;
  },

  updateHrPeriodicitySettings: async (data: {
    standardFrequencyMonths: number;
    smrFrequencyMonths: number;
    reminderLeadDays: number;
  }): Promise<boolean> => {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/api/hr/periodicity/settings`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      const json = await res.json();
      return !!(res.ok && json.success);
    } catch (e) {
      console.error('Erreur updateHrPeriodicitySettings:', e);
      return false;
    }
  },

  getHrDueEmployeesSummary: async (): Promise<DueEmployeesSummary | null> => {
    try {
      const res = await fetchAuth(`${API_BASE_URL}/api/hr/periodicity/due-employees`);
      if (res.ok) {
        const json = await res.json();
        const payload = json.data;
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          const rawEmployees = Array.isArray(payload.employees) ? payload.employees : [];
          return {
            totalEmployees: payload.totalEmployees ?? rawEmployees.length,
            upToDateCount: payload.upToDateCount ?? 0,
            dueSoonCount: payload.dueSoonCount ?? 0,
            overdueCount: payload.overdueCount ?? 0,
            smrCount: payload.smrCount ?? 0,
            coverageRatePercent: payload.coverageRatePercent ?? 100,
            employees: rawEmployees.map(normalizeDueEmployee)
          };
        }
        if (Array.isArray(payload)) {
          const employees = payload.map(normalizeDueEmployee);
          const upToDateCount = employees.filter(e => e.status === 'A_JOUR').length;
          const dueSoonCount = employees.filter(e => e.status === 'BIENTOT_DUE').length;
          const overdueCount = employees.filter(e => e.status === 'EN_RETARD').length;
          const totalEmployees = employees.length;
          return {
            totalEmployees,
            upToDateCount,
            dueSoonCount,
            overdueCount,
            smrCount: employees.filter(e => e.isSmr).length,
            coverageRatePercent: totalEmployees > 0 ? Math.round((upToDateCount / totalEmployees) * 100) : 100,
            employees
          };
        }
      }
    } catch (e) {
      console.warn('Erreur getHrDueEmployeesSummary:', e);
    }
    return null;
  },

  getHrDueEmployees: async (): Promise<DueEmployeeItem[]> => {
    const summary = await apiService.getHrDueEmployeesSummary();
    return summary ? summary.employees : [];
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. COMPATIBILITE LEGACY : Pharmacie, Rendez-vous & Stats génériques
  // ──────────────────────────────────────────────────────────────────────────
  getMedications: (): Medication[] => loadStorage('bcrg_medications_v2', INITIAL_MEDICATIONS),
  saveMedication: (med: Omit<Medication, 'id'> & { id?: string }): Medication => {
    const list = apiService.getMedications();
    if (med.id) {
      const idx = list.findIndex((m) => m.id === med.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...med };
        saveStorage('bcrg_medications_v2', list);
        return list[idx];
      }
    }
    const newMed: Medication = {
      ...med,
      id: `MED-${Date.now().toString().slice(-4)}`,
    };
    list.push(newMed);
    saveStorage('bcrg_medications_v2', list);
    return newMed;
  },

  getAppointments: (): Appointment[] => loadStorage('bcrg_appointments_v4', INITIAL_APPOINTMENTS),
  addAppointment: (apt: Omit<Appointment, 'id'>): Appointment => {
    const list = apiService.getAppointments();
    const newApt: Appointment = {
      ...apt,
      id: `APT-${Date.now().toString().slice(-4)}`,
    };
    list.unshift(newApt);
    saveStorage('bcrg_appointments_v4', list);
    return newApt;
  },
  updateAppointment: (id: string, updates: Partial<Appointment>): Appointment | null => {
    const list = apiService.getAppointments();
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      saveStorage('bcrg_appointments_v4', list);
      return list[idx];
    }
    return null;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    let consultationsToday = 0;
    let activePatients = 0;
    let lowStockAlerts = 0;
    let pendingAppointments = 0;

    try {
      const doctorData = await apiService.getDoctorDashboard();
      if (doctorData) {
        consultationsToday = doctorData.kpis.consultationsToday;
        activePatients = doctorData.kpis.usersCount || doctorData.kpis.patientsExaminedCount;
        lowStockAlerts = doctorData.alerts?.pendingCount ?? (doctorData.diabetesKpis?.remainingStrips <= 20 ? 1 : 0);
      } else {
        const patients = await apiService.getPatients();
        activePatients = patients.length;
        const statsData = await apiService.getConsultationsStats();
        if (statsData) {
          consultationsToday = statsData.waitingOrInProgressToday || 0;
        }
      }
    } catch (e) {
      console.warn('Fallback local stats:', e);
    }

    return {
      consultationsToday,
      activePatients,
      lowStockAlerts,
      pendingAppointments,
    };
  }
};
