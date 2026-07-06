// src/app/api/goals/cycles/[id]/finalize/route.ts
// ════════════════════════════════════════════════════════════════════════════
// POST /api/goals/cycles/[id]/finalize — cierra en firme (CLOSING → CLOSED).
//
// Dos modos (backward-compatible):
//   • SIN body / sin decisions[] → finalizeCycle puro (transición sola).
//   • CON decisions[]           → finalizeCycleWithDecisions: aplica las decisiones
//     del modal de cierre (Gate D.5, Decisión #8) sobre las metas incompletas y
//     transiciona, TODO en una $transaction atómica.
//
// Activa lockAfterClosure. RBAC: goals:cycles:manage. Guard multi-tenant antes de
// tocar el servicio (ownership → 404).
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { GoalCycleService } from '@/lib/services/GoalCycleService'
import { goalCycleErrorResponse } from '@/lib/api/goalCycleErrorResponse'

const bodySchema = z.object({
  decisions: z
    .array(
      z.object({
        goalId: z.string().min(1),
        decision: z.enum(['CLOSE_WITH_SCORE', 'MARK_REVIEW', 'LEAVE_AS_IS']),
      })
    )
    .optional(),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const ctx = extractUserContext(request)
  if (!ctx.accountId) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }
  if (!hasPermission(ctx.role, 'goals:cycles:manage')) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
  }

  const owned = await prisma.goalCycle.findFirst({
    where: { id: params.id, accountId: ctx.accountId },
    select: { id: true },
  })
  if (!owned) {
    return NextResponse.json({ success: false, error: 'Ciclo no encontrado' }, { status: 404 })
  }

  // Body opcional (el modo puro puede llamarse sin body).
  let decisions
  try {
    const raw = await request.json().catch(() => ({}))
    decisions = bodySchema.parse(raw).decisions
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', code: 'VALIDATION', details: e.errors },
        { status: 400 }
      )
    }
    throw e
  }

  try {
    if (decisions && decisions.length > 0) {
      // Nombre humano del estratega para la auditoría del cierre forzado.
      const userEmail = request.headers.get('x-user-email') || ''
      const employee = await prisma.employee.findFirst({
        where: { accountId: ctx.accountId, email: userEmail, status: 'ACTIVE' },
        select: { fullName: true },
      })
      const actorName = employee?.fullName || userEmail || 'Estratega'

      const result = await GoalCycleService.finalizeCycleWithDecisions(
        params.id,
        ctx.accountId,
        decisions,
        { id: ctx.userId ?? 'system', name: actorName }
      )
      return NextResponse.json({ success: true, data: result.cycle, summary: result.summary })
    }

    const cycle = await GoalCycleService.finalizeCycle(params.id, ctx.userId ?? undefined)
    return NextResponse.json({ success: true, data: cycle })
  } catch (e) {
    return goalCycleErrorResponse(e) // 400 validación/carrera · 400 no-CLOSING
  }
}
