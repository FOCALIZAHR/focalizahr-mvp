// src/services/VariableReplacementService.ts

export interface VariableContext {
  // ✅ BÁSICAS CAMPAÑA
  companyName?: string;
  overall_score?: number;
  participation_rate?: number;
  total_responses?: number;
  total_invited?: number;
  industryBenchmark?: number;
  benchmarkDifference?: number;

  // ✅ CATEGORÍAS
  strongestCategory?: { category: string; score: number };
  weakestCategory?: { category: string; score: number };

  // ✅ DEPARTAMENTOS (NUEVO CON API POTENCIADA)
  departmentScores?: { [dept: string]: number };
  strongestDepartment?: { name: string; score: number };
  weakestDepartment?: { name: string; score: number };
  departmentVariability?: number;
  strongest_dept?: string;
  strongest_dept_score?: number;
  weakest_dept?: string;
  weakest_dept_score?: number;
  dept_variability?: number;

  // ✅ LEVELS & CLASSIFICATIONS
  participationLevel?: string;
  confidenceLevel?: string;
  campaignType?: string;
  industry?: string;

  // ✅ FECHAS & METADATA
  date?: string;
  created_date?: string;
  completion_time?: number;
}

export class VariableReplacementService {
  // 🔄 REEMPLAZAR TODAS LAS VARIABLES EN TEMPLATE
  static replaceAll(templateText: string, context: VariableContext): string {
    let processedText = templateText;

    // ✅ VARIABLES BÁSICAS
    processedText = this.replaceBasicVariables(processedText, context);
    
    // ✅ VARIABLES DEPARTAMENTOS (NUEVO)
    processedText = this.replaceDepartmentVariables(processedText, context);
    
    // ✅ VARIABLES CALCULADAS
    processedText = this.replaceCalculatedVariables(processedText, context);
    
    // ✅ VARIABLES FORMATEADAS
    processedText = this.replaceFormattedVariables(processedText, context);

    // ✅ LIMPIAR VARIABLES NO ENCONTRADAS
    processedText = this.cleanUnusedVariables(processedText);

    return processedText;
  }

  // 📊 VARIABLES BÁSICAS CAMPAÑA
  private static replaceBasicVariables(text: string, context: VariableContext): string {
    return text
      .replace(/{companyName}/g, context.companyName || 'su empresa')
      .replace(/{company_name}/g, context.companyName || 'su empresa')
      .replace(/{overall_score}/g, this.formatScore(context.overall_score))
      .replace(/{participation_rate}/g, this.formatPercentage(context.participation_rate))
      .replace(/{total_responses}/g, (context.total_responses || 0).toString())
      .replace(/{total_invited}/g, (context.total_invited || 0).toString())
      .replace(/{industry_benchmark}/g, this.formatScore(context.industryBenchmark))
      .replace(/{benchmark_difference}/g, this.formatDifference(context.benchmarkDifference))
      .replace(/{campaign_type}/g, context.campaignType || '')
      .replace(/{industry}/g, context.industry || '')
      .replace(/{date}/g, context.date || new Date().toLocaleDateString('es-CL'));
  }

  // 🏢 VARIABLES DEPARTAMENTOS (NUEVO)
  private static replaceDepartmentVariables(text: string, context: VariableContext): string {
    return text
      .replace(/{strongest_dept}/g, context.strongest_dept || context.strongestDepartment?.name || 'N/A')
      .replace(/{strongest_dept_score}/g, this.formatScore(context.strongest_dept_score || context.strongestDepartment?.score))
      .replace(/{weakest_dept}/g, context.weakest_dept || context.weakestDepartment?.name || 'N/A')
      .replace(/{weakest_dept_score}/g, this.formatScore(context.weakest_dept_score || context.weakestDepartment?.score))
      .replace(/{dept_variability}/g, this.formatScore(context.dept_variability || context.departmentVariability))
      // ✅ VARIABLES ESPECÍFICAS DEPARTAMENTOS
      .replace(/{dept_count}/g, this.getDepartmentCount(context.departmentScores).toString())
      .replace(/{dept_above_avg}/g, this.getDepartmentsAboveAverage(context).toString())
      .replace(/{dept_below_avg}/g, this.getDepartmentsBelowAverage(context).toString());
  }

  // 🧮 VARIABLES CALCULADAS DINÁMICAMENTE
  private static replaceCalculatedVariables(text: string, context: VariableContext): string {
    const avgScore = context.overall_score || 0;
    const participation = context.participation_rate || 0;
    
    return text
      .replace(/{percentile_text}/g, this.getPercentileText(avgScore))
      .replace(/{urgency_text}/g, this.getUrgencyText(avgScore))
      .replace(/{confidence_text}/g, this.getConfidenceText(participation, context.total_responses || 0))
      .replace(/{benchmark_status}/g, this.getBenchmarkStatus(context.benchmarkDifference || 0))
      .replace(/{improvement_potential}/g, this.getImprovementPotential(avgScore))
      .replace(/{participation_quality}/g, this.getParticipationQuality(participation));
  }

  // 🎨 VARIABLES FORMATEADAS ESPECIALES
  private static replaceFormattedVariables(text: string, context: VariableContext): string {
    return text
      .replace(/{score_with_trend}/g, this.getScoreWithTrend(context.overall_score))
      .replace(/{participation_badge}/g, this.getParticipationBadge(context.participation_rate))
      .replace(/{benchmark_comparison}/g, this.getBenchmarkComparison(context.benchmarkDifference))
      .replace(/{dept_performance_summary}/g, this.getDepartmentPerformanceSummary(context));
  }

  // 🏢 HELPER FUNCTIONS DEPARTAMENTOS
  private static getDepartmentCount(deptScores?: { [dept: string]: number }): number {
    return deptScores ? Object.keys(deptScores).length : 0;
  }

  private static getDepartmentsAboveAverage(context: VariableContext): number {
    if (!context.departmentScores || !context.overall_score) return 0;
    
    return Object.values(context.departmentScores).filter(
      score => score > context.overall_score!
    ).length;
  }

  private static getDepartmentsBelowAverage(context: VariableContext): number {
    if (!context.departmentScores || !context.overall_score) return 0;
    
    return Object.values(context.departmentScores).filter(
      score => score < context.overall_score!
    ).length;
  }

  private static getDepartmentPerformanceSummary(context: VariableContext): string {
    if (!context.departmentScores) return 'No hay datos departamentales disponibles';
    
    const deptCount = Object.keys(context.departmentScores).length;
    const aboveAvg = this.getDepartmentsAboveAverage(context);
    const belowAvg = this.getDepartmentsBelowAverage(context);
    
    return `${deptCount} departamentos analizados: ${aboveAvg} sobre promedio, ${belowAvg} bajo promedio`;
  }

  // 📊 HELPER FUNCTIONS ANÁLISIS
  private static getPercentileText(score: number): string {
    if (score >= 4.5) return 'percentil 95+';
    if (score >= 4.2) return 'percentil 85+';
    if (score >= 3.8) return 'percentil 70+';
    if (score >= 3.5) return 'percentil 50+';
    return 'bajo percentil 50';
  }

  private static getUrgencyText(score: number): string {
    if (score < 2.5) return 'CRÍTICA';
    if (score < 2.8) return 'ALTA';
    if (score < 3.2) return 'MEDIA';
    return 'BAJA';
  }

  private static getConfidenceText(participation: number, responses: number): string {
    if (participation >= 75 && responses >= 30) return 'Alta confiabilidad estadística';
    if (participation >= 60 && responses >= 20) return 'Buena confiabilidad estadística';
    if (participation >= 40 && responses >= 10) return 'Confiabilidad moderada';
    return 'Confiabilidad limitada';
  }

  private static getBenchmarkStatus(difference: number): string {
    if (difference > 0.5) return 'Significativamente superior';
    if (difference > 0.2) return 'Por encima del promedio';
    if (difference > -0.2) return 'En línea con el sector';
    if (difference > -0.5) return 'Bajo el promedio sectorial';
    return 'Significativamente bajo benchmark';
  }

  private static getImprovementPotential(score: number): string {
    const maxScore = 5.0;
    const potential = maxScore - score;
    
    if (potential <= 0.5) return 'Potencial limitado (mantenimiento)';
    if (potential <= 1.0) return 'Potencial moderado (+0.5-1.0)';
    if (potential <= 1.5) return 'Potencial considerable (+1.0-1.5)';
    return 'Potencial alto (+1.5 puntos)';
  }

  private static getParticipationQuality(participation: number): string {
    if (participation >= 85) return 'Excepcional';
    if (participation >= 75) return 'Excelente';
    if (participation >= 60) return 'Buena';
    if (participation >= 40) return 'Moderada';
    return 'Baja';
  }

  // 🎨 FORMATTERS ESPECIALES
  private static getScoreWithTrend(score?: number): string {
    if (!score) return 'N/A';
    const formatted = this.formatScore(score);
    
    if (score >= 4.0) return `${formatted} 📈`;
    if (score < 3.0) return `${formatted} 📉`;
    return `${formatted} ➡️`;
  }

  private static getParticipationBadge(participation?: number): string {
    if (!participation) return '';
    
    if (participation >= 85) return '🏆 EXCEPCIONAL';
    if (participation >= 75) return '🥇 EXCELENTE';
    if (participation >= 60) return '✅ BUENA';
    if (participation >= 40) return '⚠️ MODERADA';
    return '🚨 BAJA';
  }

  private static getBenchmarkComparison(difference?: number): string {
    if (difference === undefined) return '';
    
    if (difference > 0.5) return `🏆 +${difference.toFixed(1)} vs sector`;
    if (difference > 0.2) return `📈 +${difference.toFixed(1)} vs sector`;
    if (difference > -0.2) return `➡️ ${difference.toFixed(1)} vs sector`;
    return `📉 ${difference.toFixed(1)} vs sector`;
  }

  // 🔧 UTILITY FORMATTERS
  private static formatScore(score?: number): string {
    if (score === undefined || score === null) return 'N/A';
    return score.toFixed(1);
  }

  private static formatPercentage(percentage?: number): string {
    if (percentage === undefined || percentage === null) return '0';
    return Math.round(percentage).toString();
  }

  private static formatDifference(difference?: number): string {
    if (difference === undefined || difference === null) return '0.0';
    const formatted = difference.toFixed(1);
    return difference > 0 ? `+${formatted}` : formatted;
  }

  // 🧹 LIMPIAR VARIABLES NO UTILIZADAS
  private static cleanUnusedVariables(text: string): string {
    // Remover variables que no fueron reemplazadas (quedan como {variable})
    return text.replace(/{[^}]*}/g, 'N/A');
  }

  // 🔍 OBTENER VARIABLES DISPONIBLES EN TEMPLATE
  static extractVariables(templateText: string): string[] {
    const matches = templateText.match(/{([^}]*)}/g);
    if (!matches) return [];
    
    return matches.map(match => match.slice(1, -1)); // Remover { }
  }

  // ✅ VALIDAR QUE TODAS LAS VARIABLES ESTÉN DISPONIBLES
  static validateVariables(templateText: string, context: VariableContext): boolean {
    const requiredVars = this.extractVariables(templateText);
    const processedText = this.replaceAll(templateText, context);
    
    // Si después del replacement quedan variables sin procesar, retorna false
    return !processedText.includes('{') || !processedText.includes('}');
  }
}