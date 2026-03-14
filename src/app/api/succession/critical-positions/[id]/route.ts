// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/critical-positions/[id]
// GET - Detalle de posicion con candidatos
// PUT - Actualizar posicion
// DELETE - Soft-delete (isActive=false)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService'
import { sortCandidates } from '@/config/successionConstants'
import { SuccessionService } from '@/lib/services/SuccessionService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = extractUserContext(request)
    const { id } = await params

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const position = await prisma.criticalPosition.findFirst({
      where: { id, accountId: userContext.accountId, isActive: true },
      include: {
        department: { select: { displayName: true } },
        incumbent: {
          select: {
            id: true, fullName: true, position: true,
            department: { select: { displayName: true } },
          }
        },
        candidates: {
          where: { status: 'ACTIVE' },
          include: {
            employee: {
              select: {
                id: true, fullName: true, position: true, hireDate: true,
                department: { select: { displayName: true } },
              }
            },
            developmentPlan: { select: { id: true, status: true } },
            successionPlan: { select: { id: true, status: true } },
            backfillPlan: {
              select: {
                resolution: true,
                backfillEmployeeName: true,
                vacatedPositionTitle: true,
              }
            },
          }
        },
      },
    })

    if (!position) {
      return NextResponse.json({ success: false, error: 'Posicion no encontrada' }, { status: 404 })
    }

    // Recalculate matchPercent + readiness from gapsJson (fixes stale stored values)
    const recalculated = position.candidates.map(c => {
      const recalc = SuccessionService.recalculateFromGaps(c)
      return {
        ...c,
        matchPercent: recalc.matchPercent,
        readinessLevel: (c.readinessOverride || recalc.readinessLevel) as string,
      }
    })

    // Sort candidates by readiness
    const sortedCandidates = sortCandidates(recalculated)

    // Enrich with talent quadrants (riskQuadrant + mobilityQuadrant from PerformanceRating)
    const allEmployeeIds = [
      ...(position.incumbentId ? [position.incumbentId] : []),
      ...sortedCandidates.map(c => c.employeeId),
    ]
    // DEBUG: getCurrentCycleId para ver qué ciclo usa
    const debugCycleId = await SuccessionService.getCurrentCycleId(userContext.accountId)
    console.log('[DEBUG Narrative] incumbentId:', position.incumbentId)
    console.log('[DEBUG Narrative] cycleId encontrado:', debugCycleId)

    const quadrantsMap = await SuccessionService.enrichWithTalentQuadrants(
      allEmployeeIds,
      userContext.accountId
    )

    // DEBUG: resultado completo del enrichment para el incumbent
    if (position.incumbentId) {
      const incumbentQuadrants = quadrantsMap.get(position.incumbentId)
      console.log('[DEBUG Narrative] enrichWithTalentQuadrants para incumbent:', JSON.stringify(incumbentQuadrants, null, 2))
      console.log('[DEBUG Narrative] riskQuadrant:', incumbentQuadrants?.riskQuadrant ?? 'NULL/UNDEFINED')
      console.log('[DEBUG Narrative] riskAlertLevel:', incumbentQuadrants?.riskAlertLevel ?? 'NULL/UNDEFINED')
      console.log('[DEBUG Narrative] mobilityQuadrant:', incumbentQuadrants?.mobilityQuadrant ?? 'NULL/UNDEFINED')
    }

    const enrichedIncumbent = position.incumbent
      ? { ...position.incumbent, ...(quadrantsMap.get(position.incumbentId!) ?? { riskQuadrant: null, mobilityQuadrant: null, riskAlertLevel: null }) }
      : null

    const enrichedCandidates = sortedCandidates.map(c => ({
      ...c,
      ...(quadrantsMap.get(c.employeeId) ?? { riskQuadrant: null, mobilityQuadrant: null, riskAlertLevel: null }),
    }))

    return NextResponse.json({
      success: true,
      data: { ...position, incumbent: enrichedIncumbent, candidates: enrichedCandidates },
      permissions: { canManage: hasPermission(userContext.role, 'succession:manage') },
    })
  } catch (error: any) {
    console.error('[Succession Position GET] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = extractUserContext(request)
    const { id } = await params

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    // Verify ownership
    const existing = await prisma.criticalPosition.findFirst({
      where: { id, accountId: userContext.accountId, isActive: true },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Posicion no encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const { positionTitle, standardJobLevel, departmentId, incumbentId, incumbentRetirementDate } = body

    if (incumbentId) {
      const employee = await prisma.employee.findFirst({
        where: { id: incumbentId, accountId: userContext.accountId, status: 'ACTIVE' }
      })
      if (!employee) {
        return NextResponse.json(
          { error: 'Empleado no encontrado', success: false },
          { status: 404 }
        )
      }
    }

    const updated = await prisma.criticalPosition.update({
      where: { id },
      data: {
        ...(positionTitle !== undefined && { positionTitle }),
        ...(standardJobLevel !== undefined && { standardJobLevel }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(incumbentId !== undefined && { incumbentId: incumbentId || null }),
        ...(incumbentRetirementDate !== undefined && {
          incumbentRetirementDate: incumbentRetirementDate ? new Date(incumbentRetirementDate) : null
        }),
      },
      include: {
        department: { select: { displayName: true } },
        incumbent: { select: { id: true, fullName: true, position: true } },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('[Succession Position PUT] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userContext = extractUserContext(request)
    const { id } = await params

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    // Verify ownership
    const existing = await prisma.criticalPosition.findFirst({
      where: { id, accountId: userContext.accountId, isActive: true },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Posicion no encontrada' }, { status: 404 })
    }

    // Soft delete
    await prisma.criticalPosition.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'Posicion desactivada' })
  } catch (error: any) {
    console.error('[Succession Position DELETE] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
