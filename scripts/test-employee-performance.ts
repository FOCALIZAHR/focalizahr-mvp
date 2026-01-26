/**
 * E2E Test - Employee Master + Performance Evaluation
 *
 * Ejecutar: AUTH_TOKEN=xxx npx tsx scripts/test-employee-performance.ts
 */

const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function log(msg: string, type: 'info' | 'ok' | 'err' | 'warn' = 'info') {
  const icons = { info: '[.]', ok: '[+]', err: '[X]', warn: '[!]' };
  console.log(`${icons[type]} ${msg}`);
}

async function api(method: string, endpoint: string, body?: object) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `focalizahr_token=${AUTH_TOKEN}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// ════════════════════════════════════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════════════════════════════════════

let cycleId = '';

async function test1_SyncEmployees() {
  log('TEST 1: Sync Employees');

  const res = await api('POST', '/api/admin/employees/sync', {
    employees: [
      {
        nationalId: '11111111-1',
        fullName: 'CEO Prueba E2E',
        email: 'ceo.e2e@test.cl',
        departmentName: 'Gerencia E2E',
        position: 'CEO',
        hireDate: '2020-01-01',
        isActive: true
      },
      {
        nationalId: '22222222-2',
        fullName: 'Subordinado Uno E2E',
        email: 'sub1.e2e@test.cl',
        departmentName: 'Gerencia E2E',
        managerRut: '11111111-1',
        position: 'Analista',
        hireDate: '2022-01-01',
        isActive: true
      },
      {
        nationalId: '33333333-3',
        fullName: 'Subordinado Dos E2E',
        email: 'sub2.e2e@test.cl',
        departmentName: 'Gerencia E2E',
        managerRut: '11111111-1',
        position: 'Analista',
        hireDate: '2022-06-01',
        isActive: true
      }
    ],
    config: {
      mode: 'INCREMENTAL',
      autoDeactivateMissing: false
    }
  });

  if (!res.ok) {
    log(`Error ${res.status}: ${res.data.error}`, 'err');
    throw new Error('Sync failed');
  }

  log(`Status: ${res.data.status}`, 'info');
  log(`Created: ${res.data.created}, Updated: ${res.data.updated}`, 'info');
  log('Sync OK', 'ok');
}

async function test2_GetEmployees() {
  log('TEST 2: Get Employees');

  const res = await api('GET', '/api/admin/employees?limit=100');

  if (!res.ok) {
    log(`Error ${res.status}: ${res.data.error}`, 'err');
    throw new Error('Get employees failed');
  }

  const employees = res.data.data || [];
  log(`Total: ${employees.length}`, 'info');

  const ceo = employees.find((e: any) => e.nationalId?.includes('11111111'));
  const sub1 = employees.find((e: any) => e.nationalId?.includes('22222222'));
  const sub2 = employees.find((e: any) => e.nationalId?.includes('33333333'));

  if (ceo) log(`CEO: ${ceo.fullName} (id: ${ceo.id})`, 'ok');
  if (sub1) log(`Sub1: ${sub1.fullName} (manager: ${sub1.managerId || 'none'})`, 'ok');
  if (sub2) log(`Sub2: ${sub2.fullName} (manager: ${sub2.managerId || 'none'})`, 'ok');

  const found = [ceo, sub1, sub2].filter(Boolean).length;
  if (found < 1) throw new Error('No test employees found');

  log(`Found ${found}/3 test employees`, 'ok');
}

async function test3_CreateCycle() {
  log('TEST 3: Create Performance Cycle');

  const res = await api('POST', '/api/admin/performance-cycles', {
    name: `E2E Cycle ${Date.now()}`,
    description: 'Test cycle for upward evaluations',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cycleType: 'IMPACT_PULSE',
    includesSelf: false,
    includesManager: false,
    includesPeer: false,
    includesUpward: true,
    anonymousResults: true,
    minSubordinates: 2
  });

  if (!res.ok) {
    log(`Error ${res.status}: ${res.data.error}`, 'err');
    throw new Error('Create cycle failed');
  }

  cycleId = res.data.data?.id;
  log(`Cycle ID: ${cycleId}`, 'ok');
  log(`includesUpward: ${res.data.data?.includesUpward}`, 'info');
}

async function test4_GenerateEvaluations() {
  log('TEST 4: Generate Evaluations');

  if (!cycleId) throw new Error('No cycle ID');

  const res = await api('POST', `/api/admin/performance-cycles/${cycleId}/generate`);

  if (!res.ok) {
    log(`Error ${res.status}: ${res.data.error}`, 'err');
    throw new Error('Generate failed');
  }

  log(`Created: ${res.data.totalCreated}`, 'info');
  log(`Skipped: ${res.data.totalSkipped}`, 'info');

  if (res.data.details?.upward) {
    log(`Upward: ${res.data.details.upward.created} created`, 'ok');
  }
}

async function test5_VerifyAssignments() {
  log('TEST 5: Verify Assignments');

  if (!cycleId) throw new Error('No cycle ID');

  const res = await api('GET', `/api/admin/performance-cycles/${cycleId}`);

  if (!res.ok) {
    log(`Error ${res.status}: ${res.data.error}`, 'err');
    throw new Error('Get cycle failed');
  }

  const stats = res.data.stats || {};
  const byType = res.data.byType || {};

  log(`Total: ${stats.total || 0}`, 'info');
  log(`EMPLOYEE_TO_MANAGER: ${byType.employeeToManager || 0}`, 'info');

  if (byType.employeeToManager > 0) {
    log('Upward evaluations created!', 'ok');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n=== E2E TEST: Employee + Performance ===\n');

  if (!AUTH_TOKEN) {
    log('AUTH_TOKEN required. Run: AUTH_TOKEN=xxx npx tsx scripts/test-employee-performance.ts', 'err');
    process.exit(1);
  }

  log(`Token: ${AUTH_TOKEN.slice(0, 20)}...`, 'info');

  const tests = [
    test1_SyncEmployees,
    test2_GetEmployees,
    test3_CreateCycle,
    test4_GenerateEvaluations,
    test5_VerifyAssignments
  ];

  let passed = 0;
  for (const test of tests) {
    try {
      await test();
      passed++;
      console.log('');
    } catch (e: any) {
      log(`FAILED: ${e.message}`, 'err');
      console.log('');
    }
  }

  console.log(`\n=== RESULT: ${passed}/${tests.length} passed ===\n`);

  if (cycleId) {
    log(`Cleanup: Delete cycle ${cycleId} via Prisma Studio`, 'info');
  }

  process.exit(passed === tests.length ? 0 : 1);
}

main();
