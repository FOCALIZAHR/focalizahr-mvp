// ═══════════════════════════════════════════════════════════════════════════
// src/lib/services/TalentActionService.ts
// TALENT ACTION CENTER — Motor de Agregación y Detección de Patrones
//
// PRINCIPIO: NO duplicar lógica de cuadrantes — reutilizar datos existentes
// DEPENDENCIAS: PerformanceRating (ciclo activo), Employee, Department,
//               SuccessionCandidate, SalaryConfigService, PositionAdapter
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { SuccessionService } from './SuccessionService'
import { SalaryConfigService } from './SalaryConfigService'
import { PositionAdapter } from '@/lib/services/PositionAdapter'
import { getChildDepartmentIds } from './AuthorizationService'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type GerenciaPattern =
  | 'FRAGIL'
  | 'QUEMADA'
  | 'ESTANCADA'
  | 'RIESGO_OCULTO'
  | 'EN_TRANSICION'
  | 'SALUDABLE'

export type TenureSegment = 'onboarding' | 'real' | 'cronico'

export interface GerenciaMapItem {
  gerenciaId: string
  gerenciaName: string
  totalPersonas: number
  clasificadas: number
  dataInsufficient: boolean
  pattern: GerenciaPattern | null
  icc: number | null
  riskDistribution: {
    FUGA_CEREBROS: number
    MOTOR_EQUIPO: number
    BURNOUT_RISK: number
    BAJO_RENDIMIENTO: number
    sin_clasificar: number
  }
  mobilityDistribution: {
    SUCESOR_NATURAL: number
    EXPERTO_ANCLA: number
    AMBICIOSO_PREMATURO: number
    EN_DESARROLLO: number
    sin_clasificar: number
  }
  roleFitPromedio: number | null
  sucesores: {
    total: number
    enPlanFormal: number
    potencialNoActivado: number
    posicionesCriticas: number
  }
  financialImpact: {
    iccRiskCLP: number
    fugaCerebrosCostCLP: number
  } | null
}

export interface OrgMapResult {
  gerencias: GerenciaMapItem[]
  orgStats: {
    totalPersonas: number
    totalClasificadas: number
    totalGerencias: number
    patronDominante: GerenciaPattern | null
    iccOrganizacional: number | null
  }
  avgSalary: number
  salarySource: string
}

export interface QuadrantPerson {
  employeeId: string
  fullName: string
  position: string | null
  departmentName: string
  hireDate: Date
  tenureMonths: number
  tenureSegment: TenureSegment
  riskQuadrant: string | null
  mobilityQuadrant: string | null
  riskAlertLevel: string | null
  roleFitScore: number | null
  nineBoxPosition: string | null
  isSuccessor: boolean
  acotadoGroup: string | null
}

export interface OrgStats {
  totalPersonas: number
  clasificadas: number
  riskDistribution: Record<string, number>
  mobilityDistribution: Record<string, number>
  alertasCriticas: number
  alertasAltas: number
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const MIN_CLASSIFIED_PERCENT = 0.5 // InsufficientDataGuard: 50% mínimo

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export class TalentActionService {

  // ═════════════════════════════════════════════════════════════════════════
  // getOrgMap: Mapa organizacional con patrones + ICC + sucesores
  // ═════════════════════════════════════════════════════════════════════════

  static async getOrgMap(
    accountId: string,
    options?: { allowedDepartmentIds?: string[] }
  ): Promise<OrgMapResult> {
    console.time('org-map')

    const cycleId = await SuccessionService.getCurrentCycleId(accountId)
    if (!cycleId) {
      console.timeEnd('org-map')
      return {
        gerencias: [],
        orgStats: {
          totalPersonas: 0, totalClasificadas: 0, totalGerencias: 0,
          patronDominante: null, iccOrganizacional: null
        },
        avgSalary: 0, salarySource: 'default_chile'
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3 BULK QUERIES en paralelo — elimina N+1
    // ═══════════════════════════════════════════════════════════════════════

    const [allDepartments, allRatings, allCandidates, allCriticalPositions, salaryResult] = await Promise.all([
      // 1. Todos los departamentos activos de la cuenta
      prisma.department.findMany({
        where: { accountId, isActive: true },
        select: { id: true, displayName: true, level: true, parentId: true }
      }),
      // 2. Todos los ratings del ciclo activo
      prisma.performanceRating.findMany({
        where: {
          accountId,
          cycleId,
          employee: { isActive: true, status: 'ACTIVE' }
        },
        select: {
          employeeId: true,
          riskQuadrant: true,
          mobilityQuadrant: true,
          riskAlertLevel: true,
          roleFitScore: true,
          employee: {
            select: { hireDate: true, position: true, departmentId: true }
          }
        }
      }),
      // 3. Todos los sucesores activos de la cuenta
      prisma.successionCandidate.findMany({
        where: { accountId, status: 'ACTIVE' },
        select: { employeeId: true, developmentPlanId: true }
      }),
      // 4. Posiciones criticas por departamento
      prisma.criticalPosition.findMany({
        where: { accountId },
        select: { id: true, departmentId: true }
      }),
      // 5. Salario para P&L
      SalaryConfigService.getSalaryForAccount(accountId)
    ])

    // ═══════════════════════════════════════════════════════════════════════
    // Construir jerarquía en memoria
    // ═══════════════════════════════════════════════════════════════════════

    // Mapa parentId → hijos (para resolver jerarquía sin queries recursivos)
    const childrenMap = new Map<string, string[]>()
    for (const d of allDepartments) {
      if (d.parentId) {
        const siblings = childrenMap.get(d.parentId)
        if (siblings) siblings.push(d.id)
        else childrenMap.set(d.parentId, [d.id])
      }
    }

    // Función para obtener todos los descendientes (BFS en memoria)
    const getAllDescendantIds = (parentId: string): string[] => {
      const result: string[] = []
      const queue = [parentId]
      while (queue.length > 0) {
        const current = queue.shift()!
        const children = childrenMap.get(current)
        if (children) {
          for (const childId of children) {
            result.push(childId)
            queue.push(childId)
          }
        }
      }
      return result
    }

    // Filtrar gerencias (level 2)
    let gerencias = allDepartments.filter(d => d.level === 2)
    if (options?.allowedDepartmentIds) {
      const allowed = new Set(options.allowedDepartmentIds)
      gerencias = gerencias.filter(d => allowed.has(d.id))
    }

    // Mapa gerenciaId → set de departmentIds (gerencia + descendientes)
    const gerenciaDeptSets = new Map<string, Set<string>>()
    for (const ger of gerencias) {
      const descendantIds = getAllDescendantIds(ger.id)
      gerenciaDeptSets.set(ger.id, new Set([ger.id, ...descendantIds]))
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Indexar ratings por departmentId para lookup O(1)
    // ═══════════════════════════════════════════════════════════════════════

    const ratingsByDept = new Map<string, typeof allRatings>()
    for (const r of allRatings) {
      const deptId = r.employee.departmentId
      if (!deptId) continue
      const list = ratingsByDept.get(deptId)
      if (list) list.push(r)
      else ratingsByDept.set(deptId, [r])
    }

    // Indexar candidatos por employeeId
    const candidatesByEmployee = new Map<string, typeof allCandidates>()
    for (const c of allCandidates) {
      const list = candidatesByEmployee.get(c.employeeId)
      if (list) list.push(c)
      else candidatesByEmployee.set(c.employeeId, [c])
    }

    // Indexar posiciones criticas por departmentId
    const criticalPositionsByDept = new Map<string, number>()
    for (const cp of allCriticalPositions) {
      if (!cp.departmentId) continue
      criticalPositionsByDept.set(cp.departmentId, (criticalPositionsByDept.get(cp.departmentId) || 0) + 1)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Procesar cada gerencia con datos en memoria — 0 queries adicionales
    // ═══════════════════════════════════════════════════════════════════════

    const gerenciaItems: GerenciaMapItem[] = []

    for (const ger of gerencias) {
      const deptSet = gerenciaDeptSets.get(ger.id)!

      // Recopilar ratings de todos los departamentos de esta gerencia
      const gerRatings: typeof allRatings = []
      for (const deptId of deptSet) {
        const deptRatings = ratingsByDept.get(deptId)
        if (deptRatings) gerRatings.push(...deptRatings)
      }

      // Contar posiciones criticas en toda la jerarquia de esta gerencia
      let posicionesCriticas = 0
      for (const deptId of deptSet) {
        posicionesCriticas += criticalPositionsByDept.get(deptId) || 0
      }

      const item = this.buildGerenciaItemFromMemory(
        ger.id, ger.displayName, gerRatings,
        candidatesByEmployee, salaryResult.monthlySalary,
        posicionesCriticas
      )
      gerenciaItems.push(item)
    }

    // Stats organizacionales
    const totalPersonas = gerenciaItems.reduce((s, g) => s + g.totalPersonas, 0)
    const totalClasificadas = gerenciaItems.reduce((s, g) => s + g.clasificadas, 0)

    const iccOrg = totalPersonas > 0
      ? this.calculateICCFromItems(gerenciaItems)
      : null

    const patronDominante = this.detectDominantPattern(gerenciaItems)

    console.timeEnd('org-map')

    return {
      gerencias: gerenciaItems,
      orgStats: {
        totalPersonas,
        totalClasificadas,
        totalGerencias: gerenciaItems.length,
        patronDominante,
        iccOrganizacional: iccOrg
      },
      avgSalary: salaryResult.monthlySalary,
      salarySource: salaryResult.source
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // getStats: Distribución total + alertas
  // ═════════════════════════════════════════════════════════════════════════

  static async getStats(
    accountId: string,
    options?: { allowedDepartmentIds?: string[] }
  ): Promise<OrgStats> {
    const cycleId = await SuccessionService.getCurrentCycleId(accountId)
    if (!cycleId) {
      return {
        totalPersonas: 0, clasificadas: 0,
        riskDistribution: {}, mobilityDistribution: {},
        alertasCriticas: 0, alertasAltas: 0
      }
    }

    const where: any = {
      accountId,
      cycleId,
      employee: { isActive: true, status: 'ACTIVE' }
    }
    if (options?.allowedDepartmentIds) {
      where.employee = {
        ...where.employee,
        departmentId: { in: options.allowedDepartmentIds }
      }
    }

    const ratings = await prisma.performanceRating.findMany({
      where,
      select: {
        riskQuadrant: true,
        mobilityQuadrant: true,
        riskAlertLevel: true
      }
    })

    const riskDist: Record<string, number> = {}
    const mobilityDist: Record<string, number> = {}
    let alertasCriticas = 0
    let alertasAltas = 0
    let clasificadas = 0

    for (const r of ratings) {
      if (r.riskQuadrant) {
        riskDist[r.riskQuadrant] = (riskDist[r.riskQuadrant] || 0) + 1
        clasificadas++
      }
      if (r.mobilityQuadrant) {
        mobilityDist[r.mobilityQuadrant] = (mobilityDist[r.mobilityQuadrant] || 0) + 1
      }
      if (r.riskAlertLevel === 'RED') alertasCriticas++
      if (r.riskAlertLevel === 'ORANGE') alertasAltas++
    }

    return {
      totalPersonas: ratings.length,
      clasificadas,
      riskDistribution: riskDist,
      mobilityDistribution: mobilityDist,
      alertasCriticas,
      alertasAltas
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // getQuadrantPersons: Personas de un cuadrante, segmentadas por tenure
  // ═════════════════════════════════════════════════════════════════════════

  static async getQuadrantPersons(
    accountId: string,
    quadrant: string,
    options?: {
      allowedDepartmentIds?: string[]
      departmentId?: string
      skip?: number
      take?: number
    }
  ): Promise<{ persons: QuadrantPerson[]; total: number }> {
    const cycleId = await SuccessionService.getCurrentCycleId(accountId)
    if (!cycleId) return { persons: [], total: 0 }

    const where: any = {
      accountId,
      cycleId,
      riskQuadrant: quadrant,
      employee: { isActive: true, status: 'ACTIVE' }
    }

    if (options?.departmentId) {
      const childIds = await getChildDepartmentIds(options.departmentId)
      where.employee = {
        ...where.employee,
        departmentId: { in: [options.departmentId, ...childIds] }
      }
    } else if (options?.allowedDepartmentIds) {
      where.employee = {
        ...where.employee,
        departmentId: { in: options.allowedDepartmentIds }
      }
    }

    const [ratings, total] = await Promise.all([
      prisma.performanceRating.findMany({
        where,
        skip: options?.skip || 0,
        take: options?.take || 50,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              position: true,
              hireDate: true,
              departmentId: true,
              department: { select: { displayName: true } }
            }
          }
        },
        orderBy: { riskAlertLevel: 'asc' } // RED first
      }),
      prisma.performanceRating.count({ where })
    ])

    // Batch: buscar sucesores activos
    const employeeIds = ratings.map(r => r.employeeId)
    const activeCandidates = await prisma.successionCandidate.findMany({
      where: {
        accountId,
        employeeId: { in: employeeIds },
        status: 'ACTIVE'
      },
      select: { employeeId: true }
    })
    const successorSet = new Set(activeCandidates.map(c => c.employeeId))

    const now = new Date()
    const persons: QuadrantPerson[] = ratings.map(r => {
      const tenureMonths = this.calcTenureMonths(r.employee.hireDate, now)
      const classification = r.employee.position
        ? PositionAdapter.classifyPosition(r.employee.position)
        : null

      return {
        employeeId: r.employeeId,
        fullName: r.employee.fullName,
        position: r.employee.position,
        departmentName: r.employee.department?.displayName || 'Sin Depto',
        hireDate: r.employee.hireDate,
        tenureMonths,
        tenureSegment: this.classifyTenure(tenureMonths),
        riskQuadrant: r.riskQuadrant,
        mobilityQuadrant: r.mobilityQuadrant,
        riskAlertLevel: r.riskAlertLevel,
        roleFitScore: r.roleFitScore,
        nineBoxPosition: r.nineBoxPosition,
        isSuccessor: successorSet.has(r.employeeId),
        acotadoGroup: classification?.acotadoGroup || null
      }
    })

    return { persons, total }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PRIVATE: Build gerencia item from pre-fetched data (0 DB queries)
  // ═════════════════════════════════════════════════════════════════════════

  private static buildGerenciaItemFromMemory(
    gerenciaId: string,
    gerenciaName: string,
    ratings: {
      employeeId: string
      riskQuadrant: string | null
      mobilityQuadrant: string | null
      riskAlertLevel: string | null
      roleFitScore: number | null
      employee: { hireDate: Date; position: string | null; departmentId: string | null }
    }[],
    candidatesByEmployee: Map<string, { employeeId: string; developmentPlanId: string | null }[]>,
    monthlySalary: number,
    posicionesCriticas: number = 0
  ): GerenciaMapItem {
    const now = new Date()
    const totalPersonas = ratings.length

    // Distribución de cuadrantes
    const riskDist = { FUGA_CEREBROS: 0, MOTOR_EQUIPO: 0, BURNOUT_RISK: 0, BAJO_RENDIMIENTO: 0, sin_clasificar: 0 }
    const mobilityDist = { SUCESOR_NATURAL: 0, EXPERTO_ANCLA: 0, AMBICIOSO_PREMATURO: 0, EN_DESARROLLO: 0, sin_clasificar: 0 }

    let clasificadas = 0
    let roleFitSum = 0
    let roleFitCount = 0
    let fugaCerebrosCount = 0
    let burnoutCount = 0
    let enDesarrolloCount = 0
    let ambiciosoPremCount = 0
    let iccCount = 0
    const tenureSums: number[] = []

    for (const r of ratings) {
      if (r.riskQuadrant) {
        const key = r.riskQuadrant as keyof typeof riskDist
        if (key in riskDist) riskDist[key]++
        else riskDist.sin_clasificar++
        clasificadas++

        if (r.riskQuadrant === 'FUGA_CEREBROS') fugaCerebrosCount++
        if (r.riskQuadrant === 'BURNOUT_RISK') burnoutCount++
      } else {
        riskDist.sin_clasificar++
      }

      if (r.mobilityQuadrant) {
        const key = r.mobilityQuadrant as keyof typeof mobilityDist
        if (key in mobilityDist) mobilityDist[key]++
        else mobilityDist.sin_clasificar++

        if (r.mobilityQuadrant === 'EN_DESARROLLO') enDesarrolloCount++
        if (r.mobilityQuadrant === 'AMBICIOSO_PREMATURO') ambiciosoPremCount++
      } else {
        mobilityDist.sin_clasificar++
      }

      // ICC: (RED|ORANGE + EXPERTO_ANCLA)
      if ((r.riskAlertLevel === 'RED' || r.riskAlertLevel === 'ORANGE') &&
          r.mobilityQuadrant === 'EXPERTO_ANCLA') {
        iccCount++
      }

      if (r.roleFitScore !== null) {
        roleFitSum += r.roleFitScore
        roleFitCount++
      }

      const tenure = this.calcTenureMonths(r.employee.hireDate, now)
      tenureSums.push(tenure)
    }

    // InsufficientDataGuard
    const dataInsufficient = totalPersonas === 0 || (clasificadas / totalPersonas) < MIN_CLASSIFIED_PERCENT

    // ICC
    const icc = (!dataInsufficient && totalPersonas > 0)
      ? Math.round((iccCount / totalPersonas) * 100)
      : null

    // RoleFit promedio
    const roleFitPromedio = roleFitCount > 0
      ? Math.round((roleFitSum / roleFitCount) * 10) / 10
      : null

    // Sucesores — lookup en mapa pre-cargado
    const employeeIds = ratings.map(r => r.employeeId)
    const activeCandidates: { employeeId: string; developmentPlanId: string | null }[] = []
    for (const empId of employeeIds) {
      const candidates = candidatesByEmployee.get(empId)
      if (candidates) activeCandidates.push(...candidates)
    }

    const sucesores = {
      total: activeCandidates.length,
      enPlanFormal: activeCandidates.filter(c => c.developmentPlanId !== null).length,
      potencialNoActivado: Math.max(0, mobilityDist.SUCESOR_NATURAL - activeCandidates.length),
      posicionesCriticas
    }

    // Patrón — denominador = clasificadas (con riskQuadrant), NO totalPersonas
    const safeClasificadas = clasificadas > 0 ? clasificadas : 1
    const pattern = dataInsufficient ? null : this.detectPattern({
      totalPersonas,
      fugaCerebrosPercent: (fugaCerebrosCount / safeClasificadas) * 100,
      burnoutPercent: (burnoutCount / safeClasificadas) * 100,
      enDesarrolloPercent: (enDesarrolloCount / safeClasificadas) * 100,
      ambiciosoPremPercent: (ambiciosoPremCount / safeClasificadas) * 100,
      icc: icc || 0,
      roleFitPromedio: roleFitPromedio || 0,
      sucesoresEnPlan: sucesores.enPlanFormal,
      tenureMediana: this.median(tenureSums)
    })

    // P&L financiero
    let financialImpact: GerenciaMapItem['financialImpact'] = null
    if (!dataInsufficient && icc !== null) {
      const annualSalary = monthlySalary * 12
      const turnoverMultiplier = 1.25 // default SHRM
      financialImpact = {
        iccRiskCLP: Math.round(iccCount * annualSalary * turnoverMultiplier * 1.5), // expertisePremium 1.5x
        fugaCerebrosCostCLP: Math.round(fugaCerebrosCount * annualSalary * turnoverMultiplier)
      }
    }

    return {
      gerenciaId,
      gerenciaName,
      totalPersonas,
      clasificadas,
      dataInsufficient,
      pattern,
      icc,
      riskDistribution: riskDist,
      mobilityDistribution: mobilityDist,
      roleFitPromedio,
      sucesores,
      financialImpact
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PATTERN DETECTION — 6 patrones con precedencia
  // ═════════════════════════════════════════════════════════════════════════

  static detectPattern(data: {
    totalPersonas: number
    fugaCerebrosPercent: number
    burnoutPercent: number
    enDesarrolloPercent: number
    ambiciosoPremPercent: number
    icc: number
    roleFitPromedio: number
    sucesoresEnPlan: number
    tenureMediana: number
  }): GerenciaPattern {
    // Orden de precedencia: menor número = mayor prioridad
    // 1. FRÁGIL
    if (data.roleFitPromedio >= 75 && data.fugaCerebrosPercent > 30 && data.sucesoresEnPlan < 2) {
      return 'FRAGIL'
    }
    // 2. QUEMADA — tenureMediana alineada con tramo A1 (<12 meses = onboarding)
    // Antes: > 6. Actualizado 2026-03-22 para coherencia con classifyTenure().
    if (data.burnoutPercent > 35 && data.tenureMediana > 12) {
      return 'QUEMADA'
    }
    // 3. ESTANCADA
    if (data.enDesarrolloPercent > 50 && data.tenureMediana > 18) {
      return 'ESTANCADA'
    }
    // 4. RIESGO_OCULTO
    if (data.icc > 25) {
      return 'RIESGO_OCULTO'
    }
    // 5. EN_TRANSICION
    if (data.ambiciosoPremPercent > 35) {
      return 'EN_TRANSICION'
    }
    // 6. SALUDABLE
    return 'SALUDABLE'
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ICC CALCULATION
  // ═════════════════════════════════════════════════════════════════════════

  static calculateICC(
    iccCount: number,
    totalPersonas: number
  ): number | null {
    if (totalPersonas === 0) return null
    return Math.round((iccCount / totalPersonas) * 100)
  }

  // ═════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═════════════════════════════════════════════════════════════════════════

  private static calcTenureMonths(hireDate: Date, now: Date): number {
    const months = (now.getFullYear() - hireDate.getFullYear()) * 12 +
      (now.getMonth() - hireDate.getMonth())
    return Math.max(0, months)
  }

  // NOTE: Primer tramo actualizado de <6 a <12 meses (2026-03-22).
  // El tramo superior (>36) se mantiene para proteger patrones QUEMADA/ESTANCADA.
  // Pendiente: evaluar bajar >36 a >24 cuando se construyan los motores v2.
  // RESUELTO: patrón QUEMADA ya usa tenureMediana > 12 (línea ~641), alineado con classifyTenure().
  static classifyTenure(months: number): TenureSegment {
    if (months < 12) return 'onboarding'
    if (months <= 36) return 'real'
    return 'cronico'
  }

  private static median(values: number[]): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid]
  }

  private static calculateICCFromItems(items: GerenciaMapItem[]): number | null {
    let totalPersonas = 0
    let totalICC = 0
    for (const item of items) {
      if (!item.dataInsufficient && item.icc !== null) {
        totalPersonas += item.totalPersonas
        totalICC += Math.round(item.icc * item.totalPersonas / 100)
      }
    }
    if (totalPersonas === 0) return null
    return Math.round((totalICC / totalPersonas) * 100)
  }

  private static detectDominantPattern(items: GerenciaMapItem[]): GerenciaPattern | null {
    const counts: Record<string, number> = {}
    for (const item of items) {
      if (item.pattern) {
        counts[item.pattern] = (counts[item.pattern] || 0) + 1
      }
    }
    if (Object.keys(counts).length === 0) return null
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as GerenciaPattern
  }
}
