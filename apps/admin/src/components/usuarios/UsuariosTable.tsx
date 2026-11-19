import React from 'react';
import { Wallet, Snowflake, Sun } from 'lucide-react';
import { UsuarioAdmin } from '../../types/usuarios';
import clsx from 'clsx';

interface Props {
  usuarios: UsuarioAdmin[];
  isLoading: boolean;
  onAjustarSaldo: (u: UsuarioAdmin) => void;
  onCambiarEstado: (u: UsuarioAdmin) => void;
}

const estadoBadge: Record<string, { label: string; cls: string }> = {
  activo:    { label: 'Activo',    cls: 'bg-emerald-100 text-emerald-700' },
  congelado: { label: 'Congelado', cls: 'bg-blue-100 text-blue-700' },
  moroso:    { label: 'Moroso',    cls: 'bg-red-100 text-red-700' },
};

const membresiaLabel: Record<string, string> = {
  prepago:  'Prepago',
  turno:    'Turno',
  completo: 'Completo',
};

export const UsuariosTable: React.FC<Props> = ({ usuarios, isLoading, onAjustarSaldo, onCambiarEstado }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (usuarios.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-sm text-slate-500">No se encontraron usuarios.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Nombre</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Membresía</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Horas Disp.</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600">Estado</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => {
              const badge = estadoBadge[u.estado] || estadoBadge.activo;
              return (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{u.nombre}</div>
                    <div className="text-xs text-slate-400 sm:hidden">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell capitalize">
                    {membresiaLabel[u.tipo_membresia] || u.tipo_membresia}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={clsx(
                      'font-semibold',
                      u.saldo_disponible > 0 ? 'text-emerald-600' : 'text-red-500'
                    )}>
                      {u.saldo_disponible}h
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', badge.cls)}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onAjustarSaldo(u)}
                        title="Ajustar saldo"
                        className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Wallet className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onCambiarEstado(u)}
                        title={u.estado === 'activo' ? 'Congelar' : 'Activar'}
                        className={clsx(
                          'p-1.5 rounded-md transition-colors',
                          u.estado === 'activo'
                            ? 'text-blue-600 hover:bg-blue-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        )}
                      >
                        {u.estado === 'activo' ? (
                          <Snowflake className="w-4 h-4" />
                        ) : (
                          <Sun className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
