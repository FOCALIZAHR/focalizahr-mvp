// ════════════════════════════════════════════════════════════════════════════
// SUCCESSION NARRATIVES - Fuente única de verdad
// src/config/successionNarratives.ts
// ════════════════════════════════════════════════════════════════════════════
// Narrativas CEO para el Executive Hub SuccessionPanel
// Filosofía: "¿Si mi VP se va mañana, estamos cubiertos?"
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type VulnerabilityLevel = 'CRITICAL' | 'URGENT' | 'NEEDS_ATTENTION' | 'NORMAL' | 'NO_DATA'

export interface PortadaNarrative {
  highlight: string
  suffix: string
  ctaVariant: 'cyan' | 'amber' | 'red'
  coachingTip: string
}

export interface VulnerabilityRow {
  positionId: string
  positionTitle: string
  incumbentName: string | null
  flightRisk: string | null        // HIGH | MEDIUM | LOW | null
  benchStrength: string             // STRONG | MODERATE | WEAK | NONE | UNKNOWN
  bestCandidateName: string | null
  bestCandidateReadiness: string | null
  bestCandidateReadinessLabel: string | null
  chainStatus: 'covered' | 'domino_open' | 'no_candidate'
  chainDetail: string | null        // "Activar a X resuelve A pero deja B sin cobertura"
  urgency: VulnerabilityLevel
}

// ════════════════════════════════════════════════════════════════════════════
// URGENCY CALCULATION
// ════════════════════════════════════════════════════════════════════════════

export function calculateUrgency(
  flightRisk: string | null,
  benchStrength: string
): VulnerabilityLevel {
  const isHighRisk = flightRisk === 'HIGH'
  const isMediumRisk = flightRisk === 'MEDIUM'
  const isLowRisk = flightRisk === 'LOW'
  const isNoRisk = flightRisk === null || flightRisk === undefined
  const isWeakBench = benchStrength === 'NONE' || benchStrength === 'WEAK'
  const isUnknownBench = benchStrength === 'UNKNOWN'

  // CRITICAL: titular en riesgo alto + banco vacío o débil
  if (isHighRisk && isWeakBench) return 'CRITICAL'

  // URGENT: riesgo medio (cualquier banco) O riesgo alto con banco moderado/fuerte
  if (isMediumRisk) return 'URGENT'
  if (isHighRisk) return 'URGENT'

  // NEEDS_ATTENTION: riesgo bajo/null + banco vacío o desconocido
  if ((isLowRisk || isNoRisk) && (isWeakBench || isUnknownBench)) return 'NEEDS_ATTENTION'

  // NO_DATA: sin riesgo conocido + banco moderado o fuerte
  if (isNoRisk) return 'NO_DATA'

  // NORMAL: riesgo bajo + banco moderado o fuerte
  return 'NORMAL'
}

// ════════════════════════════════════════════════════════════════════════════
// URGENCY SORT ORDER
// ════════════════════════════════════════════════════════════════════════════

const URGENCY_ORDER: Record<VulnerabilityLevel, number> = {
  CRITICAL: 0,
  URGENT: 1,
  NEEDS_ATTENTION: 2,
  NORMAL: 3,
  NO_DATA: 4,
}

export function sortByUrgency(rows: VulnerabilityRow[]): VulnerabilityRow[] {
  return [...rows].sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency])
}

// ════════════════════════════════════════════════════════════════════════════
// PORTADA NARRATIVE
// ════════════════════════════════════════════════════════════════════════════

export function getSuccessionPortadaNarrative(
  coverage: number,
  uncoveredCount: number,
  dominoOpenCount: number,
  criticalRows: VulnerabilityRow[],
  worstPosition: string | null
): PortadaNarrative {

  // PRIORIDAD 1: Dominó abierto (insight único FocalizaHR)
  if (dominoOpenCount > 0 && criticalRows.length > 0) {
    const worst = criticalRows[0]
    return {
      highlight: `${dominoOpenCount} dominó${dominoOpenCount > 1 ? 's' : ''} abierto${dominoOpenCount > 1 ? 's' : ''}`,
      suffix: worst.chainDetail
        ? ` — ${worst.chainDetail}`
        : ` — activar un sucesor deja otro cargo sin cobertura. Riesgo en cascada.`,
      ctaVariant: 'red',
      coachingTip: 'Un dominó abierto significa que resolver una vacante crea otra. Prioriza cerrar la cadena antes de mover piezas.'
    }
  }

  // PRIORIDAD 2: Posiciones críticas (flight risk + sin sucesor)
  const criticalCount = criticalRows.length
  if (criticalCount > 0) {
    return {
      highlight: `${criticalCount} posición${criticalCount > 1 ? 'es' : ''} en emergencia`,
      suffix: worstPosition
        ? ` — ${worstPosition} tiene titular en riesgo de fuga y banco vacío. Sin reemplazo si sale mañana.`
        : ' — titulares en riesgo de fuga sin sucesor preparado.',
      ctaVariant: 'red',
      coachingTip: 'Emergencia = titular puede irse + no hay nadie listo. Cada día sin actuar amplifica la exposición.'
    }
  }

  // PRIORIDAD 3: Cobertura baja
  if (coverage < 50) {
    return {
      highlight: `${coverage}% de cobertura`,
      suffix: ` — ${uncoveredCount} rol${uncoveredCount !== 1 ? 'es' : ''} crítico${uncoveredCount !== 1 ? 's' : ''} sin sucesor viable. La continuidad operativa está comprometida.`,
      ctaVariant: 'red',
      coachingTip: 'Menos de 50% de cobertura expone a la organización a disrupciones severas ante cualquier salida inesperada.'
    }
  }

  // PRIORIDAD 4: Cobertura media
  if (coverage < 80) {
    return {
      highlight: `${coverage}% de cobertura`,
      suffix: uncoveredCount > 0
        ? ` — ${uncoveredCount} posición${uncoveredCount !== 1 ? 'es' : ''} sin sucesor listo. Un movimiento inesperado expone a la organización.`
        : ' — pipeline en desarrollo pero aún sin la resiliencia necesaria.',
      ctaVariant: 'amber',
      coachingTip: 'Entre 50% y 80% es zona de atención. Prioriza las posiciones con titular en riesgo.'
    }
  }

  // PRIORIDAD 5: Pipeline saludable
  return {
    highlight: `${coverage}% de cobertura`,
    suffix: ' — pipeline saludable. Tu organización puede absorber movimientos sin impacto operativo.',
    ctaVariant: 'cyan',
    coachingTip: 'Mantén activo el monitoreo. Los pipelines se degradan si no se alimentan con nuevos candidatos.'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BENCH STRENGTH LABELS
// ════════════════════════════════════════════════════════════════════════════

export const BENCH_LABELS: Record<string, string> = {
  STRONG: 'Fuerte',
  MODERATE: 'Moderado',
  WEAK: 'Débil',
  NONE: 'Vacío',
  UNKNOWN: 'Sin datos',
}

export const BENCH_COLORS: Record<string, { text: string; bg: string; tesla: string }> = {
  STRONG:   { text: 'text-emerald-400', bg: 'bg-emerald-500/15', tesla: 'bg-emerald-400' },
  MODERATE: { text: 'text-cyan-400',    bg: 'bg-cyan-500/15',    tesla: 'bg-cyan-400' },
  WEAK:     { text: 'text-amber-400',   bg: 'bg-amber-500/15',   tesla: 'bg-amber-400' },
  NONE:     { text: 'text-red-400',     bg: 'bg-red-500/15',     tesla: 'bg-red-400' },
  UNKNOWN:  { text: 'text-slate-500',   bg: 'bg-slate-800/50',   tesla: 'bg-slate-600' },
}

// ════════════════════════════════════════════════════════════════════════════
// URGENCY LABELS
// ════════════════════════════════════════════════════════════════════════════

export const URGENCY_LABELS: Record<VulnerabilityLevel, string> = {
  CRITICAL: 'Emergencia',
  URGENT: 'Actuar ahora',
  NEEDS_ATTENTION: 'Buscar candidatos',
  NORMAL: 'Monitorear',
  NO_DATA: 'Sin datos de riesgo',
}

export const URGENCY_COLORS: Record<VulnerabilityLevel, { text: string; bg: string; dot: string }> = {
  CRITICAL:        { text: 'text-red-400',    bg: 'bg-red-500/10',    dot: 'bg-red-400' },
  URGENT:          { text: 'text-amber-400',  bg: 'bg-amber-500/10',  dot: 'bg-amber-400' },
  NEEDS_ATTENTION: { text: 'text-blue-400',   bg: 'bg-blue-500/10',   dot: 'bg-blue-400' },
  NORMAL:          { text: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  NO_DATA:         { text: 'text-slate-500',  bg: 'bg-slate-800/30',  dot: 'bg-slate-500' },
}

// ════════════════════════════════════════════════════════════════════════════
// FLIGHT RISK LABELS
// ════════════════════════════════════════════════════════════════════════════

export const FLIGHT_RISK_LABELS: Record<string, string> = {
  HIGH: 'Alto',
  MEDIUM: 'Medio',
  LOW: 'Bajo',
}

export const FLIGHT_RISK_COLORS: Record<string, string> = {
  HIGH: 'text-red-400',
  MEDIUM: 'text-amber-400',
  LOW: 'text-emerald-400',
}

// ════════════════════════════════════════════════════════════════════════════
// READINESS COLORS (for badges)
// ════════════════════════════════════════════════════════════════════════════

export const READINESS_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  READY_NOW:       { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  READY_1_2_YEARS: { bg: 'bg-cyan-500/15',    text: 'text-cyan-400' },
  READY_3_PLUS:    { bg: 'bg-amber-500/15',   text: 'text-amber-400' },
  NOT_VIABLE:      { bg: 'bg-red-500/15',     text: 'text-red-400' },
  // Legacy sync values
  ready_now:       { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  ready_1_year:    { bg: 'bg-cyan-500/15',    text: 'text-cyan-400' },
  ready_2_years:   { bg: 'bg-amber-500/15',   text: 'text-amber-400' },
  not_ready:       { bg: 'bg-red-500/15',     text: 'text-red-400' },
}

// ════════════════════════════════════════════════════════════════════════════
// CHAIN STATUS LABELS
// ════════════════════════════════════════════════════════════════════════════

export const CHAIN_LABELS: Record<string, string> = {
  covered: 'Cadena cubierta',
  domino_open: 'Dominó abierto',
  no_candidate: '—',
}

export const CHAIN_COLORS: Record<string, string> = {
  covered: 'text-emerald-400',
  domino_open: 'text-amber-400',
  no_candidate: 'text-slate-600',
}
