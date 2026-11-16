import React from 'react';
import { ShieldX } from 'lucide-react';

export const AccessDenied: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Acceso Denegado</h1>
        <p className="text-sm text-slate-500 mb-4">
          No tienes permisos de administrador para acceder a este panel.
          Se requiere la capacidad <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">manage_options</code> de WordPress.
        </p>
        <a href="/" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-puerto-verde rounded-lg hover:bg-green-700 transition-colors">
          Volver al inicio
        </a>
      </div>
    </div>
  );
};
