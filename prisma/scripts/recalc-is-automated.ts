// ════════════════════════════════════════════════════════════════════════════
// RECALC isAutomated — basado en betaEloundou >= 0.5
// prisma/scripts/recalc-is-automated.ts
// ════════════════════════════════════════════════════════════════════════════
// Reemplaza la regla vieja (avgExposure > 0.3 que nunca se cruzaba) por la
// regla canónica de Eloundou: una tarea está "automatizada" si tiene
// betaEloundou >= 0.5 (esto es: "expuesta con herramientas" o "totalmente
// expuesta").
//
// Tareas sin betaEloundou (7.3%) quedan isAutomated = false.
//
// Ejecutar: npx tsx prisma/scripts/recalc-is-automated.ts
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'

const directUrl = process.env.DIRECT_URL
if (!directUrl) {
  console.error('❌ DIRECT_URL no configurada en .env')
  process.exit(1)
}

const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
})

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  RECALC isAutomated — betaEloundou >= 0.5')
  console.log('═══════════════════════════════════════════════════════════')

  // ── 1. Estado inicial ────────────────────────────────────────────────
  const initialTrue = await prisma.onetTask.count({ where: { isAutomated: true } })
  const total = await prisma.onetTask.count()
  console.log(`\n  Estado inicial: isAutomated=true en ${initialTrue}/${total}`)

  // ── 2. Bulk UPDATE con raw SQL (1 query cada uno, no falla timeout) ──
  // Aunque DIRECT_URL no tiene timeout agresivo, 2 UPDATEs bulk son mucho
  // más rápidos que 18K updates individuales para este caso.
  console.log(`\n  Ejecutando UPDATE bulk...`)

  // Phase 1: isAutomated = true para tareas con betaEloundou >= 0.5
  const autoTrue = await prisma.$executeRaw`
    UPDATE onet_tasks
    SET is_automated = true
    WHERE beta_eloundou >= 0.5
  `

  // Phase 2: isAutomated = false para todas las demás (por si había valores true inconsistentes)
  const autoFalse = await prisma.$executeRaw`
    UPDATE onet_tasks
    SET is_automated = false
    WHERE beta_eloundou IS NULL OR beta_eloundou < 0.5
  `

  console.log(`  Phase 1 (true):  ${autoTrue} filas`)
  console.log(`  Phase 2 (false): ${autoFalse} filas`)

  // ── 3. Verificación ──────────────────────────────────────────────────
  const finalTrue = await prisma.onetTask.count({ where: { isAutomated: true } })
  const finalFalse = await prisma.onetTask.count({ where: { isAutomated: false } })

  // Breakdown por betaEloundou
  const withBeta05 = await prisma.onetTask.count({ where: { betaEloundou: 0.5 } })
  const withBeta10 = await prisma.onetTask.count({ where: { betaEloundou: 1.0 } })
  const withBeta00 = await prisma.onetTask.count({ where: { betaEloundou: 0 } })
  const withBetaNull = await prisma.onetTask.count({ where: { betaEloundou: null } })

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  REPORTE')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`  isAutomated=true:  ${finalTrue}`)
  console.log(`  isAutomated=false: ${finalFalse}`)
  console.log(`  Total:             ${finalTrue + finalFalse}`)
  console.log('')
  console.log('  Distribución betaEloundou:')
  console.log(`    =1.0 (true): ${withBeta10}`)
  console.log(`    =0.5 (true): ${withBeta05}`)
  console.log(`    =0.0 (false): ${withBeta00}`)
  console.log(`    null (false): ${withBetaNull}`)
  console.log('')
  console.log(`  Esperado isAutomated=true: ${withBeta05 + withBeta10}`)
  console.log(`  Actual isAutomated=true:   ${finalTrue}`)
  console.log(`  Match: ${finalTrue === (withBeta05 + withBeta10) ? '✅' : '❌'}`)
  console.log('═══════════════════════════════════════════════════════════')
}

main()
  .catch(e => {
    console.error('\n❌ Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
