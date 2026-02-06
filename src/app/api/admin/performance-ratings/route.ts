// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-ratings
// GET - Listar ratings | POST - Generar ratings
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email')

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'performance:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')

    if (!cycleId) {
      return NextResponse.json(
        { success: false, error: 'cycleId es requerido' },
        { status: 400 }
      )
    }

    // ════════════════════════════════════════════════════════════════════════════
    // SECURITY FIX: Calcular filtro jerárquico según rol
    // Patrón: GUIA_MAESTRA_RBAC Sección 4.3
    // ════════════════════════════════════════════════════════════════════════════
    let departmentIds: string[] | undefined = undefined

    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    // ════════════════════════════════════════════════════════════════════════════
    // SERVER-SIDE FILTERING: Leer nuevos query params
    // ════════════════════════════════════════════════════════════════════════════
    const evaluationStatus = searchParams.get('evaluationStatus') as 'all' | 'evaluated' | 'not_evaluated' | null
    const potentialStatus = searchParams.get('potentialStatus') as 'all' | 'assigned' | 'pending' | null
    const search = searchParams.get('search') || undefined

    const result = await PerformanceRatingService.listRatingsForCycle(
      cycleId,
      userContext.accountId,  // SECURITY: Obligatorio
      {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
        sortBy: (searchParams.get('sortBy') as 'name' | 'score' | 'level') || 'name',
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
        filterLevel: searchParams.get('filterLevel') || undefined,
        filterNineBox: searchParams.get('filterNineBox') || undefined,
        filterCalibrated: searchParams.get('filterCalibrated') === 'true' ? true :
                          searchParams.get('filterCalibrated') === 'false' ? false : undefined,
        departmentIds,  // SECURITY: Para AREA_MANAGER
        // ═══ NUEVOS FILTROS SERVER-SIDE ═══
        evaluationStatus: evaluationStatus || undefined,
        potentialStatus: potentialStatus || undefined,
        search
      }
    )

    // ════════════════════════════════════════════════════════════════════════════
    // CAMPO COMPUTADO: canAssignPotential
    // Admins pueden asignar a cualquiera, otros solo a sus reportes directos
    // ════════════════════════════════════════════════════════════════════════════
    const isSystemAdmin = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN']
      .includes(userContext.role || '')

    let loggedInEmployeeId: string | null = null
    if (!isSystemAdmin && userEmail) {
      const loggedInEmployee = await prisma.employee.findFirst({
        where: {
          accountId: userContext.accountId,
          email: userEmail,
          isActive: true
        },
        select: { id: true }
      })
      loggedInEmployeeId = loggedInEmployee?.id || null
    }

    // Agregar canAssignPotential a cada rating
    const dataWithPermissions = result.data.map((r: { employee?: { managerId?: string | null } | null }) => ({
      ...r,
      canAssignPotential: isSystemAdmin ||
        (loggedInEmployeeId && r.employee?.managerId === loggedInEmployeeId)
    }))

    return NextResponse.json({
      success: true,
      data: dataWithPermissions,
      pagination: result.pagination,
      stats: result.stats
    })

  } catch (error) {
    console.error('[API] Error en GET /api/admin/performance-ratings:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'performance:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { cycleId, action, employeeId } = body

    if (!cycleId) {
      return NextResponse.json(
        { success: false, error: 'cycleId es requerido' },
        { status: 400 }
      )
    }

    // Acción: generar todos los ratings del ciclo
    if (action === 'generate_all') {
      const result = await PerformanceRatingService.generateRatingsForCycle(
        cycleId,
        userContext.accountId
      )

      return NextResponse.json({
        success: true,
        data: result,
        message: `Generados ${result.success} ratings, ${result.failed} fallidos`
      })
    }

    // Acción: generar rating individual
    if (action === 'generate_single' && employeeId) {
      const result = await PerformanceRatingService.generateRating(
        cycleId,
        employeeId,
        userContext.accountId
      )

      return NextResponse.json({
        success: true,
        data: result
      })
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida. Use "generate_all" o "generate_single"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[API] Error en POST /api/admin/performance-ratings:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
