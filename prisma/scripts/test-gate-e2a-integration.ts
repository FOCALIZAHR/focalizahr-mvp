// ════════════════════════════════════════════════════════════════════════════
// TEST INTEGRACION GATE E.2a — Exit a la cola unificada (invitacion WhatsApp)
// prisma/scripts/test-gate-e2a-integration.ts
// ════════════════════════════════════════════════════════════════════════════
// Ejecutar (modo simulacion, WhatsApp NO envia real):
//   $env:TWILIO_MODE='simulation'; npx tsx prisma/scripts/test-gate-e2a-integration.ts
//
// Ejercita ExitRegistrationService.registerExit REAL (bifurcacion por canal) y los
// motores de seguimiento REALES. Cubre el criterio de DONE de la spec:
//   E2a-1/3/5/6: phone-only con opt-in REAL -> se encola CommunicationMessage con
//                messageType DEDICADO 'exit_invitation' (no 'invitation'), toPhone ok.
//   E2a-2 (NO CHASE, la critica): tras registrar, processWhatsAppReminders y
//                processSurveyEscalations NO seleccionan al participante de Exit
//                (el messageType dedicado los evita por construccion).
//   E2a-3 fail-closed: phone-only con SOLO admin_loaded (proxy) -> canal 'none',
//                NO se encola WhatsApp.
//   E2a-7 email intacto: ex-empleado CON email -> EmailAutomation (camino viejo),
//                NO se encola WhatsApp.
//
// Cuenta throwaway aislada. Teardown por id exacto en $transaction (finally).
// PRECONDICION: 0 PENDING due ajenos antes de registrar el fixture WhatsApp (que
// dispara el dispatcher inline); si hay, ese paso queda BLOCKED (evita Twilio real).
// Patron de test-gate-e1-integration.
// ════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { prisma } from '../../src/lib/prisma';
import { ConsentOrigen, ConsentTipo } from '@prisma/client';
import { appendConsentEvent } from '../../src/lib/services/consent-derivation';
import { normalizeRut } from '../../src/lib/services/EmployeeSyncService';
import { ExitRegistrationService } from '../../src/lib/services/ExitRegistrationService';
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

// Ids para teardown por id exacto.
const ids = {
  account: '' as string,
  dept: '' as string,
  employees: [] as string[],
  createdCampaignTypeId: '' as string, // solo si el test lo crea (no borrar el compartido)
};

async function hasWhatsAppMsg(accountId: string, dedupKey: string): Promise<boolean> {
  return (await prisma.communicationMessage.count({
    where: { accountId, dedupKey, channel: 'WHATSAPP' },
  })) > 0;
}

async function main() {
  // ── PRECONDICION: cola limpia (no disparar Twilio de mensajes ajenos) ───────
  const foreignPendingDue = await prisma.communicationMessage.count({
    where: { status: 'PENDING', scheduledAt: { lte: new Date() } },
  });
  const queueClean = foreignPendingDue === 0;
  if (!queueClean) {
    console.log(`[precondicion] ${foreignPendingDue} PENDING due ajenos: el paso WhatsApp ira BLOCKED.`);
  }

  // ── SETUP: cuenta + dept + CampaignType retencion-predictiva ────────────────
  const account = await prisma.account.create({
    data: {
      companyName: 'TEST_GATE_E2A_INTEGRATION',
      adminEmail: `gate-e2a-int-${Date.now()}@example.invalid`,
      adminName: 'Gate E2a Int',
      passwordHash: 'test-not-a-real-hash',
    },
  });
  ids.account = account.id;
  const accountId = account.id;

  const dept = await prisma.department.create({
    data: { accountId, displayName: 'TEST_E2A_DEPT', standardCategory: 'sin_asignar' },
  });
  ids.dept = dept.id;

  // registerExit exige CampaignType slug 'retencion-predictiva' isPermanent=true.
  // Si ya existe (seed), se reusa (NO se borra). Si no, se crea y se borra en teardown.
  let campaignType = await prisma.campaignType.findFirst({
    where: { slug: 'retencion-predictiva', isPermanent: true },
  });
  if (!campaignType) {
    campaignType = await prisma.campaignType.create({
      data: { name: 'Retencion Predictiva (test)', slug: 'retencion-predictiva', isPermanent: true },
    });
    ids.createdCampaignTypeId = campaignType.id;
  }

  const exitDate = new Date();

  // ── FIXTURE REAL: phone-only, opt-in REAL (whatsapp_button) ─────────────────
  const realRut = normalizeRut(`21000201-5`);
  const empReal = await prisma.employee.create({
    data: {
      accountId, nationalId: realRut, fullName: 'Real Egreso',
      departmentId: dept.id, hireDate: new Date(), isActive: true, status: 'ACTIVE',
      preferredChannel: 'whatsapp', phoneNumber: '+56911110301', email: null,
    },
  });
  ids.employees.push(empReal.id);
  await appendConsentEvent({
    employeeId: empReal.id, accountId, origen: ConsentOrigen.TITULAR,
    tipo: ConsentTipo.AUTORIZACION, metodo: 'whatsapp_button',
  });

  // ── FIXTURE PROXY: phone-only, SOLO admin_loaded (proxy) ────────────────────
  const proxyRut = normalizeRut(`21000202-3`);
  const empProxy = await prisma.employee.create({
    data: {
      accountId, nationalId: proxyRut, fullName: 'Proxy Egreso',
      departmentId: dept.id, hireDate: new Date(), isActive: true, status: 'ACTIVE',
      preferredChannel: 'whatsapp', phoneNumber: '+56911110302', email: null,
    },
  });
  ids.employees.push(empProxy.id);
  await appendConsentEvent({
    employeeId: empProxy.id, accountId, origen: ConsentOrigen.EMPRESA,
    tipo: ConsentTipo.AUTORIZACION, metodo: 'admin_loaded',
  });

  // ── FIXTURE EMAIL: con email corporativo ────────────────────────────────────
  const emailRut = normalizeRut(`21000203-1`);
  const empEmail = await prisma.employee.create({
    data: {
      accountId, nationalId: emailRut, fullName: 'Email Egreso',
      departmentId: dept.id, hireDate: new Date(), isActive: true, status: 'ACTIVE',
      preferredChannel: 'email', phoneNumber: '+56911110303',
      email: `email-egreso-${Date.now()}@example.invalid`,
    },
  });
  ids.employees.push(empEmail.id);

  // ── E2a-3 PROXY: canal 'none', NO WhatsApp ──────────────────────────────────
  const proxyReg = await ExitRegistrationService.registerExit({
    accountId, departmentId: dept.id, nationalId: proxyRut, fullName: 'Proxy Egreso', exitDate,
  });
  const proxyWa = proxyReg.participantId
    ? await hasWhatsAppMsg(accountId, `exit_invitation:${proxyReg.participantId}`)
    : false;
  assert('E2a-3.proxy', proxyReg.success && !proxyWa,
    `proxy (admin_loaded) registrado=${proxyReg.success}, WhatsApp encolado=${proxyWa} (esperado false)`);

  // ── E2a-7 EMAIL: EmailAutomation, NO WhatsApp ───────────────────────────────
  const emailReg = await ExitRegistrationService.registerExit({
    accountId, departmentId: dept.id, nationalId: emailRut, fullName: 'Email Egreso', exitDate,
  });
  const emailAutoCount = emailReg.participantId
    ? await prisma.emailAutomation.count({
        where: { participantId: emailReg.participantId, triggerType: 'exit_invitation' },
      })
    : 0;
  const emailWa = emailReg.participantId
    ? await hasWhatsAppMsg(accountId, `exit_invitation:${emailReg.participantId}`)
    : false;
  assert('E2a-7.email', emailReg.success && emailAutoCount === 1 && !emailWa,
    `email registrado=${emailReg.success}, EmailAutomation=${emailAutoCount} (esperado 1), WhatsApp=${emailWa} (esperado false)`);

  // ── E2a-1/6 REAL: WhatsApp exit_invitation (dispara dispatcher inline) ───────
  if (!queueClean) {
    record('E2a-1.real', 'BLOCKED', 'cola sucia: no se registra el fixture WhatsApp (dispatcher inline)');
    record('E2a-2.recordatorio', 'BLOCKED', 'cola sucia');
    record('E2a-2.escalacion', 'BLOCKED', 'cola sucia');
    return;
  }

  const realReg = await ExitRegistrationService.registerExit({
    accountId, departmentId: dept.id, nationalId: realRut, fullName: 'Real Egreso', exitDate,
  });
  const realMsg = realReg.participantId
    ? await prisma.communicationMessage.findFirst({
        where: { accountId, dedupKey: `exit_invitation:${realReg.participantId}` },
        select: { messageType: true, channel: true, toPhone: true, templateSlug: true },
      })
    : null;
  assert('E2a-1.real',
    realReg.success &&
    realMsg?.messageType === 'exit_invitation' &&
    realMsg?.channel === 'WHATSAPP' &&
    realMsg?.toPhone === '+56911110301' &&
    realMsg?.templateSlug === 'exit-invitation-whatsapp',
    `real registrado=${realReg.success}, messageType='${realMsg?.messageType}' (exit_invitation), toPhone='${realMsg?.toPhone}', slug='${realMsg?.templateSlug}'`);

  // ── E2a-2 NO CHASE: los motores de seguimiento NO seleccionan al Exit ───────
  await processWhatsAppReminders();
  await processSurveyEscalations();

  const realReminderEnq = realReg.participantId
    ? await hasWhatsAppMsg(accountId, `survey-reminder:${realReg.participantId}:1`)
    : true;
  const realEscEnq = realReg.participantId
    ? await hasWhatsAppMsg(accountId, `survey-escalation:${realReg.participantId}`)
    : true;
  const partAfter = realReg.participantId
    ? await prisma.participant.findUnique({
        where: { id: realReg.participantId }, select: { reminderCount: true },
      })
    : null;
  assert('E2a-2.recordatorio', !realReminderEnq && partAfter?.reminderCount === 0,
    `Exit NO recibe recordatorio (encolado=${realReminderEnq}), reminderCount=${partAfter?.reminderCount} (esperado 0)`);
  assert('E2a-2.escalacion', !realEscEnq,
    `Exit NO recibe escalacion (encolado=${realEscEnq})`);
}

async function teardown() {
  await prisma.$transaction(async (tx) => {
    const campaigns = await tx.campaign.findMany({
      where: { accountId: ids.account }, select: { id: true },
    });
    const campaignIds = campaigns.map((c) => c.id);

    await tx.communicationMessage.deleteMany({ where: { accountId: ids.account } });
    if (campaignIds.length) {
      await tx.emailAutomation.deleteMany({ where: { campaignId: { in: campaignIds } } });
    }
    await tx.exitRecord.deleteMany({ where: { accountId: ids.account } });
    if (campaignIds.length) {
      await tx.participant.deleteMany({ where: { campaignId: { in: campaignIds } } });
    }
    await tx.consentEvent.deleteMany({ where: { accountId: ids.account } });
    await tx.campaign.deleteMany({ where: { accountId: ids.account } });
    if (ids.employees.length) await tx.employee.deleteMany({ where: { id: { in: ids.employees } } });
    if (ids.dept) await tx.department.deleteMany({ where: { id: ids.dept } });
    if (ids.account) await tx.account.deleteMany({ where: { id: ids.account } });
    // Solo si ESTE test creo el CampaignType (no borrar el compartido del seed).
    if (ids.createdCampaignTypeId) {
      await tx.campaignType.deleteMany({ where: { id: ids.createdCampaignTypeId } });
    }
  });
  console.log('[teardown] fixtures eliminados por id exacto');
}

main()
  .then(async () => {
    await teardown();
    const fail = results.filter((r) => r.status === 'FAIL').length;
    const blocked = results.filter((r) => r.status === 'BLOCKED').length;
    const pass = results.filter((r) => r.status === 'PASS').length;
    console.log(`\nE2a-INT: ${pass} PASS / ${fail} FAIL / ${blocked} BLOCKED`);
    await prisma.$disconnect();
    process.exit(fail === 0 ? 0 : 1);
  })
  .catch(async (err) => {
    console.error('[ERROR]', err);
    try { await teardown(); } catch (e) { console.error('[teardown error]', e); }
    await prisma.$disconnect();
    process.exit(1);
  });
