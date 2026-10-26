import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ArrowLeft, Key, LogOut, Building2, Mail,
  User as UserIcon, Building, Phone, ShieldCheck, X
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Mot de passe modifié avec succès !");
    setIsPasswordModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 h-10 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 h-10 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm whitespace-nowrap"
          >
            <Key className="w-4 h-4" />
            Changer le mot de passe
          </button>
          <button
            onClick={logout}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 h-10 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors text-sm font-medium shadow-sm whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-[#1b3b31] w-full"></div>

        {/* Profile Info */}
        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="w-24 h-24 rounded-2xl bg-[#1b3b31] text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() + user.name.charAt(1).toUpperCase() : 'AD'}
            </div>
          </div>

          <div className="flex justify-between items-center mt-2">
            <h1 className="text-2xl font-bold text-slate-800">{user?.name || 'Administrateur'}</h1>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100 text-xs font-bold">
              <UserIcon className="w-3.5 h-3.5" />
              <span>{user?.role || 'Administrateur'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Institutionnel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#1b3b31]" />
            <h2 className="font-bold text-slate-800">Rattachement Institutionnel</h2>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3 border border-slate-100">
              <Building className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-0.5">FONCTION / POSTE</p>
                <p className="text-sm text-slate-700 font-medium">{user?.jobTitle || 'Non renseigné'}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3 border border-slate-100">
              <span className="text-slate-400 font-bold text-lg leading-none mt-0.5">#</span>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-0.5">MATRICULE AGENT / HÔTE</p>
                <p className="text-sm text-slate-700 font-medium">{user?.matricule || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coordonnées */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#1b3b31]" />
            <h2 className="font-bold text-slate-800">Coordonnées & Contact</h2>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3 border border-slate-100">
              <Mail className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-0.5">ADRESSE E-MAIL</p>
                <p className="text-sm text-slate-700 font-medium">{user?.email || 'Non renseigné'}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3 border border-slate-100">
              <Phone className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-0.5">TÉLÉPHONE</p>
                <p className="text-sm text-slate-700 font-medium">{user?.phone || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions */}
      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Key className="w-6 h-6 text-[#1b3b31]" />
                Changer le mot de passe
              </h2>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe actuel</label>
                  <input
                    type="password"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1b3b31] focus:ring-2 focus:ring-[#1b3b31]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1b3b31] focus:ring-2 focus:ring-[#1b3b31]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le nouveau mot de passe</label>
                  <input
                    type="password"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1b3b31] focus:ring-2 focus:ring-[#1b3b31]/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#1b3b31] text-white rounded-xl font-medium hover:bg-[#142c24] transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
