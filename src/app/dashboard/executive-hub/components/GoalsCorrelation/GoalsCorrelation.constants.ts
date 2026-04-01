// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Constants
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsCorrelation.constants.ts
// ════════════════════════════════════════════════════════════════════════════

import type { CorrelationQuadrant } from '@/lib/services/GoalsDiagnosticService'

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVE CARD CONFIG
// ════════════════════════════════════════════════════════════════════════════

export const NARRATIVE_CARDS = [
  {
    key: 'fugaProductiva' as const,
    title: 'Fuga de Talento Productivo',
    description: 'En riesgo de fuga con metas sobre 80%. Costo de reemplazo cuantificado.',
    dotColor: 'bg-red-400',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/20',
    showCost: true,
  },
  {
    key: 'bonosSinRespaldo' as const,
    title: 'Bonos Sin Respaldo',
    description: 'Evaluación 360° alta pero metas bajo 40%. Compensación sin justificación.',
    dotColor: 'bg-amber-400',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    showCost: true,
  },
  {
    key: 'talentoInvisible' as const,
    title: 'Talento Invisible',
    description: 'Metas sobre 80% pero evaluación baja. Entregando resultados sin reconocimiento.',
    dotColor: 'bg-purple-400',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/20',
    showCost: false,
  },
  {
    key: 'ejecutoresDesconectados' as const,
    title: 'Ejecutores Desconectados',
    description: 'Metas altas pero engagement crítico. Ejecutan por inercia, la fuga llega sin aviso.',
    dotColor: 'bg-cyan-400',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/20',
    showCost: false,
  },
  {
    key: 'noSabeVsNoQuiere' as const,
    title: 'No Sabe vs No Quiere',
    description: 'Metas bajo 40%. Diagnóstico: brecha de competencias o problema motivacional.',
    dotColor: 'bg-slate-400',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-500/20',
    showCost: false,
  },
] as const

// ════════════════════════════════════════════════════════════════════════════
// QUADRANT CONFIG (for scatter plot)
// ════════════════════════════════════════════════════════════════════════════

export const QUADRANT_CONFIG: Record<CorrelationQuadrant, {
  label: string
  color: string
  dotColor: string
  bgColor: string
}> = {
  CONSISTENT: {
    label: 'Consistente',
    color: 'text-emerald-400',
    dotColor: 'fill-emerald-400',
    bgColor: 'rgba(16, 185, 129, 0.08)',
  },
  PERCEPTION_BIAS: {
    label: 'Sesgo Percepción',
    color: 'text-amber-400',
    dotColor: 'fill-amber-400',
    bgColor: 'rgba(245, 158, 11, 0.08)',
  },
  HIDDEN_PERFORMER: {
    label: 'Talento Oculto',
    color: 'text-purple-400',
    dotColor: 'fill-purple-400',
    bgColor: 'rgba(167, 139, 250, 0.08)',
  },
  DOUBLE_RISK: {
    label: 'Doble Riesgo',
    color: 'text-red-400',
    dotColor: 'fill-red-400',
    bgColor: 'rgba(239, 68, 68, 0.08)',
  },
  NO_GOALS: {
    label: 'Sin Metas',
    color: 'text-slate-500',
    dotColor: 'fill-slate-500',
    bgColor: 'transparent',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// TAB CONFIG
// ════════════════════════════════════════════════════════════════════════════

export const TABS = [
  { key: 'narrativas' as const, label: 'Narrativas' },
  { key: 'analisis' as const, label: 'Análisis' },
  { key: 'gerencias' as const, label: 'Gerencias' },
] as const
