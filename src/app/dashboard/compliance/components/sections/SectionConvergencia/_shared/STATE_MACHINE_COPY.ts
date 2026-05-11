// State Machine del header de C3 — 5 estados con copy editorial aprobado.
// Fuente: .claude/tasks/PLAN_CIERRE_C3_HOJA_RUTA_C4.md (v3, 2026-05-10).
//
// Precedencia (mayor a menor severidad):
//   1. criticalByManager → Estado 1
//   2. fallaCicloDeVida  → Estado 2
//   3. teatroDetectado   → Estado 3
//   4. ≥2 deptos con convergencia (sin los anteriores) → Estado 4
//   5. resto / fallback   → Estado 5
//
// Estados 1–4: armonizados sesión 2026-05-10 con copy v3 (sin auto-referencias
// al "sistema" / "análisis"). Última frase de cada lego se separa en `cierre`
// para preservar el quiebre visual italic del header.
// Estado 5: cubre "1 dept con convergencia interna simple, sin flags 1-3" +
// fallback de payloads pre-deploy con flags `undefined`.

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
      'El patrón no respeta los límites de un departamento — sigue a quien lo lidera.',
    lego: 'Áreas distintas bajo el mismo mando muestran síntomas idénticos. Cuando eso ocurre, el problema no está en los equipos.',
    cierre:
      'Cada ciclo sin abordar esa lectura es uno más sin corrección.',
  },

  2: {
    contexto: 'CICLO COMPLETO COMPROMETIDO',
    titularLine1: 'El talento no renuncia.',
    titularLine2: 'El ambiente lo expulsa.',
    veredicto:
      'El deterioro no es un evento aislado. Sobrevive desde el primer día hasta la salida.',
    lego: 'Los que acaban de entrar lo perciben antes de cumplir 30 días. Los que están lo sostienen en silencio. Los que se fueron lo nombraron como razón.',
    cierre:
      'El próximo ciclo confirmará si esto es tendencia o un momento puntual.',
  },

  3: {
    contexto: 'ALERTA INTERNA',
    titularLine1: 'Todo parece estar bien.',
    titularLine2: 'Nada lo está.',
    veredicto:
      'Los números muestran un ambiente sano. Lo que las personas escribieron dice lo contrario.',
    lego: 'El equipo aprendió a responder lo que se espera leer. Cuando el miedo supera a la honestidad, la encuesta deja de ser una señal — se convierte en validación de lo que ya se sabe. La dirección está operando a ciegas.',
  },

  4: {
    contexto: 'PATRÓN CONFIRMADO',
    titularLine1: 'Los datos aislados',
    titularLine2: 'se convirtieron en patrón.',
    veredicto:
      'Varias lecturas independientes apuntan a las mismas áreas. La coincidencia ya no es casual.',
    lego: 'Un dato es una observación. Tres datos en el mismo lugar son un problema con historial.',
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
