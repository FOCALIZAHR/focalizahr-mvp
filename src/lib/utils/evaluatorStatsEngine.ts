// ════════════════════════════════════════════════════════════════════════════
// EVALUATOR STATS ENGINE
// src/lib/utils/evaluatorStatsEngine.ts
// ════════════════════════════════════════════════════════════════════════════
// Lógica de clasificación del conjunto de datos de evaluación
// PRINCIPIO: Clasificamos el CONJUNTO DE DATOS, NO al evaluador como persona
// ════════════════════════════════════════════════════════════════════════════

export type EvaluationStatus = 'OPTIMA' | 'CENTRAL' | 'SEVERA' | 'INDULGENTE'

export interface StatusConfig {
  label: string
  fullTerm: string
  tooltip: string
  semanticType: 'success' | 'info' | 'warning' | 'neutral'
}

export const STATUS_CONFIG: Record<EvaluationStatus, StatusConfig> = {
  OPTIMA: {
    label: 'ÓPTIMA',
    fullTerm: 'Evaluación Óptima',
    tooltip: 'Distribución saludable. Los datos distinguen claramente entre alto y bajo desempeño.',
    semanticType: 'success'
  },
  CENTRAL: {
    label: 'CENTRAL',
    fullTerm: 'Tendencia Central',
    tooltip: 'Poca diferenciación. Las notas se agrupan excesivamente en el medio.',
    semanticType: 'info'
  },
  SEVERA: {
    label: 'SEVERA',
    fullTerm: 'Sesgo de Severidad',
    tooltip: 'Promedio bajo. La evaluación está concentrada en el rango inferior de la escala.',
    semanticType: 'warning'
  },
  INDULGENTE: {
    label: 'INDULGENTE',
    fullTerm: 'Sesgo de Indulgencia',
    tooltip: 'Promedio inusualmente alto. Los datos sugieren una sobrevaloración generalizada.',
    semanticType: 'warning'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SEMANTIC COLOR MAPPING
// Uses Tailwind classes aligned with FocalizaHR design system:
//   success → emerald (#10B981 = var(--fhr-success))
//   info    → cyan    (#22D3EE = var(--fhr-cyan))
//   warning → amber   (#F59E0B = var(--fhr-warning))
//   neutral → slate
// ════════════════════════════════════════════════════════════════════════════

export function getSemanticColorClass(semanticType: 'success' | 'info' | 'warning' | 'neutral') {
  const map = {
    success: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      bgBar: 'bg-emerald-500/60',
      bgPing: 'bg-emerald-400',
      led: 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
    },
    info: {
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/20',
      bgBar: 'bg-cyan-500/60',
      bgPing: 'bg-cyan-400',
      led: 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]'
    },
    warning: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/20',
      bgBar: 'bg-amber-500/60',
      bgPing: 'bg-amber-400',
      led: 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
    },
    neutral: {
      text: 'text-slate-400',
      bg: 'bg-slate-500/20',
      bgBar: 'bg-slate-500/40',
      bgPing: 'bg-slate-400',
      led: 'bg-slate-400 shadow-[0_0_6px_rgba(100,116,139,0.4)]'
    }
  }
  return map[semanticType]
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

export function getCoachMessage(status: EvaluationStatus): string {
  const messages: Record<EvaluationStatus, string> = {
    OPTIMA: 'Distribución saludable. Estás diferenciando el talento correctamente.',
    CENTRAL: 'Tendencia central detectada. Las notas se agrupan demasiado; considera diferenciar más.',
    SEVERA: 'Promedio bajo detectado. Revisa si los estándares son realistas para el contexto.',
    INDULGENTE: 'Promedio alto detectado. Considera si la escala se está utilizando completamente.'
  }
  return messages[status]
}

export function generateTeamInsight(
  status: EvaluationStatus,
  topCompetency: string | null,
  lowCompetency: string | null
): string {
  const statusText = status === 'OPTIMA'
    ? 'una distribución saludable'
    : STATUS_CONFIG[status].fullTerm.toLowerCase()

  let insight = `El conjunto de datos presenta ${statusText}.`

  if (topCompetency && lowCompetency && topCompetency !== lowCompetency) {
    insight += ` El equipo destaca en ${topCompetency}, mientras que el área de desarrollo prioritaria es ${lowCompetency}.`
  } else if (topCompetency) {
    insight += ` El equipo destaca en ${topCompetency}.`
  }

  return insight
}

export function requiresAttention(status: EvaluationStatus): boolean {
  return status !== 'OPTIMA'
}
