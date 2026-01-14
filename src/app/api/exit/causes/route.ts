/**
 * API GET /api/exit/causes
 *
 * PROPÓSITO:
 * Análisis profundo de causas de salida - "Epidemiología vs Detective"
 * Transforma datos de salida en inteligencia accionable para CEOs
 *
 * AUTENTICACIÓN:
 * Headers inyectados por middleware:
 * - x-account-id (obligatorio)
 * - x-user-role (para RBAC)
 * - x-department-id (para filtrado jerárquico)
 *
 * QUERY PARAMS:
 * - section: string (truth|painmap|drain|predictability|roi|all)
 * - departmentId: string (opcional - filtrar por departamento)
 * - dateFrom: string (ISO date - filtro fecha inicio)
 * - dateTo: string (ISO date - filtro fecha fin)
 *
 * SECTIONS:
 * - truth: Frecuencia vs Severidad de factores (Acto 1)
 * - painmap: Mapa de dolor por departamento jerárquico (Acto 2)
 * - drain: Distribución talentClassification (Acto 3)
 * - predictability: Correlación alertas ignoradas (Acto 4)
 * - roi: Impacto financiero y benchmark (Acto 5)
 * - all: Todas las secciones
 *
 * @version 1.0
 * @date January 2026
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractUserContext,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  FinancialCalculator,
  CHILE_ECONOMIC_ADJUSTMENTS
} from '@/config/impactAssumptions';
import { formatCurrencyCLP } from '@/lib/financialCalculations';
import { EXIT_REASON_LABELS, ExitReason } from '@/types/exit';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TruthDataPoint {
  factor: string;
  frequency: number;
  avgSeverity: number;
  classification: 'wound' | 'noise' | 'mixed'; // herida | ruido | mixto
}

interface PainMapNode {
  departmentId: string;
  departmentName: string;
  gerenciaId: string | null;
  gerenciaName: string | null;
  exitCount: number;
  avgSeverity: number;
  maxSeverity: number;
  classification: 'safe' | 'warning' | 'toxic';
}

interface TalentDrainData {
  classification: string;
  count: number;
  percentage: number;
  label: string;
}

interface PredictabilityData {
  totalWithOnboarding: number;
  withIgnoredAlerts: number;
  predictabilityRate: number;
  avgIgnoredAlerts: number;
  avgManagedAlerts: number;
}

interface ROIData {
  keyTalentLosses: number;
  estimatedCostCLP: number;
  benchmarkSeverity: number | null;
  companySeverity: number;
  benchmarkComparison: 'better' | 'same' | 'worse';
  actionableInsight: string;
}

interface HRHypothesisReason {
  reason: string;
  label: string;
  count: number;
  percentage: number;
}

interface HRHypothesisData {
  reasons: HRHypothesisReason[];
  totalRecords: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function classifyTruthPoint(frequency: number, avgSeverity: number, maxFrequency: number): 'wound' | 'noise' | 'mixed' {
  const relativeFrequency = frequency / maxFrequency;

  if (avgSeverity >= 4.0) return 'wound';
  if (relativeFrequency > 0.5 && avgSeverity < 3.0) return 'noise';
  return 'mixed';
}

function classifySeverity(avgSeverity: number): 'safe' | 'warning' | 'toxic' {
  if (avgSeverity >= 4.0) return 'toxic';
  if (avgSeverity >= 3.0) return 'warning';
  return 'safe';
}

const TALENT_LABELS: Record<string, string> = {
  'key_talent': 'Talento Clave',
  'meets_expectations': 'Buen Desempeño',
  'poor_fit': 'Bajo Ajuste'
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ACTO 1: LA VERDAD DESTILADA
 * Frecuencia vs Severidad de factores de salida
 */
async function getTruthData(
  accountId: string,
  departmentIds?: string[]
): Promise<TruthDataPoint[]> {

  // Construir condición departamento
  const deptCondition = departmentIds
    ? Prisma.sql`AND er.department_id = ANY(${departmentIds}::text[])`
    : Prisma.empty;

  const rawData = await prisma.$queryRaw<Array<{
    factor: string;
    frequency: bigint;
    avg_severity: number;
  }>>`
    WITH factor_data AS (
      SELECT
        key as factor,
        value::float as severity
      FROM exit_records er,
      LATERAL jsonb_each(er.exit_factors_detail::jsonb)
      WHERE er.exit_factors_detail IS NOT NULL
      AND er.account_id = ${accountId}
      ${deptCondition}
    )
    SELECT
      factor,
      COUNT(*)::bigint as frequency,
      ROUND(AVG(severity)::numeric, 2)::float as avg_severity
    FROM factor_data
    GROUP BY factor
    ORDER BY avg_severity DESC
  `;

  const maxFrequency = Math.max(...rawData.map((d: { frequency: bigint }) => Number(d.frequency)), 1);

  return rawData.map((row: { factor: string; frequency: bigint; avg_severity: number }) => ({
    factor: row.factor,
    frequency: Number(row.frequency),
    avgSeverity: row.avg_severity,
    classification: classifyTruthPoint(Number(row.frequency), row.avg_severity, maxFrequency)
  }));
}

/**
 * ACTO 2: EL MAPA DEL DOLOR
 * Severidad por departamento jerárquico
 */
async function getPainMapData(
  accountId: string,
  departmentIds?: string[]
): Promise<PainMapNode[]> {

  const deptCondition = departmentIds
    ? Prisma.sql`AND er.department_id = ANY(${departmentIds}::text[])`
    : Prisma.empty;

  const rawData = await prisma.$queryRaw<Array<{
    department_id: string;
    department_name: string;
    gerencia_id: string | null;
    gerencia_name: string | null;
    exit_count: bigint;
    avg_severity: number;
    max_severity: number;
  }>>`
    WITH factor_data AS (
      SELECT
        er.department_id,
        d.display_name as department_name,
        d.parent_id as gerencia_id,
        p.display_name as gerencia_name,
        value::float as severity
      FROM exit_records er
      JOIN departments d ON d.id = er.department_id
      LEFT JOIN departments p ON p.id = d.parent_id,
      LATERAL jsonb_each(er.exit_factors_detail::jsonb)
      WHERE er.exit_factors_detail IS NOT NULL
      AND er.account_id = ${accountId}
      ${deptCondition}
    )
    SELECT
      department_id,
      department_name,
      gerencia_id,
      gerencia_name,
      COUNT(DISTINCT department_id || '-' || severity::text)::bigint as exit_count,
      ROUND(AVG(severity)::numeric, 2)::float as avg_severity,
      MAX(severity)::float as max_severity
    FROM factor_data
    GROUP BY department_id, department_name, gerencia_id, gerencia_name
    ORDER BY avg_severity DESC
  `;

  return rawData.map((row: {
    department_id: string;
    department_name: string;
    gerencia_id: string | null;
    gerencia_name: string | null;
    exit_count: bigint;
    avg_severity: number;
    max_severity: number;
  }) => ({
    departmentId: row.department_id,
    departmentName: row.department_name,
    gerenciaId: row.gerencia_id,
    gerenciaName: row.gerencia_name,
    exitCount: Number(row.exit_count),
    avgSeverity: row.avg_severity,
    maxSeverity: row.max_severity,
    classification: classifySeverity(row.avg_severity)
  }));
}

/**
 * ACTO 3: EL DRENAJE DE TALENTO
 * Distribución por clasificación de talento
 */
async function getTalentDrainData(
  accountId: string,
  departmentIds?: string[]
): Promise<TalentDrainData[]> {

  const whereClause: Prisma.ExitRecordWhereInput = {
    accountId,
    talentClassification: { not: null }
  };

  if (departmentIds && departmentIds.length > 0) {
    whereClause.departmentId = { in: departmentIds };
  }

  const groupedData = await prisma.exitRecord.groupBy({
    by: ['talentClassification'],
    where: whereClause,
    _count: { id: true }
  });

  type GroupedRecord = { talentClassification: string | null; _count: { id: number } };
  const total = groupedData.reduce((sum: number, g: GroupedRecord) => sum + g._count.id, 0);

  return groupedData.map((row: GroupedRecord) => ({
    classification: row.talentClassification || 'unknown',
    count: row._count.id,
    percentage: total > 0 ? Math.round((row._count.id / total) * 100) : 0,
    label: TALENT_LABELS[row.talentClassification || ''] || 'Sin clasificar'
  }));
}

/**
 * ACTO 4: LA CRÓNICA DE UNA MUERTE ANUNCIADA
 * Correlación con alertas ignoradas de onboarding
 */
async function getPredictabilityData(
  accountId: string,
  departmentIds?: string[]
): Promise<PredictabilityData> {

  const whereClause: Prisma.ExitRecordWhereInput = {
    accountId,
    hadOnboarding: true
  };

  if (departmentIds && departmentIds.length > 0) {
    whereClause.departmentId = { in: departmentIds };
  }

  const records = await prisma.exitRecord.findMany({
    where: whereClause,
    select: {
      id: true,
      onboardingIgnoredAlerts: true,
      onboardingManagedAlerts: true,
      onboardingAlertsCount: true
    }
  });

  type ExitRecordSelect = {
    id: string;
    onboardingIgnoredAlerts: number;
    onboardingManagedAlerts: number;
    onboardingAlertsCount: number;
  };

  const withIgnoredAlerts = records.filter((r: ExitRecordSelect) => r.onboardingIgnoredAlerts > 0).length;
  const predictabilityRate = records.length > 0
    ? Math.round((withIgnoredAlerts / records.length) * 100)
    : 0;

  const avgIgnored = records.length > 0
    ? records.reduce((sum: number, r: ExitRecordSelect) => sum + r.onboardingIgnoredAlerts, 0) / records.length
    : 0;

  const avgManaged = records.length > 0
    ? records.reduce((sum: number, r: ExitRecordSelect) => sum + r.onboardingManagedAlerts, 0) / records.length
    : 0;

  return {
    totalWithOnboarding: records.length,
    withIgnoredAlerts,
    predictabilityRate,
    avgIgnoredAlerts: Math.round(avgIgnored * 10) / 10,
    avgManagedAlerts: Math.round(avgManaged * 10) / 10
  };
}

/**
 * ACTO 5: CONTEXTO Y ROI
 * Impacto financiero y benchmark
 */
async function getROIData(
  accountId: string,
  departmentIds?: string[]
): Promise<ROIData> {

  // Contar salidas de talento clave
  const whereClause: Prisma.ExitRecordWhereInput = {
    accountId,
    talentClassification: 'key_talent'
  };

  if (departmentIds && departmentIds.length > 0) {
    whereClause.departmentId = { in: departmentIds };
  }

  const keyTalentCount = await prisma.exitRecord.count({ where: whereClause });

  // Calcular severidad promedio de la empresa
  const severityAgg = await prisma.exitRecord.aggregate({
    where: {
      accountId,
      exitFactorsAvg: { not: null },
      ...(departmentIds && departmentIds.length > 0 ? { departmentId: { in: departmentIds } } : {})
    },
    _avg: { exitFactorsAvg: true }
  });

  const companySeverity = severityAgg._avg.exitFactorsAvg || 0;

  // Calcular costo estimado (salario promedio Chile * factor SHRM)
  const avgSalary = CHILE_ECONOMIC_ADJUSTMENTS.average_salaries_by_sector.default;
  const annualSalary = avgSalary * 12;
  const replacementCostPerPerson = FinancialCalculator.calculateTurnoverCost(annualSalary);
  const estimatedCost = keyTalentCount * replacementCostPerPerson.cost_clp;

  // Benchmark de industria (placeholder - en producción vendría de /api/benchmarks)
  const benchmarkSeverity = 2.8; // Promedio industria típico

  let benchmarkComparison: 'better' | 'same' | 'worse';
  let actionableInsight: string;

  if (companySeverity < benchmarkSeverity - 0.3) {
    benchmarkComparison = 'better';
    actionableInsight = 'Tu severidad está por debajo del mercado. Mantén las prácticas actuales.';
  } else if (companySeverity > benchmarkSeverity + 0.3) {
    benchmarkComparison = 'worse';
    actionableInsight = `Tu severidad (${companySeverity.toFixed(1)}) supera al mercado (${benchmarkSeverity}). No es el mercado, hay oportunidad de mejora interna.`;
  } else {
    benchmarkComparison = 'same';
    actionableInsight = 'Tu severidad está en línea con el mercado. Busca diferenciarte con mejoras específicas.';
  }

  return {
    keyTalentLosses: keyTalentCount,
    estimatedCostCLP: estimatedCost,
    benchmarkSeverity,
    companySeverity: Math.round(companySeverity * 100) / 100,
    benchmarkComparison,
    actionableInsight
  };
}

/**
 * HIPÓTESIS RRHH
 * Distribución de razones de salida registradas por RRHH
 * (Lo que RRHH registra en el formulario de salida)
 */
async function getHRHypothesisData(
  accountId: string,
  departmentIds?: string[]
): Promise<HRHypothesisData> {

  const whereClause: Prisma.ExitRecordWhereInput = {
    accountId,
    exitReason: { not: null }
  };

  if (departmentIds && departmentIds.length > 0) {
    whereClause.departmentId = { in: departmentIds };
  }

  const groupedData = await prisma.exitRecord.groupBy({
    by: ['exitReason'],
    where: whereClause,
    _count: { id: true }
  });

  type GroupedRecord = { exitReason: string | null; _count: { id: number } };
  const total = groupedData.reduce((sum: number, g: GroupedRecord) => sum + g._count.id, 0);

  const reasons: HRHypothesisReason[] = groupedData
    .filter((row: GroupedRecord) => row.exitReason !== null)
    .map((row: GroupedRecord) => ({
      reason: row.exitReason as string,
      label: EXIT_REASON_LABELS[row.exitReason as ExitReason] || row.exitReason || 'Otro',
      count: row._count.id,
      percentage: total > 0 ? Math.round((row._count.id / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  return {
    reasons,
    totalRecords: total
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER GET
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('📊 [Exit Causes] Request iniciada');

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
    const section = searchParams.get('section') || 'all';
    const departmentId = searchParams.get('departmentId') || undefined;

    console.log('[Exit Causes] Params:', { section, departmentId, userRole: userContext.role });

    // ════════════════════════════════════════════════════════════════════════
    // PASO 3: FILTRADO JERÁRQUICO
    // ════════════════════════════════════════════════════════════════════════

    let accessibleDepartmentIds: string[] | undefined = undefined;

    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId);
      accessibleDepartmentIds = [userContext.departmentId, ...childIds];

      // Validar acceso si se especifica departamento
      if (departmentId && !accessibleDepartmentIds.includes(departmentId)) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado a este departamento' },
          { status: 403 }
        );
      }
    }

    // Si se especifica departmentId, filtrar solo ese
    const filterDeptIds = departmentId
      ? [departmentId]
      : accessibleDepartmentIds;

    // ════════════════════════════════════════════════════════════════════════
    // PASO 4: OBTENER DATOS POR SECCIÓN
    // ════════════════════════════════════════════════════════════════════════

    const validSections = ['truth', 'painmap', 'drain', 'predictability', 'roi', 'all'];
    if (!validSections.includes(section)) {
      return NextResponse.json(
        { success: false, error: `Sección inválida. Use: ${validSections.join(', ')}` },
        { status: 400 }
      );
    }

    const response: Record<string, any> = {
      success: true,
      meta: {
        section,
        departmentId: departmentId || null,
        userRole: userContext.role,
        filteredByHierarchy: !!accessibleDepartmentIds
      }
    };

    // Ejecutar secciones solicitadas
    if (section === 'truth' || section === 'all') {
      response.truth = await getTruthData(userContext.accountId, filterDeptIds);
    }

    if (section === 'painmap' || section === 'all') {
      response.painmap = await getPainMapData(userContext.accountId, filterDeptIds);
    }

    if (section === 'drain' || section === 'all') {
      response.drain = await getTalentDrainData(userContext.accountId, filterDeptIds);
    }

    if (section === 'predictability' || section === 'all') {
      response.predictability = await getPredictabilityData(userContext.accountId, filterDeptIds);
    }

    if (section === 'roi' || section === 'all') {
      response.roi = await getROIData(userContext.accountId, filterDeptIds);
    }

    // Siempre incluir hrHypothesis para RevelationCard
    if (section === 'all') {
      response.hrHypothesis = await getHRHypothesisData(userContext.accountId, filterDeptIds);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PASO 5: RESPUESTA
    // ════════════════════════════════════════════════════════════════════════

    response.responseTime = Date.now() - startTime;

    console.log(`✅ [Exit Causes] Success in ${response.responseTime}ms`);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[Exit Causes] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
