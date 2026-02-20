import { NextRequest, NextResponse } from 'next/server'
import {
  extractUserContext,
  hasPermission,
  GLOBAL_ACCESS_ROLES,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService'
import { RoleFitAnalyzer } from '@/lib/services/RoleFitAnalyzer'
import { prisma } from '@/lib/prisma'

// GET /api/performance/role-fit?employeeId=xxx&cycleId=yyy
export async function GET(request: NextRequest) {
  const userContext = extractUserContext(request)
  const userEmail = request.headers.get('x-user-email') || ''

  if (!userContext.accountId || !hasPermission(userContext.role, 'evaluations:view')) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId')
  const cycleId = searchParams.get('cycleId')

  if (!employeeId || !cycleId) {
    return NextResponse.json(
      { success: false, error: 'employeeId y cycleId son requeridos' },
      { status: 400 }
    )
  }

  try {
    // ════════════════════════════════════════════════════════════════════════
    // CAPA 1: GLOBAL_ACCESS_ROLES - Acceso total a la empresa
    // ════════════════════════════════════════════════════════════════════════
    const isGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)

    if (isGlobalAccess) {
      // HR/Admin: Solo validar que el empleado pertenece a la cuenta
      const employee = await prisma.employee.findFirst({
        where: { id: employeeId, accountId: userContext.accountId },
        select: { id: true, performanceTrack: true }
      })

      if (!employee) {
        return NextResponse.json(
          { success: false, error: 'Empleado no encontrado' },
          { status: 404 }
        )
      }

      const roleFit = await RoleFitAnalyzer.calculateRoleFit(employeeId, cycleId)

      if (!roleFit) {
        return NextResponse.json({
          success: false,
          error: 'No se pudo calcular Role Fit (sin targets o sin evaluación)'
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          ...roleFit,
          performanceTrack: employee.performanceTrack || 'COLABORADOR'
        }
      })
    }

    // ════════════════════════════════════════════════════════════════════════
    // CAPA 2: AREA_MANAGER - Filtro jerárquico por departamento
    // ════════════════════════════════════════════════════════════════════════
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childDeptIds = await getChildDepartmentIds(userContext.departmentId)
      const allowedDepts = [userContext.departmentId, ...childDeptIds]

      const employee = await prisma.employee.findFirst({
        where: {
          id: employeeId,
          accountId: userContext.accountId,
          departmentId: { in: allowedDepts }
        },
        select: { id: true, performanceTrack: true }
      })

      if (!employee) {
        return NextResponse.json(
          { success: false, error: 'Empleado fuera de su scope jerárquico' },
          { status: 403 }
        )
      }

      const roleFit = await RoleFitAnalyzer.calculateRoleFit(employeeId, cycleId)

      if (!roleFit) {
        return NextResponse.json({
          success: false,
          error: 'No se pudo calcular Role Fit (sin targets o sin evaluación)'
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          ...roleFit,
          performanceTrack: employee.performanceTrack || 'COLABORADOR'
        }
      })
    }

    // ════════════════════════════════════════════════════════════════════════
    // CAPA 3: EVALUATOR - Solo subordinados directos (managerId)
    // ════════════════════════════════════════════════════════════════════════
    if (userContext.role === 'EVALUATOR') {
      const currentEmployee = await prisma.employee.findFirst({
        where: {
          accountId: userContext.accountId,
          email: userEmail,
          status: 'ACTIVE'
        },
        select: { id: true }
      })

      if (!currentEmployee) {
        return NextResponse.json(
          { success: false, error: 'Empleado no encontrado' },
          { status: 404 }
        )
      }

      // Verificar relación jefe-subordinado
      const employee = await prisma.employee.findFirst({
        where: {
          id: employeeId,
          accountId: userContext.accountId,
          managerId: currentEmployee.id
        },
        select: { id: true, performanceTrack: true }
      })

      if (!employee) {
        return NextResponse.json(
          { success: false, error: 'Solo puede ver Role Fit de sus subordinados directos' },
          { status: 403 }
        )
      }

      const roleFit = await RoleFitAnalyzer.calculateRoleFit(employeeId, cycleId)

      if (!roleFit) {
        return NextResponse.json({
          success: false,
          error: 'No se pudo calcular Role Fit (sin targets o sin evaluación)'
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          ...roleFit,
          performanceTrack: employee.performanceTrack || 'COLABORADOR'
        }
      })
    }

    // ════════════════════════════════════════════════════════════════════════
    // DEFAULT: Rol no reconocido
    // ════════════════════════════════════════════════════════════════════════
    return NextResponse.json(
      { success: false, error: 'Rol sin permisos para esta operación' },
      { status: 403 }
    )

  } catch (err) {
    console.error('[RoleFit API] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Error calculando Role Fit' },
      { status: 500 }
    )
  }
}
