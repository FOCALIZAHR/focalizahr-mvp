// src/app/api/compliance/analizar-patrones/route.ts
// Ambiente Sano - Disparador de análisis LLM async.
//
// POST: crea ComplianceAnalysis PENDING por depto (n>=5) + 1 ORG. Drena
// jobs sincrónicamente hasta ~45s (dejando margen al timeout Vercel Pro de 60s).
// Idempotente: si ya hay rows, solo drena pendientes.
//
// GET: reporta el estado de la cola para la campaña (progress + payloads).
// Respeta filtrado jerárquico AREA_MANAGER.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
} from '@/lib/services/AuthorizationService';
import {
  initializeComplianceJobs,
  processBatch,
} from '@/lib/services/compliance/ComplianceAnalysisOrchestrator';

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

    const init = await initializeComplianceJobs(campaignId, targetAccountId);
    const deadline = Date.now() + SYNC_DEADLINE_MS;
    const batch = await processBatch(campaignId, deadline);

    const totals = await prisma.complianceAnalysis.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: true,
    });
    const counts = Object.fromEntries(totals.map((t) => [t.status, t._count]));

    return NextResponse.json({
      success: true,
      init,
      processedThisCall: batch.processed,
      totals: {
        pending: counts.PENDING ?? 0,
        running: counts.RUNNING ?? 0,
        completed: counts.COMPLETED ?? 0,
        failed: counts.FAILED ?? 0,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[compliance/analizar-patrones] POST:', msg);
    if (msg === 'Campaña no encontrada') {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
    if (msg.startsWith('ComplianceAnalysisOrchestrator solo aplica')) {
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    if (!hasPermission(userContext.role, 'compliance:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaignId requerido' },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, accountId: userContext.accountId },
      select: { id: true },
    });
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    let visibleDeptIds: Set<string> | null = null;
    if (userContext.role === 'AREA_MANAGER') {
      if (!userContext.departmentId) {
        return NextResponse.json(
          { success: false, error: 'AREA_MANAGER sin departamento asignado' },
          { status: 403 }
        );
      }
      const children = await getChildDepartmentIds(userContext.departmentId);
      visibleDeptIds = new Set([userContext.departmentId, ...children]);
    }

    const analyses = await prisma.complianceAnalysis.findMany({
      where: { campaignId },
      orderBy: [{ scope: 'asc' }, { createdAt: 'asc' }],
      include: { department: { select: { id: true, displayName: true } } },
    });

    const visible = analyses.filter((a) => {
      if (a.scope === 'ORG') return userContext.role !== 'AREA_MANAGER';
      if (!a.departmentId) return false;
      return visibleDeptIds ? visibleDeptIds.has(a.departmentId) : true;
    });

    const totals = visible.reduce(
      (acc, a) => {
        acc[a.status.toLowerCase() as keyof typeof acc] += 1;
        return acc;
      },
      { pending: 0, running: 0, completed: 0, failed: 0 }
    );

    return NextResponse.json({
      success: true,
      campaignId,
      totals,
      analyses: visible.map((a) => ({
        id: a.id,
        scope: a.scope,
        departmentId: a.departmentId,
        departmentName: a.department?.displayName ?? null,
        status: a.status,
        respondentCount: a.respondentCount,
        safetyScore: a.safetyScore,
        senalDominante: a.senalDominante,
        confianzaAnalisis: a.confianzaAnalisis,
        alertaSesgoGenero: a.alertaSesgoGenero,
        teatroCumplimiento: a.teatroCumplimiento,
        errorMessage: a.errorMessage,
        retryCount: a.retryCount,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        resultPayload: a.status === 'COMPLETED' ? a.resultPayload : null,
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[compliance/analizar-patrones] GET:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
