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
import { normalizePositionText } from '@/lib/utils/normalizePosition'

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
  observedExposure: number      // Anthropic rollup (adopción observada, cobertura ~5%)
  automationShare: number
  augmentationShare: number
  jobZone: number
  focalizaScore: number | null  // Eloundou por cargo — INDICADOR PADRE del producto
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

/**
 * Desglose de Inercia por cargo DENTRO de un departamento.
 * Preserva el cruce cargo×área que antes se perdía al colapsar el
 * cálculo al total del depto. Habilita progressive disclosure en L1.
 *
 * avgAutomationShare + avgAugmentationShare vienen del Anthropic Index
 * (via OnetOccupation). Permiten clasificar IPI (Delegación / Asistencia
 * / Aprendizaje) con data real en lugar de heurística sobre avgExposure.
 */
export interface PositionInDepartmentCost {
  position: string
  monthlyCost: number
  headcount: number
  avgExposure: number
  avgAutomationShare: number
  avgAugmentationShare: number
  /** Promedio de roleFitScore de las personas del cargo en este depto. */
  avgRoleFit: number | null
}

export interface DepartmentCost {
  departmentName: string
  departmentId: string
  monthlyCost: number
  annualCost: number
  headcount: number
  avgExposure: number
  avgAutomationShare: number
  avgAugmentationShare: number
  /** Desglose por cargo dentro de este departamento. */
  byPosition: PositionInDepartmentCost[]
}

/**
 * Desglose de Inercia por cargo (position/jobTitle) a nivel global.
 * Misma fórmula canónica que DepartmentCost (salary × effExposure), solo
 * cambia la clave de agrupación. Usado por el Acto Ancla del Efficiency
 * Hub para destacar los cargos con mayor capital comprometido.
 */
export interface PositionCost {
  position: string
  monthlyCost: number
  annualCost: number
  headcount: number
  avgExposure: number
  avgAutomationShare: number
  avgAugmentationShare: number
}

export interface InertiaCostResult {
  byDepartment: DepartmentCost[]
  byPosition: PositionCost[]
  totalMonthly: number
  totalAnnual: number
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Desglose de FTEs liberables por cargo DENTRO de un departamento.
 * Complementa PositionInDepartmentCost para el eje operacional.
 *
 * avgAutomationShare/avgAugmentationShare a nivel socCode×depto
 * habilita clasificación IPI consistente con DepartmentCost.
 */
export interface PositionInDepartmentFTE {
  position: string
  socCode: string
  liberatedFTEs: number
  headcount: number
  avgRoleFit: number | null
  monthlySavings: number
  avgAutomationShare: number
  avgAugmentationShare: number
}

export interface DepartmentFTE {
  departmentName: string
  departmentId: string
  liberatedFTEs: number
  monthlySavings: number
  headcount: number
  /** Ponderado por headcount de cada socCode del depto. */
  avgAutomationShare: number
  avgAugmentationShare: number
  /** Desglose por cargo dentro de este departamento. */
  byPosition: PositionInDepartmentFTE[]
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
  // v3.2 — financial + 9-box (NineBoxLive + futuros instruments)
  salary: number
  finiquitoToday: number | null
  tenureMonths: number
  nineBoxPosition: string | null
  // v3.2 — exposure breakdown + engagement (pattern detection en NineBoxLive)
  automationShare: number
  augmentationShare: number
  potentialEngagement: number | null
  // FocalizaScore — indicador canónico del cargo (Eloundou puro, no mezcla)
  focalizaScore: number | null
  // v3.3 — cuadrantes de talento (habilita narrativa individual + integración
  // con TalentNarrativeService.getIndividualNarrative + detectores per-persona)
  riskQuadrant: string | null         // FUGA_CEREBROS | MOTOR_EQUIPO | BURNOUT_RISK | BAJO_RENDIMIENTO
  mobilityQuadrant: string | null     // SUCESOR_NATURAL | EXPERTO_ANCLA | AMBICIOSO_PREMATURO | EN_DESARROLLO
  potentialAbility: number | null     // 1-3 base — para detectTalentZombies per-persona
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

// normalizePosition migrado a @/lib/utils/normalizePosition (normalizePositionText).
// Se eliminó la función local buggy que no convertía `_` a espacio
// y absorbía contenido de paréntesis como caracteres.

/**
 * Exposición efectiva por persona — focalizaScore (Eloundou canónico) primario,
 * observedExposure (Anthropic legacy) como fallback si el cargo no tiene
 * mapeo Eloundou.
 *
 * Threshold canónico de "alta exposición" = 0.5 (validado contra distribución
 * real demo Abril 2026: focalizaScore avg 0.444, p75 0.5, max 0.667).
 * El threshold legacy 0.6 sobre observedExposure capturaba 0% (max real 0.165).
 */
function effExposure(e: { focalizaScore: number | null; observedExposure: number }): number {
  return e.focalizaScore ?? e.observedExposure
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
    // Carga TODOS los mappings del account (sin filtrar por positionText) y
    // construye el lookup en memoria con la normalización canónica. Esto
    // evita divergencias si el texto guardado quedó con una normalización
    // anterior ligeramente distinta.
    const allMappings = await prisma.occupationMapping.findMany({
      where: { accountId, socCode: { not: null } },
      select: { positionText: true, socCode: true },
    })
    const posToSoc = new Map<string, string>(
      allMappings.map(m => [normalizePositionText(m.positionText), m.socCode!])
    )

    const uniqueSocs = [...new Set(allMappings.map(m => m.socCode!).filter(Boolean))]
    const occupations = uniqueSocs.length > 0
      ? await prisma.onetOccupation.findMany({
          where: { socCode: { in: uniqueSocs } },
          select: { socCode: true, observedExposure: true, automationShare: true, augmentationShare: true, jobZone: true, betaScore: true, focalizaScore: true },
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
      const normalized = emp.position ? normalizePositionText(emp.position) : ''
      const socCode = normalized ? posToSoc.get(normalized) ?? null : null
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
        focalizaScore: occ?.focalizaScore ?? null,
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
    // Migrado a focalizaScore con threshold 0.5 (decisión Abril 2026).
    // observedExposure mantiene como fallback en effExposure() para cargos
    // sin clasificación Eloundou.
    const zombies = enriched.filter(e =>
      effExposure(e) > 0.5 &&
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
      // Migrado a focalizaScore (Eloundou canónico) con fallback
      d.totalExp += effExposure(e)
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
    // Acumuladores extendidos con totalAutomation + totalAugmentation para
    // clasificación IPI (Delegación/Asistencia/Aprendizaje) basada en
    // Anthropic Index real en lugar de heurística sobre avgExposure.
    interface Acum {
      cost: number
      count: number
      totalExp: number
      totalAutomation: number
      totalAugmentation: number
    }
    const makeAcum = (): Acum => ({
      cost: 0, count: 0, totalExp: 0, totalAutomation: 0, totalAugmentation: 0,
    })

    const deptAgg = new Map<string, { id: string; name: string } & Acum>()
    const positionAgg = new Map<string, { name: string } & Acum>()
    // Cruce cargo×área — preservado para progressive disclosure en L1.
    const deptPositionAgg = new Map<
      string,
      Map<string, Acum & { totalRoleFit: number; roleFitCount: number }>
    >()

    for (const e of enriched) {
      const exp = effExposure(e)
      if (!e.departmentId || exp === 0) continue

      // Agregación por departamento
      if (!deptAgg.has(e.departmentId)) {
        deptAgg.set(e.departmentId, {
          id: e.departmentId, name: e.departmentName, ...makeAcum(),
        })
      }
      const d = deptAgg.get(e.departmentId)!
      d.cost += e.salary * exp
      d.count++
      d.totalExp += exp
      d.totalAutomation += e.automationShare
      d.totalAugmentation += e.augmentationShare

      // Agregación por cargo global (cross-dept)
      if (!e.position) continue
      if (!positionAgg.has(e.position)) {
        positionAgg.set(e.position, { name: e.position, ...makeAcum() })
      }
      const p = positionAgg.get(e.position)!
      p.cost += e.salary * exp
      p.count++
      p.totalExp += exp
      p.totalAutomation += e.automationShare
      p.totalAugmentation += e.augmentationShare

      // Agregación por cargo DENTRO del depto
      if (!deptPositionAgg.has(e.departmentId)) deptPositionAgg.set(e.departmentId, new Map())
      const dpMap = deptPositionAgg.get(e.departmentId)!
      if (!dpMap.has(e.position)) {
        dpMap.set(e.position, { ...makeAcum(), totalRoleFit: 0, roleFitCount: 0 })
      }
      const dp = dpMap.get(e.position)!
      dp.cost += e.salary * exp
      dp.count++
      dp.totalExp += exp
      dp.totalAutomation += e.automationShare
      dp.totalAugmentation += e.augmentationShare
      if (e.roleFitScore !== null && e.roleFitScore !== undefined && !Number.isNaN(e.roleFitScore)) {
        dp.totalRoleFit += e.roleFitScore
        dp.roleFitCount++
      }
    }

    // Helper para el promedio redondeado a 2 decimales
    const avg = (total: number, count: number) =>
      count > 0 ? Math.round((total / count) * 100) / 100 : 0

    const byDepartment: DepartmentCost[] = [...deptAgg.values()]
      .map(d => {
        const dpMap = deptPositionAgg.get(d.id) ?? new Map()
        const byPosition: PositionInDepartmentCost[] = [...dpMap.entries()]
          .map(([position, p]) => ({
            position,
            monthlyCost: Math.round(p.cost),
            headcount: p.count,
            avgExposure: avg(p.totalExp, p.count),
            avgAutomationShare: avg(p.totalAutomation, p.count),
            avgAugmentationShare: avg(p.totalAugmentation, p.count),
            avgRoleFit: p.roleFitCount > 0
              ? Math.round((p.totalRoleFit / p.roleFitCount) * 100) / 100
              : null,
          }))
          .sort((a, b) => b.monthlyCost - a.monthlyCost)

        return {
          departmentName: d.name, departmentId: d.id,
          monthlyCost: Math.round(d.cost),
          annualCost: Math.round(d.cost * 12),
          headcount: d.count,
          avgExposure: avg(d.totalExp, d.count),
          avgAutomationShare: avg(d.totalAutomation, d.count),
          avgAugmentationShare: avg(d.totalAugmentation, d.count),
          byPosition,
        }
      })
      .sort((a, b) => b.monthlyCost - a.monthlyCost)

    const byPosition: PositionCost[] = [...positionAgg.values()]
      .map(p => ({
        position: p.name,
        monthlyCost: Math.round(p.cost),
        annualCost: Math.round(p.cost * 12),
        headcount: p.count,
        avgExposure: avg(p.totalExp, p.count),
        avgAutomationShare: avg(p.totalAutomation, p.count),
        avgAugmentationShare: avg(p.totalAugmentation, p.count),
      }))
      .sort((a, b) => b.monthlyCost - a.monthlyCost)

    return {
      byDepartment,
      byPosition,
      totalMonthly: byDepartment.reduce((s, d) => s + d.monthlyCost, 0),
      totalAnnual: byDepartment.reduce((s, d) => s + d.annualCost, 0),
      confidence: enriched.some(e => effExposure(e) > 0) ? 'high' : 'low',
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 7. LIBERATED FTEs — Σ(importance × betaScore × headcount) por depto
  // ──────────────────────────────────────────────────────────────────────

  static async calculateLiberatedFTEs(enriched: EnrichedEmployee[]): Promise<LiberatedFTEsResult> {
    // Cruce deptId × socCode — preserva datos por cargo dentro del depto.
    // Incluye position (human-readable) y roleFit para progressive disclosure.
    interface SocDeptEntry {
      deptName: string
      position: string // human-readable; si varios position mapean al mismo socCode, gana el más frecuente
      positionFreq: Map<string, number>
      count: number
      avgSalary: number
      totalRoleFit: number
      roleFitCount: number
      totalAutomation: number
      totalAugmentation: number
    }
    const socDeptHeadcount = new Map<string, Map<string, SocDeptEntry>>()

    for (const e of enriched) {
      if (!e.socCode || !e.departmentId) continue
      if (!socDeptHeadcount.has(e.departmentId)) socDeptHeadcount.set(e.departmentId, new Map())
      const dept = socDeptHeadcount.get(e.departmentId)!
      if (!dept.has(e.socCode)) {
        dept.set(e.socCode, {
          deptName: e.departmentName,
          position: e.position ?? '',
          positionFreq: new Map(),
          count: 0,
          avgSalary: 0,
          totalRoleFit: 0,
          roleFitCount: 0,
          totalAutomation: 0,
          totalAugmentation: 0,
        })
      }
      const entry = dept.get(e.socCode)!
      entry.avgSalary = (entry.avgSalary * entry.count + e.salary) / (entry.count + 1)
      entry.count++
      entry.totalAutomation += e.automationShare
      entry.totalAugmentation += e.augmentationShare
      if (e.position) {
        entry.positionFreq.set(e.position, (entry.positionFreq.get(e.position) ?? 0) + 1)
      }
      if (e.roleFitScore !== null && e.roleFitScore !== undefined && !Number.isNaN(e.roleFitScore)) {
        entry.totalRoleFit += e.roleFitScore
        entry.roleFitCount++
      }
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

    // Calcular FTEs liberados por depto + preservar desglose por cargo
    const byDepartment: DepartmentFTE[] = []

    for (const [deptId, socMap] of socDeptHeadcount) {
      let totalFTE = 0
      let totalSavings = 0
      let headcount = 0
      // Acumuladores de shares ponderados por headcount a nivel depto
      let totalAutomation = 0
      let totalAugmentation = 0
      const byPosition: PositionInDepartmentFTE[] = []

      for (const [socCode, data] of socMap) {
        const autoCapacity = socAutoCapacity.get(socCode) ?? 0
        const liberatedFTE = autoCapacity * data.count
        const positionSavings = liberatedFTE * data.avgSalary

        totalFTE += liberatedFTE
        totalSavings += positionSavings
        headcount += data.count
        totalAutomation += data.totalAutomation
        totalAugmentation += data.totalAugmentation

        // Position más frecuente dentro del socCode en este depto
        let topPosition = data.position
        let topFreq = 0
        for (const [pos, freq] of data.positionFreq) {
          if (freq > topFreq) {
            topFreq = freq
            topPosition = pos
          }
        }

        if (liberatedFTE > 0) {
          byPosition.push({
            position: topPosition,
            socCode,
            liberatedFTEs: Math.round(liberatedFTE * 10) / 10,
            headcount: data.count,
            avgRoleFit:
              data.roleFitCount > 0
                ? Math.round((data.totalRoleFit / data.roleFitCount) * 100) / 100
                : null,
            monthlySavings: Math.round(positionSavings),
            avgAutomationShare:
              data.count > 0
                ? Math.round((data.totalAutomation / data.count) * 100) / 100
                : 0,
            avgAugmentationShare:
              data.count > 0
                ? Math.round((data.totalAugmentation / data.count) * 100) / 100
                : 0,
          })
        }
      }

      byPosition.sort((a, b) => b.liberatedFTEs - a.liberatedFTEs)

      if (totalFTE > 0) {
        byDepartment.push({
          departmentName: [...socMap.values()][0]?.deptName ?? '',
          departmentId: deptId,
          liberatedFTEs: Math.round(totalFTE * 10) / 10,
          monthlySavings: Math.round(totalSavings),
          headcount,
          avgAutomationShare:
            headcount > 0
              ? Math.round((totalAutomation / headcount) * 100) / 100
              : 0,
          avgAugmentationShare:
            headcount > 0
              ? Math.round((totalAugmentation / headcount) * 100) / 100
              : 0,
          byPosition,
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
    // Migrado a focalizaScore (Eloundou) con threshold 0.5 (mismo semántico)
    const candidates = enriched.filter(e =>
      effExposure(e) > 0.5 && e.roleFitScore < roleFitThreshold
    )

    let totalSeverance = 0
    let monthlyFTESavings = 0

    for (const c of candidates) {
      totalSeverance += calculateFiniquito(c.salary, c.tenureMonths)
      monthlyFTESavings += c.salary * effExposure(c)
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
        // Migrado a focalizaScore (Eloundou) con fallback
        score *= (1 + effExposure(e))

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
          // v3.2 — financial + 9-box (NineBoxLive + futuros instruments)
          salary: e.salary,
          finiquitoToday: e.finiquitoToday,
          tenureMonths: e.tenureMonths,
          nineBoxPosition: e.nineBoxPosition,
          // v3.2 — exposure breakdown + engagement (pattern detection)
          automationShare: e.automationShare,
          augmentationShare: e.augmentationShare,
          potentialEngagement: e.potentialEngagement,
          // FocalizaScore del cargo (Eloundou)
          focalizaScore: e.focalizaScore,
          // v3.3 — cuadrantes para narrativa individual
          riskQuadrant: e.riskQuadrant,
          mobilityQuadrant: e.mobilityQuadrant,
          potentialAbility: e.potentialAbility,
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
        inertiaCost: { byDepartment: [], byPosition: [], totalMonthly: 0, totalAnnual: 0, confidence: 'low' },
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
