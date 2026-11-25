import React, { useEffect, useState, useMemo } from 'react';
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
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Columns3,
  Calendar,
  ListFilter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  fetchReservasAdmin, 
  fetchConsultorios, 
  marcarNoShow, 
  cancelarReservaAdmin,
  fetchDisponibilidadAdmin
} from '../../api/adminApi';
import { ReservaAdmin, ConsultorioSimple } from '../../types/usuarios';
import clsx from 'clsx';

const estadoBadges: Record<string, { label: string; cls: string }> = {
  confirmada:     { label: 'Confirmada', cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' },
  consumida:      { label: 'Consumida',  cls: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60' },
  cancelada:      { label: 'Cancelada',  cls: 'bg-red-50 dark:bg-rose-950/40 text-red-700 dark:text-rose-400 border-red-200 dark:border-rose-800/60' },
  no_show:        { label: 'No-Show',    cls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/60' },
  pendiente_pago: { label: 'Pendiente',  cls: 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700' },
  liberada:       { label: 'Liberada',   cls: 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 border-gray-200 dark:border-neutral-700' },
};

const DIAS_SEMANA = [
  { id: -1, label: 'Cualquier día' },
  { id: 1, label: 'Solo Lunes' },
  { id: 2, label: 'Solo Martes' },
  { id: 3, label: 'Solo Miércoles' },
  { id: 4, label: 'Solo Jueves' },
  { id: 5, label: 'Solo Viernes' },
  { id: 6, label: 'Solo Sábados' },
];

export const ReservasPage: React.FC = () => {
  const [reservas, setReservas] = useState<ReservaAdmin[]>([]);
  const [consultorios, setConsultorios] = useState<ConsultorioSimple[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modo de vista: 'lista' (agrupado por mes) o 'dia' (5 columnas por consultorio)
  const [modoVista, setModoVista] = useState<'lista' | 'dia'>('lista');

  // Filtros de listado
  const [consultorioFiltro, setConsultorioFiltro] = useState<number>(0);
  const [fechaFiltro, setFechaFiltro] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('');
  const [diaSemanaFiltro, setDiaSemanaFiltro] = useState<number>(-1);
  const [anioFiltro, setAnioFiltro] = useState<string>('todos');
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');

  // Acordeón de meses colapsados
  const [mesesColapsados, setMesesColapsados] = useState<Record<string, boolean>>({});

  // Estados para Vista de Día
  const hoyStr = new Date().toISOString().split('T')[0];
  const [fechaDiaVista, setFechaDiaVista] = useState<string>(hoyStr);
  const [slotsDia, setSlotsDia] = useState<Record<number, any[]>>({});
  const [loadingSlotsDia, setLoadingSlotsDia] = useState(false);

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

  // Cargar disponibilidad de los 5 consultorios al estar en Vista de Día
  useEffect(() => {
    if (modoVista === 'dia' && consultorios.length > 0) {
      cargarDisponibilidadDia(fechaDiaVista);
    }
  }, [modoVista, fechaDiaVista, consultorios]);

  const cargarDisponibilidadDia = async (fecha: string) => {
    try {
      setLoadingSlotsDia(true);
      const resultados: Record<number, any[]> = {};
      await Promise.all(
        consultorios.map(async (c) => {
          try {
            const slots = await fetchDisponibilidadAdmin(c.id, fecha, fecha);
            resultados[c.id] = slots;
          } catch {
            resultados[c.id] = [];
          }
        })
      );
      setSlotsDia(resultados);
    } catch {
      // Silencioso
    } finally {
      setLoadingSlotsDia(false);
    }
  };

  const handleMarcarNoShow = async (id: number) => {
    if (!window.confirm('¿Deseas marcar esta reserva como No-Show? Se debitará el saldo correspondiente si aplica.')) {
      return;
    }

    try {
      setActionLoadingId(id);
      setActionMessage(null);
      await marcarNoShow(id);
      setActionMessage({ type: 'success', text: `Reserva #${id} marcada como No-Show.` });
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
    if (motivo === null) return;

    try {
      setActionLoadingId(id);
      setActionMessage(null);
      await cancelarReservaAdmin(id, motivo);
      setActionMessage({ type: 'success', text: `Reserva #${id} cancelada administrativamente.` });
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
    setDiaSemanaFiltro(-1);
    setAnioFiltro('todos');
    setBusquedaTexto('');
  };

  // Años disponibles
  const aniosDisponibles = useMemo(() => {
    const s = new Set<string>();
    reservas.forEach((r) => {
      try {
        const y = r.fecha_inicio.substring(0, 4);
        if (y) s.add(y);
      } catch {}
    });
    return Array.from(s).sort().reverse();
  }, [reservas]);

  // Filtrado cruzado
  const reservasFiltradas = useMemo(() => {
    return reservas.filter((r) => {
      // Texto de búsqueda
      if (busquedaTexto.trim()) {
        const q = busquedaTexto.toLowerCase();
        const matchesText =
          r.usuario_nombre.toLowerCase().includes(q) ||
          r.usuario_email.toLowerCase().includes(q) ||
          String(r.id).includes(q);
        if (!matchesText) return false;
      }

      // Día de la semana
      if (diaSemanaFiltro !== -1) {
        try {
          const d = new Date(r.fecha_inicio.replace(' ', 'T'));
          if (d.getDay() !== diaSemanaFiltro) return false;
        } catch {
          return false;
        }
      }

      // Año
      if (anioFiltro !== 'todos') {
        const y = r.fecha_inicio.substring(0, 4);
        if (y !== anioFiltro) return false;
      }

      return true;
    });
  }, [reservas, busquedaTexto, diaSemanaFiltro, anioFiltro]);

  // Agrupación por Mes
  const gruposPorMes = useMemo(() => {
    const mapa: Record<string, { clave: string; nombre: string; reservas: ReservaAdmin[]; totalHoras: number }> = {};

    reservasFiltradas.forEach((r) => {
      try {
        const d = new Date(r.fecha_inicio.replace(' ', 'T'));
        const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const mesNombre = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
        const nombre = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);

        if (!mapa[clave]) {
          mapa[clave] = { clave, nombre, reservas: [], totalHoras: 0 };
        }
        mapa[clave].reservas.push(r);
        mapa[clave].totalHoras += r.duracion_horas || 1;
      } catch {
        const clave = 'otros';
        if (!mapa[clave]) {
          mapa[clave] = { clave, nombre: 'Otras', reservas: [], totalHoras: 0 };
        }
        mapa[clave].reservas.push(r);
      }
    });

    return Object.values(mapa).sort((a, b) => b.clave.localeCompare(a.clave));
  }, [reservasFiltradas]);

  const toggleMes = (clave: string) => {
    setMesesColapsados((prev) => ({ ...prev, [clave]: !prev[clave] }));
  };

  const expandirTodosMeses = () => setMesesColapsados({});
  const colapsarTodosMeses = () => {
    const c: Record<string, boolean> = {};
    gruposPorMes.forEach((g) => (c[g.clave] = true));
    setMesesColapsados(c);
  };

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

  const cambiarDia = (diasDelta: number) => {
    const cur = new Date(fechaDiaVista + 'T12:00:00');
    cur.setDate(cur.getDate() + diasDelta);
    setFechaDiaVista(cur.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-5">
      {/* Header y Selector de Modo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Gestión de Reservas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Supervisa sesiones agendadas, filtra por consultorio y consulta ocupación diaria.
          </p>
        </div>

        {/* Acciones y Toggle de Modo */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center bg-slate-200/80 dark:bg-neutral-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setModoVista('lista')}
              className={clsx(
                'min-h-[40px] flex items-center gap-1.5 px-3 rounded-lg font-semibold transition-all active:scale-95',
                modoVista === 'lista'
                  ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-neutral-100 shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
              )}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Por Mes</span>
            </button>
            <button
              onClick={() => setModoVista('dia')}
              className={clsx(
                'min-h-[40px] flex items-center gap-1.5 px-3 rounded-lg font-semibold transition-all active:scale-95',
                modoVista === 'dia'
                  ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-neutral-100 shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
              )}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Vista de Día (5)</span>
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-xs active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Notificación de acción */}
      {actionMessage && (
        <div
          className={clsx(
            'flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm border animate-in fade-in',
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-rose-950/40 border-red-200 dark:border-rose-800 text-red-800 dark:text-rose-200'
          )}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-rose-400" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* MODO 1: LISTADO CON FILTROS Y AGRUPACIÓN POR MES */}
      {modoVista === 'lista' && (
        <div className="space-y-4">
          {/* Barra de Filtros Cruzados */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 shadow-xs space-y-3 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800 text-xs font-bold text-slate-700 dark:text-neutral-300">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Filtros Cruzados:
              </span>
              <button
                onClick={limpiarFiltros}
                className="text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 font-normal hover:underline"
              >
                Limpiar todo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
              {/* Búsqueda por texto */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar terapeuta o ID..."
                  value={busquedaTexto}
                  onChange={(e) => setBusquedaTexto(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Filtro Consultorio */}
              <div>
                <select
                  value={consultorioFiltro}
                  onChange={(e) => setConsultorioFiltro(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value={0}>Todos los consultorios</option>
                  {consultorios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Día de la semana */}
              <div>
                <select
                  value={diaSemanaFiltro}
                  onChange={(e) => setDiaSemanaFiltro(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {DIAS_SEMANA.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Estado */}
              <div>
                <select
                  value={estadoFiltro}
                  onChange={(e) => setEstadoFiltro(e.target.value)}
                  className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">Todos los estados</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="consumida">Consumida</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="no_show">No-Show</option>
                  <option value="pendiente_pago">Pendiente</option>
                </select>
              </div>

              {/* Filtro Año */}
              <div>
                <select
                  value={anioFiltro}
                  onChange={(e) => setAnioFiltro(e.target.value)}
                  className="w-full px-3 py-2 text-xs min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="todos">Todos los años</option>
                  {aniosDisponibles.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Controles de expansión del Acordeón */}
            {gruposPorMes.length > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-neutral-800 text-xs text-slate-500 dark:text-neutral-400">
                <span>
                  Total: {reservasFiltradas.length} reservas en {gruposPorMes.length} meses
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={expandirTodosMeses}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    Expandir todos
                  </button>
                  <span>•</span>
                  <button
                    onClick={colapsarTodosMeses}
                    className="text-xs text-slate-500 dark:text-neutral-400 font-semibold hover:underline"
                  >
                    Colapsar todos
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error general */}
          {error && (
            <div className="bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900 text-red-700 dark:text-rose-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Listado con Acordeón por Mes */}
          {isLoading ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 space-y-3 border border-slate-200 dark:border-neutral-800 shadow-xs">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : reservasFiltradas.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center text-sm text-slate-500 dark:text-neutral-400 border border-slate-200 dark:border-neutral-800 shadow-xs">
              No se encontraron reservas con los filtros aplicados.
            </div>
          ) : (
            <div className="space-y-4">
              {gruposPorMes.map((grupo) => {
                const isColapsado = !!mesesColapsados[grupo.clave];

                return (
                  <div
                    key={grupo.clave}
                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs overflow-hidden transition-colors"
                  >
                    {/* Encabezado del Acordeón del Mes */}
                    <button
                      type="button"
                      onClick={() => toggleMes(grupo.clave)}
                      className="w-full min-h-[52px] px-4 sm:px-6 py-3.5 flex items-center justify-between text-left bg-slate-50/80 dark:bg-neutral-800/50 hover:bg-slate-100/80 dark:hover:bg-neutral-800/80 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-neutral-100">
                          {grupo.nombre}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-neutral-200">
                          {grupo.reservas.length} {grupo.reservas.length === 1 ? 'reserva' : 'reservas'}
                        </span>
                        <span className="hidden sm:inline-flex text-xs font-medium text-slate-500 dark:text-neutral-400">
                          ({grupo.totalHoras} hrs agendadas)
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-slate-400 dark:text-neutral-500">
                        <span className="text-xs hidden sm:inline">
                          {isColapsado ? 'Expandir' : 'Colapsar'}
                        </span>
                        {isColapsado ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronUp className="w-5 h-5" />
                        )}
                      </div>
                    </button>

                    {/* Contenido expandible: Tabla / Tarjetas */}
                    {!isColapsado && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50/40 dark:bg-neutral-800/20 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                              <th className="text-left px-4 py-3">ID / Terapeuta</th>
                              <th className="text-left px-4 py-3">Consultorio</th>
                              <th className="text-left px-4 py-3">Fecha y Horario</th>
                              <th className="text-center px-4 py-3">Modalidad</th>
                              <th className="text-center px-4 py-3">Estado</th>
                              <th className="text-center px-4 py-3">Acciones Admin</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                            {grupo.reservas.map((r) => {
                              const { fecha, horario } = formatFechaHora(r.fecha_inicio, r.fecha_fin);
                              const badge = estadoBadges[r.estado] || estadoBadges.pendiente_pago;
                              const puedeModificar = r.estado === 'confirmada' || r.estado === 'consumida';

                              return (
                                <tr
                                  key={r.id}
                                  className="hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                                  style={{ borderLeftColor: r.consultorio_color || '#2E7D32', borderLeftWidth: '4px' }}
                                >
                                  {/* ID y Terapeuta */}
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-400 dark:text-neutral-500">#{r.id}</span>
                                      <div>
                                        <p className="font-semibold text-slate-800 dark:text-neutral-100 text-xs leading-tight">
                                          {r.usuario_nombre}
                                        </p>
                                        <p className="text-[11px] text-slate-400 dark:text-neutral-500">{r.usuario_email}</p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Consultorio (acento sutil) */}
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: r.consultorio_color || '#2E7D32' }}
                                      />
                                      <span className="text-xs font-medium text-slate-700 dark:text-neutral-200">
                                        {r.consultorio_nombre}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Fecha y Horario */}
                                  <td className="px-4 py-3">
                                    <div className="text-xs text-slate-800 dark:text-neutral-200 font-medium">{fecha}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      <span>{horario} ({r.duracion_horas}h)</span>
                                    </div>
                                  </td>

                                  {/* Tipo */}
                                  <td className="px-4 py-3 text-center">
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 capitalize border border-slate-200 dark:border-neutral-700">
                                      {r.tipo}
                                      {r.es_recurrente && (
                                        <span title="Serie Recurrente">
                                          <Repeat className="w-3 h-3 text-purple-600 dark:text-purple-400" />
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
                                    <div className="flex items-center justify-center gap-2">
                                      {puedeModificar ? (
                                        <>
                                          <button
                                            onClick={() => handleMarcarNoShow(r.id)}
                                            disabled={actionLoadingId === r.id}
                                            title="Marcar No-Show"
                                            className="min-h-[36px] flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 rounded-lg border border-amber-200 dark:border-amber-800/60 transition-colors disabled:opacity-50 active:scale-95"
                                          >
                                            <UserX className="w-3.5 h-3.5" />
                                            <span>No-Show</span>
                                          </button>
                                          <button
                                            onClick={() => handleCancelarReserva(r.id)}
                                            disabled={actionLoadingId === r.id}
                                            title="Cancelar reserva administrativamente"
                                            className="min-h-[36px] flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-rose-400 bg-red-50 dark:bg-rose-950/40 hover:bg-red-100 rounded-lg border border-red-200 dark:border-rose-800/60 transition-colors disabled:opacity-50 active:scale-95"
                                          >
                                            <XCircle className="w-3.5 h-3.5" />
                                            <span>Cancelar</span>
                                          </button>
                                        </>
                                      ) : (
                                        <span className="text-xs text-slate-400 dark:text-neutral-500">—</span>
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODO 2: VISTA DE DÍA (5 CONSULTORIOS EN PARALELO) */}
      {modoVista === 'dia' && (
        <div className="space-y-4">
          {/* Navegador de Fecha Diaria */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => cambiarDia(-1)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 text-slate-700 dark:text-neutral-300 active:scale-95 transition-all"
                title="Día anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setFechaDiaVista(hoyStr)}
                className="min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 text-slate-700 dark:text-neutral-300 active:scale-95 transition-all"
              >
                Hoy
              </button>
              <button
                onClick={() => cambiarDia(1)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 text-slate-700 dark:text-neutral-300 active:scale-95 transition-all"
                title="Día siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <input
                type="date"
                value={fechaDiaVista}
                onChange={(e) => setFechaDiaVista(e.target.value)}
                className="min-h-[44px] px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-neutral-700 rounded-xl bg-slate-50 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 focus:outline-none"
              />
            </div>

            <div className="text-xs text-slate-500 dark:text-neutral-400">
              Mostrando disponibilidad de los 5 consultorios en simultáneo
            </div>
          </div>

          {/* Grid de 5 Columnas de Consultorios */}
          {loadingSlotsDia ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-neutral-800 shadow-xs">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-neutral-400">Consultando los 5 consultorios...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {consultorios.map((c) => {
                const slots = slotsDia[c.id] || [];
                const libres = slots.filter((s) => s.disponible).length;

                return (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col space-y-3"
                    style={{ borderTopColor: c.color, borderTopWidth: '4px' }}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="font-bold text-sm text-slate-900 dark:text-neutral-100">{c.nombre}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                        {libres} libres
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {slots.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">Sin slots</div>
                      ) : (
                        slots.map((s: any) => {
                          const esMantenimiento = s.motivo_no_disponible === 'mantenimiento';

                          if (s.disponible) {
                            return (
                              <div
                                key={s.hora_inicio}
                                className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700/80 bg-slate-50 dark:bg-neutral-800/40 text-slate-800 dark:text-neutral-200 flex items-center justify-between text-xs"
                              >
                                <span className="font-bold">{s.hora_inicio} - {s.hora_fin}</span>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                                  Libre
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={s.hora_inicio}
                              className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs flex items-center justify-between opacity-60 ${
                                esMantenimiento
                                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-neutral-800/30 border-slate-200 dark:border-neutral-800 text-slate-400 dark:text-neutral-500'
                              }`}
                            >
                              <span className="line-through">{s.hora_inicio} - {s.hora_fin}</span>
                              <span className="text-[10px] uppercase font-bold">
                                {esMantenimiento ? 'Mant.' : 'Ocupado'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
