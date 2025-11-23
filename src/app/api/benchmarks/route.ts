// src/app/api/benchmarks/route.ts
// ============================================================================
// API BENCHMARKS - Consulta de Benchmarks de Mercado
// ============================================================================
//
// Endpoint: GET /api/benchmarks
// Autenticación: JWT (accountId extraído del token)
// Rate limit: Standard
//
// Query params:
//   - metricType: string (requerido) - "onboarding_exo", "exit_retention_risk"
//   - standardCategory: string (requerido) - "personas", "tecnologia", etc.
//   - dimension: string (opcional, default "GLOBAL")
//   - departmentId: string (opcional) - Para calcular comparación
//   - country: string (opcional) - Sobrescribe country del account
//
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TIPO HELPER: Account mínimo para lógica
interface AccountContext {
  id: string;
  country: string;
  industry: string | null;
  companySize: string | null;
}

export async function GET(request: NextRequest) {
  try {
    // ═══════════════════════════════════════════════════════════
    // PASO 1: Autenticación (adaptar a tu sistema de auth)
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
    const departmentId = searchParams.get('departmentId') || undefined;
    const country = searchParams.get('country') || account.country;
    
    // Validación básica
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
    const benchmark = await findBestBenchmark({
      metricType,
      country,
      industry: account.industry,
      companySize: account.companySize,
      standardCategory,
      dimension
    });
    
    if (!benchmark) {
      return NextResponse.json({
        success: false,
        message: 'Benchmark no disponible aún. Se requiere más data del mercado para esta combinación.'
      });
    }
    
    // ═══════════════════════════════════════════════════════════
    // PASO 4: Calcular comparación (si viene departmentId)
    // ═══════════════════════════════════════════════════════════
    let comparison = null;
    
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          accountId: account.id // Security: Multi-tenant
        },
        select: { 
          id: true,
          displayName: true,
          accumulatedExoScore: true,
          accumulatedExoJourneys: true 
        }
      });
      
      if (department?.accumulatedExoScore) {
        comparison = calculateComparison(
          department.accumulatedExoScore,
          benchmark,
          department.displayName
        );
      }
    }
    
    // ═══════════════════════════════════════════════════════════
    // PASO 5: Formatear y retornar respuesta
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
          lastUpdated: benchmark.updatedAt
        },
        comparison
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
 * 
 * Cascada:
 *   1. CL × Retail × 51-200 × Personas (más específico)
 *   2. CL × Retail × ALL    × Personas
 *   3. CL × ALL    × ALL    × Personas
 *   4. ALL × ALL   × ALL    × Personas (más general)
 */
async function findBestBenchmark(criteria: {
  metricType: string;
  country: string;
  industry: string | null;
  companySize: string | null;
  standardCategory: string;
  dimension: string;
}) {
  
  const sizeRange = mapCompanySize(criteria.companySize);
  
  // Queries en orden de especificidad decreciente
  const queries = [
    // 1. Específico completo
    {
      country: criteria.country,
      industry: criteria.industry || 'ALL',
      companySizeRange: sizeRange,
      standardCategory: criteria.standardCategory,
      dimension: criteria.dimension,
      metricType: criteria.metricType
    },
    // 2. Sin tamaño empresa
    {
      country: criteria.country,
      industry: criteria.industry || 'ALL',
      companySizeRange: 'ALL',
      standardCategory: criteria.standardCategory,
      dimension: criteria.dimension,
      metricType: criteria.metricType
    },
    // 3. Sin industria
    {
      country: criteria.country,
      industry: 'ALL',
      companySizeRange: 'ALL',
      standardCategory: criteria.standardCategory,
      dimension: criteria.dimension,
      metricType: criteria.metricType
    },
    // 4. Global (solo categoría)
    {
      country: 'ALL',
      industry: 'ALL',
      companySizeRange: 'ALL',
      standardCategory: criteria.standardCategory,
      dimension: criteria.dimension,
      metricType: criteria.metricType
    }
  ];
  
  // Intentar cada query hasta encontrar benchmark público
  for (const query of queries) {
    const benchmark = await prisma.marketBenchmark.findFirst({
      where: {
        ...query,
        isPublic: true // Solo benchmarks públicos (companyCount >= 3)
      },
      orderBy: { period: 'desc' } // Más reciente primero
    });
    
    if (benchmark) {
      return benchmark;
    }
  }
  
  return null;
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
  
  // Calcular percentil aproximado del departamento
  let percentileRank = 50;
  
  if (deptScore >= benchmark.percentile90) {
    percentileRank = 95; // Top 5%
  } else if (deptScore >= benchmark.percentile75) {
    percentileRank = 85; // Entre P75 y P90
  } else if (deptScore >= benchmark.medianScore) {
    percentileRank = 65; // Entre P50 y P75
  } else if (deptScore >= benchmark.percentile25) {
    percentileRank = 35; // Entre P25 y P50
  } else {
    percentileRank = 15; // Bottom 25%
  }
  
  // Determinar status
  let status: 'above' | 'at' | 'below' = 'at';
  if (difference > 5) status = 'above';
  else if (difference < -5) status = 'below';
  
  // Generar mensaje contextual
  const message = generateComparisonMessage(
    difference,
    percentileRank,
    departmentName,
    benchmark.standardCategory,
    benchmark.country
  );
  
  return {
    departmentName,
    departmentScore: deptScore,
    marketAverage: benchmark.avgScore,
    difference: Math.round(difference * 100) / 100,
    percentageGap: Math.round(percentageGap * 100) / 100,
    percentileRank,
    status,
    message
  };
}

/**
 * Generar mensaje interpretativo de la comparación
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
 * Usa el sistema de autenticación existente de FocalizaHR
 */
async function getAccountFromRequest(request: NextRequest): Promise<AccountContext | null> {
  // ═══════════════════════════════════════════════════════════
  // SISTEMA AUTH FOCALIZAHR:
  // 1. Middleware global verifica JWT en cookie "focalizahr_token"
  // 2. Middleware inyecta header "x-account-id" en el request
  // 3. Leemos ese header aquí
  // ═══════════════════════════════════════════════════════════
  
  const accountId = request.headers.get('x-account-id');
  
  if (!accountId) {
    console.error('[API Benchmarks] No x-account-id header (middleware issue?)');
    return null;
  }
  
  // Buscar account en DB
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
    console.error(`[API Benchmarks] Account ${accountId} not found in DB`);
    return null;
  }
  
  return account;
}

// ============================================================================
// EJEMPLOS DE USO
// ============================================================================
//
// 1. Benchmark general (sin comparación departamental):
//    GET /api/benchmarks?metricType=onboarding_exo&standardCategory=personas
//
// 2. Benchmark con comparación específica:
//    GET /api/benchmarks?metricType=onboarding_exo&standardCategory=personas&departmentId=dept_123
//
// 3. Benchmark país específico:
//    GET /api/benchmarks?metricType=onboarding_exo&standardCategory=personas&country=MX
//
// 4. Benchmark demográfico futuro:
//    GET /api/benchmarks?metricType=onboarding_exo&standardCategory=personas&dimension=GENDER
//
// ============================================================================