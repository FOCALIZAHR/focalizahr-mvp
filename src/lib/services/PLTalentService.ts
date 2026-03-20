// ════════════════════════════════════════════════════════════════════════════
// P&L TALENT SERVICE
// src/lib/services/PLTalentService.ts
// ════════════════════════════════════════════════════════════════════════════
// Calcula impacto financiero del talento:
// - Brecha Productiva: roleFit < 75% → gap en pesos
// - Semáforo Legal: riskQuadrant BAJO_RENDIMIENTO → exposición legal
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { SalaryConfigService } from './SalaryConfigService'
import { PositionAdapter } from './PositionAdapter'

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

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class PLTalentService {

  // ──────────────────────────────────────────────────────────────────────────
  // BRECHA PRODUCTIVA
  // Solo roleFitScore < 75% genera brecha
  // Fórmula: brecha = salario × ((75 - roleFitScore) / 100)
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
                parentId: true,
                parent: { select: { id: true, displayName: true } },
              },
            },
          },
        },
      },
    })

    // Get base salary for fallback
    const baseSalary = await SalaryConfigService.getSalaryForAccount(accountId)
    let salarySource = baseSalary.source

    // Aggregate by gerencia → department
    const gerenciaMap = new Map<string, {
      id: string; name: string
      departments: Map<string, { id: string; name: string; gaps: number[]; roleFits: number[] }>
    }>()

    let totalGapMonthly = 0
    let totalPeople = 0

    for (const r of ratings) {
      const roleFit = r.roleFitScore as number
      if (roleFit >= 75) continue // No gap

      const dept = r.employee.department
      if (!dept) continue

      // Resolve gerencia (parent) and department
      const gerenciaId = dept.parent?.id || dept.id
      const gerenciaName = dept.parent?.displayName || dept.displayName
      const deptId = dept.id
      const deptName = dept.displayName

      // Calculate salary
      const acotado = r.employee.position
        ? PositionAdapter.classifyPosition(r.employee.position).acotadoGroup
        : null
      const salaryResult = acotado
        ? await SalaryConfigService.getSalaryForAccount(accountId, acotado)
        : baseSalary
      if (salaryResult.source !== 'default_chile') salarySource = salaryResult.source

      const gap = Math.round(salaryResult.monthlySalary * ((75 - roleFit) / 100))
      totalGapMonthly += gap
      totalPeople++

      // Accumulate in gerencia → department
      if (!gerenciaMap.has(gerenciaId)) {
        gerenciaMap.set(gerenciaId, { id: gerenciaId, name: gerenciaName, departments: new Map() })
      }
      const ger = gerenciaMap.get(gerenciaId)!
      if (!ger.departments.has(deptId)) {
        ger.departments.set(deptId, { id: deptId, name: deptName, gaps: [], roleFits: [] })
      }
      const d = ger.departments.get(deptId)!
      d.gaps.push(gap)
      d.roleFits.push(roleFit)
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
          gapMonthly: allGaps,
          headcount: allCount,
          avgRoleFit,
          departments: departments.sort((a, b) => b.gapMonthly - a.gapMonthly),
        }
      })
      .sort((a, b) => b.gapMonthly - a.gapMonthly)

    return {
      totalGapMonthly,
      totalPeople,
      totalEvaluated: ratings.length,
      byGerencia,
      salarySource,
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SEMÁFORO LEGAL
  // Solo riskQuadrant = 'BAJO_RENDIMIENTO'
  // Finiquito = salario × (min(años, 11) + 1)
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

    const baseSalary = await SalaryConfigService.getSalaryForAccount(accountId)
    let salarySource = baseSalary.source

    const people: SemaforoPersona[] = []
    let totalLiability = 0

    for (const r of ratings) {
      const emp = r.employee
      if (!emp.hireDate) continue

      // Years of service (capped at 11 per Chilean labor law)
      const msService = Date.now() - new Date(emp.hireDate).getTime()
      const yearsRaw = msService / (1000 * 60 * 60 * 24 * 365.25)
      const yearsOfService = Math.round(yearsRaw * 10) / 10
      const yearsCapped = Math.min(yearsRaw, 11)

      // Semaphore: months with BAJO_RENDIMIENTO status
      const monthsInStatus = r.talentAnalyzedAt
        ? Math.floor((Date.now() - new Date(r.talentAnalyzedAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 0
      const semaphore: SemaphoreLevel = monthsInStatus <= 3 ? 'yellow' : monthsInStatus <= 6 ? 'orange' : 'red'

      // Salary
      const acotado = emp.position
        ? PositionAdapter.classifyPosition(emp.position).acotadoGroup
        : null
      const salaryResult = acotado
        ? await SalaryConfigService.getSalaryForAccount(accountId, acotado)
        : baseSalary
      if (salaryResult.source !== 'default_chile') salarySource = salaryResult.source
      const salary = salaryResult.monthlySalary

      // Finiquito: salary × (min(years, 11) + 1 mes preaviso)
      const finiquitoToday = Math.round(salary * (yearsCapped + 1))
      const finiquitoIn3Months = Math.round(salary * (Math.min(yearsRaw + 0.25, 11) + 1))

      // Monthly improductivity (same brecha formula)
      const roleFit = r.roleFitScore ?? 0
      const monthlyImproductivity = roleFit < 75
        ? Math.round(salary * ((75 - roleFit) / 100))
        : 0

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
      })
    }

    // Sort by severity: red first, then orange, then yellow
    const semaphoreOrder: Record<SemaphoreLevel, number> = { red: 0, orange: 1, yellow: 2 }
    people.sort((a, b) => semaphoreOrder[a.semaphore] - semaphoreOrder[b.semaphore])

    // Monthly growth: sum of monthly salary for all people (liability grows by ~1 salary/month per person)
    const monthlyGrowth = people.reduce((sum, p) => sum + Math.round(p.finiquitoIn3Months - p.finiquitoToday) / 3, 0)

    return {
      totalPeople: people.length,
      totalLiability,
      monthlyGrowth: Math.round(monthlyGrowth),
      people,
      salarySource,
    }
  }
}
