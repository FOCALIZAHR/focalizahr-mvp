// ════════════════════════════════════════════════════════════════════════════
// TEARDOWN SMOKE GATE D
// prisma/scripts/teardown-smoke-gate-d.ts
// ════════════════════════════════════════════════════════════════════════════
// Limpia los fixtures del smoke de Gate D. Reusado por smoke-gate-d.ts (teardown
// automatico en finally) y ejecutable a mano como fallback:
//
//   npx tsx prisma/scripts/teardown-smoke-gate-d.ts
//
// REGLAS DE SEGURIDAD (lecciones C6 + condiciones Victor):
// - Borra por el ID EXACTO de la cuenta + ids de sus campanas, en una $transaction,
//   en orden de dependencia FK. NUNCA deleteMany por companyName (barreria cuentas
//   de nombre parecido).
// - GUARD: solo procede si la cuenta tiene companyName === 'SMOKE_GATE_D_TEMP'.
// - CampaignType es GLOBAL (sin accountId): NUNCA se borra por cuenta. Solo el
//   throwaway 'smoke-escalation-temp' (slug, creado por el smoke) y
//   'retencion-predictiva' SOLO si el smoke lo creo (deleteRetencionTypeId).
// ════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const SMOKE_COMPANY_NAME = 'SMOKE_GATE_D_TEMP';
export const SMOKE_ESCALATION_TYPE_SLUG = 'smoke-escalation-temp';

/**
 * Borra los fixtures de UNA cuenta de smoke (por su id exacto) en $transaction.
 * @param accountId id exacto de la cuenta throwaway
 * @param opts.deleteRetencionTypeId id del CampaignType retencion-predictiva a borrar
 *        SOLO si el smoke lo creo (null/undefined => fue reusado, no se toca).
 */
export async function teardownSmokeGateD(
  accountId: string,
  opts: { deleteRetencionTypeId?: string | null } = {}
): Promise<{ ok: boolean; deleted: Record<string, number>; reason?: string }> {
  const deleted: Record<string, number> = {};

  // GUARD: nunca tocar una cuenta que no sea la throwaway del smoke.
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { id: true, companyName: true }
  });
  if (!account) {
    return { ok: false, deleted, reason: `Cuenta ${accountId} no existe (nada que limpiar)` };
  }
  if (account.companyName !== SMOKE_COMPANY_NAME) {
    return {
      ok: false,
      deleted,
      reason: `GUARD: cuenta ${accountId} es "${account.companyName}", no "${SMOKE_COMPANY_NAME}". Abortado.`
    };
  }

  await prisma.$transaction(async (tx) => {
    // ids de campanas (para hijos que cuelgan de campaign, no de accountId)
    const campaigns = await tx.campaign.findMany({ where: { accountId }, select: { id: true } });
    const campIds = campaigns.map((c) => c.id);

    // Orden FK (hijos primero), todo por el id exacto de la cuenta / sus campanas.
    deleted.employeeHistory = (await tx.employeeHistory.deleteMany({ where: { accountId } })).count;
    deleted.communicationMessage = (await tx.communicationMessage.deleteMany({ where: { accountId } })).count;
    deleted.exitRecord = (await tx.exitRecord.deleteMany({ where: { accountId } })).count; // antes que department (Restrict)
    if (campIds.length > 0) {
      deleted.emailAutomation = (await tx.emailAutomation.deleteMany({ where: { campaignId: { in: campIds } } })).count;
      deleted.participant = (await tx.participant.deleteMany({ where: { campaignId: { in: campIds } } })).count; // antes que assignment/employee
    }
    deleted.evaluationAssignment = (await tx.evaluationAssignment.deleteMany({ where: { accountId } })).count;
    deleted.performanceCycle = (await tx.performanceCycle.deleteMany({ where: { accountId } })).count;
    deleted.campaign = (await tx.campaign.deleteMany({ where: { accountId } })).count; // antes que campaignType (Restrict)
    deleted.employeeImport = (await tx.employeeImport.deleteMany({ where: { accountId } })).count;
    deleted.employee = (await tx.employee.deleteMany({ where: { accountId } })).count; // tras history/participant/assignment/exitRecord
    deleted.department = (await tx.department.deleteMany({ where: { accountId } })).count; // tras employees

    // CampaignType GLOBAL: solo lo creado por el smoke (nunca por cuenta).
    const escType = await tx.campaignType.findUnique({ where: { slug: SMOKE_ESCALATION_TYPE_SLUG }, select: { id: true } });
    if (escType) {
      await tx.campaignType.delete({ where: { id: escType.id } });
      deleted['campaignType(smoke-escalation-temp)'] = 1;
    }
    if (opts.deleteRetencionTypeId) {
      await tx.campaignType.delete({ where: { id: opts.deleteRetencionTypeId } });
      deleted['campaignType(retencion-predictiva, creado por smoke)'] = 1;
    }

    // Cuenta al final, por su id exacto.
    await tx.account.delete({ where: { id: accountId } });
    deleted.account = 1;
  }, { timeout: 60000 });

  return { ok: true, deleted };
}

// Fallback manual: busca la(s) cuenta(s) por companyName (solo para OBTENER el id) y
// limpia cada una por id. Conservador: NUNCA borra retencion-predictiva.
async function main() {
  const accounts = await prisma.account.findMany({
    where: { companyName: SMOKE_COMPANY_NAME },
    select: { id: true }
  });
  if (accounts.length === 0) {
    console.log(`[Teardown] No hay cuentas "${SMOKE_COMPANY_NAME}". Nada que limpiar.`);
    return;
  }
  for (const acc of accounts) {
    const res = await teardownSmokeGateD(acc.id, { deleteRetencionTypeId: null });
    console.log(`[Teardown] Cuenta ${acc.id}:`, res.ok ? 'OK' : `ABORT (${res.reason})`);
    console.log('[Teardown] Borrados:', JSON.stringify(res.deleted));
  }
}

const invokedDirectly = process.argv[1]?.includes('teardown-smoke-gate-d');
if (invokedDirectly) {
  main()
    .catch((e) => { console.error('[Teardown] Error fatal:', e); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
