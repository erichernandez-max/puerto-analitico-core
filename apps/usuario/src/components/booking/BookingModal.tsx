import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useDisponibilidadStore } from '../../store/useDisponibilidadStore';
import { useConsultoriosStore } from '../../store/useConsultoriosStore';
import { useReservasStore } from '../../store/useReservasStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { CrearReservaPayload } from '../../types/reserva';
import { Clock, Info, AlertTriangle, CheckCircle, CalendarPlus, Download, ArrowRight } from 'lucide-react';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../../utils/calendarUtils';
import { formatHumanDate } from '../../utils/dateUtils';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { consultorios, consultorioSeleccionadoId } = useConsultoriosStore();
  const { saldos, cargarSaldos } = useAuthStore();
  const {
    tipoReserva,
    esRecurrente,
    semanasRecurrente,
    slotsSeleccionados,
    getResumenSeleccion,
    limpiarSeleccion,
    cargarSemana,
  } = useDisponibilidadStore();
  const { crear } = useReservasStore();
  const { showToast, setActiveTab } = useUiStore();

  const [saldoSeleccionadoId, setSaldoSeleccionadoId] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reservaExitosa, setReservaExitosa] = useState<{
    consultorio: string;
    fechaInicio: string;
    fechaFin: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    tipo: string;
    esRecurrente: boolean;
    semanas?: number;
  } | null>(null);

  const consultorioActivo = consultorios.find(
    (c) => c.id === consultorioSeleccionadoId
  );
  const resumen = getResumenSeleccion();
  const totalHorasDisponibles = saldos?.horas_disponibles ?? saldos?.resumen?.total_horas_disponibles ?? 0;
  const paquetesVigentes = saldos?.saldos ?? [];

  const handleModalClose = () => {
    if (reservaExitosa) {
      setReservaExitosa(null);
      setActiveTab('mis-reservas');
    }
    setErrorMessage(null);
    onClose();
  };

  const handleConfirmar = async () => {
    if (!consultorioSeleccionadoId || slotsSeleccionados.length === 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (tipoReserva === 'hora' && slotsSeleccionados.length > 1) {
        // Reservar múltiples horas sueltas
        for (const slot of slotsSeleccionados) {
          const cId = slot.consultorio_id || consultorioSeleccionadoId;
          const payload: CrearReservaPayload = {
            consultorio_id: cId,
            fecha_inicio: `${slot.fecha} ${slot.hora_inicio}:00`,
            fecha_fin: `${slot.fecha} ${slot.hora_fin}:00`,
            tipo: 'hora',
            saldo_id: saldoSeleccionadoId,
            es_recurrente: esRecurrente,
            semanas: esRecurrente ? semanasRecurrente : undefined,
          };
          await crear(payload);
        }

        const primerSlot = slotsSeleccionados[0];
        const ultimoSlot = slotsSeleccionados[slotsSeleccionados.length - 1];
        setReservaExitosa({
          consultorio: consultorioActivo?.nombre || 'Consultorio',
          fechaInicio: `${primerSlot.fecha} ${primerSlot.hora_inicio}:00`,
          fechaFin: `${ultimoSlot.fecha} ${ultimoSlot.hora_fin}:00`,
          fecha: `${slotsSeleccionados.length} horas sueltas seleccionadas`,
          horaInicio: primerSlot.hora_inicio,
          horaFin: ultimoSlot.hora_fin,
          tipo: `${slotsSeleccionados.length} horas sueltas`,
          esRecurrente,
          semanas: esRecurrente ? semanasRecurrente : undefined,
        });
      } else {
        if (!resumen.fecha || !resumen.horaInicio || !resumen.horaFin) return;
        const fechaInicioStr = `${resumen.fecha} ${resumen.horaInicio}:00`;
        const fechaFinStr = `${resumen.fecha} ${resumen.horaFin}:00`;

        const payload: CrearReservaPayload = {
          consultorio_id: consultorioSeleccionadoId,
          fecha_inicio: fechaInicioStr,
          fecha_fin: fechaFinStr,
          tipo: tipoReserva,
          saldo_id: saldoSeleccionadoId,
          es_recurrente: esRecurrente,
          semanas: esRecurrente ? semanasRecurrente : undefined,
        };
        await crear(payload);

        setReservaExitosa({
          consultorio: consultorioActivo?.nombre || 'Consultorio',
          fechaInicio: fechaInicioStr,
          fechaFin: fechaFinStr,
          fecha: resumen.fecha,
          horaInicio: resumen.horaInicio,
          horaFin: resumen.horaFin,
          tipo: tipoReserva,
          esRecurrente,
          semanas: esRecurrente ? semanasRecurrente : undefined,
        });
      }

      cargarSaldos();
      cargarSemana(consultorioSeleccionadoId);
      limpiarSeleccion();

      showToast(
        slotsSeleccionados.length > 1 && tipoReserva === 'hora'
          ? `${slotsSeleccionados.length} reservas creadas exitosamente.`
          : esRecurrente
          ? `Serie de ${semanasRecurrente} reservas creada correctamente.`
          : 'Reserva creada exitosamente.',
        'success'
      );
    } catch (err: any) {
      const msg = err.message || 'Error al procesar la reserva';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (reservaExitosa) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        title="¡Reserva Confirmada!"
        maxWidth="md"
      >
        <div className="space-y-4 py-2 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-neutral-100">
            Tu reserva ha sido confirmada con éxito
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
            Hemos registrado tu espacio en Puerto Analítico. Ya puedes integrarlo a tu agenda personal.
          </p>

          <div className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-4 text-left text-xs sm:text-sm space-y-2 max-w-md mx-auto my-3">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-neutral-400">Consultorio:</span>
              <span className="font-semibold text-slate-900 dark:text-neutral-100">{reservaExitosa.consultorio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-neutral-400">Fecha:</span>
              <span className="font-semibold text-slate-900 dark:text-neutral-100">{formatHumanDate(reservaExitosa.fechaInicio)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-neutral-400">Horario:</span>
              <span className="font-semibold text-slate-900 dark:text-neutral-100">{reservaExitosa.horaInicio} - {reservaExitosa.horaFin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-neutral-400">Modalidad:</span>
              <span className="font-semibold text-slate-900 dark:text-neutral-100 capitalize">
                {reservaExitosa.tipo} {reservaExitosa.esRecurrente && `(${reservaExitosa.semanas} semanas)`}
              </span>
            </div>
          </div>

          {/* Botones de calendario dispuestos verticalmente (uno arriba del otro) */}
          <div className="flex flex-col items-stretch gap-2.5 pt-2 max-w-sm mx-auto w-full">
            <button
              type="button"
              onClick={() => {
                const url = generateGoogleCalendarUrl({
                  title: `Reserva: Consultorio ${reservaExitosa.consultorio} - Puerto Analítico`,
                  description: `Reserva confirmada en Puerto Analítico.\nConsultorio: ${reservaExitosa.consultorio}\nModalidad: ${reservaExitosa.tipo}\nHorario: ${reservaExitosa.horaInicio} - ${reservaExitosa.horaFin}`,
                  location: `Puerto Analítico - Consultorio ${reservaExitosa.consultorio}`,
                  startDate: reservaExitosa.fechaInicio,
                  endDate: reservaExitosa.fechaFin,
                });
                window.open(url, '_blank');
              }}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Añadir a Google Calendar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                downloadIcsFile({
                  title: `Reserva: Consultorio ${reservaExitosa.consultorio} - Puerto Analítico`,
                  description: `Reserva confirmada en Puerto Analítico.\nConsultorio: ${reservaExitosa.consultorio}\nModalidad: ${reservaExitosa.tipo}\nHorario: ${reservaExitosa.horaInicio} - ${reservaExitosa.horaFin}`,
                  location: `Puerto Analítico - Consultorio ${reservaExitosa.consultorio}`,
                  startDate: reservaExitosa.fechaInicio,
                  endDate: reservaExitosa.fechaFin,
                }, 'reserva-puerto-analitico.ics');
              }}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 font-semibold text-xs sm:text-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Descargar .ics (Apple Calendar)</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-neutral-800 mt-4">
            <button
              type="button"
              onClick={handleModalClose}
              className="min-h-[44px] inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 font-semibold"
            >
              <span>Ir a Mis Reservas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={esRecurrente ? 'Confirmar Reserva Recurrente' : 'Confirmar Reserva'}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Resumen del consultorio */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-neutral-800/60 rounded-xl border border-slate-200 dark:border-neutral-700/80">
          <div className="flex items-center space-x-3">
            <span
              className="w-4 h-4 rounded-full shadow-xs"
              style={{ backgroundColor: consultorioActivo?.color || '#2E7D32' }}
            />
            <div>
              <span className="block text-xs text-slate-500 dark:text-neutral-400 font-medium">Consultorio</span>
              <span className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                {consultorioActivo?.nombre}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="block text-xs text-slate-500 dark:text-neutral-400 font-medium">Modalidad</span>
            <span className="text-sm font-bold text-slate-900 dark:text-neutral-100 capitalize">
              {tipoReserva} {esRecurrente && `(${semanasRecurrente} sem)`}
            </span>
          </div>
        </div>

        {/* Fecha y horarios */}
        <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
          <div className="p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-xl border border-slate-200 dark:border-neutral-700/80">
            <span className="block text-slate-500 dark:text-neutral-400 text-xs">Fecha</span>
            <span className="font-bold text-slate-800 dark:text-neutral-200">{resumen.fecha}</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-xl border border-slate-200 dark:border-neutral-700/80">
            <span className="block text-slate-500 dark:text-neutral-400 text-xs">Horario</span>
            <span className="font-bold text-slate-800 dark:text-neutral-200">
              {resumen.horaInicio} - {resumen.horaFin} ({resumen.totalHoras}h)
            </span>
          </div>
        </div>

        {/* Verificación de saldos */}
        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-blue-900 dark:text-blue-300 font-semibold flex items-center gap-1">
              <Clock className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              Saldo disponible en tu cuenta:
            </span>
            <span className="font-bold text-blue-900 dark:text-blue-200 text-sm">
              {totalHorasDisponibles} hrs
            </span>
          </div>

          {paquetesVigentes.length > 1 && (
            <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40">
              <label className="block text-blue-900 dark:text-blue-300 font-medium mb-1">
                Paquete de saldo a aplicar (Opcional - por defecto FIFO):
              </label>
              <select
                value={saldoSeleccionadoId || ''}
                onChange={(e) =>
                  setSaldoSeleccionadoId(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800 text-slate-800 dark:text-neutral-200 text-xs rounded-lg p-2 min-h-[44px] focus:ring-1 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">Selección automática (paquete más próximo a vencer)</option>
                {paquetesVigentes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.producto_nombre || 'Paquete'} - {p.horas_disponibles} hrs restantes (vence en {p.dias_para_vencer} días)
                  </option>
                ))}
              </select>
            </div>
          )}

          {totalHorasDisponibles < resumen.totalHoras && (
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50 mt-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                Atención: Tu saldo disponible ({totalHorasDisponibles}h) es inferior a las horas requeridas ({resumen.totalHoras}h). Deberás adquirir más saldo antes de T-24h para no perder la reserva.
              </span>
            </div>
          )}
        </div>

        {/* Recordatorio de Regla R4 */}
        <div className="p-3 bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/80 rounded-xl text-[11px] text-slate-600 dark:text-neutral-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-500 dark:text-neutral-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Regla R4 (Consumo a T-24h):</strong> El saldo no se descuenta de inmediato. Se consumirá automáticamente mediante proceso horario exactamente 24 horas antes del inicio de tu sesión.
          </span>
        </div>

        {/* Mensaje de error si la API falló */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-800 dark:text-rose-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Acciones con min-h-[48px] */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[48px] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors active:scale-95"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={isSubmitting}
            className="min-h-[48px] flex items-center space-x-2 bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-slate-800 dark:hover:bg-neutral-200 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md disabled:opacity-50 active:scale-95"
          >
            {isSubmitting ? (
              <span>Procesando...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span>Confirmar Reserva</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
