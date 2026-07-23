// src/app/api/clima/action-plan/generate/route.ts
// EX Clima — Gate 5D-i: generación (PREVIEW) de las decisiones del plan de acción.
//
// Corre el Paso 0 (ensamblado) + el builder puro sobre los insights persistidos de
// una campaña, y devuelve las ClimaDecisionItem[] listas para renderizar en Tab 1.
// READ-ONLY: no crea ningún ActionPlan (flujo preview-first — el borrador se crea
// recién con la primera decisión del CEO/RRHH, vía POST /api/action-plans).
//
// Lee reactiveAnalysis DIRECTO del insight (no vía /api/clima/results, que no lo
// expone) — así el payload del Lobby no carga dato reactivo que solo el plan usa.
//
// RBAC: clima:view (cómputo read-only; la escritura sigue gateada clima:manage en
// el POST). Filtrado jerárquico AREA_MANAGER (mismo patrón que results/route.ts).

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

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    if (!hasPermission(userContext.role, 'clima:view')) {
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

    // Filtrado jerárquico (patrón results/route.ts): AREA_MANAGER ve solo su
    // subárbol; RRHH global (GLOBAL_ACCESS_ROLES) ve toda la cuenta.
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

    // Una sola query batched: todos los insights de la campaña (incluye las
    // columnas Json driverAnalysis/reactiveAnalysis/correlationFlags).
    const insightRows = await prisma.departmentClimaInsight.findMany({
      where: { accountId: userContext.accountId, campaignId },
      include: { department: { select: { id: true, displayName: true } } },
    });

    const visibleInsights = insightRows.filter((r) =>
      visibleDeptIds ? visibleDeptIds.has(r.departmentId) : true
    );

    // Ensamblado (Paso 0) + builder puro.
    const rows: AssemblerRow[] = visibleInsights.map((r) => ({
      departmentId: r.departmentId,
      departmentName: r.department?.displayName ?? 'Departamento',
      driverAnalysis: (r.driverAnalysis as unknown as DriverImpact[] | null) ?? null,
      reactiveAnalysis:
        (r.reactiveAnalysis as unknown as ReactiveImpact[] | null) ?? null,
      correlationFlags:
        (r.correlationFlags as unknown as ClimaCorrelationFlags | null) ?? null,
    }));

    const decisiones = buildClimaPlanDecisions(assembleClimaDecisionInputs(rows));

    // Deptos visibles sin reactiveAnalysis poblado → Block 5 "sin datos" (Tab 1).
    const departamentosSinDatos = rows
      .filter((r) => !r.reactiveAnalysis || r.reactiveAnalysis.length === 0)
      .map((r) => ({ departmentId: r.departmentId, departmentName: r.departmentName }));

    // Fortaleza de scope (reconocimiento en el empty-state "Sin focos", Tab 1).
    // topStrength es por-depto (DepartmentClimaInsight); acá se elige UNA: la de mayor
    // `priority` entre los deptos visibles. La priority sale del driverAnalysis del
    // propio topStrength de cada depto (misma métrica de pickTopDrivers, sin criterio
    // nuevo). Empate de priority → desempate determinista: dimension asc, luego
    // departmentName asc. `null` si ningún depto visible tiene una fortaleza de alto
    // impacto (caso real frecuente: sano sin standout). departmentName solo si el
    // scope visible tiene >1 depto (en un único equipo el nombre es redundante).
    const strengthCandidates = visibleInsights
      .map((r) => {
        const dimension = r.topStrength;
        if (!dimension) return null;
        const da = (r.driverAnalysis as unknown as DriverImpact[] | null) ?? [];
        const priority = da.find((d) => d.driver === dimension)?.priority ?? null;
        if (priority === null) return null;
        return {
          dimension,
          departmentName: r.department?.displayName ?? 'Departamento',
          priority,
        };
      })
      .filter(
        (x): x is { dimension: string; departmentName: string; priority: number } =>
          x !== null
      )
      .sort(
        (a, b) =>
          b.priority - a.priority ||
          a.dimension.localeCompare(b.dimension) ||
          a.departmentName.localeCompare(b.departmentName)
      );

    // Transversal vs destaque: si TODOS los deptos visibles comparten esa dimensión
    // como su topStrength, no es un destaque de un equipo → transversal (sin nombre).
    // Si es un subconjunto propio, es un destaque real → se nombra el depto (solo con
    // scope>1; en un único equipo el nombre es redundante).
    const best = strengthCandidates[0] ?? null;
    let topStrength:
      | { dimension: string; departmentName: string | null; transversal: boolean }
      | null = null;
    if (best) {
      const visibleCount = visibleInsights.length;
      const sharing = visibleInsights.filter((r) => r.topStrength === best.dimension).length;
      const transversal = visibleCount > 1 && sharing === visibleCount;
      const showName = visibleCount > 1 && !transversal;
      topStrength = {
        dimension: best.dimension,
        departmentName: showName ? best.departmentName : null,
        transversal,
      };
    }

    return NextResponse.json({
      success: true,
      data: { decisiones, departamentosSinDatos, topStrength },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error generando el plan de acción' },
      { status: 500 }
    );
  }
}
