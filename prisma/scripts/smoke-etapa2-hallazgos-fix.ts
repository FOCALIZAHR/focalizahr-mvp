// ════════════════════════════════════════════════════════════════════════════
// SMOKE — Corrección de los 4 hallazgos de Etapa 2 (PDI + Sucesión)
// Invoca los handlers reales. GET = read-only. El PUT se ejecuta esperando 403
// (no escribe en esa rama; además progressPercent=0 = no-op por seguridad).
// Ejecutar: npx tsx prisma/scripts/smoke-etapa2-hallazgos-fix.ts
// UNTRACKED — verificación puntual, no se versiona.
// ════════════════════════════════════════════════════════════════════════════
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET as GET_byEmployee } from '@/app/api/pdi/by-employee/route';
import { GET as GET_succession } from '@/app/api/employees/[id]/succession-plan/route';
import { PUT as PUT_progress } from '@/app/api/employees/[id]/succession-plan/progress/route';

const ACC = 'cmfgedx7b00012413i92048wl';
const PDI_EMP = 'cmktf2zfi0071vvgxxvb0i82z';   // dueño del PDI DRAFT
const PDI_CYCLE = 'cmloaagl300763xeqdn0uxsw5'; // ciclo del PDI
const MANAGER_EMAIL = 'vyanezb@gmail.com';     // jefe REAL del PDI (Employee ACTIVE)
const SUCC_EMP = 'cmktf2zz1007ovvgxd8usvc8h';  // empleado de un plan de sucesión
const PUT_EMP = 'cmlh3t0u0002z113496vw0abk';   // empleado del plan que SÍ tiene goal
const PUT_GOAL = 'cmmozetlx000fqvt0d32rlk7d';  // goal real (progressPercent=0)
const GHOST = 'ghost-exec-no-employee@focalizahr.cl';

function req(url: string, headers: Record<string, string>, body?: any) {
  return new NextRequest(new URL(url), { method: body ? 'PUT' : 'GET', headers: new Headers(headers), ...(body ? { body: JSON.stringify(body) } : {}) });
}
function hdr(role: string, email: string) {
  return { 'x-account-id': ACC, 'x-user-role': role, 'x-user-email': email, 'x-user-id': 'smoke' };
}

async function main() {
  const checks: { name: string; ok: boolean; detail: string }[] = [];
  const assert = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

  // Precondición: el email fantasma NO tiene Employee
  const ghostEmp = await prisma.employee.findFirst({ where: { accountId: ACC, email: GHOST }, select: { id: true } });
  assert('precondición: email fantasma sin Employee', ghostEmp === null, `ghostEmp=${JSON.stringify(ghostEmp)}`);

  // HALLAZGO 1 — by-employee: rol GLOBAL (CEO) con Employee real (por email) que ES el jefe
  //   → meta.isManager debe volver a true, canEdit=true (PDI DRAFT).
  {
    const res = await GET_byEmployee(req(`http://localhost/api/pdi/by-employee?employeeId=${PDI_EMP}&cycleId=${PDI_CYCLE}`, hdr('CEO', MANAGER_EMAIL)));
    const b = await res.json();
    assert('H1 · CEO(jefe real) → meta.isManager=true', res.status === 200 && b?.meta?.isManager === true, `status=${res.status} meta=${JSON.stringify(b?.meta)}`);
    assert('H1 · CEO(jefe real) → meta.canEdit=true (DRAFT)', b?.meta?.canEdit === true, `canEdit=${b?.meta?.canEdit}`);
  }

  // HALLAZGO 2b — succession GET: HR_MANAGER VE el plan de un NO-subordinado (200)
  //   pero canEditProgress=false (edita solo su equipo).
  {
    const res = await GET_succession(req(`http://localhost/api/employees/${SUCC_EMP}/succession-plan`, hdr('HR_MANAGER', GHOST)), { params: Promise.resolve({ id: SUCC_EMP }) });
    const b = await res.json();
    assert('H2b · HR_MANAGER ve plan de no-subordinado → 200', res.status === 200, `status=${res.status}`);
    assert('H2b · HR_MANAGER NO puede editar → canEditProgress=false', b?.canEditProgress === false, `canEditProgress=${b?.canEditProgress}`);
  }

  // Regresión — otros globales (CEO) SÍ editan cualquiera → canEditProgress=true
  {
    const res = await GET_succession(req(`http://localhost/api/employees/${SUCC_EMP}/succession-plan`, hdr('CEO', GHOST)), { params: Promise.resolve({ id: SUCC_EMP }) });
    const b = await res.json();
    assert('REG · CEO (global) → canEditProgress=true (edita todo)', res.status === 200 && b?.canEditProgress === true, `status=${res.status} canEditProgress=${b?.canEditProgress}`);
  }

  // HALLAZGO 3 — progress PUT: HR_MANAGER (no jefe) NO puede editar progreso → 403
  //   (rama sin escritura; progressPercent=0 = no-op de todos modos).
  {
    const res = await PUT_progress(
      req(`http://localhost/api/employees/${PUT_EMP}/succession-plan/progress`, hdr('HR_MANAGER', GHOST), { goalId: PUT_GOAL, progressPercent: 0 }),
      { params: Promise.resolve({ id: PUT_EMP }) }
    );
    const b = await res.json();
    assert('H3 · HR_MANAGER(no jefe) edita progreso → 403', res.status === 403, `status=${res.status} err=${b?.error ?? '—'}`);
  }

  return checks;
}

main()
  .then(async (checks) => {
    await prisma.$disconnect();
    console.log('\n──────── SMOKE Hallazgos Etapa 2 ────────');
    let allOk = true;
    for (const c of checks) { const m = c.ok ? '✅' : '❌'; if (!c.ok) allOk = false; console.log(`${m} ${c.name} — ${c.detail}`); }
    console.log('─────────────────────────────────────────');
    console.log(allOk ? '🟢 SMOKE PASS' : '🔴 SMOKE FAIL');
    process.exit(allOk ? 0 : 1);
  })
  .catch(async (e) => { await prisma.$disconnect(); console.error('🔴 SMOKE ERROR:', e); process.exit(1); });
