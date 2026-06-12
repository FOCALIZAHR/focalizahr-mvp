// ═══════════════════════════════════════════════════════════════════
// buildTriageGroups — Beat 2 (El Triage) · GATE 2a (grupos narrativos)
// src/lib/services/compliance/buildTriageGroups.ts
// ═══════════════════════════════════════════════════════════════════
// Pure function — sin async, sin DB, sin LLM. Lee el ComplianceReportResponse
// completo, ejecuta `buildGerenciaRollup` (autoridad de la lista de gerencias)
// y agrupa por LECTURA del DepartmentRiskNarrativeDictionary.
//
// PRINCIPIO DE DISEÑO (aprobado Victor 2026-06-11):
//   La narrativa pertenece al TIPO, no a la gerencia. El grupo = lectura del
//   dictionary (no el badge visual): misma lectura → se narra UNA vez con todas
//   las instancias nombradas; lecturas distintas → grupos hermanos bajo la misma
//   familia. Nivel narrativo del acto = GERENCIA (rollup); el departamento es
//   detalle del modal 2b.
//
// MODELO CONFIRMADO: gerencia = PEOR dept (`riesgo.maxScore` + lectura/drivers
//   del `worstDept`, lookup en `riskScores[]` por `worstDept.departmentId`).
//   Si la gerencia tiene >1 depto hijo → la instancia anota el origen
//   ("— vía {worstDept}"). 1 depto / standalone → sin anotación.
//
// REGLA PUENTE vigente: este código nuevo NO importa `getISARiskLevel`; el
//   nivel ISA (si se necesitara) iría por `classifyIsa`. Acá el Triage no
//   clasifica ISA — agrupa por la lectura del score de riesgo per-dept.
//
// Caveat resuelto: NO se usa la agrupación simplificada del script de datos
//   (duplicaba "Gerencia Comercial"). `buildGerenciaRollup` consolida el merge
//   de ancestro → lista autoritativa.
// ═══════════════════════════════════════════════════════════════════

import { buildGerenciaRollup } from './buildGerenciaRollup';
import type { GerenciaRollup } from './buildGerenciaRollup';
import {
  resolveDepartmentRiskNarrative,
  type DepartmentRiskNarrative,
  type DepartmentRiskNarrativeState,
} from './DepartmentRiskNarrativeDictionary';
import type {
  ComplianceReportResponse,
  DepartmentRiskScore,
  SilencioVozExternaItem,
  OtroMundoItem,
} from '@/types/compliance';

// ════════════════════════════════════════════════════════════════════════════
// TIPOS DE SALIDA
// ════════════════════════════════════════════════════════════════════════════

export type TriageFamily = DepartmentRiskNarrativeState;

/** Clave de lectura — el grupo narrativo. HUMO se sub-divide por rama (cada
 *  rama es una lectura distinta del dictionary → grupo hermano). */
export type TriageLecturaKey =
  | 'FUEGO'
  | 'HUMO/A-legal'
  | 'HUMO/A'
  | 'HUMO/B'
  | 'PUNTO_CIEGO'
  | 'CONFIABLE';

export interface TriageInstance {
  gerenciaId: string;
  /** Nombre crudo de la gerencia (el render aplica formatDepartmentName). */
  gerenciaName: string;
  /** = rollup.riesgo.maxScore (= score del peor dept). */
  score: number;
  /** Driver confiabilidad del peor dept → se narra como "silencio". */
  silencio: number;
  /** Driver voz_externa del peor dept → se narra como "señales". */
  senales: number;
  /** Nombre crudo del peor dept SOLO si la gerencia tiene >1 hijo. null si
   *  standalone / 1 hijo (la gerencia ES el dept que define el score).
   *  En el acto 2c se narra como "el foco" (Gate 2c §1). */
  viaWorstDept: string | null;
  /** Id del peor dept (el que define el score). Para dedupe de Sexta/OTRO MUNDO. */
  worstDeptId: string;
  /** Narrativa singular VERBATIM del dictionary (FUEGO ya con [Área] sustituido).
   *  Se usa para el grupo cuando count === 1. */
  narrativaVerbatim: string;
}

export interface TriageGroup {
  key: TriageLecturaKey;
  family: TriageFamily;
  /** "EN FUEGO" · "EN HUMO" · "PUNTO CIEGO" · "CONFIABLE". */
  familyLabel: string;
  /** Título de lectura. PROVISIONAL — el dictionary no trae títulos; estos
   *  quedan propuestos para visto de Victor (HANDOFF §"Nombres de lecturas"). */
  lecturaKicker: string;
  /** `{familyLabel} · {lecturaKicker}` — el kicker uppercase del grupo. */
  kicker: string;
  count: number;
  /** Gate 2c §2 — true si count>1 y TODAS las instancias comparten el mismo
   *  score. El render factoriza el número al kicker y lista solo nombres. */
  homogeneous: boolean;
  /** Score compartido cuando homogeneous; null si no. */
  sharedScore: number | null;
  instances: TriageInstance[];
  /** Narrativa del TIPO, UNA vez. Singular = verbatim del dictionary; plural =
   *  adaptación gramatical APROBADA (solo número), ver NARRATIVA_PLURAL. */
  narrativa: string;
  /** Link al modal 2b. "Ver gerencia y sus departamentos →" (1) /
   *  "Ver las {n} y sus departamentos →" (>1). */
  link: string;
}

export interface TriageActo {
  hero: { number: string; label: string; sub: string | null };
  /** Intro conectora APROBADA (copy §2a-3). */
  intro: string;
  groups: TriageGroup[];
  /** Línea "no es parejo" migrada del Beat 1 con guard. null si <3 gerencias
   *  con ISA o mejor==peor (en el caso real NO se emite). */
  extremosLine: string | null;
  counts: { fuego: number; humo: number; puntoCiego: number; confiable: number };
  /** Sexta alerta — SOLO entidades NO nombradas en los grupos (dedupe, decisión
   *  Victor 2026-06-11). Banda vacía tras dedupe → el render no la emite. */
  sexta: SilencioVozExternaItem[];
  /** OTRO MUNDO — mismo dedupe contra los grupos. */
  otroMundo: OtroMundoItem[];
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES — labels, orden editorial, kickers provisionales, plurales
// ════════════════════════════════════════════════════════════════════════════

export const FAMILY_LABEL: Record<TriageFamily, string> = {
  FUEGO: 'EN FUEGO',
  HUMO: 'EN HUMO',
  PUNTO_CIEGO: 'PUNTO CIEGO',
  CONFIABLE: 'CONFIABLE',
};

/** Orden editorial: fuego → humo (A-legal → A → B por peligro) → punto ciego →
 *  confiable (cierra dando contraste). */
const LECTURA_ORDER: Record<TriageLecturaKey, number> = {
  FUEGO: 0,
  'HUMO/A-legal': 1,
  'HUMO/A': 2,
  'HUMO/B': 3,
  PUNTO_CIEGO: 4,
  CONFIABLE: 5,
};

/** Títulos de lectura PROVISIONALES (el dictionary no los trae). Propuestos
 *  para visto de Victor. Derivados del cuerpo de cada narrativa (excepto los
 *  dos del mockup: A-legal y B). */
export const LECTURA_KICKER: Record<TriageLecturaKey, string> = {
  FUEGO: 'Denuncia formal registrada', // reusa label aprobado de buildFuegoBadge
  'HUMO/A-legal': 'Señal legal tras el silencio', // mockup
  'HUMO/A': 'Fuga de talento en gestación',
  'HUMO/B': 'Fricción en la entrada', // mockup
  PUNTO_CIEGO: 'Gestión sin radar',
  CONFIABLE: 'Métrica validada',
};

// ────────────────────────────────────────────────────────────────────────────
// NARRATIVA_PLURAL — adaptación gramatical APROBADA (solo número) de las 6
// lecturas verbatim del DepartmentRiskNarrativeDictionary. Singular se toma
// verbatim del resolver; plural vive acá (cuando un grupo tiene >1 instancia).
// Cambios: solo número gramatical (equipo→equipos, registra→registran, esta
// área→estas áreas, etc.). Drift-guard: `buildTriageGroups.test.ts` asserta que
// el singular del resolver no cambió respecto del esperado.
// ────────────────────────────────────────────────────────────────────────────
const NARRATIVA_PLURAL: Record<TriageLecturaKey, string> = {
  FUEGO:
    'El riesgo en estas áreas ya no es algo por anticipar: una denuncia formal por Ley Karin fijó el nivel al máximo e invalidó la lectura oficial. El sistema entero existe para evitar llegar acá — en estas áreas el límite ya se cruzó.',
  'HUMO/A-legal':
    'Estos equipos guardan silencio masivo en los canales oficiales, pero quienes se fueron dejaron una señal de Ley Karin. Esto no es rotación: es un riesgo jurídico en formación, del tipo que suele preceder a una denuncia formal. Actuar sobre la señal ahora es lo que separa la prevención de un pasivo legal activo.',
  'HUMO/A':
    'Los equipos actuales guardan silencio masivo en los canales oficiales, pero los que se fueron dejaron un patrón claro. Aún no es un conflicto formal; es el indicador predictivo de una fuga de talento en gestación. Mientras sea una alerta temprana, existe una ventana operativa para intervenir.',
  'HUMO/B':
    'El núcleo de estos equipos no reporta, pero el talento nuevo detecta fricción en sus primeros 90 días. Cuando el rechazo cultural ocurre en la fase de entrada, no es un problema de adaptación individual; es una falla estructural en el ciclo de vida de estas áreas.',
  PUNTO_CIEGO:
    'Ceguera operativa. Estos equipos no participaron en la medición interna y no registran señales de alerta externas. No asumas que existe una crisis oculta, pero ten en cuenta que en estas áreas estás gestionando sin radar.',
  CONFIABLE:
    'Métrica validada. El nivel de participación interna es sólido y el comportamiento externo no muestra contradicciones. La foto que entrega la medición oficial es el reflejo real de estos equipos.',
};

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

/** Clave de lectura desde la narrativa per-dept. HUMO → `HUMO/${rama}`. */
export function lecturaKeyOf(n: DepartmentRiskNarrative): TriageLecturaKey {
  if (n.state === 'HUMO') {
    return `HUMO/${n.rama ?? 'A'}` as TriageLecturaKey;
  }
  return n.state as TriageLecturaKey;
}

/** Línea de instancia (acto, grupo NO homogéneo). Gate 2c §1: idioma de gerente
 *  — unidad y escala siempre presentes; la composición aritmética vive SOLO en
 *  el modal. "el foco" reemplaza a "vía". El render reconstruye esto con sus
 *  tramos coloreados (nombre title-cased en display). */
export function triageInstanceLine(inst: TriageInstance): string {
  let line = `${inst.gerenciaName} · riesgo ${inst.score} de 100`;
  if (inst.viaWorstDept) line += ` — el foco: ${inst.viaWorstDept}`;
  return line;
}

/** Nombre de instancia para la línea corrida del grupo homogéneo (Gate 2c §2):
 *  solo el nombre, con `(foco: {worstDept})` cuando aplique. Sin score (va al
 *  kicker factorizado). */
export function triageInstanceName(inst: TriageInstance): string {
  return inst.viaWorstDept
    ? `${inst.gerenciaName} (foco: ${inst.viaWorstDept})`
    : inst.gerenciaName;
}

/** Kicker factorizado del grupo homogéneo (Gate 2c §2):
 *  `{kicker} · {n} gerencias · riesgo {score} de 100 cada una`. */
export function triageFactoredKicker(group: TriageGroup): string {
  return `${group.kicker} · ${group.count} gerencias · riesgo ${group.sharedScore} de 100 cada una`;
}

/** Intro conectora APROBADA (copy §2a-3). {pct} = personResponseRate. */
export function buildTriageIntro(
  pct: number,
  conVoz: number,
  total: number,
  mudas: number,
): string {
  return (
    `El ${pct}% que respondió se concentra en ${conVoz} de las ${total} gerencias. ` +
    `En las otras ${mudas} el índice no llega — y ahí, las señales externas son la única lectura disponible.`
  );
}

/** Link del grupo al modal 2b (Gate 2c §3 — texto corto). */
function buildGroupLink(count: number): string {
  return count > 1
    ? `Ver las ${count} y sus departamentos →`
    : 'Ver departamentos →';
}

/** Línea "no es parejo" — migrada del Beat 1 (`buildExtremosLine`) con guard
 *  adicional: NO emitir si <3 gerencias con ISA medido o mejor==peor. En el
 *  caso real (todas sub_threshold) NO se emite. Copy verbatim del Beat 1. */
export function buildTriageExtremosLine(rollups: GerenciaRollup[]): string | null {
  const conIsa = rollups.filter((r) => r.isa.weighted !== null);
  if (conIsa.length < 3) return null;
  let mejor = conIsa[0];
  let peor = conIsa[0];
  for (const r of conIsa) {
    if ((r.isa.weighted as number) > (mejor.isa.weighted as number)) mejor = r;
    if ((r.isa.weighted as number) < (peor.isa.weighted as number)) peor = r;
  }
  if (mejor.groupId === peor.groupId) return null;
  if ((mejor.isa.weighted as number) === (peor.isa.weighted as number)) return null;
  return `El ambiente no es parejo: ${mejor.groupName} es el área más sólida (ISA ${Math.round(
    mejor.isa.weighted as number,
  )}) y ${peor.groupName} la más frágil (ISA ${Math.round(peor.isa.weighted as number)}).`;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

export function buildTriageGroups(data: ComplianceReportResponse): TriageActo {
  const rollups = buildGerenciaRollup(data);
  const riskScores = data.data.riskScores ?? [];
  const rsById = new Map<string, DepartmentRiskScore>(
    riskScores.map((rs) => [rs.departmentId, rs]),
  );

  // ── Instancias por lectura ──────────────────────────────────────────────
  const byKey = new Map<TriageLecturaKey, TriageInstance[]>();
  for (const rollup of rollups) {
    const worst = rollup.riesgo.worstDept;
    if (!worst) continue;
    const rs = rsById.get(worst.departmentId);
    if (!rs) continue;
    const narrative = resolveDepartmentRiskNarrative(rs);
    if (!narrative) continue; // con_isa + alertas sin denuncia → cubierto upstream.

    const key = lecturaKeyOf(narrative);
    const silencio = narrative.chip.confiabilidad;
    const senales = narrative.chip.alertasExternas;
    const inst: TriageInstance = {
      gerenciaId: rollup.groupId,
      gerenciaName: rollup.groupName,
      score: rollup.riesgo.maxScore,
      silencio,
      senales,
      // "vía/foco" SOLO cuando el peor dept es un hijo genuino — no la gerencia
      // misma. En el merge de ancestro (Comercial: gerencia level-2 invitada
      // directa Y con hijos) el worstDept ES la gerencia (groupId === deptId);
      // anotar "vía Gerencia Comercial" sería "vía sí misma". Se suprime.
      viaWorstDept:
        rollup.totalChildren > 1 && worst.departmentId !== rollup.groupId
          ? worst.departmentName
          : null,
      worstDeptId: worst.departmentId,
      narrativaVerbatim: narrative.narrativa,
    };
    const list = byKey.get(key) ?? [];
    list.push(inst);
    byKey.set(key, list);
  }

  // ── Ensamblar grupos (orden editorial; instancias por score desc + alfa) ──
  const groups: TriageGroup[] = [];
  for (const [key, instancesRaw] of byKey.entries()) {
    const instances = [...instancesRaw].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.gerenciaName.localeCompare(b.gerenciaName);
    });
    const family = (key.startsWith('HUMO') ? 'HUMO' : key) as TriageFamily;
    const familyLabel = FAMILY_LABEL[family];
    const lecturaKicker = LECTURA_KICKER[key];
    const count = instances.length;
    const homogeneous =
      count > 1 && instances.every((i) => i.score === instances[0].score);
    groups.push({
      key,
      family,
      familyLabel,
      lecturaKicker,
      kicker: `${familyLabel} · ${lecturaKicker}`,
      count,
      homogeneous,
      sharedScore: homogeneous ? instances[0].score : null,
      instances,
      narrativa: count > 1 ? NARRATIVA_PLURAL[key] : instances[0].narrativaVerbatim,
      link: buildGroupLink(count),
    });
  }
  groups.sort((a, b) => LECTURA_ORDER[a.key] - LECTURA_ORDER[b.key]);

  // ── Conteos por familia (para el sub del hero) ──────────────────────────
  const counts = { fuego: 0, humo: 0, puntoCiego: 0, confiable: 0 };
  for (const g of groups) {
    if (g.family === 'FUEGO') counts.fuego += g.count;
    else if (g.family === 'HUMO') counts.humo += g.count;
    else if (g.family === 'PUNTO_CIEGO') counts.puntoCiego += g.count;
    else if (g.family === 'CONFIABLE') counts.confiable += g.count;
  }

  // ── Hero (coverageGapPct, dept-level) ───────────────────────────────────
  // Gate 2c §4: el sub-label aclara que el universo es el MAPA dept-level
  // (distinto del {pct} person-level de la intro).
  const coverageGapPct = 100 - (data.data.coverage?.pctCobertura ?? 100);
  const heroLabel = `del mapa de gerencias, ${
    coverageGapPct === 100 ? 'en silencio total' : 'sin voz medible'
  }`;
  const subParts = [
    counts.fuego > 0 ? `${counts.fuego} en fuego` : null,
    counts.humo > 0 ? `${counts.humo} en humo` : null,
    counts.puntoCiego > 0 ? `${counts.puntoCiego} punto ciego` : null,
    counts.confiable > 0 ? `${counts.confiable} confiable` : null,
  ].filter(Boolean) as string[];

  // ── Intro (personResponseRate + partición responded de gerencias) ───────
  let invited = 0;
  let responded = 0;
  let conVoz = 0;
  for (const r of rollups) {
    invited += r.silencio.invited;
    responded += r.silencio.responded;
    if (r.silencio.responded > 0) conVoz++;
  }
  const pct = invited > 0 ? Math.round((responded / invited) * 100) : 0;
  const total = rollups.length;
  const mudas = total - conVoz;
  const intro = buildTriageIntro(pct, conVoz, total, mudas);

  // ── Dedupe Sexta / OTRO MUNDO (decisión Victor): solo entidades NO nombradas
  //    en los grupos. Named = peor dept de cada grupo (cubre vía + ancestro)
  //    ∪ id de gerencia cuando es real (no el prefijo standalone `__dept__:`). ─
  const namedIds = new Set<string>();
  for (const g of groups) {
    for (const inst of g.instances) {
      namedIds.add(inst.worstDeptId);
      if (!inst.gerenciaId.startsWith('__dept__:')) namedIds.add(inst.gerenciaId);
    }
  }
  const notNamed = (id: string | null): boolean => id === null || !namedIds.has(id);
  const sexta = (data.data.silencioVozExterna ?? []).filter((s) =>
    notNamed(s.departmentId),
  );
  const otroMundo = (data.data.otroMundo ?? []).filter((o) =>
    notNamed(o.departmentId),
  );

  return {
    hero: {
      number: `${coverageGapPct}%`,
      label: heroLabel,
      sub: subParts.length > 0 ? subParts.join(' · ') : null,
    },
    intro,
    groups,
    extremosLine: buildTriageExtremosLine(rollups),
    counts,
    sexta,
    otroMundo,
  };
}
