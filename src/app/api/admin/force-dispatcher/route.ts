// ════════════════════════════════════════════════════════════════════════════
// POST /api/admin/force-dispatcher
// Boton de emergencia: ejecuta runDispatcherBatch() manualmente (Gate A v3.0)
// ════════════════════════════════════════════════════════════════════════════
// Spec: .claude/tasks/SPEC_GATE_A_COMUNICACIONES_v3.md seccion 5.2
//
// Solo FOCALIZAHR_ADMIN. Util mientras el scheduler externo capa 3 no este
// configurado o cuando el encadenamiento del dispatcher fallo por algun motivo.
//
// Ejecucion sincrona (sin encadenar): el caller espera el resultado del batch.
// Para procesar > BATCH_SIZE mensajes, invocar varias veces.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';
import { runDispatcherBatch } from '@/lib/services/message-dispatcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const userContext = extractUserContext(request);

  if (!userContext.accountId) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  if (!hasPermission(userContext.role, 'communication:force-dispatch')) {
    return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
  }

  try {
    const result = await runDispatcherBatch();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'unknown error';
    console.error('[ForceDispatcher] Error:', errMsg);
    return NextResponse.json(
      { success: false, error: 'Dispatcher batch failed', details: errMsg },
      { status: 500 }
    );
  }
}
