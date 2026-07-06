// src/app/api/goals/cycles/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GOAL CYCLES — colección. Gate C.
//   GET  : lista los GoalCycle de la cuenta (paginada, scoped por accountId)
//   POST : crea un ciclo en PLANNING (sin restricción de singleton)
// RBAC: goals:cycles:manage (estrategas). Multi-tenant: accountId del contexto.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { GoalCycleService } from '@/lib/services/GoalCycleService'
import { goalCycleErrorResponse } from '@/lib/api/goalCycleErrorResponse'

const createSchema = z.object({
  name: z.string().min(1),
  periodType: z.enum(['QUARTERLY', 'SEMESTER', 'ANNUAL']),
  year: z.number().int(),
  quarter: z.number().int().optional(),
  semester: z.number().int().optional(),
  assignmentWindow: z.string().datetime(),
  trackingWindow: z.string().datetime(),
  closureWindow: z.string().datetime(),
  requiresClosure: z.boolean().optional(),
  lockAfterClosure: z.boolean().optional(),
  linkedPerformanceCycleId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const ctx = extractUserContext(request)
  if (!ctx.accountId) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }
  if (!hasPermission(ctx.role, 'goals:cycles:manage')) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
  }

  // Paginación real (skill focalizahr-api Check 6)
  const { searchParams } = new URL(request.url)
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const skip = (page - 1) * limit

  const where = { accountId: ctx.accountId } // multi-tenant SIEMPRE
  const [data, total] = await Promise.all([
    prisma.goalCycle.findMany({
      where,
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }, { semester: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.goalCycle.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function POST(request: NextRequest) {
  const ctx = extractUserContext(request)
  if (!ctx.accountId) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }
  if (!hasPermission(ctx.role, 'goals:cycles:manage')) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
  }

  try {
    const body = createSchema.parse(await request.json())
    const cycle = await GoalCycleService.createCycle({
      accountId: ctx.accountId, // del contexto, NUNCA del body
      name: body.name,
      periodType: body.periodType,
      year: body.year,
      quarter: body.quarter,
      semester: body.semester,
      assignmentWindow: new Date(body.assignmentWindow),
      trackingWindow: new Date(body.trackingWindow),
      closureWindow: new Date(body.closureWindow),
      requiresClosure: body.requiresClosure,
      lockAfterClosure: body.lockAfterClosure,
      linkedPerformanceCycleId: body.linkedPerformanceCycleId,
      createdBy: ctx.userId ?? undefined,
    })
    return NextResponse.json({ success: true, data: cycle }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', code: 'VALIDATION', details: e.errors },
        { status: 400 }
      )
    }
    return goalCycleErrorResponse(e) // GoalCycleValidationError (400) / P2002 (409)
  }
}
