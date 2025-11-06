/**
 * POST /api/onboarding/survey/[token]/submit
 * 
 * Procesa el envío de respuestas de un stage de onboarding.
 * 
 * FLUJO:
 * 1. Validar token y participant
 * 2. Validar que es campaña onboarding (isPermanent)
 * 3. Guardar responses en BD
 * 4. Marcar participant.hasResponded = true
 * 5. Actualizar scores del journey (llamar IntelligenceEngine)
 * 6. Generar alertas automáticas (llamar AlertService)
 * 7. Si stage 4: calcular EXO Score final
 * 
 * PÚBLICO: No requiere headers de auth (solo valida token)
 * 
 * @version 3.2.2
 * @date November 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OnboardingIntelligenceEngine } from '@/lib/engines/OnboardingIntelligenceEngine';
import { OnboardingAlertService } from '@/lib/services/OnboardingAlertService';

// ============================================================================
// TYPES
// ============================================================================

interface ResponseData {
  questionId: string;
  rating?: number;
  textResponse?: string;
  choiceResponse?: string[];
  matrixResponses?: Record<string, number>;
}

interface SubmitRequest {
  responses: ResponseData[];
}

interface SubmitResponse {
  success: boolean;
  data?: {
    participantId: string;
    responsesCount: number;
    journeyId: string;
    stageCompleted: number;
    scoresUpdated: boolean;
    alertsGenerated: number;
    message: string;
  };
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determina el stage actual del journey basado en participant
 */
function determineCurrentStage(
  participantId: string,
  journey: any
): number | null {
  if (journey.stage1ParticipantId === participantId) return 1;
  if (journey.stage2ParticipantId === participantId) return 2;
  if (journey.stage3ParticipantId === participantId) return 3;
  if (journey.stage4ParticipantId === participantId) return 4;
  return null;
}

/**
 * Valida estructura de respuesta
 */
function validateResponse(response: ResponseData): { valid: boolean; error?: string } {
  if (!response.questionId) {
    return { valid: false, error: 'questionId es requerido' };
  }

  // Al menos uno de los campos de respuesta debe existir
  const hasResponse = 
    (response.rating !== undefined && response.rating > 0) ||
    (response.textResponse && response.textResponse.trim().length > 0) ||
    (response.choiceResponse && response.choiceResponse.length > 0) ||
    (response.matrixResponses && Object.keys(response.matrixResponses).length > 0);

  if (!hasResponse) {
    return { 
      valid: false, 
      error: `Respuesta vacía para pregunta ${response.questionId}` 
    };
  }

  return { valid: true };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse<SubmitResponse>> {
  try {
    const token = params.token;

    console.log('[API POST /onboarding/survey/[token]/submit]', { token });

    // ========================================================================
    // 1. PARSEAR BODY
    // ========================================================================
    let body: SubmitRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Body inválido - debe ser JSON'
        },
        { status: 400 }
      );
    }

    if (!body.responses || !Array.isArray(body.responses)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campo "responses" es requerido y debe ser un array'
        },
        { status: 400 }
      );
    }

    if (body.responses.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debe enviar al menos una respuesta'
        },
        { status: 400 }
      );
    }

    console.log('[Responses received]', { count: body.responses.length });

    // ========================================================================
    // 2. BUSCAR PARTICIPANT POR TOKEN
    // ========================================================================
    const participant = await prisma.participant.findUnique({
      where: {
        uniqueToken: token
      },
      select: {
        id: true,
        nationalId: true,
        campaignId: true,
        hasResponded: true,
        
        // ✅ Include campaign para validar onboarding
        campaign: {
          select: {
            id: true,
            campaignTypeId: true,
            campaignType: {
              select: {
                isPermanent: true,
                slug: true,
                
                // ✅ Include questions AQUÍ (viven en CampaignType)
                questions: {
                  where: {
                    isActive: true
                  },
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // ========================================================================
    // 3. VALIDAR EXISTENCIA DEL PARTICIPANT
    // ========================================================================
    if (!participant) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token inválido o expirado'
        },
        { status: 404 }
      );
    }

    // ========================================================================
    // 4. VALIDAR QUE ES CAMPAÑA ONBOARDING
    // ========================================================================
    if (!participant.campaign.campaignType.isPermanent) {
      console.warn('[NOT ONBOARDING CAMPAIGN]', {
        campaignTypeSlug: participant.campaign.campaignType.slug
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Este token no corresponde a una encuesta de onboarding'
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // 5. VALIDAR QUE NO HA RESPONDIDO YA
    // ========================================================================
    if (participant.hasResponded) {
      console.warn('[ALREADY RESPONDED]', {
        participantId: participant.id
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Ya has completado esta encuesta'
        },
        { status: 409 } // Conflict
      );
    }

    // ========================================================================
    // 6. BUSCAR JOURNEY ASOCIADO
    // ========================================================================
    const journey = await prisma.journeyOrchestration.findFirst({
      where: {
        nationalId: participant.nationalId,
        OR: [
          { stage1ParticipantId: participant.id },
          { stage2ParticipantId: participant.id },
          { stage3ParticipantId: participant.id },
          { stage4ParticipantId: participant.id }
        ]
      },
      select: {
        id: true,
        stage1ParticipantId: true,
        stage2ParticipantId: true,
        stage3ParticipantId: true,
        stage4ParticipantId: true,
        currentStage: true
      }
    });

    // ========================================================================
    // 7. VALIDAR EXISTENCIA DEL JOURNEY
    // ========================================================================
    if (!journey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Journey de onboarding no encontrado'
        },
        { status: 404 }
      );
    }

    // ========================================================================
    // 8. DETERMINAR STAGE ACTUAL
    // ========================================================================
    const currentStage = determineCurrentStage(participant.id, journey);

    if (!currentStage) {
      console.error('[STAGE DETECTION FAILED]', {
        participantId: participant.id,
        journeyId: journey.id
      });

      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo determinar el stage actual'
        },
        { status: 500 }
      );
    }

    console.log('[Stage detected]', { currentStage });

    // ========================================================================
    // 9. VALIDAR QUESTIONIDS
    // ========================================================================
    const validQuestionIds = new Set(
      participant.campaign.campaignType.questions.map(q => q.id)
    );

    for (const response of body.responses) {
      if (!validQuestionIds.has(response.questionId)) {
        return NextResponse.json(
          {
            success: false,
            error: `Pregunta inválida: ${response.questionId}`
          },
          { status: 400 }
        );
      }
    }

    // ========================================================================
    // 10. PREPARAR RESPONSES DATA
    // ========================================================================
    const responsesData: Array<{
      participantId: string;
      questionId: string;
      rating?: number;
      textResponse?: string;
      choiceResponse?: string;
    }> = [];

    for (const response of body.responses) {
      // Validar estructura
      const validation = validateResponse(response);
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: validation.error
          },
          { status: 400 }
        );
      }

      // Preparar data limpia
      const data: any = {
        participantId: participant.id,
        questionId: response.questionId
      };

      // ✅ Agregar solo campos con valores reales
      if (response.rating !== undefined && response.rating > 0) {
        data.rating = response.rating;
      }

      if (response.textResponse && response.textResponse.trim().length > 0) {
        data.textResponse = response.textResponse.trim();
      }

      if (response.choiceResponse && response.choiceResponse.length > 0) {
        data.choiceResponse = JSON.stringify(response.choiceResponse);
      }

      // ✅ Matrix responses van en choiceResponse
      if (response.matrixResponses && Object.keys(response.matrixResponses).length > 0) {
        data.choiceResponse = JSON.stringify(response.matrixResponses);
      }

      responsesData.push(data);
    }

    console.log('[Responses prepared]', { count: responsesData.length });

    // ========================================================================
    // 11. TRANSACCIÓN: GUARDAR RESPONSES + MARCAR PARTICIPANT
    // ========================================================================
    const result = await prisma.$transaction(async (tx) => {
      // Guardar todas las responses
      await tx.response.createMany({
        data: responsesData
      });

      // Marcar participant como respondido
      await tx.participant.update({
        where: { id: participant.id },
        data: {
          hasResponded: true,
          responseDate: new Date()
        }
      });

      // Actualizar fecha completitud en journey según stage
      const updateData: any = {};
      switch (currentStage) {
        case 1:
          updateData.stage1CompletedAt = new Date();
          break;
        case 2:
          updateData.stage2CompletedAt = new Date();
          break;
        case 3:
          updateData.stage3CompletedAt = new Date();
          break;
        case 4:
          updateData.stage4CompletedAt = new Date();
          updateData.status = 'completed';
          break;
      }

      await tx.journeyOrchestration.update({
        where: { id: journey.id },
        data: updateData
      });

      return { saved: true };
    });

    console.log('[Transaction completed]', result);

    // ========================================================================
    // 12. ACTUALIZAR SCORES DEL JOURNEY (llamar Engine)
    // ========================================================================
    let scoresUpdated = false;
    try {
      await OnboardingIntelligenceEngine.updateJourneyScores(
        journey.id,
        currentStage
      );
      scoresUpdated = true;
      console.log('[Scores updated]', { journeyId: journey.id, stage: currentStage });
    } catch (scoreError) {
      console.error('[Error updating scores - non-critical]', scoreError);
    }

    // ========================================================================
    // 13. GENERAR ALERTAS AUTOMÁTICAS (llamar AlertService)
    // ========================================================================
    let alertsGenerated = 0;
    try {
      const alerts = await OnboardingAlertService.detectAndCreateAlerts(journey.id);
      alertsGenerated = alerts.length;
      console.log('[Alerts generated]', { count: alertsGenerated });
    } catch (alertError) {
      console.error('[Error generating alerts - non-critical]', alertError);
    }

    // ========================================================================
    // 14. RETORNAR RESPUESTA EXITOSA
    // ========================================================================
    return NextResponse.json({
      success: true,
      data: {
        participantId: participant.id,
        responsesCount: responsesData.length,
        journeyId: journey.id,
        stageCompleted: currentStage,
        scoresUpdated,
        alertsGenerated,
        message: currentStage === 4 
          ? '¡Felicitaciones! Has completado tu journey de onboarding completo.'
          : `Stage ${currentStage} completado exitosamente.`
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API POST /onboarding/survey/[token]/submit] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error procesando respuestas'
      },
      { status: 500 }
    );
  }
}