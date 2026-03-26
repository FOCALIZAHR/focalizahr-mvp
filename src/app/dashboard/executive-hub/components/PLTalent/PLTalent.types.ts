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
  standardCategory: string | null
  gapMonthly: number
  headcount: number
  avgRoleFit: number
  breakevenMonths: number | null
  departments: BrechaDepartment[]
}

export interface BrechaByCargoFamily {
  acotadoGroup: string
  label: string
  gapMonthly: number
  headcount: number
  avgRoleFit: number
  breakevenMonths: number | null
}

export interface BrechaProductivaData {
  totalGapMonthly: number
  totalPeople: number
  totalEvaluated: number
  avgSalary: number
  fteLoss: number
  byGerencia: BrechaGerencia[]
  byCargoFamily: BrechaByCargoFamily[]
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
  breakevenMonths: number | null // meses hasta que mantener cuesta más que desvincular
}

export interface SemaforoLegalData {
  totalPeople: number
  totalLiability: number
  monthlyGrowth: number
  breakevenMonthsGlobal: number | null
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
