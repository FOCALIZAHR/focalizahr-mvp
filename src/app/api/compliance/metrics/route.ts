// src/app/api/compliance/metrics/route.ts
// Ambiente Sano - Safety Scores por departamento con filtrado jerárquico para AREA_MANAGER.

import { NextRequest, NextResponse } from 'next/server';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
} from '@/lib/services/AuthorizationService';
import { calculateSafetyScores } from '@/lib/services/SafetyScoreService';

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
        { success: false, error: 'Sin permisos para ver Ambiente Sano' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const departmentIdFilter = searchParams.get('departmentId');

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaignId requerido' },
        { status: 400 }
      );
    }

    const result = await calculateSafetyScores(campaignId, userContext.accountId);

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

    if (departmentIdFilter) {
      visibleDeptIds = new Set(
        visibleDeptIds
          ? Array.from(visibleDeptIds).filter((id) => id === departmentIdFilter)
          : [departmentIdFilter]
      );
    }

    const scoped = visibleDeptIds
      ? {
          orgScore: result.orgScore,
          departments: result.departments.filter((d) =>
            visibleDeptIds!.has(d.departmentId)
          ),
          skipped: result.skipped.filter((s) =>
            visibleDeptIds!.has(s.departmentId)
          ),
        }
      : result;

    return NextResponse.json({ success: true, ...scoped });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[compliance/metrics] Error:', msg);

    if (msg === 'Campaña no encontrada') {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
    if (msg.startsWith('SafetyScoreService solo aplica')) {
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
