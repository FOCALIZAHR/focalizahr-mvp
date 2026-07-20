// prisma/scripts/smoke-vitals-gateC.ts
// ════════════════════════════════════════════════════════════════════════════
// Smoke Gate C — router por rol, round-trip HTTP REAL contra el dev server.
//
// METODO: tokens ACUNADOS por rol con generateJWT (src/lib/auth.ts:71),
// replicando el shape de payload de api/auth/user/login/route.ts:132-150.
// NO headers forjados.
//
// Por que: se verifico empiricamente en Gate C que con un token moderno el
// middleware SOBRESCRIBE cualquier x-user-role que mande el cliente
// (middleware.ts:208). Un smoke por headers forjados mediria la sobrescritura
// del middleware, no el rol. Acunar el token es lo unico equivalente a un
// login real.
//
// PRERREQUISITO: dev server corriendo en :3000.
// SOLO LECTURA. Cero escritura a BD. El token nunca se imprime.
//
// Uso: npx tsx prisma/scripts/smoke-vitals-gateC.ts
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '../../src/lib/prisma';
import { generateJWT } from '../../src/lib/auth';

const BASE = 'http://localhost:3000';
const ACCOUNT = 'cmfgedx7b00012413i92048wl';
const API = '/api/vitals/summary';
const PAGE = '/dashboard/inicio';

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

interface Ctx {
  companyName: string;
  subscriptionTier: string;
}

/** Payload identico al del login real. Solo cambian los 4 campos de identidad. */
function mintToken(
  ctx: Ctx,
  o: { userId: string; userEmail: string; userRole: string; departmentId: string | null }
): string {
  return generateJWT({
    userId: o.userId,
    userEmail: o.userEmail,
    userName: `smoke-${o.userRole}`,
    userRole: o.userRole,
    departmentId: o.departmentId,
    id: ACCOUNT,
    accountId: ACCOUNT,
    adminEmail: o.userEmail,
    adminName: `smoke-${o.userRole}`,
    companyName: ctx.companyName,
    subscriptionTier: ctx.subscriptionTier,
    role: o.userRole === 'FOCALIZAHR_ADMIN' ? 'FOCALIZAHR_ADMIN' : 'CLIENT',
  } as any);
}

/**
 * Extrae el digest de redirect del flight payload RSC.
 * Formato: NEXT_REDIRECT;replace;<destino>;<status>;
 * Devuelve null si la respuesta no contiene ningun redirect.
 */
function extractRedirectDigest(html: string): string | null {
  const m = html.match(/NEXT_REDIRECT;[^\\"]*/);
  return m ? m[0] : null;
}

async function get(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { cookie: `focalizahr_token=${token}` },
    redirect: 'manual',
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* HTML de pagina, no JSON */
  }
  return { status: res.status, location: res.headers.get('location'), json, text };
}

async function main() {
  console.log('SMOKE GATE C — router por rol (round-trip HTTP real)\n');

  // ── Prerrequisito: dev server ──────────────────────────────────────────
  try {
    await fetch(`${BASE}/login`, { signal: AbortSignal.timeout(5000) });
  } catch {
    console.error(`ERROR: no hay dev server respondiendo en ${BASE}.`);
    console.error('Gate C requiere round-trip HTTP real. Levanta el dev server y reintenta.');
    process.exitCode = 1;
    return;
  }

  const account = await prisma.account.findUnique({
    where: { id: ACCOUNT },
    select: { companyName: true, subscriptionTier: true },
  });
  if (!account) {
    console.error('No se encontro la cuenta de prueba.');
    process.exitCode = 1;
    return;
  }
  const ctx: Ctx = {
    companyName: account.companyName,
    subscriptionTier: account.subscriptionTier ?? 'professional',
  };

  // Usuarios reales por rol, cuando existen.
  const reales = await prisma.user.findMany({
    where: { accountId: ACCOUNT },
    select: { id: true, email: true, role: true, departmentId: true },
  });
  const realDe = (role: string) => reales.find((u) => u.role === role) ?? null;

  // ── Escenarios 1 a 5: roles globales ───────────────────────────────────
  console.log('=== Escenarios 1-5 — roles globales → 200 con datos ===');
  const GLOBALES = [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO',
  ];

  let deptosGlobal = 0;

  for (const [i, role] of GLOBALES.entries()) {
    const real = realDe(role);
    const token = mintToken(ctx, {
      userId: real?.id ?? `smoke-synthetic-${role}`,
      userEmail: real?.email ?? `smoke-${role.toLowerCase()}@test.local`,
      userRole: role,
      departmentId: null,
    });
    const r = await get(API, token);
    const n = r.json?.data?.coverage?.totalDepartments ?? -1;
    const scope = r.json?.data?.scope;

    check(`${i + 1}. ${role} → 200`, r.status === 200, `status=${r.status}`);
    check(`${i + 1}b. ${role} → scope organization con datos`,
      scope === 'organization' && n > 0, `scope=${scope} deptos=${n}`);

    if (n > deptosGlobal) deptosGlobal = n;
    if (!real) console.log(`      (token sintetico: no existe usuario ${role} en la cuenta)`);
  }
  console.log(`  info  universo global = ${deptosGlobal} deptos`);

  // ── Escenario 6: AREA_MANAGER con departamento real ────────────────────
  console.log('\n=== Escenario 6 — AREA_MANAGER con depto → scope acotado ===');
  const am = reales.find((u) => u.role === 'AREA_MANAGER' && u.departmentId);

  if (!am?.departmentId) {
    check('6. AREA_MANAGER con depto disponible en la cuenta', false, 'no hay ninguno');
  } else {
    const token = mintToken(ctx, {
      userId: am.id,
      userEmail: am.email,
      userRole: 'AREA_MANAGER',
      departmentId: am.departmentId,
    });
    const r = await get(API, token);
    const data = r.json?.data;
    const devueltos: string[] = (data?.departments ?? []).map((d: any) => d.departmentId);

    check('6. AREA_MANAGER con depto → 200', r.status === 200, `status=${r.status}`);
    check('6b. scope = area', data?.scope === 'area', `scope=${data?.scope}`);

    // Territorio legitimo: su depto + descendientes (mismo CTE que usa la API).
    const hijos = await prisma.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE dept_tree AS (
        SELECT id, 0 as depth FROM departments WHERE parent_id = ${am.departmentId}
        UNION ALL
        SELECT d.id, dt.depth + 1 FROM departments d
        JOIN dept_tree dt ON d.parent_id = dt.id WHERE dt.depth < 3
      ) SELECT id FROM dept_tree
    `;
    const territorio = new Set<string>([am.departmentId, ...hijos.map((h) => h.id)]);

    // ── Los TRES asserts explicitos (blindaje anti fail-open) ────────────
    // 1. Tiene acceso a algo (no es un 200 vacio disfrazado de exito).
    check('6c. ASSERT deptos devueltos > 0 (tiene acceso a su territorio)',
      devueltos.length > 0, `devueltos=${devueltos.length}`);

    // 2. NO ve toda la cuenta (el fail-open clasico devuelve el universo).
    check(`6d. ASSERT deptos devueltos < ${deptosGlobal} (NO ve toda la cuenta)`,
      devueltos.length < deptosGlobal, `devueltos=${devueltos.length} vs global=${deptosGlobal}`);

    // 3. TODOS dentro del territorio (ni uno fuera).
    const fuera = devueltos.filter((id) => !territorio.has(id));
    check('6e. ASSERT todos los deptos devueltos estan DENTRO del territorio',
      fuera.length === 0, `fuera del territorio: ${fuera.join(', ')}`);

    console.log(`  info  ${am.email}: ${devueltos.length}/${deptosGlobal} deptos · territorio=${territorio.size}`);
  }

  // ── Escenario 7: AREA_MANAGER sin departamento ─────────────────────────
  console.log('\n=== Escenario 7 — AREA_MANAGER sin depto → 403 fail-closed ===');
  const tokenSinDepto = mintToken(ctx, {
    userId: 'smoke-synthetic-AREA_MANAGER-sin-depto',
    userEmail: 'smoke-am-sin-depto@test.local',
    userRole: 'AREA_MANAGER',
    departmentId: null, // middleware.ts:209 lo inyecta como string vacio
  });
  const r7 = await get(API, tokenSinDepto);
  check('7. AREA_MANAGER sin depto → 403', r7.status === 403, `status=${r7.status}`);
  check('7b. code = AREA_MANAGER_SIN_DEPARTAMENTO',
    r7.json?.code === 'AREA_MANAGER_SIN_DEPARTAMENTO', JSON.stringify(r7.json));
  check('7c. NO devuelve datos de la cuenta',
    r7.json?.data === undefined, JSON.stringify(r7.json).slice(0, 120));

  // ── Escenario 8: HR_OPERATOR redirigido por la PAGE ────────────────────
  //
  // NOTA: aserción temporal sobre el digest interno de Next.js.
  // El redirect server-side se degrada a redirect de cliente porque
  // src/app/dashboard/layout.tsx es 'use client' y bloquea children
  // hasta validar localStorage. Cuando esa deuda del layout se
  // resuelva (proyecto de auth-modernización), este assert se
  // reemplaza por: assert response.status === 307 && Location
  // header === '/dashboard'. Ver MAESTRO_HOME_SIGNOS_VITALES §deudas.
  //
  console.log('\n=== Escenario 8 — HR_OPERATOR → redirect emitido server-side ===');
  const tokenOperator = mintToken(ctx, {
    userId: 'smoke-synthetic-HR_OPERATOR',
    userEmail: 'smoke-hr-operator@test.local',
    userRole: 'HR_OPERATOR',
    departmentId: null,
  });
  const r8 = await get(PAGE, tokenOperator);
  const digest = extractRedirectDigest(r8.text);
  // Formato: NEXT_REDIRECT;replace;<destino>;<status>;
  const partes = digest ? digest.split(';') : [];

  check('8. digest contiene NEXT_REDIRECT',
    partes[0] === 'NEXT_REDIRECT', `digest=${digest ?? '(ninguno)'}`);
  // Igualdad exacta: no debe pasar por coincidencia con /dashboard/inicio
  // ni con cualquier otra ruta que empiece igual.
  check('8b. destino del redirect === "/dashboard" (igualdad, no substring)',
    partes[2] === '/dashboard', `destino=${partes[2] ?? '(ninguno)'}`);
  // Delimitado: no debe pasar con 3070 ni 1307.
  check('8c. status del redirect === "307"',
    partes[3] === '307', `status=${partes[3] ?? '(ninguno)'}`);
  console.log('      (token sintetico: no existe usuario HR_OPERATOR en la cuenta)');
  console.log(`      digest completo: ${digest ?? '(ninguno)'}`);

  // ── Paridad: el redirect es ANGOSTO, no se comio a los demas ───────────
  console.log('\n=== Paridad — el redirect no afecta a otros roles ===');
  const ceo = realDe('CEO');
  const tokenCeo = mintToken(ctx, {
    userId: ceo?.id ?? 'smoke-synthetic-CEO',
    userEmail: ceo?.email ?? 'smoke-ceo@test.local',
    userRole: 'CEO',
    departmentId: null,
  });
  const r8d = await get(PAGE, tokenCeo);
  check('8d. GET /dashboard/inicio con CEO → 200',
    r8d.status === 200, `status=${r8d.status}`);
  // Mismo razonamiento que el escenario 8: se verifica AUSENCIA del digest,
  // no el HTML del <body>. El HTML de la portada no es observable server-side
  // mientras el layout bloquee children.
  check('8e. CEO NO recibe redirect (sin digest NEXT_REDIRECT en el payload)',
    extractRedirectDigest(r8d.text) === null,
    `digest=${extractRedirectDigest(r8d.text) ?? '(ninguno)'}`);

  // ── EVALUATOR: NO se ejecuta ───────────────────────────────────────────
  console.log('\n=== EVALUATOR — NO ejecutado ===');
  console.log('  skip  cubierto por middleware.ts:252 (redirige a /dashboard/evaluaciones).');
  console.log('        Validar el middleware no es responsabilidad de Gate C.');

  console.log(`\n──────────────────────────────────\nRESULTADO: ${passed} PASS · ${failed} FAIL`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
