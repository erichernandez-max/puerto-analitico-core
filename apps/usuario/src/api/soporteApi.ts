import { request } from './client';

export interface EnviarSoportePayload {
  mensaje: string;
  reserva_id?: number;
  asunto?: string;
}

export interface EnviarSoporteResponse {
  enviado: boolean;
  mensaje: string;
}

export async function enviarSoporte(payload: EnviarSoportePayload): Promise<EnviarSoporteResponse> {
  return request<EnviarSoporteResponse>('/soporte', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
