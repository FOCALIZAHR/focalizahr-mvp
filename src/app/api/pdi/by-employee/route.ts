// ════════════════════════════════════════════════════════════════════════════
// API: GET /api/pdi/by-employee
// Obtener PDI existente para un empleado+ciclo SIN regenerar
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  GLOBAL_ACCESS_ROLES,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const cycleId = searchParams.get('cycleId')

    // Validar parámetros requeridos
    if (!employeeId || !cycleId) {
      return NextResponse.json(
        { success: false, error: 'employeeId y cycleId son requeridos' },
        { status: 400 }
      )
    }

    // Verificar autenticación
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'evaluations:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    // Buscar PDI existente con goals
    const pdi = await prisma.developmentPlan.findUnique({
      where: {
        employeeId_cycleId: { employeeId, cycleId }
      },
      include: {
        goals: {
          orderBy: { priority: 'asc' }
        },
        employee: {
          select: {
            fullName: true,
            email: true,
            performanceTrack: true,
            standardJobLevel: true,
            departmentId: true
          }
        },
        manager: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    })

    // Si no existe, retornar exists: false
    if (!pdi) {
      return NextResponse.json({
        success: true,
        exists: false,
        data: null
      })
    }

    // Verificar que el PDI pertenece a la cuenta del usuario
    if (pdi.accountId !== userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'Sin acceso a este PDI' },
        { status: 403 }
      )
    }

    // ════════════════════════════════════════════════════════════════════════
    // Verificar acceso según rol
    // ════════════════════════════════════════════════════════════════════════
    const userEmail = request.headers.get('x-user-email') || ''
    const currentEmployee = await prisma.employee.findFirst({
      where: {
        accountId: userContext.accountId,
        email: userEmail,
        status: 'ACTIVE'
      }
    })

    if (!currentEmployee) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
    const isManager = pdi.managerId === currentEmployee.id
    const isEmployee = pdi.employeeId === currentEmployee.id

    let hasHierarchicalAccess = false
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childDeptIds = await getChildDepartmentIds(userContext.departmentId)
      const allowedDepts = [userContext.departmentId, ...childDeptIds]
      hasHierarchicalAccess = allowedDepts.includes(pdi.employee.departmentId)
    }

    if (!hasGlobalAccess && !isManager && !isEmployee && !hasHierarchicalAccess) {
      return NextResponse.json(
        { success: false, error: 'Sin acceso a este PDI' },
        { status: 403 }
      )
    }

    // Retornar PDI con metadata
    return NextResponse.json({
      success: true,
      exists: true,
      data: pdi,
      meta: {
        canEdit: isManager && pdi.status === 'DRAFT',
        isOwner: isEmployee,
        isManager: isManager
      }
    })

  } catch (error) {
    console.error('[API] Error GET /api/pdi/by-employee:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
