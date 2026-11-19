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

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (successMsg) setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await updateConfiguracion(form);
      setSuccessMsg(res?.mensaje || 'Reglas guardadas correctamente en la base de datos.');
      if (res?.reglas) {
        setForm((prev) => ({ ...prev, ...res.reglas }));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-emerald-600" />
            Configuración del Sistema
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra las reglas de negocio, políticas de cancelación, horarios y parámetros de Puerto Analítico.
          </p>
        </div>

        <button
          type="button"
          onClick={cargarDatos}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recargar Reglas
        </button>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">¡Cambios guardados!</p>
            <p className="text-xs text-emerald-700 mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-500 font-medium">Cargando reglas desde la base de datos...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tarjeta 1: Reglas de Reservas y Saldos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldAlert className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Políticas de Reserva, Cancelación y Saldos
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Cancelación mínima con devolución (Horas)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={form.cancelacion_horas_minimas}
                    onChange={(e) => handleChange('cancelacion_horas_minimas', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                    required
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">horas</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Regla R5: Si el terapeuta cancela con menos de esta anticipación, no se devuelve el saldo.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mínimo de horas consecutivas para modalidad Bloque
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={form.bloque_min_horas}
                    onChange={(e) => handleChange('bloque_min_horas', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                    required
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">horas</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Regla R7: Mínimo requerido de sesión ininterrumpida en el mismo consultorio y fecha.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Antelación para debitar saldo de reserva (Horas previas)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={form.consumo_offset_horas}
                    onChange={(e) => handleChange('consumo_offset_horas', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                    required
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">horas</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Regla R4: Momento en que el cron debita efectivamente las horas del saldo del usuario.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Vigencia de paquetes de horas (Meses)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={form.vigencia_meses}
                    onChange={(e) => handleChange('vigencia_meses', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                    required
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">meses</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Regla R8: Tiempo de vigencia para saldos adquiridos antes de su vencimiento automático.
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Horarios de Atención */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Horarios Operativos y Apertura
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Lunes a Viernes — Apertura
                </label>
                <input
                  type="time"
                  value={form.horario_lv_inicio}
                  onChange={(e) => handleChange('horario_lv_inicio', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Lunes a Viernes — Cierre
                </label>
                <input
                  type="time"
                  value={form.horario_lv_fin}
                  onChange={(e) => handleChange('horario_lv_fin', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sábados — Apertura
                </label>
                <input
                  type="time"
                  value={form.horario_sab_inicio}
                  onChange={(e) => handleChange('horario_sab_inicio', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sábados — Cierre
                </label>
                <input
                  type="time"
                  value={form.horario_sab_fin}
                  onChange={(e) => handleChange('horario_sab_fin', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Cierre Operativo en Domingos</p>
                  <p className="text-xs text-slate-500">
                    Regla R1: Puerto Analítico permanece cerrado y no permite reservas en domingo.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.domingo_cerrado === '1'}
                    onChange={(e) => handleChange('domingo_cerrado', e.target.value ? (e.target.checked ? '1' : '0') : '0')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Zona Horaria */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Globe className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Zona Horaria del Servidor
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Identificador de Zona Horaria (IANA)
              </label>
              <select
                value={form.tz}
                onChange={(e) => handleChange('tz', e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="America/Mexico_City">America/Mexico_City (Ciudad de México / Cuernavaca)</option>
                <option value="America/Cancun">America/Cancun (Quintana Roo)</option>
                <option value="America/Tijuana">America/Tijuana (Baja California)</option>
                <option value="UTC">UTC (Tiempo Universal Coordinado)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Todas las validaciones de slot, cálculos de antelación y recordatorios se basan en esta zona horaria.
              </p>
            </div>
          </div>

          {/* Botón de Guardar Cambios */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={cargarDatos}
              disabled={saving}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar / Revertir
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-xs disabled:opacity-50"
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
