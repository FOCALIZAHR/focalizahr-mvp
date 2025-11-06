/**
 * GET /api/onboarding/journeys/[id]
 * 
 * Obtiene detalle completo de un journey de onboarding con:
 * - Información del journey (scores 4C, EXO, estado)
 * - 4 Participants (stage1-4) con select específico
 * - Alertas activas (open, acknowledged)
 * - Análisis predictivo si hay data suficiente
 * 
 * RBAC:
 * - FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_OPERATOR: todos los journeys
 * - AREA_MANAGER: solo journeys de su departmentId
 * 
 * @version 3.2.2
 * @date November 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OnboardingIntelligenceEngine } from '@/lib/engines/OnboardingIntelligenceEngine';

// ============================================================================
// TYPES
// ============================================================================

interface JourneyDetailResponse {
  success: boolean;
  data?: {
    journey: any;
    analysis: any | null;
  };
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Valida RBAC para acceso a journey
 */
function validateRBAC(
  userRole: string,
  userDepartmentId: string | null,
  journeyDepartmentId: string
): { allowed: boolean; reason?: string } {
  // Roles con acceso completo
  const fullAccessRoles = [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_OPERATOR'
  ];

  if (fullAccessRoles.includes(userRole)) {
    return { allowed: true };
  }

  // AREA_MANAGER: solo su departamento
  if (userRole === 'AREA_MANAGER') {
    if (userDepartmentId === journeyDepartmentId) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'AREA_MANAGER solo puede ver journeys de su departamento'
    };
  }

  // Otros roles no tienen acceso
  return {
    allowed: false,
    reason: `Rol ${userRole} no tiene permisos para ver journeys`
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<JourneyDetailResponse>> {
  try {
    // ========================================================================
    // 1. EXTRAER HEADERS (Middleware ya validó auth)
    // ========================================================================
    const accountId = request.headers.get('x-account-id');
    const userRole = request.headers.get('x-user-role') || 'CLIENT';
    const userDepartmentId = request.headers.get('x-department-id');

    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado - accountId faltante'
        },
        { status: 401 }
      );
    }

    const journeyId = params.id;

    console.log('[API GET /onboarding/journeys/[id]]', {
      journeyId,
      accountId,
      userRole,
      userDepartmentId
    });

    // ========================================================================
    // 2. BUSCAR JOURNEY CON TODAS LAS RELACIONES
    // ========================================================================
    const journey = await prisma.journeyOrchestration.findUnique({
      where: {
        id: journeyId,
        accountId: accountId // Seguridad: solo su cuenta
      },
      select: {
        // Campos básicos
        id: true,
        nationalId: true,
        fullName: true,
        participantEmail: true,
        phoneNumber: true,
        departmentId: true,
        position: true,
        hireDate: true,
        
        // Scores 4C
        complianceScore: true,
        clarificationScore: true,
        cultureScore: true,
        connectionScore: true,
        
        // EXO Score & Risk
        exoScore: true,
        retentionRisk: true,
        
        // Estados
        currentStage: true,
        status: true,
        
        // Fechas completitud
        stage1CompletedAt: true,
        stage2CompletedAt: true,
        stage3CompletedAt: true,
        stage4CompletedAt: true,
        
        // Metadata
        createdAt: true,
        updatedAt: true,
        
        // ✅ RELACIONES - 4 Participants con select específico
        stage1Participant: {
          select: {
            id: true,
            nationalId: true,
            email: true,
            phoneNumber: true,
            hasResponded: true,
            responseDate: true,
            uniqueToken: true
          }
        },
        stage2Participant: {
          select: {
            id: true,
            nationalId: true,
            email: true,
            phoneNumber: true,
            hasResponded: true,
            responseDate: true,
            uniqueToken: true
          }
        },
        stage3Participant: {
          select: {
            id: true,
            nationalId: true,
            email: true,
            phoneNumber: true,
            hasResponded: true,
            responseDate: true,
            uniqueToken: true
          }
        },
        stage4Participant: {
          select: {
            id: true,
            nationalId: true,
            email: true,
            phoneNumber: true,
            hasResponded: true,
            responseDate: true,
            uniqueToken: true
          }
        },
        
        // ✅ ALERTAS - Solo activas (open, acknowledged)
        alerts: {
          where: {
            status: {
              in: ['pending', 'acknowledged']
            }
          },
          orderBy: {
            severity: 'desc'
          },
          select: {
            id: true,
            alertType: true,
            severity: true,
            title: true,
            description: true,
            stage: true,
            status: true,
            slaHours: true,
            dueDate: true,
            slaStatus: true,
            createdAt: true
          }
        },
        
        // ✅ DEPARTMENT - Para validación RBAC
        department: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    // ========================================================================
    // 3. VALIDAR EXISTENCIA
    // ========================================================================
    if (!journey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Journey no encontrado'
        },
        { status: 404 }
      );
    }

    // ========================================================================
    // 4. VALIDAR RBAC
    // ========================================================================
    const rbacCheck = validateRBAC(
      userRole,
      userDepartmentId,
      journey.departmentId
    );

    if (!rbacCheck.allowed) {
      console.warn('[RBAC DENIED]', {
        userRole,
        userDepartmentId,
        journeyDepartmentId: journey.departmentId,
        reason: rbacCheck.reason
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Acceso denegado - ' + rbacCheck.reason
        },
        { status: 403 }
      );
    }

    // ========================================================================
    // 5. CALCULAR ANÁLISIS PREDICTIVO (si hay data suficiente)
    // ========================================================================
    let analysis = null;

    try {
      // Solo calcular si tiene al menos 1 score
      if (
        journey.complianceScore ||
        journey.clarificationScore ||
        journey.cultureScore ||
        journey.connectionScore
      ) {
        analysis = await OnboardingIntelligenceEngine.analyzeJourney(journeyId);
        console.log('[Analysis computed]', {
          journeyId,
          exoScore: analysis?.exoScore,
          retentionRisk: analysis?.retentionRisk
        });
      } else {
        console.log('[Analysis skipped] - Insufficient data (no scores yet)');
      }
    } catch (analysisError) {
      // No es crítico si falla el análisis
      console.warn('[Analysis failed - non-critical]', analysisError);
      analysis = null;
    }

    // ========================================================================
    // 6. RETORNAR RESPUESTA EXITOSA
    // ========================================================================
    return NextResponse.json({
      success: true,
      data: {
        journey,
        analysis
      }
    });

  } catch (error: any) {
    console.error('[API GET /onboarding/journeys/[id]] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error obteniendo journey'
      },
      { status: 500 }
    );
  }
}