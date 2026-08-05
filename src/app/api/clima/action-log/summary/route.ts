// src/app/api/clima/action-log/summary/route.ts
// Hub de Planes de Acción (H1.1) — barra de progreso global.
//
// Responde UNA pregunta: de los hallazgos aprobados de esta campaña, ¿cuántos
// tienen al menos una acción registrada? Es lo primero que ve cualquiera al
// entrar al hub, antes de elegir cápsula.
//
// ⛔ ARCHIVO NUEVO A PROPÓSITO. No es un modo más de `../route.ts`: ese archivo
// está sellado (Fase A / F1 / F2 / V1) y el plan maestro §8.2 prohíbe tocarlo.
// La regla de negocio que sí se comparte (qué log "cuenta") se replica abajo con
// su justificación, no se importa: `../route.ts` no exporta helpers.
//
// ⚠️ ESTE ENDPOINT NO RESUELVE IDENTIDAD, y por eso funciona hoy. La Bitácora
// devuelve vacío a todos porque necesita saber QUÉ EMPLEADO es el viewer
// (`User.employeeId` en NULL, Etapa 3 del vínculo Employee↔User pendiente). Acá
// la pregunta es sobre el DEPARTAMENTO, no sobre la persona: `departmentId` está
// siempre poblado en ClimaActionLog. El progreso del hub es correcto desde el
// primer día, aunque la Cápsula 2 todavía no reconozca a nadie.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES,
} from '@/lib/services/AuthorizationService';
import type { ClimaDecisionItem } from '@/types/clima-planes';
import type { ClimaPlanesProgressDTO } from '@/types/clima-hub';

/** Sin plan aprobado, sin hallazgos, o sin alcance: 0 de 0. `pct` null = no hay
 *  fracción que mostrar (nunca 0%, que se leería como "nadie registró nada"). */
const EMPTY: ClimaPlanesProgressDTO = { withAction: 0, total: 0, pct: null };

/**
 * Departamentos que este viewer puede contar. `null` = todos (rol global).
 *
 * Capa GLOBAL / capa HIERARCHICAL de las 3 capas. La capa DIRECT (EVALUATOR) no
 * aplica: `clima:view` no incluye ese rol, así que el guard de permiso ya lo dejó
 * afuera antes de llegar acá.
 *
 * AREA_MANAGER sin `departmentId` en el token → set vacío (fail-closed): sin
 * departamento propio no hay subárbol que autorizar, y devolver "toda la cuenta"
 * sería una fuga silenciosa.
 */
async function resolveAllowedDepartmentIds(
  userContext: ReturnType<typeof extractUserContext>
): Promise<Set<string> | null> {
  if ((GLOBAL_ACCESS_ROLES as readonly string[]).includes(userContext.role ?? '')) {
    return null;
  }
  if (!userContext.departmentId) {
    return new Set<string>();
  }
  const childIds = await getChildDepartmentIds(userContext.departmentId);
  return new Set([userContext.departmentId, ...childIds]);
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

    const campaignId = new URL(request.url).searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaignId requerido' },
        { status: 400 }
      );
    }

    // Mismo plan que lee la Bitácora: el aprobado más reciente de esta campaña.
    const plan = await prisma.actionPlan.findFirst({
      where: {
        accountId: userContext.accountId,
        campaignId,
        moduleType: 'clima',
        estado: 'aprobado',
      },
      select: { id: true, decisiones: true },
      orderBy: { updatedAt: 'desc' },
    });
    // Sin plan aprobado no hay nada que seguir. Vacío legítimo con 200, no 404:
    // la campaña existe, todavía no se aprobó su plan.
    if (!plan) {
      return NextResponse.json({ success: true, data: EMPTY });
    }

    // Denominador: SOLO decisiones aceptadas o modificadas, la misma regla que usan
    // los tres modos de `../route.ts` (`:359` y `:561`). Rechazadas y pospuestas no
    // generan compromiso, así que contarlas hundiría el porcentaje con hallazgos que
    // nadie se comprometió a atacar.
    const acceptedRefs = new Set(
      ((plan.decisiones as ClimaDecisionItem[] | null) ?? [])
        .filter((d) => d.ceoDecision === 'aceptar' || d.ceoDecision === 'modificar')
        .map((d) => d.triggerRef)
    );
    if (acceptedRefs.size === 0) {
      return NextResponse.json({ success: true, data: EMPTY });
    }

    // Se traen las filas en vez de `count()` porque el filtro por `triggerRef` vive en
    // un campo JSON (`decisiones`) que Prisma no puede cruzar en SQL. El volumen es
    // acotado por construcción: @@unique(actionPlanId, triggerRef) ⇒ una fila por
    // hallazgo aceptado de UN plan (decenas), no un listado paginable.
    const logs = await prisma.climaActionLog.findMany({
      where: { accountId: userContext.accountId, actionPlanId: plan.id },
      select: { triggerRef: true, departmentId: true, actionText: true },
    });

    const allowedDepartmentIds = await resolveAllowedDepartmentIds(userContext);
    const scoped = logs.filter(
      (l) =>
        acceptedRefs.has(l.triggerRef) &&
        (allowedDepartmentIds === null || allowedDepartmentIds.has(l.departmentId))
    );
    if (scoped.length === 0) {
      return NextResponse.json({ success: true, data: EMPTY });
    }

    // "Al menos 1 acción registrada" = `actionText !== null`. Es el MISMO campo que
    // lee ActionEffectivenessService para el veredicto, y el espejo que el POST
    // sincroniza al crear una entrada. La barra y la matriz de efectividad nunca
    // pueden contradecirse porque miran la misma columna.
    const withAction = scoped.filter((l) => l.actionText !== null).length;
    const total = scoped.length;

    return NextResponse.json({
      success: true,
      data: {
        withAction,
        total,
        pct: Math.round((withAction / total) * 100),
      } satisfies ClimaPlanesProgressDTO,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'No se pudo cargar el progreso.' },
      { status: 500 }
    );
  }
}
