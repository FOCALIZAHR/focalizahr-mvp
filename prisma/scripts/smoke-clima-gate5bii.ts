// prisma/scripts/smoke-clima-gate5bii.ts
// ════════════════════════════════════════════════════════════════════════════
// EVIDENCIA E2E Gate 5B-ii — los 2 CTAs CREAN objetos reales (no solo 200).
//
// Ejercita los HANDLERS REALES (vía NextRequest con headers x-user-*, como los
// inyecta el middleware) contra la BD de dev:
//   CTA1 → POST /api/clima/pdi-suggestion  → DevelopmentPlan DRAFT + goals con climaEvidence
//   CTA2 → POST /api/goals                 → Goal INDIVIDUAL real en el ciclo activo sembrado
// Lee de vuelta las filas creadas de la BD, las imprime, y limpia TODO por id
// (plan+goals, meta, ciclo sembrado) en $transaction — deja la cuenta como estaba.
//
// Cuenta de prueba (recon): Test Company, sin GoalCycle activo → se siembra uno.
// Correr:  npx tsx prisma/scripts/smoke-clima-gate5bii.ts   (se borra al sellar)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { prisma } from '../../src/lib/prisma';
import { GoalCycleService } from '../../src/lib/services/GoalCycleService';
import { POST as climaPdiPOST } from '../../src/app/api/clima/pdi-suggestion/route';
import { POST as goalsPOST } from '../../src/app/api/goals/route';

const ACCOUNT_ID = 'cmj2tx7tc0000ktmxaq9d90ti'; // Test Company
const PERF_CYCLE_ID = 'cmlmggkhy003nas7z26u2xmx4'; // PerformanceCycle (FK del PDI)
const EMPLOYEE_ID = 'cmlmgbwe70006as7z7bptszo0'; // Claudia Palominos (activa, con manager)
const ROLE = 'HR_ADMIN'; // clima:manage + goals:create, rol global (sin ownership)

let pass = 0;
let fail = 0;
function check(label: string, cond: boolean) {
  cond ? pass++ : fail++;
  console.log(`  ${cond ? '✅' : '❌'} ${label}`);
}

function req(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: new Headers({
      'content-type': 'application/json',
      'x-account-id': ACCOUNT_ID,
      'x-user-role': ROLE,
      'x-user-id': ACCOUNT_ID,
      'x-user-email': 'evidence-5bii@test.local',
    }),
    body: JSON.stringify(body),
  });
}

async function main() {
  const created = { cycleId: '', cycleSeeded: false, planId: '', metaGoalId: '' };

  try {
    // ── SEED: ciclo activo (CTA2 lo necesita — Gate E) ──
    console.log('\n── SEED · ciclo activo demo (Test Company no tenía) ──');
    const active = await GoalCycleService.getActiveCycle(ACCOUNT_ID);
    if (active) {
      created.cycleId = active.id;
      console.log(`  (ya había ciclo activo: ${active.id}) — se reusa`);
    } else {
      const gc = await GoalCycleService.createCycle({
        accountId: ACCOUNT_ID,
        name: 'Ciclo Demo Clima 2026',
        periodType: 'ANNUAL',
        year: 2026,
        assignmentWindow: new Date('2026-01-01'),
        trackingWindow: new Date('2026-07-01'),
        closureWindow: new Date('2026-12-31'),
      });
      const activated = await GoalCycleService.activate(gc.id);
      created.cycleId = activated.id;
      created.cycleSeeded = true;
      console.log(`  sembrado + activado: ${activated.id} (status ${activated.status})`);
    }
    check('hay un GoalCycle ACTIVE para la cuenta', !!created.cycleId);

    // ═══════════════════════════════════════════════════════════════════════
    // CTA1 — PDI suave desde hallazgo de clima (liderazgo 45%)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n── CTA1 · POST /api/clima/pdi-suggestion (liderazgo 45%) ──');
    const pdiRes = await climaPdiPOST(
      req('/api/clima/pdi-suggestion', {
        employeeId: EMPLOYEE_ID,
        cycleId: PERF_CYCLE_ID,
        driver: 'liderazgo',
        teamFavorability: 45,
        gap360: -1.2,
      })
    );
    const pdiBody = await pdiRes.json();
    check(`endpoint respondió ${pdiRes.status} success`, pdiRes.status === 200 && pdiBody.success === true);
    created.planId = pdiBody?.data?.id ?? '';

    // Leer de la BD lo realmente persistido
    const planDb = created.planId
      ? await prisma.developmentPlan.findUnique({
          where: { id: created.planId },
          include: { goals: true },
        })
      : null;
    check('DevelopmentPlan REAL en BD (leído de vuelta)', !!planDb);
    check('plan status DRAFT + aiSuggestionsUsed', planDb?.status === 'DRAFT' && planDb?.aiSuggestionsUsed === true);
    const climaGoals = (planDb?.goals ?? []).filter((g) => g.climaEvidence != null);
    check('≥1 DevelopmentGoal REAL con climaEvidence persistido', climaGoals.length >= 1);
    const ev = climaGoals[0]?.climaEvidence as { driver?: string; teamFavorability?: number; gap360?: number } | null;
    check('climaEvidence correcto {driver:liderazgo, fav:45, gap360:-1.2}', ev?.driver === 'liderazgo' && ev?.teamFavorability === 45 && ev?.gap360 === -1.2);
    check('goal mapeado a competencia LEAD-TEAM (mapeo 5B-i)', climaGoals.some((g) => g.competencyCode === 'LEAD-TEAM'));

    console.log('\n  OUTPUT REAL — DevelopmentGoal(s) de clima persistidos:');
    for (const g of climaGoals) {
      console.log(`    • [${g.competencyCode}] "${g.title}" · priority ${g.priority} · aiGenerated ${g.aiGenerated}`);
      console.log(`      climaEvidence: ${JSON.stringify(g.climaEvidence)}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CTA2 — Meta dura real en el ciclo activo (POST /api/goals tal cual)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n── CTA2 · POST /api/goals (meta dura de clima, INDIVIDUAL) ──');
    const metaRes = await goalsPOST(
      req('/api/goals', {
        title: 'Subir Liderazgo de 45% a 75%',
        description: 'Meta de clima generada desde el plan de acción (dimensión liderazgo).',
        level: 'INDIVIDUAL',
        employeeId: EMPLOYEE_ID,
        startDate: '2026-08-01',
        dueDate: '2026-11-30',
        periodYear: 2026,
        metricType: 'PERCENTAGE',
        startValue: 45,
        targetValue: 75,
        unit: '%',
        weight: 10,
      })
    );
    const metaBody = await metaRes.json();
    check(`endpoint respondió ${metaRes.status} success`, (metaRes.status === 200 || metaRes.status === 201) && (metaBody.success === true || !!metaBody?.data?.id));
    created.metaGoalId = metaBody?.data?.id ?? metaBody?.data?.goal?.id ?? '';

    const metaDb = created.metaGoalId
      ? await prisma.goal.findUnique({
          where: { id: created.metaGoalId },
          select: { id: true, title: true, level: true, employeeId: true, targetValue: true, startValue: true, metricType: true, goalCycleId: true, accountId: true, originType: true },
        })
      : null;
    check('Goal REAL en BD (leído de vuelta)', !!metaDb);
    check('meta INDIVIDUAL, target 75, asignada al empleado', metaDb?.level === 'INDIVIDUAL' && Number(metaDb?.targetValue) === 75 && metaDb?.employeeId === EMPLOYEE_ID);
    check('meta cae en el ciclo activo sembrado (goalCycleId)', metaDb?.goalCycleId === created.cycleId);
    check('multi-tenant: accountId correcto', metaDb?.accountId === ACCOUNT_ID);

    console.log('\n  OUTPUT REAL — Goal (meta dura) persistido:');
    console.log(`    ${JSON.stringify(metaDb)}`);
  } finally {
    // ── CLEANUP por id (deja la cuenta como estaba) ──
    console.log('\n── CLEANUP (por id, $transaction) ──');
    await prisma.$transaction(async (tx) => {
      if (created.metaGoalId) await tx.goal.deleteMany({ where: { id: created.metaGoalId } });
      if (created.planId) await tx.developmentPlan.deleteMany({ where: { id: created.planId } }); // cascade goals
      if (created.cycleSeeded && created.cycleId) await tx.goalCycle.deleteMany({ where: { id: created.cycleId } });
    });
    console.log(`  limpiados: meta=${created.metaGoalId || '-'} plan=${created.planId || '-'} cicloSembrado=${created.cycleSeeded ? created.cycleId : '-'}`);
    await prisma.$disconnect();
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`RESULTADO: ${pass} PASS · ${fail} FAIL`);
  console.log('════════════════════════════════════════════════════════════════');
  if (fail > 0) process.exit(1);
}

main();
