import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, ChevronDown, ChevronUp, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden text-slate-500 hover:text-slate-700"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:block">
          <h1 className="text-xl font-bold text-[#1b3b31] tracking-wide uppercase">
            {user?.role || 'PORTAIL'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors rounded-full border-2 border-slate-800 hover:bg-slate-50"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                <span className="text-xs font-medium bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">2 nouvelles</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50">
                  <p className="text-sm text-slate-800 font-medium">Nouveau patient enregistré</p>
                  <p className="text-xs text-slate-500 mt-0.5">Mamadou Diallo a été ajouté à la base de données.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Il y a 5 min</span>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50">
                  <p className="text-sm text-slate-800 font-medium">Stock faible : Paracétamol</p>
                  <p className="text-xs text-slate-500 mt-0.5">Il ne reste plus que 2 boîtes en pharmacie.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Il y a 2 heures</span>
                </div>
                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors opacity-70">
                  <p className="text-sm text-slate-800">Rendez-vous annulé</p>
                  <p className="text-xs text-slate-500 mt-0.5">Le rendez-vous avec Fanta Camara a été annulé.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Hier</span>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-slate-100">
                <button className="text-sm text-sky-600 hover:text-sky-700 font-medium w-full text-center">
                  Tout marquer comme lu
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1.5 pr-3 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-[#1b3b31] text-white flex items-center justify-center font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name || 'Administrateur'}</p>
              <p className="text-xs text-slate-500 leading-tight">{user?.email || 'admin@bcrg-guinee.org'}</p>
            </div>
            {isDropdownOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-500 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500 ml-1" />
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
              <button 
                onClick={() => {
                  navigate('/settings');
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4" />
                Mon profil
              </button>
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
