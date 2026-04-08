// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE FORMAT UTILS
// Local copy of formatCurrency to avoid cross-module dependency
// src/app/dashboard/workforce/utils/format.ts
// ════════════════════════════════════════════════════════════════════════════

export function formatCurrency(amount: number): string {
  if (amount === 0) return '$0'
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000
    return `${sign}$${m >= 10 ? Math.round(m) : (Math.round(m * 10) / 10)}M`
  }
  if (abs >= 1_000) {
    return `${sign}$${Math.round(abs / 1_000)}K`
  }
  return `${sign}$${Math.round(abs).toLocaleString('es-CL')}`
}
