import { create } from 'zustand';
import { Consultorio } from '../types/consultorio';
import { fetchConsultorios } from '../api/consultoriosApi';

interface ConsultoriosState {
  consultorios: Consultorio[];
  consultorioSeleccionadoId: number | null;
  isLoading: boolean;
  error: string | null;
  cargarConsultorios: () => Promise<void>;
  seleccionarConsultorio: (id: number) => void;
  getConsultorioSeleccionado: () => Consultorio | undefined;
}

export const useConsultoriosStore = create<ConsultoriosState>((set, get) => ({
  consultorios: [],
  consultorioSeleccionadoId: null,
  isLoading: false,
  error: null,

  cargarConsultorios: async () => {
    try {
      set({ isLoading: true, error: null });
      const consultorios = await fetchConsultorios();
      set({
        consultorios,
        isLoading: false,
        consultorioSeleccionadoId:
          get().consultorioSeleccionadoId || (consultorios.length > 0 ? consultorios[0].id : null),
      });
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar consultorios', isLoading: false });
    }
  },

  seleccionarConsultorio: (id: number) => {
    set({ consultorioSeleccionadoId: id });
  },

  getConsultorioSeleccionado: () => {
    const { consultorios, consultorioSeleccionadoId } = get();
    return consultorios.find((c) => c.id === consultorioSeleccionadoId);
  },
}));
