/**
 * API GET /api/exit/insights/onboarding-correlation
 *
 * PROPÓSITO:
 * Obtener correlación entre alertas onboarding ignoradas y salidas
 * Cuantificar costo de oportunidad por no actuar en alertas tempranas
 *
 * AUTENTICACIÓN:
 * Headers inyectados por middleware:
 * - x-account-id (obligatorio)
 * - x-user-role (para RBAC)
 * - x-department-id (para filtrado jerárquico)
 *
 * QUERY PARAMS:
 * - scope: 'company' | 'filtered' (default 'filtered')
 * - departmentId?: string - Filtrar por departamento específico
 * - period?: string - Período formato "YYYY-MM" (default: mes actual)
 *
 * RESPONSE:
 * {
 *   success: true,
 *   data: {
 *     conservationIndex: number,
 *     alertPredictionRate: number,
 *     exitsThisMonth: number,
 *     withOnboarding: number,
 *     totalIgnoredAlerts: number,
 *     totalManagedAlerts: number,
 *     correlationRate: number,
 *     avoidableCost: number,
 *     cases: [{ departmentId, departmentName, gerenciaId, gerenciaName, exitsCount, ignoredAlertsCount, cost }]
 *   }
 * }
 *
 * @version 1.0
 * @date January 2026
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService';
import { SalaryConfigService } from '@/lib/services/SalaryConfigService';


// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CorrelationCase {
  departmentId: string;
  departmentName: string;
  gerenciaId: string | null;
  gerenciaName: string | null;
  exitsCount: number;
  exitsWithIgnoredAlertsCount: number; // 🆕 Personas con alertas ignoradas
  ignoredAlertsCount: number;
  cost: number;
}

interface CorrelationData {
  conservationIndex: number | null;
  alertPredictionRate: number;
  exitsThisMonth: number;
  withOnboarding: number;
  exitsWithIgnoredAlerts: number; // 🆕 Personas con alertas ignoradas (para texto modal)
  totalIgnoredAlerts: number;
  totalManagedAlerts: number;
  correlationRate: number;
  avoidableCost: number;
  cases: CorrelationCase[];
}


// ═══════════════════════════════════════════════════════════════════════════
// HANDLER GET
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🔗 [Onboarding Correlation] Request iniciada');

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

    // ════════════════════════════════════════════════════════════════════════
    // PASO 2: PARSE QUERY PARAMS
    // ════════════════════════════════════════════════════════════════════════

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'filtered';
    const departmentId = searchParams.get('departmentId');
    const periodParam = searchParams.get('period');

    // Calcular período (default: mes actual)
    const now = new Date();
    const period = periodParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [year, month] = period.split('-').map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59);

    console.log('[Onboarding Correlation] Params:', {
      scope,
      departmentId,
      period,
      userRole: userContext.role
    });

    // ════════════════════════════════════════════════════════════════════════
    // PASO 3: FILTRADO JERÁRQUICO
    // ════════════════════════════════════════════════════════════════════════

    let accessibleDepartmentIds: string[] | null = null;

    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId);
      const canDrillDown = [userContext.departmentId, ...childIds];

      if (scope === 'filtered') {
        accessibleDepartmentIds = canDrillDown;
      }

      // Validar acceso a departamento específico
      if (departmentId && !canDrillDown.includes(departmentId)) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado a este departamento' },
          { status: 403 }
        );
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // PASO 4: CONSTRUIR FILTRO BASE
    // ════════════════════════════════════════════════════════════════════════

    const baseWhere: any = {
      accountId: userContext.accountId,
      exitDate: {
        gte: periodStart,
        lte: periodEnd
      }
    };

    if (departmentId) {
      baseWhere.departmentId = departmentId;
    } else if (accessibleDepartmentIds) {
      baseWhere.departmentId = { in: accessibleDepartmentIds };
    }

    // ════════════════════════════════════════════════════════════════════════
    // PASO 5: OBTENER EXIT RECORDS CON CORRELACIÓN ONBOARDING
    // ════════════════════════════════════════════════════════════════════════

    const exitRecords = await prisma.exitRecord.findMany({
      where: baseWhere,
      select: {
        id: true,
        departmentId: true,
        eis: true,
        hadOnboarding: true,
        onboardingEXOScore: true,
        onboardingIgnoredAlerts: true,
        onboardingManagedAlerts: true,
        department: {
          select: {
            id: true,
            displayName: true,
            parentId: true,
            parent: {
              select: {
                id: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    console.log(`[Onboarding Correlation] Found ${exitRecords.length} exit records`);

    // ════════════════════════════════════════════════════════════════════════
    // PASO 6: CALCULAR MÉTRICAS
    // ════════════════════════════════════════════════════════════════════════

    const exitsThisMonth = exitRecords.length;
    const withOnboarding = exitRecords.filter(r => r.hadOnboarding).length;

    // Sumar alertas ignoradas y gestionadas
    let totalIgnoredAlerts = 0;
    let totalManagedAlerts = 0;
    let eisSum = 0;
    let exoSum = 0;
    let validConservationCount = 0;

    for (const record of exitRecords) {
      totalIgnoredAlerts += record.onboardingIgnoredAlerts || 0;
      totalManagedAlerts += record.onboardingManagedAlerts || 0;

      // Para conservation index
      if (record.eis !== null && record.onboardingEXOScore !== null && record.onboardingEXOScore > 0) {
        eisSum += record.eis;
        exoSum += record.onboardingEXOScore;
        validConservationCount++;
      }
    }

    // Conservation Index: qué % del score onboarding se conserva al salir
    // LÍMITE: máximo 100% (puede ser >100 si EIS > EXO, lo cual es raro pero posible)
    const conservationIndex = validConservationCount > 0
      ? Math.min(100, Math.round(((eisSum / validConservationCount) / (exoSum / validConservationCount)) * 100))
      : null;

    // Alert Prediction Rate: qué % de exits tenían alertas ignoradas
    const exitsWithIgnoredAlerts = exitRecords.filter(r => r.onboardingIgnoredAlerts > 0).length;
    const alertPredictionRate = withOnboarding > 0
      ? Math.round((exitsWithIgnoredAlerts / withOnboarding) * 100)
      : 0;

    // Correlation Rate: % de salidas que tenían alertas ignoradas sobre total
    const correlationRate = exitsThisMonth > 0
      ? Math.round((exitsWithIgnoredAlerts / exitsThisMonth) * 100)
      : 0;

    // ════════════════════════════════════════════════════════════════════════
    // PASO 7: CALCULAR COSTO EVITABLE (NO HARDCODEAR)
    // ════════════════════════════════════════════════════════════════════════

    const salaryResult = await SalaryConfigService.getSalaryForAccount(userContext.accountId);
    const turnoverResult = SalaryConfigService.calculateTurnoverCost(salaryResult.monthlySalary);
    const costPerExit = turnoverResult.turnoverCost;

    // Costo evitable = salidas con alertas ignoradas * costo por salida
    const avoidableCost = exitsWithIgnoredAlerts * costPerExit;

    // ════════════════════════════════════════════════════════════════════════
    // PASO 8: AGRUPAR POR DEPARTAMENTO (CASES)
    // ════════════════════════════════════════════════════════════════════════

    const departmentMap = new Map<string, {
      departmentId: string;
      departmentName: string;
      gerenciaId: string | null;
      gerenciaName: string | null;
      exitsCount: number;
      exitsWithIgnoredAlertsCount: number; // 🆕 Personas CON alertas ignoradas
      ignoredAlertsCount: number;
    }>();

    for (const record of exitRecords) {
      const deptId = record.departmentId;
      const existing = departmentMap.get(deptId);
      const hasIgnoredAlerts = (record.onboardingIgnoredAlerts || 0) > 0;

      if (existing) {
        existing.exitsCount++;
        existing.ignoredAlertsCount += record.onboardingIgnoredAlerts || 0;
        if (hasIgnoredAlerts) {
          existing.exitsWithIgnoredAlertsCount++;
        }
      } else {
        departmentMap.set(deptId, {
          departmentId: deptId,
          departmentName: record.department?.displayName || 'Sin nombre',
          gerenciaId: record.department?.parentId || null,
          gerenciaName: record.department?.parent?.displayName || null,
          exitsCount: 1,
          exitsWithIgnoredAlertsCount: hasIgnoredAlerts ? 1 : 0,
          ignoredAlertsCount: record.onboardingIgnoredAlerts || 0
        });
      }
    }

    // Convertir a array y agregar costo
    // 🔧 FIX BUG 3: Costo = personas con alertas ignoradas × costo, NO total exits
    const cases: CorrelationCase[] = Array.from(departmentMap.values())
      .filter(c => c.exitsWithIgnoredAlertsCount > 0) // Solo casos con personas que tenían alertas ignoradas
      .map(c => ({
        ...c,
        cost: c.exitsWithIgnoredAlertsCount * costPerExit // 🔧 Usar personas con alertas, no total
      }))
      .sort((a, b) => b.exitsWithIgnoredAlertsCount - a.exitsWithIgnoredAlertsCount);

    // ════════════════════════════════════════════════════════════════════════
    // PASO 9: RESPONSE
    // ════════════════════════════════════════════════════════════════════════

    const data: CorrelationData = {
      conservationIndex,
      alertPredictionRate,
      exitsThisMonth,
      withOnboarding,
      exitsWithIgnoredAlerts, // 🆕 Personas con alertas ignoradas
      totalIgnoredAlerts,
      totalManagedAlerts,
      correlationRate,
      avoidableCost,
      cases
    };

    console.log('[Onboarding Correlation] ✅ Response:', {
      exitsThisMonth,
      withOnboarding,
      alertPredictionRate,
      avoidableCost: `$${(avoidableCost / 1000000).toFixed(1)}M CLP`
    });

    return NextResponse.json({
      success: true,
      data,
      period,
      metadata: {
        avgSalaryUsed: salaryResult.monthlySalary,
        costPerExitUsed: costPerExit,
        salarySource: salaryResult.source,
        source: 'SHRM/Deloitte methodology'
      },
      responseTime: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('[Onboarding Correlation] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
