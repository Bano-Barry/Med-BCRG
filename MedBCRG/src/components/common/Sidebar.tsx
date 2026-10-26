import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Stethoscope,
  Pill,
  Settings,
  LogOut,
  ChevronLeft,
  BarChart3,
  Settings2,
  Activity,
  CalendarClock,
  RefreshCw,
  Upload
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import bcrgLogo from '../../assets/bcrg_logo.png';

const NAV_ITEMS = [
  { name: 'Tableau de bord', path: '/', icon: LayoutDashboard, roles: ['MEDECIN'] },
  { name: 'Consultations', path: '/consultations', icon: Stethoscope, roles: ['MEDECIN'] },
  { name: 'Dossiers Médical', path: '/patients', icon: Users, roles: ['MEDECIN'] },
  { name: 'Agenda', path: '/rendez-vous', icon: CalendarDays, roles: ['MEDECIN'] },
  { name: 'Pharmacie', path: '/pharmacie', icon: Pill, roles: ['MEDECIN'] },
  { name: 'Statistiques', path: '/admin/stats', icon: BarChart3, roles: ['ADMIN'] },
  { name: 'Gestion Comptes', path: '/admin/users', icon: Users, roles: ['ADMIN'] },
  { name: 'Périodicité Visites', path: '/admin/settings', icon: CalendarClock, roles: ['ADMIN'] },
  { name: 'Logs & Audit', path: '/admin/logs', icon: Activity, roles: ['ADMIN'] },
  { name: 'Mon Espace', path: '/patient', icon: LayoutDashboard, roles: ['PATIENT'] },
  { name: 'Prendre Rendez-vous', path: '/patient/rendez-vous', icon: CalendarDays, roles: ['PATIENT'] },
  { name: 'Ajouter un Document', path: '/patient/documents', icon: Upload, roles: ['PATIENT'] },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  width: number;
  setWidth: (width: number) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, width, setWidth, isMobileOpen, setIsMobileOpen }) => {
  const { user } = useAuth();
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.min(Math.max(200, startWidth + (moveEvent.clientX - startX)), 500);
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <aside
      className={`h-screen bg-[#1b3b31] text-white flex flex-col fixed left-0 top-0 z-50 shadow-xl transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : ''}`}
      style={{ width: isCollapsed ? '80px' : `${width}px` }}
    >
      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-sky-500/50 active:bg-sky-500 z-50 transition-colors"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-6 border-b border-white/20">
        <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
          {!isCollapsed && (
            <img src={bcrgLogo} alt="BCRG" className="w-32 object-contain" />
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.filter(item => item.roles.includes(user?.role || 'MEDECIN')).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            onClick={() => setIsMobileOpen?.(false)}
            title={isCollapsed ? item.name : undefined}
            className={({ isActive }) =>
              `flex items-center gap-4 px-3.5 py-3.5 rounded-lg transition-all duration-200 font-medium text-sm ${isCollapsed ? 'justify-center px-0' : ''
              } ${isActive
                ? 'bg-white text-[#1b3b31] shadow-sm'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="truncate">{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
