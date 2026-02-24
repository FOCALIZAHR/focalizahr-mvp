// src/app/api/config/goal-groups/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

// ════════════════════════════════════════════════════════════════════════════
// GET - Detalle de un grupo
// ════════════════════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = extractUserContext(request)
    if (!context.accountId || !hasPermission(context.role, 'goals:config')) {
      return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 })
    }

    const group = await prisma.goalGroup.findFirst({
      where: { id, accountId: context.accountId },
      include: {
        jobConfigs: {
          select: { id: true, standardJobLevel: true, hasGoals: true },
        },
        _count: { select: { jobConfigs: true, cascadeRules: true } },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Grupo no encontrado', success: false }, { status: 404 })
    }

    return NextResponse.json({ data: group, success: true })
  } catch (error) {
    console.error('[API goal-groups/[id] GET]:', error)
    return NextResponse.json({ error: 'Error obteniendo grupo', success: false }, { status: 500 })
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PATCH - Actualizar grupo
// ════════════════════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = extractUserContext(request)
    if (!context.accountId || !hasPermission(context.role, 'goals:config')) {
      return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 })
    }

    const body = await request.json()
    const { name, weightBusiness, weightLeader, weightNPS, weightSpecific, isDefault } = body

    // Si se actualizan pesos, validar suma
    if (
      weightBusiness !== undefined ||
      weightLeader !== undefined ||
      weightNPS !== undefined ||
      weightSpecific !== undefined
    ) {
      const total =
        (weightBusiness ?? 0) + (weightLeader ?? 0) + (weightNPS ?? 0) + (weightSpecific ?? 0)
      if (Math.abs(total - 100) > 0.01) {
        return NextResponse.json(
          { error: `Los pesos deben sumar 100%. Actual: ${total}%`, success: false },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (weightBusiness !== undefined) updateData.weightBusiness = weightBusiness
    if (weightLeader !== undefined) updateData.weightLeader = weightLeader
    if (weightNPS !== undefined) updateData.weightNPS = weightNPS
    if (weightSpecific !== undefined) updateData.weightSpecific = weightSpecific
    if (isDefault !== undefined) updateData.isDefault = isDefault

    const group = await prisma.goalGroup.update({
      where: { id, accountId: context.accountId },
      data: updateData,
    })

    return NextResponse.json({ data: group, success: true })
  } catch (error) {
    console.error('[API goal-groups/[id] PATCH]:', error)
    return NextResponse.json({ error: 'Error actualizando grupo', success: false }, { status: 500 })
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE - Soft-delete grupo
// ════════════════════════════════════════════════════════════════════════════

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = extractUserContext(request)
    if (!context.accountId || !hasPermission(context.role, 'goals:config')) {
      return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 })
    }

    // Verificar que no tenga configs asignadas
    const group = await prisma.goalGroup.findFirst({
      where: { id, accountId: context.accountId },
      include: { _count: { select: { jobConfigs: true } } },
    })

    if (!group) {
      return NextResponse.json({ error: 'Grupo no encontrado', success: false }, { status: 404 })
    }

    if (group._count.jobConfigs > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: ${group._count.jobConfigs} niveles de cargo usan este grupo`, success: false },
        { status: 400 }
      )
    }

    await prisma.goalGroup.update({
      where: { id, accountId: context.accountId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'Grupo eliminado' })
  } catch (error) {
    console.error('[API goal-groups/[id] DELETE]:', error)
    return NextResponse.json({ error: 'Error eliminando grupo', success: false }, { status: 500 })
  }
}
