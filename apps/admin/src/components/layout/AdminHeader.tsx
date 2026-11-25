import React from 'react';
import { Shield } from 'lucide-react';

export const AdminHeader: React.FC = () => {
  return (
    <header className="md:hidden bg-slate-900 dark:bg-neutral-900 text-white px-4 py-3 flex items-center gap-3 border-b border-slate-800 dark:border-neutral-800">
      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-xs">
        <Shield className="w-4 h-4 text-slate-950 stroke-[2.5]" />
      </div>
      <div>
        <p className="font-semibold text-sm leading-tight text-white">Puerto Analítico</p>
        <p className="text-[10px] text-slate-400 dark:text-neutral-400">Panel Administrativo</p>
      </div>
    </header>
  );
};
