// src/lib/services/ComplianceParticipantGenerator.ts
// Ambiente Sano (Compliance) - Generación de Participants desde Employee master data.
//
// Desde la migración employee-based genérica, este archivo es un wrapper delgado sobre
// `EmployeeBasedParticipantGenerator`: preserva el guard específico de Ambiente Sano (y su
// mensaje de error, que /api/compliance/generate-participants traduce a 400) y delega la
// generación real al servicio genérico. La lógica de copia de campos (incluida demografía
// y phoneNumber) vive ahí, compartida con Pulso Express / Experiencia Full.

import { prisma } from '@/lib/prisma';
import {
  generateEmployeeBasedParticipants,
  type GenerateParticipantsResult,
} from './EmployeeBasedParticipantGenerator';

const AMBIENTE_SANO_SLUG = 'pulso-ambientes-sanos';

export type { GenerateParticipantsResult };

export async function generateComplianceParticipants(
  campaignId: string,
  accountId: string
): Promise<GenerateParticipantsResult> {
  // Guard específico de Ambiente Sano: mantiene el contrato de error histórico que el
  // endpoint de compliance traduce a HTTP 400 (`startsWith('ComplianceParticipantGenerator
  // solo aplica')`). El generator genérico revalida contra el allow-list igualmente.
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, accountId },
    include: { campaignType: { select: { slug: true } } },
  });

  if (!campaign) {
    throw new Error('Campaña no encontrada');
  }

  if (campaign.campaignType.slug !== AMBIENTE_SANO_SLUG) {
    throw new Error(
      `ComplianceParticipantGenerator solo aplica a campañas "${AMBIENTE_SANO_SLUG}"`
    );
  }

  return generateEmployeeBasedParticipants(campaignId, accountId);
}
