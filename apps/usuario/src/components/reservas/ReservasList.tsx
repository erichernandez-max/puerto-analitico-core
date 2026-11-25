import React, { useEffect, useState, useMemo } from 'react';
import { useReservasStore } from '../../store/useReservasStore';
import { useConsultoriosStore } from '../../store/useConsultoriosStore';
import { useUiStore } from '../../store/useUiStore';
import { ReservaCard } from './ReservaCard';
import { Loader } from '../common/Loader';
import {
  CalendarX,
  Plus,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';
import { Reserva } from '../../types/reserva';

const ESTADOS = [
  { id: 'todas', label: 'Todas' },
  { id: 'confirmada', label: 'Confirmadas' },
  { id: 'consumida', label: 'Consumidas' },
  { id: 'cancelada', label: 'Canceladas' },
];

const DIAS_SEMANA = [
  { id: -1, label: 'Cualquier día' },
  { id: 1, label: 'Solo Lunes' },
  { id: 2, label: 'Solo Martes' },
  { id: 3, label: 'Solo Miércoles' },
  { id: 4, label: 'Solo Jueves' },
  { id: 5, label: 'Solo Viernes' },
  { id: 6, label: 'Solo Sábados' },
];

export const ReservasList: React.FC = () => {
  const { reservas, filtroEstado, setFiltroEstado, cargarReservas, isLoading, error } =
    useReservasStore();
  const { consultorios } = useConsultoriosStore();
  const { setActiveTab } = useUiStore();

  // Filtros cruzados adicionales
  const [consultorioFiltro, setConsultorioFiltro] = useState<number>(0);
  const [diaSemanaFiltro, setDiaSemanaFiltro] = useState<number>(-1);
  const [anioFiltro, setAnioFiltro] = useState<string>('todos');

  // Control de grupos colapsados (Acordeón por Mes)
  const [gruposColapsados, setGruposColapsados] = useState<Record<string, boolean>>({});

  useEffect(() => {
    cargarReservas();
  }, []);

  // Extraer años disponibles
  const aniosDisponibles = useMemo(() => {
    const anios = new Set<string>();
    reservas.forEach((r) => {
      try {
        const year = r.fecha_inicio.substring(0, 4);
        if (year) anios.add(year);
      } catch {}
    });
    return Array.from(anios).sort().reverse();
  }, [reservas]);

  // Filtrado cruzado: Estado, Consultorio, Día de la semana, Año
  const reservasFiltradas = useMemo(() => {
    return reservas.filter((r) => {
      // Filtro Consultorio
      if (consultorioFiltro > 0 && r.consultorio.id !== consultorioFiltro) {
        return false;
      }

      // Filtro Día de la semana
      if (diaSemanaFiltro !== -1) {
        try {
          const d = new Date(r.fecha_inicio.replace(' ', 'T'));
          if (d.getDay() !== diaSemanaFiltro) return false;
        } catch {
          return false;
        }
      }

      // Filtro Año
      if (anioFiltro !== 'todos') {
        const year = r.fecha_inicio.substring(0, 4);
        if (year !== anioFiltro) return false;
      }

      return true;
    });
  }, [reservas, consultorioFiltro, diaSemanaFiltro, anioFiltro]);

  // Agrupación por Mes por defecto (Año-Mes)
  const gruposPorMes = useMemo(() => {
    const grupos: Record<
      string,
      {
        mesClave: string;
        mesNombre: string;
        reservas: Reserva[];
        totalHoras: number;
      }
    > = {};

    reservasFiltradas.forEach((r) => {
      try {
        const d = new Date(r.fecha_inicio.replace(' ', 'T'));
        const mesClave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const mesNombreRaw = d.toLocaleDateString('es-MX', {
          month: 'long',
          year: 'numeric',
        });
        const mesNombre = mesNombreRaw.charAt(0).toUpperCase() + mesNombreRaw.slice(1);

        if (!grupos[mesClave]) {
          grupos[mesClave] = {
            mesClave,
            mesNombre,
            reservas: [],
            totalHoras: 0,
          };
        }

        // Calcular duración en horas
        const dFin = new Date(r.fecha_fin.replace(' ', 'T'));
        const duracion = Math.max(1, Math.round((dFin.getTime() - d.getTime()) / (1000 * 60 * 60)));

        grupos[mesClave].reservas.push(r);
        grupos[mesClave].totalHoras += duracion;
      } catch {
        // Fallback a grupo sin fecha
        const clave = 'sin-fecha';
        if (!grupos[clave]) {
          grupos[clave] = {
            mesClave: clave,
            mesNombre: 'Otras reservas',
            reservas: [],
            totalHoras: 0,
          };
        }
        grupos[clave].reservas.push(r);
      }
    });

    // Ordenar descendente (mes más reciente primero)
    return Object.values(grupos).sort((a, b) => b.mesClave.localeCompare(a.mesClave));
  }, [reservasFiltradas]);

  const toggleGrupo = (clave: string) => {
    setGruposColapsados((prev) => ({
      ...prev,
      [clave]: !prev[clave],
    }));
  };

  const colapsarTodos = () => {
    const todos: Record<string, boolean> = {};
    gruposPorMes.forEach((g) => {
      todos[g.mesClave] = true;
    });
    setGruposColapsados(todos);
  };

  const expandirTodos = () => {
    setGruposColapsados({});
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros Cruzados (Año > Mes > Consultorio > Día > Estado) */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-neutral-800 shadow-xs space-y-3.5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-neutral-100">
              Filtros de reservas:
            </span>
          </div>

          {/* Filtro por estado tipo pills */}
          <div className="flex bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs overflow-x-auto no-scrollbar gap-1">
            {ESTADOS.map((f) => {
              const isActive = filtroEstado === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFiltroEstado(f.id)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap active:scale-95 ${
                    isActive
                      ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-neutral-100 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fila de Filtros Cruzados (Año, Consultorio, Día de la semana) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-neutral-800">
          {/* Consultorio */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mb-1">
              Consultorio:
            </label>
            <select
              value={consultorioFiltro}
              onChange={(e) => setConsultorioFiltro(Number(e.target.value))}
              className="w-full min-h-[44px] bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 text-xs rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value={0}>Todos los consultorios</option>
              {consultorios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Día de la semana */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mb-1">
              Día de la semana:
            </label>
            <select
              value={diaSemanaFiltro}
              onChange={(e) => setDiaSemanaFiltro(Number(e.target.value))}
              className="w-full min-h-[44px] bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 text-xs rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {DIAS_SEMANA.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Año */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mb-1">
              Año:
            </label>
            <select
              value={anioFiltro}
              onChange={(e) => setAnioFiltro(e.target.value)}
              className="w-full min-h-[44px] bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 text-xs rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-slate-900"
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

        {/* Acciones de Acordeón: Expandir / Colapsar todos */}
        {gruposPorMes.length > 1 && (
          <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-neutral-400">
            <span>
              Mostrando {reservasFiltradas.length} reservas en {gruposPorMes.length} meses
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandirTodos}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Expandir todos
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={colapsarTodos}
                className="text-xs text-slate-500 dark:text-neutral-400 hover:underline font-semibold"
              >
                Colapsar todos
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 border border-slate-200 dark:border-neutral-800 shadow-xs">
          <Loader mensaje="Cargando tu historial de reservas..." />
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-rose-200 dark:border-rose-900/60 shadow-xs text-center">
          <p className="text-sm text-rose-600 dark:text-rose-400 font-semibold">{error}</p>
        </div>
      ) : reservasFiltradas.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-10 border border-slate-200 dark:border-neutral-800 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 mx-auto flex items-center justify-center">
            <CalendarX className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-neutral-100">
              No hay reservas con los filtros seleccionados
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              Prueba cambiando los filtros o reserva un nuevo horario en el calendario.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('reservar')}
            className="min-h-[48px] inline-flex items-center space-x-2 bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Hacer una Reserva</span>
          </button>
        </div>
      ) : (
        /* Listado agrupado por Mes con Acordeón */
        <div className="space-y-4">
          {gruposPorMes.map((grupo) => {
            const isColapsado = !!gruposColapsados[grupo.mesClave];

            return (
              <div
                key={grupo.mesClave}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs overflow-hidden transition-colors"
              >
                {/* Cabecera de Acordeón del Mes */}
                <button
                  type="button"
                  onClick={() => toggleGrupo(grupo.mesClave)}
                  className="w-full min-h-[52px] px-4 sm:px-5 py-3 flex items-center justify-between text-left bg-slate-50/70 dark:bg-neutral-800/40 hover:bg-slate-100/70 dark:hover:bg-neutral-800/70 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-neutral-100">
                      {grupo.mesNombre}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-neutral-300">
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

                {/* Contenido expandible de tarjetas */}
                {!isColapsado && (
                  <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-neutral-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {grupo.reservas.map((reserva) => (
                        <ReservaCard key={reserva.id} reserva={reserva} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
