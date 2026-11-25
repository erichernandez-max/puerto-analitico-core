import React, { useEffect, useState } from 'react';
import { Users, RefreshCw, Search, UserPlus } from 'lucide-react';
import { UsuarioAdmin } from '../../types/usuarios';
import { fetchUsuarios } from '../../api/adminApi';
import { UsuariosTable } from './UsuariosTable';
import { AjusteSaldoModal } from './AjusteSaldoModal';
import { CambiarEstadoModal } from './CambiarEstadoModal';
import { NuevoUsuarioModal } from './NuevoUsuarioModal';

export const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [saldoModal, setSaldoModal] = useState<UsuarioAdmin | null>(null);
  const [estadoModal, setEstadoModal] = useState<UsuarioAdmin | null>(null);
  const [nuevoUsuarioModalOpen, setNuevoUsuarioModalOpen] = useState(false);

  const cargarUsuarios = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchUsuarios();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const usuariosFiltrados = usuarios.filter((u) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Gestión de Usuarios
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            {usuarios.length} terapeutas registrados en Puerto Analítico
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setNuevoUsuarioModalOpen(true)}
            className="min-h-[44px] flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-xs active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
          </button>
          <button
            onClick={cargarUsuarios}
            disabled={isLoading}
            className="min-h-[44px] flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors active:scale-95"
          >
            <RefreshCw className={'w-4 h-4 ' + (isLoading ? 'animate-spin' : '')} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Busqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm min-h-[44px] border border-slate-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-slate-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900 text-red-700 dark:text-rose-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Tabla */}
      <UsuariosTable
        usuarios={usuariosFiltrados}
        isLoading={isLoading}
        onAjustarSaldo={(u) => setSaldoModal(u)}
        onCambiarEstado={(u) => setEstadoModal(u)}
      />

      {/* Modales */}
      {nuevoUsuarioModalOpen && (
        <NuevoUsuarioModal
          onClose={() => setNuevoUsuarioModalOpen(false)}
          onSuccess={cargarUsuarios}
        />
      )}
      {saldoModal && (
        <AjusteSaldoModal
          usuario={saldoModal}
          onClose={() => setSaldoModal(null)}
          onSuccess={cargarUsuarios}
        />
      )}
      {estadoModal && (
        <CambiarEstadoModal
          usuario={estadoModal}
          onClose={() => setEstadoModal(null)}
          onSuccess={cargarUsuarios}
        />
      )}
    </div>
  );
};
