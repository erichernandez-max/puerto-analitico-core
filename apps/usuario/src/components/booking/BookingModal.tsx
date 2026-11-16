import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useDisponibilidadStore } from '../../store/useDisponibilidadStore';
import { useConsultoriosStore } from '../../store/useConsultoriosStore';
import { useReservasStore } from '../../store/useReservasStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { CrearReservaPayload } from '../../types/reserva';
import { Clock, Info, AlertTriangle, CheckCircle } from 'lucide-react';

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
    getResumenSeleccion,
    limpiarSeleccion,
    cargarSemana,
  } = useDisponibilidadStore();
  const { crear } = useReservasStore();
  const { showToast, setActiveTab } = useUiStore();

  const [saldoSeleccionadoId, setSaldoSeleccionadoId] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const consultorioActivo = consultorios.find(
    (c) => c.id === consultorioSeleccionadoId
  );
  const resumen = getResumenSeleccion();
  const totalHorasDisponibles = saldos?.horas_disponibles ?? saldos?.resumen?.total_horas_disponibles ?? 0;
  const paquetesVigentes = saldos?.saldos ?? [];

  const handleConfirmar = async () => {
    if (!consultorioSeleccionadoId || !resumen.fecha || !resumen.horaInicio || !resumen.horaFin) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

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

    try {
      await crear(payload);
      showToast(
        esRecurrente
          ? `¡Serie de ${semanasRecurrente} reservas creada con éxito!`
          : '¡Reserva confirmada con éxito!',
        'success'
      );
      await cargarSaldos();
      await cargarSemana(consultorioSeleccionadoId);
      limpiarSeleccion();
      onClose();
      setActiveTab('mis-reservas');
    } catch (err: any) {
      if (err.status === 409 || err.code === 'puerto_rest_slot_ocupado') {
        setErrorMessage(
          'Conflicto: El consultorio fue reservado por otro terapeuta mientras seleccionabas el horario. Por favor elige otro slot.'
        );
      } else {
        setErrorMessage(err.message || 'Ocurrió un error al procesar tu reserva.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esRecurrente ? 'Confirmar Reserva Recurrente' : 'Confirmar Reserva'}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Resumen del consultorio */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-3">
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: consultorioActivo?.color || '#2E7D32' }}
            />
            <div>
              <span className="block text-xs text-slate-500 font-medium">Consultorio</span>
              <span className="text-sm font-bold text-slate-900">
                {consultorioActivo?.nombre}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="block text-xs text-slate-500 font-medium">Modalidad</span>
            <span className="text-sm font-bold text-slate-900 capitalize">
              {tipoReserva} {esRecurrente && `(${semanasRecurrente} sem)`}
            </span>
          </div>
        </div>

        {/* Fecha y horarios */}
        <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="block text-slate-500 text-xs">Fecha</span>
            <span className="font-bold text-slate-800">{resumen.fecha}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="block text-slate-500 text-xs">Horario</span>
            <span className="font-bold text-slate-800">
              {resumen.horaInicio} - {resumen.horaFin} ({resumen.totalHoras}h)
            </span>
          </div>
        </div>

        {/* Verificación de saldos */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-blue-900 font-semibold flex items-center gap-1">
              <Clock className="w-4 h-4 text-blue-700" />
              Saldo disponible en tu cuenta:
            </span>
            <span className="font-bold text-blue-900 text-sm">
              {totalHorasDisponibles} hrs
            </span>
          </div>

          {paquetesVigentes.length > 1 && (
            <div className="pt-2 border-t border-blue-200/60">
              <label className="block text-blue-900 font-medium mb-1">
                Paquete de saldo a aplicar (Opcional - por defecto FIFO):
              </label>
              <select
                value={saldoSeleccionadoId || ''}
                onChange={(e) =>
                  setSaldoSeleccionadoId(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full bg-white border border-blue-200 text-slate-800 text-xs rounded-lg p-2 focus:ring-1 focus:ring-blue-600 focus:outline-none"
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
            <div className="flex items-center gap-2 text-rose-700 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200 mt-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                Atención: Tu saldo disponible ({totalHorasDisponibles}h) es inferior a las horas requeridas ({resumen.totalHoras}h). Deberás adquirir más saldo antes de T-24h para no perder la reserva.
              </span>
            </div>
          )}
        </div>

        {/* Recordatorio de Regla R4 */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Regla R4 (Consumo a T-24h):</strong> El saldo no se descuenta de inmediato. Se consumirá automáticamente mediante proceso horario exactamente 24 horas antes del inicio de tu sesión.
          </span>
        </div>

        {/* Mensaje de error si la API falló */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={isSubmitting}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Procesando...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Confirmar Reserva</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
