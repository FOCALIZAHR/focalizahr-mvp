// ════════════════════════════════════════════════════════════════════════════
// CRON: /api/cron/message-dispatcher
// Endpoint del dispatcher de cola CommunicationMessage (Gate A v3.0)
// ════════════════════════════════════════════════════════════════════════════
// Spec: .claude/tasks/SPEC_GATE_A_COMUNICACIONES_v3.md seccion 3.4 y 3.5
//
// Disparo triple capa (compat Vercel Hobby):
//   CAPA 1: activate llama via waitUntil (primer batch post-encolado)
//   CAPA 2: este endpoint se auto-invoca encadenado mientras remaining > 0
//           (max 15 invocaciones por cadena, control via ?chain=N)
//   CAPA 3: scheduler externo cada 5 min como red de seguridad
//           (configurado fuera de vercel.json — ver GATE_A_HANDOFF.md)
//
// Auth: Bearer CRON_SECRET o header x-vercel-cron-bypass (mismo patron
// que send-reminders legacy).
//
// maxDuration: 60s (limite max plan Vercel Hobby).
// ════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// CAPA 3 PENDIENTE: este endpoint necesita un trigger periódico (~cada 5 min)
// para procesar retries programadas (scheduledAt futuro). HOY no está configurado.
// Al pasar a Vercel Pro: agregar a vercel.json crons:
//   { "path": "/api/cron/message-dispatcher", "schedule": "*/5 * * * *" }
// Vercel pinga con Authorization: Bearer CRON_SECRET, que este endpoint ya valida.
// En Hobby NO se puede (cron */5 falla el deploy). Sin esto, las retries quedan
// inertes (ver P6 del smoke test Gate A).
// ─────────────────────────────────────────────────────────────────────────────
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { runDispatcherBatch } from '@/lib/services/message-dispatcher';

const MAX_CHAIN_DEPTH = 15;

function verifyCronAuth(request: NextRequest): boolean {
  // Vercel Cron (si en el futuro se agrega a vercel.json)
  if (request.headers.get('x-vercel-cron-bypass')) return true;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[Dispatcher] CRON_SECRET no configurado');
    return false;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  return authHeader.substring(7) === cronSecret;
}

function getBaseUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (base) return base;
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return null;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chain = Number(searchParams.get('chain') ?? '0');

  try {
    const result = await runDispatcherBatch();

    // CAPA 2: encadenamiento si quedan mensajes y no alcanzamos el tope
    if (result.remaining > 0 && chain < MAX_CHAIN_DEPTH) {
      const baseUrl = getBaseUrl();
      const cronSecret = process.env.CRON_SECRET;

      if (baseUrl && cronSecret) {
        const nextUrl = `${baseUrl}/api/cron/message-dispatcher?chain=${chain + 1}`;
        // waitUntil sobrevive a la respuesta HTTP (fire-and-forget seguro)
        waitUntil(
          fetch(nextUrl, {
            headers: { Authorization: `Bearer ${cronSecret}` },
          }).catch((err) => {
            console.error('[Dispatcher] Chain fetch failed:', err instanceof Error ? err.message : err);
          })
        );
      } else if (!baseUrl) {
        console.warn('[Dispatcher] Sin base URL para encadenar (NEXT_PUBLIC_BASE_URL / VERCEL_URL)');
      }
    } else if (result.remaining > 0 && chain >= MAX_CHAIN_DEPTH) {
      console.warn(`[Dispatcher] Tope de cadena alcanzado (${MAX_CHAIN_DEPTH}), ${result.remaining} mensajes esperan a scheduler externo`);
    }

    return NextResponse.json({
      success: true,
      data: {
        chain,
        ...result,
        chainedNext: result.remaining > 0 && chain < MAX_CHAIN_DEPTH,
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'unknown error';
    console.error('[Dispatcher] Error fatal en batch:', errMsg);
    return NextResponse.json(
      { success: false, error: 'Dispatcher batch failed', details: errMsg },
      { status: 500 }
    );
  }
}
