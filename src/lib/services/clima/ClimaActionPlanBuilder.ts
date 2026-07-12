// src/lib/services/clima/ClimaActionPlanBuilder.ts
// ════════════════════════════════════════════════════════════════════════════
// EX Clima Gate 5A — ClimaActionPlanBuilder.
//
// Función PURA (client-safe, sin prisma): mapea el diagnóstico ya sellado por
// depto (DriverImpact[] + PulseBusinessCase[]) a ClimaDecisionItem[], listos
// para persistir como ActionPlan.decisiones (moduleType='clima') vía el endpoint
// genérico existente. NO recomputa nada de Gate 2/3: sólo lee zona (calcRiskZone,
// sellado) y compone con el diccionario de intervenciones (PROVISIONAL).
//
// Regla de generación: un ClimaDecisionItem por driver en zona de ATENCIÓN
// (amarilla/naranja/roja). Los drivers verde (Sano) NO generan ítem de acción.
// El businessCase (CLP/ROI) se adjunta SOLO si PulseEngine lo disparó para ese
// driver (clima_critico / liderazgo_gap) — nunca se inventa una cifra.
// ════════════════════════════════════════════════════════════════════════════

import {
  calcRiskZone,
  CLIMA_TARGET_FAVORABILITY,
  type RiskZone,
} from '@/lib/services/clima/climaThresholds';
import {
  getIntervention,
  isClimaDriverCategory,
} from '@/lib/services/clima/ClimaInterventionDictionary';
import {
  SEVERITY_LABEL_BY_ZONE,
  type ClimaDecisionItem,
  type ClimaDeptDecisionInput,
} from '@/types/clima-planes';
import type { PulseBusinessCase } from '@/lib/services/clima/PulseEngine';

// ── Derivados Code-owned (no narrativa): responsable + plazo por severidad ──
const RESPONSIBLE_BY_ZONE: Record<RiskZone, string> = {
  roja: 'CEO',
  naranja: 'Gerente de Área',
  amarilla: 'HRBP',
  verde: 'Gerente de Área',
};

const DEADLINE_BY_ZONE: Record<RiskZone, string> = {
  roja: '2 semanas',
  naranja: '30 días',
  amarilla: '90 días',
  verde: 'Sostener',
};

/** Severidad para ordenar (roja primero). verde no se genera, se incluye por exhaustividad. */
const ZONE_SEVERITY_RANK: Record<RiskZone, number> = {
  roja: 3,
  naranja: 2,
  amarilla: 1,
  verde: 0,
};

/** Zonas que ameritan un ítem de acción (todo lo que no es Sano). */
function needsAction(zone: RiskZone): boolean {
  return zone !== 'verde';
}

/** Business case de PulseEngine para este driver, si disparó. */
function findBusinessCase(
  category: string,
  businessCases: PulseBusinessCase[]
): PulseBusinessCase | null {
  return businessCases.find((bc) => bc.driver === category) ?? null;
}

/**
 * Genera las decisiones de un solo departamento.
 * Orden: severidad desc (roja→amarilla), y a igual zona, gap más negativo primero.
 */
export function buildDeptClimaDecisions(
  input: ClimaDeptDecisionInput
): ClimaDecisionItem[] {
  const items: ClimaDecisionItem[] = [];

  for (const driver of input.drivers) {
    // Zona = severidad (calcRiskZone sellado; modula por momentum en crisis).
    const zone = calcRiskZone(driver.fav, driver.momentumDelta);
    if (zone === null) continue; // fav null → no medible, no genera ítem
    if (!needsAction(zone)) continue; // verde (Sano) → sin ítem de acción
    if (!isClimaDriverCategory(driver.category)) continue; // driver fuera de la taxonomía

    // Dynamic Impact Drivers: selecciona el reactivo-palanca y su variante narrativa.
    const selection = getIntervention(driver.category, zone, driver.reactives);
    if (!selection) continue; // defensivo: no debería pasar tras isClimaDriverCategory
    const { cell, selectedReactive } = selection;

    const businessCase = findBusinessCase(driver.category, input.businessCases);

    items.push({
      triggerRef: `clima:${input.departmentId}:${driver.category}`,
      category: driver.category,
      departmentId: input.departmentId,
      departmentName: input.departmentName,
      favorability: driver.fav,
      gap: driver.gap,
      impact: driver.impact,
      intervention: {
        level: zone,
        levelLabel: SEVERITY_LABEL_BY_ZONE[zone],
        narrative: cell.narrative,
        steps: cell.steps,
        suggestedProduct: cell.suggestedProduct,
        businessCase,
      },
      responsible: RESPONSIBLE_BY_ZONE[zone],
      deadline: DEADLINE_BY_ZONE[zone],
      validationMetric: `Favorabilidad de ${driver.category} > ${CLIMA_TARGET_FAVORABILITY}% en el próximo Seguimiento Focalizado`,
      selectedReactive,
    });
  }

  return items.sort((a, b) => {
    const rankDiff =
      ZONE_SEVERITY_RANK[b.intervention.level] -
      ZONE_SEVERITY_RANK[a.intervention.level];
    if (rankDiff !== 0) return rankDiff;
    // a igual zona: gap más negativo (peor) primero
    return (a.gap ?? 0) - (b.gap ?? 0);
  });
}

/**
 * Genera las decisiones de todo el plan (varios departamentos).
 * El resultado va directo a ActionPlan.decisiones (Json) vía POST /api/action-plans.
 */
export function buildClimaPlanDecisions(
  depts: ClimaDeptDecisionInput[]
): ClimaDecisionItem[] {
  return depts.flatMap((d) => buildDeptClimaDecisions(d));
}
