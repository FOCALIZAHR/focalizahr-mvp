// State Machine del header de C3 — 5 estados con copy editorial aprobado.
// Fuente: .claude/tasks/PLAN_UI_C3_SECCION_CONVERGENCIA_v2.md §121–240.
//
// Precedencia (mayor a menor severidad, plan v2 §328):
//   1. criticalByManager → Estado 1
//   2. fallaCicloDeVida  → Estado 2
//   3. teatroDetectado   → Estado 3
//   4. ≥2 deptos con convergencia (sin los anteriores) → Estado 4
//   5. resto / fallback   → Estado 5
//
// Estados 1–4: verbatim del plan v2 §123–221.
// Estado 5: redactado en sesión 2026-05-10 para cubrir "1 dept con
// convergencia interna simple, sin flags 1-3" + fallback de payloads
// pre-deploy con flags `undefined`. Audited contra las 6 Reglas de
// `focalizahr-narrativas`.

export type HeaderState = 1 | 2 | 3 | 4 | 5;

export interface StateCopy {
  /** Eyebrow uppercase tracking-wide (ej. "LIDERAZGO BAJO ANÁLISIS"). */
  contexto: string;
  /** Primera línea del titular — text-white. */
  titularLine1: string;
  /** Segunda línea del titular — fhr-title-gradient. */
  titularLine2: string;
  /** Párrafo italic en slate-500 — veredicto editorial. */
  veredicto: string;
  /** Narrativa principal — slate-300 leading-relaxed. */
  lego: string;
  /** Cierre Regla 6 — párrafo aparte. Optional para futuro estados sin cierre. */
  cierre?: string;
}

export const STATE_MACHINE_COPY: Record<HeaderState, StateCopy> = {
  1: {
    contexto: 'LIDERAZGO BAJO ANÁLISIS',
    titularLine1: 'El riesgo no es geográfico.',
    titularLine2: 'Es jerárquico.',
    veredicto:
      'El sistema detectó que la convergencia de señales críticas no respeta los límites de un departamento, sino que sigue la huella de un liderazgo específico.',
    lego: 'Múltiples áreas bajo el mismo mando muestran síntomas idénticos. Cuando eso ocurre, el problema deja de ser de clima. El riesgo no está en los equipos.',
    cierre:
      'Cada ciclo que pasa sin una conversación directa consolida el patrón.',
  },

  2: {
    contexto: 'CICLO COMPLETO COMPROMETIDO',
    titularLine1: 'El talento no renuncia.',
    titularLine2: 'El sistema lo expulsa.',
    veredicto:
      'La toxicidad no es un evento aislado. El patrón sobrevive desde la integración hasta la salida.',
    lego: 'Los nuevos talentos perciben la fricción en sus primeros días. La primera línea la sostiene en silencio. Las salidas lo confirman como la causa principal. El ciclo de pérdida está completo — y el costo de reemplazo no es un evento, es estructura.',
    cierre:
      'El próximo ciclo confirmará si esto es tendencia o un momento puntual.',
  },

  3: {
    contexto: 'SEÑAL DE ALERTA INTERNA',
    titularLine1: 'Todo parece estar bien.',
    titularLine2: 'Nada lo está.',
    veredicto:
      'Las métricas muestran un ambiente sano, pero el análisis del texto libre revela una cultura donde decir la verdad tiene un costo.',
    lego: 'El equipo aprendió a responder lo que se espera leer. Cuando el miedo supera a la honestidad, las encuestas se convierten en validación de lo que ya se sabe — no en señal de lo que realmente ocurre. La dirección está operando a ciegas.',
    cierre:
      'El próximo ciclo medirá si el silencio se profundiza o si algo cambió.',
  },

  4: {
    contexto: 'SEÑALES CONVERGENTES',
    titularLine1: 'Las señales aisladas',
    titularLine2: 'se convirtieron en patrón.',
    veredicto:
      'Múltiples instrumentos apuntan a las mismas áreas, confirmando que la fricción es real y sostenida.',
    lego: 'Una señal es un dato. Tres señales en el mismo lugar son un problema que ya tiene historial. El sistema cruzó la percepción actual con el historial de salidas y alertas previas.',
    cierre: 'La evidencia es concluyente.',
  },

  5: {
    contexto: 'SEÑAL AISLADA',
    titularLine1: 'Una señal sola',
    titularLine2: 'no es todavía un patrón.',
    veredicto:
      'Un departamento muestra fricción interna. Los otros instrumentos no la confirman, y no aparece en otras áreas.',
    lego: 'Una señal puede ser un evento puntual o el primer indicio de algo que se propaga. La diferencia se confirma en el próximo ciclo, no en este. El dato existe; el patrón todavía no.',
    cierre: 'Si la señal vuelve, deja de ser aislada.',
  },
};
