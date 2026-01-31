// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-cycles/[id]/results
// GET - Lista resultados consolidados del ciclo
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { PerformanceResultsService } from '@/lib/services/PerformanceResultsService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request)
    const cycleId = params.id

    // Validar autenticación
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Validar permisos
    if (!hasPermission(userContext.role, 'performance:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para ver resultados' },
        { status: 403 }
      )
    }

    // Obtener query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'name' // name | score
    const sortOrder = searchParams.get('sortOrder') || 'asc' // asc | desc

    // Listar evaluados
    const evaluatees = await PerformanceResultsService.listEvaluateesInCycle(cycleId)

    // Ordenar
    const sorted = evaluatees.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.evaluateeName.localeCompare(b.evaluateeName)
          : b.evaluateeName.localeCompare(a.evaluateeName)
      } else {
        return sortOrder === 'asc'
          ? a.overallAvgScore - b.overallAvgScore
          : b.overallAvgScore - a.overallAvgScore
      }
    })

    // Paginar
    const skip = (page - 1) * limit
    const paginated = sorted.slice(skip, skip + limit)

    // Stats agregadas
    const avgScore = evaluatees.length > 0
      ? evaluatees.reduce((sum, e) => sum + e.overallAvgScore, 0) / evaluatees.length
      : 0

    const avgCompleteness = evaluatees.length > 0
      ? evaluatees.reduce((sum, e) => sum + e.evaluationCompleteness, 0) / evaluatees.length
      : 0

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total: evaluatees.length,
        pages: Math.ceil(evaluatees.length / limit)
      },
      stats: {
        avgScore: parseFloat(avgScore.toFixed(2)),
        avgCompleteness: parseFloat(avgCompleteness.toFixed(1)),
        totalEvaluatees: evaluatees.length
      }
    })

  } catch (error) {
    console.error('Error en GET /api/admin/performance-cycles/[id]/results:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    )
  }
}
