// ════════════════════════════════════════════════════════════════════════════
// AUDIT L7 — Distribución real del gate detectAugmentedFlightRisk (read-only)
// ════════════════════════════════════════════════════════════════════════════
// Cuenta QA: cmfgedx7b00012413i92048wl
// Construye el enriched dataset igual que getOrganizationDiagnostic y reporta
// distribuciones + 3 contrafactuales del gate. NO toca producto, NO escribe.
// ════════════════════════════════════════════════════════════════════════════

import { WorkforceIntelligenceService } from '../src/lib/services/WorkforceIntelligenceService'
import { prisma } from '../src/lib/prisma'

const ACCOUNT_ID = 'cmfgedx7b00012413i92048wl'

function pctl(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.floor((p / 100) * (sorted.length - 1))
  return sorted[idx]
}

function fmt(n: number, decimals = 3): string {
  return n.toFixed(decimals)
}

async function main() {
  console.log(`\n═══ AUDIT L7 distribution · account ${ACCOUNT_ID} ═══\n`)

  // 0. Ciclo de performance activo
  const activeCycle = await prisma.performanceCycle.findFirst({
    where: {
      accountId: ACCOUNT_ID,
      status: { in: ['ACTIVE', 'IN_REVIEW', 'COMPLETED'] },
      performanceRatings: { some: { roleFitScore: { not: null } } },
    },
    orderBy: { endDate: 'desc' },
    select: { id: true, status: true, endDate: true, name: true },
  })

  console.log('─── CICLO DE PERFORMANCE ────────────────────────────────')
  if (activeCycle) {
    console.log(`  ✓ Activo: ${activeCycle.name ?? '(sin nombre)'} (${activeCycle.status}) · endDate ${activeCycle.endDate?.toISOString().slice(0, 10) ?? 'null'} · id ${activeCycle.id}`)
  } else {
    console.log(`  ✗ Ningún PerformanceCycle con ratings encontrado para esta cuenta.`)
  }
  console.log('')

  // 1. Build enriched dataset (canónico)
  const enriched = await WorkforceIntelligenceService.buildEnrichedDataset(ACCOUNT_ID)
  console.log(`─── DATASET ENRICHED ────────────────────────────────────`)
  console.log(`  Total empleados activos:      ${enriched.length}`)
  console.log(`  Con socCode mapeado:          ${enriched.filter(e => e.socCode !== null).length}`)
  console.log(`  Con focalizaScore !== null:   ${enriched.filter(e => e.focalizaScore !== null).length}`)
  console.log(`  Con potentialEngagement!==null: ${enriched.filter(e => e.potentialEngagement !== null).length}`)
  console.log('')

  // 1. augmentationShare
  const augShares = enriched.map(e => e.augmentationShare)
  const augMin = Math.min(...augShares)
  const augMax = Math.max(...augShares)
  const augAvg = augShares.reduce((s, v) => s + v, 0) / (augShares.length || 1)
  const augP75 = pctl(augShares, 75)
  const augP90 = pctl(augShares, 90)
  const augOver06 = augShares.filter(v => v > 0.6).length
  const augOver03 = augShares.filter(v => v > 0.3).length
  const augOverP90 = augShares.filter(v => v > augP90).length

  console.log('─── 1. augmentationShare ────────────────────────────────')
  console.log(`  min:        ${fmt(augMin)}`)
  console.log(`  max:        ${fmt(augMax)}`)
  console.log(`  promedio:   ${fmt(augAvg)}`)
  console.log(`  p75:        ${fmt(augP75)}`)
  console.log(`  p90:        ${fmt(augP90)}`)
  console.log(`  > 0.6:      ${augOver06}`)
  console.log(`  > 0.3:      ${augOver03}`)
  console.log(`  > p90:      ${augOverP90}`)
  console.log('')

  // 2. focalizaScore
  const focScores = enriched.map(e => e.focalizaScore).filter((v): v is number => v !== null)
  const focN = focScores.length
  const focMin = focN ? Math.min(...focScores) : 0
  const focMax = focN ? Math.max(...focScores) : 0
  const focAvg = focN ? focScores.reduce((s, v) => s + v, 0) / focN : 0
  const focP75 = pctl(focScores, 75)
  const focP90 = pctl(focScores, 90)
  const focOver05 = focScores.filter(v => v > 0.5).length

  console.log('─── 2. focalizaScore (no null) ──────────────────────────')
  console.log(`  N (no null): ${focN}`)
  console.log(`  min:         ${fmt(focMin)}`)
  console.log(`  max:         ${fmt(focMax)}`)
  console.log(`  promedio:    ${fmt(focAvg)}`)
  console.log(`  p75:         ${fmt(focP75)}`)
  console.log(`  p90:         ${fmt(focP90)}`)
  console.log(`  > 0.5:       ${focOver05}`)
  console.log(`  (referencia demo abril 2026: avg 0.444 / p75 0.5 / max 0.667)`)
  console.log('')

  // 3. potentialEngagement
  const peNull = enriched.filter(e => e.potentialEngagement === null).length
  const pe1 = enriched.filter(e => e.potentialEngagement === 1).length
  const pe2 = enriched.filter(e => e.potentialEngagement === 2).length
  const pe3 = enriched.filter(e => e.potentialEngagement === 3).length

  console.log('─── 3. potentialEngagement ──────────────────────────────')
  console.log(`  === null: ${peNull}`)
  console.log(`  === 1:    ${pe1}`)
  console.log(`  === 2:    ${pe2}`)
  console.log(`  === 3:    ${pe3}`)
  console.log('')

  // 4. cuadrantes
  const rqNull = enriched.filter(e => e.riskQuadrant === null).length
  const rqMotor = enriched.filter(e => e.riskQuadrant === 'MOTOR_EQUIPO').length
  const rqOtros = enriched.filter(e => e.riskQuadrant !== null && e.riskQuadrant !== 'MOTOR_EQUIPO').length
  const mqNull = enriched.filter(e => e.mobilityQuadrant === null).length
  const mqAmbicioso = enriched.filter(e => e.mobilityQuadrant === 'AMBICIOSO_PREMATURO').length
  const mqOtros = enriched.filter(e => e.mobilityQuadrant !== null && e.mobilityQuadrant !== 'AMBICIOSO_PREMATURO').length

  console.log('─── 4. cuadrantes ───────────────────────────────────────')
  console.log(`  riskQuadrant === null:                ${rqNull}`)
  console.log(`  riskQuadrant === 'MOTOR_EQUIPO':      ${rqMotor}`)
  console.log(`  riskQuadrant otros (no null):         ${rqOtros}`)
  console.log(`  mobilityQuadrant === null:            ${mqNull}`)
  console.log(`  mobilityQuadrant === 'AMBICIOSO_PREMATURO': ${mqAmbicioso}`)
  console.log(`  mobilityQuadrant otros (no null):     ${mqOtros}`)
  console.log('')

  // 5. Gate ACTUAL
  const passActual = enriched.filter(e =>
    e.augmentationShare > 0.6 &&
    e.potentialEngagement === 3 &&
    (e.riskQuadrant === 'MOTOR_EQUIPO' || e.mobilityQuadrant === 'AMBICIOSO_PREMATURO')
  ).length

  console.log('─── 5. Gate ACTUAL ──────────────────────────────────────')
  console.log(`  augShare > 0.6 && PE===3 && (MOTOR_EQUIPO || AMBICIOSO_PREMATURO): ${passActual}`)
  console.log('')

  // 6. Contrafactual A: focalizaScore > 0.5 en vez de augShare > 0.6
  const passA = enriched.filter(e =>
    (e.focalizaScore !== null && e.focalizaScore > 0.5) &&
    e.potentialEngagement === 3 &&
    (e.riskQuadrant === 'MOTOR_EQUIPO' || e.mobilityQuadrant === 'AMBICIOSO_PREMATURO')
  ).length

  console.log('─── 6. Contrafactual A ──────────────────────────────────')
  console.log(`  focScore > 0.5 && PE===3 && (MOTOR_EQUIPO || AMBICIOSO_PREMATURO): ${passA}`)
  console.log('')

  // 7. Contrafactual B: augShare > su p90 real
  const passB = enriched.filter(e =>
    e.augmentationShare > augP90 &&
    e.potentialEngagement === 3 &&
    (e.riskQuadrant === 'MOTOR_EQUIPO' || e.mobilityQuadrant === 'AMBICIOSO_PREMATURO')
  ).length

  console.log('─── 7. Contrafactual B ──────────────────────────────────')
  console.log(`  augShare > p90(${fmt(augP90)}) && PE===3 && (MOTOR_EQUIPO || AMBICIOSO_PREMATURO): ${passB}`)
  console.log('')

  await prisma.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
