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
  cierre?: string; // consecuencia inevitable si no se actúa
}

export const INTERVENTION_CATALOG: Record<string, Intervention> = {
  FAST_FEEDBACK: {
    id: 'FAST_FEEDBACK',
    titulo: 'El líder que escucha antes de evaluar',
    mecanismo:
      'El manager cita a cada persona de su equipo 15 minutos por semana. La agenda la conduce el colaborador: qué me bloqueó, qué necesito. El manager no evalúa — remueve obstáculos. La conversación reemplaza el silencio acumulado que termina en renuncia.',
    evidencia: 'Gallup 2024 — 13.490 profesionales activos',
    plazo:
      'Las primeras señales aparecen entre la semana 4 y la 8. El patrón se consolida entre el mes 3 y el 6.',
    metrica:
      'El equipo reporta menos bloqueos sin resolver y más conversaciones reales con su jefe. Gallup mide ese cambio como 3,6 veces más motivación sostenida. FocalizaHR lo confirma en el siguiente ciclo de medición.',
    cierre:
      'Un equipo sin canal semanal no deja de tener problemas. Los acumula en silencio. Cuando ese silencio aparece en los datos, la decisión ya estaba tomada.',
  },
  PSYCH_SAFETY_MODELING: {
    id: 'PSYCH_SAFETY_MODELING',
    titulo: 'El líder que se equivoca primero',
    mecanismo:
      'El líder admite sus propios errores antes de señalar los del equipo. Cada problema se trata como pregunta, no como juicio. No es vulnerabilidad por principio — es una señal deliberada de que equivocarse no tiene consecuencias. El equipo calibra su comportamiento en función de lo que ve, no de lo que escucha.',
    evidencia: 'Edmondson (1999) — Administrative Science Quarterly. BCG (2023) — 28.000 empleados.',
    plazo:
      'Las primeras señales aparecen al sexto mes. Arraiga entre los 12 y 24 meses.',
    metrica:
      'El equipo reporta que puede señalar un error sin anticipar una consecuencia negativa. FocalizaHR lo confirma cuando P2_seguridad mejora en el siguiente ciclo.',
    cierre:
      'Un líder que nunca se equivoca en público tiene un equipo que tampoco. Eso no es excelencia — es una organización que gestiona apariencias en lugar de resultados.',
  },
  BYSTANDER_INTERVENTION: {
    id: 'BYSTANDER_INTERVENTION',
    titulo: 'Quien ve y no actúa también decide',
    mecanismo:
      'Se entrena al equipo — no a quien recibe el daño — a interrumpir el comentario despectivo en el momento. Sin escándalo, sin discurso. Una frase que reordena la conversación y deja claro qué no se acepta. El colectivo se convierte en el estándar, no el manual de conducta.',
    evidencia: 'Ashburn-Nardo et al. (2008) — Journal of Social Issues',
    plazo:
      'Cambios perceptibles entre el mes 3 y el 6. Consolidación real a los 12 meses.',
    metrica:
      'El equipo reporta menos situaciones donde nadie intervino ante un comentario inapropiado. FocalizaHR lo confirma cuando P4_microagresiones mejora y el patrón hostilidad_normalizada deja de aparecer.',
    cierre:
      'Lo que nadie interrumpe, todos aprueban. El silencio colectivo no es neutralidad — es el mecanismo por el que una conducta se vuelve cultura.',
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
    titulo: 'La objeción que salva la decisión',
    mecanismo:
      'Antes de aprobar cualquier decisión importante, alguien tiene el rol explícito de cuestionarla. No es crítica personal — es protocolo. Una vez decidido, todos ejecutan. La objeción quedó registrada. Se separa la fase de debate de la fase de ejecución.',
    evidencia: 'Nemeth et al. (2001) — European Journal of Social Psychology',
    plazo: '6 a 12 meses para desaprender la aversión al conflicto.',
    metrica:
      'El equipo reporta que las decisiones importantes se cuestionan antes de ejecutarse — y que eso no genera conflicto. FocalizaHR lo confirma cuando P3_disenso mejora y silencio_organizacional reduce su intensidad.',
    cierre:
      'Un equipo que nunca disiente no está de acuerdo. Está en silencio. La diferencia se nota cuando el error ya ocurrió.',
  },
  PROSOCIAL_ACTIVITIES: {
    id: 'PROSOCIAL_ACTIVITIES',
    titulo: 'Hacer algo afuera para entender lo de adentro',
    mecanismo:
      'La empresa patrocina actividades de impacto social concreto y de corto plazo — no eventos de team building. El equipo trabaja junto en algo con resultado visible fuera de la organización. Eso activa una percepción de justicia y propósito que las políticas internas no logran instalar por decreto.',
    evidencia: 'Burbano et al. (2021) — Management Science — experimento aleatorizado banco LATAM',
    plazo: '6 a 12 meses para impacto observable en retención.',
    metrica:
      'El equipo reporta mayor sentido de propósito y percepción de que la empresa actúa con coherencia. FocalizaHR lo confirma cuando P5_equidad mejora. La métrica de negocio es rotación voluntaria al año.',
    cierre:
      'Una empresa que solo habla de sus valores pero no los demuestra fuera de sus paredes no tiene valores — tiene decoración. El equipo ya sabe la diferencia.',
  },
  DECISION_ACCOUNTABILITY: {
    id: 'DECISION_ACCOUNTABILITY',
    titulo: 'Cada decisión tiene un nombre',
    mecanismo:
      'Cada decisión relevante tiene un responsable identificado — no un comité, no un consenso difuso. Ese nombre aparece cuando la decisión funciona y cuando no funciona. Las reglas son las mismas para todos y se aplican igual independiente de quién decide.',
    evidencia: 'Colquitt et al. (2001) — Journal of Applied Psychology',
    plazo: '10 a 12 meses para revertir percepción de injusticia instalada.',
    metrica:
      'El equipo percibe que las decisiones de avance y reconocimiento tienen lógica visible y consistente. FocalizaHR lo confirma cuando P5_equidad mejora y favoritismo_implicito deja de aparecer.',
    cierre:
      'Cuando las reglas no son visibles, cada decisión se interpreta como favoritismo. Los que tienen dónde ir, se van. Los que no, se quedan y lo comentan.',
  },
  WORK_REDESIGN: {
    id: 'WORK_REDESIGN',
    titulo: 'El problema no es la gente — es cómo está diseñado el trabajo',
    mecanismo:
      'El equipo revisa junto qué tareas se duplican, qué reuniones sobran, qué dependencias bloquean. La conversación se traslada de quién falla a qué está mal diseñado. El conflicto deja de ser entre personas y pasa a ser sobre el sistema.',
    evidencia: 'Leiter & Maslach (2009) — Journal of Organizational Behavior',
    plazo:
      'Primeras señales entre el mes 1 y el 3. Consolidación entre 6 y 12 meses.',
    metrica:
      'El equipo reporta menos bloqueos sistémicos y más claridad sobre qué les corresponde hacer. FocalizaHR lo confirma cuando P8_agotamiento mejora y resignacion_aprendida reduce su intensidad.',
    cierre:
      'Un equipo agotado no es un equipo poco comprometido. Es un equipo al que le fallaron las condiciones. La diferencia importa porque la solución es completamente distinta.',
  },
  LEADERSHIP_ACCOUNTABILITY: {
    id: 'LEADERSHIP_ACCOUNTABILITY',
    titulo: 'Liderazgo medido, no asumido',
    mecanismo:
      'El comportamiento del líder se evalúa con los mismos datos que su equipo: reuniones fuera de horario, calidad del feedback, rotación bajo su gestión. Su evaluación y su avance quedan amarrados a esos indicadores — no solo al resultado financiero del trimestre.',
    evidencia:
      'Derue et al. (2011) — Journal of Organizational Behavior — meta-análisis 335 evaluaciones de liderazgo.',
    plazo: '8 a 10 meses con acompañamiento estructurado.',
    metrica:
      'Rotación bajo gestión del líder disminuye. El equipo reporta más conversaciones reales con su jefe. FocalizaHR lo confirma cuando P7_liderazgo mejora en el siguiente ciclo.',
    cierre:
      'Un líder que solo rinde cuentas por el número del trimestre optimiza para el número del trimestre. Lo que le pase a su equipo en el proceso no aparece en ningún reporte — hasta que aparece en la rotación.',
  },
  OPPORTUNITY_GOVERNANCE: {
    id: 'OPPORTUNITY_GOVERNANCE',
    titulo: 'Reglas claras para repartir oportunidades',
    mecanismo:
      'La asignación de proyectos visibles, mentorías y promociones sigue un mapa documentado — no la cercanía con el jefe. Quién decide qué queda escrito antes de que aparezca la oportunidad. El líder ya no puede elegir favoritos sin que otros lo revisen.',
    evidencia:
      'Colquitt et al. (2001) — Journal of Applied Psychology — meta-análisis 183 estudios.',
    plazo:
      'Prevención temprana — si no se instala antes del primer año del equipo, el patrón ya está normalizado.',
    metrica:
      'El equipo percibe que las oportunidades se distribuyen con lógica visible. FocalizaHR lo confirma cuando P5_equidad mejora y favoritismo_implicito deja de aparecer.',
    cierre:
      'Cuando las reglas no son visibles, cada oportunidad que se asigna se interpreta como favoritismo. Los que tienen dónde ir, se van. Los que no, se quedan y lo comentan.',
  },
  BEHAVIORAL_TRIANGULATION: {
    id: 'BEHAVIORAL_TRIANGULATION',
    titulo: 'Cruzar lo que se dice con lo que se hace',
    mecanismo:
      'Las respuestas de la encuesta se contrastan con datos de comportamiento real: rotación, denuncias previas, ausentismo, patrones de comunicación. Cuando ambos relatos coinciden, el dato es confiable. Cuando no, hay algo que la encuesta no está mostrando.',
    evidencia:
      'Perceptyx — escalas rigurosas vs tiende-a-acordar: 8-12 puntos de sesgo enmascarado. PMC 2024 — Machine Learning person-fit indices para detección de deseabilidad social.',
    plazo: 'Inmediato. Desde el primer ciclo de medición.',
    metrica:
      'Convergencia entre score declarado y comportamiento real — rotación, ausentismo.',
    cierre:
      'Los números dicen que está bien. Nadie en la organización lo cree. Cuando esa brecha lleva ciclos sin nombrarse, la encuesta dejó de ser una herramienta — se convirtió en el problema.',
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
    medio: ['HIGH_FREQ_PULSES', 'DECISION_ACCOUNTABILITY', 'OPPORTUNITY_GOVERNANCE'],
    bajo: ['OPPORTUNITY_GOVERNANCE', 'DECISION_ACCOUNTABILITY', 'PROSOCIAL_ACTIVITIES'],
    critico: ['OPPORTUNITY_GOVERNANCE', 'DECISION_ACCOUNTABILITY', 'PROSOCIAL_ACTIVITIES'],
  },
  P7_liderazgo: {
    medio: ['FAST_FEEDBACK', 'PSYCH_SAFETY_MODELING', 'LEADERSHIP_ACCOUNTABILITY'],
    bajo: ['PSYCH_SAFETY_MODELING', 'LEADERSHIP_ACCOUNTABILITY', 'FAST_FEEDBACK'],
    critico: ['LEADERSHIP_ACCOUNTABILITY', 'PSYCH_SAFETY_MODELING', 'BYSTANDER_INTERVENTION'],
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
  favoritismo_implicito:   ['OPPORTUNITY_GOVERNANCE', 'DECISION_ACCOUNTABILITY', 'PROSOCIAL_ACTIVITIES'],
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
const TEATRO_TRIPLETA = ['BEHAVIORAL_TRIANGULATION', 'DISSENT_INSTITUTIONALIZATION', 'PSYCH_SAFETY_MODELING'];

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
