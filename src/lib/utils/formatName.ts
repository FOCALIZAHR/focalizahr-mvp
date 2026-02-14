// src/lib/utils/formatName.ts
// Transforma nombres raw del backend a formato legible

function toTitleCase(str: string): string {
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
 * Extract initials from a name (already formatted or raw)
 */
export function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return parts[0]?.substring(0, 2).toUpperCase() || '??'
}
