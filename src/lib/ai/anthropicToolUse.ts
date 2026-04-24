// src/lib/ai/anthropicToolUse.ts
// Helper compartido para invocar Claude API con Tool Use (Structured Outputs).
//
// Reusable más allá de Compliance. Fuerza `tool_choice` al tool dado; el output
// llega como `content[0].input` ya parseado por Anthropic — no hay JSON en texto
// que haya que parsear con regex.
//
// Lee ANTHROPIC_API_KEY de process.env. Si falta, retorna success=false.

type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; [key: string]: unknown }>;
};

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ToolUseCallOptions {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  tool: AnthropicTool;
  maxTokens?: number;
  temperature?: number;
  /**
   * NO especificar junto con `temperature` — Claude Sonnet 4.6+ rechaza
   * conversaciones con ambos parámetros. Dejar undefined para usar solo
   * `temperature` (recomendado para Tool Use / Structured Outputs).
   */
  topP?: number;
  /** Mensajes previos (few-shot). Se insertan antes del userPrompt. */
  fewShot?: AnthropicMessage[];
  /**
   * Si el fewShot termina en un mensaje `assistant` con `tool_use`, la API
   * exige que el siguiente mensaje `user` contenga un `tool_result` con el
   * mismo `tool_use_id`. Setear este campo hace que el helper construya el
   * último mensaje user como `[tool_result, text userPrompt]` automáticamente.
   */
  lastFewShotToolUseId?: string;
  /** Reintentos ante 429 y 5xx. Default 2. */
  maxRetries?: number;
}

export type ToolUseResult<T> =
  | {
      success: true;
      data: T;
      usage?: { inputTokens: number; outputTokens: number };
    }
  | {
      success: false;
      error: string;
      status?: number;
    };

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export async function callAnthropicWithTool<T>(
  options: ToolUseCallOptions
): Promise<ToolUseResult<T>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'ANTHROPIC_API_KEY no configurada' };
  }

  const {
    model = DEFAULT_MODEL,
    systemPrompt,
    userPrompt,
    tool,
    maxTokens = 4096,
    temperature = 0.1,
    topP, // sin default — Sonnet 4.6+ no acepta topP junto con temperature
    fewShot = [],
    lastFewShotToolUseId,
    maxRetries = 2,
  } = options;

  // Si el fewShot deja un tool_use sin tool_result, lo inyectamos junto al
  // userPrompt real para que la conversación sea válida ante la API.
  const finalUserMessage: AnthropicMessage = lastFewShotToolUseId
    ? {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: lastFewShotToolUseId,
            content: 'Análisis registrado correctamente.',
          },
          { type: 'text', text: userPrompt },
        ],
      }
    : { role: 'user', content: userPrompt };

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    tools: [tool],
    tool_choice: { type: 'tool' as const, name: tool.name },
    messages: [...fewShot, finalUserMessage],
  };
  // Solo incluir top_p si el caller lo especificó explícitamente.
  if (topP !== undefined) {
    body.top_p = topP;
  }

  let lastError = 'unknown';
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 429 || res.status >= 500) {
        lastError = `HTTP ${res.status}`;
        lastStatus = res.status;
        const backoffMs = Math.min(1000 * 2 ** attempt, 8000);
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return {
          success: false,
          error: `HTTP ${res.status}: ${errText.slice(0, 300)}`,
          status: res.status,
        };
      }

      const json = (await res.json()) as {
        content?: Array<{ type: string; name?: string; input?: unknown; text?: string }>;
        usage?: { input_tokens: number; output_tokens: number };
      };

      const toolBlock = json.content?.find(
        (c) => c.type === 'tool_use' && c.name === tool.name
      );

      if (!toolBlock || toolBlock.input === undefined) {
        return {
          success: false,
          error: `Respuesta sin tool_use "${tool.name}". Content=${JSON.stringify(
            json.content
          )?.slice(0, 300)}`,
        };
      }

      return {
        success: true,
        data: toolBlock.input as T,
        usage: json.usage
          ? { inputTokens: json.usage.input_tokens, outputTokens: json.usage.output_tokens }
          : undefined,
      };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      const backoffMs = Math.min(1000 * 2 ** attempt, 8000);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  return { success: false, error: lastError, status: lastStatus };
}
