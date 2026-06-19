// ════════════════════════════════════════════════════════════════════════════
// MESSAGE DISPATCHER - Procesador de cola unificada (Gate A v3.0)
// src/lib/services/message-dispatcher.ts
// ════════════════════════════════════════════════════════════════════════════
// Procesa CommunicationMessage en estado PENDING -> SENDING -> SENT/FAILED.
// Spec: .claude/tasks/SPEC_GATE_A_COMUNICACIONES_v3.md seccion 3.3
//
// Diseno clave:
//   - Anti-solapamiento: updateMany con WHERE status=PENDING + count==1.
//     Otro proceso pierde la carrera y salta el mensaje.
//   - Crash recovery: mensajes SENDING > 10 min vuelven a PENDING.
//   - Retry con backoff exponencial: 60s / 300s / 900s. Al 4to intento, FAILED.
//   - Rate limit Resend: 600ms entre sends exitosos (Protocolo 2).
//   - Espejo EmailLog para messageType='invitation' (compat send-reminders legacy).
//   - Render del template al despachar (la cola guarda solo datos en `variables`).
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/services/email-service';
import { sendWhatsApp } from '@/lib/services/whatsapp-service';
import { getWhatsAppTemplate } from '@/lib/templates/whatsapp-templates';
import { renderEmailTemplate } from '@/lib/templates/email-templates';
import { getLegalEmailLabels } from '@/config/compliance/legalBadgeConfig';
import type { MessageChannel, MessageStatus } from '@prisma/client';

const BATCH_SIZE = 50;
const STUCK_THRESHOLD_MS = 10 * 60 * 1000;       // 10 min en SENDING -> rescatar
const RATE_LIMIT_DELAY_MS = 600;                  // entre sends exitosos
const MAX_RETRY = 3;                              // tope retries antes de FAILED
const BACKOFF_MS = [60_000, 300_000, 900_000];   // 1 min, 5 min, 15 min

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type DispatcherBatchResult = {
  processed: number;
  sent: number;
  failed: number;
  remaining: number;
};

/**
 * Ejecuta un batch del dispatcher.
 *
 * Flujo:
 *   1. Rescata mensajes colgados en SENDING (crash recovery)
 *   2. Toma hasta BATCH_SIZE en PENDING con scheduledAt <= now
 *   3. Por cada mensaje: claim atomico -> render -> send -> mark SENT/retry/FAILED
 *   4. Cuenta PENDING restantes para encadenamiento
 */
export async function runDispatcherBatch(): Promise<DispatcherBatchResult> {
  const now = new Date();
  let processed = 0;
  let sent = 0;
  let failed = 0;

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Crash recovery: SENDING sin sentAt y updatedAt viejo -> PENDING
  // ──────────────────────────────────────────────────────────────────────────
  const stuckCutoff = new Date(now.getTime() - STUCK_THRESHOLD_MS);
  const rescued = await prisma.communicationMessage.updateMany({
    where: {
      status: 'SENDING',
      sentAt: null,
      updatedAt: { lt: stuckCutoff },
    },
    data: { status: 'PENDING' },
  });
  if (rescued.count > 0) {
    console.log(`[Dispatcher] Rescatados de SENDING colgado: ${rescued.count}`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Tomar batch de PENDING listos
  // ──────────────────────────────────────────────────────────────────────────
  const messages = await prisma.communicationMessage.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: 'asc' },
    take: BATCH_SIZE,
  });

  if (messages.length === 0) {
    return { processed: 0, sent: 0, failed: 0, remaining: 0 };
  }

  // Pre-fetch cuentas para evitar N queries de account.country/companyName
  const uniqueAccountIds = Array.from(new Set(messages.map((m) => m.accountId)));
  const accounts = await prisma.account.findMany({
    where: { id: { in: uniqueAccountIds } },
    select: { id: true, country: true, companyName: true },
  });
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Procesar cada mensaje
  // ──────────────────────────────────────────────────────────────────────────
  for (const msg of messages) {
    // 3a. Claim atomico: solo procede si nadie mas lo tomo
    const claim = await prisma.communicationMessage.updateMany({
      where: { id: msg.id, status: 'PENDING' },
      data: { status: 'SENDING' },
    });
    if (claim.count !== 1) {
      // Otro proceso lo tomo, saltar sin contar
      continue;
    }
    processed++;

    // 3b. Switch por canal
    if (msg.channel === 'WHATSAPP') {
      // Gate B: despacho WhatsApp en modo simulation (TWILIO_MODE=simulation).
      // El servicio no envia nada real; loggea y retorna sim_... El espejo
      // EmailLog NO aplica a WhatsApp (es solo para el canal email).
      if (!msg.toPhone) {
        await markFailed(msg.id, 'missing toPhone for WHATSAPP channel');
        failed++;
        continue;
      }

      const variables = (msg.variables ?? {}) as Record<string, unknown>;
      const waVariables: Record<string, string> = {};
      for (const [k, v] of Object.entries(variables)) {
        if (v !== null && v !== undefined) waVariables[k] = String(v);
      }

      const waResult = await sendWhatsApp({
        to: msg.toPhone,
        templateId: getWhatsAppTemplate(msg.templateSlug)?.contentSid || msg.templateSlug,
        variables: waVariables,
      });

      if (waResult.success) {
        await markSent(msg.id, waResult.messageId, now, waResult.cost);
        sent++;
        // Mismo rate limit que email entre envios exitosos.
        await delay(RATE_LIMIT_DELAY_MS);
      } else {
        // Mismo manejo de fallo que email: retry con backoff o FAILED terminal.
        if (msg.retryCount < MAX_RETRY) {
          const backoff = BACKOFF_MS[msg.retryCount] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
          await prisma.communicationMessage.update({
            where: { id: msg.id },
            data: {
              status: 'PENDING',
              retryCount: msg.retryCount + 1,
              scheduledAt: new Date(now.getTime() + backoff),
              errorMessage: waResult.error,
            },
          });
        } else {
          await markFailed(msg.id, waResult.error);
          failed++;
        }
      }
      continue;
    }

    if (msg.channel !== 'EMAIL') {
      await markFailed(msg.id, `unknown channel: ${msg.channel}`);
      failed++;
      continue;
    }

    // 3c. Validar destinatario email
    if (!msg.toEmail) {
      await markFailed(msg.id, 'missing toEmail for EMAIL channel');
      failed++;
      continue;
    }

    // 3d. Render del template
    const account = accountMap.get(msg.accountId);
    if (!account) {
      await markFailed(msg.id, `account not found: ${msg.accountId}`);
      failed++;
      continue;
    }

    const variables = (msg.variables ?? {}) as Record<string, unknown>;
    // Pais snapshot al momento del encolado (determinismo i18n).
    // Si no esta en variables, fallback a account.country actual.
    const country = (typeof variables.country === 'string' ? variables.country : null) || account.country;
    const legalLabels = getLegalEmailLabels(country);

    let subject: string;
    let html: string;
    try {
      // Coerce todos los valores a string para cumplir el contrato de
      // renderEmailTemplate(Record<string, string>). Variables planas
      // que vienen de JSON (numeros, fechas) se serializan defensivamente.
      const templateVars: Record<string, string> = {};
      for (const [k, v] of Object.entries(variables)) {
        if (v !== null && v !== undefined) templateVars[k] = String(v);
      }
      // Defaults + override de labels legales segun country snapshot
      templateVars.participant_name = templateVars.participant_name || 'Estimado/a colaborador/a';
      templateVars.company_name = templateVars.company_name || account.companyName;
      templateVars.survey_url = templateVars.survey_url || '';
      templateVars.legal_badge = legalLabels.badge;
      templateVars.legal_greeting = legalLabels.greeting;
      templateVars.legal_preview = legalLabels.preview;

      const rendered = renderEmailTemplate(msg.templateSlug, templateVars);
      subject = rendered.subject;
      html = rendered.html;
    } catch (err) {
      // Error de render: tratamos como fallo terminal (no es retryable).
      const errMsg = err instanceof Error ? err.message : 'render error';
      await markFailed(msg.id, `render failed: ${errMsg}`);
      failed++;
      continue;
    }

    // 3e. Enviar via Resend
    const result = await sendEmail({ to: msg.toEmail, subject, html });

    if (result.success) {
      await markSent(msg.id, result.providerId, now);

      // Espejo EmailLog para invitaciones (compat send-reminders legacy)
      if (msg.messageType === 'invitation' && msg.participantId && msg.campaignId) {
        try {
          await prisma.emailLog.create({
            data: {
              participantId: msg.participantId,
              campaignId: msg.campaignId,
              emailType: 'invitation',
              templateId: msg.templateSlug,
              sentAt: now,
              status: 'sent',
            },
          });
        } catch (logError) {
          // No bloquear SENT del mensaje principal si el espejo falla
          console.error(
            `[Dispatcher] EmailLog mirror failed for message ${msg.id}:`,
            logError instanceof Error ? logError.message : logError
          );
        }
      }

      sent++;
      // Rate limit: solo despues de un envio exitoso real
      await delay(RATE_LIMIT_DELAY_MS);
    } else {
      // 3f. Manejar fallo: retry con backoff o FAILED terminal
      if (msg.retryCount < MAX_RETRY) {
        const backoff = BACKOFF_MS[msg.retryCount] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
        await prisma.communicationMessage.update({
          where: { id: msg.id },
          data: {
            status: 'PENDING',
            retryCount: msg.retryCount + 1,
            scheduledAt: new Date(now.getTime() + backoff),
            errorMessage: result.error,
          },
        });
      } else {
        await markFailed(msg.id, result.error);
        failed++;
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Contar PENDING restantes para encadenamiento
  // ──────────────────────────────────────────────────────────────────────────
  const remaining = await prisma.communicationMessage.count({
    where: { status: 'PENDING', scheduledAt: { lte: new Date() } },
  });

  // 5. Alerta si batch tuvo > 50% de fallos
  if (processed > 0 && failed / processed > 0.5) {
    console.error(
      `[DISPATCHER ALERT] Batch con ${failed}/${processed} fallos (${Math.round((failed / processed) * 100)}%)`
    );
  }

  return { processed, sent, failed, remaining };
}

async function markSent(
  id: string,
  providerId: string,
  sentAt: Date,
  costUsd?: number
): Promise<void> {
  await prisma.communicationMessage.update({
    where: { id },
    data: {
      status: 'SENT',
      sentAt,
      providerId,
      errorMessage: null,
      // Solo el canal WhatsApp reporta costo; email lo deja en null.
      ...(costUsd !== undefined ? { costUsd } : {}),
    },
  });
}

async function markFailed(id: string, error: string): Promise<void> {
  await prisma.communicationMessage.update({
    where: { id },
    data: {
      status: 'FAILED',
      failedAt: new Date(),
      errorMessage: error,
    },
  });
}
