import { PuertoConfig } from '../types/config';

export function getPuertoConfig(): PuertoConfig {
  if (typeof window !== 'undefined') {
    const cfg = window.PuertoConfig || window.puertoConfig;
    if (cfg) return cfg;
  }
  return {
    apiUrl: '/wp-json/puerto/v1',
    nonce: '',
    isLoggedIn: true,
    userId: 1,
    tz: 'America/Mexico_City',
    logoUrl: '/icons/icon-192.png',
    canReserve: true,
    isAdmin: true,
    reglas: {
      cancelacionHorasMinimas: 24,
      bloqueMinHoras: 3,
      horarioLvInicio: '08:00',
      horarioLvFin: '21:00',
      horarioSabInicio: '08:00',
      horarioSabFin: '17:00',
      domingoCerrado: true,
      timezone: 'America/Mexico_City',
    },
  };
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(message: string, code = 'unknown_error', status = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const config = getPuertoConfig();
  const baseUrl = config.apiUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (config.nonce) headers['X-WP-Nonce'] = config.nonce;
  const response = await fetch(url, { ...options, headers });
  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  if (!response.ok) {
    const errorMsg = data?.message || data?.data?.message || 'Error en la solicitud';
    const errorCode = data?.code || 'http_error';
    throw new ApiError(errorMsg, errorCode, response.status, data?.data?.details || data);
  }
  if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
    return data.data as T;
  }
  return data as T;
}
