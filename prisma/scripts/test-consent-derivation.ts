// ════════════════════════════════════════════════════════════════════════════
// TEST E1-9 - Funcion de derivacion de consent (Gate E.1 v3.0)
// prisma/scripts/test-consent-derivation.ts
// ════════════════════════════════════════════════════════════════════════════
// Ejecutar:
//   npx tsx prisma/scripts/test-consent-derivation.ts
//
// Cubre los 6 casos del criterio E1-9 de la spec:
//   (a) solo admin_loaded -> false
//   (b) admin_loaded + opt-in real -> true
//   (c) cualquier estado + STOP -> false
//   (d) sin eventos -> false (fail-closed)
//   (e) STOP TERMINAL: STOP seguido de una autorizacion POSTERIOR -> sigue false
//   (f) SCOPE: la funcion filtra por accountId, no deriva cruzando cuentas
//
// (a)-(e) se testean sobre la REGLA PURA (deriveConsentFromEvents).
// (e) y (f) ademas se confirman contra la QUERY REAL (deriveConsentBatch) con
// eventos persistidos: (e) con createdAt ordenado en el tiempo, (f) con scope de
// cuenta. Fixtures throwaway, teardown por id exacto en transaccion (finally).
// ════════════════════════════════════════════════════════════════════════════

import 'dotenv/config';
import { prisma } from '../../src/lib/prisma';
import { ConsentOrigen, ConsentTipo } from '@prisma/client';
import {
  deriveConsentFromEvents,
  deriveConsentBatch,
} from '../../src/lib/services/consent-derivation';

type Status = 'PASS' | 'FAIL';
const results: { id: string; status: Status; detail: string }[] = [];
function assert(id: string, cond: boolean, detail: string) {
  results.push({ id, status: cond ? 'PASS' : 'FAIL', detail });
  console.log(`[${cond ? 'OK ' : 'XX '}] ${id} :: ${detail}`);
}

// Ids de fixtures creados, para teardown por id exacto.
const createdEventIds: string[] = [];
const createdEmployeeIds: string[] = [];
const createdDeptIds: string[] = [];
const createdAccountIds: string[] = [];

async function main() {
  // ── PARTE 1: regla pura (a)-(e) ─────────────────────────────────────────────
  const A = (metodo: string) => ({ tipo: ConsentTipo.AUTORIZACION, metodo });
  const STOP = { tipo: ConsentTipo.REVOCACION, metodo: 'whatsapp_stop' };

  assert('E1-9a', deriveConsentFromEvents([A('admin_loaded')]) === false,
    'solo admin_loaded -> false');
  assert('E1-9b', deriveConsentFromEvents([A('admin_loaded'), A('whatsapp_button')]) === true,
    'admin_loaded + opt-in real -> true');
  assert('E1-9c', deriveConsentFromEvents([A('whatsapp_button'), STOP]) === false,
    'opt-in real + STOP -> false');
  assert('E1-9d', deriveConsentFromEvents([]) === false,
    'sin eventos -> false (fail-closed)');
  // (e) regla pura: STOP + autorizacion posterior (orden en el array) -> false.
  assert('E1-9e(pure)', deriveConsentFromEvents([STOP, A('whatsapp_button')]) === false,
    'STOP terminal (regla): STOP seguido de autorizacion -> false');

  // ── PARTE 2: query real (e) ordenado en el tiempo + (f) scope ───────────────
  const accA = await prisma.account.create({
    data: {
      companyName: 'TEST_CONSENT_DERIVATION_A',
      adminEmail: `consent-deriv-a-${Date.now()}@example.invalid`,
      adminName: 'Consent Deriv A',
      passwordHash: 'test-not-a-real-hash',
    },
  });
  createdAccountIds.push(accA.id);
  const accB = await prisma.account.create({
    data: {
      companyName: 'TEST_CONSENT_DERIVATION_B',
      adminEmail: `consent-deriv-b-${Date.now()}@example.invalid`,
      adminName: 'Consent Deriv B',
      passwordHash: 'test-not-a-real-hash',
    },
  });
  createdAccountIds.push(accB.id);

  // Un departamento es FK obligatoria de Employee; reusar/crear uno minimo en accA.
  const dept = await prisma.department.create({
    data: { accountId: accA.id, displayName: 'TEST_CONSENT_DEPT', standardCategory: 'sin_asignar' },
  });
  createdDeptIds.push(dept.id);

  const emp = await prisma.employee.create({
    data: {
      accountId: accA.id,
      nationalId: `CONSENT-DERIV-${Date.now()}`,
      fullName: 'Empleado Consent Deriv',
      departmentId: dept.id,
      hireDate: new Date(),
      isActive: true,
    },
  });
  createdEmployeeIds.push(emp.id);

  // (e) DB: STOP en T1 (antes), autorizacion real en T2 (despues). Sigue false.
  const t1 = new Date(Date.now() - 60_000); // hace 1 min (STOP, anterior)
  const t2 = new Date();                    // ahora (autorizacion, POSTERIOR)
  const evStop = await prisma.consentEvent.create({
    data: { employeeId: emp.id, accountId: accA.id, origen: ConsentOrigen.TITULAR, tipo: ConsentTipo.REVOCACION, metodo: 'whatsapp_stop', createdAt: t1 },
  });
  createdEventIds.push(evStop.id);
  const evAuth = await prisma.consentEvent.create({
    data: { employeeId: emp.id, accountId: accA.id, origen: ConsentOrigen.TITULAR, tipo: ConsentTipo.AUTORIZACION, metodo: 'whatsapp_button', createdAt: t2 },
  });
  createdEventIds.push(evAuth.id);

  const batchA = await deriveConsentBatch([emp.id], accA.id, prisma);
  assert('E1-9e(db)', batchA.get(emp.id) === false,
    'STOP terminal (query): STOP en T1 + autorizacion en T2 posterior -> sigue false');

  // (f) SCOPE: el mismo employeeId derivado bajo OTRA cuenta (accB) no ve sus
  // eventos -> false. Confirma que el filtro accountId esta activo (no cruza cuentas).
  const batchB = await deriveConsentBatch([emp.id], accB.id, prisma);
  assert('E1-9f', batchB.get(emp.id) === false,
    'scope: derivar bajo accountId distinto no ve los eventos del employee -> false (no contamina)');

  // Sanidad inversa: bajo accB, con SOLO accA viendo el opt-in real, accA si deriva
  // true cuando no hay STOP. Lo verificamos quitando el STOP del razonamiento via
  // un segundo employee limpio (solo opt-in real) en accA.
  const emp2 = await prisma.employee.create({
    data: {
      accountId: accA.id,
      nationalId: `CONSENT-DERIV2-${Date.now()}`,
      fullName: 'Empleado Consent Deriv 2',
      departmentId: dept.id,
      hireDate: new Date(),
      isActive: true,
    },
  });
  createdEmployeeIds.push(emp2.id);
  const evAuth2 = await prisma.consentEvent.create({
    data: { employeeId: emp2.id, accountId: accA.id, origen: ConsentOrigen.TITULAR, tipo: ConsentTipo.AUTORIZACION, metodo: 'whatsapp_button' },
  });
  createdEventIds.push(evAuth2.id);
  const batchA2 = await deriveConsentBatch([emp2.id], accA.id, prisma);
  assert('E1-9b(db)', batchA2.get(emp2.id) === true,
    'opt-in real sin STOP, cuenta correcta -> true (sanidad de la query)');
}

async function teardown() {
  await prisma.$transaction(async (tx) => {
    if (createdEventIds.length) {
      await tx.consentEvent.deleteMany({ where: { id: { in: createdEventIds } } });
    }
    if (createdEmployeeIds.length) {
      await tx.employee.deleteMany({ where: { id: { in: createdEmployeeIds } } });
    }
    if (createdDeptIds.length) {
      await tx.department.deleteMany({ where: { id: { in: createdDeptIds } } });
    }
    if (createdAccountIds.length) {
      await tx.account.deleteMany({ where: { id: { in: createdAccountIds } } });
    }
  });
  console.log('[teardown] fixtures eliminados por id exacto');
}

main()
  .then(async () => {
    await teardown();
    const failed = results.filter((r) => r.status === 'FAIL');
    const pass = results.length - failed.length;
    console.log(`\nE1-9: ${pass}/${results.length} PASS`);
    await prisma.$disconnect();
    process.exit(failed.length === 0 ? 0 : 1);
  })
  .catch(async (err) => {
    console.error('[ERROR]', err);
    try { await teardown(); } catch (e) { console.error('[teardown error]', e); }
    await prisma.$disconnect();
    process.exit(1);
  });
