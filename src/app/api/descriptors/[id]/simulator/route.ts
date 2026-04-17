// ════════════════════════════════════════════════════════════════════════════
// GET /api/descriptors/[id]/simulator
// src/app/api/descriptors/[id]/simulator/route.ts
// ════════════════════════════════════════════════════════════════════════════
// Endpoint dedicado al instrumento DescriptorSimulator del Workforce Deck.
// Wrap que junta en UNA llamada:
//   - JobDescriptor + responsibilities (con descripciones traducidas si existen)
//   - Salario base derivado por SalaryConfigService
//   - Baseline de exposición de getExposureFromDescriptor
//
// Response shape: ver SimulatorPayload abajo.
// RBAC: descriptors:view
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { prisma } from '@/lib/prisma'
import { AIExposureService } from '@/lib/services/AIExposureService'
import { SalaryConfigService } from '@/lib/services/SalaryConfigService'
import { AutomationClassificationService } from '@/lib/services/AutomationClassificationService'
import { socCodeVariants } from '@/lib/utils/socCode'

// ────────────────────────────────────────────────────────────────────────────
// TYPES — payload del simulador
// ────────────────────────────────────────────────────────────────────────────

interface ProposedTaskRaw {
  taskId: string
  description: string
  importance: number
  betaScore: number | null
  isAutomated: boolean
  isActive: boolean
  isFromOnet: boolean
}

export interface AnthropicDimensionData {
  directive: number
  feedbackLoop: number
  taskIteration: number
  validation: number
  learning: number
}

export interface SimulatorTask {
  taskId: string
  description: string                    // taskDescriptionEs si existe, fallback a inglés
  descriptionEn: string                  // texto O*NET original (inglés) — para hover tooltip
  importance: number
  hoursPerMonth: number                  // calculado: proporcional a importance, capado en 40
  betaScore: number | null               // = focalizaScore de OnetTask (Eloundou puro)
  isAutomatedHint: boolean
  isActive: boolean
  anthropicData: AnthropicDimensionData | null  // 5 dims crudas (null si no hay)
  /** Frase narrativa (2-3 oraciones) del cruce betaEloundou × dim dominante.
   *  null si no hay anthropicData, señal débil, o combinación sin frase. */
  classificationPhrase: string | null
  // Sistema IPI (Índice de Presión de IA) — ver AutomationClassificationService
  ipi: number
  ipiSemaforo: 'alta' | 'media' | 'baja' | 'sin_señal'
  perfilLabel:
    | 'DELEGACION_ACTIVA'
    | 'AMPLIFICACION_ACTIVA'
    | 'DELEGACION_PARCIAL'
    | 'ASISTENCIA_PRODUCTIVA'
    | 'RESISTENTE'
    | 'CONSULTA_PUNTUAL'
    | 'SIN_PATRON'
  showVerifiedBadge: boolean
}

export interface SimulatorPayload {
  descriptorId: string
  jobTitle: string
  socCode: string | null
  occupationTitle: string
  /** focalizaScore del cargo (Eloundou dv_rating_beta) — indicador PADRE */
  occupationFocalizaScore: number | null
  standardJobLevel: string | null
  standardCategory: string | null

  // Rediseño Patrón G — campos canónicos
  headcount: number                      // alias semántico de employeeCount
  employeeCount: number                  // se mantiene por compatibilidad
  costPerHour: number                    // baseSalary.monthlySalary / 160
  badgeStatus: 'verified' | 'proposed'   // map DRAFT→proposed, CONFIRMED→verified
  rollupClientExposure: number           // Σ(importance × focalizaScore) / Σ(importance) sobre tareas con dato
  totalHoursPerMonth: number             // suma de hoursPerMonth de tasks
  totalCostPerMonth: number              // totalHoursPerMonth × costPerHour

  tasks: SimulatorTask[]
  baseSalary: {
    monthlySalary: number
    source: 'empresa_nivel' | 'empresa_promedio' | 'default_chile'
    confidence: 'high' | 'medium' | 'low'
  }
  baseline: {
    adjustedExposure: number
    genericExposure: number
    delta: number
    activeTasks: number
    totalTasks: number
    confidence: 'high' | 'medium' | 'low'
  }
}

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

interface OnetTaskAnthropicFields {
  anthropicDirective: number | null
  anthropicFeedbackLoop: number | null
  anthropicTaskIteration: number | null
  anthropicValidation: number | null
  anthropicLearning: number | null
}

/**
 * Construye `anthropicData` del SimulatorTask si la tarea tiene al menos
 * una dimensión poblada. Si todas son null, retorna null (el Ecualizador
 * no se renderizará en el frontend).
 */
function buildAnthropicData(
  task: OnetTaskAnthropicFields | undefined,
): AnthropicDimensionData | null {
  if (!task) return null
  const {
    anthropicDirective,
    anthropicFeedbackLoop,
    anthropicTaskIteration,
    anthropicValidation,
    anthropicLearning,
  } = task
  // Si TODAS son null, no hay dato Anthropic para esta tarea
  if (
    anthropicDirective === null &&
    anthropicFeedbackLoop === null &&
    anthropicTaskIteration === null &&
    anthropicValidation === null &&
    anthropicLearning === null
  ) {
    return null
  }
  return {
    directive: anthropicDirective ?? 0,
    feedbackLoop: anthropicFeedbackLoop ?? 0,
    taskIteration: anthropicTaskIteration ?? 0,
    validation: anthropicValidation ?? 0,
    learning: anthropicLearning ?? 0,
  }
}

// ────────────────────────────────────────────────────────────────────────────
// HANDLER
// ────────────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 },
      )
    }
    if (!hasPermission(userContext.role, 'descriptors:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 },
      )
    }

    // ── 1. Cargar descriptor + occupation title ────────────────────────
    const descriptor = await prisma.jobDescriptor.findFirst({
      where: { id: params.id, accountId: userContext.accountId },
    })

    if (!descriptor) {
      return NextResponse.json(
        { success: false, error: 'Descriptor no encontrado' },
        { status: 404 },
      )
    }

    // OnetOccupation title + focalizaScore del cargo (Eloundou)
    let occupationTitle = descriptor.jobTitle
    let occupationFocalizaScore: number | null = null
    if (descriptor.socCode) {
      const variants = socCodeVariants(descriptor.socCode)
      const onet = await prisma.onetOccupation.findFirst({
        where: { socCode: { in: variants } },
        select: { titleEs: true, titleEn: true, focalizaScore: true },
      })
      if (onet) {
        occupationTitle = onet.titleEs ?? onet.titleEn ?? descriptor.jobTitle
        occupationFocalizaScore = onet.focalizaScore
      }
    }

    // ── 2. Parsear responsibilities ────────────────────────────────────
    const rawTasks = (descriptor.responsibilities ?? []) as unknown as ProposedTaskRaw[]

    // Descriptor tiene tareas guardadas? (independiente de betaScore —
    // el betaScore SIEMPRE se lee fresh de onet_tasks, no del snapshot)
    const hasResponsibilities = rawTasks.length > 0

    let tasks: SimulatorTask[] = []

    if (hasResponsibilities) {
      // ── Camino normal: responsibilities existen en BD ─────────────────
      // Estructura (description, importance, isActive) viene del snapshot.
      // Datos enriquecibles (taskDescriptionEs, focalizaScore, 5 dims
      // Anthropic) se leen SIEMPRE de onet_tasks.
      const taskIds = rawTasks.map(t => t.taskId).filter(Boolean)
      const onetTasks = taskIds.length > 0
        ? await prisma.onetTask.findMany({
            where: { id: { in: taskIds } },
            select: {
              id: true,
              taskDescription: true,
              taskDescriptionEs: true,
              focalizaScore: true,
              anthropicDirective: true,
              anthropicFeedbackLoop: true,
              anthropicTaskIteration: true,
              anthropicValidation: true,
              anthropicLearning: true,
            },
          })
        : []
      const onetMap = new Map(onetTasks.map(t => [t.id, t]))

      // Calcular hoursPerMonth proporcional a importance (canónico en backend)
      const activeTasks = rawTasks.filter(t => t.isActive !== false)
      const sumImportance = activeTasks.reduce((s, t) => s + (t.importance ?? 3), 0)

      tasks = rawTasks.map(t => {
        const fresh = onetMap.get(t.taskId)
        const importance = t.importance ?? 3
        const hoursPerMonth = sumImportance > 0
          ? Math.min(40, Math.round((160 * importance) / sumImportance))
          : Math.min(40, Math.floor(160 / Math.max(activeTasks.length, 1)))

        const anthropicData = buildAnthropicData(fresh)
        const beta = fresh?.focalizaScore ?? null
        const classificationPhrase = AutomationClassificationService.getPhrase(
          beta,
          anthropicData,
        )
        const ipiFields = AutomationClassificationService.buildIpiFields(beta, anthropicData)

        return {
          taskId: t.taskId,
          description: fresh?.taskDescriptionEs ?? t.description,
          descriptionEn: fresh?.taskDescription ?? t.description,
          importance,
          hoursPerMonth,
          betaScore: beta,
          isAutomatedHint: t.isAutomated,
          isActive: t.isActive !== false,
          anthropicData,
          classificationPhrase,
          ...ipiFields,
        }
      })
    } else if (descriptor.socCode) {
      // ── Fallback de hidratación: descriptor histórico sin tareas ──────
      // Carga las tareas en vivo desde OnetTask con normalización SOC.
      // No persiste en BD — solo enriquece este response.
      const variants = socCodeVariants(descriptor.socCode)
      const onetTasks = await prisma.onetTask.findMany({
        where: { socCode: { in: variants } },
        orderBy: { importance: 'desc' },
        take: 25,
        select: {
          id: true,
          taskDescription: true,
          taskDescriptionEs: true,
          importance: true,
          focalizaScore: true,
          isAutomated: true,
          anthropicDirective: true,
          anthropicFeedbackLoop: true,
          anthropicTaskIteration: true,
          anthropicValidation: true,
          anthropicLearning: true,
        },
      })

      // Calcular hoursPerMonth proporcional a importance
      const sumImportance = onetTasks.reduce((s, t) => s + (t.importance ?? 3), 0)

      tasks = onetTasks.map(t => {
        const importance = t.importance ?? 3
        const hoursPerMonth = sumImportance > 0
          ? Math.min(40, Math.round((160 * importance) / sumImportance))
          : Math.min(40, Math.floor(160 / Math.max(onetTasks.length, 1)))

        const anthropicData = buildAnthropicData(t)
        const ipiFields = AutomationClassificationService.buildIpiFields(
          t.focalizaScore,
          anthropicData,
        )
        return {
          taskId: t.id,
          description: t.taskDescriptionEs ?? t.taskDescription,
          descriptionEn: t.taskDescription,
          importance,
          hoursPerMonth,
          betaScore: t.focalizaScore,
          isAutomatedHint: t.isAutomated,
          isActive: true,
          anthropicData,
          classificationPhrase: AutomationClassificationService.getPhrase(
            t.focalizaScore,
            anthropicData,
          ),
          ...ipiFields,
        }
      })
    }

    // ── 5. Salario base via SalaryConfigService ────────────────────────
    const salaryResult = await SalaryConfigService.getSalaryForAccount(
      userContext.accountId,
      descriptor.standardJobLevel,
    )

    // ── 6. Baseline de exposición ──────────────────────────────────────
    // Si veníamos del camino normal (responsibilities en BD), usamos
    // getExposureFromDescriptor() que las lee directo. Si veníamos del
    // fallback de hidratación, las responsibilities en BD son inservibles
    // — recalculamos el baseline desde las tasks hidratadas en memoria.
    let exposureBaseline = await AIExposureService.getExposureFromDescriptor(
      params.id,
      userContext.accountId,
    )

    if (!hasResponsibilities && tasks.length > 0) {
      // Fórmula idéntica a getExposureFromDescriptor pero sobre `tasks`
      let sumExposure = 0
      let sumAutomation = 0
      let sumWeight = 0
      let tasksWithBeta = 0
      for (const t of tasks) {
        const importance = t.importance ?? 3.0
        if (t.betaScore !== null && t.betaScore !== undefined) {
          sumExposure += importance * t.betaScore
          tasksWithBeta++
        }
        if (t.isAutomatedHint) {
          sumAutomation += importance
        }
        sumWeight += importance
      }
      const adjustedExposure =
        sumWeight > 0 && tasksWithBeta > 0
          ? Math.round((sumExposure / sumWeight) * 10000) / 10000
          : 0
      const betaCoverage = tasks.length > 0 ? tasksWithBeta / tasks.length : 0
      const confidence: 'high' | 'medium' | 'low' =
        betaCoverage >= 0.7 ? 'high' : betaCoverage >= 0.3 ? 'medium' : 'low'

      // Genérica desde getExposure (ahora con normalización SOC tras el fix)
      const generic = descriptor.socCode
        ? await AIExposureService.getExposure(descriptor.socCode)
        : null
      const genericExposure = generic?.observedExposure ?? 0
      const delta = Math.round((adjustedExposure - genericExposure) * 10000) / 10000

      exposureBaseline = {
        ...exposureBaseline,
        adjustedExposure,
        adjustedAutomationShare: exposureBaseline.adjustedAutomationShare,
        adjustedAugmentationShare: exposureBaseline.adjustedAugmentationShare,
        activeTasks: tasks.length,
        totalTasks: tasks.length,
        genericExposure,
        delta,
        deltaDirection: delta > 0.01 ? 'higher' : delta < -0.01 ? 'lower' : 'same',
        confidence,
      }
    }

    // ── 7. Cálculos derivados (Patrón G — canónicos en backend) ────────
    const costPerHour = salaryResult.monthlySalary / 160
    const badgeStatus: 'verified' | 'proposed' =
      descriptor.status === 'CONFIRMED' ? 'verified' : 'proposed'

    // rollupClientExposure: promedio ponderado por importance de focalizaScore
    const activeScored = tasks.filter(
      t => t.isActive && t.betaScore !== null && t.betaScore !== undefined,
    )
    let rollupClientExposure = 0
    if (activeScored.length > 0) {
      const sumW = activeScored.reduce((s, t) => s + t.importance, 0)
      const sumWX = activeScored.reduce((s, t) => s + t.importance * (t.betaScore as number), 0)
      rollupClientExposure = sumW > 0 ? Math.round((sumWX / sumW) * 10000) / 10000 : 0
    }

    const totalHoursPerMonth = tasks
      .filter(t => t.isActive)
      .reduce((s, t) => s + t.hoursPerMonth, 0)
    const totalCostPerMonth = totalHoursPerMonth * costPerHour

    // ── 8. Payload final ────────────────────────────────────────────────
    const payload: SimulatorPayload = {
      descriptorId: descriptor.id,
      jobTitle: descriptor.jobTitle,
      socCode: descriptor.socCode,
      occupationTitle,
      occupationFocalizaScore,
      standardJobLevel: descriptor.standardJobLevel,
      standardCategory: descriptor.standardCategory,
      headcount: descriptor.employeeCount,
      employeeCount: descriptor.employeeCount,
      costPerHour,
      badgeStatus,
      rollupClientExposure,
      totalHoursPerMonth,
      totalCostPerMonth,
      tasks,
      baseSalary: {
        monthlySalary: salaryResult.monthlySalary,
        source: salaryResult.source,
        confidence: salaryResult.confidence,
      },
      baseline: {
        adjustedExposure: exposureBaseline.adjustedExposure,
        genericExposure: exposureBaseline.genericExposure,
        delta: exposureBaseline.delta,
        activeTasks: exposureBaseline.activeTasks,
        totalTasks: exposureBaseline.totalTasks,
        confidence: exposureBaseline.confidence,
      },
    }

    return NextResponse.json({ success: true, data: payload })
  } catch (error: any) {
    console.error('[descriptors/[id]/simulator] GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
