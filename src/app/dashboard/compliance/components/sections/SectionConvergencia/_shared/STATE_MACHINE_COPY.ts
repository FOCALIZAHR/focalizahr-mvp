// Copy de los 5 estados del header (ConvergenciaOrgHeader).
// Plan: PLAN_UI_C3_SECCION_CONVERGENCIA_v2.md sec "Componente 1".
// Auditado contra las 6 Reglas de Oro del skill focalizahr-narrativas.

import { CRITICAL_BY_MANAGER_COPY } from './CRITICAL_BY_MANAGER_COPY';
import type { HeaderState } from './helpers';

export interface HeaderCopy {
  /** Tag superior 10px uppercase — contexto del estado. */
  contexto: string;
  /** Titular editorial 44px — primera frase en blanco. */
  titularLine1: string;
  /** Titular editorial 44px — segunda frase con fhr-title-gradient (cyan). */
  titularLine2: string;
  /** Veredicto en cursiva con border-l. Concentra el hallazgo en una oración. */
  veredicto: string;
  /** Lego narrativo (3-5 oraciones). Spec sec narrativas: contradicción → causas → consecuencia. */
  lego: string;
  /** Cierre de urgencia (Regla 6 del skill). Frase única que ancla la urgencia sin alarmar. */
  cierre?: string;
}

export const STATE_MACHINE_COPY: Record<HeaderState, HeaderCopy> = {
  // ──────────────────────────────────────────────────────────────────
  // Estado 1 — criticalByManager activo (precedencia sobre todos)
  // ──────────────────────────────────────────────────────────────────
  critical_by_manager: {
    contexto: 'LIDERAZGO BAJO ANÁLISIS',
    titularLine1: CRITICAL_BY_MANAGER_COPY.titularHero,        // "El riesgo no es geográfico."
    titularLine2: CRITICAL_BY_MANAGER_COPY.titularHeroSegunda, // "Es jerárquico."
    veredicto: CRITICAL_BY_MANAGER_COPY.veredicto,
    lego: 'Múltiples áreas bajo el mismo mando muestran síntomas idénticos. Cuando eso ocurre, el problema deja de ser de clima. El riesgo no está en los equipos.',
    cierre: 'Cada ciclo que pasa sin una conversación directa consolida el patrón.',
  },

  // ──────────────────────────────────────────────────────────────────
  // Estado 2 — fallaCicloDeVida activo (ISA<50 + EIS o EXO críticos)
  // ──────────────────────────────────────────────────────────────────
  falla_ciclo_vida: {
    contexto: 'CICLO COMPLETO COMPROMETIDO',
    titularLine1: 'El talento no renuncia.',
    titularLine2: 'El sistema lo expulsa.',
    veredicto:
      'La toxicidad no es un evento aislado. El patrón sobrevive desde la integración hasta la salida.',
    lego: 'Los nuevos talentos perciben la fricción en sus primeros días. La primera línea la sostiene en silencio. Las salidas lo confirman como la causa principal. El ciclo de pérdida está completo — y el costo de reemplazo no es un evento, es estructura.',
    cierre: 'El próximo ciclo confirmará si esto es tendencia o un momento puntual.',
  },

  // ──────────────────────────────────────────────────────────────────
  // Estado 3 — teatroDetectado activo (A2 o A5)
  // ──────────────────────────────────────────────────────────────────
  teatro_detectado: {
    contexto: 'SEÑAL DE ALERTA INTERNA',
    titularLine1: 'Todo parece estar bien.',
    titularLine2: 'Nada lo está.',
    veredicto:
      'Las métricas muestran un ambiente sano, pero el análisis del texto libre revela una cultura donde decir la verdad tiene un costo.',
    lego: 'El equipo aprendió a responder lo que se espera leer. Cuando el miedo supera a la honestidad, las encuestas se convierten en validación de lo que ya se sabe — no en señal de lo que realmente ocurre. La dirección está operando a ciegas.',
    cierre: 'El próximo ciclo medirá si el silencio se profundiza o si algo cambió.',
  },

  // ──────────────────────────────────────────────────────────────────
  // Estado 4 — convergencia múltiple (sin los anteriores)
  // ──────────────────────────────────────────────────────────────────
  convergencia_multiple: {
    contexto: 'SEÑALES CONVERGENTES',
    titularLine1: 'Las señales aisladas',
    titularLine2: 'se convirtieron en patrón.',
    veredicto:
      'Múltiples instrumentos apuntan a las mismas áreas, confirmando que la fricción es real y sostenida.',
    lego: 'Una señal es un dato. Tres señales en el mismo lugar son un problema que ya tiene historial. El sistema cruzó la percepción actual con el historial de salidas y alertas previas.',
    cierre: 'La evidencia es concluyente.',
  },

  // ──────────────────────────────────────────────────────────────────
  // Estado 5 — sin convergencia grave
  // ──────────────────────────────────────────────────────────────────
  sin_convergencia: {
    contexto: 'ESTADO DEL SISTEMA',
    titularLine1: 'Operando con',
    titularLine2: 'visión despejada.',
    veredicto:
      'El motor de convergencia no detectó patrones cruzados de alta gravedad entre los instrumentos activos.',
    lego: 'Las fricciones detectadas se mantienen como eventos aislados. No han hecho resonancia con el historial de salidas ni con la integración de nuevos talentos.',
    // Estado 5 NO tiene cierre — no hay urgencia que anclar.
  },
};
