// src/lib/utils/aggregateClimaDimension.ts
// ════════════════════════════════════════════════════════════════════════════
// Agrega UNA dimensión (driver) a nivel organización a partir de la
// ClimaResultsResponse ya cargada (Gate 4). Fuente de datos de ClimaDimensionDetail
// y del ClimaToolbar. Read-time puro, sin API nueva.
//
// `impact` / `classification` / `gap` / `champion` en DriverImpact YA son
// company-level (mismo valor duplicado por depto) → se leen del primer depto que
// los tenga. `orgFav` se pondera por n (medido), espejando la ponderación por
// headcount de orgFavorability. Guard n≥5 (CLIMA_MIN_RESPONDENTS): las celdas
// carried (n:0) y las de <5 respondientes no entran en el promedio ni en el
// conteo de datos suficientes.
// ════════════════════════════════════════════════════════════════════════════

import type { ClimaResultsResponse } from '@/types/clima';
import type { RiskZone } from '@/lib/services/clima/climaThresholds';
import type { DriverClassification, PulseBusinessCase } from '@/lib/services/clima/PulseEngine';
import { calcRiskZone, CLIMA_MIN_RESPONDENTS } from '@/lib/services/clima/climaThresholds';

export interface ClimaDimensionWorstDept {
  departmentId: string;
  departmentName: string;
  fav: number | null;
}

export interface ClimaDimensionAgg {
  driver: string;
  /** Favorabilidad org de la dimensión, ponderada por n (medido). null si sin base. */
  orgFav: number | null;
  zone: RiskZone | null;
  /** Delta org (promedio de momentumDelta medido). null si sin previo. */
  momentum: number | null;
  classification: DriverClassification | null; // company-level
  impact: number | null; // company-level Pearson |r|
  gap: number | null; // fav − target (pp, con signo)
  worstDepts: ClimaDimensionWorstDept[]; // peores 3 (fav asc), solo medidos
  /** Business case más severo de esa dimensión (Capa 3a). null si no hay. */
  businessCase: PulseBusinessCase | null;
  /** Deptos con n≥5 medidos en esta dimensión. */
  measuredDeptCount: number;
  /** ≥1 depto con n≥5 → hay base para reportar (guard del Toolbar). */
  hasSufficientData: boolean;
}

export function aggregateClimaDimension(
  results: ClimaResultsResponse,
  driver: string,
): ClimaDimensionAgg {
  let favSum = 0;
  let nSum = 0;
  let deltaSum = 0;
  let deltaCount = 0;
  let measuredDeptCount = 0;
  const worst: ClimaDimensionWorstDept[] = [];

  let impact: number | null = null;
  let gap: number | null = null;
  let classification: DriverClassification | null = null;

  let businessCase: PulseBusinessCase | null = null;

  for (const d of results.departments) {
    const s = d.driverScores?.[driver];
    // Company-level (impact/gap/classification) — del primer depto que lo tenga.
    const analysis = d.driverAnalysis?.find((a) => a.driver === driver);
    if (analysis) {
      if (impact === null && analysis.impact !== null) impact = analysis.impact;
      if (gap === null && analysis.gap !== null) gap = analysis.gap;
      if (classification === null && analysis.classification !== null) {
        classification = analysis.classification;
      }
      if (analysis.momentumDelta !== null && !analysis.carried) {
        deltaSum += analysis.momentumDelta;
        deltaCount += 1;
      }
    }

    // Medición del driver en este depto (guard n≥5, sin carried).
    if (s && !s.carried && s.n >= CLIMA_MIN_RESPONDENTS && s.fav !== null) {
      favSum += s.fav * s.n;
      nSum += s.n;
      measuredDeptCount += 1;
      worst.push({ departmentId: d.departmentId, departmentName: d.departmentName, fav: s.fav });
    }

    // Business case de esta dimensión — el más severo (mayor CLP) entre deptos.
    for (const bc of d.correlationFlags?.businessCases ?? []) {
      if (bc.driver === driver) {
        if (!businessCase || bc.potentialAnnualLossCLP > businessCase.potentialAnnualLossCLP) {
          businessCase = bc;
        }
      }
    }
  }

  const orgFav = nSum > 0 ? Math.round((favSum / nSum) * 10) / 10 : null;
  const momentum = deltaCount > 0 ? Math.round((deltaSum / deltaCount) * 10) / 10 : null;

  worst.sort((a, b) => (a.fav ?? 999) - (b.fav ?? 999));

  return {
    driver,
    orgFav,
    zone: calcRiskZone(orgFav, momentum),
    momentum,
    classification,
    impact,
    gap,
    worstDepts: worst.slice(0, 3),
    businessCase,
    measuredDeptCount,
    hasSufficientData: measuredDeptCount > 0,
  };
}
