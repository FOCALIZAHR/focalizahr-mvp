// src/lib/services/clima/ClimaActionPlanBuilder.ts
// ════════════════════════════════════════════════════════════════════════════
// EX Clima — ClimaActionPlanBuilder (capa de acción del plan).
//
// Función PURA (client-safe, sin prisma): mapea el diagnóstico ya sellado por depto
// a ClimaDecisionItem[], listos para persistir como ActionPlan.decisiones
// (moduleType='clima') vía el endpoint genérico existente.
//
// SEVERIDAD/TRIGGER A NIVEL REACTIVO + MEAN (Gate 2026-07-12): el disparo y la
// severidad YA NO dependen de la favorabilidad de la DIMENSIÓN (fav, ciega al
// deterioro en cajas bajas). Ahora:
//   - dispara si ≥1 reactivo (no-circular, medido) está bajo su tier de mean (gapMean<0),
//   - el reactivo-palanca = mayor priorityMean (|impact|×|gapMean|),
//   - la severidad de la celda = reactiveSeverityZone(palanca.gapMean) (mapeo interno,
//     NO calcRiskZone — la señal que dispara es la que se narra),
//   - si ≥REACTIVE_SYSTEMIC_RATIO de los reactivos medidos caen bajo su tier → isSystemic
//     (narrativa de dimensión, no reactivo puntual).
// riskZone/calcRiskZone siguen intactos para el resto de consumidores (fuera de scope).
// El businessCase (CLP/ROI) se adjunta SOLO si PulseEngine lo disparó — nunca se inventa.
// ════════════════════════════════════════════════════════════════════════════

import {
  reactiveMeanTarget,
  reactiveSeverityZone,
  REACTIVE_CIRCULARITY_EXCLUDE,
  REACTIVE_SYSTEMIC_RATIO,
  REACTIVE_MIN_IMPACT,
  type RiskZone,
} from '@/lib/services/clima/climaThresholds';
import {
  getIntervention,
  getSystemicIntervention,
  isClimaDriverCategory,
} from '@/lib/services/clima/ClimaInterventionDictionary';
import {
  SEVERITY_LABEL_BY_ZONE,
  type ClimaDecisionItem,
  type ClimaDeptDecisionInput,
  type ClimaInterventionCell,
  type ClimaInterventionVariantCell,
} from '@/types/clima-planes';
import type { PulseBusinessCase } from '@/lib/services/clima/PulseEngine';

const round1 = (x: number) => Math.round(x * 10) / 10;

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

/** Business case de PulseEngine para este driver, si disparó. */
function findBusinessCase(
  category: string,
  businessCases: PulseBusinessCase[]
): PulseBusinessCase | null {
  return businessCases.find((bc) => bc.driver === category) ?? null;
}

/**
 * Genera las decisiones de un solo departamento (un ítem por dimensión que dispara).
 * Orden: severidad desc (roja→amarilla), y a igual zona, gap más negativo primero.
 */
export function buildDeptClimaDecisions(
  input: ClimaDeptDecisionInput
): ClimaDecisionItem[] {
  const items: ClimaDecisionItem[] = [];

  for (const driver of input.drivers) {
    if (!isClimaDriverCategory(driver.category)) continue; // fuera de la taxonomía

    // Excluir reactivos circulares (mismo constructo que EI) — una sola vez → cubre
    // disparo, ratio ≥50% y la selección narrativa (getIntervention recibe esta lista).
    const usable = driver.reactives.filter(
      (r) => !REACTIVE_CIRCULARITY_EXCLUDE.has(r.reactive)
    );

    // Medidos (mean no-null) + gapMean contra la vara del reactivo + priorityMean.
    const measured = usable
      .filter((r) => r.mean !== null)
      .map((r) => {
        const gapMean = round1((r.mean as number) - reactiveMeanTarget(r.reactive));
        // Piso de impacto (Peakon/Culture Amp/Glint): un reactivo con impacto por debajo de
        // REACTIVE_MIN_IMPACT es ruido → se trata igual que impact===null, NO compite por palanca
        // (por más bajo que sea su mean). Solo afecta la SELECCIÓN, no el disparo ni el impacto persistido.
        const priorityMean =
          r.impact !== null && Math.abs(r.impact) >= REACTIVE_MIN_IMPACT && gapMean < 0
            ? round1(Math.abs(r.impact) * Math.abs(gapMean))
            : null;
        return { ...r, gapMean, priorityMean };
      });
    if (measured.length === 0) continue; // sin base medida

    const belowTier = measured.filter((r) => r.gapMean < 0);
    if (belowTier.length === 0) continue; // ningún reactivo bajo su tier → no dispara

    // Palanca = mayor priorityMean; si todas null (impact no evaluable o bajo el piso), el
    // gapMean más hondo (para fijar la severidad/zona — el ítem igual dispara).
    const palanca = [...belowTier].sort((a, b) => {
      const pa = a.priorityMean ?? -Infinity;
      const pb = b.priorityMean ?? -Infinity;
      if (pb !== pa) return pb - pa;
      return a.gapMean - b.gapMean; // desempate: más hondo (más negativo) primero
    })[0];

    const zone = reactiveSeverityZone(palanca.gapMean);
    if (zone === null) continue; // defensivo: palanca ya tiene gapMean<0

    // Reactivo-palanca NARRABLE: solo si superó el piso de impacto (priorityMean!==null).
    // Si ningún reactivo de la dimensión es significativo → sin palanca nombrada → celda
    // default (narrativa genérica de dimensión), aunque el ítem sí dispare por su severidad.
    const narrativeLever = palanca.priorityMean !== null ? palanca.reactive : null;

    const isSystemic = belowTier.length / measured.length >= REACTIVE_SYSTEMIC_RATIO;

    let cell: ClimaInterventionCell | ClimaInterventionVariantCell;
    let selectedReactive: string | null;
    if (isSystemic) {
      cell = getSystemicIntervention(driver.category, belowTier.length, measured.length);
      selectedReactive = narrativeLever; // referencia (null si ninguno superó el piso)
    } else {
      const selection = getIntervention(
        driver.category,
        zone,
        usable,
        narrativeLever // leverOverride: la variante habla del reactivo significativo; null → default
      );
      if (!selection) continue; // defensivo tras isClimaDriverCategory
      cell = selection.cell;
      selectedReactive = selection.selectedReactive;
    }

    const validationMetric = isSystemic
      ? `Reducir los reactivos de ${driver.category} bajo umbral (${belowTier.length}/${measured.length}) en el próximo Seguimiento Focalizado`
      : `Mean de ${palanca.reactive} ≥ ${reactiveMeanTarget(palanca.reactive)} en el próximo Seguimiento Focalizado`;

    // Ramifica por shape: la variante Capa 2 aporta esfuerzo/efectividad (ruteo 5D);
    // la celda base/sistémica (string) no los tiene. suggestedProduct fluye tal cual
    // (string | SuggestedProduct) — el dispatcher lo resuelve en 5D.
    const variantFields =
      'esfuerzo' in cell
        ? { esfuerzo: cell.esfuerzo, efectividad: cell.efectividad }
        : {};

    items.push({
      triggerRef: `clima:${input.departmentId}:${driver.category}`,
      category: driver.category,
      departmentId: input.departmentId,
      departmentName: input.departmentName,
      favorability: driver.fav, // contexto de dimensión (referencia)
      gap: driver.gap,
      impact: driver.impact,
      intervention: {
        level: zone,
        levelLabel: SEVERITY_LABEL_BY_ZONE[zone],
        narrative: cell.narrative,
        steps: cell.steps,
        suggestedProduct: cell.suggestedProduct,
        ...variantFields,
        businessCase: findBusinessCase(driver.category, input.businessCases),
      },
      responsible: RESPONSIBLE_BY_ZONE[zone],
      deadline: DEADLINE_BY_ZONE[zone],
      validationMetric,
      selectedReactive,
      isSystemic,
    });
  }

  return items.sort((a, b) => {
    const rankDiff =
      ZONE_SEVERITY_RANK[b.intervention.level] -
      ZONE_SEVERITY_RANK[a.intervention.level];
    if (rankDiff !== 0) return rankDiff;
    // a igual zona: gap (fav) más negativo (peor) primero — referencia estable
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
