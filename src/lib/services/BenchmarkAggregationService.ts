// src/lib/services/BenchmarkAggregationService.ts
// ============================================================================
// BENCHMARK AGGREGATION SERVICE - VERSIÓN CORREGIDA v2.0
// ============================================================================
// 
// CORRECCIONES IMPLEMENTADAS:
// ✅ Buckets con standardCategory='ALL' (empresa completa)
// ✅ Ponderación por empresa (no por departamento individual)
// ✅ Algoritmo correcto de agregación cross-categoría
//
// ============================================================================

import { prisma } from '@/lib/prisma';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

interface BenchmarkBucket {
  country: string;
  industry: string;
  companySizeRange: string;
  standardCategory: string;
  scores: number[];
  journeyCounts: number[]; // Para promedio ponderado por volumen
  accountIds: Set<string>; // Para privacy threshold (companyCount)
}

interface StatisticsResult {
  avgScore: number;
  medianScore: number;
  percentile25: number;
  percentile75: number;
  percentile90: number;
  stdDeviation: number;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export class BenchmarkAggregationService {
  
  /**
   * ═══════════════════════════════════════════════════════════════
   * MÉTODO PRINCIPAL - Ejecuta agregación mensual completa
   * ═══════════════════════════════════════════════════════════════
   * 
   * Llamado por: Cron job día 1 de cada mes (00:10 UTC)
   * Duración esperada: 10-30 segundos total
   * 
   * Fase 1 (HOY): Solo metricType="onboarding_exo", dimension="GLOBAL"
   * Fase 2 (FUTURO): Agregar exit_retention_risk, pulse_climate, etc.
   */
  static async runMonthlyAggregation(): Promise<void> {
    const now = new Date();
    
    // Calcular mes ANTERIOR (cron corre día 1, procesa mes que terminó)
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Último día mes anterior
    const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1); // Primer día mes anterior
    const period = `${periodEnd.getFullYear()}-${String(periodEnd.getMonth() + 1).padStart(2, '0')}`;
    
    console.log(`[Benchmark] 🚀 Iniciando agregación mensual v2.0`);
    console.log(`[Benchmark] 📅 Período: ${period} (${periodStart.toISOString().split('T')[0]} → ${periodEnd.toISOString().split('T')[0]})`);
    
    try {
      // ═══════════════════════════════════════════════════════════
      // FASE 1: ONBOARDING EXO SCORE (dimension="GLOBAL")
      // ═══════════════════════════════════════════════════════════
      await this.calculateOnboardingBenchmarks(periodStart, periodEnd, period);
      
      // ═══════════════════════════════════════════════════════════
      // FASE 2: OTROS PRODUCTOS (Agregar cuando estén listos)
      // ═══════════════════════════════════════════════════════════
      // await this.calculateExitRetentionBenchmarks(periodStart, periodEnd, period);
      // await this.calculatePulseClimateBenchmarks(periodStart, periodEnd, period);
      // await this.calculateDepartmentMetricsBenchmarks(periodStart, periodEnd, period);
      
      console.log(`[Benchmark] ✅ Agregación completada exitosamente`);
      
    } catch (error: any) {
      console.error(`[Benchmark] ❌ Error en agregación:`, error);
      throw error;
    }
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════
   * CÁLCULO ESPECÍFICO: ONBOARDING EXO SCORE
   * ═══════════════════════════════════════════════════════════════
   * 
   * Fuente de datos: Department.accumulatedExoScore (Gold Cache)
   * Actualización: Mensual (Cron Tarea B ya lo calcula)
   * 
   * CAMBIO CRÍTICO v2.0:
   * - Crea benchmarks POR CATEGORÍA (personas, operaciones, etc.)
   * - TAMBIÉN crea benchmarks ALL (empresa completa)
   * - Pondera correctamente por empresa, no por departamento
   * 
   * Privacy: Solo isPublic=true si companyCount >= 3
   */
  private static async calculateOnboardingBenchmarks(
    periodStart: Date,
    periodEnd: Date,
    period: string
  ): Promise<void> {
    
    console.log(`[Benchmark] 📊 Calculando benchmarks Onboarding EXO v2.0...`);
    
    // ═══════════════════════════════════════════════════════════
    // PASO 1: Query TODOS los departamentos con EXO acumulado
    // ═══════════════════════════════════════════════════════════
    const departments = await prisma.department.findMany({
      where: {
        isActive: true,
        accumulatedExoScore: { not: null },      // Tiene EXO calculado
        accumulatedExoJourneys: { gt: 0 },       // Tiene volumen
        standardCategory: { not: null }          // Tiene categoría mapeada
      },
      include: {
        account: {
          select: {
            id: true,
            country: true,
            industry: true,
            companySize: true
          }
        }
      }
    });
    
    console.log(`[Benchmark]   → ${departments.length} departamentos activos encontrados`);
    
    if (departments.length === 0) {
      console.log(`[Benchmark]   ⚠️ Sin datos suficientes para calcular benchmarks`);
      return;
    }
    
    // ═══════════════════════════════════════════════════════════
    // PASO 2A: BUCKETS POR CATEGORÍA ESPECÍFICA
    // ═══════════════════════════════════════════════════════════
    console.log(`[Benchmark] 📦 Generando buckets POR CATEGORÍA...`);
    
    const categoryBuckets = new Map<string, BenchmarkBucket>();
    
    for (const dept of departments) {
      const account = dept.account;
      
      // Validar datos requeridos
      if (!account.country || !dept.standardCategory) {
        console.log(`[Benchmark]   ⚠️ Skipping dept ${dept.id}: Missing country or category`);
        continue;
      }
      
      const industry = account.industry || 'ALL';
      const sizeRange = this.mapCompanySize(account.companySize);
      
      // Generar claves de bucket para múltiples niveles (POR CATEGORÍA)
      const bucketKeys = [
        // Nivel 1: Más específico (CL × Retail × 51-200 × Personas)
        `${account.country}|${industry}|${sizeRange}|${dept.standardCategory}`,
        
        // Nivel 2: Sin tamaño empresa (CL × Retail × ALL × Personas)
        `${account.country}|${industry}|ALL|${dept.standardCategory}`,
        
        // Nivel 3: Sin industria (CL × ALL × ALL × Personas)
        `${account.country}|ALL|ALL|${dept.standardCategory}`,
        
        // Nivel 4: Global categoría (ALL × ALL × ALL × Personas)
        `ALL|ALL|ALL|${dept.standardCategory}`,
      ];
      
      // Agregar departamento a todos los buckets aplicables
      for (const key of bucketKeys) {
        if (!categoryBuckets.has(key)) {
          const [country, ind, size, category] = key.split('|');
          categoryBuckets.set(key, {
            country,
            industry: ind,
            companySizeRange: size,
            standardCategory: category,
            scores: [],
            journeyCounts: [],
            accountIds: new Set()
          });
        }
        
        const bucket = categoryBuckets.get(key)!;
        bucket.scores.push(dept.accumulatedExoScore!);
        bucket.journeyCounts.push(dept.accumulatedExoJourneys!);
        bucket.accountIds.add(account.id);
      }
    }
    
    console.log(`[Benchmark]   → ${categoryBuckets.size} buckets por categoría generados`);
    
    // ═══════════════════════════════════════════════════════════
    // PASO 2B: BUCKETS CROSS-CATEGORÍA (ALL)
    // ═══════════════════════════════════════════════════════════
    // 🆕 NUEVO v2.0: Calcular benchmarks de empresa completa
    // Algoritmo correcto: Agrupar por empresa PRIMERO, luego promediar
    // ═══════════════════════════════════════════════════════════
    
    console.log(`[Benchmark] 📦 Generando buckets CROSS-CATEGORÍA (ALL)...`);
    
    // Paso 2B.1: Agrupar departamentos por empresa
    const empresas = new Map<string, typeof departments>();
    
    for (const dept of departments) {
      const accountId = dept.account.id;
      if (!empresas.has(accountId)) {
        empresas.set(accountId, []);
      }
      empresas.get(accountId)!.push(dept);
    }
    
    console.log(`[Benchmark]   → ${empresas.size} empresas únicas encontradas`);
    
    // Paso 2B.2: Calcular EXO global de cada empresa
    interface EmpresaGlobal {
      accountId: string;
      country: string;
      industry: string;
      companySize: string | null;
      globalExoScore: number;
      totalJourneys: number;
    }
    
    const empresasGlobales: EmpresaGlobal[] = [];
    
    empresas.forEach((depts, accountId) => {
      const account = depts[0].account; // Todos los depts tienen el mismo account
      
      // Calcular EXO global ponderado de esta empresa
      const totalWeightedScore = depts.reduce(
        (sum, d) => sum + (d.accumulatedExoScore! * d.accumulatedExoJourneys!),
        0
      );
      
      const totalJourneys = depts.reduce(
        (sum, d) => sum + d.accumulatedExoJourneys!,
        0
      );
      
      const globalExoScore = totalWeightedScore / totalJourneys;
      
      empresasGlobales.push({
        accountId,
        country: account.country,
        industry: account.industry || 'ALL',
        companySize: account.companySize,
        globalExoScore,
        totalJourneys
      });
    });
    
    console.log(`[Benchmark]   → ${empresasGlobales.length} EXO globales calculados`);
    
    // Paso 2B.3: Crear buckets ALL agrupando empresas completas
    const allBuckets = new Map<string, BenchmarkBucket>();
    
    for (const empresa of empresasGlobales) {
      const sizeRange = this.mapCompanySize(empresa.companySize);
      
      // Generar claves de bucket (SIN standardCategory específica)
      const bucketKeys = [
        // Nivel 1: CL × Retail × 51-200 × ALL
        `${empresa.country}|${empresa.industry}|${sizeRange}|ALL`,
        
        // Nivel 2: CL × Retail × ALL × ALL
        `${empresa.country}|${empresa.industry}|ALL|ALL`,
        
        // Nivel 3: CL × ALL × ALL × ALL
        `${empresa.country}|ALL|ALL|ALL`,
        
        // Nivel 4: ALL × ALL × ALL × ALL
        `ALL|ALL|ALL|ALL`,
      ];
      
      for (const key of bucketKeys) {
        if (!allBuckets.has(key)) {
          const [country, ind, size] = key.split('|');
          allBuckets.set(key, {
            country,
            industry: ind,
            companySizeRange: size,
            standardCategory: 'ALL', // ← CLAVE: Todas las categorías
            scores: [],
            journeyCounts: [],
            accountIds: new Set()
          });
        }
        
        const bucket = allBuckets.get(key)!;
        bucket.scores.push(empresa.globalExoScore); // ← Score global de la empresa
        bucket.journeyCounts.push(empresa.totalJourneys);
        bucket.accountIds.add(empresa.accountId);
      }
    }
    
    console.log(`[Benchmark]   → ${allBuckets.size} buckets cross-categoría (ALL) generados`);
    
    // ═══════════════════════════════════════════════════════════
    // PASO 3: Calcular estadísticas y guardar TODOS los buckets
    // ═══════════════════════════════════════════════════════════
    
    const allBucketsToSave = new Map([...categoryBuckets, ...allBuckets]);
    console.log(`[Benchmark] 💾 Total buckets a guardar: ${allBucketsToSave.size}`);
    
    let savedCount = 0;
    let skippedPrivacy = 0;
    
    for (const [key, bucket] of allBucketsToSave.entries()) {
      const companyCount = bucket.accountIds.size;
      const isPublic = companyCount >= 3; // Privacy threshold
      
      if (!isPublic) {
        skippedPrivacy++;
      }
      
      // Calcular estadísticas robustas
      const stats = this.calculateStatistics(bucket.scores, bucket.journeyCounts);
      
      // Upsert benchmark (idempotente)
      await prisma.marketBenchmark.upsert({
        where: {
          unique_market_benchmark: {
            country: bucket.country,
            industry: bucket.industry,
            companySizeRange: bucket.companySizeRange,
            standardCategory: bucket.standardCategory,
            dimension: 'GLOBAL',
            segment: 'ALL',
            metricType: 'onboarding_exo',
            period
          }
        },
        create: {
          country: bucket.country,
          industry: bucket.industry,
          companySizeRange: bucket.companySizeRange,
          standardCategory: bucket.standardCategory,
          dimension: 'GLOBAL',
          segment: 'ALL',
          metricType: 'onboarding_exo',
          metricSource: 'journey_orchestration',
          periodType: 'monthly',
          periodStart,
          periodEnd,
          period,
          ...stats,
          sampleSize: bucket.scores.length,
          companyCount,
          isPublic
        },
        update: {
          ...stats,
          sampleSize: bucket.scores.length,
          companyCount,
          isPublic,
          updatedAt: new Date()
        }
      });
      
      savedCount++;
    }
    
    console.log(`[Benchmark]   ✅ ${savedCount} benchmarks guardados`);
    console.log(`[Benchmark]   🔒 ${skippedPrivacy} benchmarks privados (companyCount < 3)`);
    
    // Resumen por tipo
    const categoryCount = categoryBuckets.size;
    const allCount = allBuckets.size;
    console.log(`[Benchmark]   📊 Desglose: ${categoryCount} por categoría + ${allCount} cross-categoría (ALL)`);
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════
   * CÁLCULO ESTADÍSTICAS - Algoritmo Robusto
   * ═══════════════════════════════════════════════════════════════
   * 
   * Calcula:
   *   - Promedio ponderado por volumen (journeys)
   *   - Mediana (P50) - más confiable que promedio
   *   - Percentiles P25, P75, P90
   *   - Desviación estándar
   * 
   * Metodología estadística enterprise-grade
   */
  private static calculateStatistics(
    scores: number[],
    weights: number[] // journeyCounts para ponderar
  ): StatisticsResult {
    
    if (scores.length === 0) {
      return {
        avgScore: 0,
        medianScore: 0,
        percentile25: 0,
        percentile75: 0,
        percentile90: 0,
        stdDeviation: 0
      };
    }
    
    // ═══════════════════════════════════════════════════════════
    // PROMEDIO PONDERADO (weighted average)
    // ═══════════════════════════════════════════════════════════
    // Ejemplo:
    //   Dept A: EXO 80, 100 journeys → peso 100
    //   Dept B: EXO 60, 10 journeys  → peso 10
    //   Promedio ponderado = (80*100 + 60*10) / (100+10) = 78.18
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightedSum = scores.reduce((sum, score, i) => sum + (score * weights[i]), 0);
    const avgScore = weightedSum / totalWeight;
    
    // ═══════════════════════════════════════════════════════════
    // PERCENTILES (ordenamiento ascendente)
    // ═══════════════════════════════════════════════════════════
    const sorted = [...scores].sort((a, b) => a - b);
    const n = sorted.length;
    
    const percentile = (p: number): number => {
      const index = Math.ceil(n * p) - 1;
      return sorted[Math.max(0, Math.min(index, n - 1))];
    };
    
    const medianScore = percentile(0.50);   // P50
    const percentile25 = percentile(0.25);  // P25 - Bottom quarter
    const percentile75 = percentile(0.75);  // P75 - Top quarter
    const percentile90 = percentile(0.90);  // P90 - Top 10%
    
    // ═══════════════════════════════════════════════════════════
    // DESVIACIÓN ESTÁNDAR (dispersión de los datos)
    // ═══════════════════════════════════════════════════════════
    const variance = scores.reduce((sum, score) => {
      return sum + Math.pow(score - avgScore, 2);
    }, 0) / n;
    
    const stdDeviation = Math.sqrt(variance);
    
    // Redondear a 2 decimales
    return {
      avgScore: Math.round(avgScore * 100) / 100,
      medianScore: Math.round(medianScore * 100) / 100,
      percentile25: Math.round(percentile25 * 100) / 100,
      percentile75: Math.round(percentile75 * 100) / 100,
      percentile90: Math.round(percentile90 * 100) / 100,
      stdDeviation: Math.round(stdDeviation * 100) / 100
    };
  }
  
  /**
   * ═══════════════════════════════════════════════════════════════
   * MAPEO: companySize → companySizeRange
   * ═══════════════════════════════════════════════════════════════
   * 
   * Convierte valores textuales a rangos estándar benchmark
   */
  private static mapCompanySize(size: string | null): string {
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
   * ═══════════════════════════════════════════════════════════════
   * MÉTODO FUTURO: EXIT RETENTION RISK (Ejemplo para expandir)
   * ═══════════════════════════════════════════════════════════════
   * 
   * Descomenta cuando Exit Intelligence esté listo
   */
  /*
  private static async calculateExitRetentionBenchmarks(
    periodStart: Date,
    periodEnd: Date,
    period: string
  ): Promise<void> {
    
    console.log(`[Benchmark] 📊 Calculando benchmarks Exit Retention...`);
    
    // Query departamentos con retentionRisk acumulado
    const departments = await prisma.department.findMany({
      where: {
        isActive: true,
        accumulatedRetentionRisk: { not: null },
        standardCategory: { not: null }
      },
      include: {
        account: {
          select: { id: true, country: true, industry: true, companySize: true }
        }
      }
    });
    
    // Mismo flujo: Buckets → Estadísticas → Guardar
    // metricType="exit_retention_risk"
    // metricSource="exit_survey"
  }
  */
}