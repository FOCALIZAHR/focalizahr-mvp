// src/app/api/config/goal-rules/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { z } from 'zod'

// ════════════════════════════════════════════════════════════════════════════
// VALIDACIÓN
// ════════════════════════════════════════════════════════════════════════════

const createRuleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  sourceGoalId: z.string().min(1),
  targetGroupId: z.string().nullable().optional(),
  assignedWeight: z.number().min(0).max(100).default(0),
  isLeaderOnly: z.boolean().default(false),
})

// ════════════════════════════════════════════════════════════════════════════
// GET - Listar reglas de cascada
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId || !hasPermission(context.role, 'goals:config')) {
      return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 })
    }

    const rules = await prisma.goalCascadeRule.findMany({
      where: { accountId: context.accountId, isActive: true },
      include: {
        sourceGoal: { select: { id: true, title: true, level: true } },
        targetGroup: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: rules, success: true })
  } catch (error) {
    console.error('[API goal-rules GET]:', error)
    return NextResponse.json({ error: 'Error obteniendo reglas', success: false }, { status: 500 })
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST - Crear regla de cascada
// ════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId || !hasPermission(context.role, 'goals:config')) {
      return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 })
    }

    const body = await request.json()
    const validation = createRuleSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten(), success: false },
        { status: 400 }
      )
    }

    const { name, description, sourceGoalId, targetGroupId, assignedWeight, isLeaderOnly } =
      validation.data

    // Verificar que la meta origen es COMPANY o AREA
    const sourceGoal = await prisma.goal.findFirst({
      where: { id: sourceGoalId, accountId: context.accountId },
    })
    if (!sourceGoal || sourceGoal.level === 'INDIVIDUAL') {
      return NextResponse.json(
        { error: 'La meta origen debe ser COMPANY o AREA', success: false },
        { status: 400 }
      )
    }

    const rule = await prisma.goalCascadeRule.create({
      data: {
        accountId: context.accountId,
        name,
        description,
        sourceGoalId,
        targetGroupId: targetGroupId ?? null,
        assignedWeight,
        isLeaderOnly,
      },
      include: {
        sourceGoal: { select: { title: true } },
        targetGroup: { select: { name: true } },
      },
    })

    return NextResponse.json({ data: rule, success: true }, { status: 201 })
  } catch (error) {
    console.error('[API goal-rules POST]:', error)
    return NextResponse.json({ error: 'Error creando regla', success: false }, { status: 500 })
  }
}
