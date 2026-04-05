// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Utils V2
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsCorrelation.utils.ts
// ════════════════════════════════════════════════════════════════════════════

import type { GoalsCorrelationDataV2 } from './GoalsCorrelation.types'
import type { PortadaNarrative } from './GoalsCorrelation.types'

// ════════════════════════════════════════════════════════════════════════════
// V2 PORTADA NARRATIVE — Dato ancla: coherenceScore (0-100)
// El CEO cree primero en la confiabilidad del sistema, después explora.
// CTA lleva al Acto Ancla (pre-cascada), no directo a la cascada.
// ════════════════════════════════════════════════════════════════════════════

export function getPortadaNarrativeV2(data: GoalsCorrelationDataV2): PortadaNarrative {
  const { totals, correlation } = data
  const totalWithGoals = correlation.filter(c => c.quadrant !== 'NO_GOALS').length

  // Sin datos de metas — edge case temprano
  if (totalWithGoals === 0) {
    return {
      highlight: 'Sin datos de metas',
      suffix: ' para este ciclo. Sin metas medidas, la evaluación no se puede validar contra resultados.',
      ctaLabel: 'Ver detalle',
      ctaVariant: 'cyan',
      coachingTip: 'Las metas permiten validar si la evaluación refleja resultados reales.',
    }
  }

  // Coherence score — dato ancla principal (alignment × pearson × stars × confidence)
  const coherence = computeCoherenceIndex(data)
  const confiabilidad = coherence.score
  const ruido = 100 - confiabilidad

  // Caso saludable (≥75% coherencia)
  // Sin statusBadge: el dato vive en la narrativa, zero duplicación.
  if (confiabilidad >= 75) {
    return {
      prefix: 'Tus datos de evaluación reflejan ',
      highlight: 'resultados reales',
      suffix: '. Base sólida para decisiones de compensación y desarrollo.',
      ctaLabel: 'Ver evidencia',
      ctaVariant: 'cyan',
      coachingTip: 'El desafío ahora es proteger a quienes sostienen este resultado.',
    }
  }

  // Caso crítico / bajo / medio — narrativa de riesgo
  // Foco en METAS primero (lenguaje de negocio), no en "datos de evaluación" (jerga RRHH).
  // El highlight resalta el dato protagonista dentro de la frase completa.
  const financialRiskStr = totals.totalFinancialRisk > 0
    ? `${formatCurrency(totals.totalFinancialRisk)} en costo de reemplazo si las discrepancias se materializan.`
    : 'El costo se acumula en decisiones de compensación, promoción y sucesión.'

  return {
    highlight: `${confiabilidad}% de confiabilidad.`,
    suffix: ` La relación entre el cumplimiento de metas y la evaluación de tu equipo coincide en un ${confiabilidad}%. Las decisiones de compensación, promoción y sucesión se construyen sobre esa base.`,
    ctaLabel: 'Ver evidencia',
    ctaVariant: 'cyan',
    coachingTip: financialRiskStr,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COHERENCE INDEX — Índice de coherencia organizacional (0-100)
// Combina: disconnection, Pearson, stars, confidence gerencias
// ════════════════════════════════════════════════════════════════════════════

export interface CoherenceIndex {
  score: number
  level: 'high' | 'medium' | 'low' | 'critical'
  components: {
    alignment: number   // 100 - disconnection%
    pearson: number     // avg Pearson normalized 0-100
    stars: number       // % stars with high goals
    confidence: number  // % gerencias with green confidence
  }
}

export function computeCoherenceIndex(data: GoalsCorrelationDataV2): CoherenceIndex {
  const { quadrantCounts, totals, byGerencia, stars } = data

  // Component 1: Alignment (inverse of disconnection)
  const totalRiesgo = quadrantCounts.perceptionBias + quadrantCounts.hiddenPerformer
  const disconnectionPct = totals.totalEvaluados > 0
    ? (totalRiesgo / totals.totalEvaluados) * 100
    : 0
  const alignment = Math.max(0, 100 - disconnectionPct)

  // Component 2: Pearson average (normalized 0-100)
  const pearsons = byGerencia
    .map(g => g.pearsonRoleFitGoals)
    .filter((p): p is number => p !== null)
  const pearson = pearsons.length > 0
    ? Math.max(0, Math.min(100, (pearsons.reduce((a, b) => a + b, 0) / pearsons.length) * 100))
    : 50 // neutral if no data

  // Component 3: Stars with high goals
  const starsScore = stars.total > 0 ? stars.percentage : 50

  // Component 4: Green confidence gerencias
  const confidence = byGerencia.length > 0
    ? (byGerencia.filter(g => g.confidenceLevel === 'green').length / byGerencia.length) * 100
    : 50

  // Weighted score
  const score = Math.round(
    alignment * 0.30 +
    pearson * 0.25 +
    starsScore * 0.25 +
    confidence * 0.20
  )

  const level: CoherenceIndex['level'] =
    score >= 75 ? 'high' :
    score >= 50 ? 'medium' :
    score >= 30 ? 'low' : 'critical'

  return {
    score,
    level,
    components: {
      alignment: Math.round(alignment),
      pearson: Math.round(pearson),
      stars: Math.round(starsScore),
      confidence: Math.round(confidence),
    },
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
