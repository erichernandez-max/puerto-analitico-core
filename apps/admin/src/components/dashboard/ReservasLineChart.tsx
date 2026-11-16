import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdminStore } from '../../store/useAdminStore';

export const ReservasLineChart: React.FC = () => {
  const { getReservasSemanas, isLoading } = useAdminStore();
  const data = getReservasSemanas();
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Reservas — Últimas 4 Semanas</h3>
      {isLoading ? (
        <div className="h-64 flex items-center justify-center"><div className="animate-pulse text-slate-400 text-sm">Cargando datos...</div></div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="semana" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
            <Line type="monotone" dataKey="reservas" stroke="#2E7D32" strokeWidth={2.5} dot={{ fill: '#2E7D32', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
