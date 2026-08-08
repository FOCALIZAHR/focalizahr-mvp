// src/lib/services/clima/ClimaFindingNarrativeService.ts
// ════════════════════════════════════════════════════════════════════════════
// H3b — GENERACIÓN de la narrativa ejecutiva del hallazgo.
//
// Paso SEPARADO de la clasificación, y con otro modelo (regla de Victor,
// 2026-08-06): Haiku clasifica entrada por entrada; Sonnet lee el conjunto YA
// clasificado y escribe UNA conclusión. Mezclarlos en un prompt degrada las dos
// tareas y obliga a re-clasificar todo para cambiar un tono.
//
// ⛔ EL PUNTO ES DECIR ALGO QUE NO SE VE LEYENDO LAS ENTRADAS DE A UNA.
// "6 de 8 registran intención" es el conteo dicho con palabras — eso ya lo hace un
// template y no necesita un modelo. Lo que se le pide acá es un PATRÓN TRANSVERSAL:
// qué comparten esos 6 entre sí, qué está sistemáticamente ausente, contra qué
// esperaba el plan. Ejemplo del estándar:
//
//   "Los 6 registros de intención mencionan coordinación con otras áreas como
//    barrera. Ninguno reporta una acción dentro de su propio equipo."
//
// Si no hay patrón real, el modelo tiene que DECIRLO (`hay_patron: false`) y el
// caller cae al template. Con 8 textos, un patrón inventado es peor que un conteo:
// el conteo es aburrido, el patrón falso es una decisión mal tomada.
//
// AUDITADO CONTRA `focalizahr-narrativas`:
//   · Minto — la conclusión primero; el dato queda de respaldo, nunca de apertura.
//   · Sin jerga — el CEO no lee "densidad", "verbos", "clasificador" ni "LLM".
//   · Consecuencia, no instrucción — nada de "se recomienda" ni "hay que".
//   · El "O" de McKinsey para causas — hipótesis separadas, cero juicio.
//   · Regla ética del plan §2.6 — se califica la TÁCTICA, nunca a la persona, y
//     el headline habla del patrón: jamás nombra a nadie.
//
// ⚠️ FUENTE DEL CONTEXTO — REVISAR AL MIGRAR
// El contexto del plan (`planSteps`) sale de `ActionPlan.decisiones`, un campo
// JSON. Hay un proyecto paralelo en curso para persistir los planes en tablas
// propias; cuando eso ocurra, esta lectura hay que apuntarla a la fuente nueva.
// Sin ese contexto la narrativa pierde el "contra qué" —qué pedía el plan que
// nadie tocó— que es justamente lo que la hace un hallazgo y no un recuento.
// Anotado también en `.claude/tasks/BACKLOG_ENTERPRISE.md`.
// ════════════════════════════════════════════════════════════════════════════

import { callAnthropicWithTool, type AnthropicTool } from '@/lib/ai/anthropicToolUse';

/** Sonnet: acá se REDACTA, no se clasifica. La clasificación la hizo Haiku. */
const NARRATIVE_MODEL = 'claude-sonnet-4-6';

export interface ClimaFindingNarrative {
  /** La conclusión. Habla del patrón, nunca de una persona. */
  headline: string;
  /** El argumento que la sostiene: el contraste o la ausencia que la prueba. */
  soporte: string;
  /** Nombre interno del patrón, para auditar. NO se muestra. */
  patron: string;
  /** Registros citados como respaldo (R1, R2…). Auditoría, no se muestra. */
  evidencia: string[];
  model: string;
  generatedAt: string;
}

/** Palabras que convierten una observación en una afirmación universal. */
const ABSOLUTOS =
  /\b(ning[uú]n|ninguno|ninguna|todos|todas|siempre|nunca|jam[aá]s|cero|totalidad|sin excepci[oó]n|en su totalidad)\b/i;

/**
 * Cifras escritas con letras.
 *
 * ⚠️ ESTE MAPA EXISTE POR UN CASO REAL. La validación miraba solo dígitos, y una
 * narrativa afirmó "no aparece en ninguna de esas CINCO respuestas" — una cifra
 * falsa que pasó el filtro por estar escrita con letras. En español el modelo
 * alterna dígito y palabra sin criterio, así que validar solo `\d+` es validar la
 * mitad de las afirmaciones.
 */
const NUMEROS_EN_LETRAS: Record<string, number> = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
  trece: 13, catorce: 14, quince: 15, dieciseis: 16, dieciséis: 16,
  diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20,
};

/** Todas las cifras del texto, vengan en dígito o en palabra. */
function cifrasDe(texto: string): number[] {
  const digitos = (texto.match(/\b\d+\b/g) ?? []).map(Number);
  const palabras = Object.entries(NUMEROS_EN_LETRAS)
    .filter(([w]) => new RegExp(`\\b${w}\\b`, 'i').test(texto))
    .map(([, n]) => n);
  return [...digitos, ...palabras];
}

/** Una entrada, ya clasificada por Haiku, lista para que Sonnet la lea. */
export interface NarrativeInputEntry {
  text: string;
  /** `ejecucion` | `intencion` | `ninguno` — vocabulario interno, no se muestra. */
  verbMode: string;
  /** Dimensión de clima del foco. */
  dimension: string | null;
  /** Pasos que el plan aprobado proponía para ese foco. El "contra qué". */
  planSteps: string[];
}

const TOOL: AnthropicTool = {
  name: 'reportar_hallazgo_ejecutivo',
  description:
    'Registra UN hallazgo ejecutivo sobre el conjunto de registros de bitácora de clima de una empresa.',
  input_schema: {
    type: 'object',
    properties: {
      analisis_cot: {
        type: 'string',
        description:
          'Razonamiento previo OBLIGATORIO, se llena PRIMERO. Recorré los registros uno por uno con UNA LÍNEA CADA UNO (ej: "R3: plan pedía métrica, el registro no la menciona"). Después, en dos o tres frases, nombrá el patrón transversal. MÁXIMO 200 PALABRAS EN TOTAL: este campo es para pensar, no para redactar, y si te extendés acá te quedás sin espacio para el hallazgo.',
      },
      hay_patron: {
        type: 'boolean',
        description:
          'true SOLO si encontraste algo transversal que no se ve leyendo una entrada aislada. false si lo único que podés decir es cuántos hay de cada tipo — en ese caso NO inventes un patrón.',
      },
      patron: {
        type: 'string',
        description:
          'Nombre corto e interno del patrón detectado (ej: "barrera_externalizada", "accion_fuera_del_equipo"). Vacío si hay_patron es false.',
      },
      headline: {
        type: 'string',
        description:
          'LA CONCLUSIÓN, en una frase. Máximo 20 palabras. Habla del PATRÓN, nunca de una persona ni con nombres propios. No es un recuento: "6 de 8 registran intención" está PROHIBIDO como headline. Vacío si hay_patron es false.',
      },
      soporte: {
        type: 'string',
        description:
          'UNA o DOS frases que prueban el headline: el contraste, la ausencia o el dato que lo sostiene. Sin instrucciones, sin recomendaciones, sin plazos. Vacío si hay_patron es false.',
      },
      evidencia_ids: {
        type: 'array',
        items: { type: 'string' },
        description:
          'IDs EXACTOS de los registros (R1, R2, …) que respaldan lo afirmado. OBLIGATORIO si usás una palabra absoluta (ningún, todos, siempre, nunca) o un número: listá TODOS los registros que revisaste para sostener esa afirmación. Si no podés enumerarlos, no hagas la afirmación.',
      },
    },
    required: ['analisis_cot', 'hay_patron', 'patron', 'headline', 'soporte', 'evidencia_ids'],
  },
};

const SYSTEM_PROMPT = `Eres el analista que le escribe a un CEO chileno los hallazgos sobre cómo sus líderes ejecutaron los planes de clima laboral.

TU TRABAJO ES ENCONTRAR EL PATRÓN, NO CONTAR.
Un recuento ("6 de 8 registran intención") ya lo tiene el sistema y no te necesita. Lo que sí te necesita es lo que solo se ve leyendo TODOS los registros juntos: qué mencionan varios que ninguno menciona solo, qué está sistemáticamente ausente, qué pedía el plan que nadie tocó.

CÓMO ESCRIBIR
- La conclusión primero. El dato va después, como respaldo, nunca de apertura.
- Frases cortas. Una idea por oración.
- Sin jerga: nada de "densidad", "verbos de acción", "clasificador", "NLP", "score", "IA".
- Sin instrucciones ni recomendaciones. No digas qué hacer, ni "se recomienda", ni plazos. Describe lo que hay y su consecuencia.
- Si hay varias causas posibles, sepáralas con "O" y no elijas ninguna.

NUNCA MUESTRES IDENTIFICADORES INTERNOS
Los IDs R1, R2, R3 son para que vos razonés y los cites en evidencia_ids. NO pueden aparecer en headline ni en soporte: el CEO no sabe qué es "R3" y ver códigos internos le dice que está leyendo un volcado de sistema.
Para referirte a un registro en el texto visible, usá el nombre del autor, su departamento, o una forma genérica ("4 de 8 registros", "la mayoría de los líderes", "un solo caso").
❌ "En R3, R5 y R7 el plan pedía escalar"
✅ "En tres de los registros el plan pedía escalar"

REGLA ÉTICA, NO NEGOCIABLE
- Calificas la TÁCTICA y la EJECUCIÓN, jamás a la persona.
- El headline habla del patrón. NUNCA nombres a nadie, ni digas "los líderes no cumplieron".
- "Los registros describen coordinación pendiente" ✅
- "Los jefes se excusan" ❌

REGLA DE ORO DE EVIDENCIA — la más importante
Cada registro viene con un ID (R1, R2, …).

Tenés PROHIBIDO escribir "ningún", "ninguno", "todos", "siempre", "nunca" o cualquier número, A MENOS QUE puedas listar en evidencia_ids los IDs exactos de los registros que revisaste para sostenerlo.

Antes de escribir "ninguno", enumerá en tu razonamiento los registros uno por uno y confirmá que la afirmación se cumple en CADA uno. Si en alguno no se cumple, la afirmación es falsa: reescribila en términos parciales ("la mayoría", "4 de los 5") o no la hagas.

Un absoluto sin IDs se rechaza automáticamente y tu hallazgo se descarta. Un absoluto falso es peor que no decir nada: alguien toma una decisión con eso.

CUÁNDO NO HAY HALLAZGO
Si al leer el conjunto lo único que podés afirmar es cuántos hay de cada tipo, responde hay_patron=false y deja los textos vacíos. Un patrón inventado sobre pocos registros es peor que no decir nada.`;

interface ToolOutput {
  analisis_cot: string;
  hay_patron: boolean;
  patron: string;
  headline: string;
  soporte: string;
  evidencia_ids: string[];
}

/**
 * CAPA B — validación en código de lo que el modelo afirmó (decisión de Victor,
 * 2026-08-07). La capa A vive en el prompt; ésta no confía en ella.
 *
 * Qué SÍ atrapa:
 *   · un absoluto ("ningún", "todos") sin IDs que lo respalden
 *   · un ID citado que no existe entre los registros que se le pasaron
 *   · un número mayor que la cantidad de registros analizados — una afirmación
 *     sobre más casos de los que existen es falsa por definición
 *   · una cifra que no coincide ni con el total, ni con ninguna categoría, ni con
 *     la cantidad de registros que citó
 *
 * Qué NO atrapa, y hay que saberlo: un absoluto FALSO pero bien citado. Si el
 * modelo dice "en estos 5 ninguno menciona X" y en uno sí aparece, eso es un juicio
 * semántico sobre el texto y el código no puede resolverlo sin volver a llamar a un
 * modelo. Lo que reduce ese riesgo es la capa A: obligarlo a enumerar los IDs lo
 * fuerza a recorrer los registros en vez de generalizar de memoria.
 *
 * Devuelve el motivo del rechazo, o `null` si pasa.
 */
function validarNarrativa(
  out: ToolOutput,
  idsValidos: Set<string>,
  conteos: Record<string, number>
): string | null {
  const texto = `${out.headline} ${out.soporte}`;
  const citados = (out.evidencia_ids ?? []).map((s) => s.trim().toUpperCase());

  // 0. IDs internos filtrados al texto visible. La capa A lo prohíbe en el prompt;
  //    ésta no confía en el prompt. "R3" en pantalla le dice al CEO que está
  //    leyendo un volcado de sistema, no un hallazgo.
  if (/\bR\d+\b/.test(texto)) {
    return `filtró identificadores internos al texto visible: "${texto.match(/\bR\d+\b/)?.[0]}"`;
  }

  // 1. Absolutos sin respaldo enumerado.
  if (ABSOLUTOS.test(texto) && citados.length === 0) {
    return `usa un absoluto sin citar registros: "${texto.match(ABSOLUTOS)?.[0]}"`;
  }

  // 2. IDs inventados.
  const inexistentes = citados.filter((id) => !idsValidos.has(id));
  if (inexistentes.length > 0) {
    return `cita registros que no existen: ${inexistentes.join(', ')}`;
  }

  // 3. Cifras. Se aceptan las que coinciden con algo real: el total, alguna
  //    categoría, o la cantidad de registros que citó. Cualquier otra es una cifra
  //    que nadie puede reproducir.
  const total = conteos.total ?? 0;
  const conocidas = new Set<number>([
    total,
    citados.length,
    ...Object.values(conteos),
    // `total - categoría` es legítimo: "6 de 8" y "2 de 8" describen el mismo corte.
    ...Object.values(conteos).map((v) => total - v),
  ]);
  for (const n of cifrasDe(texto)) {
    if (n > total) return `afirma sobre ${n} registros y solo hay ${total}`;
    if (!conocidas.has(n)) {
      return `usa la cifra ${n}, que no coincide con ningún conteo real ni con los ${citados.length} registros citados`;
    }
  }

  return null;
}

export class ClimaFindingNarrativeService {
  /**
   * Genera la narrativa del hallazgo sobre el conjunto de registros.
   *
   * Devuelve `null` cuando no hay nada honesto que decir: sin API key, error de
   * red, o `hay_patron=false`. El caller cae al template determinista — que sigue
   * siendo correcto, solo menos interesante.
   */
  static async generate(entries: NarrativeInputEntry[]): Promise<ClimaFindingNarrative | null> {
    if (entries.length === 0) return null;

    // El plan aprobado va como CONTEXTO: sin él, "convoqué al equipo" es ambiguo;
    // con los pasos al lado se puede ver qué se esperaba y qué nadie tocó.
    // Cada registro lleva un ID corto y estable (R1, R2…) para que el modelo pueda
    // CITARLO. Sin IDs, la Regla de Oro de Evidencia no es exigible: no habría con
    // qué respaldar un absoluto ni cómo verificar después que lo respaldó.
    const idDe = (i: number) => `R${i + 1}`;
    const idsValidos = new Set(entries.map((_, i) => idDe(i)));

    const bloques = entries
      .map((e, i) => {
        const pasos = e.planSteps.length
          ? `\n   El plan proponía: ${e.planSteps.join(' / ')}`
          : '';
        return `${idDe(i)}. [${e.verbMode}${e.dimension ? ` · ${e.dimension}` : ''}] "${e.text}"${pasos}`;
      })
      .join('\n\n');

    const conteos: Record<string, number> = {
      total: entries.length,
      ejecucion: entries.filter((e) => e.verbMode === 'ejecucion').length,
      intencion: entries.filter((e) => e.verbMode === 'intencion').length,
      ninguno: entries.filter((e) => e.verbMode === 'ninguno').length,
      conPlanSteps: entries.filter((e) => e.planSteps.length > 0).length,
    };

    const result = await callAnthropicWithTool<ToolOutput>({
      model: NARRATIVE_MODEL,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `Registros de bitácora de esta empresa, ya clasificados:\n\n${bloques}\n\nEncuentra el patrón transversal y reporta el hallazgo.`,
      tool: TOOL,
      // 4000 y no 1500: la Regla de Oro obliga a enumerar registro por registro en
      // `analisis_cot`, y con 8 entradas esa enumeración agotaba el presupuesto —
      // el modelo llegaba al headline sin tokens y lo dejaba vacío. Medido: tres
      // corridas seguidas descartadas por esa razón, no por falta de patrón.
      maxTokens: 4000,
      // Algo de temperatura: es redacción, no clasificación. En 0 salen frases
      // rígidas y repetidas entre campañas.
      temperature: 0.4,
    });

    if (!result.success) {
      ClimaFindingNarrativeService.lastRejection = `la llamada falló: ${result.error}`;
      return null;
    }

    const out = result.data;
    ClimaFindingNarrativeService.lastRaw = JSON.stringify(out)?.slice(0, 600) ?? 'null';
    // Sin patrón, o con campos vacíos: se devuelve null y manda el template. No se
    // rellena con lo que haya — un headline a medias es peor que uno predecible.
    if (!out.hay_patron) {
      ClimaFindingNarrativeService.lastRejection =
        `el modelo declaró que no hay patrón. Su razonamiento: ${out.analisis_cot?.slice(0, 400)}`;
      return null;
    }
    if (!out.headline?.trim() || !out.soporte?.trim()) {
      ClimaFindingNarrativeService.lastRejection = 'dijo que hay patrón pero dejó los textos vacíos';
      return null;
    }

    // CAPA B. Se descarta la narrativa entera: no se "corrige" una afirmación mal
    // fundada, porque el resto del párrafo se apoyaba en ella. El template es menos
    // interesante, pero nunca afirma algo que no pueda sostener.
    const motivo = validarNarrativa(out, idsValidos, conteos);
    if (motivo) {
      ClimaFindingNarrativeService.lastRejection = motivo;
      return null;
    }
    ClimaFindingNarrativeService.lastRejection = null;

    return {
      headline: out.headline.trim(),
      soporte: out.soporte.trim(),
      patron: out.patron?.trim() || 'sin_nombre',
      evidencia: (out.evidencia_ids ?? []).map((s) => s.trim().toUpperCase()),
      model: NARRATIVE_MODEL,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Por qué se descartó la última narrativa. Solo para diagnóstico —el caller cae
   * al template igual— pero sin esto un rechazo es indistinguible de un fallo de
   * red, y son dos problemas muy distintos.
   */
  static lastRejection: string | null = null;

  /** Salida cruda del modelo. Solo diagnóstico. */
  static lastRaw: string | null = null;
}
