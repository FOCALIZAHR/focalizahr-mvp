// src/app/api/benchmarks/route.ts
// ============================================================================
// API BENCHMARKS v2.0 - Con InsightEngine
// ============================================================================
//
// Endpoint: GET /api/benchmarks
// Autenticación: JWT (accountId extraído del token)
//
// Query params:
//   - metricType: string (requerido) - "onboarding_exo", "exit_retention_risk"
//   - standardCategory: string (requerido) - "personas", "tecnologia", "ALL"
//   - dimension: string (opcional, default "GLOBAL")
//   - departmentId: string (opcional) - Para calcular comparación
//   - country: string (opcional) - Sobrescribe country del account
//   - includeInsights: boolean (opcional, default true)
//
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InsightEngine } from '@/lib/services/InsightEngine';
import type { InsightItem } from '@/types/benchmark';

// ============================================================================
// TYPES
// ============================================================================

interface AccountContext {
  id: string;
  country: string;
  industry: string | null;
  companySize: string | null;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // ═══════════════════════════════════════════════════════════
    // PASO 1: Autenticación
    // ═══════════════════════════════════════════════════════════
    const account = await getAccountFromRequest(request);
    
    if (!account) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // ═══════════════════════════════════════════════════════════
    // PASO 2: Parse y validar query params
    // ═══════════════════════════════════════════════════════════
    const { searchParams } = new URL(request.url);
    
    const metricType = searchParams.get('metricType');
    const standardCategory = searchParams.get('standardCategory');
    const dimension = searchParams.get('dimension') || 'GLOBAL';
    const segment = searchParams.get('segment') || 'ALL';
    const departmentId = searchParams.get('departmentId') || undefined;
    const country = searchParams.get('country') || account.country;
    const includeInsights = searchParams.get('includeInsights') !== 'false';
    
    // Validación
    if (!metricType) {
      return NextResponse.json(
        { error: 'metricType es requerido' },
        { status: 400 }
      );
    }
    
    if (!standardCategory) {
      return NextResponse.json(
        { error: 'standardCategory es requerido' },
        { status: 400 }
      );
    }
    
    // ═══════════════════════════════════════════════════════════
    // PASO 3: Buscar mejor benchmark disponible (cascada)
    // ═══════════════════════════════════════════════════════════
    const { benchmark, specificityLevel } = await findBestBenchmark({
      metricType,
      country,
      industry: account.industry,
      companySize: account.companySize,
      standardCategory,
      dimension,
      segment,
    });
    
    if (!benchmark) {
      return NextResponse.json({
        success: false,
        message: 'Benchmark no disponible aún. Se requiere más data del mercado para esta combinación.',
        data: {
          benchmark: null,
          comparison: null,
          insights: []
        }
      });
    }
    
    // ═══════════════════════════════════════════════════════════
    // PASO 4: Calcular comparación
    // ═══════════════════════════════════════════════════════════
    let comparison = null;

    const acotadoLabels: Record<string, string> = {
      alta_gerencia: 'Alta Gerencia',
      mandos_medios: 'Mandos Medios',
      profesionales: 'Profesionales',
      base_operativa: 'Base Operativa',
    }

    if (metricType === 'performance_rolefit') {
      // RoleFit: leer directo de PerformanceRating
      const where: any = {
        accountId: account.id,
        roleFitScore: { not: null },
        employee: { isActive: true },
      }

      // Filtrar por acotadoGroup si es JOB_LEVEL
      if (dimension === 'JOB_LEVEL' && segment !== 'ALL') {
        where.employee.acotadoGroup = segment
      }
      // Filtrar por standardCategory si es GLOBAL o COMBINATORIA
      if (standardCategory !== 'ALL') {
        where.employee.department = { standardCategory }
      }

      const myRatings = await prisma.performanceRating.findMany({
        where,
        select: { roleFitScore: true },
      })

      if (myRatings.length > 0) {
        const avgRoleFit = myRatings.reduce((s, r) => s + r.roleFitScore!, 0) / myRatings.length
        const entityName = dimension === 'JOB_LEVEL' && segment !== 'ALL'
          ? (acotadoLabels[segment] || segment)
          : standardCategory !== 'ALL'
          ? standardCategory
          : 'Mi empresa'
        comparison = calculateComparison(avgRoleFit, benchmark, entityName)
      }

    } else if (dimension === 'JOB_LEVEL' && segment !== 'ALL') {
      // EXO por JOB_LEVEL: comparar journeys con acotadoGroup
      const myJourneys = await prisma.journeyOrchestration.findMany({
        where: {
          department: { accountId: account.id },
          status: 'COMPLETED',
          exoScore: { not: null },
          stage1Participant: { acotadoGroup: segment },
        },
        select: { exoScore: true },
      })

      if (myJourneys.length > 0) {
        const avgExo = myJourneys.reduce((s, j) => s + j.exoScore!, 0) / myJourneys.length
        comparison = calculateComparison(avgExo, benchmark, acotadoLabels[segment] || segment)
      }

    } else if (departmentId) {
      // GLOBAL EXO: comparar por departamento
      const department = await prisma.department.findFirst({
        where: { id: departmentId, accountId: account.id },
        select: { id: true, displayName: true, accumulatedExoScore: true, accumulatedExoJourneys: true },
      })

      if (department?.accumulatedExoScore) {
        comparison = calculateComparison(department.accumulatedExoScore, benchmark, department.displayName)
      }
    }
    
    // ═══════════════════════════════════════════════════════════
    // PASO 5: Generar insights inteligentes
    // ═══════════════════════════════════════════════════════════
    let insights: InsightItem[] = [];
    
    if (includeInsights && comparison) {
      const context = InsightEngine.buildContext({
        metricType,
        entityName: comparison.entityName,
        entityType: 'department',
        entityScore: comparison.entityScore,
        benchmark: {
          avgScore: benchmark.avgScore,
          medianScore: benchmark.medianScore,
          percentile25: benchmark.percentile25,
          percentile75: benchmark.percentile75,
          percentile90: benchmark.percentile90,
          sampleSize: benchmark.sampleSize,
          companyCount: benchmark.companyCount,
          standardCategory: benchmark.standardCategory,
          country: benchmark.country,
          industry: benchmark.industry
        },
        specificityLevel
      });
      
      insights = InsightEngine.generateInsights(context);
    }
    
    // ═══════════════════════════════════════════════════════════
    // PASO 6: Formatear y retornar respuesta
    // ═══════════════════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      data: {
        benchmark: {
          metricType: benchmark.metricType,
          country: benchmark.country,
          industry: benchmark.industry,
          companySizeRange: benchmark.companySizeRange,
          category: benchmark.standardCategory,
          dimension: benchmark.dimension,
          segment: benchmark.segment,
          
          // Estadísticas
          avgScore: benchmark.avgScore,
          medianScore: benchmark.medianScore,
          percentiles: {
            p25: benchmark.percentile25,
            p50: benchmark.medianScore,
            p75: benchmark.percentile75,
            p90: benchmark.percentile90
          },
          stdDeviation: benchmark.stdDeviation,
          
          // Metadata
          sampleSize: benchmark.sampleSize,
          companyCount: benchmark.companyCount,
          period: benchmark.period,
          lastUpdated: benchmark.updatedAt,
          specificityLevel
        },
        comparison,
        insights
      }
    });
    
  } catch (error: any) {
    console.error('[API Benchmarks] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Buscar mejor benchmark disponible usando cascada de especificidad
 */
async function findBestBenchmark(criteria: {
  metricType: string;
  country: string;
  industry: string | null;
  companySize: string | null;
  standardCategory: string;
  dimension: string;
  segment: string;
}): Promise<{ benchmark: any | null; specificityLevel: 1 | 2 | 3 | 4 }> {

  const sizeRange = mapCompanySize(criteria.companySize);

  const queries = [
    // 1. Específico completo
    {
      level: 1 as const,
      where: {
        country: criteria.country,
        industry: criteria.industry || 'ALL',
        companySizeRange: sizeRange,
        standardCategory: criteria.standardCategory,
        dimension: criteria.dimension,
        segment: criteria.segment,
        metricType: criteria.metricType
      }
    },
    // 2. Sin tamaño empresa
    {
      level: 2 as const,
      where: {
        country: criteria.country,
        industry: criteria.industry || 'ALL',
        companySizeRange: 'ALL',
        standardCategory: criteria.standardCategory,
        dimension: criteria.dimension,
        segment: criteria.segment,
        metricType: criteria.metricType
      }
    },
    // 3. Sin industria
    {
      level: 3 as const,
      where: {
        country: criteria.country,
        industry: 'ALL',
        companySizeRange: 'ALL',
        standardCategory: criteria.standardCategory,
        dimension: criteria.dimension,
        segment: criteria.segment,
        metricType: criteria.metricType
      }
    },
    // 4. Global
    {
      level: 4 as const,
      where: {
        country: 'ALL',
        industry: 'ALL',
        companySizeRange: 'ALL',
        standardCategory: criteria.standardCategory,
        dimension: criteria.dimension,
        segment: criteria.segment,
        metricType: criteria.metricType
      }
    }
  ];
  
  for (const query of queries) {
    const benchmark = await prisma.marketBenchmark.findFirst({
      where: {
        ...query.where,
        isPublic: true
      },
      orderBy: { period: 'desc' }
    });
    
    if (benchmark) {
      return { benchmark, specificityLevel: query.level };
    }
  }
  
  return { benchmark: null, specificityLevel: 4 };
}

/**
 * Calcular comparación departamento vs benchmark
 */
function calculateComparison(
  deptScore: number,
  benchmark: any,
  departmentName: string
) {
  const difference = deptScore - benchmark.avgScore;
  const percentageGap = (difference / benchmark.avgScore) * 100;
  
  // Calcular percentil aproximado
  let percentileRank = 50;
  if (deptScore >= benchmark.percentile90) percentileRank = 95;
  else if (deptScore >= benchmark.percentile75) percentileRank = 85;
  else if (deptScore >= benchmark.medianScore) percentileRank = 65;
  else if (deptScore >= benchmark.percentile25) percentileRank = 35;
  else percentileRank = 15;
  
  // Determinar status
  let status: 'excellent' | 'above' | 'at' | 'below' | 'critical' = 'at';
  if (percentileRank >= 90) status = 'excellent';
  else if (difference > 5) status = 'above';
  else if (difference < -5 && percentileRank > 25) status = 'below';
  else if (percentileRank <= 25) status = 'critical';
  
  const message = generateComparisonMessage(
    difference,
    percentileRank,
    departmentName,
    benchmark.standardCategory,
    benchmark.country
  );
  
  return {
    entityName: departmentName,
    entityScore: deptScore,
    departmentName, // Backward compat
    departmentScore: deptScore, // Backward compat
    marketAverage: benchmark.avgScore,
    difference: Math.round(difference * 100) / 100,
    percentageGap: Math.round(percentageGap * 100) / 100,
    percentileRank,
    status,
    message
  };
}

/**
 * Generar mensaje interpretativo
 */
function generateComparisonMessage(
  difference: number,
  percentile: number,
  deptName: string,
  category: string,
  country: string
): string {
  const categoryLabel = category === 'ALL' ? 'del mercado' : category;
  const countryLabel = country === 'ALL' ? '' : ` en ${country}`;
  
  if (difference > 10) {
    return `🏆 Excelente: ${deptName} está en el percentil ${percentile}, superando significativamente al promedio ${categoryLabel}${countryLabel}`;
  }
  if (difference > 5) {
    return `✅ Bueno: ${deptName} está por sobre el promedio ${categoryLabel}${countryLabel}`;
  }
  if (difference > -5) {
    return `📊 En línea: ${deptName} está alineado con el promedio del mercado ${categoryLabel}${countryLabel}`;
  }
  if (difference > -10) {
    return `⚠️ Oportunidad: ${deptName} está bajo el promedio ${categoryLabel}${countryLabel}. Revisar estrategias de mejora.`;
  }
  return `🔴 Crítico: ${deptName} está significativamente bajo el promedio ${categoryLabel}${countryLabel}. Requiere intervención inmediata.`;
}

/**
 * Mapear companySize a rango estándar
 */
function mapCompanySize(size: string | null): string {
  if (!size) return 'ALL';
  
  const mapping: Record<string, string> = {
    'micro': '1-50',
    'pequeña': '51-200',
    'mediana': '201-1000',
    'grande': '1000+'
  };
  
  return mapping[size.toLowerCase()] || 'ALL';
}

/**
 * Obtener account desde request
 */
async function getAccountFromRequest(request: NextRequest): Promise<AccountContext | null> {
  const accountId = request.headers.get('x-account-id');
  
  if (!accountId) {
    console.error('[API Benchmarks] No x-account-id header');
    return null;
  }
  
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      country: true,
      industry: true,
      companySize: true
    }
  });
  
  if (!account) {
    console.error(`[API Benchmarks] Account ${accountId} not found`);
    return null;
  }
  
  return account;
}