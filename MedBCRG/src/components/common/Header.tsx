import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, ChevronDown, ChevronUp, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';

interface HeaderProps {
  onMenuClick?: () => void;
}

interface HeaderNotificationItem {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  read: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotificationItem[]>([]);
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

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const loadRoleNotifications = async () => {
      const items: HeaderNotificationItem[] = [];
      try {
        if (user.role === 'MEDECIN') {
          const dash = await apiService.getDoctorDashboard();
          if (dash) {
            if (dash.alerts && Array.isArray(dash.alerts.items)) {
              dash.alerts.items.slice(0, 5).forEach((al, idx) => {
                items.push({
                  id: al.id || `doc-alert-${idx}`,
                  title: al.title || 'Alerte médicale',
                  description: al.description,
                  timeLabel: "Aujourd'hui",
                  read: false
                });
              });
            }
          }
        } else if (user.role === 'ADMIN') {
          const summary = await apiService.getHrDueEmployeesSummary();
          if (summary) {
            if (summary.overdueCount > 0) {
              items.push({
                id: 'hr-overdue',
                title: 'Visites médicales échues',
                description: `${summary.overdueCount} employé(s) sont en retard de visite périodique.`,
                timeLabel: 'Prioritaire',
                read: false
              });
            }
            if (summary.dueSoonCount > 0) {
              items.push({
                id: 'hr-due-soon',
                title: 'Échéances proches',
                description: `${summary.dueSoonCount} visite(s) périodique(s) arrivent à échéance.`,
                timeLabel: 'Sous 30 jours',
                read: false
              });
            }
          }
        } else if (user.role === 'PATIENT') {
          const apts = await apiService.getMyPatientAppointments();
          const upcoming = (apts || []).filter(a => a.status !== 'ANNULE' && a.status !== 'TERMINE');
          upcoming.slice(0, 3).forEach(apt => {
            items.push({
              id: `pat-apt-${apt.id}`,
              title: apt.status === 'CONFIRME' ? 'Rendez-vous confirmé' : 'Demande de rendez-vous',
              description: `${apt.reason.split(' - ')[0]} le ${new Date(apt.dateTime).toLocaleDateString('fr-FR')}`,
              timeLabel: new Date(apt.dateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              read: false
            });
          });
        }
      } catch {
        // Ignore silent notification errors
      }
      setNotifications(items);
    };

    loadRoleNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

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
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                    {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">
                    Aucune notification pour le moment.
                  </div>
                ) : (
                  notifications.map(item => (
                    <div
                      key={item.id}
                      className={`px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${item.read ? 'opacity-60' : ''}`}
                    >
                      <p className="text-sm text-slate-800 font-medium">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{item.timeLabel}</span>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && unreadCount > 0 && (
                <div className="px-4 py-2 border-t border-slate-100">
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-sky-600 hover:text-sky-700 font-medium w-full text-center"
                  >
                    Tout marquer comme lu
                  </button>
                </div>
              )}
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
