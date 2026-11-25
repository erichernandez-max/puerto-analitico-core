import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  mensaje?: string;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  mensaje = 'Cargando información...',
  className = 'py-12',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <Loader2 className="w-8 h-8 text-slate-800 dark:text-neutral-200 animate-spin" />
      <p className="text-sm text-slate-500 dark:text-neutral-400 font-medium">{mensaje}</p>
    </div>
  );
};
