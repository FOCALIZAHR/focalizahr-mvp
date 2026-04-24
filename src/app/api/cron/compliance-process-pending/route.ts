/**
 * API POST /api/cron/compliance-process-pending
 *
 * Drena la cola de ComplianceAnalysis en estado PENDING (Ambiente Sano).
 *
 * Comportamiento por invocación:
 *   1. Selecciona las N campañas con PENDING más antiguo (default N=3).
 *   2. Para cada una, drena sincrónicamente hasta ~45s:
 *      - Procesa DEPARTMENT jobs PENDING uno a uno (llamada al LLM).
 *      - Cuando no quedan DEPARTMENT jobs pendientes/en curso, ejecuta el meta ORG.
 *   3. Devuelve resumen por campaña + totales globales.
 *
 * Autenticación:
 *   Header: Authorization: Bearer {CRON_SECRET}
 *
 * Frecuencia recomendada:
 *   Cada 2-5 minutos mientras haya campañas con análisis en curso. Es idempotente
 *   y seguro de re-invocar; solo procesa lo que está PENDING.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processBatch } from '@/lib/services/compliance/ComplianceAnalysisOrchestrator';

const PER_CAMPAIGN_DEADLINE_MS = 45_000;
const MAX_CAMPAIGNS_PER_TICK = 3;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { success: false, error: 'No autorizado' },
          { status: 401 }
        );
      }
    } else {
      console.warn('[CRON compliance-process-pending] CRON_SECRET no configurado');
    }

    const pendingCampaigns = await prisma.complianceAnalysis.groupBy({
      by: ['campaignId'],
      where: { status: 'PENDING' },
      _min: { createdAt: true },
      orderBy: { _min: { createdAt: 'asc' } },
      take: MAX_CAMPAIGNS_PER_TICK,
    });

    if (pendingCampaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Sin campañas pendientes',
        campaignsProcessed: 0,
        totalJobsProcessed: 0,
      });
    }

    const results = [];
    let totalJobsProcessed = 0;

    for (const { campaignId } of pendingCampaigns) {
      const deadline = Date.now() + PER_CAMPAIGN_DEADLINE_MS;
      const { processed } = await processBatch(campaignId, deadline);
      totalJobsProcessed += processed;

      const totals = await prisma.complianceAnalysis.groupBy({
        by: ['status'],
        where: { campaignId },
        _count: true,
      });
      const counts = Object.fromEntries(totals.map((t) => [t.status, t._count]));

      results.push({
        campaignId,
        processed,
        totals: {
          pending: counts.PENDING ?? 0,
          running: counts.RUNNING ?? 0,
          completed: counts.COMPLETED ?? 0,
          failed: counts.FAILED ?? 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      campaignsProcessed: pendingCampaigns.length,
      totalJobsProcessed,
      results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[CRON compliance-process-pending]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
