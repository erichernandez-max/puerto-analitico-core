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
import { ReservasList } from './components/reservas/ReservasList';
import { SaldosOverview } from './components/saldos/SaldosOverview';
import { ProductosCatalog } from './components/productos/ProductosCatalog';
import { SoporteForm } from './components/soporte/SoporteForm';
import { ReglasInfo } from './components/soporte/ReglasInfo';

export const App: React.FC = () => {
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans pb-24 sm:pb-16">
      {/* Barra superior y navegación */}
      <Header />
      <NavigationTabs />

      {/* Contenido principal según pestaña activa */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {activeTab === 'reservar' && (
          <div className="space-y-4 sm:space-y-5">
            <ConsultoriosSelector />
            <WeeklyCalendar />
            <SlotGrid />
            <BookingSummary />
          </div>
        )}

        {activeTab === 'mis-reservas' && <ReservasList />}

        {activeTab === 'mi-saldo' && <SaldosOverview />}

        {activeTab === 'productos' && <ProductosCatalog />}

        {activeTab === 'soporte' && (
          <div className="space-y-5">
            <SoporteForm />
            <ReglasInfo />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} Puerto Analítico • Sistema de Consultorios para Terapeutas
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
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
export default App;
