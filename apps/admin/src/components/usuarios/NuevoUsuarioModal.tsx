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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-800">Registrar Nuevo Usuario</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Dra. Mariana López"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mariana@ejemplo.com"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Contraseña Temporal *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Tipo de membresía */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Tipo de Membresía
              </label>
              <select
                value={tipoMembresia}
                onChange={(e) => setTipoMembresia(e.target.value as typeof tipoMembresia)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="prepago">Prepago (Horas sueltas)</option>
                <option value="turno">Turno Fijo</option>
                <option value="completo">Consultorio Completo</option>
              </select>
            </div>
          </div>

          {/* Saldo inicial */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Saldo Inicial (Horas)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Si es mayor a 0, se creará un lote con 6 meses de vigencia y registro en auditoría.
            </p>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Notas Administrativas <span className="text-slate-400 normal-case font-normal">(opcional)</span>
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Especialidad, horario preferido, referencias..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2.5 rounded-lg text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>✓ Terapeuta registrado con éxito con rol balsas_paciente.</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
