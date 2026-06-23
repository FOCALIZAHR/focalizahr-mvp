/**
 * API POST /api/exit/register/batch
 * 
 * PROPÓSITO:
 * Registrar múltiples salidas en una sola operación (hasta 100)
 * 
 * AUTENTICACIÓN:
 * Headers inyectados por middleware:
 * - x-account-id (obligatorio)
 * - x-user-role (para RBAC)
 * 
 * AUTORIZACIÓN:
 * Roles permitidos (más restrictivo que individual):
 * FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN
 * 
 * BODY:
 * {
 *   exits: [
 *     {
 *       nationalId: string;
 *       fullName: string;
 *       departmentId: string;
 *       exitDate: string;
 *       email?: string;
 *       phoneNumber?: string;
 *       position?: string;
 *       exitReason?: string;
 *     },
 *     ...
 *   ]
 * }
 * 
 * RESPONSE:
 * {
 *   success: boolean;
 *   total: number;
 *   processed: number;
 *   failed: number;
 *   results: [
 *     { nationalId: string; success: boolean; exitRecordId?: string; error?: string }
 *   ]
 * }
 * 
 * HTTP STATUS CODES:
 * - 201: Todos exitosos
 * - 207: Parcialmente exitoso (Multi-Status)
 * - 400: Todos fallaron o error de validación
 * - 401: No autorizado
 * - 403: Sin permisos
 * 
 * @version 1.0
 * @date December 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { ExitRegistrationService } from '@/lib/services/ExitRegistrationService';
import { hasPermission } from '@/lib/services/AuthorizationService';
import { EXIT_REASONS, type ExitReason } from '@/types/exit';

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER POST
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🎯 [Exit Batch Register] Request iniciada');
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 1: AUTENTICACIÓN
    // ════════════════════════════════════════════════════════════════════════
    
    const accountId = request.headers.get('x-account-id');
    const userRole = request.headers.get('x-user-role') || '';
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 2: AUTORIZACIÓN (más restrictiva para batch)
    // ════════════════════════════════════════════════════════════════════════
    
    // RBAC centralizado (misma matriz: más restrictivo que individual, vía hasPermission)
    if (!hasPermission(userRole, 'exit:register:batch')) {
      console.log(`❌ [Exit Batch] Unauthorized role: ${userRole}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Sin permisos para registro masivo. Solo HR_ADMIN o superior.'
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
    } catch {
      return NextResponse.json(
        { success: false, error: 'Body JSON inválido' },
        { status: 400 }
      );
    }
    
    // Validar estructura
    if (!body.exits || !Array.isArray(body.exits)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Se espera { exits: [...] } con array de registros' 
        },
        { status: 400 }
      );
    }
    
    if (body.exits.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El array exits está vacío' },
        { status: 400 }
      );
    }
    
    if (body.exits.length > 100) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Máximo 100 registros por batch. Recibidos: ${body.exits.length}` 
        },
        { status: 400 }
      );
    }
    
    console.log(`📊 [Exit Batch] Processing ${body.exits.length} records`);
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 4: PRE-VALIDAR TODOS LOS REGISTROS
    // ════════════════════════════════════════════════════════════════════════
    
    const validReasons = Object.values(EXIT_REASONS);
    const validatedItems: Array<{
      accountId: string;
      departmentId: string;
      nationalId: string;
      fullName: string;
      email?: string;
      phoneNumber?: string;
      position?: string;
      exitDate: Date;
      exitReason?: ExitReason;
    }> = [];
    
    const validationErrors: Array<{
      index: number;
      nationalId: string;
      errors: string[];
    }> = [];
    
    for (let i = 0; i < body.exits.length; i++) {
      const item = body.exits[i];
      const errors: string[] = [];
      
      // Validaciones
      if (!item.nationalId) errors.push('nationalId requerido');
      if (!item.fullName) errors.push('fullName requerido');
      if (!item.departmentId) errors.push('departmentId requerido');
      if (!item.exitDate) errors.push('exitDate requerido');
      // ✅ NUEVO: Validar al menos email O phoneNumber
      if (!item.email && !item.phoneNumber) {
        errors.push('Debe proporcionar email O teléfono (al menos uno)');
      }
      
      // Validar fecha
      let exitDate: Date | null = null;
      if (item.exitDate) {
        try {
          exitDate = new Date(item.exitDate);
          if (isNaN(exitDate.getTime())) {
            errors.push('exitDate inválido');
            exitDate = null;
          }
        } catch {
          errors.push('exitDate inválido');
        }
      }
      
      // Validar exitReason
      if (item.exitReason && !validReasons.includes(item.exitReason)) {
        errors.push(`exitReason inválido: ${item.exitReason}`);
      }
      
      if (errors.length > 0) {
        validationErrors.push({
          index: i,
          nationalId: item.nationalId || `[índice ${i}]`,
          errors
        });
      } else {
        validatedItems.push({
          accountId,
          departmentId: item.departmentId,
          nationalId: item.nationalId,
          fullName: item.fullName,
          email: item.email || undefined,
          phoneNumber: item.phoneNumber || undefined,
          position: item.position || undefined,
          exitDate: exitDate!,
          exitReason: item.exitReason || undefined
        });
      }
    }
    
    // Si hay errores de validación, retornarlos antes de procesar
    if (validationErrors.length > 0 && validatedItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Todos los registros tienen errores de validación',
          validationErrors
        },
        { status: 400 }
      );
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 5: PROCESAR REGISTROS VÁLIDOS
    // ════════════════════════════════════════════════════════════════════════
    
    // Scope jerárquico (Gate D D2): exit:register:batch es global -> null en la práctica.
    const scopeDepartmentIds = await ExitRegistrationService.resolveScopeDepartmentIds({
      role: userRole,
      departmentId: request.headers.get('x-department-id')
    });

    const result = await ExitRegistrationService.registerBatch(validatedItems, { scopeDepartmentIds });
    
    // Agregar errores de validación al resultado
    const allResults = [
      ...result.results,
      ...validationErrors.map(ve => ({
        nationalId: ve.nationalId,
        success: false,
        error: ve.errors.join(', ')
      }))
    ];
    
    const finalResult = {
      success: result.processed > 0,
      total: body.exits.length,
      processed: result.processed,
      failed: result.failed + validationErrors.length,
      results: allResults
    };
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 6: DETERMINAR STATUS CODE
    // ════════════════════════════════════════════════════════════════════════
    
    const duration = Date.now() - startTime;
    console.log(`📊 [Exit Batch] Completed in ${duration}ms:`, {
      total: finalResult.total,
      processed: finalResult.processed,
      failed: finalResult.failed
    });
    
    let statusCode: number;
    if (finalResult.failed === 0) {
      statusCode = 201; // Todos exitosos
    } else if (finalResult.processed === 0) {
      statusCode = 400; // Todos fallaron
    } else {
      statusCode = 207; // Multi-Status (parcialmente exitoso)
    }
    
    return NextResponse.json(finalResult, { status: statusCode });
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Exit Batch] Error after ${duration}ms:`, error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
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