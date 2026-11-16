import { describe, it, expect, beforeEach } from 'vitest';
import { useDisponibilidadStore } from '../store/useDisponibilidadStore';
import { SlotDisponibilidad } from '../types/disponibilidad';

describe('useDisponibilidadStore', () => {
  beforeEach(() => {
    useDisponibilidadStore.getState().limpiarSeleccion();
    useDisponibilidadStore.getState().setTipoReserva('hora');
  });

  it('permite seleccionar 1 slot en modalidad hora suelta', () => {
    const slot: SlotDisponibilidad = {
      fecha: '2026-11-23',
      hora_inicio: '10:00',
      hora_fin: '11:00',
      disponible: true,
      motivo_no_disponible: null,
    };

    useDisponibilidadStore.getState().toggleSlot(slot);

    const resumen = useDisponibilidadStore.getState().getResumenSeleccion();
    expect(resumen.valido).toBe(true);
    expect(resumen.fecha).toBe('2026-11-23');
    expect(resumen.horaInicio).toBe('10:00');
    expect(resumen.horaFin).toBe('11:00');
    expect(resumen.totalHoras).toBe(1);
  });

  it('en modalidad bloque valida que se requieran al menos 3 horas consecutivas', () => {
    useDisponibilidadStore.getState().setTipoReserva('bloque');

    const slot1: SlotDisponibilidad = {
      fecha: '2026-11-23',
      hora_inicio: '10:00',
      hora_fin: '11:00',
      disponible: true,
      motivo_no_disponible: null,
    };
    const slot2: SlotDisponibilidad = {
      fecha: '2026-11-23',
      hora_inicio: '11:00',
      hora_fin: '12:00',
      disponible: true,
      motivo_no_disponible: null,
    };

    useDisponibilidadStore.getState().toggleSlot(slot1);
    useDisponibilidadStore.getState().toggleSlot(slot2);

    let resumen = useDisponibilidadStore.getState().getResumenSeleccion();
    expect(resumen.valido).toBe(false); // Solo 2 horas, mínimo 3

    const slot3: SlotDisponibilidad = {
      fecha: '2026-11-23',
      hora_inicio: '12:00',
      hora_fin: '13:00',
      disponible: true,
      motivo_no_disponible: null,
    };
    useDisponibilidadStore.getState().toggleSlot(slot3);

    resumen = useDisponibilidadStore.getState().getResumenSeleccion();
    expect(resumen.valido).toBe(true);
    expect(resumen.totalHoras).toBe(3);
    expect(resumen.horaInicio).toBe('10:00');
    expect(resumen.horaFin).toBe('13:00');
  });

  it('no permite seleccionar slots no disponibles', () => {
    const slotOcupado: SlotDisponibilidad = {
      fecha: '2026-11-23',
      hora_inicio: '10:00',
      hora_fin: '11:00',
      disponible: false,
      motivo_no_disponible: 'reserva_existente',
    };

    useDisponibilidadStore.getState().toggleSlot(slotOcupado);
    expect(useDisponibilidadStore.getState().slotsSeleccionados).toHaveLength(0);
  });
});
