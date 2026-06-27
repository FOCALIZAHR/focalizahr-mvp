// ════════════════════════════════════════════════════════════════════════════
// WHATSAPP REMINDERS - Recordatorio del frontline phone-only (Gate E.1, ruta 3)
// src/lib/services/whatsapp-reminders.ts
// ════════════════════════════════════════════════════════════════════════════
// PROBLEMA QUE CIERRA (hallazgo B+C de la spec): el motor de recordatorios legacy es
// email-only (send-reminders/route.ts skipea al que no tiene email) y la escalacion
// cuelga de reminderCount/lastReminderSent que solo el envio de email setea. El
// phone-only (frontline sin correo, razon de ser de E.1) recibe la invitacion por
// WhatsApp y despues SILENCIO. Este servicio le da recordatorio por WhatsApp.
//
// DEUDA SANA (spec §6.1, requisito):
//   1. Servicio AISLADO (mismo molde que survey-escalation.ts). Se borra LIMPIO
//      cuando llegue el motor canal-agnostico (ruta 2), sin ganchos que desarmar.
//   2. Usa la COLA UNIFICADA: encola CommunicationMessage + dispatcher. NO crea un
//      segundo mecanismo de envio.
//   3. REUSA reminderCount / lastReminderSent existentes. NO inventa campos paralelos.
//      Al setear esos campos, la escalacion EXISTENTE (survey-escalation) recoge al
//      phone-only para el tramo de escalacion: invitacion -> recordatorio -> escalacion.
//
// PROHIBICIONES respetadas (spec §6.2): no campos de cadencia paralelos, no envio
// WhatsApp directo (va por la cola), no logica WhatsApp dentro de send-reminders
// (este es un servicio separado que el cron invoca, igual que survey-escalation).
//
// SECUENCIA (spec §6.3): respeta el gate de consent (bloque 2). El candidato se filtra
// con determineChannel(purpose:'content'): solo el que resuelve a 'whatsapp' (opt-in
// REAL derivado del log) recibe. No manda a consent-proxy.
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { buildPhoneResolutionBatch, resolvePhone, type ParticipantForPhone } from '@/lib/services/resolvePhone';
import { deriveConsentBatch } from '@/lib/services/consent-derivation';
import { determineChannel } from '@/lib/services/channel-selector';
import { WHATSAPP_REMINDER_SLUG } from '@/lib/templates/whatsapp-templates';
import { runDispatcherBatch } from '@/lib/services/message-dispatcher';

// Cadencia: mismo espiritu que el email (reminder1 ~dia 3). Tope 2, como el email
// (send-reminders/route.ts:118). Reusa reminderCount: no hay contador paralelo.
const REMINDER_OFFSET_DAYS = 3;
const MAX_WHATSAPP_REMINDERS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function processWhatsAppReminders(): Promise<{
  totalCandidates: number;
  enqueued: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let totalCandidates = 0;
  let enqueued = 0;
  const now = new Date();

  try {
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'active', sendReminders: true },
      select: {
        id: true,
        accountId: true,
        endDate: true,
        account: { select: { companyName: true } },
      },
    });

    for (const campaign of campaigns) {
      // Candidatos: sin responder, bajo el tope de recordatorios. El filtro de canal
      // (whatsapp + opt-in real) se aplica abajo con determineChannel.
      const candidates = await prisma.participant.findMany({
        where: {
          campaignId: campaign.id,
          hasResponded: false,
          reminderCount: { lt: MAX_WHATSAPP_REMINDERS },
        },
        select: {
          id: true,
          name: true,
          email: true,
          uniqueToken: true,
          phoneNumber: true,
          nationalId: true,
          employeeId: true,
          evaluationAssignmentId: true,
          reminderCount: true,
          lastReminderSent: true,
        },
      });

      if (candidates.length === 0) continue;

      // Reuso Gate B/E.1: resolucion de telefono + consent derivado, ambos EN BATCH.
      const forPhone: ParticipantForPhone[] = candidates.map((c) => ({
        id: c.id,
        phoneNumber: c.phoneNumber,
        nationalId: c.nationalId,
        employeeId: c.employeeId,
        evaluationAssignmentId: c.evaluationAssignmentId,
      }));
      const ctx = await buildPhoneResolutionBatch(forPhone, campaign.accountId, prisma);
      const consentEmployeeIds = [
        ...ctx.employeeById.values(),
        ...ctx.employeeByNationalId.values(),
      ].map((contact) => contact.id);
      const consentByEmployeeId = await deriveConsentBatch(
        consentEmployeeIds,
        campaign.accountId,
        prisma
      );

      // Ancla de cadencia para el PRIMER recordatorio (reminderCount===0): la fecha de
      // envio de la INVITACION WhatsApp (CommunicationMessage), en batch. Para los
      // siguientes, el ancla es lastReminderSent (campo reusado, no paralelo).
      const needInvitationAnchor = candidates
        .filter((c) => c.reminderCount === 0)
        .map((c) => c.id);
      const invitationSentAt = new Map<string, Date>();
      if (needInvitationAnchor.length > 0) {
        const invMsgs = await prisma.communicationMessage.findMany({
          where: {
            campaignId: campaign.id,
            participantId: { in: needInvitationAnchor },
            channel: 'WHATSAPP',
            messageType: 'invitation',
            sentAt: { not: null },
          },
          select: { participantId: true, sentAt: true },
        });
        for (const m of invMsgs) {
          if (!m.participantId || !m.sentAt) continue;
          const prev = invitationSentAt.get(m.participantId);
          if (!prev || m.sentAt > prev) invitationSentAt.set(m.participantId, m.sentAt);
        }
      }

      const companyName = campaign.account?.companyName || '';
      const messages: any[] = [];
      const toBump: string[] = [];

      for (const c of candidates) {
        // Performance (evaluationAssignmentId) fuera de scope E.1: el consent del
        // evaluador no esta en el contexto -> fail-closed (no se recuerda por aqui).
        if (c.evaluationAssignmentId) continue;

        const phone = resolvePhone(
          {
            id: c.id,
            phoneNumber: c.phoneNumber,
            nationalId: c.nationalId,
            employeeId: c.employeeId,
            evaluationAssignmentId: c.evaluationAssignmentId,
          },
          ctx
        );
        if (!phone) continue;

        const contact = c.employeeId
          ? ctx.employeeById.get(c.employeeId)
          : ctx.employeeByNationalId.get(c.nationalId);
        const canReceivePersonalContent = contact
          ? consentByEmployeeId.get(contact.id) ?? false
          : false;

        // GATE bloque 2: solo procede si el canal del participante ES whatsapp con
        // opt-in real. El que resuelve a 'email' lo cubre el motor de email legacy:
        // asi NO se recuerda dos veces. El que resuelve a 'none' (proxy/sin consent)
        // no recibe nada por aqui (fail-closed).
        const channel = determineChannel(
          {
            email: c.email,
            phoneNumber: phone,
            preferredChannel: contact?.preferredChannel,
            canReceivePersonalContent,
          },
          { purpose: 'content' }
        );
        if (channel !== 'whatsapp') continue;

        // Cadencia: ancla = lastReminderSent (siguientes) o invitacion (el primero).
        const anchor = c.lastReminderSent ?? invitationSentAt.get(c.id) ?? null;
        if (!anchor) continue; // sin invitacion enviada todavia: nada que recordar
        if (now.getTime() - anchor.getTime() < REMINDER_OFFSET_DAYS * DAY_MS) continue;
        // No recordar pasado el cierre de la campania (el ultimo intento es la escalacion).
        if (now.getTime() > new Date(campaign.endDate).getTime()) continue;

        totalCandidates++;
        const nextCount = c.reminderCount + 1;
        const firstName = (c.name || '').trim().split(/\s+/)[0] || c.name || 'colaborador';
        const daysRemaining = Math.max(
          0,
          Math.ceil((new Date(campaign.endDate).getTime() - now.getTime()) / DAY_MS)
        );

        messages.push({
          accountId: campaign.accountId,
          channel: 'WHATSAPP' as const,
          templateSlug: WHATSAPP_REMINDER_SLUG,
          messageType: 'survey_reminder',
          toPhone: phone,
          participantId: c.id,
          campaignId: campaign.id,
          variables: {
            participant_name: firstName,
            company_name: companyName,
            days_remaining: String(daysRemaining),
            survey_token: c.uniqueToken,
          },
          // Idempotencia: un recordatorio por etapa (nextCount). Doble corrida no duplica.
          dedupKey: `survey-reminder:${c.id}:${nextCount}`,
          scheduledAt: now,
        });
        toBump.push(c.id);
      }

      if (messages.length > 0) {
        const result = await prisma.communicationMessage.createMany({
          data: messages,
          skipDuplicates: true, // dedupKey unique: doble corrida no duplica
        });
        enqueued += result.count;

        // Reusa reminderCount / lastReminderSent: el MISMO campo que la escalacion lee
        // para recoger al phone-only. Solo se incrementa lo efectivamente encolado.
        // (skipDuplicates puede descartar < toBump; el guard de dedupKey ya evita el
        // doble envio, y el incremento de mas solo adelanta el tope, nunca reenvia.)
        if (result.count > 0) {
          await prisma.participant.updateMany({
            where: { id: { in: toBump } },
            data: { reminderCount: { increment: 1 }, lastReminderSent: now },
          });
        }
        console.log(`[WhatsAppReminders] Campaña ${campaign.id}: ${result.count} recordatorios encolados`);
      }
    }

    if (enqueued > 0) {
      try {
        const dispatch = await runDispatcherBatch();
        console.log(`[WhatsAppReminders] Dispatcher: ${dispatch.sent} enviados, ${dispatch.failed} fallidos, ${dispatch.remaining} pendientes`);
      } catch (dispatchErr) {
        errors.push(`Dispatcher tras recordatorios: ${dispatchErr instanceof Error ? dispatchErr.message : 'error'}`);
      }
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Error desconocido en recordatorios WhatsApp');
  }

  return { totalCandidates, enqueued, errors };
}
