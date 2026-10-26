export type UserRole = 'MEDECIN' | 'ADMIN' | 'PATIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  title: string;
  matricule?: string;
  phone?: string;
  jobTitle?: string;
}

export type PatientCategory = 'AGENT_BCRG' | 'AYANT_DROIT' | 'RETRAITE' | 'STAGIAIRE';

export interface Patient {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  birthDate: string;
  phone: string;
  email?: string;
  category: PatientCategory;
  department?: string; // ex: Direction Informatique, Caisse Générale
  jobTitle?: string;
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  createdAt: string;
}

export interface VitalSigns {
  tension?: string; // ex: "120/80"
  pulse?: number; // bpm
  temperature?: number; // °C
  weight?: number; // kg
  height?: number; // cm
  spo2?: number; // %
}

export interface PrescriptionItem {
  medicationId: string;
  medicationName: string;
  dosage: string;
  duration: string;
  quantity: number;
}

export interface GlycemiaCheck {
  performed: boolean;
  value?: number;
  unit?: string;
  measuredAt?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  patientMatricule: string;
  doctorId: string;
  doctorName: string;
  date: string;
  type: 'GENERAL' | 'INSTANT' | 'PERIODIC';
  symptoms: string;
  diagnosis: string;
  vitals: VitalSigns;
  glycemia?: GlycemiaCheck;
  prescriptions: PrescriptionItem[];
  notes?: string;
  status: 'TERMINEE' | 'EN_COURS' | 'EN_ATTENTE';
}

export interface Medication {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  stockQuantity: number;
  minQuantityThreshold: number;
  expiryDate: string;
  location?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientMatricule: string;
  doctorName: string;
  dateTime: string;
  appointmentDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  type?: string;
  typeLabel?: string;
  reason: string;
  doctorNotes?: string | null;
  cancellationReason?: string | null;
  status: 'PROGRAMME' | 'CONFIRME' | 'ANNULE' | 'TERMINE' | 'SCHEDULED' | 'RESCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
}

export interface VisitPeriodicitySettings {
  id?: string;
  standardFrequencyMonths: number;
  smrFrequencyMonths: number;
  reminderLeadDays: number;
  updatedAt?: string;
}

export interface DueEmployeeItem {
  id: string;
  matricule: string;
  fullName: string;
  department?: string;
  lastVisitDate?: string;
  nextDueDate?: string;
  status: 'A_JOUR' | 'BIENTOT_DUE' | 'EN_RETARD';
}

export interface AvailableSlotsResponse {
  date: string;
  formattedDate: string;
  isWorkingDay: boolean;
  totalSlots: number;
  availableSlots: string[];
  occupiedSlots: string[];
}


export interface DashboardStats {
  consultationsToday: number;
  activePatients: number;
  lowStockAlerts: number;
  pendingAppointments: number;
}

export interface MedicalDocument {
  id: string;
  title: string;
  documentType: string;
  mimeType?: string;
  fileSizeBytes?: number;
  createdAt: string;
  isDoctorGenerated?: boolean;
  downloadUrl?: string;
  viewUrl?: string;
}

export interface DoctorDashboardData {
  kpis: {
    consultationsToday: number;
    activeConsultations: number;
    departmentsCount: number;
    patientsExaminedCount: number;
    usersCount: number;
  };
  diabetesKpis: {
    diabeticPatients: number;
    glycemiaChecks: number;
    stripConsumption: number;
    remainingStrips: number;
  };
  diabeticMonthlyPassages: Array<{
    patientId: string;
    patientName: string;
    registrationNumber: string;
    department?: string | null;
    monthlyVisits: number;
    lastCheckDate?: string | null;
    lastGlycemiaValue?: number | null;
    lastGlycemiaUnit?: string | null;
  }>;
  weeklyActivity: Array<{
    day: string;
    date: string;
    count: number;
  }>;
  alerts: {
    pendingCount: number;
    items: Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
      description: string;
      actionLabel?: string;
      actionUrl?: string;
    }>;
  };
  recentConsultations: Array<{
    id: string;
    patientName: string;
    patientMatricule: string;
    consultationDate: string;
    formattedDate: string;
    type: string;
    typeLabel: string;
    status: string;
    statusLabel: string;
  }>;
  quickActions: Array<{
    key: string;
    label: string;
    subtitle: string;
    route: string;
  }>;
}

export interface HrDashboardData {
  totalEmployees: number;
  activeEmployees: number;
  departmentsCount: number;
  totalConsultationsThisMonth: number;
  totalSickLeaveDaysThisMonth: number;
  employeesOnSickLeaveCurrent: number;
}

export interface HrDepartmentStatisticsItem {
  department: string;
  employeeCount: number;
  consultationCount: number;
  sickLeaveDays: number;
}

export interface HrStatisticsData {
  period: {
    start: string;
    end: string;
  };
  totalConsultations: number;
  totalSickLeaves: number;
  totalSickLeaveDays: number;
  byDepartment: HrDepartmentStatisticsItem[];
}

export interface HrDiabetesStatisticsData {
  diabeticPatients: number;
  glycemiaChecks: number;
  stripConsumption: number;
  remainingStrips: number;
}

export interface PatientVitalSignItem {
  id: string;
  consultationId?: string | null;
  measuredAt: string;
  bloodPressure?: string | null;
  temperatureC?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  bmi?: number | null;
  bmiLabel?: string | null;
  bloodGroup?: string | null;
}

export interface PatientVitalsResponse {
  summary: {
    bloodPressure?: string;
    temperatureC?: number;
    weightKg?: number;
    heightCm?: number;
    bmi?: number;
    bmiLabel?: string;
    bloodGroup?: string;
    measuredAt?: string;
  } | null;
  history: PatientVitalSignItem[];
}

export interface PatientMedicalRecord {
  id: string;
  registrationNumber: string;
  gender: string;
  department?: string;
  jobTitle?: string;
  bloodGroup?: string;
  medicalHistory?: string;
  createdAt: string;
  user?: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    department?: string;
    jobTitle?: string;
    isActive: boolean;
  };
  allergies?: Array<{
    id: string;
    allergyType: string;
    substance: string;
    reactionDetails?: string;
    severity: string;
  }>;
  consultations?: Array<{
    id: string;
    date: string;
    type: string;
    status: string;
    reason?: string;
    symptoms?: string;
    diagnosis?: string;
    advice?: string;
    doctorName?: string;
    glycemia?: {
      performed: boolean;
      value: number | null;
      unit: string;
      measuredAt: string;
    } | null;
    prescriptionsCount: number;
  }>;
  vitalSigns?: Array<{
    id: string;
    measuredAt: string;
    bloodPressure?: string | null;
    weightKg?: number | null;
    heightCm?: number | null;
    temperatureC?: number | null;
    bmi?: number | null;
    bmiLabel?: string | null;
  }>;
  glycemiaChecks?: Array<{
    id: string;
    consultationId?: string;
    performed: boolean;
    value: number | null;
    unit: string;
    measuredAt: string;
  }>;
}
