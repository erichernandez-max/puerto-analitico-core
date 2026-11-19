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
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'usuarios' && <UsuariosPage />}
          {activeTab === 'bloqueos' && <BloqueosPage />}
          {activeTab === 'reservas' && <ReservasPage />}
          {activeTab === 'configuracion' && <ConfiguracionPage />}
        </main>
        <footer className="hidden md:block border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Puerto Analítico — Panel Administrativo • F4.4
        </footer>
      </div>
      <MobileNav />
    </div>
  );
};
export default App;
