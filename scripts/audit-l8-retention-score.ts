// ════════════════════════════════════════════════════════════════════════════
// AUDIT L8 — Distribución del retention score y tiers (read-only)
// ════════════════════════════════════════════════════════════════════════════
// Cuenta QA: cmfgedx7b00012413i92048wl
// Reporta tiers, stats del score, simulación SIN multiplicador exposure,
// y completitud de insumos. Replica calculateRetentionPriority verbatim
// para poder desarmar el cálculo. NO toca producto.
// ════════════════════════════════════════════════════════════════════════════

import { WorkforceIntelligenceService } from '../src/lib/services/WorkforceIntelligenceService'
import { prisma } from '../src/lib/prisma'

const ACCOUNT_ID = 'cmfgedx7b00012413i92048wl'

function fmt(n: number, d = 2): string {
  return n.toFixed(d)
}

function effExposure(e: { focalizaScore: number | null; observedExposure: number }): number {
  return e.focalizaScore ?? e.observedExposure
}

function tierOf(score: number): 'intocable' | 'valioso' | 'neutro' | 'prescindible' {
  if (score >= 120) return 'intocable'
  if (score >= 80) return 'valioso'
  if (score >= 40) return 'neutro'
  return 'prescindible'
}

async function main() {
  console.log(`\n═══ AUDIT L8 retention · account ${ACCOUNT_ID} ═══\n`)

  const enriched = await WorkforceIntelligenceService.buildEnrichedDataset(ACCOUNT_ID)
  const ranking = enriched.filter(e => e.socCode !== null)

  console.log(`─── DATASET ────────────────────────────────────────────`)
  console.log(`  Total empleados activos:           ${enriched.length}`)
  console.log(`  Con socCode (entran al ranking):   ${ranking.length}`)
  console.log('')

  // 2. Distribución de tiers + stats con la fórmula REAL
  type Row = {
    name: string
    scoreActual: number
    scoreSinExposure: number
    tierActual: string
    tierSinExposure: string
    goals: number | null
    roleFit: number
    ability: number | null
    exposure: number
    isCritical: boolean
    isSucesor: boolean
  }

  const rows: Row[] = ranking.map(e => {
    const goalsNorm = e.goalsRawPercent ?? 50
    const roleFitNorm = e.roleFitScore
    const adaptBase5 = e.potentialAbility !== null ? (e.potentialAbility / 3 * 5) : 2.5
    const adaptNorm = (adaptBase5 / 5) * 100

    let baseScore = goalsNorm * 0.4 + roleFitNorm * 0.3 + adaptNorm * 0.3
    if (e.isIncumbentOfCriticalPosition) baseScore *= 1.5
    if (e.mobilityQuadrant === 'SUCESOR_NATURAL') baseScore *= 1.3

    const exp = effExposure(e)
    const scoreActual = baseScore * (1 + exp)

    return {
      name: e.employeeName,
      scoreActual,
      scoreSinExposure: baseScore,
      tierActual: tierOf(scoreActual),
      tierSinExposure: tierOf(baseScore),
      goals: e.goalsRawPercent,
      roleFit: e.roleFitScore,
      ability: e.potentialAbility,
      exposure: exp,
      isCritical: e.isIncumbentOfCriticalPosition,
      isSucesor: e.mobilityQuadrant === 'SUCESOR_NATURAL',
    }
  })

  const tiersActual = {
    intocable: rows.filter(r => r.tierActual === 'intocable').length,
    valioso: rows.filter(r => r.tierActual === 'valioso').length,
    neutro: rows.filter(r => r.tierActual === 'neutro').length,
    prescindible: rows.filter(r => r.tierActual === 'prescindible').length,
  }

  const scoresActual = rows.map(r => r.scoreActual)
  const sMin = Math.min(...scoresActual)
  const sMax = Math.max(...scoresActual)
  const sAvg = scoresActual.reduce((s, v) => s + v, 0) / (scoresActual.length || 1)

  console.log('─── 2. DISTRIBUCIÓN ACTUAL DE TIERS ────────────────────')
  console.log(`  intocable   (score >= 120): ${tiersActual.intocable}`)
  console.log(`  valioso     (score >=  80): ${tiersActual.valioso}`)
  console.log(`  neutro      (score >=  40): ${tiersActual.neutro}`)
  console.log(`  prescindible (score <  40): ${tiersActual.prescindible}`)
  console.log('')
  console.log(`  retentionScore min:      ${fmt(sMin)}`)
  console.log(`  retentionScore max:      ${fmt(sMax)}`)
  console.log(`  retentionScore promedio: ${fmt(sAvg)}`)
  console.log('')

  // 3. Desarmar multiplicador (1 + exposure)
  // Delta = scoreActual - scoreSinExposure = baseScore * exposure
  const deltas = rows.map(r => r.scoreActual - r.scoreSinExposure)
  const deltaAvg = deltas.reduce((s, v) => s + v, 0) / (deltas.length || 1)
  const deltaMin = Math.min(...deltas)
  const deltaMax = Math.max(...deltas)
  const deltaPctAvg = rows.reduce((s, r) => s + (r.scoreActual - r.scoreSinExposure) / r.scoreSinExposure, 0) / (rows.length || 1)
  const exposureAvg = rows.reduce((s, r) => s + r.exposure, 0) / (rows.length || 1)

  const tiersSinExp = {
    intocable: rows.filter(r => r.tierSinExposure === 'intocable').length,
    valioso: rows.filter(r => r.tierSinExposure === 'valioso').length,
    neutro: rows.filter(r => r.tierSinExposure === 'neutro').length,
    prescindible: rows.filter(r => r.tierSinExposure === 'prescindible').length,
  }

  const movieronABajo = rows.filter(r => r.tierActual !== r.tierSinExposure && r.tierSinExposure === 'prescindible').length
  const nuevosPrescindibles = tiersSinExp.prescindible - tiersActual.prescindible

  console.log('─── 3. MULTIPLICADOR (1 + effExposure) ─────────────────')
  console.log(`  exposure promedio (effExposure): ${fmt(exposureAvg, 3)}`)
  console.log(`  delta promedio (score con - score sin): ${fmt(deltaAvg)}`)
  console.log(`  delta % promedio: ${fmt(deltaPctAvg * 100, 1)}%`)
  console.log(`  delta min: ${fmt(deltaMin)}`)
  console.log(`  delta max: ${fmt(deltaMax)}`)
  console.log('')
  console.log(`  Tiers SIN multiplicador (score = goals*0.4 + roleFit*0.3 + adapt*0.3, con mult crítico/sucesor):`)
  console.log(`    intocable:    ${tiersSinExp.intocable}`)
  console.log(`    valioso:      ${tiersSinExp.valioso}`)
  console.log(`    neutro:       ${tiersSinExp.neutro}`)
  console.log(`    prescindible: ${tiersSinExp.prescindible}`)
  console.log('')
  console.log(`  Nuevos prescindibles al sacar el multiplicador: ${nuevosPrescindibles}`)
  console.log(`  (rows que pasarían a prescindible sin estar antes): ${movieronABajo}`)
  console.log('')

  // 4. Completitud de insumos
  const goalsNull = ranking.filter(e => e.goalsRawPercent === null).length
  const roleFitZero = ranking.filter(e => e.roleFitScore === 0).length
  const abilityNull = ranking.filter(e => e.potentialAbility === null).length
  const criticalCount = ranking.filter(e => e.isIncumbentOfCriticalPosition).length
  const sucesorCount = ranking.filter(e => e.mobilityQuadrant === 'SUCESOR_NATURAL').length

  console.log('─── 4. COMPLETITUD DE INSUMOS (sobre los 50 del ranking) ─')
  console.log(`  goalsRawPercent === null (cae a 50):     ${goalsNull}`)
  console.log(`  roleFitScore === 0 (sin rating real):    ${roleFitZero}`)
  console.log(`  potentialAbility === null (cae a 2.5/5): ${abilityNull}`)
  console.log('')
  console.log(`  Multiplicadores activos:`)
  console.log(`    isIncumbentOfCriticalPosition === true: ${criticalCount}`)
  console.log(`    mobilityQuadrant === SUCESOR_NATURAL:   ${sucesorCount}`)
  console.log('')

  // Bonus: top 5 más bajos y top 5 más altos (para sanity)
  const sortedAsc = [...rows].sort((a, b) => a.scoreActual - b.scoreActual)
  console.log('─── BONUS: 5 scores más bajos ──────────────────────────')
  for (const r of sortedAsc.slice(0, 5)) {
    console.log(`  ${fmt(r.scoreActual).padStart(7)} (sin exp: ${fmt(r.scoreSinExposure).padStart(7)}) · ${r.tierActual.padEnd(12)} · ${r.name} · goals=${r.goals ?? 'null'} roleFit=${r.roleFit} ability=${r.ability ?? 'null'} exp=${fmt(r.exposure, 2)}`)
  }
  console.log('')
  console.log('─── BONUS: 5 scores más altos ──────────────────────────')
  for (const r of sortedAsc.slice(-5).reverse()) {
    console.log(`  ${fmt(r.scoreActual).padStart(7)} (sin exp: ${fmt(r.scoreSinExposure).padStart(7)}) · ${r.tierActual.padEnd(12)} · ${r.name} · goals=${r.goals ?? 'null'} roleFit=${r.roleFit} ability=${r.ability ?? 'null'} exp=${fmt(r.exposure, 2)}`)
  }
  console.log('')

  await prisma.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
