import React from 'react';
import { useDisponibilidadStore } from '../../store/useDisponibilidadStore';
import { useConsultoriosStore } from '../../store/useConsultoriosStore';
import { TipoReserva } from '../../types/reserva';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Sun,
  CalendarDays,
  Repeat,
} from 'lucide-react';
import { formatDayHeader, getDaysOfWeek } from '../../utils/dateUtils';

interface ModalidadOption {
  tipo: TipoReserva;
  label: string;
  badge: string;
  colorName: string;
  icon: React.ComponentType<{ className?: string }>;
  borderActive: string;
  bgActive: string;
  textActive: string;
  dotColor: string;
}

const MODALIDADES: ModalidadOption[] = [
  {
    tipo: 'hora',
    label: 'Hora suelta',
    badge: '1 hr',
    colorName: 'Verde',
    icon: Clock,
    borderActive: 'border-emerald-500 ring-2 ring-emerald-400/40',
    bgActive: 'bg-emerald-50 text-emerald-900',
    textActive: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  {
    tipo: 'bloque',
    label: 'Bloque',
    badge: '≥3 hrs',
    colorName: 'Azul',
    icon: Layers,
    borderActive: 'border-blue-500 ring-2 ring-blue-400/40',
    bgActive: 'bg-blue-50 text-blue-900',
    textActive: 'text-blue-700',
    dotColor: 'bg-blue-500',
  },
  {
    tipo: 'turno',
    label: 'Medio turno',
    badge: 'Turno',
    colorName: 'Naranja',
    icon: Sun,
    borderActive: 'border-orange-500 ring-2 ring-orange-400/40',
    bgActive: 'bg-orange-50 text-orange-900',
    textActive: 'text-orange-700',
    dotColor: 'bg-orange-500',
  },
  {
    tipo: 'completo',
    label: 'Día completo',
    badge: 'Todo el día',
    colorName: 'Amarillo',
    icon: CalendarDays,
    borderActive: 'border-amber-500 ring-2 ring-amber-400/40',
    bgActive: 'bg-amber-50 text-amber-900',
    textActive: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
];

export const WeeklyCalendar: React.FC = () => {
  const { consultorioSeleccionadoId } = useConsultoriosStore();
  const {
    semanaLunes,
    tipoReserva,
    esRecurrente,
    semanasRecurrente,
    avanzarSemana,
    retrocederSemana,
    irASemanaActual,
    setTipoReserva,
    setEsRecurrente,
    setSemanasRecurrente,
    isLoading,
  } = useDisponibilidadStore();

  const dias = getDaysOfWeek(semanaLunes);
  const primerDia = dias[0];
  const ultimoDia = dias[dias.length - 1];

  const handlePrev = () => {
    if (consultorioSeleccionadoId) retrocederSemana(consultorioSeleccionadoId);
  };

  const handleNext = () => {
    if (consultorioSeleccionadoId) avanzarSemana(consultorioSeleccionadoId);
  };

  const handleToday = () => {
    if (consultorioSeleccionadoId) irASemanaActual(consultorioSeleccionadoId);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
      {/* Controles de semana y navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navegación de semana */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={handlePrev}
              disabled={isLoading}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-white hover:shadow-xs transition-all disabled:opacity-50"
              title="Semana anterior"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              disabled={isLoading}
              className="min-h-[44px] px-3.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-white hover:shadow-xs rounded-lg transition-all"
            >
              Esta Semana
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-white hover:shadow-xs transition-all disabled:opacity-50"
              title="Semana siguiente"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="text-xs sm:text-sm font-bold text-slate-800">
            {formatDayHeader(primerDia).fechaCorta} – {formatDayHeader(ultimoDia).fechaCorta}
          </div>
        </div>

        {/* Toggle Recurrente */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl min-h-[44px]">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={esRecurrente}
              onChange={(e) => setEsRecurrente(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span className="font-semibold text-xs sm:text-sm text-slate-700 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-emerald-600" />
              Recurrente
            </span>
          </label>

          {esRecurrente && (
            <select
              value={semanasRecurrente}
              onChange={(e) => setSemanasRecurrente(Number(e.target.value))}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2 min-h-[36px] focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold"
            >
              <option value={4}>4 semanas</option>
              <option value={8}>8 semanas</option>
              <option value={12}>12 semanas (Default)</option>
              <option value={16}>16 semanas</option>
              <option value={20}>20 semanas</option>
              <option value={24}>24 semanas</option>
            </select>
          )}
        </div>
      </div>

      {/* Selector de Modalidad y Leyenda de Colores */}
      <div className="pt-2 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Modalidad de Reserva & Leyenda de Colores
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Toca una modalidad para activar su selección
          </span>
        </div>

        {/* Botones de modalidad con código de color (Verde, Azul, Naranja, Amarillo) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MODALIDADES.map((m) => {
            const Icon = m.icon;
            const isSelected = tipoReserva === m.tipo;
            return (
              <button
                key={m.tipo}
                type="button"
                onClick={() => setTipoReserva(m.tipo)}
                className={`min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  isSelected
                    ? `${m.bgActive} ${m.borderActive} shadow-xs font-bold`
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${m.dotColor} flex-shrink-0 shadow-xs`} />
                  <div className="text-left">
                    <span className="block leading-tight">{m.label}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {m.colorName} ({m.badge})
                    </span>
                  </div>
                </div>
                <Icon className={`w-4 h-4 ${isSelected ? m.textActive : 'text-slate-400'}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
