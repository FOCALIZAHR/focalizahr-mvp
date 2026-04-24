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
    titulo: 'Liderazgo empático — modelar vulnerabilidad',
    mecanismo:
      'El líder admite errores propios públicamente y solicita feedback correctivo de su equipo',
    evidencia: 'BCG — 28.000 empleados',
    plazo: '8-10 meses',
    metrica: 'Elimina brecha de deserción en grupos diversos',
  },
  BYSTANDER_INTERVENTION: {
    id: 'BYSTANDER_INTERVENTION',
    titulo: 'Intervención activa de espectadores',
    mecanismo:
      'Entrena al colectivo (no a la víctima) a desescalar activamente y validar públicamente',
    evidencia: 'MDPI Microaggressions 2024',
    plazo: '3-6 meses',
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
    titulo: 'Institucionalizar el disenso',
    mecanismo:
      'Asignar rotativamente el rol de "abogado del diablo" en reuniones críticas',
    evidencia: 'McKinsey Risk Culture 2024',
    plazo: '2-3 ciclos trimestrales',
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
  ALGORITHMIC_TRANSPARENCY: {
    id: 'ALGORITHMIC_TRANSPARENCY',
    titulo: 'Transparencia algorítmica en promociones',
    mecanismo:
      'Calibración colegiada del desempeño — el avance no depende del sesgo de un solo supervisor',
    evidencia: 'Columbia SPS — Organizational Justice',
    plazo: '3-6 meses',
    metrica: 'r = -0.436 entre inequidad percibida e intención de rotación',
  },
  RELATIONAL_REDESIGN: {
    id: 'RELATIONAL_REDESIGN',
    titulo: 'Rediseño del ecosistema relacional',
    mecanismo:
      'Grupos de apoyo de pares, círculos de diálogo facilitado y rutinas post-incidente',
    evidencia: 'Teoría Relacional-Cultural — PMC 2024',
    plazo: '3-6 meses',
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

export const DIMENSION_INTERVENTIONS: DimensionMatrix = {
  P2_seguridad: {
    medio: ['HIGH_FREQ_PULSES', 'PSYCH_SAFETY_MODELING', 'FAST_FEEDBACK'],
    bajo: ['FAST_FEEDBACK', 'PSYCH_SAFETY_MODELING', 'HIGH_FREQ_PULSES'],
    critico: ['FAST_FEEDBACK', 'BYSTANDER_INTERVENTION', 'HIGH_FREQ_PULSES'],
  },
  P3_disenso: {
    medio: ['HIGH_FREQ_PULSES', 'DISSENT_INSTITUTIONALIZATION', 'FAST_FEEDBACK'],
    bajo: ['DISSENT_INSTITUTIONALIZATION', 'FAST_FEEDBACK', 'HIGH_FREQ_PULSES'],
    critico: ['DISSENT_INSTITUTIONALIZATION', 'BYSTANDER_INTERVENTION', 'HIGH_FREQ_PULSES'],
  },
  P4_microagresiones: {
    medio: ['HIGH_FREQ_PULSES', 'BYSTANDER_INTERVENTION', 'FAST_FEEDBACK'],
    bajo: ['BYSTANDER_INTERVENTION', 'HIGH_FREQ_PULSES', 'FAST_FEEDBACK'],
    critico: ['BYSTANDER_INTERVENTION', 'HIGH_FREQ_PULSES', 'RELATIONAL_REDESIGN'],
  },
  P5_equidad: {
    medio: ['HIGH_FREQ_PULSES', 'ALGORITHMIC_TRANSPARENCY', 'PROSOCIAL_ACTIVITIES'],
    bajo: ['ALGORITHMIC_TRANSPARENCY', 'PROSOCIAL_ACTIVITIES', 'HIGH_FREQ_PULSES'],
    critico: ['PROSOCIAL_ACTIVITIES', 'ALGORITHMIC_TRANSPARENCY', 'HIGH_FREQ_PULSES'],
  },
  P7_liderazgo: {
    medio: ['FAST_FEEDBACK', 'HIGH_FREQ_PULSES', 'PSYCH_SAFETY_MODELING'],
    bajo: ['FAST_FEEDBACK', 'PSYCH_SAFETY_MODELING', 'DISSENT_INSTITUTIONALIZATION'],
    critico: ['FAST_FEEDBACK', 'BYSTANDER_INTERVENTION', 'HIGH_FREQ_PULSES'],
  },
  P8_agotamiento: {
    medio: ['HIGH_FREQ_PULSES', 'RELATIONAL_REDESIGN', 'FAST_FEEDBACK'],
    bajo: ['RELATIONAL_REDESIGN', 'HIGH_FREQ_PULSES', 'BYSTANDER_INTERVENTION'],
    critico: ['RELATIONAL_REDESIGN', 'BYSTANDER_INTERVENTION', 'HIGH_FREQ_PULSES'],
  },
};

// Placeholders para patrones y alertas. El TASK indica que Deep Research v2
// los actualizará; por ahora default común.
const DEFAULT_TRIPLETA = ['HIGH_FREQ_PULSES', 'BYSTANDER_INTERVENTION', 'FAST_FEEDBACK'];

export const PATRON_INTERVENTIONS: Record<PatronNombre | 'default', string[]> = {
  default: DEFAULT_TRIPLETA,
  silencio_organizacional: DEFAULT_TRIPLETA,
  hostilidad_normalizada: DEFAULT_TRIPLETA,
  favoritismo_implicito: DEFAULT_TRIPLETA,
  resignacion_aprendida: DEFAULT_TRIPLETA,
  miedo_represalias: DEFAULT_TRIPLETA,
};

export const ALERT_INTERVENTIONS: Record<ComplianceAlertType | 'default', string[]> = {
  default: DEFAULT_TRIPLETA,
  riesgo_convergente: DEFAULT_TRIPLETA,
  liderazgo_toxico: DEFAULT_TRIPLETA,
  silencio_organizacional: DEFAULT_TRIPLETA,
  deterioro_sostenido: DEFAULT_TRIPLETA,
  senal_ignorada: DEFAULT_TRIPLETA,
};

// ═══════════════════════════════════════════════════════════════════
// CAPA 3 — Motor de consolidación
// ═══════════════════════════════════════════════════════════════════

export type TriggerType = 'dimension_low' | 'patron' | 'alert';

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
    const nombre = t.ref as PatronNombre;
    return PATRON_INTERVENTIONS[nombre] ?? PATRON_INTERVENTIONS.default;
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
  interventionId: string,
  resolvesTriggers: TriggerInput[],
  allTriggers: TriggerInput[]
): string {
  const inv = INTERVENTION_CATALOG[interventionId];
  const isCritical = allTriggers.some((t) => t.riskLevel === 'critico');
  const labels = resolvesTriggers.map((t) => t.label).join(' y ');
  const pct = Math.round((resolvesTriggers.length / allTriggers.length) * 100);

  return (
    `Recomendación consolidada: ${inv.titulo} resuelve el ${pct}% de las causas raíz ` +
    `de sus focos actuales (${labels}). ` +
    (isCritical
      ? 'El nivel crítico exige una sola acción estructural — mayor adherencia y resultado más rápido. '
      : 'Ejecutar una sola intervención garantiza mayor adherencia. ') +
    `Evidencia: ${inv.evidencia}. Plazo: ${inv.plazo}.`
  );
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
