// scripts/fix-remaining-15.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixRemaining15() {
  console.log('🔧 Corrigiendo 15 respuestas faltantes...\n')

  // Mapeo Día 30 Q1
  const day30Fixed = await prisma.$executeRaw`
    UPDATE responses
    SET normalized_score = CASE 
      WHEN choice_response::jsonb @> '["Definitivamente sí"]'::jsonb THEN 5.0
      WHEN choice_response::jsonb @> '["Probablemente sí"]'::jsonb THEN 4.0
      WHEN choice_response::jsonb @> '["No estoy seguro/a"]'::jsonb THEN 3.0
      WHEN choice_response::jsonb @> '["Probablemente no"]'::jsonb THEN 2.0
      WHEN choice_response::jsonb @> '["Definitivamente no"]'::jsonb THEN 1.0
    END
    WHERE question_id IN (
      SELECT id FROM questions 
      WHERE campaign_type_id IN (
        SELECT id FROM campaign_types WHERE slug = 'onboarding-day-30'
      )
      AND question_order = 1
    )
    AND normalized_score IS NULL
  `

  // Mapeo Día 7 Q4
  const day7Fixed = await prisma.$executeRaw`
    UPDATE responses
    SET normalized_score = CASE 
      WHEN choice_response::jsonb @> '["Sí, completamente"]'::jsonb THEN 5.0
      WHEN choice_response::jsonb @> '["Mayormente sí"]'::jsonb THEN 4.0
      WHEN choice_response::jsonb @> '["Parcialmente"]'::jsonb THEN 3.0
      WHEN choice_response::jsonb @> '["Mayormente no"]'::jsonb THEN 2.0
      WHEN choice_response::jsonb @> '["No coinciden en absoluto"]'::jsonb THEN 1.0
    END
    WHERE question_id IN (
      SELECT id FROM questions 
      WHERE campaign_type_id IN (
        SELECT id FROM campaign_types WHERE slug = 'onboarding-day-7'
      )
      AND question_order = 4
    )
    AND normalized_score IS NULL
  `

  console.log(`✅ Día 30 Q1 corregidas: ${day30Fixed} respuestas`)
  console.log(`✅ Día 7 Q4 corregidas: ${day7Fixed} respuestas`)

  // Verificar
  const remaining = await prisma.response.count({
    where: {
      question: {
        campaignType: {
          slug: {
            in: ['onboarding-day-1', 'onboarding-day-7', 'onboarding-day-30', 'onboarding-day-90']
          }
        }
      },
      normalizedScore: null
    }
  })

  console.log(`\n📊 Respuestas sin normalizedScore restantes: ${remaining}`)
  
  if (remaining === 0) {
    console.log('\n🎉 ¡PERFECTO! Todas las respuestas tienen normalizedScore')
  }
}

fixRemaining15()
  .catch(console.error)
  .finally(() => prisma.$disconnect())