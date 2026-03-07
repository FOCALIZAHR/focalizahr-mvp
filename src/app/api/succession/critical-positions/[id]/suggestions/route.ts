// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/critical-positions/[id]/suggestions
// GET - Candidatos sugeridos (no nominados aun)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService'
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

    if (!hasPermission(userContext.role, 'succession:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    // Verify ownership
    const position = await prisma.criticalPosition.findFirst({
      where: { id, accountId: userContext.accountId, isActive: true },
    })
    if (!position) {
      return NextResponse.json({ success: false, error: 'Posicion no encontrada' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const filterByArea = searchParams.get('filterByArea') === 'true'

    const suggestions = await SuccessionService.getSuggestedCandidates(id, { filterByArea })

    // Build filterStats for intelligence story
    const cycleId = await SuccessionService.getCurrentCycleId(position.accountId)
    let filterStats = null

    if (cycleId) {
      const [totalEmployees, passedRoleFit, passedAspiration] = await Promise.all([
        prisma.employee.count({
          where: { accountId: userContext.accountId, status: 'ACTIVE' },
        }),
        prisma.performanceRating.count({
          where: {
            cycleId,
            accountId: userContext.accountId,
            roleFitScore: { gte: 75 },
          },
        }),
        prisma.performanceRating.count({
          where: {
            cycleId,
            accountId: userContext.accountId,
            roleFitScore: { gte: 75 },
            potentialAspiration: { gte: 2 },
          },
        }),
      ])

      filterStats = {
        totalEmployees,
        passedRoleFit,
        passedAspiration,
        finalCandidates: suggestions.length,
      }
    }

    return NextResponse.json({ success: true, data: suggestions, filterStats })
  } catch (error: any) {
    console.error('[Succession Suggestions] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
