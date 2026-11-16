export interface Producto {
  id: number;
  nombre: string;
  tipo: string;
  horas_incluidas: number;
  precio: number;
  descuento_pct: number;
  vigencia_meses: number;
  requiere_disponibilidad_consecutiva: boolean;
  activo: boolean;
}
