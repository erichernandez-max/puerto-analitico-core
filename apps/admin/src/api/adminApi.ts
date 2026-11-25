import { request } from './client';
import { MetricasResponse } from '../types/metricas';
import {
  UsuarioAdmin,
  NuevoUsuarioPayload,
  AjusteSaldoPayload,
  CambiarEstadoPayload,
  BloqueoPayload,
  BloqueoItem,
  ConsultorioSimple,
  ReservaAdmin,
} from '../types/usuarios';

export async function fetchMetricas(desde?: string, hasta?: string): Promise<MetricasResponse> {
  const params = new URLSearchParams();
  if (desde) params.append('desde', desde);
  if (hasta) params.append('hasta', hasta);
  const query = params.toString();
  return request<MetricasResponse>(`/admin/metricas${query ? '?' + query : ''}`);
}

export async function fetchUsuarios(): Promise<UsuarioAdmin[]> {
  return request<UsuarioAdmin[]>('/admin/usuarios');
}

export async function crearUsuario(payload: NuevoUsuarioPayload): Promise<UsuarioAdmin> {
  return request<UsuarioAdmin>('/admin/usuarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function ajustarSaldo(userId: number, payload: AjusteSaldoPayload): Promise<unknown> {
  return request(`/admin/usuarios/${userId}/saldo`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cambiarEstadoUsuario(userId: number, payload: CambiarEstadoPayload): Promise<unknown> {
  return request(`/admin/usuarios/${userId}/congelar`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchBloqueos(): Promise<BloqueoItem[]> {
  return request<BloqueoItem[]>('/admin/bloqueos');
}

export async function crearBloqueo(payload: BloqueoPayload): Promise<unknown> {
  return request('/admin/bloqueos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function eliminarBloqueo(id: number): Promise<unknown> {
  return request(`/admin/bloqueos/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchConsultorios(): Promise<ConsultorioSimple[]> {
  return request<ConsultorioSimple[]>('/consultorios');
}

export async function fetchReservasAdmin(filtros?: {
  consultorio_id?: number;
  fecha?: string;
  estado?: string;
}): Promise<ReservaAdmin[]> {
  const params = new URLSearchParams();
  if (filtros?.consultorio_id && filtros.consultorio_id > 0) {
    params.append('consultorio_id', String(filtros.consultorio_id));
  }
  if (filtros?.fecha) {
    params.append('fecha', filtros.fecha);
  }
  if (filtros?.estado) {
    params.append('estado', filtros.estado);
  }
  const query = params.toString();
  return request<ReservaAdmin[]>(`/admin/reservas${query ? '?' + query : ''}`);
}

export async function marcarNoShow(id: number): Promise<unknown> {
  return request(`/reservas/${id}/no-show`, {
    method: 'POST',
  });
}

export async function cancelarReservaAdmin(id: number, motivo?: string): Promise<unknown> {
  return request(`/admin/reservas/${id}/cancelar`, {
    method: 'POST',
    body: JSON.stringify({ motivo: motivo || 'Cancelación forzosa por administración' }),
  });
}

export async function fetchConfiguracion(): Promise<Record<string, string>> {
  return request<Record<string, string>>('/admin/configuracion');
}

export async function fetchDisponibilidadAdmin(
  consultorioId: number,
  fechaDesde: string,
  fechaHasta: string
): Promise<any[]> {
  const params = new URLSearchParams({
    consultorio_id: String(consultorioId),
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
  });
  return request<any[]>(`/disponibilidad?${params.toString()}`);
}

export async function updateConfiguracion(reglas: Record<string, string>): Promise<{
  mensaje: string;
  reglas: Record<string, string>;
}> {
  return request('/admin/configuracion', {
    method: 'POST',
    body: JSON.stringify(reglas),
  });
}
