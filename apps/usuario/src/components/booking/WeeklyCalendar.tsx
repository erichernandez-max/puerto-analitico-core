import React, { useEffect } from 'react';
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
  Calendar as CalendarIcon,
  Columns3,
} from 'lucide-react';
import { formatDayHeader, getDaysOfWeek, formatDateToYMD } from '../../utils/dateUtils';

interface ModalidadOption {
  tipo: TipoReserva;
  label: string;
  badge: string;
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
    badge: 'por horas sueltas',
    icon: Clock,
    borderActive: 'border-amber-500 ring-2 ring-amber-400/40',
    bgActive: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
    textActive: 'text-amber-700 dark:text-amber-400',
    dotColor: 'bg-amber-400',
  },
  {
    tipo: 'bloque',
    label: 'Bloque',
    badge: '3 horas o más consecutivas',
    icon: Layers,
    borderActive: 'border-purple-500 ring-2 ring-purple-400/40',
    bgActive: 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200',
    textActive: 'text-purple-700 dark:text-purple-400',
    dotColor: 'bg-purple-500',
  },
  {
    tipo: 'turno',
    label: 'Medio turno',
    badge: 'mediodía',
    icon: Sun,
    borderActive: 'border-orange-500 ring-2 ring-orange-400/40',
    bgActive: 'bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200',
    textActive: 'text-orange-700 dark:text-orange-400',
    dotColor: 'bg-orange-500',
  },
  {
    tipo: 'completo',
    label: 'Día completo',
    badge: 'todo el día',
    icon: CalendarDays,
    borderActive: 'border-rose-500 ring-2 ring-rose-400/40',
    bgActive: 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200',
    textActive: 'text-rose-700 dark:text-rose-400',
    dotColor: 'bg-rose-500',
  },
];

export const WeeklyCalendar: React.FC = () => {
  const { consultorios, consultorioSeleccionadoId } = useConsultoriosStore();
  const {
    semanaLunes,
    tipoReserva,
    esRecurrente,
    semanasRecurrente,
    vistaModo,
    fechaDiaSeleccionado,
    setVistaModo,
    setFechaDiaSeleccionado,
    cargarDiaTodosConsultorios,
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
  const hoyStr = formatDateToYMD(new Date());

  const handlePrev = () => {
    if (consultorioSeleccionadoId) retrocederSemana(consultorioSeleccionadoId);
  };

  const handleNext = () => {
    if (consultorioSeleccionadoId) avanzarSemana(consultorioSeleccionadoId);
  };

  const handleToday = () => {
    if (consultorioSeleccionadoId) {
      irASemanaActual(consultorioSeleccionadoId);
      setFechaDiaSeleccionado(hoyStr);
    }
  };

  // Cuando cambie a vista de día o cambie la fecha seleccionada, cargar los 5 consultorios
  useEffect(() => {
    if (vistaModo === 'dia' && consultorios.length > 0) {
      const cIds = consultorios.map((c) => c.id);
      cargarDiaTodosConsultorios(fechaDiaSeleccionado || hoyStr, cIds);
    }
  }, [vistaModo, fechaDiaSeleccionado, consultorios]);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 sm:p-5 border border-slate-200 dark:border-neutral-800 shadow-xs space-y-4 transition-colors">
      {/* Selector de Modo de Visualización (Google/Apple Calendar style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-neutral-800 rounded-xl gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setVistaModo('semana')}
            className={`flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              vistaModo === 'semana'
                ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-neutral-100 shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Vista Semanal</span>
          </button>
          <button
            type="button"
            onClick={() => setVistaModo('dia')}
            className={`flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              vistaModo === 'dia'
                ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-neutral-100 shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            <Columns3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Por Día (5 Consultorios)</span>
          </button>
        </div>

        {/* Toggle Recurrente */}
        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/60 px-3 py-1.5 rounded-xl min-h-[48px]">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={esRecurrente}
              onChange={(e) => setEsRecurrente(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-neutral-600 focus:ring-emerald-500 bg-white dark:bg-neutral-900"
            />
            <span className="font-semibold text-xs text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Recurrente
            </span>
          </label>

          {esRecurrente && (
            <select
              value={semanasRecurrente}
              onChange={(e) => setSemanasRecurrente(Number(e.target.value))}
              className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 text-xs rounded-lg px-2 min-h-[38px] focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold"
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

      {/* Controles de semana y navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navegación de semana con espacio entre botones */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={isLoading}
            className="min-h-[48px] px-3.5 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 transition-all disabled:opacity-50 active:scale-95 text-xs font-semibold"
            title="Semana anterior"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Semana anterior</span>
          </button>
          <button
            onClick={handleToday}
            disabled={isLoading}
            className="min-h-[48px] px-4 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 transition-all active:scale-95"
          >
            Hoy
          </button>
          <button
            onClick={handleNext}
            disabled={isLoading}
            className="min-h-[48px] px-3.5 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 transition-all disabled:opacity-50 active:scale-95 text-xs font-semibold"
            title="Semana siguiente"
            aria-label="Semana siguiente"
          >
            <span>Semana siguiente</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Leyenda de fechas visibles */}
        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-neutral-100">
          Visualizar desde el día {primerDia ? formatDayHeader(primerDia).fechaCorta : ''} al día {ultimoDia ? formatDayHeader(ultimoDia).fechaCorta : ''}
        </div>
      </div>

      {/* Selector de días de la semana (Destacado para Vista de Día) */}
      {vistaModo === 'dia' && (
        <div className="space-y-1.5 pt-1">
          <div className="text-xs font-bold text-slate-700 dark:text-neutral-300">
            Elige el día en que quieres reservar:
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {dias.map((d) => {
              const dStr = formatDateToYMD(d);
              const { diaNombre, fechaCorta, diaNumero } = formatDayHeader(d);
              const isSelected = fechaDiaSeleccionado === dStr;
              const isToday = hoyStr === dStr;

              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => setFechaDiaSeleccionado(dStr)}
                  className={`min-h-[56px] p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative active:scale-95 ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-slate-900 dark:border-neutral-100 shadow-sm font-bold'
                      : 'bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800 font-medium'
                  }`}
                >
                  <span className="text-[10px] uppercase font-semibold leading-none opacity-80">{diaNombre}</span>
                  <span className="text-base sm:text-lg font-black leading-tight my-0.5">
                    {diaNumero}
                  </span>
                  <span className={`text-[10px] leading-none ${isSelected ? 'text-slate-200 dark:text-neutral-700' : 'text-slate-500 dark:text-neutral-400'}`}>
                    {fechaCorta}
                  </span>
                  {isToday && (
                    <span className="absolute -top-1.5 right-1.5 px-1 py-0.2 bg-blue-600 text-white text-[9px] font-bold rounded-full">
                      Hoy
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selector de Modalidad y Leyenda de Colores */}
      <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
            ¿Qué tipo de reserva quieres hacer?
          </span>
          <span className="text-[11px] text-slate-400 dark:text-neutral-500 hidden sm:inline">
            Toca una modalidad para activar su selección
          </span>
        </div>

        {/* Botones de modalidad con espaciado gap-3 y min-h-[48px] */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MODALIDADES.map((m) => {
            const Icon = m.icon;
            const isSelected = tipoReserva === m.tipo;
            return (
              <button
                key={m.tipo}
                type="button"
                onClick={() => setTipoReserva(m.tipo)}
                className={`min-h-[48px] flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
                  isSelected
                    ? `${m.bgActive} ${m.borderActive} shadow-xs font-bold`
                    : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className={`w-3 h-3 rounded-full ${m.dotColor} flex-shrink-0 shadow-xs`} />
                  <div className="text-left min-w-0">
                    <span className="block leading-tight truncate">{m.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-normal">
                      {m.badge}
                    </span>
                  </div>
                </div>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? m.textActive : 'text-slate-400 dark:text-neutral-500'}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
