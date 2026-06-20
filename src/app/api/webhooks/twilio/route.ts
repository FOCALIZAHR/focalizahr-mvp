// ════════════════════════════════════════════════════════════════════════════
// WEBHOOK TWILIO - Consent + status callbacks WhatsApp (Gate C v3.0, el corazon)
// src/app/api/webhooks/twilio/route.ts
// ════════════════════════════════════════════════════════════════════════════
// UN solo endpoint para dos responsabilidades (ambas requieren la MISMA firma):
//   - INBOUND: respuestas del usuario (botones/texto) -> escribe consent en Employee.
//   - STATUS CALLBACK: delivered/read -> mapea por providerId a CommunicationMessage.
//
// SEGURIDAD FAIL-CLOSED (spec 1.4, NO NEGOCIABLE):
//   En produccion la firma se valida SIEMPRE con twilio.validateRequest. Firma
//   invalida o ausente -> 403, sin tocar BD. NO existe flag de bypass: el unico
//   bypass admisible (dev local) esta atado a NODE_ENV !== 'production', condicion
//   que no se puede activar por error en prod.
//
// Multi-tenant: el lookup del Employee es por phone SIN scope de accountId (ese es
// el punto: detectar colision del mismo numero en cuentas distintas). Casos >1
// cuenta / >1 employee / 0 employees -> loguear, NO escribir.
//
// Spec: .claude/tasks/SPEC_GATE_C_COMUNICACIONES_v3.md seccion 4.2.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsApp } from '@/lib/services/whatsapp-service';
import { REQUEST_EMAIL_BODY } from '@/lib/templates/whatsapp-templates';
import { normalizePhone } from '@/lib/utils/normalizePhone';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // twilio SDK + crypto requieren node runtime

// Validacion email simple, suficiente para captura por WhatsApp.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 200 plano (sin TwiML): Twilio no reintenta y no inyectamos respuesta al usuario.
function ok200(): Response {
  return new Response('', { status: 200 });
}

/**
 * Valida la firma del request Twilio (fail-closed en produccion).
 * @returns true si la firma es valida; en dev (NODE_ENV != production) retorna true
 *          aunque falle (bypass local), logueando el caso.
 */
async function isSignatureValid(
  request: NextRequest,
  params: Record<string, string>
): Promise<boolean> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get('x-twilio-signature') || '';
  const webhookUrl =
    process.env.TWILIO_WEBHOOK_URL ||
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/webhooks/twilio`;

  let valid = false;
  if (authToken && webhookUrl) {
    try {
      const twilioPkg: any = await import('twilio');
      const validateRequest = twilioPkg.validateRequest || twilioPkg.default?.validateRequest;
      valid = !!validateRequest && validateRequest(authToken, signature, webhookUrl, params);
    } catch (err) {
      console.error('[TwilioWebhook] Error validando firma:', err instanceof Error ? err.message : err);
      valid = false;
    }
  }

  if (valid) return true;

  // Fail-closed: en prod NO hay bypass. Solo dev local (NODE_ENV != production).
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[TwilioWebhook] Firma invalida/ausente: bypass dev (NODE_ENV != production)');
    return true;
  }
  return false;
}

// ════════════════════════════════════════════════════════════════════════════
// POST
// ════════════════════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  // 1. Parsear body form-urlencoded (Twilio NO envia JSON).
  let params: Record<string, string> = {};
  try {
    const form = await request.formData();
    for (const [k, v] of form.entries()) {
      params[k] = typeof v === 'string' ? v : '';
    }
  } catch {
    // Body no parseable: no es un webhook valido. No tocar BD.
    return new Response('Bad Request', { status: 400 });
  }

  // 2. SEGURIDAD FAIL-CLOSED: firma primero, antes de tocar BD.
  if (!(await isSignatureValid(request, params))) {
    return new Response('Forbidden', { status: 403 });
  }

  // 3. STATUS CALLBACK (delivered/read): presencia de MessageStatus.
  const messageStatus = params.MessageStatus || params.SmsStatus;
  if (messageStatus) {
    await handleStatusCallback(params, messageStatus);
    return ok200();
  }

  // 4. INBOUND (consent): respuesta del usuario.
  await handleInbound(params);
  return ok200();
}

// ════════════════════════════════════════════════════════════════════════════
// STATUS CALLBACK -> deliveredAt por providerId
// ════════════════════════════════════════════════════════════════════════════
async function handleStatusCallback(
  params: Record<string, string>,
  status: string
): Promise<void> {
  const messageSid = params.MessageSid || params.SmsSid;
  if (!messageSid) return;

  const normalized = status.toLowerCase();
  // Solo delivered/read marcan entrega. sent/queued no cambian deliveredAt.
  if (normalized !== 'delivered' && normalized !== 'read') return;

  // Match por providerId (MessageSid). Indice @@index([providerId]) (Gate C).
  await prisma.communicationMessage.updateMany({
    where: { providerId: messageSid },
    data: { deliveredAt: new Date(), status: 'DELIVERED' },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// INBOUND -> consent en Employee (modelo hibrido por empresa)
// ════════════════════════════════════════════════════════════════════════════
async function handleInbound(params: Record<string, string>): Promise<void> {
  // Normalizar el From (quitar prefijo whatsapp:, luego canonizar con la util).
  const rawFrom = (params.From || '').replace(/^whatsapp:/i, '');
  const fromNorm = normalizePhone(rawFrom);
  if (!fromNorm.ok || !fromNorm.value) {
    console.warn(`[TwilioWebhook] From no normalizable: "${params.From}" -> no se procesa`);
    return;
  }

  // Lookup multi-tenant por phone (SIN scope de accountId: detecta colision).
  const employees = await prisma.employee.findMany({
    where: { phoneNumber: fromNorm.value, isActive: true },
    select: { id: true, accountId: true, awaitingEmailCapture: true, channelConsentAt: true },
  });

  if (employees.length === 0) {
    // 0 matches: no-Employees difieren a Gate D. Loguear, sin escribir, sin respuesta.
    console.warn(`[TwilioWebhook] phone sin Employee asociado: ${fromNorm.value} (difiere a Gate D)`);
    return;
  }

  const distinctAccounts = new Set(employees.map((e) => e.accountId));
  if (distinctAccounts.size > 1) {
    // Colision multi-tenant: mismo phone en cuentas distintas. NO escribir.
    console.error(
      `[TwilioWebhook] CONFLICTO multi-tenant: phone ${fromNorm.value} en ${distinctAccounts.size} cuentas. Revision manual, no se escribe.`
    );
    return;
  }
  if (employees.length > 1) {
    // Duplicado de datos en la MISMA cuenta: no se sabe quien consintio. NO escribir.
    console.error(
      `[TwilioWebhook] AMBIGUO: phone ${fromNorm.value} en ${employees.length} Employees de la misma cuenta. No se escribe.`
    );
    return;
  }

  const employee = employees[0];
  const body = (params.Body || '').trim();
  const choice = (params.ButtonPayload || params.ButtonText || body).toLowerCase();
  const now = new Date();

  // 1. Si esta esperando captura de email, el Body es el email.
  if (employee.awaitingEmailCapture) {
    if (EMAIL_REGEX.test(body)) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          personalEmail: body,
          preferredChannel: 'email',
          channelConsentAt: now,
          channelConsentMethod: 'whatsapp_text',
          awaitingEmailCapture: false,
        },
      });
      console.log(`[TwilioWebhook] Email capturado para Employee ${employee.id}`);
    } else {
      // Email invalido: repreguntar (mensaje libre, misma ventana 24h).
      await sendRequestEmail(fromNorm.value, employee.id, employee.accountId);
      console.log(`[TwilioWebhook] Email invalido de Employee ${employee.id}: repregunta`);
    }
    return;
  }

  // 2. Eleccion de canal por boton/texto.
  const wantsWhatsapp =
    choice.includes('whatsapp') || choice.includes('sigo') || /\bs[ií]\b/.test(choice);
  const wantsEmail =
    choice.includes('email') || choice.includes('correo') || choice.includes('mail');

  if (wantsWhatsapp) {
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        channelConsentAt: now,
        preferredChannel: 'whatsapp',
        channelConsentMethod: 'whatsapp_button',
        awaitingEmailCapture: false,
      },
    });
    console.log(`[TwilioWebhook] Consent WhatsApp para Employee ${employee.id}`);
    return;
  }

  if (wantsEmail) {
    await prisma.employee.update({
      where: { id: employee.id },
      data: { awaitingEmailCapture: true },
    });
    // Enviar request-email INMEDIATO (ventana 24h abierta), NO encolar.
    await sendRequestEmail(fromNorm.value, employee.id, employee.accountId);
    console.log(`[TwilioWebhook] Preferencia email para Employee ${employee.id}: request-email enviado`);
    return;
  }

  // Respuesta no reconocida (ej. "Mas informacion"): solo loguear, sin cambio.
  console.log(`[TwilioWebhook] Respuesta no reconocida de Employee ${employee.id}: "${body}"`);
}

// ════════════════════════════════════════════════════════════════════════════
// request-email: envio LIBRE inmediato + registro en CommunicationMessage
// ════════════════════════════════════════════════════════════════════════════
// Salta el dispatcher (la ventana 24h podria cerrar), pero IGUAL registra el
// resultado (SENT/FAILED) para auditoria. providerId = MessageSid de Twilio para
// que un eventual status callback de este envio inline tambien matchee (C7).
async function sendRequestEmail(
  toPhone: string,
  employeeId: string,
  accountId: string
): Promise<void> {
  const result = await sendWhatsApp({ to: toPhone, body: REQUEST_EMAIL_BODY });
  const now = new Date();

  await prisma.communicationMessage.create({
    data: {
      accountId,
      channel: 'WHATSAPP',
      templateSlug: 'request-email', // slug interno de tracking (no es template Meta)
      messageType: 'request-email',
      toPhone,
      employeeId,
      status: result.success ? 'SENT' : 'FAILED',
      sentAt: result.success ? now : null,
      failedAt: result.success ? null : now,
      providerId: result.success ? result.messageId : null,
      errorMessage: result.success ? null : result.error,
      costUsd: result.success ? result.cost : null,
      // sin dedupKey: request-email puede repetirse (reintento por email invalido).
    },
  });
}
