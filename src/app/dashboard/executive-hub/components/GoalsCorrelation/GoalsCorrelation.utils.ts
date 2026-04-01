// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Utils V2
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsCorrelation.utils.ts
// ════════════════════════════════════════════════════════════════════════════

import type { GoalsCorrelationDataV2, SubFinding } from './GoalsCorrelation.types'
import type { PortadaNarrative } from './GoalsCorrelation.types'

// ════════════════════════════════════════════════════════════════════════════
// V2 PORTADA NARRATIVE — Progressive Disclosure from top alerts
// ════════════════════════════════════════════════════════════════════════════

export function getPortadaNarrativeV2(data: GoalsCorrelationDataV2): PortadaNarrative {
  const { topAlerts, totals, correlation } = data
  const totalWithGoals = correlation.filter(c => c.quadrant !== 'NO_GOALS').length

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

  // Has financial risk? Lead with $$$
  if (totals.totalFinancialRisk > 0 && topAlerts.length > 0) {
    const riskLabel = formatCurrency(totals.totalFinancialRisk)
    return {
      statusBadge: { label: 'Requiere revisión' },
      prefix: `De ${totals.totalEvaluados} evaluados, ${totals.totalEntregaron} entregaron y ${totals.totalNoEntregaron} no. `,
      highlight: `${riskLabel} en riesgo.`,
      suffix: ` ${totals.totalAnomalias} anomalías estructurales detectadas.`,
      ctaLabel: 'Ver análisis',
      ctaVariant: 'red',
      coachingTip: topAlerts[0] ? getAlertTip(topAlerts[0]) : 'Revisa las desconexiones entre resultados y cómo la organización responde.',
    }
  }

  // Has anomalies but no financial data
  if (totals.totalAnomalias > 0) {
    return {
      statusBadge: { label: 'Checkpoint' },
      prefix: `De ${totals.totalEvaluados} evaluados, ${totals.totalEntregaron} entregaron y ${totals.totalNoEntregaron} no. `,
      highlight: `${totals.totalAnomalias} anomalías detectadas.`,
      suffix: ' Desconexiones entre resultados y cómo la organización los trata.',
      ctaLabel: 'Ver análisis',
      ctaVariant: 'amber',
      coachingTip: topAlerts[0] ? getAlertTip(topAlerts[0]) : 'Revisa las desconexiones.',
    }
  }

  // Healthy
  return {
    statusBadge: { label: 'Alineado', showCheck: true },
    prefix: `De ${totals.totalEvaluados} evaluados, `,
    highlight: `${totals.totalEntregaron} entregaron resultados.`,
    suffix: ' La organización está respondiendo de forma coherente.',
    ctaLabel: 'Ver detalle',
    ctaVariant: 'cyan',
    coachingTip: 'Sin anomalías críticas entre resultados y respuesta organizacional.',
  }
}

function getAlertTip(alert: SubFinding): string {
  const tips: Record<string, string> = {
    '1B_fugaProductiva': 'Fuga productiva: personas que rinden Y están en riesgo de irse. El costo es cuantificable.',
    '1D_sostenibilidad': 'Resultados insostenibles: entregan a pesar de no dominar su cargo. Riesgo de burnout.',
    '2B_bonosInjustificados': 'Bonos sin respaldo: la percepción no coincide con la ejecución real.',
    '2C_evaluadorProtege': 'Evaluador protege: el gerente no exige y los datos lo confirman.',
    '2A_noPuedeVsNoQuiere': 'Diagnóstico diferenciado: distingue quién necesita capacitación de quién necesita conversación.',
  }
  return tips[alert.key] ?? 'Revisa las desconexiones entre resultados y respuesta organizacional.'
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

// Keep V1 for backward compat during migration
/** @deprecated Use getPortadaNarrativeV2 */
export { getPortadaNarrativeV2 as getPortadaNarrative }
