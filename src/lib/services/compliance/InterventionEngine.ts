// src/lib/services/compliance/InterventionEngine.ts
// Motor determinista de recomendaciones de intervención.
//
// 4 capas:
//   1. Catálogo: 8 intervenciones con evidencia + plazo + métrica.
//   2. Matriz: dimensiones × nivel → ranked interventions.
//   3. Motor de consolidación: detecta intersecciones (una misma intervención
//      resuelve 2+ triggers) → propone una recomendación "consolidada".
//   4. Copywriting dinámico: justificaciones ejecutivas con variables reales.
//
// Uso:
//   const plan = buildInterventionPlan(triggers)
//   → plan.recommendations incluye 0-1 consolidated + N individuales.

import type { ComplianceAlertType } from '@/config/complianceAlertConfig';
import type { PatronNombre } from './complianceTypes';
import type { NivelFinal } from './ConvergenciaEngine';

// ═══════════════════════════════════════════════════════════════════
// CAPA 1 — Catálogo de intervenciones
// ═══════════════════════════════════════════════════════════════════

export interface Intervention {
  id: string;
  titulo: string;
  mecanismo: string;
  evidencia: string;
  plazo: string;
  metrica: string;
}

export const INTERVENTION_CATALOG: Record<string, Intervention> = {
  FAST_FEEDBACK: {
    id: 'FAST_FEEDBACK',
    titulo: 'Fast Feedback semanal',
    mecanismo:
      'Sesiones de 10-15 min enfocadas en remover obstáculos futuros, no auditar errores pasados',
    evidencia: 'Gallup 2024 — 13.490 profesionales',
    plazo: '3-6 meses',
    metrica: '3.6x más motivación vs feedback anual',
  },
  PSYCH_SAFETY_MODELING: {
    id: 'PSYCH_SAFETY_MODELING',
    titulo: 'Liderazgo que reconoce errores en voz alta',
    mecanismo:
      'El líder admite sus propios fallos antes que los del equipo. Cada problema se trata como pregunta, no como juicio. Los pulsos confirman si esa apertura se convirtió en hábito o sigue siendo discurso.',
    evidencia: 'BCG — 28.000 empleados',
    plazo: '12 a 24 meses para que arraigue. Las primeras señales aparecen al sexto mes.',
    metrica: 'Elimina brecha de deserción en grupos diversos',
  },
  BYSTANDER_INTERVENTION: {
    id: 'BYSTANDER_INTERVENTION',
    titulo: 'Aliados activos en la sala',
    mecanismo:
      'Entrena al grupo — no a quien recibe el daño — a interrumpir el comentario despectivo en el momento. Sin escándalo, sin discurso. Una frase que reordena la conversación y deja claro qué no se acepta aquí.',
    evidencia: 'MDPI Microaggressions 2024',
    plazo: '12 meses sostenidos. Los talleres de un día no funcionan.',
    metrica: 'Reducción de incidentes percibidos en 3-6 meses',
  },
  HIGH_FREQ_PULSES: {
    id: 'HIGH_FREQ_PULSES',
    titulo: 'Pulsos de alta frecuencia',
    mecanismo:
      'Encuestas breves semanales para captar señales antes de que ocurran las renuncias',
    evidencia: 'Critical Slowing Down — arXiv 2026',
    plazo: 'Inmediato',
    metrica: 'Detecta señales 4-8 semanas antes del colapso',
  },
  DISSENT_INSTITUTIONALIZATION: {
    id: 'DISSENT_INSTITUTIONALIZATION',
    titulo: 'Disentir y comprometerse',
    mecanismo:
      'Cada decisión importante exige que alguien la cuestione antes de aprobarse. Una vez decidida, todos ejecutan — pero la objeción quedó registrada. Se separa la fase de debate de la fase de ejecución.',
    evidencia: 'McKinsey Risk Culture 2024',
    plazo: '6 a 12 meses para desaprender la aversión al conflicto.',
    metrica: 'Elimina ceguera sistémica ante errores evidentes',
  },
  PROSOCIAL_ACTIVITIES: {
    id: 'PROSOCIAL_ACTIVITIES',
    titulo: 'Actividades de impacto social a corto plazo',
    mecanismo:
      'Voluntariado corporativo patrocinado como proxy cognitivo de justicia interna',
    evidencia: 'MIT/Informs — banco LATAM, experimento aleatorizado',
    plazo: '6-12 meses',
    metrica: 'Reducción causal de rotación medida al año',
  },
  DECISION_ACCOUNTABILITY: {
    id: 'DECISION_ACCOUNTABILITY',
    titulo: 'Un responsable claro por decisión',
    mecanismo:
      'Cada decisión relevante tiene un nombre y apellido al lado. Ni comités difusos, ni autoría compartida cuando algo funciona — ni huérfana cuando algo falla. Las reglas son las mismas para todos y se aplican igual.',
    evidencia: 'Columbia SPS — Organizational Justice',
    plazo: '10 a 12 meses para que la percepción de injusticia se revierta.',
    metrica: 'r = -0.436 entre inequidad percibida e intención de rotación',
  },
  WORK_REDESIGN: {
    id: 'WORK_REDESIGN',
    titulo: 'Auditoría del trabajo, no del esfuerzo',
    mecanismo:
      'El equipo revisa junto qué tareas duplica, qué reuniones sobran, qué dependencias bloquean. La conversación se traslada de "quién falla" a "qué está mal diseñado". El conflicto deja de ser entre personas y pasa a ser sobre el sistema.',
    evidencia: 'Teoría Relacional-Cultural — PMC 2024',
    plazo: '1 a 12 meses según la severidad del cuadro.',
    metrica: 'Recuperación estadística medible en encuestas de pulso',
  },
};

// ═══════════════════════════════════════════════════════════════════
// CAPA 2 — Matriz dimensión × nivel
// Orden en el array: [recomendada, opcion_2, opcion_3].
// ═══════════════════════════════════════════════════════════════════

export type DimensionRiskLevel = 'medio' | 'bajo' | 'critico';

export type DimensionMatrix = Record<
  string,
  Record<DimensionRiskLevel, string[]>
>;

// Matriz rebalanceada (2026-05-12): HIGH_FREQ_PULSES reducido de 17 a 2 buckets
// (P2 medio y P5 medio — único uso justificado: detección temprana en nivel leve).
// opt 0 ahora refleja la intervención específica al fenómeno, no la genérica.
export const DIMENSION_INTERVENTIONS: DimensionMatrix = {
  P2_seguridad: {
    medio: ['HIGH_FREQ_PULSES', 'PSYCH_SAFETY_MODELING', 'DISSENT_INSTITUTIONALIZATION'],
    bajo: ['PSYCH_SAFETY_MODELING', 'FAST_FEEDBACK', 'DISSENT_INSTITUTIONALIZATION'],
    critico: ['PSYCH_SAFETY_MODELING', 'BYSTANDER_INTERVENTION', 'DISSENT_INSTITUTIONALIZATION'],
  },
  P3_disenso: {
    medio: ['DISSENT_INSTITUTIONALIZATION', 'FAST_FEEDBACK', 'PSYCH_SAFETY_MODELING'],
    bajo: ['DISSENT_INSTITUTIONALIZATION', 'BYSTANDER_INTERVENTION', 'PSYCH_SAFETY_MODELING'],
    critico: ['DISSENT_INSTITUTIONALIZATION', 'PSYCH_SAFETY_MODELING', 'BYSTANDER_INTERVENTION'],
  },
  P4_microagresiones: {
    medio: ['BYSTANDER_INTERVENTION', 'WORK_REDESIGN', 'FAST_FEEDBACK'],
    bajo: ['BYSTANDER_INTERVENTION', 'WORK_REDESIGN', 'PSYCH_SAFETY_MODELING'],
    critico: ['BYSTANDER_INTERVENTION', 'WORK_REDESIGN', 'PSYCH_SAFETY_MODELING'],
  },
  P5_equidad: {
    medio: ['HIGH_FREQ_PULSES', 'DECISION_ACCOUNTABILITY', 'PROSOCIAL_ACTIVITIES'],
    bajo: ['DECISION_ACCOUNTABILITY', 'PROSOCIAL_ACTIVITIES', 'FAST_FEEDBACK'],
    critico: ['DECISION_ACCOUNTABILITY', 'PROSOCIAL_ACTIVITIES', 'BYSTANDER_INTERVENTION'],
  },
  P7_liderazgo: {
    medio: ['FAST_FEEDBACK', 'PSYCH_SAFETY_MODELING', 'DISSENT_INSTITUTIONALIZATION'],
    bajo: ['PSYCH_SAFETY_MODELING', 'FAST_FEEDBACK', 'DISSENT_INSTITUTIONALIZATION'],
    critico: ['PSYCH_SAFETY_MODELING', 'BYSTANDER_INTERVENTION', 'DISSENT_INSTITUTIONALIZATION'],
  },
  P8_agotamiento: {
    medio: ['WORK_REDESIGN', 'FAST_FEEDBACK', 'BYSTANDER_INTERVENTION'],
    bajo: ['WORK_REDESIGN', 'BYSTANDER_INTERVENTION', 'FAST_FEEDBACK'],
    critico: ['WORK_REDESIGN', 'BYSTANDER_INTERVENTION', 'PSYCH_SAFETY_MODELING'],
  },
};

// DEFAULT_TRIPLETA — fallback defensivo SOLO cuando un trigger tiene
// type/meta corrupta o ID no reconocido. En un sistema sano nunca se ejecuta.
// Mapping específico vive en PATRON / ALERT / CONVERGENCIA_INTERVENTIONS.
const DEFAULT_TRIPLETA = ['HIGH_FREQ_PULSES', 'BYSTANDER_INTERVENTION', 'FAST_FEEDBACK'];

// Mapping rebalanceado (2026-05-12) — cada patron a su intervención específica
// según playbook validado. Antes: 5 patrones compartían DEFAULT_TRIPLETA.
export const PATRON_INTERVENTIONS: Record<PatronNombre | 'default', string[]> = {
  default: ['HIGH_FREQ_PULSES', 'PSYCH_SAFETY_MODELING', 'DISSENT_INSTITUTIONALIZATION'],
  silencio_organizacional: ['HIGH_FREQ_PULSES', 'PSYCH_SAFETY_MODELING', 'DISSENT_INSTITUTIONALIZATION'],
  hostilidad_normalizada:  ['BYSTANDER_INTERVENTION', 'PSYCH_SAFETY_MODELING', 'WORK_REDESIGN'],
  favoritismo_implicito:   ['DECISION_ACCOUNTABILITY', 'PROSOCIAL_ACTIVITIES', 'DISSENT_INSTITUTIONALIZATION'],
  resignacion_aprendida:   ['WORK_REDESIGN', 'FAST_FEEDBACK', 'DISSENT_INSTITUTIONALIZATION'],
  miedo_represalias:       ['PSYCH_SAFETY_MODELING', 'HIGH_FREQ_PULSES', 'DISSENT_INSTITUTIONALIZATION'],
};

// Mapping rebalanceado (2026-05-12) — cada alertType a su intervención específica.
// Antes: 5 alertTypes compartían DEFAULT_TRIPLETA.
export const ALERT_INTERVENTIONS: Record<ComplianceAlertType | 'default', string[]> = {
  default: ['PSYCH_SAFETY_MODELING', 'WORK_REDESIGN', 'HIGH_FREQ_PULSES'],
  riesgo_convergente:      ['PSYCH_SAFETY_MODELING', 'WORK_REDESIGN', 'HIGH_FREQ_PULSES'],
  liderazgo_toxico:        ['PSYCH_SAFETY_MODELING', 'FAST_FEEDBACK', 'BYSTANDER_INTERVENTION'],
  silencio_organizacional: ['HIGH_FREQ_PULSES', 'PSYCH_SAFETY_MODELING', 'DISSENT_INSTITUTIONALIZATION'],
  deterioro_sostenido:     ['WORK_REDESIGN', 'FAST_FEEDBACK', 'HIGH_FREQ_PULSES'],
  senal_ignorada:          ['PSYCH_SAFETY_MODELING', 'DISSENT_INSTITUTIONALIZATION', 'HIGH_FREQ_PULSES'],
  // Tripleta PROVISIONAL — sin HIGH_FREQ_PULSES como primario (la narrativa
  // de la sexta dice "no una encuesta de seguimiento"). Validar con playbook
  // completo junto a las deudas R-13/14/15/16 del catálogo de intervenciones.
  silencio_con_voz_externa: ['PSYCH_SAFETY_MODELING', 'FAST_FEEDBACK', 'WORK_REDESIGN'],
  // Tripleta PROVISIONAL — validar con playbook (misma deuda que
  // silencio_con_voz_externa). La séptima alerta es outlier de participación:
  // el foco es reconstruir la confianza en que responder sirve.
  participacion_anomala: ['PSYCH_SAFETY_MODELING', 'FAST_FEEDBACK', 'DISSENT_INSTITUTIONALIZATION'],
};

// Convergencia (C3) — un trigger por depto con nivelFinal != 'ninguna'.
// Mapping rebalanceado (2026-05-12) por nivelFinal. Antes: tripleta única
// DEFAULT_TRIPLETA para todos los deptos sin discriminar criticidad.
// Override teatro (casos A2/A5) se aplica en getInterventionsForTrigger
// con TEATRO_TRIPLETA antes del lookup por nivelFinal.
export const CONVERGENCIA_INTERVENTIONS: Record<Exclude<NivelFinal, 'ninguna'>, string[]> = {
  critica_sistema: ['PSYCH_SAFETY_MODELING', 'BYSTANDER_INTERVENTION', 'WORK_REDESIGN'],
  amplificada:     ['WORK_REDESIGN', 'PSYCH_SAFETY_MODELING', 'HIGH_FREQ_PULSES'],
  confirmada:      ['BYSTANDER_INTERVENTION', 'PSYCH_SAFETY_MODELING', 'HIGH_FREQ_PULSES'],
  externa_solo:    ['HIGH_FREQ_PULSES', 'FAST_FEEDBACK', 'DISSENT_INSTITUTIONALIZATION'],
  interna_solo:    ['FAST_FEEDBACK', 'HIGH_FREQ_PULSES', 'WORK_REDESIGN'],
};

// Override teatro — casos A2 (escenografía narrativa) o A5 (desincronía
// scores↔texto) detectados en convergencia interna. Cuando el equipo
// "responde lo que se espera leer", la primera medida es estructurar el
// disenso, no esperar que el liderazgo modele apertura (porque
// precisamente eso es lo que la gente está fingiendo).
const TEATRO_TRIPLETA = ['DISSENT_INSTITUTIONALIZATION', 'PSYCH_SAFETY_MODELING', 'HIGH_FREQ_PULSES'];

// Override A3 — sesgo de género detectado intra-dept por Motor A.
// PSYCH_SAFETY_MODELING es el único ítem del catálogo con evidencia directa
// de cierre de brecha de género (BCG 28k empleados). BYSTANDER + ALG completan
// el protocolo: aliados activos para microagresiones + reglas equitativas para
// asignación. Cae después de teatro (A2/A5) por si los scores son ruido.
const SESGO_GENERO_TRIPLETA = ['PSYCH_SAFETY_MODELING', 'BYSTANDER_INTERVENTION', 'DECISION_ACCOUNTABILITY'];

// ═══════════════════════════════════════════════════════════════════
// CAPA 3 — Motor de consolidación
// ═══════════════════════════════════════════════════════════════════

export type TriggerType = 'dimension_low' | 'patron' | 'alert' | 'convergencia';

export interface TriggerInput {
  type: TriggerType;
  ref: string; // identificador único para persistir (dimKey, patronNombre, alertId)
  label: string; // copy ejecutivo
  riskLevel: DimensionRiskLevel;
  meta?: Record<string, unknown>; // info extra (ej. dimKey para dimensiones)
}

export interface Recommendation {
  type: 'consolidated' | 'individual';
  interventionId?: string; // consolidated: la recomendación única
  intervention?: Intervention; // consolidated
  resolvesTriggers?: TriggerInput[]; // consolidated: triggers que cubre
  trigger?: TriggerInput; // individual
  options?: Intervention[]; // individual: 3 opciones
  recommendedId?: string; // individual: la opción 0 (primera = recomendada)
  justificacion: string;
  isRecommended: boolean;
}

export interface InterventionPlan {
  recommendations: Recommendation[];
  totalTriggers: number;
}

function getInterventionsForTrigger(t: TriggerInput): string[] {
  if (t.type === 'dimension_low') {
    const dimKey = (t.meta?.dimKey as string | undefined) ?? '';
    const matrix = DIMENSION_INTERVENTIONS[dimKey];
    if (!matrix) return DEFAULT_TRIPLETA;
    return matrix[t.riskLevel] ?? matrix.medio;
  }
  if (t.type === 'patron') {
    // ref convención: `patron:{nombre}` (paridad con convergencia/alert/dim).
    // Fallback a meta.nombre para callers que pasen el nombre directo en meta.
    const nombre =
      (t.meta?.nombre as PatronNombre | undefined) ??
      (t.ref.replace(/^patron:/, '') as PatronNombre);
    return PATRON_INTERVENTIONS[nombre] ?? PATRON_INTERVENTIONS.default;
  }
  if (t.type === 'convergencia') {
    // Stack de overrides (orden de prioridad):
    //   1. teatro (A2/A5) — deseabilidad social → estructurar disenso
    //   2. A3 (sesgo de género) — hallazgo forense específico
    //   3. nivelFinal — lookup por severidad cross-fuente
    //   4. fallback (confirmada) — defensivo si nivel no matchea
    // A1 (doble confirmación) y A4 (variable de liderazgo) NO requieren
    // override: están implícitos en nivelFinal='confirmada' y
    // nivelFinal='critica_sistema' respectivamente.
    const casos = (t.meta?.casosActivos as string[] | undefined) ?? [];
    if (casos.includes('A2') || casos.includes('A5')) {
      return TEATRO_TRIPLETA;
    }
    if (casos.includes('A3')) {
      return SESGO_GENERO_TRIPLETA;
    }
    const nivel = t.meta?.nivelFinal as NivelFinal | undefined;
    if (nivel && nivel !== 'ninguna' && nivel in CONVERGENCIA_INTERVENTIONS) {
      return CONVERGENCIA_INTERVENTIONS[nivel as Exclude<NivelFinal, 'ninguna'>];
    }
    return CONVERGENCIA_INTERVENTIONS.confirmada;
  }
  // alert
  const alertType = (t.meta?.alertType as ComplianceAlertType | undefined) ?? null;
  return alertType
    ? (ALERT_INTERVENTIONS[alertType] ?? ALERT_INTERVENTIONS.default)
    : ALERT_INTERVENTIONS.default;
}

export function buildInterventionPlan(triggers: TriggerInput[]): InterventionPlan {
  if (triggers.length === 0) return { recommendations: [], totalTriggers: 0 };

  const allArrays = triggers.map((t) => ({
    trigger: t,
    interventions: getInterventionsForTrigger(t),
  }));

  // Frecuencia de cada intervención entre todos los triggers.
  const frequency: Record<string, number> = {};
  for (const a of allArrays) {
    for (const id of a.interventions) {
      frequency[id] = (frequency[id] ?? 0) + 1;
    }
  }

  // Intersecciones = alto apalancamiento.
  const highLeverage = Object.entries(frequency)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a);

  const recommendations: Recommendation[] = [];

  if (highLeverage.length > 0) {
    const topId = highLeverage[0][0];
    const resolvesTriggers = allArrays
      .filter((a) => a.interventions.includes(topId))
      .map((a) => a.trigger);

    recommendations.push({
      type: 'consolidated',
      interventionId: topId,
      intervention: INTERVENTION_CATALOG[topId],
      resolvesTriggers,
      justificacion: buildConsolidatedJustification(topId, resolvesTriggers, triggers),
      isRecommended: true,
    });
  }

  // Triggers no cubiertos → recomendaciones individuales.
  const coveredRefs = new Set(
    recommendations.flatMap((r) => r.resolvesTriggers?.map((t) => t.ref) ?? [])
  );
  for (const trigger of triggers) {
    if (coveredRefs.has(trigger.ref)) continue;
    const ids = getInterventionsForTrigger(trigger);
    recommendations.push({
      type: 'individual',
      trigger,
      options: ids.map((id) => INTERVENTION_CATALOG[id]).filter(Boolean),
      recommendedId: ids[0],
      justificacion: buildIndividualJustification(trigger),
      isRecommended: false,
    });
  }

  return { recommendations, totalTriggers: triggers.length };
}

// ═══════════════════════════════════════════════════════════════════
// CAPA 4 — Copywriting dinámico
// (Respeta skill-narrativas: sin verbos prescriptivos, con consecuencia.)
// ═══════════════════════════════════════════════════════════════════

function buildConsolidatedJustification(
  _interventionId: string,
  _resolvesTriggers: TriggerInput[],
  _allTriggers: TriggerInput[]
): string {
  // Placeholder neutro — el copy ejecutivo anterior concatenaba labels
  // heterogéneos (frase larga de dimensión + título de alerta + nombre de
  // depto) con `join(' y ')`, lo que producía frases mal formadas. Pendiente
  // un formateador con humanizeLabel(label, type) + lista castellana.
  return 'Intervención recomendada basada en los hallazgos de este departamento.';
}

function buildIndividualJustification(trigger: TriggerInput): string {
  const ids = getInterventionsForTrigger(trigger);
  const recommended = INTERVENTION_CATALOG[ids[0]];
  const isCritical = trigger.riskLevel === 'critico';

  if (isCritical) {
    return (
      `Nivel crítico: las campañas genéricas de HR no funcionan a este score. ` +
      `${recommended.titulo} actúa en el plazo más corto disponible (${recommended.plazo}). ` +
      `Evidencia: ${recommended.evidencia}.`
    );
  }
  return (
    `Para este nivel, ${recommended.titulo} produce señales medibles ` +
    `en ${recommended.plazo}. Evidencia: ${recommended.evidencia}.`
  );
}
