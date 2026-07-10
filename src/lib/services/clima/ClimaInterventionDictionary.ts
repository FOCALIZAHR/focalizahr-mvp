// src/lib/services/clima/ClimaInterventionDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// EX Clima Gate 5A — Diccionario de intervenciones sugeridas.
//
// 8 dimensiones REALES (taxonomía Gate 1A) × 4 niveles de severidad (RiskZone:
// verde/amarilla/naranja/roja) = 32 celdas. Cada celda: narrative + steps +
// suggestedProduct. Lo consume ClimaActionPlanBuilder para poblar cada
// ClimaDecisionItem.intervention.
//
// ⚠️ CONTENIDO PROVISIONAL — Principio 4 del MAESTRO ("Narrativas las escribe
//    Victor o Studio IA. Code las copia EXACTO."). Code SÓLO scaffoldea la
//    ESTRUCTURA (8×4, dónde va cada slot). El copy final NO está escrito: cada
//    narrativa arranca con "PROVISIONAL — " para que sea imposible mostrarla a
//    cliente por accidente. No asumir que el diccionario está listo.
//
// Patrón: `Record<categoria, Record<RiskZone, …>>` — mismo molde zone-keyed que
// PORTADA_BY_ZONE en ClimaNarrativeDictionary. Fuente única de la taxonomía de
// drivers para el gate.
// ════════════════════════════════════════════════════════════════════════════

import type { RiskZone } from '@/lib/services/clima/climaThresholds';
import type { ClimaInterventionCell } from '@/types/clima-planes';

/** Estado del contenido — guard explícito contra "esto ya está listo". */
export const DICTIONARY_CONTENT_STATUS = 'PROVISIONAL' as const;

/** Las 8 dimensiones reales del banco de clima (Gate 1A). Fuente única del gate. */
export const CLIMA_DRIVER_CATEGORIES = [
  'satisfaccion',
  'liderazgo',
  'autonomia',
  'desarrollo',
  'crecimiento',
  'comunicacion',
  'reconocimiento',
  'compensaciones',
] as const;

export type ClimaDriverCategory = (typeof CLIMA_DRIVER_CATEGORIES)[number];

const P = 'PROVISIONAL — '; // prefijo obligatorio de toda narrativa scaffold

// ════════════════════════════════════════════════════════════════════════════
// 32 celdas (8 × 4). Contenido de relleno estructural — Studio IA lo reemplaza.
// ════════════════════════════════════════════════════════════════════════════

export const CLIMA_INTERVENTION_DICTIONARY: Record<
  ClimaDriverCategory,
  Record<RiskZone, ClimaInterventionCell>
> = {
  satisfaccion: {
    verde: { narrative: `${P}Satisfacción sana: sostener las prácticas que la sostienen.`, steps: ['Reforzar rituales de equipo que ya funcionan', 'Documentar qué está funcionando para replicar'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Satisfacción bajo el objetivo: observar y reforzar de forma ligera.`, steps: ['Conversación 1:1 del jefe con el equipo', 'Identificar 1 fricción concreta a resolver'], suggestedProduct: 'PDI (desarrollo suave)' },
    naranja: { narrative: `${P}Satisfacción en riesgo: intervención dirigida del área.`, steps: ['Diagnóstico de causa raíz con el equipo', 'Plan de acción de área con responsable y plazo'], suggestedProduct: 'Meta de área medible' },
    roja: { narrative: `${P}Satisfacción crítica: intervención urgente y escalamiento.`, steps: ['Escalar a CEO/HRBP en 2 semanas', 'Plan de recuperación con hito de seguimiento'], suggestedProduct: 'Meta dura + Programa dirigido' },
  },
  liderazgo: {
    verde: { narrative: `${P}Liderazgo sólido: sostener y transferir la práctica a otras áreas.`, steps: ['Reconocer al líder del área', 'Usar al área como referencia interna'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Liderazgo bajo el objetivo: refuerzo de habilidades de gestión.`, steps: ['PDI de liderazgo para el jefe', 'Feedback 360° dirigido'], suggestedProduct: 'PDI (liderazgo)' },
    naranja: { narrative: `${P}Liderazgo en riesgo: acompañamiento dirigido del líder.`, steps: ['Coaching/mentoría al jefe de área', 'Meta de mejora de liderazgo con métrica'], suggestedProduct: 'Programa de Liderazgo' },
    roja: { narrative: `${P}Liderazgo crítico: intervención urgente sobre la conducción del área.`, steps: ['Escalar a CEO/HRBP en 2 semanas', 'Plan de acción con validación en el próximo seguimiento'], suggestedProduct: 'Meta dura + Programa de Liderazgo' },
  },
  autonomia: {
    verde: { narrative: `${P}Autonomía sana: sostener el margen de decisión del equipo.`, steps: ['Mantener delegación efectiva', 'Documentar buenas prácticas de empoderamiento'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Autonomía bajo el objetivo: revisar micromanagement y cargas.`, steps: ['Revisar espacios de decisión del equipo', 'Ajustar 1 proceso que quite autonomía'], suggestedProduct: 'PDI (desarrollo suave)' },
    naranja: { narrative: `${P}Autonomía en riesgo: rediseño dirigido de la delegación.`, steps: ['Diagnóstico de cuellos de decisión', 'Meta de área para ampliar autonomía'], suggestedProduct: 'Meta de área medible' },
    roja: { narrative: `${P}Autonomía crítica: intervención urgente sobre el modelo de control.`, steps: ['Escalar a HRBP en 2 semanas', 'Plan de rediseño con hito de seguimiento'], suggestedProduct: 'Meta dura + Programa dirigido' },
  },
  desarrollo: {
    verde: { narrative: `${P}Desarrollo sano: sostener las oportunidades de crecimiento profesional.`, steps: ['Mantener rutas de aprendizaje activas', 'Reconocer avances de desarrollo'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Desarrollo bajo el objetivo: reforzar plan formativo individual.`, steps: ['Activar PDI por persona', 'Conversación de carrera con el jefe'], suggestedProduct: 'PDI (desarrollo)' },
    naranja: { narrative: `${P}Desarrollo en riesgo: plan formativo dirigido del área.`, steps: ['Mapear brechas de competencia del equipo', 'Meta de desarrollo con métrica'], suggestedProduct: 'Meta de área medible' },
    roja: { narrative: `${P}Desarrollo crítico: intervención urgente sobre estancamiento.`, steps: ['Escalar a HRBP en 2 semanas', 'Plan de desarrollo con validación en seguimiento'], suggestedProduct: 'Meta dura + Programa formativo' },
  },
  crecimiento: {
    verde: { narrative: `${P}Crecimiento sano: sostener las oportunidades de progresión.`, steps: ['Mantener claridad de rutas de progresión', 'Reconocer promociones internas'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Crecimiento bajo el objetivo: clarificar rutas de progresión.`, steps: ['Explicitar criterios de progresión', 'PDI orientado a la siguiente etapa'], suggestedProduct: 'PDI (desarrollo suave)' },
    naranja: { narrative: `${P}Crecimiento en riesgo: plan dirigido de progresión.`, steps: ['Revisar oportunidades internas del área', 'Meta de crecimiento con métrica'], suggestedProduct: 'Meta de área medible' },
    roja: { narrative: `${P}Crecimiento crítico: intervención urgente sobre techo de carrera.`, steps: ['Escalar a HRBP en 2 semanas', 'Plan de retención de talento con seguimiento'], suggestedProduct: 'Meta dura + Programa dirigido' },
  },
  comunicacion: {
    verde: { narrative: `${P}Comunicación sana: sostener los canales que ya funcionan.`, steps: ['Mantener rituales de comunicación', 'Documentar prácticas efectivas'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Comunicación bajo el objetivo: reforzar claridad y frecuencia.`, steps: ['Revisar cadencia de reuniones de equipo', 'Ajustar 1 canal de información clave'], suggestedProduct: 'PDI (desarrollo suave)' },
    naranja: { narrative: `${P}Comunicación en riesgo: rediseño dirigido de los flujos.`, steps: ['Diagnóstico de puntos ciegos de información', 'Meta de área para mejorar comunicación'], suggestedProduct: 'Meta de área medible' },
    roja: { narrative: `${P}Comunicación crítica: intervención urgente sobre desinformación.`, steps: ['Escalar a HRBP en 2 semanas', 'Plan de comunicación con hito de seguimiento'], suggestedProduct: 'Meta dura + Programa dirigido' },
  },
  reconocimiento: {
    verde: { narrative: `${P}Reconocimiento sano: sostener las prácticas de valoración.`, steps: ['Mantener rituales de reconocimiento', 'Replicar buenas prácticas a otras áreas'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Reconocimiento bajo el objetivo: instalar hábito de valoración.`, steps: ['Reconocer logros en reuniones de equipo', 'Feedback positivo específico y frecuente'], suggestedProduct: 'PDI (desarrollo suave)' },
    naranja: { narrative: `${P}Reconocimiento en riesgo: sistema dirigido de reconocimiento.`, steps: ['Diseñar mecánica de reconocimiento del área', 'Meta de área con métrica de valoración'], suggestedProduct: 'Meta de área medible' },
    roja: { narrative: `${P}Reconocimiento crítico: intervención urgente sobre desmotivación.`, steps: ['Escalar a HRBP en 2 semanas', 'Plan de reconocimiento con seguimiento'], suggestedProduct: 'Meta dura + Programa dirigido' },
  },
  compensaciones: {
    verde: { narrative: `${P}Compensaciones sanas: sostener la percepción de equidad.`, steps: ['Mantener transparencia del modelo', 'Comunicar criterios de compensación'], suggestedProduct: 'Sostener práctica' },
    amarilla: { narrative: `${P}Compensaciones bajo el objetivo: revisar percepción de equidad.`, steps: ['Explicitar criterios de compensación al equipo', 'Detectar 1 fuente de inequidad percibida'], suggestedProduct: 'Revisión de equidad' },
    naranja: { narrative: `${P}Compensaciones en riesgo: revisión dirigida de la estructura.`, steps: ['Análisis de bandas del área con RRHH', 'Meta de corrección con plazo'], suggestedProduct: 'Meta de área medible' },
    roja: { narrative: `${P}Compensaciones críticas: intervención urgente sobre inequidad.`, steps: ['Escalar a CEO/HRBP en 2 semanas', 'Plan de corrección con validación en seguimiento'], suggestedProduct: 'Meta dura + Revisión de compensaciones' },
  },
};

// ════════════════════════════════════════════════════════════════════════════
// Lookup — devuelve la celda (dimensión × zona). null si la categoría no es una
// de las 8 dimensiones del banco (el builder decide qué hacer; no revienta).
// ════════════════════════════════════════════════════════════════════════════

export function isClimaDriverCategory(
  category: string
): category is ClimaDriverCategory {
  return (CLIMA_DRIVER_CATEGORIES as readonly string[]).includes(category);
}

export function getIntervention(
  category: string,
  zone: RiskZone
): ClimaInterventionCell | null {
  if (!isClimaDriverCategory(category)) return null;
  return CLIMA_INTERVENTION_DICTIONARY[category][zone];
}
