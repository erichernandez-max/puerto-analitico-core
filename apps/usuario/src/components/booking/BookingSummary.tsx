import React, { useState } from 'react';
import { useDisponibilidadStore } from '../../store/useDisponibilidadStore';
import { useConsultoriosStore } from '../../store/useConsultoriosStore';
import { useAuthStore } from '../../store/useAuthStore';
import { BookingModal } from './BookingModal';
import { Calendar, Clock, AlertCircle, ArrowRight, Trash2, CheckCircle2 } from 'lucide-react';

export const BookingSummary: React.FC = () => {
  const { consultorios, consultorioSeleccionadoId } = useConsultoriosStore();
  const { perfil, saldos } = useAuthStore();
  const {
    slotsSeleccionados,
    tipoReserva,
    esRecurrente,
    semanasRecurrente,
    getResumenSeleccion,
    limpiarSeleccion,
  } = useDisponibilidadStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasSelection = slotsSeleccionados.length > 0;
  const consultorioActivo = consultorios.find(
    (c) => c.id === consultorioSeleccionadoId
  );
  const resumen = getResumenSeleccion();
  const estaCongelado = perfil?.estado === 'congelado';

  const horasDisponibles =
    saldos?.horas_disponibles ?? saldos?.resumen?.total_horas_disponibles ?? 0;
  const totalHorasRequeridas = esRecurrente
    ? resumen.totalHoras * semanasRecurrente
    : resumen.totalHoras;
  const saldoSuficiente = horasDisponibles >= totalHorasRequeridas;

  return (
    <>
      <div
        className={`fixed bottom-0 inset-x-0 z-50 transition-all duration-300 ease-out transform ${
          hasSelection
            ? 'translate-y-0 opacity-100 shadow-2xl pointer-events-auto'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Barra / Bottom Sheet fijo para fácil alcance del pulgar */}
        <div className="bg-slate-900/95 dark:bg-[#181818]/95 backdrop-blur-md border-t border-slate-700 dark:border-neutral-800 text-white px-3.5 py-3 sm:py-4 safe-bottom">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Detalles de la reserva seleccionada */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              {/* Consultorio Badge */}
              <div className="flex items-center space-x-2 bg-slate-800 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-slate-700 dark:border-neutral-700">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                  style={{ backgroundColor: consultorioActivo?.color || '#2E7D32' }}
                />
                <span className="font-bold text-white text-xs sm:text-sm truncate">
                  {consultorioActivo?.nombre || 'Consultorio'}
                </span>
              </div>

              {/* Fecha y Horario */}
              {slotsSeleccionados.length > 1 && tipoReserva === 'hora' ? (
                <div className="flex items-center space-x-1.5 text-slate-200 dark:text-neutral-300 font-semibold text-xs">
                  <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{slotsSeleccionados.length} horas sueltas seleccionadas</span>
                </div>
              ) : (
                <>
                  {resumen.fecha && (
                    <div className="flex items-center space-x-1.5 text-slate-200 dark:text-neutral-300 font-semibold text-xs">
                      <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{resumen.fecha}</span>
                    </div>
                  )}

                  {resumen.horaInicio && resumen.horaFin && (
                    <div className="flex items-center space-x-1.5 text-slate-200 dark:text-neutral-300 font-semibold text-xs">
                      <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>
                        {resumen.horaInicio} – {resumen.horaFin}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Total Horas / Modalidad */}
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-bold">
                  {totalHorasRequeridas} {totalHorasRequeridas === 1 ? 'hora' : 'horas'}
                </span>

                {esRecurrente && (
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold">
                    Serie {semanasRecurrente} sem
                  </span>
                )}
              </div>

              {/* Saldo info */}
              <div className="text-[11px] sm:text-xs">
                {saldoSuficiente ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {horasDisponibles}h en cuenta
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Saldo insuficiente ({horasDisponibles}h de {totalHorasRequeridas}h)
                  </span>
                )}
              </div>
            </div>

            {/* Acciones Táctiles Fijas (min-h-[48px], gap-3) */}
            <div className="flex items-center justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800 dark:border-neutral-800">
              {/* Mensajes de validación */}
              {!resumen.valido && resumen.errorMsg && (
                <div className="flex items-center space-x-1 text-xs text-rose-400 font-medium max-w-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span className="truncate">{resumen.errorMsg}</span>
                </div>
              )}

              {estaCongelado && (
                <div className="flex items-center space-x-1 text-xs text-amber-400 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Cuenta congelada (R13)</span>
                </div>
              )}

              {/* Botón Descartar (táctil min-h-[48px]) */}
              <button
                type="button"
                onClick={limpiarSeleccion}
                className="min-h-[48px] min-w-[48px] px-3.5 py-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 dark:hover:bg-neutral-800 rounded-xl transition-colors flex items-center justify-center border border-slate-700 dark:border-neutral-700 active:scale-95"
                title="Descartar selección"
                aria-label="Descartar selección"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Botón Continuar / Reservar (táctil min-h-[48px] prominente para el pulgar) */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                disabled={!resumen.valido || estaCongelado}
                className="min-h-[48px] flex-1 sm:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <span>Reservar Ahora</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
