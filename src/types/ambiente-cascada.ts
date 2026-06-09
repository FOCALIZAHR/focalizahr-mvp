// src/types/ambiente-cascada.ts
// ════════════════════════════════════════════════════════════════════════════
// Tipos públicos de la cascada Ambiente Sano — Orchestrator + SynthesisEngine.
//
// Diseño: ver `.claude/plans/lee-claude-tasks-plan-cascada-que-y-cond-eventual-hejlsberg.md`.
// Esp. §3.1 (Orchestrator + Engine), §3.3 (cableado hilo único), §3.5 (AS ≠ Talento).
//
// Principio rector — Talento es referencia del PRINCIPIO, no plantilla. El
// modelo de salida (amplificadoresActivos, beat1Seed como input formal,
// convergencia como multiplicador asimétrico) es propio de AS.
//
// ─── DE DÓNDE LEEN LOS BEATS NUEVOS ──────────────────────────────────────────
// Decisión arquitectónica (Gate 1, ante hallazgo del pipeline de cierre):
// los Beats 2/3/4/5 de la cascada nueva consumen de `AmbienteRiskPayload.data`
// y `AmbienteRiskPayload.narratives` — **NO del shape crudo del endpoint**.
//
// `data` es una capa normalizada por nivel de agregación (per-dept,
// per-gerencia, org-level). `narratives` agrupa los textos deterministas que
// los dictionaries per-capa producen (DepartmentRiskNarrativeDictionary,
// labels CEO de dimensiones, etc.) — son inputs estructurados, no copy de
// estados pre-renderizados como `reportNarratives.cascada.*`.
//
// `reportNarratives` queda como **passthrough legacy**: lo persiste el
// pipeline de cierre de campaña (`ComplianceNarrativeEngine.buildReportNarratives`)
// y lo consumen las vistas no-cascada del módulo Compliance (artefactos 1-4,
// cruceNarrativa, criticalByManagerNarrativa, etc.). El Orchestrator NO
// re-ejecuta esa función — solo la pasa intacta. Post-Gate 8 desaparece la
// key `reportNarratives.cascada` (su responsabilidad la asume `synthesis` +
// los componentes nuevos), pero el resto de `reportNarratives` sobrevive
// porque tiene consumidores fuera de la cascada.
// ════════════════════════════════════════════════════════════════════════════

import type { Beat1Slots } from '@/lib/services/compliance/deriveBeat1Slots';
import type { GerenciaRollup } from '@/lib/services/compliance/buildGerenciaRollup';
import type {
  NivelFinal,
  DepartmentConvergencia,
} from '@/lib/services/compliance/ConvergenciaEngine';
import type { OrigenOrganizacional } from '@/lib/services/compliance/complianceTypes';
import type {
  ReportNarratives,
  DepartmentRiskScore,
  ComplianceReportDepartment,
} from '@/types/compliance';
import type { ISAResult } from '@/lib/services/compliance/ISAService';

// ════════════════════════════════════════════════════════════════════════════
// BEAT 1 SEED — la semilla que el Orchestrator planta y el Engine recibe
// ════════════════════════════════════════════════════════════════════════════

/** 5 mundos exhaustivos del clasificador D4 (Beat 1 Apertura). */
export type Mundo =
  | 'silencio'         // gap ≥ 50
  | 'contradiccion'    // teatro ≥ 1 ∧ gap < 50
  | 'todo-bien'        // ISA ≥ 80 ∧ riesgoDeptos = 0 ∧ gap < 30
  | 'bien-con-focos'   // ISA ≥ 80 ∧ (riesgoDeptos ≥ 1 ∨ gap ∈ [30,50))
  | 'numero-bajo';     // resto positivo (ISA < 80)

/** Intensidad ortogonal — bumpeada +1 si hasDenunciaFormal. */
export type Intensidad = 'leve' | 'medio' | 'alto' | 'critico';

/** Traza auditable del classifyD4 — qué rama disparó. NO va a UI; vive en
 *  payload para QA/audit cuando el Engine elige un dominante distinto al que
 *  el mundo sugería (boost por afinidad ≠ veto). */
export interface ClassifyD4Trace {
  orgISA: number;
  riesgoDeptos: number;
  coverageGapPct: number;
  teatroCount: number;
  /** Rama D4 que disparó: 'silencio' | 'contradiccion' | 'todo-bien' |
   *  'bien-con-focos' | 'numero-bajo'. */
  branchHit: string;
}

/** Dimensión del instrumento (P2/P3/P4/P5/P7/P8). */
export type ComplianceDimensionKey =
  | 'P2_seguridad'
  | 'P3_disenso'
  | 'P4_microagresiones'
  | 'P5_equidad'
  | 'P7_liderazgo'
  | 'P8_agotamiento';

/** Titular de un factor de dimensión — usado en `factoresTitulares` para que
 *  Beat 1 nombre las 2 fortalezas o 2 debilidades en lenguaje CEO. */
export interface FactorTitular {
  dimensionKey: ComplianceDimensionKey;
  /** Label CEO (de `DIMENSION_CEO_LABELS`). NUNCA el key técnico (P2/P3). */
  labelCEO: string;
  /** Score 1-5 promedio org-level ponderado por respondentCount. */
  valor: number;
}

/** Titular de un extremo de gerencia — usado en `extremosTitulares` para Beat 1. */
export interface ExtremoTitular {
  gerenciaName: string;
  /** ISA 0-100 ponderado de la gerencia. */
  isa: number;
}

/** Titulares de factores y extremos — propios de Beat 1 según §3.6.
 *  La regla del MAPA:
 *  - Banda alta (ISA ≥ 80): 0-2 fortalezas (top dims), `debilidades=[]`,
 *    `fortalezaRelativa=null`.
 *  - Banda baja (ISA < 60): 0-2 debilidades (bottom dims), `fortalezas=[]`,
 *    `fortalezaRelativa` = la mejor dim relativa.
 *  - Banda observación (60-79): mismo que banda baja (advierte, no celebra).
 *  Si no hay safety scores org-level → todos los campos vacíos. */
export interface FactoresTitulares {
  fortalezas: FactorTitular[];
  debilidades: FactorTitular[];
  fortalezaRelativa: FactorTitular | null;
}

/** Mejor / peor gerencia por ISA — solo si ≥2 gerencias con ISA medido. */
export interface ExtremosTitulares {
  mejor: ExtremoTitular | null;
  peor: ExtremoTitular | null;
}

/** Semilla del hilo único. Beat 1 (UI) y AmbienteSynthesisEngine (Beat 6)
 *  leen LA MISMA autoridad — eliminado el bug "classifyD4 client-side +
 *  cierre server-side discrepan". */
export interface Beat1Seed {
  mundoDominante: Mundo;
  intensidad: Intensidad;
  hasDenunciaFormal: boolean;
  beat1Slots: Beat1Slots;
  /** Gate 5 (§3.6) — titulares de factores (fortalezas/debilidades de 6 dims)
   *  para que Beat 1 nombre el diagnóstico ISA completo: veredicto + factores
   *  + extremos. Beats 2 y 3 desarrollan el detalle (zoom progresivo). */
  factoresTitulares: FactoresTitulares;
  /** Gate 5 (§3.6) — extremos titulares (mejor/peor gerencia) si ≥2 con ISA. */
  extremosTitulares: ExtremosTitulares;
  classifyD4Trace: ClassifyD4Trace;
}

// ════════════════════════════════════════════════════════════════════════════
// DATA — capa estructurada por nivel de agregación
// ════════════════════════════════════════════════════════════════════════════
//
// Lo que los Beats 2/3/4/5 leen para componer su render. NO copy pre-resuelta:
// datos crudos + agregados, listos para que cada Beat decida su slot.
//
// Slots opcionales (`?`) son los que se completan en gates posteriores. Gate 1
// pobla lo mínimo para Beat 1 + Beat 6 (Beat1Seed y el ground truth de
// per-dept). Gates 3 (wire endpoint) y 6 (UI nuevas) los completan.
// ════════════════════════════════════════════════════════════════════════════

export interface AmbienteRiskData {
  // ─── Org-level ─────────────────────────────────────────────────────────────
  orgISA: number | null;
  isaComponents: ISAResult['components'] | null;
  orgSafetyScore: number | null;
  coverageGapPct: number;
  /** 0-100 entero o null si universo=0 personas. */
  personResponseRate: number | null;
  totalInvited: number;
  totalResponded: number;

  // ─── Universo / conteos globales ───────────────────────────────────────────
  departmentsCount: number;
  /** Número total de gerencias en el universo (rollups.length). */
  gerenciasUniversoTotal: number;
  /** Gerencias con al menos 1 hijo en bucket con_isa (medidas). */
  gerenciasMedidasCount: number;
  /** Gerencias sin voz (todos los hijos sub_threshold o no_invitado). */
  gerenciasMudasCount: number;
  /** Conteo de deptos en bucket risk/critical (alimenta SISTEMICO_SIN_MANDO). */
  riesgoDeptosCount: number;
  /** Conteo de deptos con teatroCumplimiento === true (alimenta
   *  CONTRADICCION_TEATRO). */
  teatroCount: number;

  // ─── Per-dept (Beat 2 Triage + Beat 3 Anatomía) ────────────────────────────
  /** Per-dept extendido: safety + dimScores + isaScore + deltaVsAnterior +
   *  teatroCumplimiento (extiende DepartmentSafetyScore con las llaves que el
   *  endpoint ya emite). Filtrado por privacy (n<5 → skipped). */
  scoresPerDept: ComplianceReportDepartment[];
  /** Score 0-100 + drivers (confiabilidad/voz_externa/piso_denuncia) + bucket. */
  riskScoresPerDept: DepartmentRiskScore[];

  // ─── Per-gerencia (Beat 2 Triage) ──────────────────────────────────────────
  /** Rollups por gerencia — ISA ponderado, silencio, alertas, género, denuncia. */
  rollupsPerGerencia: GerenciaRollup[];

  // ─── Convergencia (alimentación al Engine + Beat 5 Nombre) ─────────────────
  convergencias: DepartmentConvergencia[];
  /** Grupos org-level de deptos críticos bajo el mismo manager (delta ISA ≥ 30).
   *  AREA_MANAGER recibe [] desde el endpoint (RBAC). */
  criticalByManager: Array<{ managerId: string; departmentIds: string[] }>;

  // ─── Voz crítica (Beat 4) — opcional hasta Gate 6/7 ────────────────────────
  /** Fragmentos textuales literales P1 (citas). Filtrados por privacy + género. */
  fragmentosTextuales?: string[];

  // ─── Otros mundos / sexta alerta (Beat 1 + 2) ──────────────────────────────
  /** Sexta alerta — deptos sub_threshold con señal externa. AREA_MANAGER ve []. */
  silencioConVozExterna?: unknown[];
  /** OTRO MUNDO — deptos no_invitado con rastro externo. AREA_MANAGER ve []. */
  otroMundo?: unknown[];

  // ─── Denuncias / Karin (Beat 1 ortogonal + tipo FUEGO_LEGAL del Engine) ────
  /** Conteo de denuncias_12m por departmentId. null = no medido. */
  denunciasByDept?: Map<string, number | null>;

  /** Origen organizacional del meta-análisis LLM — resuelve `{origen}` en la
   *  base de CONCENTRACION_MANDO (vía ORIGEN_LABELS). null si no hubo
   *  meta-análisis (cae a 'indeterminado'). */
  origenOrganizacional?: OrigenOrganizacional | null;
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVES — textos deterministas por capa (NO copy de estados pre-resueltos)
// ════════════════════════════════════════════════════════════════════════════
//
// Capa de narrativa estructurada. Cada entrada viene de un Dictionary
// determinista (case-keyed), NUNCA del AmbienteSynthesisEngine — el Engine
// emite UNA síntesis org-level (Beat 6), no narrativas per-dept.
//
// `reportNarratives` (separado, en AmbienteRiskPayload) sigue siendo
// passthrough legacy para consumidores no-cascada.
// ════════════════════════════════════════════════════════════════════════════

export interface AmbienteRiskNarratives {
  /** Beat 2 — narrativa per-dept del Triage (FUEGO / HUMO+rama / PUNTO_CIEGO /
   *  CONFIABLE) producida por `resolveDepartmentRiskNarrative()`. Key = dept id.
   *  Opcional hasta Gate 6 (cuando ActoTriage la consuma). */
  perDeptRisk?: Map<string, unknown>;
  /** Beat 3 — labels CEO de las 6 dimensiones (de DIMENSION_LABELS). Opcional
   *  hasta Gate 6 (ActoAnatomia). */
  dimensionLabels?: Record<string, string>;
}

// ════════════════════════════════════════════════════════════════════════════
// AMBIENTE SYNTHESIS — output del Engine (Gate 2)
// ════════════════════════════════════════════════════════════════════════════
//
// 4-partes McKinsey + extensiones AS para síntomas coexistentes. Toda copy
// es verbatim Victor (Dictionary composicional, Gate 2.5: base[dominante] +
// cláusulas[amplificadores]).
// ════════════════════════════════════════════════════════════════════════════

/** 8 tipos candidatos AS — propios del dominio (silencio, denuncia, teatro,
 *  convergencia interna). GENERIC sobrevive solo para datos corruptos. */
export type DiagnosticType =
  | 'FUEGO_LEGAL'
  | 'SILENCIO_SIN_VOZ'
  | 'CONTRADICCION_TEATRO'
  | 'CONCENTRACION_MANDO'
  | 'SISTEMICO_SIN_MANDO'
  | 'OBSERVACION_SIN_FOCO'
  | 'BIEN_CON_FOCOS'
  | 'TODO_BIEN'
  | 'GENERIC';

/** Señal externa dominante de un amplificador — el dato específico que el
 *  refactor a `amplificadoresActivos` había colapsado. Un dominante por
 *  amplificador (Ley Karin priority, si no el de mayor `pesoEfectivo`). La
 *  copy específica la escribe el chat de narrativa; el `alertType` NUNCA se
 *  renderiza literal — va por framing de indicio + `legalBadgeForCountry`. */
export interface AmplificadorSenal {
  producto: 'exit' | 'onboarding';
  /** alertType canónico (`ley_karin`, `toxic_exit_detected`,
   *  `DESENGANCHE_CULTURAL`, …) — `PESO_BASE_ALERTA`. Dato, no copy. */
  alertType: string;
  /** `pesoEfectivo` del dominante (1-3, proxy de severidad). */
  severidad: number;
  /** `alertType ∈ ALERTAS_CRITICAS` (ley_karin / toxic_exit / DESENGANCHE). */
  esCritica: boolean;
}

/** Amplificadores coexistentes con el dominante — síntomas presentes que la
 *  narrativa de cierre nombra (cláusula composicional por tipo, NO permutar).
 *  `senal?` (Nivel 1, CONVERGENCIA_*) surfacea la señal externa dominante;
 *  ausente en payloads legacy → la cláusula cae a su copy genérica validada. */
export type Amplificador =
  | { tipo: 'TEATRO_EN_DEPTO'; deptos: string[] }
  | { tipo: 'CONVERGENCIA_EXIT'; deptos: string[]; senal?: AmplificadorSenal }
  | { tipo: 'CONVERGENCIA_ONBOARDING'; deptos: string[]; senal?: AmplificadorSenal }
  | { tipo: 'CONVERGENCIA_AMBOS'; deptos: string[]; senal?: AmplificadorSenal }
  | { tipo: 'SEXTA_ALERTA'; deptos: string[] }
  | { tipo: 'OTRO_MUNDO'; deptos: string[] };

export interface AmbienteSynthesis {
  diagnosticType: DiagnosticType;
  /** Trace audit (NO UI). Si el dominante difiere del que mundoDominante
   *  sugería, incluye `"override: beat1=X, engine=Y"`. */
  trigger: string;

  // Slots McKinsey — copy verbatim Victor (Gate 2.5)
  classification: string;
  implication: string;
  path: string;
  accountability: string;
  supportingData: {
    primaryMetric: string;
    primaryValue: string | number;
    secondaryMetrics?: Array<{ label: string; value: string | number }>;
  };

  // Extensiones AS (NO existen en Talento)
  amplificadoresActivos: Amplificador[];
  convergenciaProductos: {
    presente: boolean;
    nivelFinal: NivelFinal | null;
    fuentes: Array<'exit' | 'onboarding' | 'exo'>;
  };

  // Opcionales — solo CONCENTRACION_MANDO + FUEGO_LEGAL
  risks?: Array<{ label: string; narrative: string }>;
  /** FUEGO_LEGAL solamente — análogo conceptual de Talento.financialNote. */
  legalNote?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// AMBIENTE RISK PAYLOAD — contrato completo del Orchestrator
// ════════════════════════════════════════════════════════════════════════════

export interface AmbienteRiskPayload {
  /** Datos por capa (org / per-dept / per-gerencia). Lo que Beats 2-5 leen. */
  data: AmbienteRiskData;
  /** Narrativas por capa (dictionaries deterministas). Acompaña a `data`. */
  narratives: AmbienteRiskNarratives;
  /** Semilla del hilo único — Beat 1 planta, Beat 6 nombra (Gate 4). */
  beat1Seed: Beat1Seed;
  /** Síntesis ejecutiva del Beat 6 — `null` hasta que Gate 2/3 cableen el
   *  Engine. */
  synthesis: AmbienteSynthesis | null;
  /** Passthrough legacy del NarrativeEngine — consumidores no-cascada (artefactos
   *  1-4, cruceNarrativa, criticalByManagerNarrativa). La key `cascada` muere
   *  en Gate 8; el resto de `reportNarratives` sobrevive. */
  reportNarratives: ReportNarratives;
}
