export interface DisponibilidadSemanal {
  semana_inicio: string;
  semana_fin: string;
  horas_ocupadas: number;
  horas_disponibles: number;
  horas_disponibles_fisicas: number;
  porcentaje_ocupacion_fisica: number;
  porcentaje_ocupacion_vendible: number;
  porcentaje_ocupacion: number;
}

export interface Consultorio {
  id: number;
  nombre: string;
  color: string;
  activo: boolean;
  google_calendar_id: string | null;
  capacidad_fisica_semanal_horas: number;
  capacidad_max_semanal_horas: number;
  horas_mantenimiento_semanal: number;
  disponibilidad_semanal: DisponibilidadSemanal;
}
