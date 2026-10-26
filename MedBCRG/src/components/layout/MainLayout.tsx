import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../common/Sidebar';
import { Header } from '../common/Header';
import { useAuth } from '../../hooks/useAuth';

export const MainLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [sidebarWidth, setSidebarWidth] = React.useState(280);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  if (!isAuthenticated) {
    return <Navigate to={`/login${location.search}`} replace />;
  }

  if (user?.role === 'ADMIN' && location.pathname === '/') {
    return <Navigate to="/admin/stats" replace />;
  }

  if (user?.role === 'PATIENT' && location.pathname === '/') {
    return <Navigate to="/patient" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggle={() => setIsCollapsed(!isCollapsed)} 
        width={sidebarWidth}
        setWidth={setSidebarWidth}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <div 
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 lg:ml-[var(--sidebar-width)] w-full"
        style={{ '--sidebar-width': isCollapsed ? '80px' : `${sidebarWidth}px` } as React.CSSProperties}
      >
        <Header onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          <div className="w-full h-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
