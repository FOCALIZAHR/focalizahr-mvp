'use client';

// ════════════════════════════════════════════════════════════════════════════
// SECTION CIERRE (C4 — Plan Global) — Bloque por origen
// PlanOriginBlock.tsx
// ════════════════════════════════════════════════════════════════════════════
// Renderiza UN bloque consolidado por origen ejecutivo (C1/C2/C3/Alertas).
// Componente dumb — recibe origen + actions ya ordenadas, sin lógica de filtrado.
//
// Tokens canónicos del módulo compliance (deuda reconocida, ver
// .claude/rules/frontend-design.md): bg-[#0F172A]/60 + rounded-[20px]
// alineado con el resto de SectionCierre histórico.

import { Check } from 'lucide-react';
import type { CompliancePlanAction } from '@/types/compliance';
import {
  ORIGIN_ACCENT,
  ORIGIN_LABELS,
  type OriginKey,
} from './_shared/constants';
import { formatActionDate } from './_shared/helpers';

interface PlanOriginBlockProps {
  origin: OriginKey;
  actions: CompliancePlanAction[];
}

export default function PlanOriginBlock({ origin, actions }: PlanOriginBlockProps) {
  const accent = ORIGIN_ACCENT[origin];
  const label = ORIGIN_LABELS[origin];

  const eyebrowColor =
    accent === 'amber' ? 'text-amber-400' : 'text-cyan-400';
  const checkColor =
    accent === 'amber' ? 'text-amber-400/70' : 'text-cyan-400/70';

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3 px-1">
        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${eyebrowColor}`}>
          {label}
        </p>
        <span className="text-[10px] font-mono text-slate-600 tabular-nums">
          {actions.length} {actions.length === 1 ? 'acción' : 'acciones'}
        </span>
      </div>

      <div className="relative overflow-hidden p-5 bg-[#0F172A]/60 border border-slate-800 rounded-[20px] divide-y divide-slate-800/40">
        {actions.map((action) => (
          <div
            key={action.id}
            className="flex items-start gap-4 py-3 first:pt-0 last:pb-0"
          >
            <Check className={`w-4 h-4 ${checkColor} mt-0.5 flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 text-sm font-light leading-snug">
                {action.optionLabel}
              </p>
              <p className="text-slate-600 text-[11px] mt-0.5 font-light">
                {action.triggerLabel}
                {action.plazo ? ` · ${action.plazo}` : ''}
              </p>
              {action.evidencia && (
                <p className="text-slate-600 text-[11px] mt-1 font-light italic">
                  Evidencia: {action.evidencia}
                </p>
              )}
            </div>
            <span className="text-slate-700 text-[10px] font-mono flex-shrink-0 tabular-nums">
              {formatActionDate(action.registeredAt)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
