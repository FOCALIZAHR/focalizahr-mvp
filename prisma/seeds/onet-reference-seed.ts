// ════════════════════════════════════════════════════════════════════════════
// SEED: O*NET Reference Data + Anthropic Economic Index — ETL Pipeline
// prisma/seeds/onet-reference-seed.ts
// ════════════════════════════════════════════════════════════════════════════
// 1. Parsea O*NET CSVs (TAB-separated): Occupations, Job Zones, Tasks, Skills
// 2. Parsea Anthropic CSVs (COMMA-separated): Economic Index + Task Mappings
// 3. Joins en memoria: O*NET tasks ↔ Anthropic scores via task_name normalizado
// 4. Rollup ponderado: task-level → occupation-level (importancia × exposure)
// 5. Upsert idempotente a PostgreSQL via Prisma
//
// Ejecutar: npx tsx prisma/seeds/onet-reference-seed.ts
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()
const DATA_DIR = path.resolve(__dirname, '../../data/onet')

// ════════════════════════════════════════════════════════════════════════════
// CSV PARSERS — TAB para O*NET, COMMA para Anthropic
// ════════════════════════════════════════════════════════════════════════════

function parseTSV(filePath: string): Record<string, string>[] {
  return parseDelimited(filePath, '\t')
}

function parseCommaSV(filePath: string): Record<string, string>[] {
  return parseDelimited(filePath, ',')
}

function parseDelimited(filePath: string, delimiter: string): Record<string, string>[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ Archivo no encontrado: ${path.basename(filePath)} — saltando.`)
    return []
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim().length > 0)
  if (lines.length < 2) return []

  const headers = delimiter === ','
    ? parseCSVLine(lines[0])
    : lines[0].split(delimiter)

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = delimiter === ','
      ? parseCSVLine(lines[i])
      : lines[i].split(delimiter)

    if (values.length < headers.length - 1) continue // skip malformed

    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j].trim()] = (values[j] ?? '').trim()
    }
    rows.push(row)
  }
  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

function toFloat(value: string | undefined): number | null {
  if (!value || value.trim() === '' || value === 'n/a' || value === 'N/A') return null
  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : parsed
}

function normalizeTaskName(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}

// ════════════════════════════════════════════════════════════════════════════
// IN-MEMORY DATA STRUCTURES
// ════════════════════════════════════════════════════════════════════════════

interface OccupationRow {
  socCode: string
  titleEn: string
  description: string
  jobZone: number
}

interface TaskRow {
  socCode: string
  taskId: string
  taskText: string
  taskType: string
  // Inyectados desde Anthropic
  exposure: number | null       // promedio de las 5 dimensiones
  automationProxy: number | null // directive
  augmentationProxy: number | null // promedio de no-directive
  isAutomated: boolean
}

interface SkillRow {
  socCode: string
  skillName: string
  importance: number  // Scale ID = IM
  levelRequired: number // Scale ID = LV
}

interface AnthropicScores {
  feedbackLoop: number
  directive: number
  taskIteration: number
  validation: number
  learning: number
  filtered: number
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 1: Parsear O*NET — Occupations + Job Zones (merge)
// ════════════════════════════════════════════════════════════════════════════

function parseOccupations(): Map<string, OccupationRow> {
  console.log('\n📋 PASO 1: Parseando ocupaciones + Job Zones...')

  const occRows = parseTSV(path.join(DATA_DIR, 'Occupation Data.csv'))
  const jzRows = parseTSV(path.join(DATA_DIR, 'Job Zones.csv'))

  // Job Zone lookup
  const jobZoneMap = new Map<string, number>()
  for (const row of jzRows) {
    const soc = row['O*NET-SOC Code'] ?? ''
    const jz = parseInt(row['Job Zone'] ?? '3', 10)
    if (soc && !isNaN(jz)) jobZoneMap.set(soc, jz)
  }

  const occupations = new Map<string, OccupationRow>()
  for (const row of occRows) {
    const socCode = row['O*NET-SOC Code'] ?? ''
    const titleEn = row['Title'] ?? ''
    const description = row['Description'] ?? ''
    if (!socCode || !titleEn) continue

    occupations.set(socCode, {
      socCode,
      titleEn,
      description,
      jobZone: jobZoneMap.get(socCode) ?? 3,
    })
  }

  console.log(`  ✅ ${occupations.size} ocupaciones parseadas (${jobZoneMap.size} con Job Zone).`)
  return occupations
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 2: Parsear O*NET Tasks
// ════════════════════════════════════════════════════════════════════════════

function parseTasks(validSocCodes: Set<string>): Map<string, TaskRow[]> {
  console.log('\n📝 PASO 2: Parseando tareas O*NET...')

  const rows = parseTSV(path.join(DATA_DIR, 'Task Statements.csv'))
  const tasksBySoc = new Map<string, TaskRow[]>()
  let count = 0

  for (const row of rows) {
    const socCode = row['O*NET-SOC Code'] ?? ''
    const taskId = row['Task ID'] ?? ''
    const taskText = row['Task'] ?? ''
    const taskType = row['Task Type'] ?? ''

    if (!socCode || !taskText || !validSocCodes.has(socCode)) continue

    if (!tasksBySoc.has(socCode)) tasksBySoc.set(socCode, [])
    tasksBySoc.get(socCode)!.push({
      socCode,
      taskId,
      taskText,
      taskType,
      exposure: null,
      automationProxy: null,
      augmentationProxy: null,
      isAutomated: false,
    })
    count++
  }

  console.log(`  ✅ ${count} tareas parseadas para ${tasksBySoc.size} ocupaciones.`)
  return tasksBySoc
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 3: Parsear O*NET Skills (pivot IM/LV por SOC + Element Name)
// ════════════════════════════════════════════════════════════════════════════

function parseSkills(validSocCodes: Set<string>): Map<string, SkillRow[]> {
  console.log('\n🎯 PASO 3: Parseando skills O*NET (pivot IM/LV)...')

  const rows = parseTSV(path.join(DATA_DIR, 'Skills.csv'))

  // Pivot: key = "socCode|skillName" → { importance, levelRequired }
  const pivot = new Map<string, { importance: number | null; levelRequired: number | null }>()

  for (const row of rows) {
    const socCode = row['O*NET-SOC Code'] ?? ''
    const skillName = row['Element Name'] ?? ''
    const scaleId = row['Scale ID'] ?? ''
    const value = toFloat(row['Data Value'])

    if (!socCode || !skillName || !validSocCodes.has(socCode)) continue

    const key = `${socCode}|${skillName}`
    if (!pivot.has(key)) pivot.set(key, { importance: null, levelRequired: null })

    const entry = pivot.get(key)!
    if (scaleId === 'IM') entry.importance = value
    else if (scaleId === 'LV') entry.levelRequired = value
  }

  // Agrupar por SOC code
  const skillsBySoc = new Map<string, SkillRow[]>()
  let count = 0

  for (const [key, values] of pivot) {
    const [socCode, skillName] = key.split('|')
    if (!socCode || !skillName) continue
    if (values.importance === null && values.levelRequired === null) continue

    if (!skillsBySoc.has(socCode)) skillsBySoc.set(socCode, [])
    skillsBySoc.get(socCode)!.push({
      socCode,
      skillName,
      importance: values.importance ?? 3.0,
      levelRequired: values.levelRequired ?? 3.0,
    })
    count++
  }

  console.log(`  ✅ ${count} skills parseados (pivoted IM/LV) para ${skillsBySoc.size} ocupaciones.`)
  return skillsBySoc
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 4: Parsear Anthropic Economic Index + Task Mappings
// ════════════════════════════════════════════════════════════════════════════

function parseAnthropicScores(): Map<string, AnthropicScores> {
  console.log('\n📊 PASO 4: Parseando Anthropic Economic Index...')

  const rows = parseCommaSV(path.join(DATA_DIR, 'anthropic-economic-index.csv'))
  const scoreMap = new Map<string, AnthropicScores>()

  for (const row of rows) {
    const taskName = normalizeTaskName(row['task_name'] ?? '')
    if (!taskName) continue

    scoreMap.set(taskName, {
      feedbackLoop: toFloat(row['feedback_loop']) ?? 0,
      directive: toFloat(row['directive']) ?? 0,
      taskIteration: toFloat(row['task_iteration']) ?? 0,
      validation: toFloat(row['validation']) ?? 0,
      learning: toFloat(row['learning']) ?? 0,
      filtered: toFloat(row['filtered']) ?? 0,
    })
  }

  console.log(`  ✅ ${scoreMap.size} tareas con scores Anthropic.`)
  return scoreMap
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 5: JOIN — Inyectar scores Anthropic en tareas O*NET
// ════════════════════════════════════════════════════════════════════════════

function joinAnthropicToTasks(
  tasksBySoc: Map<string, TaskRow[]>,
  anthropicScores: Map<string, AnthropicScores>
): { matched: number; unmatched: number } {
  console.log('\n🔗 PASO 5: Vinculando Anthropic scores → O*NET tasks...')

  let matched = 0
  let unmatched = 0

  for (const [, tasks] of tasksBySoc) {
    for (const task of tasks) {
      const normalizedName = normalizeTaskName(task.taskText)
      const scores = anthropicScores.get(normalizedName)

      if (scores) {
        // Overall exposure = promedio de las 5 dimensiones funcionales
        const dims = [scores.feedbackLoop, scores.directive, scores.taskIteration, scores.validation, scores.learning]
        const nonZeroDims = dims.filter(d => d > 0)
        const avgExposure = nonZeroDims.length > 0
          ? dims.reduce((a, b) => a + b, 0) / dims.length
          : 0

        // Automation proxy = directive (IA reemplaza decisión humana)
        task.automationProxy = scores.directive

        // Augmentation proxy = promedio de dimensiones no-directive (IA asiste al humano)
        const augDims = [scores.feedbackLoop, scores.taskIteration, scores.validation, scores.learning]
        task.augmentationProxy = augDims.reduce((a, b) => a + b, 0) / augDims.length

        task.exposure = avgExposure
        task.isAutomated = avgExposure > 0.3 // threshold: más de 30% exposure = "automatizada"

        matched++
      } else {
        unmatched++
      }
    }
  }

  const total = matched + unmatched
  const pct = total > 0 ? Math.round((matched / total) * 100) : 0
  console.log(`  ✅ ${matched} tareas vinculadas (${pct}%). ${unmatched} sin match Anthropic.`)
  return { matched, unmatched }
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 6: ROLLUP — Promedios ponderados task → occupation
// Fórmula: Σ(importance × score) / Σ(importance)
// ════════════════════════════════════════════════════════════════════════════

interface OccupationRollup {
  observedExposure: number | null
  automationShare: number | null
  augmentationShare: number | null
  taskCoverage: number | null
}

function rollupToOccupation(
  tasksBySoc: Map<string, TaskRow[]>,
  importanceMap: Map<string, Map<string, number>> // socCode → taskId → importance from O*NET
): Map<string, OccupationRollup> {
  console.log('\n📈 PASO 6: Rollup ponderado task → occupation...')

  const rollups = new Map<string, OccupationRollup>()
  let withData = 0

  for (const [socCode, tasks] of tasksBySoc) {
    const tasksWithScores = tasks.filter(t => t.exposure !== null)
    const totalTasks = tasks.length
    const coverage = totalTasks > 0 ? tasksWithScores.length / totalTasks : 0

    if (tasksWithScores.length === 0) {
      rollups.set(socCode, {
        observedExposure: null,
        automationShare: null,
        augmentationShare: null,
        taskCoverage: coverage,
      })
      continue
    }

    // Weighted average usando importance de O*NET
    let sumExposure = 0, sumAutomation = 0, sumAugmentation = 0, sumWeight = 0

    for (const task of tasksWithScores) {
      // Buscar importance de esta tarea (default 3.0 si no hay)
      const taskImportances = importanceMap.get(socCode)
      const importance = taskImportances?.get(task.taskId) ?? 3.0

      sumExposure += importance * (task.exposure ?? 0)
      sumAutomation += importance * (task.automationProxy ?? 0)
      sumAugmentation += importance * (task.augmentationProxy ?? 0)
      sumWeight += importance
    }

    if (sumWeight > 0) {
      rollups.set(socCode, {
        observedExposure: Math.round((sumExposure / sumWeight) * 10000) / 10000,
        automationShare: Math.round((sumAutomation / sumWeight) * 10000) / 10000,
        augmentationShare: Math.round((sumAugmentation / sumWeight) * 10000) / 10000,
        taskCoverage: Math.round(coverage * 10000) / 10000,
      })
      withData++
    }
  }

  console.log(`  ✅ ${withData} ocupaciones con rollup de exposición. ${rollups.size - withData} sin datos Anthropic.`)
  return rollups
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 7: UPSERT — Guardar todo en PostgreSQL
// ════════════════════════════════════════════════════════════════════════════

async function upsertOccupations(
  occupations: Map<string, OccupationRow>,
  rollups: Map<string, OccupationRollup>
): Promise<number> {
  console.log('\n💾 PASO 7a: Guardando ocupaciones...')
  let count = 0

  for (const [socCode, occ] of occupations) {
    const rollup = rollups.get(socCode)

    await prisma.onetOccupation.upsert({
      where: { socCode },
      update: {
        titleEn: occ.titleEn,
        jobZone: occ.jobZone,
        observedExposure: rollup?.observedExposure ?? null,
        automationShare: rollup?.automationShare ?? null,
        augmentationShare: rollup?.augmentationShare ?? null,
        taskCoverage: rollup?.taskCoverage ?? null,
        updatedAt: new Date(),
      },
      create: {
        socCode: occ.socCode,
        titleEn: occ.titleEn,
        jobZone: occ.jobZone,
        observedExposure: rollup?.observedExposure ?? null,
        automationShare: rollup?.automationShare ?? null,
        augmentationShare: rollup?.augmentationShare ?? null,
        taskCoverage: rollup?.taskCoverage ?? null,
      },
    })
    count++

    if (count % 100 === 0) console.log(`  Ocupaciones: ${count}/${occupations.size}`)
  }

  console.log(`  ✅ ${count} ocupaciones guardadas.`)
  return count
}

async function upsertTasks(
  tasksBySoc: Map<string, TaskRow[]>
): Promise<number> {
  console.log('\n💾 PASO 7b: Guardando tareas...')
  let count = 0

  for (const [socCode, tasks] of tasksBySoc) {
    // Delete + create (idempotente)
    await prisma.onetTask.deleteMany({ where: { socCode } })

    const createData = tasks.map(t => ({
      socCode,
      taskDescription: t.taskText,
      importance: 3.0, // Default; se podría enriquecer con otro CSV de O*NET
      betaScore: t.exposure, // Anthropic exposure como proxy de betaScore
      isAutomated: t.isAutomated,
    }))

    if (createData.length > 0) {
      await prisma.onetTask.createMany({ data: createData })
      count += createData.length
    }

    if (count % 2000 === 0 && count > 0) console.log(`  Tareas: ${count}...`)
  }

  console.log(`  ✅ ${count} tareas guardadas.`)
  return count
}

async function upsertSkills(
  skillsBySoc: Map<string, SkillRow[]>
): Promise<number> {
  console.log('\n💾 PASO 7c: Guardando skills...')
  let count = 0

  for (const [socCode, skills] of skillsBySoc) {
    await prisma.onetSkill.deleteMany({ where: { socCode } })

    const createData = skills.map(s => ({
      socCode,
      skillName: s.skillName,
      importance: s.importance,
      levelRequired: s.levelRequired,
    }))

    if (createData.length > 0) {
      await prisma.onetSkill.createMany({ data: createData })
      count += createData.length
    }

    if (count % 2000 === 0 && count > 0) console.log(`  Skills: ${count}...`)
  }

  console.log(`  ✅ ${count} skills guardados.`)
  return count
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN — Pipeline ETL completa
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  ETL: O*NET + Anthropic Economic Index → FocalizaHR')
  console.log(`  Directorio: ${DATA_DIR}`)
  console.log('═══════════════════════════════════════════════════════════')

  if (!fs.existsSync(DATA_DIR)) {
    console.error(`\n❌ Directorio ${DATA_DIR} no encontrado.`)
    process.exit(1)
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.csv'))
  console.log(`\nArchivos CSV encontrados: ${files.length}`)
  files.forEach(f => console.log(`  - ${f}`))

  // ── PARSE (todo en memoria) ──
  const occupations = parseOccupations()
  const validSocCodes = new Set(occupations.keys())
  const tasksBySoc = parseTasks(validSocCodes)
  const skillsBySoc = parseSkills(validSocCodes)
  const anthropicScores = parseAnthropicScores()

  // ── JOIN (Anthropic → O*NET tasks) ──
  const joinResult = joinAnthropicToTasks(tasksBySoc, anthropicScores)

  // ── Build importance map para rollup ──
  // Nota: Task Statements de O*NET no tiene importance directa.
  // Usamos importance de la tarea en el sistema Anthropic (exposición como proxy)
  // o default 3.0. Un enriquecimiento futuro puede usar Task Ratings de O*NET.
  const importanceMap = new Map<string, Map<string, number>>()
  for (const [socCode, tasks] of tasksBySoc) {
    const taskMap = new Map<string, number>()
    for (const t of tasks) {
      taskMap.set(t.taskId, 3.0) // default uniform weight
    }
    importanceMap.set(socCode, taskMap)
  }

  // ── ROLLUP (task → occupation) ──
  const rollups = rollupToOccupation(tasksBySoc, importanceMap)

  // ── UPSERT (a PostgreSQL) ──
  const nOccupations = await upsertOccupations(occupations, rollups)
  const nTasks = await upsertTasks(tasksBySoc)
  const nSkills = await upsertSkills(skillsBySoc)

  // ── RESUMEN ──
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  RESUMEN ETL')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`  Ocupaciones:        ${nOccupations}`)
  console.log(`  Tareas:             ${nTasks}`)
  console.log(`  Skills:             ${nSkills}`)
  console.log(`  Tasks con Anthropic:${joinResult.matched} (${Math.round(joinResult.matched / (joinResult.matched + joinResult.unmatched) * 100)}%)`)
  console.log(`  Rollup exposición:  ${[...rollups.values()].filter(r => r.observedExposure !== null).length} ocupaciones`)
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  ✅ ETL completado. Puede re-ejecutarse sin duplicar.')
  console.log('═══════════════════════════════════════════════════════════')
}

main()
  .catch(e => {
    console.error('❌ Error durante el ETL:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
