// src/app/api/clima/action-log/findings/route.ts
// Cascada de hallazgos (H3b) — Cápsula 3, sistema elástico.
// Diseño: `DISENO_CONSOLIDADO_CASCADA_HALLAZGOS_v2.md` · plan maestro §2.3.bis.
//
// Lee lo que H3a persistió en `ClimaActionLog.llmClassification` y decide EN QUÉ
// MODO se presenta:
//
//   < 15 entradas globales  → MODO TÁCTICO: una tarjeta por registro, con su cita
//                             textual, su autor y su etiqueta. Auditoría de casos.
//   ≥ 15 entradas globales  → MODO MACRO: patrones agregados (gate futuro, v2 §4).
//
// El umbral NO oculta nada: cambia la unidad de análisis. Con pocos datos un
// porcentaje miente y un caso concreto no.
//
// ⛔ EL VOCABULARIO DEL MOTOR NO SALE DE ACÁ. La traducción a etiquetas ejecutivas
// ("Ejecución Comprobable", "Evidencia parcial") se hace EN EL SERVIDOR. En la
// respuesta no hay `verbMode`, ni `entityDensity`, ni `score`, ni `signal`. Si
// viajaran para que el cliente los tradujera, bastaría abrir la pestaña de red
// para leerlos — y el diseño §2 dice que el CEO nunca los ve.
//
// ⛔ NO SE TOCA `../route.ts` (sellado). Su `resolveEntryAuthors` (`:151`) resuelve
// autoría igual que acá, pero no está exportada y ese archivo no se modifica: la
// resolución se reimplementa, con el mismo criterio (sin filtro `isActive` — quien
// escribió y después se fue igual firmó esa entrada).
//
// 🕐 Nació (H3b.1) con la regla anterior: umbral 30 POR GERENCIA, y bajo umbral
// devolvía solo conteos. El diseño v2 la reemplazó. Se deja el rastro porque el
// smoke de entonces afirmaba lo contrario de lo que este archivo hace hoy.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
  GLOBAL_ACCESS_ROLES,
} from '@/lib/services/AuthorizationService';
import { formatDisplayName } from '@/lib/utils/formatName';
import { dimensionLabel } from '@/lib/constants/climaDimensions';
import {
  CLIMA_MODO_MACRO_MIN_ENTRIES,
  ETIQUETA_EJECUTIVA,
  ORDEN_ETIQUETA,
  indiceConfiabilidad,
} from '@/types/clima-text-analysis';
import type { ClimaActionLogAnalysis } from '@/types/clima-text-analysis';
import type { ClimaDecisionItem } from '@/types/clima-planes';
import type {
  ClimaFindingsDTO,
  ClimaFindingsUnitProgress,
  ClimaTacticalCardDTO,
} from '@/types/clima-hub';

const EMPTY: ClimaFindingsDTO = {
  mode: 'tactico',
  entriesAnalyzed: 0,
  threshold: CLIMA_MODO_MACRO_MIN_ENTRIES,
  executionCount: 0,
  units: [],
  cards: [],
  findings: [],
};

/** Misma regla de scope que `../summary` y `../coverage`. Si divergieran, tres
 *  superficies de la misma pantalla mostrarían universos distintos. */
async function resolveAllowedDepartmentIds(
  userContext: ReturnType<typeof extractUserContext>
): Promise<Set<string> | null> {
  if ((GLOBAL_ACCESS_ROLES as readonly string[]).includes(userContext.role ?? '')) return null;
  if (!userContext.departmentId) return new Set<string>();
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
      return NextResponse.json({ success: false, error: 'campaignId requerido' }, { status: 400 });
    }

    const plan = await prisma.actionPlan.findFirst({
      where: { accountId: userContext.accountId, campaignId, moduleType: 'clima', estado: 'aprobado' },
      select: { id: true, decisiones: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!plan) return NextResponse.json({ success: true, data: EMPTY });

    const logs = await prisma.climaActionLog.findMany({
      where: { accountId: userContext.accountId, actionPlanId: plan.id },
      select: {
        id: true,
        triggerRef: true,
        departmentId: true,
        llmClassification: true,
        entries: { select: { id: true, text: true, createdAt: true, createdBy: true } },
      },
    });

    const allowed = await resolveAllowedDepartmentIds(userContext);
    const scoped = logs.filter((l) => allowed === null || allowed.has(l.departmentId));
    if (scoped.length === 0) return NextResponse.json({ success: true, data: EMPTY });

    // ── Aparear cada entrada con SU clasificación ────────────────────────────
    // Solo entran las entradas YA ANALIZADAS: una entrada sin análisis no puede
    // mostrarse (no tendría etiqueta) y tampoco cuenta para el umbral, que mide lo
    // que el motor pudo leer.
    interface Row {
      entryId: string;
      text: string;
      createdAt: Date;
      createdBy: string | null;
      departmentId: string;
      triggerRef: string;
      verbMode: 'ejecucion' | 'intencion' | 'ninguno';
      score: number;
    }
    const rows: Row[] = [];
    const entriesByDept = new Map<string, number>();

    for (const l of scoped) {
      const a = l.llmClassification as unknown as ClimaActionLogAnalysis | null;
      if (!a || !Array.isArray(a.entries)) continue;
      const byId = new Map(a.entries.map((c) => [c.entryId, c]));
      for (const e of l.entries) {
        const c = byId.get(e.id);
        if (!c) continue;
        rows.push({
          entryId: e.id,
          text: e.text,
          createdAt: e.createdAt,
          createdBy: e.createdBy,
          departmentId: l.departmentId,
          triggerRef: l.triggerRef,
          verbMode: c.verbMode,
          score: c.signal?.score ?? 0,
        });
        entriesByDept.set(l.departmentId, (entriesByDept.get(l.departmentId) ?? 0) + 1);
      }
    }
    if (rows.length === 0) return NextResponse.json({ success: true, data: EMPTY });

    const entriesAnalyzed = rows.length;
    const mode: 'tactico' | 'macro' =
      entriesAnalyzed >= CLIMA_MODO_MACRO_MIN_ENTRIES ? 'macro' : 'tactico';

    // ── Contexto de cada tarjeta: autor, departamento, dimensión ─────────────
    const [authors, depts] = await Promise.all([
      prisma.employee.findMany({
        // SIN filtro isActive: quien escribió y después se fue igual firmó esa
        // entrada. Borrarle el nombre reescribiría la bitácora.
        where: {
          id: { in: [...new Set(rows.map((r) => r.createdBy).filter((x): x is string => !!x))] },
          accountId: userContext.accountId,
        },
        select: { id: true, fullName: true, position: true },
      }),
      prisma.department.findMany({
        where: { id: { in: [...new Set(rows.map((r) => r.departmentId))] }, accountId: userContext.accountId },
        select: { id: true, displayName: true },
      }),
    ]);
    const authorById = new Map(authors.map((a) => [a.id, a]));
    const deptNameById = new Map(depts.map((d) => [d.id, d.displayName]));
    const dimensionByRef = new Map(
      ((plan.decisiones as ClimaDecisionItem[] | null) ?? []).map((d) => [d.triggerRef, d.category])
    );

    // ── Tarjetas del Modo Táctico, ya traducidas y ordenadas ────────────────
    const cards: ClimaTacticalCardDTO[] =
      mode === 'tactico'
        ? rows
            .map((r) => {
              const emp = r.createdBy ? authorById.get(r.createdBy) : null;
              return {
                entryId: r.entryId,
                label: ETIQUETA_EJECUTIVA[r.verbMode],
                confidenceLabel: indiceConfiabilidad(r.score),
                groupOrder: ORDEN_ETIQUETA[r.verbMode],
                text: r.text,
                authorName: emp ? formatDisplayName(emp.fullName) : null,
                authorPosition: emp?.position ?? null,
                createdAt: r.createdAt.toISOString(),
                departmentName: deptNameById.get(r.departmentId) ?? 'Departamento',
                // `decisiones` guarda la categoría cruda ("autonomia"). Se traduce
                // acá con el mismo helper que usa Dimensiones —tildes incluidas—
                // por la misma razón que las etiquetas: el servidor traduce.
                dimension: (() => {
                  const raw = dimensionByRef.get(r.triggerRef);
                  return raw ? dimensionLabel(raw) : null;
                })(),
                // `_ts` no viaja: se usa solo para ordenar y se descarta abajo.
                _ts: r.createdAt.getTime(),
              };
            })
            // §3.4: primero quienes ejecutaron, al final quienes no actuaron.
            // Dentro de cada grupo, más reciente primero.
            .sort((a, b) => a.groupOrder - b.groupOrder || b._ts - a._ts)
            .map(({ _ts, ...card }) => card)
        : [];

    const executionCount = rows.filter((r) => r.verbMode === 'ejecucion').length;

    // ── Avance por gerencia (contexto del header y del Radar) ───────────────
    const nodeRows = await prisma.department.findMany({
      where: {
        accountId: userContext.accountId,
        isActive: true,
        ...(allowed ? { id: { in: [...allowed] } } : {}),
      },
      select: { id: true, parentId: true, displayName: true },
    });
    const nodes = new Map(nodeRows.map((n) => [n.id, { parentId: n.parentId, name: n.displayName }]));

    const relevant = new Set<string>();
    for (const deptId of entriesByDept.keys()) {
      let cur: string | null = deptId;
      while (cur && !relevant.has(cur)) {
        relevant.add(cur);
        // Mismo guard de scope que `../coverage`: no se sube a un padre fuera del
        // scope, porque eso filtraría el id de una unidad que el viewer no ve.
        const parentId: string | null = nodes.get(cur)?.parentId ?? null;
        cur = parentId && nodes.has(parentId) ? parentId : null;
      }
    }
    const childrenMap = new Map<string, string[]>();
    for (const id of relevant) {
      const p = nodes.get(id)?.parentId ?? null;
      if (p && relevant.has(p)) childrenMap.set(p, [...(childrenMap.get(p) ?? []), id]);
    }
    const sumSubtree = (id: string): number =>
      (entriesByDept.get(id) ?? 0) + (childrenMap.get(id) ?? []).reduce((s, c) => s + sumSubtree(c), 0);

    const units: ClimaFindingsUnitProgress[] = [...relevant]
      .filter((id) => {
        const p = nodes.get(id)?.parentId ?? null;
        return !p || !relevant.has(p);
      })
      .map((id) => ({
        departmentId: id,
        departmentName: nodes.get(id)?.name ?? 'Unidad',
        entriesAnalyzed: sumSubtree(id),
      }))
      .sort((a, b) => b.entriesAnalyzed - a.entriesAnalyzed);

    return NextResponse.json({
      success: true,
      data: {
        mode,
        entriesAnalyzed,
        threshold: CLIMA_MODO_MACRO_MIN_ENTRIES,
        executionCount,
        units,
        cards,
        // Modo Macro sin diseñar todavía (v2 §4 y §11): se hace con datos reales,
        // no con wireframes teóricos. Vacío por decisión, no por falta de tiempo.
        findings: [],
      } satisfies ClimaFindingsDTO,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'No se pudieron cargar los hallazgos.' },
      { status: 500 }
    );
  }
}
