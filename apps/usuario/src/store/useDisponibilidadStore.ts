import { create } from 'zustand';
import { SlotDisponibilidad } from '../types/disponibilidad';
import { TipoReserva } from '../types/reserva';
import { fetchDisponibilidad } from '../api/disponibilidadApi';
import {
  formatDateToYMD,
  getMondayOfWeek,
} from '../utils/dateUtils';
import { validarBloqueHoras } from '../utils/reglasValidation';

interface SelectedSlot {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}

interface DisponibilidadState {
  semanaLunes: Date;
  slots: SlotDisponibilidad[];
  slotsSeleccionados: SelectedSlot[];
  tipoReserva: TipoReserva;
  esRecurrente: boolean;
  semanasRecurrente: number;
  isLoading: boolean;
  error: string | null;

  cargarSemana: (consultorioId: number) => Promise<void>;
  avanzarSemana: (consultorioId: number) => Promise<void>;
  retrocederSemana: (consultorioId: number) => Promise<void>;
  irASemanaActual: (consultorioId: number) => Promise<void>;

  setTipoReserva: (tipo: TipoReserva) => void;
  setEsRecurrente: (esRec: boolean) => void;
  setSemanasRecurrente: (semanas: number) => void;

  toggleSlot: (slot: SlotDisponibilidad) => void;
  limpiarSeleccion: () => void;
  getResumenSeleccion: () => {
    fecha: string | null;
    horaInicio: string | null;
    horaFin: string | null;
    totalHoras: number;
    valido: boolean;
    errorMsg?: string;
  };
}

export const useDisponibilidadStore = create<DisponibilidadState>((set, get) => ({
  semanaLunes: getMondayOfWeek(new Date()),
  slots: [],
  slotsSeleccionados: [],
  tipoReserva: 'hora',
  esRecurrente: false,
  semanasRecurrente: 12,
  isLoading: false,
  error: null,

  cargarSemana: async (consultorioId: number) => {
    if (!consultorioId) return;
    const { semanaLunes } = get();
    const lunesStr = formatDateToYMD(semanaLunes);

    // Sábado de la misma semana (+5 días)
    const sabado = new Date(semanaLunes);
    sabado.setDate(semanaLunes.getDate() + 5);
    const sabadoStr = formatDateToYMD(sabado);

    try {
      set({ isLoading: true, error: null });
      const slots = await fetchDisponibilidad(consultorioId, lunesStr, sabadoStr);
      set({ slots, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar disponibilidad', isLoading: false });
    }
  },

  avanzarSemana: async (consultorioId: number) => {
    const { semanaLunes, cargarSemana, limpiarSeleccion } = get();
    const nueva = new Date(semanaLunes);
    nueva.setDate(semanaLunes.getDate() + 7);
    limpiarSeleccion();
    set({ semanaLunes: nueva });
    await cargarSemana(consultorioId);
  },

  retrocederSemana: async (consultorioId: number) => {
    const { semanaLunes, cargarSemana, limpiarSeleccion } = get();
    const nueva = new Date(semanaLunes);
    nueva.setDate(semanaLunes.getDate() - 7);
    limpiarSeleccion();
    set({ semanaLunes: nueva });
    await cargarSemana(consultorioId);
  },

  irASemanaActual: async (consultorioId: number) => {
    const { cargarSemana, limpiarSeleccion } = get();
    limpiarSeleccion();
    set({ semanaLunes: getMondayOfWeek(new Date()) });
    await cargarSemana(consultorioId);
  },

  setTipoReserva: (tipo: TipoReserva) => {
    get().limpiarSeleccion();
    set({ tipoReserva: tipo });
  },

  setEsRecurrente: (esRec: boolean) => {
    set({ esRecurrente: esRec });
  },

  setSemanasRecurrente: (semanas: number) => {
    const clamp = Math.max(4, Math.min(24, semanas));
    set({ semanasRecurrente: clamp });
  },

  toggleSlot: (slot: SlotDisponibilidad) => {
    if (!slot.disponible) return;

    const { tipoReserva, slotsSeleccionados } = get();

    if (tipoReserva === 'hora') {
      // Solo 1 slot a la vez
      const yaSeleccionado = slotsSeleccionados.some(
        (s) => s.fecha === slot.fecha && s.hora_inicio === slot.hora_inicio
      );
      if (yaSeleccionado) {
        set({ slotsSeleccionados: [] });
      } else {
        set({
          slotsSeleccionados: [
            {
              fecha: slot.fecha,
              hora_inicio: slot.hora_inicio,
              hora_fin: slot.hora_fin,
            },
          ],
        });
      }
      return;
    }

    // Modalidad Bloque
    // Si la fecha es diferente al bloque actual, comenzar nuevo bloque en esa fecha
    if (slotsSeleccionados.length > 0 && slotsSeleccionados[0].fecha !== slot.fecha) {
      set({
        slotsSeleccionados: [
          {
            fecha: slot.fecha,
            hora_inicio: slot.hora_inicio,
            hora_fin: slot.hora_fin,
          },
        ],
      });
      return;
    }

    const existeIndex = slotsSeleccionados.findIndex(
      (s) => s.hora_inicio === slot.hora_inicio
    );

    let nuevos: SelectedSlot[] = [];
    if (existeIndex >= 0) {
      nuevos = slotsSeleccionados.filter((_, idx) => idx !== existeIndex);
    } else {
      nuevos = [
        ...slotsSeleccionados,
        {
          fecha: slot.fecha,
          hora_inicio: slot.hora_inicio,
          hora_fin: slot.hora_fin,
        },
      ];
    }

    // Ordenar cronológicamente por hora_inicio
    nuevos.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    set({ slotsSeleccionados: nuevos });
  },

  limpiarSeleccion: () => {
    set({ slotsSeleccionados: [] });
  },

  getResumenSeleccion: () => {
    const { slotsSeleccionados, tipoReserva } = get();
    if (slotsSeleccionados.length === 0) {
      return {
        fecha: null,
        horaInicio: null,
        horaFin: null,
        totalHoras: 0,
        valido: false,
      };
    }

    const fecha = slotsSeleccionados[0].fecha;
    const horaInicio = slotsSeleccionados[0].hora_inicio;
    const horaFin = slotsSeleccionados[slotsSeleccionados.length - 1].hora_fin;
    const totalHoras = slotsSeleccionados.length;

    if (tipoReserva === 'hora') {
      return {
        fecha,
        horaInicio,
        horaFin,
        totalHoras: 1,
        valido: true,
      };
    }

    // Validación R7 para Bloque
    const validacion = validarBloqueHoras(slotsSeleccionados.map((s) => s.hora_inicio));
    return {
      fecha,
      horaInicio,
      horaFin,
      totalHoras,
      valido: validacion.valido,
      errorMsg: validacion.error,
    };
  },
}));
