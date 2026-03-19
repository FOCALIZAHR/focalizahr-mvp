// ════════════════════════════════════════════════════════════════════════════
// TYPES — Capacidades Intelligence (extraídos de RoleFitMatrix.tsx)
// ════════════════════════════════════════════════════════════════════════════

export interface LayerGerenciaFit {
  avgRoleFit: number
  count: number
  topGaps: Array<{ competency: string; gap: number; affectedCount: number }>
}

export interface CompetencyGap {
  competency: string
  competencyCode: string
  expected: number
  actual: number
  gap: number
  affectedCount: number
  affectedPercent: number
}

export interface FocusClassification {
  competencyCode: string
  competencyName: string
  impact: 'BLOQUEA' | 'IMPULSA' | 'NEUTRO'
  gap: number
  actual: number
  expected: number
  priority: number
}

export interface StrategicFocusResult {
  focus: string
  focusLabel: string
  blockers: FocusClassification[]
  enablers: FocusClassification[]
  neutral: FocusClassification[]
}

export interface AvailableFocus {
  key: string
  label: string
  description: string
}

export interface CellDrillDown {
  summary: {
    avgRoleFit: number
    headcount: number
    cargos: number
    expectedFit: number
    gap: number
    status: string
  }
  competencyGaps: CompetencyGap[]
  topEmployees: Array<{ name: string; position: string; roleFitScore: number }>
}

export interface CapacidadesData {
  overall: number
  byLayer: Record<string, number>
  matrix: Record<string, Record<string, LayerGerenciaFit>>
  worstCell: { layer: string; gerencia: string; score: number }
  investmentPriorities: Array<{
    layer: string
    layerLabel: string
    gerencia: string
    avgRoleFit: number
    gap: number
    headcount: number
    topGaps: string[]
  }>
  strategicFocus?: StrategicFocusResult[]
  availableFoci?: AvailableFocus[]
}

export type CapacidadesTab = 'overview' | 'heatmap' | 'focus'
