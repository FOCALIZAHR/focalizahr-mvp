// src/lib/services/ComplianceParticipantGenerator.ts
// Ambiente Sano (Compliance) - Generación de Participants desde Employee master data.
//
// Primer producto temporal que abandona el CSV-por-campaña y lee directamente de Employee.
// Establece el patrón para futura migración de Pulso Express, Experiencia Full y Retención.
//
// Paralelo conceptual: EvaluationService.generateUpwardEvaluations (paso 1), sin paso 2
// (no hay evaluator/evaluatee — todos participan directamente).

import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

const AMBIENTE_SANO_SLUG = 'pulso-ambientes-sanos';

function generateUniqueToken(): string {
  return randomBytes(32).toString('hex');
}

export interface GenerateParticipantsResult {
  created: number;
  skipped: number;
  errors: string[];
}

export async function generateComplianceParticipants(
  campaignId: string,
  accountId: string
): Promise<GenerateParticipantsResult> {
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

  const employees = await prisma.employee.findMany({
    where: {
      accountId,
      status: 'ACTIVE',
      isActive: true,
    },
    select: {
      id: true,
      nationalId: true,
      fullName: true,
      email: true,
      departmentId: true,
      department: { select: { displayName: true } },
      position: true,
      hireDate: true,
    },
  });

  if (employees.length === 0) {
    throw new Error('Debe cargar nómina primero');
  }

  const existing = await prisma.participant.findMany({
    where: {
      campaignId,
      employeeId: { in: employees.map((e) => e.id) },
    },
    select: { employeeId: true },
  });
  const alreadyCreated = new Set(
    existing.map((p) => p.employeeId).filter((id): id is string => id !== null)
  );

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const employee of employees) {
    if (alreadyCreated.has(employee.id)) {
      skipped++;
      continue;
    }

    if (!employee.email) {
      skipped++;
      errors.push(`${employee.fullName} (${employee.nationalId}): sin email`);
      continue;
    }

    try {
      await prisma.participant.create({
        data: {
          campaignId,
          nationalId: employee.nationalId,
          name: employee.fullName,
          email: employee.email,
          departmentId: employee.departmentId,
          department: employee.department?.displayName ?? null,
          position: employee.position,
          employeeId: employee.id,
          hireDate: employee.hireDate,
          uniqueToken: generateUniqueToken(),
          hasResponded: false,
        },
      });
      created++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${employee.fullName} (${employee.nationalId}): ${msg}`);
    }
  }

  // Sincronizar Campaign.totalInvited con el count real de la DB.
  // Sigue el pattern del flujo standard (/api/campaigns/[id]/participants línea 384-391):
  // el endpoint que carga Participants es dueño de setear el contador.
  // Usar count() absoluto (no increment) es idempotente bajo re-ejecución y race:
  // dos llamadas concurrentes convergen al mismo valor real.
  const totalInvited = await prisma.participant.count({ where: { campaignId } });
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { totalInvited },
  });

  return { created, skipped, errors };
}
