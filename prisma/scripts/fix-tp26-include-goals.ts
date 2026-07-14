// ════════════════════════════════════════════════════════════════════════════
// FIX — DESEMPEÑO_TP26: includeGoals=false + regeneración de ratings
// prisma/scripts/fix-tp26-include-goals.ts
// ════════════════════════════════════════════════════════════════════════════
// REGISTRO DE AUDITORÍA. Ya EJECUTADO en producción el 2026-07-13 (autorizado por
// Victor). Se versiona por el mismo criterio que migrate-goal-cycle-retroactive.ts.
// Corre DESPUÉS de cleanup-seed-goals-demo.ts.
//
// RAZÓN DE NEGOCIO (Victor, textual)
// ──────────────────────────────────
// "DESEMPEÑO_TP26 se marcó includeGoals=false porque las metas de ese ciclo nacieron
//  sin ventana real de seguimiento antes del cierre — no aporta señal real, y ponderar
//  sobre eso perjudicaba injustamente a quienes sí tenían metas asignadas."
//
// La evidencia: el ciclo cierra el 2026-02-28 y las metas reales se crearon el 24-26
// de febrero → ningún check-in alcanzó a registrarse. generateRating hace Time Travel
// al cycle.endDate (PerformanceRatingService.ts:283 → GoalsService.getEmployeeGoalsScore
// :345), así que encontraba las metas con 0% de progreso y hundía el 30% del score
// híbrido a goalsScore=1.0 (el piso de la escala). Paradoja evitada: quien NO tenía
// metas se clasificaba solo por competencias y salía MEJOR que quien sí las tenía.
//
// CONTAMINACIÓN PREVIA: seed-goals-demo.ts (:289-300) hizo un updateMany que sobrescribió
// goalsScore/goalsRawPercent/goalsCount/hybridScore en 50 ratings REALES (creados 15-16
// feb por el proceso real; ciclo ACTIVE con 99 asignaciones y 48 evaluaciones completas).
// NO creó filas: las pisó.
//
// RESULTADO REAL DE LA CORRIDA (2026-07-13) — 50 ratings:
//   calculatedScore que cambió : 0/50  ✅ (determinismo verificado antes de correr)
//   nineBoxPosition que cambió : 0/47  ✅ (recalculate9BoxPosition:803 usa
//                                          finalScore ?? calculatedScore, NO el híbrido)
//   roleFitScore que cambió    : 0/50  ✅
//   hybridScore/goalsScore     : → null en las 50 ✅
//   calculatedLevel que cambió : 25 (ahora clasifican por competencias; TODOS subieron —
//                                    el híbrido contaminado los arrastraba hacia abajo)
//   calibrados / finalScore    : 0 → no se pisó ningún ajuste manual
//
// INDETERMINADO (cerrado por Victor): no se puede saber si el ciclo nació con
// includeGoals=true o si lo activó el propio seed (:71-78). NO existe auditoría de
// performance_cycle: 0 entradas en AuditLog con ese entityId y el entityType
// 'performance_cycle' no existe en la tabla. Irrelevante en la práctica: 70/30/true
// coincide con el fallback por defecto de generateRating.
//
// MULTI-TENANT: accountId en TODA query. Guardas de abortado ANTES de escribir.
// IDEMPOTENTE: re-correrlo deja el mismo estado (includeGoals ya false; generateRating
// es determinista y vuelve a escribir los mismos valores).
//
// Uso:  npx tsx prisma/scripts/fix-tp26-include-goals.ts            (dry-run)
//       npx tsx prisma/scripts/fix-tp26-include-goals.ts --commit   (escribe)
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '../../src/lib/prisma';
import { PerformanceRatingService } from '../../src/lib/services/PerformanceRatingService';

const COMMIT = process.argv.includes('--commit');

const CICLO = 'cmloaagl300763xeqdn0uxsw5'; // DESEMPEÑO_TP26
const CUENTA = 'cmfgedx7b00012413i92048wl'; // cuenta cliente
const RATINGS_ESPERADOS = 50;

async function main() {
  console.log(`\n=== FIX DESEMPEÑO_TP26 === ${COMMIT ? '⚠️  MODO COMMIT' : '🔍 DRY-RUN'}\n`);

  // ═══ GUARDA 1: el ciclo existe y es de la cuenta esperada (multi-tenant) ═══
  const cycle = await prisma.performanceCycle.findFirst({
    where: { id: CICLO, accountId: CUENTA },
    select: { id: true, name: true, status: true, includeGoals: true, competenciesWeight: true, goalsWeight: true },
  });
  if (!cycle) {
    console.error('⛔ ABORTADO: el ciclo no existe o no pertenece a la cuenta esperada. Nada escrito.\n');
    return;
  }
  console.log(`ciclo: ${cycle.name} [${cycle.status}] includeGoals=${cycle.includeGoals} pesos=${cycle.competenciesWeight}/${cycle.goalsWeight}`);

  // ═══ GUARDA 2: ratings esperados, nadie calibrado, nadie de otra cuenta ═══
  const antes = await prisma.performanceRating.findMany({
    where: { cycleId: CICLO, accountId: CUENTA },
    select: {
      id: true, employeeId: true, accountId: true, calculatedScore: true, calculatedLevel: true,
      goalsScore: true, goalsCount: true, hybridScore: true, finalScore: true, calibrated: true,
      potentialScore: true, nineBoxPosition: true, roleFitScore: true,
      employee: { select: { fullName: true } },
    },
  });
  const calibrados = antes.filter((r) => r.finalScore != null || r.calibrated);
  const ajenos = antes.filter((r) => r.accountId !== CUENTA);
  console.log(`ratings: ${antes.length} | con goalsCount>0: ${antes.filter((r) => (r.goalsCount ?? 0) > 0).length} | calibrados: ${calibrados.length} | de otra cuenta: ${ajenos.length}`);

  if (antes.length !== RATINGS_ESPERADOS) {
    console.error(`⛔ ABORTADO: esperaba ${RATINGS_ESPERADOS} ratings, encontré ${antes.length}. Nada escrito.\n`);
    return;
  }
  if (calibrados.length > 0) {
    console.error('⛔ ABORTADO: hay ratings calibrados / con finalScore. Requieren decisión manual. Nada escrito.\n');
    return;
  }
  if (ajenos.length > 0) {
    console.error('⛔ ABORTADO: hay ratings de otra cuenta. Nada escrito.\n');
    return;
  }

  if (!COMMIT) {
    console.log('\n🔍 DRY-RUN: guardas OK, no se escribió nada. Correr con --commit para aplicar.\n');
    return;
  }

  // ═══ PASO 1: includeGoals = false (accountId en el where) ═══
  const upd = await prisma.performanceCycle.updateMany({
    where: { id: CICLO, accountId: CUENTA },
    data: { includeGoals: false },
  });
  if (upd.count !== 1) {
    console.error(`⛔ El update afectó ${upd.count} ciclos (esperaba 1). No sigo con los ratings.\n`);
    return;
  }
  console.log(`\n✅ PASO 1: includeGoals → false (ciclos actualizados: ${upd.count})`);

  // ═══ PASO 2: generateRating (clasifica SOLO por competencias) ═══
  console.log(`\n⏳ PASO 2: generateRating para ${antes.length} personas...`);
  let ok = 0;
  let err = 0;
  for (const r of antes) {
    try {
      await PerformanceRatingService.generateRating(CICLO, r.employeeId, CUENTA);
      ok++;
    } catch (e) {
      err++;
      console.error(`  ❌ ${r.employee?.fullName}: ${(e as Error).message}`);
    }
  }
  console.log(`✅ generateRating: ${ok} ok · ${err} errores`);

  // ═══ VERIFICACIÓN ═══
  const despues = await prisma.performanceRating.findMany({
    where: { cycleId: CICLO, accountId: CUENTA },
    select: { employeeId: true, calculatedScore: true, calculatedLevel: true, goalsScore: true,
              goalsCount: true, hybridScore: true, nineBoxPosition: true, roleFitScore: true },
  });
  const mapD = new Map(despues.map((r) => [r.employeeId, r]));

  let compCambia = 0, boxCambia = 0, lvlCambia = 0, rfCambia = 0;
  for (const a of antes) {
    const d = mapD.get(a.employeeId)!;
    if (Math.abs((d.calculatedScore ?? 0) - (a.calculatedScore ?? 0)) > 0.001) compCambia++;
    if (a.nineBoxPosition !== d.nineBoxPosition) boxCambia++;
    if (a.calculatedLevel !== d.calculatedLevel) lvlCambia++;
    if ((a.roleFitScore ?? null) !== (d.roleFitScore ?? null)) rfCambia++;
  }

  console.log('\n=== VERIFICACIÓN ===');
  console.log(`calculatedScore que cambió : ${compCambia} (esperado: 0)`);
  console.log(`nineBoxPosition que cambió : ${boxCambia} (esperado: 0)`);
  console.log(`roleFitScore que cambió    : ${rfCambia} (esperado: 0)`);
  console.log(`calculatedLevel que cambió : ${lvlCambia} (esperado: >0 — ahora clasifica por competencias)`);
  console.log(`AÚN con hybridScore  : ${despues.filter((r) => r.hybridScore != null).length} (esperado: 0)`);
  console.log(`AÚN con goalsScore   : ${despues.filter((r) => r.goalsScore != null).length} (esperado: 0)`);
  console.log(`AÚN con goalsCount>0 : ${despues.filter((r) => (r.goalsCount ?? 0) > 0).length} (esperado: 0)\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
