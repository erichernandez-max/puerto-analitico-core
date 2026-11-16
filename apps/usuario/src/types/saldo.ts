export interface SaldoItem {
  id: number;
  producto_id: number;
  producto_nombre: string | null;
  producto_tipo: string | null;
  horas_compradas: number;
  horas_consumidas: number;
  horas_apartadas?: number;
  horas_disponibles: number;
  fecha_compra: string;
  fecha_vencimiento: string;
  dias_para_vencer: number;
  estado: 'vigente' | 'agotado' | 'vencido';
  renovado_por_compra_id: number | null;
}

export interface SaldosResumen {
  total_horas_disponibles: number;
  paquetes_vigentes_cantidad: number;
}

export interface SaldosResponse {
  horas_compradas: number;
  horas_apartadas: number;
  horas_consumidas: number;
  horas_disponibles: number;
  fecha_vencimiento: string | null;
  saldos?: SaldoItem[];
  resumen?: SaldosResumen;
}
