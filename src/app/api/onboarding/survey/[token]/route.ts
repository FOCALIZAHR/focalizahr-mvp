/**
 * GET /api/onboarding/survey/[token]
 * 
 * Obtiene las preguntas del stage actual para un participante de onboarding.
 * 
 * FLUJO:
 * 1. Buscar participant por token
 * 2. Validar que es campaña permanente (onboarding)
 * 3. Buscar journey asociado
 * 4. Detectar stage actual (1-4)
 * 5. Obtener preguntas del campaignType correspondiente
 * 
 * PÚBLICO: No requiere headers de auth (solo valida token)
 * 
 * DIFERENCIA CON /api/survey/[token]:
 * - Este es SOLO para onboarding (campaigns permanentes)
 * - Detecta stage automáticamente desde journey
 * - Retorna info del journey completo
 * 
 * @version 3.2.2
 * @date November 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

interface SurveyResponse {
  success: boolean;
  data?: {
    participant: {
      id: string;
      nationalId: string;
      fullName: string;
      email: string | null;
      phoneNumber: string | null;
      hasResponded: boolean;
    };
    journey: {
      id: string;
      currentStage: number;
      stageName: string;
      dimensionName: string;
      totalStages: number;
      complianceScore: number | null;
      clarificationScore: number | null;
      cultureScore: number | null;
      connectionScore: number | null;
    };
    campaign: {
      id: string;
      name: string;
      status: string;
    };
    questions: Array<{
      id: string;
      text: string;
      category: string;
      subcategory: string | null;
      questionOrder: number;
      responseType: string;
      isRequired: boolean;
      minValue: number;
      maxValue: number;
      choiceOptions: any;
    }>;
  };
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene nombre legible del stage
 */
function getStageName(stage: number): string {
  const stageNames = {
    1: 'Día 1',
    2: 'Día 7',
    3: 'Día 30',
    4: 'Día 90'
  };
  return stageNames[stage as keyof typeof stageNames] || `Stage ${stage}`;
}

/**
 * Obtiene nombre de la dimensión 4C
 */
function getDimensionName(stage: number): string {
  const dimensions = {
    1: 'Compliance (Cumplimiento)',
    2: 'Clarification (Clarificación)',
    3: 'Culture (Cultura)',
    4: 'Connection (Conexión)'
  };
  return dimensions[stage as keyof typeof dimensions] || 'Dimensión Desconocida';
}

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

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse<SurveyResponse>> {
  try {
    const token = params.token;

    console.log('[API GET /onboarding/survey/[token]]', { token });

    // ========================================================================
    // 1. BUSCAR PARTICIPANT POR TOKEN
    // ========================================================================
    const participant = await prisma.participant.findUnique({
      where: {
        uniqueToken: token
      },
      select: {
        id: true,
        nationalId: true,
        email: true,
        phoneNumber: true,
        hasResponded: true,
        campaignId: true,
        
        // ✅ Include campaign para validar que es onboarding
        campaign: {
          select: {
            id: true,
            name: true,
            status: true,
            campaignTypeId: true,
            
            // ✅ Include campaignType para validar isPermanent
            campaignType: {
              select: {
                id: true,
                name: true,
                slug: true,
                isPermanent: true
              }
            }
          }
        }
      }
    });

    // ========================================================================
    // 2. VALIDAR EXISTENCIA DEL PARTICIPANT
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
    // 3. VALIDAR QUE ES CAMPAÑA PERMANENTE (ONBOARDING)
    // ========================================================================
    if (!participant.campaign.campaignType.isPermanent) {
      console.warn('[NOT ONBOARDING CAMPAIGN]', {
        campaignTypeSlug: participant.campaign.campaignType.slug,
        isPermanent: participant.campaign.campaignType.isPermanent
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
    // 4. BUSCAR JOURNEY ASOCIADO
    // ========================================================================
    // El participant puede estar en cualquiera de los 4 stages
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
        nationalId: true,
        fullName: true,
        currentStage: true,
        status: true,
        
        // IDs de participants para determinar stage
        stage1ParticipantId: true,
        stage2ParticipantId: true,
        stage3ParticipantId: true,
        stage4ParticipantId: true,
        
        // Scores 4C
        complianceScore: true,
        clarificationScore: true,
        cultureScore: true,
        connectionScore: true
      }
    });

    // ========================================================================
    // 5. VALIDAR EXISTENCIA DEL JOURNEY
    // ========================================================================
    if (!journey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Journey de onboarding no encontrado para este participante'
        },
        { status: 404 }
      );
    }

    // ========================================================================
    // 6. DETERMINAR STAGE ACTUAL
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
          error: 'No se pudo determinar el stage actual del journey'
        },
        { status: 500 }
      );
    }

    console.log('[Stage detected]', {
      participantId: participant.id,
      currentStage,
      stageName: getStageName(currentStage)
    });

    // ========================================================================
    // 7. OBTENER PREGUNTAS DEL CAMPAIGNTYPE
    // ========================================================================
    const questions = await prisma.question.findMany({
      where: {
        campaignTypeId: participant.campaign.campaignTypeId,
        isActive: true // ✅ CRÍTICO: Solo preguntas activas
      },
      orderBy: {
        questionOrder: 'asc'
      },
      select: {
        id: true,
        text: true,
        category: true,
        subcategory: true,
        questionOrder: true,
        responseType: true,
        isRequired: true,
        minValue: true,
        maxValue: true,
        choiceOptions: true,
        scaleLabels: true,
        minLabel: true,
        maxLabel: true
      }
    });

    console.log('[Questions retrieved]', {
      campaignTypeId: participant.campaign.campaignTypeId,
      totalQuestions: questions.length
    });

    // ========================================================================
    // 8. VALIDAR QUE HAY PREGUNTAS
    // ========================================================================
    if (questions.length === 0) {
      console.warn('[NO QUESTIONS FOUND]', {
        campaignTypeId: participant.campaign.campaignTypeId
      });

      return NextResponse.json(
        {
          success: false,
          error: 'No hay preguntas configuradas para este tipo de encuesta'
        },
        { status: 500 }
      );
    }

    // ========================================================================
    // 9. RETORNAR RESPUESTA EXITOSA
    // ========================================================================
    return NextResponse.json({
      success: true,
      data: {
        participant: {
          id: participant.id,
          nationalId: participant.nationalId,
          fullName: journey.fullName,
          email: participant.email,
          phoneNumber: participant.phoneNumber,
          hasResponded: participant.hasResponded
        },
        journey: {
          id: journey.id,
          currentStage,
          stageName: getStageName(currentStage),
          dimensionName: getDimensionName(currentStage),
          totalStages: 4,
          complianceScore: journey.complianceScore,
          clarificationScore: journey.clarificationScore,
          cultureScore: journey.cultureScore,
          connectionScore: journey.connectionScore
        },
        campaign: {
          id: participant.campaign.id,
          name: participant.campaign.name,
          status: participant.campaign.status
        },
        questions
      }
    });

  } catch (error: any) {
    console.error('[API GET /onboarding/survey/[token]] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error obteniendo encuesta de onboarding'
      },
      { status: 500 }
    );
  }
}