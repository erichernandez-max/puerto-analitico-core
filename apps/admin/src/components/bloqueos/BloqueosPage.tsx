import React, { useEffect, useState } from 'react';
import { 
  CalendarOff, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  RefreshCw,
  Repeat
} from 'lucide-react';
import { crearBloqueo, fetchBloqueos, eliminarBloqueo, fetchConsultorios } from '../../api/adminApi';
import { ConsultorioSimple, BloqueoItem } from '../../types/usuarios';

export const BloqueosPage: React.FC = () => {
  const [consultorios, setConsultorios] = useState<ConsultorioSimple[]>([]);
  const [consultorioId, setConsultorioId] = useState<number>(0); // 0 = Todos
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Lista de bloqueos
  const [bloqueos, setBloqueos] = useState<BloqueoItem[]>([]);
  const [isLoadingBloqueos, setIsLoadingBloqueos] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadConsultorios = async () => {
    try {
      const data = await fetchConsultorios();
      if (Array.isArray(data)) {
        setConsultorios(data);
      }
    } catch (err: any) {
      console.warn('No se pudieron cargar consultorios dinámicamente:', err);
      setConsultorios([
        { id: 1, nombre: 'Consultorio Verde', color: '#2E7D32' },
        { id: 2, nombre: 'Consultorio Rosa', color: '#E91E63' },
        { id: 3, nombre: 'Consultorio Azul', color: '#1976D2' },
        { id: 4, nombre: 'Consultorio Negro', color: '#212121' },
        { id: 5, nombre: 'Consultorio Café', color: '#6D4C41' },
      ]);
    }
  };

  const loadBloqueos = async () => {
    try {
      setIsLoadingBloqueos(true);
      const data = await fetchBloqueos();
      setBloqueos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error al cargar bloqueos:', err);
    } finally {
      setIsLoadingBloqueos(false);
    }
  };

  useEffect(() => {
    loadConsultorios();
    loadBloqueos();
  }, []);

  const handleCrearBloqueo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fechaInicio || !fechaFin) {
      setError('Debes especificar fecha de inicio y fin.');
      return;
    }

    if (new Date(fechaInicio) >= new Date(fechaFin)) {
      setError('La fecha y hora de inicio debe ser anterior a la de finalización.');
      return;
    }

    if (!motivo) {
      setError('Por favor selecciona un motivo para el bloqueo.');
      return;
    }

    try {
      setIsSubmitting(true);
      await crearBloqueo({
        consultorio_id: consultorioId,
        fecha_inicio: fechaInicio.replace('T', ' ') + ':00',
        fecha_fin: fechaFin.replace('T', ' ') + ':00',
        motivo: motivo,
      });

      setSuccess('Bloqueo creado con éxito.');
      setFechaInicio('');
      setFechaFin('');
      setMotivo('');
      setConsultorioId(0);
      loadBloqueos();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el bloqueo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminarBloqueo = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este bloqueo de horario?')) {
      return;
    }

    try {
      setDeletingId(id);
      await eliminarBloqueo(id);
      setBloqueos((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el bloqueo.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFecha = (dStr: string) => {
    try {
      const d = new Date(dStr.replace(' ', 'T'));
      return d.toLocaleString('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
          <CalendarOff className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          Bloqueos Administrativos y Mantenimiento
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
          Restringe slots de reserva para mantenimiento, días feriados o eventos extraordinarios.
        </p>
      </div>

      {/* Formulario para Nuevo Bloqueo */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 shadow-xs transition-colors">
        <h2 className="text-base font-semibold text-slate-800 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Nuevo Bloqueo de Espacio
        </h2>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900 text-red-700 dark:text-rose-400 px-4 py-3 rounded-xl text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleCrearBloqueo} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Consultorio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Consultorio:
              </label>
              <select
                value={consultorioId}
                onChange={(e) => setConsultorioId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value={0}>Todos los consultorios</option>
                {consultorios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha y Hora Inicio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Inicio del Bloqueo:
              </label>
              <input
                type="datetime-local"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Fecha y Hora Fin */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Fin del Bloqueo:
              </label>
              <input
                type="datetime-local"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Motivo / Tipo:
              </label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              >
                <option value="">Selecciona motivo...</option>
                <option value="mantenimiento">Mantenimiento (Regla R17)</option>
                <option value="feriado">Feriado Oficial</option>
                <option value="admin">Administrativo / Reserva Externa</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-50 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : 'Aplicar Bloqueo'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Bloqueos Activos y Futuros */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs overflow-hidden transition-colors">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-neutral-100">
              Bloqueos Registrados ({bloqueos.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Listado histórico y programado de bloqueos administrativos y de mantenimiento.
            </p>
          </div>
          <button
            onClick={loadBloqueos}
            disabled={isLoadingBloqueos}
            className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBloqueos ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {isLoadingBloqueos ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : bloqueos.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-neutral-400">
            No hay bloqueos registrados actualmente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  <th className="text-left px-5 py-3">Consultorio</th>
                  <th className="text-left px-5 py-3">Fecha Inicio</th>
                  <th className="text-left px-5 py-3">Fecha Fin</th>
                  <th className="text-left px-5 py-3">Motivo / Tipo</th>
                  <th className="text-center px-5 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {bloqueos.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-neutral-100">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: b.consultorio_color || '#64748b' }} 
                        />
                        <span>{b.consultorio_nombre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-neutral-300 text-xs whitespace-nowrap">
                      {formatFecha(b.fecha_inicio)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-neutral-300 text-xs whitespace-nowrap">
                      {formatFecha(b.fecha_fin)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-neutral-200">
                      <div className="flex items-center gap-1.5">
                        <span className="capitalize text-xs font-semibold text-slate-800 dark:text-neutral-100">
                          {b.motivo}
                        </span>
                        {b.recurrente && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium">
                            <Repeat className="w-2.5 h-2.5" />
                            Recurrente
                          </span>
                        )}
                      </div>
                      {b.patron_recurrencia && (
                        <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
                          {b.patron_recurrencia}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleEliminarBloqueo(b.id)}
                        disabled={deletingId === b.id}
                        title="Eliminar bloqueo"
                        className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center p-2 rounded-xl text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
