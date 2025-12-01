// scripts/recalculate-journeys.ts
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function recalculateJourneys() {
  console.log('═══════════════════════════════════════════════')
  console.log('♻️  RECALCULAR SCORES JOURNEYS AFECTADOS')
  console.log('═══════════════════════════════════════════════\n')
  
  // ========================================================================
  // PASO 1: LEER IDS
  // ========================================================================
  const journeyIdsPath = path.join(process.cwd(), 'affected-journeys.json')
  
  if (!fs.existsSync(journeyIdsPath)) {
    console.log('⚠️  No se encontró affected-journeys.json')
    console.log('✅ No hay journeys que recalcular.\n')
    return
  }
  
  const journeyIds: string[] = JSON.parse(
    fs.readFileSync(journeyIdsPath, 'utf-8')
  )
  
  console.log(`🔍 Journeys a recalcular: ${journeyIds.length}\n`)
  
  // ========================================================================
  // PASO 2: RECALCULAR CADA JOURNEY
  // ========================================================================
  for (const journeyId of journeyIds) {
    const journey = await prisma.journeyOrchestration.findUnique({
      where: { id: journeyId },
      select: {
        id: true,
        fullName: true,
        clarificationScore: true,
        stage2ParticipantId: true
      }
    })
    
    if (!journey || !journey.stage2ParticipantId) {
      console.log(`⚠️  Journey ${journeyId} no encontrado`)
      continue
    }
    
    const oldScore = journey.clarificationScore
    
    // Obtener responses actuales
    const responses = await prisma.response.findMany({
      where: {
        participantId: journey.stage2ParticipantId,
        rating: { not: null }
      },
      include: {
        question: {
          select: {
            responseType: true,
            minValue: true,
            maxValue: true
          }
        }
      }
    })
    
    if (responses.length === 0) {
      console.log(`   ${journey.fullName}: Sin responses, score = null`)
      
      await prisma.journeyOrchestration.update({
        where: { id: journeyId },
        data: { clarificationScore: null }
      })
      
      continue
    }
    
    // Normalizar y calcular
    const scores = responses.map(r => {
      const rating = r.rating!
      const min = r.question.minValue
      const max = r.question.maxValue
      
      return ((rating - min) / (max - min)) * 5
    })
    
    const newScore = Math.round(
      (scores.reduce((a, b) => a + b, 0) / scores.length) * 10
    ) / 10
    
    // Actualizar
    await prisma.journeyOrchestration.update({
      where: { id: journeyId },
      data: { clarificationScore: newScore }
    })
    
    console.log(`   ✅ ${journey.fullName}:`)
    console.log(`      Score anterior: ${oldScore}`)
    console.log(`      Score nuevo: ${newScore}`)
    console.log(`      Responses: ${responses.length}/5\n`)
  }
  
  console.log('═══════════════════════════════════════════════')
  console.log('✅ RECÁLCULO COMPLETADO')
  console.log('═══════════════════════════════════════════════\n')
}

recalculateJourneys()
  .catch((error) => {
    console.error('\n❌ ERROR:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })