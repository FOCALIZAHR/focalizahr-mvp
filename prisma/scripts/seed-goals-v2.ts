// ════════════════════════════════════════════════════════════════════════════
// SEED V2: Goals con distribución realista para Insight #7
// prisma/scripts/seed-goals-v2.ts
// ════════════════════════════════════════════════════════════════════════════
// Distribución: 30% sobre 80% | 40% zona media (40-80%) | 30% bajo 40%
// NO recrea goals — solo actualiza goalsRawPercent en ratings existentes
// para que matchee con los campos ya poblados (roleFitScore, riskQuadrant, etc.)
//
// Ejecutar:
//   npx tsx prisma/scripts/seed-goals-v2.ts
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ════════════════════════════════════════════════════════════════════════════
// DISTRIBUCIÓN REALISTA — diseñada para activar todos los sub-findings V2
// ════════════════════════════════════════════════════════════════════════════

// 30% alto (>80%) — activa segmento "ENTREGARON"
// 40% medio (40-80%) — zona gris, no activa findings
// 30% bajo (<40%) — activa segmento "NO ENTREGARON"

function assignGoalsPercent(
  index: number,
  total: number,
  roleFitScore: number | null,
  riskQuadrant: string | null,
  calculatedScore: number,
  engagement: number | null
): number {
  // Distribución base: 30% alto, 40% medio, 30% bajo
  const position = index / total

  if (position < 0.30) {
    // ═══ ALTO (>80%) ═══
    // Asegurar variedad para activar sub-findings:
    // - Algunos con FUGA_CEREBROS → activa 1B
    // - Algunos con roleFit bajo → activa 1D
    // - Algunos con engagement=1 → activa 1C (backlog)
    return randomBetween(82, 98)
  }

  if (position < 0.70) {
    // ═══ MEDIO (40-80%) ═══ zona gris
    return randomBetween(42, 78)
  }

  // ═══ BAJO (<40%) ═══
  // Asegurar variedad para sub-findings:
  // - Algunos con score360 >4.0 → activa 2B (bonos)
  // - Algunos con manager INDULGENTE → activa 2C
  // - Algunos con roleFit <60 → activa 2A (no sabe)
  // - Algunos con roleFit >75 → activa 2A (no quiere)
  return randomBetween(5, 38)
}

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min))
}

async function main() {
  console.log('🎯 Seed Goals V2 — Distribución realista 30/40/30\n')

  // 1. Encontrar ciclo
  const cycle = await prisma.performanceCycle.findFirst({
    where: { status: { in: ['ACTIVE', 'IN_REVIEW', 'COMPLETED'] } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      accountId: true,
      competenciesWeight: true,
      goalsWeight: true,
    },
  })

  if (!cycle) {
    console.error('❌ No hay ciclo activo.')
    process.exit(1)
  }

  console.log(`📋 Ciclo: ${cycle.name} (${cycle.id})`)
  console.log(`   Account: ${cycle.accountId}\n`)

  // 2. Activar includeGoals
  await prisma.performanceCycle.update({
    where: { id: cycle.id },
    data: { includeGoals: true, competenciesWeight: 70, goalsWeight: 30 },
  })

  // 3. Obtener ratings con datos existentes
  const ratings = await prisma.performanceRating.findMany({
    where: { cycleId: cycle.id, accountId: cycle.accountId },
    select: {
      id: true,
      employeeId: true,
      calculatedScore: true,
      roleFitScore: true,
      riskQuadrant: true,
      potentialEngagement: true,
      employee: { select: { fullName: true } },
    },
    orderBy: { calculatedScore: 'desc' },
  })

  console.log(`👥 ${ratings.length} ratings encontrados\n`)

  // 4. Shuffle para que la distribución no sea previsible
  const shuffled = [...ratings].sort(() => Math.random() - 0.5)

  // 5. Asignar goalsRawPercent y recalcular
  const compWeight = 70
  const goalsWeight = 30
  let updated = 0
  const results: { name: string; goals: number; score: number; roleFit: number | null; risk: string | null; engagement: number | null }[] = []

  for (let i = 0; i < shuffled.length; i++) {
    const r = shuffled[i]
    const goalsRawPercent = assignGoalsPercent(
      i, shuffled.length,
      r.roleFitScore, r.riskQuadrant, r.calculatedScore, r.potentialEngagement
    )

    // Recalculate hybrid score
    const goalsScore = 1 + (goalsRawPercent / 100) * 4
    const hybridScore = Math.round(
      (r.calculatedScore * compWeight / 100 + goalsScore * goalsWeight / 100) * 100
    ) / 100

    await prisma.performanceRating.update({
      where: { id: r.id },
      data: {
        goalsRawPercent,
        goalsScore: Math.round(goalsScore * 100) / 100,
        goalsCount: 3, // Simular 3 metas por persona
        hybridScore,
      },
    })

    results.push({
      name: r.employee.fullName,
      goals: goalsRawPercent,
      score: r.calculatedScore,
      roleFit: r.roleFitScore,
      risk: r.riskQuadrant,
      engagement: r.potentialEngagement,
    })
    updated++
  }

  console.log(`✅ ${updated} ratings actualizados\n`)

  // 6. Verificación — contar matches por sub-finding
  const high = results.filter(r => r.goals > 80)
  const low = results.filter(r => r.goals < 40)
  const mid = results.filter(r => r.goals >= 40 && r.goals <= 80)

  console.log('═══════════════════════════════════════════════════════════')
  console.log('📊 DISTRIBUCIÓN')
  console.log(`   > 80% (Entregaron):    ${high.length} (${Math.round(high.length/results.length*100)}%)`)
  console.log(`   40-80% (Zona media):   ${mid.length} (${Math.round(mid.length/results.length*100)}%)`)
  console.log(`   < 40% (No entregaron): ${low.length} (${Math.round(low.length/results.length*100)}%)`)

  console.log('\n📊 SUB-FINDINGS QUE DEBERÍAN ACTIVARSE:')

  // 1B: Fuga Productiva
  const fuga = high.filter(r => r.risk === 'FUGA_CEREBROS')
  console.log(`   1B Fuga (>80% + FUGA_CEREBROS):     ${fuga.length}`)

  // 1D: Sostenibilidad
  const sostenibilidad = high.filter(r => (r.roleFit ?? 100) < 75)
  console.log(`   1D Sostenibilidad (>80% + RF<75):    ${sostenibilidad.length}`)

  // 2B: Bonos Injustificados
  const bonos = low.filter(r => r.score > 4.0)
  console.log(`   2B Bonos (<40% + score>4.0):         ${bonos.length}`)

  // 2A: No sabe / No quiere
  const noSabe = low.filter(r => (r.roleFit ?? 100) < 60)
  const noQuiere = low.filter(r => (r.roleFit ?? 0) > 75)
  console.log(`   2A No sabe (<40% + RF<60):           ${noSabe.length}`)
  console.log(`   2A No quiere (<40% + RF>75):         ${noQuiere.length}`)

  // Backlog: Ejecutores desconectados
  const desconectados = high.filter(r => r.engagement === 1)
  console.log(`   (BL) Desconectados (>80% + eng=1):   ${desconectados.length}`)

  console.log('═══════════════════════════════════════════════════════════\n')

  // 7. Detalle por persona
  console.log('📋 DETALLE (primeros 10 alto + primeros 10 bajo):')
  console.log('   ENTREGARON (>80%):')
  for (const r of high.slice(0, 10)) {
    const flags = [
      r.risk === 'FUGA_CEREBROS' ? '🔴FUGA' : '',
      (r.roleFit ?? 100) < 75 ? '🟡RF<75' : '',
      r.engagement === 1 ? '⚡ENG=1' : '',
    ].filter(Boolean).join(' ')
    console.log(`     ${r.name.substring(0, 30).padEnd(30)} goals=${r.goals}% score=${r.score.toFixed(1)} RF=${r.roleFit ?? 'null'} ${flags}`)
  }

  console.log('   NO ENTREGARON (<40%):')
  for (const r of low.slice(0, 10)) {
    const flags = [
      r.score > 4.0 ? '🟡BONO' : '',
      (r.roleFit ?? 100) < 60 ? '🔴NO_SABE' : '',
      (r.roleFit ?? 0) > 75 ? '🟣NO_QUIERE' : '',
    ].filter(Boolean).join(' ')
    console.log(`     ${r.name.substring(0, 30).padEnd(30)} goals=${r.goals}% score=${r.score.toFixed(1)} RF=${r.roleFit ?? 'null'} ${flags}`)
  }

  console.log('\n🎯 Seed completo. Abre Executive Hub → Insight "Metas" para verificar.')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
