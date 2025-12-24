// ============================================================================
// INSIGHT ENGINE - Motor de Insights Inteligentes para Benchmarks
// src/lib/services/InsightEngine.ts
// ============================================================================
//
// Motor de reglas configurables que genera insights contextuales
// basados en la comparación del score vs benchmark de mercado.
//
// CARACTERÍSTICAS:
// - Reglas universales (aplican a todos los productos)
// - Reglas específicas por metricType (onboarding_exo, exit_retention_risk, nps_score)
// - Priorización automática de insights
// - Acciones recomendadas
// - Extensible para nuevos productos
//
// ============================================================================

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Item de insight generado
 */
export interface InsightItem {
  type: 'positive' | 'neutral' | 'improvement' | 'critical';
  title: string;
  description: string;
  priority: number;      // 1-10 (mayor = más importante)
  action?: string | null; // Recomendación accionable
}

/**
 * Contexto para evaluación de reglas
 */
export interface InsightContext {
  // Identificación
  metricType: string;
  entityName: string;
  entityType: 'department' | 'company' | 'team';
  
  // Scores
  entityScore: number;
  benchmarkAvg: number;
  benchmarkMedian: number;
  
  // Comparación calculada
  difference: number;        // entityScore - benchmarkAvg
  percentageGap: number;     // (difference / benchmarkAvg) * 100
  percentileRank: number;    // 15, 35, 65, 85, 95
  status: 'excellent' | 'above' | 'at' | 'below' | 'critical';
  
  // Metadata benchmark
  sampleSize: number;
  companyCount: number;
  category: string;          // standardCategory usado
  country: string;
  industry: string;
  
  // Nivel de especificidad alcanzado en cascada
  specificityLevel: 1 | 2 | 3 | 4;
}

/**
 * Regla de insight
 */
interface InsightRule {
  id: string;
  metricTypes: string[];  // ['*'] = todos, ['onboarding_exo'] = específico
  condition: (ctx: InsightContext) => boolean;
  generate: (ctx: InsightContext) => InsightItem;
  priority: number;       // Para ordenar reglas (mayor = evaluar primero)
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtener label legible para categoría
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'personas': 'Gestión de Personas',
    'comercial': 'Área Comercial',
    'marketing': 'Marketing',
    'tecnologia': 'Tecnología',
    'operaciones': 'Operaciones',
    'finanzas': 'Finanzas',
    'servicio': 'Servicio al Cliente',
    'legal': 'Legal y Compliance',
    'ALL': 'todas las áreas'
  };
  return labels[category] || category;
}

/**
 * Obtener label legible para país
 */
function getCountryLabel(country: string): string {
  const labels: Record<string, string> = {
    'CL': 'Chile',
    'AR': 'Argentina',
    'MX': 'México',
    'BR': 'Brasil',
    'CO': 'Colombia',
    'PE': 'Perú',
    'ALL': 'Latinoamérica'
  };
  return labels[country] || country;
}

/**
 * Formatear número con signo
 */
function formatWithSign(num: number): string {
  return num > 0 ? `+${num.toFixed(1)}` : num.toFixed(1);
}

// ============================================================================
// REGLAS DE INSIGHTS
// ============================================================================

const INSIGHT_RULES: InsightRule[] = [
  
  // ═══════════════════════════════════════════════════════════════════════════
  // REGLAS UNIVERSALES (aplican a todos los metricTypes)
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    id: 'universal_top_performer',
    metricTypes: ['*'],
    condition: (ctx) => ctx.percentileRank >= 90,
    generate: (ctx) => ({
      type: 'positive',
      title: `Top ${100 - ctx.percentileRank}% en ${getCategoryLabel(ctx.category)}`,
      description: `${ctx.entityName} supera al ${ctx.percentileRank}% de organizaciones similares en ${getCountryLabel(ctx.country)}.`,
      priority: 10,
      action: 'Documentar mejores prácticas para replicar en otras áreas'
    }),
    priority: 100
  },
  
  {
    id: 'universal_above_average',
    metricTypes: ['*'],
    condition: (ctx) => ctx.status === 'above' && ctx.percentileRank < 90,
    generate: (ctx) => ({
      type: 'positive',
      title: 'Por encima del promedio de mercado',
      description: `${formatWithSign(ctx.percentageGap)}% sobre el benchmark de ${getCategoryLabel(ctx.category)}.`,
      priority: 8,
      action: null
    }),
    priority: 90
  },
  
  {
    id: 'universal_aligned',
    metricTypes: ['*'],
    condition: (ctx) => ctx.status === 'at',
    generate: (ctx) => ({
      type: 'neutral',
      title: 'Alineado con el mercado',
      description: `${ctx.entityName} está en línea con el promedio de ${getCategoryLabel(ctx.category)} en ${getCountryLabel(ctx.country)}.`,
      priority: 5,
      action: 'Identificar quick-wins para diferenciarse del promedio'
    }),
    priority: 70
  },
  
  {
    id: 'universal_below_average',
    metricTypes: ['*'],
    condition: (ctx) => ctx.status === 'below' && ctx.percentileRank > 25,
    generate: (ctx) => ({
      type: 'improvement',
      title: 'Oportunidad de mejora identificada',
      description: `Hay ${Math.abs(ctx.difference).toFixed(1)} puntos de brecha vs el benchmark de mercado.`,
      priority: 9,
      action: 'Revisar mejores prácticas del sector para cerrar brecha'
    }),
    priority: 85
  },
  
  {
    id: 'universal_critical',
    metricTypes: ['*'],
    condition: (ctx) => ctx.percentileRank <= 25,
    generate: (ctx) => ({
      type: 'critical',
      title: 'Atención requerida - Cuartil inferior',
      description: `${ctx.entityName} está en el ${ctx.percentileRank}% inferior del mercado. Intervención prioritaria recomendada.`,
      priority: 10,
      action: 'Agendar revisión estratégica urgente'
    }),
    priority: 95
  },
  
  {
    id: 'universal_sample_size_warning',
    metricTypes: ['*'],
    condition: (ctx) => ctx.sampleSize < 10,
    generate: (ctx) => ({
      type: 'neutral',
      title: 'Benchmark en crecimiento',
      description: `Comparación basada en ${ctx.sampleSize} organizaciones de ${getCategoryLabel(ctx.category)}. La precisión mejorará con más datos.`,
      priority: 3,
      action: null
    }),
    priority: 20
  },
  
  {
    id: 'universal_specificity_fallback',
    metricTypes: ['*'],
    condition: (ctx) => ctx.specificityLevel >= 3,
    generate: (ctx) => ({
      type: 'neutral',
      title: 'Comparación general',
      description: `Benchmark a nivel ${ctx.specificityLevel === 4 ? 'global' : 'país'} por muestra limitada en tu segmento específico.`,
      priority: 2,
      action: null
    }),
    priority: 15
  },
  
  {
    id: 'universal_context',
    metricTypes: ['*'],
    condition: () => true, // Siempre mostrar contexto
    generate: (ctx) => ({
      type: 'neutral',
      title: 'Contexto de comparación',
      description: `Benchmark de ${getCategoryLabel(ctx.category)} en ${getCountryLabel(ctx.country)}, basado en ${ctx.companyCount} empresas.`,
      priority: 1,
      action: null
    }),
    priority: 10
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // REGLAS ESPECÍFICAS: ONBOARDING EXO
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    id: 'onboarding_excellent_integration',
    metricTypes: ['onboarding_exo'],
    condition: (ctx) => ctx.entityScore >= 75 && ctx.percentileRank >= 75,
    generate: (ctx) => ({
      type: 'positive',
      title: 'Integración de talentos excepcional',
      description: 'Tu proceso de onboarding genera conexión superior con nuevos colaboradores. Este es un diferenciador competitivo en atracción de talento.',
      priority: 9,
      action: 'Crear playbook de onboarding para escalar prácticas'
    }),
    priority: 88
  },
  
  {
    id: 'onboarding_culture_strength',
    metricTypes: ['onboarding_exo'],
    condition: (ctx) => ctx.entityScore >= 65 && ctx.status !== 'critical',
    generate: (ctx) => ({
      type: 'positive',
      title: 'Fortaleza cultural visible',
      description: 'Los nuevos talentos perciben una cultura organizacional sólida durante su integración.',
      priority: 7,
      action: null
    }),
    priority: 75
  },
  
  {
    id: 'onboarding_early_warning',
    metricTypes: ['onboarding_exo'],
    condition: (ctx) => ctx.entityScore < 50 || ctx.percentileRank < 25,
    generate: (ctx) => ({
      type: 'critical',
      title: 'Alerta temprana: Riesgo de fuga en primeros 6 meses',
      description: 'Un EXO Score bajo predice mayor rotación durante el período de onboarding. La experiencia de integración necesita atención inmediata.',
      priority: 10,
      action: 'Revisar experiencia días 1-30 y puntos de contacto críticos'
    }),
    priority: 92
  },
  
  {
    id: 'onboarding_4c_hint',
    metricTypes: ['onboarding_exo'],
    condition: (ctx) => ctx.status === 'below' || ctx.status === 'at',
    generate: (ctx) => ({
      type: 'improvement',
      title: 'Analiza las 4C del onboarding',
      description: 'Revisa Compliance (inducción), Clarificación (rol), Cultura (valores) y Conexión (relaciones) para identificar áreas de mejora.',
      priority: 6,
      action: 'Ver detalle de dimensiones 4C en el diagnóstico'
    }),
    priority: 65
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // REGLAS ESPECÍFICAS: EXIT RETENTION RISK
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    id: 'exit_low_risk',
    metricTypes: ['exit_retention_risk'],
    condition: (ctx) => ctx.entityScore < ctx.benchmarkAvg * 0.8,
    generate: (ctx) => ({
      type: 'positive',
      title: 'Riesgo de retención controlado',
      description: `Tu índice de riesgo está ${Math.abs(ctx.percentageGap).toFixed(0)}% bajo el promedio del mercado.`,
      priority: 8,
      action: 'Mantener estrategias actuales de retención'
    }),
    priority: 80
  },
  
  {
    id: 'exit_high_risk',
    metricTypes: ['exit_retention_risk'],
    condition: (ctx) => ctx.entityScore > ctx.benchmarkAvg * 1.2,
    generate: (ctx) => ({
      type: 'critical',
      title: 'Riesgo de retención elevado',
      description: `Tu índice está ${ctx.percentageGap.toFixed(0)}% sobre el promedio. Mayor probabilidad de rotación no deseada.`,
      priority: 10,
      action: 'Activar plan de retención y stay interviews'
    }),
    priority: 93
  },
  
  {
    id: 'exit_analyze_causes',
    metricTypes: ['exit_retention_risk'],
    condition: (ctx) => ctx.status === 'below' || ctx.status === 'critical',
    generate: (ctx) => ({
      type: 'improvement',
      title: 'Analiza causas raíz de salida',
      description: 'Las encuestas de salida revelan patrones. Revisa las principales razones de renuncia en tu organización.',
      priority: 7,
      action: 'Ver análisis de causas en Exit Intelligence'
    }),
    priority: 70
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // REGLAS ESPECÍFICAS: NPS SCORE
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    id: 'nps_promoter_zone',
    metricTypes: ['nps_score'],
    condition: (ctx) => ctx.entityScore >= 50,
    generate: (ctx) => ({
      type: 'positive',
      title: 'Zona de Promotores',
      description: 'NPS excelente. Tus colaboradores son embajadores de la marca empleadora.',
      priority: 9,
      action: 'Activar programa de referidos y testimonios'
    }),
    priority: 85
  },
  
  {
    id: 'nps_passive_zone',
    metricTypes: ['nps_score'],
    condition: (ctx) => ctx.entityScore >= 0 && ctx.entityScore < 50,
    generate: (ctx) => ({
      type: 'neutral',
      title: 'Zona Pasiva',
      description: 'NPS positivo pero con espacio de mejora. Los colaboradores están satisfechos pero no entusiastas.',
      priority: 6,
      action: 'Identificar qué convertiría pasivos en promotores'
    }),
    priority: 60
  },
  
  {
    id: 'nps_detractor_zone',
    metricTypes: ['nps_score'],
    condition: (ctx) => ctx.entityScore < 0,
    generate: (ctx) => ({
      type: 'critical',
      title: 'Zona de Detractores',
      description: 'NPS negativo indica problemas sistémicos de experiencia empleado. Requiere diagnóstico profundo.',
      priority: 10,
      action: 'Realizar focus groups para entender causas'
    }),
    priority: 94
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // REGLAS ESPECÍFICAS: PULSE CLIMATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  {
    id: 'pulse_healthy_climate',
    metricTypes: ['pulse_climate'],
    condition: (ctx) => ctx.percentileRank >= 75,
    generate: (ctx) => ({
      type: 'positive',
      title: 'Clima organizacional saludable',
      description: 'El pulso de tu organización está en el cuartil superior del mercado.',
      priority: 8,
      action: 'Comunicar resultados positivos al equipo'
    }),
    priority: 78
  },
  
  {
    id: 'pulse_declining',
    metricTypes: ['pulse_climate'],
    condition: (ctx) => ctx.status === 'below',
    generate: (ctx) => ({
      type: 'improvement',
      title: 'Clima bajo presión',
      description: 'El pulso indica tensión organizacional. Revisar dimensiones específicas para intervención focalizada.',
      priority: 8,
      action: 'Ver desglose por dimensión de clima'
    }),
    priority: 76
  }
];

// ============================================================================
// MOTOR PRINCIPAL
// ============================================================================

export class InsightEngine {
  
  /**
   * Generar insights basados en contexto de comparación
   * 
   * @param context - Contexto con scores, comparación y metadata
   * @returns Array de insights ordenados por prioridad
   */
  static generateInsights(context: InsightContext): InsightItem[] {
    
    // 1. Filtrar reglas aplicables (por metricType)
    const applicableRules = INSIGHT_RULES.filter(rule => 
      rule.metricTypes.includes('*') || 
      rule.metricTypes.includes(context.metricType)
    );
    
    // 2. Evaluar condiciones y generar insights
    const insights: InsightItem[] = [];
    
    for (const rule of applicableRules) {
      try {
        if (rule.condition(context)) {
          const insight = rule.generate(context);
          insights.push(insight);
        }
      } catch (error) {
        console.error(`[InsightEngine] Error evaluating rule ${rule.id}:`, error);
      }
    }
    
    // 3. Ordenar por prioridad (mayor primero)
    insights.sort((a, b) => b.priority - a.priority);
    
    // 4. Limitar a máximo 5 insights para no abrumar
    return insights.slice(0, 5);
  }
  
  /**
   * Determinar status basado en diferencia
   */
  static calculateStatus(difference: number, percentileRank: number): InsightContext['status'] {
    if (percentileRank >= 90) return 'excellent';
    if (difference > 5) return 'above';
    if (difference >= -5) return 'at';
    if (percentileRank > 25) return 'below';
    return 'critical';
  }
  
  /**
   * Calcular percentile rank aproximado basado en percentiles del benchmark
   */
  static calculatePercentileRank(
    score: number,
    percentiles: { p25: number; p50: number; p75: number; p90: number }
  ): number {
    if (score >= percentiles.p90) return 95;
    if (score >= percentiles.p75) return 85;
    if (score >= percentiles.p50) return 65;
    if (score >= percentiles.p25) return 35;
    return 15;
  }
  
  /**
   * Construir contexto completo desde datos de benchmark y comparación
   */
  static buildContext(params: {
    metricType: string;
    entityName: string;
    entityType: 'department' | 'company' | 'team';
    entityScore: number;
    benchmark: {
      avgScore: number;
      medianScore: number;
      percentile25: number;
      percentile75: number;
      percentile90: number;
      sampleSize: number;
      companyCount: number;
      standardCategory: string;
      country: string;
      industry: string;
    };
    specificityLevel?: 1 | 2 | 3 | 4;
  }): InsightContext {
    
    const { metricType, entityName, entityType, entityScore, benchmark, specificityLevel = 1 } = params;
    
    const difference = entityScore - benchmark.avgScore;
    const percentageGap = benchmark.avgScore > 0 
      ? (difference / benchmark.avgScore) * 100 
      : 0;
    
    const percentileRank = this.calculatePercentileRank(entityScore, {
      p25: benchmark.percentile25,
      p50: benchmark.medianScore,
      p75: benchmark.percentile75,
      p90: benchmark.percentile90
    });
    
    const status = this.calculateStatus(difference, percentileRank);
    
    return {
      metricType,
      entityName,
      entityType,
      entityScore,
      benchmarkAvg: benchmark.avgScore,
      benchmarkMedian: benchmark.medianScore,
      difference,
      percentageGap,
      percentileRank,
      status,
      sampleSize: benchmark.sampleSize,
      companyCount: benchmark.companyCount,
      category: benchmark.standardCategory,
      country: benchmark.country,
      industry: benchmark.industry,
      specificityLevel
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default InsightEngine;