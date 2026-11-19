import React, { useEffect, useState } from 'react';
import { 
  CalendarOff, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fechaInicio || !fechaFin) {
      setError('Debes seleccionar fecha y hora de inicio y fin.');
      return;
    }

    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    if (!motivo.trim()) {
      setError('El motivo del bloqueo es obligatorio.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formatDateTime = (val: string) => val.replace('T', ' ') + (val.length === 16 ? ':00' : '');
      
      await crearBloqueo({
        consultorio_id: Number(consultorioId),
        fecha_inicio: formatDateTime(fechaInicio),
        fecha_fin: formatDateTime(fechaFin),
        motivo: motivo.trim(),
      });

      setSuccess('¡Bloqueo administrativo registrado con éxito!');
      setMotivo('');
      setFechaInicio('');
      setFechaFin('');
      setConsultorioId(0);
      loadBloqueos();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el bloqueo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminarBloqueo = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este bloqueo? Esta acción habilitará nuevamente el consultorio.')) {
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

  const formatFecha = (str: string) => {
    if (!str) return '-';
    try {
      const d = new Date(str.replace(' ', 'T'));
      return d.toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return str;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarOff className="w-6 h-6 text-red-600" />
          Bloqueos Administrativos / Masivos
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Restringe la disponibilidad de consultorios por mantenimiento, días festivos o eventos especiales.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            Crear Nuevo Bloqueo
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Consultorio */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Consultorio a bloquear
              </label>
              <select
                value={consultorioId}
                onChange={(e) => setConsultorioId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={0}>Todos los consultorios (Bloqueo general)</option>
                {consultorios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                Selecciona un consultorio específico o aplica el bloqueo a toda la sede.
              </p>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha y hora de inicio
                </label>
                <input
                  type="datetime-local"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha y hora de fin
                </label>
                <input
                  type="datetime-local"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Motivo del bloqueo
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ejemplo: Mantenimiento de aire acondicionado, fumigación general, feriado..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                required
              />
            </div>

            {/* Avisos */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSubmitting ? 'Registrando bloqueo...' : 'Registrar Bloqueo'}
              </button>
            </div>
          </form>
        </div>

        {/* Panel lateral de ayuda / información */}
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              ¿Cómo funcionan los bloqueos?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Los bloqueos impiden que cualquier terapeuta reserve en los intervalos y consultorios especificados.
              El calendario de la App de Usuario mostrará esos horarios como no disponibles automáticamente.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-600" />
              Consultorios Activos
            </h3>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
                Consultorio Verde
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E91E63]" />
                Consultorio Rosa
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1976D2]" />
                Consultorio Azul
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#212121]" />
                Consultorio Negro
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6D4C41]" />
                Consultorio Café
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabla de Bloqueos Activos y Futuros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Bloqueos Registrados ({bloqueos.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Listado histórico y programado de bloqueos administrativos y de mantenimiento.
            </p>
          </div>
          <button
            onClick={loadBloqueos}
            disabled={isLoadingBloqueos}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBloqueos ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {isLoadingBloqueos ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : bloqueos.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No hay bloqueos registrados actualmente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <th className="text-left px-5 py-3">Consultorio</th>
                  <th className="text-left px-5 py-3">Fecha Inicio</th>
                  <th className="text-left px-5 py-3">Fecha Fin</th>
                  <th className="text-left px-5 py-3">Motivo / Tipo</th>
                  <th className="text-center px-5 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bloqueos.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: b.consultorio_color || '#64748b' }} 
                        />
                        <span>{b.consultorio_nombre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs whitespace-nowrap">
                      {formatFecha(b.fecha_inicio)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs whitespace-nowrap">
                      {formatFecha(b.fecha_fin)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="capitalize text-xs font-semibold text-slate-800">
                          {b.motivo}
                        </span>
                        {b.recurrente && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-medium">
                            <Repeat className="w-2.5 h-2.5" />
                            Recurrente
                          </span>
                        )}
                      </div>
                      {b.patron_recurrencia && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {b.patron_recurrencia}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleEliminarBloqueo(b.id)}
                        disabled={deletingId === b.id}
                        title="Eliminar bloqueo"
                        className="p-1.5 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
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
