// ════════════════════════════════════════════════════════════════════════════
// CLEANUP — Metas contaminadas por seed-goals-demo.ts
// prisma/scripts/cleanup-seed-goals-demo.ts
// ════════════════════════════════════════════════════════════════════════════
// REGISTRO DE AUDITORÍA. Ya EJECUTADO en producción el 2026-07-13 (autorizado por
// Victor). Se versiona por el mismo criterio que migrate-goal-cycle-retroactive.ts:
// es una escritura real a producción, no un smoke descartable.
//
// QUÉ PASÓ
// ────────
// `prisma/scripts/seed-goals-demo.ts` escribe metas con `prisma.goal.create` DIRECTO
// (:157), sin pasar por GoalsService → se saltea `validateTotalWeight` (GoalsService
// .ts:640). Asume pizarra en blanco ("Each employee gets 2-3 goals with combined
// weight = 100", :146-148) y le sumó otro 100% de peso encima a empleados que YA
// tenían metas reales. Resultado: 39 de 49 empleados con suma de peso >100% (hasta
// 230%). La base Supabase es única (= producción): el seed contaminó datos reales.
//
// UNIVERSO (firma DOBLE, sin falsos positivos ni negativos — verificado):
//   createdById = 'seed-script'  AND  description CONTAINS '[DEMO SEED]'
//
// RESULTADO REAL DE LA CORRIDA (2026-07-13):
//   - 125 metas borradas (26 COMPLETED + 99 activas) · 50 empleados tocados
//   - Goal: 217 → 92 · 212 GoalProgressUpdate cayeron en cascada (onDelete: Cascade)
//   - 0 GoalAlert / 0 metas hijas / 0 GoalCascadeRule apuntando a ellas (sin bloqueo FK)
//   - empleados con peso >100%: 39 → 3
//   - Los 3 residuales NO son del seed: metas de API de feb-2026, contemporáneas al
//     nacimiento de validateTotalWeight (f595883, 2026-02-25). Quedan abiertos.
//
// IDEMPOTENTE: si no encuentra metas con la firma doble, no hace nada.
// SEGURO: borrado por ID EXACTO dentro de $transaction (nunca por campo compartido).
//
// Uso:  npx tsx prisma/scripts/cleanup-seed-goals-demo.ts            (dry-run)
//       npx tsx prisma/scripts/cleanup-seed-goals-demo.ts --commit   (escribe)
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '../../src/lib/prisma';

const COMMIT = process.argv.includes('--commit');
const ACTIVAS = ['NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'BEHIND'] as const;

async function main() {
  console.log(`\n=== CLEANUP seed-goals-demo === ${COMMIT ? '⚠️  MODO COMMIT' : '🔍 DRY-RUN'}\n`);

  // 1. Universo por firma DOBLE
  const seedGoals = await prisma.goal.findMany({
    where: { createdById: 'seed-script', description: { contains: '[DEMO SEED]' } },
    select: { id: true, employeeId: true, weight: true, status: true, accountId: true },
  });
  const ids = seedGoals.map((g) => g.id);

  // Control: no debe haber restos con una sola mitad de la firma
  const soloCreator = await prisma.goal.count({
    where: { createdById: 'seed-script', NOT: { description: { contains: '[DEMO SEED]' } } },
  });
  const soloMarca = await prisma.goal.count({
    where: { description: { contains: '[DEMO SEED]' }, NOT: { createdById: 'seed-script' } },
  });

  console.log(`metas con firma doble : ${ids.length}`);
  console.log(`seed-script SIN marca : ${soloCreator} (debe ser 0)`);
  console.log(`marca SIN seed-script : ${soloMarca} (debe ser 0)`);
  console.log(`total Goal en base    : ${await prisma.goal.count()}`);

  if (ids.length === 0) {
    console.log('\n✅ Nada que borrar (ya limpio). Idempotente: salgo.\n');
    return;
  }

  const porStatus = new Map<string, number>();
  seedGoals.forEach((g) => porStatus.set(g.status, (porStatus.get(g.status) ?? 0) + 1));
  console.log(`por status            : ${JSON.stringify([...porStatus])}`);
  console.log(`empleados tocados     : ${new Set(seedGoals.map((g) => g.employeeId)).size}`);

  // 2. Dependencias
  const updates = await prisma.goalProgressUpdate.count({ where: { goalId: { in: ids } } });
  const alerts = await prisma.goalAlert.count({ where: { goalId: { in: ids } } });
  const hijas = await prisma.goal.count({ where: { parentId: { in: ids } } });
  const reglas = await prisma.goalCascadeRule.count({ where: { sourceGoalId: { in: ids } } });
  console.log(`\nGoalProgressUpdate    : ${updates} (onDelete: Cascade)`);
  console.log(`GoalAlert             : ${alerts} (onDelete: Cascade)`);
  console.log(`metas hijas           : ${hijas} (parentId onDelete: SetNull)`);
  console.log(`GoalCascadeRule source: ${reglas} (⚠️ Restrict → bloquearía el delete)`);

  if (reglas > 0) {
    console.error('\n⛔ ABORTADO: hay reglas de cascada apuntando a estas metas. Nada borrado.\n');
    return;
  }

  // 3. Efecto en el presupuesto de peso
  const activas = await prisma.goal.findMany({
    where: { level: 'INDIVIDUAL', status: { in: [...ACTIVAS] }, employeeId: { not: null } },
    select: { id: true, employeeId: true, weight: true },
  });
  const seedIds = new Set(ids);
  const byEmp = new Map<string, { antes: number; despues: number }>();
  for (const g of activas) {
    const e = byEmp.get(g.employeeId!) ?? { antes: 0, despues: 0 };
    e.antes += g.weight || 0;
    if (!seedIds.has(g.id)) e.despues += g.weight || 0;
    byEmp.set(g.employeeId!, e);
  }
  const sobre100Antes = [...byEmp.values()].filter((v) => v.antes > 100).length;
  const sobre100Despues = [...byEmp.values()].filter((v) => v.despues > 100).length;
  console.log(`\npeso >100% ANTES      : ${sobre100Antes} empleados`);
  console.log(`peso >100% DESPUÉS    : ${sobre100Despues} empleados (residuales NO-seed)`);

  if (!COMMIT) {
    console.log('\n🔍 DRY-RUN: no se borró nada. Correr con --commit para aplicar.\n');
    return;
  }

  // 4. Borrado POR ID EXACTO en $transaction
  const res = await prisma.$transaction(async (tx) => tx.goal.deleteMany({ where: { id: { in: ids } } }));
  console.log(`\n✅ BORRADAS: ${res.count} metas`);

  // 5. Verificación
  console.log(`total Goal ahora      : ${await prisma.goal.count()}`);
  console.log(`quedan seed-script    : ${await prisma.goal.count({ where: { createdById: 'seed-script' } })} (debe ser 0)`);
  console.log(`quedan [DEMO SEED]    : ${await prisma.goal.count({ where: { description: { contains: '[DEMO SEED]' } } })} (debe ser 0)`);
  console.log(`GoalProgressUpdate huérfanos: ${await prisma.goalProgressUpdate.count({ where: { goalId: { in: ids } } })} (debe ser 0)\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
