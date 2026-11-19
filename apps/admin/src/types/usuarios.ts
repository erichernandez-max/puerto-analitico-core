export interface UsuarioAdmin {
  id: number;
  nombre: string;
  email: string;
  tipo_membresia: 'prepago' | 'turno' | 'completo';
  estado: 'activo' | 'congelado' | 'moroso';
  fecha_alta: string;
  notas: string | null;
  saldo_disponible: number;
}

export interface NuevoUsuarioPayload {
  nombre: string;
  email: string;
  password: string;
  tipo_membresia: 'prepago' | 'turno' | 'completo';
  saldo_inicial: number;
  notas?: string;
}

export interface AjusteSaldoPayload {
  horas: number;
  tipo: 'compra' | 'consumo' | 'devolucion' | 'ajuste_admin' | 'expiracion';
  motivo: string;
}

export interface CambiarEstadoPayload {
  estado: 'activo' | 'congelado' | 'moroso';
  motivo?: string;
}

export interface BloqueoPayload {
  consultorio_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
}

export interface BloqueoItem {
  id: number;
  consultorio_id: number;
  consultorio_nombre: string;
  consultorio_color: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  recurrente: boolean;
  patron_recurrencia: string | null;
  created_at: string;
}

export interface ConsultorioSimple {
  id: number;
  nombre: string;
  color: string;
}

export interface ReservaAdmin {
  id: number;
  user_id: number;
  usuario_nombre: string;
  usuario_email: string;
  consultorio_id: number;
  consultorio_nombre: string;
  consultorio_color: string;
  fecha_inicio: string;
  fecha_fin: string;
  duracion_horas: number;
  tipo: 'hora' | 'bloque' | 'turno' | 'completo';
  estado: 'pendiente_pago' | 'confirmada' | 'consumida' | 'cancelada' | 'no_show' | 'liberada';
  es_recurrente: boolean;
  serie_id: string | null;
  created_at: string;
}
