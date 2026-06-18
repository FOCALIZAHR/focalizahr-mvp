// ════════════════════════════════════════════════════════════════════════════
// EMAIL SERVICE - Envio Resend aislado (Gate A v3.0)
// src/lib/services/email-service.ts
// ════════════════════════════════════════════════════════════════════════════
// Single-responsibility: una llamada a Resend con captura defensiva.
// Spec: .claude/tasks/SPEC_GATE_A_COMUNICACIONES_v3.md seccion 3.1
//
// Extraido del envio que vivia inline en activate/route.ts. Aplica los
// Protocolos v5 del cron de send-reminders:
//   - Protocolo 1: capturar { data, error }. Exito solo si data existe.
//   - Protocolo 3: from = RESEND_FROM_EMAIL (env validado al inicio).
//
// NO incluye delay 600ms (rate limit): el delay vive en el dispatcher.
// NO renderiza templates: el caller pasa subject + html ya renderizados.
// NO toca Prisma: el caller persiste el resultado.
// ════════════════════════════════════════════════════════════════════════════

import { Resend } from 'resend';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'FocalizaHR <noreply@focalizahr.cl>';

// Lazy instance: evita crash al cargar el modulo si RESEND_API_KEY falta.
// El error real surge al despachar (caller lo maneja como retry).
let resendInstance: Resend | null = null;
function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export type EmailSendArgs = {
  to: string;
  subject: string;
  html: string;
};

export type EmailSendResult =
  | { success: true; providerId: string }
  | { success: false; error: string };

/**
 * Envia un email via Resend con captura defensiva.
 *
 * Contrato:
 *   - Devuelve success=true solo si Resend confirmo envio Y devolvio data.id
 *   - Cualquier otro caso (error de Resend, data ausente, excepcion) -> success=false
 *   - NUNCA lanza: el caller (dispatcher) decide retry vs failed
 */
export async function sendEmail(args: EmailSendArgs): Promise<EmailSendResult> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: args.to,
      subject: args.subject,
      html: args.html,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message || JSON.stringify(error),
      };
    }

    if (!data?.id) {
      return { success: false, error: 'Resend did not return data.id' };
    }

    return { success: true, providerId: data.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown send error',
    };
  }
}
