// src/app/api/onboarding/alerts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext, buildParticipantAccessFilter } from '@/lib/services/AuthorizationService';
import { OnboardingAlertService } from '@/lib/services/OnboardingAlertService';
import { AlertTrend, AlertHistoryPoint } from '@/types/onboarding';

/**
 * GET /api/onboarding/alerts
 * 
 * Lista alertas con:
 * - Filtrado jerárquico enterprise (AuthorizationService)
 * - Métricas de inteligencia comparativa
 * - Filtros: severity, status, slaStatus
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API /onboarding/alerts] Request iniciada');
    
    // ========================================
    // 1. AUTENTICACIÓN - Extraer contexto
    // ========================================
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { error: 'No autorizado', success: false },
        { status: 401 }
      );
    }
    
    console.log('[API] UserContext:', {
      accountId: userContext.accountId,
      role: userContext.role,
      departmentId: userContext.departmentId
    });
    
    // ========================================
    // 2. QUERY PARAMS - Filtros opcionales
    // ========================================
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const slaStatus = searchParams.get('slaStatus');
    
    const accessFilter = await buildParticipantAccessFilter(
      userContext,
      { dataType: 'results' }
    );
    
    const whereClause: any = {
      accountId: userContext.accountId
    };

    if (accessFilter.departmentId) {
      whereClause.journey = {
        departmentId: accessFilter.departmentId
      };
    }
    
    if (severity) whereClause.severity = severity;
    if (status) whereClause.status = status;
    if (slaStatus) whereClause.slaStatus = slaStatus;
    
    // ========================================
    // 5. QUERY ALERTS CON RELACIONES
    // ========================================
    const alerts = await prisma.journeyAlert.findMany({
      where: whereClause,
      include: {
        journey: {
          include: {
            department: {
              select: {
                id: true,
                displayName: true,
                standardCategory: true
              }
            }
          }
        }
      },
      orderBy: [
        { severity: 'asc' },
        { dueDate: 'asc' }
      ]
    });
    
    console.log(`[API] Encontradas ${alerts.length} alertas accesibles`);
    
    // ========================================
    // 6. CALCULAR MÉTRICAS INTELIGENCIA
    // ========================================
    
    const journeyFilter: any = {
      accountId: userContext.accountId
    };
    if (accessFilter.departmentId) {
      journeyFilter.departmentId = accessFilter.departmentId;
    }
    
    const totalJourneys = await prisma.journeyOrchestration.count({
      where: journeyFilter
    });
    
    const alertRate = totalJourneys > 0 
      ? Math.round((alerts.length / totalJourneys) * 100)
      : 0;
    
    const alertsByDept: Record<string, number> = {};
    alerts.forEach(alert => {
      const deptName = alert.journey.department?.displayName || 'Sin departamento';
      alertsByDept[deptName] = (alertsByDept[deptName] || 0) + 1;
    });
    
    const topDepartments = Object.entries(alertsByDept)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    const alertsByType: Record<string, number> = {};
    alerts.forEach(alert => {
      alertsByType[alert.alertType] = (alertsByType[alert.alertType] || 0) + 1;
    });
    
    const topAlertTypes = Object.entries(alertsByType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    const severityCounts = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length
    };
    
    const slaCounts = {
      on_time: alerts.filter(a => a.slaStatus === 'on_time').length,
      at_risk: alerts.filter(a => a.slaStatus === 'at_risk').length,
      violated: alerts.filter(a => a.slaStatus === 'violated').length
    };
    
    // ========================================
    // 6.1 OBTENER TREND + HISTORY (V2.0 - ARQUITECTURA ENTERPRISE)
    // ========================================
    let trendData: AlertTrend | null = null;
    let historyData: AlertHistoryPoint[] = [];
    
    try {
      const statistics = await OnboardingAlertService.getAlertStatistics(
        userContext.accountId
      );
      
      // ✅ NO type assertion needed - servicio retorna tipos correctos
      trendData = statistics.trend;
      historyData = statistics.history;
    } catch (error) {
      console.error('[API] Error obteniendo trend/history (non-critical):', error);
    }
    
    // ========================================
    // 7. RESPONSE CON INTELIGENCIA
    // ========================================
    return NextResponse.json({
      data: {
        alerts,
        metrics: {
          totalAlerts: alerts.length,
          totalJourneys,
          alertRate,
          topDepartments,
          topAlertTypes,
          severityDistribution: severityCounts,
          slaDistribution: slaCounts,
          trend: trendData,
          history: historyData
        }
      },
      success: true
    });
    
  } catch (error: any) {
    console.error('[API /onboarding/alerts] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error obteniendo alertas', 
        success: false 
      },
      { status: 500 }
    );
  }
}