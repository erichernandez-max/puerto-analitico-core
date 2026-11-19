import React, { useState } from 'react';
import { X, Snowflake, Sun, AlertTriangle } from 'lucide-react';
import { UsuarioAdmin } from '../../types/usuarios';
import { cambiarEstadoUsuario } from '../../api/adminApi';

interface Props {
  usuario: UsuarioAdmin;
  onClose: () => void;
  onSuccess: () => void;
}

export const CambiarEstadoModal: React.FC<Props> = ({ usuario, onClose, onSuccess }) => {
  const isCurrentlyActive = usuario.estado === 'activo';
  const nuevoEstado = isCurrentlyActive ? 'congelado' : 'activo';

  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      await cambiarEstadoUsuario(usuario.id, {
        estado: nuevoEstado,
        motivo: motivo.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado');
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
            {isCurrentlyActive ? (
              <Snowflake className="w-5 h-5 text-blue-600" />
            ) : (
              <Sun className="w-5 h-5 text-emerald-600" />
            )}
            <h2 className="text-base font-semibold text-slate-800">
              {isCurrentlyActive ? 'Congelar Cuenta' : 'Reactivar Cuenta'}
            </h2>
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
              Estado actual: <span className="font-semibold capitalize">{usuario.estado}</span>
            </p>
          </div>

          {/* Warning */}
          {isCurrentlyActive && (
            <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Al congelar la cuenta, el usuario no podrá realizar nuevas reservas hasta que sea reactivado.
              </p>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Motivo <span className="text-slate-400">(opcional)</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describe la razón del cambio de estado..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
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
              ✓ Estado actualizado correctamente.
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
              className={
                'px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors ' +
                (isCurrentlyActive
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-emerald-600 hover:bg-emerald-700')
              }
            >
              {isSubmitting
                ? 'Procesando...'
                : isCurrentlyActive
                ? 'Congelar Cuenta'
                : 'Reactivar Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
