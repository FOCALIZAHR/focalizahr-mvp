// src/app/api/survey/[token]/submit/route.ts
// REFACTORIZACIÓN PASO 1: Solo validación y guardado de respuestas

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface SurveyResponse {
  questionId: string
  rating?: number
  textResponse?: string
  choiceResponse?: string[]
  matrixResponses?: { [key: string]: number }
}

// POST /api/survey/[token]/submit - REFACTORIZADO para respuesta inmediata <500ms
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const startTime = Date.now()
  
  try {
    const { token } = params
    const body = await request.json()
    const { responses }: { responses: SurveyResponse[] } = body

    console.log('📝 Processing survey submission for token:', token)
    console.log('📊 Responses received:', responses.length)

    // 1. VALIDACIONES RÁPIDAS (sin DB)
    if (!responses || responses.length === 0) {
      return NextResponse.json(
        { error: 'No se recibieron respuestas' },
        { status: 400 }
      )
    }

    // 2. CONSULTA PRECISA (NO "voraz") - Solo datos necesarios para validación
    const participant = await prisma.participant.findFirst({
      where: { uniqueToken: token },
      select: {
        id: true,
        email: true,
        hasResponded: true,
        campaign: {
          select: {
            id: true,
            name: true,
            status: true,
            campaignType: {
              select: {
                slug: true,
                questions: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Token de encuesta no válido' },
        { status: 404 }
      )
    }

    // 3. VALIDACIONES BUSINESS LOGIC (pre-transacción)
    if (participant.hasResponded === true) {
      return NextResponse.json(
        { error: 'Ya has completado esta encuesta' },
        { status: 400 }
      )
    }

    if (participant.campaign.status !== 'active') {
      return NextResponse.json(
        { error: 'Esta encuesta no está disponible actualmente' },
        { status: 400 }
      )
    }

    // 4. PREPARAR DATA fuera de transacción (optimización crítica)
    const validQuestionIds = new Set(participant.campaign.campaignType.questions.map(q => q.id))
    const responseData: Array<{
  participantId: string;
  questionId: string;
  rating?: number;
  textResponse?: string;
  choiceResponse?: string;
}> = []
    
    for (const response of responses) {
      // Validar pregunta existe
      if (!validQuestionIds.has(response.questionId)) {
        return NextResponse.json(
          { error: `Pregunta no encontrada: ${response.questionId}` },
          { status: 400 }
        )
      }

      // ✅ PREPARAR DATA ESTRUCTURA LIMPIA - Fix guardado respuestas
      let data: any = {
        participantId: participant.id,
        questionId: response.questionId,
      }

      // ✅ FIX CRÍTICO: Validar y agregar solo campos con valores reales
      if (response.rating !== undefined && response.rating > 0) {
        data.rating = response.rating;
        console.log(`📊 [RATING] Q${response.questionId}: ${response.rating}`);
      }

      if (response.textResponse && response.textResponse.trim().length > 0) {
        data.textResponse = response.textResponse.trim();
        console.log(`📝 [TEXT] Q${response.questionId}: "${response.textResponse.trim()}"`);
      }

      if (response.choiceResponse && response.choiceResponse.length > 0) {
        data.choiceResponse = JSON.stringify(response.choiceResponse);
        console.log(`☑️ [CHOICE] Q${response.questionId}: ${response.choiceResponse.length} options`);
      }

      // ✅ FIX CONFLICTO CRÍTICO: Matrix responses van en choiceResponse, NO textResponse
      if (response.matrixResponses && Object.keys(response.matrixResponses).length > 0) {
        data.choiceResponse = JSON.stringify(response.matrixResponses);
        console.log(`🎯 [MATRIX] Q${response.questionId}: ${Object.keys(response.matrixResponses).length} aspects`);
      }

      responseData.push(data)
    }

    // 5. TRANSACCIÓN MÍNIMA: Solo escritura de datos críticos
    const result = await prisma.$transaction(async (tx) => {
      // BATCH INSERT: Una operación vs loop
      const createdResponses = await tx.response.createMany({
        data: responseData,
        skipDuplicates: true
      })

      // PARALLEL UPDATES: No secuencial
      const [updatedParticipant] = await Promise.all([
        tx.participant.update({
          where: { id: participant.id },
          data: {
            hasResponded: true,
            responseDate: new Date()
          }
        }),
        tx.campaign.update({
          where: { id: participant.campaign.id },
          data: { totalResponded: { increment: 1 } }
        })
      ])

      return { 
        participant: updatedParticipant, 
        responsesCount: createdResponses.count,
        campaignId: participant.campaign.id,
        campaignType: participant.campaign.campaignType.slug
      }
    })

    const processingTime = Date.now() - startTime

    console.log('✅ Survey submitted successfully (OPTIMIZED)')
    console.log(`   - Participant: ${participant.email}`)
    console.log(`   - Campaign: ${participant.campaign.name}`)
    console.log(`   - Responses saved: ${result.responsesCount}`)
    console.log(`   - Processing time: ${processingTime}ms`)

    // 6. ELIMINAR COMPLETAMENTE: processAndStoreResults del flujo síncrono
    // La lógica de análisis pesado se movió a endpoint separado

    return NextResponse.json({
      success: true,
      message: '¡Encuesta completada exitosamente!',
      participantId: participant.id,
      responsesCount: result.responsesCount,
      campaignId: result.campaignId,
      campaignType: result.campaignType,
      performance: {
        processingTime,
        optimized: true,
        target: '<500ms'
      }
    })

  } catch (error) {
    console.error('❌ Error submitting survey:', error)
    
    const processingTime = Date.now() - startTime
    
    return NextResponse.json(
      { 
        error: 'Error al procesar las respuestas',
        details: error instanceof Error ? error.message : 'Error desconocido',
        performance: {
          processingTime,
          failed: true
        }
      },
      { status: 500 }
    )
  }
}

// OPTIMIZACIONES APLICADAS PASO 1:
// ✅ Consulta "precisa" vs "voraz" - Solo campos necesarios
// ✅ Validaciones fuera de transacción
// ✅ Preparación data antes de transacción  
// ✅ createMany() batch vs loop individual
// ✅ Promise.all() paralelo vs secuencial
// ✅ ELIMINADO: processAndStoreResults síncrono
// ✅ Performance timing logging
// ✅ Validación con Set() O(1) vs find() O(n)

// PERFORMANCE ESPERADA PASO 1:
// ANTES: 7.5s (validaciones + escritura + análisis pesado en transacción)
// DESPUÉS: <500ms (solo validaciones optimizadas + escritura batch)