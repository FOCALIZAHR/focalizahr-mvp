// ════════════════════════════════════════════════════════════════════════════
// SECTION DIMENSIONES — HELPERS PUROS
// _shared/helpers.ts
// ════════════════════════════════════════════════════════════════════════════
// Funciones determinísticas que la UI consume desde Hub, Portada y Patrón G.
// Reglas:
//   - Backend mantiene escala 1-5; helpers convierten a 0-100 SOLO para
//     presentación (`displayScore`).
//   - Threshold de "depto crítico" = displayScore < 50 (= rawScore < 3.0).
//   - Brecha de género: |male - female| ≥ 0.5 en escala 1-5 (gb del backend).
//   - Estos helpers NO leen del hook ni hacen fetch — son puros, fáciles de testear.
// ════════════════════════════════════════════════════════════════════════════

import {
  classifyDimensionLevel,
  type ComplianceDimensionLevel,
} from '@/config/narratives/ComplianceNarrativeDictionary';
import type {
  ComplianceReportDepartment,
  OrigenPercibido,
  OrigenOrganizacional,
} from '@/types/compliance';

import {
  ORIGEN_LABELS,
  ORIGEN_ORG_SCOPE_NOTE,
  SCORE_THRESHOLDS,
  type ActoLevelKey,
} from './constants';

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

/** Llaves canónicas de las 6 dimensiones (alineado con DepartmentSafetyScore). */
export type DimKey = keyof ComplianceReportDepartment['dimensionScores'];

/** Brecha de género para una dimensión / contexto. */
export interface GenderGap {
  departmentId: string;
  departmentName: string;
  /** |male - female| en escala 1-5. */
  gap: number;
  grupoAfectado: 'mujeres' | 'hombres';
  maleScore: number;
  femaleScore: number;
}

// ────────────────────────────────────────────────────────────────────────────
// SCORING
// ────────────────────────────────────────────────────────────────────────────

/**
 * Convierte un score backend (escala 1-5) al display score (escala 0-100).
 * Mapping: 1→0, 2→25, 3→50, 4→75, 5→100. Resultado clampeado a [0, 100].
 *
 * Devuelve null si el input es null/undefined — los componentes deciden
 * cómo renderizar el caso "sin dato" (nunca convertir null en 0).
 */
export function displayScore(rawScore: number | null | undefined): number | null {
  if (rawScore === null || rawScore === undefined) return null;
  if (Number.isNaN(rawScore)) return null;
  const value = Math.round((rawScore - 1) * 25);
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

/**
 * Promedio ponderado de la dimensión a nivel ORG, ponderado por respondentCount
 * de cada departamento. Espejo de la fórmula del engine — no recalcular
 * promedios planos en la UI.
 *
 * Devuelve null si ningún depto reporta esa dimensión o si todos tienen
 * respondentCount = 0.
 */
export function computeOrgWeightedScore(
  dimKey: DimKey,
  departments: ComplianceReportDepartment[]
): number | null {
  let weighted = 0;
  let totalWeight = 0;
  for (const d of departments) {
    const v = d.dimensionScores?.[dimKey];
    if (v === null || v === undefined) continue;
    const w = d.respondentCount ?? 0;
    if (w <= 0) continue;
    weighted += v * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? weighted / totalWeight : null;
}

/**
 * Cuenta departamentos con score normalizado por debajo del threshold de
 * "depto crítico" para una dimensión específica. Convierte cada score 1-5
 * → 0-100 y compara contra `SCORE_THRESHOLDS.CRITICAL_DEPT` (default 50).
 *
 * Solo cuenta deptos con dato — los `null` en `dimensionScores[dimKey]` se ignoran.
 */
export function countCriticalDepts(
  dimKey: DimKey,
  departments: ComplianceReportDepartment[],
  threshold: number = SCORE_THRESHOLDS.CRITICAL_DEPT
): number {
  let count = 0;
  for (const d of departments) {
    const raw = d.dimensionScores?.[dimKey];
    if (raw === null || raw === undefined) continue;
    const display = displayScore(raw);
    if (display === null) continue;
    if (display < threshold) count += 1;
  }
  return count;
}

/**
 * Devuelve los departamentos bajo el threshold para una dimensión, ordenados
 * por score ascendente (peor primero). Útil para el ACTO 4 ("Dónde se concentra").
 */
export function getCriticalDepts(
  dimKey: DimKey,
  departments: ComplianceReportDepartment[],
  threshold: number = SCORE_THRESHOLDS.CRITICAL_DEPT
): Array<{
  department: ComplianceReportDepartment;
  rawScore: number;
  display: number;
}> {
  const out: Array<{
    department: ComplianceReportDepartment;
    rawScore: number;
    display: number;
  }> = [];
  for (const d of departments) {
    const raw = d.dimensionScores?.[dimKey];
    if (raw === null || raw === undefined) continue;
    const display = displayScore(raw);
    if (display === null) continue;
    if (display < threshold) out.push({ department: d, rawScore: raw, display });
  }
  return out.sort((a, b) => a.display - b.display);
}

// ────────────────────────────────────────────────────────────────────────────
// SORTING — Hub de dimensiones
// ────────────────────────────────────────────────────────────────────────────

/**
 * Ordena dimensiones para el Hub:
 *   1) Las que tienen ≥1 depto crítico van primero.
 *   2) Dentro de cada grupo, por orgScore ascendente (peor primero).
 *
 * Caso crítico: una dim con orgScore 80 y 2 deptos críticos aparece ANTES
 * que una con orgScore 78 sin focos. El promedio NO es el único dato.
 *
 * Naming: usa `criticalDeptsCount` (no `criticalDepts`) para alinear con la
 * prop del DimensionCard y dejar explícito que es un count, no una lista.
 *
 * No muta el array original.
 */
export function sortDimensions<
  T extends { criticalDeptsCount: number; orgScore: number },
>(dims: T[]): T[] {
  return [...dims].sort((a, b) => {
    const aHasFocus = a.criticalDeptsCount > 0;
    const bHasFocus = b.criticalDeptsCount > 0;
    if (aHasFocus && !bHasFocus) return -1;
    if (!aHasFocus && bHasFocus) return 1;
    return a.orgScore - b.orgScore;
  });
}

// ────────────────────────────────────────────────────────────────────────────
// GÉNERO — peor brecha
// ────────────────────────────────────────────────────────────────────────────

/**
 * Encuentra el departamento con la mayor |male - female| ≥ threshold.
 *
 * Notas:
 *   - El `genderBreakdown` del backend está en escala 1-5 (no normalizada),
 *     por eso el threshold default es 0.5 (no 12.5 puntos del 0-100).
 *   - El `genderBreakdown` es del SAFETY SCORE agregado del depto, no por
 *     dimensión específica — el backend no expone breakdown per-dim.
 *   - Devuelve null si ningún depto tiene gap ≥ threshold.
 */
export function getPeorBrechaGenero(
  departments: ComplianceReportDepartment[],
  threshold: number = SCORE_THRESHOLDS.GENDER_GAP_MIN
): GenderGap | null {
  let worst: GenderGap | null = null;

  for (const d of departments) {
    const gb = d.genderBreakdown;
    if (!gb) continue;
    const male = gb.male?.score;
    const female = gb.female?.score;
    if (male === undefined || male === null) continue;
    if (female === undefined || female === null) continue;

    const gap = Math.abs(male - female);
    if (gap < threshold) continue;

    if (worst === null || gap > worst.gap) {
      worst = {
        departmentId: d.departmentId,
        departmentName: d.departmentName,
        gap,
        grupoAfectado: female < male ? 'mujeres' : 'hombres',
        maleScore: male,
        femaleScore: female,
      };
    }
  }

  return worst;
}

// ────────────────────────────────────────────────────────────────────────────
// ORIGEN — más frecuente entre patrones LLM
// ────────────────────────────────────────────────────────────────────────────

type OrigenInput = OrigenPercibido | OrigenOrganizacional;

/**
 * Cuenta orígenes percibidos en un set de patrones LLM y devuelve la etiqueta
 * ejecutiva (mapeada vía `ORIGEN_LABELS`) del más frecuente.
 *
 * Ignora 'indeterminado' y 'mixto' — esos no son señales accionables.
 * Devuelve null si no hay orígenes válidos. Empate → primer encontrado
 * (orden estable por entrada).
 *
 * Pensado para Acto 2: "origen del problema si existe". Acepta cualquier
 * shape mientras tenga `origen_percibido` o `origenPercibido`. Si en el
 * futuro `/report` expone patrones por depto, este helper compone directo.
 */
export function getOrigenMasFrecuente(
  origenes: ReadonlyArray<OrigenInput | { origen_percibido: OrigenInput } | { origenPercibido: OrigenInput }>
): string | null {
  if (!origenes || origenes.length === 0) return null;

  const counts = new Map<string, number>();
  const order: string[] = [];

  for (const item of origenes) {
    let key: string | undefined;
    if (typeof item === 'string') {
      key = item;
    } else if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const candidate =
        (obj.origen_percibido as string | undefined) ??
        (obj.origenPercibido as string | undefined);
      if (typeof candidate === 'string') key = candidate;
    }

    if (!key) continue;
    if (key === 'indeterminado' || key === 'mixto') continue;

    if (!counts.has(key)) order.push(key);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  if (counts.size === 0) return null;

  let bestKey = order[0];
  let bestCount = counts.get(bestKey) ?? 0;
  for (const key of order) {
    const c = counts.get(key) ?? 0;
    if (c > bestCount) {
      bestKey = key;
      bestCount = c;
    }
  }

  return ORIGEN_LABELS[bestKey] ?? null;
}

/**
 * Resultado del helper de origen ORG-level (Acto 2).
 *
 * `label`     : etiqueta ejecutiva mappeada vía ORIGEN_LABELS.
 * `scopeNote` : marcador "Patrón a nivel organización" — la UI lo muestra
 *               como subtítulo o tag para declarar la granularidad del dato.
 */
export interface OrgOrigenLabel {
  label: string;
  scopeNote: string;
}

/**
 * Mapea `metaAnalysis.origen_organizacional` (ORG-aggregated, single value)
 * a una etiqueta ejecutiva con marcador de granularidad.
 *
 * Devuelve `null` si:
 *   - El origen es `'mixto'` o `'indeterminado'` (no son señales accionables —
 *     mejor omitir el bloque que mostrar info inútil).
 *   - El valor no está en ORIGEN_LABELS.
 *   - El input es null/undefined.
 *
 * Pensado para Acto 2 mientras el backend no exponga `origen_percibido` por
 * departamento. Cuando se exponga, el llamador puede saltarse este helper y
 * usar `getOrigenMasFrecuente` con los patrones per-dept (signature compatible).
 */
export function getOrgOrigenLabel(
  origen: OrigenOrganizacional | null | undefined
): OrgOrigenLabel | null {
  if (!origen) return null;
  if (origen === 'mixto' || origen === 'indeterminado') return null;
  const label = ORIGEN_LABELS[origen];
  if (!label) return null;
  return { label, scopeNote: ORIGEN_ORG_SCOPE_NOTE };
}

// ────────────────────────────────────────────────────────────────────────────
// CLASIFICACIÓN — nivel del Acto (incluye 'sano_con_focos')
// ────────────────────────────────────────────────────────────────────────────

/**
 * Mapea (nivel de la dimensión a nivel org, # deptos críticos) → ActoLevelKey.
 *
 * Regla de negocio: una dimensión SANA a nivel ORG puede tener focos
 * departamentales — ese es el contraste más importante del producto.
 * Cuando eso pasa, el Patrón G usa la frase y la recomendación de
 * 'sano_con_focos' (no la de 'sano').
 *
 * En cualquier otro nivel (atencion / riesgo / critico), los focos amplifican
 * la urgencia pero no cambian la clasificación — el motor ya está hablando
 * en clave de problema.
 */
export function classifyActoLevel(
  level: ComplianceDimensionLevel,
  criticalDeptsCount: number
): ActoLevelKey {
  if (level === 'sano' && criticalDeptsCount > 0) return 'sano_con_focos';
  return level;
}

/**
 * Atajo: dado el orgScore en escala 1-5 y la lista de deptos para esa dim,
 * devuelve directo el ActoLevelKey.
 *
 * IMPORTANTE — escala de entrada: 1-5 RAW (no 0-100 display).
 * `classifyDimensionLevel` del diccionario usa thresholds en 1-5:
 *   ≥ 4.0 → sano · ≥ 3.0 → atencion · ≥ 2.0 → riesgo · < 2.0 → critico.
 * Pasarle un display score (0-100) clasifica todo como 'sano' incorrectamente.
 *
 * Si el orgScore es null (sin datos), devuelve 'atencion' como fallback
 * conservador — la UI aguas arriba debería filtrar antes que esto se llame.
 */
export function classifyDimensionActoLevel(
  orgRawScore: number | null,
  criticalDeptsCount: number
): ActoLevelKey {
  if (orgRawScore === null) return 'atencion';
  const level = classifyDimensionLevel(orgRawScore);
  return classifyActoLevel(level, criticalDeptsCount);
}


// ────────────────────────────────────────────────────────────────────────────
// CYCLE PERIOD — formatter para eyebrow del DetailPanel
// ────────────────────────────────────────────────────────────────────────────
// Construye el slot dinámico del eyebrow del Decision Console:
//   "[dimensionName] / Ambiente Sano / [período]"
//
// Política:
//   - Si endDate cae en Q1/Q2/Q3/Q4 → "Q1 2026"
//   - Si no hay endDate → fallback al mes-año de startDate ("abr 2026")
//   - Si ninguna fecha disponible → null (el componente skip el slot)
// ────────────────────────────────────────────────────────────────────────────

const SPANISH_MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
] as const;

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatCyclePeriod(campaign: {
  startDate?: string | Date | null;
  endDate?: string | Date | null;
}): string | null {
  const end = toDate(campaign.endDate);
  if (end) {
    const quarter = Math.floor(end.getMonth() / 3) + 1;
    return `Q${quarter} ${end.getFullYear()}`;
  }
  const start = toDate(campaign.startDate);
  if (start) {
    return `${SPANISH_MONTHS_SHORT[start.getMonth()]} ${start.getFullYear()}`;
  }
  return null;
}
