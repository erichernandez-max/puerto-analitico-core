import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAdminStore } from '../../store/useAdminStore';

export const ReservasBarChart: React.FC = () => {
  const { getReservasPorConsultorio, isLoading } = useAdminStore();
  const data = getReservasPorConsultorio();
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 shadow-xs transition-colors">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-neutral-200 mb-4">Reservas por Consultorio</h3>
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-slate-400 text-sm">Cargando datos...</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
            <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13px' }} />
            <Bar dataKey="reservas" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {data.map((entry, index) => (<Cell key={'cell-' + index} fill={entry.color} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
