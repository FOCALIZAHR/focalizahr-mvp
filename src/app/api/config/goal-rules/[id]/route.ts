// src/app/api/config/goal-rules/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

// ════════════════════════════════════════════════════════════════════════════
// PATCH - Actualizar regla
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
    const { name, description, assignedWeight, isLeaderOnly, targetGroupId, isActive } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (assignedWeight !== undefined) updateData.assignedWeight = assignedWeight
    if (isLeaderOnly !== undefined) updateData.isLeaderOnly = isLeaderOnly
    if (targetGroupId !== undefined) updateData.targetGroupId = targetGroupId
    if (isActive !== undefined) updateData.isActive = isActive

    const rule = await prisma.goalCascadeRule.update({
      where: { id, accountId: context.accountId },
      data: updateData,
    })

    return NextResponse.json({ data: rule, success: true })
  } catch (error) {
    console.error('[API goal-rules/[id] PATCH]:', error)
    return NextResponse.json({ error: 'Error actualizando regla', success: false }, { status: 500 })
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE - Soft-delete regla
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

    await prisma.goalCascadeRule.update({
      where: { id, accountId: context.accountId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'Regla eliminada' })
  } catch (error) {
    console.error('[API goal-rules/[id] DELETE]:', error)
    return NextResponse.json({ error: 'Error eliminando regla', success: false }, { status: 500 })
  }
}
