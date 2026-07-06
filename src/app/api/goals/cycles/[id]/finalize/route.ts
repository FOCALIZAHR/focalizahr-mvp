// src/app/api/goals/cycles/[id]/finalize/route.ts
// ════════════════════════════════════════════════════════════════════════════
// POST /api/goals/cycles/[id]/finalize — cierra en firme (CLOSING → CLOSED).
// Endpoint thin sobre GoalCycleService.finalizeCycle. La lógica de decisiones
// sobre metas incompletas (Decisión #8) vive en el modal de Gate D, que llama
// a este endpoint UNA VEZ aplicadas las decisiones. Activa lockAfterClosure.
// RBAC: goals:cycles:manage. Guard multi-tenant antes de tocar el servicio.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { GoalCycleService } from '@/lib/services/GoalCycleService'
import { goalCycleErrorResponse } from '@/lib/api/goalCycleErrorResponse'

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

  try {
    const cycle = await GoalCycleService.finalizeCycle(params.id, ctx.userId ?? undefined)
    return NextResponse.json({ success: true, data: cycle })
  } catch (e) {
    return goalCycleErrorResponse(e) // 400 si no está CLOSING
  }
}
