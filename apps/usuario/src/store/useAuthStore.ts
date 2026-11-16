import { create } from 'zustand';
import { PerfilUsuario } from '../types/me';
import { SaldosResponse } from '../types/saldo';
import { fetchPerfil, fetchSaldos } from '../api/meApi';

interface AuthState {
  perfil: PerfilUsuario | null;
  saldos: SaldosResponse | null;
  isLoading: boolean;
  error: string | null;
  cargarPerfil: () => Promise<void>;
  cargarSaldos: () => Promise<void>;
  recargarTodo: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  perfil: null,
  saldos: null,
  isLoading: false,
  error: null,

  cargarPerfil: async () => {
    try {
      set({ isLoading: true, error: null });
      const perfil = await fetchPerfil();
      set({ perfil, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar perfil', isLoading: false });
    }
  },

  cargarSaldos: async () => {
    try {
      const saldos = await fetchSaldos();
      set({ saldos });
    } catch (err: any) {
      console.error('Error al cargar saldos:', err);
    }
  },

  recargarTodo: async () => {
    try {
      set({ isLoading: true, error: null });
      const [perfil, saldos] = await Promise.all([fetchPerfil(), fetchSaldos()]);
      set({ perfil, saldos, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Error al actualizar sesión', isLoading: false });
    }
  },
}));
