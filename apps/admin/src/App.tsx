import React, { useEffect } from 'react';
import { useAdminStore } from './store/useAdminStore';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { AdminHeader } from './components/layout/AdminHeader';
import { Dashboard } from './components/dashboard/Dashboard';
import { PlaceholderPage } from './components/pages/PlaceholderPage';
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
          {activeTab === 'usuarios' && <PlaceholderPage title="Gestión de Usuarios" description="Administra terapeutas, ajusta saldos, congela cuentas y revisa el historial de cada usuario." />}
          {activeTab === 'reservas' && <PlaceholderPage title="Gestión de Reservas" description="Consulta, filtra y administra todas las reservas del sistema. Crea bloqueos y gestiona mantenimientos." />}
          {activeTab === 'configuracion' && <PlaceholderPage title="Configuración" description="Ajusta reglas del sistema, horarios, precios de paquetes y parámetros generales de Puerto Analítico." />}
        </main>
        <footer className="hidden md:block border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Puerto Analítico — Panel Administrativo • F4.1
        </footer>
      </div>
      <MobileNav />
    </div>
  );
};
export default App;
