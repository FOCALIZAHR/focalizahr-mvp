// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/sessions
// GET - Listar sesiones | POST - Crear sesión
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService'

// ════════════════════════════════════════════════════════════════════════════
// GET - Listar sesiones de calibración
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // ═══ CHECK 1: extractUserContext ═══
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // ═══ CHECK 2: hasPermission (NO arrays hardcodeados) ═══
    if (!hasPermission(userContext.role, 'calibration:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para ver calibraciones' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const status = searchParams.get('status')

    // ═══ CHECK 3: accountId en WHERE ═══
    const where: any = { accountId: userContext.accountId }
    if (cycleId) where.cycleId = cycleId
    if (status) where.status = status

    // ═══ CHECK 4: Filtrado jerárquico AREA_MANAGER ═══
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      const allowedDepts = [userContext.departmentId, ...childIds]

      // AREA_MANAGER solo ve sesiones que:
      // a) No tienen filtro departamental (cross-departamental global), O
      // b) Incluyen al menos uno de sus departamentos
      where.OR = [
        { departmentIds: { isEmpty: true } },
        { departmentIds: { hasSome: allowedDepts } }
      ]
    }

    const sessions = await prisma.calibrationSession.findMany({
      where,
      include: {
        cycle: {
          select: { id: true, name: true, status: true }
        },
        participants: {
          select: {
            id: true,
            participantEmail: true,
            participantName: true,
            role: true,
            acceptedAt: true
          }
        },
        _count: {
          select: { adjustments: true, participants: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Enriquecer con metadata para la Landing Page
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        // Contar empleados candidatos del ciclo/scope
        const candidatesWhere: any = {
          accountId: session.accountId,
          isActive: true,
          performanceRatings: {
            some: { cycleId: session.cycleId }
          }
        }

        if (session.departmentIds && session.departmentIds.length > 0) {
          candidatesWhere.departmentId = { in: session.departmentIds }
        }

        const employeeCount = await prisma.employee.count({
          where: candidatesWhere
        })

        return {
          ...session,
          metadata: {
            employeeCount,
            adjustmentsCount: session._count.adjustments,
            participantsCount: session._count.participants
          }
        }
      })
    )

    // Incluir info de permisos para la UI
    const canManage = hasPermission(userContext.role, 'calibration:manage')

    return NextResponse.json({
      success: true,
      data: enrichedSessions,
      permissions: { canManage },
      userRole: userContext.role
    })

  } catch (error) {
    console.error('[API] Error GET /api/calibration/sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST - Crear sesión de calibración
// ════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // ═══ CHECK 1: extractUserContext ═══
    const userContext = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''

    if (!userContext.accountId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // ═══ CHECK 2: hasPermission (NO arrays hardcodeados) ═══
    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para crear calibraciones' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      cycleId,
      departmentIds,
      filterMode,
      filterConfig,
      enableForcedDistribution,
      distributionTargets,
      scheduledAt
    } = body

    // Validaciones
    if (!name || !cycleId) {
      return NextResponse.json(
        { success: false, error: 'name y cycleId son requeridos' },
        { status: 400 }
      )
    }

    // ═══ CHECK 3: Verificar que el ciclo pertenece al accountId ═══
    const cycle = await prisma.performanceCycle.findFirst({
      where: { id: cycleId, accountId: userContext.accountId }
    })

    if (!cycle) {
      return NextResponse.json(
        { success: false, error: 'Ciclo no encontrado o no pertenece a tu cuenta' },
        { status: 404 }
      )
    }

    // Validar distribución forzada si está habilitada
    if (enableForcedDistribution && distributionTargets) {
      const total = Object.values(distributionTargets as Record<string, number>)
        .reduce((sum: number, val: number) => sum + val, 0)

      if (Math.abs(total - 100) > 0.1) {
        return NextResponse.json(
          { success: false, error: 'Los porcentajes de distribución deben sumar 100' },
          { status: 400 }
        )
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Preparar data con soporte multi-criterio (TASK 17B)
    // ══════════════════════════════════════════════════════════════════════════

    const sessionData: any = {
      accountId: userContext.accountId,
      cycleId,
      name,
      description,
      enableForcedDistribution: enableForcedDistribution || false,
      distributionTargets: distributionTargets || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      facilitatorId: userEmail,
      createdBy: userEmail,
      status: 'DRAFT'
    }

    // OPCIÓN A: Sistema NUEVO (v3.1+) - filterMode + filterConfig
    if (filterMode && filterConfig) {
      sessionData.filterMode = filterMode
      sessionData.filterConfig = filterConfig

      // Si filterMode=department, también poblar departmentIds para backward compat
      if (filterMode === 'department' && filterConfig.departmentIds) {
        sessionData.departmentIds = filterConfig.departmentIds
      } else {
        sessionData.departmentIds = []
      }
    }
    // OPCIÓN B: Sistema LEGACY - departmentIds directo
    else if (departmentIds && departmentIds.length > 0) {
      sessionData.departmentIds = departmentIds
      // Auto-convertir a nuevo formato
      sessionData.filterMode = 'department'
      sessionData.filterConfig = { departmentIds }
    }
    // Sin filtro
    else {
      sessionData.departmentIds = []
    }

    // Crear sesión
    const session = await prisma.calibrationSession.create({
      data: sessionData,
      include: {
        cycle: {
          select: { id: true, name: true }
        }
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CALIBRATION_SESSION_CREATED',
        accountId: userContext.accountId,
        entityType: 'calibration_session',
        entityId: session.id,
        userInfo: {
          email: userEmail,
          sessionName: name,
          cycleId,
          departmentIds: departmentIds || []
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: session,
      message: 'Sesión creada exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('[API] Error POST /api/calibration/sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
