// src/components/vitals/VitalsBelowFold.tsx
// ════════════════════════════════════════════════════════════════════════════
// Bajo el fold: las 3 áreas más críticas + cobertura real de cada señal.
//
// SIN enlaces individuales (decisión D1, Victor 2026-07-20): no existe ninguna
// ruta de drill-down por departamento en la plataforma, y enlazar a
// /dashboard/clima desde una portada multi-señal rompería la promesa. El único
// camino accionable es el CTA de la portada. Cuando exista drill-down real o
// el Cockpit Ejecutivo, acá se agregan enlaces.
//
// La cobertura ("11/57") es parte del mensaje, no un detalle técnico: es la
// diferencia entre "el sistema dice que estás bien" y "el sistema solo pudo
// mirar 11 de 57".
// ════════════════════════════════════════════════════════════════════════════

import { zoneLabel } from '@/lib/narratives/vitalsNarratives';
import type { VitalSignsSummary } from '@/lib/services/vitals/types';
import { ZONE_SEVERITY } from '@/lib/constants/vitalsThresholds';

interface VitalsBelowFoldProps {
  summary: VitalSignsSummary;
}

export default function VitalsBelowFold({ summary }: VitalsBelowFoldProps) {
  const { coverage } = summary;

  const topCriticos = summary.departments
    .filter((d) => d.clima.verdict?.riskZone != null)
    .sort((a, b) => {
      const za = ZONE_SEVERITY[a.clima.verdict!.riskZone!];
      const zb = ZONE_SEVERITY[b.clima.verdict!.riskZone!];
      if (zb !== za) return zb - za;
      return (a.clima.verdict!.favorability ?? 0) - (b.clima.verdict!.favorability ?? 0);
    })
    .slice(0, 3);

  return (
    <div className="mt-8 space-y-6">
      {topCriticos.length > 0 && (
        <div className="rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm px-6 py-6 md:px-8">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">
            Áreas que concentran la señal
          </span>
          <ul className="mt-4 space-y-3">
            {topCriticos.map((d) => (
              <li
                key={d.departmentId}
                className="flex items-baseline justify-between gap-4 border-b border-slate-800/30 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-sm font-light text-slate-300">{d.departmentName}</span>
                <span className="text-sm font-light text-slate-400 tabular-nums whitespace-nowrap">
                  {d.clima.verdict!.favorability ?? '—'}
                  {' · '}
                  {zoneLabel(d.clima.verdict!.riskZone!)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cobertura de cada señal — nunca oculta */}
      <div className="rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm px-6 py-6 md:px-8">
        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          Cobertura de las señales
        </span>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <CoverageItem label="Clima" value={coverage.withClimaVerdict} total={coverage.totalDepartments} />
          <CoverageItem label="Integración" value={coverage.withExo} total={coverage.totalDepartments} />
          <CoverageItem label="Salidas" value={coverage.withEis} total={coverage.totalDepartments} />
          <CoverageItem label="Ambiente" value={coverage.withIsa} total={coverage.totalDepartments} />
        </div>
        <p className="text-xs font-light text-slate-500 leading-relaxed mt-4">
          Un área sin dato no es un área sana. Es un área que el sistema todavía no pudo leer.
        </p>
      </div>
    </div>
  );
}

function CoverageItem({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-extralight text-white tabular-nums">
        {value}
        <span className="text-slate-500 text-sm">{` / ${total}`}</span>
      </span>
      <span className="text-[11px] font-light text-slate-500 mt-0.5">{label}</span>
    </div>
  );
}
