// ════════════════════════════════════════════════════════════════════════════
// SURVEY ESCALATION - Escalación WhatsApp (Gate D D3)
// src/lib/services/survey-escalation.ts
// ════════════════════════════════════════════════════════════════════════════
// Construido ESPECÍFICO: cuelga del último reminder (Participant.lastReminderSent)
// existente, NO toca processReminders ni lo migra a la cola. Lee estado, encola
// CommunicationMessage WHATSAPP con dedupKey, y dispara el dispatcher. Reusa
// resolvePhone (invariante Performance intacta) y la cola/dispatcher de Gate A/B/C.
//
// Vive como servicio (no dentro del route del cron) porque un route.ts de Next solo
// puede exportar handlers; ademas asi es testeable de forma aislada. El cron lo invoca.
//
// Dispara SOLO a quien: no completó (hasResponded=false), tuvo al menos un reminder
// (reminderCount>=1, lastReminderSent != null), eligió WhatsApp (preferredChannel===
// 'whatsapp') y su consent C1 lo habilita por OPT-IN REAL. Gate E.1: ese consent se
// DERIVA del log ConsentEvent (consent-derivation.ts), NO se lee de un campo: un
// admin_loaded (proxy) ya NO basta. Tope: lastReminder+offset <= endDate.
// Idempotencia por dedupKey unique (doble corrida no duplica).
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { buildPhoneResolutionBatch, resolvePhone, type ParticipantForPhone } from '@/lib/services/resolvePhone';
import { deriveConsentBatch } from '@/lib/services/consent-derivation';
import { EscalationConfigService } from '@/lib/services/EscalationConfigService';
import { WHATSAPP_ESCALATION_SLUG } from '@/lib/templates/whatsapp-templates';
import { runDispatcherBatch } from '@/lib/services/message-dispatcher';

export async function processSurveyEscalations(): Promise<{
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
        account: { select: { companyName: true } }
      }
    });

    for (const campaign of campaigns) {
      const { days } = await EscalationConfigService.getEscalationDelayForCampaign(campaign.id);
      const offsetMs = days * 24 * 60 * 60 * 1000;

      // Elegible si lastReminderSent + offset <= now Y <= endDate (cadencia hacia adelante).
      const cutoffByNow = now.getTime() - offsetMs;
      const cutoffByEnd = new Date(campaign.endDate).getTime() - offsetMs;
      const cutoff = new Date(Math.min(cutoffByNow, cutoffByEnd));

      const candidates = await prisma.participant.findMany({
        where: {
          campaignId: campaign.id,
          hasResponded: false,
          reminderCount: { gte: 1 },
          lastReminderSent: { not: null, lte: cutoff }
        },
        select: {
          id: true,
          name: true,
          uniqueToken: true,
          phoneNumber: true,
          nationalId: true,
          employeeId: true,
          evaluationAssignmentId: true
        }
      });

      if (candidates.length === 0) continue;
      totalCandidates += candidates.length;

      // Reuso Gate B: contexto de resolución de teléfono + consent (mismo fetch).
      const forPhone: ParticipantForPhone[] = candidates.map((c) => ({
        id: c.id,
        phoneNumber: c.phoneNumber,
        nationalId: c.nationalId,
        employeeId: c.employeeId,
        evaluationAssignmentId: c.evaluationAssignmentId
      }));
      const ctx = await buildPhoneResolutionBatch(forPhone, campaign.accountId, prisma);

      // Gate E.1 bloque 2 (EN BATCH): consent C1 derivado del log ConsentEvent para
      // TODOS los Employees del lote, una sola query. Se indexa por employeeId; el
      // contact (de cualquiera de los dos maps) ya trae su id.
      const employeeIdsForConsent = [
        ...ctx.employeeById.values(),
        ...ctx.employeeByNationalId.values(),
      ].map((contact) => contact.id);
      const consentByEmployeeId = await deriveConsentBatch(
        employeeIdsForConsent,
        campaign.accountId,
        prisma
      );

      const companyName = campaign.account?.companyName || '';
      const messages: any[] = [];

      for (const c of candidates) {
        const phone = resolvePhone(
          {
            id: c.id,
            phoneNumber: c.phoneNumber,
            nationalId: c.nationalId,
            employeeId: c.employeeId,
            evaluationAssignmentId: c.evaluationAssignmentId
          },
          ctx
        );
        if (!phone) continue;

        // Consent: del MISMO Employee que resuelve el teléfono.
        // Performance (evaluationAssignmentId): el consent del evaluador NO está en el
        // contexto -> fail-closed (no se escala). Diferido a Gate E (nota tipo B5).
        if (c.evaluationAssignmentId) continue;

        const contact = c.employeeId
          ? ctx.employeeById.get(c.employeeId)
          : ctx.employeeByNationalId.get(c.nationalId);

        // C2 (eligió WhatsApp) + C1 (opt-in real derivado del log). Las dos puertas.
        const consentsWhatsApp =
          !!contact &&
          contact.preferredChannel === 'whatsapp' &&
          (consentByEmployeeId.get(contact.id) ?? false);
        if (!consentsWhatsApp) continue;

        const firstName = (c.name || '').trim().split(/\s+/)[0] || c.name || 'colaborador';

        messages.push({
          accountId: campaign.accountId,
          channel: 'WHATSAPP' as const,
          templateSlug: WHATSAPP_ESCALATION_SLUG,
          messageType: 'survey_escalation',
          toPhone: phone,
          participantId: c.id,
          campaignId: campaign.id,
          variables: {
            participant_name: firstName,
            company_name: companyName,
            survey_token: c.uniqueToken
          },
          // Idempotencia: una sola escalación por participante (unique).
          dedupKey: `survey-escalation:${c.id}`,
          scheduledAt: now
        });
      }

      if (messages.length > 0) {
        const result = await prisma.communicationMessage.createMany({
          data: messages,
          skipDuplicates: true // dedupKey unique: doble corrida no duplica
        });
        enqueued += result.count;
        console.log(`[Escalation] Campaña ${campaign.id}: ${result.count} escalaciones encoladas (offset ${days}d)`);
      }
    }

    // Disparo del dispatcher tras encolar (patrón Capa 1): drena la cola en esta corrida.
    if (enqueued > 0) {
      try {
        const dispatch = await runDispatcherBatch();
        console.log(`[Escalation] Dispatcher: ${dispatch.sent} enviados, ${dispatch.failed} fallidos, ${dispatch.remaining} pendientes`);
      } catch (dispatchErr) {
        errors.push(`Dispatcher tras escalación: ${dispatchErr instanceof Error ? dispatchErr.message : 'error'}`);
      }
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Error desconocido en escalaciones');
  }

  return { totalCandidates, enqueued, errors };
}
