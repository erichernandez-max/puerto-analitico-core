export interface SlotDisponibilidad {
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:mm
  hora_fin: string; // HH:mm
  disponible: boolean;
  motivo_no_disponible: string | null; // 'reserva_existente', 'mantenimiento', 'feriado', 'admin', 'otro'
}

export interface SlotGroupedByDate {
  [fecha: string]: SlotDisponibilidad[];
}
