'use client';

// src/components/compliance/cascada/ActoTriage.tsx
// Beat 2 de la Cascada — "El Triage".
//
// Hero CONDICIONAL a cobertura (MAPA §12, decisión Victor 2026-06-02):
//   - silencio-hero si gap ≥ 50: lidera "{gap}% en silencio"
//   - peligro-hero si la mayoría habló (gap < 50): lidera "{nFuego} en fuego"
//
// Ranking debajo: cards per-dept ordenadas FUEGO → HUMO → PUNTO_CIEGO → CONFIABLE.
// Cada card consume `resolveDepartmentRiskNarrative()` (VERBATIM Victor — copy del
// DepartmentRiskNarrativeDictionary aprobado). Excepción de vocabulario autorizada
// para "denuncia"/"Ley Karin" en FUEGO y HUMO-A-legal.
//
// Bandas Sexta + OTRO MUNDO se renderizan como componentes neutros si hay items
// (sin hero propio — son contexto del triage).

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActSeparator, fadeIn, fadeInDelay } from './shared';
import {
  resolveDepartmentRiskNarrative,
  type DepartmentRiskNarrative,
  type DepartmentRiskNarrativeState,
} from '@/lib/services/compliance/DepartmentRiskNarrativeDictionary';
import { formatDepartmentName } from '@/lib/utils/formatName';
import type { ComplianceReportResponse } from '@/types/compliance';

interface ActoTriageProps {
  data: ComplianceReportResponse;
}

// ── Orden canónico de severidad para el ranking ──
const STATE_ORDER: Record<DepartmentRiskNarrativeState, number> = {
  FUEGO: 0,
  HUMO: 1,
  PUNTO_CIEGO: 2,
  CONFIABLE: 3,
};

const STATE_LABEL: Record<DepartmentRiskNarrativeState, string> = {
  FUEGO: 'EN FUEGO',
  HUMO: 'EN HUMO',
  PUNTO_CIEGO: 'PUNTO CIEGO',
  CONFIABLE: 'CONFIABLE',
};

const STATE_BORDER: Record<DepartmentRiskNarrativeState, string> = {
  FUEGO: 'border-red-500/40',
  HUMO: 'border-amber-500/30',
  PUNTO_CIEGO: 'border-slate-500/30',
  CONFIABLE: 'border-cyan-500/30',
};

const STATE_CHIP: Record<DepartmentRiskNarrativeState, string> = {
  FUEGO: 'text-red-400',
  HUMO: 'text-amber-400',
  PUNTO_CIEGO: 'text-slate-400',
  CONFIABLE: 'text-cyan-400',
};

interface TriageItem {
  departmentId: string;
  departmentName: string;
  narrative: DepartmentRiskNarrative;
}

export default memo(function ActoTriage({ data }: ActoTriageProps) {
  const items = useMemo<TriageItem[]>(() => {
    const riskScores = data.data.riskScores ?? [];
    const acc: TriageItem[] = [];
    for (const rs of riskScores) {
      const narrative = resolveDepartmentRiskNarrative(rs);
      if (!narrative) continue; // con_isa + alertas sin denuncia → cubierto upstream.
      acc.push({
        departmentId: rs.departmentId,
        departmentName: rs.departmentName,
        narrative,
      });
    }
    // Orden severidad → alfabético dentro del estado.
    acc.sort((a, b) => {
      const sa = STATE_ORDER[a.narrative.state];
      const sb = STATE_ORDER[b.narrative.state];
      if (sa !== sb) return sa - sb;
      return a.departmentName.localeCompare(b.departmentName);
    });
    return acc;
  }, [data]);

  // Hero condicional según cobertura (MAPA §12).
  const coverageGapPct = 100 - (data.data.coverage?.pctCobertura ?? 100);
  const isSilencioHero = coverageGapPct >= 50;

  const nFuego = items.filter((i) => i.narrative.state === 'FUEGO').length;
  const nHumo = items.filter((i) => i.narrative.state === 'HUMO').length;
  const nPuntoCiego = items.filter((i) => i.narrative.state === 'PUNTO_CIEGO').length;

  const sextaItems = data.data.silencioVozExterna ?? [];
  const otroMundoItems = data.data.otroMundo ?? [];

  if (items.length === 0 && sextaItems.length === 0 && otroMundoItems.length === 0) {
    return null;
  }

  // Hero
  const heroNumber = isSilencioHero ? `${coverageGapPct}%` : `${nFuego}`;
  const heroLabel = isSilencioHero
    ? coverageGapPct === 100 ? 'en silencio total' : 'sin voz medible'
    : nFuego === 1 ? 'área en fuego' : 'áreas en fuego';
  const heroColor = isSilencioHero || nFuego > 0 ? 'text-violet-400' : 'text-amber-400';

  return (
    <>
      <ActSeparator label="El Triage" color={isSilencioHero || nFuego > 0 ? 'purple' : 'amber'} />
      <div>
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className={cn('text-7xl md:text-8xl font-extralight tracking-tight', heroColor)}>
            {heroNumber}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            {heroLabel}
          </p>
          {/* Subtítulo: composición del triage */}
          {(nFuego > 0 || nHumo > 0 || nPuntoCiego > 0) && (
            <p className="text-xs text-slate-500 mt-2 tracking-wider">
              {[
                nFuego > 0 ? `${nFuego} en fuego` : null,
                nHumo > 0 ? `${nHumo} en humo` : null,
                nPuntoCiego > 0 ? `${nPuntoCiego} punto ciego` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </motion.div>

        {/* Ranking per-dept */}
        {items.length > 0 && (
          <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
            {items.map((item) => (
              <div
                key={item.departmentId}
                className={cn(
                  'border-l-2 pl-4 rounded-r-sm py-1',
                  STATE_BORDER[item.narrative.state],
                )}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm font-medium text-slate-200">
                    {formatDepartmentName(item.departmentName)}
                  </p>
                  <p
                    className={cn(
                      'text-[10px] uppercase tracking-widest font-semibold',
                      STATE_CHIP[item.narrative.state],
                    )}
                  >
                    {STATE_LABEL[item.narrative.state]}
                  </p>
                </div>
                <p className="text-sm font-light text-slate-300 leading-relaxed mt-1">
                  {item.narrative.narrativa}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Sexta + OTRO MUNDO — componentes neutros, sin hero */}
        {(sextaItems.length > 0 || otroMundoItems.length > 0) && (
          <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-8 space-y-3">
            {sextaItems.length > 0 && (
              <div className="border-t border-slate-800/40 pt-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                  El silencio que ya habla
                </p>
                {sextaItems.map((s, i) => (
                  <p
                    key={`sexta-${s.departmentId ?? i}`}
                    className="text-sm font-light text-slate-300 leading-relaxed"
                  >
                    {s.narrativa}
                  </p>
                ))}
              </div>
            )}
            {otroMundoItems.length > 0 && (
              <div className="border-t border-slate-800/40 pt-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                  Otro mundo (no invitados con rastro externo)
                </p>
                {/* OtroMundoItem es metadata neutra (sin narrativa pre-cocinada).
                    Renderizamos descriptor fáctico: nombre + #señales. Cuando
                    Victor entregue la cláusula OTRO_MUNDO (Gate 2.5), se reemplaza. */}
                {otroMundoItems.map((o, i) => (
                  <p
                    key={`otromundo-${o.departmentId ?? i}`}
                    className="text-sm font-light text-slate-300 leading-relaxed"
                  >
                    <span className="font-medium text-slate-200">
                      {formatDepartmentName(o.departmentName)}
                    </span>
                    {' · '}
                    {o.signalsCount === 1
                      ? '1 señal externa sin participar del estudio'
                      : `${o.signalsCount} señales externas sin participar del estudio`}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
});
