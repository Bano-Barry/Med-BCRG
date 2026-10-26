import React, { useEffect, useState } from 'react';
import { Users, AlertTriangle, CalendarDays, ActivitySquare, ArrowRight, Pill, ShieldCheck, CheckCircle, Clock } from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { apiService } from '../../services/api';
import { DashboardStats, Consultation, DoctorDashboardData } from '../../types';
import { formatDate } from '../../utils/formatters';
import { CONSULTATION_TYPES_LABEL } from '../../utils/constants';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [doctorData, setDoctorData] = useState<DoctorDashboardData | null>(null);
  const [recentConsultations, setRecentConsultations] = useState<Consultation[]>([]);

  useEffect(() => {
    apiService.getDoctorDashboard().then(res => {
      if (res) {
        setDoctorData(res);
      }
    });
    apiService.getDashboardStats().then(setStats);
    apiService.getConsultations().then(res => setRecentConsultations(res.slice(0, 5)));
  }, []);

  if (!stats && !doctorData) return null;

  const consultationsTodayCount = doctorData?.kpis?.consultationsToday ?? stats?.consultationsToday ?? 0;
  const activeConsultationsCount = doctorData?.kpis?.activeConsultations ?? recentConsultations.filter(c => c.status === 'EN_COURS').length;
  const departmentsCount = doctorData?.kpis?.departmentsCount ?? 1;
  const patientsExaminedCount = doctorData?.kpis?.patientsExaminedCount ?? stats?.activePatients ?? 0;
  const usersCount = doctorData?.kpis?.usersCount ?? stats?.activePatients ?? 0;
  const weeklyActivity = doctorData?.weeklyActivity || [];
  const maxWeeklyCount = Math.max(...weeklyActivity.map(w => w.count), 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Banner Admin */}
      <div className="bg-[#1b3b31] rounded-2xl p-8 relative overflow-hidden text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/30 bg-white/10 text-xs font-bold uppercase tracking-wider mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>{user?.role || 'Administration'}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Tableau de bord {user?.role?.toLowerCase() || 'admin'}</h1>
            <p className="text-white/80">
              Vue globale des ressources, des consultations et des tendances pour piloter les opérations de l'infirmerie.
            </p>
          </div>
          <div className="mt-6 md:mt-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 text-sm font-medium">
              <CalendarDays className="w-4 h-4" />
              <span>{formatDate(new Date().toISOString())}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Stats Cards - 5 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-slate-500 font-medium">Consultations aujourd'hui</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <ActivitySquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-4">{consultationsTodayCount}</div>
          <div className="inline-block px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-md self-start">
            Aujourd'hui
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-slate-500 font-medium">Consultations actives</span>
            <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
              <ActivitySquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-4">{activeConsultationsCount}</div>
          <div className="inline-block px-2 py-1 bg-orange-50 text-orange-600 text-xs font-semibold rounded-md self-start">
            En cours
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-slate-500 font-medium">Départements</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-4">{departmentsCount}</div>
          <div className="inline-block px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-md self-start">
            Actifs
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-slate-500 font-medium">Personnel examiné</span>
            <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-4">{patientsExaminedCount}</div>
          <div className="inline-block px-2 py-1 bg-cyan-50 text-cyan-600 text-xs font-semibold rounded-md self-start">
            Suivi clinique
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-slate-500 font-medium">Utilisateurs</span>
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-4">{usersCount}</div>
          <div className="inline-block px-2 py-1 bg-purple-50 text-purple-600 text-xs font-semibold rounded-md self-start">
            Comptes actifs
          </div>
        </div>
      </div>

      {/* Nouveaux Blocs pour étoffer le contenu */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* Évolution de l'activité (Graphique en barres) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Évolution de l'activité</h2>
              <p className="text-xs text-slate-500 mt-1">Nombre de consultations sur les 7 derniers jours</p>
            </div>
            <div className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg border border-slate-100">
              Cette semaine
            </div>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 h-48 mt-auto">
            {(weeklyActivity.length > 0 ? weeklyActivity : [
              { day: 'Lun', count: 0 },
              { day: 'Mar', count: 0 },
              { day: 'Mer', count: 0 },
              { day: 'Jeu', count: 0 },
              { day: 'Ven', count: 0 },
              { day: 'Sam', count: 0 },
              { day: 'Dim', count: 0 },
            ]).map((item, idx) => {
              const heightPct = maxWeeklyCount > 0 ? Math.max(10, Math.round((item.count / maxWeeklyCount) * 100)) : 10;
              return (
                <div key={idx} className="w-full h-full flex flex-col items-center gap-2 group">
                  <div className="w-full bg-slate-50 rounded-t-md flex items-end justify-center relative flex-1">
                    <div 
                      className="w-full bg-[#1b3b31] rounded-t-md transition-all duration-500 group-hover:bg-emerald-600 relative"
                      style={{ height: `${item.count > 0 ? heightPct : 6}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded transition-opacity z-10 whitespace-nowrap">
                        {item.count} consult.
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium uppercase">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tâches et Alertes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Alertes & Tâches</h2>
            <Badge variant="warning">{doctorData?.alerts?.items?.length || stats?.lowStockAlerts || 0} active{(doctorData?.alerts?.items?.length || 0) > 1 ? 's' : ''}</Badge>
          </div>
          
          <div className="space-y-3">
            {doctorData?.alerts?.items && doctorData.alerts.items.length > 0 ? (
              doctorData.alerts.items.map((alert) => (
                <div key={alert.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${alert.severity === 'CRITICAL' ? 'bg-red-50 text-red-600' : alert.severity === 'WARNING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      {alert.severity === 'CRITICAL' ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{alert.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{alert.description}</p>
                    </div>
                  </div>
                  {alert.actionLabel && (
                    <Link to={alert.actionUrl || '#'} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                      {alert.actionLabel}
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 text-sm">
                Aucune alerte pour le moment.
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 pb-10">
        {/* Left Column: Consultations Récentes */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Consultations Récentes</h2>
            <Link to="/consultations" className="text-sm font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500">
                  <th className="pb-3 font-medium">Patient</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentConsultations.map((consultation) => (
                  <tr key={consultation.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-4">
                      <div className="font-medium text-slate-800">{consultation.patientName}</div>
                      <div className="text-slate-500 text-xs">{consultation.patientMatricule}</div>
                    </td>
                    <td className="py-4 text-slate-600">{formatDate(consultation.date)}</td>
                    <td className="py-4">
                      <Badge variant={consultation.type === 'INSTANT' ? 'danger' : 'info'}>
                        {CONSULTATION_TYPES_LABEL[consultation.type] || consultation.type}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <Badge variant={consultation.status === 'TERMINEE' ? 'success' : 'warning'}>
                        {consultation.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {recentConsultations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Aucune consultation récente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Accès Rapides */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Accès Rapides</h2>
          
          <div className="space-y-4">
            <Link to="/patients" className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-sky-100 hover:bg-sky-50 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Nouveau Patient</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ajouter un dossier médical</p>
              </div>
            </Link>

            <Link to="/consultations" className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ActivitySquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Nouvelle Consultation</h3>
                <p className="text-xs text-slate-500 mt-0.5">Démarrer un examen</p>
              </div>
            </Link>

            <Link to="/pharmacie" className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Délivrer Médicament</h3>
                <p className="text-xs text-slate-500 mt-0.5">Gestion de la pharmacie</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
