// ════════════════════════════════════════════════════════════════════════════
// API: /api/performance-ratings/nine-box
// GET - Datos para renderizar 9-Box Grid
// ════════════════════════════════════════════════════════════════════════════
// TODO: FOCALIZAHR_ADMIN deberia tener acceso solo si cycle.shareWithConcierge === true
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission, getChildDepartmentIds } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'
import { NINE_BOX_POSITIONS, type NineBoxPosition } from '@/config/performanceClassification'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

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
    const departmentId = searchParams.get('departmentId')

    if (!cycleId) {
      return NextResponse.json(
        { success: false, error: 'cycleId es requerido' },
        { status: 400 }
      )
    }

    // ════════════════════════════════════════════════════════════════════════════
    // SECURITY FIX: Calcular filtro jerárquico según rol
    // ════════════════════════════════════════════════════════════════════════════
    let departmentIds: string[] | undefined = undefined

    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      departmentIds = [userContext.departmentId, ...childIds]
    }

    // Obtener datos del 9-Box con seguridad
    const nineBoxData = await PerformanceRatingService.get9BoxData(
      cycleId,
      userContext.accountId,  // SECURITY: Defense-in-depth
      departmentIds  // SECURITY: Filtro AREA_MANAGER
    )

    // Filtrar por departamento si se especifica
    type EmployeeWithDepartment = {
      id: string
      employeeId: string
      employee?: {
        id: string
        fullName: string
        position: string | null
        departmentId?: string | null
        department?: { displayName: string } | null
      } | null
      calculatedScore: number | null
      finalScore: number | null
      potentialScore: number | null
      potentialLevel: string | null
    }

    let filteredGrid = nineBoxData.grid as Record<string, EmployeeWithDepartment[]>

    if (departmentId) {
      const filteredEntries = Object.entries(filteredGrid).map(([position, employees]) => {
        const filtered = employees.filter(e => e.employee?.departmentId === departmentId)
        return [position, filtered] as [string, EmployeeWithDepartment[]]
      })
      filteredGrid = Object.fromEntries(filteredEntries)
    }

    // Calcular totales después del filtro
    const totalInGrid = Object.values(filteredGrid).reduce(
      (sum, employees) => sum + employees.length,
      0
    )

    // Agregar metadata de posiciones
    const gridWithMetadata = Object.entries(filteredGrid).map(([position, employees]) => {
      const positionConfig = NINE_BOX_POSITIONS[position as NineBoxPosition]
      return {
        position,
        label: positionConfig?.label,
        labelShort: positionConfig?.labelShort,
        color: positionConfig?.color,
        bgClass: positionConfig?.bgClass,
        textClass: positionConfig?.textClass,
        description: positionConfig?.description,
        performance: positionConfig?.performance,
        potential: positionConfig?.potential,
        employees: employees.map(e => ({
          id: e.id,
          employeeId: e.employeeId,
          employeeName: e.employee?.fullName,
          employeePosition: e.employee?.position,
          department: e.employee?.department?.displayName,
          calculatedScore: e.calculatedScore,
          finalScore: e.finalScore,
          potentialScore: e.potentialScore,
          potentialLevel: e.potentialLevel
        })),
        count: employees.length,
        percent: totalInGrid > 0 ? Math.round((employees.length / totalInGrid) * 100) : 0
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        cycleId,
        totalWithPotential: nineBoxData.total,
        totalInGrid,
        grid: gridWithMetadata,
        summary: nineBoxData.summary
      }
    })

  } catch (error) {
    console.error('[API] Error en GET /api/performance-ratings/nine-box:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
