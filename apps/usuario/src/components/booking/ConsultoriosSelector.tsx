import React from 'react';
import { useConsultoriosStore } from '../../store/useConsultoriosStore';
import { useDisponibilidadStore } from '../../store/useDisponibilidadStore';
import { DoorClosed, Check } from 'lucide-react';

export const ConsultoriosSelector: React.FC = () => {
  const { consultorios, consultorioSeleccionadoId, seleccionarConsultorio } =
    useConsultoriosStore();
  const { cargarSemana, limpiarSeleccion } = useDisponibilidadStore();

  const handleSeleccionar = (id: number) => {
    seleccionarConsultorio(id);
    limpiarSeleccion();
    cargarSemana(id);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 sm:p-5 border border-slate-200 dark:border-neutral-800 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <DoorClosed className="w-5 h-5 text-slate-700 dark:text-neutral-300" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-neutral-100">
            Consultorios
          </h2>
        </div>
        <span className="text-xs text-slate-500 dark:text-neutral-400 hidden sm:inline">
          Consultorios para reservar
        </span>
      </div>

      {/* Grid horizontal en móvil o 5 columnas en desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
        {consultorios.map((c) => {
          const isSelected = c.id === consultorioSeleccionadoId;
          const disp = c.disponibilidad_semanal;
          const ocupacionPct = disp?.porcentaje_ocupacion ?? 0;

          const nombreColor = c.nombre.replace(/^consultorio\s+/i, '');

          return (
            <button
              key={c.id}
              onClick={() => handleSeleccionar(c.id)}
              className={`min-h-[48px] flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-150 active:scale-95 ${
                isSelected
                  ? 'border-slate-900 dark:border-neutral-200 bg-slate-50/80 dark:bg-neutral-800/80 ring-2 ring-slate-900/10 dark:ring-neutral-200/20 shadow-xs'
                  : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-slate-300 dark:hover:border-neutral-700 hover:bg-slate-50/50 dark:hover:bg-neutral-800/40'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center space-x-2 min-w-0">
                  {/* Color del consultorio solo como acento puntual */}
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-neutral-100 truncate">
                    {nombreColor}
                  </span>
                </div>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                {disp?.horas_disponibles ?? 72}h libres
              </div>

              {/* Barra sutil de ocupación semanal */}
              <div className="w-full bg-slate-200 dark:bg-neutral-700/60 h-1 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, ocupacionPct)}%`,
                    backgroundColor: c.color,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
