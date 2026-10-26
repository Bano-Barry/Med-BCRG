import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, LogIn, Globe, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { apiService } from '../../services/api';
import medLogo from '../../assets/icon_Med.png';

const BCRG_HUB_URL = import.meta.env.VITE_BCRG_HUB_URL || 'http://localhost:5173';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isSsoAuthenticating, setIsSsoAuthenticating] = useState(false);
  const [ssoError, setSsoError] = useState<string | null>(null);

  const { login, loginWithSso } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userRoleAfterChange, setUserRoleAfterChange] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const redirectByRole = (role?: string) => {
    const r = (role || '').toUpperCase();
    if (r === 'MEDECIN' || r === 'DOCTOR') {
      navigate('/');
      showToast('Bienvenue', 'Connexion réussie au portail Médecin', 'success');
    } else if (r === 'ADMIN' || r === 'HR') {
      navigate('/admin');
      showToast('Bienvenue', 'Connexion réussie au portail Administration & RH', 'success');
    } else {
      navigate('/patient');
      showToast('Bienvenue', 'Connexion réussie au portail Employé/Patient', 'success');
    }
  };

  // Détection et traitement automatique d'un jeton SSO émis par le BCRG HUB
  useEffect(() => {
    const ssoToken = searchParams.get('sso_token');
    if (ssoToken && !isSsoAuthenticating) {
      setIsSsoAuthenticating(true);
      loginWithSso(ssoToken)
        .then((result) => {
          if (result.success) {
            redirectByRole(result.role);
          } else {
            setSsoError(result.error || 'Échec de validation du jeton SSO.');
            setIsSsoAuthenticating(false);
          }
        })
        .catch((err: any) => {
          setSsoError(err.message || 'Échec de validation du jeton SSO.');
          setIsSsoAuthenticating(false);
        });
    }
  }, [searchParams, isSsoAuthenticating]);

  const handleHubSsoRedirect = () => {
    window.location.href = BCRG_HUB_URL;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!matricule || !password) {
      showToast('Erreur', 'Veuillez renseigner votre matricule et votre mot de passe.', 'error');
      return;
    }

    setIsLoading(true);
    
    const result = await login(matricule.trim(), password.trim());
    setIsLoading(false);

    if (result.success) {
      if (result.isFirstLogin) {
        setUserRoleAfterChange(result.role || 'PATIENT');
        setShowFirstLoginModal(true);
        showToast('Première connexion', 'Veuillez définir votre mot de passe personnalisé pour activer votre compte.', 'info');
      } else {
        redirectByRole(result.role);
      }
    } else {
      showToast('Échec', result.error || 'Matricule ou mot de passe incorrect.', 'error');
    }
  };

  const handleChangeInitialPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showToast('Champs requis', 'Veuillez saisir votre nouveau mot de passe et sa confirmation.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Erreur', 'Les deux mots de passe ne correspondent pas.', 'error');
      return;
    }

    setIsChangingPassword(true);
    const res = await apiService.changeInitialPassword(password.trim(), newPassword.trim(), confirmPassword.trim());
    setIsChangingPassword(false);

    if (res.success) {
      showToast('Mot de passe mis à jour', 'Votre compte est maintenant activé.', 'success');
      setShowFirstLoginModal(false);
      redirectByRole(userRoleAfterChange);
    } else {
      showToast('Erreur', res.error || 'Impossible de changer le mot de passe.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#1b3b31] relative overflow-hidden flex-col items-center justify-center text-white">
        {/* Background decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30rem] h-[30rem] bg-black/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Dots pattern bottom left */}
        <div className="absolute bottom-12 left-12 grid grid-cols-6 gap-2 opacity-20">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
          ))}
        </div>

        <div className="z-10 flex flex-col items-center">
          <img src={medLogo} alt="MedBCRG Logo" className="w-56 mb-10 rounded-[2rem] shadow-2xl" />
          <h1 className="text-5xl font-extrabold tracking-wide drop-shadow-md mt-4">MedBCRG</h1>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-between relative px-8 sm:px-16 py-12 lg:py-0 overflow-y-auto h-screen">
        {isSsoAuthenticating ? (
          <div className="w-full max-w-md my-auto animate-in fade-in duration-300">
            {/* Mobile Logo (hidden on desktop) */}
            <div className="lg:hidden flex flex-col items-center mb-10">
              <div className="p-2 bg-[#1b3b31] rounded-[1.5rem] mb-4 shadow-lg overflow-hidden inline-flex">
                <img src={medLogo} alt="MedBCRG Logo" className="w-24 rounded-[1rem]" />
              </div>
              <h1 className="text-4xl font-extrabold text-[#1b3b31] tracking-tight">MedBCRG</h1>
            </div>

            {/* SSO Transition Loading Card */}
            <div className="w-full p-8 sm:p-10 bg-white rounded-3xl shadow-xl shadow-slate-200/50 text-center space-y-6 border border-slate-100">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-[#1b3b31]/10 animate-ping opacity-25" />
                <div className="w-16 h-16 border-4 border-[#1b3b31]/20 border-t-[#1b3b31] rounded-full animate-spin" />
                <Globe className="w-7 h-7 text-[#1b3b31] absolute" />
              </div>
              
              <div>
                <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  Validation SSO BCRG HUB...
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Authentification fédérée et sécurisation de votre session médicale en cours.
                </p>
              </div>

              {/* Step indicator */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-600 flex items-center justify-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium">Échange du jeton d'autorisation en cours...</span>
              </div>

              <div className="pt-2 text-[11px] text-slate-400">
                Centre Médical de la Banque Centrale de la République de Guinée
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md my-auto">
            {/* Mobile Logo (hidden on desktop) */}
            <div className="lg:hidden flex flex-col items-center mb-10">
              <div className="p-2 bg-[#1b3b31] rounded-[1.5rem] mb-4 shadow-lg overflow-hidden inline-flex">
                <img src={medLogo} alt="MedBCRG Logo" className="w-24 rounded-[1rem]" />
              </div>
              <h1 className="text-4xl font-extrabold text-[#1b3b31] tracking-tight">MedBCRG</h1>
            </div>

            <div className="mb-8 text-left">
              <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Connexion</h2>
              <p className="text-slate-500 text-xs">
                Connectez-vous via le portail unique <strong>BCRG HUB</strong> ou vos identifiants internes.
              </p>
            </div>

          {/* Alerte Erreur SSO */}
          {ssoError && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>
                <strong className="font-semibold">Échec de la connexion SSO :</strong> {ssoError}
              </div>
            </div>
          )}

          {/* Bouton SSO BCRG HUB */}
          <div className="mb-6 space-y-2">
            <button
              type="button"
              onClick={handleHubSsoRedirect}
              className="w-full h-12 bg-white hover:bg-emerald-50/60 border-2 border-[#1b3b31] text-[#1b3b31] font-semibold rounded-lg flex items-center justify-center gap-2.5 shadow-sm hover:shadow transition-all group"
            >
              <Globe className="w-5 h-5 text-[#1b3b31] group-hover:rotate-12 transition-transform" />
              <span>Connexion unique via BCRG HUB (SSO)</span>
            </button>
            <p className="text-[11px] text-center text-slate-400">
              Accès direct sécurisé fédéré avec l'Active Directory de la Banque Centrale.
            </p>
          </div>

          {/* Séparateur */}
          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="mx-3 flex-shrink text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              Ou par matricule & mot de passe
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Matricule Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Matricule
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  placeholder="ex: 1234"
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded outline-none focus:border-[#1b3b31] focus:ring-1 focus:ring-[#1b3b31] transition-all text-base text-slate-700 bg-white"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-12 py-2.5 border border-slate-200 rounded outline-none focus:border-[#1b3b31] focus:ring-1 focus:ring-[#1b3b31] transition-all text-base text-slate-700 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1b3b31] hover:bg-[#122821] text-white font-medium py-3 rounded mt-4 flex items-center justify-center gap-2 transition-colors focus:ring-4 focus:ring-[#1b3b31]/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Se Connecter</span>
                </>
              )}
            </button>
          </form>
        </div>
        )}

        {/* Footer */}
        <p className="text-xs text-slate-400 text-center w-full mt-8">
          © {new Date().getFullYear()} Banque Centrale de la République de Guinée. Tous droits réservés.
        </p>
      </div>

      {/* Modal Changement obligatoire du premier mot de passe */}
      {showFirstLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#1b3b31] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Sécurité du compte</h3>
                <p className="text-xs text-slate-500">Première connexion : modifiez votre mot de passe</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
              Pour des raisons de conformité et de sécurité médicale, vous devez obligatoirement choisir un nouveau mot de passe personnel avant d'accéder à votre espace.
            </p>

            <form onSubmit={handleChangeInitialPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nouveau mot de passe *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 caractères (Maj, min, chiffre, symbole)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmer le nouveau mot de passe *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-[#1b3b31] outline-none transition-colors"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full bg-[#1b3b31] hover:bg-[#122821] text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isChangingPassword ? 'Enregistrement...' : 'Activer mon compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
