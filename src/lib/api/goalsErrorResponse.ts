// src/lib/api/goalsErrorResponse.ts
// ════════════════════════════════════════════════════════════════════════════
// Mapeo único de errores de dominio de Goals → HTTP (Gate A, punto 3).
// Gemelo de goalCycleErrorResponse.ts (que cubre las rutas de /cycles).
//
// POR QUÉ EXISTE: las rutas de escritura de metas aplanaban CUALQUIER
// excepción a un 500 con "Error creando meta", tragándose mensajes de negocio
// perfectamente accionables ("Peso total excede 100%...", "Este empleado ya
// tiene asignada esta meta"). Errores de dominio ≠ fallas de infraestructura.
//
// REGLA: se mapea por TIPO/CLASE, nunca por texto del mensaje.
// ════════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import {
  GoalNoActiveCycleError,
  GoalWeightExceededError,
  GoalLimitReachedError,
  GoalDuplicateError,
  GoalKpiRangeError,
} from '@/lib/services/GoalsService'
import { GoalCycleClosedError } from '@/lib/services/GoalCycleService'

export function goalsErrorResponse(e: unknown): NextResponse {
  // ── 409 CONFLICTO DE ESTADO ──
  // "No hay ciclo activo" comparte código con el 409 que ya devuelve Gate E en
  // POST /api/goals: un solo status para el mismo estado de conflicto en toda
  // la app (decisión Victor, 2026-07-14).
  if (e instanceof GoalNoActiveCycleError) {
    return NextResponse.json({ success: false, error: e.message, code: e.code }, { status: 409 })
  }
  if (e instanceof GoalCycleClosedError) {
    return NextResponse.json({ success: false, error: e.message, code: e.code }, { status: 409 })
  }

  // ── 400 EL USUARIO PUEDE CORREGIRLO ──
  if (
    e instanceof GoalWeightExceededError ||
    e instanceof GoalLimitReachedError ||
    e instanceof GoalDuplicateError ||
    e instanceof GoalKpiRangeError
  ) {
    return NextResponse.json({ success: false, error: e.message, code: e.code }, { status: 400 })
  }

  // ── 500 SOLO LO VERDADERAMENTE INESPERADO ──
  console.error('[goals] error no mapeado:', e)
  return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
}
