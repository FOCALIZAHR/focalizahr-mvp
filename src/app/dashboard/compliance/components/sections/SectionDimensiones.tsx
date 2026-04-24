'use client';

// src/app/dashboard/compliance/components/sections/SectionDimensiones.tsx
// El problema — 6 dimensiones con barra + narrativa determinista del engine.
// Teatro card amber arriba si aplica. Tesla Line: cyan.

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import SectionShell from './_shared/SectionShell';
import {
  DIMENSION_ORDER,
  DIMENSION_LABELS,
} from '@/app/dashboard/compliance/lib/labels';
import { formatScore } from '@/app/dashboard/compliance/lib/format';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';
import type { ComplianceReportDepartment } from '@/types/compliance';

export default function SectionDimensiones({ hook }: { hook: UseComplianceDataReturn }) {
  const report = hook.report;

  // Promedio ponderado por respondentCount de cada dimensión a nivel org
  const orgDimensionScores = useMemo(() => {
    const result: Record<string, { score: number | null; respondents: number }> = {};
    if (!report) return result;
    type DimKey = keyof ComplianceReportDepartment['dimensionScores'];
    for (const dim of DIMENSION_ORDER as readonly DimKey[]) {
      let weighted = 0;
      let total = 0;
      let respondents = 0;
      for (const d of report.data.departments) {
        const s = d.dimensionScores?.[dim];
        if (s === null || s === undefined) continue;
        const w = d.respondentCount ?? 0;
        if (w <= 0) continue;
        weighted += s * w;
        total += w;
        respondents += w;
      }
      result[dim] = {
        score: total > 0 ? weighted / total : null,
        respondents,
      };
    }
    return result;
  }, [report]);

  if (!report) return null;

  const narrativas = report.narratives.artefacto1_dimensiones;
  const narrativaByDim = new Map(narrativas.map((n) => [n.dimensionKey, n]));

  const teatroCount = report.data.metaAnalysis?.teatro_detectado_count ?? 0;

  return (
    <SectionShell sectionId="dimensiones" onNext={hook.navigateNext}>
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
          Dimensiones
        </p>
        <h2 className="text-xl md:text-2xl font-light text-white leading-snug">
          Dónde se concentra la tensión del semestre.
        </h2>
      </div>

      {/* Teatro card amber si aplica */}
      {teatroCount > 0 && (
        <div className="relative overflow-hidden mb-6 p-5 bg-amber-950/30 border border-amber-500/30 rounded-[20px]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-amber-400 mb-1">
                Teatro de cumplimiento detectado
              </p>
              <p className="text-sm text-amber-100 font-light leading-relaxed">
                {teatroCount} {teatroCount === 1 ? 'gerencia puntúa' : 'gerencias puntúan'}{' '}
                alto en las métricas duras pero su lenguaje sugiere contención.
                Revisar estas áreas antes de leer el resto del mapa.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid 2×3 de dimensiones */}
      <div className="grid md:grid-cols-2 gap-4">
        {DIMENSION_ORDER.map((dim) => {
          const orgEntry = orgDimensionScores[dim];
          const score = orgEntry?.score ?? null;
          const narrativa = narrativaByDim.get(dim);
          const pct =
            score !== null ? Math.max(0, Math.min(100, (score / 5) * 100)) : 0;
          const isAmber = score !== null && score < 3.0;
          return (
            <div
              key={dim}
              className="relative overflow-hidden p-5 bg-[#0F172A]/60 border border-slate-800 rounded-[20px]"
            >
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                {DIMENSION_LABELS[dim] ?? dim}
              </p>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extralight text-white tabular-nums leading-none">
                  {formatScore(score)}
                </span>
                <span className="text-[10px] text-slate-600">/ 5,0</span>
              </div>

              {/* Barra */}
              <div className="mt-3 h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isAmber ? 'bg-amber-400/80' : 'bg-cyan-500/80'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Narrativa del engine */}
              {narrativa && (
                <p className="text-sm text-slate-400 font-light leading-relaxed mt-4">
                  {narrativa.narrativa}
                </p>
              )}

              {/* Respondentes */}
              <p className="text-[10px] text-slate-600 font-light mt-3">
                {orgEntry?.respondents ?? 0}{' '}
                {(orgEntry?.respondents ?? 0) === 1 ? 'persona' : 'personas'} a nivel
                org
              </p>
            </div>
          );
        })}
      </div>

      {/* Delta vs ciclo anterior a nivel org (si existe) */}
      {report.narratives.portada.deltaLabel && (
        <p className="text-[11px] text-slate-600 font-light mt-6 italic">
          Nota: {report.narratives.portada.deltaLabel}
        </p>
      )}
    </SectionShell>
  );
}
