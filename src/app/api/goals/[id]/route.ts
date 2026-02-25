// src/app/api/goals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES
} from '@/lib/services/AuthorizationService'
import { z } from 'zod'

const updateGoalSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  targetValue: z.number().optional(),
  weight: z.number().min(0).max(100).optional(),
  dueDate: z.string().transform(s => new Date(s)).optional(),
  status: z.enum(['NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED', 'CANCELLED']).optional(),
})

// ════════════════════════════════════════════════════════════════════════════
// GET - Detalle de meta
// ════════════════════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // ═══ CHECK 2: hasPermission ═══
    if (!hasPermission(context.role, 'goals:view')) {
      return NextResponse.json(
        { error: 'Sin permisos para ver metas', success: false },
        { status: 403 }
      )
    }

    const { id } = await params

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        accountId: context.accountId,
      },
      include: {
        parent: {
          select: { id: true, title: true, level: true, progress: true }
        },
        children: {
          select: {
            id: true,
            title: true,
            level: true,
            progress: true,
            status: true,
            owner: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        owner: {
          select: { id: true, fullName: true, position: true, email: true, departmentId: true, managerId: true }
        },
        department: {
          select: { id: true, displayName: true }
        },
        progressUpdates: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            previousValue: true,
            newValue: true,
            previousProgress: true,
            newProgress: true,
            comment: true,
            createdAt: true,
            updatedById: true,
          },
        },
        linkedDevGoal: {
          select: { id: true, title: true, planId: true }
        },
      },
    })

    if (!goal) {
      return NextResponse.json(
        { error: 'Meta no encontrada', success: false },
        { status: 404 }
      )
    }

    // ═══ CHECK 4: Validar scope jerárquico ═══
    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(context.role as any)

    if (!hasGlobalAccess && goal) {
      const userEmail = request.headers.get('x-user-email') || ''

      if (context.role === 'AREA_MANAGER' && context.departmentId) {
        const childIds = await getChildDepartmentIds(context.departmentId)
        const allowedDepts = [context.departmentId, ...childIds]

        // Validar según nivel de la meta
        if (goal.level === 'AREA' && goal.departmentId && !allowedDepts.includes(goal.departmentId)) {
          return NextResponse.json(
            { error: 'Sin acceso a esta meta', success: false },
            { status: 403 }
          )
        }
        if (goal.level === 'INDIVIDUAL' && goal.owner?.departmentId &&
            !allowedDepts.includes(goal.owner.departmentId)) {
          return NextResponse.json(
            { error: 'Sin acceso a esta meta', success: false },
            { status: 403 }
          )
        }
      } else if (context.role === 'EVALUATOR') {
        const currentEmployee = await prisma.employee.findFirst({
          where: { accountId: context.accountId, email: userEmail, status: 'ACTIVE' },
          select: { id: true }
        })

        // EVALUATOR solo ve COMPANY o metas de subordinados
        if (goal.level !== 'COMPANY') {
          if (!currentEmployee || goal.owner?.managerId !== currentEmployee.id) {
            return NextResponse.json(
              { error: 'Sin acceso a esta meta', success: false },
              { status: 403 }
            )
          }
        }
      }
    }

    // Enriquecer progressUpdates con nombres de quién actualizó
    let enrichedUpdates = goal.progressUpdates
    if (goal.progressUpdates.length > 0) {
      const updaterIds = [...new Set(goal.progressUpdates.map(u => u.updatedById))]

      // Buscar en Employee
      const employees = await prisma.employee.findMany({
        where: { id: { in: updaterIds } },
        select: { id: true, fullName: true }
      })

      // Fallback a Account para IDs que no se encontraron
      const foundIds = new Set(employees.map(e => e.id))
      const missingIds = updaterIds.filter(uid => !foundIds.has(uid))

      let accounts: { id: string; adminName: string | null }[] = []
      if (missingIds.length > 0) {
        accounts = await prisma.account.findMany({
          where: { id: { in: missingIds } },
          select: { id: true, adminName: true }
        })
      }

      // Mapa de nombres
      const nameMap = new Map<string, string>()
      employees.forEach(e => nameMap.set(e.id, e.fullName))
      accounts.forEach(a => nameMap.set(a.id, a.adminName || 'Administrador'))

      enrichedUpdates = goal.progressUpdates.map(update => ({
        ...update,
        updatedByName: nameMap.get(update.updatedById) || 'Usuario'
      }))
    }

    return NextResponse.json({
      data: {
        ...goal,
        progressUpdates: enrichedUpdates
      },
      success: true,
    })

  } catch (error) {
    console.error('[API Goal GET]:', error)
    return NextResponse.json(
      { error: 'Error obteniendo meta', success: false },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PATCH - Actualizar meta
// ════════════════════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // ═══ CHECK 2: hasPermission (usar 'goals:create' para modificar) ═══
    if (!hasPermission(context.role, 'goals:create')) {
      return NextResponse.json(
        { error: 'Sin permisos para modificar metas', success: false },
        { status: 403 }
      )
    }

    const { id } = await params

    const existing = await prisma.goal.findFirst({
      where: {
        id,
        accountId: context.accountId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Meta no encontrada', success: false },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = updateGoalSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten(), success: false },
        { status: 400 }
      )
    }

    const data = validation.data

    const updateData: any = { ...data }
    if (data.status === 'COMPLETED' && !existing.completedAt) {
      updateData.completedAt = new Date()
    }

    const updated = await prisma.goal.update({
      where: { id },
      data: updateData,
      include: {
        parent: { select: { id: true, title: true } },
        owner: { select: { id: true, fullName: true } },
      },
    })

    return NextResponse.json({
      data: updated,
      success: true,
    })

  } catch (error) {
    console.error('[API Goal PATCH]:', error)
    return NextResponse.json(
      { error: 'Error actualizando meta', success: false },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE - Cancelar meta (soft delete)
// ════════════════════════════════════════════════════════════════════════════

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // ═══ CHECK 2: hasPermission ═══
    if (!hasPermission(context.role, 'goals:create')) {
      return NextResponse.json(
        { error: 'Sin permisos para eliminar metas', success: false },
        { status: 403 }
      )
    }

    const { id } = await params

    const existing = await prisma.goal.findFirst({
      where: {
        id,
        accountId: context.accountId,
      },
      include: {
        _count: { select: { children: true } },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Meta no encontrada', success: false },
        { status: 404 }
      )
    }

    if (existing._count.children > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una meta con metas hijas. Elimina las hijas primero.', success: false },
        { status: 400 }
      )
    }

    await prisma.goal.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({
      message: 'Meta cancelada correctamente',
      success: true,
    })

  } catch (error) {
    console.error('[API Goal DELETE]:', error)
    return NextResponse.json(
      { error: 'Error eliminando meta', success: false },
      { status: 500 }
    )
  }
}
