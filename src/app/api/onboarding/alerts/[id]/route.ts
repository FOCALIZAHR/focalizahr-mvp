// src/app/api/onboarding/alerts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext } from '@/lib/services/AuthorizationService';
import { OnboardingAlertService } from '@/lib/services/OnboardingAlertService';

/**
 * PATCH /api/onboarding/alerts/[id]
 * 
 * Actualizar estado de alerta:
 * - action: 'acknowledge' | 'resolve'
 * - notes: string (opcional, requerido para resolve)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // ========================================
    // 1. AUTENTICACIÓN
    // ========================================
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId || !userContext.userId) {
      return NextResponse.json(
        { error: 'No autorizado', success: false },
        { status: 401 }
      );
    }
    
    // ========================================
    // 2. PARSEAR BODY
    // ========================================
    const body = await request.json();
    const { action, notes } = body;
    
    if (!action || !['acknowledge', 'resolve'].includes(action)) {
      return NextResponse.json(
        { 
          error: 'Acción inválida. Debe ser "acknowledge" o "resolve"', 
          success: false 
        },
        { status: 400 }
      );
    }
    
    // Validar que alerta existe y pertenece a la cuenta
    const existingAlert = await prisma.journeyAlert.findFirst({
      where: {
        id,
        accountId: userContext.accountId
      }
    });
    
    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alerta no encontrada', success: false },
        { status: 404 }
      );
    }
    
    // ========================================
    // 3. DELEGACIÓN A SERVICIO (Arquitectura Correcta)
    // ========================================
    let updatedAlert;
    
    if (action === 'acknowledge') {
      console.log(`[API] Acknowledge alert ${id} by user ${userContext.userId}`);
      
      updatedAlert = await OnboardingAlertService.acknowledgeAlert(
        id, 
        userContext.userId, 
        notes
      );
      
    } else if (action === 'resolve') {
      console.log(`[API] Resolve alert ${id} by user ${userContext.userId}`);
      
      updatedAlert = await OnboardingAlertService.resolveAlert(
        id, 
        userContext.userId, 
        notes
      );
    }
    
    // ========================================
    // 4. OBTENER ALERTA CON RELACIONES PARA RESPONSE
    // ========================================
    const alertWithRelations = await prisma.journeyAlert.findUnique({
      where: { id: updatedAlert!.id },
      include: {
        journey: {
          include: {
            department: {
              select: {
                id: true,
                displayName: true
              }
            }
          }
        }
      }
    });
    
    console.log(`[API] Alerta ${id} actualizada exitosamente a estado: ${updatedAlert!.status}`);
    
    // ========================================
    // 5. RESPONSE
    // ========================================
    return NextResponse.json({
      data: alertWithRelations,
      success: true,
      message: action === 'acknowledge' 
        ? 'Alerta marcada como accionada' 
        : 'Alerta marcada como resuelta'
    });
    
  } catch (error: any) {
    console.error('[API PATCH /alerts/[id]] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error actualizando alerta', 
        success: false 
      },
      { status: 500 }
    );
  }
}