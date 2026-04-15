// ════════════════════════════════════════════════════════════════════════════
// FORMAT HELPERS — formato compacto CLP + tenure
// src/app/dashboard/workforce/components/instruments/_shared/format.ts
// ════════════════════════════════════════════════════════════════════════════
// Compartidos entre todos los instrumentos del Workforce Deck.
// ════════════════════════════════════════════════════════════════════════════

export function formatCLP(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`
  }
  return `$${Math.round(amount)}`
}

export function formatTenureMonths(months: number): string {
  if (months < 12) return `${Math.round(months)} meses`
  const years = months / 12
  return `${years.toFixed(1)} años`
}

export function formatHours(hours: number): string {
  return `${Math.round(hours)} h`
}

/**
 * Variante de formatCLP SIN signo `$` — para usarse en composiciones donde
 * el componente agrega el `$` por separado (ej: `<p>${formatCLPCompact(v)}</p>`).
 */
export function formatCLPCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B`
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`
  }
  return `${Math.round(amount)}`
}

/** Formato número con separadores chilenos (1.234.567) */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('es-CL')
}
