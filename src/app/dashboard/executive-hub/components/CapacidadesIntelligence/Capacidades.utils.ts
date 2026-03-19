// ════════════════════════════════════════════════════════════════════════════
// UTILS — Capacidades Intelligence (narrativas + helpers visuales)
// ════════════════════════════════════════════════════════════════════════════

import { ROLE_FIT_HIGH, ACOTADO_LABELS, LAYER_ORDER } from './Capacidades.constants'
import type { CapacidadesData } from './Capacidades.types'
import type { PanelPortadaNarrative } from '../PanelPortada'

export function getScoreColor(score: number): string {
  if (score >= 90) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  if (score >= ROLE_FIT_HIGH) return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  if (score >= 60) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

export function getScoreTextColor(score: number): string {
  if (score >= 90) return 'text-cyan-400'
  if (score >= ROLE_FIT_HIGH) return 'text-purple-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

export function getStatusColor(status: string): string {
  if (status === 'SALUDABLE') return 'text-emerald-400'
  if (status === 'ATENCION') return 'text-amber-400'
  return 'text-red-400'
}

export function getGapBarColor(gap: number): string {
  if (gap >= 0) return 'bg-emerald-500/50'
  if (gap >= -0.5) return 'bg-amber-500/40'
  return 'bg-red-500/50'
}

export function getCapacidadesNarrative(data: CapacidadesData): {
  narrative: PanelPortadaNarrative
  ctaVariant: 'cyan' | 'purple' | 'amber' | 'red'
  coachingTip: string
} {
  const layers = LAYER_ORDER.filter(l => data.byLayer[l] !== undefined)
  const belowThreshold = layers.filter(l => data.byLayer[l] < ROLE_FIT_HIGH)
  const worst = data.worstCell
  const worstLabel = ACOTADO_LABELS[worst.layer] || worst.layer

  if (belowThreshold.length === 0) {
    return {
      narrative: {
        highlight: `${data.overall}% Role Fit`,
        suffix: ' — todas las capas superan el umbral. Tu organizacion esta alineada con los roles.'
      },
      ctaVariant: 'cyan',
      coachingTip: 'Mantener el nivel actual requiere desarrollo continuo. Las brechas se abren rapido.'
    }
  }

  if (data.overall < 60) {
    return {
      narrative: {
        highlight: `${data.overall}% Role Fit`,
        suffix: ` — tu organizacion tiene brechas criticas. ${worstLabel} en ${worst.gerencia} es el punto mas debil (${worst.score}%).`
      },
      ctaVariant: 'red',
      coachingTip: `${belowThreshold.length} de ${layers.length} capas estan bajo el umbral de ${ROLE_FIT_HIGH}%.`
    }
  }

  const blockersCount = data.strategicFocus?.[0]?.blockers?.length || 0

  return {
    narrative: {
      highlight: `${belowThreshold.length} capa${belowThreshold.length !== 1 ? 's' : ''} bajo el umbral`,
      suffix: ` — ${belowThreshold.map(l => ACOTADO_LABELS[l] || l).join(' y ')} ${belowThreshold.length === 1 ? 'necesita' : 'necesitan'} atencion.${blockersCount > 0 ? ` ${blockersCount} competencia${blockersCount !== 1 ? 's' : ''} bloquean tu estrategia.` : ''}`
    },
    ctaVariant: 'amber',
    coachingTip: `Role Fit organizacional: ${data.overall}%. Peor celda: ${worstLabel} · ${worst.gerencia} (${worst.score}%).`
  }
}
