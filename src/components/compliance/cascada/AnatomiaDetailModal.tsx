'use client';

// src/components/compliance/cascada/AnatomiaDetailModal.tsx
// Beat 3 · GATE 3c — el modal "Ver el detalle" de la Anatomía.
//
// Chrome heredado de `CascadaModalShell` (UN solo lugar para el estilo del
// modal de la cascada). Por dimensión: nombre semibold + valor tabular,
// aposición como subtítulo fino, barra 3px con fill por nivel + tick en 75,
// headline en cursiva diferenciada, body verbatim del motor.
// Paleta §7: crítico orange-600 · riesgo amber-500 · atención slate-400 · sano cyan-400.

import { memo } from 'react';
import { cn } from '@/lib/utils';
import CascadaModalShell from './CascadaModalShell';
import {
  buildAnatomiaModal,
  type AnatomiaModalDim,
} from '@/lib/services/compliance/buildAnatomia';
import { computeOrgDimensions } from '@/lib/services/compliance/orgDimensions';
import type { ComplianceDimensionLevel } from '@/config/narratives/ComplianceNarrativeDictionary';
import type { ComplianceReportResponse } from '@/types/compliance';

interface AnatomiaDetailModalProps {
  data: ComplianceReportResponse;
  onClose: () => void;
}

const LEVEL_TEXT: Record<ComplianceDimensionLevel, string> = {
  critico: 'text-orange-600',
  riesgo: 'text-amber-500',
  atencion: 'text-slate-400',
  sano: 'text-cyan-400',
};
const LEVEL_FILL: Record<ComplianceDimensionLevel, string> = {
  critico: 'bg-orange-600',
  riesgo: 'bg-amber-500',
  atencion: 'bg-slate-400',
  sano: 'bg-cyan-400',
};

const TESLA_CYAN = '#22D3EE';

/** Fila de dimensión — nombre+valor, aposición, barra (fill + tick 75), headline, body. */
function DimRow({ d, level }: { d: AnatomiaModalDim; level: ComplianceDimensionLevel }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-slate-200">{d.labelCEO}</p>
        <p className={cn('text-base font-light tabular-nums', LEVEL_TEXT[level])}>
          {d.display}
        </p>
      </div>
      <p className="text-[11px] font-light text-slate-500 mt-0.5">{d.labelLower}</p>

      {/* Barra 3px — fill por nivel + tick en 75 (el umbral sano). */}
      <div className="relative h-[3px] rounded-full bg-slate-800 mt-2 mb-3">
        <div
          className={cn('absolute left-0 top-0 h-full rounded-full', LEVEL_FILL[level])}
          style={{ width: `${d.display}%` }}
        />
        <div
          className="absolute top-[-2px] h-[7px] w-px bg-slate-500"
          style={{ left: '75%' }}
          aria-hidden
        />
      </div>

      <p className="text-sm italic text-slate-200 leading-relaxed">{d.headline}</p>
      <p className="text-sm font-light text-slate-400 leading-relaxed mt-1">{d.body}</p>
    </div>
  );
}

export default memo(function AnatomiaDetailModal({
  data,
  onClose,
}: AnatomiaDetailModalProps) {
  const modal = buildAnatomiaModal(computeOrgDimensions(data.data.departments ?? []));
  if (!modal) return null;

  const header = (
    <>
      <p className="text-lg font-light text-slate-100">{modal.header}</p>
      <p className="text-[11px] text-slate-500 mt-1">{modal.scaleLine}</p>
    </>
  );

  return (
    <CascadaModalShell teslaColor={TESLA_CYAN} header={header} onClose={onClose}>
      <div className="space-y-6">
        {modal.grupos.map((g) => (
          <div key={g.level}>
            <p
              className={cn(
                'text-[10px] uppercase tracking-widest font-medium mb-3',
                LEVEL_TEXT[g.level],
              )}
            >
              {g.kicker}
            </p>
            <div className="space-y-5">
              {g.dims.map((d) => (
                <DimRow key={d.key} d={d} level={g.level} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </CascadaModalShell>
  );
});
