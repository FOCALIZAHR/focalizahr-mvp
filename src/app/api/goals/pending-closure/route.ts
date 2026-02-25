// src/app/api/goals/pending-closure/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES
} from '@/lib/services/AuthorizationService'

// ════════════════════════════════════════════════════════════════════════════
// GET - Listar metas pendientes de aprobación
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // ═══ CHECK 1: extractUserContext ═══
    const context = extractUserContext(request)
    const userEmail = request.headers.get('x-user-email') || ''

    if (!context.accountId) {
      return NextResponse.json(
        { error: 'No autorizado', success: false },
        { status: 401 }
      )
    }

    // ═══ CHECK 2: hasPermission ═══
    if (!hasPermission(context.role, 'goals:approve')) {
      return NextResponse.json(
        { error: 'Sin permisos para ver aprobaciones pendientes', success: false },
        { status: 403 }
      )
    }

    // ═══ Construir filtro base ═══
    const where: any = {
      accountId: context.accountId,
      status: 'PENDING_CLOSURE',
    }

    // ═══ CHECK 4: Filtrado jerárquico según rol ═══
    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(context.role as any)

    if (!hasGlobalAccess) {
      if (context.role === 'AREA_MANAGER' && context.departmentId) {
        // AREA_MANAGER: Ve pendientes de su scope (excepto COMPANY)
        const childIds = await getChildDepartmentIds(context.departmentId)
        const allowedDepts = [context.departmentId, ...childIds]

        where.OR = [
          // Metas de ÁREA de su departamento
          { level: 'AREA', departmentId: { in: allowedDepts } },
          // Metas INDIVIDUALES de empleados en su departamento
          { level: 'INDIVIDUAL', owner: { departmentId: { in: allowedDepts } } }
        ]
        // NO incluye COMPANY - solo roles globales aprueban corporativas
      } else {
        // Otros roles sin acceso global no deberían llegar aquí
        // pero por seguridad, no retornamos nada
        where.id = 'no-access'
      }
    }
    // Si hasGlobalAccess, no agregamos filtro adicional - ve todas

    // ═══ Query ═══
    const pendingGoals = await prisma.goal.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            position: true,
            departmentId: true
          }
        },
        department: { select: { id: true, displayName: true } },
        parent: { select: { id: true, title: true } },
      },
      orderBy: [
        { closureRequestedAt: 'asc' }, // Más antiguas primero
        { level: 'asc' }, // COMPANY → AREA → INDIVIDUAL
      ],
    })

    // ═══ Enriquecer con tiempo en espera ═══
    const enrichedGoals = pendingGoals.map(goal => {
      const requestedAt = goal.closureRequestedAt
      const waitingDays = requestedAt
        ? Math.floor((Date.now() - new Date(requestedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        ...goal,
        waitingDays,
        isUrgent: waitingDays >= 3, // Más de 3 días esperando
      }
    })

    // ═══ Stats por nivel ═══
    const stats = {
      total: enrichedGoals.length,
      byLevel: {
        company: enrichedGoals.filter(g => g.level === 'COMPANY').length,
        area: enrichedGoals.filter(g => g.level === 'AREA').length,
        individual: enrichedGoals.filter(g => g.level === 'INDIVIDUAL').length,
      },
      urgent: enrichedGoals.filter(g => g.isUrgent).length,
    }

    return NextResponse.json({
      data: enrichedGoals,
      stats,
      success: true,
    })

  } catch (error) {
    console.error('[API Pending Closure]:', error)
    return NextResponse.json(
      { error: 'Error obteniendo metas pendientes', success: false },
      { status: 500 }
    )
  }
}
