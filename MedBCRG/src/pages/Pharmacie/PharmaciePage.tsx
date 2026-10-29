import React, { useEffect, useState } from 'react';
import { Pill, Droplet, Activity, Users, PackageCheck, AlertTriangle } from 'lucide-react';
import { apiService } from '../../services/api';
import { DoctorDashboardData } from '../../types';
import { Badge } from '../../components/common/Badge';
import { formatDate } from '../../utils/formatters';

export const PharmaciePage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DoctorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiService.getDoctorDashboard()
      .then(res => setDashboardData(res))
      .finally(() => setIsLoading(false));
  }, []);

  const diabetesKpis = dashboardData?.diabetesKpis;
  const passages = dashboardData?.diabeticMonthlyPassages || [];
  const remainingStrips = diabetesKpis?.remainingStrips ?? 100;
  const consumedStrips = diabetesKpis?.stripConsumption ?? 0;
  const initialStock = remainingStrips + consumedStrips;
  const stockPercent = initialStock > 0 ? Math.round((remainingStrips / initialStock) * 100) : 100;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
            <Pill className="w-7 h-7 text-[#0f172a]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">Pharmacie & Consommables</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Suivi en temps réel des stocks de consommables médicaux et bandelettes glycémiques.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-slate-500 font-medium">Bandelettes restantes</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">{isLoading ? '...' : remainingStrips}</div>
          <div className="flex items-center gap-2">
            <Badge variant={remainingStrips <= 20 ? 'danger' : 'success'}>
              {remainingStrips <= 20 ? 'Stock faible' : `${stockPercent}% disponible`}
            </Badge>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-slate-500 font-medium">Bandelettes utilisées</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">{isLoading ? '...' : consumedStrips}</div>
          <span className="text-xs text-slate-400">1 bandelette décomptée par contrôle</span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-slate-500 font-medium">Contrôles glycémiques</span>
            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">{isLoading ? '...' : (diabetesKpis?.glycemiaChecks ?? 0)}</div>
          <span className="text-xs text-slate-400">Relevés enregistrés en consultation</span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-slate-500 font-medium">Patients diabétiques</span>
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">{isLoading ? '...' : (diabetesKpis?.diabeticPatients ?? 0)}</div>
          <span className="text-xs text-slate-400">Suivi glycémique actif</span>
        </div>
      </div>

      {/* Stock Item Detail Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#1b3b31] flex items-center justify-center shrink-0">
              <Droplet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">Bandelettes de contrôle glycémique (GLUCOSE_STRIPS)</h2>
                <Badge variant={remainingStrips <= 20 ? 'danger' : 'success'}>
                  {remainingStrips <= 20 ? 'Réapprovisionnement requis' : 'En stock'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Décompte automatique lié aux contrôles glycémiques effectués lors des consultations médicales.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-semibold block">Jauge de stock</span>
            <span className="text-lg font-bold text-[#1b3b31]">{remainingStrips} / {initialStock} unités</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                remainingStrips <= 20 ? 'bg-rose-500' : remainingStrips <= 40 ? 'bg-amber-500' : 'bg-[#1b3b31]'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, stockPercent))}%` }}
            />
          </div>
          {remainingStrips <= 20 && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Le stock de bandelettes est inférieur ou égal au seuil critique (20 unités).</span>
            </div>
          )}
        </div>
      </div>

      {/* Table of monthly passages consuming strips */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Historique des passages & consommations du mois</h3>
            <p className="text-xs text-slate-500 mt-0.5">Détail par patient ayant bénéficié d'un contrôle glycémique ce mois-ci.</p>
          </div>
          <Badge variant="default">{passages.length} patient(s)</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-semibold">Matricule</th>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Direction / Département</th>
                <th className="px-6 py-4 font-semibold">Bandelettes utilisées (Mois)</th>
                <th className="px-6 py-4 font-semibold">Dernier relevé</th>
                <th className="px-6 py-4 font-semibold">Date dernier contrôle</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {passages.map((item) => (
                <tr key={item.patientId} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600">{item.registrationNumber}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{item.patientName}</td>
                  <td className="px-6 py-4 text-slate-600">{item.department || '—'}</td>
                  <td className="px-6 py-4">
                    <Badge variant="info">{item.monthlyVisits} unité{item.monthlyVisits > 1 ? 's' : ''}</Badge>
                  </td>
                  <td className="px-6 py-4 font-bold text-rose-600">
                    {item.lastGlycemiaValue ? `${item.lastGlycemiaValue} ${item.lastGlycemiaUnit || 'g/L'}` : 'Contrôlé'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {item.lastCheckDate ? formatDate(item.lastCheckDate) : '—'}
                  </td>
                </tr>
              ))}
              {passages.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Aucune consommation de bandelette enregistrée pour le mois en cours.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
