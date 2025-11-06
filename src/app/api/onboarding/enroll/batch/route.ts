// ============================================
// API POST /api/onboarding/enroll/batch
// FASE 3 - Onboarding Journey Intelligence v3.2.2
// ============================================
// 
// PROPÓSITO:
// Inscribir múltiples empleados en journeys de onboarding (hasta 100)
//
// AUTENTICACIÓN:
// Headers inyectados por middleware (igual que endpoint individual)
//
// AUTORIZACIÓN:
// Roles permitidos: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN
// (HR_OPERATOR NO permitido para batch - solo individual)
//
// VALIDACIÓN:
// - Array de enrollmentRequestSchema
// - Máximo 100 empleados por batch
// - Validación independiente por empleado
//
// LÓGICA:
// 1. Validar headers autenticación
// 2. Validar rol autorizado (más restrictivo)
// 3. Validar array y límite 100
// 4. Loop: validar + enrollar cada empleado
// 5. Reporte: successCount + failures detallados
//
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { enrollmentRequestSchema } from '@/lib/validations/onboarding-enrollment';
import { OnboardingEnrollmentService } from '@/lib/services/OnboardingEnrollmentService';

interface BatchEnrollmentItem {
  nationalId: string;
  fullName: string;
  hireDate: string | Date;
  departmentId: string;
  participantEmail?: string;
  phoneNumber?: string;
  position?: string;
  location?: string;
  seniorityLevel?: string;
  startDate?: string | Date;
}

interface BatchEnrollmentResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    index: number;
    nationalId: string;
    fullName: string;
    success: boolean;
    journeyId?: string;
    error?: string;
  }>;
}

/**
 * POST /api/onboarding/enroll/batch
 * 
 * Inscribe múltiples empleados en journeys de onboarding (hasta 100)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🎯 [Onboarding Batch] Request iniciada');
    
    // ========================================
    // PASO 1: AUTENTICACIÓN
    // ========================================
    
    const accountId = request.headers.get('x-account-id');
    const userRole = request.headers.get('x-user-role') || '';
    const userId = request.headers.get('x-user-id') || '';
    
    if (!accountId || !userId) {
      console.log('❌ [Onboarding Batch] Headers autenticación faltantes');
      return NextResponse.json(
        { 
          error: 'No autorizado. Inicie sesión nuevamente.', 
          success: false 
        },
        { status: 401 }
      );
    }
    
    console.log(`✅ [Onboarding Batch] Usuario autenticado - Role: ${userRole}`);
    
    // ========================================
    // PASO 2: AUTORIZACIÓN RBAC (MÁS RESTRICTIVO)
    // ========================================
    
    // Batch enrollment solo para roles senior (NO HR_OPERATOR)
    const allowedRoles = [
      'FOCALIZAHR_ADMIN',
      'ACCOUNT_OWNER',
      'HR_ADMIN'
    ];
    
    if (!allowedRoles.includes(userRole)) {
      console.log(`❌ [Onboarding Batch] Rol no autorizado: ${userRole}`);
      return NextResponse.json(
        { 
          error: 'Sin permisos para inscripción masiva. Solo administradores.',
          success: false,
          requiredRoles: allowedRoles,
          currentRole: userRole
        },
        { status: 403 }
      );
    }
    
    console.log(`✅ [Onboarding Batch] Rol autorizado: ${userRole}`);
    
    // ========================================
    // PASO 3: PARSEAR Y VALIDAR BODY
    // ========================================
    
    const body = await request.json();
    
    // Validar que sea un array
    if (!Array.isArray(body.employees)) {
      console.log('❌ [Onboarding Batch] Body no es un array válido');
      return NextResponse.json(
        {
          error: 'Formato inválido. Se espera { employees: [...] }',
          success: false
        },
        { status: 400 }
      );
    }
    
    const employees = body.employees as BatchEnrollmentItem[];
    console.log(`📥 [Onboarding Batch] Recibidos ${employees.length} empleados`);
    
    // Validar límite de 100 empleados
    if (employees.length === 0) {
      return NextResponse.json(
        {
          error: 'Array vacío. Debe incluir al menos 1 empleado.',
          success: false
        },
        { status: 400 }
      );
    }
    
    if (employees.length > 100) {
      console.log(`❌ [Onboarding Batch] Límite excedido: ${employees.length} empleados`);
      return NextResponse.json(
        {
          error: 'Límite de 100 empleados por batch excedido.',
          success: false,
          received: employees.length,
          maxAllowed: 100
        },
        { status: 400 }
      );
    }
    
    // ========================================
    // PASO 4: PROCESAR BATCH
    // ========================================
    
    console.log('🔄 [Onboarding Batch] Comenzando procesamiento...');
    
    const results: BatchEnrollmentResult['results'] = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const currentIndex = i + 1;
      
      console.log(`📝 [Onboarding Batch] Procesando ${currentIndex}/${employees.length}: ${employee.fullName}`);
      
      try {
        // Validar cada empleado individualmente con Zod
        const dataToValidate = {
          ...employee,
          accountId
        };
        
        const validation = enrollmentRequestSchema.safeParse(dataToValidate);
        
        if (!validation.success) {
          const errorMessages = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
          
          console.log(`❌ [Onboarding Batch] Validación falló ${currentIndex}/${employees.length}:`, errorMessages);
          
          results.push({
            index: i,
            nationalId: employee.nationalId || 'N/A',
            fullName: employee.fullName || 'N/A',
            success: false,
            error: `Validación: ${errorMessages}`
          });
          
          failureCount++;
          continue;
        }
        
        // Enrollar empleado
        const result = await OnboardingEnrollmentService.enrollParticipant(validation.data);
        
        if (result.success) {
          console.log(`✅ [Onboarding Batch] Éxito ${currentIndex}/${employees.length}: Journey ${result.journeyId}`);
          
          results.push({
            index: i,
            nationalId: employee.nationalId,
            fullName: employee.fullName,
            success: true,
            journeyId: result.journeyId
          });
          
          successCount++;
        } else {
          console.log(`❌ [Onboarding Batch] Falló ${currentIndex}/${employees.length}:`, result.message);
          
          results.push({
            index: i,
            nationalId: employee.nationalId,
            fullName: employee.fullName,
            success: false,
            error: result.message
          });
          
          failureCount++;
        }
        
      } catch (error: any) {
        console.error(`❌ [Onboarding Batch] Error no manejado ${currentIndex}/${employees.length}:`, error);
        
        results.push({
          index: i,
          nationalId: employee.nationalId || 'N/A',
          fullName: employee.fullName || 'N/A',
          success: false,
          error: error.message || 'Error interno'
        });
        
        failureCount++;
      }
    }
    
    // ========================================
    // PASO 5: RESPUESTA CON REPORTE DETALLADO
    // ========================================
    
    const duration = Date.now() - startTime;
    console.log(`✅ [Onboarding Batch] Procesamiento completado en ${duration}ms`);
    console.log(`📊 [Onboarding Batch] Éxitos: ${successCount}, Fallos: ${failureCount}`);
    
    const batchResult: BatchEnrollmentResult = {
      success: successCount > 0, // Al menos 1 éxito = success true
      totalProcessed: employees.length,
      successCount,
      failureCount,
      results
    };
    
    // Status code: 207 Multi-Status si hay mix de éxitos/fallos
    const statusCode = failureCount === 0 ? 201 : (successCount === 0 ? 400 : 207);
    
    return NextResponse.json(
      {
        success: batchResult.success,
        data: batchResult
      },
      { status: statusCode }
    );
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Onboarding Batch] Error fatal después de ${duration}ms:`, error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Error interno procesando batch', 
        success: false 
      },
      { status: 500 }
    );
  }
}