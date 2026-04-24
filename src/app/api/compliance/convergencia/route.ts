// src/app/api/compliance/convergencia/route.ts
// Ambiente Sano - ConvergenciaEngine + generación de alertas.
//
// POST: ejecuta el engine y crea alertas (idempotente). RBAC compliance:manage.
// GET:  reporta el análisis actual (señales + alertas). RBAC compliance:view,
//       con filtrado jerárquico para AREA_MANAGER.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
} from '@/lib/services/AuthorizationService';
import { runConvergencia } from '@/lib/services/compliance/ConvergenciaEngine';
import { createAlertsFromConvergencia } from '@/lib/services/compliance/ComplianceAlertService';

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

    const engineResult = await runConvergencia(campaignId, targetAccountId);
    const alerts = await createAlertsFromConvergencia(targetAccountId, engineResult);

    return NextResponse.json({
      success: true,
      activeSources: engineResult.activeSourcesGlobal,
      departments: engineResult.departments.length,
      criticalManagersGroups: engineResult.criticalByManager.length,
      alerts,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[compliance/convergencia] POST:', msg);
    if (msg === 'Campaña no encontrada') {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
    if (msg.startsWith('ConvergenciaEngine solo aplica')) {
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

    const engineResult = await runConvergencia(campaignId, userContext.accountId);

    const alerts = await prisma.complianceAlert.findMany({
      where: { campaignId },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      include: { department: { select: { id: true, displayName: true } } },
    });

    const visibleDepts = visibleDeptIds
      ? engineResult.departments.filter((d) => visibleDeptIds!.has(d.departmentId))
      : engineResult.departments;

    const visibleAlerts = alerts.filter((a) => {
      if (!a.departmentId) return userContext.role !== 'AREA_MANAGER';
      return visibleDeptIds ? visibleDeptIds.has(a.departmentId) : true;
    });

    return NextResponse.json({
      success: true,
      campaignId,
      activeSources: engineResult.activeSourcesGlobal,
      departments: visibleDepts,
      criticalByManager:
        userContext.role === 'AREA_MANAGER' ? [] : engineResult.criticalByManager,
      alerts: visibleAlerts.map((a) => ({
        id: a.id,
        alertType: a.alertType,
        severity: a.severity,
        status: a.status,
        title: a.title,
        description: a.description,
        departmentId: a.departmentId,
        departmentName: a.department?.displayName ?? null,
        slaHours: a.slaHours,
        dueDate: a.dueDate,
        slaStatus: a.slaStatus,
        triggerSources: a.triggerSources,
        signalsCount: a.signalsCount,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[compliance/convergencia] GET:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
