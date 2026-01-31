// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-cycles/[id]/results/[evaluateeId]
// GET - Detalle completo resultados de un evaluado
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { PerformanceResultsService } from '@/lib/services/PerformanceResultsService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; evaluateeId: string } }
) {
  try {
    const userContext = extractUserContext(request)
    const { id: cycleId, evaluateeId } = params

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

    // Obtener resultados consolidados
    const results = await PerformanceResultsService.getEvaluateeResults(
      cycleId,
      evaluateeId
    )

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('Error en GET /api/admin/performance-cycles/[id]/results/[evaluateeId]:', error)

    if (error instanceof Error && error.message.includes('no encontrado')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      )
    }

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
