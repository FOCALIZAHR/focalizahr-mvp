// src/lib/utils/rollupClimaGerencias.ts
// ════════════════════════════════════════════════════════════════════════════
// Rollup (A2) — favorabilidad por dimensión sobre la jerarquía RECURSIVA de Clima
// (N niveles, acotada a 4 por el schema: holding→…→departamento).
//
// El dato de clima se persiste en las HOJAS (departamento de participante). Esta
// función lo agrega hacia arriba por `parentId`, nivel por nivel, con el mismo
// promedio ponderado por participantes que ya usábamos para 2 niveles —
// SUM(fav·n)/SUM(n) por driver — pero ahora recursivo:
//   • el árbol se arma desde la lista plana vía parentId (patrón buildHierarchyTree);
//   • cada nodo agrega el merge ponderado de sus hijos ya agregados (asociativo:
//     merge de hijos == agregar todas las hojas del subárbol);
//   • N-genérico en dimensiones (unión de drivers, sin lista fija).
//
// Devuelve las unidades de PRIMER NIVEL a mostrar (los hijos del root si hay un
// único root — el root == la organización, que ya vive en el header — o los roots
// si hay varios), cada una con `children` recursivos hasta las hojas.
//
// Privacidad: agregar hijos chicos (n<5) dentro de un padre es privacy-safe; el
// guard n≥5 lo aplica el consumidor sobre la n agregada de cada nodo.
//
// SERVER-SIDE (lo usa /api/clima/results). Pura y determinista → testeable.
// ════════════════════════════════════════════════════════════════════════════

import { calcOrgFavorability, type OrgFavorabilityRow } from '@/lib/services/clima/PulseEngine';
import type {
  ClimaDepartmentInsight,
  ClimaDriverScore,
  ClimaCrossSignal,
} from '@/types/clima';

/** Nodo estructural del árbol (todos los departamentos del scope, con o sin insight). */
export interface ClimaHierarchyNode {
  id: string;
  parentId: string | null;
  name: string;
}
export type ClimaHierarchyNodes = Map<string, ClimaHierarchyNode>;

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Promedio ponderado por n de UN driver sobre una lista de unidades (hojas o
 *  nodos ya agregados). Excluye carried y fav null. null si no hay base. */
function rollupDriver(members: ClimaDepartmentInsight[], driver: string): ClimaDriverScore | null {
  let favSum = 0;
  let meanSum = 0;
  let meanW = 0;
  let nSum = 0;
  for (const m of members) {
    const s = m.driverScores?.[driver];
    if (!s || s.carried || s.fav === null || s.n <= 0) continue;
    favSum += s.fav * s.n;
    nSum += s.n;
    if (s.mean !== null) {
      meanSum += s.mean * s.n;
      meanW += s.n;
    }
  }
  if (nSum === 0) return null;
  return {
    fav: round1(favSum / nSum),
    mean: meanW > 0 ? round1(meanSum / meanW) : null,
    n: nSum,
    carried: false,
  };
}

/** Cross-signal del nodo = OR sobre miembros: exit con más menciones; onboarding
 *  con mayor tasa de abandono. Atribuido al nodo (el clause §7 interpola su nombre). */
function rollupCrossSignal(members: ClimaDepartmentInsight[]): ClimaCrossSignal | null {
  let exit: ClimaCrossSignal['exitTopFactor'] = null;
  let onb: ClimaCrossSignal['onboardingAbandon'] = null;
  for (const m of members) {
    const cs = m.crossSignals;
    if (!cs) continue;
    if (cs.exitTopFactor && (!exit || cs.exitTopFactor.mentions > exit.mentions)) exit = cs.exitTopFactor;
    if (cs.onboardingAbandon && (!onb || cs.onboardingAbandon.abandonRate > onb.abandonRate)) {
      onb = cs.onboardingAbandon;
    }
  }
  return exit || onb ? { exitTopFactor: exit, onboardingAbandon: onb } : null;
}

function emptyUnit(id: string, name: string): ClimaDepartmentInsight {
  return {
    departmentId: id, departmentName: name,
    engagementFavorability: null, engagementMean: null,
    driverScores: null, customDriverScores: null, driverAnalysis: null,
    topFocusArea: null, topStrength: null, riskZone: null, momentum: null,
    correlationFlags: null, npsScore: null, promotersPct: null, detractorsPct: null,
    acotadoGroupScores: null, totalInvited: 0, totalResponded: 0, participationRate: 0,
    turnoverRateAtMeasurement: null, absenteeismRateAtMeasurement: null,
    overtimeRateAtMeasurement: null, incidentCountAtMeasurement: null, crossSignals: null,
  };
}

/** Agrega una lista de unidades (hijos ya agregados y/o el insight propio del
 *  nodo) en una unidad. Ponderado por n por driver; EI/zona por totalInvited. */
function mergeUnits(members: ClimaDepartmentInsight[], id: string, name: string): ClimaDepartmentInsight {
  const unit = emptyUnit(id, name);

  const driverKeys = new Set<string>();
  for (const m of members) {
    if (m.driverScores) for (const k of Object.keys(m.driverScores)) driverKeys.add(k);
  }
  const driverScores: Record<string, ClimaDriverScore> = {};
  for (const k of driverKeys) {
    const rolled = rollupDriver(members, k);
    if (rolled) driverScores[k] = rolled;
  }
  unit.driverScores = Object.keys(driverScores).length ? driverScores : null;

  const eiRows: OrgFavorabilityRow[] = members.map((m) => ({
    engagementFavorability: m.engagementFavorability,
    totalInvited: m.totalInvited,
  }));
  const ei = calcOrgFavorability(eiRows);
  unit.engagementFavorability = ei.favorability;
  unit.riskZone = ei.riskZone;

  unit.totalInvited = members.reduce((s, m) => s + m.totalInvited, 0);
  unit.totalResponded = members.reduce((s, m) => s + m.totalResponded, 0);
  unit.participationRate =
    unit.totalInvited > 0 ? round1((unit.totalResponded / unit.totalInvited) * 100) : 0;

  unit.crossSignals = rollupCrossSignal(members);
  return unit;
}

/** Peor EI primero (null al final). */
const byWorstEI = (a: ClimaDepartmentInsight, b: ClimaDepartmentInsight) =>
  (a.engagementFavorability ?? 999) - (b.engagementFavorability ?? 999);

/**
 * Rollup recursivo. `departments` = insights hoja; `nodes` = todos los nodos del
 * scope (para resolver la ascendencia por parentId). Devuelve las unidades de
 * primer nivel a mostrar, con `children` recursivos.
 */
export function rollupClimaHierarchy(
  departments: ClimaDepartmentInsight[],
  nodes: ClimaHierarchyNodes,
): ClimaDepartmentInsight[] {
  if (departments.length === 0) return [];
  const insightById = new Map(departments.map((d) => [d.departmentId, d]));

  // 1. Conjunto relevante = hojas con insight + toda su ascendencia.
  const relevant = new Set<string>();
  for (const d of departments) {
    let cur: string | null = d.departmentId;
    while (cur && !relevant.has(cur)) {
      relevant.add(cur);
      cur = nodes.get(cur)?.parentId ?? null;
    }
  }

  // 2. Mapa de hijos restringido a relevantes.
  const childrenMap = new Map<string, string[]>();
  for (const id of relevant) {
    const parentId = nodes.get(id)?.parentId ?? null;
    if (parentId && relevant.has(parentId)) {
      const arr = childrenMap.get(parentId) ?? [];
      arr.push(id);
      childrenMap.set(parentId, arr);
    }
  }

  // 3. Roots = relevantes cuyo padre no es relevante (o no tienen).
  const roots: string[] = [];
  for (const id of relevant) {
    const parentId = nodes.get(id)?.parentId ?? null;
    if (!parentId || !relevant.has(parentId)) roots.push(id);
  }

  // 4. Construcción recursiva (post-order).
  const build = (nodeId: string): ClimaDepartmentInsight => {
    const node = nodes.get(nodeId);
    const name = node?.name ?? insightById.get(nodeId)?.departmentName ?? 'Unidad';
    const childIds = childrenMap.get(nodeId) ?? [];
    const own = insightById.get(nodeId);

    if (childIds.length === 0) {
      // Hoja: su propio insight tal cual (o vacío).
      return own ? { ...own, departmentName: name, children: undefined } : emptyUnit(nodeId, name);
    }

    const childUnits = childIds.map(build).sort(byWorstEI);
    const members = own ? [own, ...childUnits] : childUnits;
    const unit = mergeUnits(members, nodeId, name);
    unit.children = childUnits;
    return unit;
  };

  const builtRoots = roots.map(build).sort(byWorstEI);

  // 5. Si hay un único root (la organización, que ya vive en el header), mostrar
  //    sus hijos como primer nivel; si hay varios, mostrar los roots.
  if (builtRoots.length === 1 && builtRoots[0].children && builtRoots[0].children.length > 0) {
    return builtRoots[0].children;
  }
  return builtRoots;
}
