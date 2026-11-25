import React, { useEffect, useState, useMemo } from 'react';
import { useReservasStore } from '../../store/useReservasStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { Loader } from '../common/Loader';
import { Modal } from '../common/Modal';
import { Reserva, CrearReservaPayload } from '../../types/reserva';
import {
  CalendarDays,
  Calendar,
  Clock,
  CalendarPlus,
  Download,
  XCircle,
  Repeat,
  RotateCw,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import {
  generateGoogleCalendarUrl,
  downloadIcsFile,
  downloadMultipleIcsFile,
} from '../../utils/calendarUtils';
import {
  formatHumanDate,
  formatDateToYMD,
  formatDateTimeToYMDHMS,
  formatDayHeader,
  parseDate,
} from '../../utils/dateUtils';

interface GrupoDia {
  fechaClave: string; // YYYY-MM-DD
  fechaTitulo: string; // e.g. "Lunes 24 de Noviembre"
  esHoy: boolean;
  seccion: 'hoy' | 'esta_semana' | 'proxima_semana' | 'siguientes';
  reservas: Reserva[];
}

function calcularDuracionHoras(r: Reserva): number {
  if (r.duracion_horas) return r.duracion_horas;
  try {
    const ini = parseDate(r.fecha_inicio).getTime();
    const fin = parseDate(r.fecha_fin).getTime();
    return Math.max(1, Math.round((fin - ini) / (1000 * 3600)));
  } catch {
    return 1;
  }
}

export const MiAgenda: React.FC = () => {
  const { reservas, cargarReservas, cancelar, cancelarSerieRecurrente, crear, isLoading } =
    useReservasStore();
  const { saldos, cargarSaldos } = useAuthStore();
  const { showToast, setActiveTab } = useUiStore();

  // Modales de confirmación de acción
  const [reservaACancelar, setReservaACancelar] = useState<Reserva | null>(null);
  const [reservaACancelarSerie, setReservaACancelarSerie] = useState<Reserva | null>(null);
  const [reservaARepetir, setReservaARepetir] = useState<Reserva | null>(null);
  const [reservaARepetirSerie, setReservaARepetirSerie] = useState<Reserva | null>(null);
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  useEffect(() => {
    cargarReservas();
    cargarSaldos();
  }, []);

  const totalHorasSaldo =
    saldos?.horas_disponibles ?? saldos?.resumen?.total_horas_disponibles ?? 0;

  // Filtrar reservas activas y futuras (confirmadas y fecha_fin >= hoy)
  const proximasReservas = useMemo(() => {
    const ahora = new Date();
    // Permitir ver reservas de hoy y futuras
    const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);

    return reservas
      .filter((r) => {
        if (r.estado !== 'confirmada') return false;
        try {
          const fFin = parseDate(r.fecha_fin);
          return fFin.getTime() >= hoyInicio.getTime();
        } catch {
          return true;
        }
      })
      .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
  }, [reservas]);

  // Agrupar por días y clasificar por semanas (Hoy, Esta Semana, Próxima Semana, Siguientes)
  const gruposPorDia = useMemo(() => {
    const hoyStr = formatDateToYMD(new Date());
    const ahora = new Date();
    const lunesEstaSemana = new Date(ahora);
    const day = lunesEstaSemana.getDay();
    const diff = lunesEstaSemana.getDate() - day + (day === 0 ? -6 : 1);
    lunesEstaSemana.setDate(diff);
    lunesEstaSemana.setHours(0, 0, 0, 0);

    const domingoEstaSemana = new Date(lunesEstaSemana);
    domingoEstaSemana.setDate(lunesEstaSemana.getDate() + 6);
    domingoEstaSemana.setHours(23, 59, 59, 999);

    const lunesProxSemana = new Date(lunesEstaSemana);
    lunesProxSemana.setDate(lunesEstaSemana.getDate() + 7);

    const domingoProxSemana = new Date(lunesProxSemana);
    domingoProxSemana.setDate(lunesProxSemana.getDate() + 6);
    domingoProxSemana.setHours(23, 59, 59, 999);

    const mapaDias: Record<string, Reserva[]> = {};
    proximasReservas.forEach((r) => {
      const fechaYMD = r.fecha_inicio.substring(0, 10);
      if (!mapaDias[fechaYMD]) mapaDias[fechaYMD] = [];
      mapaDias[fechaYMD].push(r);
    });

    const listaGrupos: GrupoDia[] = Object.keys(mapaDias)
      .sort()
      .map((fechaClave) => {
        const fechaObj = new Date(fechaClave + 'T00:00:00');
        const header = formatDayHeader(fechaObj);
        const esHoy = fechaClave === hoyStr;

        let seccion: 'hoy' | 'esta_semana' | 'proxima_semana' | 'siguientes' = 'siguientes';
        if (esHoy) {
          seccion = 'hoy';
        } else if (fechaObj <= domingoEstaSemana) {
          seccion = 'esta_semana';
        } else if (fechaObj <= domingoProxSemana) {
          seccion = 'proxima_semana';
        }

        return {
          fechaClave,
          fechaTitulo: `${header.diaNombre} ${header.fechaCompleta}`,
          esHoy,
          seccion,
          reservas: mapaDias[fechaClave],
        };
      });

    return listaGrupos;
  }, [proximasReservas]);

  // Sincronización masiva con Google Calendar (abre pestañas o primer evento)
  const handleSincronizarGoogleMasivo = () => {
    if (proximasReservas.length === 0) return;
    showToast('Abriendo eventos para sincronizar en Google Calendar...', 'info');
    proximasReservas.slice(0, 5).forEach((r, idx) => {
      setTimeout(() => {
        const url = generateGoogleCalendarUrl({
          title: `Reserva: Consultorio ${r.consultorio.nombre} - Puerto Analítico`,
          description: `Reserva confirmada en Puerto Analítico.\nConsultorio: ${r.consultorio.nombre}\nModalidad: ${r.tipo}`,
          location: `Puerto Analítico - Consultorio ${r.consultorio.nombre}`,
          startDate: r.fecha_inicio,
          endDate: r.fecha_fin,
        });
        window.open(url, '_blank');
      }, idx * 400);
    });
    if (proximasReservas.length > 5) {
      showToast('Se han abierto las primeras 5 reservas. Usa Descargar .ics para sincronizar todas de una vez.', 'info');
    }
  };

  // Sincronización masiva con Apple Calendar (.ics)
  const handleDescargarIcsMasivo = () => {
    if (proximasReservas.length === 0) return;
    const eventos = proximasReservas.map((r) => ({
      title: `Reserva: Consultorio ${r.consultorio.nombre} - Puerto Analítico`,
      description: `Reserva en Puerto Analítico.\nConsultorio: ${r.consultorio.nombre}\nModalidad: ${r.tipo}\nID Reserva: #${r.id}`,
      location: `Puerto Analítico - Consultorio ${r.consultorio.nombre}`,
      startDate: r.fecha_inicio,
      endDate: r.fecha_fin,
    }));
    downloadMultipleIcsFile(eventos, 'mi-agenda-completa-puerto-analitico.ics');
    showToast('Archivo .ics generado con todas tus reservas activas.', 'success');
  };

  // Acción: Cancelar individual
  const confirmarCancelarIndividual = async () => {
    if (!reservaACancelar) return;
    try {
      setProcesandoAccion(true);
      await cancelar(reservaACancelar.id);
      await cargarSaldos();
      showToast(`Reserva #${reservaACancelar.id} cancelada correctamente.`, 'success');
      setReservaACancelar(null);
    } catch (err: any) {
      showToast(err.message || 'Error al cancelar la reserva', 'error');
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Acción: Cancelar serie recurrente
  const confirmarCancelarSerie = async () => {
    if (!reservaACancelarSerie) return;
    const serieId = reservaACancelarSerie.serie_id ? String(reservaACancelarSerie.serie_id) : undefined;
    if (!serieId) {
      // Fallback a cancelar individual si no tiene serie_id
      await cancelar(reservaACancelarSerie.id);
      setReservaACancelarSerie(null);
      return;
    }

    try {
      setProcesandoAccion(true);
      const cant = await cancelarSerieRecurrente(serieId);
      await cargarSaldos();
      showToast(`Serie cancelada: ${cant} reservas futuras canceladas correctamente.`, 'success');
      setReservaACancelarSerie(null);
    } catch (err: any) {
      showToast(err.message || 'Error al cancelar la serie', 'error');
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Acción: Repetir 1 vez más (semana siguiente)
  const confirmarRepetirUnaVez = async () => {
    if (!reservaARepetir) return;
    try {
      setProcesandoAccion(true);
      const ini = parseDate(reservaARepetir.fecha_inicio);
      ini.setDate(ini.getDate() + 7);
      const fin = parseDate(reservaARepetir.fecha_fin);
      fin.setDate(fin.getDate() + 7);

      const payload: CrearReservaPayload = {
        consultorio_id: reservaARepetir.consultorio.id,
        fecha_inicio: formatDateTimeToYMDHMS(ini),
        fecha_fin: formatDateTimeToYMDHMS(fin),
        tipo: reservaARepetir.tipo,
      };

      await crear(payload);
      await cargarSaldos();
      showToast(`Reserva repetida exitosamente para el ${formatHumanDate(payload.fecha_inicio)}.`, 'success');
      setReservaARepetir(null);
    } catch (err: any) {
      showToast(err.message || 'Error al repetir la reserva', 'error');
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Acción: Repetir recurrentemente (hasta agotar saldo)
  const confirmarRepetirRecurrente = async () => {
    if (!reservaARepetirSerie) return;
    try {
      setProcesandoAccion(true);
      const duracion = calcularDuracionHoras(reservaARepetirSerie);
      const semanasPosibles = Math.floor(totalHorasSaldo / duracion);
      const semanasAcrear = Math.max(4, Math.min(24, semanasPosibles));

      const ini = parseDate(reservaARepetirSerie.fecha_inicio);
      ini.setDate(ini.getDate() + 7);
      const fin = parseDate(reservaARepetirSerie.fecha_fin);
      fin.setDate(fin.getDate() + 7);

      const payload: CrearReservaPayload = {
        consultorio_id: reservaARepetirSerie.consultorio.id,
        fecha_inicio: formatDateTimeToYMDHMS(ini),
        fecha_fin: formatDateTimeToYMDHMS(fin),
        tipo: reservaARepetirSerie.tipo,
        es_recurrente: true,
        semanas: semanasAcrear,
      };

      await crear(payload);
      await cargarSaldos();
      showToast(`Serie de ${semanasAcrear} semanas programada exitosamente.`, 'success');
      setReservaARepetirSerie(null);
    } catch (err: any) {
      showToast(err.message || 'Error al crear serie recurrente', 'error');
    } finally {
      setProcesandoAccion(false);
    }
  };

  if (isLoading && proximasReservas.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-slate-200 dark:border-neutral-800 shadow-xs">
        <Loader mensaje="Cargando tu agenda de reservas..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header de Mi Agenda con sincronización masiva */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-neutral-800 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-neutral-800 text-white flex items-center justify-center shadow-xs">
              <CalendarDays className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-neutral-100 leading-tight">
                Mi Agenda
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {proximasReservas.length === 1
                  ? '1 próxima reserva confirmada'
                  : `${proximasReservas.length} próximas reservas confirmadas`}
              </p>
            </div>
          </div>

          {/* Botones de Sincronización Masiva */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSincronizarGoogleMasivo}
              disabled={proximasReservas.length === 0}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              title="Abrir y sincronizar con Google Calendar"
            >
              <CalendarPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Sincronizar Google</span>
            </button>

            <button
              type="button"
              onClick={handleDescargarIcsMasivo}
              disabled={proximasReservas.length === 0}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-neutral-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
              title="Descargar archivo .ics compatible con Apple Calendar y dispositivos móviles"
            >
              <Download className="w-4 h-4" />
              <span>Descargar .ics (Apple Calendar)</span>
            </button>
          </div>
        </div>

        {/* Resumen rápido de saldo disponible */}
        <div className="pt-3 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Saldo en cuenta: <strong className="text-slate-800 dark:text-neutral-200">{totalHorasSaldo} horas</strong> disponibles para reservar</span>
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('reservar')}
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva reserva</span>
          </button>
        </div>
      </div>

      {/* Lista Vertical de Próximas Reservas por Día */}
      {gruposPorDia.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-10 border border-slate-200 dark:border-neutral-800 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-neutral-200">
            No tienes reservas próximas
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
            Tu agenda está libre. Puedes elegir un consultorio y reservar tus horarios de consulta en pocos toques.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('reservar')}
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
            >
              Ir a Reservar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {gruposPorDia.map((grupo) => (
            <div key={grupo.fechaClave} className="space-y-2.5">
              {/* Encabezado del Día */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-neutral-200" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-neutral-100 uppercase tracking-wider">
                    {grupo.fechaTitulo}
                  </h3>
                  {grupo.esHoy && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Hoy
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500">
                  {grupo.reservas.length} {grupo.reservas.length === 1 ? 'reserva' : 'reservas'}
                </span>
              </div>

              {/* Tarjetas de Reservación con Botones de Acción Inmediata */}
              <div className="space-y-3">
                {grupo.reservas.map((r) => {
                  const horaIni = r.fecha_inicio.substring(11, 16);
                  const horaFin = r.fecha_fin.substring(11, 16);
                  const esRecurrente = Boolean(r.es_recurrente || r.serie_id);
                  const duracion = calcularDuracionHoras(r);

                  return (
                    <div
                      key={r.id}
                      className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-neutral-800 shadow-xs hover:border-slate-300 dark:hover:border-neutral-700 transition-all space-y-3"
                    >
                      {/* Fila principal: Consultorio, horario y badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-neutral-800">
                        <div className="flex items-center space-x-3">
                          <span
                            className="w-4 h-4 rounded-full shadow-xs flex-shrink-0"
                            style={{ backgroundColor: r.consultorio.color }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-neutral-100">
                                {r.consultorio.nombre}
                              </span>
                              <span className="text-[10px] bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 px-1.5 py-0.5 rounded font-mono">
                                #{r.id}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-semibold text-slate-800 dark:text-neutral-200">
                                de {parseInt(horaIni, 10)} a {parseInt(horaFin, 10)} ({horaIni} – {horaFin})
                              </span>
                              <span>•</span>
                              <span>{duracion}h</span>
                            </div>
                          </div>
                        </div>

                        {/* Badges de modalidad y recurrencia */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-[11px] font-semibold px-2 py-0.5 rounded-lg capitalize">
                            {r.tipo}
                          </span>
                          {esRecurrente && (
                            <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <Repeat className="w-3 h-3" />
                              Recurrente
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botones de Acción Inmediata (Mobile-First touch targets) */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* 1. Guardar en Google Calendar */}
                        <button
                          type="button"
                          onClick={() => {
                            const url = generateGoogleCalendarUrl({
                              title: `Reserva: Consultorio ${r.consultorio.nombre} - Puerto Analítico`,
                              description: `Reserva confirmada en Puerto Analítico.\nConsultorio: ${r.consultorio.nombre}\nModalidad: ${r.tipo}\nID: #${r.id}`,
                              location: `Puerto Analítico - Consultorio ${r.consultorio.nombre}`,
                              startDate: r.fecha_inicio,
                              endDate: r.fecha_fin,
                            });
                            window.open(url, '_blank');
                          }}
                          className="min-h-[44px] flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700/60 text-slate-700 dark:text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          title="Añadir a Google Calendar"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Google Cal</span>
                        </button>

                        {/* 2. Guardar en Apple Calendar */}
                        <button
                          type="button"
                          onClick={() => {
                            downloadIcsFile({
                              title: `Reserva: Consultorio ${r.consultorio.nombre} - Puerto Analítico`,
                              description: `Reserva confirmada en Puerto Analítico.\nConsultorio: ${r.consultorio.nombre}\nModalidad: ${r.tipo}\nID: #${r.id}`,
                              location: `Puerto Analítico - Consultorio ${r.consultorio.nombre}`,
                              startDate: r.fecha_inicio,
                              endDate: r.fecha_fin,
                            }, `reserva-${r.id}-puerto-analitico.ics`);
                            showToast('Descargando archivo .ics para Apple Calendar...', 'info');
                          }}
                          className="min-h-[44px] flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700/60 text-slate-700 dark:text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          title="Descargar archivo para Apple Calendar"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Apple Cal</span>
                        </button>

                        {/* 3. Repetir 1 vez más */}
                        <button
                          type="button"
                          onClick={() => setReservaARepetir(r)}
                          className="min-h-[44px] flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          title="Repetir este horario la próxima semana"
                        >
                          <RotateCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Repetir 1 vez</span>
                        </button>

                        {/* 4. Repetir recurrentemente */}
                        <button
                          type="button"
                          onClick={() => setReservaARepetirSerie(r)}
                          className="min-h-[44px] flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          title="Repetir recurrentemente hasta agotar saldo"
                        >
                          <Repeat className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Repetir serie</span>
                        </button>

                        {/* 5. Cancelar recurrente (si aplica) */}
                        {esRecurrente && (
                          <button
                            type="button"
                            onClick={() => setReservaACancelarSerie(r)}
                            className="min-h-[44px] flex-1 sm:flex-none px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                            title="Cancelar de este día hacia adelante"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancelar serie</span>
                          </button>
                        )}

                        {/* 6. Cancelar reserva individual */}
                        <button
                          type="button"
                          onClick={() => setReservaACancelar(r)}
                          className="min-h-[44px] flex-1 sm:flex-none px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 dark:text-neutral-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          title="Cancelar esta reserva"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Confirmación Cancelar Individual */}
      {reservaACancelar && (
        <Modal
          isOpen={true}
          onClose={() => setReservaACancelar(null)}
          title="¿Cancelar Reserva?"
          maxWidth="sm"
        >
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs">
                Regla R8: Las cancelaciones con más de 24 horas de anticipación reembolsan el 100% de las horas a tu saldo.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-neutral-800 p-3.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs space-y-1">
              <div><strong>Consultorio:</strong> {reservaACancelar.consultorio.nombre}</div>
              <div><strong>Fecha:</strong> {formatHumanDate(reservaACancelar.fecha_inicio)}</div>
              <div><strong>Duración:</strong> {calcularDuracionHoras(reservaACancelar)} hora(s)</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReservaACancelar(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmarCancelarIndividual}
                disabled={procesandoAccion}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {procesandoAccion ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: Confirmación Cancelar Serie Recurrente */}
      {reservaACancelarSerie && (
        <Modal
          isOpen={true}
          onClose={() => setReservaACancelarSerie(null)}
          title="¿Cancelar Serie Recurrente?"
          maxWidth="sm"
        >
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs">
                Se cancelarán todas las reservas futuras asociadas a esta serie recurrente de este día en adelante. Las horas de reservas canceladas con más de 24h volverán a tu saldo.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-neutral-800 p-3.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs space-y-1">
              <div><strong>Consultorio:</strong> {reservaACancelarSerie.consultorio.nombre}</div>
              <div><strong>A partir de:</strong> {formatHumanDate(reservaACancelarSerie.fecha_inicio)}</div>
              <div><strong>Serie ID:</strong> {reservaACancelarSerie.serie_id || 'Serie activa'}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReservaACancelarSerie(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmarCancelarSerie}
                disabled={procesandoAccion}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {procesandoAccion ? 'Cancelando serie...' : 'Cancelar Serie Futura'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: Confirmación Repetir 1 Vez Más */}
      {reservaARepetir && (
        <Modal
          isOpen={true}
          onClose={() => setReservaARepetir(null)}
          title="Repetir 1 vez más"
          maxWidth="sm"
        >
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-600 dark:text-neutral-400">
              ¿Deseas programar una nueva reserva exactamente en el mismo consultorio y horario para la semana siguiente?
            </p>

            <div className="bg-slate-50 dark:bg-neutral-800 p-3.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs space-y-1">
              <div><strong>Consultorio:</strong> {reservaARepetir.consultorio.nombre}</div>
              <div><strong>Horas a descontar:</strong> {calcularDuracionHoras(reservaARepetir)} hora(s)</div>
              <div><strong>Saldo disponible actual:</strong> {totalHorasSaldo} hora(s)</div>
            </div>

            {totalHorasSaldo < calcularDuracionHoras(reservaARepetir) && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                ⚠️ Atención: Tu saldo de horas es insuficiente para esta acción.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReservaARepetir(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRepetirUnaVez}
                disabled={procesandoAccion || totalHorasSaldo < calcularDuracionHoras(reservaARepetir)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {procesandoAccion ? 'Programando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: Confirmación Repetir Recurrentemente */}
      {reservaARepetirSerie && (
        <Modal
          isOpen={true}
          onClose={() => setReservaARepetirSerie(null)}
          title="Repetir recurrentemente"
          maxWidth="sm"
        >
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-600 dark:text-neutral-400">
              Se creará una serie semanal recurrente a partir de la siguiente semana aprovechando tu saldo de horas disponible.
            </p>

            <div className="bg-slate-50 dark:bg-neutral-800 p-3.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs space-y-1">
              <div><strong>Consultorio:</strong> {reservaARepetirSerie.consultorio.nombre}</div>
              <div><strong>Duración semanal:</strong> {calcularDuracionHoras(reservaARepetirSerie)} hora(s)</div>
              <div><strong>Saldo disponible:</strong> {totalHorasSaldo} horas</div>
              <div>
                <strong>Semanas posibles:</strong>{' '}
                {Math.max(4, Math.min(24, Math.floor(totalHorasSaldo / calcularDuracionHoras(reservaARepetirSerie))))} semanas
              </div>
            </div>

            {totalHorasSaldo < calcularDuracionHoras(reservaARepetirSerie) * 4 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                ⚠️ Las series recurrentes requieren un mínimo de 4 semanas de saldo disponible.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReservaARepetirSerie(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRepetirRecurrente}
                disabled={procesandoAccion || totalHorasSaldo < calcularDuracionHoras(reservaARepetirSerie) * 4}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {procesandoAccion ? 'Creando serie...' : 'Crear Serie Recurrente'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
