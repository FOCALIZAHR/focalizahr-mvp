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
  description: string | null
  behaviors: string[]
  category: string | null
  audienceRule: { minTrack: string } | null
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
  dominantTrack: string | null // COLABORADOR | MANAGER | EJECUTIVO
  topCandidates: Array<{ socCode: string; score: number; occupationTitle: string | null; taskCount: number }> | null
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

    // 5. Determinar track dominante del cargo (para filtrar competencias)
    let dominantTrack: string | null = null
    try {
      const trackCounts = await prisma.employee.groupBy({
        by: ['performanceTrack'],
        where: { accountId, position: jobTitle, isActive: true, performanceTrack: { not: null } },
        _count: { performanceTrack: true },
        orderBy: { _count: { performanceTrack: 'desc' } },
      })
      if (trackCounts.length > 0) {
        dominantTrack = trackCounts[0].performanceTrack
      }
    } catch {
      // degradación graceful — no filtra
    }

    // 6. Competencias del cliente filtradas por track del cargo
    const TRACK_LEVEL: Record<string, number> = { COLABORADOR: 1, MANAGER: 2, EJECUTIVO: 3 }
    const trackLevel = dominantTrack ? (TRACK_LEVEL[dominantTrack] ?? 1) : 3 // sin track → mostrar todas

    let competencies: ProposedCompetency[] = []
    try {
      const accountCompetencies = await CompetencyService.getByAccount(accountId, {
        activeOnly: true,
      })
      competencies = accountCompetencies
        .filter(c => {
          const rule = c.audienceRule as { minTrack?: string } | null
          if (!rule?.minTrack) return true // null = CORE, todos la ven
          const minLevel = TRACK_LEVEL[rule.minTrack] ?? 1
          return trackLevel >= minLevel
        })
        .map(c => ({
          code: c.code,
          name: c.name,
          description: c.description ?? null,
          behaviors: Array.isArray(c.behaviors) ? (c.behaviors as string[]) : [],
          category: c.category ?? null,
          audienceRule: c.audienceRule as { minTrack: string } | null,
          expectedLevel: null,
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
      dominantTrack,
      topCandidates: !socCode
        ? await this.findCandidatesByTaskSimilarity(jobTitle)
        : null,
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // FIND CANDIDATES BY TASK SIMILARITY
  // Busca SOC codes cuyas tareas contengan keywords del cargo input.
  // % = (tareas que matchean / total tareas del SOC) × 100
  // ──────────────────────────────────────────────────────────────────────

  private static async findCandidatesByTaskSimilarity(
    jobTitle: string
  ): Promise<Array<{ socCode: string; score: number; occupationTitle: string | null; taskCount: number }> | null> {
    try {
      // Extract keywords from job title (min 3 chars, skip stopwords)
      const STOPWORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'con', 'para', 'por', 'una', 'uno', 'que', 'and', 'the', 'of'])
      const keywords = jobTitle
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .split(/[\s\-_\/\(\)]+/)
        .filter(w => w.length >= 3 && !STOPWORDS.has(w))

      if (keywords.length === 0) return null

      // Build OR condition: any task description (es or en) contains any keyword
      const orConditions = keywords.flatMap(kw => [
        { taskDescriptionEs: { contains: kw, mode: 'insensitive' as const } },
        { taskDescription: { contains: kw, mode: 'insensitive' as const } },
      ])

      // Find tasks matching any keyword, grouped by socCode
      const matchingTasks = await prisma.onetTask.findMany({
        where: { OR: orConditions },
        select: { socCode: true, id: true },
      })

      if (matchingTasks.length === 0) return null

      // Count matches per SOC code
      const matchCountBySoc: Record<string, Set<string>> = {}
      for (const t of matchingTasks) {
        if (!matchCountBySoc[t.socCode]) matchCountBySoc[t.socCode] = new Set()
        matchCountBySoc[t.socCode].add(t.id)
      }

      // Get total task counts for each candidate SOC
      const socCodes = Object.keys(matchCountBySoc)
      const totalCounts = await prisma.onetTask.groupBy({
        by: ['socCode'],
        where: { socCode: { in: socCodes } },
        _count: { id: true },
      })

      const totalMap: Record<string, number> = {}
      for (const row of totalCounts) {
        totalMap[row.socCode] = row._count.id
      }

      // Get occupation titles
      const occupations = await prisma.onetOccupation.findMany({
        where: { socCode: { in: socCodes } },
        select: { socCode: true, titleEs: true, titleEn: true },
      })
      const titleMap: Record<string, string> = {}
      for (const occ of occupations) {
        titleMap[occ.socCode] = occ.titleEs ?? occ.titleEn ?? occ.socCode
      }

      // Calculate similarity score: (matching tasks / total tasks) × 100
      const candidates = socCodes
        .map(soc => {
          const matchCount = matchCountBySoc[soc].size
          const totalCount = totalMap[soc] ?? 1
          const score = Math.round((matchCount / totalCount) * 100)
          return {
            socCode: soc,
            score,
            occupationTitle: titleMap[soc] ?? null,
            taskCount: totalCount,
          }
        })
        .filter(c => c.score > 0 && c.taskCount > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)

      return candidates.length > 0 ? candidates : null
    } catch (e) {
      console.warn('[JobDescriptorService] findCandidatesByTaskSimilarity error:', e)
      return null
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // CARGAR TAREAS PARA UN SOC CODE (selección manual de candidato)
  // ──────────────────────────────────────────────────────────────────────

  static async loadTasksForSocCode(socCode: string): Promise<{
    purpose: string | null
    tasks: ProposedTask[]
    occupationTitle: string | null
  }> {
    const occupation = await prisma.onetOccupation.findUnique({
      where: { socCode },
      include: {
        tasks: { orderBy: { importance: 'desc' }, take: 25 },
      },
    })

    if (!occupation) return { purpose: null, tasks: [], occupationTitle: null }

    const purpose = occupation.description
      ?? (occupation.titleEs
        ? `Responsable de las funciones asociadas a ${occupation.titleEs.toLowerCase()} dentro de la organización.`
        : null)

    const tasks: ProposedTask[] = occupation.tasks.map(t => ({
      taskId: t.id,
      description: t.taskDescriptionEs ?? t.taskDescription,
      importance: t.importance,
      betaScore: t.betaScore,
      isAutomated: t.isAutomated,
      isActive: true,
      isFromOnet: true,
    }))

    return {
      purpose,
      tasks,
      occupationTitle: occupation.titleEs ?? occupation.titleEn ?? null,
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

    // findFirst to avoid composite key mismatch (departmentId '' vs null)
    const existing = await prisma.jobDescriptor.findFirst({
      where: { accountId, jobTitle: data.jobTitle },
      select: { id: true },
    })

    const payload = {
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
    }

    if (existing) {
      return prisma.jobDescriptor.update({
        where: { id: existing.id },
        data: { ...payload, updatedAt: new Date() },
      })
    }

    return prisma.jobDescriptor.create({
      data: {
        accountId,
        jobTitle: data.jobTitle,
        departmentId: data.departmentId ?? '',
        ...payload,
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
    accountId: string,
    departmentIds?: string[]
  ): Promise<PositionWithStatus[]> {
    // 1. Obtener posiciones únicas con headcount (filtrado jerárquico)
    const whereClause: any = {
      accountId,
      isActive: true,
      status: 'ACTIVE',
      position: { not: null },
    }
    if (departmentIds && departmentIds.length > 0) {
      whereClause.departmentId = { in: departmentIds }
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
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
  static async getSummary(accountId: string, departmentIds?: string[]): Promise<DescriptorSummary> {
    const positions = await this.listPositionsWithStatus(accountId, departmentIds)

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
