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
  activo:    { label: 'Activo',    cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' },
  congelado: { label: 'Congelado', cls: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' },
  moroso:    { label: 'Moroso',    cls: 'bg-red-50 dark:bg-rose-950/40 text-red-700 dark:text-rose-400 border border-red-200 dark:border-rose-800' },
};

const membresiaLabel: Record<string, string> = {
  prepago:  'Prepago',
  turno:    'Turno',
  completo: 'Completo',
};

export const UsuariosTable: React.FC<Props> = ({ usuarios, isLoading, onAjustarSaldo, onCambiarEstado }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-8 shadow-xs">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (usuarios.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-12 text-center shadow-xs">
        <p className="text-sm text-slate-500 dark:text-neutral-400">No se encontraron usuarios.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Email</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Membresía</th>
              <th className="text-right px-4 py-3">Horas Disp.</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-center px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
            {usuarios.map((u) => {
              const badge = estadoBadge[u.estado] || estadoBadge.activo;
              return (
                <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800 dark:text-neutral-100">{u.nombre}</div>
                    <div className="text-[11px] text-slate-400 dark:text-neutral-500 sm:hidden">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-neutral-300 hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-neutral-300 hidden md:table-cell capitalize">
                    {membresiaLabel[u.tipo_membresia] || u.tipo_membresia}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={clsx(
                      'font-bold',
                      u.saldo_disponible > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-rose-400'
                    )}>
                      {u.saldo_disponible}h
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium', badge.cls)}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onAjustarSaldo(u)}
                        title="Ajustar saldo"
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                      >
                        <Wallet className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onCambiarEstado(u)}
                        title={u.estado === 'activo' ? 'Congelar' : 'Activar'}
                        className={clsx(
                          'min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-xl transition-colors',
                          u.estado === 'activo'
                            ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                            : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
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
