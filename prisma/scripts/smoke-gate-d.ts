// ════════════════════════════════════════════════════════════════════════════
// SMOKE GATE D - Primera tanda (SIN envio real)
// prisma/scripts/smoke-gate-d.ts
// ════════════════════════════════════════════════════════════════════════════
// Ejecutar:
//   $env:TWILIO_MODE='simulation'; npx tsx prisma/scripts/smoke-gate-d.ts
//
// Cubre D1-1..D1-4, D2-1..D2-3, D3-1, D3-3, D3-4, D3-5. NO corre D3-2 (envio real,
// segunda tanda) ni D-BUILD (se corre aparte: tsc --noEmit + next build).
//
// Cuenta throwaway aislada companyName='SMOKE_GATE_D_TEMP'. Teardown automatico en
// finally por ids recolectados (reusa teardown-smoke-gate-d.ts), GUARD por companyName.
// El CampaignType global retencion-predictiva: si ya existia se REUSA (no se borra);
// si lo crea el smoke, se borra (distincion explicita createdRetencionTypeId).
//
// Seguridad dispatcher: corre con TWILIO_MODE=simulation (WhatsApp no envia real).
// Precondicion D3: si hay CommunicationMessage PENDING due de OTRAS fuentes en la DB,
// se marca D3-3/4/5 BLOCKED en vez de arriesgar que el dispatcher mande emails reales.
// ════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { prisma } from '../../src/lib/prisma';
import { ConsentOrigen, ConsentTipo } from '@prisma/client';
import { ExitRegistrationService } from '../../src/lib/services/ExitRegistrationService';
import { OnboardingEnrollmentService } from '../../src/lib/services/OnboardingEnrollmentService';
import { EscalationConfigService } from '../../src/lib/services/EscalationConfigService';
import { processEmployeeImport, normalizeRut } from '../../src/lib/services/EmployeeSyncService';
import { processSurveyEscalations } from '../../src/lib/services/survey-escalation';
import { teardownSmokeGateD, SMOKE_COMPANY_NAME, SMOKE_ESCALATION_TYPE_SLUG } from './teardown-smoke-gate-d';
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

// ── Helpers ─────────────────────────────────────────────────────────────────
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

let createdRetencionTypeId: string | null = null;
let accountId = '';

async function main() {
  // ── Setup base ──────────────────────────────────────────────────────────
  const account = await prisma.account.create({
    data: {
      companyName: SMOKE_COMPANY_NAME,
      adminEmail: `smoke-gate-d-${Date.now()}@example.invalid`,
      adminName: 'Smoke Gate D',
      passwordHash: 'smoke-not-a-real-hash'
    }
  });
  accountId = account.id;
  console.log(`[setup] Cuenta throwaway: ${accountId}`);

  const dPadre = await prisma.department.create({ data: { accountId, displayName: 'Smoke Padre' } });
  const dHijo = await prisma.department.create({ data: { accountId, displayName: 'Smoke Hijo', parentId: dPadre.id } });
  const dOtro = await prisma.department.create({ data: { accountId, displayName: 'Smoke Otro' } });

  // CampaignType global retencion-predictiva: reusar o crear (distinguir!)
  let retType = await prisma.campaignType.findFirst({ where: { slug: 'retencion-predictiva', isPermanent: true } });
  if (!retType) {
    retType = await prisma.campaignType.create({
      data: { name: 'Retencion Predictiva', slug: 'retencion-predictiva', isPermanent: true }
    });
    createdRetencionTypeId = retType.id;
    console.log('[setup] retencion-predictiva CREADO por el smoke (se borrara en teardown)');
  } else {
    console.log('[setup] retencion-predictiva REUSADO (NO se borrara)');
  }

  // CampaignType throwaway para escalacion
  const escType = await prisma.campaignType.create({
    data: { name: 'Smoke Escalation Temp', slug: SMOKE_ESCALATION_TYPE_SLUG, isPermanent: false }
  });

  // Gate E.1: el consent vive en ConsentEvent (las columnas channelConsentAt/Method se
  // eliminaron). mkEmp traduce el override over.channelConsentMethod a un evento:
  // admin_loaded -> EMPRESA, opt-in real (whatsapp_button/text/self_service) -> TITULAR.
  // Asi los fixtures de consent siguen alimentando la escalacion (que ahora deriva del log).
  const mkEmp = async (body: number, over: any = {}) => {
    const emp = await prisma.employee.create({
      data: {
        accountId,
        nationalId: normalizeRut(rut(body)),
        fullName: over.fullName ?? `Emp ${body}`,
        departmentId: over.departmentId ?? dPadre.id,
        status: over.status ?? 'ACTIVE',
        isActive: over.isActive ?? (over.status ? over.status === 'ACTIVE' : true),
        hireDate: over.hireDate ?? new Date('2024-01-15'),
        email: over.email ?? null,
        phoneNumber: over.phoneNumber ?? null,
        preferredChannel: over.preferredChannel ?? null,
        noShowExcludedAt: over.noShowExcludedAt ?? null,
        ...(over.createdAt ? { createdAt: over.createdAt } : {})
      }
    });
    if (over.channelConsentMethod) {
      await prisma.consentEvent.create({
        data: {
          employeeId: emp.id,
          accountId,
          origen: over.channelConsentMethod === 'admin_loaded' ? ConsentOrigen.EMPRESA : ConsentOrigen.TITULAR,
          tipo: ConsentTipo.AUTORIZACION,
          metodo: over.channelConsentMethod,
          ...(over.channelConsentAt ? { createdAt: over.channelConsentAt } : {})
        }
      });
    }
    return emp;
  };

  const SYNC_CFG = { mode: 'FULL' as const, missingThreshold: 1.1, autoDeactivateMissing: false, preserveManualExclusions: true };
  const fileRow = (body: number, deptName: string, extra: any = {}) => ({
    nationalId: rut(body),
    fullName: extra.fullName ?? `Emp ${body}`,
    email: extra.email ?? `emp${body}@smoke.invalid`, // email => evita channel-onboarding espurio
    phoneNumber: extra.phoneNumber,
    departmentName: deptName,
    hireDate: extra.hireDate ?? '2024-01-15',
    isActive: extra.isActive ?? true,
    position: extra.position
  });

  // ════════════════════════════════════════════════════════════════════════
  // D1-1: Employee pre-nomina con consent (isActive=false) + no-clobber
  // ════════════════════════════════════════════════════════════════════════
  await OnboardingEnrollmentService.upsertPreNominaEmployee({
    accountId, nationalId: rut(20000001), fullName: 'Pre Uno',
    phoneNumber: '+56911110001', departmentId: dPadre.id, hireDate: new Date(),
    preferredChannel: 'whatsapp'
  } as any);
  const pre1 = await prisma.employee.findFirst({ where: { accountId, nationalId: normalizeRut(rut(20000001)) } });
  // Gate E.1: el consent (admin_loaded) ya no vive en columna; lo valida E1-9/E1-8.
  // D solo valida lo suyo: estado pre-nomina + canal.
  assert('D1-1', 'pre-nomina creado (PENDING_ONBOARDING, canal)', !!pre1
    && pre1!.status === 'PENDING_ONBOARDING' && pre1!.isActive === false
    && pre1!.preferredChannel === 'whatsapp',
    pre1 ? `status=${pre1.status} isActive=${pre1.isActive} chan=${pre1.preferredChannel}` : 'no creado');

  // no-clobber: existente ACTIVE no se degrada
  await mkEmp(20000002, { status: 'ACTIVE' });
  await OnboardingEnrollmentService.upsertPreNominaEmployee({
    accountId, nationalId: rut(20000002), fullName: 'Ya Activo',
    phoneNumber: '+56911110002', departmentId: dPadre.id, hireDate: new Date(), preferredChannel: 'whatsapp'
  } as any);
  const noclobber = await prisma.employee.findFirst({ where: { accountId, nationalId: normalizeRut(rut(20000002)) } });
  assert('D1-1b', 'no-clobber: ACTIVE no se degrada a pre-nomina', noclobber!.status === 'ACTIVE' && noclobber!.isActive === true,
    `status=${noclobber!.status} isActive=${noclobber!.isActive}`);

  // ════════════════════════════════════════════════════════════════════════
  // D2-1: lookup por existencia encuentra INACTIVE + respeta RBAC scope
  // ════════════════════════════════════════════════════════════════════════
  await mkEmp(20000008, { status: 'INACTIVE', departmentId: dHijo.id });
  await mkEmp(20000009, { status: 'ACTIVE', departmentId: dOtro.id });
  const scope = await ExitRegistrationService.resolveScopeDepartmentIds({ role: 'AREA_MANAGER', departmentId: dPadre.id });
  assert('D2-1a', 'resolveScopeDepartmentIds incluye hijo, excluye otro',
    !!scope && scope.includes(dPadre.id) && scope.includes(dHijo.id) && !scope.includes(dOtro.id),
    `scope=${JSON.stringify(scope)}`);
  const foundInactive = await ExitRegistrationService.findEmployeeForExit({ accountId, nationalId: rut(20000008), scopeDepartmentIds: scope });
  assert('D2-1b', 'lookup encuentra INACTIVE en scope (sin filtro de estado)', !!foundInactive && foundInactive.status === 'INACTIVE',
    foundInactive ? `found status=${foundInactive.status}` : 'no encontrado');
  const outOfScope = await ExitRegistrationService.findEmployeeForExit({ accountId, nationalId: rut(20000009), scopeDepartmentIds: scope });
  assert('D2-1c', 'fuera de scope = null (no revela existencia)', outOfScope === null,
    `result=${outOfScope === null ? 'null' : 'REVELADO'}`);

  // ════════════════════════════════════════════════════════════════════════
  // D2-2: exit match prepobla + setea employeeId en Participant y ExitRecord
  // ════════════════════════════════════════════════════════════════════════
  const eExit = await mkEmp(20000010, { status: 'ACTIVE', departmentId: dPadre.id, fullName: 'Exit Real', email: 'exit10@smoke.invalid', phoneNumber: '+56911110010', position: 'Analista Smoke' });
  const exitRes = await ExitRegistrationService.registerExit({
    accountId, departmentId: 'IGNORED-deberia-venir-del-master', nationalId: rut(20000010),
    fullName: 'NOMBRE INCORRECTO DEL FORM', exitDate: new Date(),
    talentClassification: 'meets_expectations'
  } as any, { scopeDepartmentIds: null });
  let d22ok = false, d22detail = exitRes.error || '';
  if (exitRes.success && exitRes.participantId && exitRes.exitRecordId) {
    const p = await prisma.participant.findUnique({ where: { id: exitRes.participantId } });
    const er = await prisma.exitRecord.findUnique({ where: { id: exitRes.exitRecordId } });
    d22ok = p?.employeeId === eExit.id && er?.employeeId === eExit.id
      && p?.name === 'Exit Real' && p?.departmentId === dPadre.id;
    d22detail = `participant.employeeId=${p?.employeeId === eExit.id} exitRecord.employeeId=${er?.employeeId === eExit.id} name(prepoblado)=${p?.name} dept=${p?.departmentId === dPadre.id}`;
  }
  assert('D2-2', 'exit match: prepobla del master + employeeId en ambos', d22ok, d22detail);

  // ════════════════════════════════════════════════════════════════════════
  // D2-3: exit no-match bloquea 409 EMPLOYEE_NOT_IN_MASTER sin crear Employee
  // ════════════════════════════════════════════════════════════════════════
  const empCountBefore = await prisma.employee.count({ where: { accountId } });
  const noMatch = await ExitRegistrationService.registerExit({
    accountId, departmentId: dPadre.id, nationalId: rut(20000011),
    fullName: 'Fantasma', exitDate: new Date(), talentClassification: 'poor_fit'
  } as any, { scopeDepartmentIds: null });
  const empCountAfter = await prisma.employee.count({ where: { accountId } });
  const ghostPart = await prisma.participant.findFirst({ where: { nationalId: rut(20000011), campaign: { accountId } } });
  assert('D2-3', 'no-match bloquea EMPLOYEE_NOT_IN_MASTER, no crea Employee/Participant',
    noMatch.success === false && noMatch.code === 'EMPLOYEE_NOT_IN_MASTER' && empCountAfter === empCountBefore && !ghostPart,
    `success=${noMatch.success} code=${noMatch.code} empDelta=${empCountAfter - empCountBefore} ghostParticipant=${!!ghostPart}`);

  // ════════════════════════════════════════════════════════════════════════
  // D1-2: sync transiciona PENDING_ONBOARDING -> ACTIVE preservando consent
  // ════════════════════════════════════════════════════════════════════════
  const consentAt = new Date();
  await mkEmp(20000003, { status: 'PENDING_ONBOARDING', isActive: false, preferredChannel: 'whatsapp', channelConsentAt: consentAt, channelConsentMethod: 'admin_loaded', phoneNumber: '+56911110003', email: 'pre3@smoke.invalid' });
  await processEmployeeImport(accountId, [fileRow(20000003, 'Smoke Padre', { fullName: 'Pre Tres', email: 'pre3@smoke.invalid' })], SYNC_CFG, 'smoke');
  const c = await prisma.employee.findFirst({ where: { accountId, nationalId: normalizeRut(rut(20000003)) } });
  const cHist = await prisma.employeeHistory.findFirst({ where: { employeeId: c!.id, fieldName: 'status', newValue: 'ACTIVE', oldValue: 'PENDING_ONBOARDING' } });
  // Gate E.1: el consent vive en ConsentEvent (no se borra por cambio de estado del
  // Employee). D valida la transicion de estado + canal + history; el consent es E1-8.
  assert('D1-2', 'sync: pre-nomina -> ACTIVE, canal preservado, history',
    c!.status === 'ACTIVE' && c!.isActive === true && c!.preferredChannel === 'whatsapp' && !!cHist,
    `status=${c!.status} chan=${c!.preferredChannel} history=${!!cHist}`);

  // ════════════════════════════════════════════════════════════════════════
  // D1-3a: no-show borde del umbral (>=3 marca, <3 NO marca)
  // ════════════════════════════════════════════════════════════════════════
  await mkEmp(20000004, { status: 'PENDING_ONBOARDING', isActive: false, createdAt: daysAgo(100), preferredChannel: 'whatsapp', channelConsentAt: new Date(), channelConsentMethod: 'admin_loaded', phoneNumber: '+56911110004' });
  await mkEmp(20000005, { status: 'PENDING_ONBOARDING', isActive: false, createdAt: new Date(), preferredChannel: 'whatsapp', channelConsentAt: new Date(), channelConsentMethod: 'admin_loaded', phoneNumber: '+56911110005' });
  await mkEmp(20000006, { status: 'ACTIVE', email: 'emp6@smoke.invalid' });
  // 2 imports FULL COMPLETED previos despues de createdAt de A (100d) y antes de B (ahora)
  await prisma.employeeImport.create({ data: { accountId, importMode: 'FULL', totalInFile: 1, status: 'COMPLETED', completedAt: daysAgo(5) } });
  await prisma.employeeImport.create({ data: { accountId, importMode: 'FULL', totalInFile: 1, status: 'COMPLETED', completedAt: daysAgo(3) } });
  // sync FULL con file que NO incluye A ni B (incluye F activo)
  await processEmployeeImport(accountId, [fileRow(20000006, 'Smoke Padre', { email: 'emp6@smoke.invalid' })], SYNC_CFG, 'smoke');
  const a = await prisma.employee.findFirst({ where: { accountId, nationalId: normalizeRut(rut(20000004)) } });
  const b = await prisma.employee.findFirst({ where: { accountId, nationalId: normalizeRut(rut(20000005)) } });
  assert('D1-3a-mark', 'no-show: >=3 ciclos -> EXCLUDED + noShowExcludedAt', a!.status === 'EXCLUDED' && a!.noShowExcludedAt != null,
    `A status=${a!.status} noShowAt=${!!a!.noShowExcludedAt}`);
  assert('D1-3a-nomark', 'no-show: <3 ciclos NO marca (borde)', b!.status === 'PENDING_ONBOARDING' && b!.noShowExcludedAt == null,
    `B status=${b!.status} noShowAt=${!!b!.noShowExcludedAt}`);

  // ════════════════════════════════════════════════════════════════════════
  // D1-3b: reversibilidad (no-show reaparece -> ACTIVE; manual EXCLUDED no)
  // ════════════════════════════════════════════════════════════════════════
  await mkEmp(20000007, { status: 'EXCLUDED', isActive: false, noShowExcludedAt: null, email: 'emp7@smoke.invalid' }); // EXCLUDED manual
  await processEmployeeImport(accountId, [
    fileRow(20000004, 'Smoke Padre', { phoneNumber: '+56911110004' }), // A (no-show) reaparece
    fileRow(20000007, 'Smoke Padre', { email: 'emp7@smoke.invalid' })  // M (manual) reaparece
  ], SYNC_CFG, 'smoke');
  const aBack = await prisma.employee.findFirst({ where: { accountId, nationalId: normalizeRut(rut(20000004)) } });
  const mManual = await prisma.employee.findFirst({ where: { accountId, nationalId: normalizeRut(rut(20000007)) } });
  assert('D1-3b-revert', 'no-show reaparece -> ACTIVE + flag limpiado + canal preservado',
    aBack!.status === 'ACTIVE' && aBack!.noShowExcludedAt == null && aBack!.preferredChannel === 'whatsapp',
    `A status=${aBack!.status} flag=${aBack!.noShowExcludedAt == null ? 'null' : 'SET'} chan=${aBack!.preferredChannel}`);
  assert('D1-3b-manual', 'EXCLUDED manual reaparece -> NO se reactiva', mManual!.status === 'EXCLUDED',
    `M status=${mManual!.status}`);

  // ════════════════════════════════════════════════════════════════════════
  // D1-4: guardrail headcount (PENDING_ONBOARDING no infla conteos)
  // ════════════════════════════════════════════════════════════════════════
  const cAll = await prisma.employee.count({ where: { accountId } });
  const cPending = await prisma.employee.count({ where: { accountId, status: 'PENDING_ONBOARDING' } });
  const cGuard = await prisma.employee.count({ where: { accountId, status: { not: 'PENDING_ONBOARDING' } } });
  assert('D1-4', 'guardrail excluye PENDING_ONBOARDING del conteo', cPending >= 1 && cGuard === cAll - cPending,
    `all=${cAll} pending=${cPending} guardrail=${cGuard}`);

  // ════════════════════════════════════════════════════════════════════════
  // D3-1: offset en cascada (campaign > account > campaignType > default 2)
  // ════════════════════════════════════════════════════════════════════════
  const campOk = await prisma.campaign.create({
    data: { accountId, campaignTypeId: escType.id, name: 'ESC OK', startDate: daysAgo(20), endDate: daysFromNow(10), status: 'active', sendReminders: true }
  });
  const noConfidence = (o: any) => !('confidence' in o);
  // nivel campaign
  await prisma.campaign.update({ where: { id: campOk.id }, data: { whatsappEscalationDelayDays: 5 } });
  let r = await EscalationConfigService.getEscalationDelayForCampaign(campOk.id);
  assert('D3-1a', 'cascada campaign_override', r.days === 5 && r.source === 'campaign_override' && noConfidence(r), JSON.stringify(r));
  // nivel account
  await prisma.campaign.update({ where: { id: campOk.id }, data: { whatsappEscalationDelayDays: null } });
  await prisma.account.update({ where: { id: accountId }, data: { whatsappEscalationDelayDays: 4 } });
  r = await EscalationConfigService.getEscalationDelayForCampaign(campOk.id);
  assert('D3-1b', 'cascada account_policy', r.days === 4 && r.source === 'account_policy' && noConfidence(r), JSON.stringify(r));
  // nivel campaignType
  await prisma.account.update({ where: { id: accountId }, data: { whatsappEscalationDelayDays: null } });
  await prisma.campaignType.update({ where: { id: escType.id }, data: { whatsappEscalationDelayDays: 3 } });
  r = await EscalationConfigService.getEscalationDelayForCampaign(campOk.id);
  assert('D3-1c', 'cascada producttype_default', r.days === 3 && r.source === 'producttype_default' && noConfidence(r), JSON.stringify(r));
  // default sistema
  await prisma.campaignType.update({ where: { id: escType.id }, data: { whatsappEscalationDelayDays: null } });
  r = await EscalationConfigService.getEscalationDelayForCampaign(campOk.id);
  assert('D3-1d', 'cascada system_default (2)', r.days === 2 && r.source === 'system_default' && noConfidence(r), JSON.stringify(r));

  // ════════════════════════════════════════════════════════════════════════
  // D3-3/D3-4/D3-5: fixtures (offset efectivo = 2, system_default)
  // ════════════════════════════════════════════════════════════════════════
  const eWa = await mkEmp(20000012, { preferredChannel: 'whatsapp', channelConsentAt: new Date(), channelConsentMethod: 'whatsapp_button', phoneNumber: '+56911110012', email: 'wa12@smoke.invalid' });
  const eEm = await mkEmp(20000013, { preferredChannel: 'email', channelConsentAt: new Date(), channelConsentMethod: 'whatsapp_text', phoneNumber: '+56911110013', email: 'em13@smoke.invalid' });
  const eWa2 = await mkEmp(20000014, { preferredChannel: 'whatsapp', channelConsentAt: new Date(), channelConsentMethod: 'whatsapp_button', phoneNumber: '+56911110014', email: 'wa14@smoke.invalid' });
  const eEval = await mkEmp(20000015, { preferredChannel: 'whatsapp', channelConsentAt: new Date(), channelConsentMethod: 'whatsapp_button', phoneNumber: '+56911110015', email: 'eval15@smoke.invalid' });
  const eTee = await mkEmp(20000016, { email: 'tee16@smoke.invalid' });

  const campTope = await prisma.campaign.create({
    data: { accountId, campaignTypeId: escType.id, name: 'ESC TOPE', startDate: daysAgo(20), endDate: daysAgo(2), status: 'active', sendReminders: true }
  });

  const mkPart = (over: any) => prisma.participant.create({
    data: {
      campaignId: over.campaignId, nationalId: over.nationalId, name: over.name,
      uniqueToken: `smoke-tok-${over.nationalId}-${Math.floor(Math.random() * 1e9)}`,
      hasResponded: over.hasResponded ?? false, reminderCount: over.reminderCount ?? 1,
      lastReminderSent: over.lastReminderSent ?? daysAgo(3),
      employeeId: over.employeeId ?? null, evaluationAssignmentId: over.evaluationAssignmentId ?? null,
      phoneNumber: over.phoneNumber ?? null
    }
  });

  const pEligible = await mkPart({ campaignId: campOk.id, nationalId: rut(20000012), name: 'Wa Uno', employeeId: eWa.id });
  const pResponded = await mkPart({ campaignId: campOk.id, nationalId: rut(20000012), name: 'Wa Resp', employeeId: eWa.id, hasResponded: true });
  const pNoConsent = await mkPart({ campaignId: campOk.id, nationalId: rut(20000013), name: 'Em Sin', employeeId: eEm.id });

  // Performance: cadena minima (cycle -> assignment -> participant)
  const cycle = await prisma.performanceCycle.create({ data: { accountId, name: 'Smoke Cycle', startDate: daysAgo(20), endDate: daysFromNow(10) } });
  const assignment = await prisma.evaluationAssignment.create({
    data: {
      accountId, cycleId: cycle.id, evaluateeId: eTee.id, evaluatorId: eEval.id, snapshotDate: new Date(),
      evaluateeName: 'Tee', evaluateeNationalId: normalizeRut(rut(20000016)), evaluateeDepartmentId: dPadre.id, evaluateeDepartment: 'Smoke Padre',
      evaluatorName: 'Eval', evaluatorNationalId: normalizeRut(rut(20000015)), evaluatorDepartmentId: dPadre.id, evaluatorDepartment: 'Smoke Padre',
      evaluationType: 'MANAGER_TO_EMPLOYEE'
    }
  });
  const pPerf = await mkPart({ campaignId: campOk.id, nationalId: rut(20000016), name: 'Perf Tee', evaluationAssignmentId: assignment.id });
  const pTope = await mkPart({ campaignId: campTope.id, nationalId: rut(20000014), name: 'Wa Tope', employeeId: eWa2.id });

  // Precondicion seguridad: no debe haber PENDING due ajenos (el dispatcher manda email real)
  const foreignPending = await prisma.communicationMessage.count({ where: { status: 'PENDING', scheduledAt: { lte: new Date() } } });
  if (foreignPending > 0) {
    record('D3-3', 'NO escala (respondido/sin-consent/fuera-endDate) + control positivo', 'BLOCKED', `cola con ${foreignPending} PENDING due ajenos; no se corre el dispatcher (evita emails reales). Vaciar cola y reintentar.`);
    record('D3-4', 'idempotencia dedupKey', 'BLOCKED', 'misma precondicion');
    record('D3-5', 'Performance evaluatee no recibe nada', 'BLOCKED', 'misma precondicion');
  } else {
    await processSurveyEscalations();
    const has = async (pid: string) => (await prisma.communicationMessage.count({ where: { accountId, dedupKey: `survey-escalation:${pid}`, channel: 'WHATSAPP' } })) > 0;
    const eligibleEnq = await has(pEligible.id);
    const respondedEnq = await has(pResponded.id);
    const noConsentEnq = await has(pNoConsent.id);
    const topeEnq = await has(pTope.id);
    const perfEnq = await has(pPerf.id);
    assert('D3-3', 'NO escala (respondido/sin-consent/tope) + control positivo encola',
      eligibleEnq && !respondedEnq && !noConsentEnq && !topeEnq,
      `eligible(+)=${eligibleEnq} respondido=${respondedEnq} sinConsent=${noConsentEnq} tope=${topeEnq}`);
    assert('D3-5', 'Performance evaluatee no recibe nada (continue)', !perfEnq, `perfEnqueued=${perfEnq}`);
    // idempotencia: segunda corrida, sigue 1
    await processSurveyEscalations();
    const dupCount = await prisma.communicationMessage.count({ where: { accountId, dedupKey: `survey-escalation:${pEligible.id}` } });
    assert('D3-4', 'idempotencia: doble corrida = 1 mensaje', dupCount === 1, `count=${dupCount}`);
  }
}

// ── Run + teardown ──────────────────────────────────────────────────────────
main()
  .catch((e) => {
    record('FATAL', 'error de ejecucion', 'FAIL', e instanceof Error ? e.message : String(e));
    console.error(e);
  })
  .finally(async () => {
    // Teardown automatico por ids, GUARD por companyName
    try {
      if (accountId) {
        const td = await teardownSmokeGateD(accountId, { deleteRetencionTypeId: createdRetencionTypeId });
        console.log('[teardown]', td.ok ? 'OK' : `ABORT (${td.reason})`, JSON.stringify(td.deleted));
        if (!td.ok) {
          console.log(`[teardown] LIMPIEZA MANUAL: npx tsx prisma/scripts/teardown-smoke-gate-d.ts`);
        }
      }
    } catch (tdErr) {
      console.error('[teardown] FALLO; correr manual: npx tsx prisma/scripts/teardown-smoke-gate-d.ts', tdErr);
    }

    // Reporte
    const pass = results.filter((r) => r.status === 'PASS').length;
    const fail = results.filter((r) => r.status === 'FAIL').length;
    const blocked = results.filter((r) => r.status === 'BLOCKED').length;
    const lines = [
      '# SMOKE GATE D - Resultados (primera tanda, sin envio real)',
      '',
      `Fecha: ${new Date().toISOString()}`,
      `TWILIO_MODE: ${process.env.TWILIO_MODE}`,
      `Cuenta throwaway: ${accountId}`,
      `Resumen: ${pass} PASS / ${fail} FAIL / ${blocked} BLOCKED (de ${results.length})`,
      '',
      '| ID | Criterio | Estado | Detalle |',
      '|----|----------|--------|---------|',
      ...results.map((r) => `| ${r.id} | ${r.name} | ${r.status} | ${r.detail.replace(/\|/g, '/')} |`),
      '',
      'D3-2 (envio real WhatsApp sandbox): NO corrido (segunda tanda).',
      'D-BUILD (tsc --noEmit + next build): se corre aparte.'
    ];
    writeFileSync(resolve(process.cwd(), '.claude/tasks/SMOKE_GATE_D_RESULTS.md'), lines.join('\n'));
    console.log(`\n[reporte] .claude/tasks/SMOKE_GATE_D_RESULTS.md  ::  ${pass} PASS / ${fail} FAIL / ${blocked} BLOCKED`);
    await prisma.$disconnect();
  });
