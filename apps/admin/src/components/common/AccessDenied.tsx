import React from 'react';
import { ShieldX } from 'lucide-react';

export const AccessDenied: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121212] flex items-center justify-center p-4 transition-colors">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-red-200 dark:border-rose-900/60 p-8 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-rose-950/40 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8 text-red-500 dark:text-rose-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-neutral-100 mb-2">Acceso Denegado</h1>
        <p className="text-sm text-slate-500 dark:text-neutral-400 mb-4">
          No tienes permisos de administrador para acceder a este panel.
          Se requiere la capacidad <code className="text-xs bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">manage_options</code> de WordPress.
        </p>
        <a
          href="/"
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
};
