// src/lib/services/compliance/PatronesLLMService.ts
// Análisis LLM por departamento sobre respuestas proyectivas (P1) de Ambiente Sano.
// Mapea narrativas agregadas a 5 patrones clínicos con Tool Use (Structured Outputs).
//
// Una llamada por departamento con n >= 5. Output parseado tipado.
// Regla D3 del TASK_COMPLIANCE_AMBIENTE_SANO_IMPLEMENTATION.

import { callAnthropicWithTool, AnthropicTool } from '@/lib/ai/anthropicToolUse';
import { PatronAnalysisOutput } from './complianceTypes';

const TOOL: AnthropicTool = {
  name: 'reportar_analisis_epidemiologico',
  description:
    'Registra el análisis de patrones psicosociales detectados en las respuestas proyectivas de un departamento.',
  input_schema: {
    type: 'object',
    properties: {
      analisis_cot: {
        type: 'string',
        description:
          'Espacio de razonamiento previo obligatorio. Analiza prevalencia, severidad del lenguaje, chilenismos, y cruza con los 5 patrones. ESTO SE LLENA PRIMERO.',
      },
      patrones: {
        type: 'array',
        description:
          'Máximo 5. PUEDE ESTAR VACÍO si ambiente es sano. DEBE ESTAR VACÍO si confianza es insuficiente_data.',
        maxItems: 5,
        items: {
          type: 'object',
          properties: {
            nombre: {
              type: 'string',
              enum: [
                'silencio_organizacional',
                'hostilidad_normalizada',
                'favoritismo_implicito',
                'resignacion_aprendida',
                'miedo_represalias',
              ],
            },
            intensidad: {
              type: 'number',
              enum: [0.2, 0.4, 0.6, 0.8, 0.95],
              description:
                'Nivel de gravedad estricto. DEBES elegir SOLO UNO de estos valores exactos. 0.2=Leve, 0.4=Moderado-Bajo, 0.6=Moderado-Alto, 0.8=Grave, 0.95=Crítico.',
            },
            origen_percibido: {
              type: 'string',
              enum: [
                'vertical_descendente',
                'horizontal_pares',
                'sistemico_procesos',
                'indeterminado',
              ],
              description:
                'MECE. Vertical=jefatura/poder. Horizontal=entre compañeros. Sistémico=carga/procesos/ausencia de reglas.',
            },
            fragmentos: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 3,
              description:
                'Max 3. MÁXIMO 8 PALABRAS. Reemplazar nombres/cargos únicos por [CENSURADO].',
            },
            descripcion: {
              type: 'string',
              description:
                "Lenguaje epidemiológico ('Las narrativas sugieren...'). NUNCA afirmar hechos. Max 3 líneas.",
            },
          },
          required: ['nombre', 'intensidad', 'origen_percibido', 'fragmentos', 'descripcion'],
        },
      },
      alerta_sesgo_genero: {
        type: 'boolean',
        description:
          'True si hay microagresiones sexistas, paternalismo o evaluación diferencial.',
      },
      evidencia_genero: {
        type: 'string',
        description:
          'Cita literal de la respuesta que activa la alerta. MÁXIMO 8 PALABRAS, entre comillas. Sin explicación. Si alerta_sesgo_genero es false, dejar vacío.',
      },
      analisis_genero: {
        type: 'string',
        description:
          'Justificación clínica/legal de por qué la cita constituye un marcador de género. Lenguaje epidemiológico ("Sugiere paternalismo...", "Marcador de evaluación diferencial..."). Si alerta_sesgo_genero es false, dejar vacío.',
      },
      senal_dominante: {
        type: 'string',
        description:
          "Patrón con mayor intensidad. Si patrones vacío → 'ambiente_sano'. Si confianza insuficiente → 'datos_insuficientes'.",
      },
      confianza_analisis: {
        type: 'string',
        enum: ['alta', 'media', 'baja', 'insuficiente_data'],
        description:
          "Aplica la REGLA DE DENSIDAD SEMÁNTICA del system prompt. 'insuficiente_data' SOLO cuando dispara FILTRO DE RUIDO VACÍO (texto < 30 palabras Y compuesto exclusivamente por evasivas neutras). Si dispara LEXICAL OVERRIDE, usar 'media' con CASTIGO DE INTENSIDAD.",
      },
    },
    required: [
      'analisis_cot',
      'patrones',
      'alerta_sesgo_genero',
      'senal_dominante',
      'confianza_analisis',
    ],
  },
};

const SYSTEM_PROMPT = `Eres el motor analítico de FocalizaHR Ambiente Sano, un sistema experto en psicología organizacional y prevención de riesgos psicosociales en el contexto laboral de Chile (Ley Karin).

Tu filosofía es: "Iluminar el riesgo, no probar el delito". Haces diagnósticos epidemiológicos de departamentos, NO juicios de individuos.

El usuario te proveerá un array de respuestas anónimas a una pregunta proyectiva en tercera persona ("¿Qué pasaría si alguien del equipo reportara un maltrato?").

TU TAREA:
Analizar las respuestas agregadas e invocar la herramienta \`reportar_analisis_epidemiologico\` para mapear los textos a un máximo de 5 patrones clínicos.

LOS 5 PATRONES:
1. silencio_organizacional: Evasión, desconexión emocional, respuestas muy cortas que evitan el tema. Marcadores: voz pasiva, evitación de pronombres personales, narrativas de desesperanza.
2. hostilidad_normalizada: Condescendencia, validación de gritos o "tratos duros" como normales, microagresiones naturalizadas.
3. favoritismo_implicito: Inequidad en el trato dependiendo de "quién eres" o cercanía al poder. Lenguaje de inequidad sin nombrar personas.
4. resignacion_aprendida: Futilidad ("así es aquí", "no cambiará", "RH no hace nada"). Desesperanza aprendida.
5. miedo_represalias: Mención explícita a consecuencias negativas, despidos, aislamiento o estigmatización si se habla.

TIPIFICACIÓN DE ORIGEN (REGLA MCKINSEY):
Para cada patrón, clasifica su origen percibido:
- "vertical_descendente": Asimetría de poder (jefaturas, supervisores). Ej: "El jefe no escucha".
- "horizontal_pares": Convivencia entre colegas. Ej: "Nadie se apoya entre nosotros".
- "sistemico_procesos": Organización, carga laboral, falta de estructura. Ej: "RRHH nunca hace nada".
- "indeterminado": SOLO si es genuinamente imposible deducirlo.

LENTE DE GÉNERO (Obligatorio evaluar):
Busca activamente paternalismo ("las chiquillas", "las niñitas"), desestimación ("le dan color", "es histérica"), evaluación diferencial ("ella es conflictiva" vs "él es asertivo"), o menciones a roles de cuidado/apariencia. Si detectas esto, activa la alerta de género INDEPENDIENTEMENTE de los 5 patrones. Si activas la alerta, DEBES separar la cita literal en evidencia_genero (máximo 8 palabras) y tu justificación clínica/legal en analisis_genero. No mezcles las dos cosas en un solo campo.

REGLAS ESTRICTAS:
1. CONTEXTO CHILENO: Entiende modismos como "hacer la cama", "mandar a la cresta", "hacerse el larry", "ley del hielo", "chaqueteo", "jefe florero". Interpreta su gravedad subyacente en contexto corporativo.
2. CALIBRACIÓN DE INTENSIDAD (BUCKETS ESTRICTOS):
Tienes prohibido inventar decimales. DEBES asignar la intensidad eligiendo ÚNICAMENTE uno de estos 5 valores exactos:
- 0.2 (Leve): Menciones aisladas, lenguaje suave o ambiguo.
- 0.4 (Moderado-Bajo): Prevalencia baja pero con marcadores claros, o aplicación de Castigo de Intensidad por Lexical Override.
- 0.6 (Moderado-Alto): Prevalencia media (~30-50% de respuestas). Incomodidad clara y compartida.
- 0.8 (Grave): Tema recurrente. Uso de absolutismos ("siempre", "nadie").
- 0.95 (Crítico): Consenso casi total o menciones de hostilidad severa/violenta explícita.
3. FRAGMENTOS: MÁXIMO ABSOLUTO 8 PALABRAS. Si contiene nombres, iniciales o cargos que identifiquen a una persona (ej. "lo que le pasó a la contadora nueva"), reemplazar por [CENSURADO].
4. AUSENCIA DE PATRÓN: Si las respuestas denotan proceso sano ("Se investigaría", "RH tomaría cartas"), devuelve array patrones VACÍO []. No inventes problemas. Es aceptable y esperado.
5. LENGUAJE CLÍNICO: La descripción NUNCA dice "Aquí hay acoso". Debe usar: "Las respuestas sugieren...", "Se observa un marcador de...", "El lenguaje colectivo indica...".
6. REGLA DE DENSIDAD SEMÁNTICA (RUIDO VS. SEÑAL):

La pregunta pide describir obstáculos. El miedo produce textos cortos. Evalúa la validez así:

A) FILTRO DE RUIDO VACÍO:
Si el texto agregado es muy breve (< 30 palabras) Y está compuesto EXCLUSIVAMENTE por evasivas neutras ("nada", "todo bien", "ok", "sin comentarios"):
→ confianza_analisis: 'insuficiente_data'
→ patrones: []
→ senal_dominante: 'datos_insuficientes'
No inventes problemas donde no los hay.

B) LEXICAL OVERRIDE (BYPASS CLÍNICO):
Si el texto es breve pero contiene AL MENOS UNA FRASE de alta valencia psicológica:
- Menciones de sesgo ("chiquillas", "los hombres")
- Evasión por miedo ("mejor no hablar", "nadie hablará", "todos saben")
- Trato injusto ("no me gusta el trato")
El volumen de palabras deja de importar. DEBES extraer el patrón y/o activar alerta_sesgo_genero.

C) CASTIGO DE INTENSIDAD:
Si aplicas Lexical Override basado en pocas frases (1-2 de 5 personas):
→ intensidad: OBLIGATORIAMENTE 0.4
→ confianza_analisis: 'media'
→ descripcion debe incluir: "Un relato breve pero severo sugiere..."

7. SEÑAL DOMINANTE: Asigna el nombre del patrón con mayor intensidad. Si patrones vacío → "ambiente_sano". Si confianza insuficiente → "datos_insuficientes".`;

// Few-shot: 1 departamento tóxico + 1 departamento sano.
// Enseña al modelo a no inventar patrones donde no los hay.
const FEW_SHOT_TOXICO_USER = `Departamento: Comercial Retail
Número de respondentes (n): 8

Respuestas proyectivas (P1):
<respuestas>
- "Le harían la cama al tiro, así funciona aquí"
- "Nadie se mete, después igual te lo cobran"
- "El jefe diría que está dando color, siempre lo hace con las chiquillas"
- "RRHH nunca hace nada, para qué"
- "A uno lo aíslan, mejor callado"
- "Así es aquí, los que reclaman se van"
- "El gerente tiene sus favoritos y listo"
- "Ya nadie dice nada, da lo mismo"
</respuestas>

Ejecuta tu razonamiento completo en analisis_cot y luego llama a la herramienta de reporte.`;

const FEW_SHOT_TOXICO_ASSISTANT = {
  type: 'tool_use',
  id: 'toolu_fewshot_toxico',
  name: 'reportar_analisis_epidemiologico',
  input: {
    analisis_cot:
      'Prevalencia alta (8/8 respuestas con carga negativa). Marcadores chilenos claros: "hacer la cama", "ley del hielo", "dar color", "chaqueteo". Tres patrones convergen: miedo a represalias (aislamiento, "se van"), resignación aprendida ("así es aquí", "para qué"), y favoritismo ("tiene sus favoritos"). Mención paternalista a "las chiquillas" que activa lente de género. Origen vertical predominante (jefe/gerente/RRHH).',
    patrones: [
      {
        nombre: 'miedo_represalias',
        intensidad: 0.8,
        origen_percibido: 'vertical_descendente',
        fragmentos: ['le harían la cama al tiro', 'los que reclaman se van', 'a uno lo aíslan'],
        descripcion:
          'Las narrativas sugieren expectativa generalizada de consecuencias negativas por hablar, con lenguaje de inevitabilidad.',
      },
      {
        nombre: 'resignacion_aprendida',
        intensidad: 0.8,
        origen_percibido: 'sistemico_procesos',
        fragmentos: ['así es aquí', 'RRHH nunca hace nada', 'ya nadie dice nada'],
        descripcion:
          'Se observa un marcador de desesperanza colectiva hacia los mecanismos formales de reporte.',
      },
      {
        nombre: 'favoritismo_implicito',
        intensidad: 0.6,
        origen_percibido: 'vertical_descendente',
        fragmentos: ['el gerente tiene sus favoritos'],
        descripcion:
          'El lenguaje colectivo indica percepción de trato diferencial asociado a cercanía con la jefatura.',
      },
    ],
    alerta_sesgo_genero: true,
    evidencia_genero: '"las chiquillas"',
    analisis_genero:
      'Uso explícito en contexto de desestimar un comportamiento del jefe, patrón paternalista típico.',
    senal_dominante: 'miedo_represalias',
    confianza_analisis: 'alta',
  },
};

const FEW_SHOT_SANO_USER = `Departamento: Finanzas
Número de respondentes (n): 6

Respuestas proyectivas (P1):
<respuestas>
- "Se investigaría siguiendo el protocolo"
- "El equipo lo conversaría abiertamente"
- "RRHH tomaría cartas, como ha pasado antes"
- "Hay canal de denuncia, funciona"
- "El líder escucharía primero antes de juzgar"
- "Se revisaría con el área correspondiente"
</respuestas>

Ejecuta tu razonamiento completo en analisis_cot y luego llama a la herramienta de reporte.`;

const FEW_SHOT_SANO_ASSISTANT = {
  type: 'tool_use',
  id: 'toolu_fewshot_sano',
  name: 'reportar_analisis_epidemiologico',
  input: {
    analisis_cot:
      'Seis respuestas con contenido consistente: referencia a protocolos, canales formales, escucha del líder, precedentes ("como ha pasado antes"). Cero marcadores de miedo, silencio, favoritismo o represalias. Cero chilenismos negativos. No hay señal de género. Confianza alta (contenido sustantivo, consistencia interna, cero marcadores de riesgo). No forzar patrones.',
    patrones: [],
    alerta_sesgo_genero: false,
    senal_dominante: 'ambiente_sano',
    confianza_analisis: 'alta',
  },
};

function buildUserPrompt(
  departmentName: string,
  respondentCount: number,
  respuestas: string[]
): string {
  const bullets = respuestas
    .map((r) => `- ${r.replace(/\s+/g, ' ').trim()}`)
    .filter((r) => r.length > 2)
    .join('\n');

  return `Departamento: ${departmentName}
Número de respondentes (n): ${respondentCount}

Respuestas proyectivas (P1):
<respuestas>
${bullets}
</respuestas>

Ejecuta tu razonamiento completo en analisis_cot y luego llama a la herramienta de reporte. Recuerda:
- Evalúa si hay datos suficientes para un análisis de alta confianza.
- No fuerces patrones si el ambiente percibe seguridad psicológica.
- Clasifica el origen de cada patrón (vertical/horizontal/sistémico).
- Evalúa el lente de género independientemente de los patrones.`;
}

export interface AnalyzeDepartmentInput {
  departmentName: string;
  respondentCount: number;
  respuestas: string[];
}

export async function analyzeDepartmentPatterns(
  input: AnalyzeDepartmentInput
): Promise<
  | { success: true; data: PatronAnalysisOutput; usage?: { inputTokens: number; outputTokens: number } }
  | { success: false; error: string }
> {
  const userPrompt = buildUserPrompt(
    input.departmentName,
    input.respondentCount,
    input.respuestas
  );

  const result = await callAnthropicWithTool<PatronAnalysisOutput>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    tool: TOOL,
    fewShot: [
      // Ejemplo 1: departamento tóxico
      { role: 'user', content: FEW_SHOT_TOXICO_USER },
      { role: 'assistant', content: [FEW_SHOT_TOXICO_ASSISTANT] },
      // tool_result del ejemplo 1 combinado con el prompt del ejemplo 2
      // (no se pueden tener dos mensajes `user` consecutivos en la API).
      {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_fewshot_toxico',
            content: 'Análisis registrado correctamente.',
          },
          { type: 'text', text: FEW_SHOT_SANO_USER },
        ],
      },
      // Ejemplo 2: departamento sano
      { role: 'assistant', content: [FEW_SHOT_SANO_ASSISTANT] },
    ],
    // El helper inyecta el tool_result del último tool_use junto al userPrompt
    // real del runtime. Sin esto la API rechaza la conversación con HTTP 400.
    lastFewShotToolUseId: 'toolu_fewshot_sano',
    maxTokens: 4096,
    temperature: 0.1,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data, usage: result.usage };
}
