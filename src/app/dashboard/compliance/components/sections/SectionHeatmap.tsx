'use client';

// src/app/dashboard/compliance/components/sections/SectionHeatmap.tsx
// Vista global bird's-eye: grid deptos × dimensiones.
// Tesla Line: slate (#64748B) — sección descriptiva, no juicio.

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import SectionShell from './_shared/SectionShell';
import {
  DIMENSION_ORDER,
  DIMENSION_SHORT,
  type DimensionKey,
} from '@/app/dashboard/compliance/lib/labels';
import { cellColor, formatISA } from '@/app/dashboard/compliance/lib/format';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';
import type { ComplianceReportDepartment } from '@/types/compliance';

type SortMode = 'isa' | 'signals' | 'name' | DimensionKey;

export default function SectionHeatmap({ hook }: { hook: UseComplianceDataReturn }) {
  const report = hook.report;
  const [sortMode, setSortMode] = useState<SortMode>('isa');

  const depts = report?.data.departments ?? [];
  const skipped = report?.data.skippedByPrivacy ?? [];

  // riesgo convergente por depto (para ordenar por signals)
  const signalsByDept = useMemo(() => {
    const map = new Map<string, number>();
    if (!report) return map;
    for (const c of report.data.convergencia.departments) {
      map.set(c.departmentId, c.riskSignalsCount ?? 0);
    }
    return map;
  }, [report]);

  const sortedDepts = useMemo(() => {
    const arr = [...depts];
    const compare = (a: ComplianceReportDepartment, b: ComplianceReportDepartment) => {
      if (sortMode === 'isa') {
        return (a.isaScore ?? 0) - (b.isaScore ?? 0); // menor ISA arriba
      }
      if (sortMode === 'signals') {
        return (
          (signalsByDept.get(b.departmentId) ?? 0) -
          (signalsByDept.get(a.departmentId) ?? 0)
        );
      }
      if (sortMode === 'name') {
        return a.departmentName.localeCompare(b.departmentName);
      }
      // Dimensión específica
      const dimKey = sortMode as DimensionKey;
      const av = a.dimensionScores?.[dimKey] ?? Number.POSITIVE_INFINITY;
      const bv = b.dimensionScores?.[dimKey] ?? Number.POSITIVE_INFINITY;
      return av - bv;
    };
    arr.sort(compare);
    return arr;
  }, [depts, sortMode, signalsByDept]);

  if (!report) return null;

  return (
    <SectionShell sectionId="heatmap" onNext={hook.navigateNext}>
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
          Vista global
        </p>
        <h2 className="text-xl md:text-2xl font-light text-white leading-snug">
          Una lectura rápida del mapa: dónde respira, dónde concentra tensión.
        </h2>
        <p className="text-sm text-slate-500 font-light mt-2">
          Ordenado por <strong className="text-slate-400 font-medium">{sortLabel(sortMode)}</strong>.
        </p>
      </div>

      {/* Controles de orden */}
      <div className="flex flex-wrap gap-2 mb-4 text-[11px]">
        <SortButton active={sortMode === 'isa'} onClick={() => setSortMode('isa')}>
          Índice
        </SortButton>
        <SortButton
          active={sortMode === 'signals'}
          onClick={() => setSortMode('signals')}
        >
          Señales cruzadas
        </SortButton>
        <SortButton
          active={sortMode === 'name'}
          onClick={() => setSortMode('name')}
        >
          Nombre
        </SortButton>
        <span className="text-slate-700 mx-1">·</span>
        {DIMENSION_ORDER.map((dim) => (
          <SortButton
            key={dim}
            active={sortMode === dim}
            onClick={() => setSortMode(dim)}
          >
            {DIMENSION_SHORT[dim]}
          </SortButton>
        ))}
      </div>

      {/* Grid heatmap */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full min-w-[640px] text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="text-left font-light pb-2 pr-3 w-[220px]">Departamento</th>
              <th className="text-right font-light pb-2 pr-3 tabular-nums">Índice</th>
              {DIMENSION_ORDER.map((dim) => (
                <th
                  key={dim}
                  className="font-light pb-2 px-1 text-center tracking-wider uppercase text-[9px]"
                >
                  {DIMENSION_SHORT[dim]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedDepts.map((d) => (
              <tr
                key={d.departmentId}
                className="group hover:bg-slate-900/40 transition-colors cursor-pointer"
                onClick={() => {
                  hook.selectDepartment(d.departmentId);
                  hook.selectSection('ancla');
                }}
                title={`Ver ${d.departmentName} en detalle`}
              >
                <td className="py-1.5 pr-3 text-slate-300 font-light truncate">
                  {d.departmentName}
                </td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-slate-200 font-light">
                  {formatISA(d.isaScore)}
                </td>
                {DIMENSION_ORDER.map((dim) => {
                  const score = d.dimensionScores?.[dim];
                  return (
                    <td key={dim} className="p-0.5">
                      <div
                        className={cn(
                          'h-8 flex items-center justify-center rounded text-[11px] tabular-nums',
                          cellColor(score)
                        )}
                      >
                        {score !== null && score !== undefined ? score.toFixed(1) : '—'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Deptos con privacidad no alcanzada */}
            {skipped.map((s) => (
              <tr key={s.departmentId} className="opacity-40">
                <td className="py-1.5 pr-3 text-slate-500 font-light truncate italic">
                  {s.departmentName}
                </td>
                <td className="py-1.5 pr-3 text-right text-slate-700 text-[10px] font-light italic">
                  Privacidad
                </td>
                {DIMENSION_ORDER.map((dim) => (
                  <td key={dim} className="p-0.5">
                    <div className="h-8 flex items-center justify-center rounded bg-slate-900/20 text-slate-700">
                      —
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-slate-600 font-light mt-4 italic">
        Click en una fila para abrir el detalle del departamento. Las celdas
        con &quot;—&quot; corresponden a áreas con n &lt; 5 (privacidad).
      </p>
    </SectionShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Subcomponentes
// ═══════════════════════════════════════════════════════════════════

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1 rounded-full border transition-all font-light',
        active
          ? 'bg-slate-800 border-slate-600 text-slate-100'
          : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
      )}
    >
      {children}
    </button>
  );
}

function sortLabel(mode: SortMode): string {
  if (mode === 'isa') return 'índice del área';
  if (mode === 'signals') return 'señales cruzadas';
  if (mode === 'name') return 'nombre';
  return DIMENSION_SHORT[mode] ?? mode;
}
