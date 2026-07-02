// ════════════════════════════════════════════════════════════════════════════
// ONBOARDING TOUCH DISPATCH - Bifurcación de canal de UN toque del journey (Gate E.2b)
// src/lib/services/onboarding-touch-dispatch.ts
// ════════════════════════════════════════════════════════════════════════════
// Réplica del patrón de canal de Exit (E.2a) para Onboarding, EN EL DESPACHO (cron).
// Resuelve el canal de UN toque del journey con consent FRESCO del log ConsentEvent
// (nunca congelado al inscribir: evita el borde 21.719 de envío tras revocación).
//
// Igual molde que survey-escalation.ts / whatsapp-reminders.ts: función aislada e
// importable (el cron la invoca en su loop; el smoke la invoca directo sobre un
// fixture). NO hace el query global de la cola (eso vive en processAutomationQueue) ni
// dispara Resend: solo decide + encola WhatsApp + consume el job. El envío de email
// (rama 'email') lo hace el caller, camino legacy intacto.
//
// Bifurcación mutuamente excluyente (determineChannel, gate de consent de E.1):
//   - 'whatsapp' -> CommunicationMessage messageType DEDICADO 'onboarding_touch' (no
//     'invitation': los motores de recordatorio/escalación no lo ven -> no-chase por
//     construcción) + consume el job (enabled:false).
//   - 'none'     -> fail-closed (sin opt-in real / STOP): consume el job, no despacha.
//   - 'email'    -> devuelve 'email' para que el caller siga el envío de SIEMPRE (el
//                   job lo consume el caller al enviar). NO se consume aquí.
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { determineChannel } from '@/lib/services/channel-selector';
import { puedeRecibirContenidoPersonal } from '@/lib/services/consent-derivation';

export type OnboardingTouchParticipant = {
  id: string;
  email: string | null;
  name: string | null;
  uniqueToken: string | null;
  employeeId: string | null;
  phoneNumber: string | null;
};

export type OnboardingTouchResult =
  | { channel: 'whatsapp'; enqueued: boolean }
  | { channel: 'none' }
  | { channel: 'email' };

/**
 * Resuelve el canal de UN toque de onboarding y ejecuta la rama correspondiente.
 * El caller (processAutomationQueue) decide, según el resultado, si sigue con el
 * envío de email (channel 'email') o pasa al siguiente job ('whatsapp' / 'none').
 */
export async function dispatchOnboardingTouch(params: {
  jobId: string;
  waSlug: string;
  participant: OnboardingTouchParticipant;
  campaign: { id: string; accountId: string; companyName: string };
  now: Date;
}): Promise<OnboardingTouchResult> {
  const { jobId, waSlug, participant, campaign, now } = params;

  // Consent C1 derivado del log (fuente única, fail-closed). Sin employeeId no se puede
  // derivar -> fail-closed (no WhatsApp), SIN fallback por nationalId (coherente con E.2a).
  let canReceivePersonalContent = false;
  if (participant.employeeId) {
    canReceivePersonalContent = await puedeRecibirContenidoPersonal(
      participant.employeeId,
      campaign.accountId
    );
  }

  const channel = determineChannel(
    {
      email: participant.email,
      phoneNumber: participant.phoneNumber,
      canReceivePersonalContent,
    },
    { purpose: 'content' }
  );

  // ── Rama WhatsApp: a la cola unificada con messageType DEDICADO ────────────────
  if (channel === 'whatsapp' && participant.phoneNumber) {
    let enqueued = false;
    try {
      const surveyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/encuesta/${participant.uniqueToken}`;
      const firstName =
        (participant.name || '').trim().split(/\s+/)[0] || participant.name || 'colaborador';
      await prisma.communicationMessage.create({
        data: {
          accountId: campaign.accountId,
          channel: 'WHATSAPP',
          templateSlug: waSlug,
          messageType: 'onboarding_touch', // DEDICADO: no-chase por construcción
          toPhone: participant.phoneNumber,
          participantId: participant.id,
          campaignId: campaign.id,
          variables: {
            participant_name: firstName,
            company_name: campaign.companyName,
            survey_url: surveyUrl,
          },
          // Idempotente POR TOQUE. Hoy participant.id YA es único por toque (Onboarding
          // crea 4 Participant distintos, uno por etapa: OnboardingEnrollmentService
          // :253 + scheduleOnboardingEmails :679-683), así que participant.id solo
          // bastaría. Incluimos waSlug (la etapa: onboarding-day{1,7,30,90}-whatsapp) como
          // defensa explícita: si algún día un mismo participant recibiera varios toques,
          // los 4 igual entran y cada toque sigue siendo idempotente (dedupKey @unique).
          dedupKey: `onboarding_touch:${participant.id}:${waSlug}`,
          scheduledAt: now,
        },
      });
      enqueued = true;
    } catch (waErr) {
      // dedupKey @unique: una segunda corrida choca aquí (idempotencia) y se ignora.
      // Cualquier otro error se loggea; el job se consume igual (no reintentar por email
      // un toque que ya resolvió WhatsApp).
      console.error(
        `[OnboardingTouch] enqueue error job ${jobId}:`,
        waErr instanceof Error ? waErr.message : waErr
      );
    }
    await prisma.emailAutomation.update({
      where: { id: jobId },
      data: { enabled: false, processedAt: now },
    });
    return { channel: 'whatsapp', enqueued };
  }

  // ── Rama fail-closed: 'none' (sin opt-in real / STOP) o email sin dirección ───
  if (channel !== 'email' || !participant.email) {
    await prisma.emailAutomation.update({
      where: { id: jobId },
      data: { enabled: false, processedAt: now },
    });
    return { channel: 'none' };
  }

  // ── Rama email: el caller sigue el envío de SIEMPRE (no se consume aquí) ───────
  return { channel: 'email' };
}
