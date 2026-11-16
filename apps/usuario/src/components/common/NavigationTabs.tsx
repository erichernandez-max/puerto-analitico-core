import React from 'react';
import { useUiStore, AppTab } from '../../store/useUiStore';
import { Calendar, CalendarCheck, Wallet, ShoppingBag, HelpCircle } from 'lucide-react';

interface TabItem {
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'reservar', label: 'Reservar Consultorio', icon: Calendar },
  { id: 'mis-reservas', label: 'Mis Reservas', icon: CalendarCheck },
  { id: 'mi-saldo', label: 'Mi Saldo y Vigencia', icon: Wallet },
  { id: 'productos', label: 'Tarifas y Paquetes', icon: ShoppingBag },
  { id: 'soporte', label: 'Ayuda y Reglas', icon: HelpCircle },
];

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab } = useUiStore();

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] flex items-center space-x-2 py-2.5 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}
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
