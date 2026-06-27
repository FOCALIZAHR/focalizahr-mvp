// ════════════════════════════════════════════════════════════════════════════
// UNIT TEST - resolvePhone (funcion pura) - Gate B v3.0
// scripts/test-resolve-phone.ts
// ════════════════════════════════════════════════════════════════════════════
// Ejecutar: npx tsx scripts/test-resolve-phone.ts
//
// Prueba la funcion pura resolvePhone sin BD (el contexto se arma a mano). Cubre
// las 4 estrategias y, criticamente, el invariante de seguridad B5: en Performance
// el telefono SIEMPRE sale del evaluador (via evaluationAssignmentId) y NUNCA cae a
// Estrategia 3 (nationalId = evaluado).
// ════════════════════════════════════════════════════════════════════════════

import {
  resolvePhone,
  type PhoneResolutionContext,
  type ParticipantForPhone,
} from '../src/lib/services/resolvePhone';

let passed = 0;
let failed = 0;

function assertEq(label: string, actual: unknown, expected: unknown): void {
  if (actual === expected) {
    passed++;
    console.log(`  PASS  ${label}  (=> ${JSON.stringify(actual)})`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}  esperado ${JSON.stringify(expected)}, obtuvo ${JSON.stringify(actual)}`);
  }
}

function emptyCtx(): PhoneResolutionContext {
  return {
    employeeById: new Map(),
    employeeByNationalId: new Map(),
    evaluatorByAssignmentId: new Map(),
  };
}

function emp(phoneNumber: string | null) {
  return {
    id: 'emp-test-id',
    phoneNumber,
    personalEmail: null,
    preferredChannel: null,
  };
}

function participant(overrides: Partial<ParticipantForPhone>): ParticipantForPhone {
  return {
    id: 'p1',
    phoneNumber: null,
    nationalId: '11111111-1',
    employeeId: null,
    evaluationAssignmentId: null,
    ...overrides,
  };
}

console.log('\n=== resolvePhone unit test (Gate B) ===\n');

// Estrategia 1: telefono propio del Participant gana.
{
  const ctx = emptyCtx();
  ctx.employeeById.set('e1', emp('+56988888888'));
  const r = resolvePhone(
    participant({ phoneNumber: '+56911111111', employeeId: 'e1' }),
    ctx
  );
  assertEq('E1: Participant.phoneNumber gana sobre Employee', r, '+56911111111');
}

// Estrategia 2: join por employeeId cuando no hay phone propio.
{
  const ctx = emptyCtx();
  ctx.employeeById.set('e1', emp('+56922222222'));
  const r = resolvePhone(participant({ employeeId: 'e1' }), ctx);
  assertEq('E2: Employee.phoneNumber via employeeId', r, '+56922222222');
}

// Estrategia 3: correlacion por nationalId cuando no hay phone ni employeeId.
{
  const ctx = emptyCtx();
  ctx.employeeByNationalId.set('11111111-1', emp('+56933333333'));
  const r = resolvePhone(participant({ nationalId: '11111111-1' }), ctx);
  assertEq('E3: Employee.phoneNumber via nationalId', r, '+56933333333');
}

// Sin ningun dato -> null.
{
  const r = resolvePhone(participant({}), emptyCtx());
  assertEq('Sin contacto -> null', r, null);
}

// Estrategia 2b: Performance resuelve por evaluador (assignment).
{
  const ctx = emptyCtx();
  ctx.evaluatorByAssignmentId.set('a1', '+56944444444');
  const r = resolvePhone(
    participant({ evaluationAssignmentId: 'a1', nationalId: '99999999-9' }),
    ctx
  );
  assertEq('E2b: Performance via evaluationAssignmentId -> evaluador', r, '+56944444444');
}

// ════════════════════════════════════════════════════════════════════════════
// B5 - INVARIANTE DE SEGURIDAD CRITICO
// Performance con nationalId mapeado al EVALUADO en employeeByNationalId. Aun asi,
// resolvePhone NUNCA debe devolver ese telefono: debe ir SOLO por el evaluador.
// Si el evaluador no tiene telefono, el resultado es null, JAMAS el del evaluado.
// ════════════════════════════════════════════════════════════════════════════
{
  const ctx = emptyCtx();
  // Trampa: el evaluado (nationalId) SI tiene telefono en el master.
  ctx.employeeByNationalId.set('22222222-2', emp('+56900000000')); // telefono del EVALUADO
  // El assignment del evaluador NO tiene telefono.
  ctx.evaluatorByAssignmentId.set('a2', null);

  const r = resolvePhone(
    participant({ evaluationAssignmentId: 'a2', nationalId: '22222222-2' }),
    ctx
  );
  assertEq(
    'B5: Performance NUNCA cae a Estrategia 3 (no devuelve telefono del evaluado)',
    r,
    null
  );
}

// B5 refuerzo: con evaluador valido, gana el evaluador aunque el evaluado tenga otro.
{
  const ctx = emptyCtx();
  ctx.employeeByNationalId.set('22222222-2', emp('+56900000000')); // EVALUADO
  ctx.evaluatorByAssignmentId.set('a3', '+56955555555');           // EVALUADOR
  const r = resolvePhone(
    participant({ evaluationAssignmentId: 'a3', nationalId: '22222222-2' }),
    ctx
  );
  assertEq('B5: gana el evaluador, no el evaluado', r, '+56955555555');
}

console.log(`\n=== Resultado: ${passed} PASS, ${failed} FAIL ===\n`);

if (failed > 0) {
  process.exit(1);
}
