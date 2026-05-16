'use client';

// Chip pequeño para casos Motor A (A1-A5).
// Spec: bg-slate-900/60 + border-slate-700/60 + text-[11px] + slate-300 mono.
// El ícono Lucide añade semántica — no se usa color para severidad.

import { SELLOS_FORENSES_LABELS } from './_shared/SELLOS_FORENSES_LABELS';
import { SELLO_GLOSARIO } from '@/app/dashboard/compliance/lib/glosario';
import { TooltipContext } from '@/components/ui/TooltipContext';
import type { CasoMotorA } from './_shared/helpers';

interface Props {
  caso: CasoMotorA;
}

export default function SelloForense({ caso }: Props) {
  const entry = SELLOS_FORENSES_LABELS[caso];
  const Icon = entry.icon;
  return (
    <TooltipContext
      title={entry.label}
      explanation={SELLO_GLOSARIO[caso]}
      variant="pattern"
      position="bottom"
      usePortal
    >
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-slate-900/60 border border-slate-700/60">
        <Icon className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
        <span className="text-[11px] font-mono text-slate-300">{entry.label}</span>
      </div>
    </TooltipContext>
  );
}
