import React, { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useConsultoriosStore } from './store/useConsultoriosStore';
import { useDisponibilidadStore } from './store/useDisponibilidadStore';
import { useUiStore } from './store/useUiStore';
import { Header } from './components/common/Header';
import { NavigationTabs } from './components/common/NavigationTabs';
import { Toast } from './components/common/Toast';
import { ConsultoriosSelector } from './components/booking/ConsultoriosSelector';
import { WeeklyCalendar } from './components/booking/WeeklyCalendar';
import { SlotGrid } from './components/booking/SlotGrid';
import { BookingSummary } from './components/booking/BookingSummary';
import { MiAgenda } from './components/agenda/MiAgenda';
import { ReservasList } from './components/reservas/ReservasList';
import { SaldosOverview } from './components/saldos/SaldosOverview';
import { ProductosCatalog } from './components/productos/ProductosCatalog';
import { SoporteForm } from './components/soporte/SoporteForm';
import { ReglasInfo } from './components/soporte/ReglasInfo';
import { Login } from './components/auth/Login';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Lee isLoggedIn del objeto PuertoConfig inyectado por WordPress.
 * En desarrollo (sin WordPress) devuelve true para no bloquear el HMR.
 */
function getIsLoggedIn(): boolean {
  if (typeof window !== 'undefined') {
    // 1. Verificar si estamos en el sandbox
    if (window.location.search.includes('sandbox_admin=true')) {
      return true;
    }

    // 2. Leer la configuración de WordPress
    const cfg = window.puertoConfig || window.PuertoConfig;
    if (cfg) {
      // Normalizar el valor por si WordPress envía "1" o true
      return cfg.isLoggedIn === true || String(cfg.isLoggedIn) === "1";
    }
  }
  return true; // fallback: entorno de desarrollo sin WordPress
}

// ---------------------------------------------------------------------------
// Componente principal de la app (sólo se monta cuando hay sesión activa)
// ---------------------------------------------------------------------------

const MainApp: React.FC = () => {
  const { cargarPerfil, cargarSaldos } = useAuthStore();
  const { cargarConsultorios, consultorioSeleccionadoId } = useConsultoriosStore();
  const { cargarSemana } = useDisponibilidadStore();
  const { activeTab } = useUiStore();

  useEffect(() => {
    // Inicializar datos del terapeuta y consultorios
    cargarPerfil();
    cargarSaldos();
    cargarConsultorios();
  }, []);

  // Cuando se cargue el consultorio por defecto, cargar disponibilidad
  useEffect(() => {
    if (consultorioSeleccionadoId) {
      cargarSemana(consultorioSeleccionadoId);
    }
  }, [consultorioSeleccionadoId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121212] text-slate-800 dark:text-neutral-100 flex flex-col font-sans pb-28 sm:pb-20 transition-colors duration-200">
      {/* Barra superior y navegación */}
      <Header />
      <NavigationTabs />

      {/* Contenido principal según pestaña activa - Mobile-First 100% viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-6">
        {activeTab === 'reservar' && (
          <div className="space-y-3.5 sm:space-y-5">
            <ConsultoriosSelector />
            <WeeklyCalendar />
            <SlotGrid />
            <BookingSummary />
          </div>
        )}

        {activeTab === 'mi-agenda' && <MiAgenda />}

        {activeTab === 'mis-reservas' && <ReservasList />}

        {activeTab === 'mi-saldo' && <SaldosOverview />}

        {activeTab === 'productos' && <ProductosCatalog />}

        {activeTab === 'soporte' && (
          <div className="space-y-4 sm:space-y-5">
            <SoporteForm />
            <ReglasInfo />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-4 text-center text-xs text-slate-500 dark:text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} Puerto Analítico • Sistema de Consultorios para Terapeutas
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            PWA Activa • Hostinger Ready
          </span>
        </div>
      </footer>

      {/* Notificaciones globales tipo Toast */}
      <Toast />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Punto de entrada: guard de autenticación
// ---------------------------------------------------------------------------

export const App: React.FC = () => {
  if (!getIsLoggedIn()) {
    return <Login onSuccess={() => window.location.reload()} />;
  }

  return <MainApp />;
};

export default App;