// src/app/api/goals/cycles/[id]/activate/route.ts
// ════════════════════════════════════════════════════════════════════════════
// POST /api/goals/cycles/[id]/activate — activa el ciclo (PLANNING/ASSIGNING → ACTIVE).
// Acá vive el candado de singleton (advisory lock en GoalCycleService.activate).
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
    const cycle = await GoalCycleService.activate(params.id)
    return NextResponse.json({ success: true, data: cycle })
  } catch (e) {
    return goalCycleErrorResponse(e) // 409 GOAL_CYCLE_ALREADY_ACTIVE / 400 validación
  }
}
