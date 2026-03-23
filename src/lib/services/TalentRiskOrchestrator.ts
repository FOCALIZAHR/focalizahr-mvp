// ════════════════════════════════════════════════════════════════════════════
// TALENT RISK ORCHESTRATOR
// src/lib/services/TalentRiskOrchestrator.ts
// ════════════════════════════════════════════════════════════════════════════
// Cruza los 3 motores narrativos para generar un ExecutiveRiskPayload
// por empleado o en bulk. Solo backend — no toca UI.
//
// Motor 1: Role Fit × Antigüedad (TenureRoleFitDictionary)
// Motor 2: Impacto por Gerencia (BusinessImpactDictionary)
// Motor 3: Riesgo de Liderazgo (LeadershipRiskDictionary) — condicional
// + Sucesión + Financiero
//
// Arquitectura Enterprise:
// - Separation of Concerns: data (números) vs narratives (textos)
// - Salary cache: O(1) lookups por acotadoGroup (máx 5 queries totales)
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { SalaryConfigService, type SalaryResult } from './SalaryConfigService'
import { PositionAdapter } from './PositionAdapter'
import {
  calculateTenureMonths,
  calculateMonthlyGap,
  calculateFiniquito,
  calculateBreakevenMonths,
} from '@/lib/utils/TalentFinancialFormulas'
import {
  TENURE_ROLEFIT_DICTIONARY,
  getTenureTrend,
  getFitLevel,
  type TenureTrend,
  type TenureRoleFitNarrative,
} from '@/config/narratives/TenureRoleFitDictionary'
import {
  BUSINESS_IMPACT_DICTIONARY,
  type GerenciaImpact,
} from '@/config/narratives/BusinessImpactDictionary'
import {
  LEADERSHIP_RISK_DICTIONARY,
  type LeadershipImpact,
} from '@/config/narratives/LeadershipRiskDictionary'

// ════════════════════════════════════════════════════════════════════════════
// OUTPUT TYPES — Separation of Concerns
// ════════════════════════════════════════════════════════════════════════════

/** Data dura: números, IDs, booleanos, cálculos financieros */
export interface ExecutiveRiskData {
  // Identidad
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  gerenciaCategory: string | null

  // Métricas
  roleFitScore: number
  tenureMonths: number
  tenureTrend: TenureTrend
  salary: number
  salarySource: string

  // Liderazgo
  isLeader: boolean
  directReportsCount: number

  // Sucesión
  isIncumbentOfCriticalPosition: boolean
  criticalPositionTitle: string | null
  benchStrength: string | null
  hasSuccessor: boolean

  // Financiero
  monthlyGap: number
  finiquitoToday: number | null
  breakevenMonths: number | null
}

/** Narrativas: textos estáticos de diagnóstico, impacto y liderazgo */
export interface ExecutiveRiskNarratives {
  // Motor 1: Role Fit × Antigüedad
  tenureNarrative: TenureRoleFitNarrative

  // Motor 2: Impacto por Gerencia (null si categoría no mapeada)
  gerenciaImpact: GerenciaImpact | null

  // Motor 3: Liderazgo (null si no es líder o fit ≥ 75%)
  leadershipRisk: LeadershipImpact | null
}

/** Payload completo: data + narratives separados */
export interface ExecutiveRiskPayload {
  data: ExecutiveRiskData
  narratives: ExecutiveRiskNarratives
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class TalentRiskOrchestrator {

  // ──────────────────────────────────────────────────────────────────────────
  // SINGLE EMPLOYEE
  // ──────────────────────────────────────────────────────────────────────────

  static async buildPayload(
    employeeId: string,
    cycleId: string,
    accountId: string
  ): Promise<ExecutiveRiskPayload | null> {

    // 1. Fetch rating
    const rating = await prisma.performanceRating.findUnique({
      where: { cycleId_employeeId: { cycleId, employeeId } },
      select: { roleFitScore: true, riskQuadrant: true },
    })
    if (!rating || rating.roleFitScore === null) return null

    // 2. Fetch employee
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        fullName: true,
        position: true,
        hireDate: true,
        department: {
          select: {
            displayName: true,
            standardCategory: true,
            parent: { select: { standardCategory: true } },
          },
        },
        _count: { select: { directReports: { where: { status: 'ACTIVE' } } } },
      },
    })
    if (!employee || !employee.hireDate) return null

    // 3. Salary
    const acotado = employee.position
      ? PositionAdapter.classifyPosition(employee.position).acotadoGroup
      : null
    const salaryResult = await SalaryConfigService.getSalaryForAccount(accountId, acotado)

    // 4. Succession
    const criticalPos = await prisma.criticalPosition.findFirst({
      where: { incumbentId: employeeId, accountId, isActive: true },
      select: {
        positionTitle: true,
        benchStrength: true,
        candidates: { where: { status: 'ACTIVE' }, select: { id: true }, take: 1 },
      },
    })

    // 5. Compute
    return buildPayloadFromRow(
      rating.roleFitScore,
      rating.riskQuadrant,
      employee,
      salaryResult,
      criticalPos,
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BULK — O(1) salary lookups via cache
  // ──────────────────────────────────────────────────────────────────────────

  static async buildPayloads(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ): Promise<ExecutiveRiskPayload[]> {

    // 1. Batch fetch: ratings
    const ratings = await prisma.performanceRating.findMany({
      where: {
        cycleId,
        accountId,
        roleFitScore: { not: null },
        employee: {
          status: 'ACTIVE',
          isActive: true,
          ...(departmentIds?.length ? { departmentId: { in: departmentIds } } : {}),
        },
      },
      select: {
        employeeId: true,
        roleFitScore: true,
        riskQuadrant: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            hireDate: true,
            department: {
              select: {
                displayName: true,
                standardCategory: true,
                parent: { select: { standardCategory: true } },
              },
            },
            _count: { select: { directReports: { where: { status: 'ACTIVE' } } } },
          },
        },
      },
    })

    // 2. Batch fetch: critical positions
    const employeeIds = ratings.map(r => r.employeeId)
    const criticalPositions = await prisma.criticalPosition.findMany({
      where: { accountId, isActive: true, incumbentId: { in: employeeIds } },
      select: {
        incumbentId: true,
        positionTitle: true,
        benchStrength: true,
        candidates: { where: { status: 'ACTIVE' }, select: { id: true }, take: 1 },
      },
    })
    const criticalByIncumbent = new Map(
      criticalPositions.map(cp => [cp.incumbentId!, cp])
    )

    // 3. Salary cache — máx 5 queries (4 acotado groups + 1 base)
    const salaryCache = new Map<string, SalaryResult>()
    const CACHE_KEY_BASE = '__base__'
    salaryCache.set(CACHE_KEY_BASE, await SalaryConfigService.getSalaryForAccount(accountId))

    // Pre-populate unique acotado groups
    const uniqueGroups = new Set<string>()
    for (const r of ratings) {
      if (r.employee.position) {
        const group = PositionAdapter.classifyPosition(r.employee.position).acotadoGroup
        if (group && !salaryCache.has(group)) uniqueGroups.add(group)
      }
    }
    await Promise.all(
      Array.from(uniqueGroups).map(async group => {
        salaryCache.set(group, await SalaryConfigService.getSalaryForAccount(accountId, group))
      })
    )

    // 4. Build payloads — all lookups are O(1)
    const payloads: ExecutiveRiskPayload[] = []

    for (const r of ratings) {
      const emp = r.employee
      if (!emp.hireDate || r.roleFitScore === null) continue

      const acotado = emp.position
        ? PositionAdapter.classifyPosition(emp.position).acotadoGroup
        : null
      const salaryResult = salaryCache.get(acotado || CACHE_KEY_BASE) || salaryCache.get(CACHE_KEY_BASE)!

      const criticalPos = criticalByIncumbent.get(emp.id) || null

      const payload = buildPayloadFromRow(
        r.roleFitScore,
        r.riskQuadrant,
        emp,
        salaryResult,
        criticalPos,
      )
      if (payload) payloads.push(payload)
    }

    // Sort by monthlyGap desc
    payloads.sort((a, b) => b.data.monthlyGap - a.data.monthlyGap)

    return payloads
  }
}

// ════════════════════════════════════════════════════════════════════════════
// INTERNAL — Builds payload from pre-fetched data (no DB calls)
// ════════════════════════════════════════════════════════════════════════════

function buildPayloadFromRow(
  roleFitScore: number,
  riskQuadrant: string | null,
  employee: {
    id: string
    fullName: string
    position: string | null
    hireDate: Date | null
    department: {
      displayName: string
      standardCategory: string | null
      parent: { standardCategory: string | null } | null
    } | null
    _count: { directReports: number }
  },
  salaryResult: SalaryResult,
  criticalPos: {
    positionTitle: string
    benchStrength: string
    candidates: { id: string }[]
  } | null,
): ExecutiveRiskPayload | null {
  if (!employee.hireDate) return null

  const tenureMonths = calculateTenureMonths(employee.hireDate)
  const tenureTrend = getTenureTrend(tenureMonths)
  const fitLevel = getFitLevel(roleFitScore)
  const salary = salaryResult.monthlySalary

  // Financial — Single Source of Truth (TalentFinancialFormulas)
  const monthlyGap = calculateMonthlyGap(salary, roleFitScore)

  const finiquitoToday = riskQuadrant === 'BAJO_RENDIMIENTO'
    ? calculateFiniquito(salary, tenureMonths)
    : null

  const breakevenMonths = calculateBreakevenMonths(finiquitoToday, monthlyGap)

  // Narratives
  const gerenciaCategory = employee.department?.parent?.standardCategory
    || employee.department?.standardCategory
    || null

  const directReportsCount = employee._count.directReports
  const isLeader = directReportsCount > 0

  return {
    data: {
      employeeId: employee.id,
      employeeName: employee.fullName,
      position: employee.position || 'Sin cargo',
      departmentName: employee.department?.displayName || 'Sin departamento',
      gerenciaCategory,
      roleFitScore,
      tenureMonths,
      tenureTrend,
      salary,
      salarySource: salaryResult.source,
      isLeader,
      directReportsCount,
      isIncumbentOfCriticalPosition: !!criticalPos,
      criticalPositionTitle: criticalPos?.positionTitle || null,
      benchStrength: criticalPos?.benchStrength || null,
      hasSuccessor: (criticalPos?.candidates.length ?? 0) > 0,
      monthlyGap,
      finiquitoToday,
      breakevenMonths,
    },
    narratives: {
      tenureNarrative: TENURE_ROLEFIT_DICTIONARY[tenureTrend][fitLevel],
      gerenciaImpact: gerenciaCategory
        ? BUSINESS_IMPACT_DICTIONARY[gerenciaCategory] || null
        : null,
      leadershipRisk: (isLeader && monthlyGap > 0)
        ? LEADERSHIP_RISK_DICTIONARY
        : null,
    },
  }
}

