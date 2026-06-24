// src/lib/services/EmployeeBasedParticipantGenerator.ts
// Generación de Participants desde el master Employee para productos employee-based.
//
// Generaliza el patrón estrenado por Ambiente Sano (ComplianceParticipantGenerator):
// abandona el CSV-por-campaña y lee directamente de Employee ACTIVE. Parametrizado por
// un allow-list de slugs en vez de un único slug hardcodeado, para servir a Ambiente
// Sano, Pulso Express y Experiencia Full con un solo servicio.
//
// Copia al Participant la demografía (gender/dateOfBirth/location) — implementada en
// Employee por la Fase 0 — para no dejar ciego a PatternDetector en la Torre de Control,
// y el phoneNumber para habilitar WhatsApp (Gate B/C/D).

import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

/**
 * Slugs de productos employee-based "directos" (1 Participant por empleado, sin
 * selector 360°). Performance NO entra aquí: vincula vía evaluationAssignmentId.
 */
export const EMPLOYEE_BASED_GENERATOR_SLUGS = new Set<string>([
  'pulso-ambientes-sanos',
  'pulso-express',
  'experiencia-full',
]);

function generateUniqueToken(): string {
  return randomBytes(32).toString('hex');
}

export interface GenerateParticipantsResult {
  created: number;
  skipped: number;
  errors: string[];
}

export async function generateEmployeeBasedParticipants(
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

  if (!EMPLOYEE_BASED_GENERATOR_SLUGS.has(campaign.campaignType.slug)) {
    throw new Error(
      `EmployeeBasedParticipantGenerator no aplica a campañas "${campaign.campaignType.slug}"`
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
      // Contacto (Gate B) + demografía (PatternDetector)
      phoneNumber: true,
      gender: true,
      dateOfBirth: true,
      location: true,
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
          // Contacto (Gate B) + demografía (PatternDetector)
          phoneNumber: employee.phoneNumber ?? null,
          gender: employee.gender ?? null,
          dateOfBirth: employee.dateOfBirth ?? null,
          location: employee.location ?? null,
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

  // Sincronizar Campaign.totalInvited con el count real de la DB (idempotente bajo
  // re-ejecución y race: dos llamadas concurrentes convergen al mismo valor).
  const totalInvited = await prisma.participant.count({ where: { campaignId } });
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { totalInvited },
  });

  return { created, skipped, errors };
}
