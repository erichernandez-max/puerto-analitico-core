import { create } from 'zustand';

export type AppTab = 'reservar' | 'mis-reservas' | 'mi-saldo' | 'productos' | 'soporte';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UiState {
  activeTab: AppTab;
  toast: ToastMessage | null;
  setActiveTab: (tab: AppTab) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

let toastTimer: any = null;

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'reservar',
  toast: null,

  setActiveTab: (tab: AppTab) => {
    set({ activeTab: tab });
  },

  showToast: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimer) clearTimeout(toastTimer);
    const newToast = { id: Date.now(), message, type };
    set({ toast: newToast });
    toastTimer = setTimeout(() => {
      set({ toast: null });
    }, 4500);
  },

  hideToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: null });
  },
}));
