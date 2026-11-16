export type TipoMembresia = 'prepago' | 'turno' | 'completo';
export type EstadoUsuario = 'activo' | 'congelado' | 'moroso';

export interface PerfilUsuario {
  id: number;
  username: string;
  nombre: string;
  email: string;
  roles: string[];
  tipo_membresia: TipoMembresia;
  estado: EstadoUsuario;
  fecha_alta: string;
  notas: string | null;
  puede_reservar: boolean;
}
