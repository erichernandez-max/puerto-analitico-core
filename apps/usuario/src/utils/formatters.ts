import { EstadoReserva, TipoReserva } from '../types/reserva';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getEstadoBadgeProps(estado: EstadoReserva): {
  label: string;
  className: string;
} {
  switch (estado) {
    case 'confirmada':
      return {
        label: 'Confirmada',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    case 'consumida':
      return {
        label: 'Consumida',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    case 'pendiente_pago':
      return {
        label: 'Pendiente de Pago',
        className: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    case 'cancelada':
      return {
        label: 'Cancelada',
        className: 'bg-rose-100 text-rose-800 border-rose-300',
      };
    case 'no_show':
      return {
        label: 'No-Show',
        className: 'bg-red-100 text-red-900 border-red-300',
      };
    case 'liberada':
      return {
        label: 'Liberada',
        className: 'bg-slate-100 text-slate-700 border-slate-300',
      };
    default:
      return {
        label: estado,
        className: 'bg-gray-100 text-gray-800 border-gray-300',
      };
  }
}

export function getTipoReservaLabel(tipo: TipoReserva): string {
  switch (tipo) {
    case 'hora':
      return 'Hora Suelta';
    case 'bloque':
      return 'Bloque (≥3h)';
    case 'turno':
      return 'Turno Fijo';
    case 'completo':
      return 'Consultorio Completo';
    default:
      return tipo;
  }
}

export function getConsultorioColorClass(colorHex: string): string {
  // Mapeo seguro con estilo en línea o fallback
  return colorHex || '#2E7D32';
}
