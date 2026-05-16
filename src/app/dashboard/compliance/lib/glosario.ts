// src/app/dashboard/compliance/lib/glosario.ts
// Glosario contextual del módulo Compliance — descripciones ejecutivas de
// los sellos forenses (A1-A5) y los tipos de alerta. Se renderizan vía
// TooltipContext al hacer hover/tap sobre los chips correspondientes.
//
// Lenguaje: gerente a gerente, sin jerga técnica. Cero "ISA", "Likert",
// "LLM", "convergencia". Las descripciones derivan del doc maestro
// CONVERGENCIA_AMBIENTE_SANO_v3 Anexo C/D, traducidas a lenguaje ejecutivo
// y alineadas con los labels reales del código (CASO_LABELS / ALERT_LABELS).

import type { CasoMotorA } from '@/lib/services/compliance/ConvergenciaEngine';
import type { ComplianceAlertType } from '@/config/complianceAlertConfig';

export interface GlosarioEntry {
  /** Título del tooltip — el label ejecutivo del sello/alerta. */
  title: string;
  /** Descripción ejecutiva — qué significa, en 1-2 oraciones. */
  explanation: string;
}

// ─────────────────────────────────────────────────────────────────────
// Sellos forenses A1-A5 (chips en BandaDepartamento)
// ─────────────────────────────────────────────────────────────────────

export const SELLO_GLOSARIO: Record<CasoMotorA, GlosarioEntry> = {
  A1: {
    title: 'Doble confirmación',
    explanation:
      'Dos mediciones independientes del mismo estudio coinciden sobre el departamento. Cuando dos lecturas distintas apuntan a lo mismo, deja de ser margen de error.',
  },
  A2: {
    title: 'Teatro detectado',
    explanation:
      'Las respuestas numéricas del departamento se ven bien, pero el texto libre dice otra cosa. La distancia entre ambas es la señal.',
  },
  A3: {
    title: 'Sesgo de género',
    explanation:
      'El análisis detecta diferencia de trato o de lenguaje según el género dentro del departamento.',
  },
  A4: {
    title: 'Variable de liderazgo',
    explanation:
      'Dos departamentos bajo el mismo líder con resultados opuestos. Cuando el liderazgo es constante y el resultado cambia, la causa se aísla.',
  },
  A5: {
    title: 'Silencio con puntaje alto',
    explanation:
      'El promedio del departamento se ve saludable, pero el texto libre revela silencio. El número tranquiliza; las palabras contradicen.',
  },
};

// ─────────────────────────────────────────────────────────────────────
// Tipos de alerta (chips en BandaDepartamento + SectionAlertas)
// ─────────────────────────────────────────────────────────────────────

export const ALERTA_GLOSARIO: Record<ComplianceAlertType, GlosarioEntry> = {
  liderazgo_toxico: {
    title: 'Liderazgo en riesgo',
    explanation:
      'Varios equipos bajo la misma línea de mando muestran señales críticas a la vez. El patrón apunta al estilo de liderazgo, no a casos aislados.',
  },
  riesgo_convergente: {
    title: 'Riesgo convergente',
    explanation:
      'Señales de distintas fuentes coinciden sobre el mismo departamento en el mismo período. La coincidencia amplifica el riesgo.',
  },
  deterioro_sostenido: {
    title: 'Deterioro sostenido',
    explanation:
      'El departamento viene cayendo de forma consistente entre ciclos. La tendencia sugiere un problema de estructura, no de coyuntura.',
  },
  silencio_organizacional: {
    title: 'Silencio organizacional',
    explanation:
      'El análisis del texto libre sugiere evasión y desconexión emocional. Señal temprana — sin obligación de acción inmediata.',
  },
  senal_ignorada: {
    title: 'Señal sin gestión',
    explanation:
      'Se gestionaron alertas previas pero el indicador no mejoró. El síntoma se atendió; la causa sigue.',
  },
  silencio_con_voz_externa: {
    title: 'Señales sin medición',
    explanation:
      'El departamento no participó en la medición, pero otras fuentes documentaron señales activas en el mismo período. La ausencia de voz, cruzada con voz externa, es el hallazgo.',
  },
};
