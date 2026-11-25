import React from 'react';
import { Clock, CalendarCheck, Coins, XCircle } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';

const kpiConfig = [
  { key: 'horasHoy' as const, label: 'Horas Reservadas Hoy', icon: Clock, iconColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-50 dark:bg-blue-950/40', format: (v: number) => v + 'h' },
  { key: 'sesionesSemana' as const, label: 'Sesiones esta Semana', icon: CalendarCheck, iconColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-950/40', format: (v: number) => String(v) },
  { key: 'creditosTotales' as const, label: 'Créditos Disponibles', icon: Coins, iconColor: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-50 dark:bg-amber-950/40', format: (v: number) => v + 'h' },
  { key: 'cancelacionesMes' as const, label: 'Cancelaciones del Mes', icon: XCircle, iconColor: 'text-red-600 dark:text-rose-400', iconBg: 'bg-red-50 dark:bg-rose-950/40', format: (v: number) => String(v) },
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
          <div key={cfg.key} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 flex items-start gap-4 shadow-xs hover:shadow-md transition-shadow">
            <div className={'p-2.5 rounded-xl ' + cfg.iconBg}>
              <Icon className={'w-5 h-5 ' + cfg.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1">{cfg.label}</p>
              {isLoading ? (
                <div className="h-7 w-16 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-slate-800 dark:text-neutral-100">{cfg.format(value)}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
