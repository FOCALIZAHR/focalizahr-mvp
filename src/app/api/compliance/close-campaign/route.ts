// src/app/api/compliance/close-campaign/route.ts
// Ambiente Sano - Cierre de campaña + orquestación del flujo D6 completo.
//
// Qué hace:
//   1. Valida campaña (slug, ownership, no cerrada ya).
//   2. Cambia status=completed + completedAt=now.
//   3. initializeComplianceJobs: crea ComplianceAnalysis PENDING por depto n>=5 + 1 ORG.
//   4. processBatch sincrónico hasta ~45s (dejando margen Vercel Pro 60s).
//   5. El Orchestrator ya integra auto-trigger de Convergencia + Alerts al completar meta ORG.
//   6. Lo que no alcance a procesarse queda PENDING y lo drena el CRON.
//
// RBAC: compliance:manage.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService';
import {
  initializeComplianceJobs,
  processBatch,
} from '@/lib/services/compliance/ComplianceAnalysisOrchestrator';

const AMBIENTE_SANO_SLUG = 'pulso-ambientes-sanos';
const SYNC_DEADLINE_MS = 45_000;

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId && !userContext.role) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    if (!hasPermission(userContext.role, 'compliance:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { campaignId, accountId: bodyAccountId } = body;

    if (!campaignId || typeof campaignId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'campaignId requerido' },
        { status: 400 }
      );
    }

    let targetAccountId: string;
    if (userContext.role === 'FOCALIZAHR_ADMIN') {
      if (!bodyAccountId) {
        return NextResponse.json(
          { success: false, error: 'accountId requerido para FOCALIZAHR_ADMIN' },
          { status: 400 }
        );
      }
      targetAccountId = bodyAccountId;
    } else {
      if (!userContext.accountId) {
        return NextResponse.json(
          { success: false, error: 'accountId no disponible' },
          { status: 401 }
        );
      }
      targetAccountId = userContext.accountId;
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, accountId: targetAccountId },
      include: { campaignType: { select: { slug: true } } },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    if (campaign.campaignType.slug !== AMBIENTE_SANO_SLUG) {
      return NextResponse.json(
        {
          success: false,
          error: `close-campaign solo aplica a campañas "${AMBIENTE_SANO_SLUG}"`,
        },
        { status: 400 }
      );
    }

    // Cambio de estado: idempotente. Si ya estaba completed, no sobreescribe completedAt.
    if (campaign.status !== 'completed') {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'completed', completedAt: new Date() },
      });
    }

    // Inicializa jobs (idempotente: si ya existen, retorna alreadyInitialized=true)
    const init = await initializeComplianceJobs(campaignId, targetAccountId);

    // Drenar sincrónicamente hasta cerca del timeout Vercel
    const deadline = Date.now() + SYNC_DEADLINE_MS;
    const batch = await processBatch(campaignId, deadline);

    const totals = await prisma.complianceAnalysis.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: true,
    });
    const counts = Object.fromEntries(totals.map((t) => [t.status, t._count]));

    const alertsCount = await prisma.complianceAlert.count({
      where: { campaignId },
    });

    return NextResponse.json({
      success: true,
      campaignId,
      campaignStatus: 'completed',
      init,
      processedThisCall: batch.processed,
      analysisTotals: {
        pending: counts.PENDING ?? 0,
        running: counts.RUNNING ?? 0,
        completed: counts.COMPLETED ?? 0,
        failed: counts.FAILED ?? 0,
      },
      alertsCount,
      nextSteps:
        (counts.PENDING ?? 0) > 0 || (counts.RUNNING ?? 0) > 0
          ? 'Quedan jobs pendientes. El CRON /api/cron/compliance-process-pending los drenará o se puede re-disparar POST manualmente.'
          : 'Análisis completo. Consultar GET /api/compliance/report para el reporte ejecutivo.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[compliance/close-campaign] POST:', msg);
    if (msg === 'Campaña no encontrada') {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
