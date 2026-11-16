import React, { useEffect } from 'react';
import { useReservasStore } from '../../store/useReservasStore';
import { useUiStore } from '../../store/useUiStore';
import { ReservaCard } from './ReservaCard';
import { Loader } from '../common/Loader';
import { CalendarX, Plus, Filter } from 'lucide-react';

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'confirmada', label: 'Confirmadas' },
  { id: 'consumida', label: 'Consumidas' },
  { id: 'cancelada', label: 'Canceladas' },
];

export const ReservasList: React.FC = () => {
  const { reservas, filtroEstado, setFiltroEstado, cargarReservas, isLoading, error } =
    useReservasStore();
  const { setActiveTab } = useUiStore();

  useEffect(() => {
    cargarReservas();
  }, []);

  return (
    <div className="space-y-4">
      {/* Header con filtros */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs sm:text-sm font-bold text-slate-900">
            Filtrar reservas:
          </span>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto no-scrollbar">
          {FILTROS.map((f) => {
            const isActive = filtroEstado === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFiltroEstado(f.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm">
          <Loader mensaje="Cargando tu historial de reservas..." />
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl p-8 border border-rose-200 shadow-sm text-center">
          <p className="text-sm text-rose-600 font-semibold">{error}</p>
        </div>
      ) : reservas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <CalendarX className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              No tienes reservas en este momento
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Puedes seleccionar un consultorio y horario disponible en el calendario interactivo.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('reservar')}
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Hacer una Reserva</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {reservas.map((reserva) => (
            <ReservaCard key={reserva.id} reserva={reserva} />
          ))}
        </div>
      )}
    </div>
  );
};
