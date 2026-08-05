// src/app/api/clima/action-log/coverage/route.ts
// Cápsula 3, Estado A (H2a) — cobertura de registro por gerencia.
//
// Responde "quién escribió y quién no" (plan maestro §2.1), abriendo por rama del
// árbol el MISMO numerador que muestra la portada: `actionText !== null`. La suma
// de las unidades siempre da el total de `/summary` para el mismo viewer — es el
// mismo conjunto de filas, agrupado en vez de contado.
//
// ⛔ ARCHIVO NUEVO. No es un modo de `../route.ts` (sellado) ni de `../summary`
// (otro contrato, otra pregunta). Igual que `summary`, NO resuelve identidad: la
// pregunta es sobre el DEPARTAMENTO, y `ClimaActionLog.departmentId` está siempre
// poblado.
//
// ⚠️ NO SE REUSA `rollupClimaHierarchy` (`lib/utils/rollupClimaGerencias.ts:139`),
// y no por olvido: ese helper está tipado a `ClimaDepartmentInsight` y agrega
// favorabilidad, `driverScores` y `n` ponderados por participantes. Acá se agregan
// DOS CONTADORES. Generalizarlo obligaría a tocar el archivo del que depende toda
// la vista de resultados de clima para no ganar nada: el walk-up son 20 líneas.
// La FORMA del árbol sí se clona (relevantes → mapa de hijos → raíces → post-order),
// para que el drill-down se comporte igual que en el resto del módulo.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES,
} from '@/lib/services/AuthorizationService';
import type { ClimaDecisionItem } from '@/types/clima-planes';
import type { ClimaCoberturaDTO, ClimaCoberturaUnidadDTO } from '@/types/clima-hub';

const EMPTY: ClimaCoberturaDTO = {
  units: [],
  total: 0,
  withAction: 0,
  pct: null,
  approvedAt: null,
};

/** Cuenta cruda de una unidad, antes de agregar su subárbol. */
interface Tally {
  total: number;
  withAction: number;
}

/**
 * Departamentos que este viewer puede contar. `null` = todos (rol global).
 * Misma regla que `../summary/route.ts` — si divergieran, la portada y este
 * desglose mostrarían totales distintos en la misma pantalla.
 *
 * La capa DIRECT (EVALUATOR) no aplica: `clima:view` no incluye ese rol.
 * AREA_MANAGER sin `departmentId` → set vacío (fail-closed).
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

/**
 * Arma el árbol de cobertura. Clon estructural de `rollupClimaHierarchy`, con
 * contadores en lugar de scores.
 *
 * `nodes` viene ACOTADO al scope del viewer: para un AREA_MANAGER no incluye a sus
 * ancestros, así que la raíz del árbol que ve es su propia unidad y nunca el nombre
 * de la gerencia que está por encima suyo. Mismo criterio que
 * `api/clima/results/route.ts:269-279`.
 */
function buildCoverageTree(
  tallyByDept: Map<string, Tally>,
  nodes: Map<string, { parentId: string | null; name: string }>
): ClimaCoberturaUnidadDTO[] {
  // 1. Relevantes = unidades con focos + su ascendencia DENTRO DEL SCOPE.
  //
  // ⛔ La condición `nodes.has(parentId)` no es una optimización: sin ella se
  //    filtra el id del ancestro. `nodes` viene acotado al scope, así que para un
  //    AREA_MANAGER el padre de su unidad NO está — pero `parentId` sí viene en la
  //    fila de su propio departamento. Subir a ciegas metía ese id en el árbol como
  //    raíz fantasma (sin nombre, porque tampoco estaba en `nodes`), y el viewer
  //    recibía el identificador de una gerencia que no le corresponde ver.
  //    Detectado por el smoke de H2a con numeradores reales; con cobertura 0 esta
  //    rama no se ejecuta y el bug es invisible.
  //
  //    La hoja SIEMPRE entra, esté o no en `nodes` (un departamento inactivo con
  //    focos igual tiene que aparecer): si no, su cuenta desaparecería del árbol
  //    mientras sigue sumando al total, y las dos cifras dejarían de cuadrar.
  const relevant = new Set<string>();
  for (const deptId of tallyByDept.keys()) {
    let cur: string | null = deptId;
    while (cur && !relevant.has(cur)) {
      relevant.add(cur);
      // La anotación es necesaria: sin ella `parentId` se infiere desde `cur`, que
      // se reasigna con este mismo valor, y TS lo reporta como circular (TS7022).
      const parentId: string | null = nodes.get(cur)?.parentId ?? null;
      cur = parentId && nodes.has(parentId) ? parentId : null;
    }
  }

  // 2. Mapa de hijos, restringido a relevantes.
  const childrenMap = new Map<string, string[]>();
  for (const id of relevant) {
    const parentId = nodes.get(id)?.parentId ?? null;
    if (parentId && relevant.has(parentId)) {
      const arr = childrenMap.get(parentId) ?? [];
      arr.push(id);
      childrenMap.set(parentId, arr);
    }
  }

  // 3. Raíces = relevantes cuyo padre no es relevante (o no existe en el scope).
  const roots: string[] = [];
  for (const id of relevant) {
    const parentId = nodes.get(id)?.parentId ?? null;
    if (!parentId || !relevant.has(parentId)) roots.push(id);
  }

  // 4. Post-order: cada unidad suma lo propio más lo de sus hijos.
  const build = (id: string): ClimaCoberturaUnidadDTO => {
    const own = tallyByDept.get(id) ?? { total: 0, withAction: 0 };
    const childIds = childrenMap.get(id) ?? [];
    const children = childIds.map(build);

    const total = own.total + children.reduce((s, c) => s + c.total, 0);
    const withAction = own.withAction + children.reduce((s, c) => s + c.withAction, 0);

    return {
      departmentId: id,
      departmentName: nodes.get(id)?.name ?? 'Unidad',
      total,
      withAction,
      pct: total > 0 ? Math.round((withAction / total) * 100) : 0,
      // Una unidad que solo tiene focos propios no expone un `children` vacío: en
      // la UI eso sería un chevron que abre la nada.
      children: children.length > 0 ? sortUnits(children) : undefined,
    };
  };

  return sortUnits(roots.map(build));
}

/**
 * Peor cobertura primero; a igual cobertura, la que más focos tiene.
 *
 * Es ORDEN, no juicio: la pregunta de la pantalla es "quién no escribió", y esa
 * respuesta tiene que estar arriba sin que haga falta buscarla. Mismo criterio que
 * el `byWorstEI` de `rollupClimaGerencias.ts:131`.
 */
function sortUnits(units: ClimaCoberturaUnidadDTO[]): ClimaCoberturaUnidadDTO[] {
  return [...units].sort((a, b) => a.pct - b.pct || b.total - a.total);
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
      return NextResponse.json({ success: false, error: 'campaignId requerido' }, { status: 400 });
    }

    const plan = await prisma.actionPlan.findFirst({
      where: {
        accountId: userContext.accountId,
        campaignId,
        moduleType: 'clima',
        estado: 'aprobado',
      },
      select: { id: true, decisiones: true, approvedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!plan) {
      return NextResponse.json({ success: true, data: EMPTY });
    }
    const approvedAt = plan.approvedAt?.toISOString() ?? null;

    // Denominador: solo aceptar/modificar. Misma regla que `/summary` y que los
    // tres modos de `../route.ts` — rechazadas y pospuestas no comprometen a nadie.
    const acceptedRefs = new Set(
      ((plan.decisiones as ClimaDecisionItem[] | null) ?? [])
        .filter((d) => d.ceoDecision === 'aceptar' || d.ceoDecision === 'modificar')
        .map((d) => d.triggerRef)
    );
    // Desde acá el plan EXISTE, así que `approvedAt` viaja aunque no haya focos:
    // "aprobado hace 14 días y sin nada que seguir" es distinto de "no hay plan".
    if (acceptedRefs.size === 0) {
      return NextResponse.json({ success: true, data: { ...EMPTY, approvedAt } });
    }

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
      return NextResponse.json({ success: true, data: { ...EMPTY, approvedAt } });
    }

    // Cuentas por departamento HOJA (donde vive el foco). El rollup viene después.
    const tallyByDept = new Map<string, Tally>();
    for (const l of scoped) {
      const t = tallyByDept.get(l.departmentId) ?? { total: 0, withAction: 0 };
      t.total++;
      if (l.actionText !== null) t.withAction++;
      tallyByDept.set(l.departmentId, t);
    }

    // Nodos del árbol, ACOTADOS al scope: un AREA_MANAGER no debe recibir el nombre
    // de la gerencia por encima suyo solo porque es ancestro de su unidad.
    const nodeRows = await prisma.department.findMany({
      where: {
        accountId: userContext.accountId,
        isActive: true,
        ...(allowedDepartmentIds ? { id: { in: [...allowedDepartmentIds] } } : {}),
      },
      select: { id: true, parentId: true, displayName: true },
    });
    const nodes = new Map(
      nodeRows.map((n) => [n.id, { parentId: n.parentId, name: n.displayName }])
    );

    const units = buildCoverageTree(tallyByDept, nodes);

    // Totales del scope. Se calculan sobre `scoped` y no sumando `units` para que
    // un error del rollup no se esconda: el smoke compara ambos.
    const total = scoped.length;
    const withAction = scoped.filter((l) => l.actionText !== null).length;

    return NextResponse.json({
      success: true,
      data: {
        units,
        total,
        withAction,
        pct: Math.round((withAction / total) * 100),
        approvedAt,
      } satisfies ClimaCoberturaDTO,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'No se pudo cargar la cobertura.' },
      { status: 500 }
    );
  }
}
