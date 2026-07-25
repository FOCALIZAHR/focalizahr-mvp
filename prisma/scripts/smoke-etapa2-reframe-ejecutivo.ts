// ════════════════════════════════════════════════════════════════════════════
// SMOKE — Etapa 2 reframe scope ejecutivo-tier (sitios 1-4, 6-7)
// Invoca los handlers GET reales con headers de rol forjados + email fantasma
// (sin fila Employee) = el caso ejecutivo/holding que el fix arregla.
// Read-only: solo GET. Ejecutar: npx tsx prisma/scripts/smoke-etapa2-reframe-ejecutivo.ts
// UNTRACKED — verificación puntual, no se versiona.
// ════════════════════════════════════════════════════════════════════════════
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET as GET_pdi } from '@/app/api/pdi/[id]/route';
import { GET as GET_pdilist } from '@/app/api/pdi/route';
import { GET as GET_succession } from '@/app/api/employees/[id]/succession-plan/route';

const ACC = 'cmfgedx7b00012413i92048wl';
const PDI_ID = 'cmlpij28q0016vrytqqohk0jv';
const PDI_EMP_ID = 'cmktf2zfi0071vvgxxvb0i82z'; // employeeId dueño del PDI de arriba
const SUCC_EMP_ID = 'cmkrlxw8i0003c6q5amursr0o'; // maria (empleado real de la cuenta)
const GHOST = 'ghost-exec-no-employee@focalizahr.cl';

function req(url: string, headers: Record<string, string>) {
  return new NextRequest(new URL(url), { headers: new Headers(headers) });
}
function hdr(role: string, opts: { dept?: string } = {}) {
  const h: Record<string, string> = {
    'x-account-id': ACC,
    'x-user-role': role,
    'x-user-email': GHOST,
    'x-user-id': 'smoke-user',
  };
  if (opts.dept) h['x-department-id'] = opts.dept;
  return h;
}

async function main() {
  const checks: { name: string; ok: boolean; detail: string }[] = [];
  const assert = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

  // Precondición: el email fantasma NO tiene fila Employee (si la tuviera, el test no prueba nada)
  const ghostEmp = await prisma.employee.findFirst({ where: { accountId: ACC, email: GHOST }, select: { id: true } });
  assert('precondición: email fantasma sin Employee', ghostEmp === null, `ghostEmp=${JSON.stringify(ghostEmp)}`);

  // ── pdi/[id] GET ──────────────────────────────────────────────────────────
  // A) CEO (global) sin fila Employee → antes 404 "Empleado no encontrado"; ahora 200 (FIX)
  {
    const res = await GET_pdi(req(`http://localhost/api/pdi/${PDI_ID}`, hdr('CEO')), { params: Promise.resolve({ id: PDI_ID }) });
    const body = await res.json();
    assert('pdi/[id] GET · CEO/ghost → 200 (FIX)', res.status === 200, `status=${res.status} err=${body?.error ?? '—'}`);
  }
  // B) AREA_MANAGER sin fila Employee → sigue denegado (404, no es global)
  {
    const res = await GET_pdi(req(`http://localhost/api/pdi/${PDI_ID}`, hdr('AREA_MANAGER', { dept: 'zzz-none' })), { params: Promise.resolve({ id: PDI_ID }) });
    const body = await res.json();
    assert('pdi/[id] GET · AREA_MANAGER/ghost → denegado (404)', res.status === 404, `status=${res.status} err=${body?.error ?? '—'}`);
  }

  // ── employees/[id]/succession-plan GET (fix del array que omitía HR_MANAGER) ──
  // D) HR_MANAGER sin fila Employee → antes 404 (array omitía HR_MANAGER + sin Employee); ahora 200 (FIX)
  {
    const res = await GET_succession(req(`http://localhost/api/employees/${SUCC_EMP_ID}/succession-plan`, hdr('HR_MANAGER')), { params: Promise.resolve({ id: SUCC_EMP_ID }) });
    const body = await res.json();
    assert('succession-plan GET · HR_MANAGER/ghost → 200 (FIX array)', res.status === 200, `status=${res.status} err=${body?.error ?? '—'}`);
  }
  // E) AREA_MANAGER sin fila Employee → sigue denegado (404)
  {
    const res = await GET_succession(req(`http://localhost/api/employees/${SUCC_EMP_ID}/succession-plan`, hdr('AREA_MANAGER', { dept: 'zzz-none' })), { params: Promise.resolve({ id: SUCC_EMP_ID }) });
    const body = await res.json();
    assert('succession-plan GET · AREA_MANAGER/ghost → denegado (404)', res.status === 404, `status=${res.status} err=${body?.error ?? '—'}`);
  }

  // ── pdi/route.ts GET list (Sitio 5, opción a conservador) ───────────────────
  // S1) HR (employees:read) sin fila Employee + ?employeeId=X → antes vacío; ahora ve X (FIX)
  {
    const res = await GET_pdilist(req(`http://localhost/api/pdi?employeeId=${PDI_EMP_ID}`, hdr('HR_MANAGER')));
    const body = await res.json();
    assert('pdi list · HR/ghost + employeeId → 200 count>=1 (FIX)', res.status === 200 && (body?.count ?? 0) >= 1, `status=${res.status} count=${body?.count}`);
  }
  // S2) HR sin fila Employee y SIN employeeId → vacío (NO cuenta completa; garantía clave)
  {
    const res = await GET_pdilist(req(`http://localhost/api/pdi`, hdr('HR_MANAGER')));
    const body = await res.json();
    assert('pdi list · HR/ghost sin employeeId → vacío (no account-wide)', res.status === 200 && (body?.count ?? -1) === 0, `status=${res.status} count=${body?.count}`);
  }
  // S3) rol sin employees:read (EVALUATOR) sin Employee + employeeId → vacío (sin cambio)
  {
    const res = await GET_pdilist(req(`http://localhost/api/pdi?employeeId=${PDI_EMP_ID}`, hdr('EVALUATOR')));
    const body = await res.json();
    assert('pdi list · EVALUATOR/ghost + employeeId → vacío (sin cambio)', res.status === 200 && (body?.count ?? -1) === 0, `status=${res.status} count=${body?.count}`);
  }

  return checks;
}

main()
  .then(async (checks) => {
    await prisma.$disconnect();
    console.log('\n──────── RESULTADO SMOKE Etapa 2 ────────');
    let allOk = true;
    for (const c of checks) { const m = c.ok ? '✅' : '❌'; if (!c.ok) allOk = false; console.log(`${m} ${c.name} — ${c.detail}`); }
    console.log('─────────────────────────────────────────');
    console.log(allOk ? '🟢 SMOKE PASS' : '🔴 SMOKE FAIL');
    process.exit(allOk ? 0 : 1);
  })
  .catch(async (e) => { await prisma.$disconnect(); console.error('🔴 SMOKE ERROR:', e); process.exit(1); });
