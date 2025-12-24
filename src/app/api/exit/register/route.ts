/**
 * API POST /api/exit/register
 * 
 * PROPÓSITO:
 * Registrar una salida individual en el sistema Exit Intelligence
 * 
 * AUTENTICACIÓN:
 * Headers inyectados por middleware:
 * - x-account-id (obligatorio)
 * - x-user-role (para RBAC)
 * - x-user-id (para auditoría)
 * 
 * AUTORIZACIÓN:
 * Roles permitidos: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER
 * 
 * BODY:
 * {
 *   nationalId: string;     // RUT (obligatorio)
 *   fullName: string;       // Nombre completo (obligatorio)
 *   departmentId: string;   // ID departamento (obligatorio)
 *   exitDate: string;       // Fecha ISO (obligatorio)
 *   email?: string;         // Email para enviar encuesta
 *   phoneNumber?: string;   // Teléfono alternativo
 *   position?: string;      // Cargo
 *   exitReason?: string;    // voluntary|termination|contract_end|retirement|other
 * }
 * 
 * RESPONSE:
 * {
 *   success: boolean;
 *   exitRecordId?: string;
 *   participantId?: string;
 *   surveyToken?: string;
 *   message?: string;
 *   error?: string;
 * }
 * 
 * @version 1.0
 * @date December 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { ExitRegistrationService } from '@/lib/services/ExitRegistrationService';
import { EXIT_REASONS, type ExitReason } from '@/types/exit';

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER POST
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🎯 [Exit Register] Request iniciada');
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 1: AUTENTICACIÓN (headers inyectados por middleware)
    // ════════════════════════════════════════════════════════════════════════
    
    const accountId = request.headers.get('x-account-id');
    const userRole = request.headers.get('x-user-role') || '';
    const userId = request.headers.get('x-user-id') || '';
    
    if (!accountId) {
      console.log('❌ [Exit Register] Missing accountId header');
      return NextResponse.json(
        { 
          success: false, 
          error: 'No autorizado. Inicie sesión nuevamente.' 
        },
        { status: 401 }
      );
    }
    
    console.log(`✅ [Exit Register] Auth OK - Role: ${userRole}, Account: ${accountId}`);
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 2: AUTORIZACIÓN RBAC
    // ════════════════════════════════════════════════════════════════════════
    
    const allowedRoles = [
      'FOCALIZAHR_ADMIN',  // FocalizaHR team
      'ACCOUNT_OWNER',     // Dueño empresa
      'HR_ADMIN',          // RRHH principal
      'HR_MANAGER'         // Jefe RRHH
    ];
    
    if (!allowedRoles.includes(userRole)) {
      console.log(`❌ [Exit Register] Unauthorized role: ${userRole}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Sin permisos para registrar salidas. Contacte a su administrador.' 
        },
        { status: 403 }
      );
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 3: PARSEAR Y VALIDAR BODY
    // ════════════════════════════════════════════════════════════════════════
    
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Body JSON inválido' 
        },
        { status: 400 }
      );
    }
    
    // Validaciones básicas
    const validationErrors: string[] = [];
    
    if (!body.nationalId) {
      validationErrors.push('nationalId (RUT) es requerido');
    }
    
    if (!body.fullName) {
      validationErrors.push('fullName es requerido');
    }
    
    if (!body.departmentId) {
      validationErrors.push('departmentId es requerido');
    }
    
    if (!body.exitDate) {
      validationErrors.push('exitDate es requerido');
    }
    
    // Validar formato de fecha
    let exitDate: Date;
    try {
      exitDate = new Date(body.exitDate);
      if (isNaN(exitDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch {
      validationErrors.push('exitDate debe ser una fecha válida (formato ISO)');
      exitDate = new Date(); // Default para evitar error posterior
    }
    
    // Validar exitReason si se proporciona
    if (body.exitReason) {
      const validReasons = Object.values(EXIT_REASONS);
      if (!validReasons.includes(body.exitReason as ExitReason)) {
        validationErrors.push(
          `exitReason debe ser uno de: ${validReasons.join(', ')}`
        );
      }
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Errores de validación',
          details: validationErrors
        },
        { status: 400 }
      );
    }
    
    console.log('✅ [Exit Register] Body validated:', {
      nationalId: body.nationalId,
      fullName: body.fullName,
      departmentId: body.departmentId,
      exitDate: exitDate.toISOString()
    });
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 4: LLAMAR AL SERVICE
    // ════════════════════════════════════════════════════════════════════════
    
    const result = await ExitRegistrationService.registerExit({
      accountId,
      departmentId: body.departmentId,
      nationalId: body.nationalId,
      fullName: body.fullName,
      email: body.email || undefined,
      phoneNumber: body.phoneNumber || undefined,
      position: body.position || undefined,
      exitDate,
      exitReason: body.exitReason || undefined
    });
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 5: RESPUESTA
    // ════════════════════════════════════════════════════════════════════════
    
    const duration = Date.now() - startTime;
    
    if (result.success) {
      console.log(`✅ [Exit Register] Success in ${duration}ms:`, {
        exitRecordId: result.exitRecordId,
        participantId: result.participantId
      });
      
      return NextResponse.json(result, { status: 201 });
    } else {
      console.log(`⚠️ [Exit Register] Failed in ${duration}ms:`, result.error);
      return NextResponse.json(result, { status: 400 });
    }
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Exit Register] Unhandled error after ${duration}ms:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno procesando registro' 
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER OPTIONS (CORS)
// ═══════════════════════════════════════════════════════════════════════════

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}