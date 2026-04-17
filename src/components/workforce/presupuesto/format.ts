// Formateadores CLP compartidos del wizard de Presupuesto.
// Defensivos contra valores null/undefined/NaN — evitan "$undefined".

export function formatCLP(value: number | null | undefined): string {
  if (!Number.isFinite(value as number)) return '—'
  const v = value as number
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(v) >= 1_000_000) return `$${Math.round(v / 1_000_000)}M`
  if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${Math.round(v)}`
}

export function formatCLPSigned(value: number | null | undefined): string {
  if (!Number.isFinite(value as number)) return '—'
  const v = value as number
  const signo = v > 0 ? '+' : ''
  return `${signo}${formatCLP(v)}`
}

export function formatMontoMM(value: number | null | undefined): string {
  if (!Number.isFinite(value as number)) return '—'
  const mm = (value as number) / 1_000_000
  return mm >= 10 ? `${mm.toFixed(0)}M` : `${mm.toFixed(1)}M`
}

export function formatAntiguedad(meses: number | null | undefined): string {
  if (!Number.isFinite(meses as number)) return '—'
  const m = meses as number
  if (m < 12) return `${m}m`
  const anos = Math.floor(m / 12)
  const restoMeses = m % 12
  return restoMeses === 0 ? `${anos}a` : `${anos}a ${restoMeses}m`
}

// Convierte nombres en MAYUSCULAS a capitalize por palabra.
// "DIAZ HUIRCAN RICARDO ANDRES" -> "Diaz Huircan Ricardo Andres"
export function formatNombre(nombre: string | null | undefined): string {
  if (!nombre) return ''
  return nombre
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
