import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import {
  Wallet,
  Calendar,
  Sparkles,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';

export const SaldosOverview: React.FC = () => {
  const { saldos, cargarSaldos, isLoading } = useAuthStore();
  const { setActiveTab } = useUiStore();

  useEffect(() => {
    cargarSaldos();
  }, []);

  const horasCompradas = saldos?.horas_compradas ?? 0;
  const horasApartadas = saldos?.horas_apartadas ?? 0;
  const horasConsumidas = saldos?.horas_consumidas ?? 0;
  const horasDisponibles =
    saldos?.horas_disponibles ??
    Math.max(0, horasCompradas - horasConsumidas - horasApartadas);

  const total = horasCompradas > 0 ? horasCompradas : 0;
  const pctLibre = total > 0 ? Math.min(100, Math.max(0, (horasDisponibles / total) * 100)) : 0;
  const pctApartado = total > 0 ? Math.min(100, Math.max(0, (horasApartadas / total) * 100)) : 0;
  const pctConsumido = total > 0 ? Math.min(100, Math.max(0, (horasConsumidas / total) * 100)) : 0;

  const paquetes = saldos?.saldos ?? [];

  return (
    <div className="space-y-6">
      {/* Tarjeta Principal de "Mi Saldo" Rediseñada */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800/80 relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Header de la tarjeta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5 text-slate-400 text-xs sm:text-sm font-semibold tracking-wider uppercase">
              <span className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-emerald-400">
                <Wallet className="w-5 h-5" />
              </span>
              <span>Balance de Saldo de Horas</span>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => cargarSaldos()}
                disabled={isLoading}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors min-h-[44px]"
                title="Actualizar saldo"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>

              <button
                onClick={() => setActiveTab('productos')}
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg min-h-[44px]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Comprar Horas</span>
              </button>
            </div>
          </div>

          {/* Gran número de Horas Disponibles */}
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">
              Horas Disponibles para Reservar
            </span>
            <div className="flex items-baseline space-x-3">
              <span className="text-5xl sm:text-6xl font-black text-white tracking-tight drop-shadow-sm">
                {horasDisponibles.toFixed(2)}
              </span>
              <span className="text-emerald-400 font-extrabold text-2xl sm:text-3xl">
                hrs
              </span>
            </div>

            {/* Desglose exacto requerido */}
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
              Tienes <strong className="text-white font-semibold">{horasCompradas.toFixed(2)}</strong> horas compradas.{' '}
              <strong className="text-amber-300 font-semibold">{horasApartadas.toFixed(2)}</strong> están apartadas en reservas y{' '}
              <strong className="text-slate-400 font-semibold">{horasConsumidas.toFixed(2)}</strong> consumidas.
            </p>
          </div>

          {/* Indicador Visual / Barra de Progreso Segmentada (Libre vs Apartado vs Consumido) */}
          <div className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800/90 space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span>Distribución del Saldo</span>
              {saldos?.fecha_vencimiento && (
                <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Vence: {saldos.fecha_vencimiento}
                </span>
              )}
            </div>

            {/* Barra segmentada */}
            <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex p-0.5 gap-0.5">
              {pctLibre > 0 && (
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${pctLibre}%` }}
                  title={`Libre: ${horasDisponibles}h (${pctLibre.toFixed(1)}%)`}
                />
              )}
              {pctApartado > 0 && (
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${pctApartado}%` }}
                  title={`Apartado: ${horasApartadas}h (${pctApartado.toFixed(1)}%)`}
                />
              )}
              {pctConsumido > 0 && (
                <div
                  className="bg-slate-600 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${pctConsumido}%` }}
                  title={`Consumido: ${horasConsumidas}h (${pctConsumido.toFixed(1)}%)`}
                />
              )}
              {total === 0 && (
                <div className="w-full bg-slate-800 h-full rounded-full" />
              )}
            </div>

            {/* Leyenda de la barra */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-md bg-emerald-500 flex-shrink-0" />
                <div>
                  <span className="font-semibold block text-white">Libre</span>
                  <span className="text-[11px] text-slate-400">{horasDisponibles.toFixed(1)}h ({pctLibre.toFixed(0)}%)</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-md bg-amber-500 flex-shrink-0" />
                <div>
                  <span className="font-semibold block text-white">Apartado</span>
                  <span className="text-[11px] text-slate-400">{horasApartadas.toFixed(1)}h ({pctApartado.toFixed(0)}%)</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-md bg-slate-600 flex-shrink-0" />
                <div>
                  <span className="font-semibold block text-white">Consumido</span>
                  <span className="text-[11px] text-slate-400">{horasConsumidas.toFixed(1)}h ({pctConsumido.toFixed(0)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Banner de Regla R9 */}
          <div className="pt-2 text-xs sm:text-sm text-slate-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Regla R9 (Vigencia y Renovación en Cadena):</strong>{' '}
              Todos los saldos prepago tienen 6 meses de vigencia. La compra de cualquier nuevo paquete renueva automáticamente la vigencia de todos tus saldos acumulados.
            </span>
          </div>
        </div>
      </div>

      {/* Desglose de paquetes si está disponible */}
      {paquetes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 px-1">
            Paquetes Activos Asociados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {paquetes.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900">
                      {p.producto_nombre || `Paquete #${p.id}`}
                    </h4>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {p.horas_disponibles}h libres
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    {p.horas_compradas}h compradas • {p.horas_consumidas}h consumidas
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                  <span>Vence:</span>
                  <span className="font-semibold text-slate-800">
                    {p.fecha_vencimiento.split(' ')[0]} ({p.dias_para_vencer}d)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
