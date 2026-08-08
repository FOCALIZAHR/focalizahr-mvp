// src/lib/services/clima/ClimaTextAnalysisService.ts
// ════════════════════════════════════════════════════════════════════════════
// H3a — Motores 1 y 2 del plan maestro §2.3: densidad de entidades y verbos de
// ejecución vs. intención, sobre el texto libre de la bitácora.
//
// ⛔ SOLO CLASIFICA. No escribe una línea dirigida al CEO (decisión de Victor,
// 2026-08-06). Las narrativas ejecutivas son un paso posterior, con otro modelo:
// pedirle a un mismo prompt que clasifique Y redacte degrada las dos tareas —el
// clasificador se pone creativo y el redactor se pone esquemático— y además hace
// imposible cambiar el tono de la narrativa sin re-clasificar todo.
//
// MODELO: Haiku. Es clasificación con enums cerrados y extracción literal, no
// razonamiento abierto; el plan §2.3 ya lo anticipaba ("Haiku alcanza"). El
// helper del repo trae Sonnet por default (`anthropicToolUse.ts:59`), así que se
// pasa explícito.
//
// MOLDE: `compliance/PatronesLLMService.ts` — Tool Use con `tool_choice` forzado,
// `analisis_cot` como primer campo obligatorio (el modelo razona antes de
// comprometerse), enums cerrados para todo lo categórico, y fragmentos literales
// como evidencia auditable.
//
// DEGRADE-SAFE: sin `ANTHROPIC_API_KEY` el helper devuelve `{success:false}` y
// acá se propaga como `null`. El caller (Fase 4d del cierre de campaña) ya
// envuelve todo en try/catch: un fallo del análisis nunca bloquea un cierre.
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { callAnthropicWithTool, type AnthropicTool } from '@/lib/ai/anthropicToolUse';
import {
  CLIMA_TEXT_ANALYSIS_VERSION,
  DENSITY_HIGH_THRESHOLD,
  type ClimaTextClassification,
  type ClimaActionLogAnalysis,
  type ClimaCompositeSignal,
  type ClimaVerbMode,
  type ClimaTextConfidence,
  type ClimaTextEntities,
} from '@/types/clima-text-analysis';

/** Haiku: clasificación barata y rápida. La generación de narrativa NO pasa por acá. */
const CLASSIFIER_MODEL = 'claude-haiku-4-5-20251001';

const TOOL: AnthropicTool = {
  name: 'clasificar_entrada_bitacora',
  description:
    'Registra la clasificación de UNA entrada de bitácora escrita por un jefe sobre lo que hizo con un foco de clima laboral.',
  input_schema: {
    type: 'object',
    properties: {
      analisis_cot: {
        type: 'string',
        description:
          'Razonamiento previo OBLIGATORIO, se llena PRIMERO. Identifica el verbo núcleo y su tiempo (pasado real vs futuro/condicional), y lista las entidades concretas que ves. Considera que el texto puede tener errores de tipeo, estar en mayúsculas, o ser una refutación en vez de una acción.',
      },
      verb_mode: {
        type: 'string',
        enum: ['ejecucion', 'intencion', 'ninguno'],
        description:
          'ejecucion = describe algo que YA ocurrió ("modificamos", "hemos reconocido", "eliminé"). intencion = algo que VA a ocurrir ("convocaré", "definiré", "voy a contactar", "estoy esperando"). ninguno = no describe una acción propia del autor: opiniones, refutaciones ("eso no es verdad"), quejas o descargos.',
      },
      verb_lemma: {
        type: ['string', 'null'],
        description:
          'El verbo núcleo VERBATIM, exactamente como aparece en el texto, sin corregir tipeos ni normalizar. null si verb_mode es ninguno.',
      },
      fechas: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Referencias temporales literales: "el martes", "la próxima semana", "antes de fin de mes". Vacío si no hay.',
      },
      herramientas: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Sistemas, plataformas o artefactos nombrados: "Excel", "Tableau", "el reporte semanal". Vacío si no hay.',
      },
      procesos: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Rituales, instancias o procesos nombrados: "desayunos semanales", "mesa de trabajo", "reunión de equipo". Vacío si no hay.',
      },
      cantidades: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Magnitudes literales: "2 horas", "todo el equipo", "3 reuniones". Vacío si no hay.',
      },
      confidence: {
        type: 'string',
        enum: ['alta', 'media', 'baja'],
        description:
          'baja si el texto es demasiado corto, está truncado, o es tan ambiguo que el verbo núcleo no se puede determinar.',
      },
    },
    required: [
      'analisis_cot',
      'verb_mode',
      'verb_lemma',
      'fechas',
      'herramientas',
      'procesos',
      'cantidades',
      'confidence',
    ],
  },
};

// El few-shot viene del diseño consolidado v2 §6 (Estudio IA). Se incorpora como
// ejemplos en el system prompt, traducidos al vocabulario de ESTE tool: el §6 usa
// `verbo`/`densidad_entidades`/`tipo_conductual`, y alimentar al modelo con nombres
// de campo distintos a los de su propio schema lo confunde en vez de guiarlo.
//
// ⚠️ El ejemplo 2 CORRIGE una regla que este prompt tenía mal. Decía que todo texto
// defensivo era "ninguno"; el §6 muestra que un texto de tono refutatorio que
// reporta un hito consumado ("hicimos un taller el martes con los 15 líderes") es
// EJECUCIÓN. Lo que decide no es el tono, es si hay un hecho cumplido.
//
// El §6 también trata `refutacion` como valor propio del verbo y agrega
// `tipo_conductual`. NO se incorporan todavía: son cambios de contrato (agregar
// valores a un union), y esa decisión es de Victor. La enseñanza sí se incorpora —
// que es lo que mueve la calidad de la clasificación.
const SYSTEM_PROMPT = `Eres un analista que clasifica registros breves escritos por jefes de área en Chile sobre acciones de clima laboral.

Tu trabajo es SOLO clasificar. No opines sobre la persona, no evalúes si la acción fue buena, no redactes conclusiones.

Reglas:
- El texto puede tener errores de tipeo, venir en MAYÚSCULAS o estar cortado. Clasifica igual, sin corregirlo.
- Distingue el TIEMPO del verbo núcleo: lo ya hecho es ejecución; lo prometido, planificado o esperado es intención.
- "Estoy esperando", "voy a", "me comprometo a", "estamos analizando" son INTENCIÓN, no ejecución.
- EL TONO NO DECIDE. Un texto puede sonar defensivo y aun así reportar un hecho
  consumado: eso es EJECUCIÓN. Lo que decide es si hay un hito cumplido, no si el
  autor está de acuerdo con el diagnóstico.
- Un texto que solo niega, opina o se descarga, SIN reportar ningún hecho
  consumado, es "ninguno".
- Extrae entidades VERBATIM. No inventes ni completes las que no estén.

EJEMPLOS RESUELTOS

1) "Eso no es verdad, acá todos han crecido muchísimo este año según nuestras 3 metas cumplidas."
   Plan: aumentar frecuencia de reuniones de feedback 1:1 en el área comercial.
   → verb_mode: ninguno
   Usa datos de metas para refutar la premisa, pero no describe ninguna acción
   tomada sobre el plan de reuniones 1:1.

2) "No es verdad que falte comunicación, hicimos un taller el martes pasado con los 15 líderes del piso."
   Plan: mejorar canales de comunicación y alineación directiva.
   → verb_mode: ejecucion · verb_lemma: "hicimos"
   Aunque el tono es refutatorio, reporta un hito fáctico concreto: un taller
   realizado el martes con 15 líderes. El tono no lo degrada a "ninguno".

3) "Estamos analizando proponer un nuevo esquema de turnos para el próximo mes con el comité."
   Plan: reducir la fatiga operativa y reestructurar horarios de salida.
   → verb_mode: intencion · verb_lemma: "Estamos analizando"
   Verbos de intención sin ningún hito consumado.

4) "Modificamos la plantilla de turnos en Excel y la subimos al canal de Slack el lunes."
   Plan: reducir la fatiga operativa y reestructurar horarios de salida.
   → verb_mode: ejecucion · verb_lemma: "Modificamos"
   Acción consumada con artefactos y plazos explícitos: plantilla Excel, Slack, lunes.`;

/** Resumen de una corrida. Lo consume el log del cierre y el smoke. */
export interface AnalysisRunResult {
  logsAnalyzed: number;
  entriesClassified: number;
  entriesSkipped: number;
}

interface ToolOutput {
  analisis_cot: string;
  verb_mode: ClimaVerbMode;
  verb_lemma: string | null;
  fechas: string[];
  herramientas: string[];
  procesos: string[];
  cantidades: string[];
  confidence: ClimaTextConfidence;
}

/**
 * Deriva el indicador compuesto. Función PURA y determinista: mismas entradas,
 * mismo resultado, sin LLM. El modelo clasifica; la regla de negocio la decide el
 * código, que es donde Victor puede leerla y cambiarla.
 *
 * Tabla (decisión de Victor, 2026-08-06):
 *   ejecución + densa  → fuerte (2)   hizo algo y lo dijo concreto
 *   ejecución + vaga   → débil  (1)   actuó, pero sin decir qué
 *   intención + lo que sea → nula (0) argumenta, no actúa
 *   ninguno            → nula  (0)    ni siquiera argumenta una acción
 */
export function deriveCompositeSignal(
  verbMode: ClimaVerbMode,
  entityDensity: number
): ClimaCompositeSignal {
  const densa = entityDensity >= DENSITY_HIGH_THRESHOLD;

  if (verbMode === 'ejecucion') {
    return densa
      ? { strength: 'fuerte', score: 2, rationale: 'ejecucion_densa' }
      : { strength: 'debil', score: 1, rationale: 'ejecucion_vaga' };
  }
  if (verbMode === 'intencion') {
    // Puntúa 0 en los dos casos, PERO se distinguen: prometer con lujo de detalle
    // y prometer al aire son conductas distintas, aunque ninguna sea ejecución.
    return {
      strength: 'nula',
      score: 0,
      rationale: densa ? 'intencion_argumentada' : 'intencion_vaga',
    };
  }
  return { strength: 'nula', score: 0, rationale: 'sin_accion' };
}

export class ClimaTextAnalysisService {
  /**
   * Clasifica UNA entrada. Devuelve `null` si el modelo no respondió (sin API key,
   * error de red, reintentos agotados) — nunca lanza: el caller es un cierre de
   * campaña y no puede caerse por esto.
   */
  static async classifyEntry(params: {
    entryId: string;
    text: string;
    /** Pasos del plan aprobado para ese foco. Contexto, no algo a clasificar. */
    planSteps?: string[];
  }): Promise<ClimaTextClassification | null> {
    const { entryId, text, planSteps } = params;

    // El plan aprobado va como CONTEXTO para que el modelo sepa de qué se
    // esperaba que hablara el jefe. Es lo que el plan §2.3 llama "contextualizado":
    // sin esto, "convoqué al equipo" es ambiguo; con el plan al lado, se sabe si
    // convocar al equipo ERA la acción esperada.
    const contexto = planSteps?.length
      ? `\n\nPasos que el plan aprobado proponía para este foco:\n${planSteps.map((s) => `- ${s}`).join('\n')}`
      : '';

    const result = await callAnthropicWithTool<ToolOutput>({
      model: CLASSIFIER_MODEL,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `Entrada de bitácora a clasificar:\n\n"""${text}"""${contexto}`,
      tool: TOOL,
      maxTokens: 1024,
      temperature: 0,
    });

    if (!result.success) return null;

    const out = result.data;
    const entities: ClimaTextEntities = {
      fechas: out.fechas ?? [],
      herramientas: out.herramientas ?? [],
      procesos: out.procesos ?? [],
      cantidades: out.cantidades ?? [],
    };
    const entityDensity =
      entities.fechas.length +
      entities.herramientas.length +
      entities.procesos.length +
      entities.cantidades.length;

    return {
      version: CLIMA_TEXT_ANALYSIS_VERSION,
      model: CLASSIFIER_MODEL,
      analyzedAt: new Date().toISOString(),
      entryId,
      verbMode: out.verb_mode,
      // Coherencia dura: `ninguno` no puede traer verbo. El modelo a veces devuelve
      // uno igual; se normaliza acá y no se confía en el prompt para invariantes.
      verbLemma: out.verb_mode === 'ninguno' ? null : (out.verb_lemma ?? null),
      entities,
      entityDensity,
      signal: deriveCompositeSignal(out.verb_mode, entityDensity),
      confidence: out.confidence,
    };
  }

  /**
   * Clasifica TODAS las entradas de los focos de un plan y persiste el resultado
   * en `ClimaActionLog.llmClassification` — el campo que existe desde Gate 5C y
   * que hasta H3a nadie había escrito.
   *
   * ⚠️ CORRE SIEMPRE, sin mirar el umbral de 30 entradas. Ese umbral es un gate de
   * VISIBILIDAD (lo aplica la UI), no de cómputo: si el análisis esperara a tener
   * volumen, el día que se cruce el umbral no habría historia acumulada y habría
   * que reprocesar todo hacia atrás.
   *
   * Idempotente por reemplazo: reanalizar un foco pisa su análisis anterior. Es
   * deliberado — el shape lleva `version` y `model`, así que un reanálisis con
   * otro modelo tiene que ganar, no convivir.
   *
   * Degrade-safe: una entrada que el modelo no pudo clasificar se SALTA; el foco
   * se persiste con las que sí. Nunca lanza — el caller es un cierre de campaña.
   */
  static async analyzeAndPersistForPlan(params: {
    accountId: string;
    actionPlanId: string;
  }): Promise<AnalysisRunResult> {
    const { accountId, actionPlanId } = params;
    const logs = await prisma.climaActionLog.findMany({
      where: { accountId, actionPlanId },
      select: { id: true, entries: { select: { id: true, text: true }, orderBy: { createdAt: 'asc' } } },
    });
    return ClimaTextAnalysisService.persistForLogs(accountId, logs);
  }

  /**
   * Entrada del cierre de un Seguimiento Focalizado (Fase 4d).
   *
   * ⚠️ Se acota por DEPARTAMENTO, no por campaña. El plan se aprueba en la campaña
   * t0 y el cierre ocurre en la t1: buscar "el plan aprobado de esta campaña"
   * devolvería vacío siempre. Los departamentos medidos son el nexo — el mismo
   * criterio con el que `ActionEffectivenessService` elige a quién dar veredicto.
   */
  static async analyzeOnFollowUpClose(params: {
    accountId: string;
    departmentIds: string[];
  }): Promise<AnalysisRunResult> {
    const { accountId, departmentIds } = params;
    if (departmentIds.length === 0) {
      return { logsAnalyzed: 0, entriesClassified: 0, entriesSkipped: 0 };
    }
    const logs = await prisma.climaActionLog.findMany({
      where: { accountId, departmentId: { in: departmentIds } },
      select: { id: true, entries: { select: { id: true, text: true }, orderBy: { createdAt: 'asc' } } },
    });
    return ClimaTextAnalysisService.persistForLogs(accountId, logs);
  }

  /** Núcleo compartido: clasifica las entradas de cada foco y persiste el agregado. */
  private static async persistForLogs(
    accountId: string,
    logs: Array<{ id: string; entries: Array<{ id: string; text: string }> }>
  ): Promise<AnalysisRunResult> {
    let entriesClassified = 0;
    let entriesSkipped = 0;
    let logsAnalyzed = 0;

    for (const log of logs) {
      if (log.entries.length === 0) continue;

      const classified: ClimaTextClassification[] = [];
      for (const e of log.entries) {
        const r = await ClimaTextAnalysisService.classifyEntry({ entryId: e.id, text: e.text });
        if (r) {
          classified.push(r);
          entriesClassified++;
        } else {
          entriesSkipped++;
        }
      }
      if (classified.length === 0) continue;

      const analysis: ClimaActionLogAnalysis = {
        version: CLIMA_TEXT_ANALYSIS_VERSION,
        entries: classified,
        totalDensity: classified.reduce((s, c) => s + c.entityDensity, 0),
        ejecucionCount: classified.filter((c) => c.verbMode === 'ejecucion').length,
        intencionCount: classified.filter((c) => c.verbMode === 'intencion').length,
        sinAccionCount: classified.filter((c) => c.verbMode === 'ninguno').length,
        signalScore: classified.reduce((s, c) => s + c.signal.score, 0),
      };

      await prisma.climaActionLog.update({
        where: { id: log.id },
        // Cast necesario: Prisma tipa Json? como InputJsonValue y no acepta una
        // interface directamente. El shape lo garantiza `ClimaActionLogAnalysis`.
        data: { llmClassification: analysis as unknown as object },
      });
      logsAnalyzed++;
    }

    return { logsAnalyzed, entriesClassified, entriesSkipped };
  }
}
