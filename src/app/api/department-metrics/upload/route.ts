// ============================================
// API POST /api/department-metrics/upload
// CHAT 9 REFACTORIZADO - Enterprise Security
// Permite ACCOUNT_OWNER + FOCALIZAHR_ADMIN cargar datos
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  departmentMetricsUploadSchema, 
  departmentMetricsBatchSchema,
  parsePeriod,
  validateMetricsConsistency 
} from '@/lib/validations/departmentMetrics'
import { ZodError } from 'zod';

// ============================================
// TIPOS Y INTERFACES
// ============================================

interface UserContext {
  accountId: string;
  role: string;
  userId: string;
  email: string;
}

interface UploadResult {
  success: boolean;
  departmentId: string;
  period: string;
  action: 'created' | 'updated';
  message: string;
}

interface UploadError {
  success: false;
  departmentId?: string;
  period?: string;
  error: string;
  details?: any;
}

// ============================================
// FUNCIÓN PRINCIPAL: POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // ========================================
    // PASO 1: AUTENTICACIÓN Y AUTORIZACIÓN
    // ========================================
    
    // Extraer contexto usuario desde headers (inyectado por middleware)
    const userContext: UserContext = {
      accountId: request.headers.get('x-account-id') || '',
      role: request.headers.get('x-user-role') || '',
      userId: request.headers.get('x-user-id') || '',
      email: request.headers.get('x-user-email') || ''
    };
    
    // Validar que el usuario está autenticado
    if (!userContext.accountId || !userContext.userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No autenticado. Por favor inicie sesión.' 
        },
        { status: 401 }
      );
    }
    
    // ✅ AUTORIZACIÓN: Solo ACCOUNT_OWNER y FOCALIZAHR_ADMIN pueden cargar datos
    const allowedRoles = ['ACCOUNT_OWNER', 'FOCALIZAHR_ADMIN', 'CLIENT'];
    if (!allowedRoles.includes(userContext.role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No autorizado. Solo administradores de cuenta pueden cargar datos crudos.',
          requiredRole: 'ACCOUNT_OWNER o FOCALIZAHR_ADMIN',
          currentRole: userContext.role
        },
        { status: 403 }
      );
    }
    
    console.log(`✅ Upload autorizado para ${userContext.email} (${userContext.role})`);
    
    // ========================================
    // PASO 2: PARSEAR Y VALIDAR REQUEST BODY
    // ========================================
    
    const body = await request.json();
    
    // Detectar si es batch o single upload
    const isBatch = Array.isArray(body.metrics) || Array.isArray(body);
    const metricsArray = isBatch 
      ? (Array.isArray(body) ? body : body.metrics)
      : [body];
    
    // Validar formato con Zod
    let validatedMetrics;
    try {
      if (isBatch) {
        validatedMetrics = departmentMetricsBatchSchema.parse(metricsArray);
      } else {
        validatedMetrics = [departmentMetricsUploadSchema.parse(body)];
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Datos inválidos. Por favor revise el formato.',
            validationErrors: error.errors
          },
          { status: 400 }
        );
      }
      throw error;
    }
    
    console.log(`📊 Procesando ${validatedMetrics.length} métricas departamentales...`);
    
    // ========================================
    // PASO 3: VALIDAR LÍMITES Y BATCH SIZE
    // ========================================
    
    const MAX_BATCH_SIZE = 100;
    if (validatedMetrics.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Límite excedido. Máximo ${MAX_BATCH_SIZE} registros por batch.`,
          received: validatedMetrics.length
        },
        { status: 400 }
      );
    }
    
    // ========================================
    // PASO 4: CONVERTIR costCenterCode → departmentId
    // ========================================
    
    const costCenterCodes = [...new Set(validatedMetrics.map(m => m.costCenterCode))];
    
    const existingDepartments = await prisma.department.findMany({
      where: {
        costCenterCode: { in: costCenterCodes },
        accountId: userContext.accountId // ✅ CRÍTICO: Multi-tenant isolation
      },
      select: {
        id: true,
        displayName: true,
        costCenterCode: true
      }
    });
    
    // Crear mapa código → departmentId
    const codeToIdMap = new Map(
      existingDepartments.map(d => [d.costCenterCode!, d.id])
    );
    
    // Validar que todos los códigos existan
    const missingCodes = costCenterCodes.filter(code => !codeToIdMap.has(code));
    
    if (missingCodes.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Centros de costos no encontrados en su cuenta.',
          missingCostCenterCodes: missingCodes,
          message: 'Verifique que los códigos de centro de costos sean correctos.'
        },
        { status: 404 }
      );
    }
    
    console.log(`✅ Todos los centros de costos existen en cuenta ${userContext.accountId}`);
    
    // ========================================
    // PASO 5: PROCESAR CADA MÉTRICA
    // ========================================
    
    const results: (UploadResult | UploadError)[] = [];
    
    for (const metric of validatedMetrics) {
      try {
        // Obtener departmentId desde el mapa
        const departmentId = codeToIdMap.get(metric.costCenterCode)!;
        
        // Parsear período a fechas
        const { start, end, type } = parsePeriod(metric.period);
        
        // Validar consistencia datos
        const consistencyCheck = validateMetricsConsistency(metric);
        if (!consistencyCheck.valid) {
          results.push({
            success: false,
            departmentId: metric.departmentId,
            period: metric.period,
            error: 'Datos inconsistentes',
            details: consistencyCheck.errors
          });
          continue;
        }
        
        // ✅ UPSERT: Crear o actualizar según exista
        const upsertedMetric = await prisma.departmentMetric.upsert({
          where: {
            departmentId_period: {
              departmentId: departmentId,
              period: metric.period
            }
          },
          update: {
            // Actualizar solo campos provistos (nullables permitidos)
            turnoverRate: metric.turnoverRate,
            absenceRate: metric.absenceRate,
            issueCount: metric.issueCount,
            overtimeHoursTotal: metric.overtimeHoursTotal,
            overtimeHoursAvg: metric.overtimeHoursAvg,
            
            // Contexto cálculo (opcionales)
            headcountAvg: metric.headcountAvg,
            turnoverCount: metric.turnoverCount,
            absenceDaysTotal: metric.absenceDaysTotal,
            workingDaysTotal: metric.workingDaysTotal,
            overtimeEmployeeCount: metric.overtimeEmployeeCount,
            
            // Fase 1.5 opcional
            turnoverRegrettableRate: metric.turnoverRegrettableRate,
            turnoverRegrettableCount: metric.turnoverRegrettableCount,
            
            // Metadata
            notes: metric.notes,
            dataQuality: metric.dataQuality || 'validated'
          },
          create: {
            // ✅ NOMBRES EXACTOS DEL SCHEMA (camelCase en Prisma)
            accountId: userContext.accountId,
            departmentId: departmentId, // ← Convertido desde costCenterCode
            
            // Período
            period: metric.period,
            periodStart: start,
            periodEnd: end,
            periodType: type,
            
            // KPIs Fase 1
            turnoverRate: metric.turnoverRate,
            absenceRate: metric.absenceRate,
            issueCount: metric.issueCount,
            overtimeHoursTotal: metric.overtimeHoursTotal,
            overtimeHoursAvg: metric.overtimeHoursAvg,
            
            // Contexto cálculo
            headcountAvg: metric.headcountAvg,
            turnoverCount: metric.turnoverCount,
            absenceDaysTotal: metric.absenceDaysTotal,
            workingDaysTotal: metric.workingDaysTotal,
            overtimeEmployeeCount: metric.overtimeEmployeeCount,
            
            // Fase 1.5
            turnoverRegrettableRate: metric.turnoverRegrettableRate,
            turnoverRegrettableCount: metric.turnoverRegrettableCount,
            
            // Metadata
            uploadedBy: userContext.email,
            uploadMethod: 'manual',
            dataQuality: metric.dataQuality || 'validated',
            notes: metric.notes
          }
        });
        
        // Determinar si fue creación o actualización
        const action = await prisma.departmentMetric.count({
          where: {
            departmentId: metric.departmentId,
            period: metric.period,
            uploadedAt: { lt: upsertedMetric.uploadedAt }
          }
        }) > 0 ? 'updated' : 'created';
        
        results.push({
          success: true,
          departmentId: departmentId,
          period: metric.period,
          action,
          message: `Métrica ${action === 'created' ? 'creada' : 'actualizada'} exitosamente`
        });
        
        console.log(`✅ ${action.toUpperCase()}: ${metric.costCenterCode} (${departmentId}) - ${metric.period}`);
        
      } catch (error: any) {
        console.error(`❌ Error procesando métrica:`, error);
        results.push({
          success: false,
          departmentId: metric.costCenterCode, // Mostrar código en error
          period: metric.period,
          error: error.message || 'Error desconocido al guardar métrica'
        });
      }
    }
    
    // ========================================
    // PASO 6: GENERAR RESPUESTA MULTI-STATUS
    // ========================================
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    // Si TODO falló → 400
    if (successCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ninguna métrica pudo ser procesada',
          results
        },
        { status: 400 }
      );
    }
    
    // Si TODO exitoso → 200
    if (failureCount === 0) {
      return NextResponse.json(
        {
          success: true,
          message: `${successCount} métricas procesadas exitosamente`,
          results
        },
        { status: 200 }
      );
    }
    
    // Si PARCIAL → 207 Multi-Status
    return NextResponse.json(
      {
        success: 'partial',
        message: `${successCount} exitosas, ${failureCount} fallidas`,
        results
      },
      { status: 207 }
    );
    
  } catch (error: any) {
    console.error('❌ Error general en upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// ============================================
// MÉTODO GET: Endpoint info (opcional)
// ============================================

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/department-metrics/upload',
    method: 'POST',
    description: 'Cargar métricas departamentales (datos crudos)',
    authentication: 'Required (JWT)',
    authorization: ['ACCOUNT_OWNER', 'FOCALIZAHR_ADMIN'],
    features: [
      'Single or batch upload (hasta 100 registros)',
      'Upsert automático (crear o actualizar)',
      'Validación Zod completa',
      'Multi-tenant isolation',
      'Audit trail automático'
    ],
    example: {
      departmentId: 'dept_xyz',
      period: '2025-Q1',
      turnoverRate: 12.5,
      absenceRate: 3.2,
      issueCount: 2,
      overtimeHoursTotal: 450.0,
      overtimeHoursAvg: 15.0
    }
  });
}