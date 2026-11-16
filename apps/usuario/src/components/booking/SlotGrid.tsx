import React, { useState } from 'react';
import { useDisponibilidadStore } from '../../store/useDisponibilidadStore';
import { useConsultoriosStore } from '../../store/useConsultoriosStore';
import { getDaysOfWeek, formatDayHeader, formatDateToYMD } from '../../utils/dateUtils';
import { Loader } from '../common/Loader';
import { SlotDisponibilidad } from '../../types/disponibilidad';
import { Wrench, Check, Ban, Calendar, Monitor } from 'lucide-react';

export const SlotGrid: React.FC = () => {
  const { consultorios, consultorioSeleccionadoId } = useConsultoriosStore();
  const {
    semanaLunes,
    slots,
    slotsSeleccionados,
    tipoReserva,
    toggleSlot,
    isLoading,
    error,
  } = useDisponibilidadStore();

  const dias = getDaysOfWeek(semanaLunes);
  const [selectedMobileDayIndex, setSelectedMobileDayIndex] = useState<number>(0);
  const [vistaMovilCompleta, setVistaMovilCompleta] = useState<boolean>(false);

  const consultorioActivo = consultorios.find(
    (c) => c.id === consultorioSeleccionadoId
  );

  // Agrupar slots por fecha
  const slotsPorFecha = React.useMemo(() => {
    const mapa: Record<string, SlotDisponibilidad[]> = {};
    dias.forEach((d) => {
      mapa[formatDateToYMD(d)] = [];
    });
    slots.forEach((s) => {
      if (mapa[s.fecha]) {
        mapa[s.fecha].push(s);
      }
    });
    return mapa;
  }, [slots, dias]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <Loader mensaje="Consultando disponibilidad física de slots..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-rose-200 shadow-sm text-center">
        <p className="text-sm text-rose-600 font-semibold">{error}</p>
      </div>
    );
  }

  // Estilo intenso de selección según tipoReserva
  const getSelectedSeatStyle = () => {
    switch (tipoReserva) {
      case 'bloque':
        return 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-300 ring-offset-1';
      case 'turno':
        return 'bg-orange-500 border-orange-400 text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-300 ring-offset-1';
      case 'completo':
        return 'bg-amber-500 border-amber-400 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-300 ring-offset-1';
      case 'hora':
      default:
        return 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300 ring-offset-1';
    }
  };

  const getHeadrestColor = () => {
    switch (tipoReserva) {
      case 'bloque':
        return 'bg-blue-400';
      case 'turno':
        return 'bg-orange-300';
      case 'completo':
        return 'bg-amber-300';
      case 'hora':
      default:
        return 'bg-emerald-400';
    }
  };

  const renderSlotSeat = (slot: SlotDisponibilidad) => {
    const isSelected = slotsSeleccionados.some(
      (s) => s.fecha === slot.fecha && s.hora_inicio === slot.hora_inicio
    );

    if (slot.disponible) {
      return (
        <button
          key={slot.hora_inicio}
          type="button"
          onClick={() => toggleSlot(slot)}
          className={`group relative w-full min-h-[48px] py-1.5 px-2 rounded-t-2xl rounded-b-xl border-2 text-center transition-all duration-150 flex flex-col items-center justify-between active:scale-95 ${
            isSelected
              ? `${getSelectedSeatStyle()} scale-[1.02]`
              : 'bg-white border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50 shadow-xs'
          }`}
          title={`${slot.hora_inicio} - ${slot.hora_fin} (Disponible)`}
        >
          {/* Cabecera / Respaldo de asiento de cine */}
          <div
            className={`w-8 h-1 rounded-full mb-0.5 transition-colors ${
              isSelected ? getHeadrestColor() : 'bg-slate-300 group-hover:bg-slate-400'
            }`}
          />

          {/* Horario y estado */}
          <div className="flex items-center justify-center space-x-1">
            <span className="font-bold text-xs tracking-tight">{slot.hora_inicio}</span>
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>

          <span
            className={`text-[10px] font-medium leading-none ${
              isSelected ? 'text-white/80' : 'text-slate-400 group-hover:text-slate-600'
            }`}
          >
            {slot.hora_fin}
          </span>
        </button>
      );
    }

    // Slot no disponible (Ocupado o Mantenimiento)
    const esMantenimiento = slot.motivo_no_disponible === 'mantenimiento';
    return (
      <div
        key={slot.hora_inicio}
        className={`w-full min-h-[48px] py-1.5 px-2 rounded-t-2xl rounded-b-xl border text-center flex flex-col items-center justify-between cursor-not-allowed select-none opacity-60 ${
          esMantenimiento
            ? 'bg-amber-50/80 border-amber-200 text-amber-800'
            : 'bg-slate-100 border-slate-200 text-slate-400'
        }`}
        title={
          esMantenimiento
            ? 'Bloqueo semanal obligatorio de mantenimiento (Regla R17)'
            : 'Horario previamente reservado'
        }
      >
        <div
          className={`w-7 h-1 rounded-full mb-0.5 ${
            esMantenimiento ? 'bg-amber-300' : 'bg-slate-300'
          }`}
        />
        <div className="flex items-center justify-center space-x-1">
          <span className="line-through text-xs font-semibold">{slot.hora_inicio}</span>
          {esMantenimiento ? (
            <Wrench className="w-3 h-3 text-amber-600" />
          ) : (
            <Ban className="w-3 h-3 text-slate-400" />
          )}
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider">
          {esMantenimiento ? 'Mant.' : 'Ocup.'}
        </span>
      </div>
    );
  };

  const renderDiaColumn = (dia: Date) => {
    const fechaStr = formatDateToYMD(dia);
    const { diaNombre, fechaCorta } = formatDayHeader(dia);
    const slotsDelDia = slotsPorFecha[fechaStr] || [];
    const esSabado = dia.getDay() === 6;

    return (
      <div
        key={fechaStr}
        className="flex flex-col bg-slate-50/80 rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-xs"
      >
        {/* Cabecera del día */}
        <div className="text-center pb-2.5 mb-2.5 border-b border-slate-200">
          <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            {diaNombre}
          </span>
          <span className="block text-xs font-semibold text-slate-500">
            {fechaCorta}
          </span>
          <span className="inline-block text-[10px] text-slate-400 mt-0.5 bg-white px-2 py-0.5 rounded-full border border-slate-200">
            {esSabado ? '08:00–17:00 (9h)' : '08:00–21:00 (13h)'}
          </span>
        </div>

        {/* Cuadrícula de Asientos de Cine */}
        <div className="grid grid-cols-1 gap-2 flex-1">
          {slotsDelDia.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Sin slots disponibles
            </div>
          ) : (
            slotsDelDia.map((slot) => renderSlotSeat(slot))
          )}
        </div>
      </div>
    );
  };

  const diaActivoMovil = dias[selectedMobileDayIndex] || dias[0];

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Barra superior de cine: Estado y Consultorio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <span
            className="w-3.5 h-3.5 rounded-full shadow-inner flex-shrink-0"
            style={{ backgroundColor: consultorioActivo?.color || '#2E7D32' }}
          />
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            Asientos de {consultorioActivo?.nombre || 'Consultorio General'}
          </span>
        </div>

        {/* Indicadores de estado de asiento */}
        <div className="flex items-center flex-wrap gap-3 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-t-md rounded-b-xs bg-white border border-slate-300" />
            Libre
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-t-md rounded-b-xs bg-emerald-600" />
            Tu Selección
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-t-md rounded-b-xs bg-slate-200" />
            Ocupado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-t-md rounded-b-xs bg-amber-200" />
            Mantenimiento (R17)
          </span>
        </div>
      </div>

      {/* Simulación de 'Pantalla de Cine' / Entrada Consultorio */}
      <div className="w-full max-w-md mx-auto text-center pt-1 pb-2">
        <div className="h-1.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent rounded-full mb-1 opacity-75" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center justify-center gap-1">
          <Monitor className="w-3 h-3" />
          Frente del Consultorio / Área de Atención
        </span>
      </div>

      {/* Selector de día para Móviles (Mobile-First) */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Selecciona el día:
          </span>
          <button
            type="button"
            onClick={() => setVistaMovilCompleta(!vistaMovilCompleta)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
          >
            {vistaMovilCompleta ? 'Ver por día' : 'Ver semana entera'}
          </button>
        </div>

        {!vistaMovilCompleta && (
          <div className="grid grid-cols-3 gap-1.5">
            {dias.map((d, index) => {
              const { diaNombre, fechaCorta } = formatDayHeader(d);
              const isSelected = selectedMobileDayIndex === index;
              return (
                <button
                  key={formatDateToYMD(d)}
                  type="button"
                  onClick={() => setSelectedMobileDayIndex(index)}
                  className={`min-h-[44px] py-2 px-1.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span className="block text-xs uppercase leading-tight">{diaNombre}</span>
                  <span className={`block text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {fechaCorta}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* En vista de un día en móvil: mostrar grid de asientos cómodo de 2 columnas */}
        {!vistaMovilCompleta ? (
          <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200">
            <div className="text-center pb-2.5 mb-2.5 border-b border-slate-200">
              <span className="text-sm font-bold text-slate-900 uppercase">
                {formatDayHeader(diaActivoMovil).diaNombre} – {formatDayHeader(diaActivoMovil).fechaCorta}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(slotsPorFecha[formatDateToYMD(diaActivoMovil)] || []).map((slot) =>
                renderSlotSeat(slot)
              )}
            </div>
          </div>
        ) : (
          /* Vista semanal completa en móvil (colapsada verticalmente) */
          <div className="space-y-3">
            {dias.map((d) => renderDiaColumn(d))}
          </div>
        )}
      </div>

      {/* Grid de 6 columnas para Pantallas Tablet y Desktop (Lunes a Sábado) */}
      <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-2.5 lg:gap-3">
        {dias.map((dia) => renderDiaColumn(dia))}
      </div>

      {/* Nota de Regla R1 */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-1.5">
        <span className="flex items-center gap-1.5 text-center sm:text-left">
          <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
          Regla R1: Domingos cerrados (0 horas). Capacidad física semanal: 74h (72h vendibles + 2h mantenimiento semanal R17).
        </span>
      </div>
    </div>
  );
};
