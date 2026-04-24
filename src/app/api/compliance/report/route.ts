// src/app/api/compliance/report/route.ts
// Ambiente Sano - Reporte consolidado para PDF ejecutivo o semestral.
//
// GET: devuelve JSON estructurado listo para que un generador de PDF (Fase 6)
//      lo renderice. No genera PDF en esta fase.
//
// Consolida: SafetyScores + ComplianceAnalysis (DEPARTMENT+ORG) + ConvergenciaEngine
//            + ComplianceAlert + ComplianceNarrativeEngine (determinista).
//
// Query params:
//   campaignId (requerido)
//   type = 'executive' | 'semestral' (default 'executive')
//
// RBAC compliance:view + filtrado jerárquico para AREA_MANAGER.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
} from '@/lib/services/AuthorizationService';
import { calculateSafetyScores } from '@/lib/services/SafetyScoreService';
import { runConvergencia } from '@/lib/services/compliance/ConvergenciaEngine';
import { buildReportNarratives } from '@/lib/services/compliance/ComplianceNarrativeEngine';
import type {
  MetaAnalysisOutput,
  PatronAnalysisOutput,
} from '@/lib/services/compliance/complianceTypes';
import type { ComplianceAlertType } from '@/config/complianceAlertConfig';

type ReportType = 'executive' | 'semestral';

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
    const rawType = (searchParams.get('type') ?? 'executive') as ReportType;
    const type: ReportType = rawType === 'semestral' ? 'semestral' : 'executive';

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaignId requerido' },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, accountId: userContext.accountId },
      include: {
        account: { select: { companyName: true } },
        campaignType: { select: { slug: true } },
      },
    });
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    // Scope jerárquico
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

    // 1. Safety scores (todos; filtro jerárquico se aplica después)
    const safety = await calculateSafetyScores(campaignId, userContext.accountId);

    // 2. ComplianceAnalysis — DEPARTMENT COMPLETED (payloads LLM + teatro flag)
    const deptAnalyses = await prisma.complianceAnalysis.findMany({
      where: { campaignId, scope: 'DEPARTMENT', status: 'COMPLETED' },
      include: { department: { select: { id: true, displayName: true } } },
    });

    // 3. ComplianceAnalysis ORG — meta-análisis (si existe)
    const orgAnalysis = await prisma.complianceAnalysis.findFirst({
      where: { campaignId, scope: 'ORG', status: 'COMPLETED' },
    });
    const meta = (orgAnalysis?.resultPayload as MetaAnalysisOutput | null) ?? null;

    // 4. Convergencia (se calcula on-demand; es idempotente y reutiliza persistido)
    const convergencia = await runConvergencia(campaignId, userContext.accountId);

    // 5. Alertas
    const alerts = await prisma.complianceAlert.findMany({
      where: { campaignId },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      include: { department: { select: { id: true, displayName: true } } },
    });

    // 6. Filtrado jerárquico sobre lo consolidado
    const filteredScores = visibleDeptIds
      ? safety.departments.filter((d) => visibleDeptIds!.has(d.departmentId))
      : safety.departments;

    const filteredDeptAnalyses = visibleDeptIds
      ? deptAnalyses.filter(
          (a) => a.departmentId && visibleDeptIds!.has(a.departmentId)
        )
      : deptAnalyses;

    const filteredConvergencia = visibleDeptIds
      ? convergencia.departments.filter((d) => visibleDeptIds!.has(d.departmentId))
      : convergencia.departments;

    const filteredAlerts = alerts.filter((a) => {
      if (!a.departmentId) return userContext.role !== 'AREA_MANAGER';
      return visibleDeptIds ? visibleDeptIds.has(a.departmentId) : true;
    });

    // 7. Narrativas deterministas
    const narrativeInput = {
      orgSafetyScore: safety.orgScore,
      scores: filteredScores,
      departmentAnalyses: filteredDeptAnalyses.map((a) => ({
        departmentName: a.department?.displayName ?? 'Sin nombre',
        payload: (a.resultPayload as PatronAnalysisOutput | null) ?? null,
        teatroCumplimiento: !!a.teatroCumplimiento,
      })),
      meta,
      convergencias: filteredConvergencia,
      alertas: filteredAlerts.map((a) => ({
        alertType: a.alertType as ComplianceAlertType,
        title: a.title,
        departmentName: a.department?.displayName ?? null,
        severity: a.severity,
        signalsCount: a.signalsCount,
        teatroCumplimiento: filteredDeptAnalyses.find(
          (d) => d.departmentId === a.departmentId
        )?.teatroCumplimiento ?? false,
      })),
    };

    const narratives = buildReportNarratives(narrativeInput);

    // 8. Shape del payload por tipo
    if (type === 'semestral') {
      return NextResponse.json({
        success: true,
        type: 'semestral',
        generatedAt: new Date().toISOString(),
        company: {
          name: campaign.account.companyName,
        },
        period: {
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          completedAt: campaign.completedAt,
        },
        aggregates: {
          totalInvited: campaign.totalInvited,
          totalResponded: campaign.totalResponded,
          participationRate:
            campaign.totalInvited > 0
              ? (campaign.totalResponded / campaign.totalInvited) * 100
              : 0,
          orgSafetyScore: safety.orgScore,
          departmentsAnalyzed: filteredScores.length,
          departmentsSkipped: safety.skipped.length,
          alertsGenerated: filteredAlerts.length,
        },
        legalNotice:
          'Análisis de gestión preventiva — No constituye investigación formal.',
      });
    }

    // Executive
    return NextResponse.json({
      success: true,
      type: 'executive',
      generatedAt: new Date().toISOString(),
      campaign: {
        id: campaign.id,
        name: campaign.name,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        completedAt: campaign.completedAt,
      },
      company: {
        name: campaign.account.companyName,
      },
      narratives,
      data: {
        orgSafetyScore: safety.orgScore,
        departments: filteredScores,
        skippedByPrivacy: safety.skipped,
        metaAnalysis: meta,
        convergencia: {
          activeSources: convergencia.activeSourcesGlobal,
          departments: filteredConvergencia,
          criticalByManager:
            userContext.role === 'AREA_MANAGER' ? [] : convergencia.criticalByManager,
        },
        alerts: filteredAlerts.map((a) => ({
          id: a.id,
          alertType: a.alertType,
          severity: a.severity,
          status: a.status,
          title: a.title,
          description: a.description,
          departmentId: a.departmentId,
          departmentName: a.department?.displayName ?? null,
          dueDate: a.dueDate,
          slaStatus: a.slaStatus,
          createdAt: a.createdAt,
        })),
      },
      legalNotice:
        'Análisis de gestión preventiva — No constituye investigación formal.',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[compliance/report] GET:', msg);
    if (msg === 'Campaña no encontrada') {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
    if (msg.startsWith('ConvergenciaEngine solo aplica')) {
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
