// ════════════════════════════════════════════════════════════════════════════
// CHANNEL ONBOARDING - Encolado del primer contacto de consentimiento (Gate C v3.0)
// src/lib/services/channel-onboarding.ts
// ════════════════════════════════════════════════════════════════════════════
// Encola el mensaje channel-onboarding (WhatsApp) que pide al empleado su consent
// de canal. Reusado por DOS disparadores (spec 4.3):
//   - 4.3a: al cargar la nomina al maestro Employee (EmployeeSyncService).
//   - 4.3b: fallback al activar campania (activate route) para participantes
//     whatsapp con Employee sin channelConsentAt.
//
// Idempotente por dedupKey 'channel-onboarding:${employeeId}': una vez encolado (o
// con channelConsentAt ya presente) NUNCA se reenvia. NO dispara el dispatcher (el
// envio sale en la cadencia del dispatcher; decision Victor).
//
// Spec: .claude/tasks/SPEC_GATE_C_COMUNICACIONES_v3.md seccion 4.3.
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import type { PrismaClient, Prisma } from '@prisma/client';
import { WHATSAPP_ONBOARDING_SLUG } from '@/lib/templates/whatsapp-templates';

// Cliente Prisma o cliente de transaccion: el encolado funciona dentro o fuera de tx.
type PrismaLike = PrismaClient | Prisma.TransactionClient;

export type ChannelOnboardingCandidate = {
  employeeId: string;
  accountId: string;
  toPhone: string;          // telefono canonico (ya normalizado por el caller)
  participantName: string;  // primer nombre -> variable {{1}}
  companyName: string;      // -> variable {{2}}
};

/**
 * Encola channel-onboarding para los candidatos dados.
 *
 * @returns cantidad de mensajes efectivamente encolados (skipDuplicates descarta
 *          los que ya existian por dedupKey).
 */
export async function enqueueChannelOnboarding(
  candidates: ChannelOnboardingCandidate[],
  tx: PrismaLike = prisma
): Promise<number> {
  if (candidates.length === 0) return 0;

  const now = new Date();
  const data = candidates.map((c) => ({
    accountId: c.accountId,
    channel: 'WHATSAPP' as const,
    templateSlug: WHATSAPP_ONBOARDING_SLUG,
    messageType: 'channel-onboarding',
    toPhone: c.toPhone,
    employeeId: c.employeeId,
    variables: {
      participant_name: c.participantName,
      company_name: c.companyName,
    },
    // Idempotencia por empleado: garantiza que onboarding nunca se reenvie.
    dedupKey: `channel-onboarding:${c.employeeId}`,
    scheduledAt: now,
  }));

  const result = await tx.communicationMessage.createMany({
    data,
    skipDuplicates: true,
  });

  // Gate E.1 bloque 1: marcar "solicitud enviada, esperando respuesta" en el master.
  // updateMany con guard channelConsentRequestedAt=null -> no clobber + idempotente:
  // una segunda corrida no pisa el timestamp (ya está set) y el opt-in real nunca se toca.
  const employeeIds = Array.from(new Set(candidates.map((c) => c.employeeId)));
  await tx.employee.updateMany({
    where: { id: { in: employeeIds }, channelConsentRequestedAt: null },
    data: { channelConsentRequestedAt: now },
  });

  return result.count;
}
