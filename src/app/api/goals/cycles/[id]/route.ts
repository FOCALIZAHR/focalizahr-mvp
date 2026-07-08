// src/app/api/goals/cycles/[id]/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GOAL CYCLE — detalle. Gate C.
//   GET   : detalle de un ciclo (scoped por accountId)
//   PATCH : editar 1-3 ventanas del ciclo (GoalCycleService.updateCycleWindows)
// RBAC: goals:cycles:manage. Guard multi-tenant: el ciclo debe ser de la cuenta.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { GoalCycleService } from '@/lib/services/GoalCycleService'
import { goalCycleErrorResponse } from '@/lib/api/goalCycleErrorResponse'

// Gate D.8: las 3 ventanas son editables (antes solo closureWindow). Todas
// opcionales; se exige al menos una. Retro-compatible con { closureWindow }.
const patchSchema = z
  .object({
    assignmentWindow: z.string().datetime().optional(),
    trackingWindow: z.string().datetime().optional(),
    closureWindow: z.string().datetime().optional(),
  })
  .refine((w) => w.assignmentWindow || w.trackingWindow || w.closureWindow, {
    message: 'Se requiere al menos una ventana',
  })

// Guard de ownership: el ciclo debe pertenecer a la cuenta. Evita que un id de
// otra cuenta sea operado (los métodos del servicio NO filtran por accountId).
async function isOwned(id: string, accountId: string): Promise<boolean> {
  const owned = await prisma.goalCycle.findFirst({
    where: { id, accountId },
    select: { id: true },
  })
  return !!owned
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const ctx = extractUserContext(request)
  if (!ctx.accountId) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }
  if (!hasPermission(ctx.role, 'goals:cycles:manage')) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
  }

  const cycle = await prisma.goalCycle.findFirst({
    where: { id: params.id, accountId: ctx.accountId },
  })
  if (!cycle) {
    return NextResponse.json({ success: false, error: 'Ciclo no encontrado' }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: cycle })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const ctx = extractUserContext(request)
  if (!ctx.accountId) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }
  if (!hasPermission(ctx.role, 'goals:cycles:manage')) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
  }
  if (!(await isOwned(params.id, ctx.accountId))) {
    return NextResponse.json({ success: false, error: 'Ciclo no encontrado' }, { status: 404 })
  }

  try {
    const body = patchSchema.parse(await request.json())
    const windows = {
      ...(body.assignmentWindow ? { assignmentWindow: new Date(body.assignmentWindow) } : {}),
      ...(body.trackingWindow ? { trackingWindow: new Date(body.trackingWindow) } : {}),
      ...(body.closureWindow ? { closureWindow: new Date(body.closureWindow) } : {}),
    }
    const cycle = await GoalCycleService.updateCycleWindows(
      params.id,
      windows,
      ctx.userId ?? 'unknown'
    )
    return NextResponse.json({ success: true, data: cycle })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', code: 'VALIDATION', details: e.errors },
        { status: 400 }
      )
    }
    return goalCycleErrorResponse(e)
  }
}
