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

  // PRIORIDAD 1: Hay brecha (con o sin zona legal)
  if (brecha.totalPeople > 0) {
    const legalSuffix = semaforo.totalPeople > 0
      ? ` ${semaforo.totalPeople} llevan tanto tiempo bajo el estándar que mantenerlos ya cuesta más que actuar.`
      : ''

    return {
      prefix: `Evaluamos a ${brecha.totalEvaluated} personas contra las expectativas reales de sus cargos. `,
      highlight: `${brecha.totalPeople} no cumplen con el mínimo.`,
      suffix: ` Eso tiene un costo: ${formatCurrency(brecha.totalGapMonthly)}/mes en productividad que pagas pero no recibes.${legalSuffix}`,
      ctaLabel: 'Ver dónde está el problema',
      ctaVariant: 'cyan',
      coachingTip: `Equivalente a ${brecha.fteLoss} personas a tiempo completo cobrando sin retorno productivo.`,
    }
  }

  // PRIORIDAD 2: Solo zona legal (sin brecha)
  if (semaforo.totalPeople > 0) {
    return {
      highlight: `${semaforo.totalPeople} persona${semaforo.totalPeople > 1 ? 's' : ''} en zona crítica.`,
      suffix: ` ${formatCurrency(semaforo.totalLiability)} acumulado en exposición legal. Cada mes sin actuar suma ${formatCurrency(semaforo.monthlyGrowth)}.`,
      ctaLabel: 'Ver dónde está el problema',
      ctaVariant: 'cyan',
      coachingTip: 'No es una decisión de RRHH — es una decisión financiera.',
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
