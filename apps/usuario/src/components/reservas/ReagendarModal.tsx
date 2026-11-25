import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Reserva } from '../../types/reserva';
import { useReservasStore } from '../../store/useReservasStore';
import { useConsultoriosStore } from '../../store/useConsultoriosStore';
import { useUiStore } from '../../store/useUiStore';
import { validarReagendamientoR6 } from '../../utils/reglasValidation';
import { formatHumanDate, parseDate } from '../../utils/dateUtils';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ReagendarModalProps {
  reserva: Reserva | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReagendarModal: React.FC<ReagendarModalProps> = ({
  reserva,
  isOpen,
  onClose,
}) => {
  const { consultorios } = useConsultoriosStore();
  const { reagendar } = useReservasStore();
  const { showToast } = useUiStore();

  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHoraInicio, setNuevaHoraInicio] = useState('10:00');
  const [nuevoConsultorioId, setNuevoConsultorioId] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!reserva) return null;

  const validacionR6 = validarReagendamientoR6(reserva.fecha_inicio);

  // Calcular duración en horas de la reserva original
  const inicioOrig = parseDate(reserva.fecha_inicio);
  const finOrig = parseDate(reserva.fecha_fin);
  const duracionHoras = Math.max(
    1,
    Math.round((finOrig.getTime() - inicioOrig.getTime()) / (1000 * 60 * 60))
  );

  const handleReagendar = async () => {
    if (!nuevaFecha) {
      setError('Por favor selecciona la nueva fecha.');
      return;
    }

    const horaIniNum = parseInt(nuevaHoraInicio.split(':')[0], 10);
    const horaFinNum = horaIniNum + duracionHoras;
    const nuevaHoraFin = `${String(horaFinNum).padStart(2, '0')}:00`;

    const payload = {
      nueva_fecha_inicio: `${nuevaFecha} ${nuevaHoraInicio}:00`,
      nueva_fecha_fin: `${nuevaFecha} ${nuevaHoraFin}:00`,
      nuevo_consultorio_id:
        nuevoConsultorioId > 0 ? nuevoConsultorioId : reserva.consultorio.id,
    };

    setIsSubmitting(true);
    setError(null);
    try {
      await reagendar(reserva.id, payload);
      showToast('¡Reserva reagendada con éxito! Tus saldos se mantienen intactos.', 'success');
      onClose();
    } catch (err: any) {
      if (err.status === 409 || err.code === 'puerto_rest_slot_ocupado') {
        setError('El consultorio y horario seleccionado no están disponibles.');
      } else {
        setError(err.message || 'Error al reagendar reserva');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reagendar Reserva" maxWidth="md">
      <div className="space-y-4">
        {/* Validación R6 */}
        <div
          className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
            validacionR6.permitido
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
          }`}
        >
          {validacionR6.permitido ? (
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <strong className="block font-semibold mb-0.5">
              Regla R6 (Reagendamiento a ≥24h):
            </strong>
            {validacionR6.mensaje}
          </div>
        </div>

        {/* Info original */}
        <div className="p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-xl border border-slate-200 dark:border-neutral-700/80 text-xs">
          <span className="text-slate-500 dark:text-neutral-400 block mb-0.5">Reserva actual:</span>
          <span className="font-bold text-slate-800 dark:text-neutral-100">
            Consultorio {reserva.consultorio.nombre} • {formatHumanDate(reserva.fecha_inicio)} ({duracionHoras}h)
          </span>
        </div>

        {validacionR6.permitido && (
          <div className="space-y-3">
            {/* Nueva fecha */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                Nueva Fecha:
              </label>
              <input
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full text-xs p-2.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-100 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-none min-h-[44px]"
              />
            </div>

            {/* Hora de inicio y consultorio */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  Hora de Inicio:
                </label>
                <select
                  value={nuevaHoraInicio}
                  onChange={(e) => setNuevaHoraInicio(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-100 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-none min-h-[44px]"
                >
                  {Array.from({ length: 13 }, (_, i) => i + 8).map((h) => {
                    const horaStr = `${String(h).padStart(2, '0')}:00`;
                    return (
                      <option key={horaStr} value={horaStr}>
                        {horaStr}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                  Consultorio:
                </label>
                <select
                  value={nuevoConsultorioId || reserva.consultorio.id}
                  onChange={(e) => setNuevoConsultorioId(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-100 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-none min-h-[44px]"
                >
                  {consultorios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              * La duración ({duracionHoras}h) se mantendrá idéntica a la reserva original según la regla R6.
            </p>
          </div>
        )}

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
            Cerrar
          </button>
          {validacionR6.permitido && (
            <button
              type="button"
              onClick={handleReagendar}
              disabled={isSubmitting}
              className="min-h-[48px] flex items-center space-x-2 bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-slate-800 dark:hover:bg-neutral-200 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? <span>Reagendando...</span> : <span>Confirmar Reagendamiento</span>}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
