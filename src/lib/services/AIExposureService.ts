// ════════════════════════════════════════════════════════════════════════════
// AI EXPOSURE SERVICE — Exposición a IA por cargo, departamento y organización
// src/lib/services/AIExposureService.ts
// ════════════════════════════════════════════════════════════════════════════
// Patrón: réplica de SalaryConfigService (never-null, confidence, metadata)
// Consume datos de OnetOccupation (cargados en Fase 0) + OccupationMapping (Fase 1)
//
// Flujo: Employee.position → OccupationMapping.socCode → OnetOccupation.observedExposure
//
// 3 métodos:
//   getExposure(socCode)           → lookup individual de ocupación
//   getDepartmentExposure(deptId)  → agregado por departamento
//   getOrganizationExposure(accId) → resumen organizacional completo
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { socCodeVariants } from '@/lib/utils/socCode'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface ExposureResult {
  socCode: string
  occupationTitle: string
  observedExposure: number       // Anthropic 0-1
  automationShare: number        // 0-1
  augmentationShare: number      // 0-1
  taskCoverage: number           // % tareas con datos Anthropic
  jobZone: number                // 1-5 complejidad
  topAutomatedTasks: string[]    // Top 5 tareas con mayor betaScore
  confidence: 'high' | 'medium' | 'low'
  source: 'exact_soc' | 'soc_family' | 'default'
}

export interface DepartmentExposureResult {
  departmentId: string
  departmentName: string
  avgExposure: number
  headcount: number
  mappedCount: number             // empleados con SOC code asignado
  highExposureCount: number       // personas en roles >60% exposure
  byOccupation: Array<{
    socCode: string
    title: string
    exposure: number
    employeeCount: number
  }>
  confidence: 'high' | 'medium' | 'low'
}

export interface OrganizationExposureResult {
  accountId: string
  avgExposure: number
  totalEmployees: number
  mappedEmployees: number         // con SOC code asignado
  highExposureCount: number
  byCategory: Record<string, { avgExposure: number; headcount: number }>
  byLevel: Record<string, { avgExposure: number; headcount: number }>
  topExposedOccupations: Array<{
    socCode: string
    title: string
    exposure: number
    employeeCount: number
  }>
  confidence: 'high' | 'medium' | 'low'
}

export interface DescriptorExposureResult {
  // Ajustada: basada en tareas activas del descriptor editado por el cliente
  adjustedExposure: number
  adjustedAutomationShare: number
  adjustedAugmentationShare: number
  activeTasks: number
  totalTasks: number

  // Genérica: la de OnetOccupation (datos globales O*NET)
  genericExposure: number
  genericAutomationShare: number

  // Delta: adjusted - generic
  delta: number
  deltaDirection: 'higher' | 'lower' | 'same'

  // Metadata
  socCode: string | null
  occupationTitle: string
  confidence: 'high' | 'medium' | 'low'
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const HIGH_EXPOSURE_THRESHOLD = 0.6 // >60% = alto riesgo de automatización
const TOP_TASKS_LIMIT = 5
const TOP_OCCUPATIONS_LIMIT = 10

const DEFAULT_EXPOSURE: ExposureResult = {
  socCode: '',
  occupationTitle: 'Sin clasificar',
  observedExposure: 0,
  automationShare: 0,
  augmentationShare: 0,
  taskCoverage: 0,
  jobZone: 3,
  topAutomatedTasks: [],
  confidence: 'low',
  source: 'default',
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER — normalizar position text (mismo que OccupationMapper)
// ════════════════════════════════════════════════════════════════════════════

function normalizePosition(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s\-\/&.]/g, '')
    .replace(/\s+/g, ' ')
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class AIExposureService {

  // ──────────────────────────────────────────────────────────────────────
  // 1. SINGLE OCCUPATION — lookup por SOC code
  // Patrón: SalaryConfigService.getSalaryForAccount (never-null, fallback)
  // ──────────────────────────────────────────────────────────────────────

  static async getExposure(socCode: string): Promise<ExposureResult> {
    if (!socCode) return { ...DEFAULT_EXPOSURE }

    try {
      // Tolerar formato "11-9021" y "11-9021.00" — el catálogo O*NET usa el
      // sufijo .00 pero JobDescriptor/OccupationMapping persiste sin sufijo.
      const variants = socCodeVariants(socCode)
      const occupation = await prisma.onetOccupation.findFirst({
        where: { socCode: { in: variants } },
        include: {
          tasks: {
            where: { isAutomated: true },
            orderBy: { betaScore: 'desc' },
            take: TOP_TASKS_LIMIT,
            select: { taskDescription: true, betaScore: true },
          },
        },
      })

      if (!occupation) {
        return { ...DEFAULT_EXPOSURE, socCode, source: 'default' }
      }

      // Confidence: high si tiene datos Anthropic, medium si solo betaScore, low si nada
      const hasAnthropicData = occupation.observedExposure !== null
      const hasBetaData = occupation.betaScore !== null
      const confidence = hasAnthropicData ? 'high' : hasBetaData ? 'medium' : 'low'

      return {
        socCode: occupation.socCode,
        occupationTitle: occupation.titleEs ?? occupation.titleEn,
        observedExposure: occupation.observedExposure ?? occupation.betaScore ?? 0,
        automationShare: occupation.automationShare ?? 0,
        augmentationShare: occupation.augmentationShare ?? 0,
        taskCoverage: occupation.taskCoverage ?? 0,
        jobZone: occupation.jobZone,
        topAutomatedTasks: occupation.tasks.map(t => t.taskDescription),
        confidence,
        source: 'exact_soc',
      }
    } catch (error) {
      console.error('[AIExposureService] getExposure error:', error instanceof Error ? error.message : 'unknown')
      return { ...DEFAULT_EXPOSURE, socCode }
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 2. DEPARTMENT — agregado por departamento
  // Join: Employee.position → OccupationMapping.socCode → OnetOccupation
  // ──────────────────────────────────────────────────────────────────────

  static async getDepartmentExposure(
    departmentId: string,
    accountId: string
  ): Promise<DepartmentExposureResult> {
    try {
      // 1. Obtener empleados del departamento
      const employees = await prisma.employee.findMany({
        where: {
          departmentId,
          accountId,
          isActive: true,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          position: true,
          department: { select: { displayName: true } },
        },
      })

      const departmentName = employees[0]?.department?.displayName ?? 'Departamento'

      if (employees.length === 0) {
        return {
          departmentId,
          departmentName,
          avgExposure: 0,
          headcount: 0,
          mappedCount: 0,
          highExposureCount: 0,
          byOccupation: [],
          confidence: 'low',
        }
      }

      // 2. Obtener SOC codes de los empleados via OccupationMapping
      const positionTexts = [...new Set(
        employees
          .map(e => e.position)
          .filter((p): p is string => !!p)
          .map(normalizePosition)
      )]

      const mappings = await prisma.occupationMapping.findMany({
        where: {
          accountId,
          positionText: { in: positionTexts },
          socCode: { not: null },
        },
        select: { positionText: true, socCode: true },
      })

      const positionToSoc = new Map(
        mappings.map(m => [m.positionText, m.socCode!])
      )

      // 3. Obtener exposiciones por SOC code único
      const uniqueSocCodes = [...new Set(mappings.map(m => m.socCode!).filter(Boolean))]
      const occupations = await prisma.onetOccupation.findMany({
        where: { socCode: { in: uniqueSocCodes } },
        select: {
          socCode: true,
          titleEn: true,
          titleEs: true,
          observedExposure: true,
          betaScore: true,
        },
      })

      const socToExposure = new Map(
        occupations.map(o => [o.socCode, {
          title: o.titleEs ?? o.titleEn,
          exposure: o.observedExposure ?? o.betaScore ?? 0,
        }])
      )

      // 4. Agregar por empleado
      let totalExposure = 0
      let mappedCount = 0
      let highExposureCount = 0
      const occupationCounts = new Map<string, { title: string; exposure: number; count: number }>()

      for (const emp of employees) {
        if (!emp.position) continue
        const normalized = normalizePosition(emp.position)
        const socCode = positionToSoc.get(normalized)
        if (!socCode) continue

        const expData = socToExposure.get(socCode)
        if (!expData) continue

        totalExposure += expData.exposure
        mappedCount++
        if (expData.exposure > HIGH_EXPOSURE_THRESHOLD) highExposureCount++

        const existing = occupationCounts.get(socCode)
        if (existing) {
          existing.count++
        } else {
          occupationCounts.set(socCode, { title: expData.title, exposure: expData.exposure, count: 1 })
        }
      }

      const avgExposure = mappedCount > 0
        ? Math.round((totalExposure / mappedCount) * 10000) / 10000
        : 0

      const byOccupation = [...occupationCounts.entries()]
        .map(([socCode, data]) => ({
          socCode,
          title: data.title,
          exposure: data.exposure,
          employeeCount: data.count,
        }))
        .sort((a, b) => b.exposure - a.exposure)

      // Confidence basada en % de empleados mapeados
      const mappedPct = employees.length > 0 ? mappedCount / employees.length : 0
      const confidence = mappedPct >= 0.7 ? 'high' : mappedPct >= 0.3 ? 'medium' : 'low'

      return {
        departmentId,
        departmentName,
        avgExposure,
        headcount: employees.length,
        mappedCount,
        highExposureCount,
        byOccupation,
        confidence,
      }
    } catch (error) {
      console.error('[AIExposureService] getDepartmentExposure error:', error instanceof Error ? error.message : 'unknown')
      return {
        departmentId,
        departmentName: 'Error',
        avgExposure: 0,
        headcount: 0,
        mappedCount: 0,
        highExposureCount: 0,
        byOccupation: [],
        confidence: 'low',
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 3. ORGANIZATION — resumen completo
  // Agrupa por standardCategory (8 gerencias) y acotadoGroup (4 niveles)
  // ──────────────────────────────────────────────────────────────────────

  static async getOrganizationExposure(
    accountId: string,
    departmentIds?: string[]
  ): Promise<OrganizationExposureResult> {
    try {
      // 1. Obtener todos los empleados activos (con filtro jerárquico si aplica)
      const whereClause: any = {
        accountId,
        isActive: true,
        status: 'ACTIVE',
      }
      if (departmentIds && departmentIds.length > 0) {
        whereClause.departmentId = { in: departmentIds }
      }

      const employees = await prisma.employee.findMany({
        where: whereClause,
        select: {
          id: true,
          position: true,
          department: {
            select: { standardCategory: true },
          },
          acotadoGroup: true,
        },
      })

      if (employees.length === 0) {
        return {
          accountId,
          avgExposure: 0,
          totalEmployees: 0,
          mappedEmployees: 0,
          highExposureCount: 0,
          byCategory: {},
          byLevel: {},
          topExposedOccupations: [],
          confidence: 'low',
        }
      }

      // 2. Obtener todos los OccupationMapping del account
      const allMappings = await prisma.occupationMapping.findMany({
        where: { accountId, socCode: { not: null } },
        select: { positionText: true, socCode: true },
      })
      const positionToSoc = new Map(allMappings.map(m => [m.positionText, m.socCode!]))

      // 3. Obtener todas las ocupaciones con exposición
      const uniqueSocCodes = [...new Set(allMappings.map(m => m.socCode!).filter(Boolean))]
      const occupations = await prisma.onetOccupation.findMany({
        where: { socCode: { in: uniqueSocCodes } },
        select: {
          socCode: true,
          titleEn: true,
          titleEs: true,
          observedExposure: true,
          betaScore: true,
        },
      })
      const socToData = new Map(
        occupations.map(o => [o.socCode, {
          title: o.titleEs ?? o.titleEn,
          exposure: o.observedExposure ?? o.betaScore ?? 0,
        }])
      )

      // 4. Agregar por empleado
      let totalExposure = 0
      let mappedCount = 0
      let highExposureCount = 0

      const categoryAgg = new Map<string, { totalExp: number; count: number }>()
      const levelAgg = new Map<string, { totalExp: number; count: number }>()
      const occupationAgg = new Map<string, { title: string; exposure: number; count: number }>()

      for (const emp of employees) {
        if (!emp.position) continue
        const normalized = normalizePosition(emp.position)
        const socCode = positionToSoc.get(normalized)
        if (!socCode) continue

        const expData = socToData.get(socCode)
        if (!expData) continue

        totalExposure += expData.exposure
        mappedCount++
        if (expData.exposure > HIGH_EXPOSURE_THRESHOLD) highExposureCount++

        // Por categoría (gerencia)
        const category = emp.department?.standardCategory ?? 'sin_asignar'
        const catEntry = categoryAgg.get(category) ?? { totalExp: 0, count: 0 }
        catEntry.totalExp += expData.exposure
        catEntry.count++
        categoryAgg.set(category, catEntry)

        // Por nivel (acotadoGroup)
        const level = emp.acotadoGroup ?? 'sin_asignar'
        const lvlEntry = levelAgg.get(level) ?? { totalExp: 0, count: 0 }
        lvlEntry.totalExp += expData.exposure
        lvlEntry.count++
        levelAgg.set(level, lvlEntry)

        // Por ocupación
        const occEntry = occupationAgg.get(socCode)
        if (occEntry) {
          occEntry.count++
        } else {
          occupationAgg.set(socCode, { title: expData.title, exposure: expData.exposure, count: 1 })
        }
      }

      const avgExposure = mappedCount > 0
        ? Math.round((totalExposure / mappedCount) * 10000) / 10000
        : 0

      // Formatear agregaciones
      const byCategory: Record<string, { avgExposure: number; headcount: number }> = {}
      for (const [cat, data] of categoryAgg) {
        byCategory[cat] = {
          avgExposure: Math.round((data.totalExp / data.count) * 10000) / 10000,
          headcount: data.count,
        }
      }

      const byLevel: Record<string, { avgExposure: number; headcount: number }> = {}
      for (const [level, data] of levelAgg) {
        byLevel[level] = {
          avgExposure: Math.round((data.totalExp / data.count) * 10000) / 10000,
          headcount: data.count,
        }
      }

      const topExposedOccupations = [...occupationAgg.entries()]
        .map(([socCode, data]) => ({
          socCode,
          title: data.title,
          exposure: data.exposure,
          employeeCount: data.count,
        }))
        .sort((a, b) => b.exposure - a.exposure)
        .slice(0, TOP_OCCUPATIONS_LIMIT)

      const mappedPct = employees.length > 0 ? mappedCount / employees.length : 0
      const confidence = mappedPct >= 0.7 ? 'high' : mappedPct >= 0.3 ? 'medium' : 'low'

      return {
        accountId,
        avgExposure,
        totalEmployees: employees.length,
        mappedEmployees: mappedCount,
        highExposureCount,
        byCategory,
        byLevel,
        topExposedOccupations,
        confidence,
      }
    } catch (error) {
      console.error('[AIExposureService] getOrganizationExposure error:', error instanceof Error ? error.message : 'unknown')
      return {
        accountId,
        avgExposure: 0,
        totalEmployees: 0,
        mappedEmployees: 0,
        highExposureCount: 0,
        byCategory: {},
        byLevel: {},
        topExposedOccupations: [],
        confidence: 'low',
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // 4. DESCRIPTOR-BASED EXPOSURE — desde tareas editadas por el cliente
  // Lee JobDescriptor.responsibilities (JSON snapshot) y calcula exposure
  // como promedio ponderado de betaScore × importance de tareas ACTIVAS.
  // Compara con el genérico de O*NET para mostrar el delta.
  // ──────────────────────────────────────────────────────────────────────

  static async getExposureFromDescriptor(
    jobDescriptorId: string,
    accountId: string
  ): Promise<DescriptorExposureResult> {
    const defaultResult: DescriptorExposureResult = {
      adjustedExposure: 0,
      adjustedAutomationShare: 0,
      adjustedAugmentationShare: 0,
      activeTasks: 0,
      totalTasks: 0,
      genericExposure: 0,
      genericAutomationShare: 0,
      delta: 0,
      deltaDirection: 'same',
      socCode: null,
      occupationTitle: 'Sin clasificar',
      confidence: 'low',
    }

    try {
      // 1. Query descriptor con seguridad multi-tenant
      const descriptor = await prisma.jobDescriptor.findFirst({
        where: { id: jobDescriptorId, accountId },
        select: {
          socCode: true,
          jobTitle: true,
          responsibilities: true,
          occupation: {
            select: { titleEn: true, titleEs: true },
          },
        },
      })

      if (!descriptor) return defaultResult

      const occupationTitle = descriptor.occupation?.titleEs
        ?? descriptor.occupation?.titleEn
        ?? descriptor.jobTitle

      // 2. Parsear responsibilities JSON → filtrar activas
      const responsibilities = (descriptor.responsibilities as any[]) ?? []
      const allTasks = responsibilities.length
      const activeTasks = responsibilities.filter((t: any) => t.isActive !== false)

      if (activeTasks.length === 0) {
        return { ...defaultResult, socCode: descriptor.socCode, occupationTitle, totalTasks: allTasks }
      }

      // 3. Promedio ponderado: Σ(importance × betaScore) / Σ(importance)
      let sumExposure = 0
      let sumAutomation = 0
      let sumWeight = 0
      let tasksWithBeta = 0

      for (const task of activeTasks) {
        const importance = (task.importance as number) ?? 3.0
        const betaScore = task.betaScore as number | null
        const isAutomated = task.isAutomated === true

        if (betaScore !== null && betaScore !== undefined) {
          sumExposure += importance * betaScore
          tasksWithBeta++
        }
        if (isAutomated) {
          sumAutomation += importance
        }
        sumWeight += importance
      }

      const adjustedExposure = sumWeight > 0 && tasksWithBeta > 0
        ? Math.round((sumExposure / sumWeight) * 10000) / 10000
        : 0

      const adjustedAutomationShare = sumWeight > 0
        ? Math.round((sumAutomation / sumWeight) * 10000) / 10000
        : 0

      const adjustedAugmentationShare = Math.max(0,
        Math.round((adjustedExposure - adjustedAutomationShare) * 10000) / 10000
      )

      // 4. Obtener exposure genérica de O*NET via método existente
      let genericExposure = 0
      let genericAutomationShare = 0

      if (descriptor.socCode) {
        const generic = await this.getExposure(descriptor.socCode)
        genericExposure = generic.observedExposure
        genericAutomationShare = generic.automationShare
      }

      // 5. Calcular delta
      const delta = Math.round((adjustedExposure - genericExposure) * 10000) / 10000
      const deltaDirection: DescriptorExposureResult['deltaDirection'] =
        delta > 0.01 ? 'higher' : delta < -0.01 ? 'lower' : 'same'

      // 6. Confidence basada en cobertura de betaScore
      const betaCoverage = activeTasks.length > 0 ? tasksWithBeta / activeTasks.length : 0
      const confidence = betaCoverage >= 0.7 ? 'high' : betaCoverage >= 0.3 ? 'medium' : 'low'

      return {
        adjustedExposure,
        adjustedAutomationShare,
        adjustedAugmentationShare,
        activeTasks: activeTasks.length,
        totalTasks: allTasks,
        genericExposure,
        genericAutomationShare,
        delta,
        deltaDirection,
        socCode: descriptor.socCode,
        occupationTitle,
        confidence,
      }
    } catch (error) {
      console.error('[AIExposureService] getExposureFromDescriptor error:', error instanceof Error ? error.message : 'unknown')
      return defaultResult
    }
  }
}
