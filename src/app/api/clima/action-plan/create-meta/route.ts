// src/app/api/clima/action-plan/create-meta/route.ts
// EX Clima — Gate 5D Fase 3: crea las metas INDIVIDUALES nacidas de una decisión de clima
// (Tab 2 "por persona"). Recibe N metas (1-3, una por reactivo bajo tier) y las reparte
// weight = 100/N sobre el responsable del centro de costo.
//
// POR QUÉ ENDPOINT APARTE (no POST /api/goals): el router de /api/goals ramifica por
// level+parentId y no sabe expresar CLIMA_TRIGGERED. Este endpoint traduce la decisión de
// clima (campaignId + departmentId + reactivos) al 4º creador GoalsService.createClimaTriggeredGoal.
//
// TRAZABILIDAD (§3.5): sourceActionPlanId (el ActionPlan aprobado) + por meta sourceTriggerRef
// (= el reactivo). Dos columnas separadas, sin componer strings. El @@unique de 4 columnas da
// idempotencia por (persona, plan, reactivo): doble clic sobre el mismo reactivo → P2002 → 400.
//
// RBAC: clima:manage (es una ESCRITURA sobre metas de personas). El responsable del depto se
// resuelve server-side (resolveDepartmentResponsable, walk-up); si cae al fallback admin (sin
// Employee real) se gatea con 409 — la UI ya deshabilita el CTA, esto es la defensa de servidor.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
} from '@/lib/services/AuthorizationService';
import { resolveDepartmentResponsable } from '@/lib/services/DepartmentResponsableService';
import { GoalCycleService } from '@/lib/services/GoalCycleService';
import { GoalsService } from '@/lib/services/GoalsService';
import { goalsErrorResponse } from '@/lib/api/goalsErrorResponse';

interface MetaInput {
  reactive: string; // = sourceTriggerRef
  title: string;
  description: string; // = Question.text (§3.2); kpiSource OWN lo exige
  startValue: number; // mean actual del reactivo
  targetValue: number; // mean + delta elegido en el slider
  unit?: string;
}

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId || !userContext.userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(userContext.role, 'clima:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    // ── Parseo + validación de forma ──
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Body inválido' }, { status: 400 });
    }

    const campaignId: string | undefined = body?.campaignId;
    const departmentId: string | undefined = body?.departmentId;
    const sourceActionPlanId: string | undefined = body?.sourceActionPlanId;
    const metas: MetaInput[] = Array.isArray(body?.metas) ? body.metas : [];

    if (!campaignId || !departmentId || !sourceActionPlanId) {
      return NextResponse.json(
        { success: false, error: 'campaignId, departmentId y sourceActionPlanId requeridos' },
        { status: 400 }
      );
    }
    if (metas.length === 0) {
      return NextResponse.json({ success: false, error: 'Se requiere al menos una meta' }, { status: 400 });
    }
    for (const m of metas) {
      if (
        !m?.reactive ||
        !m?.title ||
        !m?.description ||
        typeof m.startValue !== 'number' ||
        typeof m.targetValue !== 'number'
      ) {
        return NextResponse.json(
          { success: false, error: 'Cada meta requiere reactive, title, description y valores numéricos' },
          { status: 400 }
        );
      }
    }

    // ── Guard multi-tenant: la campaña es de la cuenta ──
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, accountId: userContext.accountId },
      select: { id: true },
    });
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 });
    }

    // ── Filtrado jerárquico AREA_MANAGER (mismo patrón que reactives/by-person) ──
    if (userContext.role === 'AREA_MANAGER') {
      if (!userContext.departmentId) {
        return NextResponse.json(
          { success: false, error: 'AREA_MANAGER sin departamento asignado' },
          { status: 403 }
        );
      }
      const children = await getChildDepartmentIds(userContext.departmentId);
      const visible = new Set([userContext.departmentId, ...children]);
      if (!visible.has(departmentId)) {
        return NextResponse.json({ success: false, error: 'Sin acceso a ese departamento' }, { status: 403 });
      }
    }

    // ── Ciclo activo: fuente de fechas Y guard (sin ciclo no hay meta) ──
    const activeCycle = await GoalCycleService.getActiveCycle(userContext.accountId);
    if (!activeCycle) {
      return NextResponse.json(
        { success: false, error: 'No hay un ciclo de metas activo' },
        { status: 409 }
      );
    }

    // ── Responsable del depto → employeeId. Gate del fallback admin (sin Employee real) ──
    const responsable = await resolveDepartmentResponsable({
      departmentId,
      accountId: userContext.accountId,
    });
    if (responsable.source === 'account_admin') {
      return NextResponse.json(
        {
          success: false,
          error:
            'El departamento no tiene un responsable asignado en la nómina. Asigna un responsable antes de fijar metas.',
        },
        { status: 409 }
      );
    }
    const employeeId = responsable.employeeId;

    // ── Peso: reparto entero por el método del resto mayor (como facturación) → piso(100/N)
    // a cada meta + el resto (1 punto) a las primeras `remainder` metas. Suma EXACTA 100 por
    // construcción: enteros < 2^53 se representan exacto en Float, así validateTotalWeight
    // (comparación `>` estricta) nunca rebota la última meta por error de redondeo. General:
    // sin casos hardcodeados por N (cero-hardcode; robusto si N crece). ──
    const n = metas.length;
    const base = Math.floor(100 / n);
    const remainder = 100 - base * n;
    const weights = metas.map((_, i) => base + (i < remainder ? 1 : 0));
    const totalWeight = weights.reduce((s, w) => s + w, 0); // = 100

    // Chequeo previo de presupuesto (checkGoalWeight, read-only) para evitar creación PARCIAL:
    // si las N no entran juntas, no se crea ninguna. El bloqueo duro real lo hace
    // validateTotalWeight dentro del creador; esto solo adelanta el caso común.
    const budget = await GoalsService.checkGoalWeight(userContext.accountId, employeeId, {
      activeCycle,
    });
    if (budget.available < totalWeight - 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: `Peso insuficiente: se necesitan ${Math.round(totalWeight)} puntos y hay ${Math.round(
            budget.available
          )} disponibles para esta persona.`,
        },
        { status: 400 }
      );
    }

    // ── Creación secuencial (weight acumulativo). Fechas del ciclo activo: la meta corre desde
    // hoy hasta el cierre del ciclo. Atomicidad de falla parcial: deferida (RESOLUCION §3). ──
    const startDate = new Date();
    const created: Array<{ id: string; title: string; weight: number; sourceTriggerRef: string }> = [];
    for (let i = 0; i < metas.length; i++) {
      const m = metas[i];
      const goal = await GoalsService.createClimaTriggeredGoal({
        accountId: userContext.accountId,
        createdById: userContext.userId,
        employeeId,
        title: m.title,
        description: m.description,
        startDate,
        dueDate: activeCycle.closureWindow,
        periodYear: activeCycle.year,
        startValue: m.startValue,
        targetValue: m.targetValue,
        unit: m.unit,
        weight: weights[i],
        sourceActionPlanId,
        sourceTriggerRef: m.reactive,
      });
      created.push({ id: goal.id, title: goal.title, weight: goal.weight, sourceTriggerRef: m.reactive });
    }

    return NextResponse.json({
      success: true,
      data: {
        employeeId,
        responsableName: responsable.name,
        created,
        count: created.length,
      },
    });
  } catch (e) {
    // Errores de dominio (peso, duplicado/P2002, límite, ciclo, categoría) → HTTP correcto.
    return goalsErrorResponse(e);
  }
}
