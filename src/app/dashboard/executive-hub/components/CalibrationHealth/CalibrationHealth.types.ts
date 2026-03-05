// ════════════════════════════════════════════════════════════════════════════
// TYPES - CalibrationHealth
// src/app/dashboard/executive-hub/components/CalibrationHealth/CalibrationHealth.types.ts
// ════════════════════════════════════════════════════════════════════════════

export interface DepartmentCalibration {
  departmentId: string
  departmentName: string
  status: string
  statusLabel: string
  avgScore: number
  stdDev: number
  evaluatorCount: number
  distribution?: number[]
}

export interface DistBucket {
  level: number
  label: string
  idealPercent: number
  actualCount: number
  actualPercent: number
  deviation: number
}

export interface GerenciaHeatmapRow {
  gerencia: string
  OPTIMA: number
  CENTRAL: number
  SEVERA: number
  INDULGENTE: number
  total: number
  dominantStatus: string
}

export interface VarianceGerencia {
  gerencia: string
  evaluatorCount: number
  avgVariance: number
  level: 'BAJA' | 'MEDIA' | 'ALTA'
  evaluators: Array<{
    managerId: string
    managerName: string
    avgScore: number
    ratingsCount: number
  }>
}

export interface EvaluatorDetail {
  managerId: string
  managerName: string
  avg: number
  stdDev: number
  status: 'OPTIMA' | 'CENTRAL' | 'SEVERA' | 'INDULGENTE'
  ratingsCount: number
}

export interface GerenciaDepartmentStats {
  departmentId: string
  departmentName: string
  avg: number | null
  stdDev: number | null
  status: 'OPTIMA' | 'CENTRAL' | 'SEVERA' | 'INDULGENTE' | null
  evaluatorCount: number
  evaluators: EvaluatorDetail[]
}

export interface GerenciaCalibrationStats {
  gerenciaId: string
  gerenciaName: string
  avg: number | null
  stdDev: number | null
  status: 'OPTIMA' | 'CENTRAL' | 'SEVERA' | 'INDULGENTE' | null
  confidenceScore: number | null
  counts: {
    OPTIMA: number
    CENTRAL: number
    SEVERA: number
    INDULGENTE: number
  }
  evaluatorCount: number
  distribution: number[]
  departments: GerenciaDepartmentStats[]
  hasDepartmentWithBias: boolean
}

export interface IntegrityScore {
  score: number
  baseScore: number
  penalties: {
    bias: { type: string; points: number; reason: string } | null
    variance: { level: string; points: number; reason: string } | null
  }
  level: 'HIGH' | 'MEDIUM' | 'LOW'
  narrative: string
}

export interface CalibrationData {
  overallConfidence: number
  integrityScore?: IntegrityScore
  byStatus: Record<string, number>
  byDepartment: DepartmentCalibration[]
  worstDepartment: { name: string; status: string; statusLabel: string } | null
  orgDistribution?: {
    total: number
    buckets: DistBucket[]
  }
  bias?: {
    type: string | null
    message: string | null
    severity: string
    maxDeviation?: number
  }
  gerenciaHeatmap?: GerenciaHeatmapRow[]
  byGerencia?: GerenciaCalibrationStats[]
  variance?: {
    overall: 'BAJA' | 'MEDIA' | 'ALTA'
    overallVariance: number
    byGerencia: VarianceGerencia[]
  }
}

export interface CalibrationHealthProps {
  showManagerNames?: boolean
  data: CalibrationData
}

export type TabKey = 'distribution' | 'gerencia'

export interface PortadaNarrative {
  statusBadge?: { label: string; showCheck?: boolean }
  prefix?: string
  highlight: string
  suffix: string
  ctaLabel: string
  ctaVariant: 'cyan' | 'purple' | 'amber' | 'red'
  coachingTip: string
}

export interface ChartDataPoint {
  label: string
  target: number
  real: number
  count: number
  deviation: number
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 2: Tooltip types
// ════════════════════════════════════════════════════════════════════════════

export type TooltipColumn = 'SALUD' | 'OPTIMA' | 'CENTRAL' | 'SEVERA' | 'INDULGENTE' | 'EMPTY'

export interface TooltipData {
  title: string
  body: string
  action?: { label: string; type: string }
}
