// src/app/api/clima/action-plan/by-person/route.ts
// EX Clima — Gate 5D Tab 2 (POR PERSONA): decisiones del plan agrupadas por responsable.
//
// READ-ONLY (preview, como generate/route.ts): corre el ensamblado + builder para
// isSystemic y el ruteo por-centro (climaTab2Routing, Decisión 1.a = por-centro) sobre
// los insights persistidos, resuelve el responsable de cada depto (walk-up) y agrupa.
//
// GATING DEL CTA (Decisión Victor 2026-07-24): un CTA de Meta/PDI necesita un Employee
// REAL detrás del responsable. resolveDepartmentResponsable devuelve source='responsable'
// (Employee activo, FK ya chequeada) o source='account_admin' (fallback sin Employee).
// Solo el primero habilita CTA — el fallback es red de seguridad técnica, no liderazgo.
// Solución de corto plazo hasta la Etapa 1 de ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.
//
// RBAC: clima:view (cómputo read-only; la escritura de la Meta va gateada aparte en
// POST /api/goals). Filtrado jerárquico AREA_MANAGER (mismo patrón que generate/results).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
} from '@/lib/services/AuthorizationService';
import type {
  DriverImpact,
  ReactiveImpact,
  ClimaCorrelationFlags,
} from '@/lib/services/clima/PulseEngine';
import {
  assembleClimaDecisionInputs,
  type AssemblerRow,
} from '@/lib/services/clima/assembleClimaDecisionInputs';
import { buildClimaPlanDecisions } from '@/lib/services/clima/ClimaActionPlanBuilder';
import {
  routeDepartmentTab2,
  type Tab2ReactiveRow,
  type Tab2Route,
} from '@/lib/services/clima/climaTab2Routing';
import { resolveDepartmentResponsable } from '@/lib/services/DepartmentResponsableService';

// Motivo de CTA deshabilitado (no magic string). Hoy solo uno; se amplía si aparecen más.
const CTA_GATED_NO_EMPLOYEE = 'SIN_EMPLOYEE_RESPONSABLE' as const;

interface DeptFinding {
  departmentId: string;
  departmentName: string;
  route: Tab2Route; // ESTADO_A_CHOICE | ESTADO_B_PDI (NONE se excluye antes de agrupar)
  belowTierCount: number;
  belowTierReactives: string[];
}

interface ResponsableGroup {
  source: 'responsable' | 'account_admin';
  employeeId: string | null;
  name: string;
  ctaEnabled: boolean;
  ctaGatedReason: string | null;
  departamentos: DeptFinding[];
}

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(userContext.role, 'clima:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaignId requerido' },
        { status: 400 }
      );
    }

    // Guard multi-tenant: la campaña debe pertenecer a la cuenta.
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

    // Filtrado jerárquico (patrón generate/results): AREA_MANAGER ve solo su subárbol.
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

    const insightRows = await prisma.departmentClimaInsight.findMany({
      where: { accountId: userContext.accountId, campaignId },
      include: { department: { select: { id: true, displayName: true } } },
    });
    const visibleInsights = insightRows.filter((r) =>
      visibleDeptIds ? visibleDeptIds.has(r.departmentId) : true
    );

    // isSystemic por depto ← builder (misma cadena que Tab 1 / generate).
    const rows: AssemblerRow[] = visibleInsights.map((r) => ({
      departmentId: r.departmentId,
      departmentName: r.department?.displayName ?? 'Departamento',
      driverAnalysis: (r.driverAnalysis as unknown as DriverImpact[] | null) ?? null,
      reactiveAnalysis: (r.reactiveAnalysis as unknown as ReactiveImpact[] | null) ?? null,
      correlationFlags: (r.correlationFlags as unknown as ClimaCorrelationFlags | null) ?? null,
    }));
    const decisiones = buildClimaPlanDecisions(assembleClimaDecisionInputs(rows));
    const systemicByDept = new Set(
      decisiones.filter((d) => d.isSystemic).map((d) => d.departmentId)
    );

    // Ruteo por-centro + resolución de responsable, agrupando por persona.
    const groups = new Map<string, ResponsableGroup>();

    for (const r of visibleInsights) {
      const reactives: Tab2ReactiveRow[] = (
        (r.reactiveAnalysis as unknown as ReactiveImpact[] | null) ?? []
      ).map((x) => ({ reactive: x.reactive, mean: x.mean }));

      const routing = routeDepartmentTab2(reactives, systemicByDept.has(r.departmentId));
      if (routing.route === 'NONE') continue; // sin hallazgo → no entra a Tab 2

      const responsable = await resolveDepartmentResponsable({
        departmentId: r.departmentId,
        accountId: userContext.accountId,
      });

      // Clave de grupo: employeeId real, o un sentinel único para el fallback admin.
      const groupKey =
        responsable.source === 'responsable'
          ? `emp:${responsable.employeeId}`
          : 'account_admin';

      let group = groups.get(groupKey);
      if (!group) {
        const ctaEnabled = responsable.source === 'responsable';
        group = {
          source: responsable.source,
          employeeId: responsable.source === 'responsable' ? responsable.employeeId : null,
          name: responsable.name,
          ctaEnabled,
          ctaGatedReason: ctaEnabled ? null : CTA_GATED_NO_EMPLOYEE,
          departamentos: [],
        };
        groups.set(groupKey, group);
      }

      group.departamentos.push({
        departmentId: r.departmentId,
        departmentName: r.department?.displayName ?? 'Departamento',
        route: routing.route,
        belowTierCount: routing.belowTierCount,
        belowTierReactives: routing.belowTierReactives,
      });
    }

    const responsables = [...groups.values()];

    return NextResponse.json({
      success: true,
      data: {
        responsables,
        // Resumen para la cabecera de la pestaña (stats en backend, no en frontend).
        stats: {
          responsablesConHallazgos: responsables.length,
          conCtaHabilitado: responsables.filter((g) => g.ctaEnabled).length,
          gateadosSinEmployee: responsables.filter((g) => !g.ctaEnabled).length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error generando el plan por persona' },
      { status: 500 }
    );
  }
}
