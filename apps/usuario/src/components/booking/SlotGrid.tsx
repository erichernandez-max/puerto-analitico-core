import React from 'react';
import { useDisponibilidadStore } from '../../store/useDisponibilidadStore';
import { useConsultoriosStore } from '../../store/useConsultoriosStore';
import { getDaysOfWeek, formatDayHeader, formatDateToYMD } from '../../utils/dateUtils';
import { Loader } from '../common/Loader';
import { SlotDisponibilidad } from '../../types/disponibilidad';
import { Wrench, Check, Ban, ChevronRight } from 'lucide-react';

export const SlotGrid: React.FC = () => {
  const { consultorios, consultorioSeleccionadoId, seleccionarConsultorio } =
    useConsultoriosStore();
  const {
    semanaLunes,
    slots,
    slotsSeleccionados,
    tipoReserva,
    toggleSlot,
    isLoading,
    error,
    vistaModo,
    fechaDiaSeleccionado,
    slotsDiaTodosConsultorios,
    cargandoDia,
  } = useDisponibilidadStore();

  const dias = getDaysOfWeek(semanaLunes);
  const hoyStr = formatDateToYMD(new Date());

  const consultorioActivo = consultorios.find(
    (c) => c.id === consultorioSeleccionadoId
  );

  // Agrupar slots por fecha para la vista semanal
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

  if (isLoading && vistaModo === 'semana') {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-slate-200 dark:border-neutral-800 shadow-xs">
        <Loader mensaje="Consultando disponibilidad física de slots..." />
      </div>
    );
  }

  if (cargandoDia && vistaModo === 'dia') {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-slate-200 dark:border-neutral-800 shadow-xs">
        <Loader mensaje="Cargando disponibilidad de los 5 consultorios..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-rose-200 dark:border-rose-900/60 shadow-xs text-center">
        <p className="text-sm text-rose-600 dark:text-rose-400 font-semibold">{error}</p>
      </div>
    );
  }

  // Estilo intenso de selección según tipoReserva
  const getSelectedSeatStyle = () => {
    switch (tipoReserva) {
      case 'bloque':
        return 'bg-blue-600 dark:bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-300 dark:ring-blue-700';
      case 'turno':
        return 'bg-orange-500 dark:bg-orange-600 border-orange-400 text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-300 dark:ring-orange-700';
      case 'completo':
        return 'bg-amber-500 dark:bg-amber-600 border-amber-400 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-300 dark:ring-amber-700';
      case 'hora':
      default:
        return 'bg-emerald-600 dark:bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300 dark:ring-emerald-700';
    }
  };

  const renderSlotItem = (
    slot: SlotDisponibilidad,
    accentColor: string = consultorioActivo?.color || '#2E7D32',
    consultorioId?: number
  ) => {
    const slotConsultorioId = consultorioId || consultorioSeleccionadoId || undefined;
    const isSelected = slotsSeleccionados.some(
      (s) =>
        s.fecha === slot.fecha &&
        s.hora_inicio === slot.hora_inicio &&
        (!s.consultorio_id || !slotConsultorioId || s.consultorio_id === slotConsultorioId)
    );

    const handleClick = () => {
      if (consultorioId && consultorioId !== consultorioSeleccionadoId) {
        seleccionarConsultorio(consultorioId);
      }
      toggleSlot(slot, slotConsultorioId);
    };

    const hIni = parseInt(slot.hora_inicio.split(':')[0], 10);
    const hFin = parseInt(slot.hora_fin.split(':')[0], 10);

    if (slot.disponible) {
      return (
        <button
          key={`${slot.fecha}-${slot.hora_inicio}`}
          type="button"
          onClick={handleClick}
          className={`group relative w-full min-h-[48px] py-2 px-2.5 rounded-xl border text-left transition-all duration-150 flex items-center justify-between active:scale-95 ${
            isSelected
              ? `${getSelectedSeatStyle()} scale-[1.01]`
              : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-100 hover:border-slate-400 dark:hover:border-neutral-600 hover:bg-slate-50 dark:hover:bg-neutral-800/50 shadow-2xs'
          }`}
          style={!isSelected ? { borderLeftColor: accentColor, borderLeftWidth: '4px' } : undefined}
          title={`de ${hIni} a ${hFin} (Disponible)`}
        >
          <div className="flex flex-col min-w-0">
            <span className="font-black text-sm sm:text-base leading-none tracking-tight">
              {hIni}
            </span>
            <span
              className={`text-[10px] font-medium leading-tight mt-0.5 ${
                isSelected ? 'text-white/80' : 'text-slate-500 dark:text-neutral-400'
              }`}
            >
              de {hIni} a {hFin}
            </span>
          </div>

          <div className="flex items-center space-x-1 flex-shrink-0">
            {isSelected ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <span className="text-[10px] lowercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                libre
              </span>
            )}
          </div>
        </button>
      );
    }

    // Slot no disponible
    const esMantenimiento = slot.motivo_no_disponible === 'mantenimiento';
    return (
      <div
        key={`${slot.fecha}-${slot.hora_inicio}`}
        className={`w-full min-h-[48px] py-2 px-2.5 rounded-xl border text-left flex items-center justify-between cursor-not-allowed select-none opacity-50 ${
          esMantenimiento
            ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400'
            : 'bg-slate-100 dark:bg-neutral-800/40 border-slate-200 dark:border-neutral-800 text-slate-400 dark:text-neutral-500'
        }`}
        title={
          esMantenimiento
            ? 'Mantenimiento obligatorio semanal (Regla R17)'
            : 'Horario previamente reservado'
        }
      >
        <div className="flex flex-col min-w-0">
          <span className="line-through text-xs font-semibold leading-tight">de {hIni} a {hFin}</span>
        </div>
        <div className="flex items-center space-x-1">
          {esMantenimiento ? (
            <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          ) : (
            <Ban className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
          )}
          <span className="text-[9px] uppercase font-bold tracking-wider">
            {esMantenimiento ? 'Mant.' : 'Ocup.'}
          </span>
        </div>
      </div>
    );
  };

  const renderDiaColumnSemana = (dia: Date) => {
    const fechaStr = formatDateToYMD(dia);
    const { diaNombre, diaNumero, mesNombre } = formatDayHeader(dia);
    const slotsDelDia = slotsPorFecha[fechaStr] || [];
    const esSabado = dia.getDay() === 6;
    const isToday = fechaStr === hoyStr;

    return (
      <div
        key={fechaStr}
        className={`flex flex-col bg-slate-50/80 dark:bg-neutral-800/50 rounded-2xl p-2 sm:p-3 border shadow-2xs transition-colors flex-shrink-0 snap-start ${
          isToday
            ? 'border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/20'
            : 'border-slate-200/80 dark:border-neutral-700/80'
        } w-[calc((100vw-3.2rem)/3)] min-w-[105px] sm:w-auto sm:min-w-0`}
      >
        {/* Cabecera del día (Google / Apple Calendar pattern: número más grande que nombre) */}
        <div className="text-center pb-2 mb-2 border-b border-slate-200 dark:border-neutral-700/80">
          <span className="block text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
            {diaNombre}
          </span>
          <div className="flex items-center justify-center gap-1 my-0.5">
            <span className={`text-base sm:text-lg font-black leading-tight ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-neutral-100'}`}>
              {diaNumero}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
              {mesNombre}
            </span>
            {isToday && (
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 ml-0.5" title="Hoy" />
            )}
          </div>
          <span className="inline-block text-[9px] text-slate-400 dark:text-neutral-400 mt-0.5 bg-white dark:bg-neutral-900 px-1.5 py-0.2 rounded-full border border-slate-200 dark:border-neutral-700">
            {esSabado ? '08–17h' : '08–21h'}
          </span>
        </div>

        {/* Cuadrícula de slots */}
        <div className="flex flex-col gap-3 flex-1">
          {slotsDelDia.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-neutral-500">
              Sin slots
            </div>
          ) : (
            slotsDelDia.map((slot) => renderSlotItem(slot))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3 sm:p-5 border border-slate-200 dark:border-neutral-800 shadow-xs overflow-hidden space-y-4 transition-colors">
      {/* Barra superior: Consultorio activo y Leyenda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800 gap-2">
        <div className="flex items-center space-x-2">
          <span
            className="w-3.5 h-3.5 rounded-full shadow-inner flex-shrink-0"
            style={{ backgroundColor: consultorioActivo?.color || '#2E7D32' }}
          />
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-neutral-100">
            {vistaModo === 'semana'
              ? `Agenda de disponibilidad para el consultorio ${consultorioActivo?.nombre || 'General'}`
              : `Disponibilidad por Consultorios`}
          </span>
        </div>

        {/* Leyenda de estados */}
        <div className="flex items-center flex-wrap gap-2.5 text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-600" />
            libre
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
            Selección
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-neutral-700" />
            Ocupado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-300 dark:bg-amber-600" />
            Mant. (R17)
          </span>
        </div>
      </div>

      {/* VISTA 1: SEMANAL (Mobile: 3 días con swipe snap-x / Desktop: 6 días) */}
      {vistaModo === 'semana' && (
        <div className="space-y-2">
          {/* Indicador de Swipe para móvil */}
          <div className="flex sm:hidden items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 px-1">
            <span>Mostrando 3 días • Desliza ➔</span>
            <span className="font-semibold text-slate-700 dark:text-neutral-300 flex items-center">
              Lun-Mié / Jue-Sáb <ChevronRight className="w-3.5 h-3.5 inline" />
            </span>
          </div>

          {/* Contenedor con overflow-x-auto snap-x */}
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 no-scrollbar pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible">
            {dias.map((dia) => renderDiaColumnSemana(dia))}
          </div>
        </div>
      )}

      {/* VISTA 2: POR DÍA - 5 CONSULTORIOS EN COLUMNAS (Selección rápida) */}
      {vistaModo === 'dia' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-neutral-300">
            <span className="font-bold">
              Elige el mejor horario para tu reservación en cualquiera de los 5 consultorios, para el día {
                formatDayHeader(fechaDiaSeleccionado ? new Date(fechaDiaSeleccionado + 'T00:00:00') : new Date()).fechaCompleta
              }:
            </span>
            <span className="text-[11px] text-slate-400 sm:hidden">
              Desliza lateralmente ➔
            </span>
          </div>

          {/* Grid de 5 columnas con snap-x en móvil */}
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 no-scrollbar pb-3 sm:grid sm:grid-cols-5 sm:overflow-visible">
            {consultorios.map((c) => {
              const slotsConsultorio = slotsDiaTodosConsultorios[c.id] || [];
              const libres = slotsConsultorio.filter((s) => s.disponible).length;

              // Sprint 3: Bug de Bloque: Si hay selección en un consultorio, los otros 4 se oscurecen
              const consultorioConSeleccion = slotsSeleccionados.length > 0
                ? (slotsSeleccionados[0].consultorio_id || consultorioSeleccionadoId)
                : null;
              const estaOscurecido = consultorioConSeleccion !== null && consultorioConSeleccion !== c.id;

              return (
                <div
                  key={c.id}
                  className={`flex flex-col bg-slate-50/80 dark:bg-neutral-800/50 rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-neutral-700/80 shadow-2xs flex-shrink-0 snap-start w-[calc((100vw-3.5rem)/2.4)] min-w-[130px] sm:w-auto sm:min-w-0 transition-all duration-200 ${
                    estaOscurecido ? 'opacity-30 grayscale-[60%] pointer-events-none' : ''
                  }`}
                >
                  {/* Encabezado del Consultorio */}
                  <div className="text-center pb-2.5 mb-2.5 border-b border-slate-200 dark:border-neutral-700/80">
                    <div className="flex items-center justify-center space-x-1.5 mb-1">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-neutral-100 truncate">
                        {c.nombre}
                      </span>
                    </div>
                    <span className="inline-block text-[10px] font-semibold text-slate-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-neutral-700">
                      {libres} disponibles
                    </span>
                  </div>

                  {/* Slots de este consultorio */}
                  <div className="flex flex-col gap-3 flex-1">
                    {slotsConsultorio.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 dark:text-neutral-500">
                        Sin datos
                      </div>
                    ) : (
                      slotsConsultorio.map((slot) =>
                        renderSlotItem(slot, c.color, c.id)
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
