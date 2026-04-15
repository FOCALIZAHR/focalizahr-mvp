// ════════════════════════════════════════════════════════════════════════════
// NINE-BOX UTILS — funciones puras para NineBoxLive
// src/app/dashboard/workforce/components/instruments/nine-box/nine-box-utils.ts
// ════════════════════════════════════════════════════════════════════════════
// Sin libs externas. SVG + matemáticas básicas.
// ════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// 1. GRID_POSITIONS — mapeo canónico nineBoxPosition → (row, col)
//    Clonado de TalentMini9Box.tsx para mantener consistencia visual.
//    row 0 = TOP (Alto Potencial) · col 2 = RIGHT (Alto Performance)
// ─────────────────────────────────────────────────────────────────────────────

export type GridCell = { row: 0 | 1 | 2; col: 0 | 1 | 2 }

export const GRID_POSITIONS: Record<string, GridCell> = {
  growth_potential:     { row: 0, col: 0 },
  potential_gem:        { row: 0, col: 1 },
  star:                 { row: 0, col: 2 },
  inconsistent:         { row: 1, col: 0 },
  core_player:          { row: 1, col: 1 },
  high_performer:       { row: 1, col: 2 },
  underperformer:       { row: 2, col: 0 },
  average_performer:    { row: 2, col: 1 },
  trusted_professional: { row: 2, col: 2 },
}

// Soporta UPPER_CASE también
const UPPER_TO_SNAKE: Record<string, string> = {
  STAR: 'star',
  GROWTH_POTENTIAL: 'growth_potential',
  POTENTIAL_GEM: 'potential_gem',
  HIGH_PERFORMER: 'high_performer',
  CORE_PLAYER: 'core_player',
  INCONSISTENT: 'inconsistent',
  TRUSTED_PROFESSIONAL: 'trusted_professional',
  AVERAGE_PERFORMER: 'average_performer',
  UNDERPERFORMER: 'underperformer',
}

export function normalizePosition(position: string): string {
  return UPPER_TO_SNAKE[position] || position.toLowerCase()
}

export function getGridCell(position: string | null): GridCell | null {
  if (!position) return null
  return GRID_POSITIONS[normalizePosition(position)] ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. JITTER DETERMINÍSTICO — hash del employeeId, no random.
//    Mismo input → mismo output. Garantiza estabilidad visual entre rerenders.
// ─────────────────────────────────────────────────────────────────────────────

function hash32(str: string): number {
  // FNV-1a hash 32 bits, suficiente para distribución uniforme
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Distribución determinística dentro de la celda.
 * Retorna offset (dx, dy) en el rango [padding, cellSize - padding].
 */
export function jitterPosition(
  employeeId: string,
  cellWidth: number,
  cellHeight: number,
  padding: number,
): { dx: number; dy: number } {
  const h1 = hash32(employeeId)
  const h2 = hash32(employeeId + ':y')
  const usableW = cellWidth - 2 * padding
  const usableH = cellHeight - 2 * padding
  const dx = padding + (h1 % 1000) / 1000 * usableW
  const dy = padding + (h2 % 1000) / 1000 * usableH
  return { dx, dy }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EXPOSURE COLOR — gradient cyan → amber → red por observedExposure
// ─────────────────────────────────────────────────────────────────────────────

export function exposureColor(exposure: number): string {
  // [0, 0.4) → cyan (exposicion baja)
  // [0.4, 0.7) → amber (exposicion media)
  // [0.7, 1] → red (exposicion alta)
  if (exposure < 0.4) return '#22D3EE'  // cyan-400
  if (exposure < 0.7) return '#F59E0B'  // amber-500
  return '#EF4444'                       // red-500
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SALARY RADIUS — escala log clamped, [minR, maxR]
// ─────────────────────────────────────────────────────────────────────────────

export function salaryRadius(
  salary: number,
  minSalary: number,
  maxSalary: number,
  minRadius = 5,
  maxRadius = 14,
): number {
  if (maxSalary <= minSalary) return (minRadius + maxRadius) / 2
  // Escala log para suavizar diferencias muy grandes
  const logMin = Math.log(Math.max(minSalary, 1))
  const logMax = Math.log(Math.max(maxSalary, 1))
  const logVal = Math.log(Math.max(salary, 1))
  const t = (logVal - logMin) / (logMax - logMin)
  const clampedT = Math.max(0, Math.min(1, t))
  return minRadius + clampedT * (maxRadius - minRadius)
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. POINT IN POLYGON — algoritmo ray casting
//    Devuelve true si el punto está dentro del polígono cerrado.
// ─────────────────────────────────────────────────────────────────────────────

export type Point = { x: number; y: number }

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. FORMAT HELPERS — re-export desde _shared/format
// ─────────────────────────────────────────────────────────────────────────────

export { formatCLP, formatTenureMonths } from '../_shared/format'

// ─────────────────────────────────────────────────────────────────────────────
// 7. PATTERN DETECTION — clasifica el patrón dominante de una cohorte
//    Conecta los motores backend (zombies, flightRisk, inertia) con el HUD.
//
//    Lógica:
//    - Cada candidato es un patrón con condiciones por persona
//    - Se cuenta cuántas personas del cohort matchean cada patrón
//    - Gana el patrón con mayor proporción que cruce el 50% (mayoría)
//    - Si ninguno cruza, se devuelve 'default' (composición)
//
//    Tono arbitrador: NO veredicto, solo lectura del patrón.
// ─────────────────────────────────────────────────────────────────────────────

export type PatternKey = 'zombie' | 'fuga' | 'inercia' | 'default'

export interface PatternCandidate {
  /** Cualquier item agrupable; usamos un subset estructural */
  observedExposure: number          // legacy Anthropic — mantenido por compat
  /** focalizaScore Eloundou (canónico). Puede ser null si cargo no clasificado. */
  focalizaScore: number | null
  roleFitScore: number
  salary: number
  augmentationShare: number
  potentialEngagement: number | null
}

export interface PatternResult {
  key: PatternKey
  /** Cantidad de personas en la cohorte que matchean el patrón ganador */
  matchedCount: number
  /** Tamaño total de la cohorte */
  cohortSize: number
  /** Porcentaje 0-1 que matchea el patrón */
  matchedRatio: number
  /** Mediana salarial de referencia (org, no cohorte) — para INERCIA */
  salaryMedianRef: number
}

/**
 * Mediana de un array numérico. Útil para la referencia salarial del
 * patrón INERCIA (compara cohorte vs mediana org).
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. INTERPRETACIÓN DE COMPROMISO — engagement AAE 1/2/3 → label humano
// ─────────────────────────────────────────────────────────────────────────────
// FUENTE: PerformanceRating.potentialEngagement — Int discreto 1/2/3
// (schema.prisma:2073 + WorkforceIntelligenceService L404). NUNCA escala
// continua. Usa Test Ácido AAE de TalentIntelligenceService:
//   3 = HIGH ('Alto')   ·   1 = LOW ('Crítico')   ·   2 = NEUTRAL ('Estable')
// ─────────────────────────────────────────────────────────────────────────────

export type EngagementLevel = 'Crítico' | 'Estable' | 'Alto'

export function interpretEngagement(score: number | null): EngagementLevel | null {
  if (score === null) return null
  // Test Ácido — escala discreta 1/2/3
  if (score === 1) return 'Crítico'
  if (score === 3) return 'Alto'
  // score === 2 (NEUTRAL del Test Ácido) — etiqueta neutral, no fuga
  return 'Estable'
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. INTERPRETACIÓN DE EXPOSICIÓN IA — focalizaScore → label humano
// ─────────────────────────────────────────────────────────────────────────────

export type ExposureLevel = 'Baja' | 'Media' | 'Alta' | 'Crítica'

export function interpretExposure(focalizaScore: number | null): ExposureLevel | null {
  if (focalizaScore === null) return null
  if (focalizaScore < 0.3) return 'Baja'
  if (focalizaScore < 0.6) return 'Media'
  if (focalizaScore < 0.8) return 'Alta'
  return 'Crítica'
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. PERSON EXPOSURE INSIGHT — narrativa interpretativa individual
// Cruza focalizaScore × roleFit × engagement × tier y devuelve 2-3 líneas
// que explican QUÉ SIGNIFICA esa combinación para el negocio.
//
// Tono arbitrador (skill focalizahr-narrativas):
// - Sin prescribir acción
// - Consecuencia, no instrucción
// - Color del propio dato, no del sistema
// ─────────────────────────────────────────────────────────────────────────────

export interface PersonExposureInsight {
  headline: string                                // 4-7 palabras
  context: string                                 // 2 líneas — qué significa
  accent: 'cyan' | 'purple' | 'amber' | 'slate'  // color del bloque
}

export function getPersonExposureInsight(person: {
  focalizaScore: number | null
  roleFitScore: number
  potentialEngagement: number | null
  tier: 'intocable' | 'valioso' | 'neutro' | 'prescindible'
}): PersonExposureInsight {
  const exposure = person.focalizaScore
  const roleFit = person.roleFitScore
  const engagement = person.potentialEngagement
  const isHighExposure = exposure !== null && exposure >= 0.6
  const isHighRoleFit = roleFit >= 75
  const isHighEngagement = engagement !== null && engagement >= 3.5
  const isLowEngagement = engagement !== null && engagement < 2

  // Sin focalizaScore → cargo sin clasificar O*NET
  if (exposure === null) {
    return {
      headline: 'Cargo sin clasificación de exposición IA',
      context: `Su cargo no tiene mapeo a O*NET vigente. El dominio del cargo es ${Math.round(roleFit)}% — la lectura de IA queda pendiente hasta clasificar el cargo.`,
      accent: 'slate',
    }
  }

  // Alta exposición × Alto dominio × Compromiso crítico → riesgo doble
  if (isHighExposure && isHighRoleFit && isLowEngagement) {
    return {
      headline: 'Talento crítico, cargo automatizable, compromiso a la baja',
      context: 'Domina un cargo cuya naturaleza la IA puede ejecutar y, en paralelo, su compromiso erosiona. Si se va, pierdes la inversión humana y la justificación del cargo al mismo tiempo.',
      accent: 'amber',
    }
  }

  // Alta exposición × Alto dominio × Comprometido → activo a rediseñar
  if (isHighExposure && isHighRoleFit && isHighEngagement) {
    return {
      headline: 'Domina un cargo que la IA puede absorber',
      context: 'Su dominio es alto y está comprometido — pero el cargo en sí está en zona de automatización. Su valor futuro depende de cómo el rol se rediseñe.',
      accent: 'purple',
    }
  }

  // Alta exposición × Bajo dominio → obsolescencia doble
  if (isHighExposure && !isHighRoleFit) {
    return {
      headline: 'Bajo dominio en un cargo de alta exposición',
      context: 'No domina el cargo y el cargo está en zona automatizable. La inversión en su desarrollo en este rol específico tiene retorno limitado.',
      accent: 'amber',
    }
  }

  // Baja-media exposición × Alto dominio × Comprometido → núcleo del valor
  if (!isHighExposure && isHighRoleFit && isHighEngagement) {
    return {
      headline: 'Núcleo del valor humano de tu organización',
      context: 'Domina un cargo que la IA no puede absorber y está comprometido. Es el tipo de talento que define la diferencia competitiva — el que más cuesta reemplazar.',
      accent: 'cyan',
    }
  }

  // Baja-media exposición × Alto dominio × Compromiso bajo → fuga silenciosa
  if (!isHighExposure && isHighRoleFit && isLowEngagement) {
    return {
      headline: 'Talento insustituible con compromiso a la baja',
      context: 'Domina un cargo blindado de la IA pero su compromiso erosiona. La pérdida no la cubre la tecnología — solo otra persona con años de aprendizaje.',
      accent: 'amber',
    }
  }

  // Baja exposición × Bajo dominio → desarrollo
  if (!isHighExposure && !isHighRoleFit) {
    return {
      headline: 'En desarrollo en un cargo protegido',
      context: 'No domina el cargo todavía, pero el cargo no está expuesto a la IA — hay tiempo para invertir. La pregunta es si esa inversión está alineada con tu plan.',
      accent: 'slate',
    }
  }

  // Default — composición sin patrón claro
  return {
    headline: 'Composición sin patrón dominante',
    context: 'Los indicadores de exposición, dominio y compromiso no convergen en un patrón único. Revisa los datos individualmente para una lectura más fina.',
    accent: 'slate',
  }
}

/**
 * Detecta el patrón dominante de una cohorte.
 *
 * @param cohort  personas seleccionadas
 * @param salaryMedianRef  mediana salarial de la organización completa
 *                         (no del cohorte — es referencia externa)
 */
export function detectPattern(
  cohort: PatternCandidate[],
  salaryMedianRef: number,
): PatternResult {
  const cohortSize = cohort.length

  // Cohortes muy pequeñas no tienen patrón estadístico — default
  if (cohortSize < 3) {
    return {
      key: 'default',
      matchedCount: 0,
      cohortSize,
      matchedRatio: 0,
      salaryMedianRef,
    }
  }

  // ── Conteos por patrón ──────────────────────────────────────────────
  // Helper: exposición efectiva por persona — focalizaScore primario,
  // observedExposure como fallback si el cargo no está clasificado en O*NET.
  const effectiveExposure = (p: PatternCandidate): number =>
    p.focalizaScore !== null ? p.focalizaScore : p.observedExposure

  const zombieCount = cohort.filter(
    p => p.roleFitScore > 75 && effectiveExposure(p) > 0.5,
  ).length

  // Fuga aumentada — engagement AAE discreto 1/2/3, HIGH = 3 (Test Ácido).
  // Antes usaba `>= 4` (escala continua incorrecta) → nunca disparaba.
  const fugaCount = cohort.filter(
    p =>
      p.potentialEngagement === 3 &&
      p.augmentationShare > 0.5,
  ).length

  const inerciaCount = cohort.filter(
    p => effectiveExposure(p) > 0.5 && p.salary > salaryMedianRef,
  ).length

  // ── Proporciones ────────────────────────────────────────────────────
  const candidates: Array<{ key: PatternKey; count: number; ratio: number }> = [
    { key: 'zombie', count: zombieCount, ratio: zombieCount / cohortSize },
    { key: 'fuga', count: fugaCount, ratio: fugaCount / cohortSize },
    { key: 'inercia', count: inerciaCount, ratio: inerciaCount / cohortSize },
  ]

  // Mayoría = > 0.5. Si hay empate, gana el primero del array (zombie > fuga > inercia)
  const winners = candidates
    .filter(c => c.ratio > 0.5)
    .sort((a, b) => b.ratio - a.ratio)

  if (winners.length === 0) {
    return {
      key: 'default',
      matchedCount: 0,
      cohortSize,
      matchedRatio: 0,
      salaryMedianRef,
    }
  }

  const winner = winners[0]
  return {
    key: winner.key,
    matchedCount: winner.count,
    cohortSize,
    matchedRatio: winner.ratio,
    salaryMedianRef,
  }
}
