// ════════════════════════════════════════════════════════════════════════════
// SEED: O*NET Reference Data + Anthropic Economic Index
// prisma/seeds/onet-reference-seed.ts
// ════════════════════════════════════════════════════════════════════════════
// Lee CSVs pre-descargados de data/onet/ y carga a las tablas de referencia.
// Estrategia: Upsert (idempotente — puede re-ejecutarse sin duplicar).
//
// Archivos esperados en data/onet/:
//   - Occupation Data.csv        (O*NET: SOC code, título, Job Zone)
//   - Task Statements.csv        (O*NET: tareas por ocupación)
//   - Skills.csv                 (O*NET: skills por ocupación)
//   - anthropic-economic-index.csv (Anthropic: exposure scores)
//
// Ejecutar: npx tsx prisma/seeds/onet-reference-seed.ts
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const DATA_DIR = path.resolve(__dirname, '../../data/onet')

// ════════════════════════════════════════════════════════════════════════════
// CSV PARSER — lightweight, no external dependency beyond fs
// ════════════════════════════════════════════════════════════════════════════

function parseCSV(filePath: string): Record<string, string>[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ Archivo no encontrado: ${filePath} — saltando.`)
    return []
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim().length > 0)
  if (lines.length < 2) return []

  // Parse header — handle quoted fields
  const headers = parseCSVLine(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) continue // skip malformed rows

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

function toInt(value: string | undefined): number {
  if (!value || value.trim() === '') return 0
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? 0 : parsed
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 1: Cargar Ocupaciones
// ════════════════════════════════════════════════════════════════════════════

async function seedOccupations(): Promise<number> {
  console.log('\n📋 PASO 1: Cargando ocupaciones O*NET...')

  const filePath = path.join(DATA_DIR, 'Occupation Data.csv')
  const rows = parseCSV(filePath)

  if (rows.length === 0) {
    console.log('  ⚠ No se encontraron datos de ocupaciones.')
    return 0
  }

  let count = 0
  for (const row of rows) {
    // O*NET CSV columns: O*NET-SOC Code, Title, Description
    const socCode = row['O*NET-SOC Code'] ?? row['O*NET-SOC 2019 Code'] ?? row['SOC Code'] ?? ''
    const titleEn = row['Title'] ?? row['title'] ?? ''

    if (!socCode || !titleEn) continue

    // Job Zone viene de otro CSV (Job Zones.csv) — si no existe, default 3
    const jobZone = toInt(row['Job Zone']) || 3

    await prisma.onetOccupation.upsert({
      where: { socCode },
      update: { titleEn, jobZone, updatedAt: new Date() },
      create: {
        socCode,
        titleEn,
        jobZone,
      },
    })
    count++

    if (count % 100 === 0) {
      console.log(`  Procesando ocupación ${count} de ${rows.length}...`)
    }
  }

  console.log(`  ✅ ${count} ocupaciones cargadas.`)
  return count
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 2: Cargar Anthropic Economic Index (scores de exposición)
// ════════════════════════════════════════════════════════════════════════════

async function seedAnthropicExposure(): Promise<number> {
  console.log('\n📊 PASO 2: Cargando Anthropic Economic Index...')

  const filePath = path.join(DATA_DIR, 'anthropic-economic-index.csv')
  const rows = parseCSV(filePath)

  if (rows.length === 0) {
    console.log('  ⚠ No se encontraron datos de Anthropic. Saltando.')
    return 0
  }

  let count = 0
  let skipped = 0

  for (const row of rows) {
    // Anthropic CSV — column names may vary, try common patterns
    const socCode =
      row['soc_code'] ?? row['SOC Code'] ?? row['O*NET-SOC Code'] ?? row['onet_soc_code'] ?? ''
    const observedExposure =
      toFloat(row['observed_exposure']) ?? toFloat(row['exposure']) ?? toFloat(row['overall_exposure'])
    const automationShare =
      toFloat(row['automation_share']) ?? toFloat(row['automation_fraction'])
    const augmentationShare =
      toFloat(row['augmentation_share']) ?? toFloat(row['augmentation_fraction'])
    const taskCoverage =
      toFloat(row['task_coverage']) ?? toFloat(row['coverage'])

    if (!socCode) continue

    // Solo actualiza si la ocupación ya existe
    try {
      await prisma.onetOccupation.update({
        where: { socCode },
        data: {
          observedExposure,
          automationShare,
          augmentationShare,
          taskCoverage,
          updatedAt: new Date(),
        },
      })
      count++
    } catch {
      // Ocupación no existe en nuestra tabla — skip
      skipped++
    }

    if (count % 100 === 0 && count > 0) {
      console.log(`  Procesando exposure ${count}...`)
    }
  }

  console.log(`  ✅ ${count} ocupaciones con scores Anthropic actualizados. ${skipped} SOC codes no encontrados (OK — filtramos por relevancia).`)
  return count
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 3: Cargar Tareas
// ════════════════════════════════════════════════════════════════════════════

async function seedTasks(): Promise<number> {
  console.log('\n📝 PASO 3: Cargando tareas O*NET...')

  const filePath = path.join(DATA_DIR, 'Task Statements.csv')
  const rows = parseCSV(filePath)

  if (rows.length === 0) {
    console.log('  ⚠ No se encontraron datos de tareas.')
    return 0
  }

  // Obtener SOC codes existentes para filtrar
  const existingOccupations = await prisma.onetOccupation.findMany({
    select: { socCode: true },
  })
  const validSocCodes = new Set(existingOccupations.map(o => o.socCode))

  let count = 0
  let skipped = 0

  // Agrupar tareas por SOC code para batch upsert
  const tasksBySoc = new Map<string, typeof rows>()
  for (const row of rows) {
    const socCode = row['O*NET-SOC Code'] ?? row['SOC Code'] ?? ''
    if (!socCode || !validSocCodes.has(socCode)) {
      skipped++
      continue
    }
    if (!tasksBySoc.has(socCode)) tasksBySoc.set(socCode, [])
    tasksBySoc.get(socCode)!.push(row)
  }

  // Limpiar tareas existentes y reinsertar (idempotente)
  for (const [socCode, tasks] of tasksBySoc) {
    await prisma.onetTask.deleteMany({ where: { socCode } })

    const createData = tasks.map(row => ({
      socCode,
      taskDescription: row['Task'] ?? row['Description'] ?? row['task_description'] ?? '',
      importance: toFloat(row['Importance']) ?? toFloat(row['importance']) ?? 3.0,
      betaScore: toFloat(row['Beta Score']) ?? toFloat(row['beta_score']) ?? null,
      isAutomated: (row['Is Automated'] ?? row['is_automated'] ?? '').toLowerCase() === 'true',
    }))

    if (createData.length > 0 && createData[0].taskDescription) {
      await prisma.onetTask.createMany({ data: createData })
      count += createData.length
    }

    if (count % 500 === 0 && count > 0) {
      console.log(`  Procesando tarea ${count}...`)
    }
  }

  console.log(`  ✅ ${count} tareas cargadas para ${tasksBySoc.size} ocupaciones. ${skipped} filas de SOC codes no relevantes (OK).`)
  return count
}

// ════════════════════════════════════════════════════════════════════════════
// PASO 4: Cargar Skills
// ════════════════════════════════════════════════════════════════════════════

async function seedSkills(): Promise<number> {
  console.log('\n🎯 PASO 4: Cargando skills O*NET...')

  const filePath = path.join(DATA_DIR, 'Skills.csv')
  const rows = parseCSV(filePath)

  if (rows.length === 0) {
    console.log('  ⚠ No se encontraron datos de skills.')
    return 0
  }

  // Obtener SOC codes existentes
  const existingOccupations = await prisma.onetOccupation.findMany({
    select: { socCode: true },
  })
  const validSocCodes = new Set(existingOccupations.map(o => o.socCode))

  let count = 0
  let skipped = 0

  // Agrupar por SOC code
  const skillsBySoc = new Map<string, typeof rows>()
  for (const row of rows) {
    const socCode = row['O*NET-SOC Code'] ?? row['SOC Code'] ?? ''
    if (!socCode || !validSocCodes.has(socCode)) {
      skipped++
      continue
    }
    if (!skillsBySoc.has(socCode)) skillsBySoc.set(socCode, [])
    skillsBySoc.get(socCode)!.push(row)
  }

  // Limpiar skills existentes y reinsertar
  for (const [socCode, skills] of skillsBySoc) {
    await prisma.onetSkill.deleteMany({ where: { socCode } })

    const createData = skills.map(row => ({
      socCode,
      skillName: row['Element Name'] ?? row['Skill Name'] ?? row['skill_name'] ?? '',
      levelRequired: toFloat(row['Level']) ?? toFloat(row['Data Value']) ?? toFloat(row['level_required']) ?? 3.0,
      importance: toFloat(row['Importance']) ?? toFloat(row['importance']) ?? 3.0,
    }))

    if (createData.length > 0 && createData[0].skillName) {
      await prisma.onetSkill.createMany({ data: createData })
      count += createData.length
    }

    if (count % 500 === 0 && count > 0) {
      console.log(`  Procesando skill ${count}...`)
    }
  }

  console.log(`  ✅ ${count} skills cargados para ${skillsBySoc.size} ocupaciones. ${skipped} filas no relevantes.`)
  return count
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  SEED: O*NET + Anthropic Economic Index')
  console.log(`  Directorio de datos: ${DATA_DIR}`)
  console.log('═══════════════════════════════════════════════════════════')

  // Verificar que el directorio existe
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`\n❌ Directorio ${DATA_DIR} no encontrado.`)
    console.error('   Crear carpeta data/onet/ y colocar los CSVs:')
    console.error('   - Occupation Data.csv  (de onetcenter.org)')
    console.error('   - Task Statements.csv  (de onetcenter.org)')
    console.error('   - Skills.csv           (de onetcenter.org)')
    console.error('   - anthropic-economic-index.csv (de HuggingFace Anthropic/EconomicIndex)')
    process.exit(1)
  }

  // Listar archivos disponibles
  const files = fs.readdirSync(DATA_DIR)
  console.log(`\nArchivos encontrados en data/onet/:`)
  files.forEach(f => console.log(`  - ${f}`))

  const occupations = await seedOccupations()
  const anthropic = await seedAnthropicExposure()
  const tasks = await seedTasks()
  const skills = await seedSkills()

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  RESUMEN')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`  Ocupaciones:        ${occupations}`)
  console.log(`  Scores Anthropic:   ${anthropic}`)
  console.log(`  Tareas:             ${tasks}`)
  console.log(`  Skills:             ${skills}`)
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  ✅ Seed completado. Puede re-ejecutarse sin duplicar.')
  console.log('═══════════════════════════════════════════════════════════')
}

main()
  .catch(e => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
