import React, { useState } from 'react';
import { X, Wallet } from 'lucide-react';
import { UsuarioAdmin } from '../../types/usuarios';
import { ajustarSaldo } from '../../api/adminApi';

interface Props {
  usuario: UsuarioAdmin;
  onClose: () => void;
  onSuccess: () => void;
}

export const AjusteSaldoModal: React.FC<Props> = ({ usuario, onClose, onSuccess }) => {
  const [horas, setHoras] = useState('');
  const [tipo, setTipo] = useState<'compra' | 'ajuste_admin' | 'devolucion'>('compra');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const horasNum = parseFloat(horas);
    if (isNaN(horasNum) || horasNum <= 0) {
      setError('Las horas deben ser un número positivo.');
      return;
    }
    if (!motivo.trim()) {
      setError('El motivo es obligatorio.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await ajustarSaldo(usuario.id, {
        horas: horasNum,
        tipo,
        motivo: motivo.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error al ajustar saldo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-semibold text-slate-800 dark:text-neutral-100">Ajustar Saldo</h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Info usuario */}
          <div className="bg-slate-50 dark:bg-neutral-800/60 rounded-xl p-3 border border-slate-200 dark:border-neutral-700">
            <p className="text-sm font-semibold text-slate-800 dark:text-neutral-100">{usuario.nombre}</p>
            <p className="text-xs text-slate-500 dark:text-neutral-400">{usuario.email}</p>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              Saldo actual: <span className="font-bold text-emerald-600 dark:text-emerald-400">{usuario.saldo_disponible}h</span>
            </p>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">Tipo de operación</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as typeof tipo)}
              className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="compra">Compra (agregar horas)</option>
              <option value="ajuste_admin">Ajuste administrativo</option>
              <option value="devolucion">Devolución</option>
            </select>
          </div>

          {/* Horas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">Horas</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              placeholder="Ej: 10"
              className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">Motivo</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describe la razón del ajuste..."
              rows={2}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              required
            />
          </div>

          {/* Error / Success */}
          {error && (
            <div className="bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900 text-red-700 dark:text-rose-400 px-3 py-2 rounded-xl text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded-xl text-xs">
              ✓ Saldo actualizado correctamente.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 rounded-xl hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors active:scale-95 shadow-xs"
            >
              {isSubmitting ? 'Procesando...' : 'Aplicar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
