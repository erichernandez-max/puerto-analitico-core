import React, { useState } from 'react';
import { Reserva } from '../../types/reserva';
import {
  formatHumanDate,
  formatTimeRange,
  getHoursDifferenceFromNow,
} from '../../utils/dateUtils';
import {
  getEstadoBadgeProps,
  getTipoReservaLabel,
} from '../../utils/formatters';
import { CancelarModal } from './CancelarModal';
import { ReagendarModal } from './ReagendarModal';
import { Calendar, Clock, Repeat, Edit3, XCircle } from 'lucide-react';

interface ReservaCardProps {
  reserva: Reserva;
}

export const ReservaCard: React.FC<ReservaCardProps> = ({ reserva }) => {
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false);
  const [modalCancelarSerieOpen, setModalCancelarSerieOpen] = useState(false);
  const [modalReagendarOpen, setModalReagendarOpen] = useState(false);

  const badgeProps = getEstadoBadgeProps(reserva.estado);
  const tipoLabel = getTipoReservaLabel(reserva.tipo);

  const horasRestantes = getHoursDifferenceFromNow(reserva.fecha_inicio);
  const puedeReagendar =
    (reserva.estado === 'confirmada' || reserva.estado === 'pendiente_pago') &&
    horasRestantes >= 24;
  const esCancelable =
    reserva.estado === 'confirmada' || reserva.estado === 'pendiente_pago';

  return (
    <>
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          {/* Top Header: Consultorio y Estado */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <span
                className="w-3.5 h-3.5 rounded-full shadow-inner flex-shrink-0"
                style={{ backgroundColor: reserva.consultorio.color }}
              />
              <span className="font-bold text-sm sm:text-base text-slate-900">
                Consultorio {reserva.consultorio.nombre}
              </span>
            </div>

            <span
              className={`text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeProps.className}`}
            >
              {badgeProps.label}
            </span>
          </div>

          {/* Fecha y Rango Horario */}
          <div className="space-y-1.5 mb-3.5 text-xs sm:text-sm">
            <div className="flex items-center space-x-2 text-slate-700 font-medium">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{formatHumanDate(reserva.fecha_inicio)}</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-500 font-medium">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>
                {formatTimeRange(reserva.fecha_inicio, reserva.fecha_fin)}
              </span>
            </div>
          </div>

          {/* Badges de tipo y recurrencia */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md">
              {tipoLabel}
            </span>

            {reserva.es_recurrente && (
              <span className="text-[11px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border border-purple-200">
                <Repeat className="w-3 h-3" />
                Serie Semanal
              </span>
            )}

            {horasRestantes > 0 && esCancelable && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                  horasRestantes >= 24
                    ? 'text-slate-500 bg-slate-50'
                    : 'text-amber-700 bg-amber-50 border border-amber-200'
                }`}
              >
                Inicia en {Math.round(horasRestantes)}h
              </span>
            )}
          </div>
        </div>

        {/* Acciones para reservas vigentes */}
        {esCancelable && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => setModalReagendarOpen(true)}
              disabled={!puedeReagendar}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                puedeReagendar
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
              title={
                puedeReagendar
                  ? 'Reagendar fecha u horario (R6)'
                  : 'No disponible: faltan menos de 24h para el inicio (R6)'
              }
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Reagendar</span>
            </button>

            <button
              onClick={() => setModalCancelarOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>

            {reserva.es_recurrente && reserva.serie_id && (
              <button
                onClick={() => setModalCancelarSerieOpen(true)}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
                title="Cancelar todas las reservas de esta serie"
              >
                Cancelar Serie
              </button>
            )}
          </div>
        )}
      </div>

      <CancelarModal
        reserva={reserva}
        isOpen={modalCancelarOpen}
        onClose={() => setModalCancelarOpen(false)}
      />

      <CancelarModal
        reserva={reserva}
        isOpen={modalCancelarSerieOpen}
        onClose={() => setModalCancelarSerieOpen(false)}
        esSerieCompleta={true}
      />

      <ReagendarModal
        reserva={reserva}
        isOpen={modalReagendarOpen}
        onClose={() => setModalReagendarOpen(false)}
      />
    </>
  );
};
