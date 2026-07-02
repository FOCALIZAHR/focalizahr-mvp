// ════════════════════════════════════════════════════════════════════════════
// SMOKE GATE E.2b - Onboarding journey multicanal (SIN envio real)
// prisma/scripts/smoke-gate-e2b.ts
// ════════════════════════════════════════════════════════════════════════════
// Ejecutar (WhatsApp NO envia real):
//   $env:TWILIO_MODE='simulation'; npx tsx prisma/scripts/smoke-gate-e2b.ts
//   (E2b-6/E2b-8 requieren dev server arriba en NEXT_PUBLIC_BASE_URL: el enroll usa
//    el rodeo HTTP. Si el server no responde o faltan los CampaignType globales de
//    onboarding, esos dos casos se marcan BLOCKED, no FAIL.)
//
// Cubre el criterio de done E.2b:
//   E2b-5 (borde 21.719): opt-in real -> toque WhatsApp encolado + job consumido;
//          STOP -> toque SIGUIENTE resuelve 'none', no encola (consent FRESCO).
//   E2b-4 (no chase): el participant de onboarding con WhatsApp encolado NO aparece
//          como candidato en processWhatsAppReminders ni processSurveyEscalations.
//          GUARD Gate D: solo corre si NO hay PENDING due ajenos (si no, BLOCKED).
//   E2b-6/E2b-7 (intactos): un enroll completo funciona (rodeo HTTP); alguien con
//          email resuelve 'email' (no se le manda WhatsApp, job no consumido).
//   E2b-8 (rama existing): enroll de un Employee YA existente propaga employeeId a
//          los 4 Participant.
//
// Cuenta throwaway aislada companyName='SMOKE_GATE_E2B_TEMP'. Teardown automatico en
// finally por ids (reusa teardown-smoke-gate-e2b.ts), GUARD por companyName. Los
// CampaignType globales de onboarding NUNCA se tocan; el throwaway 'smoke-e2b-temp'
// se borra por slug.
// ════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { prisma } from '../../src/lib/prisma';
import { ConsentOrigen, ConsentTipo } from '@prisma/client';
import { normalizeRut } from '../../src/lib/services/EmployeeSyncService';
import { dispatchOnboardingTouch } from '../../src/lib/services/onboarding-touch-dispatch';
import { processWhatsAppReminders } from '../../src/lib/services/whatsapp-reminders';
import { processSurveyEscalations } from '../../src/lib/services/survey-escalation';
import { OnboardingEnrollmentService } from '../../src/lib/services/OnboardingEnrollmentService';
import { teardownSmokeGateE2b, SMOKE_COMPANY_NAME, SMOKE_CAMPAIGN_TYPE_SLUG } from './teardown-smoke-gate-e2b';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── Resultados ──────────────────────────────────────────────────────────────
type Status = 'PASS' | 'FAIL' | 'BLOCKED';
const results: { id: string; name: string; status: Status; detail: string }[] = [];
function record(id: string, name: string, status: Status, detail: string) {
  results.push({ id, name, status, detail });
  const icon = status === 'PASS' ? 'OK ' : status === 'FAIL' ? 'XX ' : '-- ';
  console.log(`[${icon}] ${id} ${name} :: ${detail}`);
}
function assert(id: string, name: string, cond: boolean, detail: string) {
  record(id, name, cond ? 'PASS' : 'FAIL', detail);
}

// ── Helpers (mismo molde que smoke-gate-d) ────────────────────────────────────
function dvOf(body: number): string {
  let sum = 0, mul = 2;
  const s = String(body);
  for (let i = s.length - 1; i >= 0; i--) { sum += parseInt(s[i]) * mul; mul = mul === 7 ? 2 : mul + 1; }
  const r = 11 - (sum % 11);
  return r === 11 ? '0' : r === 10 ? 'K' : String(r);
}
const rut = (body: number) => `${body}-${dvOf(body)}`;
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000);

let accountId = '';

async function main() {
  // ── Setup base ──────────────────────────────────────────────────────────
  const account = await prisma.account.create({
    data: {
      companyName: SMOKE_COMPANY_NAME,
      adminEmail: `smoke-gate-e2b-${Date.now()}@example.invalid`,
      adminName: 'Smoke Gate E2b',
      passwordHash: 'smoke-not-a-real-hash',
    },
  });
  accountId = account.id;
  console.log(`[setup] Cuenta throwaway: ${accountId}`);

  const dPadre = await prisma.department.create({ data: { accountId, displayName: 'Smoke E2b Padre' } });

  // CampaignType throwaway para las campanas manuales de E2b-5/4/7 (no toca onboarding global).
  const throwType = await prisma.campaignType.create({
    data: { name: 'Smoke E2b Temp', slug: SMOKE_CAMPAIGN_TYPE_SLUG, isPermanent: false },
  });
  const campManual = await prisma.campaign.create({
    data: {
      accountId, campaignTypeId: throwType.id, name: 'Smoke E2b Manual',
      startDate: daysAgo(10), endDate: daysFromNow(20), status: 'active', sendReminders: true,
    },
  });

  // mkEmp: Employee + evento(s) de consent (admin_loaded/opt-in real/STOP).
  const mkEmp = async (body: number, over: any = {}) => {
    const emp = await prisma.employee.create({
      data: {
        accountId,
        nationalId: normalizeRut(rut(body)),
        fullName: over.fullName ?? `Emp ${body}`,
        departmentId: dPadre.id,
        status: over.status ?? 'ACTIVE',
        isActive: over.isActive ?? true,
        hireDate: over.hireDate ?? new Date('2024-01-15'),
        email: over.email ?? null,
        phoneNumber: over.phoneNumber ?? null,
        preferredChannel: over.preferredChannel ?? null,
      },
    });
    for (const ev of over.consentEvents ?? []) {
      await prisma.consentEvent.create({
        data: { employeeId: emp.id, accountId, origen: ev.origen, tipo: ev.tipo, metodo: ev.metodo },
      });
    }
    return emp;
  };

  const mkPart = (over: any) =>
    prisma.participant.create({
      data: {
        campaignId: over.campaignId,
        nationalId: over.nationalId,
        name: over.name,
        email: over.email ?? null,
        phoneNumber: over.phoneNumber ?? null,
        employeeId: over.employeeId ?? null,
        uniqueToken: `smoke-e2b-${over.nationalId}-${over.tag}`,
        hasResponded: over.hasResponded ?? false,
        reminderCount: over.reminderCount ?? 0,
      },
    });

  const mkJob = (over: any) =>
    prisma.emailAutomation.create({
      data: {
        campaignId: over.campaignId,
        participantId: over.participantId,
        templateId: over.templateId,
        triggerType: over.templateId,
        triggerAt: daysAgo(1),
        enabled: true,
      },
    });

  const REAL_OPT_IN = { origen: ConsentOrigen.TITULAR, tipo: ConsentTipo.AUTORIZACION, metodo: 'whatsapp_button' };
  const STOP = { origen: ConsentOrigen.TITULAR, tipo: ConsentTipo.REVOCACION, metodo: 'whatsapp_stop' };
  const companyName = SMOKE_COMPANY_NAME;
  const now = new Date();

  // ════════════════════════════════════════════════════════════════════════
  // E2b-5: consent FRESCO (borde 21.719). Mismo empleado: opt-in real -> WhatsApp;
  //         tras STOP, el toque SIGUIENTE resuelve 'none'.
  // ════════════════════════════════════════════════════════════════════════
  const empFresh = await mkEmp(30000001, {
    phoneNumber: '+56930000001', preferredChannel: 'whatsapp', consentEvents: [REAL_OPT_IN],
  });
  // Toque dia 1 (Participant P1) con opt-in real vigente.
  const p1 = await mkPart({ campaignId: campManual.id, nationalId: rut(30000001), name: 'Fresh Uno', phoneNumber: '+56930000001', employeeId: empFresh.id, tag: 's1' });
  const job1 = await mkJob({ campaignId: campManual.id, participantId: p1.id, templateId: 'onboarding-day-1' });
  const r1 = await dispatchOnboardingTouch({
    jobId: job1.id, waSlug: 'onboarding-day1-whatsapp',
    participant: { id: p1.id, email: null, name: p1.name, uniqueToken: p1.uniqueToken, employeeId: empFresh.id, phoneNumber: '+56930000001' },
    campaign: { id: campManual.id, accountId, companyName }, now,
  });
  const msg1 = await prisma.communicationMessage.findFirst({ where: { dedupKey: `onboarding_touch:${p1.id}:onboarding-day1-whatsapp` } });
  const job1After = await prisma.emailAutomation.findUnique({ where: { id: job1.id } });
  assert('E2b-5a', 'opt-in real -> toque WhatsApp encolado (messageType dedicado) + job consumido',
    r1.channel === 'whatsapp' && r1.enqueued === true
    && !!msg1 && msg1!.messageType === 'onboarding_touch' && msg1!.channel === 'WHATSAPP'
    && job1After!.enabled === false && job1After!.processedAt != null,
    `channel=${r1.channel} enqueued=${(r1 as any).enqueued} msg=${!!msg1} type=${msg1?.messageType} jobEnabled=${job1After!.enabled} processedAt=${!!job1After!.processedAt}`);

  // STOP del titular -> el toque SIGUIENTE (dia 7, P2) NO debe ir por WhatsApp.
  await prisma.consentEvent.create({ data: { employeeId: empFresh.id, accountId, ...STOP } });
  const p2 = await mkPart({ campaignId: campManual.id, nationalId: rut(30000001), name: 'Fresh Uno', phoneNumber: '+56930000001', employeeId: empFresh.id, tag: 's2' });
  const job2 = await mkJob({ campaignId: campManual.id, participantId: p2.id, templateId: 'onboarding-day-7' });
  const r2 = await dispatchOnboardingTouch({
    jobId: job2.id, waSlug: 'onboarding-day7-whatsapp',
    participant: { id: p2.id, email: null, name: p2.name, uniqueToken: p2.uniqueToken, employeeId: empFresh.id, phoneNumber: '+56930000001' },
    campaign: { id: campManual.id, accountId, companyName }, now,
  });
  const msg2 = await prisma.communicationMessage.findFirst({ where: { participantId: p2.id } });
  const job2After = await prisma.emailAutomation.findUnique({ where: { id: job2.id } });
  assert('E2b-5b', 'tras STOP -> toque siguiente resuelve none, NO encola, job consumido (consent FRESCO)',
    r2.channel === 'none' && !msg2 && job2After!.enabled === false && job2After!.processedAt != null,
    `channel=${r2.channel} msgP2=${!!msg2} jobEnabled=${job2After!.enabled} processedAt=${!!job2After!.processedAt}`);

  // ════════════════════════════════════════════════════════════════════════
  // E2b-7: alguien con email resuelve 'email' (no WhatsApp), job NO consumido
  //         (el envio de email lo hace el caller, camino legacy intacto).
  // ════════════════════════════════════════════════════════════════════════
  const empEmail = await mkEmp(30000002, { email: 'e2b-email@smoke.invalid', phoneNumber: '+56930000002', preferredChannel: 'email' });
  const p3 = await mkPart({ campaignId: campManual.id, nationalId: rut(30000002), name: 'Con Email', email: 'e2b-email@smoke.invalid', phoneNumber: '+56930000002', employeeId: empEmail.id, tag: 's1' });
  const job3 = await mkJob({ campaignId: campManual.id, participantId: p3.id, templateId: 'onboarding-day-1' });
  const r3 = await dispatchOnboardingTouch({
    jobId: job3.id, waSlug: 'onboarding-day1-whatsapp',
    participant: { id: p3.id, email: 'e2b-email@smoke.invalid', name: p3.name, uniqueToken: p3.uniqueToken, employeeId: empEmail.id, phoneNumber: '+56930000002' },
    campaign: { id: campManual.id, accountId, companyName }, now,
  });
  const msg3 = await prisma.communicationMessage.findFirst({ where: { participantId: p3.id } });
  const job3After = await prisma.emailAutomation.findUnique({ where: { id: job3.id } });
  assert('E2b-7', 'con email -> resuelve email, NO WhatsApp, job NO consumido (camino email intacto)',
    r3.channel === 'email' && !msg3 && job3After!.enabled === true && job3After!.processedAt == null,
    `channel=${r3.channel} msgP3=${!!msg3} jobEnabled=${job3After!.enabled} processedAt=${!!job3After!.processedAt}`);

  // ════════════════════════════════════════════════════════════════════════
  // E2b-3: solo admin_loaded (proxy de empresa, sin opt-in real, sin STOP) -> 'none'.
  //         Fail-closed por AUSENCIA de opt-in real, distinto del veto por STOP de 5b.
  // ════════════════════════════════════════════════════════════════════════
  const empProxy = await mkEmp(30000004, {
    phoneNumber: '+56930000004', preferredChannel: 'whatsapp',
    consentEvents: [{ origen: ConsentOrigen.EMPRESA, tipo: ConsentTipo.AUTORIZACION, metodo: 'admin_loaded' }],
  });
  const p4 = await mkPart({ campaignId: campManual.id, nationalId: rut(30000004), name: 'Solo Proxy', phoneNumber: '+56930000004', employeeId: empProxy.id, tag: 's1' });
  const job4 = await mkJob({ campaignId: campManual.id, participantId: p4.id, templateId: 'onboarding-day-1' });
  const r4 = await dispatchOnboardingTouch({
    jobId: job4.id, waSlug: 'onboarding-day1-whatsapp',
    participant: { id: p4.id, email: null, name: p4.name, uniqueToken: p4.uniqueToken, employeeId: empProxy.id, phoneNumber: '+56930000004' },
    campaign: { id: campManual.id, accountId, companyName }, now,
  });
  const msg4 = await prisma.communicationMessage.findFirst({ where: { participantId: p4.id } });
  const job4After = await prisma.emailAutomation.findUnique({ where: { id: job4.id } });
  assert('E2b-3', 'solo admin_loaded (proxy, sin opt-in real ni STOP) -> none (fail-closed por ausencia)',
    r4.channel === 'none' && !msg4 && job4After!.enabled === false && job4After!.processedAt != null,
    `channel=${r4.channel} msgP4=${!!msg4} jobEnabled=${job4After!.enabled} processedAt=${!!job4After!.processedAt}`);

  // ════════════════════════════════════════════════════════════════════════
  // E2b-4: NO chase. GUARD Gate D: si hay PENDING due AJENOS, BLOCKED (el dispatcher
  //         interno de los motores mandaria mensajes reales). Si limpio, corre real.
  // ════════════════════════════════════════════════════════════════════════
  const foreignPending = await prisma.communicationMessage.count({
    where: { status: 'PENDING', scheduledAt: { lte: new Date() }, accountId: { not: accountId } },
  });
  if (foreignPending > 0) {
    record('E2b-4', 'NO chase (reminder/escalacion no seleccionan al onboarding)', 'BLOCKED',
      `cola con ${foreignPending} PENDING due ajenos; no se corren los motores (evita despachos reales). Vaciar cola y reintentar.`);
  } else {
    await processWhatsAppReminders();
    await processSurveyEscalations();
    const reminderP1 = await prisma.communicationMessage.count({ where: { participantId: p1.id, messageType: 'survey_reminder' } });
    const escalationP1 = await prisma.communicationMessage.count({ where: { participantId: p1.id, messageType: 'survey_escalation' } });
    assert('E2b-4', 'onboarding con WhatsApp encolado NO recibe reminder ni escalacion (no-chase)',
      reminderP1 === 0 && escalationP1 === 0,
      `survey_reminder(P1)=${reminderP1} survey_escalation(P1)=${escalationP1}`);
  }

  // ════════════════════════════════════════════════════════════════════════
  // E2b-6 / E2b-8: enroll completo (rodeo HTTP) de un Employee YA existente ->
  //         propaga employeeId a los 4 Participant. Requiere dev server + los
  //         CampaignType globales onboarding-day-1/7/30/90. Si faltan -> BLOCKED.
  // ════════════════════════════════════════════════════════════════════════
  const onboardingSlugs = ['onboarding-day-1', 'onboarding-day-7', 'onboarding-day-30', 'onboarding-day-90'];
  const globalTypes = await prisma.campaignType.count({ where: { slug: { in: onboardingSlugs } } });
  if (globalTypes < 4) {
    record('E2b-6', 'enroll completo (rodeo HTTP) funciona', 'BLOCKED', `faltan CampaignType globales de onboarding (${globalTypes}/4). Correr seeds.`);
    record('E2b-8', 'rama existing propaga employeeId a los 4 Participant', 'BLOCKED', `faltan CampaignType globales de onboarding (${globalTypes}/4).`);
  } else {
    // Employee YA existente en el maestro (rama 'existing' de upsertPreNominaEmployee).
    const empExisting = await mkEmp(30000003, { status: 'ACTIVE', phoneNumber: '+56930000003', fullName: 'Recontratado Real' });
    let enrollOk = false, enrollDetail = '', e2b8ok = false, e2b8detail = '';
    try {
      const res = await OnboardingEnrollmentService.enrollParticipant({
        accountId, nationalId: rut(30000003), fullName: 'Recontratado Real',
        phoneNumber: '+56930000003', departmentId: dPadre.id, hireDate: new Date(),
        preferredChannel: 'whatsapp',
      } as any);
      enrollOk = res.success === true && Array.isArray((res as any).participantIds) && (res as any).participantIds.length === 4;
      enrollDetail = res.success ? `journeyId=${(res as any).journeyId} participants=${(res as any).participantIds.length}` : `error=${(res as any).error}`;

      if (res.success) {
        const parts = await prisma.participant.findMany({
          where: { id: { in: (res as any).participantIds } }, select: { id: true, employeeId: true },
        });
        e2b8ok = parts.length === 4 && parts.every((p) => p.employeeId === empExisting.id);
        e2b8detail = `participants=${parts.length} conEmployeeId=${parts.filter((p) => p.employeeId === empExisting.id).length}/4 (esperado empId=${empExisting.id})`;
      } else {
        e2b8detail = 'enroll no exitoso; no se puede evaluar propagacion';
      }
    } catch (e) {
      enrollDetail = `EXCEPCION (dev server abajo?): ${e instanceof Error ? e.message : String(e)}`;
    }
    if (enrollDetail.startsWith('EXCEPCION')) {
      record('E2b-6', 'enroll completo (rodeo HTTP) funciona', 'BLOCKED', enrollDetail);
      record('E2b-8', 'rama existing propaga employeeId a los 4 Participant', 'BLOCKED', 'enroll no corrio (dev server?)');
    } else {
      assert('E2b-6', 'enroll completo (rodeo HTTP) funciona (4 participants creados)', enrollOk, enrollDetail);
      assert('E2b-8', 'rama existing propaga employeeId a los 4 Participant', e2b8ok, e2b8detail);
    }

    // E2b-2 (WIRE REAL): enroll de un phone-only NUEVO (rama create) dispara la SOLICITUD
    //   de consent via enqueueChannelOnboarding dentro de enrollParticipant. Aun NO hay
    //   opt-in real (la solicitud es admin_loaded); habilita que el frontline lo de luego.
    let wireOk = false, wireDetail = '';
    try {
      const resNew = await OnboardingEnrollmentService.enrollParticipant({
        accountId, nationalId: rut(30000005), fullName: 'Frontline Nuevo',
        phoneNumber: '+56930000005', departmentId: dPadre.id, hireDate: new Date(),
        preferredChannel: 'whatsapp',
      } as any);
      if ((resNew as any).success) {
        const empNew = await prisma.employee.findFirst({
          where: { accountId, nationalId: normalizeRut(rut(30000005)) },
          select: { id: true, channelConsentRequestedAt: true },
        });
        const solicit = empNew
          ? await prisma.communicationMessage.count({ where: { employeeId: empNew.id, messageType: 'channel-onboarding', channel: 'WHATSAPP' } })
          : 0;
        wireOk = !!empNew && solicit === 1 && empNew.channelConsentRequestedAt != null;
        wireDetail = `solicitud(channel-onboarding)=${solicit} channelConsentRequestedAt=${!!empNew?.channelConsentRequestedAt}`;
      } else {
        wireDetail = `enroll no exitoso: ${(resNew as any).error}`;
      }
    } catch (e) {
      wireDetail = `EXCEPCION (dev server?): ${e instanceof Error ? e.message : String(e)}`;
    }
    if (wireDetail.startsWith('EXCEPCION')) {
      record('E2b-2', 'enroll phone-only nuevo dispara la solicitud de consent (wire real)', 'BLOCKED', wireDetail);
    } else {
      assert('E2b-2', 'enroll phone-only nuevo dispara la solicitud de consent (wire real enqueueChannelOnboarding)', wireOk, wireDetail);
    }
  }
}

// ── Run + teardown ──────────────────────────────────────────────────────────
main()
  .catch((e) => {
    record('FATAL', 'error de ejecucion', 'FAIL', e instanceof Error ? e.message : String(e));
    console.error(e);
  })
  .finally(async () => {
    try {
      if (accountId) {
        const td = await teardownSmokeGateE2b(accountId);
        console.log('[teardown]', td.ok ? 'OK' : `ABORT (${td.reason})`, JSON.stringify(td.deleted));
        if (!td.ok) console.log('[teardown] LIMPIEZA MANUAL: npx tsx prisma/scripts/teardown-smoke-gate-e2b.ts');
      }
    } catch (tdErr) {
      console.error('[teardown] FALLO; correr manual: npx tsx prisma/scripts/teardown-smoke-gate-e2b.ts', tdErr);
    }

    const pass = results.filter((r) => r.status === 'PASS').length;
    const fail = results.filter((r) => r.status === 'FAIL').length;
    const blocked = results.filter((r) => r.status === 'BLOCKED').length;
    const lines = [
      '# SMOKE GATE E.2b - Resultados (sin envio real)',
      '',
      `Fecha: ${new Date().toISOString()}`,
      `TWILIO_MODE: ${process.env.TWILIO_MODE}`,
      `Cuenta throwaway: ${accountId}`,
      `Resumen: ${pass} PASS / ${fail} FAIL / ${blocked} BLOCKED (de ${results.length})`,
      '',
      '| ID | Criterio | Estado | Detalle |',
      '|----|----------|--------|---------|',
      ...results.map((r) => `| ${r.id} | ${r.name} | ${r.status} | ${r.detail.replace(/\|/g, '/')} |`),
    ];
    writeFileSync(resolve(process.cwd(), '.claude/tasks/SMOKE_GATE_E2B_RESULTS.md'), lines.join('\n'));
    console.log(`\n[reporte] .claude/tasks/SMOKE_GATE_E2B_RESULTS.md  ::  ${pass} PASS / ${fail} FAIL / ${blocked} BLOCKED`);
    await prisma.$disconnect();
  });
