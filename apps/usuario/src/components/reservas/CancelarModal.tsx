import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Reserva } from '../../types/reserva';
import { useReservasStore } from '../../store/useReservasStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { validarCancelacionR5 } from '../../utils/reglasValidation';
import { formatHumanDate } from '../../utils/dateUtils';
import { AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';

interface CancelarModalProps {
  reserva: Reserva | null;
  isOpen: boolean;
  onClose: () => void;
  esSerieCompleta?: boolean;
}

export const CancelarModal: React.FC<CancelarModalProps> = ({
  reserva,
  isOpen,
  onClose,
  esSerieCompleta = false,
}) => {
  const { cancelar, cancelarSerieRecurrente } = useReservasStore();
  const { cargarSaldos } = useAuthStore();
  const { showToast } = useUiStore();

  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!reserva) return null;

  const validacionR5 = validarCancelacionR5(reserva.fecha_inicio);

  const handleConfirmar = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (esSerieCompleta && reserva.serie_id) {
        const count = await cancelarSerieRecurrente(String(reserva.serie_id));
        showToast(`Serie cancelada: Se anularon ${count} reservas futuras.`, 'info');
      } else {
        await cancelar(reserva.id, motivo);
        showToast(
          validacionR5.puedeDevolver
            ? 'Reserva cancelada. Las horas han sido reembolsadas a tu saldo.'
            : 'Reserva cancelada sin devolución de saldo (menos de 24h de anticipación).',
          validacionR5.puedeDevolver ? 'success' : 'info'
        );
      }
      await cargarSaldos();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al cancelar la reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esSerieCompleta ? 'Cancelar Serie Recurrente' : 'Cancelar Reserva'}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Información de la reserva */}
        <div className="p-3.5 bg-slate-50 dark:bg-neutral-800/60 rounded-xl border border-slate-200 dark:border-neutral-700/80 text-xs sm:text-sm">
          <div className="font-bold text-slate-800 dark:text-neutral-100">
            Consultorio {reserva.consultorio.nombre}
          </div>
          <div className="text-slate-600 dark:text-neutral-400 mt-1">
            {formatHumanDate(reserva.fecha_inicio)}
          </div>
        </div>

        {/* Explicación de la Regla R5 */}
        {!esSerieCompleta && (
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
              validacionR5.puedeDevolver
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
            }`}
          >
            {validacionR5.puedeDevolver ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="block font-semibold mb-0.5">
                Regla R5 (Cancelación Anticipada):
              </strong>
              {validacionR5.mensaje}
            </div>
          </div>
        )}

        {esSerieCompleta && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Atención:</strong> Se cancelarán todas las reservas futuras de esta serie semanal recurrente. Aquellas con más de 24h devolverán saldo a tu cuenta.
            </div>
          </div>
        )}

        {/* Motivo opcional */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
            Motivo de cancelación (Opcional):
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            placeholder="Ej: El paciente solicitó reagendar o suspender sesión..."
            className="w-full text-xs p-2.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-800 dark:text-neutral-100 focus:ring-1 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-800 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Acciones con min-h-[48px] */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[48px] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 rounded-xl active:scale-95 transition-colors"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={isSubmitting}
            className="min-h-[48px] flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-50 active:scale-95"
          >
            {isSubmitting ? (
              <span>Cancelando...</span>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Confirmar Cancelación</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
