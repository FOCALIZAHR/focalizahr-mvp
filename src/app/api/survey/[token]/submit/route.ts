// src/app/api/survey/[token]/submit/route.ts
// REFACTORIZACIÓN PASO 1: Solo validación y guardado de respuestas
// + EXIT INTELLIGENCE POST-PROCESO

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ExitIntelligenceService } from '@/lib/services/ExitIntelligenceService';
import { calculateNormalizedScore } from '@/lib/utils/responseNormalizer';  // ← CAMBIO 1
import { getPerformanceLevel } from '@/config/performanceClassification';

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
        evaluationAssignmentId: true,
        campaign: {
          select: {
            id: true,
            name: true,
            status: true,
            campaignType: {
              select: {
                slug: true,
                isPermanent: true,
                flowType: true,
                questions: {
                  select: {
                    id: true,
                    questionOrder: true,           // ← CAMBIO 2
                    responseType: true,            // ← CAMBIO 2
                    minValue: true,                // ← CAMBIO 2
                    maxValue: true,                // ← CAMBIO 2
                    choiceOptions: true,           // ← CAMBIO 2
                    responseValueMapping: true     // ← CAMBIO 2
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
    
    // ← CAMBIO 3: Mapa para lookup de metadata de preguntas
    const questionMap = new Map(
      participant.campaign.campaignType.questions.map(q => [q.id, q])
    );
    
    const responseData: Array<{
      participantId: string;
      questionId: string;
      rating?: number;
      textResponse?: string;
      choiceResponse?: string;
      normalizedScore?: number;  // ← CAMBIO 4
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

      // ← CAMBIO 5: Calcular normalizedScore para Exit Intelligence
      const question = questionMap.get(response.questionId);
      if (question) {
        const normalizedScore = calculateNormalizedScore(
          {
            rating: data.rating,
            choiceResponse: data.choiceResponse,
            textResponse: data.textResponse
          },
          question
        );
        
        if (normalizedScore !== null) {
          data.normalizedScore = normalizedScore;
          console.log(`📈 [NORMALIZED] Q${response.questionId}: ${normalizedScore}`);
        }
      }
      // ← FIN CAMBIO 5

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

      // NUEVO: Si tiene EvaluationAssignment, marcarlo como COMPLETED
      if (participant.evaluationAssignmentId) {
        await tx.evaluationAssignment.update({
          where: { id: participant.evaluationAssignmentId },
          data: {
            status: 'COMPLETED',
            updatedAt: new Date()
          }
        });

        console.log('[Performance] EvaluationAssignment marcado como COMPLETED', {
          assignmentId: participant.evaluationAssignmentId,
          participantId: participant.id
        });
      }

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

    // ═══════════════════════════════════════════════════════════════════════════
    // 🆕 POST-PROCESO EXIT INTELLIGENCE
    // ═══════════════════════════════════════════════════════════════════════════
    // Detectar si es encuesta de salida y procesar automáticamente:
    // - Calcular EIS (Exit Intelligence Score)
    // - Extraer factores P2+P3 (causas raíz)
    // - Crear alerta Ley Karin si P6 < 2.5
    // - Actualizar ExitRecord con resultados
    // ═══════════════════════════════════════════════════════════════════════════
    
    const exitSurveySlugs = ['retencion-predictiva', 'exit-survey'];
    const campaignSlug = participant.campaign.campaignType.slug;
    
    if (exitSurveySlugs.includes(campaignSlug)) {
      console.log('[Survey Submit] Exit survey detected, processing intelligence...');
      
      try {
        const exitResult = await ExitIntelligenceService.processCompletedSurvey(participant.id);
        
        if (exitResult.success) {
          console.log('[Survey Submit] Exit intelligence processed successfully:', {
            exitRecordId: exitResult.exitRecordId,
            eis: exitResult.eis,
            classification: exitResult.classification,
            alertCreated: exitResult.alertCreated
          });
        } else {
          // No fallar el submit si falla el post-proceso
          // Solo loguear el error para investigación
          console.warn('[Survey Submit] Exit intelligence processing failed:', exitResult.error);
        }
      } catch (exitError) {
        // No fallar el submit si falla el post-proceso
        console.error('[Survey Submit] Error processing exit intelligence:', exitError);
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════════════════
    // 🆕 POST-PROCESO: PARTIAL PERFORMANCE RATING (Manager → Evaluatee)
    // ═══════════════════════════════════════════════════════════════════════════
    // Cuando un jefe completa su evaluación, crear/actualizar PerformanceRating
    // parcial para que el jefe pueda asignar potencial inmediatamente
    // sin esperar a que el admin cambie el ciclo a IN_REVIEW.
    // ═══════════════════════════════════════════════════════════════════════════

    if (participant.evaluationAssignmentId) {
      try {
        const assignment = await prisma.evaluationAssignment.findUnique({
          where: { id: participant.evaluationAssignmentId },
          select: {
            evaluationType: true,
            evaluateeId: true,
            cycleId: true,
            accountId: true
          }
        })

        if (assignment && assignment.evaluationType === 'MANAGER_TO_EMPLOYEE') {
          // Calcular avgScore desde ratings 1-5 de las respuestas
          const ratings15 = responseData
            .filter(r => r.rating != null && r.rating > 0)
            .map(r => r.rating!)

          if (ratings15.length > 0) {
            const avgScore = ratings15.reduce((a, b) => a + b, 0) / ratings15.length
            const roundedScore = Math.round(avgScore * 100) / 100
            const level = getPerformanceLevel(roundedScore)

            await prisma.performanceRating.upsert({
              where: {
                cycleId_employeeId: {
                  cycleId: assignment.cycleId,
                  employeeId: assignment.evaluateeId
                }
              },
              create: {
                accountId: assignment.accountId,
                cycleId: assignment.cycleId,
                employeeId: assignment.evaluateeId,
                managerScore: roundedScore,
                calculatedScore: roundedScore,
                calculatedLevel: level,
                totalEvaluations: 1,
                completedEvaluations: 1
              },
              update: {
                managerScore: roundedScore,
                calculatedScore: roundedScore,
                calculatedLevel: level,
                updatedAt: new Date()
              }
            })

            console.log('[Performance] Partial rating created/updated for manager evaluation', {
              evaluateeId: assignment.evaluateeId,
              cycleId: assignment.cycleId,
              managerScore: roundedScore,
              level
            })
          }
        }
      } catch (ratingErr) {
        // No fallar el submit si falla la creación del rating parcial
        console.error('[Performance] Error creating partial rating:', ratingErr)
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════

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
// ✅ EXIT INTELLIGENCE: Post-proceso automático para encuestas de salida
// ✅ NORMALIZED SCORE: Cálculo para inteligencia de respuestas

// PERFORMANCE ESPERADA PASO 1:
// ANTES: 7.5s (validaciones + escritura + análisis pesado en transacción)
// DESPUÉS: <500ms (solo validaciones optimizadas + escritura batch)
// + ~100-200ms adicionales para Exit Intelligence (si aplica)