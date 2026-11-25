import React, { useEffect } from 'react';
import { useAdminStore } from './store/useAdminStore';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { AdminHeader } from './components/layout/AdminHeader';
import { Dashboard } from './components/dashboard/Dashboard';
import { UsuariosPage } from './components/usuarios/UsuariosPage';
import { BloqueosPage } from './components/bloqueos/BloqueosPage';
import { ReservasPage } from './components/reservas/ReservasPage';
import { ConfiguracionPage } from './components/configuracion/ConfiguracionPage';
import { AccessDenied } from './components/common/AccessDenied';

export const App: React.FC = () => {
  const { activeTab, isAuthorized, checkAuth, cargarMetricas } = useAdminStore();

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { if (isAuthorized) cargarMetricas(); }, [isAuthorized]);

  if (!isAuthorized) return <AccessDenied />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121212] text-slate-800 dark:text-neutral-100 flex transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <AdminHeader />
        <main className="flex-1 w-full max-w-none p-3 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'usuarios' && <UsuariosPage />}
          {activeTab === 'bloqueos' && <BloqueosPage />}
          {activeTab === 'reservas' && <ReservasPage />}
          {activeTab === 'configuracion' && <ConfiguracionPage />}
        </main>
        <footer className="hidden md:block border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-3 text-center text-xs text-slate-500 dark:text-neutral-400">
          © {new Date().getFullYear()} Puerto Analítico — Panel Administrativo • F4.4
        </footer>
      </div>
      <MobileNav />
    </div>
  );
};
export default App;
