// src/app/api/goals/[id]/check-in/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoalsService } from '@/lib/services/GoalsService'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { z } from 'zod'

const checkInSchema = z.object({
  currentValue: z.number(),
  comment: z.string().optional(),
  evidence: z.string().optional(),
})

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

    // Verificar que existe
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

    // No permitir check-in en metas completadas o canceladas
    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'No se puede actualizar una meta completada o cancelada', success: false },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validation = checkInSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten(), success: false },
        { status: 400 }
      )
    }

    const { currentValue, comment, evidence } = validation.data
    const updatedById = context.userId || context.accountId

    // Actualizar con auditoría (Time Travel)
    const updated = await GoalsService.updateProgress({
      goalId: id,
      newValue: currentValue,
      comment,
      evidence,
      updatedById,
    })

    // Cargar relaciones para respuesta
    const goalWithRelations = await prisma.goal.findUnique({
      where: { id: updated.id },
      include: {
        progressUpdates: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    return NextResponse.json({
      data: goalWithRelations,
      message: `Progreso actualizado: ${updated.progress}%`,
      success: true,
    })

  } catch (error) {
    console.error('[API Goal Check-in]:', error)
    return NextResponse.json(
      { error: 'Error actualizando progreso', success: false },
      { status: 500 }
    )
  }
}
