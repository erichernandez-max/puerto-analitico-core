import { create } from 'zustand';
import {
  Reserva,
  CrearReservaPayload,
  ReagendarReservaPayload,
} from '../types/reserva';
import { fetchMisReservas } from '../api/meApi';
import {
  crearReserva,
  cancelarReserva,
  reagendarReserva,
  cancelarSerie,
} from '../api/reservasApi';

interface ReservasState {
  reservas: Reserva[];
  filtroEstado: string;
  isLoading: boolean;
  error: string | null;

  cargarReservas: () => Promise<void>;
  setFiltroEstado: (estado: string) => void;
  crear: (payload: CrearReservaPayload) => Promise<Reserva>;
  cancelar: (id: number, motivo?: string) => Promise<void>;
  reagendar: (id: number, payload: ReagendarReservaPayload) => Promise<void>;
  cancelarSerieRecurrente: (serieId: string) => Promise<number>;
}

export const useReservasStore = create<ReservasState>((set, get) => ({
  reservas: [],
  filtroEstado: 'todas',
  isLoading: false,
  error: null,

  cargarReservas: async () => {
    try {
      set({ isLoading: true, error: null });
      const { filtroEstado } = get();
      const estadoParam = filtroEstado === 'todas' ? undefined : filtroEstado;
      const reservas = await fetchMisReservas(undefined, undefined, estadoParam);
      set({ reservas, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar reservas', isLoading: false });
    }
  },

  setFiltroEstado: (estado: string) => {
    set({ filtroEstado: estado });
    get().cargarReservas();
  },

  crear: async (payload: CrearReservaPayload) => {
    set({ isLoading: true, error: null });
    try {
      const nueva = await crearReserva(payload);
      await get().cargarReservas();
      set({ isLoading: false });
      return nueva;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  cancelar: async (id: number, motivo?: string) => {
    set({ isLoading: true, error: null });
    try {
      await cancelarReserva(id, { motivo });
      await get().cargarReservas();
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  reagendar: async (id: number, payload: ReagendarReservaPayload) => {
    set({ isLoading: true, error: null });
    try {
      await reagendarReserva(id, payload);
      await get().cargarReservas();
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  cancelarSerieRecurrente: async (serieId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await cancelarSerie(serieId);
      await get().cargarReservas();
      set({ isLoading: false });
      return res.canceladas;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },
}));
