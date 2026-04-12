// ════════════════════════════════════════════════════════════════════════════
// POPULATE focalizaScore — canonical indicator del producto
// prisma/scripts/populate-focaliza-score.ts
// ════════════════════════════════════════════════════════════════════════════
// Copia focalizaScore desde Eloundou:
//   - OnetOccupation.focalizaScore = exposureEloundou (dv_rating_beta)
//   - OnetTask.focalizaScore       = betaEloundou
//   - source = 'eloundou' donde el valor es no-null
//
// Tareas/ocupaciones sin Eloundou quedan focalizaScore = null (no mezclar
// con Haiku — dato puro).
//
// Ejecutar: npx tsx prisma/scripts/populate-focaliza-score.ts
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
  console.log('  POPULATE focalizaScore — source of truth unificada')
  console.log('═══════════════════════════════════════════════════════════')

  // ── OnetOccupation: focalizaScore = exposureEloundou ─────────────────
  console.log('\n📋 OCUPACIONES')

  const occUpdated = await prisma.$executeRaw`
    UPDATE onet_occupations
    SET focaliza_score = exposure_eloundou,
        focaliza_score_source = 'eloundou'
    WHERE exposure_eloundou IS NOT NULL
  `
  const occNull = await prisma.$executeRaw`
    UPDATE onet_occupations
    SET focaliza_score = NULL,
        focaliza_score_source = NULL
    WHERE exposure_eloundou IS NULL
  `
  console.log(`  Pobladas (eloundou): ${occUpdated}`)
  console.log(`  Quedaron null:       ${occNull}`)

  // ── OnetTask: focalizaScore = betaEloundou ───────────────────────────
  console.log('\n📝 TAREAS')

  const taskUpdated = await prisma.$executeRaw`
    UPDATE onet_tasks
    SET focaliza_score = beta_eloundou,
        focaliza_score_source = 'eloundou'
    WHERE beta_eloundou IS NOT NULL
  `
  const taskNull = await prisma.$executeRaw`
    UPDATE onet_tasks
    SET focaliza_score = NULL,
        focaliza_score_source = NULL
    WHERE beta_eloundou IS NULL
  `
  console.log(`  Pobladas (eloundou): ${taskUpdated}`)
  console.log(`  Quedaron null:       ${taskNull}`)

  // ── Verificación ──────────────────────────────────────────────────────
  const occWith = await prisma.onetOccupation.count({ where: { focalizaScore: { not: null } } })
  const occWithout = await prisma.onetOccupation.count({ where: { focalizaScore: null } })
  const taskWith = await prisma.onetTask.count({ where: { focalizaScore: { not: null } } })
  const taskWithout = await prisma.onetTask.count({ where: { focalizaScore: null } })

  // Stats
  const [occStats] = await prisma.$queryRaw<Array<{ min: number; max: number; avg: number }>>`
    SELECT MIN(focaliza_score) as min, MAX(focaliza_score) as max, AVG(focaliza_score) as avg
    FROM onet_occupations
    WHERE focaliza_score IS NOT NULL
  `
  const [taskStats] = await prisma.$queryRaw<Array<{ min: number; max: number; avg: number }>>`
    SELECT MIN(focaliza_score) as min, MAX(focaliza_score) as max, AVG(focaliza_score) as avg
    FROM onet_tasks
    WHERE focaliza_score IS NOT NULL
  `

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  REPORTE')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')
  console.log('  OnetOccupation:')
  console.log(`    Con focalizaScore:    ${occWith} / ${occWith + occWithout}`)
  console.log(`    Sin focalizaScore:    ${occWithout}`)
  console.log(`    Rango: [${Number(occStats.min).toFixed(3)} - ${Number(occStats.max).toFixed(3)}] avg=${Number(occStats.avg).toFixed(3)}`)
  console.log('')
  console.log('  OnetTask:')
  console.log(`    Con focalizaScore:    ${taskWith} / ${taskWith + taskWithout}`)
  console.log(`    Sin focalizaScore:    ${taskWithout}`)
  console.log(`    Rango: [${Number(taskStats.min).toFixed(3)} - ${Number(taskStats.max).toFixed(3)}] avg=${Number(taskStats.avg).toFixed(3)}`)
  console.log('')
  console.log('  Source: eloundou (único, no hay mezcla con Haiku)')
  console.log('═══════════════════════════════════════════════════════════')
}

main()
  .catch(e => {
    console.error('\n❌ Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
