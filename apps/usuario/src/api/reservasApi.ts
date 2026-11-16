import { request } from './client';
import {
  CrearReservaPayload,
  CancelarReservaPayload,
  ReagendarReservaPayload,
  Reserva,
} from '../types/reserva';

export interface CancelarReservaResponse {
  reserva_id: number;
  estado: string;
  horas_devueltas: number;
  devolucion: boolean;
  mensaje?: string;
}

export interface ReagendarReservaResponse {
  reserva_id: number;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  consultorio_id: number;
}

export async function crearReserva(payload: CrearReservaPayload): Promise<Reserva> {
  return request<Reserva>('/reservas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelarReserva(
  id: number,
  payload?: CancelarReservaPayload
): Promise<CancelarReservaResponse> {
  return request<CancelarReservaResponse>(`/reservas/${id}/cancelar`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function reagendarReserva(
  id: number,
  payload: ReagendarReservaPayload
): Promise<ReagendarReservaResponse> {
  return request<ReagendarReservaResponse>(`/reservas/${id}/reagendar`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelarSerie(serieId: string): Promise<{ canceladas: number; mensaje: string }> {
  return request<{ canceladas: number; mensaje: string }>(`/series/${serieId}`, {
    method: 'DELETE',
  });
}
