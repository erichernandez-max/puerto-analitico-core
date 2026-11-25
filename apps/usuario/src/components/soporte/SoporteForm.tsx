import React, { useState } from 'react';
import { enviarSoporte } from '../../api/soporteApi';
import { useUiStore } from '../../store/useUiStore';
import { Send, CheckCircle, MessageSquare } from 'lucide-react';

export const SoporteForm: React.FC = () => {
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enviadoExito, setEnviadoExito] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useUiStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asunto.trim() || !mensaje.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await enviarSoporte({ asunto, mensaje });
      setEnviadoExito(true);
      showToast(res.mensaje || 'Solicitud enviada correctamente', 'success');
      setAsunto('');
      setMensaje('');
    } catch (err: any) {
      setError(err.message || 'Error al enviar solicitud de soporte');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-neutral-800 shadow-xs transition-colors">
      <div className="flex items-center space-x-2 text-slate-900 dark:text-neutral-100 font-bold text-base sm:text-lg mb-2">
        <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3>Contactar a Soporte y Administración</h3>
      </div>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mb-5 leading-relaxed">
        ¿Tienes dudas sobre tus reservaciones, paquetes, facturación o requieres asistencia técnica? Envíanos un mensaje y te responderemos a la brevedad.
      </p>

      {enviadoExito && (
        <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong>¡Mensaje enviado con éxito!</strong> Nuestro equipo se comunicará contigo mediante el correo asociado a tu cuenta de terapeuta.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
            Asunto o Motivo:
          </label>
          <input
            type="text"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Ej: Aclaración sobre paquete o solicitud de compra..."
            className="w-full text-xs sm:text-sm p-3 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-800 dark:text-neutral-100 focus:ring-1 focus:ring-slate-900 focus:outline-none min-h-[44px]"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
            Mensaje:
          </label>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={4}
            placeholder="Describe detalladamente tu solicitud..."
            className="w-full text-xs sm:text-sm p-3 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-800 dark:text-neutral-100 focus:ring-1 focus:ring-slate-900 focus:outline-none"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-800 dark:text-rose-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-[48px] w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-slate-800 dark:hover:bg-neutral-200 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm disabled:opacity-50 active:scale-95"
        >
          {isSubmitting ? (
            <span>Enviando...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Enviar Mensaje</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
