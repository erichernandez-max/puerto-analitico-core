import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Badge } from './Badge';
import { Clock, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export const Header: React.FC = () => {
  const { perfil, saldos, recargarTodo, isLoading } = useAuthStore();

  const totalHoras = saldos?.horas_disponibles ?? saldos?.resumen?.total_horas_disponibles ?? 0;
  const paquetesVigentes = saldos?.resumen?.paquetes_vigentes_cantidad ?? 1;
  const fechaVencimiento = saldos?.fecha_vencimiento;

  const membresiaLabel = {
    prepago: 'Modalidad Prepago',
    turno: 'Membresía Turno',
    completo: 'Consultorio Completo',
  }[perfil?.tipo_membresia || 'prepago'];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Logo y terapeuta info */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md border border-slate-800 flex-shrink-0">
              PA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Puerto Analítico
                </h1>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                  Portal Terapeutas
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Hola, <span className="text-slate-800 font-semibold">{perfil?.nombre || 'Colega Terapeuta'}</span>
              </p>
            </div>
          </div>

          {/* Badges y saldo rápido */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
            {/* Membresía Badge */}
            <Badge variant="purple" size="md">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              {membresiaLabel}
            </Badge>

            {/* Estado Badge */}
            {perfil?.estado === 'congelado' ? (
              <Badge variant="amber" size="md">
                <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                Cuenta Congelada (R13)
              </Badge>
            ) : perfil?.estado === 'moroso' ? (
              <Badge variant="rose" size="md">
                Pago Pendiente
              </Badge>
            ) : (
              <Badge variant="emerald" size="md">
                Activo
              </Badge>
            )}

            {/* Saldo de horas card */}
            <div className="flex items-center bg-slate-900 text-white px-3.5 py-1.5 rounded-xl shadow-sm text-xs sm:text-sm">
              <Clock className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
              <div>
                <span className="font-bold text-emerald-300">{totalHoras} hrs</span>
                <span className="text-slate-300 ml-1 hidden xs:inline">disponibles</span>
              </div>
              {fechaVencimiento && (
                <span className="ml-2 pl-2 border-l border-slate-700 text-[11px] text-slate-400">
                  Vence: {fechaVencimiento}
                </span>
              )}
            </div>

            {/* Botón refrescar */}
            <button
              onClick={() => recargarTodo()}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Actualizar datos"
              aria-label="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-slate-700' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alerta de cuenta congelada si aplica (R13) */}
        {perfil?.estado === 'congelado' && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Tu cuenta se encuentra temporalmente congelada:</strong> No es posible generar nuevas reservas en este momento. Sin embargo, tus saldos vigentes ({totalHoras} hrs en {paquetesVigentes} paquete{paquetesVigentes !== 1 ? 's' : ''}) permanecen protegidos y no caducarán mientras tu estado se mantenga congelado (Regla R13).
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
