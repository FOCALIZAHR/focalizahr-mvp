// src/app/api/goals/[id]/cascade/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoalsService } from '@/lib/services/GoalsService'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { z } from 'zod'

const cascadeSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  level: z.enum(['AREA', 'INDIVIDUAL']),

  employeeId: z.string().optional(),
  departmentId: z.string().optional(),

  targetValue: z.number(),
  weight: z.number().min(0).max(100).default(0),

  startDate: z.string().transform(s => new Date(s)),
  dueDate: z.string().transform(s => new Date(s)),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que el padre existe
    const parent = await prisma.goal.findFirst({
      where: {
        id,
        accountId: context.accountId,
      },
    })

    if (!parent) {
      return NextResponse.json(
        { error: 'Meta padre no encontrada', success: false },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = cascadeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten(), success: false },
        { status: 400 }
      )
    }

    const data = validation.data

    // Validar nivel correcto en cascada
    if (parent.level === 'COMPANY' && data.level !== 'AREA') {
      return NextResponse.json(
        { error: 'Desde una meta corporativa solo se puede cascadear a nivel AREA', success: false },
        { status: 400 }
      )
    }

    if (parent.level === 'AREA' && data.level !== 'INDIVIDUAL') {
      return NextResponse.json(
        { error: 'Desde una meta de área solo se puede cascadear a nivel INDIVIDUAL', success: false },
        { status: 400 }
      )
    }

    if (parent.level === 'INDIVIDUAL') {
      return NextResponse.json(
        { error: 'No se puede cascadear desde una meta individual', success: false },
        { status: 400 }
      )
    }

    const createdById = context.userId || context.accountId

    // Crear meta cascadeada
    const goal = await GoalsService.cascadeGoal(id, {
      accountId: context.accountId,
      createdById,
      type: parent.type,
      metricType: parent.metricType,
      unit: parent.unit ?? undefined,
      periodYear: parent.periodYear,
      periodQuarter: parent.periodQuarter ?? undefined,
      startValue: 0,
      ...data,
    })

    const goalWithRelations = await prisma.goal.findUnique({
      where: { id: goal.id },
      include: {
        parent: { select: { id: true, title: true } },
        owner: { select: { id: true, fullName: true } },
        department: { select: { id: true, displayName: true } },
      },
    })

    return NextResponse.json({
      data: goalWithRelations,
      success: true,
    }, { status: 201 })

  } catch (error) {
    console.error('[API Goal Cascade]:', error)
    return NextResponse.json(
      { error: 'Error cascadeando meta', success: false },
      { status: 500 }
    )
  }
}
