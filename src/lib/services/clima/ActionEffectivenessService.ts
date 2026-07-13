// src/lib/services/clima/ActionEffectivenessService.ts
// EX Clima Gate 5C — matriz de 4 cuadrantes (efectividad, no cumplimiento).
//
// Se ejecuta como Fase 4d del cierre de un Seguimiento Focalizado (isFollowUp),
// llamado desde ClimaAggregationService con los datos ya en memoria (cero re-queries
// de score). Cruza el autorreporte del jefe (ClimaActionLog.actionText: con texto /
// vacío) contra el movimiento del driver y escribe el veredicto en ClimaActionLog.
// Ver plan Gate 5C + DISEÑO §4 + AS_BUILT_SEVERIDAD_REACTIVO_MEAN.md (fix mean).
//
// Reglas (Gate severidad reactivo+mean 2026-07-12 — actualiza el sello 5C):
//  - impactDelta = DriverImpact.meanMomentumDelta (delta de MEAN ×25 a pp), NO momentumDelta-fav:
//    el % favorable es ciego al deterioro dentro de las cajas bajas (Glint/Culture Amp).
//  - Umbrales SELLADOS climaThresholds: mejoró ≥ +5 (GROWING) · bajó ≤ −5 (DECLINING) — reusados
//    tal cual porque meanMomentumDelta está escalado ×25 (±5pp ⇄ Δmean ±0.2, misma semántica).
//  - null-safe: meanMomentumDelta===null (carried / n<5) → SALTA la fila (queda pendiente).
//    Como todas las filas de un mismo triggerRef comparten (depto,driver), el salto es
//    uniforme por construcción (nunca "una sí y otra no").
//  - @@unique es (actionPlanId, triggerRef) POR PLAN → puede haber >1 fila pendiente por
//    triggerRef. Veredicto (impactDelta/measuredAt/verdictCampaignId) igual a todas; el
//    quadrant se calcula POR FILA según su propio actionText.

import { prisma } from '@/lib/prisma';
import { MOMENTUM_GROWING_PP, MOMENTUM_DECLINING_PP } from '@/lib/services/clima/climaThresholds';
import type { DriverImpact } from '@/lib/services/clima/PulseEngine';

/** Cuadrantes (ids estables, los 4 de DISEÑO §4). vacío+plano → null (medido, no etiquetado). */
export const CLIMA_QUADRANT = {
  LIDER_MODELO: 'lider_modelo',
  PALANCA_NO_EFECTIVA: 'palanca_no_efectiva',
  FALSO_POSITIVO: 'falso_positivo',
  RIESGO_CRITICO: 'riesgo_critico',
} as const;

export interface ActionEffectivenessInput {
  accountId: string;
  campaignId: string;
  /** driverAnalysis por departamento medido en este follow-up (de pulseOutputs). */
  driverAnalysisByDept: Map<string, DriverImpact[]>;
}

export interface ActionEffectivenessResult {
  measured: number; // filas con veredicto escrito
  skipped: number; // filas sin momentumDelta confiable (quedan pendientes)
}

/**
 * Extrae la categoría (driver) de un triggerRef `clima:${departmentId}:${category}`.
 * departmentId es cuid (sin `:`); category es lo que sigue al 2º `:`.
 */
function categoryFromTriggerRef(triggerRef: string): string | null {
  const first = triggerRef.indexOf(':');
  if (first === -1) return null;
  const second = triggerRef.indexOf(':', first + 1);
  if (second === -1) return null;
  return triggerRef.slice(second + 1) || null;
}

/**
 * Clasifica el cuadrante. `null` = vacío+plano (medido, sin etiqueta — decisión 3).
 * Lado "con texto" = 2 buckets (mejoró vs no-mejoró); solo "vacío" distingue plano de bajó.
 */
function classifyQuadrant(delta: number, actionText: string | null): string | null {
  const hasText = !!actionText && actionText.trim().length > 0;
  const improved = delta >= MOMENTUM_GROWING_PP;
  const dropped = delta <= MOMENTUM_DECLINING_PP;

  if (hasText) {
    return improved ? CLIMA_QUADRANT.LIDER_MODELO : CLIMA_QUADRANT.PALANCA_NO_EFECTIVA;
  }
  // vacío
  if (improved) return CLIMA_QUADRANT.FALSO_POSITIVO;
  if (dropped) return CLIMA_QUADRANT.RIESGO_CRITICO;
  return null; // vacío + plano
}

export class ActionEffectivenessService {
  /**
   * Puebla el veredicto de la matriz sobre los ClimaActionLog pendientes de los
   * departamentos que este Seguimiento Focalizado midió. Idempotente (solo toca
   * filas con impactMeasured=null). Degrade-safe: el caller la envuelve en try/catch.
   */
  static async evaluateOnFollowUpClose(
    input: ActionEffectivenessInput
  ): Promise<ActionEffectivenessResult> {
    const { accountId, campaignId, driverAnalysisByDept } = input;
    const deptIds = Array.from(driverAnalysisByDept.keys());
    if (deptIds.length === 0) return { measured: 0, skipped: 0 };

    // Todas las filas pendientes de esos deptos (accountId explícito — multi-tenant).
    // Puede haber >1 por triggerRef (unique es por plan).
    const pending = await prisma.climaActionLog.findMany({
      where: { accountId, departmentId: { in: deptIds }, impactMeasured: null },
      select: { id: true, triggerRef: true, departmentId: true, actionText: true },
    });
    if (pending.length === 0) return { measured: 0, skipped: 0 };

    const now = new Date();
    let measured = 0;
    let skipped = 0;

    for (const log of pending) {
      const category = categoryFromTriggerRef(log.triggerRef);
      const drivers = driverAnalysisByDept.get(log.departmentId);
      const driver = category ? drivers?.find((d) => d.driver === category) : undefined;
      // Fix severidad mean: el veredicto corre sobre el delta de MEAN (escalado ×25 a pp,
      // mismos umbrales ±5), NO sobre el delta de fav (ciego al deterioro en cajas bajas).
      const delta = driver?.meanMomentumDelta ?? null;

      // null-safe: sin medición confiable (carried / n<5 / driver no medido) → pendiente.
      if (delta === null) {
        skipped += 1;
        continue;
      }

      const quadrant = classifyQuadrant(delta, log.actionText);
      await prisma.climaActionLog.update({
        where: { id: log.id },
        data: {
          impactMeasured: true,
          impactDelta: delta,
          quadrant,
          measuredAt: now,
          verdictCampaignId: campaignId,
        },
      });
      measured += 1;
    }

    return { measured, skipped };
  }
}
