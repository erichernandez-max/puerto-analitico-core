import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validarCancelacionR5,
  validarReagendamientoR6,
  validarBloqueHoras,
} from '../utils/reglasValidation';

describe('reglasValidation', () => {
  beforeEach(() => {
    // Fijar la fecha actual a 2026-11-20 10:00:00
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-20T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Regla R5 (Cancelación anticipada)', () => {
    it('permite devolución si faltan >= 24 horas', () => {
      // 48 horas en el futuro
      const fecha = '2026-11-22 10:00:00';
      const res = validarCancelacionR5(fecha);
      expect(res.puedeDevolver).toBe(true);
      expect(res.horasAnticipacion).toBe(48);
    });

    it('deniega devolución si faltan < 24 horas (penalización)', () => {
      // 12 horas en el futuro
      const fecha = '2026-11-20 22:00:00';
      const res = validarCancelacionR5(fecha);
      expect(res.puedeDevolver).toBe(false);
      expect(res.horasAnticipacion).toBe(12);
    });
  });

  describe('Regla R6 (Reagendamiento)', () => {
    it('permite reagendar si faltan >= 24 horas', () => {
      const fecha = '2026-11-21 11:00:00'; // 25 horas
      const res = validarReagendamientoR6(fecha);
      expect(res.permitido).toBe(true);
    });

    it('prohíbe reagendar si faltan < 24 horas', () => {
      const fecha = '2026-11-21 09:00:00'; // 23 horas
      const res = validarReagendamientoR6(fecha);
      expect(res.permitido).toBe(false);
    });
  });

  describe('Regla R7 (Modalidad Bloque)', () => {
    it('falla si se seleccionan menos de 3 horas', () => {
      const res = validarBloqueHoras(['10:00', '11:00']);
      expect(res.valido).toBe(false);
      expect(res.error).toContain('mínimo de 3 horas');
    });

    it('falla si las 3 horas no son consecutivas', () => {
      const res = validarBloqueHoras(['10:00', '11:00', '13:00']);
      expect(res.valido).toBe(false);
      expect(res.error).toContain('estrictamente consecutivas');
    });

    it('valida con éxito 3 horas consecutivas', () => {
      const res = validarBloqueHoras(['10:00', '11:00', '12:00']);
      expect(res.valido).toBe(true);
    });

    it('valida con éxito 4 horas consecutivas desordenadas', () => {
      const res = validarBloqueHoras(['12:00', '10:00', '13:00', '11:00']);
      expect(res.valido).toBe(true);
    });
  });
});
