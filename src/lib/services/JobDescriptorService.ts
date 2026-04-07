// ════════════════════════════════════════════════════════════════════════════
// JOB DESCRIPTOR SERVICE — Generación y gestión de descriptores de cargo
// src/lib/services/JobDescriptorService.ts
// ════════════════════════════════════════════════════════════════════════════
// Producto independiente. Consume O*NET + OccupationMapper + CompetencyService.
// Flujo: generateProposal() → UI muestra → HR edita → saveDescriptor() → confirmDescriptor()
//
// CRÍTICO: responsibilities JSON es snapshot inmutable.
// Cada tarea persiste importance, betaScore e isAutomated de O*NET
// para que Fase 4 lea directo sin re-consultar la tabla global.
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { OccupationMapper } from './OccupationMapper'
import { CompetencyService } from './CompetencyService'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface ProposedTask {
  taskId: string
  description: string
  importance: number
  betaScore: number | null
  isAutomated: boolean
  isActive: boolean
  isFromOnet: boolean
}

export interface ProposedSkill {
  skillName: string
  levelRequired: number
  importance: number
}

export interface ProposedCompetency {
  code: string
  name: string
  expectedLevel: number | null
  source: string
}

export interface DescriptorProposal {
  jobTitle: string
  socCode: string | null
  occupationTitle: string | null
  matchConfidence: string

  purpose: string | null
  tasks: ProposedTask[]
  skills: ProposedSkill[]
  competencies: ProposedCompetency[]

  totalTasks: number
  jobZone: number | null
  educationLevel: string | null
}

export interface TaskSearchResult {
  taskId: string
  description: string
  socCode: string
  occupationTitle: string
  importance: number
  betaScore: number | null
  isAutomated: boolean
}

export interface PositionWithStatus {
  jobTitle: string
  employeeCount: number
  departmentNames: string[]
  descriptorStatus: 'CONFIRMED' | 'DRAFT' | 'NONE'
  matchConfidence: string | null
  socCode: string | null
}

export interface DescriptorSummary {
  totalPositions: number
  confirmed: number
  draft: number
  pending: number
  totalEmployees: number
  employeesCovered: number
  estimatedHoursSaved: number
}

export interface SaveDescriptorInput {
  jobTitle: string
  socCode?: string | null
  secondarySocCode?: string | null
  departmentId?: string | null
  standardJobLevel?: string | null
  standardCategory?: string | null
  purpose?: string | null
  purposeSource?: string
  responsibilities?: any[]
  competencies?: any[]
  requirements?: any
  matchConfidence?: string
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class JobDescriptorService {

  // ──────────────────────────────────────────────────────────────────────
  // GENERACIÓN DE PROPUESTA (no persiste — UI muestra, HR edita)
  // ──────────────────────────────────────────────────────────────────────

  static async generateProposal(
    jobTitle: string,
    accountId: string,
    departmentId?: string
  ): Promise<DescriptorProposal> {
    // 1. Clasificar cargo → SOC code
    const classification = await OccupationMapper.classify(jobTitle, accountId)

    const socCode = classification.socCode
    let purpose: string | null = null
    let tasks: ProposedTask[] = []
    let skills: ProposedSkill[] = []
    let jobZone: number | null = null
    let educationLevel: string | null = null

    if (socCode) {
      // 2. Obtener ocupación con datos
      const occupation = await prisma.onetOccupation.findUnique({
        where: { socCode },
        include: {
          tasks: {
            orderBy: { importance: 'desc' },
            take: 25, // Top 25 tareas por importancia
          },
          skills: {
            orderBy: { importance: 'desc' },
            take: 20, // Top 20 skills
          },
        },
      })

      if (occupation) {
        jobZone = occupation.jobZone
        educationLevel = occupation.educationLevel

        // Purpose: prefer O*NET description, fallback to title template
        if (occupation.description) {
          purpose = occupation.description
        } else if (occupation.titleEs) {
          purpose = `Responsable de las funciones asociadas a ${occupation.titleEs.toLowerCase()} dentro de la organización.`
        } else if (occupation.titleEn) {
          purpose = `Responsable de las funciones asociadas a ${occupation.titleEn.toLowerCase()} dentro de la organización.`
        }

        // 3. Tareas con snapshot completo (importance, betaScore, isAutomated)
        tasks = occupation.tasks.map(t => ({
          taskId: t.id,
          description: t.taskDescriptionEs ?? t.taskDescription,
          importance: t.importance,
          betaScore: t.betaScore,
          isAutomated: t.isAutomated,
          isActive: true,
          isFromOnet: true,
        }))

        // 4. Skills
        skills = occupation.skills.map(s => ({
          skillName: s.skillNameEs ?? s.skillName,
          levelRequired: s.levelRequired,
          importance: s.importance,
        }))
      }
    }

    // 5. Competencias del cliente (por performanceTrack si existe)
    let competencies: ProposedCompetency[] = []
    try {
      const accountCompetencies = await CompetencyService.getByAccount(accountId, {
        activeOnly: true,
      })
      competencies = accountCompetencies.map(c => ({
        code: c.code,
        name: c.name,
        expectedLevel: null, // El nivel se define por cargo, no por competencia global
        source: 'company_library',
      }))
    } catch {
      // CompetencyService puede no estar inicializado — degradación graceful
    }

    return {
      jobTitle,
      socCode,
      occupationTitle: classification.occupationTitle,
      matchConfidence: classification.confidence,
      purpose,
      tasks,
      skills,
      competencies,
      totalTasks: tasks.length,
      jobZone,
      educationLevel,
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // BÚSQUEDA DE TAREAS (para "+ Agregar de otra área")
  // ──────────────────────────────────────────────────────────────────────

  static async searchTasks(
    query: string,
    excludeSocCode?: string,
    limit: number = 20
  ): Promise<TaskSearchResult[]> {
    if (!query || query.length < 3) return []

    const whereClause: any = {
      OR: [
        { taskDescription: { contains: query, mode: 'insensitive' } },
        { taskDescriptionEs: { contains: query, mode: 'insensitive' } },
      ],
    }

    if (excludeSocCode) {
      whereClause.socCode = { not: excludeSocCode }
    }

    const tasks = await prisma.onetTask.findMany({
      where: whereClause,
      take: limit,
      orderBy: { importance: 'desc' },
      include: {
        occupation: {
          select: { titleEn: true, titleEs: true },
        },
      },
    })

    return tasks.map(t => ({
      taskId: t.id,
      description: t.taskDescriptionEs ?? t.taskDescription,
      socCode: t.socCode,
      occupationTitle: t.occupation.titleEs ?? t.occupation.titleEn,
      importance: t.importance,
      betaScore: t.betaScore,
      isAutomated: t.isAutomated,
    }))
  }

  // ──────────────────────────────────────────────────────────────────────
  // PERSISTENCIA — guardar descriptor (DRAFT)
  // ──────────────────────────────────────────────────────────────────────

  static async saveDescriptor(
    accountId: string,
    data: SaveDescriptorInput
  ): Promise<any> {
    // Calcular metadata
    const responsibilities = (data.responsibilities ?? []) as any[]
    const onetTasks = responsibilities.filter((t: any) => t.isFromOnet)
    const activeTasks = responsibilities.filter((t: any) => t.isActive)
    const clientTasks = responsibilities.filter((t: any) => !t.isFromOnet)

    // Detectar secondarySocCode si hay tareas de otro SOC
    const socCodes = new Set(
      responsibilities
        .filter((t: any) => t.isFromOnet && t.socCode)
        .map((t: any) => t.socCode)
    )
    const secondarySocCode = data.secondarySocCode ??
      ([...socCodes].find(s => s !== data.socCode) ?? null)

    // Contar empleados con este cargo
    const employeeCount = await prisma.employee.count({
      where: {
        accountId,
        isActive: true,
        status: 'ACTIVE',
        position: { contains: data.jobTitle, mode: 'insensitive' },
      },
    })

    return prisma.jobDescriptor.upsert({
      where: {
        accountId_jobTitle_departmentId: {
          accountId,
          jobTitle: data.jobTitle,
          departmentId: data.departmentId ?? '',
        },
      },
      update: {
        socCode: data.socCode,
        secondarySocCode,
        standardJobLevel: data.standardJobLevel,
        standardCategory: data.standardCategory,
        purpose: data.purpose,
        purposeSource: data.purposeSource ?? 'onet_generated',
        responsibilities: data.responsibilities as any,
        competencies: data.competencies as any,
        requirements: data.requirements as any,
        matchConfidence: data.matchConfidence,
        onetTasksTotal: onetTasks.length,
        onetTasksKept: activeTasks.filter((t: any) => t.isFromOnet).length,
        clientTasksAdded: clientTasks.length,
        employeeCount,
        updatedAt: new Date(),
      },
      create: {
        accountId,
        jobTitle: data.jobTitle,
        socCode: data.socCode,
        secondarySocCode,
        departmentId: data.departmentId,
        standardJobLevel: data.standardJobLevel,
        standardCategory: data.standardCategory,
        purpose: data.purpose,
        purposeSource: data.purposeSource ?? 'onet_generated',
        responsibilities: data.responsibilities as any,
        competencies: data.competencies as any,
        requirements: data.requirements as any,
        matchConfidence: data.matchConfidence,
        onetTasksTotal: onetTasks.length,
        onetTasksKept: activeTasks.filter((t: any) => t.isFromOnet).length,
        clientTasksAdded: clientTasks.length,
        employeeCount,
        status: 'DRAFT',
      },
    })
  }

  // ──────────────────────────────────────────────────────────────────────
  // CONFIRMAR DESCRIPTOR
  // ──────────────────────────────────────────────────────────────────────

  static async confirmDescriptor(
    descriptorId: string,
    accountId: string,
    confirmedBy: string
  ): Promise<any> {
    return prisma.jobDescriptor.update({
      where: { id: descriptorId, accountId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy,
      },
    })
  }

  // ──────────────────────────────────────────────────────────────────────
  // QUERIES — para UI
  // ──────────────────────────────────────────────────────────────────────

  static async getDescriptor(
    accountId: string,
    jobTitle: string,
    departmentId?: string
  ): Promise<any | null> {
    return prisma.jobDescriptor.findUnique({
      where: {
        accountId_jobTitle_departmentId: {
          accountId,
          jobTitle,
          departmentId: departmentId ?? '',
        },
      },
    })
  }

  static async getDescriptorById(
    id: string,
    accountId: string
  ): Promise<any | null> {
    return prisma.jobDescriptor.findFirst({
      where: { id, accountId },
    })
  }

  /**
   * Lista cargos únicos de la nómina con estado de descriptor.
   * JOIN Employee → GROUP BY position → LEFT JOIN JobDescriptor.
   */
  static async listPositionsWithStatus(
    accountId: string
  ): Promise<PositionWithStatus[]> {
    // 1. Obtener posiciones únicas con headcount
    const employees = await prisma.employee.findMany({
      where: {
        accountId,
        isActive: true,
        status: 'ACTIVE',
        position: { not: null },
      },
      select: {
        position: true,
        department: { select: { displayName: true } },
      },
    })

    // Agrupar por position
    const positionMap = new Map<string, {
      count: number
      departments: Set<string>
    }>()

    for (const emp of employees) {
      if (!emp.position) continue
      const key = emp.position.toLowerCase().trim()
      const existing = positionMap.get(key)
      if (existing) {
        existing.count++
        if (emp.department?.displayName) existing.departments.add(emp.department.displayName)
      } else {
        positionMap.set(key, {
          count: 1,
          departments: new Set(emp.department?.displayName ? [emp.department.displayName] : []),
        })
      }
    }

    // 2. Obtener descriptores existentes
    const descriptors = await prisma.jobDescriptor.findMany({
      where: { accountId },
      select: {
        jobTitle: true,
        status: true,
        matchConfidence: true,
        socCode: true,
      },
    })

    const descriptorMap = new Map(
      descriptors.map(d => [d.jobTitle.toLowerCase().trim(), d])
    )

    // 2b. Obtener mappings de OccupationMapping (clasificación masiva)
    const mappings = await prisma.occupationMapping.findMany({
      where: { accountId },
      select: {
        positionText: true,
        socCode: true,
        confidence: true,
      },
    })

    const mappingMap = new Map(
      mappings.map(m => [m.positionText.toLowerCase().trim(), m])
    )

    // 3. Combinar
    const result: PositionWithStatus[] = []

    for (const [positionKey, data] of positionMap) {
      const descriptor = descriptorMap.get(positionKey)
      const mapping = mappingMap.get(positionKey)
      // Buscar el título original (case preservado) del primer employee
      const originalTitle = employees.find(
        e => e.position?.toLowerCase().trim() === positionKey
      )?.position ?? positionKey

      result.push({
        jobTitle: originalTitle,
        employeeCount: data.count,
        departmentNames: [...data.departments],
        descriptorStatus: descriptor
          ? (descriptor.status as 'CONFIRMED' | 'DRAFT')
          : 'NONE',
        matchConfidence: descriptor?.matchConfidence ?? mapping?.confidence ?? null,
        socCode: descriptor?.socCode ?? mapping?.socCode ?? null,
      })
    }

    // Ordenar por headcount DESC (los que impactan más primero)
    return result.sort((a, b) => b.employeeCount - a.employeeCount)
  }

  /**
   * Resumen ejecutivo para portada.
   */
  static async getSummary(accountId: string): Promise<DescriptorSummary> {
    const positions = await this.listPositionsWithStatus(accountId)

    const totalPositions = positions.length
    const confirmed = positions.filter(p => p.descriptorStatus === 'CONFIRMED').length
    const draft = positions.filter(p => p.descriptorStatus === 'DRAFT').length
    const pending = positions.filter(p => p.descriptorStatus === 'NONE').length

    const totalEmployees = positions.reduce((sum, p) => sum + p.employeeCount, 0)
    const employeesCovered = positions
      .filter(p => p.descriptorStatus === 'CONFIRMED')
      .reduce((sum, p) => sum + p.employeeCount, 0)

    // 2.5 horas de consultoría por cargo ahorradas
    const estimatedHoursSaved = confirmed * 2.5

    return {
      totalPositions,
      confirmed,
      draft,
      pending,
      totalEmployees,
      employeesCovered,
      estimatedHoursSaved,
    }
  }
}
