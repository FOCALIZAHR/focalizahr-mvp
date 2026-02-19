// src/app/api/goals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoalsService } from '@/lib/services/GoalsService'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { z } from 'zod'

// ════════════════════════════════════════════════════════════════════════════
// SCHEMA DE VALIDACIÓN
// ════════════════════════════════════════════════════════════════════════════

const createGoalSchema = z.object({
  title: z.string().min(3, 'Título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  type: z.enum(['KPI', 'OBJECTIVE', 'KEY_RESULT', 'PROJECT']).default('KPI'),
  level: z.enum(['COMPANY', 'AREA', 'INDIVIDUAL']),

  // Propiedad (según nivel)
  employeeId: z.string().optional(),
  departmentId: z.string().optional(),

  // Tiempo
  startDate: z.string().transform(s => new Date(s)),
  dueDate: z.string().transform(s => new Date(s)),
  periodYear: z.number().int().min(2020).max(2100),
  periodQuarter: z.number().int().min(1).max(4).optional(),

  // Medición
  metricType: z.enum(['PERCENTAGE', 'CURRENCY', 'NUMBER', 'BINARY']).default('PERCENTAGE'),
  startValue: z.number().default(0),
  targetValue: z.number(),
  unit: z.string().optional(),

  // Peso para performance
  weight: z.number().min(0).max(100).default(0),

  // Cascada (opcional)
  parentId: z.string().optional(),

  // PDI link (opcional)
  linkedDevGoalId: z.string().optional(),
})

// ════════════════════════════════════════════════════════════════════════════
// GET - Listar metas con filtros
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const departmentId = searchParams.get('departmentId')
    const level = searchParams.get('level') as 'COMPANY' | 'AREA' | 'INDIVIDUAL' | null
    const periodYear = searchParams.get('periodYear')
    const status = searchParams.get('status')
    const includeCompleted = searchParams.get('includeCompleted') === 'true'

    // Construir filtro
    const where: any = {
      accountId: context.accountId,
    }

    if (employeeId) where.employeeId = employeeId
    if (departmentId) where.departmentId = departmentId
    if (level) where.level = level
    if (periodYear) where.periodYear = parseInt(periodYear)
    if (status) where.status = status
    if (!includeCompleted && !status) {
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] }
    }

    const goals = await prisma.goal.findMany({
      where,
      include: {
        parent: { select: { id: true, title: true, level: true } },
        owner: { select: { id: true, fullName: true, position: true } },
        department: { select: { id: true, displayName: true } },
        _count: { select: { children: true } },
      },
      orderBy: [
        { level: 'asc' },
        { weight: 'desc' },
        { dueDate: 'asc' },
      ],
    })

    return NextResponse.json({
      data: goals,
      count: goals.length,
      success: true,
    })

  } catch (error) {
    console.error('[API Goals GET]:', error)
    return NextResponse.json(
      { error: 'Error obteniendo metas', success: false },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST - Crear meta
// ════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createGoalSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten(), success: false },
        { status: 400 }
      )
    }

    const data = validation.data

    // Validaciones de negocio
    if (data.level === 'INDIVIDUAL' && !data.employeeId) {
      return NextResponse.json(
        { error: 'employeeId es requerido para metas individuales', success: false },
        { status: 400 }
      )
    }

    if (data.level === 'AREA' && !data.departmentId) {
      return NextResponse.json(
        { error: 'departmentId es requerido para metas de área', success: false },
        { status: 400 }
      )
    }

    const createdById = context.userId || context.accountId

    // Determinar método de creación según contexto
    let goal

    if (data.level === 'COMPANY' && !data.parentId) {
      goal = await GoalsService.createCorporateGoal({
        accountId: context.accountId,
        createdById,
        ...data,
      })
    } else if (data.parentId) {
      goal = await GoalsService.cascadeGoal(data.parentId, {
        accountId: context.accountId,
        createdById,
        ...data,
      })
    } else {
      goal = await GoalsService.createManagerGoal({
        accountId: context.accountId,
        createdById,
        ...data,
      })
    }

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
    console.error('[API Goals POST]:', error)
    return NextResponse.json(
      { error: 'Error creando meta', success: false },
      { status: 500 }
    )
  }
}
