export interface MetricasPeriodo {
  desde: string;
  hasta: string;
}

export interface MetricasUsuarios {
  total: number;
  activos: number;
}

export interface MetricasReservas {
  total: number;
  confirmadas: number;
  canceladas: number;
  horas_totales: number;
}

export interface MetricasKpis {
  horas_hoy: number;
  sesiones_semana: number;
  creditos_totales: number;
  cancelaciones_mes: number;
}

export interface ReservasPorConsultorio {
  consultorio_id?: number;
  nombre: string;
  nombre_completo?: string;
  color: string;
  reservas: number;
}

export interface ReservasSemana {
  semana: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  reservas: number;
}

export interface MetricasResponse {
  periodo: MetricasPeriodo;
  usuarios: MetricasUsuarios;
  reservas: MetricasReservas;
  kpis?: MetricasKpis;
  reservas_por_consultorio?: ReservasPorConsultorio[];
  reservas_ultimas_4_semanas?: ReservasSemana[];
}
