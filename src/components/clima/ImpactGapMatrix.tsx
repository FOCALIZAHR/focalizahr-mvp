'use client';

// src/components/clima/ImpactGapMatrix.tsx
// Cuadrante 2×2 Impacto × Brecha (nivel compañía). Genérico cross-producto.
// Agrega el driverAnalysis (DriverImpact[]) de todos los deptos: impact es
// company-level (Pearson driver×EI), la favorabilidad se promedia ponderada.
//   eje Y: impacto (alto arriba)  ·  eje X: favorabilidad (bajo objetivo ← → sobre)
//   ↖ Focos (alto impacto, bajo objetivo)   ↗ Fortalezas (alto impacto, sobre)
//   ↙ Monitorear (bajo impacto, bajo)        ↘ Mantener (bajo impacto, sobre)

import { useMemo } from 'react';
import { zoneColor, zoneFromFavorability } from './climaZonePalette';
import type { ClimaDepartmentInsight } from '@/types/clima';

interface ImpactGapMatrixProps {
  departments: ClimaDepartmentInsight[];
}

const IMPACT_THRESHOLD = 0.3; // |r| ≥ 0.3 = impacto alto (umbral Gate 3)
const TARGET = 75; // CLIMA_TARGET_FAVORABILITY

interface DriverAgg {
  driver: string;
  impact: number | null; // |r| company-level
  fav: number | null; // favorabilidad ponderada
}

function DriverChip({ d }: { d: DriverAgg }) {
  const color = d.fav !== null ? zoneColor(zoneFromFavorability(d.fav)) : '#64748B';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-light bg-slate-900/60 border"
      style={{ borderColor: `${color}55`, color: '#E2E8F0' }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="capitalize">{d.driver}</span>
      {d.fav !== null && <span className="tabular-nums text-slate-400">{Math.round(d.fav)}%</span>}
    </span>
  );
}

function Quadrant({
  title,
  hint,
  drivers,
  accent,
}: {
  title: string;
  hint: string;
  drivers: DriverAgg[];
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/40 bg-slate-900/40 p-4 min-h-[130px] flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
        <span className="text-xs font-medium text-slate-200">{title}</span>
      </div>
      <p className="text-[10px] text-slate-500 font-light mb-3">{hint}</p>
      <div className="flex flex-wrap gap-1.5">
        {drivers.length ? (
          drivers.map((d) => <DriverChip key={d.driver} d={d} />)
        ) : (
          <span className="text-[11px] text-slate-600 font-light">—</span>
        )}
      </div>
    </div>
  );
}

export default function ImpactGapMatrix({ departments }: ImpactGapMatrixProps) {
  const drivers = useMemo<DriverAgg[]>(() => {
    const acc = new Map<string, { impactSum: number; impactN: number; favW: number; wTot: number }>();
    for (const dept of departments) {
      for (const di of dept.driverAnalysis ?? []) {
        if (di.carried) continue; // el diagnóstico fresco no lidera con dato stale
        const a = acc.get(di.driver) ?? { impactSum: 0, impactN: 0, favW: 0, wTot: 0 };
        if (di.impact !== null) {
          a.impactSum += Math.abs(di.impact);
          a.impactN += 1;
        }
        if (di.fav !== null) {
          const w = di.n || 1;
          a.favW += di.fav * w;
          a.wTot += w;
        }
        acc.set(di.driver, a);
      }
    }
    return Array.from(acc.entries()).map(([driver, a]) => ({
      driver,
      impact: a.impactN ? a.impactSum / a.impactN : null,
      fav: a.wTot ? a.favW / a.wTot : null,
    }));
  }, [departments]);

  if (drivers.length === 0) {
    return (
      <p className="text-sm font-light text-slate-500 text-center py-8">
        Sin análisis de dimensiones disponible.
      </p>
    );
  }

  const isHigh = (d: DriverAgg) => (d.impact ?? 0) >= IMPACT_THRESHOLD;
  const below = (d: DriverAgg) => (d.fav ?? 100) < TARGET;

  const focos = drivers.filter((d) => isHigh(d) && below(d));
  const fortalezas = drivers.filter((d) => isHigh(d) && !below(d));
  const monitorear = drivers.filter((d) => !isHigh(d) && below(d));
  const mantener = drivers.filter((d) => !isHigh(d) && !below(d));

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Quadrant title="Focos" hint="Alto impacto en engagement · bajo el objetivo" drivers={focos} accent="#F59E0B" />
        <Quadrant title="Fortalezas" hint="Alto impacto · sobre el objetivo" drivers={fortalezas} accent="#22D3EE" />
        <Quadrant title="Monitorear" hint="Bajo impacto · bajo el objetivo" drivers={monitorear} accent="#94A3B8" />
        <Quadrant title="Mantener" hint="Bajo impacto · sobre el objetivo" drivers={mantener} accent="#94A3B8" />
      </div>
      <p className="text-[10px] text-slate-500 font-light mt-3">
        Impacto = correlación de la dimensión con el Engagement Index (nivel compañía) · objetivo {TARGET}%
      </p>
    </div>
  );
}
