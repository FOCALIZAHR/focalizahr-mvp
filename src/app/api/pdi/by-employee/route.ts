// ════════════════════════════════════════════════════════════════════════════
// API: GET /api/pdi/by-employee
// Obtener PDI existente para un empleado+ciclo SIN regenerar
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'

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
            standardJobLevel: true
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

    // Verificar acceso: debe ser manager, el empleado, o admin
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

    const isManager = pdi.managerId === currentEmployee.id
    const isEmployee = pdi.employeeId === currentEmployee.id
    const isAdmin = userContext.role === 'FOCALIZAHR_ADMIN' ||
                    userContext.role === 'ACCOUNT_OWNER' ||
                    userContext.role === 'HR_ADMIN'

    if (!isManager && !isEmployee && !isAdmin) {
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
