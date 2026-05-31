// src/lib/utils/formatName.ts
// Transforma nombres raw del backend a formato legible

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Transforma nombres del backend a formato legible
 *
 * "NUÑEZ AHUMADA,MARIA ANTONIETA" → "María Núñez" (short)
 * "NUÑEZ AHUMADA,MARIA ANTONIETA" → "María Antonieta Núñez Ahumada" (full)
 * "GUTIERREZ VELIZ,IVALU XIMENA"  → "Ivalu Gutiérrez" (short)
 * "Andres Soto"                   → "Andrés Soto"
 */
export function formatDisplayName(
  fullName: string,
  format: 'short' | 'full' = 'short'
): string {
  if (!fullName) return ''

  // Detect "APELLIDO,NOMBRE" format
  if (fullName.includes(',')) {
    const [apellidos, nombres] = fullName.split(',').map(s => s.trim())
    const primerNombre = toTitleCase(nombres.split(' ')[0])
    const primerApellido = toTitleCase(apellidos.split(' ')[0])

    if (format === 'short') {
      return `${primerNombre} ${primerApellido}`
    }
    return `${toTitleCase(nombres)} ${toTitleCase(apellidos)}`
  }

  // Manejar nombres SIN coma
  // Asume formato: "Apellido1 Apellido2 Nombre1 Nombre2"
  const parts = fullName.trim().split(' ').filter(Boolean)

  if (format === 'short' && parts.length >= 3) {
    const primerApellido = toTitleCase(parts[0])
    const primerNombre = toTitleCase(parts[2])
    return `${primerNombre} ${primerApellido}`
  }

  return toTitleCase(fullName)
}

/**
 * For buttons: truncates with initial
 * "María Antonieta Núñez" → "María N."
 */
export function formatNameForButton(fullName: string): string {
  const display = formatDisplayName(fullName, 'short')
  const parts = display.split(' ')
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1].charAt(0)}.`
  }
  return display
}

/**
 * Full display name version
 * "NUÑEZ AHUMADA,MARIA ANTONIETA" → "María Antonieta Núñez Ahumada"
 */
export function formatDisplayNameFull(fullName: string): string {
  return formatDisplayName(fullName, 'full')
}

/**
 * Formatea clasificación de evaluador del motor a label legible.
 * El motor usa uppercase (SEVERA, INDULGENTE, CENTRAL, OPTIMA).
 * Nota: "OPTIMA" → "Óptima" (con tilde, no se obtiene con toTitleCase).
 */
export function formatEvaluatorStyle(status: string | null | undefined): string {
  if (!status) return ''
  switch (status) {
    case 'OPTIMA': return 'Óptima'
    case 'INDULGENTE': return 'Indulgente'
    case 'SEVERA': return 'Severa'
    case 'CENTRAL': return 'Central'
    default: return toTitleCase(status)
  }
}

/**
 * Formatea nombres de departamento/gerencia para display ejecutivo.
 *
 * Distinto de formatDisplayName (que es para nombres PERSONALES con patrón
 * "APELLIDO,NOMBRE" y reordena partes). Acá:
 *   - Acrónimos cortos (≤4 letras, todo mayúscula) se PRESERVAN
 *     ("TI" → "TI", "RRHH" → "RRHH").
 *   - Preposiciones españolas (de/del/la/los/las/el/y/e/o/u) en minúscula
 *     cuando NO son la primera palabra.
 *   - Resto: title case por palabra.
 *
 * "GERENCIA DE TECNOLOGÍA" → "Gerencia de Tecnología"
 * "EQUIPOS MEDICOS"        → "Equipos Medicos"
 * "TI"                     → "TI"
 * "Gerencia De Operaciones"→ "Gerencia de Operaciones"
 */
export function formatDepartmentName(name: string): string {
  if (!name) return ''
  const trimmed = name.trim()
  if (!trimmed) return ''

  const PREPOSITIONS_LC = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'o', 'u'])
  const ACRONYM_RE = /^[A-ZÑÁÉÍÓÚÜ.]+$/

  return trimmed
    .split(/\s+/)
    .map((word, idx) => {
      // Preservar acrónimos cortos en mayúscula (TI, RRHH, IT, ...).
      if (word.length >= 1 && word.length <= 4 && ACRONYM_RE.test(word)) {
        return word
      }
      const lower = word.toLowerCase()
      // Preposiciones en minúscula si no es la primera palabra.
      if (idx > 0 && PREPOSITIONS_LC.has(lower)) {
        return lower
      }
      // Title case por palabra (preserva tildes ya escritas en el lower-cased input).
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

/**
 * Recorta comillas envolventes (rectas o tipográficas) de una cita literal.
 * Útil cuando el motor LLM devuelve la cita YA entre comillas y el template
 * de render la vuelve a envolver — produce comillas duplicadas.
 *
 *   '"no deberían hablar..."'  → 'no deberían hablar...'
 *   '"hola"'                   → 'hola'
 *   "'texto'"                  → 'texto'
 *   '"abierta sin cerrar'      → '"abierta sin cerrar'  (no match → sin tocar)
 *   ''                         → ''
 */
export function stripWrappingQuotes(s: string): string {
  if (!s) return ''
  const t = s.trim()
  if (t.length < 2) return t
  const first = t.charAt(0)
  const last = t.charAt(t.length - 1)
  const STRAIGHT_PAIRS: Array<[string, string]> = [
    ['"', '"'],
    ["'", "'"],
    ['“', '”'], // “ ”
    ['‘', '’'], // ‘ ’
  ]
  for (const [open, close] of STRAIGHT_PAIRS) {
    if (first === open && last === close) {
      return t.slice(1, -1).trim()
    }
  }
  return t
}

/**
 * Extract initials from a name (already formatted or raw)
 */
export function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return parts[0]?.substring(0, 2).toUpperCase() || '??'
}
