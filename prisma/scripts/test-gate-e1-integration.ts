// ════════════════════════════════════════════════════════════════════════════
// TEST INTEGRACION GATE E.1 — E1-2 (gate fail-closed 3 puntos) + E1-5 (end-to-end)
// prisma/scripts/test-gate-e1-integration.ts
// ════════════════════════════════════════════════════════════════════════════
// Ejecutar (modo simulacion, WhatsApp NO envia real):
//   $env:TWILIO_MODE='simulation'; npx tsx prisma/scripts/test-gate-e1-integration.ts
//
// E1-2: un participante con SOLO admin_loaded (proxy) NO recibe WhatsApp por NINGUNA
//   via — invitacion (gate determineChannel), recordatorio (ruta 3) ni escalacion.
// E1-5: un phone-only (sin email) con opt-in REAL recibe la cadena completa:
//   invitacion (gate -> whatsapp) + recordatorio (processWhatsAppReminders) +
//   escalacion (processSurveyEscalations), solo con opt-in real.
//
// Cuenta throwaway aislada. Teardown por id exacto en $transaction (finally).
// PRECONDICION fail-closed: 0 PENDING due ajenos antes de correr los servicios (que
// disparan el dispatcher); si hay, los pasos de servicio quedan BLOCKED (no se corre,
// evita Resend real). Patron de smoke-gate-d / smoke-d32.
// ════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { prisma } from '../../src/lib/prisma';
import { ConsentOrigen, ConsentTipo } from '@prisma/client';
import { appendConsentEvent, deriveConsentBatch } from '../../src/lib/services/consent-derivation';
import { determineChannel } from '../../src/lib/services/channel-selector';
import { processWhatsAppReminders } from '../../src/lib/services/whatsapp-reminders';
import { processSurveyEscalations } from '../../src/lib/services/survey-escalation';

type Status = 'PASS' | 'FAIL' | 'BLOCKED';
const results: { id: string; status: Status; detail: string }[] = [];
function record(id: string, status: Status, detail: string) {
  results.push({ id, status, detail });
  const icon = status === 'PASS' ? 'OK ' : status === 'FAIL' ? 'XX ' : '-- ';
  console.log(`[${icon}] ${id} :: ${detail}`);
}
function assert(id: string, cond: boolean, detail: string) {
  record(id, cond ? 'PASS' : 'FAIL', detail);
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000);

// Ids para teardown por id exacto.
const ids = {
  account: '' as string,
  dept: '' as string,
  campaignType: '' as string,
  campaign: '' as string,
  employees: [] as string[],
  participants: [] as string[],
};

async function hasMsg(accountId: string, dedupKey: string): Promise<boolean> {
  return (await prisma.communicationMessage.count({
    where: { accountId, dedupKey, channel: 'WHATSAPP' },
  })) > 0;
}

async function main() {
  // ── PRECONDICION: cola limpia (no mandar Resend real de mensajes ajenos) ────
  const foreignPendingDue = await prisma.communicationMessage.count({
    where: { status: 'PENDING', scheduledAt: { lte: new Date() } },
  });
  const queueClean = foreignPendingDue === 0;
  if (!queueClean) {
    console.log(`[precondicion] ${foreignPendingDue} PENDING due ajenos: los pasos de servicio iran BLOCKED.`);
  }

  // ── SETUP: cuenta + dept + campaignType + campaña activa ────────────────────
  const account = await prisma.account.create({
    data: {
      companyName: 'TEST_GATE_E1_INTEGRATION',
      adminEmail: `gate-e1-int-${Date.now()}@example.invalid`,
      adminName: 'Gate E1 Int',
      passwordHash: 'test-not-a-real-hash',
    },
  });
  ids.account = account.id;
  const accountId = account.id;

  const dept = await prisma.department.create({
    data: { accountId, displayName: 'TEST_E1_DEPT', standardCategory: 'sin_asignar' },
  });
  ids.dept = dept.id;

  const campaignType = await prisma.campaignType.create({
    data: { name: 'E1 Int Temp', slug: `e1-int-temp-${Date.now()}`, isPermanent: false },
  });
  ids.campaignType = campaignType.id;

  const campaign = await prisma.campaign.create({
    data: {
      accountId, campaignTypeId: campaignType.id, name: 'E1 INT',
      startDate: daysAgo(20), endDate: daysFromNow(10), status: 'active', sendReminders: true,
    },
  });
  ids.campaign = campaign.id;

  // ── FIXTURE A: empProxy — SOLO admin_loaded (proxy), phone-only (E1-2) ──────
  const empProxy = await prisma.employee.create({
    data: {
      accountId, nationalId: `E1INT-PROXY-${Date.now()}`, fullName: 'Proxy Frontline',
      departmentId: dept.id, hireDate: new Date(), isActive: true, status: 'ACTIVE',
      preferredChannel: 'whatsapp', phoneNumber: '+56911110201',
    },
  });
  ids.employees.push(empProxy.id);
  await appendConsentEvent({
    employeeId: empProxy.id, accountId, origen: ConsentOrigen.EMPRESA,
    tipo: ConsentTipo.AUTORIZACION, metodo: 'admin_loaded',
  });

  // ── FIXTURE B: empReal — opt-in REAL, phone-only (E1-5) ─────────────────────
  const empReal = await prisma.employee.create({
    data: {
      accountId, nationalId: `E1INT-REAL-${Date.now()}`, fullName: 'Real Frontline',
      departmentId: dept.id, hireDate: new Date(), isActive: true, status: 'ACTIVE',
      preferredChannel: 'whatsapp', phoneNumber: '+56911110202',
    },
  });
  ids.employees.push(empReal.id);
  await appendConsentEvent({
    employeeId: empReal.id, accountId, origen: ConsentOrigen.TITULAR,
    tipo: ConsentTipo.AUTORIZACION, metodo: 'whatsapp_button',
  });

  // Participantes (phone-only, sin email). partProxy ya "recordado" (reminderCount=1,
  // lastReminderSent -3d) para que el UNICO motivo de no escalar sea el consent.
  const partProxy = await prisma.participant.create({
    data: {
      campaignId: campaign.id, nationalId: empProxy.nationalId, name: 'Proxy Frontline',
      uniqueToken: `e1int-proxy-${Date.now()}`, hasResponded: false, employeeId: empProxy.id,
      phoneNumber: empProxy.phoneNumber, reminderCount: 1, lastReminderSent: daysAgo(3),
    },
  });
  ids.participants.push(partProxy.id);

  const partReal = await prisma.participant.create({
    data: {
      campaignId: campaign.id, nationalId: empReal.nationalId, name: 'Real Frontline',
      uniqueToken: `e1int-real-${Date.now()}`, hasResponded: false, employeeId: empReal.id,
      phoneNumber: empReal.phoneNumber, reminderCount: 0,
    },
  });
  ids.participants.push(partReal.id);

  // Ancla de cadencia para partReal: invitacion WhatsApp enviada hace 4 dias (>= offset 3).
  await prisma.communicationMessage.create({
    data: {
      accountId, channel: 'WHATSAPP', templateSlug: 'campaign-invitation-whatsapp',
      messageType: 'invitation', toPhone: empReal.phoneNumber, participantId: partReal.id,
      campaignId: campaign.id, status: 'SENT', sentAt: daysAgo(4),
      dedupKey: `invitation:${partReal.id}`,
    },
  });

  // ── E1-2 punto 1 + E1-5 punto 4: gate de invitacion (determineChannel) ──────
  const consent = await deriveConsentBatch([empProxy.id, empReal.id], accountId, prisma);

  const proxyChannel = determineChannel(
    { phoneNumber: empProxy.phoneNumber, preferredChannel: 'whatsapp', canReceivePersonalContent: consent.get(empProxy.id) ?? false },
    { purpose: 'content' }
  );
  assert('E1-2.invitacion', proxyChannel !== 'whatsapp',
    `proxy (admin_loaded) -> determineChannel='${proxyChannel}' (NO whatsapp)`);

  const realChannel = determineChannel(
    { phoneNumber: empReal.phoneNumber, preferredChannel: 'whatsapp', canReceivePersonalContent: consent.get(empReal.id) ?? false },
    { purpose: 'content' }
  );
  assert('E1-5.invitacion', realChannel === 'whatsapp',
    `real (whatsapp_button) -> determineChannel='${realChannel}' (whatsapp)`);

  // ── E1-5 recordatorio + E1-2 control (ruta 3) ───────────────────────────────
  if (!queueClean) {
    record('E1-5.recordatorio', 'BLOCKED', 'cola sucia: no se corre processWhatsAppReminders');
    record('E1-2.recordatorio', 'BLOCKED', 'cola sucia');
    record('E1-5.escalacion', 'BLOCKED', 'cola sucia: no se corre processSurveyEscalations');
    record('E1-2.escalacion', 'BLOCKED', 'cola sucia');
    return;
  }

  await processWhatsAppReminders();

  const realReminderEnq = await hasMsg(accountId, `survey-reminder:${partReal.id}:1`);
  const proxyReminderEnq = await hasMsg(accountId, `survey-reminder:${partProxy.id}:1`);
  const partRealAfter = await prisma.participant.findUnique({
    where: { id: partReal.id }, select: { reminderCount: true, lastReminderSent: true },
  });
  assert('E1-5.recordatorio', realReminderEnq && partRealAfter?.reminderCount === 1 && partRealAfter?.lastReminderSent != null,
    `recordatorio WhatsApp encolado=${realReminderEnq} reminderCount=${partRealAfter?.reminderCount} lastReminderSent=${partRealAfter?.lastReminderSent != null}`);
  assert('E1-2.recordatorio', !proxyReminderEnq,
    `proxy NO recibe recordatorio WhatsApp (encolado=${proxyReminderEnq})`);

  // Simular paso del tiempo: el recordatorio de partReal quedo lastReminderSent=now;
  // se envejece a -3d para que la escalacion (offset default 2) lo tome elegible.
  await prisma.participant.update({
    where: { id: partReal.id }, data: { lastReminderSent: daysAgo(3) },
  });

  // ── E1-5 escalacion + E1-2 control ──────────────────────────────────────────
  await processSurveyEscalations();

  const realEscEnq = await hasMsg(accountId, `survey-escalation:${partReal.id}`);
  const proxyEscEnq = await hasMsg(accountId, `survey-escalation:${partProxy.id}`);
  assert('E1-5.escalacion', realEscEnq,
    `escalacion WhatsApp encolada para el phone-only real (encolado=${realEscEnq})`);
  assert('E1-2.escalacion', !proxyEscEnq,
    `proxy NO recibe escalacion WhatsApp (encolado=${proxyEscEnq})`);
}

async function teardown() {
  await prisma.$transaction(async (tx) => {
    await tx.communicationMessage.deleteMany({ where: { accountId: ids.account } });
    await tx.consentEvent.deleteMany({ where: { accountId: ids.account } });
    if (ids.participants.length) await tx.participant.deleteMany({ where: { id: { in: ids.participants } } });
    if (ids.campaign) await tx.campaign.deleteMany({ where: { id: ids.campaign } });
    if (ids.employees.length) await tx.employee.deleteMany({ where: { id: { in: ids.employees } } });
    if (ids.dept) await tx.department.deleteMany({ where: { id: ids.dept } });
    if (ids.campaignType) await tx.campaignType.deleteMany({ where: { id: ids.campaignType } });
    if (ids.account) await tx.account.deleteMany({ where: { id: ids.account } });
  });
  console.log('[teardown] fixtures eliminados por id exacto');
}

main()
  .then(async () => {
    await teardown();
    const fail = results.filter((r) => r.status === 'FAIL').length;
    const blocked = results.filter((r) => r.status === 'BLOCKED').length;
    const pass = results.filter((r) => r.status === 'PASS').length;
    console.log(`\nE1-INT: ${pass} PASS / ${fail} FAIL / ${blocked} BLOCKED`);
    await prisma.$disconnect();
    process.exit(fail === 0 ? 0 : 1);
  })
  .catch(async (err) => {
    console.error('[ERROR]', err);
    try { await teardown(); } catch (e) { console.error('[teardown error]', e); }
    await prisma.$disconnect();
    process.exit(1);
  });
