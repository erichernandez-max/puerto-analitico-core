import React, { useEffect, useState } from 'react';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { fetchConfiguracion, updateConfiguracion } from '../../api/adminApi';

interface ReglasFormState {
  cancelacion_horas_minimas: string;
  bloque_min_horas: string;
  consumo_offset_horas: string;
  vigencia_meses: string;
  tz: string;
  horario_lv_inicio: string;
  horario_lv_fin: string;
  horario_sab_inicio: string;
  horario_sab_fin: string;
  domingo_cerrado: string;
  [key: string]: string;
}

const defaultState: ReglasFormState = {
  cancelacion_horas_minimas: '24',
  bloque_min_horas: '3',
  consumo_offset_horas: '24',
  vigencia_meses: '6',
  tz: 'America/Mexico_City',
  horario_lv_inicio: '08:00',
  horario_lv_fin: '21:00',
  horario_sab_inicio: '08:00',
  horario_sab_fin: '17:00',
  domingo_cerrado: '1',
};

export const ConfiguracionPage: React.FC = () => {
  const [form, setForm] = useState<ReglasFormState>(defaultState);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchConfiguracion();
      if (data && typeof data === 'object') {
        setForm((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cargar las reglas de configuración.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleChange = (campo: string, valor: string) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await updateConfiguracion(form);
      setSuccessMsg(res.mensaje || 'Reglas operativas actualizadas exitosamente.');
      if (res.reglas) {
        setForm((prev) => ({
          ...prev,
          ...res.reglas,
        }));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
          <Sliders className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          Configuración Operativa y Reglas de Negocio
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
          Ajusta los parámetros transaccionales del motor de Puerto Analítico sin alterar el código fuente.
        </p>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900 text-red-800 dark:text-rose-200 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 dark:text-neutral-500 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs">
          <RotateCcw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm">Cargando reglas desde la base de datos...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tarjeta 1: Parámetros Transaccionales y Reglas */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs p-5 sm:p-6 space-y-4 transition-colors">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-neutral-800">
              <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
                Políticas de Reserva, Cancelación y Vigencia
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Anticipación mínima para cancelación / reagendamiento (R5 / R6)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={form.cancelacion_horas_minimas}
                    onChange={(e) => handleChange('cancelacion_horas_minimas', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm min-h-[44px] rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    horas
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Mínimo de horas consecutivas para modalidad Bloque (R7)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="2"
                    max="12"
                    value={form.bloque_min_horas}
                    onChange={(e) => handleChange('bloque_min_horas', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm min-h-[44px] rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    horas
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Horas antes del inicio para debito automático de saldo (R4)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={form.consumo_offset_horas}
                    onChange={(e) => handleChange('consumo_offset_horas', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm min-h-[44px] rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    horas (T-24h)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Meses de vigencia para saldos prepago comprados (R9)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={form.vigencia_meses}
                    onChange={(e) => handleChange('vigencia_meses', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm min-h-[44px] rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    meses
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Horarios Operativos */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs p-5 sm:p-6 space-y-4 transition-colors">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-neutral-800">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
                Horarios y Slots Operativos (Regla R1)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Lunes a Viernes — Apertura
                </label>
                <input
                  type="text"
                  value={form.horario_lv_inicio}
                  onChange={(e) => handleChange('horario_lv_inicio', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm min-h-[44px] rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Lunes a Viernes — Cierre
                </label>
                <input
                  type="text"
                  value={form.horario_lv_fin}
                  onChange={(e) => handleChange('horario_lv_fin', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm min-h-[44px] rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Sábados — Apertura
                </label>
                <input
                  type="text"
                  value={form.horario_sab_inicio}
                  onChange={(e) => handleChange('horario_sab_inicio', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm min-h-[44px] rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Sábados — Cierre
                </label>
                <input
                  type="text"
                  value={form.horario_sab_fin}
                  onChange={(e) => handleChange('horario_sab_fin', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm min-h-[44px] rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 font-mono"
                  required
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between p-3.5 bg-slate-50 dark:bg-neutral-800/60 rounded-xl border border-slate-200 dark:border-neutral-700">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-neutral-100">Cierre Operativo en Domingos</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Regla R1: Puerto Analítico permanece cerrado y no permite reservas en domingo.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.domingo_cerrado === '1'}
                    onChange={(e) => handleChange('domingo_cerrado', e.target.checked ? '1' : '0')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Zona Horaria */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs p-5 sm:p-6 space-y-4 transition-colors">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-neutral-800">
              <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
                Zona Horaria del Servidor
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                Identificador de Zona Horaria (IANA)
              </label>
              <select
                value={form.tz}
                onChange={(e) => handleChange('tz', e.target.value)}
                className="w-full px-3.5 py-2 text-sm min-h-[44px] rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="America/Mexico_City">America/Mexico_City (Ciudad de México / Cuernavaca)</option>
                <option value="America/Cancun">America/Cancun (Quintana Roo)</option>
                <option value="America/Tijuana">America/Tijuana (Baja California)</option>
                <option value="UTC">UTC (Tiempo Universal Coordinado)</option>
              </select>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                Todas las validaciones de slot, cálculos de antelación y recordatorios se basan en esta zona horaria.
              </p>
            </div>
          </div>

          {/* Botón de Guardar Cambios con min-h-[48px] */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={cargarDatos}
              disabled={saving}
              className="min-h-[48px] px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors active:scale-95"
            >
              Cancelar / Revertir
            </button>

            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-colors shadow-xs disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Guardando Cambios...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
