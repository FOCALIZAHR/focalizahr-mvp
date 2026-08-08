// src/types/clima-text-analysis.ts
// ════════════════════════════════════════════════════════════════════════════
// Contrato TIPADO del análisis de texto de la bitácora (H3a).
//
// Es lo que se persiste en `ClimaActionLog.llmClassification` (Json?), un campo
// que existe en el schema desde Gate 5C y que hasta hoy nadie escribió.
//
// ⛔ TIPADO DESDE EL DÍA 1, decisión de Victor (2026-08-06): el JSON no se guarda
// crudo. Compliance persiste salidas de LLM sin un type que las gobierne, y eso
// obliga a adivinar la forma en cada lectura. Acá el shape se declara ACÁ, el
// servicio devuelve este type, y la UI lo consume sin castear.
//
// `version` no es decorativo: cuando el shape cambie, un lector va a encontrarse
// filas viejas y nuevas conviviendo en la misma tabla. Con el número puede
// decidir; sin él tiene que inferirlo de qué campos están presentes.
// ════════════════════════════════════════════════════════════════════════════

/** Versión del shape persistido. Subir SIEMPRE que cambien los campos. */
export const CLIMA_TEXT_ANALYSIS_VERSION = 1 as const;

/**
 * Modo del verbo núcleo (plan maestro §2.3, motor 2).
 *
 *  - `ejecucion`: describe algo que YA ocurrió. "Modificamos", "Eliminamos",
 *    "Reconocimos". Es el que el plan predice que correlaciona con mejora.
 *  - `intencion`: describe algo que va a ocurrir. "Convocaré", "Definiré",
 *    "Intentaremos", "Voy a contactar".
 *  - `ninguno`: el texto no describe una acción propia. Incluye las
 *    REFUTACIONES —"eso no es verdad, acá todos han crecido"—, que los datos
 *    reales mostraron y que el plan no contemplaba. Se agrupan acá a propósito
 *    en vez de inventarles una categoría: crear un valor nuevo del union es
 *    contrato, y eso lo decide Victor, no el motor.
 */
export type ClimaVerbMode = 'ejecucion' | 'intencion' | 'ninguno';

/**
 * Entidades concretas extraídas del texto (plan maestro §2.3, motor 1).
 *
 * Se guardan los FRAGMENTOS, no solo el conteo: "densidad 3" no se puede auditar,
 * pero ["el martes", "Tableau", "2 horas"] sí. Es el mismo criterio que
 * `PatronesLLMService` con sus `fragmentos`, y lo que después permite citar
 * evidencia literal en la cascada de hallazgos sin volver a llamar al modelo.
 */
export interface ClimaTextEntities {
  /** "el martes pasado", "antes de fin de mes". */
  fechas: string[];
  /** Sistemas, plataformas, artefactos: "Excel", "Tableau", "el reporte semanal". */
  herramientas: string[];
  /** Rituales o procesos nombrados: "desayunos semanales", "mesa de trabajo". */
  procesos: string[];
  /** Magnitudes: "2 horas", "todo el equipo", "3 reuniones". */
  cantidades: string[];
}

/** Confianza del clasificador. `baja` = texto demasiado corto o ambiguo. */
export type ClimaTextConfidence = 'alta' | 'media' | 'baja';

// ─────────────────────────────────────────────────────────────────────────────
// INDICADOR COMPUESTO (decisión de Victor, 2026-08-06)
//
// ⛔ LA DENSIDAD NUNCA SE MUESTRA SOLA. El motivo salió de los datos reales, no de
// una intuición: la entrada "eso no es verdad, acá todos han crecido" —una
// refutación pura, sin ninguna acción— puntuó densidad 2, porque mencionaba
// "próxima evaluación" y "encuesta". Leída sola, la densidad premia a quien
// argumenta mejor, no a quien actúa. Va siempre combinada con el verbo.
//
// El score es lo ÚNICO agregable: la UI puede sumarlo y promediarlo. `rationale`
// existe para poder auditar por qué dio lo que dio sin volver a derivarlo — y para
// que "intención argumentada" no se confunda con "sin acción", que puntúan igual
// pero son conductas distintas.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Umbral de densidad "alta". PROVISIONAL: calibrado contra las únicas 8 entradas
 * reales que existen (promedio 1.5, máximo 3). Se recalibra cuando haya volumen
 * — momento que coincide con el umbral de visibilidad de abajo.
 */
export const DENSITY_HIGH_THRESHOLD = 2;

/**
 * Entradas GLOBALES a partir de las cuales la cápsula pasa de Modo Táctico
 * (auditoría caso por caso) a Modo Macro (patrones agregados).
 * Diseño consolidado v2 §1 · plan maestro §2.3.bis.
 *
 * ⚠️ **NO DECIDE SI SE MUESTRA, DECIDE CÓMO.** Debajo del umbral se muestra cada
 * registro individual —con su cita, su autor y su etiqueta—; encima, patrones
 * agregados. Con pocos datos un porcentaje miente y un caso concreto no.
 *
 * ⚠️ Sigue siendo un gate de VISIBILIDAD, no de cómputo: el clasificador corre y
 * persiste desde la primera entrada, para que al cruzar el umbral haya historia
 * acumulada y no haya que reprocesar hacia atrás.
 *
 * 🕐 Se llamó `CLIMA_LLM_MIN_ENTRIES_PER_UNIT = 30` hasta el 2026-08-06. El nombre
 * viejo decía "por unidad" y el umbral pasó a ser global: mantenerlo habría dejado
 * una constante que miente sobre su propia semántica.
 *
 * Vive acá y no en `climaThresholds.ts` a propósito: ese archivo tiene los
 * umbrales SELLADOS de momentum (±5pp) y es de otro dominio.
 */
export const CLIMA_MODO_MACRO_MIN_ENTRIES = 15;

// ─────────────────────────────────────────────────────────────────────────────
// ETIQUETAS EJECUTIVAS (diseño v2 §2)
//
// ⛔ EL CEO NUNCA LEE EL VOCABULARIO DEL MOTOR. No ve "ejecucion", "intencion",
// "densidad" ni "score". La traducción se hace EN EL SERVIDOR —no en el cliente—
// para que los términos internos ni siquiera viajen en la respuesta.
//
// `ejecucion` mapea a "Ejecución Comprobable" con CUALQUIER densidad: el matiz de
// cuán concreta fue lo lleva el Índice de Confiabilidad ("Evidencia verificable"
// vs. "Evidencia parcial"), como pide §3.3 — la densidad no se muestra aparte.
// ─────────────────────────────────────────────────────────────────────────────

export const ETIQUETA_EJECUTIVA: Record<ClimaVerbMode, string> = {
  ejecucion: 'Ejecución Comprobable',
  intencion: 'Promesa de Acción',
  // "Observación sin Ejecución", nunca "Postura Defensiva": se califica la
  // ausencia de ejecución, no la actitud de la persona (regla ética v2 §9).
  ninguno: 'Observación sin Ejecución',
};

/** Orden del feed (§3.4): primero quienes ejecutaron, al final quienes no actuaron. */
export const ORDEN_ETIQUETA: Record<ClimaVerbMode, number> = {
  ejecucion: 0,
  intencion: 1,
  ninguno: 2,
};

/** Índice de Confiabilidad Operativa — el score compuesto, en palabras (§2). */
export function indiceConfiabilidad(score: number): string {
  if (score >= 2) return 'Evidencia verificable';
  if (score === 1) return 'Evidencia parcial';
  return 'Sin evidencia operativa';
}

/**
 * Fuerza de la señal de UNA entrada.
 *  - `fuerte`: ejecución con densidad alta. Hizo algo y lo dijo concreto.
 *  - `debil` : ejecución con densidad baja. Actuó, pero de forma vaga.
 *  - `nula`  : todo lo demás. Intención (por más argumentada que esté) y no-acción.
 */
export type ClimaSignalStrength = 'fuerte' | 'debil' | 'nula';

/** Por qué la señal dio lo que dio. Distingue casos que puntúan igual. */
export type ClimaSignalRationale =
  | 'ejecucion_densa'
  | 'ejecucion_vaga'
  /** Promete con lujo de detalle. NO puntúa: argumenta, no actúa. */
  | 'intencion_argumentada'
  | 'intencion_vaga'
  /** Refutación, descargo u opinión: no describe una acción propia. */
  | 'sin_accion';

export interface ClimaCompositeSignal {
  strength: ClimaSignalStrength;
  /** 2 = fuerte · 1 = débil · 0 = nula. Lo único que la UI puede agregar. */
  score: 0 | 1 | 2;
  rationale: ClimaSignalRationale;
}

/**
 * Resultado por ENTRADA de bitácora. Es el objeto que va a
 * `ClimaActionLog.llmClassification`.
 *
 * ⚠️ CLASIFICACIÓN, NO NARRATIVA (decisión de Victor, 2026-08-06). Acá no hay ni
 * un texto dirigido al CEO. Las narrativas se generan en un paso aparte y con
 * otro modelo: mezclar "clasificá este texto" con "escribí un hallazgo ejecutivo"
 * en el mismo prompt degrada las dos cosas — el clasificador se vuelve creativo y
 * el redactor se vuelve esquemático.
 */
export interface ClimaTextClassification {
  version: typeof CLIMA_TEXT_ANALYSIS_VERSION;
  /** Modelo exacto que clasificó. Sin esto, un cambio de modelo es indetectable. */
  model: string;
  analyzedAt: string;
  /** Id de la entrada analizada — el análisis es por entrada, no por foco. */
  entryId: string;
  verbMode: ClimaVerbMode;
  /** El verbo núcleo VERBATIM, tal como está en el texto. `null` si `ninguno`. */
  verbLemma: string | null;
  entities: ClimaTextEntities;
  /**
   * Suma de las 4 listas. Se guarda para no recalcularlo al leer, pero ⛔ NO SE
   * MUESTRA SOLO: la UI lee `signal`, nunca este número suelto. Está expuesto
   * para auditoría y recalibración del umbral, no para pintarlo.
   */
  entityDensity: number;
  /** El indicador que la UI SÍ puede mostrar y agregar. */
  signal: ClimaCompositeSignal;
  confidence: ClimaTextConfidence;
}

/**
 * Lo que se persiste en el foco: sus entradas analizadas más el agregado.
 * Un foco puede tener N entradas, y el veredicto se emite sobre el foco.
 */
export interface ClimaActionLogAnalysis {
  version: typeof CLIMA_TEXT_ANALYSIS_VERSION;
  entries: ClimaTextClassification[];
  /** Densidad total acumulada. Auditoría, no display (ver `entityDensity`). */
  totalDensity: number;
  /** Cuántas de sus entradas describen ejecución real. */
  ejecucionCount: number;
  intencionCount: number;
  /** Entradas sin acción (refutaciones, descargos, opiniones). */
  sinAccionCount: number;
  /** Suma de los `signal.score` de sus entradas. La métrica agregable del foco. */
  signalScore: number;
}
