import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAdminStore } from '../../store/useAdminStore';

export const ReservasBarChart: React.FC = () => {
  const { getReservasPorConsultorio, isLoading } = useAdminStore();
  const data = getReservasPorConsultorio();
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Reservas por Consultorio</h3>
      {isLoading ? (
        <div className="h-64 flex items-center justify-center"><div className="animate-pulse text-slate-400 text-sm">Cargando datos...</div></div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
            <Bar dataKey="reservas" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {data.map((entry, index) => (<Cell key={'cell-' + index} fill={entry.color} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
