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

export interface SimulatorTask {
  taskId: string
  description: string         // taskDescriptionEs si existe, fallback a inglés
  importance: number
  betaScore: number | null
  isAutomatedHint: boolean
  isActive: boolean
}

export interface SimulatorPayload {
  descriptorId: string
  jobTitle: string
  socCode: string | null
  occupationTitle: string
  standardJobLevel: string | null
  standardCategory: string | null
  employeeCount: number
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

    // OnetOccupation title (cuando hay socCode)
    let occupationTitle = descriptor.jobTitle
    if (descriptor.socCode) {
      const onet = await prisma.onetOccupation.findUnique({
        where: { socCode: descriptor.socCode },
        select: { titleEs: true, titleEn: true },
      })
      if (onet) {
        occupationTitle = onet.titleEs ?? onet.titleEn ?? descriptor.jobTitle
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
      // Datos enriquecibles (taskDescriptionEs, focalizaScore) se leen
      // SIEMPRE de onet_tasks. El contrato del SimulatorTask mantiene
      // `betaScore` como nombre de campo (no romper frontend) pero el VALOR
      // es focalizaScore (Eloundou puro, sin mezcla con Haiku).
      const taskIds = rawTasks.map(t => t.taskId).filter(Boolean)
      const onetTasks = taskIds.length > 0
        ? await prisma.onetTask.findMany({
            where: { id: { in: taskIds } },
            select: { id: true, taskDescriptionEs: true, focalizaScore: true },
          })
        : []
      const onetMap = new Map(
        onetTasks.map(t => [t.id, { descEs: t.taskDescriptionEs, focalizaScore: t.focalizaScore }]),
      )

      tasks = rawTasks.map(t => {
        const fresh = onetMap.get(t.taskId)
        return {
          taskId: t.taskId,
          description: fresh?.descEs ?? t.description,
          importance: t.importance,
          // betaScore en el contrato = focalizaScore de OnetTask (Eloundou)
          betaScore: fresh?.focalizaScore ?? null,
          isAutomatedHint: t.isAutomated,
          isActive: t.isActive !== false,
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
        },
      })

      tasks = onetTasks.map(t => ({
        taskId: t.id,
        description: t.taskDescriptionEs ?? t.taskDescription,
        importance: t.importance,
        // betaScore del contrato = focalizaScore de OnetTask (Eloundou puro)
        betaScore: t.focalizaScore,
        isAutomatedHint: t.isAutomated,
        isActive: true,
      }))
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

    // ── 7. Payload final ────────────────────────────────────────────────
    const payload: SimulatorPayload = {
      descriptorId: descriptor.id,
      jobTitle: descriptor.jobTitle,
      socCode: descriptor.socCode,
      occupationTitle,
      standardJobLevel: descriptor.standardJobLevel,
      standardCategory: descriptor.standardCategory,
      employeeCount: descriptor.employeeCount,
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
