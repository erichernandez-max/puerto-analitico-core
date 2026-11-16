import { describe, it, expect } from 'vitest';
import {
  formatDateToYMD,
  getMondayOfWeek,
  getDaysOfWeek,
  formatTimeRange,
} from '../utils/dateUtils';

describe('dateUtils', () => {
  it('formatDateToYMD formatea correctamente una fecha a YYYY-MM-DD', () => {
    const d = new Date(2026, 10, 23); // 23 de Noviembre 2026
    expect(formatDateToYMD(d)).toBe('2026-11-23');
  });

  it('getMondayOfWeek obtiene el lunes de la semana correspondiente', () => {
    // 2026-11-25 es Miércoles
    const miercoles = new Date(2026, 10, 25);
    const lunes = getMondayOfWeek(miercoles);
    expect(lunes.getDay()).toBe(1); // 1 = Lunes
    expect(formatDateToYMD(lunes)).toBe('2026-11-23');
  });

  it('getDaysOfWeek devuelve exactamente 6 días operables (L-S, R1 excluye Domingo)', () => {
    const lunes = new Date(2026, 10, 23);
    const dias = getDaysOfWeek(lunes);
    expect(dias).toHaveLength(6);
    expect(dias[0].getDay()).toBe(1); // Lunes
    expect(dias[5].getDay()).toBe(6); // Sábado
  });

  it('formatTimeRange formatea rango de horas', () => {
    const rango = formatTimeRange('2026-11-23 10:00:00', '2026-11-23 11:00:00');
    expect(rango).toBe('10:00 - 11:00');
  });
});
