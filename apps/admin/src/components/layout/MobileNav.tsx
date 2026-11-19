import React from 'react';
import { LayoutDashboard, Users, CalendarOff, CalendarDays, Settings } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import clsx from 'clsx';

const navItems = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'usuarios' as const, label: 'Usuarios', icon: Users },
  { id: 'bloqueos' as const, label: 'Bloqueos', icon: CalendarOff },
  { id: 'reservas' as const, label: 'Reservas', icon: CalendarDays },
  { id: 'configuracion' as const, label: 'Config', icon: Settings },
];

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab } = useAdminStore();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 py-1.5 flex justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={clsx('flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-medium transition-colors',
              isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600')}>
            <Icon className={clsx('w-5 h-5', isActive && 'stroke-[2.5]')} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};
