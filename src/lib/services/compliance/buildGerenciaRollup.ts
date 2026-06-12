// ═══════════════════════════════════════════════════════════════════
// buildGerenciaRollup — utility compartida de agregación per-gerencia
// src/lib/services/compliance/buildGerenciaRollup.ts
// ═══════════════════════════════════════════════════════════════════
// Pure function — sin async, sin DB, sin LLM. Lee el ComplianceReportResponse
// completo y devuelve una vista agregada por gerencia (parentGerenciaId).
//
// Consumidores: slots de Beat 1 (Apertura), Triage de Beat 2 (Cobertura),
// y cualquier acto futuro que necesite la grilla per-gerencia.
//
// Reglas de degradación CRITICAL (no negociables):
//   - null ≠ 0 en denuncias.count (3-estado: null = no cargada, 0 = afirmable)
//   - null ≠ false en teatro.anyTeatro (null = sin campo, false = medido)
//   - null ≠ 0 en isa.weighted, silencio.participationRate, silencio.coverageRate
//
// El util NUNCA narra y NUNCA thresholdea. Solo agrega.
// Spec: chat plan-mode aprobado 2026-05-30.
// ═══════════════════════════════════════════════════════════════════

import type {
  ComplianceReportResponse,
  ComplianceReportDepartment,
  DepartmentRiskScore,
  SilencioVozExternaItem,
} from '@/types/compliance';
import type { CoverageDeptItem } from '@/lib/services/compliance/CoverageAnalysisService';
import type {
  DepartmentConvergencia,
  NivelFinal,
} from '@/lib/services/compliance/ConvergenciaEngine';
import type { GenderAlertDetail } from '@/lib/services/compliance/ComplianceNarrativeEngine';
import {
  LEY_KARIN_ALERT_TYPES,
  SENALES_AMBIENTE,
} from '@/config/compliance/convergenciaWeights';

// ═══════════════════════════════════════════════════════════════════
// PUBLIC TYPES
// ═══════════════════════════════════════════════════════════════════

export interface GerenciaRollupOptions {
  /** Filtro RBAC opcional. Si presente, solo se procesan riskScores cuyos
   *  departmentId estén en el set. route.ts ya filtra el payload — esto es
   *  defensa adicional, no fuente primaria. */
  visibleDeptIds?: Set<string>;
}

export interface GerenciaRollupWorstDept {
  departmentId: string;
  departmentName: string;
  score: number;
  reason: 'suma' | 'piso_aplicado';
}

export interface GerenciaRollup {
  // ─── identidad ───────────────────────────────────────────────
  groupId: string;
  groupName: string;
  /** true si el rollup representa un dept directo (sin parentGerenciaId
   *  resoluble). En ese caso groupId tiene prefijo `__dept__:`. */
  standalone: boolean;
  totalChildren: number;
  /** departmentId de cada hijo del grupo, en orden de aparición. Para que el
   *  Triage 2b liste "SUS DEPARTAMENTOS" sin re-derivar la agrupación
   *  (merge de ancestro / standalone). Incluye el dept de la gerencia-misma
   *  en el caso de merge de ancestro — el consumidor lo excluye si quiere. */
  childDeptIds: string[];

  // ─── ISA gerencial ──────────────────────────────────────────
  isa: {
    /** Promedio ponderado por respondentCount. null si nadie tiene ISA. */
    weighted: number | null;
    min: number | null;
    max: number | null;
    deptosConIsa: number;
  };

  // ─── Silencio / cobertura ───────────────────────────────────
  silencio: {
    invited: number;
    responded: number;
    empleadosActivos: number;
    /** responded / invited. null si invited === 0 (gerencia entera no invitada). */
    participationRate: number | null;
    /** invited / empleadosActivos. null si empleadosActivos === 0. */
    coverageRate: number | null;
    deptosNoInvitados: number;
    deptosSubThreshold: number;
  };

  // ─── Exit ───────────────────────────────────────────────────
  exit: {
    alertsCount: number;
    pesoTotal: number;
    deptosConAlerta: number;
  };

  // ─── Denuncias formales (3-estado) ──────────────────────────
  denuncias: {
    /** null si TODOS los hijos tienen denuncias_12m === null (métrica no
     *  cargada). Σ de los no-null si al menos uno tiene dato; 0 afirmable. */
    count: number | null;
    deptosConDatoCargado: number;
    deptosSinDatoCargado: number;
    deptosConDenuncia: number;
  };

  // ─── Teatro ─────────────────────────────────────────────────
  teatro: {
    /** null si ningún hijo trae el campo (payload legacy). false afirmable. */
    anyTeatro: boolean | null;
    deptosConTeatro: number;
    deptosConFlagPresente: number;
  };

  // ─── Cruce pre-cocido: mudos con voz externa ───────────────
  silencioVozExterna: {
    deptosMudosConSenalExterna: Array<{
      departmentId: string;
      departmentName: string;
      signalsCount: number;
    }>;
    count: number;
  };

  // ─── Convergencia per-grupo ─────────────────────────────────
  convergencia: {
    worstNivelFinal: NivelFinal | null;
    maxScoreExterno: number | null;
  };

  // ─── Meta-score auditable ───────────────────────────────────
  riesgo: {
    /** max(score) entre hijos — el peor depto define el nivel del grupo. */
    maxScore: number;
    /** Hijo que produce maxScore. null solo si el grupo está vacío. */
    worstDept: GerenciaRollupWorstDept | null;
  };

  // ─── Conteo de deptos en banda riesgo/critico (para foco BIEN CON FOCOS) ─
  /** Hijos cuyo `dept.riskLevel` es 'risk' o 'critical' (SafetyScore).
   *  Per-gerencia version del `riesgoDeptos` org-level que usa classifyD4. */
  deptosEnRiesgo: number;

  // ─── ORTOGONAL: género (alertasGenero del LLM) ──────────────
  /** Match por `parentDepartmentName === groupName` (non-standalone) o
   *  `departmentName === groupName` (standalone). Primera alerta gana. */
  genero: {
    hasAlerta: boolean;
    /** Cita literal ≤8 palabras del motor LLM. null si no hay alerta. */
    evidenciaGenero: string | null;
  };

  // ─── ORTOGONAL: Ley Karin (señales Exit cross-producto, 12m) ──
  /** Σ y conteo de alertas Exit con `alertType ∈ {ley_karin, ley_karin_indicios}`
   *  agregadas across los hijos de la gerencia. Cross-producto 12m por dept
   *  (backend `loadAlertasByDeptBulk` fix 2026-05-31). */
  leyKarin: {
    signalsCount: number;
    deptosConSenal: number;
  };

  // ─── ORTOGONAL: SEÑALES DE AMBIENTE (clima — superset de leyKarin) ──
  /** Σ y conteo de alertas Exit cuyo `alertType ∈ SENALES_AMBIENTE`
   *  (`ley_karin + ley_karin_indicios + toxic_exit_detected + liderazgo_concentracion`).
   *  Excluye onboarding/retención y satisfacción genérica. Usado por el
   *  deriver del Beat 1 (`pickMuda`) como criterio del "empezando por" entre
   *  las gerencias sin voz. Espejo de `leyKarin` con el set expandido. */
  senalesAmbiente: {
    signalsCount: number;
    deptosConSenal: number;
  };
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

/** Orden de severidad de NivelFinal para identificar el peor de un grupo.
 *  Mismo orden que ConvergenciaEngine.computeNivelFinal aplica per-dept. */
const NIVEL_FINAL_PRIORITY: Record<NivelFinal, number> = {
  ninguna: 0,
  interna_solo: 1,
  externa_solo: 2,
  confirmada: 3,
  amplificada: 4,
  critica_sistema: 5,
};

/** Prefijo del groupId para deptos standalone (sin parentGerenciaId resoluble).
 *  Evita colisión con managerIds reales del Account. */
const STANDALONE_PREFIX = '__dept__:';

// ═══════════════════════════════════════════════════════════════════
// INTERNAL — bucket de hijos antes de reducir
// ═══════════════════════════════════════════════════════════════════

interface RollupChild {
  rs: DepartmentRiskScore;
  dept: ComplianceReportDepartment | undefined;
  coverage: CoverageDeptItem | undefined;
  convergencia: DepartmentConvergencia | undefined;
  silencioVE: SilencioVozExternaItem | undefined;
}

/** Alertas Exit con scope Ley Karin — fuente única en convergenciaWeights.
 *  Set wrapper para mantener O(1) lookup en `computeLeyKarin`. */
const LEY_KARIN_ALERT_TYPES_SET = new Set(LEY_KARIN_ALERT_TYPES);

/** Alertas Exit con scope SEÑALES DE AMBIENTE — fuente única en
 *  convergenciaWeights. Set wrapper para O(1) lookup en `computeSenalesAmbiente`. */
const SENALES_AMBIENTE_SET = new Set(SENALES_AMBIENTE);

interface GroupBucket {
  groupId: string;
  groupName: string;
  standalone: boolean;
  children: RollupChild[];
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

export function buildGerenciaRollup(
  data: ComplianceReportResponse,
  options?: GerenciaRollupOptions,
): GerenciaRollup[] {
  const riskScores = data.data.riskScores ?? [];
  if (riskScores.length === 0) return [];

  // 1. Pre-build lookup maps (UNA vez, no por hijo)
  const deptById = new Map<string, ComplianceReportDepartment>(
    (data.data.departments ?? []).map((d) => [d.departmentId, d]),
  );
  const coverageById = new Map<string, CoverageDeptItem>(
    (data.data.coverage.deptosCobertura ?? []).map((c) => [c.departmentId, c]),
  );
  const convergenciaById = new Map<string, DepartmentConvergencia>(
    (data.data.convergencia.departments ?? []).map((c) => [c.departmentId, c]),
  );
  // Top-level `silencioVozExterna` = la sexta alerta ya pre-cocida (con
  // narrativa + signalsCount). Distinto de `coverage.silencioConVozExterna`
  // (mismo nombre type, otra shape — no exposed `signalsCount`).
  const silencioVEById = new Map<string, SilencioVozExternaItem>();
  for (const s of data.data.silencioVozExterna ?? []) {
    if (s.departmentId) silencioVEById.set(s.departmentId, s);
  }
  // Map de alertas de género por nombre de gerencia para lookup O(1) en cada
  // grupo. Index por `parentDepartmentName` (preferido) o por `departmentName`
  // (fallback para alertas en deptos standalone sin parent visible).
  const generoByParentName = new Map<string, GenderAlertDetail>();
  const generoByDeptName = new Map<string, GenderAlertDetail>();
  for (const ga of (data.narratives?.alertasGenero ?? []) as GenderAlertDetail[]) {
    if (ga.parentDepartmentName && !generoByParentName.has(ga.parentDepartmentName)) {
      generoByParentName.set(ga.parentDepartmentName, ga);
    }
    if (ga.departmentName && !generoByDeptName.has(ga.departmentName)) {
      generoByDeptName.set(ga.departmentName, ga);
    }
  }

  // 2. RBAC defensive filter (route.ts ya filtró; esto es backup)
  const filteredRs = options?.visibleDeptIds
    ? riskScores.filter((rs) => options.visibleDeptIds!.has(rs.departmentId))
    : riskScores;

  // 3. Group by parentGerenciaId (null/undefined → standalone bucket)
  const byGroup = new Map<string, GroupBucket>();

  // 3a. Pre-pass — ids de gerencia que aparecen como ancestro de algún hijo
  //     invitado. Si una gerencia level=2 fue invitada DIRECTAMENTE Y también
  //     es ancestro de otros invitados, su riskScore (parentGerenciaId=null,
  //     porque route.ts:228-230 setea null para todo level=2) se funde en
  //     el bucket compartido — no emite standalone duplicado.
  //     Caso real cmob0e56: "Gerencia Comercial" salía 2 veces (standalone +
  //     grupo de sus hijos); con este pre-pass sale 1 vez fusionada.
  const ancestorIds = new Set<string>();
  for (const rs of filteredRs) {
    if (rs.parentGerenciaId != null) ancestorIds.add(rs.parentGerenciaId);
  }

  for (const rs of filteredRs) {
    const hasG =
      rs.parentGerenciaId != null && rs.parentGerenciaName != null;
    const isOwnAncestor = !hasG && ancestorIds.has(rs.departmentId);

    let groupId: string;
    let groupName: string;
    let standalone: boolean;
    if (hasG) {
      groupId = rs.parentGerenciaId as string;
      groupName = rs.parentGerenciaName as string;
      standalone = false;
    } else if (isOwnAncestor) {
      // Dept invitado directo cuya descendencia también está en la campaña:
      // se funde en el grupo común bajo su propio id (mismo groupId que el
      // bucket donde caen sus hijos via parentGerenciaId).
      groupId = rs.departmentId;
      groupName = rs.departmentName;
      standalone = false;
    } else {
      groupId = `${STANDALONE_PREFIX}${rs.departmentId}`;
      groupName = rs.departmentName;
      standalone = true;
    }

    let bucket = byGroup.get(groupId);
    if (!bucket) {
      bucket = { groupId, groupName, standalone, children: [] };
      byGroup.set(groupId, bucket);
    }
    bucket.children.push({
      rs,
      dept: deptById.get(rs.departmentId),
      coverage: coverageById.get(rs.departmentId),
      convergencia: convergenciaById.get(rs.departmentId),
      silencioVE: silencioVEById.get(rs.departmentId),
    });
  }

  // 4. Reduce each group along all axes
  const rollups: GerenciaRollup[] = [];
  for (const group of byGroup.values()) {
    rollups.push({
      groupId: group.groupId,
      groupName: group.groupName,
      standalone: group.standalone,
      totalChildren: group.children.length,
      childDeptIds: group.children.map((c) => c.rs.departmentId),
      isa: computeIsa(group.children),
      silencio: computeSilencio(group.children),
      exit: computeExit(group.children),
      denuncias: computeDenuncias(group.children),
      teatro: computeTeatro(group.children),
      silencioVozExterna: computeSilencioVE(group.children),
      convergencia: computeConvergencia(group.children),
      riesgo: computeRiesgo(group.children),
      deptosEnRiesgo: computeDeptosEnRiesgo(group.children),
      genero: computeGenero(
        group.groupName,
        group.standalone,
        generoByParentName,
        generoByDeptName,
      ),
      leyKarin: computeLeyKarin(group.children),
      senalesAmbiente: computeSenalesAmbiente(group.children),
    });
  }

  // 5. Sort: max risk desc, tiebreak alphabetical
  rollups.sort((a, b) => {
    const diff = b.riesgo.maxScore - a.riesgo.maxScore;
    if (diff !== 0) return diff;
    return a.groupName.localeCompare(b.groupName);
  });

  return rollups;
}

// ═══════════════════════════════════════════════════════════════════
// REDUCERS PER-AXIS
// ═══════════════════════════════════════════════════════════════════

function computeIsa(children: RollupChild[]): GerenciaRollup['isa'] {
  let weightedSum = 0;
  let totalWeight = 0;
  let min: number | null = null;
  let max: number | null = null;
  let deptosConIsa = 0;
  for (const { dept } of children) {
    const isa = dept?.isaScore;
    const w = dept?.respondentCount ?? 0;
    if (isa == null || w <= 0) continue;
    deptosConIsa++;
    weightedSum += isa * w;
    totalWeight += w;
    if (min === null || isa < min) min = isa;
    if (max === null || isa > max) max = isa;
  }
  return {
    weighted: totalWeight > 0 ? weightedSum / totalWeight : null,
    min,
    max,
    deptosConIsa,
  };
}

function computeSilencio(
  children: RollupChild[],
): GerenciaRollup['silencio'] {
  let invited = 0;
  let responded = 0;
  let empleadosActivos = 0;
  let deptosNoInvitados = 0;
  let deptosSubThreshold = 0;
  for (const { rs, coverage } of children) {
    if (coverage) {
      invited += coverage.invited;
      responded += coverage.responded;
      empleadosActivos += coverage.empleadosActivos;
    }
    if (rs.bucket === 'no_invitado') deptosNoInvitados++;
    if (rs.bucket === 'sub_threshold') deptosSubThreshold++;
  }
  return {
    invited,
    responded,
    empleadosActivos,
    participationRate: invited > 0 ? responded / invited : null,
    coverageRate: empleadosActivos > 0 ? invited / empleadosActivos : null,
    deptosNoInvitados,
    deptosSubThreshold,
  };
}

function computeExit(children: RollupChild[]): GerenciaRollup['exit'] {
  let alertsCount = 0;
  let pesoTotal = 0;
  let deptosConAlerta = 0;
  for (const { rs } of children) {
    let perDeptCount = 0;
    for (const a of rs.alertas) {
      if (a.producto === 'exit') {
        perDeptCount++;
        pesoTotal += a.pesoEfectivo;
      }
    }
    if (perDeptCount > 0) deptosConAlerta++;
    alertsCount += perDeptCount;
  }
  return { alertsCount, pesoTotal, deptosConAlerta };
}

function computeDenuncias(
  children: RollupChild[],
): GerenciaRollup['denuncias'] {
  let conDato = 0;
  let sinDato = 0;
  let sum = 0;
  let deptosConDenuncia = 0;
  for (const { rs } of children) {
    const d = rs.inputs.denuncias_12m;
    if (d === null) {
      sinDato++;
    } else {
      conDato++;
      sum += d;
      if (d >= 1) deptosConDenuncia++;
    }
  }
  return {
    // 3-estado: null cuando nadie cargó. 0 afirmable cuando al menos uno cargó.
    count: conDato === 0 ? null : sum,
    deptosConDatoCargado: conDato,
    deptosSinDatoCargado: sinDato,
    deptosConDenuncia,
  };
}

function computeTeatro(children: RollupChild[]): GerenciaRollup['teatro'] {
  let deptosConFlagPresente = 0;
  let deptosConTeatro = 0;
  let anyTrue = false;
  for (const { dept } of children) {
    const t = dept?.teatroCumplimiento;
    if (t === undefined) continue;
    deptosConFlagPresente++;
    if (t === true) {
      deptosConTeatro++;
      anyTrue = true;
    }
  }
  return {
    // null cuando ningún hijo trae el campo. false afirmable cuando se midió.
    anyTeatro: deptosConFlagPresente === 0 ? null : anyTrue,
    deptosConTeatro,
    deptosConFlagPresente,
  };
}

function computeSilencioVE(
  children: RollupChild[],
): GerenciaRollup['silencioVozExterna'] {
  const list: GerenciaRollup['silencioVozExterna']['deptosMudosConSenalExterna'] =
    [];
  for (const { silencioVE } of children) {
    if (silencioVE && silencioVE.departmentId && silencioVE.departmentName) {
      list.push({
        departmentId: silencioVE.departmentId,
        departmentName: silencioVE.departmentName,
        signalsCount: silencioVE.signalsCount,
      });
    }
  }
  return { deptosMudosConSenalExterna: list, count: list.length };
}

function computeConvergencia(
  children: RollupChild[],
): GerenciaRollup['convergencia'] {
  let worstNivelFinal: NivelFinal | null = null;
  let worstPriority = -1;
  let maxScoreExterno: number | null = null;
  for (const { convergencia } of children) {
    if (!convergencia) continue;
    const nf = convergencia.nivelFinal;
    if (nf != null) {
      const p = NIVEL_FINAL_PRIORITY[nf];
      if (p !== undefined && p > worstPriority) {
        worstPriority = p;
        worstNivelFinal = nf;
      }
    }
    const score = convergencia.convergenciaExterna?.scoreTotal;
    if (typeof score === 'number') {
      if (maxScoreExterno === null || score > maxScoreExterno) {
        maxScoreExterno = score;
      }
    }
  }
  return { worstNivelFinal, maxScoreExterno };
}

function computeDeptosEnRiesgo(children: RollupChild[]): number {
  let n = 0;
  for (const { dept } of children) {
    if (dept?.riskLevel === 'risk' || dept?.riskLevel === 'critical') n++;
  }
  return n;
}

function computeGenero(
  groupName: string,
  standalone: boolean,
  byParent: Map<string, GenderAlertDetail>,
  byDept: Map<string, GenderAlertDetail>,
): GerenciaRollup['genero'] {
  // Non-standalone: match por parentDepartmentName.
  // Standalone: match por departmentName (la gerencia ES el dept directo).
  const hit = standalone
    ? byDept.get(groupName) ?? null
    : byParent.get(groupName) ?? null;
  if (!hit) return { hasAlerta: false, evidenciaGenero: null };
  // evidenciaGenero puede ser '' en payloads legacy — fallback a null para
  // que el deriver pueda decidir degradar la cláusula.
  const cita = hit.evidenciaGenero && hit.evidenciaGenero.length > 0
    ? hit.evidenciaGenero
    : null;
  return { hasAlerta: true, evidenciaGenero: cita };
}

function computeLeyKarin(
  children: RollupChild[],
): GerenciaRollup['leyKarin'] {
  let signalsCount = 0;
  let deptosConSenal = 0;
  for (const { rs } of children) {
    let perDept = 0;
    for (const a of rs.alertas) {
      if (a.producto === 'exit' && LEY_KARIN_ALERT_TYPES_SET.has(a.alertType)) {
        perDept++;
      }
    }
    if (perDept > 0) deptosConSenal++;
    signalsCount += perDept;
  }
  return { signalsCount, deptosConSenal };
}

/** Espejo de `computeLeyKarin` con el set expandido `SENALES_AMBIENTE`.
 *  Filtra alertas Exit cuyo `alertType` está en el set de clima/ambiente
 *  (Karin + toxic_exit + liderazgo). Excluye onboarding/retención. */
function computeSenalesAmbiente(
  children: RollupChild[],
): GerenciaRollup['senalesAmbiente'] {
  let signalsCount = 0;
  let deptosConSenal = 0;
  for (const { rs } of children) {
    let perDept = 0;
    for (const a of rs.alertas) {
      if (a.producto === 'exit' && SENALES_AMBIENTE_SET.has(a.alertType)) {
        perDept++;
      }
    }
    if (perDept > 0) deptosConSenal++;
    signalsCount += perDept;
  }
  return { signalsCount, deptosConSenal };
}

function computeRiesgo(children: RollupChild[]): GerenciaRollup['riesgo'] {
  let maxScore = 0;
  let worstDept: GerenciaRollupWorstDept | null = null;
  for (const { rs } of children) {
    if (worstDept === null || rs.score > maxScore) {
      maxScore = rs.score;
      worstDept = {
        departmentId: rs.departmentId,
        departmentName: rs.departmentName,
        score: rs.score,
        reason: rs.reason,
      };
    }
  }
  return { maxScore, worstDept };
}
