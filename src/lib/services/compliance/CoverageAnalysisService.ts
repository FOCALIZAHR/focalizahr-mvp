// src/lib/services/compliance/CoverageAnalysisService.ts
// ────────────────────────────────────────────────────────────────────────────
// Análisis de cobertura/participación de Ambiente Sano — input del Acto 0
// "La Cobertura" de la Cascada Ejecutiva.
//
// Computa en runtime (no persistido) porque las ExitAlerts y los gold caches
// EXO/EIS cambian post-cierre de campaña. El resultado se inyecta al response
// de /api/compliance/report (rama executive).
//
// Decisión de la rama (A/B/C) que alimenta la narrativa condicional:
//   - A · "silencio esconde lo peor"   → no-participantes peor que participantes
//   - B · "silencio sin alarma"        → no-participantes mejor que participantes
//   - C · "conteos"                    → sin overlap suficiente para comparar
//
// Dependencias:
//   - `computeDepartmentParticipation` (ComplianceAlertService) — fuente única
//     del universo + cobertura + participación.
//   - `ComplianceAlert` (sexta y séptima alertas ya creadas por el orquestador).
//   - `ExitAlert` (señal externa para describir el silencio).
//   - `Department.accumulatedExoScore/EISScore` (gold caches comparativos).
// ────────────────────────────────────────────────────────────────────────────

import { prisma } from '@/lib/prisma';
import { computeDepartmentParticipation } from './ComplianceAlertService';
import { loadAlertasByDeptBulk } from './DepartmentRiskScoreService';
import { deriveAnalyzed } from './buckets';
import type { SilencioCandidate } from './detectSilencioConVozExterna';

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES PROVISIONALES
// ════════════════════════════════════════════════════════════════════════════

/** Mínimo de deptos con score (EXO o EIS) en CADA lado para considerar la
 *  comparativa participantes vs no-participantes.
 *  PROVISIONAL: calibrar con data real cuando haya accounts con EXO/EIS poblado. */
const OVERLAP_MIN = 2;

/** Diferencia mínima de puntos (EXO o EIS) entre participantes y no-participantes
 *  para clasificar como rama A o B. Por debajo del margen, la diferencia se
 *  considera ruido y cae a rama C.
 *  PROVISIONAL: calibrar con data real cuando haya accounts con EXO/EIS poblado. */
const BRANCH_MARGIN = 5;

/** EXO bajo el cual una área no-participante se considera "señal de onboarding bajo".
 *  Escala EXO 0-100 (mayor = mejor). Comentado en computeExoSignal: <50 = crítico.
 *  PROVISIONAL: calibrar con data real. */
const EXO_LOW_THRESHOLD = 50;

/** Severidad del ExitAlert ordenada para elegir el alertType dominante por depto. */
const EXIT_SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Las frases narrativas por alertType viven en CoverageNarrativeDictionary.ts —
// el motor expone solo `exitAlertType` y `exitFactor` por item; el dictionary
// mapea a tokens narrativos + badge legal cuando aplica.

// ════════════════════════════════════════════════════════════════════════════
// TIPOS PÚBLICOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Estado del depto frente al análisis de Ambiente Sano de la campaña.
 * El catálogo es exhaustivo: cualquier depto del universo cae en exactamente uno.
 */
export type CoverageAnalyzedStatus =
  /** Tiene ComplianceAnalysis COMPLETED — entró al motor. */
  | 'completed'
  /** Fue invitado, alguien respondió (1-4) pero quedó bajo el privacy threshold (5). */
  | 'skipped_privacy'
  /** Fue invitado, nadie respondió. */
  | 'no_response'
  /** No entró al universo de invitados de la campaña. */
  | 'not_invited';

export type CoverageBranch = 'A' | 'B' | 'C';

export interface CoverageDeptItem {
  departmentId: string;
  departmentName: string;
  empleadosActivos: number;
  invited: number;
  responded: number;
  /** 0-100, redondeado. null si invited === 0. */
  participationRate: number | null;
  analyzed: CoverageAnalyzedStatus;
  exoScore: number | null;
  eisScore: number | null;
  externalAlertCount: number;
}

export interface SilencioVozExternaItem {
  departmentId: string;
  departmentName: string;
  /** Tipo de señal externa dominante — para badge de fuente del sub-hallazgo. */
  tipoSenal: 'exit' | 'onboarding' | 'otra';
  /** ExitAlert.alertType del dominante (severity más alta). Solo si tipoSenal='exit'.
   *  El dictionary lo mapea a frase narrativa + badge legal cuando aplica. */
  exitAlertType: string | null;
  /** ExitAlert.triggerFactor del dominante. Solo si tipoSenal='exit' y existe. */
  exitFactor: string | null;
}

export interface ParticipacionAnomalaItem {
  departmentId: string;
  departmentName: string;
  /** Tasa de participación 0-100, redondeada. */
  rate: number;
}

export interface CoverageAnalysisResult {
  /** Total de deptos del universo visible (filtrado por RBAC si aplica). */
  totalDeptos: number;
  /** Deptos con ComplianceAnalysis COMPLETED. */
  deptosConVoz: number;
  /** 0-100, redondeado. (deptosConVoz / totalDeptos) * 100. */
  pctCobertura: number;

  /** Rama narrativa activa — alimenta el switch del componente. */
  rama: CoverageBranch;

  /** Sub-hallazgo 2 — deptos no escuchados pero con ExitAlerts activas. */
  silencioConVozExterna: SilencioVozExternaItem[];
  /** Sub-hallazgo 3 — outliers de participación (séptima alerta). */
  participacionAnomala: ParticipacionAnomalaItem[];

  /** Lista completa per-depto para el modal de apoyo. */
  deptosCobertura: CoverageDeptItem[];

  /** Promedios que decidieron la rama. null si no hay overlap suficiente. */
  avgExoParticipantes: number | null;
  avgExoNoParticipantes: number | null;
  avgEisParticipantes: number | null;
  avgEisNoParticipantes: number | null;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

/**
 * Analiza cobertura/participación de una campaña Ambiente Sano y decide la
 * rama narrativa del Acto 0. Runtime — no persiste, se invoca desde route.ts.
 *
 * @param visibleDeptIds — set de departmentIds visibles para el caller (RBAC).
 *                         Si presente, filtra el universo (AREA_MANAGER scope).
 */
export async function computeCoverageAnalysis(
  campaignId: string,
  accountId: string,
  visibleDeptIds?: Set<string>,
): Promise<CoverageAnalysisResult> {
  // 1. Universo + cobertura + participación (helper compartido).
  const { universo, partByDept } = await computeDepartmentParticipation(
    accountId,
    campaignId,
  );

  // 2. RBAC: AREA_MANAGER ve solo su jerarquía.
  const universoVisible = visibleDeptIds
    ? universo.filter((d) => visibleDeptIds.has(d.id))
    : universo;

  if (universoVisible.length === 0) {
    return {
      totalDeptos: 0,
      deptosConVoz: 0,
      pctCobertura: 0,
      rama: 'C',
      silencioConVozExterna: [],
      participacionAnomala: [],
      deptosCobertura: [],
      avgExoParticipantes: null,
      avgExoNoParticipantes: null,
      avgEisParticipantes: null,
      avgEisNoParticipantes: null,
    };
  }

  const deptIdsVisible = universoVisible.map((d) => d.id);

  // 3. EXO/EIS gold caches per depto.
  const goldRows = await prisma.department.findMany({
    where: { id: { in: deptIdsVisible } },
    select: {
      id: true,
      accumulatedExoScore: true,
      accumulatedEISScore: true,
    },
  });
  const goldByDept = new Map(goldRows.map((r) => [r.id, r]));

  // 4. Status de análisis per depto (COMPLETED|FAILED|PENDING|ausente).
  const analyses = await prisma.complianceAnalysis.findMany({
    where: {
      campaignId,
      scope: 'DEPARTMENT',
      departmentId: { in: deptIdsVisible },
    },
    select: { departmentId: true, status: true },
  });
  const analysisStatusByDept = new Map(
    analyses
      .filter((a) => a.departmentId)
      .map((a) => [a.departmentId!, a.status]),
  );

  // 5. ExitAlerts activas por depto (para describir el silencio con voz externa).
  const exitAlerts = await prisma.exitAlert.findMany({
    where: {
      accountId,
      status: { in: ['pending', 'acknowledged'] },
      departmentId: { in: deptIdsVisible },
    },
    select: {
      departmentId: true,
      alertType: true,
      severity: true,
      triggerFactor: true,
    },
  });
  const exitAlertsByDept = new Map<
    string,
    Array<{ alertType: string; severity: string; triggerFactor: string | null }>
  >();
  for (const a of exitAlerts) {
    const arr = exitAlertsByDept.get(a.departmentId) ?? [];
    arr.push({
      alertType: a.alertType,
      severity: a.severity,
      triggerFactor: a.triggerFactor,
    });
    exitAlertsByDept.set(a.departmentId, arr);
  }

  // 6. ComplianceAlerts de la sexta y séptima — fuente canónica de los items.
  const compAlerts = await prisma.complianceAlert.findMany({
    where: {
      campaignId,
      alertType: { in: ['silencio_con_voz_externa', 'participacion_anomala'] },
      status: { in: ['pending', 'acknowledged'] },
      departmentId: { in: deptIdsVisible },
    },
    select: {
      alertType: true,
      departmentId: true,
      triggerScore: true,
      department: { select: { displayName: true } },
    },
  });

  // 7. Lista per-depto para el modal.
  const deptosCobertura: CoverageDeptItem[] = universoVisible.map((dept) => {
    const part = partByDept.get(dept.id);
    const invited = part?.invited ?? 0;
    const responded = part?.responded ?? 0;
    const participationRate =
      invited > 0 ? Math.round((responded / invited) * 100) : null;
    const status = analysisStatusByDept.get(dept.id);
    const gold = goldByDept.get(dept.id);
    const externalAlertCount = exitAlertsByDept.get(dept.id)?.length ?? 0;

    const analyzed = deriveAnalyzed({ status, invited, responded });

    return {
      departmentId: dept.id,
      departmentName: dept.displayName,
      empleadosActivos: dept.empleadosActivos,
      invited,
      responded,
      participationRate,
      analyzed,
      exoScore: gold?.accumulatedExoScore ?? null,
      eisScore: gold?.accumulatedEISScore ?? null,
      externalAlertCount,
    };
  });

  // 8. Cobertura agregada.
  const totalDeptos = deptosCobertura.length;
  const deptosConVoz = deptosCobertura.filter(
    (d) => d.analyzed === 'completed',
  ).length;
  const pctCobertura =
    totalDeptos > 0 ? Math.round((deptosConVoz / totalDeptos) * 100) : 0;

  // 9. Sub-hallazgo "Silencio con voz externa" — desde la sexta alerta.
  // Por item se determina el tipo de señal dominante (exit con factor, onboarding
  // bajo, u otra) para que el dictionary arme la línea narrativa correspondiente.
  const silencioConVozExterna: SilencioVozExternaItem[] = compAlerts
    .filter((a) => a.alertType === 'silencio_con_voz_externa' && a.departmentId)
    .map((a) => {
      const deptId = a.departmentId!;
      const deptName =
        a.department?.displayName ??
        deptosCobertura.find((d) => d.departmentId === deptId)?.departmentName ??
        'Sin nombre';
      const exits = exitAlertsByDept.get(deptId) ?? [];
      const gold = goldByDept.get(deptId);

      let tipoSenal: 'exit' | 'onboarding' | 'otra' = 'otra';
      let exitAlertType: string | null = null;
      let exitFactor: string | null = null;

      if (exits.length > 0) {
        tipoSenal = 'exit';
        const dominant = [...exits].sort(
          (x, y) =>
            (EXIT_SEVERITY_ORDER[y.severity] ?? 0) -
            (EXIT_SEVERITY_ORDER[x.severity] ?? 0),
        )[0];
        exitAlertType = dominant.alertType;
        exitFactor = dominant.triggerFactor?.trim() || null;
      } else if (
        gold?.accumulatedExoScore !== null &&
        gold?.accumulatedExoScore !== undefined &&
        gold.accumulatedExoScore < EXO_LOW_THRESHOLD
      ) {
        tipoSenal = 'onboarding';
      }

      return {
        departmentId: deptId,
        departmentName: deptName,
        tipoSenal,
        exitAlertType,
        exitFactor,
      };
    });

  // 10. Sub-hallazgo "Participación anómala" — desde la séptima alerta.
  const participacionAnomala: ParticipacionAnomalaItem[] = compAlerts
    .filter((a) => a.alertType === 'participacion_anomala' && a.departmentId)
    .map((a) => ({
      departmentId: a.departmentId!,
      departmentName: a.department?.displayName ?? 'Sin nombre',
      rate: Math.round(a.triggerScore ?? 0),
    }));

  // 11. Comparativa EXO/EIS participantes vs no-participantes.
  const participantes = deptosCobertura.filter(
    (d) => d.analyzed === 'completed',
  );
  const noParticipantes = deptosCobertura.filter(
    (d) => d.analyzed !== 'completed',
  );

  const mean = (xs: (number | null)[]): number | null => {
    const v = xs.filter((x): x is number => x !== null);
    return v.length > 0 ? v.reduce((s, x) => s + x, 0) / v.length : null;
  };
  const round1 = (x: number | null): number | null =>
    x === null ? null : Math.round(x * 10) / 10;

  const exoP = mean(participantes.map((d) => d.exoScore));
  const exoNP = mean(noParticipantes.map((d) => d.exoScore));
  const eisP = mean(participantes.map((d) => d.eisScore));
  const eisNP = mean(noParticipantes.map((d) => d.eisScore));

  // 12. Decisión de rama A/B/C.
  // Preferencia: EXO si hay overlap, sino EIS, sino C (sin comparativa).
  const exoCountP = participantes.filter((d) => d.exoScore !== null).length;
  const exoCountNP = noParticipantes.filter((d) => d.exoScore !== null).length;
  const eisCountP = participantes.filter((d) => d.eisScore !== null).length;
  const eisCountNP = noParticipantes.filter((d) => d.eisScore !== null).length;

  const overlapEXO = exoCountP >= OVERLAP_MIN && exoCountNP >= OVERLAP_MIN;
  const overlapEIS = eisCountP >= OVERLAP_MIN && eisCountNP >= OVERLAP_MIN;

  let rama: CoverageBranch = 'C';
  if (overlapEXO && exoP !== null && exoNP !== null) {
    if (exoNP < exoP - BRANCH_MARGIN) rama = 'A';
    else if (exoNP > exoP + BRANCH_MARGIN) rama = 'B';
  } else if (overlapEIS && eisP !== null && eisNP !== null) {
    if (eisNP < eisP - BRANCH_MARGIN) rama = 'A';
    else if (eisNP > eisP + BRANCH_MARGIN) rama = 'B';
  }

  return {
    totalDeptos,
    deptosConVoz,
    pctCobertura,
    rama,
    silencioConVozExterna,
    participacionAnomala,
    deptosCobertura,
    avgExoParticipantes: round1(exoP),
    avgExoNoParticipantes: round1(exoNP),
    avgEisParticipantes: round1(eisP),
    avgEisNoParticipantes: round1(eisNP),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// OTRO MUNDO — Fuente paralela company-scope (deptos no invitados a la campaña)
// ════════════════════════════════════════════════════════════════════════════
//
// Spec: `.claude/tasks/MODELO_SEXTA_OTRO_MUNDO_AMBIENTE_SANO.md` §6 (d).
//
// Por qué existe esto: post-fix cf0be7c, el universo campaign-scope
// (`computeDepartmentParticipation`) NUNCA incluye deptos con `invited === 0`.
// La rama `analyzed='not_invited'` quedó como código muerto en el path de
// campaña — `coverage.deptosCobertura[]` y `riskScores[]` no traen OTRO MUNDO.
// Para detectar el punto ciego ("hay señal externa en deptos que ni siquiera
// participaron del estudio") necesitamos una fuente PARALELA company-scope.
//
// Diseño:
//   1. Universo company-scope (deptos activos con empleados activos).
//   2. Setdiff vs universo campaign-scope (reuso de `computeDepartmentParticipation`).
//   3. Carga de externas con `loadAlertasByDeptBulk` — el MISMO loader que
//      alimenta `riskScores[].alertas[]` y por lo tanto la SEXTA post-refactor.
//      UN solo loader compartido → paso b unifica la ventana desde un único
//      punto, sin múltiples superficies.
//   4. Retorno de `SilencioCandidate[]` con `analyzed: 'not_invited'`. El
//      filtro `pesoEfectivo >= umbral` lo hace el MOTOR puro
//      (`detectSilencioConVozExterna`) — fuente única del filtrado de peso.
// ════════════════════════════════════════════════════════════════════════════

/** Loader default del universo company-scope. Exportado solo para que el
 *  test pueda referenciar su shape; los consumidores reales usan
 *  `computeOtroMundo` que ya lo invoca por default. */
async function defaultLoadCompanyDeptos(
  accountId: string,
): Promise<Array<{ id: string; displayName: string }>> {
  // Mismas reglas que `computeDepartmentParticipation` excepto el filtro
  // `participants: { some: { campaignId } }` — esa es justo la diferencia.
  return prisma.department.findMany({
    where: {
      accountId,
      isActive: true,
      employees: { some: { isActive: true } },
    },
    select: { id: true, displayName: true },
  });
}

/** Dependencias inyectables de `computeOtroMundo`. **Solo testing.** En
 *  producción usar la firma de 3 args (los defaults apuntan a los loaders
 *  canónicos). */
export interface ComputeOtroMundoDeps {
  loadCampaignUniverse: typeof computeDepartmentParticipation;
  loadCompanyDeptos: typeof defaultLoadCompanyDeptos;
  loadAlertasByDept: typeof loadAlertasByDeptBulk;
}

/**
 * Identifica deptos del account que NO fueron invitados a la campaña pero
 * tienen señal externa activa. Output listo para alimentar al motor puro
 * `detectSilencioConVozExterna(candidatos, 'no_invitado', umbralPeso)`.
 *
 * RBAC: NO filtra por scope — el gate por rol vive en el caller (`route.ts`).
 * OTRO MUNDO es CEO/admin-only (patrón Beat 5); para AREA_MANAGER el caller
 * NO invoca esta función (return `[]` directo).
 *
 * @param accountId  Cuenta del caller.
 * @param campaignId Campaña contra la que se calcula el setdiff.
 * @param now        Reloj inyectable (testing). Default: new Date().
 * @param __deps     **Solo testing** — overrides de loaders. NO usar en
 *                   producción; los defaults son los loaders canónicos.
 */
export async function computeOtroMundo(
  accountId: string,
  campaignId: string,
  now: Date = new Date(),
  __deps?: Partial<ComputeOtroMundoDeps>,
): Promise<SilencioCandidate[]> {
  const loadCampaignUniverse =
    __deps?.loadCampaignUniverse ?? computeDepartmentParticipation;
  const loadCompanyDeptos =
    __deps?.loadCompanyDeptos ?? defaultLoadCompanyDeptos;
  const loadAlertasByDept =
    __deps?.loadAlertasByDept ?? loadAlertasByDeptBulk;

  // 1. Universo campaign-scope (fuente única, ya filtrado por participants).
  const { universo: campaignUniverse } = await loadCampaignUniverse(
    accountId,
    campaignId,
  );
  const campaignDeptIds = new Set(campaignUniverse.map((d) => d.id));

  // 2. Universo company-scope (deptos activos con empleados activos).
  const companyDepts = await loadCompanyDeptos(accountId);

  // 3. Setdiff: deptos en company que NO están en la campaña.
  const noInvitadoDepts = companyDepts.filter(
    (d) => !campaignDeptIds.has(d.id),
  );
  if (noInvitadoDepts.length === 0) return [];

  const noInvitadoDeptIds = noInvitadoDepts.map((d) => d.id);

  // 4. Carga bulk reusando el loader canónico — mismo que alimenta
  //    `riskScores[].alertas[]` (consumido por SEXTA tras Paso 5). UN solo
  //    loader compartido para ambas superficies. `ExternalAlertSummary` es
  //    estructuralmente idéntico a `DepartmentRiskAlertItem` (mismo shape).
  const alertasByDept = await loadAlertasByDept(
    accountId,
    noInvitadoDeptIds,
    now,
  );

  // 5. Emitir SilencioCandidate[] — solo deptos con ≥1 alerta cargada.
  //    El filtro fino `pesoEfectivo >= umbral` lo decide el motor puro.
  const result: SilencioCandidate[] = [];
  for (const dept of noInvitadoDepts) {
    const alertas = alertasByDept.get(dept.id) ?? [];
    if (alertas.length === 0) continue;
    result.push({
      departmentId: dept.id,
      departmentName: dept.displayName,
      analyzed: 'not_invited',
      alertas,
    });
  }

  return result;
}
