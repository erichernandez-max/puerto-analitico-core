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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {usuarios.length} terapeutas registrados en Puerto Analítico
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setNuevoUsuarioModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
          </button>
          <button
            onClick={cargarUsuarios}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
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
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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
