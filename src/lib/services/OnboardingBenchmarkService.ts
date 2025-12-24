/**
 * @deprecated SERVICIO OBSOLETO - Usar /api/benchmarks en su lugar
 * 
 * RAZÓN DE DEPRECACIÓN:
 * - Duplica funcionalidad de BenchmarkAggregationService + /api/benchmarks
 * - Calcula benchmarks en TIEMPO REAL (ineficiente) vs usar MarketBenchmark pre-calculado
 * - La métrica "Completion Rate" que calcula NO está guardada en BD (volátil)
 * - El componente BenchmarkComparisonCard.tsx que lo consume NO está en producción
 * 
 * MIGRACIÓN:
 * - Hook: usar useBenchmark() de @/hooks/useBenchmark
 * - API: GET /api/benchmarks?metricType=onboarding_exo&standardCategory=X&departmentId=Y
 * - Tipos: importar desde @/types/benchmark
 * 
 * FECHA DEPRECACIÓN: Diciembre 2025
 * ELIMINACIÓN PLANIFICADA: Marzo 2026
 * 
 * @see /api/benchmarks - API correcta con InsightEngine
 * @see BenchmarkAggregationService - CRON mensual que alimenta MarketBenchmark
 */

import { prisma } from '@/lib/prisma';

// ============================================
// INTERFACES
// ============================================

interface Percentiles {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

interface BenchmarkData {
  category: string;
  country: string;
  sampleSize: number;
  
  // EXO Score
  avgEXOScore: number;
  exoPercentiles: Percentiles;
  
  // Tasa Completitud
  avgCompletionRate: number;
  completionPercentiles: Percentiles;
  
  lastUpdated: Date;
}

interface ComparisonResult {
  exoDifference: number;
  exoPercentageGap: number;
  exoPercentileRank: number;
  
  completionRateDifference: number;
  completionPercentileRank: number;
  
  overallStatus: 'above' | 'at' | 'below';
  statusMessage: string;
}

interface InsightItem {
  type: 'positive' | 'neutral' | 'improvement';
  title: string;
  description: string;
  priority: number;
}

export interface BenchmarkResponse {
  department: {
    id: string;
    name: string;
    category: string;
    country: string;
    exoScore: number;
    journeyCount: number;
  };
  benchmark: BenchmarkData;
  comparison: ComparisonResult;
  insights: InsightItem[];
}

// ============================================
// SERVICIO PRINCIPAL
// ============================================

export class OnboardingBenchmarkService {
  
  /**
   * OBTENER BENCHMARK COMPLETO PARA UN DEPARTAMENTO
   */
  static async getDepartmentBenchmark(
    departmentId: string,
    country: string = 'CL'
  ): Promise<BenchmarkResponse> {
    
    console.log(`[Benchmark] Iniciando cálculo para departmentId: ${departmentId}, country: ${country}`);
    
    // 1. Obtener departamento con su score acumulado
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: {
        id: true,
        displayName: true,
        standardCategory: true,
        accumulatedExoScore: true,
        accumulatedExoJourneys: true,
        account: {
          select: {
            id: true,
            country: true,
            companyName: true
          }
        }
      }
    });
    
    if (!department) {
      throw new Error('Departamento no encontrado');
    }
    
    if (!department.standardCategory) {
      throw new Error('Departamento sin standardCategory asignado. Contacte al administrador.');
    }
    
    if (!department.accumulatedExoScore) {
      throw new Error('Departamento sin datos acumulados disponibles. Se requieren al menos 30 días de data.');
    }
    
    // 2. Calcular benchmark de la categoría
    const benchmark = await this.calculateCategoryBenchmark(
      department.standardCategory,
      country
    );
    
    // 3. Calcular tasa completitud del departamento
    const deptCompletionRate = await this.getDepartmentCompletionRate(departmentId);
    
    // 4. Calcular comparación
    const comparison = this.calculateComparison(
      {
        exoScore: department.accumulatedExoScore,
        completionRate: deptCompletionRate
      },
      benchmark
    );
    
    // 5. Generar insights inteligentes
    const insights = this.generateInsights(department, benchmark, comparison);
    
    console.log(`[Benchmark] ✅ Cálculo completado exitosamente`);
    
    return {
      department: {
        id: department.id,
        name: department.displayName,
        category: department.standardCategory,
        country: department.account.country,
        exoScore: department.accumulatedExoScore,
        journeyCount: department.accumulatedExoJourneys || 0
      },
      benchmark,
      comparison,
      insights
    };
  }
  
  /**
   * CALCULAR BENCHMARK CATEGORÍA + PAÍS
   * 
   * Query cross-cliente para obtener promedios de mercado
   */
  static async calculateCategoryBenchmark(
    standardCategory: string,
    country: string = 'CL'
  ): Promise<BenchmarkData> {
    
    console.log(`[Benchmark] Calculando para category: ${standardCategory}, country: ${country}`);
    
    // 1. Obtener todos los departamentos de esa categoría + país
    const departments = await prisma.department.findMany({
      where: {
        standardCategory,
        accumulatedExoScore: { not: null },
        isActive: true,
        account: {
          country: country === 'ALL' ? undefined : country
        }
      },
      select: {
        id: true,
        accumulatedExoScore: true,
        accumulatedExoJourneys: true
      }
    });
    
    if (departments.length === 0) {
      throw new Error(
        `No hay datos disponibles para categoría "${standardCategory}" en país ${country}. ` +
        `Se requieren al menos 5 departamentos con data.`
      );
    }
    
    if (departments.length < 5) {
      console.warn(`[Benchmark] ⚠️ Sample size bajo: ${departments.length} departamentos`);
    }
    
    console.log(`[Benchmark] Encontrados ${departments.length} departamentos`);
    
    // 2. Calcular EXO Score promedio ponderado por volumen
    const totalWeightedEXO = departments.reduce(
      (sum, dept) => sum + (dept.accumulatedExoScore! * dept.accumulatedExoJourneys!),
      0
    );
    
    const totalJourneys = departments.reduce(
      (sum, dept) => sum + dept.accumulatedExoJourneys!,
      0
    );
    
    const avgEXOScore = parseFloat((totalWeightedEXO / totalJourneys).toFixed(1));
    
    // 3. Calcular percentiles EXO
    const exoScores = departments
      .map(d => d.accumulatedExoScore!)
      .sort((a, b) => a - b);
    
    const exoPercentiles = this.calculatePercentiles(exoScores);
    
    // 4. Calcular tasa completitud promedio
    const departmentIds = departments.map(d => d.id);
    
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const journeys = await prisma.journeyOrchestration.findMany({
      where: {
        departmentId: { in: departmentIds },
        createdAt: { gte: twelveMonthsAgo },
        status: { in: ['active', 'completed'] }
      },
      select: {
        id: true,
        departmentId: true,
        currentStage: true
      }
    });
    
    console.log(`[Benchmark] Analizando ${journeys.length} journeys para tasa completitud`);
    
    // 5. Calcular tasa completitud (stage 4 = completado)
    const completedJourneys = journeys.filter(j => j.currentStage === 4).length;
    const avgCompletionRate = journeys.length > 0
      ? parseFloat(((completedJourneys / journeys.length) * 100).toFixed(1))
      : 0;
    
    // Para percentiles, calcular por departamento
    const completionRatesByDept = departmentIds.map(deptId => {
      const deptJourneys = journeys.filter(j => j.departmentId === deptId);
      const deptCompleted = deptJourneys.filter(j => j.currentStage === 4).length;
      return deptJourneys.length > 0 ? (deptCompleted / deptJourneys.length) * 100 : 0;
    });
    
    const completionPercentiles = this.calculatePercentiles(
      completionRatesByDept.sort((a, b) => a - b)
    );
    
    console.log(`[Benchmark] ✅ Benchmark calculado: EXO ${avgEXOScore}, Completitud ${avgCompletionRate}%`);
    
    return {
      category: standardCategory,
      country,
      sampleSize: departments.length,
      avgEXOScore,
      exoPercentiles,
      avgCompletionRate,
      completionPercentiles,
      lastUpdated: new Date()
    };
  }
  
  /**
   * OBTENER TASA COMPLETITUD DE UN DEPARTAMENTO
   */
  private static async getDepartmentCompletionRate(departmentId: string): Promise<number> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const journeys = await prisma.journeyOrchestration.findMany({
      where: {
        departmentId,
        createdAt: { gte: twelveMonthsAgo },
        status: { in: ['active', 'completed'] }
      },
      select: {
        currentStage: true
      }
    });
    
    if (journeys.length === 0) return 0;
    
    const completed = journeys.filter(j => j.currentStage === 4).length;
    return parseFloat(((completed / journeys.length) * 100).toFixed(1));
  }
  
  /**
   * CALCULAR COMPARACIÓN VS BENCHMARK
   */
  private static calculateComparison(
    departmentData: {
      exoScore: number;
      completionRate: number;
    },
    benchmark: BenchmarkData
  ): ComparisonResult {
    
    // EXO Score
    const exoDifference = parseFloat((departmentData.exoScore - benchmark.avgEXOScore).toFixed(1));
    const exoPercentageGap = parseFloat(((exoDifference / benchmark.avgEXOScore) * 100).toFixed(1));
    const exoPercentileRank = this.calculatePercentileRank(
      departmentData.exoScore,
      benchmark.exoPercentiles
    );
    
    // Tasa Completitud
    const completionRateDifference = parseFloat(
      (departmentData.completionRate - benchmark.avgCompletionRate).toFixed(1)
    );
    const completionPercentileRank = this.calculatePercentileRank(
      departmentData.completionRate,
      benchmark.completionPercentiles
    );
    
    // Estado general
    let overallStatus: 'above' | 'at' | 'below';
    if (exoDifference > 5) overallStatus = 'above';
    else if (exoDifference < -5) overallStatus = 'below';
    else overallStatus = 'at';
    
    // Mensaje de estado
    let statusMessage = '';
    if (overallStatus === 'above') {
      statusMessage = `Tu departamento supera al promedio ${benchmark.category} en ${exoPercentageGap > 0 ? '+' : ''}${exoPercentageGap}%`;
    } else if (overallStatus === 'below') {
      statusMessage = `Tu departamento está ${Math.abs(exoPercentageGap)}% bajo el promedio ${benchmark.category}`;
    } else {
      statusMessage = `Tu departamento está alineado con el promedio ${benchmark.category}`;
    }
    
    return {
      exoDifference,
      exoPercentageGap,
      exoPercentileRank,
      completionRateDifference,
      completionPercentileRank,
      overallStatus,
      statusMessage
    };
  }
  
  /**
   * GENERAR INSIGHTS INTELIGENTES
   */
  private static generateInsights(
    department: any,
    benchmark: BenchmarkData,
    comparison: ComparisonResult
  ): InsightItem[] {
    
    const insights: InsightItem[] = [];
    
    // Insight 1: Posición competitiva
    if (comparison.overallStatus === 'above') {
      insights.push({
        type: 'positive',
        title: `Top ${100 - comparison.exoPercentileRank}% en ${benchmark.category}`,
        description: `Tu departamento supera al ${comparison.exoPercentileRank}% de departamentos similares en ${benchmark.country}. Esto indica prácticas de onboarding superiores al mercado.`,
        priority: 10
      });
    } else if (comparison.overallStatus === 'below') {
      insights.push({
        type: 'improvement',
        title: 'Oportunidad de mejora identificada',
        description: `Hay ${Math.abs(comparison.exoDifference).toFixed(1)} puntos de brecha vs. benchmark. Revisar mejores prácticas del sector puede acelerar resultados.`,
        priority: 10
      });
    }
    
    // Insight 2: Tasa completitud
    if (comparison.completionRateDifference > 10) {
      insights.push({
        type: 'positive',
        title: 'Excelente tasa de completitud',
        description: `Tu tasa de completitud está ${comparison.completionRateDifference.toFixed(1)}% sobre el promedio, indicando alto compromiso en el proceso.`,
        priority: 8
      });
    } else if (comparison.completionRateDifference < -10) {
      insights.push({
        type: 'improvement',
        title: 'Optimizar completitud',
        description: `La tasa de completitud está ${Math.abs(comparison.completionRateDifference).toFixed(1)}% bajo el promedio. Considera revisar longitud del proceso o recordatorios.`,
        priority: 9
      });
    }
    
    // Insight 3: Contexto de comparación
    insights.push({
      type: 'neutral',
      title: 'Contexto de comparación',
      description: `Este benchmark se basa en ${benchmark.sampleSize} departamentos de categoría "${benchmark.category}" en ${benchmark.country}, con datos actualizados a ${new Date(benchmark.lastUpdated).toLocaleDateString('es-CL')}.`,
      priority: 5
    });
    
    // Insight 4: Sample size warning
    if (benchmark.sampleSize < 10) {
      insights.push({
        type: 'neutral',
        title: 'Sample size en crecimiento',
        description: `El benchmark actual se basa en ${benchmark.sampleSize} departamentos. A medida que más empresas usen FocalizaHR, la precisión del benchmark mejorará.`,
        priority: 3
      });
    }
    
    return insights.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * CALCULAR PERCENTILES DE UN ARRAY
   */
  private static calculatePercentiles(sortedScores: number[]): Percentiles {
    if (sortedScores.length === 0) {
      return { p25: 0, p50: 0, p75: 0, p90: 0 };
    }
    
    const getPercentile = (p: number): number => {
      const index = Math.ceil((p / 100) * sortedScores.length) - 1;
      return parseFloat(sortedScores[Math.max(0, index)].toFixed(1));
    };
    
    return {
      p25: getPercentile(25),
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90)
    };
  }
  
  /**
   * CALCULAR PERCENTILE RANK DE UN SCORE
   */
  private static calculatePercentileRank(
    score: number,
    percentiles: Percentiles
  ): number {
    if (score >= percentiles.p90) return 95;
    if (score >= percentiles.p75) return 82;
    if (score >= percentiles.p50) return 62;
    if (score >= percentiles.p25) return 37;
    return 15;
  }
}