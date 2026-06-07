// src/lib/services/compliance/AmbienteSynthesisEngine.ts
// ════════════════════════════════════════════════════════════════════════════
// AmbienteSynthesisEngine (Gate 2) — Beat 6 motor diferencial
//
// Espejo del PRINCIPIO de Talento (detect → score → priority → diferencial),
// con modelo de salida propio de AS (amplificadores coexistentes,
// convergencia asimétrica, Beat1Seed como input formal). Ver plan §3.1.2 +
// §3.5 para divergencias justificadas vs Talento.
//
// Reemplaza `buildCierreFrancotirador` en Gate 3 wiring. El categorizador
// legacy queda `@deprecated` hasta Gate 8.
//
// CONTRATO DE COPY (Gate 2 vs Gate 2.5):
//   Gate 2 (este archivo) emite los slots `classification`/`implication`/
//   `path`/`accountability` como string vacío `""`. La copy verbatim viene de
//   `AmbienteSynthesisDictionary.ts` en Gate 2.5 — Victor entrega. El motor
//   selecciona el dominante + arma `amplificadoresActivos` + computa
//   `convergenciaProductos`; el Dictionary compone la narrativa.
//
// Ver §3.5.2 (asimetría convergencia), §3.5.7 (composicionalidad), §3.5.8
// (tipo 8 OBSERVACION_SIN_FOCO), §3.6 (Beat 1 titulares).
// ════════════════════════════════════════════════════════════════════════════

import type {
  AmbienteSynthesis,
  AmbienteRiskData,
  Beat1Seed,
  Mundo,
  DiagnosticType,
  Amplificador,
} from '@/types/ambiente-cascada';
import type { NivelFinal } from '@/lib/services/compliance/ConvergenciaEngine';
import {
  SYNTHESIS_DICTIONARY,
  AMPLIFIER_CLAUSES,
} from './AmbienteSynthesisDictionary';

// ════════════════════════════════════════════════════════════════════════════
// UMBRALES — todos exportados para auditabilidad y tests
// ════════════════════════════════════════════════════════════════════════════

export const THRESHOLDS = {
  // SILENCIO_SIN_VOZ
  GAP_COBERTURA_PCT: 50,
  // CONTRADICCION_TEATRO
  TEATRO_MIN_ISA: 60,
  // CONCENTRACION_MANDO
  CONCENTRACION_PCT: 30, // deptos del grupo / riesgoDeptos ≥ 0.30
  // SISTEMICO_SIN_MANDO
  SISTEMICO_MIN_RIESGO: 3,
  // BIEN / OBSERVACION / TODO_BIEN
  ISA_SALUDABLE: 80,
  ISA_OBSERVACION_LOW: 60,
  // Desempate
  TIE_GAP: 5,
  // Boost por afinidad mundoDominante
  AFFINITY_BOOST: 10,
  // Multiplicador convergencia (asimétrico)
  CONVERGENCIA_CONFIRMA_MULT: 1.3,
  CONVERGENCIA_CONTRADICE_BOOST: 20,
} as const;

/** Prioridad fija para desempate top-vs-second cuando gap < TIE_GAP.
 *  Excepción: si beat1Seed apunta a un tied, el de afinidad gana (§3.3 #5). */
export const DIAGNOSTIC_PRIORITY: DiagnosticType[] = [
  'FUEGO_LEGAL',
  'SILENCIO_SIN_VOZ',
  'CONTRADICCION_TEATRO',
  'CONCENTRACION_MANDO',
  'SISTEMICO_SIN_MANDO',
  'OBSERVACION_SIN_FOCO',
  'BIEN_CON_FOCOS',
  'TODO_BIEN',
];

/** Afinidad mundo D4 → tipos diagnósticos coherentes (boost +10). */
const AFINIDAD_MUNDO: Record<Mundo, DiagnosticType[]> = {
  silencio: ['SILENCIO_SIN_VOZ', 'FUEGO_LEGAL'],
  contradiccion: ['CONTRADICCION_TEATRO', 'FUEGO_LEGAL'],
  'todo-bien': ['TODO_BIEN', 'BIEN_CON_FOCOS'],
  'bien-con-focos': ['BIEN_CON_FOCOS', 'CONCENTRACION_MANDO'],
  'numero-bajo': ['CONCENTRACION_MANDO', 'SISTEMICO_SIN_MANDO', 'FUEGO_LEGAL'],
};

// ════════════════════════════════════════════════════════════════════════════
// TIPOS INTERNOS
// ════════════════════════════════════════════════════════════════════════════

interface DiagnosticScore {
  type: DiagnosticType;
  score: number;
  /** Audit-only — no UI. */
  trigger: string;
  data: Record<string, unknown>;
}

/** Señal de convergencia entre productos — derivada de `data.convergencias`
 *  pero override-able en tests para inyectar fixtures. */
export interface ConvergenciaSignal {
  direccion: 'confirma' | 'contradice' | 'ninguna';
  nivelFinal: NivelFinal | null;
  /** Deptos donde Exit/Onboarding confirman lo que el silencio interno dice. */
  deptosConfirmados: string[];
  /** Deptos donde Exit/Onboarding contradicen las métricas internas. */
  deptosContradichos: string[];
  /** Fuentes externas activas que aportaron la señal. */
  fuentes: Array<'exit' | 'onboarding' | 'exo'>;
}

export interface AmbienteSynthesisInput {
  beat1Seed: Beat1Seed;
  data: AmbienteRiskData;
  /** Opcional — si no se provee, se deriva de `data.convergencias`. */
  convergenciaSignal?: ConvergenciaSignal;
}

// ════════════════════════════════════════════════════════════════════════════
// CLASE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export class AmbienteSynthesisEngine {
  /** Punto de entrada. Pure. */
  static generate(input: AmbienteSynthesisInput): AmbienteSynthesis {
    const convergencia = input.convergenciaSignal ?? this.deriveConvergenciaSignal(input.data);

    // 1. Detectar candidatos 1-7 por umbral propio.
    const baseScores = this.detectDiagnostics(input.beat1Seed, input.data);

    // 2. Aplicar boost por afinidad mundo→tipo (+AFFINITY_BOOST antes del desempate).
    const boostedScores = this.applyAfinidad(baseScores, input.beat1Seed.mundoDominante);

    // 3. Aplicar multiplicador asimétrico de convergencia (§3.5.2).
    const multipliedScores = this.applyConvergenciaMultiplicador(boostedScores, convergencia);

    // 4. Considerar tipo 8 OBSERVACION_SIN_FOCO si nada disparó y banda observación.
    const finalScores = this.maybeAddObservacionSinFoco(multipliedScores, input.data);

    // 5. Seleccionar dominante (sort + tie-break con afinidad/priority).
    const dominante = this.selectDominant(finalScores, input.beat1Seed);

    // 6. Construir amplificadoresActivos (inventario fáctico de coexistencia).
    const amplificadores = this.buildAmplificadores(dominante.type, input.data);

    // 7. Componer AmbienteSynthesis. Slots de copy emiten "" hasta Gate 2.5.
    return this.buildSynthesis(dominante, input, amplificadores, convergencia);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PASO 1 — detectDiagnostics: 7 candidatos por umbral propio (tipo 8 aparte)
  // ──────────────────────────────────────────────────────────────────────────

  private static detectDiagnostics(
    beat1Seed: Beat1Seed,
    data: AmbienteRiskData,
  ): DiagnosticScore[] {
    const scores: DiagnosticScore[] = [];
    const orgISA = data.orgISA;

    // ─── 1. FUEGO_LEGAL ────────────────────────────────────────────────────
    // Trigger: ≥1 dept con denuncia formal cargada (piso_denuncia > 0).
    // Score: 100 + nFuego*10. Dominante por construcción (siempre lidera).
    const fuegoDeptos = data.riskScoresPerDept.filter((r) => r.drivers.piso_denuncia > 0);
    if (fuegoDeptos.length > 0) {
      scores.push({
        type: 'FUEGO_LEGAL',
        score: 100 + fuegoDeptos.length * 10,
        trigger: `${fuegoDeptos.length} dept(s) con denuncia formal cargada`,
        data: {
          deptos: fuegoDeptos.map((r) => r.departmentId),
        },
      });
    }

    // ─── 2. SILENCIO_SIN_VOZ ───────────────────────────────────────────────
    // Trigger: gap ≥ 50 ∨ gerencia_muda_con_externa_1 presente.
    // Score: coverageGapPct + (mudasConExterna * 5).
    const hasMudaConExterna = beat1Seed.beat1Slots.gerencia_muda_con_externa_1 !== null;
    if (data.coverageGapPct >= THRESHOLDS.GAP_COBERTURA_PCT || hasMudaConExterna) {
      const mudasConExterna = hasMudaConExterna ? 1 : 0;
      scores.push({
        type: 'SILENCIO_SIN_VOZ',
        score: data.coverageGapPct + mudasConExterna * 5,
        trigger: `gap=${data.coverageGapPct}% · mudaConExterna=${mudasConExterna}`,
        data: {
          coverageGapPct: data.coverageGapPct,
          mudaConExternaGerencia: beat1Seed.beat1Slots.gerencia_muda_con_externa_1?.groupName ?? null,
        },
      });
    }

    // ─── 3. CONTRADICCION_TEATRO ───────────────────────────────────────────
    // Trigger: teatroCount ≥ 1 ∧ ISA aceptable (≥60). Si ISA bajo, el
    // mecanismo dominante es SILENCIO/NUMERO_BAJO, no teatro.
    if (
      data.teatroCount >= 1 &&
      orgISA !== null &&
      orgISA >= THRESHOLDS.TEATRO_MIN_ISA
    ) {
      scores.push({
        type: 'CONTRADICCION_TEATRO',
        score: data.teatroCount * 20 + (orgISA - THRESHOLDS.TEATRO_MIN_ISA),
        trigger: `teatroCount=${data.teatroCount} ∧ orgISA=${orgISA}`,
        data: {
          teatroCount: data.teatroCount,
          orgISA,
        },
      });
    }

    // ─── 4. CONCENTRACION_MANDO ────────────────────────────────────────────
    // Trigger: criticalByManager[0] agrupa ≥30% del riesgo.
    if (data.criticalByManager.length > 0 && data.riesgoDeptosCount > 0) {
      const topGroup = data.criticalByManager[0];
      const concentracion = topGroup.departmentIds.length / data.riesgoDeptosCount;
      if (concentracion >= THRESHOLDS.CONCENTRACION_PCT / 100) {
        // deltaIsa estimado: diferencia entre el peor ISA del grupo y el ISA medio org.
        const deptIdsInGroup = new Set(topGroup.departmentIds);
        const groupScores = data.scoresPerDept
          .filter((s) => deptIdsInGroup.has(s.departmentId))
          .map((s) => s.safetyScore)
          .filter((s) => s !== null && s !== undefined);
        const groupMin = groupScores.length > 0 ? Math.min(...groupScores) : 0;
        const orgAvg = data.orgSafetyScore ?? 0;
        const deltaIsa = Math.max(0, Math.round((orgAvg - groupMin) * 20)); // 0-5 scale → 0-100

        scores.push({
          type: 'CONCENTRACION_MANDO',
          score: Math.round(concentracion * 100) + deltaIsa,
          trigger: `criticalByManager[0]=${topGroup.departmentIds.length}/${data.riesgoDeptosCount} deptos`,
          data: {
            managerId: topGroup.managerId,
            concentracionPct: Math.round(concentracion * 100),
            deltaIsa,
          },
        });
      }
    }

    // ─── 5. SISTEMICO_SIN_MANDO ────────────────────────────────────────────
    // Trigger: ≥3 deptos en riesgo SIN criticalByManager (no hay línea de mando común).
    if (
      data.riesgoDeptosCount >= THRESHOLDS.SISTEMICO_MIN_RIESGO &&
      data.criticalByManager.length === 0
    ) {
      scores.push({
        type: 'SISTEMICO_SIN_MANDO',
        score: data.riesgoDeptosCount * 10,
        trigger: `riesgoDeptos=${data.riesgoDeptosCount} ∧ sin criticalByManager`,
        data: {
          riesgoDeptos: data.riesgoDeptosCount,
        },
      });
    }

    // ─── 6. BIEN_CON_FOCOS ─────────────────────────────────────────────────
    // Trigger: orgISA ≥ 80 ∧ riesgoDeptos ≥ 1.
    if (
      orgISA !== null &&
      orgISA >= THRESHOLDS.ISA_SALUDABLE &&
      data.riesgoDeptosCount >= 1
    ) {
      scores.push({
        type: 'BIEN_CON_FOCOS',
        score: data.riesgoDeptosCount * 5,
        trigger: `orgISA=${orgISA} ∧ riesgoDeptos=${data.riesgoDeptosCount}`,
        data: {
          orgISA,
          riesgoDeptos: data.riesgoDeptosCount,
        },
      });
    }

    // ─── 7. TODO_BIEN ──────────────────────────────────────────────────────
    // Trigger: orgISA ≥ 80 ∧ riesgoDeptos = 0 ∧ teatro = 0.
    if (
      orgISA !== null &&
      orgISA >= THRESHOLDS.ISA_SALUDABLE &&
      data.riesgoDeptosCount === 0 &&
      data.teatroCount === 0
    ) {
      scores.push({
        type: 'TODO_BIEN',
        score: orgISA,
        trigger: `orgISA=${orgISA} ∧ riesgo=0 ∧ teatro=0`,
        data: {
          orgISA,
        },
      });
    }

    return scores;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PASO 2 — boost por afinidad mundo→tipo (+AFFINITY_BOOST antes del sort)
  // ──────────────────────────────────────────────────────────────────────────

  private static applyAfinidad(
    scores: DiagnosticScore[],
    mundoDominante: Mundo,
  ): DiagnosticScore[] {
    const afines = new Set(AFINIDAD_MUNDO[mundoDominante]);
    return scores.map((s) =>
      afines.has(s.type) ? { ...s, score: s.score + THRESHOLDS.AFFINITY_BOOST } : s,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PASO 3 — multiplicador asimétrico de convergencia (§3.5.2)
  // ──────────────────────────────────────────────────────────────────────────

  private static applyConvergenciaMultiplicador(
    scores: DiagnosticScore[],
    convergencia: ConvergenciaSignal,
  ): DiagnosticScore[] {
    if (convergencia.direccion === 'ninguna') return scores;

    if (convergencia.direccion === 'confirma') {
      // 'confirma' solo tiene efecto si hay un top que multiplicar.
      if (scores.length === 0) return scores;
      const sorted = [...scores].sort((a, b) => b.score - a.score);
      const topType = sorted[0].type;
      return scores.map((s) =>
        s.type === topType
          ? { ...s, score: Math.round(s.score * THRESHOLDS.CONVERGENCIA_CONFIRMA_MULT) }
          : s,
      );
    }

    // direccion === 'contradice': boost +20 a CONTRADICCION_TEATRO existente;
    // si no estaba, lo activamos desde cero — la divergencia entre productos
    // ES un teatro de cumplimiento por otra vía (§3.5.2 precisión #2).
    // Funciona incluso con scores=[] (caso del test 12).
    const teatroIdx = scores.findIndex((s) => s.type === 'CONTRADICCION_TEATRO');
    if (teatroIdx >= 0) {
      return scores.map((s, i) =>
        i === teatroIdx
          ? { ...s, score: s.score + THRESHOLDS.CONVERGENCIA_CONTRADICE_BOOST }
          : s,
      );
    }

    return [
      ...scores,
      {
        type: 'CONTRADICCION_TEATRO',
        score: THRESHOLDS.CONVERGENCIA_CONTRADICE_BOOST,
        trigger: `divergencia productos: ${convergencia.deptosContradichos.length} dept(s)`,
        data: {
          deptosContradichos: convergencia.deptosContradichos,
          activadoPor: 'convergencia_contradice',
        },
      },
    ];
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PASO 4 — tipo 8 OBSERVACION_SIN_FOCO si nada disparó y ISA en 60-79 (§3.5.8)
  // ──────────────────────────────────────────────────────────────────────────

  private static maybeAddObservacionSinFoco(
    scores: DiagnosticScore[],
    data: AmbienteRiskData,
  ): DiagnosticScore[] {
    const orgISA = data.orgISA;
    if (scores.length > 0) return scores;
    if (orgISA === null) return scores; // → GENERIC en selectDominant
    if (orgISA < THRESHOLDS.ISA_OBSERVACION_LOW || orgISA >= THRESHOLDS.ISA_SALUDABLE) {
      return scores;
    }

    return [
      {
        type: 'OBSERVACION_SIN_FOCO',
        score: THRESHOLDS.ISA_SALUDABLE - orgISA,
        trigger: `banda observación ISA=${orgISA}, sin disparadores 1-7`,
        data: { orgISA },
      },
    ];
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PASO 5 — selectDominant: sort DESC + tie-break (afinidad > priority)
  // ──────────────────────────────────────────────────────────────────────────

  private static selectDominant(
    scores: DiagnosticScore[],
    beat1Seed: Beat1Seed,
  ): DiagnosticScore {
    if (scores.length === 0) {
      // Caso patológico: sin orgISA o todos los detectores fallaron. GENERIC
      // sobrevive solo aquí. Path estándar; NUNCA inventa "sin dirección".
      return {
        type: 'GENERIC',
        score: 0,
        trigger: 'no scores — datos corruptos o caso imposible',
        data: { orgISA: null },
      };
    }

    if (scores.length === 1) return scores[0];

    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const top = sorted[0];
    const second = sorted[1];
    const gap = top.score - second.score;

    if (gap >= THRESHOLDS.TIE_GAP) return top;

    // Empate (gap < TIE_GAP) → desempate con afinidad PRECEDENCIA sobre priority.
    const tied = sorted.filter((s) => top.score - s.score < THRESHOLDS.TIE_GAP);
    const afines = new Set(AFINIDAD_MUNDO[beat1Seed.mundoDominante]);
    const tiedConAfinidad = tied.filter((s) => afines.has(s.type));

    if (tiedConAfinidad.length > 0) {
      // El mundo plantó algo coherente con un tied → ese gana (precision §3.3 #5).
      // Si hay varios afines tied, usar priority entre ellos.
      return this.byPriority(tiedConAfinidad);
    }

    // Sin afinidad entre los tied → priority fija pura.
    const dom = this.byPriority(tied);
    // Si la priority eligió uno distinto al de beat1Seed.mundoDominante's afinidad
    // primaria, marcar discordancia en trigger para audit.
    const afinidadPrimaria = AFINIDAD_MUNDO[beat1Seed.mundoDominante][0];
    if (dom.type !== afinidadPrimaria) {
      dom.trigger = `${dom.trigger} · override: beat1=${beat1Seed.mundoDominante}, engine=${dom.type}`;
    }
    return dom;
  }

  /** Resuelve el ganador entre tied usando DIAGNOSTIC_PRIORITY fija. */
  private static byPriority(candidates: DiagnosticScore[]): DiagnosticScore {
    let best = candidates[0];
    let bestPriority = DIAGNOSTIC_PRIORITY.indexOf(best.type);
    for (const c of candidates.slice(1)) {
      const p = DIAGNOSTIC_PRIORITY.indexOf(c.type);
      if (p < bestPriority) {
        best = c;
        bestPriority = p;
      }
    }
    return best;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PASO 6 — amplificadoresActivos: inventario fáctico de coexistencia
  // ──────────────────────────────────────────────────────────────────────────

  private static buildAmplificadores(
    dominanteType: DiagnosticType,
    data: AmbienteRiskData,
  ): Amplificador[] {
    const amplificadores: Amplificador[] = [];

    // ─── TEATRO_EN_DEPTO ──────────────────────────────────────────────────
    // Se incluye si hay deptos en teatro Y el dominante no es ya teatro.
    if (data.teatroCount > 0 && dominanteType !== 'CONTRADICCION_TEATRO') {
      const teatroDeptos = data.scoresPerDept
        .filter((s) => s.teatroCumplimiento === true)
        .map((s) => s.departmentId);
      if (teatroDeptos.length > 0) {
        amplificadores.push({ tipo: 'TEATRO_EN_DEPTO', deptos: teatroDeptos });
      }
    }

    // ─── CONVERGENCIA_EXIT / ONBOARDING / AMBOS ───────────────────────────
    // Agrupa por dept; si ambas fuentes tocan el mismo dept → AMBOS (fusión).
    // §3.5.7 #3 — la fusión ocurre antes de componer.
    const exitDeptos = new Set<string>();
    const onbDeptos = new Set<string>();
    for (const c of data.convergencias) {
      if (c.convergenciaExterna?.exoSignal && c.convergenciaExterna.exoSignal > 0) {
        onbDeptos.add(c.departmentId);
      }
      if (c.convergenciaExterna?.eisSignal && c.convergenciaExterna.eisSignal > 0) {
        exitDeptos.add(c.departmentId);
      }
    }
    const ambos: string[] = [];
    const soloExit: string[] = [];
    const soloOnb: string[] = [];
    for (const d of exitDeptos) {
      if (onbDeptos.has(d)) ambos.push(d);
      else soloExit.push(d);
    }
    for (const d of onbDeptos) {
      if (!exitDeptos.has(d)) soloOnb.push(d);
    }
    if (ambos.length > 0) amplificadores.push({ tipo: 'CONVERGENCIA_AMBOS', deptos: ambos });
    if (soloExit.length > 0) amplificadores.push({ tipo: 'CONVERGENCIA_EXIT', deptos: soloExit });
    if (soloOnb.length > 0)
      amplificadores.push({ tipo: 'CONVERGENCIA_ONBOARDING', deptos: soloOnb });

    // ─── SEXTA_ALERTA ─────────────────────────────────────────────────────
    // Se incluye si hay sub_threshold con voz externa Y dominante no es
    // SILENCIO_SIN_VOZ (donde la sexta ya está implícita en el dominante).
    // `deptos` lleva NAMES legibles (no IDs) — los consume la cláusula de
    // narrativa en AmbienteSynthesisDictionary.
    if (
      data.silencioConVozExterna &&
      data.silencioConVozExterna.length > 0 &&
      dominanteType !== 'SILENCIO_SIN_VOZ'
    ) {
      const deptos = (
        data.silencioConVozExterna as Array<{
          departmentId: string | null;
          departmentName: string | null;
        }>
      )
        .map((s) => s.departmentName ?? s.departmentId)
        .filter((n): n is string => typeof n === 'string');
      if (deptos.length > 0) {
        amplificadores.push({ tipo: 'SEXTA_ALERTA', deptos });
      }
    }

    // ─── OTRO_MUNDO ───────────────────────────────────────────────────────
    if (data.otroMundo && data.otroMundo.length > 0) {
      const deptos = (
        data.otroMundo as Array<{
          departmentId: string | null;
          departmentName: string | null;
        }>
      )
        .map((s) => s.departmentName ?? s.departmentId)
        .filter((n): n is string => typeof n === 'string');
      if (deptos.length > 0) {
        amplificadores.push({ tipo: 'OTRO_MUNDO', deptos });
      }
    }

    return amplificadores;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PASO 7 — buildSynthesis: ensamblar output. Copy emite "" hasta Gate 2.5
  // ──────────────────────────────────────────────────────────────────────────

  private static buildSynthesis(
    dominante: DiagnosticScore,
    input: AmbienteSynthesisInput,
    amplificadores: Amplificador[],
    convergencia: ConvergenciaSignal,
  ): AmbienteSynthesis {
    // supportingData mínimo para el render — datos crudos del trigger.
    const supportingData = {
      primaryMetric: 'ISA org-level',
      primaryValue: input.data.orgISA ?? 'sin dato',
      secondaryMetrics: [
        { label: 'gap cobertura', value: `${input.data.coverageGapPct}%` },
        { label: 'deptos en riesgo', value: input.data.riesgoDeptosCount },
        { label: 'teatro count', value: input.data.teatroCount },
      ],
    };

    // Lookup de copy verbatim del Dictionary (Gate 2.5). Donde el Dictionary
    // emite '', el Engine pasa '' transparente — la UI oculta esos slots.
    const dictEntry = SYNTHESIS_DICTIONARY[dominante.type];
    const implication = this.composeImplication(
      dictEntry.implicationBase,
      amplificadores,
    );

    return {
      diagnosticType: dominante.type,
      trigger: dominante.trigger,

      classification: dictEntry.classification,
      implication,
      path: dictEntry.path,
      accountability: dictEntry.accountability,

      supportingData,
      amplificadoresActivos: amplificadores,
      convergenciaProductos: {
        presente: convergencia.direccion !== 'ninguna',
        nivelFinal: convergencia.nivelFinal,
        fuentes: convergencia.fuentes,
      },
      // Opcional — FUEGO_LEGAL solamente.
      ...(dictEntry.legalNote ? { legalNote: dictEntry.legalNote } : {}),
    };
  }

  /** Compone `implication = base + cláusulas[].join(' ')` (§3.5.7).
   *  Orden de cláusulas: AMBOS → EXIT → ONBOARDING → TEATRO → SEXTA → OTRO_MUNDO. */
  private static composeImplication(
    base: string,
    amplificadores: Amplificador[],
  ): string {
    if (amplificadores.length === 0) return base;

    const ORDER: Array<Amplificador['tipo']> = [
      'CONVERGENCIA_AMBOS',
      'CONVERGENCIA_EXIT',
      'CONVERGENCIA_ONBOARDING',
      'TEATRO_EN_DEPTO',
      'SEXTA_ALERTA',
      'OTRO_MUNDO',
    ];

    const byType = new Map<Amplificador['tipo'], Amplificador>();
    for (const a of amplificadores) byType.set(a.tipo, a);

    const clauses: string[] = [];
    for (const tipo of ORDER) {
      const a = byType.get(tipo);
      if (!a) continue;
      const fn = AMPLIFIER_CLAUSES[tipo];
      if (!fn) continue; // Cláusula aún no entregada por Victor — se omite.
      const text = fn(a.deptos);
      if (text) clauses.push(text);
    }

    if (clauses.length === 0) return base;
    if (!base) return clauses.join(' ');
    return `${base} ${clauses.join(' ')}`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // HELPER — derivar ConvergenciaSignal desde data.convergencias
  // ──────────────────────────────────────────────────────────────────────────

  /** Heurística mínima Gate 2 — refinar en Gate 3 con datos reales del wire. */
  private static deriveConvergenciaSignal(data: AmbienteRiskData): ConvergenciaSignal {
    const confirmadas = data.convergencias.filter(
      (c) =>
        c.nivelFinal === 'confirmada' ||
        c.nivelFinal === 'amplificada' ||
        c.nivelFinal === 'critica_sistema',
    );

    if (confirmadas.length === 0) {
      return {
        direccion: 'ninguna',
        nivelFinal: null,
        deptosConfirmados: [],
        deptosContradichos: [],
        fuentes: [],
      };
    }

    // Fuentes únicas presentes en los confirmadas.
    const fuentes = new Set<'exit' | 'onboarding' | 'exo'>();
    for (const c of confirmadas) {
      if (c.convergenciaExterna?.eisSignal && c.convergenciaExterna.eisSignal > 0) {
        fuentes.add('exit');
      }
      if (c.convergenciaExterna?.exoSignal && c.convergenciaExterna.exoSignal > 0) {
        fuentes.add('onboarding');
      }
    }

    // nivelFinal más severo presente.
    const SEVERIDAD: NivelFinal[] = [
      'critica_sistema',
      'amplificada',
      'confirmada',
      'externa_solo',
      'interna_solo',
      'ninguna',
    ];
    const nivelTop = SEVERIDAD.find((n) => confirmadas.some((c) => c.nivelFinal === n)) ?? null;

    return {
      direccion: 'confirma',
      nivelFinal: nivelTop,
      deptosConfirmados: confirmadas.map((c) => c.departmentId),
      deptosContradichos: [],
      fuentes: Array.from(fuentes),
    };
  }
}
