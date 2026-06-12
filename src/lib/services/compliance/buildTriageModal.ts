// ═══════════════════════════════════════════════════════════════════
// buildTriageModal — Beat 2 (El Triage) · GATE 2b (modal "ver más")
// src/lib/services/compliance/buildTriageModal.ts
// ═══════════════════════════════════════════════════════════════════
// Pure function — el detalle de un grupo del Triage 2a. Reusa
// `buildTriageGroups` (fuente única del nivel de grupo: narrativa verbatim /
// plural + kicker) y le agrega el DETALLE por gerencia que el acto no muestra:
// score narrado, explicación de drivers, lo declarado, lo que dicen las señales
// y SUS DEPARTAMENTOS (de `riskScores[]`, jerarquía del rollup).
//
// REGLA DE COMPOSICIÓN (contrato §3):
//   - Grupo de 1 gerencia  → modal INDIVIDUAL completo (todos los slots §2b).
//   - Grupo multi-gerencia → modal de GRUPO: bloques compactos por gerencia
//     (header + score narrado + sus departamentos), narrativa del tipo UNA vez.
//
// COPY: §2b-3 (drivers) y §2b-8 (pie) son VERBATIM aprobados. §2b-6 veredicto =
//   narrativa del dictionary verbatim (vía buildTriageGroups). §2b-4 "Nada
//   medible…" y §2b-5 "lo que las señales dicen" son PROPUESTOS para visto de
//   Victor (el contrato los describe, no los cita) — marcados abajo.
//
// Reglas heredadas: null ≠ 0 (denuncia) · denuncia ≠ indicio, JAMÁS sumados ·
//   ISA al lado solo en con_isa · señales de `riskScores[].alertas[]` (hecho,
//   no estado) · regla puente: nivel ISA vía `classifyIsa`.
// ═══════════════════════════════════════════════════════════════════

import {
  buildTriageGroups,
  type TriageFamily,
  type TriageLecturaKey,
  FAMILY_LABEL,
  LECTURA_KICKER,
} from './buildTriageGroups';
import {
  buildGerenciaRollup,
  type GerenciaRollup,
} from './buildGerenciaRollup';
import { resolveDepartmentRiskNarrative } from './DepartmentRiskNarrativeDictionary';
import { LEY_KARIN_ALERT_TYPES } from '@/config/compliance/convergenciaWeights';
import {
  classifyIsa,
  ISA_NARRATIVES,
} from '@/app/dashboard/compliance/components/sections/SectionDimensiones/_shared/constants';
import type {
  ComplianceReportResponse,
  DepartmentRiskScore,
} from '@/types/compliance';

// ════════════════════════════════════════════════════════════════════════════
// COPY
// ════════════════════════════════════════════════════════════════════════════

// §2b-3 — APROBADO (verbatim). Dos oraciones que se muestran según qué driver
// pesa (silencio / señales); piso de denuncia tiene su propia frase.
const DRIVERS_SILENCIO =
  'El silencio pesa porque sin voz interna el área no se puede leer por dentro.';
const DRIVERS_SENALES =
  'Las señales pesan porque son hechos del último año, dejados por quienes salieron o entraron.';
const DRIVERS_PISO =
  '75 directo: hubo denuncia formal en el año. El hecho solo pone al área en prioridad, diga lo que diga el resto.';

// §2b-8 — APROBADO (verbatim).
const PIE =
  'Las señales cuentan por fecha del hecho: últimos 12 meses, sin importar estado ni desenlace.';

// §2b-4 — APROBADO (Victor 2026-06-11).
const DECLARARON_NADA =
  'Nada medible este ciclo: el equipo no alcanzó el mínimo de respuestas para una lectura interna.';

// §2b-2 ⓘ — línea de escala del score (decisión Victor #2: el ⓘ del score la
// contiene; los drivers van VISIBLES bajo el score, no en el ⓘ). APROBADO.
export const SCORE_SCALE_INFO =
  'Riesgo 0–100: cuánto hay que mirar esta área, y por qué.';

const STANDALONE_PREFIX = '__dept__:';

/** Slot legal en PROSA (decisión Victor #3 — el label de legalBadgeForCountry
 *  es badge, no prosa). CL → "bajo Ley Karin"; resto → "de riesgo de cumplimiento". */
function legalProseMarco(country: string | null | undefined): string {
  return (country ?? '').toUpperCase() === 'CL'
    ? 'bajo Ley Karin'
    : 'de riesgo de cumplimiento';
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS DE SALIDA
// ════════════════════════════════════════════════════════════════════════════

export interface ModalDeptLine {
  departmentId: string;
  departmentName: string;
  score: number;
  /** Familia para el color. null si el dept no resuelve lectura (con_isa+alertas). */
  family: TriageFamily | null;
  familyLabel: string;
}

export interface ModalGerenciaBlock {
  gerenciaId: string;
  gerenciaName: string;
  score: number;
  /** Composición narrada del score (§2b-2). "50 puntos de silencio, 25 de señales del año". */
  scoreNarrada: string;
  /** §2b-3 — solo en modal individual. null en bloques de grupo (compactos). */
  drivers: string | null;
  /** §2b-4 — solo en modal individual. null en bloques de grupo. */
  declararon: string | null;
  /** §2b-5 — solo en modal individual. null si no hay señales o en grupo. */
  senales: string | null;
  /** §2b-7 — SUS DEPARTAMENTOS (hijos genuinos, excluye la gerencia-misma). */
  departamentos: ModalDeptLine[];
}

export interface TriageModal {
  mode: 'individual' | 'grupo';
  family: TriageFamily;
  familyLabel: string;
  lecturaKicker: string;
  /** `{familyLabel} · {lecturaKicker}`. */
  kicker: string;
  /** Veredicto verbatim (§2b-6) — singular (individual) / plural (grupo). UNA vez. */
  veredicto: string;
  blocks: ModalGerenciaBlock[];
  /** Pie cursiva (§2b-8). */
  pie: string;
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS DE COPY (per gerencia)
// ════════════════════════════════════════════════════════════════════════════

/** §2b-2 — composición narrada. Términos en cero omitidos; piso ⇒ frase propia. */
export function buildScoreNarrada(
  silencio: number,
  senales: number,
  reason: DepartmentRiskScore['reason'],
): string {
  if (reason === 'piso_aplicado') return 'piso directo por denuncia formal del año';
  const parts: string[] = [];
  if (silencio > 0) parts.push(`${silencio} puntos de silencio`);
  if (senales > 0) parts.push(`${senales} de señales del año`);
  return parts.join(', ');
}

/** §2b-3 — drivers. Oraciones verbatim mostradas según driver presente. */
export function buildDriversText(
  silencio: number,
  senales: number,
  reason: DepartmentRiskScore['reason'],
): string {
  if (reason === 'piso_aplicado') return DRIVERS_PISO;
  const parts: string[] = [];
  if (silencio > 0) parts.push(DRIVERS_SILENCIO);
  if (senales > 0) parts.push(DRIVERS_SENALES);
  return parts.join(' ');
}

/** §2b-4 — lo declarado. Gate 2c §5: abre con `Participación: {pct}% — `
 *  (pct = participación de la gerencia, rollup-level). ISA al lado SOLO en
 *  con_isa (regla de buckets). */
export function buildDeclararonText(
  worstRs: DepartmentRiskScore,
  rollup: GerenciaRollup,
): string {
  const pct = Math.round((rollup.silencio.participationRate ?? 0) * 100);
  const prefijo = `Participación: ${pct}%. `;
  if (worstRs.bucket === 'con_isa' && rollup.isa.weighted !== null) {
    const isa = Math.round(rollup.isa.weighted);
    const band = ISA_NARRATIVES[classifyIsa(isa)].badge;
    // Formato canónico N · Label. FLAG: sin caso real que lo ejercite —
    // revisar cuando aparezca una gerencia con_isa.
    return `${prefijo}ISA ${isa} · ${band}`;
  }
  return `${prefijo}${DECLARARON_NADA}`;
}

/** §2b-5 — lo que dicen las señales. Slot legal canónico; denuncia ≠ indicio,
 *  JAMÁS sumados. PROPUESTO (el contrato describe, no cita). null si no hay. */
export function buildSenalesText(
  worstRs: DepartmentRiskScore,
  country: string | null | undefined,
): string | null {
  const denuncia = worstRs.inputs.denuncias_12m;
  const hasDenuncia = denuncia !== null && denuncia >= 1;
  const karinCount = worstRs.alertas.filter((a) =>
    LEY_KARIN_ALERT_TYPES.includes(a.alertType),
  ).length;
  const exitCount = worstRs.alertas.filter((a) => a.producto === 'exit').length;
  const onbCount = worstRs.alertas.filter((a) => a.producto === 'onboarding').length;

  // Denuncia formal — rama propia (no se mezcla con indicios).
  if (hasDenuncia) {
    return `En el último año hubo ${denuncia} ${
      denuncia === 1 ? 'denuncia formal' : 'denuncias formales'
    } en el área.`;
  }
  // Indicio Ley Karin — slot legal en PROSA (decisión Victor #3).
  if (karinCount > 0) {
    const marco = legalProseMarco(country);
    const head = karinCount === 1 ? `un indicio ${marco}` : `${karinCount} indicios ${marco}`;
    return `En los últimos 12 meses, una salida dejó ${head}. Es un indicio, no una denuncia.`;
  }
  // Señales genéricas de salida / entrada (sin marco legal).
  if (exitCount > 0 || onbCount > 0) {
    const bits: string[] = [];
    if (exitCount > 0) bits.push(`${exitCount} de salida`);
    if (onbCount > 0) bits.push(`${onbCount} de entrada`);
    return `En los últimos 12 meses se registraron señales ${bits.join(' y ')}.`;
  }
  return null;
}

/** §2b-7 — SUS DEPARTAMENTOS. Hijos del rollup excluyendo la gerencia-misma
 *  (merge de ancestro / standalone). Orden score desc + alfabético. */
export function buildDeptLines(
  rollup: GerenciaRollup,
  rsById: Map<string, DepartmentRiskScore>,
): ModalDeptLine[] {
  const ownDeptId = rollup.standalone
    ? rollup.groupId.slice(STANDALONE_PREFIX.length)
    : rollup.groupId;
  const lines: ModalDeptLine[] = [];
  for (const id of rollup.childDeptIds) {
    if (id === ownDeptId) continue; // la gerencia-misma es el header, no un sub-dept.
    const rs = rsById.get(id);
    if (!rs) continue;
    const n = resolveDepartmentRiskNarrative(rs);
    lines.push({
      departmentId: id,
      departmentName: rs.departmentName,
      score: rs.score,
      family: n?.state ?? null,
      familyLabel: n ? FAMILY_LABEL[n.state] : '—',
    });
  }
  lines.sort((a, b) => b.score - a.score || a.departmentName.localeCompare(b.departmentName));
  return lines;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

export function buildTriageModal(
  data: ComplianceReportResponse,
  lecturaKey: TriageLecturaKey,
): TriageModal | null {
  const acto = buildTriageGroups(data);
  const group = acto.groups.find((g) => g.key === lecturaKey);
  if (!group) return null;

  const rollups = buildGerenciaRollup(data);
  const rollupById = new Map(rollups.map((r) => [r.groupId, r]));
  const rsById = new Map<string, DepartmentRiskScore>(
    (data.data.riskScores ?? []).map((rs) => [rs.departmentId, rs]),
  );
  const country = data.company?.country;

  const mode: TriageModal['mode'] = group.count > 1 ? 'grupo' : 'individual';
  const full = mode === 'individual';

  const blocks: ModalGerenciaBlock[] = group.instances.map((inst) => {
    const rollup = rollupById.get(inst.gerenciaId)!;
    const worstRs = rsById.get(inst.worstDeptId)!;
    return {
      gerenciaId: inst.gerenciaId,
      gerenciaName: inst.gerenciaName,
      score: inst.score,
      scoreNarrada: buildScoreNarrada(inst.silencio, inst.senales, worstRs.reason),
      drivers: full ? buildDriversText(inst.silencio, inst.senales, worstRs.reason) : null,
      declararon: full ? buildDeclararonText(worstRs, rollup) : null,
      senales: full ? buildSenalesText(worstRs, country) : null,
      departamentos: buildDeptLines(rollup, rsById),
    };
  });

  return {
    mode,
    family: group.family,
    familyLabel: FAMILY_LABEL[group.family],
    lecturaKicker: LECTURA_KICKER[lecturaKey],
    kicker: group.kicker,
    veredicto: group.narrativa, // singular/plural ya resuelto por buildTriageGroups.
    blocks,
    pie: PIE,
  };
}
