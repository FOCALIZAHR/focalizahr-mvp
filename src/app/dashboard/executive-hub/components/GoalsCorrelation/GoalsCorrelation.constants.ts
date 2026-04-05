// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Constants
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsCorrelation.constants.ts
// ════════════════════════════════════════════════════════════════════════════

import type { CorrelationQuadrant } from '@/lib/services/GoalsDiagnosticService'
// ════════════════════════════════════════════════════════════════════════════
// V2 SUB-FINDING CARDS — keyed by SubFinding.key
// ════════════════════════════════════════════════════════════════════════════

export interface SubFindingCardConfig {
  title: string
  segmentId: '1_ENTREGARON' | '2_NO_ENTREGARON' | '3_ORGANIZACIONAL'
  dotColor: string
  textColor: string
  borderColor: string
  showCost: boolean
}

export const SUBFINDING_CARDS: Record<string, SubFindingCardConfig> = {
  // Segment 1: ENTREGARON
  '1B_fugaProductiva': {
    title: 'Fuga de Talento Productivo',
    segmentId: '1_ENTREGARON',
    dotColor: 'bg-amber-400',
    textColor: 'text-amber-400',
    borderColor: 'border-red-500/20',
    showCost: true,
  },
  '1D_sostenibilidad': {
    title: 'Resultados Insostenibles',
    segmentId: '1_ENTREGARON',
    dotColor: 'bg-orange-400',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/20',
    showCost: false,
  },
  // Segment 2: NO ENTREGARON
  '2B_bonosInjustificados': {
    title: 'Bonos Sin Respaldo',
    segmentId: '2_NO_ENTREGARON',
    dotColor: 'bg-amber-400',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    showCost: true,
  },
  '2C_evaluadorProtege': {
    title: 'Evaluador Protege',
    segmentId: '2_NO_ENTREGARON',
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-400',
    borderColor: 'border-red-500/20',
    showCost: false,
  },
  '2A_noPuedeVsNoQuiere': {
    title: 'No Puede vs No Quiere',
    segmentId: '2_NO_ENTREGARON',
    dotColor: 'bg-slate-400',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-500/20',
    showCost: false,
  },
  '2E_sucesionRota': {
    title: 'Sucesión Sin Resultados',
    segmentId: '2_NO_ENTREGARON',
    dotColor: 'bg-violet-400',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/20',
    showCost: false,
  },
  // Segment 3: ORGANIZACIONAL
  '4_blastRadius': {
    title: 'Líder con Equipo Desconectado',
    segmentId: '3_ORGANIZACIONAL',
    dotColor: 'bg-rose-400',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/20',
    showCost: false,
  },
  '3B_sesgoSistematico': {
    title: 'Sesgo Sistemático',
    segmentId: '3_ORGANIZACIONAL',
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-400',
    borderColor: 'border-red-500/20',
    showCost: false,
  },
  '3A_pearsonBajo': {
    title: 'Competencias No Predicen',
    segmentId: '3_ORGANIZACIONAL',
    dotColor: 'bg-violet-400',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/20',
    showCost: false,
  },
  '3D_calibracionInjusta': {
    title: 'Calibración Injusta',
    segmentId: '3_ORGANIZACIONAL',
    dotColor: 'bg-sky-400',
    textColor: 'text-sky-400',
    borderColor: 'border-sky-500/20',
    showCost: false,
  },
}

// Map SubFinding key → narrative dictionary key
export const SUBFINDING_TO_NARRATIVE: Record<string, string> = {
  '1B_fugaProductiva': 'fugaProductiva',
  '1D_sostenibilidad': 'sostenibilidad',
  '2B_bonosInjustificados': 'bonosSinRespaldo',
  '2C_evaluadorProtege': 'evaluadorProtege',
  '2A_noPuedeVsNoQuiere': 'noSabeVsNoQuiere',
  '2E_sucesionRota': 'sucesionRota',
  '4_blastRadius': 'blastRadius',
  '3B_sesgoSistematico': 'sesgoSistematico',
  '3A_pearsonBajo': 'pearsonRoleFitMetas',
  '3D_calibracionInjusta': 'calibracionJusta',
}

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION QUADRANT MAP — SSoT (used by GoalsCascada + AnomalíasView)
// ════════════════════════════════════════════════════════════════════════════

export const COMP_QUADRANT_MAP: Record<string, string> = {
  '1D_sostenibilidad': 'HIDDEN_PERFORMER',
  '2B_bonosInjustificados': 'PERCEPTION_BIAS',
  '2A_noPuedeVsNoQuiere': 'DOUBLE_RISK',
}

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
    color: 'text-cyan-400',
    dotColor: 'fill-cyan-400',
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
    color: 'text-slate-400',
    dotColor: 'fill-slate-400',
    bgColor: 'rgba(148, 163, 184, 0.08)',
  },
  DOUBLE_RISK: {
    label: 'Doble Riesgo',
    color: 'text-violet-400',
    dotColor: 'fill-violet-400',
    bgColor: 'rgba(167, 139, 250, 0.08)',
  },
  NO_GOALS: {
    label: 'Sin Metas',
    color: 'text-slate-500',
    dotColor: 'fill-slate-500',
    bgColor: 'transparent',
  },
}

