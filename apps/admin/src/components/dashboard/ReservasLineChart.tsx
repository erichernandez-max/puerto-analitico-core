import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdminStore } from '../../store/useAdminStore';

export const ReservasLineChart: React.FC = () => {
  const { getReservasSemanas, isLoading } = useAdminStore();
  const data = getReservasSemanas();
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 shadow-xs transition-colors">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-neutral-200 mb-4">Reservas — Últimas 4 Semanas</h3>
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-slate-400 text-sm">Cargando datos...</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
            <XAxis dataKey="semana" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', fontSize: '13px' }} />
            <Line type="monotone" dataKey="reservas" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
