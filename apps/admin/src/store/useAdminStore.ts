import { create } from 'zustand';
import { MetricasResponse, ReservasPorConsultorio, ReservasSemana } from '../types/metricas';
import { fetchMetricas } from '../api/adminApi';
import { getPuertoConfig } from '../api/client';

type AdminTab = 'dashboard' | 'usuarios' | 'bloqueos' | 'reservas' | 'configuracion';

interface AdminState {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  metricas: MetricasResponse | null;
  isLoading: boolean;
  error: string | null;
  isAuthorized: boolean;
  checkAuth: () => void;
  cargarMetricas: (desde?: string, hasta?: string) => Promise<void>;
  getKpis: () => { horasHoy: number; sesionesSemana: number; creditosTotales: number; cancelacionesMes: number };
  getReservasPorConsultorio: () => ReservasPorConsultorio[];
  getReservasSemanas: () => ReservasSemana[];
}

export const useAdminStore = create<AdminState>((set, get) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  metricas: null,
  isLoading: false,
  error: null,
  isAuthorized: false,
  checkAuth: () => {
    const config = getPuertoConfig();
    // Usamos String() para forzar la comparación y que TypeScript no se queje
    const isAdminValid = String(config.isAdmin) === "1" || config.isAdmin === true;
    const isLoggedValid = String(config.isLoggedIn) === "1" || config.isLoggedIn === true;
    set({ isAuthorized: isAdminValid && isLoggedValid });
  },
  cargarMetricas: async (desde?: string, hasta?: string) => {
    try {
      set({ isLoading: true, error: null });
      const metricas = await fetchMetricas(desde, hasta);
      set({ metricas, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar métricas', isLoading: false });
    }
  },
  getKpis: () => {
    const m = get().metricas;
    if (!m) return { horasHoy: 0, sesionesSemana: 0, creditosTotales: 0, cancelacionesMes: 0 };
    if (m.kpis) {
      return {
        horasHoy: m.kpis.horas_hoy,
        sesionesSemana: m.kpis.sesiones_semana,
        creditosTotales: m.kpis.creditos_totales,
        cancelacionesMes: m.kpis.cancelaciones_mes,
      };
    }
    return {
      horasHoy: Math.round(m.reservas.horas_totales / 30),
      sesionesSemana: Math.round(m.reservas.confirmadas / 4),
      creditosTotales: m.reservas.horas_totales,
      cancelacionesMes: m.reservas.canceladas,
    };
  },
  getReservasPorConsultorio: () => {
    const m = get().metricas;
    if (m?.reservas_por_consultorio && m.reservas_por_consultorio.length > 0) {
      return m.reservas_por_consultorio;
    }
    const total = m?.reservas.total ?? 0;
    return [
      { nombre: 'Verde', color: '#2E7D32', reservas: Math.round(total * 0.25) },
      { nombre: 'Rosa', color: '#E91E63', reservas: Math.round(total * 0.22) },
      { nombre: 'Azul', color: '#1976D2', reservas: Math.round(total * 0.20) },
      { nombre: 'Negro', color: '#212121', reservas: Math.round(total * 0.18) },
      { nombre: 'Café', color: '#6D4C41', reservas: Math.round(total * 0.15) },
    ];
  },
  getReservasSemanas: () => {
    const m = get().metricas;
    if (m?.reservas_ultimas_4_semanas && m.reservas_ultimas_4_semanas.length > 0) {
      return m.reservas_ultimas_4_semanas;
    }
    const total = m?.reservas.total ?? 0;
    const now = new Date();
    const weeks: ReservasSemana[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      weeks.push({
        semana: 'Sem ' + d.getDate() + '/' + (d.getMonth() + 1),
        reservas: Math.round(total / 4 + (Math.random() * total * 0.1 - total * 0.05)),
      });
    }
    return weeks;
  },
}));
