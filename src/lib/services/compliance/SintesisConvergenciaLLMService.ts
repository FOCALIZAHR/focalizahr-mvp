// src/lib/services/compliance/SintesisConvergenciaLLMService.ts
// Tercera llamada LLM del módulo Compliance: síntesis ejecutiva de la
// sección Las Señales (C3) — narrativa específica por campaña.
//
// Se ejecuta UNA SOLA VEZ al cerrar el ciclo, en `processOrgMetaIfReady`,
// DESPUÉS de createAlertsFromConvergencia (necesita las alertas frescas
// como input). El output se persiste en orgPayload.narratives.sintesisEjecutiva
// y nunca se regenera en cada GET del report.
//
// Filosofía:
//   - El motor determinista (ConvergenciaEngine + AlertService) ya evaluó.
//   - El LLM redacta el texto del header — traduce flags a consecuencias humanas.
//   - Cero jerga del sistema. Cero recomendaciones. Cero plazos.

import { callAnthropicWithTool, AnthropicTool } from '@/lib/ai/anthropicToolUse';
import type { CasoMotorA, NivelFinal } from './ConvergenciaEngine';
import type { ComplianceAlertType } from '@/config/complianceAlertConfig';

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export type AlertaHistoricaTipo =
  | 'ley_karin'
  | 'senal_ignorada'
  | 'fallaCicloDeVida'
  | 'teatroCumplimiento';

export interface DeptoTopInput {
  nombre: string;
  isaScore: number | null;
  casosActivos: CasoMotorA[];
  alertasActivas: ComplianceAlertType[];
  alertasHistoricas: AlertaHistoricaTipo[];
  patron_cultural_dominante: string | null;
}

export interface AnalyzeSintesisInput {
  estado_dominante: NivelFinal;
  top_departamentos: DeptoTopInput[];
}

export interface SintesisEjecutivaOutput {
  veredicto: string;
  lego_narrativo: string;
}

// ════════════════════════════════════════════════════════════════════════════
// TOOL DEFINITION (Tool Use — JSON estructurado garantizado)
// ════════════════════════════════════════════════════════════════════════════

const TOOL: AnthropicTool = {
  name: 'reportar_sintesis_ejecutiva',
  description:
    'Registra el texto de la síntesis ejecutiva de Las Señales para que el CEO lo lea en el header del módulo Compliance.',
  input_schema: {
    type: 'object',
    properties: {
      veredicto: {
        type: 'string',
        description:
          'Máximo 2 oraciones. Frase única que captura el hallazgo dominante. Sin jerga del sistema.',
      },
      lego_narrativo: {
        type: 'string',
        description:
          'Máximo 3 oraciones. Traduce las señales a consecuencias humanas. Frases cortas, ritmo ascendente. La última genera incomodidad sin alarmar.',
      },
    },
    required: ['veredicto', 'lego_narrativo'],
  },
};

// ════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ════════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `Eres un asesor ejecutivo hablando directamente con el CEO de la empresa.
El análisis determinista ya evaluó la organización. Tu tarea es redactar el texto de la síntesis ejecutiva de Las Señales.

REGLA ABSOLUTA: Consecuencia humana, nunca mecánica del sistema.
Prohibido: "validación cruzada", "convergencia", "algoritmo", "fuentes",
"Motor A", "señales", "ISA", cualquier término técnico del sistema.

Traduce cada dato a lo que significa para personas reales:
- ley_karin resuelta → Alguien llegó al punto donde ya no podía callarse.
  El sistema cerró la denuncia. El ambiente no cambió.
- senal_ignorada → Se gestionó el síntoma. La causa no se tocó.
- fallaCicloDeVida → Llegaron nuevos. Sintieron el ambiente antes de
  adaptarse. Ya no están.
- teatroCumplimiento → El equipo aprendió qué responder.
  El sistema mide el miedo, no el ambiente.
- criticalByManager → Mismo liderazgo, dos realidades opuestas.
  La variable no son los equipos.

Restricciones de redacción:
— Una idea por oración. Frases cortas que escalan en gravedad.
— La última frase genera incomodidad sin alarmar. Sin plazos. Sin instrucciones.
— Si hay causas posibles, presentarlas separadas por 'O'. Nunca emitir juicio sobre por qué ocurrió.
— No describas el problema. Describe lo que significa que exista.

Debes mencionar explícitamente los nombres de los departamentos afectados.
Cero jerga de RRHH. Cero recomendaciones.

Invoca la herramienta \`reportar_sintesis_ejecutiva\` con los dos campos requeridos.`;

// ════════════════════════════════════════════════════════════════════════════
// USER PROMPT BUILDER
// ════════════════════════════════════════════════════════════════════════════

function buildUserPrompt(input: AnalyzeSintesisInput): string {
  const deptBlocks = input.top_departamentos
    .map((d, idx) => {
      const casos =
        d.casosActivos.length > 0 ? d.casosActivos.join(', ') : '(ninguno)';
      const alertasActivas =
        d.alertasActivas.length > 0 ? d.alertasActivas.join(', ') : '(ninguna)';
      const alertasHistoricas =
        d.alertasHistoricas.length > 0
          ? d.alertasHistoricas.join(', ')
          : '(ninguna)';
      const patronCultural = d.patron_cultural_dominante ?? '(sin patrón dominante)';
      const isa = d.isaScore !== null ? d.isaScore.toString() : 'N/A';

      return `[${idx + 1}] ${d.nombre}
  isaScore: ${isa}
  casosActivos: ${casos}
  alertasActivas: ${alertasActivas}
  alertasHistoricas: ${alertasHistoricas}
  patron_cultural_dominante: ${patronCultural}`;
    })
    .join('\n\n');

  return `Estado dominante de la organización: ${input.estado_dominante}
Departamentos en mayor riesgo (top ${input.top_departamentos.length}):

<departamentos>
${deptBlocks}
</departamentos>

Redacta el veredicto y el lego narrativo siguiendo todas las reglas del system prompt. Menciona explícitamente los nombres de los departamentos. Invoca la herramienta.`;
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICIO PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

/**
 * Genera la síntesis ejecutiva LLM para la sección Las Señales.
 * Decisión 4: degradación silenciosa — si el LLM falla, retorna error
 * pero el caller (orchestrator) continúa con fallback (sintesisEjecutiva: null).
 */
export async function generateSintesisEjecutiva(
  input: AnalyzeSintesisInput
): Promise<
  | { success: true; data: SintesisEjecutivaOutput }
  | { success: false; error: string }
> {
  if (input.top_departamentos.length === 0) {
    return {
      success: false,
      error: 'No hay departamentos en top_departamentos para sintetizar',
    };
  }

  const userPrompt = buildUserPrompt(input);

  const result = await callAnthropicWithTool<SintesisEjecutivaOutput>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    tool: TOOL,
    maxTokens: 1024,
    temperature: 0.2,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}
