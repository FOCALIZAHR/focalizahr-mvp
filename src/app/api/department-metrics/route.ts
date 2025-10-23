// ============================================
// API GET /api/department-metrics
// CHAT 9 REFACTORIZADO - Enterprise Security
// Lista métricas departamentales con filtros
// ============================================
// ⭐ AGREGAR ESTA LÍNEA AL INICIO
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { departmentMetricsQuerySchema } from '@/lib/validations/departmentMetrics'
import { ZodError } from 'zod';

// ============================================
// TIPOS Y INTERFACES
// ============================================

interface UserContext {
  accountId: string;
  role: string;
  userId: string;
  departmentId: string | null;
}

interface QueryFilters {
  departmentId?: string;
  period?: string;
  periodType?: string;
  dataQuality?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// FUNCIÓN PRINCIPAL: GET HANDLER
// ============================================

export async function GET(request: NextRequest) {
  try {
    // ========================================
    // PASO 1: AUTENTICACIÓN
    // ========================================
    
    const userContext: UserContext = {
      accountId: request.headers.get('x-account-id') || '',
      role: request.headers.get('x-user-role') || '',
      userId: request.headers.get('x-user-id') || '',
      departmentId: request.headers.get('x-department-id')
    };
    
    if (!userContext.accountId || !userContext.userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No autenticado' 
        },
        { status: 401 }
      );
    }
    
    // ========================================
    // PASO 2: PARSEAR QUERY PARAMS
    // ========================================
    
    const { searchParams } = new URL(request.url);
    
    const queryParams: QueryFilters = {
      departmentId: searchParams.get('departmentId') || undefined,
      period: searchParams.get('period') || undefined,
      periodType: searchParams.get('periodType') || undefined,
      dataQuality: searchParams.get('dataQuality') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };
    
    // Validar con Zod
    try {
      departmentMetricsQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Parámetros de consulta inválidos',
            validationErrors: error.errors
          },
          { status: 400 }
        );
      }
    }
    
    // ========================================
    // PASO 3: CONSTRUIR FILTROS PRISMA
    // ========================================
    
    // ✅ CRÍTICO: Multi-tenant isolation SIEMPRE
    const whereClause: any = {
      accountId: userContext.accountId
    };
    
    // Filtro por departamento (si se especifica)
    if (queryParams.departmentId) {
      whereClause.departmentId = queryParams.departmentId;
    }
    
    // Filtro por período exacto (si se especifica)
    if (queryParams.period) {
      whereClause.period = queryParams.period;
    }
    
    // Filtro por tipo de período (si se especifica)
    if (queryParams.periodType) {
      whereClause.periodType = queryParams.periodType;
    }
    
    // Filtro por calidad de datos (si se especifica)
    if (queryParams.dataQuality) {
      whereClause.dataQuality = queryParams.dataQuality;
    }
    
    console.log(`📊 Consulta métricas para cuenta ${userContext.accountId}:`, whereClause);
    
    // ========================================
    // PASO 4: EJECUTAR QUERIES PARALELAS
    // ========================================
    
    const [metrics, totalCount] = await Promise.all([
      // Query principal con include department
      prisma.departmentMetric.findMany({
        where: whereClause,
        include: {
          department: {
            select: {
              id: true,
              displayName: true,
              costCenterCode: true,
              standardCategory: true
            }
          }
        },
        orderBy: [
          { periodStart: 'desc' },
          { department: { displayName: 'asc' } }
        ],
        take: queryParams.limit,
        skip: queryParams.offset
      }),
      
      // Count total para paginación
      prisma.departmentMetric.count({
        where: whereClause
      })
    ]);
    
    // ========================================
    // PASO 5: CALCULAR ESTADÍSTICAS AGREGADAS
    // ========================================
    
    const stats = metrics.length > 0 ? {
      // Promedios
      avgTurnoverRate: calculateAverage(metrics.map(m => m.turnoverRate)),
      avgAbsenceRate: calculateAverage(metrics.map(m => m.absenceRate)),
      avgOvertimeHours: calculateAverage(metrics.map(m => m.overtimeHoursAvg)),
      
      // Totales
      totalIssues: metrics.reduce((sum, m) => sum + (m.issueCount || 0), 0),
      totalMetrics: metrics.length,
      
      // Rangos
      turnoverRange: {
        min: Math.min(...metrics.map(m => m.turnoverRate || 0)),
        max: Math.max(...metrics.map(m => m.turnoverRate || 0))
      },
      absenceRange: {
        min: Math.min(...metrics.map(m => m.absenceRate || 0)),
        max: Math.max(...metrics.map(m => m.absenceRate || 0))
      },
      
      // Distribución por período
      periodDistribution: groupByPeriodType(metrics)
    } : null;
    
    // ========================================
    // PASO 6: FORMATEAR RESPUESTA
    // ========================================
    
    // ✅ Mapear a camelCase para respuesta JSON
    const formattedMetrics = metrics.map(m => ({
      id: m.id,
      accountId: m.accountId,
      departmentId: m.departmentId,
      
      // Department info (nested)
      department: m.department ? {
        id: m.department.id,
        displayName: m.department.displayName,
        costCenterCode: m.department.costCenterCode,
        standardCategory: m.department.standardCategory
      } : null,
      
      // Período
      period: m.period,
      periodStart: m.periodStart.toISOString(),
      periodEnd: m.periodEnd.toISOString(),
      periodType: m.periodType,
      
      // KPIs (camelCase)
      turnoverRate: m.turnoverRate,
      absenceRate: m.absenceRate,
      issueCount: m.issueCount,
      overtimeHoursTotal: m.overtimeHoursTotal,
      overtimeHoursAvg: m.overtimeHoursAvg,
      
      // Contexto
      headcountAvg: m.headcountAvg,
      turnoverCount: m.turnoverCount,
      absenceDaysTotal: m.absenceDaysTotal,
      workingDaysTotal: m.workingDaysTotal,
      overtimeEmployeeCount: m.overtimeEmployeeCount,
      
      // Fase 1.5
      turnoverRegrettableRate: m.turnoverRegrettableRate,
      turnoverRegrettableCount: m.turnoverRegrettableCount,
      
      // Metadata
      uploadedBy: m.uploadedBy,
      uploadedAt: m.uploadedAt.toISOString(),
      uploadMethod: m.uploadMethod,
      dataQuality: m.dataQuality,
      notes: m.notes
    }));
    
    // ========================================
    // PASO 7: RESPUESTA EXITOSA
    // ========================================
    
    return NextResponse.json({
      success: true,
      data: formattedMetrics,
      pagination: {
        total: totalCount,
        limit: queryParams.limit,
        offset: queryParams.offset,
        hasMore: (queryParams.offset || 0) + metrics.length < totalCount
      },
      statistics: stats,
      filters: {
        accountId: userContext.accountId,
        ...queryParams
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error en GET /department-metrics:', error);
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
// HELPER FUNCTIONS
// ============================================

/**
 * Calcula el promedio de un array de números, ignorando nulls
 */
function calculateAverage(values: (number | null)[]): number | null {
  const validValues = values.filter((v): v is number => v !== null);
  if (validValues.length === 0) return null;
  
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / validValues.length) * 100) / 100;
}

/**
 * Agrupa métricas por tipo de período
 */
function groupByPeriodType(metrics: any[]): Record<string, number> {
  return metrics.reduce((acc, m) => {
    const type = m.periodType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}