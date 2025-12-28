/**
 * API PATCH /api/exit/alerts/[id]
 * 
 * PROPÓSITO:
 * Gestionar alertas Exit (acknowledge, resolve, dismiss)
 * 
 * AUTENTICACIÓN:
 * Headers inyectados por middleware:
 * - x-account-id (obligatorio)
 * - x-user-id (obligatorio para auditoría)
 * - x-user-role (para RBAC)
 * - x-department-id (para filtrado jerárquico)
 * 
 * BODY:
 * {
 *   action: 'acknowledge' | 'resolve' | 'dismiss';
 *   notes?: string; // Requerido para 'resolve'
 * }
 * 
 * ROLES PERMITIDOS:
 * - FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, AREA_MANAGER (su jerarquía)
 * 
 * @version 1.0
 * @date December 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  extractUserContext, 
  getChildDepartmentIds 
} from '@/lib/services/AuthorizationService';
import { ExitAlertService } from '@/lib/services/ExitAlertService';


// ═══════════════════════════════════════════════════════════════════════════
// ROLES PERMITIDOS
// ═══════════════════════════════════════════════════════════════════════════

const ALLOWED_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',
  'HR_MANAGER',
  'AREA_MANAGER'
];


// ═══════════════════════════════════════════════════════════════════════════
// HANDLER PATCH
// ═══════════════════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const alertId = params.id;
    console.log('🔧 [Exit Alert Update] Request iniciada:', alertId);
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 1: AUTENTICACIÓN
    // ════════════════════════════════════════════════════════════════════════
    
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    if (!userContext.userId) {
      return NextResponse.json(
        { success: false, error: 'Usuario no identificado' },
        { status: 401 }
      );
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 2: VALIDAR ROL
    // ════════════════════════════════════════════════════════════════════════
    
    if (!userContext.role || !ALLOWED_ROLES.includes(userContext.role)) {
      return NextResponse.json(
        { success: false, error: 'Rol no autorizado para esta acción' },
        { status: 403 }
      );
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 3: OBTENER ALERTA Y VALIDAR PERTENENCIA
    // ════════════════════════════════════════════════════════════════════════
    
    const alert = await prisma.exitAlert.findFirst({
      where: {
        id: alertId,
        accountId: userContext.accountId
      },
      select: {
        id: true,
        departmentId: true,
        status: true,
        alertType: true
      }
    });
    
    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Alerta no encontrada' },
        { status: 404 }
      );
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 4: VALIDAR ACCESO JERÁRQUICO (AREA_MANAGER)
    // ════════════════════════════════════════════════════════════════════════
    
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId);
      const accessibleDepartmentIds = [userContext.departmentId, ...childIds];
      
      if (!accessibleDepartmentIds.includes(alert.departmentId)) {
        console.log('[Exit Alert Update] ⛔ AREA_MANAGER sin acceso:', {
          userDepartment: userContext.departmentId,
          alertDepartment: alert.departmentId
        });
        return NextResponse.json(
          { success: false, error: 'Acceso denegado: alerta fuera de su ámbito' },
          { status: 403 }
        );
      }
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 5: PARSE BODY Y VALIDAR ACCIÓN
    // ════════════════════════════════════════════════════════════════════════
    
    const body = await request.json();
    const { action, notes } = body;
    
    const validActions = ['acknowledge', 'resolve', 'dismiss'];
    
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Acción no válida. Acciones permitidas: ${validActions.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // 'resolve' requiere notas
    if (action === 'resolve' && !notes) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Se requieren notas de resolución para resolver la alerta' 
        },
        { status: 400 }
      );
    }
    
    // Validar que la alerta no esté ya resuelta/descartada
    if (['resolved', 'dismissed'].includes(alert.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `La alerta ya fue ${alert.status === 'resolved' ? 'resuelta' : 'descartada'}` 
        },
        { status: 400 }
      );
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 6: EJECUTAR ACCIÓN
    // ════════════════════════════════════════════════════════════════════════
    
    console.log('[Exit Alert Update] Executing action:', {
      action,
      alertId,
      userId: userContext.userId,
      hasNotes: !!notes
    });
    
    switch (action) {
      case 'acknowledge':
        await ExitAlertService.acknowledgeAlert(
          alertId, 
          userContext.userId, 
          notes
        );
        break;
        
      case 'resolve':
        await ExitAlertService.resolveAlert(
          alertId, 
          userContext.userId, 
          notes
        );
        break;
        
      case 'dismiss':
        await ExitAlertService.dismissAlert(
          alertId, 
          userContext.userId, 
          notes
        );
        break;
    }
    
    console.log('[Exit Alert Update] ✅ Action completed:', action);
    
    return NextResponse.json({
      success: true,
      message: `Alerta ${action === 'acknowledge' ? 'reconocida' : action === 'resolve' ? 'resuelta' : 'descartada'} exitosamente`,
      responseTime: Date.now() - startTime
    });
    
  } catch (error: any) {
    console.error('[Exit Alert Update] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
// ═══════════════════════════════════════════════════════════════════════════
// HANDLER GET - OBTENER DETALLE DE ALERTA
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const alertId = params.id;
    console.log('🔍 [Exit Alert GET] Request iniciada:', alertId);
    
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    if (!userContext.role || !ALLOWED_ROLES.includes(userContext.role)) {
      return NextResponse.json(
        { success: false, error: 'Rol no autorizado para esta acción' },
        { status: 403 }
      );
    }

    const alert = await prisma.exitAlert.findFirst({
      where: {
        id: alertId,
        accountId: userContext.accountId
      },
      include: {
        department: {
          select: {
            id: true,
            displayName: true,
            standardCategory: true
          }
        },
        account: {
          select: {
            companyName: true
          }
        },
        exitRecord: {
          select: {
            id: true,
            nationalId: true,
            exitDate: true,
            exitReason: true,
            eis: true,
            eisClassification: true
          }
        }
      }
    });
    
    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Alerta no encontrada' },
        { status: 404 }
      );
    }
    
    // Validar acceso jerárquico AREA_MANAGER
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId);
      const accessibleDepartmentIds = [userContext.departmentId, ...childIds];
      
      if (!accessibleDepartmentIds.includes(alert.departmentId)) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado: alerta fuera de su ámbito' },
          { status: 403 }
        );
      }
    }
    
    console.log('[Exit Alert GET] ✅ Alerta encontrada:', alertId);
    
    return NextResponse.json({
      success: true,
      data: alert,
      responseTime: Date.now() - startTime
    });
    
  } catch (error: any) {
    console.error('[Exit Alert GET] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}