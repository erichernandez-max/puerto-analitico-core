import { request } from './client';
import { SlotDisponibilidad } from '../types/disponibilidad';

export async function fetchDisponibilidad(
  consultorioId: number,
  fechaDesde: string,
  fechaHasta: string
): Promise<SlotDisponibilidad[]> {
  const params = new URLSearchParams({
    consultorio_id: String(consultorioId),
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
  });

  return request<SlotDisponibilidad[]>(`/disponibilidad?${params.toString()}`);
}
