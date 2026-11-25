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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-slate-200 dark:border-neutral-800 px-2 py-1.5 flex justify-around shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={clsx(
              'min-h-[48px] min-w-[48px] flex-1 flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-all active:scale-95',
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
            )}
          >
            <Icon className={clsx('w-5 h-5', isActive && 'stroke-[2.5]')} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
