// ════════════════════════════════════════════════════════════════════════════
// API: POST /api/pdi/generate-suggestion
// Genera PDI con sugerencias inteligentes del PDISuggestionEngine
// FIX: Upsert (race condition) + parallel queries (performance)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { PDISuggestionEngine } from '@/lib/services/PDISuggestionEngine'
import { PerformanceResultsService } from '@/lib/services/PerformanceResultsService'
import { RoleFitAnalyzer } from '@/lib/services/RoleFitAnalyzer'
import { DevelopmentGapType } from '@prisma/client'
import type { GapAnalysisInput, PerformanceTrack } from '@/lib/types/pdi-suggestion'
import { z } from 'zod'

const GeneratePDISchema = z.object({
  employeeId: z.string(),
  cycleId: z.string()
})

export async function POST(request: NextRequest) {
  const t0 = Date.now()
  try {
    // 1. Auth
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Validar body
    const body = await request.json()
    const { employeeId, cycleId } = GeneratePDISchema.parse(body)

    // 3. Ejecutar queries independientes en paralelo
    const [currentEmployee, employee, cycle] = await Promise.all([
      prisma.employee.findFirst({
        where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' }
      }),
      prisma.employee.findFirst({
        where: { id: employeeId, accountId: userContext.accountId },
        select: { id: true, managerId: true, performanceTrack: true, accountId: true, fullName: true, email: true }
      }),
      prisma.performanceCycle.findFirst({
        where: { id: cycleId, accountId: userContext.accountId }
      })
    ])

    const t1 = Date.now()
    console.log(`[PDI] Parallel queries: ${t1 - t0}ms`)

    if (!currentEmployee) {
      return NextResponse.json({ success: false, error: 'Empleado no encontrado' }, { status: 404 })
    }
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Colaborador no encontrado' }, { status: 404 })
    }
    if (!cycle) {
      return NextResponse.json({ success: false, error: 'Ciclo no encontrado' }, { status: 404 })
    }

    // 4. Verificar ownership
    if (employee.managerId !== currentEmployee.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para crear PDI de este colaborador' },
        { status: 403 }
      )
    }

    // 5. Calcular Role Fit (capturar resultado para el frontend)
    const track = (employee.performanceTrack as PerformanceTrack) || 'COLABORADOR'
    const roleFit = await RoleFitAnalyzer.calculateRoleFit(employeeId, cycleId)

    let suggestions = await PDISuggestionEngine.generateFromRoleFit(employeeId, cycleId, track)

    if (suggestions.length === 0) {
      console.log('[PDI] No Role Fit gaps, fallback a método legacy (Self vs Manager)')
      const results360 = await PerformanceResultsService.getEvaluateeResults(cycleId, employeeId)

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

      suggestions = PDISuggestionEngine.generateSuggestions(gaps, track)
    }

    const t3 = Date.now()
    console.log(`[PDI] RoleFit + Engine: ${t3 - t1}ms`)

    // ════════════════════════════════════════════════════════════════════════════
    // 7.5 VERIFICAR SI YA EXISTE PDI EN DRAFT (NO REGENERAR)
    // ════════════════════════════════════════════════════════════════════════════

    const existingPDI = await prisma.developmentPlan.findUnique({
      where: { employeeId_cycleId: { employeeId, cycleId } },
      include: {
        goals: { orderBy: { priority: 'asc' } },
        employee: { select: { fullName: true, email: true } }
      }
    })

    // Si existe en DRAFT y tiene goals → retornar el existente SIN regenerar
    if (existingPDI && existingPDI.status === 'DRAFT' && existingPDI.goals.length > 0) {
      console.log(`[PDI] Existing DRAFT found (${existingPDI.id}), returning without regeneration`)

      const t4 = Date.now()

      return NextResponse.json({
        success: true,
        data: existingPDI,
        meta: {
          suggestionsGenerated: existingPDI.goals.length,
          executiveSummary: 'PDI existente cargado sin regenerar',
          roleFit: roleFit ? {
            roleFitScore: roleFit.roleFitScore,
            standardJobLevel: roleFit.standardJobLevel,
            gaps: roleFit.gaps,
            summary: roleFit.summary
          } : null,
          enrichedSuggestions: existingPDI.goals.map(g => ({
            competencyCode: g.competencyCode,
            coachingTip: '',
            estimatedWeeks: 8,
            action: ''
          })),
          fromCache: true,
          timing: { total: t4 - t0, queries: t1 - t0, cached: true }
        }
      })
    }

    // Si existe pero NO está en DRAFT → 409 Conflict
    if (existingPDI && existingPDI.status !== 'DRAFT') {
      console.log(`[PDI] Existing PDI in ${existingPDI.status}, cannot regenerate`)

      return NextResponse.json({
        success: false,
        error: `PDI ya existe en estado ${existingPDI.status}`,
        existingId: existingPDI.id,
        existingStatus: existingPDI.status
      }, { status: 409 })
    }

    // Si no existe O existe sin goals → continuar con generación normal
    console.log(`[PDI] No existing DRAFT with goals, proceeding with generation`)

    // 8. Upsert PDI con goals — resuelve race condition P2002
    const goalsData = suggestions.map(s => ({
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

    const originGap = JSON.parse(JSON.stringify({
      suggestions: suggestions.map(s => ({
        competencyCode: s.competencyCode,
        competencyName: s.competencyName,
        gapType: s.gapType,
        originalGap: s.originalGap,
        priority: s.priority
      })),
      generatedAt: new Date().toISOString()
    }))

    const pdi = await prisma.$transaction(async (tx) => {
      // Borrar goals anteriores si ya existía el PDI (scoped por accountId para multi-tenant)
      await tx.developmentGoal.deleteMany({
        where: { plan: { employeeId, cycleId, accountId: employee.accountId } }
      })

      return tx.developmentPlan.upsert({
        where: { employeeId_cycleId: { employeeId, cycleId } },
        update: {
          managerId: currentEmployee.id,
          status: 'DRAFT',
          aiSuggestionsUsed: true,
          originGapAnalysis: originGap,
          goals: { create: goalsData }
        },
        create: {
          accountId: employee.accountId,
          employeeId,
          managerId: currentEmployee.id,
          cycleId,
          status: 'DRAFT',
          aiSuggestionsUsed: true,
          originGapAnalysis: originGap,
          goals: { create: goalsData }
        },
        include: {
          goals: { orderBy: { priority: 'asc' } },
          employee: { select: { fullName: true, email: true } }
        }
      })
    })

    const t4 = Date.now()
    console.log(`[PDI] Upsert transaction: ${t4 - t3}ms | TOTAL: ${t4 - t0}ms`)

    return NextResponse.json({
      success: true,
      data: pdi,
      meta: {
        suggestionsGenerated: suggestions.length,
        executiveSummary: PDISuggestionEngine.generateExecutiveSummary(suggestions),
        roleFit: roleFit ? {
          roleFitScore: roleFit.roleFitScore,
          standardJobLevel: roleFit.standardJobLevel,
          gaps: roleFit.gaps,
          summary: roleFit.summary
        } : null,
        enrichedSuggestions: suggestions.map(s => ({
          competencyCode: s.competencyCode,
          coachingTip: s.coachingTip,
          estimatedWeeks: s.suggestion.estimatedWeeks || 8,
          action: s.suggestion.action
        })),
        timing: { total: t4 - t0, queries: t1 - t0, engine: t3 - t1, upsert: t4 - t3 }
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
