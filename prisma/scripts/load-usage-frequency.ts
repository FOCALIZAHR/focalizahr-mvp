// ════════════════════════════════════════════════════════════════════════════
// LOAD USAGE FREQUENCY — Carga frecuencia de uso Claude por tarea
// prisma/scripts/load-usage-frequency.ts
// ════════════════════════════════════════════════════════════════════════════
// Lee task_pct_v2.csv (Anthropic Economic Index) y matchea por task_name
// normalizado contra onet_tasks. Actualiza el campo usageFrequency.
//
// task_pct_v2.csv contiene la frecuencia observada de uso de Claude para
// cada tarea — "qué porcentaje de las conversaciones Claude involucran
// esta tarea". Es un dato de ADOPCIÓN REAL, no de exposición teórica.
//
// Idempotente: sobreescribe el campo. Re-ejecutar es seguro.
// No requiere ANTHROPIC_API_KEY — solo lee CSV + actualiza BD.
//
// Ejecutar: npx tsx prisma/scripts/load-usage-frequency.ts
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Usar DIRECT_URL para evitar statement timeout de PgBouncer.
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
  console.log('  LOAD USAGE FREQUENCY — task_pct_v2.csv → onet_tasks')
  console.log('═══════════════════════════════════════════════════════════')

  // ── 1. Parsear task_pct_v2.csv ────────────────────────────────────────
  const csvPath = path.join(DATA_DIR, 'task_pct_v2.csv')
  if (!fs.existsSync(csvPath)) {
    console.error(`\n❌ Archivo no encontrado: ${csvPath}`)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8')
  const lines = csvContent.split('\n').filter(l => l.trim())

  const pctMap = new Map<string, number>()
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    let taskName: string
    let pctStr: string

    // Handle task_name con comas dentro de quotes
    if (line.startsWith('"')) {
      const endQuote = line.indexOf('",')
      if (endQuote > 0) {
        taskName = line.substring(1, endQuote)
        pctStr = line.substring(endQuote + 2)
      } else {
        const parts = line.split(',')
        taskName = parts[0].replace(/^"|"$/g, '')
        pctStr = parts[1] ?? ''
      }
    } else {
      const parts = line.split(',')
      taskName = parts[0]
      pctStr = parts[1] ?? ''
    }

    const normalized = normalizeTaskName(taskName)
    const pct = parseFloat(pctStr)

    if (normalized && !isNaN(pct) && pct >= 0) {
      pctMap.set(normalized, pct)
    }
  }

  console.log(`\n  task_pct_v2.csv: ${pctMap.size} tareas únicas con frecuencia`)

  // ── 2. Cargar todas las tareas de la BD ───────────────────────────────
  const allTasks = await prisma.onetTask.findMany({
    select: { id: true, taskDescription: true },
  })

  console.log(`  BD onet_tasks: ${allTasks.length} registros`)

  // ── 3. Matchear ───────────────────────────────────────────────────────
  const updates: Array<{ id: string; freq: number }> = []

  for (const task of allTasks) {
    const normalized = normalizeTaskName(task.taskDescription)
    const freq = pctMap.get(normalized)
    if (freq !== undefined) {
      updates.push({ id: task.id, freq })
    }
  }

  console.log(`  Matches encontrados: ${updates.length} (${(updates.length / allTasks.length * 100).toFixed(1)}%)`)

  if (updates.length === 0) {
    console.log('\n  ⚠ Sin matches. Verificar normalización.')
    return
  }

  // ── 4. Updates secuenciales (DIRECT_URL, sin $transaction) ──────────
  console.log(`\n  Actualizando ${updates.length} registros (secuencial)...`)

  let processed = 0
  for (const u of updates) {
    await prisma.onetTask.update({
      where: { id: u.id },
      data: { usageFrequency: u.freq },
    })
    processed++
    if (processed % 500 === 0) {
      console.log(`    Progreso: ${processed}/${updates.length}`)
    }
  }
  if (processed % 500 !== 0) {
    console.log(`    Progreso: ${processed}/${updates.length}`)
  }

  // ── 5. Stats ──────────────────────────────────────────────────────────
  const withFreq = await prisma.onetTask.count({
    where: { usageFrequency: { not: null } },
  })
  const withoutFreq = await prisma.onetTask.count({
    where: { usageFrequency: null },
  })

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  RESUMEN')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`  Tareas con usageFrequency:   ${withFreq}`)
  console.log(`  Tareas sin usageFrequency:   ${withoutFreq}`)
  console.log(`  Total:                       ${withFreq + withoutFreq}`)
  console.log('═══════════════════════════════════════════════════════════')
}

main()
  .catch(e => {
    console.error('\n❌ Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
