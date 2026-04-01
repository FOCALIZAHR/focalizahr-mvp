// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Utils
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsCorrelation.utils.ts
// ════════════════════════════════════════════════════════════════════════════

import type { GoalsCorrelationData } from './GoalsCorrelation.types'
import type { PortadaNarrative } from './GoalsCorrelation.types'

// ════════════════════════════════════════════════════════════════════════════
// PORTADA NARRATIVE ENGINE
// Prioridad: (1) Fuga productiva > (2) Bonos sin respaldo > (3) Cobertura baja > (4) Saludable
// ════════════════════════════════════════════════════════════════════════════

export function getPortadaNarrative(data: GoalsCorrelationData): PortadaNarrative {
  const { narratives, quadrantCounts, correlation } = data
  const totalWithGoals = correlation.filter(c => c.quadrant !== 'NO_GOALS').length
  const totalEmployees = correlation.length

  // Sin datos de metas
  if (totalWithGoals === 0) {
    return {
      highlight: 'Sin datos de metas',
      suffix: ' para este ciclo. Asigna metas antes de evaluar correlación.',
      ctaLabel: 'Ver detalle',
      ctaVariant: 'cyan',
      coachingTip: 'Las metas permiten validar si la evaluación 360° refleja resultados reales.',
    }
  }

  const coverage = Math.round((totalWithGoals / totalEmployees) * 100)
  const totalUrgent = narratives.fugaProductiva.count
    + narratives.bonosSinRespaldo.count
    + narratives.talentoInvisible.count
    + narratives.ejecutoresDesconectados.count
    + narratives.noSabeVsNoQuiere.noSabe.length
    + narratives.noSabeVsNoQuiere.noQuiere.length

  // PRIORIDAD 1: Fuga productiva (rinde + riesgo de irse)
  if (narratives.fugaProductiva.count > 0) {
    const cost = narratives.fugaProductiva.totalCost
    const costLabel = cost >= 1_000_000
      ? `$${Math.round(cost / 1_000_000)}M`
      : `$${Math.round(cost / 1_000)}K`
    return {
      statusBadge: { label: 'Requiere revisión' },
      prefix: `${narratives.fugaProductiva.count} colaborador${narratives.fugaProductiva.count > 1 ? 'es' : ''} en riesgo de fuga cumple${narratives.fugaProductiva.count === 1 ? '' : 'n'} metas sobre 80%. `,
      highlight: `${costLabel} en costo de reemplazo.`,
      suffix: ` Revisión pre-bonos: ${totalUrgent} casos requieren atención antes de aprobar compensación.`,
      ctaLabel: 'Ver desconexiones',
      ctaVariant: 'red',
      coachingTip: 'Fuga productiva: personas que rinden Y están en riesgo de irse. El costo de no actuar es cuantificable.',
    }
  }

  // PRIORIDAD 2: Bonos sin respaldo
  if (narratives.bonosSinRespaldo.count > 0) {
    return {
      statusBadge: { label: 'Checkpoint compensación' },
      prefix: `${narratives.bonosSinRespaldo.count} persona${narratives.bonosSinRespaldo.count > 1 ? 's' : ''} califica${narratives.bonosSinRespaldo.count === 1 ? '' : 'n'} para bono por su 360° pero `,
      highlight: `tiene${narratives.bonosSinRespaldo.count === 1 ? '' : 'n'} metas bajo 40%.`,
      suffix: ' La evaluación no se respalda con resultados.',
      ctaLabel: 'Ver desconexiones',
      ctaVariant: 'amber',
      coachingTip: 'Bonos sin respaldo: la percepción de pares no coincide con la ejecución real.',
    }
  }

  // PRIORIDAD 3: Cobertura baja
  if (coverage < 70) {
    return {
      prefix: `Solo el `,
      highlight: `${coverage}% tiene metas asignadas.`,
      suffix: ` Sin metas medidas, la evaluación 360° no se puede validar contra resultados.`,
      ctaLabel: 'Ver cobertura',
      ctaVariant: 'cyan',
      coachingTip: 'Cobertura de metas: porcentaje de la organización con objetivos medibles asignados.',
    }
  }

  // DEFAULT: Saludable
  return {
    statusBadge: { label: 'Alineado', showCheck: true },
    highlight: `${quadrantCounts.consistent} de ${totalWithGoals} consistentes.`,
    suffix: ` La evaluación 360° está respaldada por cumplimiento de metas en la mayoría de los casos.`,
    ctaLabel: 'Ver detalle',
    ctaVariant: 'cyan',
    coachingTip: 'Consistencia: evaluación 360° y metas apuntan en la misma dirección.',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// FORMAT CURRENCY (reutiliza patrón PLTalent)
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

// ════════════════════════════════════════════════════════════════════════════
// GROUP BY GERENCIA — Para narrativas
// ════════════════════════════════════════════════════════════════════════════

export function getConcentrationText(employees: { gerencia: string }[]): string | null {
  if (employees.length < 2) return null

  const gerenciaCounts = new Map<string, number>()
  for (const e of employees) {
    gerenciaCounts.set(e.gerencia, (gerenciaCounts.get(e.gerencia) ?? 0) + 1)
  }

  const sorted = [...gerenciaCounts.entries()].sort((a, b) => b[1] - a[1])
  const top = sorted[0]
  if (top[1] >= 2) {
    return `${top[1]} de ${employees.length} están en ${top[0]}`
  }
  return null
}
