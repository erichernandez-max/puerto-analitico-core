import { getHoursDifferenceFromNow } from './dateUtils';

/**
 * Valida la regla R5: Cancelación anticipada.
 * Si faltan >= 24h, devuelve íntegramente las horas consumidas al saldo.
 * Si faltan < 24h, no devuelve saldo (penalización).
 */
export function validarCancelacionR5(
  fechaInicioStr: string,
  minHoras = 24
): {
  puedeDevolver: boolean;
  horasAnticipacion: number;
  mensaje: string;
} {
  const horasAnticipacion = getHoursDifferenceFromNow(fechaInicioStr);
  const puedeDevolver = horasAnticipacion >= minHoras;

  if (puedeDevolver) {
    return {
      puedeDevolver: true,
      horasAnticipacion: Math.round(horasAnticipacion * 10) / 10,
      mensaje: `Cancelación con anticipación suficiente (${Math.round(horasAnticipacion)}h restantes). Las horas serán devueltas a tu saldo.`,
    };
  }

  return {
    puedeDevolver: false,
    horasAnticipacion: Math.round(horasAnticipacion * 10) / 10,
    mensaje: `Atención: Esta reserva inicia en menos de ${minHoras} horas (${Math.round(horasAnticipacion)}h restantes). La cancelación no devolverá saldo según la regla R5.`,
  };
}

/**
 * Valida la regla R6: Reagendamiento.
 * Permitido únicamente si la anticipación es >= 24h.
 */
export function validarReagendamientoR6(
  fechaInicioStr: string,
  minHoras = 24
): {
  permitido: boolean;
  horasAnticipacion: number;
  mensaje: string;
} {
  const horasAnticipacion = getHoursDifferenceFromNow(fechaInicioStr);
  const permitido = horasAnticipacion >= minHoras;

  if (permitido) {
    return {
      permitido: true,
      horasAnticipacion: Math.round(horasAnticipacion * 10) / 10,
      mensaje: `Reagendamiento permitido (${Math.round(horasAnticipacion)}h restantes). No se afectarán tus saldos.`,
    };
  }

  return {
    permitido: false,
    horasAnticipacion: Math.round(horasAnticipacion * 10) / 10,
    mensaje: `No es posible reagendar: Faltan menos de ${minHoras} horas para el inicio (${Math.round(horasAnticipacion)}h restantes).`,
  };
}

/**
 * Valida la regla R7: Modalidad de bloque.
 * Mínimo 3 horas consecutivas indivisibles en el mismo consultorio y mismo día.
 * @param slots Array de strings "HH:00" ordenados o sin ordenar
 */
export function validarBloqueHoras(slots: string[]): {
  valido: boolean;
  error?: string;
} {
  if (slots.length < 3) {
    return {
      valido: false,
      error: 'La modalidad Bloque requiere un mínimo de 3 horas consecutivas (Regla R7).',
    };
  }

  // Parsear a números enteros de hora (ej: "08:00" -> 8)
  const horas = slots
    .map((s) => parseInt(s.split(':')[0], 10))
    .sort((a, b) => a - b);

  for (let i = 1; i < horas.length; i++) {
    if (horas[i] !== horas[i - 1] + 1) {
      return {
        valido: false,
        error: 'Las horas seleccionadas para el Bloque deben ser estrictamente consecutivas.',
      };
    }
  }

  return { valido: true };
}
