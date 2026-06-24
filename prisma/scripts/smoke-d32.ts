// ════════════════════════════════════════════════════════════════════════════
// SMOKE GATE D · D3-2 — ENVIO REAL WhatsApp por sandbox (segunda tanda)
// prisma/scripts/smoke-d32.ts
// ════════════════════════════════════════════════════════════════════════════
// Fases (para coordinar la confirmacion fisica en el +56993257303):
//   npx tsx prisma/scripts/smoke-d32.ts setup   -> crea fixtures + precondicion fail-closed
//   npx tsx prisma/scripts/smoke-d32.ts fire     -> dispara processSurveyEscalations (envio real)
//   npx tsx prisma/scripts/smoke-d32.ts status   -> poll del mensaje (status/providerId/deliveredAt)
// Teardown: npx tsx prisma/scripts/teardown-smoke-gate-d.ts (por companyName -> id, $transaction)
//
// Carga .env (TWILIO_MODE=sandbox + creds + TWILIO_WEBHOOK_URL). El envio es REAL al
// numero unido al sandbox. PRECONDICION fail-closed antes de disparar:
//   - count(CommunicationMessage PENDING due) == 0 (rama EMAIL del dispatcher = Resend real)
//   - 0 candidatos de escalacion AJENOS (otra cuenta, whatsapp-consent) para no mutar data real
// ════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { prisma } from '../../src/lib/prisma';
import { processSurveyEscalations } from '../../src/lib/services/survey-escalation';
import { normalizeRut } from '../../src/lib/services/EmployeeSyncService';
import { SMOKE_COMPANY_NAME, SMOKE_ESCALATION_TYPE_SLUG } from './teardown-smoke-gate-d';

const VICTOR_PHONE = '+56993257303';
const RUT = '20000099-7'; // body 20000099, dv calculado abajo no importa: lo normalizamos
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000);

async function getAccount() {
  return prisma.account.findFirst({ where: { companyName: SMOKE_COMPANY_NAME }, select: { id: true } });
}

// ── Precondicion fail-closed (excluye accountId si se pasa) ───────────────────
async function preconditionOk(excludeAccountId?: string): Promise<{ ok: boolean; reason?: string }> {
  const pendingDue = await prisma.communicationMessage.count({
    where: { status: 'PENDING', scheduledAt: { lte: new Date() } }
  });
  if (pendingDue > 0) {
    return { ok: false, reason: `${pendingDue} CommunicationMessage PENDING due (la rama EMAIL del dispatcher manda Resend real). FRENA.` };
  }
  const foreignCandidates = await prisma.participant.count({
    where: {
      hasResponded: false,
      reminderCount: { gte: 1 },
      lastReminderSent: { not: null },
      campaign: { status: 'active', sendReminders: true, ...(excludeAccountId ? { accountId: { not: excludeAccountId } } : {}) },
      employee: { preferredChannel: 'whatsapp', channelConsentAt: { not: null } }
    }
  });
  if (foreignCandidates > 0) {
    return { ok: false, reason: `${foreignCandidates} candidato(s) de escalacion AJENOS (whatsapp-consent en otra campana activa). FRENA para no mutar data real.` };
  }
  return { ok: true };
}

async function setup() {
  // Precondicion ANTES de crear nada (aun no existe mi cuenta).
  const pre = await preconditionOk();
  if (!pre.ok) {
    console.log(`[D3-2 setup] PRECONDICION FALLIDA: ${pre.reason}`);
    console.log('[D3-2 setup] No se crearon fixtures. Vaciar la cola / revisar y reintentar.');
    return;
  }

  const account = await prisma.account.create({
    data: {
      companyName: SMOKE_COMPANY_NAME,
      adminEmail: `smoke-d32-${Date.now()}@example.invalid`,
      adminName: 'Smoke D32',
      passwordHash: 'smoke-not-a-real-hash'
    }
  });
  const dept = await prisma.department.create({ data: { accountId: account.id, displayName: 'Smoke D32 Dept' } });
  const escType = await prisma.campaignType.create({
    data: { name: 'Smoke Escalation Temp', slug: SMOKE_ESCALATION_TYPE_SLUG, isPermanent: false }
  });
  const emp = await prisma.employee.create({
    data: {
      accountId: account.id, nationalId: normalizeRut(RUT), fullName: 'Victor Smoke',
      departmentId: dept.id, status: 'ACTIVE', isActive: true, hireDate: new Date('2024-01-15'),
      email: 'victor-smoke@example.invalid', phoneNumber: VICTOR_PHONE,
      preferredChannel: 'whatsapp', channelConsentAt: new Date(), channelConsentMethod: 'whatsapp_button'
    }
  });
  const camp = await prisma.campaign.create({
    data: {
      accountId: account.id, campaignTypeId: escType.id, name: 'D32 ESC', startDate: daysAgo(20),
      endDate: daysFromNow(10), status: 'active', sendReminders: true
    }
  });
  const part = await prisma.participant.create({
    data: {
      campaignId: camp.id, nationalId: normalizeRut(RUT), name: 'Victor Smoke',
      uniqueToken: `smoke-d32-${Date.now()}`, hasResponded: false, reminderCount: 1,
      lastReminderSent: daysAgo(3), employeeId: emp.id, phoneNumber: VICTOR_PHONE
    }
  });

  console.log('[D3-2 setup] OK fixtures creados:');
  console.log(`  account=${account.id}  participant=${part.id}  phone=${VICTOR_PHONE}`);
  console.log(`  campaign=${camp.id} (endDate +10d)  lastReminderSent=-3d  offset=default 2  -> ELEGIBLE`);
  console.log('[D3-2 setup] Precondicion OK (cola limpia, sin candidatos ajenos).');
  console.log('[D3-2 setup] Siguiente: fase fire (cuando Victor mire el telefono).');
}

async function fire() {
  if (process.env.TWILIO_MODE !== 'sandbox') {
    console.log(`[D3-2 fire] ABORT: TWILIO_MODE='${process.env.TWILIO_MODE}', se esperaba 'sandbox'. No disparo.`);
    return;
  }
  const account = await getAccount();
  if (!account) { console.log('[D3-2 fire] ABORT: no existe la cuenta de smoke. Corre setup primero.'); return; }

  // Precondicion fail-closed (excluyendo mi cuenta: mi participante SI debe escalar).
  const pre = await preconditionOk(account.id);
  if (!pre.ok) {
    console.log(`[D3-2 fire] PRECONDICION FALLIDA: ${pre.reason}`);
    console.log('[D3-2 fire] NO se dispara (fail-closed).');
    return;
  }

  console.log('[D3-2 fire] Precondicion OK. Disparando processSurveyEscalations (envio REAL sandbox)...');
  const res = await processSurveyEscalations();
  console.log('[D3-2 fire] resultado:', JSON.stringify(res));
  await status();
}

async function status() {
  const account = await getAccount();
  if (!account) { console.log('[D3-2 status] no existe la cuenta de smoke.'); return; }
  const msgs = await prisma.communicationMessage.findMany({
    where: { accountId: account.id, channel: 'WHATSAPP' },
    select: { id: true, status: true, providerId: true, toPhone: true, templateSlug: true, sentAt: true, deliveredAt: true, failedAt: true, errorMessage: true, retryCount: true, dedupKey: true }
  });
  console.log(`[D3-2 status] ${msgs.length} mensaje(s) WHATSAPP:`);
  for (const m of msgs) {
    console.log(`  ${m.dedupKey} :: status=${m.status} provider=${m.providerId || '-'} template=${m.templateSlug} to=${m.toPhone} sentAt=${m.sentAt ? 'si' : '-'} deliveredAt=${m.deliveredAt ? 'si' : '-'} failedAt=${m.failedAt ? 'si' : '-'} retry=${m.retryCount}`);
    if (m.errorMessage) console.log(`    errorMessage: ${m.errorMessage}`);
  }
}

const phase = process.argv[2];
const run = phase === 'setup' ? setup : phase === 'fire' ? fire : phase === 'status' ? status : null;
if (!run) {
  console.log('Uso: npx tsx prisma/scripts/smoke-d32.ts [setup|fire|status]');
  process.exit(1);
}
run()
  .catch((e) => { console.error('[D3-2] error:', e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
