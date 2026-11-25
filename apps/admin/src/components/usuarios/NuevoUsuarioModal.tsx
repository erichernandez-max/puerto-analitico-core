import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { crearUsuario } from '../../api/adminApi';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const NuevoUsuarioModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tipoMembresia, setTipoMembresia] = useState<'prepago' | 'turno' | 'completo'>('prepago');
  const [saldoInicial, setSaldoInicial] = useState('0');
  const [notas, setNotas] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !email.trim() || !password) {
      setError('Por favor completa todos los campos requeridos (nombre, email y contraseña).');
      return;
    }

    const saldoNum = parseFloat(saldoInicial) || 0;
    if (saldoNum < 0) {
      setError('El saldo inicial no puede ser negativo.');
      return;
    }

    try {
      setIsSubmitting(true);
      await crearUsuario({
        nombre: nombre.trim(),
        email: email.trim(),
        password,
        tipo_membresia: tipoMembresia,
        saldo_inicial: saldoNum,
        notas: notas.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error al crear el nuevo usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-800 dark:text-neutral-100">
              Registrar Nuevo Terapeuta
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
          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900 text-red-700 dark:text-rose-400 px-3.5 py-2.5 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Usuario creado exitosamente.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Dra. María López"
                className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@ejemplo.com"
                className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              Contraseña Temporal *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                Membresía
              </label>
              <select
                value={tipoMembresia}
                onChange={(e) => setTipoMembresia(e.target.value as typeof tipoMembresia)}
                className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="prepago">Prepago (Horas)</option>
                <option value="turno">Turno Fijo</option>
                <option value="completo">Consultorio Completo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                Saldo Inicial (Horas)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
                className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
              Notas Clínicas o Administrativas (Opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Detalles sobre especialidad o convenio..."
              rows={2}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

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
              className="min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors active:scale-95 shadow-xs"
            >
              {isSubmitting ? 'Registrando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
