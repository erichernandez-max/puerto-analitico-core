import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Badge } from './Badge';
import { Clock, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export const Header: React.FC = () => {
  const { perfil, saldos, recargarTodo, isLoading } = useAuthStore();
  const [logoError, setLogoError] = useState(false);
  const logoUrl = typeof window !== 'undefined' ? (window.puertoConfig?.logoUrl || window.PuertoConfig?.logoUrl) : undefined;

  const totalHoras = saldos?.horas_disponibles ?? saldos?.resumen?.total_horas_disponibles ?? 0;
  const fechaVencimiento = saldos?.fecha_vencimiento;

  const membresiaLabel = {
    prepago: 'Cuenta Prepago',
    turno: 'Turno',
    completo: 'Completo',
  }[perfil?.tipo_membresia || 'prepago'];

  return (
    <header className="bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 sticky top-0 z-40 shadow-xs transition-colors">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo y terapeuta info */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-900 dark:bg-neutral-800 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-sm border border-slate-800 dark:border-neutral-700 flex-shrink-0 overflow-hidden">
              {logoUrl && !logoError ? (
                <img
                  src={logoUrl}
                  alt="Puerto Analítico"
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                'PA'
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-neutral-100 leading-tight truncate">
                  Puerto Analítico
                </h1>
                <span className="hidden xs:inline text-[10px] bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 px-1.5 py-0.5 rounded font-mono font-medium">
                  Terapeutas
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">
                Hola, <span className="text-slate-800 dark:text-neutral-200 font-semibold">{perfil?.nombre || 'Colega'}</span>
              </p>
            </div>
          </div>

          {/* Badges y saldo rápido */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Membresía Badge (oculta en pantallas muy pequeñas para no saturar) */}
            <div className="hidden md:inline-flex">
              <Badge variant="purple" size="sm">
                <Sparkles className="w-3 h-3 mr-1" />
                {membresiaLabel}
              </Badge>
            </div>

            {/* Estado Badge */}
            {perfil?.estado === 'congelado' ? (
              <Badge variant="amber" size="sm">
                <ShieldAlert className="w-3 h-3 mr-1" />
                Congelada (R13)
              </Badge>
            ) : perfil?.estado === 'moroso' ? (
              <Badge variant="rose" size="sm">
                Pago Pendiente
              </Badge>
            ) : (
              <Badge variant="emerald" size="sm" className="hidden sm:inline-flex">
                Cuenta activa
              </Badge>
            )}

            {/* Saldo de horas card */}
            <div className="flex items-center bg-slate-900 dark:bg-neutral-800 text-white px-2.5 sm:px-3 py-1.5 rounded-xl shadow-xs text-xs">
              <Clock className="w-3.5 h-3.5 text-emerald-400 mr-1.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-emerald-300">{totalHoras} hrs</span>
                <span className="text-slate-300 dark:text-neutral-300 ml-1 hidden sm:inline">disponibles para reservar</span>
              </div>
              {fechaVencimiento && (
                <span className="hidden lg:inline ml-2 pl-2 border-l border-slate-700 dark:border-neutral-700 text-[10px] text-slate-400">
                  {fechaVencimiento}
                </span>
              )}
            </div>

            {/* Botón refrescar táctil min-h-[48px] */}
            <button
              onClick={() => recargarTodo()}
              disabled={isLoading}
              className="min-h-[44px] min-w-[44px] p-2 text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl transition-colors flex items-center justify-center"
              title="Actualizar datos"
              aria-label="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-slate-700 dark:text-neutral-200' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alerta de cuenta congelada si aplica (R13) */}
        {perfil?.estado === 'congelado' && (
          <div className="mt-2.5 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Cuenta temporalmente congelada:</strong> Nuevas reservas pausadas. Tus {totalHoras}h vigentes están protegidas contra caducidad (Regla R13).
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
