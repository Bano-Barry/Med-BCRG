import React, { useState, useEffect } from 'react';
import {
  Search, Upload, UserPlus, Users, X, Shield, Eye,
  Lock, Unlock, Trash2, Edit2, MoreHorizontal, Download,
  Filter, CheckCircle, Clock, AlertTriangle, Calendar
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { apiService } from '../../services/api';

// ───── TYPES ────────────────────────────────────────────────────────────────
type EmployeeRole = 'PATIENT' | 'MEDECIN' | 'ADMIN' | 'RH';
type EmployeeStatus = 'ACTIF' | 'INACTIF' | 'SUSPENDU';
type VisiteStatus = 'A_JOUR' | 'EN_RETARD' | 'BIENTOT_DUE';

interface Employee {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  email: string;
  phone: string;
  department: string;
  poste: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  dateEmbauche: string;
  lastVisit: string | null;
  nextVisit: string | null;
  visiteStatus: VisiteStatus;
  createdAt: string;
  bloodGroup?: string;
}

// ───── HELPERS ───────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<EmployeeRole, string> = {
  PATIENT: 'Employé (Patient)',
  MEDECIN: 'Médecin',
  ADMIN: 'Administrateur (RH)',
  RH: 'Administrateur (RH)',
};

const ROLE_COLORS: Record<EmployeeRole, string> = {
  PATIENT: 'bg-slate-100 text-slate-700',
  MEDECIN: 'bg-blue-50 text-blue-700',
  ADMIN: 'bg-purple-50 text-purple-700',
  RH: 'bg-orange-50 text-orange-700',
};

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; dot: string; text: string }> = {
  ACTIF: { label: 'Actif', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  INACTIF: { label: 'Inactif', dot: 'bg-slate-400', text: 'text-slate-500' },
  SUSPENDU: { label: 'Suspendu', dot: 'bg-amber-500', text: 'text-amber-600' },
};

const VISITE_CONFIG: Record<VisiteStatus, { label: string; color: string; icon: React.ReactNode }> = {
  A_JOUR: { label: 'À jour', color: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  EN_RETARD: { label: 'En retard', color: 'bg-red-50 text-red-700', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  BIENTOT_DUE: { label: 'Bientôt due', color: 'bg-amber-50 text-amber-700', icon: <Clock className="w-3.5 h-3.5" /> },
};

const ROLES: EmployeeRole[] = ['PATIENT', 'MEDECIN', 'ADMIN', 'RH'];
const STATUSES: EmployeeStatus[] = ['ACTIF', 'INACTIF', 'SUSPENDU'];

// ───── COMPONENT ─────────────────────────────────────────────────────────────
export const UsersManagementPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<EmployeeRole | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<EmployeeStatus | 'ALL'>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterVisite, setFilterVisite] = useState<VisiteStatus | 'ALL'>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPlanifierModal, setShowPlanifierModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addForm, setAddForm] = useState({
    matricule: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    jobTitle: '',
    gender: 'M' as 'M' | 'F',
    role: 'PATIENT' as EmployeeRole,
    bloodGroup: ''
  });

  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [planifierForm, setPlanifierForm] = useState({ date: '', heure: '08:00', type: 'SYSTEMATIQUE', notes: '' });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getPatients();
      const mapped: Employee[] = data.map((p, idx) => {
        let role: EmployeeRole = 'PATIENT';
        const userRole = ((p as any).user?.role || (p as any).role || '').toString().toUpperCase();
        const cat = ((p.category as string) || '').toUpperCase();
        if (cat === 'MEDECIN' || userRole === 'DOCTOR' || userRole === 'MEDECIN') {
          role = 'MEDECIN';
        } else if (cat === 'ADMIN' || cat === 'RH' || userRole === 'HR' || userRole === 'ADMIN') {
          role = 'ADMIN';
        }

        return {
          id: p.id,
          matricule: p.matricule,
          firstName: p.firstName,
          lastName: p.lastName,
          gender: p.gender || 'M',
          email: p.email || (p as any).user?.email || `${p.matricule}@bcrg-guinee.org`,
          phone: p.phone || '',
          department: p.department || 'Administration',
          poste: p.jobTitle || 'Collaborateur',
          role,
          status: 'ACTIF',
          dateEmbauche: p.createdAt ? p.createdAt.split('T')[0] : '2024-01-01',
          lastVisit: idx % 3 === 0 ? '2025-11-12' : null,
          nextVisit: idx % 2 === 0 ? '2026-11-15' : null,
          visiteStatus: idx % 4 === 0 ? 'EN_RETARD' : idx % 3 === 0 ? 'BIENTOT_DUE' : 'A_JOUR',
          createdAt: p.createdAt,
          bloodGroup: p.bloodGroup
        };
      });
      setEmployees(mapped);
    } catch (e) {
      console.error('Erreur chargement employés:', e);
      showToast('Erreur', 'Impossible de charger la liste des employés', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const DEPARTMENTS = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  // Stats
  const total = employees.length;
  const actifs = employees.filter(e => e.status === 'ACTIF').length;
  const enRetard = employees.filter(e => e.visiteStatus === 'EN_RETARD').length;
  const bientotDue = employees.filter(e => e.visiteStatus === 'BIENTOT_DUE').length;

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (e.firstName?.toLowerCase() || '').includes(q) ||
      (e.lastName?.toLowerCase() || '').includes(q) ||
      (e.matricule?.toLowerCase() || '').includes(q) ||
      (e.email?.toLowerCase() || '').includes(q) ||
      (e.department?.toLowerCase() || '').includes(q);
    const matchRole = filterRole === 'ALL' || e.role === filterRole;
    const matchStatus = filterStatus === 'ALL' || e.status === filterStatus;
    const matchDept = filterDept === 'ALL' || e.department === filterDept;
    const matchVisite = filterVisite === 'ALL' || e.visiteStatus === filterVisite;
    return matchSearch && matchRole && matchStatus && matchDept && matchVisite;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)));
    }
  };

  const handleSuspend = (id: string) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: e.status === 'SUSPENDU' ? 'ACTIF' : 'SUSPENDU' } : e));
    setActiveMenu(null);
    if (selectedEmployee?.id === id) setSelectedEmployee(prev => prev ? { ...prev, status: prev.status === 'SUSPENDU' ? 'ACTIF' : 'SUSPENDU' } : null);
    showToast('Statut mis à jour', 'Le statut du compte a été modifié.', 'info');
  };

  const handleDelete = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    setActiveMenu(null);
    if (selectedEmployee?.id === id) setSelectedEmployee(null);
    showToast('Dossier retiré', 'Le dossier a été retiré de la vue.', 'info');
  };

  const openEdit = (emp: Employee) => {
    setEditForm({ ...emp });
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const openPlanifier = (emp: Employee | null) => {
    if (emp) setSelectedEmployee(emp);
    setPlanifierForm({ date: '', heure: '08:00', type: 'SYSTEMATIQUE', notes: '' });
    setShowPlanifierModal(true);
    setActiveMenu(null);
  };

  const handlePlanifierSave = () => {
    if (!planifierForm.date || !selectedEmployee) return;
    showToast('Visite planifiée', `Visite médicale programmée pour ${selectedEmployee.firstName} ${selectedEmployee.lastName} le ${planifierForm.date}.`, 'success');
    setShowPlanifierModal(false);
  };

  const handleEditSave = async () => {
    if (!editForm.id) return;
    setIsSubmitting(true);
    const res = await apiService.savePatient({
      id: editForm.id,
      phone: editForm.phone,
      department: editForm.department,
      jobTitle: editForm.poste,
      bloodGroup: editForm.bloodGroup
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast('Succès', 'Profil employé mis à jour.', 'success');
      setShowEditModal(false);
      loadEmployees();
    } else {
      showToast('Erreur', res.error || 'Erreur lors de la mise à jour.', 'error');
    }
  };

  const handleAddSave = async () => {
    if (!addForm.matricule || !addForm.firstName || !addForm.lastName || !addForm.department || !addForm.jobTitle) {
      showToast('Champs requis', 'Veuillez remplir au moins le matricule, nom, prénom, direction et poste.', 'error');
      return;
    }
    setIsSubmitting(true);
    const res = await apiService.savePatient({
      matricule: addForm.matricule,
      firstName: addForm.firstName,
      lastName: addForm.lastName,
      email: addForm.email,
      phone: addForm.phone,
      gender: addForm.gender,
      department: addForm.department,
      jobTitle: addForm.jobTitle,
      bloodGroup: addForm.bloodGroup
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast('Employé créé', 'Le collaborateur a été ajouté avec succès.', 'success');
      setShowAddModal(false);
      setAddForm({
        matricule: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        jobTitle: '',
        gender: 'M',
        role: 'PATIENT',
        bloodGroup: ''
      });
      loadEmployees();
    } else {
      showToast('Erreur', res.error || 'Impossible d\'ajouter l\'employé.', 'error');
    }
  };

  const handleExportCsv = () => {
    if (employees.length === 0) {
      showToast('Aucune donnée', 'Aucun employé à exporter.', 'info');
      return;
    }
    const headers = ['Matricule', 'Nom', 'Prenom', 'Genre', 'Email', 'Telephone', 'Direction', 'Poste', 'Statut', 'Visite'];
    const rows = employees.map(e => [
      `"${e.matricule}"`,
      `"${e.lastName}"`,
      `"${e.firstName}"`,
      `"${e.gender}"`,
      `"${e.email}"`,
      `"${e.phone}"`,
      `"${e.department}"`,
      `"${e.poste}"`,
      `"${e.status}"`,
      `"${e.visiteStatus}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Employes_BCRG_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Export réussi', 'Le fichier CSV a été téléchargé.', 'success');
  };

  const initials = (e: Employee) => `${(e.firstName || ' ')[0]}${(e.lastName || ' ')[0]}`.toUpperCase();

  const avatarColor = (role: EmployeeRole) => {
    const map: Record<EmployeeRole, string> = {
      PATIENT: 'bg-slate-200 text-slate-700',
      MEDECIN: 'bg-blue-100 text-blue-700',
      ADMIN: 'bg-purple-100 text-purple-700',
      RH: 'bg-orange-100 text-orange-700',
    };
    return map[role];
  };

  return (
    <div className="w-full h-full space-y-4 animate-in fade-in duration-300 pb-8 font-sans">

      {/* ── BANNER ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#1b3b31] rounded-2xl p-6 text-white relative shadow-sm overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/30 text-[10px] font-bold uppercase tracking-wider mb-3 bg-white/10">
              <Shield className="w-3.5 h-3.5" />
              ADMINISTRATION
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Gestion des Comptes</h1>
            <p className="text-white/80 text-sm">Gérez les employés, leurs rôles d'accès et le suivi de leurs visites médicales obligatoires.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-sm font-medium hover:bg-white/20 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importer (CSV)
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#1b3b31] text-sm font-semibold hover:bg-emerald-50 transition-colors shadow"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter un employé
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-sm font-medium hover:bg-white/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-slate-500 font-medium">Total employés</span>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-4">{total}</div>
          <div className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md self-start">Dossiers enregistrés</div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-slate-500 font-medium">Comptes actifs</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-4">{actifs}</div>
          <div className="inline-block px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-md self-start">En service</div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-slate-500 font-medium">Visites en retard</span>
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-4">{enRetard}</div>
          <div className="inline-block px-2 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-md self-start">Relance prioritaire</div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-slate-500 font-medium">Bientôt dues</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-4">{bientotDue}</div>
          <div className="inline-block px-2 py-1 bg-amber-50 text-amber-600 text-xs font-semibold rounded-md self-start">Dans 30 jours</div>
        </div>
      </div>

      {/* ── TABLE CARD ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="relative w-full lg:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Nom, matricule, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1b3b31] focus:ring-2 focus:ring-[#1b3b31]/10 rounded-lg outline-none text-sm transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value as EmployeeRole | 'ALL')}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 font-medium outline-none focus:border-[#1b3b31] cursor-pointer"
            >
              <option value="ALL">Tous les rôles</option>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as EmployeeStatus | 'ALL')}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 font-medium outline-none focus:border-[#1b3b31] cursor-pointer"
            >
              <option value="ALL">Tous les statuts</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>

            <select
              value={filterVisite}
              onChange={e => setFilterVisite(e.target.value as VisiteStatus | 'ALL')}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 font-medium outline-none focus:border-[#1b3b31] cursor-pointer"
            >
              <option value="ALL">Toutes les visites</option>
              <option value="A_JOUR">À jour</option>
              <option value="EN_RETARD">En retard</option>
              <option value="BIENTOT_DUE">Bientôt due</option>
            </select>

            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 font-medium outline-none focus:border-[#1b3b31] cursor-pointer max-w-[200px]"
            >
              <option value="ALL">Toutes les directions</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

          </div>
        </div>

        {/* Count */}
        <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 text-xs text-slate-500 font-medium">
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''} sur {total} employés
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold w-10">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={selectAll}
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Employé</th>
                <th className="px-4 py-3 font-semibold">Matricule</th>
                <th className="px-4 py-3 font-semibold">Direction</th>
                <th className="px-4 py-3 font-semibold">Rôle</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Visite Obligatoire</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
                {filtered.map(emp => {
                  const sc = STATUS_CONFIG[emp.status];
                  const vc = VISITE_CONFIG[emp.visiteStatus];
                  const isActive = selectedEmployee?.id === emp.id;
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedEmployee(isActive ? null : emp)}
                      className={`border-b border-slate-50 transition-colors cursor-pointer ${isActive ? 'bg-[#1b3b31]/5' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedIds.has(emp.id)}
                          onChange={() => toggleSelect(emp.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarColor(emp.role)}`}>
                            {initials(emp)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{emp.firstName} {emp.lastName}</div>
                            <div className="text-xs text-slate-400">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600 text-xs">{emp.matricule}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs max-w-[180px] truncate">{emp.department}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${ROLE_COLORS[emp.role]}`}>
                          {ROLE_LABELS[emp.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${sc.text}`}>
                          <span className={`w-2 h-2 rounded-full ${sc.dot}`}></span>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${vc.color}`}>
                          {vc.icon}
                          {vc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActiveMenu(activeMenu === emp.id ? null : emp.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {activeMenu === emp.id && (
                            <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-xl w-52 py-1 text-sm">
                              <button onClick={() => { setSelectedEmployee(emp); setActiveMenu(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-slate-700">
                                <Eye className="w-4 h-4 text-slate-500" /> Voir le profil
                              </button>
                              <button onClick={() => { openEdit(emp); setActiveMenu(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-slate-700">
                                <Edit2 className="w-4 h-4 text-slate-500" /> Modifier
                              </button>
                              <button onClick={() => { openPlanifier(emp); setActiveMenu(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-slate-700">
                                <Calendar className="w-4 h-4 text-slate-500" /> Planifier une visite
                              </button>
                              <div className="border-t border-slate-100 my-1" />
                              <button onClick={() => handleSuspend(emp.id)} className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-amber-50 text-amber-700">
                                {emp.status === 'SUSPENDU' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                {emp.status === 'SUSPENDU' ? 'Réactiver' : 'Suspendre'}
                              </button>
                              <button onClick={() => handleDelete(emp.id)} className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 text-red-600">
                                <Trash2 className="w-4 h-4" /> Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aucun employé trouvé</p>
                <p className="text-sm mt-1">Essayez de modifier vos filtres ou votre recherche.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── OVERLAY SLIDE-OVER DRAWER (FULL HEIGHT AS IN SCREENSHOT) ───────────────────── */}
        {selectedEmployee && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop blur overlay */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
              onClick={() => setSelectedEmployee(null)}
            />

            {/* Right Drawer Panel */}
            <div className="relative w-full max-w-md md:w-[480px] bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto animate-in slide-in-from-right duration-300">

              {/* Header Vert Sombre */}
              <div className="bg-[#1b3b31] text-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center font-bold text-lg text-white shrink-0 shadow-inner">
                      {initials(selectedEmployee)}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl leading-tight">{selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                      <p className="text-white/70 text-xs mt-1 font-medium">Matricule : <span className="text-white font-semibold">{selectedEmployee.matricule}</span> · Embauche : {new Date(selectedEmployee.dateEmbauche).getFullYear()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors shrink-0"
                    title="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-2 mt-4 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border border-white/30 bg-white/15 text-white">
                    {ROLE_LABELS[selectedEmployee.role]}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-white/30 bg-white/15 text-white">
                    <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[selectedEmployee.status].dot}`}></span>
                    {STATUS_CONFIG[selectedEmployee.status].label}
                  </span>
                </div>
              </div>

              {/* Body Info - Admin View */}
              <div className="flex-1 overflow-y-auto">

                {/* Infos RH */}
                <div className="p-6 space-y-3">
                  {[
                    { label: 'Email', value: selectedEmployee.email },
                    { label: 'Téléphone', value: selectedEmployee.phone },
                    { label: 'Direction', value: selectedEmployee.department },
                    { label: 'Poste', value: selectedEmployee.poste },
                    { label: "Date d'embauche", value: new Date(selectedEmployee.dateEmbauche).toLocaleDateString('fr-FR') },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-sm text-slate-500 font-medium shrink-0 w-40">{label}</span>
                      <span className="text-sm font-semibold text-slate-800 text-right">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Visite Médicale Obligatoire */}
                <div className="px-6 pb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Visite Médicale Obligatoire</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold mb-4 ${
                    selectedEmployee.visiteStatus === 'A_JOUR' ? 'bg-emerald-50 text-emerald-700' :
                    selectedEmployee.visiteStatus === 'EN_RETARD' ? 'bg-red-50 text-red-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {selectedEmployee.visiteStatus === 'A_JOUR' && <CheckCircle className="w-3.5 h-3.5" />}
                    {selectedEmployee.visiteStatus === 'EN_RETARD' && <AlertTriangle className="w-3.5 h-3.5" />}
                    {selectedEmployee.visiteStatus === 'BIENTOT_DUE' && <Clock className="w-3.5 h-3.5" />}
                    {VISITE_CONFIG[selectedEmployee.visiteStatus].label}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-sm text-slate-500">Dernière visite</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {selectedEmployee.lastVisit
                          ? new Date(selectedEmployee.lastVisit).toLocaleDateString('fr-FR')
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-slate-500">Prochaine visite</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {selectedEmployee.nextVisit
                          ? new Date(selectedEmployee.nextVisit).toLocaleDateString('fr-FR')
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Actions</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => openPlanifier(selectedEmployee)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-[#1b3b31] text-white rounded-xl text-sm font-semibold hover:bg-[#142c24] transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      Planifier une visite
                    </button>
                    <button
                      onClick={() => openEdit(selectedEmployee)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-slate-500" />
                      Modifier le profil
                    </button>
                    <button
                      onClick={() => handleSuspend(selectedEmployee.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors"
                    >
                      {selectedEmployee.status === 'SUSPENDU' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      {selectedEmployee.status === 'SUSPENDU' ? 'Réactiver le compte' : 'Suspendre le compte'}
                    </button>
                    <button
                      onClick={() => { handleDelete(selectedEmployee.id); setSelectedEmployee(null); }}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer le dossier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── IMPORT MODAL ───────────────────────────────────────────────────── */}
        {
          showImportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">Importer des employés</h2>
                  <button onClick={() => setShowImportModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-[#1b3b31]/40 transition-colors cursor-pointer">
                    <Upload className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-700">Glissez votre fichier ici</p>
                    <p className="text-sm text-slate-400 mt-1">Formats acceptés : .xlsx, .csv</p>
                    <button className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                      Parcourir les fichiers
                    </button>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Colonnes attendues</p>
                    <div className="flex flex-wrap gap-2">
                      {['matricule', 'prenom', 'nom', 'genre', 'email', 'telephone', 'direction', 'poste'].map(col => (
                        <span key={col} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-600">{col}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                  <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
                  <button className="px-4 py-2 text-sm font-medium bg-[#1b3b31] text-white rounded-lg hover:bg-[#142c24] transition-colors">Importer</button>
                </div>
              </div>
            </div>
          )
        }

        {/* ── ADD MODAL ──────────────────────────────────────────────────────── */}
        {
          showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">Ajouter un employé</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Matricule *</label>
                    <input
                      type="text"
                      placeholder="Ex: 1042"
                      value={addForm.matricule}
                      onChange={e => setAddForm(f => ({ ...f, matricule: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      placeholder="Prénom"
                      value={addForm.firstName}
                      onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      placeholder="Nom de famille"
                      value={addForm.lastName}
                      onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email professionnel</label>
                    <input
                      type="email"
                      placeholder="prenom.nom@bcrg-guinee.org"
                      value={addForm.email}
                      onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      placeholder="620 00 00 00"
                      value={addForm.phone}
                      onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Poste *</label>
                    <input
                      type="text"
                      placeholder="Intitulé du poste"
                      value={addForm.jobTitle}
                      onChange={e => setAddForm(f => ({ ...f, jobTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Genre</label>
                    <select
                      value={addForm.gender}
                      onChange={e => setAddForm(f => ({ ...f, gender: e.target.value as 'M' | 'F' }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none"
                    >
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Groupe sanguin</label>
                    <select
                      value={addForm.bloodGroup}
                      onChange={e => setAddForm(f => ({ ...f, bloodGroup: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none"
                    >
                      <option value="">Non renseigné</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Direction / Département *</label>
                    <input
                      type="text"
                      placeholder="Ex: Direction des Ressources Humaines"
                      value={addForm.department}
                      onChange={e => setAddForm(f => ({ ...f, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                  <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
                  <button
                    onClick={handleAddSave}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium bg-[#1b3b31] text-white rounded-lg hover:bg-[#142c24] transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Click outside to close dropdown */}
        {
          activeMenu && (
            <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
          )
        }

        {/* ── PLANIFIER VISITE MODAL ─────────────────────────────────────────── */}
        {
          showPlanifierModal && selectedEmployee && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Planifier une visite médicale</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{selectedEmployee.firstName} {selectedEmployee.lastName} — {selectedEmployee.matricule}</p>
                  </div>
                  <button onClick={() => setShowPlanifierModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Date de la visite *</label>
                      <input
                        type="date"
                        value={planifierForm.date}
                        onChange={e => setPlanifierForm(f => ({ ...f, date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Heure</label>
                      <input
                        type="time"
                        value={planifierForm.heure}
                        onChange={e => setPlanifierForm(f => ({ ...f, heure: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Type de visite</label>
                    <select
                      value={planifierForm.type}
                      onChange={e => setPlanifierForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none"
                    >
                      <option value="SYSTEMATIQUE">Visite systématique obligatoire</option>
                      <option value="EMBAUCHE">Visite d'embauche</option>
                      <option value="REPRISE">Visite de reprise (après arrêt)</option>
                      <option value="SUIVI">Visite de suivi médical</option>
                      <option value="APTITUDE">Contrôle d'aptitude</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Motif</label>
                    <textarea
                      value={planifierForm.notes}
                      onChange={e => setPlanifierForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Informations complémentaires pour le médecin..."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none resize-none transition-colors"
                    />
                  </div>
                  {planifierForm.date && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs text-emerald-700 font-medium">
                        Visite planifiée le {new Date(planifierForm.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {planifierForm.heure}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                  <button onClick={() => setShowPlanifierModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
                  <button
                    onClick={handlePlanifierSave}
                    disabled={!planifierForm.date}
                    className="px-4 py-2 text-sm font-medium bg-[#1b3b31] text-white rounded-lg hover:bg-[#142c24] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >Confirmer la planification</button>
                </div>
              </div>
            </div>
          )
        }

        {/* ── EDIT PROFIL MODAL ──────────────────────────────────────────────── */}
        {
          showEditModal && editForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Modifier le profil</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{editForm.firstName} {editForm.lastName} — {editForm.matricule}</p>
                  </div>
                  <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom</label>
                    <input type="text" value={editForm.firstName || ''} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nom</label>
                    <input type="text" value={editForm.lastName || ''} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email professionnel</label>
                    <input type="email" value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
                    <input type="tel" value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Poste</label>
                    <input type="text" value={editForm.poste || ''} onChange={e => setEditForm(f => ({ ...f, poste: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Genre</label>
                    <select value={editForm.gender || 'M'} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value as 'M' | 'F' }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none">
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Rôle d'accès</label>
                    <select value={editForm.role || 'PATIENT'} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as EmployeeRole }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none">
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Statut du compte</label>
                    <select value={editForm.status || 'ACTIF'} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as EmployeeStatus }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none">
                      {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Direction / Département</label>
                    <input type="text" value={editForm.department || ''} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors" />
                  </div>
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                  <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Annuler</button>
                  <button onClick={handleEditSave} className="px-4 py-2 text-sm font-medium bg-[#1b3b31] text-white rounded-lg hover:bg-[#142c24] transition-colors">Enregistrer les modifications</button>
                </div>
              </div>
            </div>
          )
        }
    </div>
  );
};
