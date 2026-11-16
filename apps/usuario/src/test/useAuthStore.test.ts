import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../store/useAuthStore';
import * as meApi from '../api/meApi';

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('cargarPerfil actualiza el estado con el perfil del usuario', async () => {
    const mockPerfil = {
      id: 10,
      username: 'dra_elena',
      nombre: 'Dra. Elena Silva',
      email: 'elena@example.com',
      roles: ['puerto_paciente'],
      tipo_membresia: 'prepago' as const,
      estado: 'activo' as const,
      fecha_alta: '2026-11-01 10:00:00',
      notas: null,
      puede_reservar: true,
    };

    vi.spyOn(meApi, 'fetchPerfil').mockResolvedValue(mockPerfil);

    await useAuthStore.getState().cargarPerfil();

    const state = useAuthStore.getState();
    expect(state.perfil).toEqual(mockPerfil);
    expect(state.error).toBeNull();
  });

  it('cargarSaldos actualiza el resumen de horas disponibles', async () => {
    const mockSaldos = {
      horas_compradas: 10,
      horas_apartadas: 2,
      horas_consumidas: 0,
      horas_disponibles: 8,
      fecha_vencimiento: '2027-05-01',
      saldos: [
        {
          id: 1,
          producto_id: 2,
          producto_nombre: 'Paquete 10 Horas',
          producto_tipo: 'prepago',
          horas_compradas: 10,
          horas_consumidas: 2,
          horas_disponibles: 8,
          fecha_compra: '2026-11-01 10:00:00',
          fecha_vencimiento: '2027-05-01 10:00:00',
          dias_para_vencer: 170,
          estado: 'vigente' as const,
          renovado_por_compra_id: null,
        },
      ],
      resumen: {
        total_horas_disponibles: 8,
        paquetes_vigentes_cantidad: 1,
      },
    };

    vi.spyOn(meApi, 'fetchSaldos').mockResolvedValue(mockSaldos);

    await useAuthStore.getState().cargarSaldos();

    const state = useAuthStore.getState();
    expect(state.saldos?.horas_disponibles).toBe(8);
  });
});
