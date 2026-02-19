// src/app/api/goals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'
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
          select: { id: true, fullName: true, position: true, email: true }
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

    return NextResponse.json({
      data: goal,
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
