// ============================================
// API POST /api/onboarding/enroll
// FASE 3 - Onboarding Journey Intelligence v3.2.2
// ============================================
// 
// PROPÓSITO:
// Inscribir 1 empleado en journey completo de onboarding (4 etapas)
//
// AUTENTICACIÓN:
// Headers inyectados por middleware:
// - x-account-id (obligatorio)
// - x-user-role (para RBAC)
//
// AUTORIZACIÓN:
// Roles permitidos: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_OPERATOR
//
// VALIDACIÓN:
// - Zod schema estricto (enrollmentRequestSchema)
// - hireDate OBLIGATORIO (no puede ser futura)
// - Email O phoneNumber requerido (al menos uno)
//
// LÓGICA:
// 1. Validar headers autenticación
// 2. Validar rol autorizado
// 3. Validar body con Zod
// 4. Llamar OnboardingEnrollmentService.enrollParticipant()
//    - Service crea 1 Journey
//    - Service llama API /campaigns/[id]/participants/upload 4 veces
//    - Service programa 4 emails en EmailAutomation
// 5. Retornar journeyId + 4 participantIds
//
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { enrollmentRequestSchema } from '@/lib/validations/onboarding-enrollment';
import { OnboardingEnrollmentService } from '@/lib/services/OnboardingEnrollmentService';

/**
 * POST /api/onboarding/enroll
 * 
 * Inscribe un empleado en el journey completo de onboarding (4 stages)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🎯 [Onboarding Enroll] Request iniciada');
    
    // ========================================
    // PASO 1: AUTENTICACIÓN
    // ========================================
    
    // Extraer contexto desde headers (inyectados por middleware)
    const accountId = request.headers.get('x-account-id');
    const userRole = request.headers.get('x-user-role') || '';
    const userId = request.headers.get('x-user-id') || '';
    
    // Validación básica autenticación
    if (!accountId || !userId) {
      console.log('❌ [Onboarding Enroll] Headers autenticación faltantes');
      return NextResponse.json(
        { 
          error: 'No autorizado. Inicie sesión nuevamente.', 
          success: false 
        },
        { status: 401 }
      );
    }
    
    console.log(`✅ [Onboarding Enroll] Usuario autenticado - Role: ${userRole}, AccountId: ${accountId}`);
    
    // ========================================
    // PASO 2: AUTORIZACIÓN RBAC
    // ========================================
    
    const allowedRoles = [
      'FOCALIZAHR_ADMIN',  // FocalizaHR team
      'ACCOUNT_OWNER',     // Dueño empresa
      'HR_ADMIN',          // RRHH principal
      'HR_OPERATOR'        // RRHH operacional
    ];
    
    if (!allowedRoles.includes(userRole)) {
      console.log(`❌ [Onboarding Enroll] Rol no autorizado: ${userRole}`);
      return NextResponse.json(
        { 
          error: 'Sin permisos para inscribir empleados en onboarding.',
          success: false,
          requiredRoles: allowedRoles,
          currentRole: userRole
        },
        { status: 403 }
      );
    }
    
    console.log(`✅ [Onboarding Enroll] Rol autorizado: ${userRole}`);
    
    // ========================================
    // PASO 3: PARSEAR Y VALIDAR BODY CON ZOD
    // ========================================
    
    const body = await request.json();
    console.log('📥 [Onboarding Enroll] Body recibido:', {
      nationalId: body.nationalId,
      fullName: body.fullName,
      hireDate: body.hireDate,
      departmentId: body.departmentId,
      hasEmail: !!body.participantEmail,
      hasPhone: !!body.phoneNumber
    });
    
    // Inyectar accountId al body (desde headers autenticados)
    const dataToValidate = {
      ...body,
      accountId
    };
    
    // Validación estricta Zod
    const validation = enrollmentRequestSchema.safeParse(dataToValidate);
    
    if (!validation.success) {
      console.log('❌ [Onboarding Enroll] Validación Zod falló:', validation.error.errors);
      
      return NextResponse.json(
        {
          error: 'Datos de inscripción inválidos',
          success: false,
          details: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }
    
    console.log('✅ [Onboarding Enroll] Validación Zod exitosa');
    
    // ========================================
    // PASO 4: LLAMAR SERVICE DE ENROLLMENT
    // ========================================
    
    console.log('📞 [Onboarding Enroll] Llamando OnboardingEnrollmentService...');
    
    const result = await OnboardingEnrollmentService.enrollParticipant(validation.data);
    
    if (!result.success) {
      console.log('❌ [Onboarding Enroll] Service falló:', result.message);
      
      return NextResponse.json(
        {
          error: result.message || 'Error enrollando participante',
          success: false
        },
        { status: 500 }
      );
    }
    
    // ========================================
    // PASO 5: RESPUESTA EXITOSA
    // ========================================
    
    const duration = Date.now() - startTime;
    console.log(`✅ [Onboarding Enroll] Journey creado exitosamente en ${duration}ms`);
    console.log('📊 [Onboarding Enroll] Result:', {
      journeyId: result.journeyId,
      participantCount: result.participantIds.length
    });
    
    return NextResponse.json(
      {
        success: true,
        data: {
          journeyId: result.journeyId,
          participantIds: result.participantIds,
          message: result.message
        }
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Onboarding Enroll] Error no manejado después de ${duration}ms:`, error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Error interno procesando inscripción', 
        success: false 
      },
      { status: 500 }
    );
  }
}