// ════════════════════════════════════════════════════════════════════════════
// ENRICH O*NET — Traducción ES + Clasificación betaScore vía Claude Haiku
// prisma/scripts/enrich-onet-tasks.ts
// ════════════════════════════════════════════════════════════════════════════
// Procesa 4 operaciones en orden:
//   1. OnetOccupation.titleEs       (traducción)
//   2. OnetSkill.skillNameEs        (traducción)
//   3. OnetTask.taskDescriptionEs   (traducción)
//   4. OnetTask.betaScore           (clasificación 0-1)
//
// Idempotente: solo procesa filas con el campo NULL. Si el script se corta,
// re-correrlo continúa exactamente donde quedó.
//
// Sin límite: procesa todo el catálogo (~18.8K tareas + ~28K skills + ~800
// occupations). Costo estimado: ~$8 USD totales con Haiku.
//
// Batch JSON I/O — 20 items por llamada al modelo. Sequential calls.
//
// Ejecutar: npx tsx prisma/scripts/enrich-onet-tasks.ts
// Requiere: ANTHROPIC_API_KEY en .env
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'

const prisma = new PrismaClient()

const BATCH_SIZE = 20
const MODEL = 'claude-haiku-4-5-20251001'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function extractText(response: Anthropic.Messages.Message): string {
  const block = response.content[0]
  return block?.type === 'text' ? block.text : ''
}

function parseJSONArray(text: string): unknown[] | null {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0])
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Traduce un batch de strings al español profesional chileno.
 * Retorna array del MISMO largo que `items` (o array vacío si falla).
 */
async function translateBatch(
  client: Anthropic,
  items: string[],
  kindLabel: string,
): Promise<string[]> {
  const numbered = items.map((s, i) => `${i + 1}. ${s}`).join('\n')

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Traduce ${kindLabel} al español profesional chileno. Mantén el significado exacto. No agregues ni omitas nada.

${numbered}

Responde SOLO con un JSON array de strings traducidos en el mismo orden, sin explicación adicional.
Formato: ["traducción 1", "traducción 2", ...]`,
      },
    ],
  })

  const text = extractText(response)
  const parsed = parseJSONArray(text)
  if (!parsed) return []

  return parsed.map(v => (typeof v === 'string' ? v.trim() : ''))
}

/**
 * Clasifica un batch de tareas con betaScore 0-1.
 * Retorna array del mismo largo (null para items que no se pudieron parsear).
 */
async function classifyBatch(
  client: Anthropic,
  taskDescriptions: string[],
): Promise<(number | null)[]> {
  const numbered = taskDescriptions.map((s, i) => `${i + 1}. ${s}`).join('\n')

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Para cada tarea laboral numerada abajo, evalúa qué tan automatizable es con IA actual (LLMs, automatización). Devuelve un decimal entre 0 y 1, donde 0 = imposible automatizar y 1 = totalmente automatizable.

${numbered}

Responde SOLO con un JSON array de números decimales en el mismo orden, sin explicación adicional.
Formato: [0.7, 0.3, 0.85, ...]`,
      },
    ],
  })

  const text = extractText(response)
  const parsed = parseJSONArray(text)
  if (!parsed) return []

  return parsed.map(v => {
    const num = typeof v === 'number' ? v : parseFloat(String(v))
    if (isNaN(num)) return null
    return Math.max(0, Math.min(1, num))
  })
}

function progressLine(processed: number, total: number, label: string) {
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0
  console.log(`  ${label}: ${processed}/${total} (${pct}%)`)
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERACIÓN 1 — Traducir titleEs en OnetOccupation
// ─────────────────────────────────────────────────────────────────────────────

async function translateOccupations(client: Anthropic): Promise<number> {
  console.log('\n📋 PASO 1/4: Traduciendo títulos de ocupaciones (OnetOccupation.titleEs)')

  const items = await prisma.onetOccupation.findMany({
    where: { titleEs: null },
    select: { socCode: true, titleEn: true },
    orderBy: { socCode: 'asc' },
  })

  if (items.length === 0) {
    console.log('  ✅ Todos los títulos ya tienen traducción.')
    return 0
  }

  console.log(`  ${items.length} títulos por traducir...`)

  let processed = 0

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    const inputs = batch.map(o => o.titleEn)

    try {
      const outputs = await translateBatch(client, inputs, 'estos títulos de cargo')

      if (outputs.length !== batch.length) {
        console.warn(`  ⚠ Batch ${i}: tamaño respuesta ${outputs.length} ≠ ${batch.length}, saltando`)
        continue
      }

      await Promise.all(
        batch.map((occ, j) => {
          const translation = outputs[j]
          if (!translation) return null
          return prisma.onetOccupation.update({
            where: { socCode: occ.socCode },
            data: { titleEs: translation },
          })
        }),
      )

      processed += batch.length

      if (processed % 100 === 0 || i + BATCH_SIZE >= items.length) {
        progressLine(processed, items.length, 'Títulos')
      }
    } catch (error) {
      console.warn(
        `  ⚠ Error en batch ${i}: ${error instanceof Error ? error.message : 'unknown'}`,
      )
    }
  }

  console.log(`  ✅ ${processed} títulos traducidos.`)
  return processed
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERACIÓN 2 — Traducir skillNameEs en OnetSkill
// ─────────────────────────────────────────────────────────────────────────────

async function translateSkills(client: Anthropic): Promise<number> {
  console.log('\n🛠  PASO 2/4: Traduciendo skills (OnetSkill.skillNameEs)')

  const items = await prisma.onetSkill.findMany({
    where: { skillNameEs: null },
    select: { id: true, skillName: true },
    orderBy: { id: 'asc' },
  })

  if (items.length === 0) {
    console.log('  ✅ Todas las skills ya tienen traducción.')
    return 0
  }

  console.log(`  ${items.length} skills por traducir...`)

  let processed = 0

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    const inputs = batch.map(s => s.skillName)

    try {
      const outputs = await translateBatch(client, inputs, 'estas habilidades laborales')

      if (outputs.length !== batch.length) {
        console.warn(`  ⚠ Batch ${i}: tamaño respuesta ${outputs.length} ≠ ${batch.length}, saltando`)
        continue
      }

      await Promise.all(
        batch.map((skill, j) => {
          const translation = outputs[j]
          if (!translation) return null
          return prisma.onetSkill.update({
            where: { id: skill.id },
            data: { skillNameEs: translation },
          })
        }),
      )

      processed += batch.length

      if (processed % 200 === 0 || i + BATCH_SIZE >= items.length) {
        progressLine(processed, items.length, 'Skills')
      }
    } catch (error) {
      console.warn(
        `  ⚠ Error en batch ${i}: ${error instanceof Error ? error.message : 'unknown'}`,
      )
    }
  }

  console.log(`  ✅ ${processed} skills traducidas.`)
  return processed
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERACIÓN 3 — Traducir taskDescriptionEs en OnetTask
// ─────────────────────────────────────────────────────────────────────────────

async function translateTasks(client: Anthropic): Promise<number> {
  console.log('\n📝 PASO 3/4: Traduciendo tareas (OnetTask.taskDescriptionEs)')

  const items = await prisma.onetTask.findMany({
    where: { taskDescriptionEs: null },
    select: { id: true, taskDescription: true },
    orderBy: { importance: 'desc' }, // las más importantes primero (mejor cobertura útil temprana)
  })

  if (items.length === 0) {
    console.log('  ✅ Todas las tareas ya tienen traducción.')
    return 0
  }

  console.log(`  ${items.length} tareas por traducir...`)

  let processed = 0

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    const inputs = batch.map(t => t.taskDescription)

    try {
      const outputs = await translateBatch(client, inputs, 'estas tareas laborales')

      if (outputs.length !== batch.length) {
        console.warn(`  ⚠ Batch ${i}: tamaño respuesta ${outputs.length} ≠ ${batch.length}, saltando`)
        continue
      }

      await Promise.all(
        batch.map((task, j) => {
          const translation = outputs[j]
          if (!translation) return null
          return prisma.onetTask.update({
            where: { id: task.id },
            data: { taskDescriptionEs: translation },
          })
        }),
      )

      processed += batch.length

      if (processed % 500 === 0 || i + BATCH_SIZE >= items.length) {
        progressLine(processed, items.length, 'Tareas')
      }
    } catch (error) {
      console.warn(
        `  ⚠ Error en batch ${i}: ${error instanceof Error ? error.message : 'unknown'}`,
      )
    }
  }

  console.log(`  ✅ ${processed} tareas traducidas.`)
  return processed
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERACIÓN 4 — Clasificar betaScore en OnetTask
// ─────────────────────────────────────────────────────────────────────────────

async function classifyTaskBetaScores(client: Anthropic): Promise<number> {
  console.log('\n🤖 PASO 4/4: Clasificando betaScore (OnetTask.betaScore)')

  // Preferimos la descripción ES si ya existe (más natural para Haiku),
  // sino caemos al inglés.
  const items = await prisma.onetTask.findMany({
    where: { betaScore: null },
    select: { id: true, taskDescription: true, taskDescriptionEs: true },
    orderBy: { importance: 'desc' },
  })

  if (items.length === 0) {
    console.log('  ✅ Todas las tareas ya tienen betaScore.')
    return 0
  }

  console.log(`  ${items.length} tareas por clasificar...`)

  let processed = 0
  let skippedNullParses = 0

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    const inputs = batch.map(t => t.taskDescriptionEs ?? t.taskDescription)

    try {
      const outputs = await classifyBatch(client, inputs)

      if (outputs.length !== batch.length) {
        console.warn(`  ⚠ Batch ${i}: tamaño respuesta ${outputs.length} ≠ ${batch.length}, saltando`)
        continue
      }

      await Promise.all(
        batch.map((task, j) => {
          const score = outputs[j]
          if (score === null) {
            skippedNullParses++
            return null
          }
          return prisma.onetTask.update({
            where: { id: task.id },
            data: { betaScore: score },
          })
        }),
      )

      processed += batch.filter((_, j) => outputs[j] !== null).length

      if (processed % 500 === 0 || i + BATCH_SIZE >= items.length) {
        progressLine(processed, items.length, 'Clasificadas')
      }
    } catch (error) {
      console.warn(
        `  ⚠ Error en batch ${i}: ${error instanceof Error ? error.message : 'unknown'}`,
      )
    }
  }

  if (skippedNullParses > 0) {
    console.log(`  ⚠ ${skippedNullParses} tareas no pudieron parsearse (quedan NULL para próximo run)`)
  }
  console.log(`  ✅ ${processed} tareas clasificadas.`)
  return processed
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  ENRICH O*NET — Traducción ES + Clasificación betaScore')
  console.log(`  Modelo: ${MODEL}`)
  console.log(`  Batch:  ${BATCH_SIZE} items por llamada`)
  console.log('═══════════════════════════════════════════════════════════')

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('\n❌ ANTHROPIC_API_KEY no configurada en .env')
    process.exit(1)
  }

  const client = new Anthropic()
  const startTime = Date.now()

  const stats = {
    occupationTitles: await translateOccupations(client),
    skillNames: await translateSkills(client),
    taskDescriptions: await translateTasks(client),
    betaScores: await classifyTaskBetaScores(client),
  }

  const elapsedSec = Math.round((Date.now() - startTime) / 1000)
  const elapsedMin = Math.floor(elapsedSec / 60)
  const elapsedSecRem = elapsedSec % 60

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('  RESUMEN')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`  Títulos ocupación traducidos:  ${stats.occupationTitles}`)
  console.log(`  Skills traducidas:             ${stats.skillNames}`)
  console.log(`  Tareas traducidas:             ${stats.taskDescriptions}`)
  console.log(`  Tareas clasificadas (β):       ${stats.betaScores}`)
  console.log(`  Tiempo total:                  ${elapsedMin}m ${elapsedSecRem}s`)
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Re-correr el script es seguro: solo procesa NULL.')
}

main()
  .catch(e => {
    console.error('\n❌ Error fatal:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
