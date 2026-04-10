// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE INTELLIGENCE SERVICE — Motor de cruces IA × Talento
// src/lib/services/WorkforceIntelligenceService.ts
// ════════════════════════════════════════════════════════════════════════════
// Fase 5: Cruza exposición IA (OnetOccupation) con datos de personas
// (PerformanceRating, Employee, Salary, Tenure, Succession).
//
// Arquitectura: Bulk Enrichment + Pure Detection
//   Paso 1: buildEnrichedDataset() carga TODO una vez (4 queries)
//   Paso 2: cada método detecta sobre el dataset enriquecido (0 queries)
//
// 10 métodos: zombies, flightRisk, redundancy, adoptionRisk,
// seniorityCompression, inertiaCost, liberatedFTEs, severance,
// retentionPriority, organizationDiagnostic
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { SalaryConfigService } from './SalaryConfigService'
import {
  calculateTenureMonths,
  calculateMonthlyGap,
  calculateFiniquito,
} from '@/lib/utils/TalentFinancialFormulas'

// ════════════════════════════════════════════════════════════════════════════
// TYPES — EnrichedEmployee (el dataset central)
// ════════════════════════════════════════════════════════════════════════════

export interface EnrichedEmployee {
  employeeId: string
  employeeName: string
  position: string
  departmentId: string
  departmentName: string
  standardCategory: string | null
  acotadoGroup: string | null
  standardJobLevel: string | null
  tenureMonths: number
  hireDate: Date
  isLeader: boolean
  directReportsCount: number
  // Exposure
  socCode: string | null
  observedExposure: number
  automationShare: number
  augmentationShare: number
  jobZone: number
  // Performance
  roleFitScore: number
  riskQuadrant: string | null
  mobilityQuadrant: string | null
  potentialEngagement: number | null
  potentialAspiration: number | null
  potentialAbility: number | null
  goalsRawPercent: number | null
  nineBoxPosition: string | null
  // Financial
  salary: number
  monthlyGap: number
  finiquitoToday: number | null
  // Succession
  isIncumbentOfCriticalPosition: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// RESULT TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface PersonAlert {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  observedExposure: number
  roleFitScore: number
  salary: number
  financialImpact: number
  // v3.1 — segment fields para agrupacion frontend
  acotadoGroup: string | null
  standardCategory: string | null
  metasCompliance: number | null  // = goalsRawPercent (0-100)
}

export interface TalentZombieResult {
  count: number
  persons: PersonAlert[]
  totalInertiaCost: number
  confidence: 'high' | 'medium' | 'low'
}

export interface AugmentedFlightRiskResult {
  count: number
  persons: (PersonAlert & { replacementCost: number })[]
  totalReplacementCost: number
  confidence: 'high' | 'medium' | 'low'
}

export interface RedundantPair {
  socCodeA: string
  titleA: string
  socCodeB: string
  titleB: string
  overlapPercent: number
  departmentName: string
  headcountA: number
  headcountB: number
  estimatedSavings: number
}

export interface RedundancyResult {
  pairs: RedundantPair[]
  totalEstimatedSavings: number
  confidence: 'high' | 'medium' | 'low'
}

export interface DepartmentRisk {
  departmentId: string
  departmentName: string
  avgExposure: number
  avgEngagement: number
  headcount: number
}

export interface AdoptionRiskResult {
  departments: DepartmentRisk[]
  confidence: 'high' | 'medium' | 'low'
}

export interface CompressionOpportunity {
  position: string
  departmentName: string
  seniorSalary: number
  juniorSalary: number
  annualSavings: number
  juniorCandidate: { name: string; ability: number; engagement: number } | null
}

export interface SeniorityCompressionResult {
  opportunities: CompressionOpportunity[]
  totalAnnualSavings: number
  confidence: 'high' | 'medium' | 'low'
}

export interface DepartmentCost {
  departmentName: string
  departmentId: string
  monthlyCost: number
  annualCost: number
  headcount: number
  avgExposure: number
}

export interface InertiaCostResult {
  byDepartment: DepartmentCost[]
  totalMonthly: number
  totalAnnual: number
  confidence: 'high' | 'medium' | 'low'
}

export interface DepartmentFTE {
  departmentName: string
  departmentId: string
  liberatedFTEs: number
  monthlySavings: number
  headcount: number
}

export interface LiberatedFTEsResult {
  byDepartment: DepartmentFTE[]
  totalFTEs: number
  totalMonthlySavings: number
  confidence: 'high' | 'medium' | 'low'
}

export interface SeveranceLiabilityResult {
  totalSeverance: number
  monthlyFTESavings: number
  paybackMonths: number
  affectedCount: number
  confidence: 'high' | 'medium' | 'low'
}

export interface RetentionEntry {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  retentionScore: number
  observedExposure: number
  roleFitScore: number
  isCriticalPosition: boolean
  tier: 'intocable' | 'valioso' | 'neutro' | 'prescindible'
  // v3.1 — segment fields para agrupacion frontend
  acotadoGroup: string | null
  standardCategory: string | null
  metasCompliance: number | null  // = goalsRawPercent (0-100)
}

export interface RetentionPriorityResult {
  ranking: RetentionEntry[]
  intocablesCount: number
  prescindiblesCount: number
  confidence: 'high' | 'medium' | 'low'
}

// v3.1 — Brecha de productividad
// SUM(salary × (1 - roleFit/100)) donde roleFit < 70
// Mide el costo mensual de salarios pagados por rendimiento no entregado
export interface SegmentGap {
  key: string                // "Profesionales de Finanzas"
  acotadoGroup: string | null
  standardCategory: string | null
  total: number              // gap mensual en CLP
  count: number              // personas afectadas
}

export interface ProductivityGapResult {
  total: number              // gap mensual total CLP
  affectedCount: number      // personas con roleFit < 70
  bySegment: SegmentGap[]    // ordenado por total desc
  confidence: 'high' | 'medium' | 'low'
}

export interface Alert {
  type: string
  title: string
  financialImpact: number
  affectedCount: number
  priority: number
}

export interface OrganizationDiagnostic {
  zombies: TalentZombieResult
  flightRisk: AugmentedFlightRiskResult
  redundancy: RedundancyResult
  adoptionRisk: AdoptionRiskResult
  seniorityCompression: SeniorityCompressionResult
  inertiaCost: InertiaCostResult
  liberatedFTEs: LiberatedFTEsResult
  severanceLiability: SeveranceLiabilityResult
  retentionPriority: RetentionPriorityResult
  productivityGap: ProductivityGapResult  // v3.1
  topAlerts: Alert[]
  netROI: number
  paybackMonths: number
  totalEmployees: number
  enrichedCount: number
  confidence: 'high' | 'medium' | 'low'
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function normalizePosition(text: string): string {
  return text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s\-\/&.]/g, '').replace(/\s+/g, ' ')
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class WorkforceIntelligenceService {

  // ──────────────────────────────────────────────────────────────────────
  // BULK ENRICHMENT — carga todo una vez
  // ──────────────────────────────────────────────────────────────────────

  static async buildEnrichedDataset(
    accountId: string,
    departmentIds?: string[]
  ): Promise<EnrichedEmployee[]> {
    const deptFilter = departmentIds?.length ? { departmentId: { in: departmentIds } } : {}

    // Query A: Employees
    const employees = await prisma.employee.findMany({
      where: { accountId, isActive: true, status: 'ACTIVE', ...deptFilter },
      select: {
        id: true, fullName: true, position: true, hireDate: true,
        departmentId: true, standardJobLevel: true, acotadoGroup: true,
        department: { select: { displayName: true, standardCategory: true } },
        _count: { select: { directReports: { where: { status: 'ACTIVE', accountId } } } },
      },
    })

    if (employees.length === 0) return []

    // Query B: Latest cycle + ratings
    const cycle = await prisma.performanceCycle.findFirst({
      where: { accountId, status: { in: ['ACTIVE', 'IN_REVIEW', 'COMPLETED'] }, performanceRatings: { some: { roleFitScore: { not: null } } } },
      orderBy: { endDate: 'desc' },
      select: { id: true },
    })

    const ratingsMap = new Map<string, any>()
    if (cycle) {
      const ratings = await prisma.performanceRating.findMany({
        where: { cycleId: cycle.id, accountId, roleFitScore: { not: null } },
        select: {
          employeeId: true, roleFitScore: true, riskQuadrant: true, mobilityQuadrant: true,
          potentialEngagement: true, potentialAspiration: true, potentialAbility: true,
          goalsRawPercent: true, nineBoxPosition: true,
        },
      })
      for (const r of ratings) ratingsMap.set(r.employeeId, r)
    }

    // Query C: OccupationMapping → OnetOccupation
    const positionTexts = [...new Set(employees.map(e => e.position).filter(Boolean).map(p => normalizePosition(p!)))]
    const mappings = await prisma.occupationMapping.findMany({
      where: { accountId, positionText: { in: positionTexts }, socCode: { not: null } },
      select: { positionText: true, socCode: true },
    })
    const posToSoc = new Map(mappings.map(m => [m.positionText, m.socCode!]))

    const uniqueSocs = [...new Set(mappings.map(m => m.socCode!).filter(Boolean))]
    const occupations = uniqueSocs.length > 0
      ? await prisma.onetOccupation.findMany({
          where: { socCode: { in: uniqueSocs } },
          select: { socCode: true, observedExposure: true, automationShare: true, augmentationShare: true, jobZone: true, betaScore: true },
        })
      : []
    const socToOcc = new Map(occupations.map(o => [o.socCode, o]))

    // Query D: Salary cache
    const salaryCache = new Map<string, number>()
    const groups = [...new Set(employees.map(e => e.acotadoGroup).filter(Boolean))] as string[]
    for (const g of groups) {
      const sr = await SalaryConfigService.getSalaryForAccount(accountId, g)
      salaryCache.set(g, sr.monthlySalary)
    }
    const defaultSalary = (await SalaryConfigService.getSalaryForAccount(accountId)).monthlySalary

    // Query E: Critical positions
    const criticalIncumbents = new Set(
      (await prisma.criticalPosition.findMany({
        where: { accountId, isActive: true, incumbentId: { not: null } },
        select: { incumbentId: true },
      })).map(cp => cp.incumbentId!)
    )

    // ENRICH
    return employees.map(emp => {
      const rating = ratingsMap.get(emp.id)
      const normalized = emp.position ? normalizePosition(emp.position) : ''
      const socCode = posToSoc.get(normalized) ?? null
      const occ = socCode ? socToOcc.get(socCode) : null
      const salary = salaryCache.get(emp.acotadoGroup ?? '') ?? defaultSalary
      const roleFitScore = rating?.roleFitScore ?? 0
      const tenureMonths = emp.hireDate ? calculateTenureMonths(emp.hireDate) : 0

      return {
        employeeId: emp.id,
        employeeName: emp.fullName,
        position: emp.position ?? '',
        departmentId: emp.departmentId ?? '',
        departmentName: emp.department?.displayName ?? '',
        standardCategory: emp.department?.standardCategory ?? null,
        acotadoGroup: emp.acotadoGroup ?? null,
        standardJobLevel: emp.standardJobLevel ?? null,
        tenureMonths,
        hireDate: emp.hireDate ?? new Date(),
        isLeader: emp._count.directReports > 0,
        directReportsCount: emp._count.directReports,
        socCode,
        observedExposure: occ?.observedExposure ?? occ?.betaScore ?? 0,
        automationShare: occ?.automationShare ?? 0,
        augmentationShare: occ?.augmentationShare ?? 0,
        jobZone: occ?.jobZone ?? 3,
        roleFitScore,
        riskQuadrant: rating?.riskQuadrant ?? null,
        mobilityQuadrant: rating?.mobilityQuadrant ?? null,
        potentialEngagement: rating?.potentialEngagement ?? null,
        potentialAspiration: rating?.potentialAspiration ?? null,
        potentialAbility: rating?.potentialAbility ?? null,
        goalsRawPercent: rating?.goalsRawPercent ?? null,
        nineBoxPosition: rating?.nineBoxPosition ?? null,
        salary,
        monthlyGap: calculateMonthlyGap(salary, roleFitScore),
        finiquitoToday: roleFitScore < 75 ? calculateFiniquito(salary, tenureMonths) : null,
        isIncumbentOfCriticalPosition: criticalIncumbents.has(emp.id),
      }
    })
  }

  // ──────────────────────────────────────────────────────────────────────
  // 1. TALENT ZOMBIES
  // ──────────────────────────────────────────────────────────────────────

  static detectTalentZombies(enriched: EnrichedEmployee[]): TalentZombieResult {
    const zombies = enriched.filter(e =>
      e.observedExposure > 0.6 &&
      e.roleFitScore > 85 &&
      (e.potentialAbility !== null ? e.potentialAbility <= 2 : true) &&
      (e.potentialEngagement !== null ? e.potentialEngagement <= 2 : false)
    )

    const persons: PersonAlert[] = zombies.map(z => ({
      employeeId: z.employeeId, employeeName: z.employeeName,
      position: z.position, departmentName: z.departmentName,
      observedExposure: z.observedExposure, roleFitScore: z.roleFitScore,
      salary: z.salary, financialImpact: z.salary * 12,
      // v3.1 — preservar segment fields
      acotadoGroup: z.acotadoGroup,
      standardCategory: z.standardCategory,
      metasCompliance: z.goalsRawPercent,
    }))

    return {
      count: zombies.length,
      persons,
      totalInertiaCost: persons.reduce((s, p) => s + p.financialImpact, 0),
      confidence: enriched.some(e => e.potentialAbility !== null) ? 'high' : 'medium',
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 2. AUGMENTED FLIGHT RISK
  // ──────────────────────────────────────────────────────────────────────

  static detectAugmentedFlightRisk(enriched: EnrichedEmployee[]): AugmentedFlightRiskResult {
    const atRisk = enriched.filter(e =>
      e.augmentationShare > 0.6 &&
      e.potentialEngagement === 3 &&
      (e.riskQuadrant === 'MOTOR_EQUIPO' || e.mobilityQuadrant === 'AMBICIOSO_PREMATURO')
    )

    const persons = atRisk.map(e => {
      const replacementCost = SalaryConfigService.calculateTurnoverCost(e.salary, e.acotadoGroup as any).turnoverCost
      return {
        employeeId: e.employeeId, employeeName: e.employeeName,
        position: e.position, departmentName: e.departmentName,
        observedExposure: e.observedExposure, roleFitScore: e.roleFitScore,
        salary: e.salary, financialImpact: replacementCost, replacementCost,
        // v3.1 — preservar segment fields
        acotadoGroup: e.acotadoGroup,
        standardCategory: e.standardCategory,
        metasCompliance: e.goalsRawPercent,
      }
    })

    return {
      count: atRisk.length,
      persons,
      totalReplacementCost: persons.reduce((s, p) => s + p.replacementCost, 0),
      confidence: enriched.some(e => e.potentialEngagement !== null) ? 'high' : 'low',
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 3. REDUNDANT POSITIONS
  // ──────────────────────────────────────────────────────────────────────

  static async detectRedundantPositions(enriched: EnrichedEmployee[]): Promise<RedundancyResult> {
    // Agrupar por departamento + SOC code
    const deptSocs = new Map<string, Map<string, { title: string; headcount: number; avgSalary: number }>>()

    for (const e of enriched) {
      if (!e.socCode || !e.departmentId) continue
      if (!deptSocs.has(e.departmentId)) deptSocs.set(e.departmentId, new Map())
      const dept = deptSocs.get(e.departmentId)!
      if (!dept.has(e.socCode)) dept.set(e.socCode, { title: e.position, headcount: 0, avgSalary: 0 })
      const entry = dept.get(e.socCode)!
      entry.headcount++
      entry.avgSalary = (entry.avgSalary * (entry.headcount - 1) + e.salary) / entry.headcount
    }

    const pairs: RedundantPair[] = []

    for (const [deptId, socMap] of deptSocs) {
      const socs = [...socMap.entries()]
      if (socs.length < 2) continue

      // Query tasks para cada SOC en este depto
      const socCodes = socs.map(([code]) => code)
      const tasks = await prisma.onetTask.findMany({
        where: { socCode: { in: socCodes } },
        select: { socCode: true, taskDescription: true },
      })

      const tasksBySoc = new Map<string, Set<string>>()
      for (const t of tasks) {
        if (!tasksBySoc.has(t.socCode)) tasksBySoc.set(t.socCode, new Set())
        tasksBySoc.get(t.socCode)!.add(t.taskDescription.toLowerCase().trim())
      }

      // Comparar pares
      for (let i = 0; i < socs.length; i++) {
        for (let j = i + 1; j < socs.length; j++) {
          const [codeA, dataA] = socs[i]
          const [codeB, dataB] = socs[j]
          const tasksA = tasksBySoc.get(codeA) ?? new Set()
          const tasksB = tasksBySoc.get(codeB) ?? new Set()
          if (tasksA.size === 0 || tasksB.size === 0) continue

          const intersection = [...tasksA].filter(t => tasksB.has(t)).length
          const union = new Set([...tasksA, ...tasksB]).size
          const overlapPercent = union > 0 ? Math.round((intersection / union) * 100) : 0

          if (overlapPercent >= 70) {
            const deptName = enriched.find(e => e.departmentId === deptId)?.departmentName ?? ''
            const smallerHeadcount = Math.min(dataA.headcount, dataB.headcount)
            const smallerSalary = Math.min(dataA.avgSalary, dataB.avgSalary)

            pairs.push({
              socCodeA: codeA, titleA: dataA.title,
              socCodeB: codeB, titleB: dataB.title,
              overlapPercent, departmentName: deptName,
              headcountA: dataA.headcount, headcountB: dataB.headcount,
              estimatedSavings: smallerHeadcount * smallerSalary * 12,
            })
          }
        }
      }
    }

    return {
      pairs: pairs.sort((a, b) => b.estimatedSavings - a.estimatedSavings),
      totalEstimatedSavings: pairs.reduce((s, p) => s + p.estimatedSavings, 0),
      confidence: pairs.length > 0 ? 'medium' : 'low',
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 4. ADOPTION RISK (departamental)
  // ──────────────────────────────────────────────────────────────────────

  static detectAdoptionRisk(enriched: EnrichedEmployee[]): AdoptionRiskResult {
    const deptAgg = new Map<string, { id: string; name: string; totalExp: number; totalEng: number; count: number; engCount: number }>()

    for (const e of enriched) {
      if (!e.departmentId) continue
      if (!deptAgg.has(e.departmentId)) deptAgg.set(e.departmentId, { id: e.departmentId, name: e.departmentName, totalExp: 0, totalEng: 0, count: 0, engCount: 0 })
      const d = deptAgg.get(e.departmentId)!
      d.totalExp += e.observedExposure
      d.count++
      if (e.potentialEngagement !== null) {
        d.totalEng += e.potentialEngagement
        d.engCount++
      }
    }

    const departments: DepartmentRisk[] = [...deptAgg.values()]
      .map(d => ({
        departmentId: d.id,
        departmentName: d.name,
        avgExposure: d.count > 0 ? d.totalExp / d.count : 0,
        avgEngagement: d.engCount > 0 ? d.totalEng / d.engCount : 2,
        headcount: d.count,
      }))
      .filter(d => d.avgExposure > 0.5 && d.avgEngagement < 2)
      .sort((a, b) => b.avgExposure - a.avgExposure)

    return {
      departments,
      confidence: enriched.some(e => e.potentialEngagement !== null) ? 'high' : 'low',
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 5. SENIORITY COMPRESSION
  // ──────────────────────────────────────────────────────────────────────

  static detectSeniorityCompression(enriched: EnrichedEmployee[]): SeniorityCompressionResult {
    const highExposure = enriched.filter(e => e.jobZone >= 3 && e.jobZone <= 4 && e.augmentationShare > 0.6)

    // Agrupar por SOC + depto
    const groups = new Map<string, EnrichedEmployee[]>()
    for (const e of highExposure) {
      const key = `${e.socCode ?? 'unknown'}|${e.departmentId}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(e)
    }

    const opportunities: CompressionOpportunity[] = []

    for (const [, members] of groups) {
      if (members.length < 2) continue
      const sorted = members.sort((a, b) => b.salary - a.salary)
      const senior = sorted[0]
      const juniors = sorted.slice(1)

      const brecha = senior.salary > 0 ? (senior.salary - juniors[0].salary) / senior.salary : 0
      if (brecha < 0.3) continue // brecha <30% no justifica

      const candidate = juniors.find(j =>
        (j.potentialAbility ?? 0) >= 3 && (j.potentialEngagement ?? 0) >= 3
      )

      opportunities.push({
        position: senior.position,
        departmentName: senior.departmentName,
        seniorSalary: senior.salary,
        juniorSalary: juniors[0].salary,
        annualSavings: (senior.salary - juniors[0].salary) * 12,
        juniorCandidate: candidate ? {
          name: candidate.employeeName,
          ability: candidate.potentialAbility ?? 0,
          engagement: candidate.potentialEngagement ?? 0,
        } : null,
      })
    }

    return {
      opportunities: opportunities.sort((a, b) => b.annualSavings - a.annualSavings),
      totalAnnualSavings: opportunities.reduce((s, o) => s + o.annualSavings, 0),
      confidence: opportunities.length > 0 ? 'medium' : 'low',
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 6. INERTIA COST — Σ(salary × exposure) por departamento
  // ──────────────────────────────────────────────────────────────────────

  static calculateInertiaCost(enriched: EnrichedEmployee[]): InertiaCostResult {
    const deptAgg = new Map<string, { id: string; name: string; cost: number; count: number; totalExp: number }>()

    for (const e of enriched) {
      if (!e.departmentId || e.observedExposure === 0) continue
      if (!deptAgg.has(e.departmentId)) deptAgg.set(e.departmentId, { id: e.departmentId, name: e.departmentName, cost: 0, count: 0, totalExp: 0 })
      const d = deptAgg.get(e.departmentId)!
      d.cost += e.salary * e.observedExposure
      d.count++
      d.totalExp += e.observedExposure
    }

    const byDepartment: DepartmentCost[] = [...deptAgg.values()]
      .map(d => ({
        departmentName: d.name, departmentId: d.id,
        monthlyCost: Math.round(d.cost),
        annualCost: Math.round(d.cost * 12),
        headcount: d.count,
        avgExposure: d.count > 0 ? Math.round((d.totalExp / d.count) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.monthlyCost - a.monthlyCost)

    return {
      byDepartment,
      totalMonthly: byDepartment.reduce((s, d) => s + d.monthlyCost, 0),
      totalAnnual: byDepartment.reduce((s, d) => s + d.annualCost, 0),
      confidence: enriched.some(e => e.observedExposure > 0) ? 'high' : 'low',
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 7. LIBERATED FTEs — Σ(importance × betaScore × headcount) por depto
  // ──────────────────────────────────────────────────────────────────────

  static async calculateLiberatedFTEs(enriched: EnrichedEmployee[]): Promise<LiberatedFTEsResult> {
    // Headcount por SOC code por departamento
    const socDeptHeadcount = new Map<string, Map<string, { name: string; count: number; avgSalary: number }>>()

    for (const e of enriched) {
      if (!e.socCode || !e.departmentId) continue
      if (!socDeptHeadcount.has(e.departmentId)) socDeptHeadcount.set(e.departmentId, new Map())
      const dept = socDeptHeadcount.get(e.departmentId)!
      if (!dept.has(e.socCode)) dept.set(e.socCode, { name: e.departmentName, count: 0, avgSalary: 0 })
      const entry = dept.get(e.socCode)!
      entry.avgSalary = (entry.avgSalary * entry.count + e.salary) / (entry.count + 1)
      entry.count++
    }

    // Query tasks para todos los SOC codes
    const allSocs = [...new Set(enriched.map(e => e.socCode).filter(Boolean))] as string[]
    const tasks = allSocs.length > 0
      ? await prisma.onetTask.findMany({
          where: { socCode: { in: allSocs }, betaScore: { not: null } },
          select: { socCode: true, importance: true, betaScore: true },
        })
      : []

    // Capacidad automatizable por SOC code (0-1)
    const socAutoCapacity = new Map<string, number>()
    const tasksBySoc = new Map<string, { sumWeighted: number; sumImportance: number }>()
    for (const t of tasks) {
      if (!tasksBySoc.has(t.socCode)) tasksBySoc.set(t.socCode, { sumWeighted: 0, sumImportance: 0 })
      const entry = tasksBySoc.get(t.socCode)!
      entry.sumWeighted += t.importance * (t.betaScore ?? 0)
      entry.sumImportance += t.importance
    }
    for (const [soc, data] of tasksBySoc) {
      socAutoCapacity.set(soc, data.sumImportance > 0 ? data.sumWeighted / data.sumImportance : 0)
    }

    // Calcular FTEs liberados por depto
    const byDepartment: DepartmentFTE[] = []

    for (const [deptId, socMap] of socDeptHeadcount) {
      let totalFTE = 0
      let totalSavings = 0
      let headcount = 0

      for (const [socCode, data] of socMap) {
        const autoCapacity = socAutoCapacity.get(socCode) ?? 0
        const liberatedFTE = autoCapacity * data.count
        totalFTE += liberatedFTE
        totalSavings += liberatedFTE * data.avgSalary
        headcount += data.count
      }

      if (totalFTE > 0) {
        byDepartment.push({
          departmentName: [...socMap.values()][0]?.name ?? '',
          departmentId: deptId,
          liberatedFTEs: Math.round(totalFTE * 10) / 10,
          monthlySavings: Math.round(totalSavings),
          headcount,
        })
      }
    }

    byDepartment.sort((a, b) => b.liberatedFTEs - a.liberatedFTEs)

    return {
      byDepartment,
      totalFTEs: Math.round(byDepartment.reduce((s, d) => s + d.liberatedFTEs, 0) * 10) / 10,
      totalMonthlySavings: byDepartment.reduce((s, d) => s + d.monthlySavings, 0),
      confidence: tasks.length > 0 ? 'high' : 'low',
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 8. SEVERANCE LIABILITY
  // ──────────────────────────────────────────────────────────────────────

  static calculateSeveranceLiability(
    enriched: EnrichedEmployee[],
    roleFitThreshold: number = 75
  ): SeveranceLiabilityResult {
    const candidates = enriched.filter(e =>
      e.observedExposure > 0.5 && e.roleFitScore < roleFitThreshold
    )

    let totalSeverance = 0
    let monthlyFTESavings = 0

    for (const c of candidates) {
      totalSeverance += calculateFiniquito(c.salary, c.tenureMonths)
      monthlyFTESavings += c.salary * c.observedExposure
    }

    const paybackMonths = monthlyFTESavings > 0 ? Math.ceil(totalSeverance / monthlyFTESavings) : 0

    return {
      totalSeverance: Math.round(totalSeverance),
      monthlyFTESavings: Math.round(monthlyFTESavings),
      paybackMonths,
      affectedCount: candidates.length,
      confidence: candidates.length > 0 ? 'high' : 'low',
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 9. RETENTION PRIORITY — (goals×0.4 + roleFit×0.3 + adapt_normalized×0.3) × multipliers × exposure
  // CORE-ADAPT base 5 → normalizado a base 100: (value / 5 * 100)
  // ──────────────────────────────────────────────────────────────────────

  static calculateRetentionPriority(enriched: EnrichedEmployee[]): RetentionPriorityResult {
    const ranking: RetentionEntry[] = enriched
      .filter(e => e.socCode !== null) // solo personas con mapeo
      .map(e => {
        const goalsNorm = e.goalsRawPercent ?? 50 // base 100
        const roleFitNorm = e.roleFitScore         // base 100
        // CORE-ADAPT proxy: potentialAbility (base 3, escala 1-3 pero tratamos como 1-5 si existe)
        // Si no hay potentialAbility, usar 2.5 (neutro en base 5)
        const adaptBase5 = e.potentialAbility !== null ? (e.potentialAbility / 3 * 5) : 2.5
        const adaptNorm = (adaptBase5 / 5) * 100 // normalizar a base 100

        let score = goalsNorm * 0.4 + roleFitNorm * 0.3 + adaptNorm * 0.3

        // Multiplicadores
        if (e.isIncumbentOfCriticalPosition) score *= 1.5
        if (e.mobilityQuadrant === 'SUCESOR_NATURAL') score *= 1.3

        // × exposure: mayor exposición + alto score = más valioso retener
        score *= (1 + e.observedExposure)

        // Tier
        const tier: RetentionEntry['tier'] =
          score >= 120 ? 'intocable' :
          score >= 80 ? 'valioso' :
          score >= 40 ? 'neutro' : 'prescindible'

        return {
          employeeId: e.employeeId,
          employeeName: e.employeeName,
          position: e.position,
          departmentName: e.departmentName,
          retentionScore: Math.round(score * 100) / 100,
          observedExposure: e.observedExposure,
          roleFitScore: e.roleFitScore,
          isCriticalPosition: e.isIncumbentOfCriticalPosition,
          tier,
          // v3.1 — preservar segment fields
          acotadoGroup: e.acotadoGroup,
          standardCategory: e.standardCategory,
          metasCompliance: e.goalsRawPercent,
        }
      })
      .sort((a, b) => b.retentionScore - a.retentionScore)

    return {
      ranking,
      intocablesCount: ranking.filter(r => r.tier === 'intocable').length,
      prescindiblesCount: ranking.filter(r => r.tier === 'prescindible').length,
      confidence: enriched.some(e => e.goalsRawPercent !== null) ? 'high' : 'medium',
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 9.5 PRODUCTIVITY GAP (v3.1)
  // SUM(salary × (1 - roleFit/100)) donde roleFit < 70
  // Mide el gap mensual de salario pagado vs rendimiento entregado
  // ──────────────────────────────────────────────────────────────────────

  static calculateProductivityGap(enriched: EnrichedEmployee[]): ProductivityGapResult {
    const ROLEFIT_THRESHOLD = 70

    const affected = enriched.filter(e => e.roleFitScore < ROLEFIT_THRESHOLD)

    // Total org
    const total = affected.reduce((sum, e) => {
      const gapRatio = 1 - (e.roleFitScore / 100)
      return sum + (e.salary * gapRatio)
    }, 0)

    // By segment (acotadoGroup × standardCategory)
    const segmentMap = new Map<string, SegmentGap>()
    for (const e of affected) {
      if (!e.acotadoGroup || !e.standardCategory) continue
      const key = `${e.acotadoGroup} de ${e.standardCategory}`
      const gap = e.salary * (1 - e.roleFitScore / 100)
      const existing = segmentMap.get(key)
      if (existing) {
        existing.total += gap
        existing.count += 1
      } else {
        segmentMap.set(key, {
          key,
          acotadoGroup: e.acotadoGroup,
          standardCategory: e.standardCategory,
          total: gap,
          count: 1,
        })
      }
    }

    const bySegment = Array.from(segmentMap.values()).sort((a, b) => b.total - a.total)

    // Confidence: basado en cobertura de roleFit en el dataset
    const withRoleFit = enriched.filter(e => e.roleFitScore > 0).length
    const coverage = enriched.length > 0 ? withRoleFit / enriched.length : 0
    const confidence: 'high' | 'medium' | 'low' =
      coverage >= 0.7 ? 'high' :
      coverage >= 0.3 ? 'medium' : 'low'

    return {
      total,
      affectedCount: affected.length,
      bySegment,
      confidence,
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 10. ORGANIZATION DIAGNOSTIC — ejecuta todo, consolida
  // ──────────────────────────────────────────────────────────────────────

  static async getOrganizationDiagnostic(
    accountId: string,
    departmentIds?: string[]
  ): Promise<OrganizationDiagnostic> {
    const enriched = await this.buildEnrichedDataset(accountId, departmentIds)

    if (enriched.length === 0) {
      return {
        zombies: { count: 0, persons: [], totalInertiaCost: 0, confidence: 'low' },
        flightRisk: { count: 0, persons: [], totalReplacementCost: 0, confidence: 'low' },
        redundancy: { pairs: [], totalEstimatedSavings: 0, confidence: 'low' },
        adoptionRisk: { departments: [], confidence: 'low' },
        seniorityCompression: { opportunities: [], totalAnnualSavings: 0, confidence: 'low' },
        inertiaCost: { byDepartment: [], totalMonthly: 0, totalAnnual: 0, confidence: 'low' },
        liberatedFTEs: { byDepartment: [], totalFTEs: 0, totalMonthlySavings: 0, confidence: 'low' },
        severanceLiability: { totalSeverance: 0, monthlyFTESavings: 0, paybackMonths: 0, affectedCount: 0, confidence: 'low' },
        retentionPriority: { ranking: [], intocablesCount: 0, prescindiblesCount: 0, confidence: 'low' },
        productivityGap: { total: 0, affectedCount: 0, bySegment: [], confidence: 'low' },
        topAlerts: [],
        netROI: 0,
        paybackMonths: 0,
        totalEmployees: 0,
        enrichedCount: 0,
        confidence: 'low',
      }
    }

    // Ejecutar todos los métodos sobre el MISMO dataset
    const zombies = this.detectTalentZombies(enriched)
    const flightRisk = this.detectAugmentedFlightRisk(enriched)
    const redundancy = await this.detectRedundantPositions(enriched)
    const adoptionRisk = this.detectAdoptionRisk(enriched)
    const seniorityCompression = this.detectSeniorityCompression(enriched)
    const inertiaCost = this.calculateInertiaCost(enriched)
    const liberatedFTEs = await this.calculateLiberatedFTEs(enriched)
    const severanceLiability = this.calculateSeveranceLiability(enriched)
    const retentionPriority = this.calculateRetentionPriority(enriched)
    const productivityGap = this.calculateProductivityGap(enriched)  // v3.1

    // Top 5 alertas por impacto financiero
    const alerts: Alert[] = [
      { type: 'zombies', title: 'Talento Zombie', financialImpact: zombies.totalInertiaCost, affectedCount: zombies.count, priority: 1 },
      { type: 'flight_risk', title: 'Fuga de Talento Aumentado', financialImpact: flightRisk.totalReplacementCost, affectedCount: flightRisk.count, priority: 2 },
      { type: 'redundancy', title: 'Redundancia Estructural', financialImpact: redundancy.totalEstimatedSavings, affectedCount: redundancy.pairs.length, priority: 3 },
      { type: 'inertia', title: 'Costo de Inercia', financialImpact: inertiaCost.totalAnnual, affectedCount: inertiaCost.byDepartment.length, priority: 4 },
      { type: 'seniority', title: 'Compresión de Seniority', financialImpact: seniorityCompression.totalAnnualSavings, affectedCount: seniorityCompression.opportunities.length, priority: 5 },
      { type: 'severance', title: 'Pasivo por Finiquitos', financialImpact: severanceLiability.totalSeverance, affectedCount: severanceLiability.affectedCount, priority: 6 },
    ]
      .filter(a => a.financialImpact > 0)
      .sort((a, b) => b.financialImpact - a.financialImpact)
      .slice(0, 5)

    // ROI: ahorro FTEs vs costo finiquitos
    const annualFTESavings = liberatedFTEs.totalMonthlySavings * 12
    const netROI = annualFTESavings - severanceLiability.totalSeverance
    const paybackMonths = severanceLiability.monthlyFTESavings > 0
      ? Math.ceil(severanceLiability.totalSeverance / severanceLiability.monthlyFTESavings)
      : 0

    const enrichedWithExposure = enriched.filter(e => e.socCode !== null).length
    const confidence = enrichedWithExposure / enriched.length >= 0.7 ? 'high'
      : enrichedWithExposure / enriched.length >= 0.3 ? 'medium' : 'low'

    return {
      zombies, flightRisk, redundancy, adoptionRisk, seniorityCompression,
      inertiaCost, liberatedFTEs, severanceLiability, retentionPriority,
      productivityGap,  // v3.1
      topAlerts: alerts, netROI, paybackMonths,
      totalEmployees: enriched.length,
      enrichedCount: enrichedWithExposure,
      confidence,
    }
  }
}
