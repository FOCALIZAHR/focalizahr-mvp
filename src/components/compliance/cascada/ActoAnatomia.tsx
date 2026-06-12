'use client';

// src/components/compliance/cascada/ActoAnatomia.tsx
// Beat 3 de la Cascada — "La Anatomía" · GATE 3b (el acto).
//
// El zoom del foco: desglosa el número — qué forma tiene el piso de las 6
// dimensiones (DESPAREJO / TODO BAJO / TODO SANO), cuál condición manda
// (dimFoco) y por qué el informe apunta ahí. Toda la lógica + copy verbatim
// viven en `buildAnatomia` (pure, testeado); el componente solo pinta.
//
// Sin cards, sin barras, sin border-left por ítem: kickers, tipografía, líneas.
// Paleta §7 (auditada, sin semáforo, sin rojo, purple SOLO IA):
//   crítico orange-600 · riesgo amber-500 · atención slate-400 · sano cyan-400.

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActSeparator, Tooltip, fadeIn, fadeInDelay } from './shared';
import { computeOrgDimensions } from '@/lib/services/compliance/orgDimensions';
import { buildAnatomia, FOCO_INFO } from '@/lib/services/compliance/buildAnatomia';
import type { ComplianceDimensionLevel } from '@/config/narratives/ComplianceNarrativeDictionary';
import type { ComplianceReportResponse } from '@/types/compliance';

interface ActoAnatomiaProps {
  data: ComplianceReportResponse;
}

// Paleta §7 — único portador de severidad (el número de cada dimensión).
const LEVEL_TEXT: Record<ComplianceDimensionLevel, string> = {
  critico: 'text-orange-600',
  riesgo: 'text-amber-500',
  atencion: 'text-slate-400',
  sano: 'text-cyan-400',
};

export default memo(function ActoAnatomia({ data }: ActoAnatomiaProps) {
  const acto = useMemo(() => {
    const dims = computeOrgDimensions(data.data.departments ?? []);
    const orgISA = Math.round(data.data.orgISA ?? 0);
    return buildAnatomia(dims, orgISA);
  }, [data]);

  if (!acto) return null;

  const heroColor = acto.hero.color === 'cyan' ? 'text-cyan-400' : 'text-amber-400';

  return (
    <>
      <ActSeparator label="La Anatomía" color="cyan" />
      <div>
        {/* Hero — número del hallazgo (dims en sano), no de metodología (§3). */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className={cn('text-7xl md:text-8xl font-extralight tracking-tight tabular-nums', heroColor)}>
            {acto.hero.dimsEnSano}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            dimensiones en nivel sano
          </p>
          <p className="text-xs text-slate-600 mt-1">
            de las {acto.hero.total} que mide el estudio
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto">
          {/* Narrativa de forma (§4.1) — titular + párrafos + foco. */}
          <p className="text-lg md:text-xl font-light text-white tracking-tight leading-snug text-center mb-4">
            {acto.titular}
          </p>
          {acto.parrafos.map((p, i) => (
            <p
              key={i}
              className="text-base font-light text-slate-400 leading-relaxed text-center mb-3"
            >
              {p}
            </p>
          ))}

          {/* Párrafo del foco — llana cyan semibold + ⓘ del foco. */}
          {acto.focoParrafo && (
            <p className="text-base font-light text-slate-400 leading-relaxed text-center mb-5">
              {acto.focoParrafo.pre}
              <Tooltip content={FOCO_INFO}>
                <span className="font-semibold text-cyan-400 cursor-help">
                  {acto.focoParrafo.foco}
                </span>
                <span className="ml-0.5 text-[10px] text-slate-600 align-super">ⓘ</span>
              </Tooltip>
              {acto.focoParrafo.post}
            </p>
          )}

          {/* Causa raíz del foco (§4.2 / §5) — párrafo centrado. */}
          {acto.causaRaiz && (
            <p className="text-sm font-light text-slate-300 leading-relaxed text-center mb-8 max-w-xl mx-auto">
              {acto.causaRaiz}
            </p>
          )}

          {/* Listado agrupado por gravedad (§4.3) — sin border-left, sin cards. */}
          <div className="space-y-2 mb-5">
            {acto.grupos.map((g) => (
              <p key={g.level} className="text-sm leading-relaxed tabular-nums">
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-widest font-medium mr-2',
                    LEVEL_TEXT[g.level],
                  )}
                >
                  {g.kicker}
                </span>
                {g.items.map((it, idx) => (
                  <span key={it.key} className="text-slate-300 font-light">
                    {idx > 0 && <span className="text-slate-600"> · </span>}
                    {it.labelCEO}
                    <span className={cn('ml-1', LEVEL_TEXT[g.level])}>· {it.display}</span>
                  </span>
                ))}
              </p>
            ))}
          </div>

          {/* Línea de escala (§4.4). */}
          <p className="text-[11px] text-slate-600 tracking-wide mb-5">
            {acto.scaleLine}
          </p>

          {/* Link al modal 3c — INERTE hasta 3c. */}
          {/* onClick lo cabla el modal 3c. */}
          <button
            className="group inline-flex items-center gap-1.5 text-sm font-light text-slate-400 hover:text-slate-300 transition-colors mb-6"
            type="button"
          >
            {acto.modalLink.replace(/\s*→$/, '')}
            <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">→</span>
          </button>

          {/* Cierre cursiva del set de formas (§4.6). */}
          <p className="text-sm italic font-light text-slate-400 leading-relaxed text-center mt-2">
            {acto.cierre}
          </p>
        </motion.div>
      </div>
    </>
  );
});
