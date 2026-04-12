// ════════════════════════════════════════════════════════════════════════════
// SOC CODE NORMALIZATION
// src/lib/utils/socCode.ts
// ════════════════════════════════════════════════════════════════════════════
// El catálogo O*NET (onet_tasks, onet_occupations) usa códigos con sufijo
// ".00" — ej: "11-9021.00". Pero JobDescriptor.socCode y
// OccupationMapping.socCode persisten el código sin sufijo — ej: "11-9021".
//
// Cualquier query a OnetOccupation/OnetTask por socCode debe tolerar AMBOS
// formatos para no devolver null silenciosamente.
//
// Uso:
//   const occupation = await prisma.onetOccupation.findFirst({
//     where: { socCode: { in: socCodeVariants("11-9021") } }
//   })
//   // → busca tanto "11-9021" como "11-9021.00"
// ════════════════════════════════════════════════════════════════════════════

/**
 * Devuelve las variantes posibles de un SOC code para hacer queries
 * tolerantes al formato. Siempre incluye el input original + la variante
 * con/sin ".00".
 *
 * Ejemplos:
 *   socCodeVariants("11-9021")    → ["11-9021", "11-9021.00"]
 *   socCodeVariants("11-9021.00") → ["11-9021.00", "11-9021"]
 *   socCodeVariants("")           → []
 *   socCodeVariants(null)         → []
 */
export function socCodeVariants(socCode: string | null | undefined): string[] {
  if (!socCode) return []
  const trimmed = socCode.trim()
  if (!trimmed) return []

  const hasSuffix = /\.\d{2}$/.test(trimmed)
  if (hasSuffix) {
    // "11-9021.00" → también "11-9021"
    const base = trimmed.replace(/\.\d{2}$/, '')
    return [trimmed, base]
  }
  // "11-9021" → también "11-9021.00"
  return [trimmed, `${trimmed}.00`]
}

/**
 * Variante para usar en `where: { socCode: ... }` de Prisma.
 * Retorna `{ in: variants }` o un objeto vacío si no hay socCode.
 */
export function socCodeWhereClause(
  socCode: string | null | undefined,
): { in: string[] } | undefined {
  const variants = socCodeVariants(socCode)
  if (variants.length === 0) return undefined
  return { in: variants }
}
