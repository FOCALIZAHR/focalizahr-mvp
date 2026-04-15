// ════════════════════════════════════════════════════════════════════════════
// GET /api/descriptors/proposed/simulator?soc=...&position=...
// src/app/api/descriptors/proposed/simulator/route.ts
// ════════════════════════════════════════════════════════════════════════════
// Endpoint hermano de /api/descriptors/[id]/simulator para cargos PROPUESTOS
// (sin JobDescriptor confirmado) — usa datos teóricos puros de O*NET.
//
// Mismo shape de SimulatorPayload para que el frontend opere uniforme.
// El badge `proposed` indica al usuario la naturaleza teórica del dato.
//
// Query params:
//   - soc:      SOC code (con o sin sufijo .00)
//   - position: positionText literal (case-sensitive, sin normalizar)
//
// RBAC: descriptors:view
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { prisma } from '@/lib/prisma'
import { AIExposureService } from '@/lib/services/AIExposureService'
import { SalaryConfigService } from '@/lib/services/SalaryConfigService'
import { AutomationClassificationService } from '@/lib/services/AutomationClassificationService'
import { socCodeVariants } from '@/lib/utils/socCode'
import type {
  SimulatorPayload,
  SimulatorTask,
  AnthropicDimensionData,
} from '../../[id]/simulator/route'

interface OnetTaskAnthropicFields {
  anthropicDirective: number | null
  anthropicFeedbackLoop: number | null
  anthropicTaskIteration: number | null
  anthropicValidation: number | null
  anthropicLearning: number | null
}

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

/** Modo (valor más frecuente) de un array de strings, ignorando nulls. */
function mode(values: (string | null | undefined)[]): string | null {
  const counts = new Map<string, number>()
  for (const v of values) {
    if (!v) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  let best: string | null = null
  let bestCount = 0
  for (const [k, c] of counts.entries()) {
    if (c > bestCount) {
      best = k
      bestCount = c
    }
  }
  return best
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const soc = searchParams.get('soc')
    const position = searchParams.get('position')
    if (!soc || !position) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros: soc y position' },
        { status: 400 },
      )
    }

    const variants = socCodeVariants(soc)

    // ── 1. OnetOccupation: titulo + focalizaScore (Eloundou) ───────────
    const onet = await prisma.onetOccupation.findFirst({
      where: { socCode: { in: variants } },
      select: { socCode: true, titleEs: true, titleEn: true, focalizaScore: true },
    })
    if (!onet) {
      return NextResponse.json(
        { success: false, error: `SOC ${soc} no encontrado en O*NET` },
        { status: 404 },
      )
    }
    const occupationTitle = onet.titleEs ?? onet.titleEn ?? position
    const occupationFocalizaScore = onet.focalizaScore

    // ── 2. Empleados activos del account con esa position ──────────────
    const employees = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        isActive: true,
        position,
      },
      select: { acotadoGroup: true, standardJobLevel: true },
    })
    const headcount = employees.length

    // Derivar standardJobLevel y acotadoGroup más comunes para salario
    const dominantAcotado = mode(employees.map(e => e.acotadoGroup))
    const dominantJobLevel = mode(employees.map(e => e.standardJobLevel))

    // ── 3. OnetTask del SOC (top 25 por importance) ────────────────────
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

    const sumImportance = onetTasks.reduce((s, t) => s + (t.importance ?? 3), 0)
    const tasks: SimulatorTask[] = onetTasks.map(t => {
      const importance = t.importance ?? 3
      const hoursPerMonth =
        sumImportance > 0
          ? Math.min(40, Math.round((160 * importance) / sumImportance))
          : Math.min(40, Math.floor(160 / Math.max(onetTasks.length, 1)))
      const anthropicData = buildAnthropicData(t)
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
      }
    })

    // ── 4. Salario ──────────────────────────────────────────────────────
    const salaryResult = await SalaryConfigService.getSalaryForAccount(
      userContext.accountId,
      dominantAcotado,
    )
    const costPerHour = salaryResult.monthlySalary / 160

    // ── 5. Métricas derivadas (mismo cálculo que ruta verified) ────────
    const activeScored = tasks.filter(
      t => t.isActive && t.betaScore !== null && t.betaScore !== undefined,
    )
    let rollupClientExposure = 0
    if (activeScored.length > 0) {
      const sumW = activeScored.reduce((s, t) => s + t.importance, 0)
      const sumWX = activeScored.reduce(
        (s, t) => s + t.importance * (t.betaScore as number),
        0,
      )
      rollupClientExposure =
        sumW > 0 ? Math.round((sumWX / sumW) * 10000) / 10000 : 0
    }

    const totalHoursPerMonth = tasks
      .filter(t => t.isActive)
      .reduce((s, t) => s + t.hoursPerMonth, 0)
    const totalCostPerMonth = totalHoursPerMonth * costPerHour

    // ── 6. Baseline desde tasks (mismo algoritmo del fallback hidratación) ─
    let sumExposure = 0
    let sumWeight = 0
    let tasksWithBeta = 0
    for (const t of tasks) {
      const importance = t.importance ?? 3.0
      if (t.betaScore !== null && t.betaScore !== undefined) {
        sumExposure += importance * t.betaScore
        tasksWithBeta++
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

    const generic = await AIExposureService.getExposure(soc)
    const genericExposure = generic?.observedExposure ?? 0
    const delta =
      Math.round((adjustedExposure - genericExposure) * 10000) / 10000

    // ── 7. Payload final ────────────────────────────────────────────────
    const payload: SimulatorPayload = {
      // descriptorId virtual: prefijado para distinguir de uno real
      descriptorId: `prop:${onet.socCode}:${position}`,
      jobTitle: position,
      socCode: onet.socCode,
      occupationTitle,
      occupationFocalizaScore,
      standardJobLevel: dominantJobLevel,
      standardCategory: null,
      headcount,
      employeeCount: headcount,
      costPerHour,
      badgeStatus: 'proposed',
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
        adjustedExposure,
        genericExposure,
        delta,
        activeTasks: tasks.length,
        totalTasks: tasks.length,
        confidence,
      },
    }

    return NextResponse.json({ success: true, data: payload })
  } catch (error: any) {
    console.error('[descriptors/proposed/simulator] GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
