// ════════════════════════════════════════════════════════════════════════════
// LOAD ANTHROPIC DIMS — las 5 dimensiones crudas del Economic Index
// prisma/scripts/load-anthropic-dims.ts
// ════════════════════════════════════════════════════════════════════════════
// Lee data/onet/onet/anthropic-economic-index.csv y pobla los 5 campos
// anthropicDirective, anthropicFeedbackLoop, anthropicTaskIteration,
// anthropicValidation, anthropicLearning en OnetTask.
//
// Matching por task_name normalizado (lowercase + trim + collapse whitespace).
// Cobertura esperada: ~3,472 tareas (18.5% del catálogo O*NET).
//
// Idempotente: solo procesa tareas con al menos 1 dim = null. Re-correr salta
// las ya pobladas.
//
// Requiere DIRECT_URL (evita statement timeout del PgBouncer).
//
// Ejecutar: npx tsx prisma/scripts/load-anthropic-dims.ts
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

// data/onet/onet/ (doble onet — ruta real)
const CSV_PATH = path.join(process.cwd(), 'data', 'onet', 'onet', 'anthropic-economic-index.csv')

function normalizeTaskName(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}

/** Parse CSV line tolerando comas dentro de quotes */
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

interface AnthropicScores {
  directive: number | null
  feedbackLoop: number | null
  taskIteration: number | null
  validation: number | null
  learning: number | null
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  LOAD ANTHROPIC DIMS — 5 dimensiones crudas del Economic Index')
  console.log('═══════════════════════════════════════════════════════════')

  // ── 1. Parsear CSV ────────────────────────────────────────────────────
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\n❌ Archivo no encontrado: ${CSV_PATH}`)
    process.exit(1)
  }

  const csv = fs.readFileSync(CSV_PATH, 'utf8')
  const lines = csv.split('\n').filter(l => l.trim())

  // Header: task_name, feedback_loop, directive, task_iteration, validation, learning, filtered
  const header = parseLine(lines[0])
  console.log(`\n  CSV headers: ${header.join(' | ')}`)

  // Indices
  const idxTask = header.indexOf('task_name')
  const idxFB = header.indexOf('feedback_loop')
  const idxDI = header.indexOf('directive')
  const idxTI = header.indexOf('task_iteration')
  const idxVA = header.indexOf('validation')
  const idxLE = header.indexOf('learning')

  if ([idxTask, idxFB, idxDI, idxTI, idxVA, idxLE].some(i => i < 0)) {
    console.error('❌ Header del CSV no coincide con el formato esperado')
    process.exit(1)
  }

  // Map normalized task name → 5 dims
  const anthropicMap = new Map<string, AnthropicScores>()
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i])
    const taskName = cols[idxTask]
    if (!taskName) continue
    const normalized = normalizeTaskName(taskName)
    anthropicMap.set(normalized, {
      directive: safeFloat(cols[idxDI]),
      feedbackLoop: safeFloat(cols[idxFB]),
      taskIteration: safeFloat(cols[idxTI]),
      validation: safeFloat(cols[idxVA]),
      learning: safeFloat(cols[idxLE]),
    })
  }

  console.log(`  Tareas Anthropic únicas: ${anthropicMap.size}`)

  // ── 2. Cargar tareas pendientes de la BD (todas las que tienen 5 dims null) ──
  const pending = await prisma.onetTask.findMany({
    where: {
      anthropicDirective: null,
      anthropicFeedbackLoop: null,
      anthropicTaskIteration: null,
      anthropicValidation: null,
      anthropicLearning: null,
    },
    select: { id: true, taskDescription: true },
  })

  const totalTasks = await prisma.onetTask.count()
  console.log(`  BD onet_tasks:   ${totalTasks}`)
  console.log(`  Pendientes (5 dims null): ${pending.length}`)

  if (pending.length === 0) {
    console.log('\n  ✅ Todas las tareas ya tienen dims Anthropic.')
    return
  }

  // ── 3. Match + prepare updates ────────────────────────────────────────
  const updates: Array<{ id: string; scores: AnthropicScores }> = []
  let unmatched = 0

  for (const task of pending) {
    const normalized = normalizeTaskName(task.taskDescription)
    const scores = anthropicMap.get(normalized)
    if (scores) {
      updates.push({ id: task.id, scores })
    } else {
      unmatched++
    }
  }

  console.log(`\n  Match encontrados: ${updates.length}`)
  console.log(`  Sin match:         ${unmatched} (tareas O*NET no cubiertas por Anthropic)`)

  if (updates.length === 0) {
    console.log('\n  ⚠ Sin matches. Verificar normalización.')
    return
  }

  // ── 4. Updates secuenciales (DIRECT_URL, sin timeout) ─────────────────
  console.log(`\n  Actualizando ${updates.length} registros...`)

  let processed = 0
  for (const u of updates) {
    await prisma.onetTask.update({
      where: { id: u.id },
      data: {
        anthropicDirective: u.scores.directive,
        anthropicFeedbackLoop: u.scores.feedbackLoop,
        anthropicTaskIteration: u.scores.taskIteration,
        anthropicValidation: u.scores.validation,
        anthropicLearning: u.scores.learning,
      },
    })
    processed++
    if (processed % 500 === 0) {
      console.log(`    Progreso: ${processed}/${updates.length}`)
    }
  }
  if (processed % 500 !== 0) {
    console.log(`    Progreso: ${processed}/${updates.length}`)
  }

  // ── 5. Reporte final con stats ────────────────────────────────────────
  const withDirective = await prisma.onetTask.count({ where: { anthropicDirective: { not: null } } })
  const withAllFive = await prisma.onetTask.count({
    where: {
      anthropicDirective: { not: null },
      anthropicFeedbackLoop: { not: null },
      anthropicTaskIteration: { not: null },
      anthropicValidation: { not: null },
      anthropicLearning: { not: null },
    },
  })
  const withoutAny = await prisma.onetTask.count({
    where: {
      anthropicDirective: null,
      anthropicFeedbackLoop: null,
      anthropicTaskIteration: null,
      anthropicValidation: null,
      anthropicLearning: null,
    },
  })

  // Stats de valores
  const [stats] = await prisma.$queryRaw<Array<{
    avg_dir: number; avg_fb: number; avg_ti: number; avg_va: number; avg_le: number
  }>>`
    SELECT
      AVG(anthropic_directive) as avg_dir,
      AVG(anthropic_feedback_loop) as avg_fb,
      AVG(anthropic_task_iteration) as avg_ti,
      AVG(anthropic_validation) as avg_va,
      AVG(anthropic_learning) as avg_le
    FROM onet_tasks
    WHERE anthropic_directive IS NOT NULL
  `

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  REPORTE FINAL')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')
  console.log(`  Tareas actualizadas:       ${processed}`)
  console.log(`  Tareas sin match:          ${unmatched}`)
  console.log('')
  console.log(`  Con anthropicDirective:    ${withDirective} / ${totalTasks}`)
  console.log(`  Con las 5 dims completas:  ${withAllFive} / ${totalTasks}`)
  console.log(`  Sin ninguna dim:           ${withoutAny} / ${totalTasks}`)
  console.log('')
  console.log('  Promedios (sobre las pobladas):')
  console.log(`    directive:       ${Number(stats.avg_dir).toFixed(3)}`)
  console.log(`    feedback_loop:   ${Number(stats.avg_fb).toFixed(3)}`)
  console.log(`    task_iteration:  ${Number(stats.avg_ti).toFixed(3)}`)
  console.log(`    validation:      ${Number(stats.avg_va).toFixed(3)}`)
  console.log(`    learning:        ${Number(stats.avg_le).toFixed(3)}`)
  console.log('═══════════════════════════════════════════════════════════')
}

main()
  .catch(e => {
    console.error('\n❌ Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
