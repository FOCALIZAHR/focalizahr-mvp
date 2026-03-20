// ════════════════════════════════════════════════════════════════════════════
// TYPES - PLTalent
// src/app/dashboard/executive-hub/components/PLTalent/PLTalent.types.ts
// ════════════════════════════════════════════════════════════════════════════

export interface BrechaDepartment {
  departmentId: string
  departmentName: string
  gapMonthly: number
  headcount: number
  avgRoleFit: number
}

export interface BrechaGerencia {
  gerenciaId: string
  gerenciaName: string
  gapMonthly: number
  headcount: number
  avgRoleFit: number
  departments: BrechaDepartment[]
}

export interface BrechaProductivaData {
  totalGapMonthly: number
  totalPeople: number
  totalEvaluated: number
  byGerencia: BrechaGerencia[]
  salarySource: string
}

export type SemaphoreLevel = 'yellow' | 'orange' | 'red'

export interface SemaforoPersona {
  employeeId: string
  fullName: string
  position: string
  departmentName: string
  yearsOfService: number
  semaphore: SemaphoreLevel
  finiquitoToday: number
  finiquitoIn3Months: number
  monthlyImproductivity: number
  roleFitScore: number
}

export interface SemaforoLegalData {
  totalPeople: number
  totalLiability: number
  monthlyGrowth: number
  people: SemaforoPersona[]
  salarySource: string
}

export interface PLTalentData {
  brecha: BrechaProductivaData
  semaforo: SemaforoLegalData
}

export interface PLTalentProps {
  data: PLTalentData
}

export type PLTalentTabKey = 'brecha' | 'semaforo'

export interface PLTalentPortadaNarrative {
  statusBadge?: { label: string; showCheck?: boolean }
  prefix?: string
  highlight: string
  suffix: string
  ctaLabel: string
  ctaVariant: 'cyan'
  coachingTip: string
}
