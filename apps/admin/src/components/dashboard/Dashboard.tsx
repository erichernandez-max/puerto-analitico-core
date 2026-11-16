import React from 'react';
import { KpiCards } from './KpiCards';
import { ReservasBarChart } from './ReservasBarChart';
import { ReservasLineChart } from './ReservasLineChart';
import { useAdminStore } from '../../store/useAdminStore';
import { RefreshCw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { cargarMetricas, isLoading, metricas } = useAdminStore();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumen general de Puerto Analítico</p>
        </div>
        <button onClick={() => cargarMetricas()} disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors">
          <RefreshCw className={'w-4 h-4 ' + (isLoading ? 'animate-spin' : '')} />
          Actualizar
        </button>
      </div>
      {metricas && (
        <p className="text-xs text-slate-400">
          Período: {metricas.periodo.desde.split(' ')[0]} → {metricas.periodo.hasta.split(' ')[0]}
          {' · '}Usuarios activos: {metricas.usuarios.activos} / {metricas.usuarios.total}
        </p>
      )}
      <KpiCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReservasBarChart />
        <ReservasLineChart />
      </div>
    </div>
  );
};
