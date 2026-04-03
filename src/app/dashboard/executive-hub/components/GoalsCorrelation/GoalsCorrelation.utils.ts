// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Utils V2
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsCorrelation.utils.ts
// ════════════════════════════════════════════════════════════════════════════

import type { GoalsCorrelationDataV2 } from './GoalsCorrelation.types'
import type { PortadaNarrative } from './GoalsCorrelation.types'
import { SUBFINDING_TO_NARRATIVE } from './GoalsCorrelation.constants'
import { getNarrative } from '@/config/narratives/GoalsNarrativeDictionary'

// ════════════════════════════════════════════════════════════════════════════
// V2 PORTADA NARRATIVE — Alineada con patrón P&L Talent
// CTA siempre cyan. Highlight = dato ancla. Sin instrucciones.
// ════════════════════════════════════════════════════════════════════════════

export function getPortadaNarrativeV2(data: GoalsCorrelationDataV2): PortadaNarrative {
  const { topAlerts, totals, correlation, quadrantCounts } = data
  const totalWithGoals = correlation.filter(c => c.quadrant !== 'NO_GOALS').length

  // % desalineamiento (dato ancla principal)
  const totalRiesgo = quadrantCounts.perceptionBias + quadrantCounts.hiddenPerformer
  const pctDesalineamiento = totals.totalEvaluados > 0
    ? Math.round((totalRiesgo / totals.totalEvaluados) * 100)
    : 0

  // Sin datos de metas
  if (totalWithGoals === 0) {
    return {
      highlight: 'Sin datos de metas',
      suffix: ' para este ciclo. Sin metas medidas, la evaluación no se puede validar contra resultados.',
      ctaLabel: 'Ver detalle',
      ctaVariant: 'cyan',
      coachingTip: 'Las metas permiten validar si la evaluación refleja resultados reales.',
    }
  }

  // Hay desalineamiento con costo financiero
  if (pctDesalineamiento > 0 && totals.totalFinancialRisk > 0) {
    return {
      highlight: `${pctDesalineamiento}% de desalineamiento.`,
      suffix: ` La capacidad y los resultados no coinciden en ${totalRiesgo} de tus ${totals.totalEvaluados} evaluados.`,
      ctaLabel: 'Ver dónde está el problema',
      ctaVariant: 'cyan',
      coachingTip: `De esas contradicciones, ${formatCurrency(totals.totalFinancialRisk)} en costo de reemplazo si se materializan.`,
    }
  }

  // Hay desalineamiento sin costo financiero
  if (pctDesalineamiento > 0) {
    const topAlert = topAlerts[0]
    const topNarrKey = topAlert ? SUBFINDING_TO_NARRATIVE[topAlert.key] : null
    const topNarr = topNarrKey ? getNarrative(topNarrKey) : null

    return {
      highlight: `${pctDesalineamiento}% de desalineamiento.`,
      suffix: ` En ${totalRiesgo} de ${totals.totalEvaluados} evaluados, la capacidad y los resultados no coinciden.`,
      ctaLabel: 'Ver dónde está el problema',
      ctaVariant: 'cyan',
      coachingTip: topAlert && topNarr
        ? `${topAlert.count} personas en el hallazgo más severo: ${topNarr.headline.replace(/\.$/, '')}.`
        : 'Contradicciones detectadas entre capacidad y resultados.',
    }
  }

  // Saludable
  return {
    statusBadge: { label: 'Alineado', showCheck: true },
    highlight: 'Capacidad y resultados alineados.',
    suffix: ` Las evaluaciones coinciden con los resultados de metas en la mayoría de tus ${totals.totalEvaluados} evaluados.`,
    ctaLabel: 'Ver detalle',
    ctaVariant: 'cyan',
    coachingTip: 'Base confiable para decisiones de compensación y desarrollo.',
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
