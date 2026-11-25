import React from 'react';
import { useUiStore, AppTab } from '../../store/useUiStore';
import { Calendar, CalendarDays, CalendarCheck, Wallet, ShoppingBag, HelpCircle } from 'lucide-react';

interface TabItem {
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'reservar', label: 'Reservar', icon: Calendar },
  { id: 'mi-agenda', label: 'Mi Agenda', icon: CalendarDays },
  { id: 'mis-reservas', label: 'Mis Reservas', icon: CalendarCheck },
  { id: 'mi-saldo', label: 'Mi Saldo', icon: Wallet },
  { id: 'productos', label: 'Paquetes', icon: ShoppingBag },
  { id: 'soporte', label: 'Ayuda', icon: HelpCircle },
];

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab } = useUiStore();

  return (
    <nav className="bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 transition-colors">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[48px] flex items-center justify-center space-x-2 py-2 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/70'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive
                      ? 'text-emerald-400 dark:text-emerald-600 stroke-[2.5]'
                      : 'text-slate-400 dark:text-neutral-500'
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
