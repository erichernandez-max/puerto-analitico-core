import React from 'react';
import { useUiStore } from '../../store/useUiStore';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useUiStore();

  if (!toast) return null;

  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    },
    error: {
      icon: <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
    },
  }[toast.type];

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-200 px-4 sm:px-0">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${config.bg}`}
        role="alert"
      >
        {config.icon}
        <div className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</div>
        <button
          onClick={hideToast}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
