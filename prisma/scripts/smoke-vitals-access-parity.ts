// prisma/scripts/smoke-vitals-access-parity.ts
// ════════════════════════════════════════════════════════════════════════════
// Smoke de PARIDAD del refactor resolveVitalsAccess (preparacion Gate B).
//
// Verifica que la regla extraida se comporta IDENTICO a la que estaba inline en
// route.ts (Gate A): mismos status, mismos mensajes, mismo code, mismo scope.
// No inventa casos nuevos: replica exactamente las ramas que el endpoint tenia.
//
// SOLO LECTURA. Cero escritura a BD (getChildDepartmentIds hace SELECT).
//
// Uso: npx tsx prisma/scripts/smoke-vitals-access-parity.ts
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '../../src/lib/prisma';
import { resolveVitalsAccess } from '../../src/lib/services/vitals/resolveVitalsAccess';

const ACCOUNT = 'cmfgedx7b00012413i92048wl';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/** Simula los headers que inyecta el middleware. */
function headers(h: Record<string, string>) {
  return (name: string) => h[name] ?? null;
}

async function main() {
  console.log('SMOKE PARIDAD — resolveVitalsAccess\n');

  // ── Rama 1: sin accountId → 401 'No autorizado' ────────────────────────
  const noAccount = await resolveVitalsAccess(headers({ 'x-user-role': 'CEO' }));
  check('1. sin accountId → 401 "No autorizado"',
    !noAccount.ok && noAccount.status === 401 && noAccount.error === 'No autorizado',
    JSON.stringify(noAccount));

  // ── Rama 2: sin permiso → 403 'Sin permisos' ───────────────────────────
  for (const role of ['HR_OPERATOR', 'EVALUATOR', 'VIEWER', 'CLIENT']) {
    const denied = await resolveVitalsAccess(
      headers({ 'x-account-id': ACCOUNT, 'x-user-role': role })
    );
    check(`2. ${role} → 403 "Sin permisos"`,
      !denied.ok && denied.status === 403 && denied.error === 'Sin permisos',
      JSON.stringify(denied));
  }

  // Rol ausente (token Account legacy: middleware.ts:206 no setea x-user-role)
  const noRole = await resolveVitalsAccess(headers({ 'x-account-id': ACCOUNT }));
  check('2. rol ausente (token legacy) → 403 fail-closed',
    !noRole.ok && noRole.status === 403,
    JSON.stringify(noRole));

  // ── Rama 3: roles globales → scope null (toda la cuenta) ───────────────
  for (const role of ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'CEO']) {
    const ok = await resolveVitalsAccess(
      headers({ 'x-account-id': ACCOUNT, 'x-user-role': role })
    );
    check(`3. ${role} → acceso con departmentIds null`,
      ok.ok && ok.departmentIds === null && ok.accountId === ACCOUNT,
      JSON.stringify(ok));
  }

  // ── Rama 4: AREA_MANAGER sin departamento → 403 con code ───────────────
  const EXPECTED_ERROR =
    'Tu acceso no tiene departamento asignado. Contacta a tu administrador.';

  // 4a. header ausente
  const amMissing = await resolveVitalsAccess(
    headers({ 'x-account-id': ACCOUNT, 'x-user-role': 'AREA_MANAGER' })
  );
  check('4a. AREA_MANAGER sin header de depto → 403 + code',
    !amMissing.ok && amMissing.status === 403
      && amMissing.error === EXPECTED_ERROR
      && amMissing.code === 'AREA_MANAGER_SIN_DEPARTAMENTO',
    JSON.stringify(amMissing));

  // 4b. STRING VACIO — el caso real que produce el middleware (payload.departmentId || '')
  const amEmpty = await resolveVitalsAccess(
    headers({ 'x-account-id': ACCOUNT, 'x-user-role': 'AREA_MANAGER', 'x-department-id': '' })
  );
  check('4b. AREA_MANAGER con depto = string vacio → 403 + code (NO acceso total)',
    !amEmpty.ok && amEmpty.status === 403
      && amEmpty.error === EXPECTED_ERROR
      && amEmpty.code === 'AREA_MANAGER_SIN_DEPARTAMENTO',
    JSON.stringify(amEmpty));

  // ── Rama 5: AREA_MANAGER con departamento → scope acotado ──────────────
  const am = await prisma.user.findFirst({
    where: { accountId: ACCOUNT, role: 'AREA_MANAGER', departmentId: { not: null } },
    select: { email: true, departmentId: true },
  });

  if (am?.departmentId) {
    const scoped = await resolveVitalsAccess(
      headers({
        'x-account-id': ACCOUNT,
        'x-user-role': 'AREA_MANAGER',
        'x-department-id': am.departmentId,
      })
    );
    check('5. AREA_MANAGER con depto → scope acotado, incluye su propio depto',
      scoped.ok
        && Array.isArray(scoped.departmentIds)
        && scoped.departmentIds.includes(am.departmentId),
      JSON.stringify(scoped));
    check('5b. scope NO es null (jamas cae a toda la cuenta)',
      scoped.ok && scoped.departmentIds !== null);
    console.log(`  info  ${am.email}: ${(scoped as any).departmentIds?.length} deptos en scope`);
  } else {
    console.log('  skip  no hay AREA_MANAGER con departmentId en la cuenta');
  }

  console.log(`\n──────────────────────────────────\nPARIDAD: ${passed} PASS · ${failed} FAIL`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
