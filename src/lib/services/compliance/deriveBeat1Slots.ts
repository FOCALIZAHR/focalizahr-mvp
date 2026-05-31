// ═══════════════════════════════════════════════════════════════════
// deriveBeat1Slots — selecciona slots narrativos del Beat 1 (Apertura)
// src/lib/services/compliance/deriveBeat1Slots.ts
// ═══════════════════════════════════════════════════════════════════
// Pure function — consume el output de buildGerenciaRollup y resuelve los
// slots single-pick que Beat 1 puede necesitar (mundo sano / silencio /
// teatro / mixto). Cada slot es `null` cuando no aplica — degradación
// honesta, sin afirmar lo que no se midió.
//
// Umbrales: SIN literales mágicos.
//   - ISA "sana"        → getISARiskLevel(weighted) === 'saludable' (≥80)
//   - silencio "muda"   → SILENCIO_PARTICIPATION_THRESHOLD (= 50, en %)
//
// El deriver NO narra, NO clasifica el mundo (eso lo hace classifyD4 en
// ActoAmbiente.tsx hoy) y NO decide qué slot mostrar. Solo expone todos
// los slots posibles; Beat 1 elige según mundo + sabor.
//
// Spec: chat plan-mode aprobado 2026-05-30.
// ═══════════════════════════════════════════════════════════════════

import { getISARiskLevel } from '@/lib/services/compliance/ISAService';
import type { ISARiskLevel } from '@/lib/services/compliance/ISAService';
import { SILENCIO_PARTICIPATION_THRESHOLD } from '@/lib/services/compliance/ComplianceAlertService';
import type { GerenciaRollup } from './buildGerenciaRollup';

// ═══════════════════════════════════════════════════════════════════
// PUBLIC TYPES — slots
// ═══════════════════════════════════════════════════════════════════

/** Identidad mínima de la gerencia elegida en un slot. */
export interface SlotGerencia {
  groupId: string;
  groupName: string;
  standalone: boolean;
}

/** Slot con ISA — gerencia_top_1 / gerencia_alta_1 / gerencia_baja_1. */
export interface SlotGerenciaIsa extends SlotGerencia {
  /** Promedio ponderado de ISA de los hijos. Siempre presente acá (el slot
   *  se filtró por weighted !== null). */
  isaWeighted: number;
}

/** Slot de "muda" — gerencia bajo el umbral de participación O no invitada.
 *  Discrimina las dos razones vía `reason` para que el consumidor pueda narrar
 *  cada caso correctamente. */
export interface SlotGerenciaMuda extends SlotGerencia {
  /** 0-1 (fracción). null cuando reason === 'no_invitada' (no hubo invitaciones
   *  → no hay tasa que medir). */
  participationRate: number | null;
  /** 'low_participation': participationRate * 100 < SILENCIO_PARTICIPATION_THRESHOLD.
   *  'no_invitada':       coverageRate === 0 (fallback — gerencia con empleados
   *                       activos donde nadie fue invitado a la campaña). */
  reason: 'low_participation' | 'no_invitada';
}

/** Slot "pero" de silencio — gerencia con al menos un dept mudo + señal
 *  externa (sexta alerta `silencio_con_voz_externa`). */
export interface SlotGerenciaMudaConExterna extends SlotGerencia {
  /** Cuántos deptos de la gerencia están en la lista pre-cocida. ≥ 1. */
  deptosMudosCount: number;
  /** Σ de signalsCount cruzando los deptos elegidos. ≥ 1. */
  signalsCountTotal: number;
}

/** Slot de denuncia — gerencia con al menos una denuncia formal cargada. */
export interface SlotGerenciaDenuncia extends SlotGerencia {
  /** Σ de denuncias_12m de los hijos con dato cargado. ≥ 1 acá. */
  denunciasCount: number;
}

/** Slot de género (ortogonal Beat 1) — gerencia con alerta de género del LLM. */
export interface SlotGerenciaGenero extends SlotGerencia {
  /** Cita literal ≤8 palabras del motor LLM. Por contrato del slot: nunca null
   *  (si fuese null el slot entero se degrada a null, no se renderiza). */
  evidenciaGenero: string;
}

/** Slot Ley Karin (ortogonal Beat 1) — gerencia con señales Exit cross-producto
 *  bajo scope Ley Karin (alertType ∈ {ley_karin, ley_karin_indicios}), 12m. */
export interface SlotGerenciaLeyKarin extends SlotGerencia {
  /** Σ de señales Ley Karin en alertas exit (12m). ≥ 1 acá. */
  signalsCount: number;
}

/** Contexto org-level requerido por el deriver. */
export interface DeriveBeat1Ctx {
  /** ISA org-level (display 0-100). Banda derivada vía getISARiskLevel canónico. */
  orgISA: number;
  /** Gap de cobertura org-level (0-100 entero) = 100 - pctCobertura. */
  coverageGapPct: number;
}

/** Resultado completo del deriver. Cada slot single → null si no aplica.
 *  Los conteos siempre son enteros (0 cuando no hay match). */
export interface Beat1Slots {
  // ─── Conteos / agregados globales ───────────────────────────
  /** Σ exit alerts org-level, **EXCLUYENDO** las tipadas `ley_karin` /
   *  `ley_karin_indicios` (esas viajan en `gerencia_ley_karin_1.signalsCount`
   *  como cláusula ortogonal — contarlas en ambos lugares duplicaría el mismo
   *  evento en la narrativa). Fórmula: Σ(r.exit.alertsCount − r.leyKarin.signalsCount). */
  exit_alerts_count: number;
  gerencias_sanas_count: number;
  gerencias_medidas_total: number;
  /** Cuántas gerencias son "mudas" (low_participation O no_invitada). Misma
   *  lógica de elegibilidad que pickMuda, pero contando todas las candidatas
   *  combinadas — no solo la primera elegida. Útil para la apertura del
   *  mundo silencio-dominante ("N gerencias quedaron sin voz"). */
  gerencias_mudas_count: number;
  /** Total de gerencias del universo de la campaña (= rollups.length).
   *  Denominador correcto para SILENCIO ("N de M quedaron sin voz"). Distinto
   *  de gerencias_medidas_total — éste cuenta TODAS las invitadas incluyendo
   *  las mudas; aquél solo las medidas (excluye las mudas → undercount como
   *  denominador del SILENCIO). TODO BIEN sigue usando gerencias_medidas_total
   *  porque su frase ("X de Y respondieron con consistencia") tiene la medición
   *  como denominador natural. */
  gerencias_universo_total: number;
  /** Tasa de respuesta de PERSONAS de la campaña (0-100 entero).
   *  `Σ rollup.silencio.responded / Σ rollup.silencio.invited`.
   *  Distinto de `coverage.pctCobertura` (dept-level). Para la narrativa
   *  "Solo {coverage}% del equipo respondió" donde "del equipo" = personas.
   *  null si nadie fue invitado (universo == 0 personas). */
  personResponseRate: number | null;
  /** Banda ISA org-level — derivada vía getISARiskLevel canónico. Slot del
   *  mundo NÚMERO BAJO ("El ISA cae en zona de {banda}"). */
  banda: ISARiskLevel;
  /** Passthrough del ctx — slot del sabor "cobertura" de BIEN CON FOCOS
   *  ("{coverage_gap_pct}% de las áreas no respondió"). */
  coverage_gap_pct: number;

  // ─── Slots single ───────────────────────────────────────────
  /** Mejor gerencia por ISA. Para mundo 'sano' (mejor del lote). */
  gerencia_top_1: SlotGerenciaIsa | null;
  /** Alias intencional de gerencia_top_1 — el render puede usar uno u otro
   *  según el contexto narrativo. Computacionalmente idéntico hoy. */
  gerencia_alta_1: SlotGerenciaIsa | null;
  /** Peor gerencia por ISA. Para mundo 'silencio' o 'mixto' (focus). */
  gerencia_baja_1: SlotGerenciaIsa | null;
  /** Gerencia con menor participación (< 50%). null si ninguna baja. */
  gerencia_muda_1: SlotGerenciaMuda | null;
  /** "Pero" del silencio: muda con señal externa documentada. null si ninguna. */
  gerencia_muda_con_externa_1: SlotGerenciaMudaConExterna | null;
  /** Gerencia con teatroCumplimiento === true. null si ninguna o si el
   *  campo no se midió (anyTeatro === null). */
  gerencia_teatro_1: SlotGerencia | null;
  /** Alias intencional de gerencia_teatro_1 — para mundo 'mixto' (la
   *  contradicción protagonista). Computacionalmente idéntico. */
  gerencia_contradiccion_1: SlotGerencia | null;
  /** Gerencia con denuncias formales (count >= 1). null si ninguna. */
  gerencia_denuncia_1: SlotGerenciaDenuncia | null;
  /** Gerencia foco del mundo BIEN CON FOCOS — primera con `deptosEnRiesgo>0`,
   *  ordenada por menor `isa.weighted`, tiebreak alfabético. null si ninguna
   *  gerencia tiene focos en risk/critical (entonces BIEN CON FOCOS dispara
   *  por sabor "cobertura", sin foco nombrado). */
  gerencia_foco_1: SlotGerenciaIsa | null;
  /** Ortogonal — primera gerencia con alerta de género resoluble (cita literal
   *  no vacía). null si ninguna, omite la cláusula. */
  gerencia_genero_1: SlotGerenciaGenero | null;
  /** Ortogonal — gerencia con más señales Ley Karin (Exit cross-producto, 12m).
   *  null si todas tienen 0, omite la cláusula. */
  gerencia_ley_karin_1: SlotGerenciaLeyKarin | null;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

export function deriveBeat1Slots(
  rollups: GerenciaRollup[],
  ctx: DeriveBeat1Ctx,
): Beat1Slots {
  // Computar UNA vez los slots aliasados.
  const bestIsa = pickBestIsa(rollups);
  const teatro = pickTeatro(rollups);

  return {
    // De-dup ley_karin: r.exit.alertsCount incluye TODAS las exit (cualquier
    // alertType); r.leyKarin.signalsCount es estrictamente un subset (exit ∧
    // alertType ∈ ley_karin*). La resta evita contar el mismo evento dos veces
    // (una en este slot, otra en la cláusula ortogonal). Math.max(0, ...) es
    // defensa: si alguna vez se rompe el invariante "ley_karin ⊆ exit",
    // capeamos a 0 en lugar de devolver negativo (más honesto que mentir
    // un negativo a la narrativa).
    exit_alerts_count: rollups.reduce(
      (s, r) => s + Math.max(0, r.exit.alertsCount - r.leyKarin.signalsCount),
      0,
    ),
    gerencias_medidas_total: rollups.filter((r) => r.isa.weighted !== null)
      .length,
    gerencias_sanas_count: rollups.filter(
      (r) =>
        r.isa.weighted !== null &&
        getISARiskLevel(r.isa.weighted) === 'saludable',
    ).length,
    gerencias_mudas_count: countMudas(rollups),
    gerencias_universo_total: rollups.length,
    personResponseRate: computePersonResponseRate(rollups),
    banda: getISARiskLevel(ctx.orgISA),
    coverage_gap_pct: ctx.coverageGapPct,

    gerencia_top_1: bestIsa,
    gerencia_alta_1: bestIsa,
    gerencia_baja_1: pickWorstIsa(rollups),
    gerencia_muda_1: pickMuda(rollups),
    gerencia_muda_con_externa_1: pickMudaConExterna(rollups),
    gerencia_teatro_1: teatro,
    gerencia_contradiccion_1: teatro,
    gerencia_denuncia_1: pickDenuncia(rollups),
    gerencia_foco_1: pickFoco(rollups),
    gerencia_genero_1: pickGenero(rollups),
    gerencia_ley_karin_1: pickLeyKarin(rollups),
  };
}

// ═══════════════════════════════════════════════════════════════════
// PICKERS — uno por slot. Cada uno: filter + sort + take first.
// ═══════════════════════════════════════════════════════════════════

function pickBestIsa(rollups: GerenciaRollup[]): SlotGerenciaIsa | null {
  const candidates = rollups.filter((r) => r.isa.weighted !== null);
  if (candidates.length === 0) return null;
  // Mayor ISA primero; tiebreak alfabético.
  candidates.sort((a, b) => {
    const aw = a.isa.weighted as number;
    const bw = b.isa.weighted as number;
    if (bw !== aw) return bw - aw;
    return a.groupName.localeCompare(b.groupName);
  });
  return toSlotIsa(candidates[0]);
}

function pickWorstIsa(rollups: GerenciaRollup[]): SlotGerenciaIsa | null {
  const candidates = rollups.filter((r) => r.isa.weighted !== null);
  if (candidates.length === 0) return null;
  // Menor ISA primero; tiebreak alfabético.
  candidates.sort((a, b) => {
    const aw = a.isa.weighted as number;
    const bw = b.isa.weighted as number;
    if (aw !== bw) return aw - bw;
    return a.groupName.localeCompare(b.groupName);
  });
  return toSlotIsa(candidates[0]);
}

function pickMuda(rollups: GerenciaRollup[]): SlotGerenciaMuda | null {
  // PRIMARY — gerencias cubiertas pero con participación bajo el umbral.
  // participationRate * 100 < THRESHOLD (canónico, sexta alerta).
  const lowPart = rollups.filter(
    (r) =>
      r.silencio.participationRate !== null &&
      (r.silencio.participationRate as number) * 100 <
        SILENCIO_PARTICIPATION_THRESHOLD,
  );
  if (lowPart.length > 0) {
    // Menor participación primero; tiebreak alfabético.
    lowPart.sort((a, b) => {
      const ap = a.silencio.participationRate as number;
      const bp = b.silencio.participationRate as number;
      if (ap !== bp) return ap - bp;
      return a.groupName.localeCompare(b.groupName);
    });
    const r = lowPart[0];
    return {
      groupId: r.groupId,
      groupName: r.groupName,
      standalone: r.standalone,
      participationRate: r.silencio.participationRate as number,
      reason: 'low_participation',
    };
  }

  // FALLBACK — gerencias con empleados activos pero NUNCA invitadas
  // (coverageRate === 0 → invited === 0 && empleadosActivos > 0). Silencio
  // total — semántica equivalente a la sexta alerta canónica que también
  // incluye "sin cobertura" como candidato (ComplianceAlertService L943).
  const noInvitadas = rollups.filter(
    (r) => r.silencio.coverageRate === 0,
  );
  if (noInvitadas.length === 0) return null;
  // Solo tiebreak alfabético — todas comparten "silencio total".
  noInvitadas.sort((a, b) => a.groupName.localeCompare(b.groupName));
  const r = noInvitadas[0];
  return {
    groupId: r.groupId,
    groupName: r.groupName,
    standalone: r.standalone,
    participationRate: null,
    reason: 'no_invitada',
  };
}

function pickMudaConExterna(
  rollups: GerenciaRollup[],
): SlotGerenciaMudaConExterna | null {
  const candidates = rollups.filter((r) => r.silencioVozExterna.count > 0);
  if (candidates.length === 0) return null;
  // Mayor cantidad de deptos afectados primero (más impactante para el "pero");
  // tiebreak alfabético.
  candidates.sort((a, b) => {
    const diff = b.silencioVozExterna.count - a.silencioVozExterna.count;
    if (diff !== 0) return diff;
    return a.groupName.localeCompare(b.groupName);
  });
  const r = candidates[0];
  const signalsCountTotal = r.silencioVozExterna.deptosMudosConSenalExterna.reduce(
    (s, d) => s + d.signalsCount,
    0,
  );
  return {
    groupId: r.groupId,
    groupName: r.groupName,
    standalone: r.standalone,
    deptosMudosCount: r.silencioVozExterna.count,
    signalsCountTotal,
  };
}

function pickTeatro(rollups: GerenciaRollup[]): SlotGerencia | null {
  // === true intencional: descarta null (sin medir) Y false (medido sin teatro).
  // rollups vienen ya ordenados por maxScore desc + alfabético desde el util.
  const r = rollups.find((rr) => rr.teatro.anyTeatro === true);
  if (!r) return null;
  return {
    groupId: r.groupId,
    groupName: r.groupName,
    standalone: r.standalone,
  };
}

function pickDenuncia(
  rollups: GerenciaRollup[],
): SlotGerenciaDenuncia | null {
  // 3-estado RESPETADO: count === null queda fuera (no se afirma "sin denuncias");
  // count === 0 también queda fuera (slot quiere >= 1).
  const candidates = rollups.filter(
    (r) => r.denuncias.count !== null && (r.denuncias.count as number) >= 1,
  );
  if (candidates.length === 0) return null;
  // Mayor count primero; tiebreak alfabético.
  candidates.sort((a, b) => {
    const ac = a.denuncias.count as number;
    const bc = b.denuncias.count as number;
    if (bc !== ac) return bc - ac;
    return a.groupName.localeCompare(b.groupName);
  });
  const r = candidates[0];
  return {
    groupId: r.groupId,
    groupName: r.groupName,
    standalone: r.standalone,
    denunciasCount: r.denuncias.count as number,
  };
}

function pickFoco(rollups: GerenciaRollup[]): SlotGerenciaIsa | null {
  // Filtra gerencias con al menos un hijo en risk/critical. La gerencia
  // "foco" es la peor por ISA medido — preserva la métrica que el mundo
  // BIEN CON FOCOS narra ("ISA favorable global, pero esta está en riesgo").
  const candidates = rollups.filter(
    (r) => r.deptosEnRiesgo > 0 && r.isa.weighted !== null,
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const aw = a.isa.weighted as number;
    const bw = b.isa.weighted as number;
    if (aw !== bw) return aw - bw; // peor ISA primero
    return a.groupName.localeCompare(b.groupName);
  });
  return toSlotIsa(candidates[0]);
}

function pickGenero(rollups: GerenciaRollup[]): SlotGerenciaGenero | null {
  // Slot resuelto solo si hay cita literal — evidenciaGenero === null en el
  // rollup degrada la cláusula entera (no se afirma "hay alerta sin cita").
  const candidates = rollups.filter(
    (r) => r.genero.hasAlerta && r.genero.evidenciaGenero !== null,
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.groupName.localeCompare(b.groupName));
  const r = candidates[0];
  return {
    groupId: r.groupId,
    groupName: r.groupName,
    standalone: r.standalone,
    evidenciaGenero: r.genero.evidenciaGenero as string,
  };
}

function pickLeyKarin(
  rollups: GerenciaRollup[],
): SlotGerenciaLeyKarin | null {
  const candidates = rollups.filter((r) => r.leyKarin.signalsCount > 0);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const diff = b.leyKarin.signalsCount - a.leyKarin.signalsCount;
    if (diff !== 0) return diff; // más señales primero
    return a.groupName.localeCompare(b.groupName);
  });
  const r = candidates[0];
  return {
    groupId: r.groupId,
    groupName: r.groupName,
    standalone: r.standalone,
    signalsCount: r.leyKarin.signalsCount,
  };
}

// ─── helpers ────────────────────────────────────────────────────────

/** Σ invited y responded a nivel campaña (sobre todas las gerencias del
 *  universo). Devuelve tasa entera 0-100, o null si nadie fue invitado.
 *  Person-level (no dept-level). */
function computePersonResponseRate(rollups: GerenciaRollup[]): number | null {
  let invited = 0;
  let responded = 0;
  for (const r of rollups) {
    invited += r.silencio.invited;
    responded += r.silencio.responded;
  }
  if (invited === 0) return null;
  return Math.round((responded / invited) * 100);
}

/** Cuenta gerencias mudas (mismo criterio que pickMuda: low_participation
 *  O no_invitada). NO descarta gerencias en el primer match — cuenta todas. */
function countMudas(rollups: GerenciaRollup[]): number {
  return rollups.filter(
    (r) =>
      r.silencio.coverageRate === 0 ||
      (r.silencio.participationRate !== null &&
        (r.silencio.participationRate as number) * 100 <
          SILENCIO_PARTICIPATION_THRESHOLD),
  ).length;
}

function toSlotIsa(r: GerenciaRollup): SlotGerenciaIsa {
  return {
    groupId: r.groupId,
    groupName: r.groupName,
    standalone: r.standalone,
    isaWeighted: r.isa.weighted as number,
  };
}
