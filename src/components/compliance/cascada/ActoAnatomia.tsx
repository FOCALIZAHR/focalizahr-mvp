'use client';

// src/components/compliance/cascada/ActoAnatomia.tsx
// Beat 3 de la Cascada — "La Anatomía".
//
// Las 6 dimensiones P2/P3/P4/P5/P7/P8 promediadas org-level ponderando por
// respondentCount. Labels CEO de DIMENSION_CEO_LABELS (NUNCA el key técnico).
// Cada dim se clasifica con `classifyDimensionLevel()` (sano/atencion/riesgo/critico)
// y muestra su headline VERBATIM de COMPLIANCE_DIMENSION_DICTIONARY.
//
// Reemplaza el contenido viejo de `ActoSenales` (que era convergencia, no
// anatomía — esa salida ya alimenta Beat 2 ranking y Beat 5 nombre).
//
// Privacy: una dim sin masa org-level (totalWeight=0 entre todos los deptos
// que la reportan) se OMITE — no se afirma "sin dato" ni se asume 0.

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActSeparator, fadeIn, fadeInDelay } from './shared';
import {
  classifyDimensionLevel,
  DIMENSION_CEO_LABELS,
  COMPLIANCE_DIMENSION_DICTIONARY,
  type ComplianceDimensionKey,
  type ComplianceDimensionLevel,
} from '@/config/narratives/ComplianceNarrativeDictionary';
import type { ComplianceReportResponse } from '@/types/compliance';

const DIM_KEYS: ComplianceDimensionKey[] = [
  'P2_seguridad',
  'P3_disenso',
  'P4_microagresiones',
  'P5_equidad',
  'P7_liderazgo',
  'P8_agotamiento',
];

interface DimRow {
  key: ComplianceDimensionKey;
  labelCEO: string;
  valor: number; // 1-5 (Likert ponderado org-level)
  level: ComplianceDimensionLevel;
  headline: string; // Verbatim COMPLIANCE_DIMENSION_DICTIONARY
}

const LEVEL_COLOR: Record<ComplianceDimensionLevel, string> = {
  sano: 'text-cyan-400',
  atencion: 'text-amber-400',
  riesgo: 'text-amber-400',
  critico: 'text-violet-400',
};

const LEVEL_BORDER: Record<ComplianceDimensionLevel, string> = {
  sano: 'border-cyan-500/30',
  atencion: 'border-amber-500/30',
  riesgo: 'border-amber-500/30',
  critico: 'border-violet-500/30',
};

interface ActoAnatomiaProps {
  data: ComplianceReportResponse;
}

export default memo(function ActoAnatomia({ data }: ActoAnatomiaProps) {
  const dims = useMemo<DimRow[]>(() => {
    const departments = data.data.departments ?? [];
    const rows: DimRow[] = [];

    for (const key of DIM_KEYS) {
      let weighted = 0;
      let total = 0;
      for (const dept of departments) {
        const v = dept.dimensionScores?.[key];
        const w = dept.respondentCount ?? 0;
        if (typeof v === 'number' && w > 0) {
          weighted += v * w;
          total += w;
        }
      }
      if (total === 0) continue; // Sin masa → se omite (no se afirma "sin dato").

      const valor = weighted / total;
      const level = classifyDimensionLevel(valor);
      const headline = COMPLIANCE_DIMENSION_DICTIONARY[key][level].headline;
      rows.push({
        key,
        labelCEO: DIMENSION_CEO_LABELS[key],
        valor,
        level,
        headline,
      });
    }
    return rows;
  }, [data]);

  if (dims.length === 0) return null;

  // Hero: # de dims medidas (de 6 posibles).
  return (
    <>
      <ActSeparator label="La Anatomía" color="cyan" />
      <div>
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight tracking-tight text-white">
            {dims.length}
            <span className="text-3xl md:text-4xl text-slate-500 font-extralight">
              /6
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            {dims.length === 1 ? 'dimensión medida' : 'dimensiones medidas'}
          </p>
        </motion.div>
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          {dims.map((d) => (
            <div
              key={d.key}
              className={cn('border-l-2 pl-4', LEVEL_BORDER[d.level])}
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  {d.labelCEO}
                </p>
                <p
                  className={cn(
                    'text-lg font-extralight tabular-nums',
                    LEVEL_COLOR[d.level],
                  )}
                >
                  {d.valor.toFixed(1)}
                </p>
              </div>
              <p className="text-sm font-light text-slate-300 leading-relaxed mt-1">
                {d.headline}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </>
  );
});
