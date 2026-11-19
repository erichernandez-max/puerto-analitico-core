import React, { useEffect, useState } from 'react';
import { 
  CalendarDays, 
  RefreshCw, 
  Filter, 
  UserX, 
  XCircle, 
  Clock, 
  Repeat, 
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  fetchReservasAdmin, 
  fetchConsultorios, 
  marcarNoShow, 
  cancelarReservaAdmin 
} from '../../api/adminApi';
import { ReservaAdmin, ConsultorioSimple } from '../../types/usuarios';
import clsx from 'clsx';

const estadoBadges: Record<string, { label: string; cls: string }> = {
  confirmada:     { label: 'Confirmada', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  consumida:      { label: 'Consumida',  cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  cancelada:      { label: 'Cancelada',  cls: 'bg-red-100 text-red-800 border-red-200' },
  no_show:        { label: 'No-Show',    cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  pendiente_pago: { label: 'Pendiente',  cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  liberada:       { label: 'Liberada',   cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export const ReservasPage: React.FC = () => {
  const [reservas, setReservas] = useState<ReservaAdmin[]>([]);
  const [consultorios, setConsultorios] = useState<ConsultorioSimple[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [consultorioFiltro, setConsultorioFiltro] = useState<number>(0);
  const [fechaFiltro, setFechaFiltro] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('');
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');

  // Estados de acción
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [reservasData, consultoriosData] = await Promise.all([
        fetchReservasAdmin({
          consultorio_id: consultorioFiltro > 0 ? consultorioFiltro : undefined,
          fecha: fechaFiltro || undefined,
          estado: estadoFiltro || undefined,
        }),
        fetchConsultorios(),
      ]);

      setReservas(Array.isArray(reservasData) ? reservasData : []);
      if (Array.isArray(consultoriosData)) {
        setConsultorios(consultoriosData);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar reservas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [consultorioFiltro, fechaFiltro, estadoFiltro]);

  const handleMarcarNoShow = async (id: number) => {
    if (!window.confirm('¿Deseas marcar esta reserva como No-Show? Se debitará el saldo correspondiente si aplica.')) {
      return;
    }

    try {
      setActionLoadingId(id);
      setActionMessage(null);
      await marcarNoShow(id);
      setActionMessage({ type: 'success', text: `Reserva #${id} marcada como No-Show.` });
      // Actualizar localmente el estado
      setReservas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, estado: 'no_show' } : r))
      );
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error al marcar No-Show.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelarReserva = async (id: number) => {
    const motivo = window.prompt('Motivo de la cancelación administrativa (opcional):', 'Cancelación por administración');
    if (motivo === null) return; // Canceló el prompt

    try {
      setActionLoadingId(id);
      setActionMessage(null);
      await cancelarReservaAdmin(id, motivo);
      setActionMessage({ type: 'success', text: `Reserva #${id} cancelada administrativamente.` });
      // Actualizar localmente el estado
      setReservas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, estado: 'cancelada' } : r))
      );
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error al cancelar la reserva.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const limpiarFiltros = () => {
    setConsultorioFiltro(0);
    setFechaFiltro('');
    setEstadoFiltro('');
    setBusquedaTexto('');
  };

  const reservasFiltradas = reservas.filter((r) => {
    if (!busquedaTexto.trim()) return true;
    const q = busquedaTexto.toLowerCase();
    return (
      r.usuario_nombre.toLowerCase().includes(q) ||
      r.usuario_email.toLowerCase().includes(q) ||
      String(r.id).includes(q)
    );
  });

  const formatFechaHora = (fechaInicio: string, fechaFin: string) => {
    try {
      const dInicio = new Date(fechaInicio.replace(' ', 'T'));
      const dFin = new Date(fechaFin.replace(' ', 'T'));

      const fechaStr = dInicio.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const horaInicioStr = dInicio.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      const horaFinStr = dFin.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

      return {
        fecha: fechaStr,
        horario: `${horaInicioStr} - ${horaFinStr}`,
      };
    } catch {
      return {
        fecha: fechaInicio,
        horario: fechaFin,
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-600" />
            Gestión de Reservas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Supervisa todas las sesiones agendadas, pasadas y recurrentes del sistema.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Notificación de acción */}
      {actionMessage && (
        <div
          className={clsx(
            'flex items-center gap-2 px-4 py-3 rounded-lg text-sm border animate-in fade-in',
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          )}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Búsqueda por texto */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar terapeuta o ID..."
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filtro Consultorio */}
          <div>
            <select
              value={consultorioFiltro}
              onChange={(e) => setConsultorioFiltro(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={0}>Todos los consultorios</option>
              {consultorios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Fecha */}
          <div>
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
            />
          </div>

          {/* Filtro Estado */}
          <div>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos los estados</option>
              <option value="confirmada">Confirmada</option>
              <option value="consumida">Consumida</option>
              <option value="cancelada">Cancelada</option>
              <option value="no_show">No-Show</option>
              <option value="pendiente_pago">Pendiente de Pago</option>
            </select>
          </div>

          {/* Botón limpiar */}
          <div>
            <button
              onClick={limpiarFiltros}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Error general */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Tabla de Reservas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">
            Listado de Reservas ({reservasFiltradas.length})
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : reservasFiltradas.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No se encontraron reservas con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <th className="text-left px-4 py-3">ID / Terapeuta</th>
                  <th className="text-left px-4 py-3">Consultorio</th>
                  <th className="text-left px-4 py-3">Fecha y Horario</th>
                  <th className="text-center px-4 py-3">Modalidad</th>
                  <th className="text-center px-4 py-3">Estado</th>
                  <th className="text-center px-4 py-3">Acciones Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservasFiltradas.map((r) => {
                  const { fecha, horario } = formatFechaHora(r.fecha_inicio, r.fecha_fin);
                  const badge = estadoBadges[r.estado] || estadoBadges.pendiente_pago;
                  const puedeModificar = r.estado === 'confirmada' || r.estado === 'consumida';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      {/* ID y Terapeuta */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">#{r.id}</span>
                          <div>
                            <p className="font-semibold text-slate-800 text-xs leading-tight">
                              {r.usuario_nombre}
                            </p>
                            <p className="text-[11px] text-slate-400">{r.usuario_email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Consultorio */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: r.consultorio_color || '#2E7D32' }}
                          />
                          <span className="text-xs font-medium text-slate-700">
                            {r.consultorio_nombre}
                          </span>
                        </div>
                      </td>

                      {/* Fecha y Horario */}
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-800 font-medium">{fecha}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{horario} ({r.duracion_horas}h)</span>
                        </div>
                      </td>

                      {/* Tipo / Modalidad */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                          {r.tipo}
                          {r.es_recurrente && (
                            <span title="Serie Recurrente">
                              <Repeat className="w-3 h-3 text-purple-600" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={clsx(
                            'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border',
                            badge.cls
                          )}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {puedeModificar ? (
                            <>
                              <button
                                onClick={() => handleMarcarNoShow(r.id)}
                                disabled={actionLoadingId === r.id}
                                title="Marcar No-Show (inasistencia)"
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors disabled:opacity-50"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">No-Show</span>
                              </button>
                              <button
                                onClick={() => handleCancelarReserva(r.id)}
                                disabled={actionLoadingId === r.id}
                                title="Cancelar reserva administrativamente"
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Cancelar</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
