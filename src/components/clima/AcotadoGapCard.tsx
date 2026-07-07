'use client';

// src/components/clima/AcotadoGapCard.tsx
// Brecha de percepción por nivel de cargo (acotadoGroup). Genérico cross-producto.
// Privacy: las celdas bajo umbral se omiten en el insight (vienen null) → solo se
// muestran los grupos con dato suficiente.

import type { ClimaAcotadoGroupScore } from '@/types/clima';

interface AcotadoGapCardProps {
  scores: Record<string, ClimaAcotadoGroupScore> | null;
}

const GROUP_LABEL: Record<string, string> = {
  alta_gerencia: 'Alta gerencia',
  mandos_medios: 'Mandos medios',
  profesionales: 'Profesionales',
  base_operativa: 'Base operativa',
};
const GROUP_ORDER = ['alta_gerencia', 'mandos_medios', 'profesionales', 'base_operativa'];

export default function AcotadoGapCard({ scores }: AcotadoGapCardProps) {
  if (!scores) return null;

  const present = GROUP_ORDER.filter(
    (g) => scores[g] && scores[g].fav !== null
  ).map((g) => ({ key: g, label: GROUP_LABEL[g] ?? g, fav: scores[g].fav! }));

  if (present.length === 0) return null;

  const top = scores['alta_gerencia']?.fav ?? null;
  const base = scores['base_operativa']?.fav ?? null;
  const gap = top !== null && base !== null ? Math.round(top - base) : null;

  return (
    <div className="rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm p-5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">
        Percepción por nivel de cargo
      </p>

      <div className="space-y-2">
        {present.map((g) => (
          <div key={g.key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs font-light text-slate-300 truncate">
              {g.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-800/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-400"
                style={{ width: `${Math.max(0, Math.min(100, g.fav))}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-400">
              {Math.round(g.fav)}%
            </span>
          </div>
        ))}
      </div>

      {gap !== null && Math.abs(gap) >= 1 && (
        <p className="text-xs font-light text-slate-400 mt-3 leading-relaxed">
          Los jefes perciben{' '}
          <span className="text-white">{Math.round(top!)}%</span>; la base operativa,{' '}
          <span className="text-white">{Math.round(base!)}%</span>
          {' — '}
          <span className="text-white">{Math.abs(gap)} puntos</span> de brecha.
        </p>
      )}
    </div>
  );
}
