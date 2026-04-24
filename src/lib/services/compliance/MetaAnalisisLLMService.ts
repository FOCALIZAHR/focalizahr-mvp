// src/lib/services/compliance/MetaAnalisisLLMService.ts
// Segunda llamada al LLM: analiza los JSONs de todos los departamentos para
// detectar tendencias sistémicas a nivel organizacional.
//
// Se ejecuta UNA vez por campaña, después de que todos los departamentos
// (n >= 5) tienen su análisis individual y el flag Teatro de Cumplimiento
// calculado en backend.

import { callAnthropicWithTool, AnthropicTool } from '@/lib/ai/anthropicToolUse';
import { MetaAnalysisDepartmentInput, MetaAnalysisOutput } from './complianceTypes';

const TOOL: AnthropicTool = {
  name: 'reportar_meta_analisis_organizacional',
  description:
    'Registra el diagnóstico cultural cross-departamental de una organización a partir de los análisis por departamento.',
  input_schema: {
    type: 'object',
    properties: {
      analisis_cot: {
        type: 'string',
        description:
          'Razonamiento previo obligatorio. Compara patrones entre departamentos, identifica convergencias y asimetrías. ESTO SE LLENA PRIMERO.',
      },
      patron_cultural_dominante: {
        type: 'string',
        description:
          'Patrón clínico que se repite en 3 o más departamentos, o "ninguno" si no hay convergencia. Usar los nombres canónicos (silencio_organizacional, hostilidad_normalizada, favoritismo_implicito, resignacion_aprendida, miedo_represalias) o "ninguno".',
      },
      origen_organizacional: {
        type: 'string',
        enum: [
          'vertical_descendente',
          'horizontal_pares',
          'sistemico_procesos',
          'mixto',
          'indeterminado',
        ],
        description:
          'Origen percibido agregado. "mixto" si hay convivencia de orígenes en magnitudes similares.',
      },
      focos_rojos_count: {
        type: 'integer',
        minimum: 0,
        description:
          'Número de departamentos con safetyScore < 2.5 o con patrón de intensidad >= 0.7.',
      },
      teatro_detectado_count: {
        type: 'integer',
        minimum: 0,
        description:
          'Número de departamentos con flag teatro_cumplimiento = true (viene del backend).',
      },
      hallazgo_narrativo_portada: {
        type: 'string',
        description:
          'Frase ejecutiva (1-2 oraciones, máx 200 caracteres) para la portada del reporte. Lenguaje McKinsey+Apple, sin jerga técnica, sin prescribir acciones.',
      },
      es_problema_cultural: {
        type: 'boolean',
        description:
          'True si 50% o más de los departamentos analizados comparten el patrón dominante.',
      },
    },
    required: [
      'analisis_cot',
      'patron_cultural_dominante',
      'origen_organizacional',
      'focos_rojos_count',
      'teatro_detectado_count',
      'hallazgo_narrativo_portada',
      'es_problema_cultural',
    ],
  },
};

const SYSTEM_PROMPT = `Eres el motor de meta-análisis de FocalizaHR Ambiente Sano. Recibes los análisis clínicos ya consolidados de múltiples departamentos de una misma organización y debes diagnosticar si lo observado es un fenómeno localizado o una característica cultural del sistema.

Filosofía: "Iluminar el riesgo, no probar el delito". No emites veredictos. Describes patrones agregados.

TU TAREA:
Invocar la herramienta \`reportar_meta_analisis_organizacional\` analizando:
1. Qué patrón clínico se repite en 3+ departamentos (si alguno).
2. Cuál es el origen agregado (vertical/horizontal/sistémico/mixto).
3. Cuántos departamentos califican como foco rojo (safetyScore < 2.5 o patrón con intensidad >= 0.7).
4. Cuántos presentan Teatro de Cumplimiento (métricas altas pero LLM detecta riesgo).
5. Una frase de portada ejecutiva.
6. Si el problema es cultural (>=50% de departamentos lo comparten).

REGLAS:
- Nunca inventes patrones que no están en los datos entregados.
- Si ningún patrón se repite en 3+ deptos, patron_cultural_dominante = "ninguno" y es_problema_cultural = false.
- La frase de portada habla como gerente a gerente: directa, sin jerga ("Safety Score", "EXO"), sin verbos prescriptivos ("se recomienda", "deberían"). Describe consecuencia, no instrucción.
- Si hay >= 3 teatro_detectado_count, mencionarlo implícitamente en la portada ("los números dicen una cosa, las respuestas otra").
- Focos rojos se cuentan por departamento, no por patrón.`;

function buildUserPrompt(
  orgSafetyScore: number | null,
  departments: MetaAnalysisDepartmentInput[]
): string {
  const deptBlocks = departments
    .map((d, idx) => {
      const patronesResumen =
        d.patrones.length === 0
          ? '  (sin patrones detectados — ambiente sano)'
          : d.patrones
              .map(
                (p) =>
                  `  - ${p.nombre} (intensidad ${p.intensidad.toFixed(2)}, origen ${p.origen_percibido})`
              )
              .join('\n');

      return `[${idx + 1}] ${d.departmentName}
  respondentes: ${d.respondentCount}
  safetyScore: ${d.safetyScore.toFixed(2)}
  senal_dominante: ${d.senalDominante}
  confianza: ${d.confianza}
  teatro_cumplimiento: ${d.teatroCumplimiento ? 'SÍ' : 'no'}
  patrones:
${patronesResumen}`;
    })
    .join('\n\n');

  return `Organización - Safety Score global: ${orgSafetyScore !== null ? orgSafetyScore.toFixed(2) : 'N/A'}
Departamentos analizados: ${departments.length}

<departamentos>
${deptBlocks}
</departamentos>

Ejecuta tu razonamiento en analisis_cot y luego llama a la herramienta. Contabiliza focos rojos y Teatro de Cumplimiento a partir de los datos entregados. No inventes departamentos ni patrones.`;
}

export interface AnalyzeOrgInput {
  orgSafetyScore: number | null;
  departments: MetaAnalysisDepartmentInput[];
}

export async function analyzeOrgMetaPatterns(
  input: AnalyzeOrgInput
): Promise<
  | { success: true; data: MetaAnalysisOutput; usage?: { inputTokens: number; outputTokens: number } }
  | { success: false; error: string }
> {
  if (input.departments.length === 0) {
    return {
      success: false,
      error: 'No hay departamentos con análisis completado para meta-análisis',
    };
  }

  const userPrompt = buildUserPrompt(input.orgSafetyScore, input.departments);

  const result = await callAnthropicWithTool<MetaAnalysisOutput>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    tool: TOOL,
    maxTokens: 2048,
    temperature: 0.1,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data, usage: result.usage };
}
