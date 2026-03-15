/**
 * GET /api/talent-actions/quadrant/[quadrant]
 *
 * Lista paginada de personas por cuadrante de riesgo
 * Segmentada por tenure (onboarding < 6m / real 6m-3a / crónico > 3a)
 * Badge sucesor si mobilityQuadrant = SUCESOR_NATURAL
 *
 * Query params:
 * - departmentId: string (drill-down a gerencia/depto específico)
 * - skip: number (paginación, default 0)
 * - take: number (paginación, default 50, max 100)
 *
 * Permiso: talent-actions:view
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService'
import { TalentActionService } from '@/lib/services/TalentActionService'

const VALID_QUADRANTS = ['FUGA_CEREBROS', 'MOTOR_EQUIPO', 'BURNOUT_RISK', 'BAJO_RENDIMIENTO']
const MAX_TAKE = 100

export async function GET(
  request: NextRequest,
  { params }: { params: { quadrant: string } }
) {
  const startTime = Date.now()

  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'talent-actions:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para Talent Action Center' },
        { status: 403 }
      )
    }

    // Validar quadrant
    const quadrant = params.quadrant?.toUpperCase()
    if (!VALID_QUADRANTS.includes(quadrant)) {
      return NextResponse.json(
        { success: false, error: `Cuadrante inválido. Use: ${VALID_QUADRANTS.join(', ')}` },
        { status: 400 }
      )
    }

    // Query params
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId') || undefined
    const skip = Math.max(0, parseInt(searchParams.get('skip') || '0', 10) || 0)
    const take = Math.min(MAX_TAKE, Math.max(1, parseInt(searchParams.get('take') || '50', 10) || 50))

    // Filtrado jerárquico
    let allowedDepartmentIds: string[] | undefined

    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      allowedDepartmentIds = [userContext.departmentId, ...childIds]

      // Validar que departmentId está dentro de su jerarquía
      if (departmentId && !allowedDepartmentIds.includes(departmentId)) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado a este departamento' },
          { status: 403 }
        )
      }
    }

    const result = await TalentActionService.getQuadrantPersons(
      userContext.accountId,
      quadrant,
      { allowedDepartmentIds, departmentId, skip, take }
    )

    return NextResponse.json({
      success: true,
      data: {
        quadrant,
        persons: result.persons,
        total: result.total,
        pagination: { skip, take, hasMore: skip + take < result.total }
      },
      responseTime: Date.now() - startTime
    })

  } catch (error: any) {
    console.error(`[TAC quadrant/${params.quadrant}] Error:`, error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
