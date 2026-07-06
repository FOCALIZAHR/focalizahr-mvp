// src/app/api/goals/cycles/active/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GET /api/goals/cycles/active — ciclo ACTIVE de la cuenta (o null). Gate D.1.
//
// Endpoint LIVIANO para el wizard de crear-meta de un COLABORADOR: muestra el
// nombre del ciclo heredado (Decisión #4) sin exponer la superficie admin.
//
// RBAC: goals:view (cualquiera que ve/crea metas — AREA_MANAGER/EVALUATOR/etc.),
// NO goals:cycles:manage (ese es la superficie admin /admin/metas/ciclos, Gate C).
// Multi-tenant: accountId del contexto. Devuelve solo {id, name, status}.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { GoalCycleService } from '@/lib/services/GoalCycleService'

export async function GET(request: NextRequest) {
  const ctx = extractUserContext(request)
  if (!ctx.accountId) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }
  if (!hasPermission(ctx.role, 'goals:view')) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
  }

  const cycle = await GoalCycleService.getActiveCycle(ctx.accountId)

  return NextResponse.json({
    success: true,
    data: cycle ? { id: cycle.id, name: cycle.name, status: cycle.status } : null,
  })
}
