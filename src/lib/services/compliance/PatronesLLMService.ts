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
              minimum: 0,
              maximum: 1,
              description:
                'Float 0.0-1.0. Prevalencia × severidad. 0.1-0.3 leve, 0.4-0.6 moderado, 0.7-0.8 alto, 0.9-1.0 crítico. EXCEPCIÓN: si prevalencia muy baja (1 respuesta) pero gravedad extrema → 0.5-0.6 e indicar en descripción.',
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
      contexto_genero: {
        type: 'string',
        description:
          'Si alerta_sesgo_genero es true, justificar la evidencia aquí. Si false, dejar vacío.',
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
          "Si total palabras < 50 o respuestas monosilábicas → 'insuficiente_data' y patrones DEBE ser [].",
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
Busca activamente paternalismo ("las chiquillas", "las niñitas"), desestimación ("le dan color", "es histérica"), evaluación diferencial ("ella es conflictiva" vs "él es asertivo"), o menciones a roles de cuidado/apariencia. Si detectas esto, activa la alerta de género INDEPENDIENTEMENTE de los 5 patrones. Si alerta_sesgo_genero es true, SIEMPRE justifica la evidencia en contexto_genero.

REGLAS ESTRICTAS:
1. CONTEXTO CHILENO: Entiende modismos como "hacer la cama", "mandar a la cresta", "hacerse el larry", "ley del hielo", "chaqueteo", "jefe florero". Interpreta su gravedad subyacente en contexto corporativo.
2. CALIBRACIÓN DE INTENSIDAD (0.0 a 1.0):
   - 0.1-0.3: Menciones aisladas o ambiguas. Lenguaje suave.
   - 0.4-0.6: Prevalencia moderada (~30-50% de respuestas). Incomodidad clara.
   - 0.7-0.8: Tema recurrente. Uso de absolutismos ("siempre", "nadie", "todos saben").
   - 0.9-1.0: Consenso casi total o menciones de hostilidad severa explícita.
   - EXCEPCIÓN DE SEVERIDAD EXTREMA: Si prevalencia es muy baja (1 sola respuesta) pero describe un hecho grave, específico o violento, asigna intensidad 0.5-0.6 e indica en descripción: "Un relato aislado pero severo sugiere..."
3. FRAGMENTOS: MÁXIMO ABSOLUTO 8 PALABRAS. Si contiene nombres, iniciales o cargos que identifiquen a una persona (ej. "lo que le pasó a la contadora nueva"), reemplazar por [CENSURADO].
4. AUSENCIA DE PATRÓN: Si las respuestas denotan proceso sano ("Se investigaría", "RH tomaría cartas"), devuelve array patrones VACÍO []. No inventes problemas. Es aceptable y esperado.
5. LENGUAJE CLÍNICO: La descripción NUNCA dice "Aquí hay acoso". Debe usar: "Las respuestas sugieren...", "Se observa un marcador de...", "El lenguaje colectivo indica...".
6. CONFIANZA INSUFICIENTE: Si respuestas son monosílabos ("no sé", "nada", "bien") o total palabras < 50, usar confianza "insuficiente_data". En ese caso patrones DEBE ser [] y senal_dominante DEBE ser "datos_insuficientes".
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
        intensidad: 0.85,
        origen_percibido: 'vertical_descendente',
        fragmentos: ['le harían la cama al tiro', 'los que reclaman se van', 'a uno lo aíslan'],
        descripcion:
          'Las narrativas sugieren expectativa generalizada de consecuencias negativas por hablar, con lenguaje de inevitabilidad.',
      },
      {
        nombre: 'resignacion_aprendida',
        intensidad: 0.75,
        origen_percibido: 'sistemico_procesos',
        fragmentos: ['así es aquí', 'RRHH nunca hace nada', 'ya nadie dice nada'],
        descripcion:
          'Se observa un marcador de desesperanza colectiva hacia los mecanismos formales de reporte.',
      },
      {
        nombre: 'favoritismo_implicito',
        intensidad: 0.55,
        origen_percibido: 'vertical_descendente',
        fragmentos: ['el gerente tiene sus favoritos'],
        descripcion:
          'El lenguaje colectivo indica percepción de trato diferencial asociado a cercanía con la jefatura.',
      },
    ],
    alerta_sesgo_genero: true,
    contexto_genero:
      'Uso explícito de "las chiquillas" en contexto de desestimar un comportamiento del jefe, patrón paternalista típico.',
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
      'Seis respuestas con contenido consistente: referencia a protocolos, canales formales, escucha del líder, precedentes ("como ha pasado antes"). Cero marcadores de miedo, silencio, favoritismo o represalias. Cero chilenismos negativos. No hay señal de género. Confianza alta (>50 palabras, contenido sustantivo, consistencia interna). No forzar patrones.',
    patrones: [],
    alerta_sesgo_genero: false,
    contexto_genero: '',
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
