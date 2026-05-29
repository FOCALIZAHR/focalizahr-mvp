'use client';

// src/app/dashboard/compliance/components/sections/SectionConvergencia/BandaSilencioExterna.tsx
// ────────────────────────────────────────────────────────────────────────────
// Banda compacta para deptos en la celda "silencio con voz externa" de la
// tipología v3.1 — restaurada en Señales cruzadas después de la limpieza
// de Gate 3.
//
// Diseño:
//   - Eyebrow "Silencio que ya habla" (consistente con la cascada — el Acto 0
//     ya usa esa frase para nombrar este caso).
//   - Cross-ref por departmentId con riskScores: solo entran items cuyo motor
//     resuelve a state === 'HUMO'. Si falla el cross-ref → no se renderiza
//     ese item (sin fallback al legacy `narrativa` del item, que era la
//     fuente de los problemas de Gate 2).
//   - Narrativa del motor (rama A / B / A-legal).
//   - Tag mínimo `Riesgo {score}` — etiqueta de typología, sin desglose
//     (el desglose vive en Acto 0).
//   - LegalBadgePill amber solo en rama A-legal — mismo contrato que Acto 0.
// ────────────────────────────────────────────────────────────────────────────

import { LegalBadgePill } from '@/components/compliance/cascada/shared';
import { resolveDepartmentRiskNarrative } from '@/lib/services/compliance/DepartmentRiskNarrativeDictionary';
import type {
  DepartmentRiskScore,
  SilencioVozExternaItem,
} from '@/types/compliance';

interface Props {
  items: SilencioVozExternaItem[];
  riskScores: DepartmentRiskScore[];
  country: string | null | undefined;
}

export default function BandaSilencioExterna({
  items,
  riskScores,
  country,
}: Props) {
  const byDeptId = new Map(riskScores.map((r) => [r.departmentId, r]));

  const rendered = items
    .map((item) => {
      if (!item.departmentId) return null;
      const score = byDeptId.get(item.departmentId);
      if (!score) return null;
      const narrative = resolveDepartmentRiskNarrative(score);
      if (!narrative || narrative.state !== 'HUMO') return null;
      return { item, score, narrative };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (rendered.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs uppercase tracking-widest text-slate-500">
        Silencio que ya habla
      </p>
      {rendered.map(({ item, score, narrative }) => {
        const isALegal = narrative.rama === 'A-legal';
        return (
          <div
            key={item.departmentId ?? `silencio-${score.departmentId}`}
            className="relative overflow-hidden rounded-[12px] border-l-2 border-amber-400/50"
            style={{
              background: '#0F172A',
              borderTop: '0.5px solid #1e293b',
              borderRight: '0.5px solid #1e293b',
              borderBottom: '0.5px solid #1e293b',
            }}
          >
            <div className="px-4 py-3 flex flex-col gap-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[14px] font-medium text-cyan-300">
                  {score.departmentName}
                </span>
                {isALegal && <LegalBadgePill country={country} />}
              </div>
              <p className="text-[13px] font-light text-slate-400 leading-relaxed">
                {narrative.narrativa}
              </p>
              <span className="inline-flex items-center self-start px-2.5 py-1 rounded-sm bg-slate-900/60 border border-slate-700/60 text-[11px] font-mono text-slate-300">
                Riesgo{' '}
                <span className="ml-1 text-purple-300 tabular-nums">
                  {narrative.chip.score}
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
