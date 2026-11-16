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
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center space-x-2 text-slate-900 font-bold text-base sm:text-lg mb-2">
        <MessageSquare className="w-5 h-5 text-emerald-600" />
        <h3>Contactar a Soporte y Administración</h3>
      </div>
      <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
        ¿Tienes dudas sobre tus reservaciones, paquetes, facturación o requieres asistencia técnica? Envíanos un mensaje y te responderemos a la brevedad.
      </p>

      {enviadoExito && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-start gap-2.5">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>¡Mensaje enviado con éxito!</strong> Nuestro equipo se comunicará contigo mediante el correo asociado a tu cuenta de terapeuta.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Asunto o Motivo:
          </label>
          <input
            type="text"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Ej: Aclaración sobre paquete o solicitud de compra..."
            className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Mensaje detallado:
          </label>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={4}
            placeholder="Describe tu consulta, fechas o requerimiento..."
            className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-none leading-relaxed"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
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
