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
import { Calendar, Clock, Repeat, Edit3, XCircle, CalendarPlus, Download } from 'lucide-react';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../../utils/calendarUtils';

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
      <div
        className="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-neutral-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
        style={{ borderLeftColor: reserva.consultorio.color, borderLeftWidth: '5px' }}
      >
        <div>
          {/* Top Header: Consultorio y Estado */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <span
                className="w-3.5 h-3.5 rounded-full shadow-xs flex-shrink-0"
                style={{ backgroundColor: reserva.consultorio.color }}
              />
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-neutral-100">
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
            <div className="flex items-center space-x-2 text-slate-700 dark:text-neutral-300 font-medium">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-neutral-500 flex-shrink-0" />
              <span>{formatHumanDate(reserva.fecha_inicio)}</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-500 dark:text-neutral-400 font-medium">
              <Clock className="w-4 h-4 text-slate-400 dark:text-neutral-500 flex-shrink-0" />
              <span>
                {formatTimeRange(reserva.fecha_inicio, reserva.fecha_fin)}
              </span>
            </div>
          </div>

          {/* Badges de tipo y recurrencia */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span className="text-[11px] bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-medium px-2 py-0.5 rounded-md border border-slate-200 dark:border-neutral-700">
              {tipoLabel}
            </span>

            {reserva.es_recurrente && (
              <span className="text-[11px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border border-purple-200 dark:border-purple-800/60">
                <Repeat className="w-3 h-3" />
                Serie Semanal
              </span>
            )}

            {horasRestantes > 0 && esCancelable && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                  horasRestantes >= 24
                    ? 'text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700'
                    : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60'
                }`}
              >
                Inicia en {Math.round(horasRestantes)}h
              </span>
            )}
          </div>
        </div>

        {/* Acciones para reservas vigentes con botones táctiles */}
        {esCancelable && (
          <div className="pt-3 border-t border-slate-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const url = generateGoogleCalendarUrl({
                    title: `Reserva: Consultorio ${reserva.consultorio.nombre} - Puerto Analítico`,
                    description: `Reserva confirmada en Puerto Analítico.\nConsultorio: ${reserva.consultorio.nombre}\nModalidad: ${tipoLabel}\nHorario: ${formatTimeRange(reserva.fecha_inicio, reserva.fecha_fin)}`,
                    location: `Puerto Analítico - Consultorio ${reserva.consultorio.nombre}`,
                    startDate: reserva.fecha_inicio,
                    endDate: reserva.fecha_fin,
                  });
                  window.open(url, '_blank');
                }}
                className="min-h-[44px] flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/60 transition-colors active:scale-95"
                title="Añadir a Google Calendar"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Google Cal</span>
              </button>

              <button
                onClick={() => {
                  downloadIcsFile({
                    title: `Reserva: Consultorio ${reserva.consultorio.nombre} - Puerto Analítico`,
                    description: `Reserva confirmada en Puerto Analítico.\nConsultorio: ${reserva.consultorio.nombre}\nModalidad: ${tipoLabel}\nHorario: ${formatTimeRange(reserva.fecha_inicio, reserva.fecha_fin)}`,
                    location: `Puerto Analítico - Consultorio ${reserva.consultorio.nombre}`,
                    startDate: reserva.fecha_inicio,
                    endDate: reserva.fecha_fin,
                  }, `reserva-${reserva.id}.ics`);
                }}
                className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 transition-colors flex items-center justify-center active:scale-95"
                title="Descargar archivo .ics (Apple Calendar)"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalReagendarOpen(true)}
                disabled={!puedeReagendar}
                className={`min-h-[44px] flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                  puedeReagendar
                    ? 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700'
                    : 'bg-slate-50 dark:bg-neutral-900 text-slate-400 dark:text-neutral-600 cursor-not-allowed border border-slate-200 dark:border-neutral-800'
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
                className="min-h-[44px] flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 transition-colors active:scale-95"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>

              {reserva.es_recurrente && reserva.serie_id && (
                <button
                  onClick={() => setModalCancelarSerieOpen(true)}
                  className="min-h-[44px] px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 transition-colors"
                  title="Cancelar todas las reservas de esta serie"
                >
                  Serie
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <CancelarModal
        reserva={reserva}
        isOpen={modalCancelarOpen}
        onClose={() => setModalCancelarOpen(false)}
      />

      {reserva.es_recurrente && (
        <CancelarModal
          reserva={reserva}
          isOpen={modalCancelarSerieOpen}
          onClose={() => setModalCancelarSerieOpen(false)}
          esSerieCompleta={true}
        />
      )}

      <ReagendarModal
        reserva={reserva}
        isOpen={modalReagendarOpen}
        onClose={() => setModalReagendarOpen(false)}
      />
    </>
  );
};
