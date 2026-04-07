// ════════════════════════════════════════════════════════════════════════════
// TRANSLATE O*NET TASKS TO SPANISH — Batch via Claude Haiku
// scripts/translate-onet-tasks.ts
// ════════════════════════════════════════════════════════════════════════════
// Traduce taskDescriptionEs + titleEs para O*NET records sin traducción.
// Idempotente: solo traduce donde el campo ES es NULL.
// Batches de 20 tareas por llamada API.
//
// Ejecutar: npx tsx scripts/translate-onet-tasks.ts
// Requiere: ANTHROPIC_API_KEY en .env
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'

const prisma = new PrismaClient()
const BATCH_SIZE = 20
const MAX_TASKS = 2000 // Limitar para controlar costos

async function translateOccupationTitles() {
  console.log('\n📋 PASO 1: Traduciendo títulos de ocupaciones...')

  const untranslated = await prisma.onetOccupation.findMany({
    where: { titleEs: null },
    select: { socCode: true, titleEn: true },
    take: 200,
  })

  if (untranslated.length === 0) {
    console.log('  ✅ Todos los títulos ya tienen traducción.')
    return 0
  }

  const client = new Anthropic()
  let translated = 0

  for (let i = 0; i < untranslated.length; i += BATCH_SIZE) {
    const batch = untranslated.slice(i, i + BATCH_SIZE)
    const titles = batch.map((o, idx) => `${idx + 1}. ${o.titleEn}`).join('\n')

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Traduce estos títulos de cargo al español corporativo chileno. Responde SOLO con el JSON array, sin explicación.

${titles}

Formato: ["Traducción 1", "Traducción 2", ...]`,
        }],
      })

      const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) continue

      const translations: string[] = JSON.parse(match[0])

      for (let j = 0; j < batch.length && j < translations.length; j++) {
        await prisma.onetOccupation.update({
          where: { socCode: batch[j].socCode },
          data: { titleEs: translations[j] },
        })
        translated++
      }

      console.log(`  Títulos: ${translated}/${untranslated.length}`)
    } catch (error) {
      console.warn(`  ⚠ Error en batch títulos ${i}: ${error instanceof Error ? error.message : 'unknown'}`)
    }
  }

  console.log(`  ✅ ${translated} títulos traducidos.`)
  return translated
}

async function translateTasks() {
  console.log('\n📝 PASO 2: Traduciendo tareas...')

  const untranslated = await prisma.onetTask.findMany({
    where: { taskDescriptionEs: null },
    select: { id: true, taskDescription: true },
    take: MAX_TASKS,
    orderBy: { importance: 'desc' }, // más importantes primero
  })

  if (untranslated.length === 0) {
    console.log('  ✅ Todas las tareas ya tienen traducción.')
    return 0
  }

  console.log(`  ${untranslated.length} tareas por traducir (max ${MAX_TASKS})...`)

  const client = new Anthropic()
  let translated = 0

  for (let i = 0; i < untranslated.length; i += BATCH_SIZE) {
    const batch = untranslated.slice(i, i + BATCH_SIZE)
    const tasks = batch.map((t, idx) => `${idx + 1}. ${t.taskDescription}`).join('\n')

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Traduce estas tareas laborales al español corporativo chileno moderno. Mantén el significado exacto. No agregues ni quites tareas. Responde SOLO con el JSON array.

${tasks}

Formato: ["Tarea traducida 1", "Tarea traducida 2", ...]`,
        }],
      })

      const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) continue

      const translations: string[] = JSON.parse(match[0])

      for (let j = 0; j < batch.length && j < translations.length; j++) {
        await prisma.onetTask.update({
          where: { id: batch[j].id },
          data: { taskDescriptionEs: translations[j] },
        })
        translated++
      }

      if (translated % 100 === 0 || i + BATCH_SIZE >= untranslated.length) {
        console.log(`  Tareas: ${translated}/${untranslated.length}`)
      }
    } catch (error) {
      console.warn(`  ⚠ Error en batch tareas ${i}: ${error instanceof Error ? error.message : 'unknown'}`)
    }
  }

  console.log(`  ✅ ${translated} tareas traducidas.`)
  return translated
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  TRANSLATE O*NET → Español Corporativo Chileno')
  console.log('═══════════════════════════════════════════════════════════')

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('\n❌ ANTHROPIC_API_KEY no configurada en .env')
    process.exit(1)
  }

  const titles = await translateOccupationTitles()
  const tasks = await translateTasks()

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log(`  RESUMEN: ${titles} títulos + ${tasks} tareas traducidas`)
  console.log('═══════════════════════════════════════════════════════════')
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
