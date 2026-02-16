// ════════════════════════════════════════════════════════════════════════════
// API: POST /api/pdi/generate-suggestion
// Genera PDI con sugerencias inteligentes del PDISuggestionEngine
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { PDISuggestionEngine } from '@/lib/services/PDISuggestionEngine'
import { PerformanceResultsService } from '@/lib/services/PerformanceResultsService'
import { DevelopmentGapType } from '@prisma/client'
import type { GapAnalysisInput, PerformanceTrack } from '@/lib/types/pdi-suggestion'
import { z } from 'zod'

const GeneratePDISchema = z.object({
  employeeId: z.string(),
  cycleId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Resolver Employee del usuario logueado (manager)
    const currentEmployee = await prisma.employee.findFirst({
      where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' }
    })

    if (!currentEmployee) {
      return NextResponse.json({ success: false, error: 'Empleado no encontrado' }, { status: 404 })
    }

    // 3. Validar body
    const body = await request.json()
    const { employeeId, cycleId } = GeneratePDISchema.parse(body)

    // 4. Verificar que el empleado target existe y pertenece a la misma cuenta
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, accountId: userContext.accountId },
      select: { id: true, managerId: true, performanceTrack: true, accountId: true, fullName: true, email: true }
    })

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Colaborador no encontrado' }, { status: 404 })
    }

    // 5. Verificar ownership: el usuario logueado debe ser manager del empleado
    if (employee.managerId !== currentEmployee.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para crear PDI de este colaborador' },
        { status: 403 }
      )
    }

    // 6. Verificar que no exista PDI para este ciclo
    const existingPDI = await prisma.developmentPlan.findUnique({
      where: { employeeId_cycleId: { employeeId, cycleId } }
    })

    if (existingPDI) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un PDI para este colaborador en este ciclo', existingId: existingPDI.id },
        { status: 409 }
      )
    }

    // 7. Verificar que el ciclo pertenece a la cuenta
    const cycle = await prisma.performanceCycle.findFirst({
      where: { id: cycleId, accountId: userContext.accountId }
    })

    if (!cycle) {
      return NextResponse.json({ success: false, error: 'Ciclo no encontrado' }, { status: 404 })
    }

    // 8. Obtener resultados 360 del ciclo
    const results360 = await PerformanceResultsService.getEvaluateeResults(cycleId, employeeId)

    // 9. Transformar competencyScores a GapAnalysisInput para el engine
    const gaps: GapAnalysisInput[] = results360.competencyScores
      .filter((cs: { selfScore: number | null; managerScore: number | null }) => cs.selfScore !== null && cs.managerScore !== null)
      .map((cs: { competencyCode: string; competencyName: string; selfScore: number | null; managerScore: number | null; peerAvgScore: number | null; overallAvgScore: number }) => {
        const selfScore = cs.selfScore!
        const managerScore = cs.managerScore!
        const gap = selfScore - managerScore

        let gapType: DevelopmentGapType
        if (gap >= 0.5) {
          gapType = 'BLIND_SPOT'
        } else if (gap <= -0.5) {
          gapType = 'HIDDEN_STRENGTH'
        } else if (cs.overallAvgScore < 3.0) {
          gapType = 'DEVELOPMENT_AREA'
        } else {
          gapType = 'DEVELOPMENT_AREA'
        }

        return {
          competencyCode: cs.competencyCode,
          competencyName: cs.competencyName,
          selfScore,
          managerScore,
          peerAvgScore: cs.peerAvgScore ?? undefined,
          gapType,
          gapValue: gap
        }
      })

    // 10. Ejecutar PDISuggestionEngine
    const track = (employee.performanceTrack as PerformanceTrack) || 'COLABORADOR'
    const suggestions = PDISuggestionEngine.generateSuggestions(gaps, track)

    // 11. Crear PDI con goals sugeridos
    const pdi = await prisma.developmentPlan.create({
      data: {
        accountId: employee.accountId,
        employeeId,
        managerId: currentEmployee.id,
        cycleId,
        status: 'DRAFT',
        aiSuggestionsUsed: true,
        originGapAnalysis: JSON.parse(JSON.stringify({
          competencyScores: results360.competencyScores,
          gapAnalysis: results360.gapAnalysis,
          generatedAt: new Date().toISOString()
        })),
        goals: {
          create: suggestions.map(s => ({
            competencyCode: s.competencyCode,
            competencyName: s.competencyName,
            originalGap: s.originalGap,
            gapType: s.gapType,
            title: s.suggestion.title,
            description: s.suggestion.description,
            targetOutcome: s.suggestion.targetOutcome,
            priority: s.priority,
            category: s.suggestion.category,
            targetDate: calculateTargetDate(s.suggestion.estimatedWeeks || 8),
            suggestedResources: s.suggestion.suggestedResources as any,
            aiGenerated: true
          }))
        }
      },
      include: {
        goals: { orderBy: { priority: 'asc' } },
        employee: { select: { fullName: true, email: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: pdi,
      meta: {
        suggestionsGenerated: suggestions.length,
        executiveSummary: PDISuggestionEngine.generateExecutiveSummary(suggestions)
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('[API] Error POST /api/pdi/generate-suggestion:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}

function calculateTargetDate(weeks: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + (weeks * 7))
  return date
}
