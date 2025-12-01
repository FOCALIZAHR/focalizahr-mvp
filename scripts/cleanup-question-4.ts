// scripts/cleanup-question-4.ts
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function cleanupQuestion4() {
  console.log('═══════════════════════════════════════════════')
  console.log('🧹 LIMPIEZA PREGUNTA #4 DÍA 7')
  console.log('═══════════════════════════════════════════════\n')
  
  const oldQuestionId = 'cmhlck9zq0008142utwylg5cz'
  
  // ========================================================================
  // PASO 1: VERIFICAR PREGUNTA
  // ========================================================================
  const oldQuestion = await prisma.question.findUnique({
    where: { id: oldQuestionId },
    include: {
      campaignType: {
        select: { slug: true }
      }
    }
  })
  
  if (!oldQuestion) {
    console.log('⚠️  Pregunta no encontrada. Quizás ya fue eliminada.')
    console.log('✅ Puedes ejecutar el seed directamente.\n')
    return
  }
  
  console.log('📋 Pregunta encontrada:')
  console.log(`   ID: ${oldQuestion.id}`)
  console.log(`   Texto: "${oldQuestion.text}"`)
  console.log(`   Categoría: ${oldQuestion.category}`)
  console.log(`   Tipo: ${oldQuestion.responseType}`)
  console.log(`   Campaign: ${oldQuestion.campaignType.slug}\n`)
  
  // ========================================================================
  // PASO 2: OBTENER RESPONSES
  // ========================================================================
  const responses = await prisma.response.findMany({
    where: { questionId: oldQuestionId }
  })
  
  console.log(`🔍 Responses encontradas: ${responses.length}`)
  
  if (responses.length === 0) {
    console.log('✅ No hay responses. Eliminando pregunta...\n')
    
    await prisma.question.delete({
      where: { id: oldQuestionId }
    })
    
    console.log('✅ Pregunta eliminada.')
    console.log('✅ Puedes ejecutar el seed ahora.\n')
    return
  }
  
  // ========================================================================
  // PASO 3: OBTENER INFO PARTICIPANTS
  // ========================================================================
  const participantIds = responses.map(r => r.participantId)
  
  const participants = await prisma.participant.findMany({
    where: {
      id: { in: participantIds }
    },
    select: {
      id: true,
      name: true,
      nationalId: true,
      hasResponded: true,
      campaign: {
        select: {
          name: true
        }
      }
    }
  })
  
  const participantMap = new Map(
    participants.map(p => [p.id, p])
  )
  
  // ========================================================================
  // PASO 4: MOSTRAR DETALLE
  // ========================================================================
  console.log('\n📊 Detalle de responses a eliminar:\n')
  responses.forEach((r, idx) => {
    const p = participantMap.get(r.participantId)
    if (p) {
      console.log(`   ${idx + 1}. ${p.name || 'Sin nombre'} (${p.nationalId})`)
      console.log(`      Rating: ${r.rating}`)
      console.log(`      Campaña: ${p.campaign.name}`)
    }
  })
  
  // ========================================================================
  // PASO 5: CREAR BACKUP
  // ========================================================================
  console.log('\n📦 Creando backup...')
  
  const backupData = {
    timestamp: new Date().toISOString(),
    questionId: oldQuestionId,
    questionText: oldQuestion.text,
    responsesCount: responses.length,
    responses: responses.map(r => {
      const p = participantMap.get(r.participantId)
      return {
        id: r.id,
        participantId: r.participantId,
        participantName: p?.name || 'Desconocido',
        participantNationalId: p?.nationalId || 'N/A',
        rating: r.rating,
        createdAt: r.createdAt
      }
    })
  }
  
  const backupPath = path.join(process.cwd(), 'backup-q4-responses.json')
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2))
  
  console.log(`✅ Backup: ${backupPath}`)
  
  // ========================================================================
  // PASO 6: IDENTIFICAR JOURNEYS AFECTADOS
  // ========================================================================
  console.log('\n🔎 Identificando journeys afectados...')
  
  const affectedJourneys = await prisma.journeyOrchestration.findMany({
    where: {
      stage2ParticipantId: {
        in: participantIds
      }
    },
    select: {
      id: true,
      fullName: true,
      clarificationScore: true,
      currentStage: true,
      status: true
    }
  })
  
  console.log(`\n📊 Journeys afectados: ${affectedJourneys.length}`)
  
  if (affectedJourneys.length > 0) {
    console.log('\n   Nombre                 | Score | Stage | Status')
    console.log('   ----------------------------------------------------')
    affectedJourneys.forEach(j => {
      console.log(`   ${j.fullName.padEnd(22)} | ${String(j.clarificationScore || 'null').padEnd(5)} | ${j.currentStage}     | ${j.status}`)
    })
  }
  
  // ========================================================================
  // PASO 7: ELIMINAR RESPONSES
  // ========================================================================
  console.log('\n🗑️  Eliminando responses...')
  
  const deleteResult = await prisma.response.deleteMany({
    where: { questionId: oldQuestionId }
  })
  
  console.log(`✅ Eliminadas: ${deleteResult.count} responses`)
  
  // ========================================================================
  // PASO 8: ELIMINAR PREGUNTA
  // ========================================================================
  console.log('\n🗑️  Eliminando pregunta vieja...')
  
  await prisma.question.delete({
    where: { id: oldQuestionId }
  })
  
  console.log('✅ Pregunta eliminada')
  
  // ========================================================================
  // PASO 9: RESUMEN
  // ========================================================================
  console.log('\n═══════════════════════════════════════════════')
  console.log('✅ LIMPIEZA COMPLETADA')
  console.log('═══════════════════════════════════════════════\n')
  
  console.log('📋 Resumen:')
  console.log(`   - Responses eliminadas: ${deleteResult.count}`)
  console.log(`   - Journeys afectados: ${affectedJourneys.length}`)
  console.log(`   - Backup: backup-q4-responses.json\n`)
  
  console.log('🚀 PRÓXIMOS PASOS:\n')
  console.log('   1. npx tsx prisma/seeds/onboarding-questions.ts')
  console.log('   2. npx tsx prisma/seeds/onboarding-survey-configurations.ts')
  console.log('   3. npx tsx scripts/recalculate-journeys.ts\n')
  
  if (affectedJourneys.length > 0) {
    const journeyIdsPath = path.join(process.cwd(), 'affected-journeys.json')
    fs.writeFileSync(
      journeyIdsPath,
      JSON.stringify(affectedJourneys.map(j => j.id), null, 2)
    )
    console.log(`   IDs guardados: affected-journeys.json\n`)
  }
}

cleanupQuestion4()
  .catch((error) => {
    console.error('\n❌ ERROR:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })