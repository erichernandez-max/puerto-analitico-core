import React from 'react';
import { BookOpen } from 'lucide-react';

export const ReglasInfo: React.FC = () => {
  const reglas = [
    {
      num: 'R1',
      titulo: 'Horarios de Operación y Slots',
      desc: 'Lunes a Viernes de 08:00 a 21:00 (13 slots de 1h, último inicio 20:00). Sábados de 08:00 a 17:00 (9 slots de 1h, último inicio 16:00). Domingos cerrado.',
    },
    {
      num: 'R4',
      titulo: 'Consumo Automático a T-24 Horas',
      desc: 'El saldo en horas no se deduce inmediatamente al reservar; se procesa de forma automatizada exactamente 24 horas antes del inicio de la sesión programada.',
    },
    {
      num: 'R5',
      titulo: 'Cancelaciones y Reembolso',
      desc: 'Cancelaciones con 24 horas o más de anticipación reembolsan el 100% de las horas a tu saldo. Cancelaciones con menos de 24 horas no devuelven saldo.',
    },
    {
      num: 'R6',
      titulo: 'Reagendamiento Flexible',
      desc: 'Puedes cambiar la fecha, hora o consultorio de tu sesión sin penalización, siempre que lo solicites con al menos 24 horas de antelación.',
    },
    {
      num: 'R7',
      titulo: 'Modalidad Bloque',
      desc: 'Para reservar bajo modalidad de bloque, se requiere seleccionar un mínimo de 3 horas consecutivas en el mismo consultorio y en el mismo día.',
    },
    {
      num: 'R9',
      titulo: 'Vigencia de 6 Meses y Renovación',
      desc: 'Todos los saldos prepago tienen 6 meses de vigencia. Cualquier nueva compra renueva en automático el vencimiento de todos tus saldos vigentes.',
    },
    {
      num: 'R13',
      titulo: 'Protección de Saldos por Congelamiento',
      desc: 'Si te ausentas temporalmente, tu cuenta puede ser congelada: tus saldos se mantienen protegidos sin expirar durante el tiempo que dure la suspensión.',
    },
    {
      num: 'R17',
      titulo: 'Capacidad Vendible y Mantenimiento',
      desc: 'Cada consultorio cuenta con 74h físicas semanales, de las cuales 2h se reservan estrictamente para mantenimiento, dejando 72h semanales vendibles.',
    },
  ];

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-neutral-800 shadow-xs space-y-4 sm:space-y-5 transition-colors">
      <div className="flex items-center space-x-2 text-slate-900 dark:text-neutral-100 font-bold text-base sm:text-lg">
        <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3>Reglamento y Políticas Operativas de Puerto Analítico</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {reglas.map((r) => (
          <div
            key={r.num}
            className="p-4 bg-slate-50/80 dark:bg-neutral-800/60 rounded-xl border border-slate-200/80 dark:border-neutral-700/80 flex items-start gap-3"
          >
            <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
              {r.num}
            </span>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-neutral-100 mb-1">
                {r.titulo}
              </h4>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
