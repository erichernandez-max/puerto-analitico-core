import React from 'react';
import { Shield } from 'lucide-react';

export const AdminHeader: React.FC = () => {
  return (
    <header className="md:hidden bg-puerto-900 text-white px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
        <Shield className="w-4 h-4" />
      </div>
      <div>
        <p className="font-semibold text-sm leading-tight">Puerto Analítico</p>
        <p className="text-[10px] text-slate-400">Panel Administrativo</p>
      </div>
    </header>
  );
};
