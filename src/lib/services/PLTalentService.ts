// ════════════════════════════════════════════════════════════════════════════
// P&L TALENT SERVICE
// src/lib/services/PLTalentService.ts
// ════════════════════════════════════════════════════════════════════════════
// Calcula impacto financiero del talento (vistas AGREGADAS):
// - Brecha Productiva: roleFit < 75% → gap en pesos
// - Semáforo Legal: riskQuadrant BAJO_RENDIMIENTO → exposición legal
//
// Fórmulas financieras: TalentFinancialFormulas.ts (Single Source of Truth)
// Salary cache: Pre-fetch por acotadoGroup, O(1) lookups en loop
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { SalaryConfigService, type SalaryResult } from './SalaryConfigService'
import { PositionAdapter, ACOTADO_LABELS } from './PositionAdapter'
import {
  calculateTenureMonths,
  calculateMonthlyGap,
  calculateFiniquito,
  calculateBreakevenMonths,
} from '@/lib/utils/TalentFinancialFormulas'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
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

export interface SemaforoLegalData {
  totalPeople: number
  totalLiability: number
  monthlyGrowth: number
  breakevenMonthsGlobal: number | null
  people: SemaforoPersona[]
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
  breakevenMonths: number | null
}

// ════════════════════════════════════════════════════════════════════════════
// SALARY CACHE — Pre-fetch por acotadoGroup, O(1) en loop
// ════════════════════════════════════════════════════════════════════════════

const CACHE_KEY_BASE = '__base__'

async function buildSalaryCache(
  accountId: string,
  positions: (string | null)[]
): Promise<{ cache: Map<string, SalaryResult>; source: string }> {
  const cache = new Map<string, SalaryResult>()

  // 1. Base salary (fallback)
  const baseSalary = await SalaryConfigService.getSalaryForAccount(accountId)
  cache.set(CACHE_KEY_BASE, baseSalary)
  let source = baseSalary.source

  // 2. Collect unique acotado groups
  const uniqueGroups = new Set<string>()
  for (const pos of positions) {
    if (pos) {
      const group = PositionAdapter.classifyPosition(pos).acotadoGroup
      if (group && !cache.has(group)) uniqueGroups.add(group)
    }
  }

  // 3. Pre-fetch all groups in parallel (max 4 queries)
  await Promise.all(
    Array.from(uniqueGroups).map(async group => {
      const result = await SalaryConfigService.getSalaryForAccount(accountId, group)
      cache.set(group, result)
      if (result.source !== 'default_chile') source = result.source
    })
  )

  return { cache, source }
}

function lookupSalary(
  cache: Map<string, SalaryResult>,
  position: string | null
): SalaryResult {
  if (position) {
    const group = PositionAdapter.classifyPosition(position).acotadoGroup
    if (group && cache.has(group)) return cache.get(group)!
  }
  return cache.get(CACHE_KEY_BASE)!
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class PLTalentService {

  // ──────────────────────────────────────────────────────────────────────────
  // BRECHA PRODUCTIVA
  // Solo roleFitScore < 75% genera brecha
  // Fórmulas: TalentFinancialFormulas.ts
  // ──────────────────────────────────────────────────────────────────────────

  static async getBrechaProductiva(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ): Promise<BrechaProductivaData> {

    const where: any = {
      cycleId,
      accountId,
      roleFitScore: { not: null },
      employee: {
        status: 'ACTIVE',
        isActive: true,
        ...(departmentIds?.length ? { departmentId: { in: departmentIds } } : {}),
      },
    }

    const ratings = await prisma.performanceRating.findMany({
      where,
      select: {
        employeeId: true,
        roleFitScore: true,
        employee: {
          select: {
            id: true,
            position: true,
            department: {
              select: {
                id: true,
                displayName: true,
                standardCategory: true,
                parentId: true,
                parent: { select: { id: true, displayName: true, standardCategory: true } },
              },
            },
          },
        },
      },
    })

    // Salary cache — max 5 queries instead of N
    const { cache: salaryCache, source: salarySource } = await buildSalaryCache(
      accountId,
      ratings.map(r => r.employee.position)
    )

    // Aggregate by gerencia → department + by cargo family
    const gerenciaMap = new Map<string, {
      id: string; name: string; standardCategory: string | null
      departments: Map<string, { id: string; name: string; gaps: number[]; roleFits: number[] }>
    }>()
    const cargoMap = new Map<string, { gaps: number[]; roleFits: number[] }>()

    let totalGapMonthly = 0
    let totalPeople = 0
    let totalSalaries = 0

    for (const r of ratings) {
      const roleFit = r.roleFitScore as number
      const salaryResult = lookupSalary(salaryCache, r.employee.position)

      totalSalaries += salaryResult.monthlySalary

      if (roleFit >= 75) continue // No gap

      const dept = r.employee.department
      if (!dept) continue

      // Resolve gerencia (parent) and department
      const gerenciaId = dept.parent?.id || dept.id
      const gerenciaName = dept.parent?.displayName || dept.displayName
      const standardCategory = dept.parent?.standardCategory || dept.standardCategory || null
      const deptId = dept.id
      const deptName = dept.displayName

      const gap = calculateMonthlyGap(salaryResult.monthlySalary, roleFit)
      totalGapMonthly += gap
      totalPeople++

      // Accumulate in gerencia → department
      if (!gerenciaMap.has(gerenciaId)) {
        gerenciaMap.set(gerenciaId, { id: gerenciaId, name: gerenciaName, standardCategory, departments: new Map() })
      }
      const ger = gerenciaMap.get(gerenciaId)!
      if (!ger.departments.has(deptId)) {
        ger.departments.set(deptId, { id: deptId, name: deptName, gaps: [], roleFits: [] })
      }
      const d = ger.departments.get(deptId)!
      d.gaps.push(gap)
      d.roleFits.push(roleFit)

      // Accumulate by cargo family
      const acotado = r.employee.position
        ? PositionAdapter.classifyPosition(r.employee.position).acotadoGroup
        : null
      const cargoKey = acotado || 'sin_clasificar'
      if (!cargoMap.has(cargoKey)) {
        cargoMap.set(cargoKey, { gaps: [], roleFits: [] })
      }
      const c = cargoMap.get(cargoKey)!
      c.gaps.push(gap)
      c.roleFits.push(roleFit)
    }



    // Build result
    const byGerencia: BrechaGerencia[] = Array.from(gerenciaMap.values())
      .map(g => {
        const departments: BrechaDepartment[] = Array.from(g.departments.values()).map(d => ({
          departmentId: d.id,
          departmentName: d.name,
          gapMonthly: d.gaps.reduce((s, v) => s + v, 0),
          headcount: d.gaps.length,
          avgRoleFit: Math.round(d.roleFits.reduce((s, v) => s + v, 0) / d.roleFits.length),
        }))

        const allGaps = departments.reduce((s, d) => s + d.gapMonthly, 0)
        const allCount = departments.reduce((s, d) => s + d.headcount, 0)
        const allRoleFits = Array.from(g.departments.values()).flatMap(d => d.roleFits)
        const avgRoleFit = allRoleFits.length > 0
          ? Math.round(allRoleFits.reduce((s, v) => s + v, 0) / allRoleFits.length)
          : 0

        return {
          gerenciaId: g.id,
          gerenciaName: g.name,
          standardCategory: g.standardCategory,
          gapMonthly: allGaps,
          headcount: allCount,
          avgRoleFit,
          breakevenMonths: null, // calculated in frontend with semaforo cross-data
          departments: departments.sort((a, b) => b.gapMonthly - a.gapMonthly),
        }
      })
      .sort((a, b) => b.gapMonthly - a.gapMonthly)

    // Build cargo family aggregation
    const byCargoFamily = Array.from(cargoMap.entries())
      .map(([key, c]) => ({
        acotadoGroup: key,
        label: ACOTADO_LABELS[key] || key,
        gapMonthly: c.gaps.reduce((s, v) => s + v, 0),
        headcount: c.gaps.length,
        avgRoleFit: Math.round(c.roleFits.reduce((s, v) => s + v, 0) / c.roleFits.length),
        breakevenMonths: null, // calculated in frontend with semaforo cross-data
      }))
      .sort((a, b) => b.gapMonthly - a.gapMonthly)

    // FTE loss calculation
    const avgSalary = ratings.length > 0 ? Math.round(totalSalaries / ratings.length) : 0
    const fteLoss = avgSalary > 0 ? Math.round((totalGapMonthly / avgSalary) * 10) / 10 : 0

    return {
      totalGapMonthly,
      totalPeople,
      totalEvaluated: ratings.length,
      avgSalary,
      fteLoss,
      byGerencia,
      byCargoFamily,
      salarySource,
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SEMÁFORO LEGAL
  // Solo riskQuadrant = 'BAJO_RENDIMIENTO'
  // Fórmulas: TalentFinancialFormulas.ts
  // Semáforo: ≤3mo yellow, ≤6mo orange, >6mo red
  // ──────────────────────────────────────────────────────────────────────────

  static async getSemaforoLegal(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ): Promise<SemaforoLegalData> {

    const where: any = {
      cycleId,
      accountId,
      riskQuadrant: 'BAJO_RENDIMIENTO',
      employee: {
        status: 'ACTIVE',
        isActive: true,
        ...(departmentIds?.length ? { departmentId: { in: departmentIds } } : {}),
      },
    }

    const ratings = await prisma.performanceRating.findMany({
      where,
      select: {
        employeeId: true,
        roleFitScore: true,
        talentAnalyzedAt: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            hireDate: true,
            department: { select: { displayName: true } },
          },
        },
      },
    })

    // Salary cache — max 5 queries instead of N
    const { cache: salaryCache, source: salarySource } = await buildSalaryCache(
      accountId,
      ratings.map(r => r.employee.position)
    )

    const people: SemaforoPersona[] = []
    let totalLiability = 0

    for (const r of ratings) {
      const emp = r.employee
      if (!emp.hireDate) continue

      // Tenure — Single Source of Truth (TalentFinancialFormulas)
      const tenureMonths = calculateTenureMonths(new Date(emp.hireDate))
      const yearsOfService = Math.round((tenureMonths / 12) * 10) / 10

      // Semaphore: months with BAJO_RENDIMIENTO status
      const monthsInStatus = r.talentAnalyzedAt
        ? Math.floor((Date.now() - new Date(r.talentAnalyzedAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 0
      const semaphore: SemaphoreLevel = monthsInStatus <= 3 ? 'yellow' : monthsInStatus <= 6 ? 'orange' : 'red'

      // Salary — O(1) lookup from cache
      const salaryResult = lookupSalary(salaryCache, emp.position)
      const salary = salaryResult.monthlySalary

      // Financial — Single Source of Truth (TalentFinancialFormulas)
      const finiquitoToday = calculateFiniquito(salary, tenureMonths)
      const finiquitoIn3Months = calculateFiniquito(salary, tenureMonths + 3)

      const roleFit = r.roleFitScore ?? 0
      const monthlyImproductivity = calculateMonthlyGap(salary, roleFit)
      const breakevenMonths = calculateBreakevenMonths(finiquitoToday, monthlyImproductivity)

      totalLiability += finiquitoToday

      people.push({
        employeeId: emp.id,
        fullName: emp.fullName,
        position: emp.position || 'Sin cargo',
        departmentName: emp.department?.displayName || 'Sin departamento',
        yearsOfService,
        semaphore,
        finiquitoToday,
        finiquitoIn3Months,
        monthlyImproductivity,
        roleFitScore: roleFit,
        breakevenMonths,
      })
    }

    // Sort by severity: red first, then orange, then yellow
    const semaphoreOrder: Record<SemaphoreLevel, number> = { red: 0, orange: 1, yellow: 2 }
    people.sort((a, b) => semaphoreOrder[a.semaphore] - semaphoreOrder[b.semaphore])

    // Monthly growth: sum of monthly salary for all people (liability grows by ~1 salary/month per person)
    const monthlyGrowth = people.reduce((sum, p) => sum + Math.round(p.finiquitoIn3Months - p.finiquitoToday) / 3, 0)

    // Global breakeven: total finiquitos / total brecha mensual
    const totalMonthlyImprod = people.reduce((s, p) => s + p.monthlyImproductivity, 0)
    const breakevenMonthsGlobal = calculateBreakevenMonths(totalLiability, totalMonthlyImprod)

    return {
      totalPeople: people.length,
      totalLiability,
      monthlyGrowth: Math.round(monthlyGrowth),
      breakevenMonthsGlobal,
      people,
      salarySource,
    }
  }
}
