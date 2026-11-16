import { request } from './client';
import { PerfilUsuario } from '../types/me';
import { SaldosResponse } from '../types/saldo';
import { Reserva } from '../types/reserva';

export async function fetchPerfil(): Promise<PerfilUsuario> {
  return request<PerfilUsuario>('/me');
}

export async function fetchSaldos(): Promise<SaldosResponse> {
  return request<SaldosResponse>('/me/saldos');
}

export async function fetchMisReservas(
  desde?: string,
  hasta?: string,
  estado?: string
): Promise<Reserva[]> {
  const params = new URLSearchParams();
  if (desde) params.append('desde', desde);
  if (hasta) params.append('hasta', hasta);
  if (estado) params.append('estado', estado);

  const query = params.toString() ? `?${params.toString()}` : '';
  return request<Reserva[]>(`/me/reservas${query}`);
}
