// ════════════════════════════════════════════════════════════════════════════
// PDI GUIDED EXPERIENCE - Shared Types
// src/components/pdi/guided/types.ts
// ════════════════════════════════════════════════════════════════════════════

export type Category = 'URGENTE' | 'IMPACTO' | 'QUICK_WIN' | 'POTENCIAR'

export interface EnrichedGap {
  competencyCode: string
  competencyName: string
  actualScore: number
  targetScore: number
  rawGap: number
  status: 'CRITICAL' | 'IMPROVE' | 'MATCH' | 'EXCEEDS'
  category: Category
  categoryLabel: string
  categoryColor: string
  narrative: string
  coachingTip: string
}

export interface RoleFitResult {
  roleFitScore: number
  performanceTrack?: string
  gaps: Array<{
    competencyCode: string
    competencyName: string
    actualScore: number
    targetScore: number
    rawGap: number
    status: 'CRITICAL' | 'IMPROVE' | 'MATCH' | 'EXCEEDS'
  }>
  summary: {
    totalCompetencies: number
    matching: number
    exceeds: number
    needsImprovement: number
    critical: number
  }
}

export const CATEGORY_CONFIG = {
  URGENTE: {
    label: 'Urgente',
    description: 'Brechas críticas que impactan el desempeño actual',
    color: '#EF4444',
    ctaText: 'Abordar Ahora'
  },
  IMPACTO: {
    label: 'Alto Impacto',
    description: 'Competencias clave para el siguiente nivel',
    color: '#F59E0B',
    ctaText: 'Desarrollar'
  },
  QUICK_WIN: {
    label: 'Quick Win',
    description: 'Mejoras rápidas con alto retorno',
    color: '#10B981',
    ctaText: 'Activar'
  },
  POTENCIAR: {
    label: 'Potenciar',
    description: 'Fortalezas para expandir influencia',
    color: '#22D3EE',
    ctaText: 'Expandir'
  }
} as const
