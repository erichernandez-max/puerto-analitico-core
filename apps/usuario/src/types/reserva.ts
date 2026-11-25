export type TipoReserva = 'hora' | 'bloque' | 'turno' | 'completo';
export type EstadoReserva = 'pendiente_pago' | 'confirmada' | 'consumida' | 'cancelada' | 'no_show' | 'liberada';

export interface ReservaConsultorioInfo {
  id: number;
  nombre: string;
  color: string;
}

export interface Reserva {
  id: number;
  user_id: number;
  consultorio: ReservaConsultorioInfo;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: TipoReserva;
  estado: EstadoReserva;
  saldo_id: number | null;
  google_event_id: string | null;
  es_recurrente: boolean;
  serie_id: number | string | null;
  duracion_horas?: number;
  created_at: string;
  updated_at: string;
}

export interface CrearReservaPayload {
  consultorio_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: TipoReserva;
  saldo_id?: number;
  es_recurrente?: boolean;
  semanas?: number;
}

export interface ReagendarReservaPayload {
  nueva_fecha_inicio: string;
  nueva_fecha_fin: string;
  nuevo_consultorio_id?: number;
}

export interface CancelarReservaPayload {
  motivo?: string;
}
