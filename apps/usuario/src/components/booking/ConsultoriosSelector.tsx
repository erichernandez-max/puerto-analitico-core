import React from 'react';
import { useConsultoriosStore } from '../../store/useConsultoriosStore';
import { useDisponibilidadStore } from '../../store/useDisponibilidadStore';
import { DoorClosed } from 'lucide-react';

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
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center space-x-2">
          <DoorClosed className="w-5 h-5 text-slate-700" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Selecciona un Consultorio
          </h2>
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          5 Consultorios disponibles (72h vendibles/sem)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
        {consultorios.map((c) => {
          const isSelected = c.id === consultorioSeleccionadoId;
          const disp = c.disponibilidad_semanal;
          const ocupacionPct = disp?.porcentaje_ocupacion ?? 0;

          return (
            <button
              key={c.id}
              onClick={() => handleSeleccionar(c.id)}
              className={`min-h-[44px] flex flex-col items-start p-3 sm:p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-inner flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="font-bold text-sm text-slate-900">{c.nombre}</span>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-slate-900" />
                )}
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                {disp?.horas_disponibles ?? 72}h libres
              </div>

              {/* Barra de ocupación semanal */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, ocupacionPct)}%`,
                    backgroundColor: c.color,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                {ocupacionPct}% ocupado
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
