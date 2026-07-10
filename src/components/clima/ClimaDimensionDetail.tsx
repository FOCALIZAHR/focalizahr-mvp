'use client';

// src/components/clima/ClimaDimensionDetail.tsx
// ════════════════════════════════════════════════════════════════════════════
// Componente COMPARTIDO (fuente única) del detalle de UNA dimensión de clima.
// Lo usan las Cards de hallazgo (inline) Y el Modal del ClimaToolbar — mismo
// nivel de análisis completo, nunca una versión reducida (semilla §3).
//
// Molde de 3 capas (semilla §2):
//   Capa 1 — número honesto: gauge (bandas fijas, nº blanco) + peores gerencias.
//   Capa 2 — interpretación (Motor de Asociación): cláusula cross-signal §7
//            (exit/onboarding en 4.5a; sesgo del evaluador se cablea en 4.5b-ii)
//            del peor depto, SOLO si la dimensión es un foco ahí. Copy verbatim.
//   Capa 3a — costo CLP (ALG 5, ya sellado): BusinessCaseCard.
//
// Tokens CANÓNICOS (CompensationPortada), NO la deuda visual de compliance.
// El color de acento lo canta la zona (anti-semáforo: verde→cyan, roja→ámbar,
// nunca rojo). Sin semáforo de borde/glow por severidad.
// ════════════════════════════════════════════════════════════════════════════

import EngagementGauge from '@/components/clima/EngagementGauge';
import FavorabilityBar from '@/components/clima/FavorabilityBar';
import BusinessCaseCard from '@/components/clima/BusinessCaseCard';
import { zoneColor, ZONE_LABEL } from '@/components/clima/climaZonePalette';
import { dimensionLabel } from '@/lib/constants/climaDimensions';
import { CLIMA_TARGET_FAVORABILITY } from '@/lib/services/clima/climaThresholds';
import {
  CROSS_SIGNAL_CLAUSES,
  interpolate,
  type CrossSignalKey,
} from '@/lib/services/clima/ClimaNarrativeDictionary';
import type { ClimaDimensionAgg } from '@/lib/utils/aggregateClimaDimension';
import type { ClimaDepartmentInsight } from '@/types/clima';

interface ClimaDimensionDetailProps {
  dimension: ClimaDimensionAgg;
  /** Para resolver el cross-signal del peor depto (Capa 2). */
  departments: ClimaDepartmentInsight[];
}

/** Selecciona la cláusula §7 aplicable al peor depto de la dimensión (Capa 2).
 *  4.5a: exit (liderazgo) / onboarding (cualquier dim). El sesgo del evaluador
 *  (biasLeniency/biasSeverity/evaluadorProtege) se activa en 4.5b-ii. Solo aplica
 *  cuando la dimensión es un foco (fav < objetivo) en ese depto. */
function selectCrossClause(
  driver: string,
  worst: ClimaDepartmentInsight | null | undefined,
  worstFav: number | null,
): { key: CrossSignalKey; gerencia: string } | null {
  if (!worst || worstFav === null || worstFav >= CLIMA_TARGET_FAVORABILITY) return null;
  const cs = worst.crossSignals;
  if (!cs) return null;
  if (driver === 'liderazgo' && cs.exitTopFactor?.mentionsManager) {
    return { key: 'exit', gerencia: worst.departmentName };
  }
  if (cs.onboardingAbandon) {
    return { key: 'onboarding', gerencia: worst.departmentName };
  }
  return null;
}

export default function ClimaDimensionDetail({ dimension, departments }: ClimaDimensionDetailProps) {
  const label = dimensionLabel(dimension.driver);
  const accent = zoneColor(dimension.zone); // cyan/slate/ámbar (anti-semáforo)
  const bandLabel = dimension.zone ? ZONE_LABEL[dimension.zone] : null;

  const worst = dimension.worstDepts[0];
  const worstInsight = worst
    ? departments.find((d) => d.departmentId === worst.departmentId)
    : null;
  const cross = selectCrossClause(dimension.driver, worstInsight, worst?.fav ?? null);
  const clause = cross ? CROSS_SIGNAL_CLAUSES[cross.key] : null;
  const ctx: Record<string, string> = cross ? { gerencia: cross.gerencia } : {};

  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="px-6 py-8 md:px-8 md:py-10 space-y-8">
        {/* ─── Header ─── */}
        <div>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">
            Inteligencia de Clima
          </span>
          <h3 className="text-2xl font-extralight text-white tracking-tight mt-1">
            <span className="fhr-title-gradient">{label}</span>
          </h3>
          {dimension.orgFav !== null && bandLabel && (
            <p className="text-sm font-light mt-1" style={{ color: accent }}>
              {Math.round(dimension.orgFav)} · {bandLabel}
              <span className="text-slate-500">
                {' '}· {dimension.measuredDeptCount}{' '}
                {dimension.measuredDeptCount === 1 ? 'gerencia medida' : 'gerencias medidas'}
              </span>
            </p>
          )}
        </div>

        {/* ─── Capa 1 — número + peores gerencias ─── */}
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <EngagementGauge
              favorability={dimension.orgFav}
              riskZone={dimension.zone}
              momentum={dimension.momentum}
              size={180}
            />
          </div>
          {dimension.worstDepts.length > 0 && (
            <div className="flex-1 space-y-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Dónde pesa más
              </p>
              {dimension.worstDepts.map((d) => (
                <FavorabilityBar key={d.departmentId} label={d.departmentName} value={d.fav} />
              ))}
            </div>
          )}
        </div>

        {/* ─── Capa 2 — interpretación (Motor de Asociación) ─── */}
        {clause && (
          <div className="max-w-2xl space-y-3 border-l-2 pl-4" style={{ borderColor: `${accent}4d` }}>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Lo que dice el cruce
            </p>
            <p className="text-base font-light text-slate-300 leading-relaxed">
              {interpolate(clause.convergence, ctx)}
            </p>
            {clause.hypotheses && (
              <p className="text-base font-light text-slate-400 leading-relaxed">
                {interpolate(clause.hypotheses, ctx)}
              </p>
            )}
          </div>
        )}

        {/* ─── Capa 3a — costo CLP ─── */}
        {dimension.businessCase && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Caso de negocio</p>
            <BusinessCaseCard businessCase={dimension.businessCase} />
          </div>
        )}
      </div>
    </div>
  );
}
