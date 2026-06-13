// src/lib/services/compliance/CascadaNarrativeDictionary.ts
// Narrativas de los nodos del Acto Ancla de la Cascada Ejecutiva (Ambiente Sano).
// Centralizadas aquí — no inline en AnclaISA. Auditadas vs las 6 Reglas de Oro
// (skill focalizahr-narrativas). El número del nodo vive en el componente;
// estas funciones traducen el score a una lectura ejecutiva de una línea.

/** Narrativa del nodo DIMENSIONES (voz estructurada — Likert P2-P8). */
export function buildNodoDimensionesNarrativa(value: number): string {
  if (value >= 80) return 'Las respuestas estructuradas están en norma.';
  if (value >= 60) return 'La encuesta marca zona de observación.';
  return 'Las respuestas estructuradas caen bajo el umbral.';
}

/** Narrativa del nodo ANÁLISIS IA (voz libre — análisis del texto abierto). */
export function buildNodoAnalisisNarrativa(value: number): string {
  if (value >= 80) return 'Lo que se escribió no contradice lo que se marcó.';
  if (value >= 60) return 'El lenguaje muestra tensión, sin un patrón dominante.';
  return 'Las palabras dicen algo distinto a los números.';
}

/** Narrativa del nodo CONVERGENCIA (cruce con fuentes externas).
 *  Valor alto = sin amplificación externa; valor bajo = varias fuentes coinciden. */
export function buildNodoConvergenciaNarrativa(value: number): string {
  if (value >= 100) return 'Sin señales externas que amplifiquen.';
  if (value >= 75) return 'Una fuente externa empieza a coincidir.';
  return 'Dos o más fuentes apuntan al mismo lugar.';
}

/** Nota de ponderación dinámica bajo los nodos del Ancla.
 *  Omite los componentes con peso 0 (campañas con menos instrumentos). */
export function buildWeightNote(pesos: {
  estructurada: number;
  libre: number;
  convergencia: number;
}): string {
  const parts: string[] = [`${pesos.estructurada}% dimensiones`];
  if (pesos.libre > 0) parts.push(`${pesos.libre}% análisis IA`);
  if (pesos.convergencia > 0) parts.push(`${pesos.convergencia}% convergencia`);
  return `Ponderación: ${parts.join(' · ')}`;
}

/** Sustento del nodo CONVERGENCIA — tooltip científico. */
export const CONVERGENCIA_TOOLTIP =
  'Mide si lo que detecta la encuesta interna coincide con lo que reportan ' +
  'quienes se fueron y quienes acaban de entrar. Cuando dos fuentes ' +
  'independientes confirman la misma señal, la probabilidad de error se ' +
  'reduce significativamente. Sin cruce de fuentes, cualquier señal puede ser ruido.';

/** Sustento del nodo PREDICTOR — ancla científica. Gate 6 ítem 3: agrega el
 *  elemento (c) umbrales de interpretación (frase del medio, escala de la
 *  cascada) y barre el em-dash. Verbatim arquitectura 2026-06-13. */
export const PREDICTOR_TOOLTIP =
  'La cultura tóxica predice rotación 10 veces mejor que la compensación. ' +
  'No es que la gente se va por sueldo: se va porque el ambiente la expulsa. ' +
  'Se considera señal fuerte cuando el ambiente queda bajo el nivel sano; ' +
  'bajo nivel crítico, es el predictor que manda sobre cualquier otro. ' +
  'Fuente: MIT Sloan Management Review, 2022. Muestra: 500 empresas, ' +
  '170 factores culturales analizados.';
