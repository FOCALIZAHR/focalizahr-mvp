// src/app/api/goals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoalsService } from '@/lib/services/GoalsService'
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES
} from '@/lib/services/AuthorizationService'
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

  // Meta líder
  isLeaderGoal: z.boolean().default(false),
})

// ════════════════════════════════════════════════════════════════════════════
// GET - Listar metas con filtros + SEGURIDAD
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
    if (!hasPermission(context.role, 'goals:view')) {
      return NextResponse.json(
        { error: 'Sin permisos para ver metas', success: false },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const departmentId = searchParams.get('departmentId')
    const level = searchParams.get('level') as 'COMPANY' | 'AREA' | 'INDIVIDUAL' | null
    const periodYear = searchParams.get('periodYear')
    const status = searchParams.get('status')
    const includeCompleted = searchParams.get('includeCompleted') === 'true'

    // ═══ CHECK 3: accountId en WHERE (base multi-tenant) ═══
    const where: any = {
      accountId: context.accountId,
    }

    // ═══ CHECK 4: Filtrado jerárquico según rol ═══
    const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(context.role as any)

    if (!hasGlobalAccess) {
      if (context.role === 'AREA_MANAGER' && context.departmentId) {
        // AREA_MANAGER: Ve COMPANY + AREA/INDIVIDUAL de su scope
        const childIds = await getChildDepartmentIds(context.departmentId)
        const allowedDepts = [context.departmentId, ...childIds]

        where.OR = [
          { level: 'COMPANY' },
          { level: 'AREA', departmentId: { in: allowedDepts } },
          { level: 'INDIVIDUAL', owner: { departmentId: { in: allowedDepts } } }
        ]
      } else if (context.role === 'EVALUATOR') {
        // EVALUATOR: Ve COMPANY + INDIVIDUAL de sus subordinados directos
        const currentEmployee = await prisma.employee.findFirst({
          where: {
            accountId: context.accountId,
            email: userEmail,
            status: 'ACTIVE'
          },
          select: { id: true }
        })

        if (currentEmployee) {
          where.OR = [
            { level: 'COMPANY' },
            { level: 'INDIVIDUAL', owner: { managerId: currentEmployee.id } }
          ]
        } else {
          // Sin empleado asociado, solo corporativas
          where.level = 'COMPANY'
        }
      }
    }

    // Filtros adicionales del query string
    if (employeeId) where.employeeId = employeeId
    if (departmentId) where.departmentId = departmentId
    if (level) where.level = level
    if (periodYear) where.periodYear = parseInt(periodYear)
    if (status) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean)
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses }
    }
    if (!includeCompleted && !status) {
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] }
    }

    // Filtro isLeaderGoal
    const isLeaderGoal = searchParams.get('isLeaderGoal')
    if (isLeaderGoal === 'true') where.isLeaderGoal = true
    if (isLeaderGoal === 'false') where.isLeaderGoal = false

    // Filtrar metas sin vincular a PDI
    const unlinked = searchParams.get('unlinked')
    if (unlinked === 'true') {
      where.linkedDevGoalId = null
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
// POST - Crear meta + SEGURIDAD
// ════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
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
    if (!hasPermission(context.role, 'goals:create')) {
      return NextResponse.json(
        { error: 'Sin permisos para crear metas', success: false },
        { status: 403 }
      )
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

    // ═══ CHECK 6: Validación de escritura - Restricción EVALUATOR ═══
    if (context.role === 'EVALUATOR') {
      // EVALUATOR solo puede crear metas INDIVIDUAL
      if (data.level !== 'INDIVIDUAL') {
        return NextResponse.json(
          { error: 'Solo puede crear metas individuales', success: false },
          { status: 403 }
        )
      }

      // Obtener el empleado actual (el EVALUATOR)
      const currentEmployee = await prisma.employee.findFirst({
        where: {
          accountId: context.accountId,
          email: userEmail,
          status: 'ACTIVE'
        },
        select: { id: true }
      })

      if (!currentEmployee) {
        return NextResponse.json(
          { error: 'Usuario no tiene empleado asociado', success: false },
          { status: 403 }
        )
      }

      // Validar que el empleado destino es su subordinado directo
      if (!data.employeeId) {
        return NextResponse.json(
          { error: 'Debe especificar employeeId para metas individuales', success: false },
          { status: 400 }
        )
      }

      const isSubordinate = await prisma.employee.findFirst({
        where: {
          id: data.employeeId,
          managerId: currentEmployee.id,
          accountId: context.accountId
        }
      })

      if (!isSubordinate) {
        return NextResponse.json(
          { error: 'Solo puede asignar metas a sus subordinados directos', success: false },
          { status: 403 }
        )
      }
    }

    // ═══ CHECK 4: Validación AREA_MANAGER - Solo su scope ═══
    if (context.role === 'AREA_MANAGER' && context.departmentId) {
      if (data.level === 'COMPANY') {
        return NextResponse.json(
          { error: 'No tiene permisos para crear metas corporativas', success: false },
          { status: 403 }
        )
      }

      if (data.level === 'AREA' || data.level === 'INDIVIDUAL') {
        const childIds = await getChildDepartmentIds(context.departmentId)
        const allowedDepts = [context.departmentId, ...childIds]

        // Validar departamento destino
        if (data.departmentId && !allowedDepts.includes(data.departmentId)) {
          return NextResponse.json(
            { error: 'No tiene permisos sobre ese departamento', success: false },
            { status: 403 }
          )
        }

        // Validar empleado destino
        if (data.employeeId) {
          const employee = await prisma.employee.findFirst({
            where: {
              id: data.employeeId,
              accountId: context.accountId
            },
            select: { departmentId: true }
          })

          if (!employee || !allowedDepts.includes(employee.departmentId)) {
            return NextResponse.json(
              { error: 'No tiene permisos sobre ese empleado', success: false },
              { status: 403 }
            )
          }
        }
      }
    }

    // Validaciones de negocio (existentes)
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
