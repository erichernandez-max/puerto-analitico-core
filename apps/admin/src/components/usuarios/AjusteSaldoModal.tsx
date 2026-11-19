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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-semibold text-slate-800">Ajustar Saldo</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Info usuario */}
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-sm font-medium text-slate-700">{usuario.nombre}</p>
            <p className="text-xs text-slate-500">{usuario.email}</p>
            <p className="text-xs text-slate-500 mt-1">
              Saldo actual: <span className="font-semibold text-emerald-600">{usuario.saldo_disponible}h</span>
            </p>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de operación</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as typeof tipo)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="compra">Compra (agregar horas)</option>
              <option value="ajuste_admin">Ajuste administrativo</option>
              <option value="devolucion">Devolución</option>
            </select>
          </div>

          {/* Horas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Horas</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              placeholder="Ej: 10"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describe la razón del ajuste..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              required
            />
          </div>

          {/* Error / Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-xs">
              ✓ Saldo actualizado correctamente.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Procesando...' : 'Aplicar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
