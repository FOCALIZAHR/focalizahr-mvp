/**
 * API GET /api/cron/clima-narrative-refresh
 *
 * Regenera la narrativa ejecutiva de los hallazgos de Clima cuando cambian las
 * clasificaciones. Drena los planes de clima aprobados y, para cada uno, compara
 * el hash de sus clasificaciones vigentes contra el persistido:
 *
 *   igual    → no hace NADA. Ni una llamada al modelo.
 *   distinto → Sonnet regenera y se persiste en ClimaEffectivenessNarrative.
 *
 * Ese corte por hash es lo que hace barato correr todos los días: con 90 jefes que
 * no escribieron nada, el tick cuesta una query por plan.
 *
 * Frecuencia: 1x/día en Hobby. Subir a cada 6h con Vercel Pro cuando el volumen lo
 * justifique.
 *
 * Método GET: Vercel Cron invoca por GET en el plan Hobby.
 *
 * Autenticación:
 *   Header: Authorization: Bearer {CRON_SECRET}
 *   Mismo patrón que `compliance-process-pending`.
 *
 * ⚠️ ESTA RUTA VA REGISTRADA EN `vercel.json` EN EL MISMO COMMIT.
 * Hay seis crons en este proyecto que existen como código y nunca se ejecutan
 * porque nadie los registró (ver BACKLOG_ENTERPRISE.md → P0-5). El modo de falla
 * es silencioso: la narrativa se quedaría en PENDING para siempre, la UI caería al
 * template y se vería perfecta. Crear la ruta sin registrarla es exactamente cómo
 * se llegó a esa lista.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  ClimaNarrativeRefreshService,
  type RefreshResult,
} from '@/lib/services/clima/ClimaNarrativeRefreshService';
import type { ClimaDecisionItem } from '@/types/clima-planes';

/** Tope de tiempo por tick. Vercel corta la función; mejor cortar antes y ordenado. */
const DEADLINE_MS = 45_000;
/** Tope de planes por tick. Con el corte por hash, la mayoría no llama al modelo. */
const MAX_PLANS_PER_TICK = 20;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
      }
    } else {
      console.warn('[CRON clima-narrative-refresh] CRON_SECRET no configurado');
    }

    const started = Date.now();

    // Planes de clima APROBADOS. Un borrador no tiene focos comprometidos, así que
    // no hay nada que analizar todavía.
    const planes = await prisma.actionPlan.findMany({
      where: { moduleType: 'clima', estado: 'aprobado' },
      select: { id: true, accountId: true, campaignId: true, decisiones: true },
      orderBy: { updatedAt: 'desc' },
      take: MAX_PLANS_PER_TICK,
    });

    const results: RefreshResult[] = [];

    for (const p of planes) {
      if (Date.now() - started > DEADLINE_MS) break;
      // Sin campaña no hay contexto ni forma de leerlo después desde la pantalla.
      if (!p.campaignId) continue;

      try {
        const r = await ClimaNarrativeRefreshService.refreshPlan({
          accountId: p.accountId,
          campaignId: p.campaignId,
          actionPlanId: p.id,
          decisiones: (p.decisiones as ClimaDecisionItem[] | null) ?? [],
        });
        results.push(r);
      } catch (e) {
        // Un plan que falla no puede frenar a los demás: cada uno es independiente.
        results.push({
          actionPlanId: p.id,
          outcome: 'failed',
          entryCount: 0,
          detail: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        planesRevisados: results.length,
        generadas: results.filter((r) => r.outcome === 'generated').length,
        sinCambios: results.filter((r) => r.outcome === 'skipped').length,
        sinPatron: results.filter((r) => r.outcome === 'no-pattern').length,
        fallidas: results.filter((r) => r.outcome === 'failed').length,
        durationMs: Date.now() - started,
        results,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
