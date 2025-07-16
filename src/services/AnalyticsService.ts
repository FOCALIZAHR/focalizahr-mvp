// src/services/AnalyticsService.ts

export interface CampaignResults {
  overall_score: number;
  participation_rate: number;
  total_responses: number;
  total_invited: number;
  company_name: string;
  industry_benchmark: number;
  category_scores: {
    liderazgo: number;
    ambiente: number;
    desarrollo: number;
    bienestar: number;
  };
  // ✅ NUEVO: DEPARTAMENTOS DESDE API POTENCIADA
  department_scores?: {
    [dept: string]: number;
  };
  campaign_type?: string;
  industry?: string;
  confidence_level?: 'high' | 'medium' | 'low';
  created_date?: string;
  completion_time?: number;
}

export interface CategoryAnalysis {
  category: string;
  score: number;
  level: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  benchmarkDifference: number;
}

export interface DepartmentAnalysis {
  name: string;
  score: number;
  level: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  rankPosition: number;
  scoreVsAverage: number;
}

export interface CampaignAnalytics {
  // ✅ MÉTRICAS BÁSICAS
  overallScore: number;
  participationRate: number;
  benchmarkDifference: number;
  
  // ✅ CATEGORÍAS ANALYSIS
  strongestCategory: CategoryAnalysis;
  weakestCategory: CategoryAnalysis;
  aboveBenchmarkCategories: CategoryAnalysis[];
  belowBenchmarkCategories: CategoryAnalysis[];
  
  // ✅ DEPARTAMENTOS ANALYSIS (NUEVO)
  departmentScores: { [dept: string]: number };
  strongestDepartment: DepartmentAnalysis;
  weakestDepartment: DepartmentAnalysis;
  departmentVariability: number;
  departmentRanking: DepartmentAnalysis[];
  departmentsAboveAverage: number;
  departmentsBelowAverage: number;
  
  // ✅ PARTICIPACIÓN ANALYSIS
  participationLevel: 'exceptional' | 'excellent' | 'good' | 'moderate' | 'low';
  confidenceLevel: 'high' | 'medium' | 'low';
  
  // ✅ CAMPAIGN TYPE ANALYSIS
  campaignType?: string;
  industry?: string;
  
  // ✅ VARIABLES DINÁMICAS ADICIONALES
  totalResponses: number;
  totalInvited: number;
  companyName: string;
  industryBenchmark: number;
}

export class AnalyticsService {
  // 📊 ANÁLISIS PRINCIPAL MULTI-DIMENSIONAL
  static analyzeCampaignResults(results: CampaignResults): CampaignAnalytics {
    // ✅ ANÁLISIS CATEGORÍAS
    const categoryAnalysis = this.analyzeCategoryScores(results);
    
    // ✅ ANÁLISIS DEPARTAMENTOS (NUEVO)
    const departmentAnalysis = this.analyzeDepartmentScores(results);
    
    // ✅ ANÁLISIS PARTICIPACIÓN
    const participationAnalysis = this.analyzeParticipation(results);
    
    return {
      // Métricas básicas
      overallScore: results.overall_score,
      participationRate: results.participation_rate,
      benchmarkDifference: results.overall_score - results.industry_benchmark,
      
      // Categorías analysis
      strongestCategory: categoryAnalysis.strongest,
      weakestCategory: categoryAnalysis.weakest,
      aboveBenchmarkCategories: categoryAnalysis.aboveBenchmark,
      belowBenchmarkCategories: categoryAnalysis.belowBenchmark,
      
      // ✅ DEPARTAMENTOS ANALYSIS (NUEVO)
      departmentScores: results.department_scores || {},
      strongestDepartment: departmentAnalysis.strongest,
      weakestDepartment: departmentAnalysis.weakest,
      departmentVariability: departmentAnalysis.variability,
      departmentRanking: departmentAnalysis.ranking,
      departmentsAboveAverage: departmentAnalysis.aboveAverage,
      departmentsBelowAverage: departmentAnalysis.belowAverage,
      
      // Participación analysis
      participationLevel: participationAnalysis.level,
      confidenceLevel: participationAnalysis.confidence,
      
      // Campaign info
      campaignType: results.campaign_type,
      industry: results.industry,
      
      // Variables adicionales
      totalResponses: results.total_responses,
      totalInvited: results.total_invited,
      companyName: results.company_name,
      industryBenchmark: results.industry_benchmark
    };
  }

  // 📊 ANÁLISIS CATEGORÍAS
  private static analyzeCategoryScores(results: CampaignResults) {
    const categories = Object.entries(results.category_scores).map(([category, score]) => ({
      category,
      score,
      level: this.scoreToLevel(score),
      benchmarkDifference: score - results.industry_benchmark
    }));

    // Ordenar por score
    const sortedByScore = [...categories].sort((a, b) => b.score - a.score);
    
    return {
      strongest: sortedByScore[0],
      weakest: sortedByScore[sortedByScore.length - 1],
      aboveBenchmark: categories.filter(c => c.benchmarkDifference > 0.2),
      belowBenchmark: categories.filter(c => c.benchmarkDifference < -0.2)
    };
  }

  // 🏢 ANÁLISIS DEPARTAMENTOS (NUEVO CON API POTENCIADA)
  private static analyzeDepartmentScores(results: CampaignResults) {
    const deptScores = results.department_scores || {};
    
    if (Object.keys(deptScores).length === 0) {
      // Sin datos departamentales
      return {
        strongest: { name: 'N/A', score: 0, level: 'moderate' as const, rankPosition: 0, scoreVsAverage: 0 },
        weakest: { name: 'N/A', score: 0, level: 'moderate' as const, rankPosition: 0, scoreVsAverage: 0 },
        variability: 0,
        ranking: [],
        aboveAverage: 0,
        belowAverage: 0
      };
    }

    // Calcular estadísticas departamentales
    const departments = Object.entries(deptScores).map(([name, score]) => ({
      name,
      score,
      level: this.scoreToLevel(score),
      rankPosition: 0, // Se calculará después
      scoreVsAverage: score - results.overall_score
    }));

    // Ordenar por score y asignar ranking
    const ranking = departments
      .sort((a, b) => b.score - a.score)
      .map((dept, index) => ({
        ...dept,
        rankPosition: index + 1
      }));

    // Calcular variabilidad (desviación estándar)
    const scores = Object.values(deptScores);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const variability = Math.sqrt(variance);

    // Departamentos above/below average
    const aboveAverage = departments.filter(d => d.score > results.overall_score).length;
    const belowAverage = departments.filter(d => d.score < results.overall_score).length;

    return {
      strongest: ranking[0],
      weakest: ranking[ranking.length - 1],
      variability,
      ranking,
      aboveAverage,
      belowAverage
    };
  }

  // 📈 ANÁLISIS PARTICIPACIÓN
  private static analyzeParticipation(results: CampaignResults) {
    const rate = results.participation_rate;
    const responses = results.total_responses;
    
    let level: 'exceptional' | 'excellent' | 'good' | 'moderate' | 'low';
    let confidence: 'high' | 'medium' | 'low';
    
    // Clasificar nivel participación
    if (rate >= 85) level = 'exceptional';
    else if (rate >= 75) level = 'excellent';
    else if (rate >= 60) level = 'good';
    else if (rate >= 40) level = 'moderate';
    else level = 'low';
    
    // Calcular confianza estadística
    if (rate >= 75 && responses >= 30) confidence = 'high';
    else if (rate >= 60 && responses >= 20) confidence = 'medium';
    else confidence = 'low';
    
    return { level, confidence };
  }

  // 🎯 CLASIFICAR SCORE A LEVEL
  private static scoreToLevel(score: number): 'excellent' | 'good' | 'moderate' | 'poor' | 'critical' {
    if (score >= 4.0) return 'excellent';
    if (score >= 3.5) return 'good';
    if (score >= 3.0) return 'moderate';
    if (score >= 2.5) return 'poor';
    return 'critical';
  }

  // 🏆 ANÁLISIS ESPECÍFICO POR CAMPAIGN TYPE
  static analyzeByCampaignType(results: CampaignResults): any[] {
    const insights = [];
    const type = results.campaign_type?.toLowerCase();
    
    switch (type) {
      case 'retencion-predictiva':
      case 'retención predictiva':
        insights.push(...this.analyzeRetentionPredictive(results));
        break;
        
      case 'pulso-express':
      case 'pulso express':
        insights.push(...this.analyzePulsoExpress(results));
        break;
        
      case 'experiencia-colaborador':
      case 'experiencia full':
        insights.push(...this.analyzeExperienciaFull(results));
        break;
    }
    
    return insights;
  }

  // 🎯 ANÁLISIS RETENCIÓN PREDICTIVA
  private static analyzeRetentionPredictive(results: CampaignResults): any[] {
    const insights = [];
    const retentionScore = results.overall_score;
    
    if (retentionScore >= 4.0) {
      insights.push({
        type: 'retention_positive',
        priority: 8,
        message: `Indicadores retención sólidos: Score ${retentionScore.toFixed(1)}/5.0 sugiere baja probabilidad rotación`
      });
    } else if (retentionScore < 3.0) {
      insights.push({
        type: 'retention_risk',
        priority: 11,
        message: `Riesgo retención detectado: Score ${retentionScore.toFixed(1)}/5.0 requiere estrategia inmediata`
      });
    }
    
    // Análisis desarrollo profesional (crítico para retención)
    if (results.category_scores.desarrollo < 3.0) {
      insights.push({
        type: 'development_risk',
        priority: 10,
        message: `Desarrollo profesional crítico: ${results.category_scores.desarrollo.toFixed(1)}/5.0 - Factor clave rotación`
      });
    }
    
    return insights;
  }

  // ⚡ ANÁLISIS PULSO EXPRESS
  private static analyzePulsoExpress(results: CampaignResults): any[] {
    const insights = [];
    const pulseScore = results.overall_score;
    
    if (pulseScore >= 4.0) {
      insights.push({
        type: 'pulse_positive',
        priority: 8,
        message: `Pulso organizacional positivo: ${pulseScore.toFixed(1)}/5.0 indica ambiente productivo`
      });
    } else if (pulseScore < 3.0) {
      insights.push({
        type: 'pulse_alert',
        priority: 9,
        message: `Pulso requiere atención: ${pulseScore.toFixed(1)}/5.0 sugiere plan mejora inmediato`
      });
    }
    
    return insights;
  }

  // 🌟 ANÁLISIS EXPERIENCIA FULL
  private static analyzeExperienciaFull(results: CampaignResults): any[] {
    const insights = [];
    
    // Encontrar la categoría más fuerte para experiencia
    const topCategory = Object.entries(results.category_scores)
      .sort(([,a], [,b]) => b - a)[0];
      
    if (topCategory && topCategory[1] >= 4.0) {
      insights.push({
        type: 'experience_strength',
        priority: 8,
        message: `Experiencia destacada: ${topCategory[0]} sobresale (${topCategory[1].toFixed(1)}/5.0) como pilar experiencia`
      });
    }
    
    return insights;
  }

  // 📊 ANÁLISIS COMPARATIVO DEPARTAMENTOS
  static getDepartmentInsights(results: CampaignResults): any[] {
    const insights = [];
    const deptScores = results.department_scores || {};
    
    if (Object.keys(deptScores).length < 2) {
      return insights; // No hay suficientes departamentos para comparar
    }
    
    const analytics = this.analyzeCampaignResults(results);
    const strongest = analytics.strongestDepartment;
    const weakest = analytics.weakestDepartment;
    const variability = analytics.departmentVariability;
    
    // Insight departamento campeón
    if (strongest.score >= 4.0 && strongest.scoreVsAverage > 0.3) {
      insights.push({
        type: 'dept_champion',
        priority: 7,
        message: `${strongest.name} lidera satisfacción (${strongest.score.toFixed(1)}/5.0) - Modelo a replicar`
      });
    }
    
    // Insight departamento oportunidad
    if (weakest.score < 3.5 && weakest.scoreVsAverage < -0.3) {
      insights.push({
        type: 'dept_opportunity',
        priority: 8,
        message: `${weakest.name} presenta oportunidad (${weakest.score.toFixed(1)}/5.0) - Priorizar intervención`
      });
    }
    
    // Insight variabilidad
    if (variability > 0.8) {
      insights.push({
        type: 'dept_variability',
        priority: 6,
        message: `Variabilidad significativa entre departamentos (${variability.toFixed(1)}) - Oportunidad estandarización`
      });
    }
    
    return insights;
  }

  // 🔍 ANÁLISIS CORRELACIONAL AVANZADO
  static getCorrelationInsights(results: CampaignResults): any[] {
    const insights = [];
    
    // Correlación participación vs satisfacción
    if (results.participation_rate >= 80 && results.overall_score >= 4.0) {
      insights.push({
        type: 'high_engagement_correlation',
        priority: 6,
        message: `Alta correlación: ${results.participation_rate.toFixed(0)}% participación + ${results.overall_score.toFixed(1)} satisfacción indica compromiso organizacional sólido`
      });
    }
    
    // Correlación desarrollo vs bienestar
    const desarrollo = results.category_scores.desarrollo;
    const bienestar = results.category_scores.bienestar;
    
    if (Math.abs(desarrollo - bienestar) < 0.3 && desarrollo >= 3.8) {
      insights.push({
        type: 'development_wellbeing_balance',
        priority: 5,
        message: `Balance desarrollo-bienestar: Scores similares (${desarrollo.toFixed(1)} vs ${bienestar.toFixed(1)}) indican cultura equilibrada`
      });
    }
    
    return insights;
  }

  // 📈 GENERAR RECOMENDACIONES ACCIONABLES
  static generateActionableRecommendations(results: CampaignResults): any[] {
    const recommendations = [];
    const analytics = this.analyzeCampaignResults(results);
    
    // Recomendaciones basadas en categoría más débil
    const weakest = analytics.weakestCategory;
    if (weakest.score < 3.0) {
      recommendations.push({
        priority: 'high',
        area: weakest.category,
        action: this.getActionByCategory(weakest.category),
        timeline: '30-60 días',
        expected_impact: 'Alto'
      });
    }
    
    // Recomendaciones departamentales
    if (analytics.departmentVariability > 1.0) {
      recommendations.push({
        priority: 'medium',
        area: 'departamentos',
        action: `Implementar mejores prácticas de ${analytics.strongestDepartment.name} en ${analytics.weakestDepartment.name}`,
        timeline: '60-90 días',
        expected_impact: 'Medio-Alto'
      });
    }
    
    return recommendations;
  }

  // 🎯 ACCIONES POR CATEGORÍA
  private static getActionByCategory(category: string): string {
    const actions = {
      'liderazgo': 'Programa coaching líderes + feedback 360°',
      'ambiente': 'Iniciativas team building + espacios colaboración',
      'desarrollo': 'Plan carrera individualizado + capacitación técnica',
      'bienestar': 'Programa wellness + balance vida-trabajo'
    };
    
    return actions[category as keyof typeof actions] || 'Plan de mejora específico';
  }
}