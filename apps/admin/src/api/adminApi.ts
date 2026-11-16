import { request } from './client';
import { MetricasResponse } from '../types/metricas';

export async function fetchMetricas(desde?: string, hasta?: string): Promise<MetricasResponse> {
  const params = new URLSearchParams();
  if (desde) params.append('desde', desde);
  if (hasta) params.append('hasta', hasta);
  const query = params.toString();
  return request<MetricasResponse>(`/admin/metricas${query ? '?' + query : ''}`);
}
