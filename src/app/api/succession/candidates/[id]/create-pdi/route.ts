// ════════════════════════════════════════════════════════════════════════════
// @deprecated — Use /api/succession/candidates/[id]/development-plan instead
// This route creates a generic DevelopmentPlan (tied to performance cycle).
// The new route creates a SuccessionDevelopmentPlan (independent, with visibility controls).
// Kept for backward compatibility — will be removed in a future cleanup.
// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/candidates/[id]/create-pdi
// POST - Crea DevelopmentPlan desde los gaps del candidato
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService'
import { PDISuggestionEngine } from '@/lib/services/PDISuggestionEngine'
import { SuccessionService } from '@/lib/services/SuccessionService'
import type { GapAnalysisInput, PerformanceTrack } from '@/lib/types/pdi-suggestion'
import { DevelopmentGapType } from '@prisma/client'

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

    // Fetch candidate with position info
    const candidate = await prisma.successionCandidate.findFirst({
      where: { id: candidateId, accountId: userContext.accountId, status: 'ACTIVE' },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            standardJobLevel: true,
            managerId: true,
          }
        },
        criticalPosition: { select: { standardJobLevel: true } },
      }
    })

    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Candidato no encontrado' }, { status: 404 })
    }

    if (candidate.developmentPlanId) {
      return NextResponse.json(
        { success: false, error: 'Ya tiene un PDI vinculado', planId: candidate.developmentPlanId },
        { status: 409 }
      )
    }

    // Get current cycle
    const cycleId = await SuccessionService.getCurrentCycleId(userContext.accountId)
    if (!cycleId) {
      return NextResponse.json({ success: false, error: 'Sin ciclo activo' }, { status: 400 })
    }

    // Parse gaps from JSON
    const gaps = (candidate.gapsJson as unknown as Array<{
      competencyCode: string; competencyName: string; category: string
      actualScore: number; targetScore: number; rawGap: number; fitPercent: number
    }>) || []

    if (gaps.length === 0) {
      return NextResponse.json({ success: false, error: 'Sin gaps para generar PDI' }, { status: 400 })
    }

    // Determine performance track from target job level
    const targetLevel = candidate.criticalPosition.standardJobLevel.toLowerCase()
    let track: PerformanceTrack = 'COLABORADOR'
    if (targetLevel.includes('gerente') || targetLevel.includes('director')) {
      track = 'EJECUTIVO'
    } else if (targetLevel.includes('jefe') || targetLevel.includes('supervisor') || targetLevel.includes('subgerente')) {
      track = 'MANAGER'
    }

    // Transform succession gaps to PDI input format
    // All gaps are DEVELOPMENT_AREA (skill gap vs target role, not self/manager disagreement)
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

    // Generate suggestions
    const suggestions = PDISuggestionEngine.generateSuggestions(gapInputs, track)

    // Determine manager (use employee's manager, or the current user as fallback)
    const currentEmployee = await prisma.employee.findFirst({
      where: {
        accountId: userContext.accountId,
        email: userEmail,
        status: 'ACTIVE',
      },
      select: { id: true },
    })

    const managerId = candidate.employee.managerId
      ?? currentEmployee?.id
      ?? null

    if (!managerId) {
      return NextResponse.json(
        { success: false, error: 'No se puede crear PDI sin manager o usuario responsable' },
        { status: 400 }
      )
    }

    // Create the PDI
    const now = new Date()
    const targetDate = new Date(now)
    targetDate.setMonth(targetDate.getMonth() + (candidate.estimatedMonths ?? 12))

    const plan = await prisma.developmentPlan.create({
      data: {
        accountId: userContext.accountId,
        employeeId: candidate.employeeId,
        managerId: managerId,
        cycleId,
        status: 'DRAFT',
        originGapAnalysis: JSON.parse(JSON.stringify({ source: 'succession', candidateId, track, gaps: gapInputs })),
        aiSuggestionsUsed: suggestions.length > 0,
        validFrom: now,
        validUntil: targetDate,
        goals: {
          create: suggestions.slice(0, 5).map((s) => ({
            competencyCode: s.competencyCode,
            competencyName: s.competencyName,
            originalGap: s.originalGap,
            gapType: s.gapType,
            title: s.suggestion.title,
            description: s.suggestion.description,
            targetOutcome: s.suggestion.targetOutcome,
            priority: s.priority,
            category: s.suggestion.category,
            startDate: now,
            targetDate,
            aiGenerated: true,
            suggestedResources: s.suggestion.suggestedResources?.length
              ? JSON.parse(JSON.stringify({ resources: s.suggestion.suggestedResources }))
              : undefined,
            action: s.coachingTip || undefined,
          })),
        },
      },
    })

    // Count goals created
    const goalsCount = await prisma.developmentGoal.count({
      where: { planId: plan.id }
    })

    // Link PDI to candidate
    await prisma.successionCandidate.update({
      where: { id: candidateId },
      data: { developmentPlanId: plan.id },
    })

    return NextResponse.json({
      success: true,
      data: {
        planId: plan.id,
        goalsCount,
        track,
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('[Succession Create PDI] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
