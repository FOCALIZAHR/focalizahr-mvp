// ════════════════════════════════════════════════════════════════════════════
// UTILS - PLTalent
// src/app/dashboard/executive-hub/components/PLTalent/PLTalent.utils.ts
// ════════════════════════════════════════════════════════════════════════════

import { ROLEFIT_BAR_COLORS } from './PLTalent.constants'
import type { PLTalentData, PLTalentPortadaNarrative } from './PLTalent.types'

// ════════════════════════════════════════════════════════════════════════════
// PORTADA NARRATIVE ENGINE
// Prioridad: (1) Zona legal > (2) Brecha productiva > (3) Saludable
// CTA siempre cyan
// ════════════════════════════════════════════════════════════════════════════

export function getPortadaNarrative(data: PLTalentData): PLTalentPortadaNarrative {
  const { brecha, semaforo } = data

  // PRIORIDAD 1: Personas en zona legal
  if (semaforo.totalPeople > 0) {
    return {
      highlight: `${semaforo.totalPeople} persona${semaforo.totalPeople > 1 ? 's' : ''}`,
      suffix: ` en zona legal con ${formatCurrency(semaforo.totalLiability)} acumulado en exposición. La inacción tiene un costo que crece cada mes.`,
      ctaLabel: 'Ver impacto financiero',
      ctaVariant: 'cyan',
      coachingTip: `Cada mes sin actuar suma ${formatCurrency(semaforo.monthlyGrowth)} a la exposición. No es una decisión de RRHH — es una decisión financiera.`,
    }
  }

  // PRIORIDAD 2: Brecha productiva
  if (brecha.totalPeople > 0) {
    return {
      highlight: formatCurrency(brecha.totalGapMonthly) + '/mes',
      suffix: ` en brecha productiva. ${brecha.totalPeople} de ${brecha.totalEvaluated} personas no alcanzan el estándar de su cargo.`,
      ctaLabel: 'Ver brecha por área',
      ctaVariant: 'cyan',
      coachingTip: `La brecha mide cuánto deja de producir cada persona respecto al estándar mínimo del cargo (75% de Role Fit).`,
    }
  }

  // DEFAULT: Sin alertas
  return {
    statusBadge: { label: 'Sin alertas financieras', showCheck: true },
    highlight: 'Sin alertas',
    suffix: ' financieras activas. Tu organización opera dentro de los estándares de productividad.',
    ctaLabel: 'Ver detalle',
    ctaVariant: 'cyan',
    coachingTip: 'Todos los colaboradores evaluados superan el 75% de Role Fit y ninguno está en zona de bajo rendimiento.',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// FORMAT CURRENCY — Chilean pesos ($47.3M, $1.2M, $850K)
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
    const k = Math.round(abs / 1_000)
    return `${sign}$${k}K`
  }
  return `${sign}$${Math.round(abs).toLocaleString('es-CL')}`
}

// ════════════════════════════════════════════════════════════════════════════
// ROLEFIT BAR COLOR — Returns Tailwind class for bar
// ════════════════════════════════════════════════════════════════════════════

export function getRoleFitBarColor(avgRoleFit: number): string {
  if (avgRoleFit >= 90) return ROLEFIT_BAR_COLORS.optimal
  if (avgRoleFit >= 75) return ROLEFIT_BAR_COLORS.solid
  if (avgRoleFit >= 60) return ROLEFIT_BAR_COLORS.developing
  if (avgRoleFit >= 45) return ROLEFIT_BAR_COLORS.gap
  return ROLEFIT_BAR_COLORS.risk
}
