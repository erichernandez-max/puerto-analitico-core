import React from 'react';
import { Clock, CalendarCheck, Coins, XCircle } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';

const kpiConfig = [
  { key: 'horasHoy' as const, label: 'Horas Reservadas Hoy', icon: Clock, iconColor: 'text-blue-600', iconBg: 'bg-blue-50', format: (v: number) => v + 'h' },
  { key: 'sesionesSemana' as const, label: 'Sesiones esta Semana', icon: CalendarCheck, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', format: (v: number) => String(v) },
  { key: 'creditosTotales' as const, label: 'Créditos Disponibles', icon: Coins, iconColor: 'text-amber-600', iconBg: 'bg-amber-50', format: (v: number) => v + 'h' },
  { key: 'cancelacionesMes' as const, label: 'Cancelaciones del Mes', icon: XCircle, iconColor: 'text-red-600', iconBg: 'bg-red-50', format: (v: number) => String(v) },
];

export const KpiCards: React.FC = () => {
  const { getKpis, isLoading } = useAdminStore();
  const kpis = getKpis();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiConfig.map((cfg) => {
        const Icon = cfg.icon;
        const value = kpis[cfg.key];
        return (
          <div key={cfg.key} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={'p-2.5 rounded-lg ' + cfg.iconBg}>
              <Icon className={'w-5 h-5 ' + cfg.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 mb-1">{cfg.label}</p>
              {isLoading ? <div className="h-7 w-16 bg-slate-200 rounded animate-pulse" /> : <p className="text-2xl font-bold text-slate-800">{cfg.format(value)}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
