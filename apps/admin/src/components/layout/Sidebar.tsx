import React from 'react';
import { LayoutDashboard, Users, CalendarDays, Settings } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import clsx from 'clsx';

const navItems = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'usuarios' as const, label: 'Usuarios', icon: Users },
  { id: 'reservas' as const, label: 'Reservas', icon: CalendarDays },
  { id: 'configuracion' as const, label: 'Configuración', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useAdminStore();
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-puerto-900 text-white min-h-screen">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-puerto-700">
        <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-sm">PA</div>
        <div>
          <p className="font-semibold text-sm leading-tight">Puerto Analítico</p>
          <p className="text-[11px] text-slate-400">Panel Admin</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={clsx('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-300 hover:bg-white/5 hover:text-white')}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-6 py-4 border-t border-puerto-700 text-[11px] text-slate-500">v1.0.0 — F4.1</div>
    </aside>
  );
};
