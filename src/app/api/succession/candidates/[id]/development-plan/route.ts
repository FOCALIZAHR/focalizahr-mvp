// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/candidates/[id]/development-plan
// GET  - Obtener plan de desarrollo de sucesión del candidato
// POST - Crear plan con sugerencias AI desde gaps del candidato
// PUT  - Actualizar visibilidad, estado y progreso de goals
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService'
import { PDISuggestionEngine } from '@/lib/services/PDISuggestionEngine'
import type { GapAnalysisInput, PerformanceTrack } from '@/lib/types/pdi-suggestion'
import { DevelopmentGapType } from '@prisma/client'
import { SuccessionDiagnosisEngine, type DiagnosisInput } from '@/lib/services/SuccessionDiagnosisEngine'

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = extractUserContext(request)
    const { id: candidateId } = await params

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const plan = await prisma.successionDevelopmentPlan.findFirst({
      where: { candidateId, accountId: userContext.accountId },
      include: {
        goals: {
          orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })

    if (!plan) {
      // Check if there's a legacy PDI linked
      const candidate = await prisma.successionCandidate.findFirst({
        where: { id: candidateId, accountId: userContext.accountId },
        select: { developmentPlanId: true },
      })

      return NextResponse.json({
        success: true,
        data: null,
        legacyPlanId: candidate?.developmentPlanId || null,
      })
    }

    return NextResponse.json({ success: true, data: plan })
  } catch (error: any) {
    console.error('[Succession DevPlan GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''
    const { id: candidateId } = await params

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    // Check if plan already exists
    const existing = await prisma.successionDevelopmentPlan.findUnique({
      where: { candidateId },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya tiene un plan de desarrollo', planId: existing.id },
        { status: 409 }
      )
    }

    // Fetch candidate with employee + position + talent intelligence
    const candidate = await prisma.successionCandidate.findFirst({
      where: { id: candidateId, accountId: userContext.accountId, status: 'ACTIVE' },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            standardJobLevel: true,
            managerId: true,
            performanceRatings: {
              orderBy: { calculatedAt: 'desc' },
              take: 1,
              select: {
                riskQuadrant: true,
                mobilityQuadrant: true,
                potentialEngagement: true,
                potentialAspiration: true,
              },
            },
          },
        },
        criticalPosition: { select: { positionTitle: true, standardJobLevel: true } },
      },
    })

    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Candidato no encontrado' }, { status: 404 })
    }

    // Parse gaps from JSON (puede ser vacío para candidatos sin brechas)
    const gaps = (candidate.gapsJson as unknown as Array<{
      competencyCode: string; competencyName: string; category: string
      actualScore: number; targetScore: number; rawGap: number; fitPercent: number
    }>) || []

    // Determine performance track from target job level
    const targetLevel = candidate.criticalPosition.standardJobLevel.toLowerCase()
    let track: PerformanceTrack = 'COLABORADOR'
    if (targetLevel.includes('gerente') || targetLevel.includes('director')) {
      track = 'EJECUTIVO'
    } else if (targetLevel.includes('jefe') || targetLevel.includes('supervisor') || targetLevel.includes('subgerente')) {
      track = 'MANAGER'
    }

    // Transform negative gaps to PDI input format (may be empty for 0-gap candidates)
    const gapInputs: GapAnalysisInput[] = gaps
      .filter(g => g.rawGap < 0)
      .map(g => ({
        competencyCode: g.competencyCode,
        competencyName: g.competencyName,
        selfScore: g.actualScore,
        managerScore: g.targetScore,
        gapType: 'DEVELOPMENT_AREA' as DevelopmentGapType,
        gapValue: g.rawGap,
      }))

    // Generate PDI suggestions only if there are gaps to develop
    const suggestions = gapInputs.length > 0
      ? PDISuggestionEngine.generateSuggestions(gapInputs, track)
      : []

    // Get sponsor (current user's employee record)
    const currentEmployee = await prisma.employee.findFirst({
      where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' },
      select: { id: true },
    })

    const sponsorId = currentEmployee?.id ?? candidate.employee.managerId ?? candidate.employeeId
    if (!sponsorId) {
      return NextResponse.json(
        { success: false, error: 'No se puede determinar el sponsor del plan' },
        { status: 400 }
      )
    }

    // ── Run Succession Diagnosis Engine (10-case priority matrix) ──
    const topGaps = gaps
      .filter(g => g.rawGap < 0)
      .sort((a, b) => a.rawGap - b.rawGap)
      .slice(0, 3)
      .map(g => ({ competencyName: g.competencyName, rawGap: g.rawGap }))

    const topStrengths = gaps
      .filter(g => g.rawGap >= 0)
      .sort((a, b) => b.fitPercent - a.fitPercent)
      .slice(0, 3)
      .map(g => ({ competencyName: g.competencyName, fitPercent: g.fitPercent }))

    // Extract talent intelligence from latest PerformanceRating
    const latestRating = candidate.employee.performanceRatings[0] ?? null

    const diagnosisInput: DiagnosisInput = {
      candidateName: candidate.employee.fullName,
      targetPositionTitle: candidate.criticalPosition.positionTitle,
      targetJobLevel: candidate.criticalPosition.standardJobLevel,
      readinessLevel: candidate.readinessLevel,
      matchPercent: candidate.matchPercent,
      currentRoleFit: candidate.currentRoleFit,
      gapsCriticalCount: candidate.gapsCriticalCount,
      estimatedMonths: candidate.estimatedMonths,
      nineBoxPosition: candidate.nineBoxPosition,
      riskQuadrant: latestRating?.riskQuadrant ?? null,
      mobilityQuadrant: latestRating?.mobilityQuadrant ?? null,
      flightRisk: candidate.flightRisk,
      engagement: candidate.engagement ?? latestRating?.potentialEngagement ?? null,
      aspirationLevel: candidate.aspirationLevel ?? latestRating?.potentialAspiration ?? null,
      topGaps,
      topStrengths,
    }

    const diagnosis = SuccessionDiagnosisEngine.diagnose(diagnosisInput)

    // Calculate target date
    const now = new Date()
    const targetDate = new Date(now)
    targetDate.setMonth(targetDate.getMonth() + (diagnosis.estimatedReadinessMonths || candidate.estimatedMonths || 12))

    // Create plan with statement + optional PDI goals
    const plan = await prisma.successionDevelopmentPlan.create({
      data: {
        accountId: userContext.accountId,
        candidateId,
        employeeId: candidate.employeeId,
        sponsorId,
        status: 'DRAFT',
        // Statement fields (Pivote v3.0)
        targetPositionTitle: candidate.criticalPosition.positionTitle,
        targetJobLevel: candidate.criticalPosition.standardJobLevel,
        estimatedReadinessMonths: diagnosis.estimatedReadinessMonths,
        aiDiagnostic: diagnosis.aiDiagnostic,
        immediateAction: diagnosis.suggestedAction,
        // AI metadata (includes diagnosis traceability)
        originGapAnalysis: JSON.parse(JSON.stringify({
          source: 'succession',
          candidateId,
          track,
          gaps: gapInputs,
          diagnosisCaseId: diagnosis.caseId,
          diagnosisUrgency: diagnosis.urgency,
        })),
        aiSuggestionsUsed: suggestions.length > 0,
        // PDI goals: only created when there are actual gaps to develop
        ...(suggestions.length > 0 ? {
          goals: {
            create: suggestions.slice(0, 5).map((s) => ({
              competencyCode: s.competencyCode,
              title: s.suggestion.title,
              description: s.suggestion.description,
              targetOutcome: s.suggestion.targetOutcome,
              action: s.coachingTip || undefined,
              category: s.suggestion.category,
              priority: s.priority,
              startDate: now,
              targetDate,
              aiGenerated: true,
              suggestedResources: s.suggestion.suggestedResources?.length
                ? JSON.parse(JSON.stringify({ resources: s.suggestion.suggestedResources }))
                : undefined,
            })),
          },
        } : {}),
      },
      include: { goals: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        planId: plan.id,
        goalsCount: plan.goals.length,
        track,
        aiDiagnostic: diagnosis.aiDiagnostic,
        urgency: diagnosis.urgency,
        suggestedAction: diagnosis.suggestedAction,
        caseId: diagnosis.caseId,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('[Succession DevPlan POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ── PUT ──────────────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = extractUserContext(request)
    const { id: candidateId } = await params

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const {
      status,
      visibleToDirectManager,
      managerCanEditProgress,
      includeInEmployeeReport,
      managerBet,
      immediateAction,
      goals,
    } = body as {
      status?: string
      visibleToDirectManager?: boolean
      managerCanEditProgress?: boolean
      includeInEmployeeReport?: boolean
      managerBet?: string | null
      immediateAction?: string | null
      goals?: Array<{ id: string; status?: string; progressPercent?: number }>
    }

    const plan = await prisma.successionDevelopmentPlan.findFirst({
      where: { candidateId, accountId: userContext.accountId },
    })

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 })
    }

    // Build plan update data
    const planUpdate: Record<string, any> = {}
    if (status !== undefined) planUpdate.status = status
    if (visibleToDirectManager !== undefined) planUpdate.visibleToDirectManager = visibleToDirectManager
    if (managerCanEditProgress !== undefined) planUpdate.managerCanEditProgress = managerCanEditProgress
    if (includeInEmployeeReport !== undefined) planUpdate.includeInEmployeeReport = includeInEmployeeReport
    if (managerBet !== undefined) planUpdate.managerBet = managerBet
    if (immediateAction !== undefined) planUpdate.immediateAction = immediateAction

    if (status === 'COMPLETED') planUpdate.completedAt = new Date()
    if (status === 'ACTIVE') planUpdate.agreedAt = planUpdate.agreedAt ?? new Date()

    // Execute in transaction
    await prisma.$transaction(async (tx) => {
      // Update plan fields
      if (Object.keys(planUpdate).length > 0) {
        await tx.successionDevelopmentPlan.update({
          where: { id: plan.id },
          data: planUpdate,
        })
      }

      // Update individual goals
      if (goals && goals.length > 0) {
        for (const g of goals) {
          const goalUpdate: Record<string, any> = {}
          if (g.status !== undefined) goalUpdate.status = g.status
          if (g.progressPercent !== undefined) goalUpdate.progressPercent = Math.max(0, Math.min(100, Math.floor(g.progressPercent)))
          if (g.status === 'COMPLETED') goalUpdate.completedAt = new Date()

          if (Object.keys(goalUpdate).length > 0) {
            await tx.successionDevelopmentGoal.update({
              where: { id: g.id },
              data: goalUpdate,
            })
          }
        }
      }
    })

    // Return updated plan
    const updated = await prisma.successionDevelopmentPlan.findUnique({
      where: { id: plan.id },
      include: { goals: { orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }] } },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('[Succession DevPlan PUT] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
