// ════════════════════════════════════════════════════════════════════════════
// WHATSAPP SERVICE - Envio Twilio aislado (Gate B v3.0)
// src/lib/services/whatsapp-service.ts
// ════════════════════════════════════════════════════════════════════════════
// Single-responsibility: una llamada a Twilio (o su simulacion) con captura
// defensiva. Espejo de email-service.ts: mismo contrato de retorno (discriminated
// union), NUNCA lanza, lazy init. El caller (dispatcher) decide retry vs failed.
//
// Modos por TWILIO_MODE:
//   - 'simulation' (Gate B): NO envia nada. Loggea estructurado y retorna success.
//   - 'sandbox' / 'production' (Gate C): Twilio Content API real. Codigo presente
//     pero inactivo en este gate; el import de twilio es dinamico y solo se evalua
//     en modo real (no se carga en simulation ni rompe el build serverless).
//
// Spec: .claude/tasks/SPEC_GATE_B_COMUNICACIONES_v3.md seccion 4.1.
// NO toca Prisma: el caller persiste el resultado.
// NO renderiza templates: recibe templateId (contentSid) + variables.
// ════════════════════════════════════════════════════════════════════════════

export type WhatsAppSendArgs = {
  to: string;                          // telefono destino E.164 (ej: +56912345678)
  templateId: string;                  // contentSid del template (HX... o placeholder)
  variables: Record<string, string>;   // variables del Content Template
};

export type WhatsAppSendResult =
  | { success: true; messageId: string; cost: number }
  | { success: false; error: string };

type TwilioMode = 'simulation' | 'sandbox' | 'production';

function getMode(): TwilioMode {
  const mode = (process.env.TWILIO_MODE || 'simulation').toLowerCase();
  if (mode === 'sandbox' || mode === 'production') return mode;
  return 'simulation';
}

// Costo por mensaje desde env (NUNCA hardcoded). Default 0 si no esta configurado.
function getCostUsd(): number {
  const raw = process.env.WHATSAPP_COST_USD;
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Backoff para el modo real (Gate C). No se usa en simulation.
const REAL_BACKOFF_MS = [1000, 2000, 4000];
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Envia un WhatsApp (o lo simula segun TWILIO_MODE).
 *
 * Contrato:
 *   - Devuelve success=true solo si el proveedor confirmo (o la simulacion).
 *   - Cualquier error u excepcion -> success=false.
 *   - NUNCA lanza.
 */
export async function sendWhatsApp(args: WhatsAppSendArgs): Promise<WhatsAppSendResult> {
  const mode = getMode();

  // ──────────────────────────────────────────────────────────────────────────
  // MODO SIMULATION (Gate B): cero envio real.
  // ──────────────────────────────────────────────────────────────────────────
  if (mode === 'simulation') {
    console.log(
      '[WhatsApp SIMULATION]',
      JSON.stringify({
        to: args.to,
        template: args.templateId,
        variables: args.variables,
      })
    );
    return {
      success: true,
      messageId: `sim_${Date.now()}`,
      cost: 0,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MODO REAL (sandbox / production) - Gate C. Presente pero inactivo en Gate B.
  // El import de twilio es dinamico: solo se evalua aqui, nunca en simulation.
  // ──────────────────────────────────────────────────────────────────────────
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: 'twilio credentials not configured' };
  }

  try {
    const twilioModule = await import('twilio');
    const twilio = twilioModule.default(accountSid, authToken);
    const cost = getCostUsd();

    let lastError = 'unknown twilio error';
    for (let attempt = 0; attempt <= REAL_BACKOFF_MS.length; attempt++) {
      try {
        const message = await twilio.messages.create({
          from: `whatsapp:${fromNumber}`,
          to: `whatsapp:${args.to}`,
          contentSid: args.templateId,
          contentVariables: JSON.stringify(args.variables),
        });
        return { success: true, messageId: message.sid, cost };
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'twilio send error';
        const backoff = REAL_BACKOFF_MS[attempt];
        if (backoff !== undefined) {
          await delay(backoff);
        }
      }
    }
    return { success: false, error: lastError };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'twilio module load error',
    };
  }
}
