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
        className={`fixed bottom-0 inset-x-0 z-40 transition-all duration-300 ease-out transform ${
          hasSelection
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-slate-950/95 backdrop-blur-md border-t border-slate-800 text-white shadow-2xl px-4 py-3 sm:py-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            {/* Detalles de la reserva seleccionada */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-5 text-xs sm:text-sm">
              {/* Consultorio */}
              <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: consultorioActivo?.color || '#2E7D32' }}
                />
                <span className="font-bold text-white text-xs sm:text-sm">
                  {consultorioActivo?.nombre || 'Consultorio'}
                </span>
              </div>

              {/* Fecha y Horario */}
              {resumen.fecha && (
                <div className="flex items-center space-x-1.5 text-slate-300">
                  <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-semibold">{resumen.fecha}</span>
                </div>
              )}

              {resumen.horaInicio && resumen.horaFin && (
                <div className="flex items-center space-x-1.5 text-slate-300">
                  <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-semibold">
                    {resumen.horaInicio} – {resumen.horaFin}
                  </span>
                </div>
              )}

              {/* Total Horas / Modalidad */}
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-bold">
                  {totalHorasRequeridas} {totalHorasRequeridas === 1 ? 'hora' : 'horas'} a reservar
                </span>

                {esRecurrente && (
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold">
                    Serie {semanasRecurrente} sem
                  </span>
                )}
              </div>

              {/* Información de saldo disponible vs débito */}
              <div className="text-[11px] sm:text-xs">
                {saldoSuficiente ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Se descontará de tus {horasDisponibles}h disponibles
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Saldo insuficiente ({horasDisponibles}h disponibles de {totalHorasRequeridas}h)
                  </span>
                )}
              </div>
            </div>

            {/* Acciones y Botones con mínimo 44px para touch */}
            <div className="flex items-center justify-end space-x-2.5 sm:space-x-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
              {/* Mensaje de error de validación (ej. R7 bloque menor a 3h) */}
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

              {/* Botón Descartar */}
              <button
                type="button"
                onClick={limpiarSeleccion}
                className="min-h-[44px] min-w-[44px] p-2.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors flex items-center justify-center border border-slate-800"
                title="Descartar selección"
                aria-label="Descartar selección"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Botón Continuar / Confirmar */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                disabled={!resumen.valido || estaCongelado}
                className="min-h-[44px] px-5 sm:px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <span>Continuar Reserva</span>
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
