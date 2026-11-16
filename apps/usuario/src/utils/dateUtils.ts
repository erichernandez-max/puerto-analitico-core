/**
 * Utilidades de fecha y hora para Puerto Analítico (horario de operación R1: L-V 08-21h, Sáb 08-17h, Dom cerrado)
 */

export function formatDateToYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTimeToYMDHMS(date: Date): string {
  const ymd = formatDateToYMD(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${ymd} ${hours}:${minutes}:${seconds}`;
}

export function parseDate(dateStr: string): Date {
  // Maneja tanto "YYYY-MM-DD HH:mm:ss" como "YYYY-MM-DDTHH:mm:ss"
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  return new Date(normalized);
}

export function getHoursDifferenceFromNow(dateStr: string): number {
  const target = parseDate(dateStr).getTime();
  const now = new Date().getTime();
  const diffMs = target - now;
  return diffMs / (1000 * 60 * 60);
}

/**
 * Obtiene el lunes de la semana de una fecha determinada.
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0: Dom, 1: Lun, ..., 6: Sáb
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Genera los 6 días operables de la semana (Lunes a Sábado, R1 excluye Domingo).
 */
export function getDaysOfWeek(monday: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 6; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function formatDayHeader(date: Date): { diaNombre: string; fechaCorta: string } {
  const diaNombre = DIAS_SEMANA[date.getDay()];
  const diaNumero = date.getDate();
  const mesNombre = MESES[date.getMonth()].slice(0, 3);
  return {
    diaNombre,
    fechaCorta: `${diaNumero} ${mesNombre}`,
  };
}

export function formatHumanDate(dateStr: string): string {
  const d = parseDate(dateStr);
  const diaSemana = DIAS_SEMANA[d.getDay()];
  const dia = d.getDate();
  const mes = MESES[d.getMonth()];
  const año = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');
  return `${diaSemana} ${dia} de ${mes} ${año}, ${hora}:${minutos}`;
}

export function formatTimeRange(inicioStr: string, finStr: string): string {
  const inicio = parseDate(inicioStr);
  const fin = parseDate(finStr);
  const hi = String(inicio.getHours()).padStart(2, '0') + ':' + String(inicio.getMinutes()).padStart(2, '0');
  const hf = String(fin.getHours()).padStart(2, '0') + ':' + String(fin.getMinutes()).padStart(2, '0');
  return `${hi} - ${hf}`;
}
