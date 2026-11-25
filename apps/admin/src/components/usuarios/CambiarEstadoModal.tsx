import React, { useState } from 'react';
import { X, Snowflake, Sun } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            {isCurrentlyActive ? (
              <Snowflake className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Sun className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
            <h2 className="text-base font-semibold text-slate-800 dark:text-neutral-100">
              {isCurrentlyActive ? 'Congelar Cuenta' : 'Reactivar Cuenta'}
            </h2>
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
          <div className="bg-slate-50 dark:bg-neutral-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-neutral-700">
            <p className="text-sm font-semibold text-slate-800 dark:text-neutral-100">{usuario.nombre}</p>
            <p className="text-xs text-slate-500 dark:text-neutral-400">{usuario.email}</p>
            <p className="text-xs text-slate-600 dark:text-neutral-300 mt-2">
              Estado actual: <strong className="capitalize">{usuario.estado}</strong> → Nuevo estado:{' '}
              <strong className={isCurrentlyActive ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}>
                {nuevoEstado}
              </strong>
            </p>
          </div>

          {isCurrentlyActive ? (
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 p-3 rounded-xl text-xs space-y-1">
              <p className="font-semibold">Efectos del congelamiento (Regla R13):</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-800 dark:text-blue-300">
                <li>El usuario no podrá crear nuevas reservas (HTTP 403).</li>
                <li>Sus saldos vigentes no expirarán mientras esté congelado.</li>
              </ul>
            </div>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 p-3 rounded-xl text-xs">
              <p className="font-semibold">Reactivación:</p>
              <p className="text-emerald-800 dark:text-emerald-300 mt-0.5">
                El usuario volverá a tener permiso para realizar reservas en el sistema.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
              Motivo (opcional)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explica la razón del cambio de estado..."
              rows={2}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900 text-red-700 dark:text-rose-400 px-3 py-2 rounded-xl text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded-xl text-xs">
              ✓ Estado actualizado exitosamente.
            </div>
          )}

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
              className={`min-h-[44px] px-5 py-2 text-xs font-semibold text-white rounded-xl transition-colors active:scale-95 shadow-xs disabled:opacity-50 ${
                isCurrentlyActive
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting
                ? 'Procesando...'
                : isCurrentlyActive
                ? 'Confirmar Congelamiento'
                : 'Confirmar Reactivación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
