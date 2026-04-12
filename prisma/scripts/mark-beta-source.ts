// ════════════════════════════════════════════════════════════════════════════
// MARK BETA SOURCE — Identifica si betaScore vino de Anthropic o Haiku
// prisma/scripts/mark-beta-source.ts
// ════════════════════════════════════════════════════════════════════════════
// Re-lee anthropic-economic-index.csv, matchea por task_name normalizado
// contra onet_tasks, y marca:
//   - 'anthropic'       → la tarea matcheó con el CSV de Anthropic
//   - 'haiku_estimate'  → la tarea tiene betaScore pero NO matcheó (enrich script)
//
// Idempotente: re-ejecutar es seguro (sobreescribe el campo).
// No requiere ANTHROPIC_API_KEY — solo lee CSV + actualiza BD.
//
// Ejecutar: npx tsx prisma/scripts/mark-beta-source.ts
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Usar DIRECT_URL para evitar el statement timeout de PgBouncer (port 6543).
// DIRECT_URL va al port 5432 (conexión directa al PostgreSQL, sin pooler).
const directUrl = process.env.DIRECT_URL
if (!directUrl) {
  console.error('❌ DIRECT_URL no configurada en .env')
  process.exit(1)
}

const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
})
const DATA_DIR = path.join(process.cwd(), 'data', 'onet')

function normalizeTaskName(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  MARK BETA SOURCE — Anthropic vs Haiku Estimate')
  console.log('═══════════════════════════════════════════════════════════')

  // ── 1. Parsear anthropic-economic-index.csv ───���───────────────────────
  const csvPath = path.join(DATA_DIR, 'anthropic-economic-index.csv')
  if (!fs.existsSync(csvPath)) {
    console.error(`\n❌ Archivo no encontrado: ${csvPath}`)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8')
  const lines = csvContent.split('\n').filter(l => l.trim())

  const anthropicTaskNames = new Set<string>()
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // Handle task_name que puede contener comas dentro de quotes
    let taskName: string
    if (line.startsWith('"')) {
      const endQuote = line.indexOf('",', 1)
      taskName = endQuote > 0 ? line.substring(1, endQuote) : line.split(',')[0]
    } else {
      taskName = line.split(',')[0]
    }
    const normalized = normalizeTaskName(taskName)
    if (normalized) anthropicTaskNames.add(normalized)
  }

  console.log(`\n  Anthropic CSV: ${anthropicTaskNames.size} tareas únicas normalizadas`)

  // ── 2. Cargar solo las tareas PENDIENTES (betaSource = null) ─────────
  // Idempotente: al re-correr, salta las ya marcadas.
  const pendingTasks = await prisma.onetTask.findMany({
    where: { betaSource: null, betaScore: { not: null } },
    select: { id: true, taskDescription: true },
  })

  const totalTasks = await prisma.onetTask.count()
  const alreadyDone = totalTasks - pendingTasks.length
  const nullBetaCount = await prisma.onetTask.count({ where: { betaScore: null } })

  console.log(`  BD onet_tasks:   ${totalTasks} registros`)
  console.log(`  Ya marcados:     ${alreadyDone}`)
  console.log(`  Pendientes:      ${pendingTasks.length}`)
  console.log(`  Sin betaScore:   ${nullBetaCount}`)

  if (pendingTasks.length === 0) {
    console.log('\n  ✅ Todos los registros ya tienen betaSource marcado.')
    return
  }

  // ── 3. Clasificar cada tarea pendiente ────────────────────────────────
  let anthropicCount = 0
  let haikuCount = 0

  const updates: Array<{ id: string; source: string }> = []

  for (const task of pendingTasks) {
    const normalized = normalizeTaskName(task.taskDescription)
    const isAnthropicMatch = anthropicTaskNames.has(normalized)

    if (isAnthropicMatch) {
      updates.push({ id: task.id, source: 'anthropic' })
      anthropicCount++
    } else {
      updates.push({ id: task.id, source: 'haiku_estimate' })
      haikuCount++
    }
  }

  console.log(`\n  Clasificación pendiente:`)
  console.log(`    Anthropic real:    ${anthropicCount}`)
  console.log(`    Haiku estimate:    ${haikuCount}`)

  // ── 4. Updates secuenciales (sin $transaction, sin raw SQL) ──────────
  // Supabase pooler tiene statement timeout agresivo que mata $transaction
  // y raw UPDATE con IN clause. Updates individuales secuenciales funcionan
  // — el enrich script procesó 18,796 así sin problemas.
  console.log(`\n  Actualizando ${updates.length} registros (secuencial)...`)

  let processed = 0
  for (const u of updates) {
    await prisma.onetTask.update({
      where: { id: u.id },
      data: { betaSource: u.source },
    })
    processed++
    if (processed % 1000 === 0) {
      console.log(`    Progreso: ${processed}/${updates.length}`)
    }
  }
  if (processed % 1000 !== 0) {
    console.log(`    Progreso: ${processed}/${updates.length}`)
  }

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  RESUMEN')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`  betaSource = 'anthropic':       ${anthropicCount}`)
  console.log(`  betaSource = 'haiku_estimate':  ${haikuCount}`)
  console.log(`  Sin betaScore (no marcados):    ${nullBetaCount}`)
  console.log(`  Total procesados:               ${processed}`)
  console.log('═══════════════════════════════════════════════════════════')
}

main()
  .catch(e => {
    console.error('\n❌ Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
