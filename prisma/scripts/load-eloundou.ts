// ════════════════════════════════════════════════════════════════════════════
// LOAD ELOUNDOU — Poblar scores Eloundou 2023 "GPTs are GPTs"
// prisma/scripts/load-eloundou.ts
// ════════════════════════════════════════════════════════════════════════════
// 2 operaciones:
//   1. occ_level.csv → OnetOccupation (6 campos, 923 registros)
//   2. full_labelset.tsv → OnetTask (4 campos, ~19K registros, match por task text)
//
// Idempotente: sobreescribe los campos Eloundou. Re-ejecutar es safe.
// Usa DIRECT_URL para evitar statement timeout de PgBouncer.
//
// Ejecutar: npx tsx prisma/scripts/load-eloundou.ts
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const directUrl = process.env.DIRECT_URL
if (!directUrl) {
  console.error('❌ DIRECT_URL no configurada en .env')
  process.exit(1)
}

const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
})

// data/onet/onet/ es la ruta real (doble onet)
const DATA_DIR = path.join(process.cwd(), 'data', 'onet', 'onet')

function normalizeTaskName(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}

function parseLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue }
    current += ch
  }
  result.push(current.trim())
  return result
}

function safeFloat(val: string | undefined): number | null {
  if (val === undefined || val === '') return null
  const num = parseFloat(val)
  return isNaN(num) ? null : num
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 1: OCUPACIONES — occ_level.csv → OnetOccupation (6 campos)
// ─────────────────────────────────────────────────────────────────────────────

async function loadOccupations(): Promise<number> {
  console.log('\n📋 PASO 1/2: Poblando ocupaciones desde occ_level.csv')

  const csvPath = path.join(DATA_DIR, 'occ_level.csv')
  if (!fs.existsSync(csvPath)) {
    console.error(`  ❌ Archivo no encontrado: ${csvPath}`)
    return 0
  }

  const lines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(l => l.trim())
  console.log(`  Filas en CSV: ${lines.length - 1}`)

  let updated = 0
  let notFound = 0

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i])
    const socCode = cols[0]
    if (!socCode) continue

    const dvAlpha = safeFloat(cols[2])
    const dvBeta = safeFloat(cols[3])
    const dvGamma = safeFloat(cols[4])
    const hAlpha = safeFloat(cols[5])
    const hBeta = safeFloat(cols[6])
    const hGamma = safeFloat(cols[7])

    try {
      await prisma.onetOccupation.update({
        where: { socCode },
        data: {
          exposureEloundou: dvBeta,
          dvRatingAlpha: dvAlpha,
          dvRatingGamma: dvGamma,
          humanRatingAlpha: hAlpha,
          humanRatingBeta: hBeta,
          humanRatingGamma: hGamma,
        },
      })
      updated++
    } catch {
      notFound++
    }

    if (updated % 200 === 0 && updated > 0) {
      console.log(`  Progreso: ${updated}`)
    }
  }

  console.log(`  ✅ ${updated} ocupaciones actualizadas. ${notFound} sin match en BD.`)
  return updated
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 2: TAREAS — full_labelset.tsv → OnetTask (4 campos)
// Match por normalizeTaskName(taskDescription)
// ─────────────────────────────────────────────────────────────────────────────

async function loadTasks(): Promise<{ matched: number; unmatched: number }> {
  console.log('\n📝 PASO 2/2: Poblando tareas desde full_labelset.tsv')

  const tsvPath = path.join(DATA_DIR, 'full_labelset.tsv')
  if (!fs.existsSync(tsvPath)) {
    console.error(`  ❌ Archivo no encontrado: ${tsvPath}`)
    return { matched: 0, unmatched: 0 }
  }

  const lines = fs.readFileSync(tsvPath, 'utf8').split('\n').filter(l => l.trim())
  console.log(`  Filas en TSV: ${lines.length - 1}`)

  // 1. Cargar todas las tareas de la BD con su texto normalizado → id
  const dbTasks = await prisma.onetTask.findMany({
    select: { id: true, taskDescription: true },
  })
  const dbByText = new Map<string, string>() // normalizedText → id
  for (const t of dbTasks) {
    dbByText.set(normalizeTaskName(t.taskDescription), t.id)
  }
  console.log(`  BD onet_tasks: ${dbTasks.length}`)

  // 2. Parsear TSV y preparar updates
  // TSV columns: [0]index [1]SOC [2]TaskID [3]Task [4]TaskType [5]Title
  //              [6]human_exp [7]gpt4_exp [8]gpt4_alt [9]gpt3_rel [10]gpt4_auto
  //              [11]alpha [12]beta [13]gamma [14]automation [15]human_labels
  const updates: Array<{
    id: string
    alpha: number | null
    beta: number | null
    gamma: number | null
    automation: number | null
  }> = []

  let unmatched = 0
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t')
    const taskText = cols[3]?.trim()
    if (!taskText) continue

    const normalized = normalizeTaskName(taskText)
    const dbId = dbByText.get(normalized)

    if (!dbId) {
      unmatched++
      continue
    }

    updates.push({
      id: dbId,
      alpha: safeFloat(cols[11]),
      beta: safeFloat(cols[12]),
      gamma: safeFloat(cols[13]),
      automation: safeFloat(cols[14]),
    })
  }

  console.log(`  Matches: ${updates.length} | Sin match: ${unmatched}`)

  // 3. Actualizar secuencialmente (DIRECT_URL, sin timeout)
  console.log(`  Actualizando ${updates.length} tareas...`)

  let processed = 0
  for (const u of updates) {
    await prisma.onetTask.update({
      where: { id: u.id },
      data: {
        betaEloundou: u.beta,
        alphaEloundou: u.alpha,
        gammaEloundou: u.gamma,
        automationEloundou: u.automation,
      },
    })
    processed++
    if (processed % 2000 === 0) {
      console.log(`  Progreso: ${processed}/${updates.length}`)
    }
  }
  if (processed % 2000 !== 0) {
    console.log(`  Progreso: ${processed}/${updates.length}`)
  }

  console.log(`  ✅ ${processed} tareas actualizadas.`)
  return { matched: processed, unmatched }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  LOAD ELOUNDOU 2023 — "GPTs are GPTs"')
  console.log('═══════════════════════════════════════════════════════════')

  const startTime = Date.now()

  const occsUpdated = await loadOccupations()
  const { matched: tasksMatched, unmatched: tasksUnmatched } = await loadTasks()

  // Reporte final
  const elapsed = Math.round((Date.now() - startTime) / 1000)

  // Stats de distribución
  const betaDistribution = await prisma.onetTask.groupBy({
    by: ['betaEloundou'],
    where: { betaEloundou: { not: null } },
    _count: { id: true },
    orderBy: { betaEloundou: 'asc' },
  })

  const occWithEloundou = await prisma.onetOccupation.count({
    where: { exposureEloundou: { not: null } },
  })
  const occWithout = await prisma.onetOccupation.count({
    where: { exposureEloundou: null },
  })

  const tasksWithEloundou = await prisma.onetTask.count({
    where: { betaEloundou: { not: null } },
  })
  const tasksWithout = await prisma.onetTask.count({
    where: { betaEloundou: null },
  })

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  REPORTE FINAL')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')
  console.log('  OCUPACIONES (occ_level.csv → OnetOccupation):')
  console.log(`    Actualizadas:    ${occsUpdated}`)
  console.log(`    Con Eloundou:    ${occWithEloundou} / ${occWithEloundou + occWithout}`)
  console.log(`    Sin Eloundou:    ${occWithout} (All Other + militares)`)
  console.log('')
  console.log('  TAREAS (full_labelset.tsv → OnetTask):')
  console.log(`    Matcheadas:      ${tasksMatched}`)
  console.log(`    Sin match:       ${tasksUnmatched}`)
  console.log(`    Con betaEloundou: ${tasksWithEloundou} / ${tasksWithEloundou + tasksWithout}`)
  console.log(`    Sin betaEloundou: ${tasksWithout}`)
  console.log('')
  console.log('  DISTRIBUCIÓN betaEloundou por tarea:')
  for (const row of betaDistribution) {
    const val = row.betaEloundou !== null ? row.betaEloundou.toFixed(1) : 'null'
    const pct = tasksWithEloundou > 0
      ? ((row._count.id / tasksWithEloundou) * 100).toFixed(1)
      : '0'
    console.log(`    beta=${val}: ${row._count.id} tareas (${pct}%)`)
  }
  console.log('')
  console.log(`  Tiempo total: ${elapsed}s`)
  console.log('═══════════════════════════════════════════════════════════')
}

main()
  .catch(e => {
    console.error('\n❌ Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
