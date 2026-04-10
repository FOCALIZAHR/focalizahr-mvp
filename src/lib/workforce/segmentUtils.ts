// ════════════════════════════════════════════════════════════════════════════
// SEGMENT UTILS — Agrupacion por SEGMENTO (acotadoGroup × standardCategory)
// src/lib/workforce/segmentUtils.ts
// ════════════════════════════════════════════════════════════════════════════
// v3.1: Unidad de analisis cambia de GERENCIA a SEGMENTO.
// Un SEGMENTO es la combinacion (acotadoGroup × standardCategory).
// Ejemplo: "Profesionales de Finanzas", "Mandos Medios de Tecnologia"
//
// Acepta cualquier item con campos `acotadoGroup` y `standardCategory`.
// Consumidores tipicos:
//   - PersonAlert (zombies, flightRisk)
//   - RetentionEntry (retentionPriority.ranking)
//   - EnrichedEmployee (cualquier dataset enriquecido)
// ════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Cualquier item agrupable por segmento debe exponer estos dos campos.
 * Ambos pueden ser null si la persona no esta clasificada.
 */
export interface SegmentableItem {
  acotadoGroup: string | null
  standardCategory: string | null
}

/**
 * Llave canonica del segmento, ej: "Profesionales de Finanzas".
 * Cuando faltan datos: "Sin segmento".
 */
export type SegmentKey = string

/**
 * Metricas agregadas de un segmento generico.
 * Los campos exposure-related son opcionales (no todos los items
 * tienen exposure — depende del consumidor).
 */
export interface SegmentMetrics<T extends SegmentableItem> {
  key: SegmentKey
  acotadoGroup: string | null
  standardCategory: string | null
  headcount: number
  avgExposure: number
  /** headcount × avgExposure — usar para ordenar por relevancia */
  impactScore: number
  members: T[]
}

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const UNCLASSIFIED_KEY: SegmentKey = 'Sin segmento'

// ═══════════════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Construye la llave canonica del segmento para un item.
 * Si falta cualquiera de los dos campos, retorna "Sin segmento".
 */
export function getSegmentKey(item: SegmentableItem): SegmentKey {
  if (!item.acotadoGroup || !item.standardCategory) {
    return UNCLASSIFIED_KEY
  }
  return `${item.acotadoGroup} de ${item.standardCategory}`
}

/**
 * Agrupa un array de items por segmento.
 * Mantiene el orden de insercion en cada bucket.
 */
export function groupBySegment<T extends SegmentableItem>(
  items: T[]
): Map<SegmentKey, T[]> {
  const map = new Map<SegmentKey, T[]>()
  for (const item of items) {
    const key = getSegmentKey(item)
    const existing = map.get(key)
    if (existing) {
      existing.push(item)
    } else {
      map.set(key, [item])
    }
  }
  return map
}

/**
 * Calcula metricas agregadas por segmento.
 *
 * @param items items a agrupar y agregar
 * @param getExposure funcion que extrae el valor de exposicion de cada item
 *                    (0-1 o 0-100, depende del consumidor — la utility solo agrega)
 * @returns array ordenado por impactScore desc
 */
export function calculateSegmentMetrics<T extends SegmentableItem>(
  items: T[],
  getExposure: (item: T) => number
): SegmentMetrics<T>[] {
  const grouped = groupBySegment(items)

  return Array.from(grouped.entries())
    .map(([key, members]) => {
      const totalExposure = members.reduce((sum, m) => sum + getExposure(m), 0)
      const avgExposure = members.length > 0 ? totalExposure / members.length : 0
      const headcount = members.length
      const impactScore = headcount * avgExposure

      // Tomar acotadoGroup y standardCategory del primer miembro
      // (todos los miembros del mismo bucket comparten estos valores por construccion)
      const first = members[0]

      return {
        key,
        acotadoGroup: first?.acotadoGroup ?? null,
        standardCategory: first?.standardCategory ?? null,
        headcount,
        avgExposure,
        impactScore,
        members,
      }
    })
    .sort((a, b) => b.impactScore - a.impactScore)
}

/**
 * Helper: agrega un total numerico arbitrario por segmento.
 * Util para gap monetario, conteos de hallazgos, etc.
 *
 * @param items items a agrupar
 * @param getValue funcion que extrae el valor numerico a sumar
 * @returns array ordenado por total desc
 */
export function aggregateBySegment<T extends SegmentableItem>(
  items: T[],
  getValue: (item: T) => number
): Array<{ key: SegmentKey; acotadoGroup: string | null; standardCategory: string | null; total: number; count: number; members: T[] }> {
  const grouped = groupBySegment(items)

  return Array.from(grouped.entries())
    .map(([key, members]) => {
      const total = members.reduce((sum, m) => sum + getValue(m), 0)
      const first = members[0]
      return {
        key,
        acotadoGroup: first?.acotadoGroup ?? null,
        standardCategory: first?.standardCategory ?? null,
        total,
        count: members.length,
        members,
      }
    })
    .sort((a, b) => b.total - a.total)
}

/**
 * Helper: filtra items que pertenecen a segmentos clasificados (excluye "Sin segmento").
 */
export function withClassifiedSegment<T extends SegmentableItem>(items: T[]): T[] {
  return items.filter(i => !!i.acotadoGroup && !!i.standardCategory)
}

/**
 * Helper: cuenta segmentos unicos en un array.
 */
export function countUniqueSegments(items: SegmentableItem[]): number {
  const set = new Set<SegmentKey>()
  for (const item of items) {
    set.add(getSegmentKey(item))
  }
  return set.size
}
