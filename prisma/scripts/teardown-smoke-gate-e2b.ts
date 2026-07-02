// ════════════════════════════════════════════════════════════════════════════
// TEARDOWN SMOKE GATE E.2b
// prisma/scripts/teardown-smoke-gate-e2b.ts
// ════════════════════════════════════════════════════════════════════════════
// Limpia los fixtures del smoke de Gate E.2b. Reusado por smoke-gate-e2b.ts
// (teardown automatico en finally) y ejecutable a mano como fallback:
//
//   npx tsx prisma/scripts/teardown-smoke-gate-e2b.ts
//
// REGLAS DE SEGURIDAD (lecciones C6 + condiciones Victor, incidente Gate C):
// - Borra por el ID EXACTO de la cuenta (+ ids de sus campanas para hijos que
//   cuelgan de campaign), en una $transaction, en orden de dependencia FK.
//   NUNCA deleteMany por phoneNumber/email/nationalId/companyName suelto.
// - GUARD: solo procede si la cuenta tiene companyName === 'SMOKE_GATE_E2B_TEMP'.
// - CampaignType es GLOBAL (sin accountId): los onboarding-day-1/7/30/90 son seed
//   del producto -> NUNCA se borran. Solo el throwaway 'smoke-e2b-temp' (creado por
//   el smoke) se borra por su slug.
//
// Orden FK (confirmado en schema.prisma):
//   - JourneyOrchestration.stageNParticipant -> onDelete SetNull (:930-933): borrar
//     participants no rompe el journey; aun asi borramos journey antes de department.
//   - JourneyOrchestration.department / Participant.department -> Restrict (:929,:1373):
//     department se borra DESPUES de journey y participants.
//   - Casi todo cuelga de Account con Cascade, pero borramos explicito (no confiamos
//     en cascade con aristas Restrict) y para reportar counts (patron Gate D).
// ════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const SMOKE_COMPANY_NAME = 'SMOKE_GATE_E2B_TEMP';
export const SMOKE_CAMPAIGN_TYPE_SLUG = 'smoke-e2b-temp';

/**
 * Borra los fixtures de UNA cuenta de smoke (por su id exacto) en $transaction.
 * @param accountId id exacto de la cuenta throwaway
 */
export async function teardownSmokeGateE2b(
  accountId: string
): Promise<{ ok: boolean; deleted: Record<string, number>; reason?: string }> {
  const deleted: Record<string, number> = {};

  // GUARD: nunca tocar una cuenta que no sea la throwaway del smoke.
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { id: true, companyName: true },
  });
  if (!account) {
    return { ok: false, deleted, reason: `Cuenta ${accountId} no existe (nada que limpiar)` };
  }
  if (account.companyName !== SMOKE_COMPANY_NAME) {
    return {
      ok: false,
      deleted,
      reason: `GUARD: cuenta ${accountId} es "${account.companyName}", no "${SMOKE_COMPANY_NAME}". Abortado.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    // ids de campanas de la cuenta (para hijos que cuelgan de campaign).
    const campaigns = await tx.campaign.findMany({ where: { accountId }, select: { id: true } });
    const campIds = campaigns.map((c) => c.id);

    // Orden FK (hijos primero), todo por id exacto de la cuenta / sus campanas.
    deleted.communicationMessage = (await tx.communicationMessage.deleteMany({ where: { accountId } })).count;
    if (campIds.length > 0) {
      deleted.emailAutomation = (await tx.emailAutomation.deleteMany({ where: { campaignId: { in: campIds } } })).count;
    }
    deleted.journeyAlert = (await tx.journeyAlert.deleteMany({ where: { accountId } })).count; // antes que journey
    deleted.journeyOrchestration = (await tx.journeyOrchestration.deleteMany({ where: { accountId } })).count; // antes que department (Restrict)
    if (campIds.length > 0) {
      deleted.participant = (await tx.participant.deleteMany({ where: { campaignId: { in: campIds } } })).count; // antes que department (Restrict) / employee
    }
    deleted.consentEvent = (await tx.consentEvent.deleteMany({ where: { accountId } })).count; // antes que employee
    deleted.campaign = (await tx.campaign.deleteMany({ where: { accountId } })).count; // antes que campaignType
    deleted.employeeImport = (await tx.employeeImport.deleteMany({ where: { accountId } })).count;
    deleted.employeeHistory = (await tx.employeeHistory.deleteMany({ where: { accountId } })).count; // antes que employee
    deleted.employee = (await tx.employee.deleteMany({ where: { accountId } })).count; // tras participant/consent/history
    deleted.department = (await tx.department.deleteMany({ where: { accountId } })).count; // tras journey/participant/employee

    // CampaignType GLOBAL: solo el throwaway creado por el smoke (nunca los de onboarding).
    const throwaway = await tx.campaignType.findUnique({
      where: { slug: SMOKE_CAMPAIGN_TYPE_SLUG },
      select: { id: true },
    });
    if (throwaway) {
      await tx.campaignType.delete({ where: { id: throwaway.id } });
      deleted[`campaignType(${SMOKE_CAMPAIGN_TYPE_SLUG})`] = 1;
    }

    // Cuenta al final, por su id exacto.
    await tx.account.delete({ where: { id: accountId } });
    deleted.account = 1;
  }, { timeout: 60000 });

  return { ok: true, deleted };
}

// Fallback manual: busca la(s) cuenta(s) por companyName (solo para OBTENER el id) y
// limpia cada una por id.
async function main() {
  const accounts = await prisma.account.findMany({
    where: { companyName: SMOKE_COMPANY_NAME },
    select: { id: true },
  });
  if (accounts.length === 0) {
    console.log(`[Teardown E2b] No hay cuentas "${SMOKE_COMPANY_NAME}". Nada que limpiar.`);
    return;
  }
  for (const acc of accounts) {
    const res = await teardownSmokeGateE2b(acc.id);
    console.log(`[Teardown E2b] Cuenta ${acc.id}:`, res.ok ? 'OK' : `ABORT (${res.reason})`);
    console.log('[Teardown E2b] Borrados:', JSON.stringify(res.deleted));
  }
}

const invokedDirectly = process.argv[1]?.includes('teardown-smoke-gate-e2b');
if (invokedDirectly) {
  main()
    .catch((e) => { console.error('[Teardown E2b] Error fatal:', e); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
