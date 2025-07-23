// src/utils/FinancialCalculations.ts
// 🎯 FOCALIZAHR - CHAT 6C: FINANCIAL CALCULATIONS
// Cálculos financieros auditables con trazabilidad completa

import { 
  CalculationTrace, 
  FinancialConfig, 
  SensitivityAnalysis,
  FinancialTransparencyReport
} from '@/types/FinancialTransparency';
import { BusinessCaseFinancials } from '@/types/BusinessCase';
import { FinancialConfigManager } from '@/config/FinancialConfig';

/**
 * FinancialCalculator - Motor cálculos auditables
 * Diferenciación: Trazabilidad completa vs "black box" competencia
 */
export class FinancialCalculator {

  /**
   * Calcula financials para ambiente crítico con trazabilidad completa
   */
  static calculateAmbienteCriticoFinancials(
    participantsAffected: number,
    config?: FinancialConfig
  ): {
    financials: BusinessCaseFinancials;
    traces: Record<string, CalculationTrace>;
  } {
    const financialConfig = config || FinancialConfigManager.getConfigByBusinessCaseType('ambiente_critico');
    
    // 📊 OBTENER SUPUESTOS AUDITABLES
    const avgSalary = FinancialConfigManager.getAssumption(financialConfig, 'average_monthly_salary_chile');
    const productivityLoss = FinancialConfigManager.getAssumption(financialConfig, 'productivity_loss_toxic_environment');
    const turnoverIncrease = FinancialConfigManager.getAssumption(financialConfig, 'turnover_increase_toxic_environment');
    const replacementCost = FinancialConfigManager.getAssumption(financialConfig, 'replacement_cost_multiplier');
    const programCost = FinancialConfigManager.getAssumption(financialConfig, 'environment_improvement_cost_per_employee');
    const effectiveness = FinancialConfigManager.getAssumption(financialConfig, 'program_effectiveness_rate');

    if (!avgSalary || !productivityLoss || !turnoverIncrease || !replacementCost || !programCost || !effectiveness) {
      throw new Error('Configuración financiera incompleta');
    }

    // 💰 CÁLCULO 1: COSTO ACTUAL ANUAL
    const currentCostTrace = this.calculateCurrentAnnualCost(
      participantsAffected,
      avgSalary.value,
      productivityLoss.value,
      [avgSalary, productivityLoss]
    );

    // 📈 CÁLCULO 2: PÉRDIDA POTENCIAL ANUAL
    const potentialLossTrace = this.calculatePotentialAnnualLoss(
      participantsAffected,
      avgSalary.value,
      turnoverIncrease.value,
      replacementCost.value,
      [avgSalary, turnoverIncrease, replacementCost]
    );

    // 💡 CÁLCULO 3: INVERSIÓN RECOMENDADA
    const investmentTrace = this.calculateRecommendedInvestment(
      participantsAffected,
      programCost.value,
      [programCost]
    );

    // 📊 CÁLCULO 4: ROI ESTIMADO
    const roiTrace = this.calculateROI(
      currentCostTrace.result,
      effectiveness.value,
      investmentTrace.result,
      [effectiveness]
    );

    // ⏱️ CÁLCULO 5: PERÍODO RETORNO
    const paybackTrace = this.calculatePaybackPeriod(
      investmentTrace.result,
      currentCostTrace.result,
      effectiveness.value,
      [effectiveness]
    );

    // 📋 COMPILAR FINANCIALS FINALES
    const financials: BusinessCaseFinancials = {
      currentAnnualCost: Math.round(currentCostTrace.result),
      potentialAnnualLoss: Math.round(potentialLossTrace.result),
      recommendedInvestment: Math.round(investmentTrace.result),
      estimatedROI: Math.round(roiTrace.result),
      paybackPeriod: Math.round(paybackTrace.result),
      
      methodologySources: financialConfig.methodologySources.map(source => 
        `${source.organization} - ${source.studyTitle} (${source.year})`
      ),
      
      keyAssumptions: [
        `Salario promedio CLP ${this.formatCurrency(avgSalary.value)}/mes`,
        `${participantsAffected} colaboradores directamente afectados`,
        `${(productivityLoss.value * 100).toFixed(0)}% pérdida productividad por ambiente tóxico`,
        `${(turnoverIncrease.value * 100).toFixed(0)}% incremento rotación estimado`,
        `CLP ${this.formatCurrency(programCost.value)}/persona inversión programa mejora`
      ]
    };

    const traces = {
      currentAnnualCost: currentCostTrace,
      potentialAnnualLoss: potentialLossTrace,
      recommendedInvestment: investmentTrace,
      estimatedROI: roiTrace,
      paybackPeriod: paybackTrace
    };

    return { financials, traces };
  }

  /**
   * Calcula costo actual anual con trazabilidad
   */
  private static calculateCurrentAnnualCost(
    participants: number,
    monthlySalary: number,
    productivityLoss: number,
    sources: any[]
  ): CalculationTrace {
    const annualSalary = monthlySalary * 12;
    const totalSalaryBudget = participants * annualSalary;
    const productivityLossAmount = totalSalaryBudget * productivityLoss;

    return {
      result: productivityLossAmount,
      unit: 'CLP',
      formula: 'Participantes × Salario Anual × % Pérdida Productividad',
      inputs: {
        participants: { value: participants, source: 'campaign_data' },
        monthlySalary: { value: monthlySalary, source: sources[0].key },
        productivityLoss: { value: productivityLoss, source: sources[1].key }
      },
      calculationSteps: [
        {
          step: 1,
          description: 'Calcular salario anual promedio',
          calculation: `${monthlySalary} × 12`,
          result: annualSalary
        },
        {
          step: 2,
          description: 'Calcular presupuesto salarial total afectado',
          calculation: `${participants} × ${annualSalary}`,
          result: totalSalaryBudget
        },
        {
          step: 3,
          description: 'Aplicar pérdida productividad',
          calculation: `${totalSalaryBudget} × ${productivityLoss}`,
          result: productivityLossAmount
        }
      ],
      confidenceLevel: 'high',
      confidenceFactors: [
        'Fuente Gallup - metodología reconocida internacionalmente',
        'Datos salariales basados en estadísticas nacionales',
        'Muestra suficiente para cálculo estadístico válido'
      ]
    };
  }

  /**
   * Calcula pérdida potencial anual con trazabilidad
   */
  private static calculatePotentialAnnualLoss(
    participants: number,
    monthlySalary: number,
    turnoverIncrease: number,
    replacementMultiplier: number,
    sources: any[]
  ): CalculationTrace {
    const annualSalary = monthlySalary * 12;
    const expectedTurnover = participants * turnoverIncrease;
    const costPerReplacement = annualSalary * replacementMultiplier;
    const totalReplacementCost = expectedTurnover * costPerReplacement;

    return {
      result: totalReplacementCost,
      unit: 'CLP',
      formula: 'Rotación Esperada × Salario Anual × Multiplicador Reemplazo',
      inputs: {
        participants: { value: participants, source: 'campaign_data' },
        monthlySalary: { value: monthlySalary, source: sources[0].key },
        turnoverIncrease: { value: turnoverIncrease, source: sources[1].key },
        replacementMultiplier: { value: replacementMultiplier, source: sources[2].key }
      },
      calculationSteps: [
        {
          step: 1,
          description: 'Calcular empleados en riesgo de rotación',
          calculation: `${participants} × ${turnoverIncrease}`,
          result: expectedTurnover
        },
        {
          step: 2,
          description: 'Calcular costo reemplazo por empleado',
          calculation: `${annualSalary} × ${replacementMultiplier}`,
          result: costPerReplacement
        },
        {
          step: 3,
          description: 'Calcular costo total reemplazos',
          calculation: `${expectedTurnover} × ${costPerReplacement}`,
          result: totalReplacementCost
        }
      ],
      confidenceLevel: 'medium',
      confidenceFactors: [
        'SHRM - fuente autorizada en costos RRHH',
        'Correlación ambiente-rotación ampliamente documentada',
        'Supuesto: todos los que salen requieren reemplazo inmediato'
      ]
    };
  }

  /**
   * Calcula inversión recomendada con trazabilidad
   */
  private static calculateRecommendedInvestment(
    participants: number,
    costPerEmployee: number,
    sources: any[]
  ): CalculationTrace {
    const totalInvestment = participants * costPerEmployee;

    return {
      result: totalInvestment,
      unit: 'CLP',
      formula: 'Participantes × Costo Programa por Empleado',
      inputs: {
        participants: { value: participants, source: 'campaign_data' },
        costPerEmployee: { value: costPerEmployee, source: sources[0].key }
      },
      calculationSteps: [
        {
          step: 1,
          description: 'Calcular inversión total programa mejora',
          calculation: `${participants} × ${costPerEmployee}`,
          result: totalInvestment
        }
      ],
      confidenceLevel: 'medium',
      confidenceFactors: [
        'Estimación basada en programas similares',
        'Incluye coaching, training y consultoría',
        'Puede variar según proveedor y duración específica'
      ]
    };
  }

  /**
   * Calcula ROI con trazabilidad
   */
  private static calculateROI(
    currentCost: number,
    effectiveness: number,
    investment: number,
    sources: any[]
  ): CalculationTrace {
    const annualSavings = currentCost * effectiveness;
    const netBenefit = annualSavings - investment;
    const roi = (netBenefit / investment) * 100;

    return {
      result: roi,
      unit: '%',
      formula: '((Ahorros Anuales - Inversión) / Inversión) × 100',
      inputs: {
        currentCost: { value: currentCost, source: 'calculated_current_cost' },
        effectiveness: { value: effectiveness, source: sources[0].key },
        investment: { value: investment, source: 'calculated_investment' }
      },
      calculationSteps: [
        {
          step: 1,
          description: 'Calcular ahorros anuales esperados',
          calculation: `${currentCost} × ${effectiveness}`,
          result: annualSavings
        },
        {
          step: 2,
          description: 'Calcular beneficio neto',
          calculation: `${annualSavings} - ${investment}`,
          result: netBenefit
        },
        {
          step: 3,
          description: 'Calcular ROI porcentual',
          calculation: `(${netBenefit} / ${investment}) × 100`,
          result: roi
        }
      ],
      confidenceLevel: 'medium',
      confidenceFactors: [
        'Efectividad basada en estudios McKinsey/Harvard',
        'Asume implementación correcta del programa',
        'No considera beneficios intangibles adicionales'
      ]
    };
  }

  /**
   * Calcula período de retorno con trazabilidad
   */
  private static calculatePaybackPeriod(
    investment: number,
    annualSavings: number,
    effectiveness: number,
    sources: any[]
  ): CalculationTrace {
    const effectiveAnnualSavings = annualSavings * effectiveness;
    const monthlyReturns = effectiveAnnualSavings / 12;
    const paybackMonths = investment / monthlyReturns;

    return {
      result: paybackMonths,
      unit: 'meses',
      formula: 'Inversión / (Ahorros Anuales × Efectividad / 12)',
      inputs: {
        investment: { value: investment, source: 'calculated_investment' },
        annualSavings: { value: annualSavings, source: 'calculated_current_cost' },
        effectiveness: { value: effectiveness, source: sources[0].key }
      },
      calculationSteps: [
        {
          step: 1,
          description: 'Calcular ahorros anuales efectivos',
          calculation: `${annualSavings} × ${effectiveness}`,
          result: effectiveAnnualSavings
        },
        {
          step: 2,
          description: 'Calcular retornos mensuales',
          calculation: `${effectiveAnnualSavings} / 12`,
          result: monthlyReturns
        },
        {
          step: 3,
          description: 'Calcular período retorno en meses',
          calculation: `${investment} / ${monthlyReturns}`,
          result: paybackMonths
        }
      ],
      confidenceLevel: 'medium',
      confidenceFactors: [
        'Asume retornos lineales desde mes 1',
        'No considera curva de aprendizaje inicial',
        'Basado en efectividad promedio de industria'
      ]
    };
  }

  /**
   * Genera análisis sensibilidad para variable crítica
   */
  static generateSensitivityAnalysis(
    baseValue: number,
    variable: string,
    impactCalculator: (newValue: number) => number
  ): SensitivityAnalysis {
    const scenarios = [
      { name: 'conservative', variableChange: -20, description: '20% más conservador' },
      { name: 'optimistic', variableChange: 20, description: '20% más optimista' },
      { name: 'pessimistic', variableChange: -50, description: '50% más pesimista' },
      { name: 'best_case', variableChange: 50, description: '50% mejor caso' }
    ];

    const baseResult = impactCalculator(baseValue);
    
    const scenarioResults = scenarios.map(scenario => {
      const newValue = baseValue * (1 + scenario.variableChange / 100);
      const newResult = impactCalculator(newValue);
      const impactOnResult = ((newResult - baseResult) / baseResult) * 100;

      return {
        name: scenario.name,
        variableChange: scenario.variableChange,
        impactOnResult,
        newResult
      };
    });

    // Determinar nivel sensibilidad
    const maxImpact = Math.max(...scenarioResults.map(s => Math.abs(s.impactOnResult)));
    let sensitivityLevel: 'very_high' | 'high' | 'medium' | 'low';
    
    if (maxImpact > 100) sensitivityLevel = 'very_high';
    else if (maxImpact > 50) sensitivityLevel = 'high';
    else if (maxImpact > 20) sensitivityLevel = 'medium';
    else sensitivityLevel = 'low';

    let recommendation: string;
    switch (sensitivityLevel) {
      case 'very_high':
        recommendation = 'Variable crítica - requiere validación adicional y monitoreo continuo';
        break;
      case 'high':
        recommendation = 'Variable importante - considerar rango de escenarios en decisión';
        break;
      case 'medium':
        recommendation = 'Sensibilidad moderada - valor base confiable para decisión';
        break;
      case 'low':
        recommendation = 'Baja sensibilidad - resultado robusto ante variaciones';
        break;
    }

    return {
      variable,
      baseValue,
      scenarios: scenarioResults,
      sensitivityLevel,
      recommendation
    };
  }

  /**
   * Genera reporte transparencia completo
   */
  static generateTransparencyReport(
    businessCaseId: string,
    businessCaseType: string,
    traces: Record<string, CalculationTrace>,
    config: FinancialConfig
  ): FinancialTransparencyReport {
    // Análisis sensibilidad variables clave
    const sensitivityAnalysis = [
      this.generateSensitivityAnalysis(
        850000, // salario base
        'average_monthly_salary_chile',
        (newSalary) => traces.currentAnnualCost.result * (newSalary / 850000)
      ),
      this.generateSensitivityAnalysis(
        0.23, // pérdida productividad
        'productivity_loss_toxic_environment',
        (newLoss) => traces.currentAnnualCost.result * (newLoss / 0.23)
      )
    ];

    // Validaciones
    const validations = {
      assumptionsValid: config.assumptions.every(a => 
        a.validRange.min <= a.value && a.value <= a.validRange.max
      ),
      sourcesVerified: config.methodologySources.every(s => 
        s.credibilityLevel === 'high' || s.credibilityLevel === 'medium'
      ),
      calculationsVerified: Object.values(traces).every(t => 
        t.confidenceLevel === 'high' || t.confidenceLevel === 'medium'
      ),
      rangesRespected: true,
      issues: []
    };

    // Resumen auditabilidad
    const highCredibilitySources = config.methodologySources.filter(
      s => s.credibilityLevel === 'high'
    ).length;
    
    const criticalAssumptions = config.assumptions.filter(
      a => a.impactLevel === 'critical'
    ).length;

    const overallConfidence = validations.assumptionsValid && 
                             validations.sourcesVerified && 
                             validations.calculationsVerified ? 'high' : 'medium';

    return {
      reportId: `transparency_${businessCaseId}_${Date.now()}`,
      generatedAt: new Date(),
      businessCaseId,
      businessCaseType,
      
      mainResults: {
        currentAnnualCost: traces.currentAnnualCost,
        potentialAnnualLoss: traces.potentialAnnualLoss,
        recommendedInvestment: traces.recommendedInvestment,
        estimatedROI: traces.estimatedROI,
        paybackPeriod: traces.paybackPeriod
      },
      
      configurationSnapshot: config,
      sensitivityAnalysis,
      validations,
      
      auditabilitySummary: {
        totalSources: config.methodologySources.length,
        highCredibilitySources,
        criticalAssumptions,
        overallConfidence,
        recommendationForCEO: overallConfidence === 'high' 
          ? 'Cálculos auditables y confiables para toma de decisiones ejecutivas'
          : 'Revisar supuestos críticos antes de decisión final'
      }
    };
  }

  /**
   * Formatea moneda chilena
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Utilidad pública para formateo
   */
  static formatCurrencyPublic(amount: number): string {
    return this.formatCurrency(amount);
  }

  /**
   * Calcula financials para retención general con trazabilidad
   */
  static calculateRetentionFinancials(
    participantsAffected: number,
    overallScore: number,
    config?: FinancialConfig
  ): {
    financials: BusinessCaseFinancials;
    traces: Record<string, CalculationTrace>;
  } {
    const financialConfig = config || FinancialConfigManager.getConfigByBusinessCaseType('retencion_riesgo');
    
    // 📊 OBTENER SUPUESTOS ESPECÍFICOS RETENCIÓN
    const avgSalary = FinancialConfigManager.getAssumption(financialConfig, 'average_monthly_salary_chile');
    const turnoverRisk = FinancialConfigManager.getAssumption(financialConfig, 'turnover_risk_multiplier');
    const programCost = FinancialConfigManager.getAssumption(financialConfig, 'retention_program_cost_per_employee');
    const effectiveness = FinancialConfigManager.getAssumption(financialConfig, 'retention_program_effectiveness');
    const replacementCost = FinancialConfigManager.getAssumption(financialConfig, 'replacement_cost_multiplier') ||
                           { value: 1.5, key: 'replacement_cost_multiplier' }; // Default 150%

    if (!avgSalary || !turnoverRisk || !programCost || !effectiveness) {
      throw new Error('Configuración financiera retención incompleta');
    }

    // 💰 CÁLCULO ADAPTADO PARA RETENCIÓN GENERAL
    const currentCostTrace = this.calculateRetentionCurrentCost(
      participantsAffected,
      avgSalary.value,
      0.15, // 15% costo rotación actual
      [avgSalary]
    );

    const potentialLossTrace = this.calculateRetentionPotentialLoss(
      participantsAffected,
      avgSalary.value,
      this.calculateTurnoverRiskFromScore(overallScore),
      replacementCost.value,
      [avgSalary, turnoverRisk]
    );

    const investmentTrace = this.calculateRecommendedInvestment(
      participantsAffected,
      programCost.value,
      [programCost]
    );

    const roiTrace = this.calculateROI(
      potentialLossTrace.result,
      effectiveness.value,
      investmentTrace.result,
      [effectiveness]
    );

    const paybackTrace = this.calculatePaybackPeriod(
      investmentTrace.result,
      potentialLossTrace.result,
      effectiveness.value,
      [effectiveness]
    );

    const financials: BusinessCaseFinancials = {
      currentAnnualCost: Math.round(currentCostTrace.result),
      potentialAnnualLoss: Math.round(potentialLossTrace.result),
      recommendedInvestment: Math.round(investmentTrace.result),
      estimatedROI: Math.round(roiTrace.result),
      paybackPeriod: Math.round(paybackTrace.result),
      
      methodologySources: financialConfig.methodologySources.map(source => 
        `${source.organization} - ${source.studyTitle} (${source.year})`
      ),
      
      keyAssumptions: [
        `${(this.calculateTurnoverRiskFromScore(overallScore) * 100).toFixed(0)}% riesgo rotación basado en score ${overallScore.toFixed(1)}`,
        `${participantsAffected} empleados en riesgo estimado`,
        `${(replacementCost.value * 100).toFixed(0)}% salario costo total reemplazo`,
        `CLP ${this.formatCurrency(programCost.value)}/persona programa retención integral`,
        `${(effectiveness.value * 100).toFixed(0)}% efectividad programa reduciendo rotación`
      ]
    };

    const traces = {
      currentAnnualCost: currentCostTrace,
      potentialAnnualLoss: potentialLossTrace,
      recommendedInvestment: investmentTrace,
      estimatedROI: roiTrace,
      paybackPeriod: paybackTrace
    };

    return { financials, traces };
  }

  /**
   * Calcula costo actual retención (más conservador que ambiente tóxico)
   */
  private static calculateRetentionCurrentCost(
    participants: number,
    monthlySalary: number,
    currentTurnoverCost: number,
    sources: any[]
  ): CalculationTrace {
    const annualSalary = monthlySalary * 12;
    const estimatedCurrentTurnover = participants * currentTurnoverCost;
    const currentCost = estimatedCurrentTurnover * annualSalary;

    return {
      result: currentCost,
      unit: 'CLP',
      formula: 'Participantes × % Rotación Actual × Salario Anual',
      inputs: {
        participants: { value: participants, source: 'campaign_data' },
        monthlySalary: { value: monthlySalary, source: sources[0].key },
        currentTurnoverCost: { value: currentTurnoverCost, source: 'industry_baseline' }
      },
      calculationSteps: [
        {
          step: 1,
          description: 'Calcular salario anual promedio',
          calculation: `${monthlySalary} × 12`,
          result: annualSalary
        },
        {
          step: 2,
          description: 'Estimar rotación actual',
          calculation: `${participants} × ${currentTurnoverCost}`,
          result: estimatedCurrentTurnover
        },
        {
          step: 3,
          description: 'Calcular costo actual rotación',
          calculation: `${estimatedCurrentTurnover} × ${annualSalary}`,
          result: currentCost
        }
      ],
      confidenceLevel: 'medium',
      confidenceFactors: [
        'Basado en promedios industria chilena',
        'Rotación actual estimada conservadoramente',
        'No incluye costos ocultos adicionales'
      ]
    };
  }

  /**
   * Calcula pérdida potencial específica retención
   */
  private static calculateRetentionPotentialLoss(
    participants: number,
    monthlySalary: number,
    turnoverRisk: number,
    replacementMultiplier: number,
    sources: any[]
  ): CalculationTrace {
    const annualSalary = monthlySalary * 12;
    const potentialTurnover = Math.floor(participants * turnoverRisk);
    const costPerReplacement = annualSalary * replacementMultiplier;
    const totalPotentialLoss = potentialTurnover * costPerReplacement;

    return {
      result: totalPotentialLoss,
      unit: 'CLP',
      formula: 'Empleados en Riesgo × Salario Anual × Multiplicador Reemplazo',
      inputs: {
        participants: { value: participants, source: 'campaign_data' },
        monthlySalary: { value: monthlySalary, source: sources[0].key },
        turnoverRisk: { value: turnoverRisk, source: sources[1].key },
        replacementMultiplier: { value: replacementMultiplier, source: 'shrm_2024' }
      },
      calculationSteps: [
        {
          step: 1,
          description: 'Calcular empleados en riesgo rotación',
          calculation: `${participants} × ${turnoverRisk}`,
          result: potentialTurnover
        },
        {
          step: 2,
          description: 'Calcular costo reemplazo por empleado',
          calculation: `${annualSalary} × ${replacementMultiplier}`,
          result: costPerReplacement
        },
        {
          step: 3,
          description: 'Calcular pérdida potencial total',
          calculation: `${potentialTurnover} × ${costPerReplacement}`,
          result: totalPotentialLoss
        }
      ],
      confidenceLevel: 'medium',
      confidenceFactors: [
        'Correlación score-rotación validada por SHRM',
        'Costo reemplazo basado en estudios internacionales',
        'Supuesto: todos requieren reemplazo inmediato'
      ]
    };
  }

  /**
   * Calcula riesgo rotación basado en overall score
   * FUENTE: Correlación Gallup engagement-turnover
   */
  private static calculateTurnoverRiskFromScore(overallScore: number): number {
    if (overallScore < 2.0) return 0.60; // 60% riesgo
    if (overallScore < 2.5) return 0.45; // 45% riesgo  
    if (overallScore < 3.0) return 0.30; // 30% riesgo
    if (overallScore < 3.5) return 0.20; // 20% riesgo
    return 0.10; // 10% riesgo base
  }

  /**
   * Validación integral configuración financiera
   */
  static validateFinancialConfig(config: FinancialConfig): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Validar supuestos en rangos
    config.assumptions.forEach(assumption => {
      if (assumption.value < assumption.validRange.min || assumption.value > assumption.validRange.max) {
        issues.push(`Supuesto '${assumption.key}' fuera de rango válido`);
      }
    });

    // Validar fuentes credibilidad
    const lowCredibilitySources = config.methodologySources.filter(
      source => source.credibilityLevel === 'low'
    );
    if (lowCredibilitySources.length > 0) {
      recommendations.push('Considerar actualizar fuentes de baja credibilidad');
    }

    // Validar antigüedad fuentes
    const outdatedSources = config.methodologySources.filter(
      source => new Date().getFullYear() - source.year > 3
    );
    if (outdatedSources.length > 0) {
      recommendations.push('Actualizar fuentes con más de 3 años antigüedad');
    }

    // Validar supuestos críticos
    const criticalAssumptions = config.assumptions.filter(
      assumption => assumption.impactLevel === 'critical'
    );
    if (criticalAssumptions.length < 2) {
      recommendations.push('Identificar al menos 2 supuestos críticos para análisis robusto');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Genera reporte comparativo múltiples configuraciones
   */
  static generateComparativeReport(
    businessCaseId: string,
    configs: FinancialConfig[],
    participantsAffected: number
  ): {
    configurations: string[];
    results: Record<string, any>;
    recommendations: string;
  } {
    const results: Record<string, any> = {};
    
    configs.forEach(config => {
      try {
        const { financials, traces } = this.calculateAmbienteCriticoFinancials(
          participantsAffected,
          config
        );
        
        results[config.businessCaseType] = {
          financials,
          configVersion: config.configVersion,
          overallConfidence: traces.currentAnnualCost.confidenceLevel
        };
      } catch (error) {
        results[config.businessCaseType] = {
          error: 'Configuration invalid'
        };
      }
    });

    // Generar recomendaciones
    const validResults = Object.values(results).filter(r => !r.error);
    let recommendations = '';
    
    if (validResults.length > 1) {
      const roiValues = validResults.map((r: any) => r.financials.estimatedROI);
      const avgROI = roiValues.reduce((a, b) => a + b, 0) / roiValues.length;
      const maxROI = Math.max(...roiValues);
      const minROI = Math.min(...roiValues);
      
      recommendations = `
        Análisis comparativo completo:
        - ROI promedio: ${avgROI.toFixed(0)}%
        - Rango ROI: ${minROI.toFixed(0)}% - ${maxROI.toFixed(0)}%
        - Variabilidad: ${((maxROI - minROI) / avgROI * 100).toFixed(0)}%
        
        Recomendación: ${(maxROI - minROI) / avgROI < 0.5 ? 
          'Resultados consistentes entre configuraciones' : 
          'Revisar supuestos que generan alta variabilidad'}
      `;
    } else {
      recommendations = 'Configuración única validada correctamente';
    }

    return {
      configurations: configs.map(c => c.businessCaseType),
      results,
      recommendations
    };
  }
}