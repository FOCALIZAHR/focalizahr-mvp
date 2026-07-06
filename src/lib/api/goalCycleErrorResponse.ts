// src/lib/api/goalCycleErrorResponse.ts
// ════════════════════════════════════════════════════════════════════════════
// Mapeo único de errores de dominio de GoalCycle → HTTP.
// Usado por las 5 rutas de /api/goals/cycles (Gate C).
// ════════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import {
  GoalCycleActiveError,
  GoalCycleClosedError,
  GoalCycleValidationError,
} from '@/lib/services/GoalCycleService'

export function goalCycleErrorResponse(e: unknown): NextResponse {
  if (e instanceof GoalCycleActiveError) {
    return NextResponse.json({ success: false, error: e.message, code: e.code }, { status: 409 })
  }
  if (e instanceof GoalCycleClosedError) {
    return NextResponse.json({ success: false, error: e.message, code: e.code }, { status: 409 })
  }
  if (e instanceof GoalCycleValidationError) {
    return NextResponse.json({ success: false, error: e.message, code: e.code }, { status: 400 })
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    return NextResponse.json(
      { success: false, error: 'Ya existe un ciclo para ese período', code: 'GOAL_CYCLE_PERIOD_EXISTS' },
      { status: 409 }
    )
  }
  console.error('[goalCycle] error no mapeado:', e)
  return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
}
