import React, { useEffect, useState } from 'react';
import { Producto } from '../../types/producto';
import { fetchProductos } from '../../api/productosApi';
import { formatCurrency } from '../../utils/formatters';
import { Loader } from '../common/Loader';
import { useUiStore } from '../../store/useUiStore';
import { Check, Sparkles, Tag, ArrowRight, ShieldCheck } from 'lucide-react';

export const ProductosCatalog: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setActiveTab } = useUiStore();

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchProductos();
        setProductos(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar catálogo de productos');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200">
        <Loader mensaje="Cargando catálogo oficial de tarifas..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-rose-200 text-center text-rose-600 font-semibold text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-lg mb-1">
          <Tag className="w-5 h-5 text-emerald-600" />
          <h2>Tarifas Oficiales y Paquetes de Renta</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
          Elige el esquema que mejor se adapte a tu práctica clínica. Todos los paquetes prepago cuentan con 6 meses de vigencia y renovación automática con cada compra subsiguiente (Regla R9).
        </p>
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {productos.map((prod) => {
          const costoPorHora =
            prod.horas_incluidas > 0
              ? Math.round(prod.precio / prod.horas_incluidas)
              : prod.precio;

          const esDestacado = prod.descuento_pct >= 20;

          return (
            <div
              key={prod.id}
              className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all flex flex-col justify-between relative ${
                esDestacado
                  ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-lg'
                  : 'border-slate-200 shadow-xs hover:shadow-md'
              }`}
            >
              {prod.descuento_pct > 0 && (
                <div className="absolute top-4 right-4">
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    {prod.descuento_pct}% Ahorro
                  </span>
                </div>
              )}

              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900">
                  {prod.nombre}
                </h3>
                <span className="text-xs text-slate-400 capitalize block mt-0.5">
                  Modalidad: {prod.tipo.replace('_', ' ')}
                </span>

                {/* Precio */}
                <div className="my-4">
                  <span className="text-3xl font-black text-slate-900">
                    {formatCurrency(prod.precio)}
                  </span>
                  <span className="text-xs text-slate-500 block mt-1 font-medium">
                    {prod.horas_incluidas > 1
                      ? `Equivalente a ${formatCurrency(costoPorHora)} / hora`
                      : 'Por hora individual'}
                  </span>
                </div>

                {/* Beneficios */}
                <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      <strong>{prod.horas_incluidas}</strong>{' '}
                      {prod.horas_incluidas === 1 ? 'hora incluida' : 'horas incluidas'}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Vigencia de {prod.vigencia_meses || 6} meses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Renovación acumulativa (R9)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Acceso a los 5 consultorios</span>
                  </li>
                </ul>
              </div>

              {/* Botón CTA */}
              <button
                onClick={() => setActiveTab('soporte')}
                className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                  esDestacado
                    ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <span>Solicitar Adquisición</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <span>
          Las compras y abonos de saldo se concilian mediante transferencia bancaria y se acreditan de forma inmediata en tu cuenta de Puerto Analítico con factura electrónica disponible.
        </span>
      </div>
    </div>
  );
};
