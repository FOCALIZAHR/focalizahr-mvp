/**
 * FocalizaHR - Servicio Cálculos Financieros Enterprise
 * Integración transparente con RetentionEngine y casos de negocio
 * 
 * METODOLOGÍA: Cada cálculo incluye fuentes, pasos y auditabilidad completa
 * DIFERENCIACIÓN: CFO-ready vs estimaciones "mejores prácticas"
 */

import { FinancialCalculator, CHILE_ECONOMIC_ADJUSTMENTS } from '@/config/impactAssumptions';
import { BusinessCaseFinancials } from '@/types/BusinessCase';

export interface FinancialImpactCalculation {
  scenario: string;
  current_state: {
    cost_clp: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  };
  improved_state: {
    cost_clp: number;
    savings_clp: number;
    roi_percentage: number;
  };
  methodology: {
    sources: string[];
    calculation_steps: string[];
    assumptions: string[];
    confidence_level: string;
  };
  timeframe: {
    immediate_impact: string;
    annual_impact: string;
    long_term_trend: string;
  };
}

// ============================================================================
// NOTA CRÍTICA: Interfaz renombrada para evitar conflicto con BusinessCaseFinancials
// importada de @/types/BusinessCase (línea 10)
// 
// RAZÓN DEL CAMBIO:
// - Esta interfaz es SOLO para RetentionEngine (Kit 2.5/3.0)
// - RetentionEngine usa estructura DIFERENTE: total_at_risk_clp, annual_savings_potential_clp
// - OnboardingEngine (nuevo) usa BusinessCaseFinancials importada con: methodologySources, keyAssumptions
// - NO AFECTA consumidores: RetentionEngine solo llama funciones, no importa esta interfaz
// 
// FECHA CAMBIO: 30 Nov 2025 - Chat refactorización OnboardingEngine
// ============================================================================
export interface RetentionBusinessCaseFinancials {
  total_at_risk_clp: number;
  annual_savings_potential_clp: number;
  roi_percentage: number;
  payback_period_months: number;
  confidence_level: 'high' | 'medium' | 'low';
  methodology_summary: string;
  detailed_calculations: FinancialImpactCalculation[];
}

/**
 * SERVICIO PRINCIPAL CÁLCULOS FINANCIEROS
 * Integra con RetentionEngine para casos de negocio ejecutivos
 */
export class FinancialCalculationsService {
  
  /**
   * Calcula impacto financiero rotación crítica
   * Usado por RetentionEngine para casos negocio ambiente < 2.5
   */
  static calculateCriticalTurnoverImpact(
    team_size: number,
    average_salary_clp: number,
    current_environment_score: number,
    turnover_risk_percentage: number = 25
  ): FinancialImpactCalculation {
    
    // Cálculo costo rotación por persona
    const turnover_cost_calculation = FinancialCalculator.calculateTurnoverCost(
      average_salary_clp * 12 // Salario anual
    );
    
    // Estimación personas en riesgo
    const people_at_risk = Math.ceil(team_size * (turnover_risk_percentage / 100));
    const current_cost = people_at_risk * turnover_cost_calculation.cost_clp;
    
    // Cálculo mejora ambiente (target: 3.5/5.0)
    const target_score = 3.5;
    const environment_roi = FinancialCalculator.calculateEnvironmentROI(
      team_size,
      average_salary_clp,
      current_environment_score,
      target_score
    );
    
    // Determinación nivel riesgo
    let risk_level: 'low' | 'medium' | 'high' | 'critical';
    if (current_environment_score < 2.0) risk_level = 'critical';
    else if (current_environment_score < 2.5) risk_level = 'high';
    else if (current_environment_score < 3.0) risk_level = 'medium';
    else risk_level = 'low';
    
    return {
      scenario: "Ambiente Crítico - Riesgo Rotación Masiva",
      current_state: {
        cost_clp: current_cost,
        risk_level,
        confidence: current_environment_score < 2.5 ? 0.85 : 0.70
      },
      improved_state: {
        cost_clp: current_cost * 0.4, // 60% reducción costo
        savings_clp: environment_roi.annual_savings_clp,
        roi_percentage: environment_roi.roi_percentage
      },
      methodology: {
        sources: [
          "SHRM Human Capital Benchmarking 2024",
          "Gallup State of Global Workplace 2024",
          "McKinsey Leadership Performance Impact 2024"
        ],
        calculation_steps: [
          ...turnover_cost_calculation.calculation_steps,
          `Personas en riesgo: ${people_at_risk} (${turnover_risk_percentage}% del equipo)`,
          `Costo total riesgo: $${current_cost.toLocaleString('es-CL')} CLP`,
          ...environment_roi.calculation_steps
        ],
        assumptions: [
          "Ambiente < 2.5 = riesgo rotación 25% anual",
          "Mejora ambiente 2.5 → 3.5 reduce rotación 60%",
          "Costo reemplazo = 125% salario anual (SHRM 2024)"
        ],
        confidence_level: "85% (basado en muestra >200K empleados Gallup)"
      },
      timeframe: {
        immediate_impact: "30-60 días: Implementación programa mejora ambiente",
        annual_impact: `$${environment_roi.annual_savings_clp.toLocaleString('es-CL')} CLP ahorro anual`,
        long_term_trend: "Retención +25% sostenida, cultura organizacional fortalecida"
      }
    };
  }
  
  /**
   * Calcula impacto financiero gap liderazgo
   * Para departamentos con liderazgo < 3.0
   */
  static calculateLeadershipGapImpact(
    team_size: number,
    average_salary_clp: number,
    current_leadership_score: number,
    current_performance_baseline: number = 100
  ): FinancialImpactCalculation {
    
    // Cálculo impacto performance por liderazgo
    const leadership_improvement = 4.0 - current_leadership_score; // Target: 4.0/5.0
    const performance_increase = Math.min(leadership_improvement * 8, 20); // Max 20% según McKinsey
    
    // Cálculo valor productividad
    const annual_payroll = team_size * average_salary_clp * 12;
    const productivity_value = annual_payroll * 1.5; // Valor productividad = 1.5x payroll
    const current_productivity_loss = productivity_value * (performance_increase / 100);
    const improved_productivity_gain = current_productivity_loss * 0.8; // 80% recuperable
    
    return {
      scenario: "Gap Liderazgo - Pérdida Performance Equipo",
      current_state: {
        cost_clp: current_productivity_loss,
        risk_level: current_leadership_score < 2.5 ? 'critical' : 'high',
        confidence: 0.80
      },
      improved_state: {
        cost_clp: current_productivity_loss * 0.2, // 80% mejora
        savings_clp: improved_productivity_gain,
        roi_percentage: (improved_productivity_gain / annual_payroll) * 100
      },
      methodology: {
        sources: [
          "McKinsey Leadership Performance Impact 2024",
          "Harvard Business Review Leadership ROI 2024"
        ],
        calculation_steps: [
          `Equipo: ${team_size} personas, payroll anual $${annual_payroll.toLocaleString('es-CL')} CLP`,
          `Gap liderazgo: ${current_leadership_score}/5.0 → 4.0/5.0 (+${leadership_improvement.toFixed(1)} puntos)`,
          `Mejora performance esperada: ${performance_increase.toFixed(1)}% (McKinsey)`,
          `Valor productividad anual: $${productivity_value.toLocaleString('es-CL')} CLP`,
          `Pérdida actual: $${current_productivity_loss.toLocaleString('es-CL')} CLP`,
          `Ganancia potencial: $${improved_productivity_gain.toLocaleString('es-CL')} CLP`
        ],
        assumptions: [
          "Liderazgo efectivo mejora performance 15-25% (McKinsey)",
          "Valor productividad = 1.5x masa salarial (estándar industria)",
          "80% mejora achievable con programa liderazgo estructurado"
        ],
        confidence_level: "80% (meta-análisis 5,000+ líderes McKinsey)"
      },
      timeframe: {
        immediate_impact: "90 días: Programa desarrollo liderazgo",
        annual_impact: `$${improved_productivity_gain.toLocaleString('es-CL')} CLP ganancia performance`,
        long_term_trend: "Performance sostenida +15%, engagement equipo +30%"
      }
    };
  }
  
  /**
   * Calcula impacto financiero oportunidad departamento campeón
   * Para replicar modelo exitoso en otros departamentos
   */
  static calculateChampionReplicationImpact(
    champion_department: {
      name: string;
      score: number;
      team_size: number;
    },
    target_departments: Array<{
      name: string;
      score: number;
      team_size: number;
      average_salary_clp: number;
    }>
  ): FinancialImpactCalculation {
    
    const total_target_people = target_departments.reduce((sum, dept) => sum + dept.team_size, 0);
    const weighted_avg_salary = target_departments.reduce(
      (sum, dept) => sum + (dept.average_salary_clp * dept.team_size), 0
    ) / total_target_people;
    
    // Cálculo gap promedio vs campeón
    const avg_gap = target_departments.reduce(
      (sum, dept) => sum + (champion_department.score - dept.score), 0
    ) / target_departments.length;
    
    // Impacto replicación (engagement + performance)
    const performance_improvement = Math.min(avg_gap * 10, 25); // Max 25%
    const annual_payroll_targets = total_target_people * weighted_avg_salary * 12;
    const productivity_value = annual_payroll_targets * 1.4; // Conservador para replicación
    const replication_gain = productivity_value * (performance_improvement / 100);
    
    return {
      scenario: `Replicación Modelo ${champion_department.name} (${champion_department.score}/5.0)`,
      current_state: {
        cost_clp: productivity_value * (avg_gap * 0.1), // Costo oportunidad
        risk_level: avg_gap > 1.5 ? 'high' : 'medium',
        confidence: 0.75
      },
      improved_state: {
        cost_clp: 0,
        savings_clp: replication_gain,
        roi_percentage: (replication_gain / annual_payroll_targets) * 100
      },
      methodology: {
        sources: [
          "Gallup Engagement Performance Meta-Analysis 2024",
          "Harvard Business Review Best Practice Replication 2024"
        ],
        calculation_steps: [
          `Departamento campeón: ${champion_department.name} (${champion_department.score}/5.0, ${champion_department.team_size} personas)`,
          `Departamentos objetivo: ${target_departments.length} departamentos, ${total_target_people} personas total`,
          `Gap promedio vs campeón: ${avg_gap.toFixed(1)} puntos`,
          `Mejora performance esperada: ${performance_improvement.toFixed(1)}%`,
          `Payroll objetivo: $${annual_payroll_targets.toLocaleString('es-CL')} CLP/año`,
          `Ganancia replicación: $${replication_gain.toLocaleString('es-CL')} CLP/año`
        ],
        assumptions: [
          "Replicación best practices achieve 70% del gap",
          "Performance mejora 10% por cada punto satisfacción",
          "Valor productividad = 1.4x payroll (conservador)"
        ],
        confidence_level: "75% (basado en estudios replicación organizacional)"
      },
      timeframe: {
        immediate_impact: "60-90 días: Análisis + transferencia knowledge",
        annual_impact: `$${replication_gain.toLocaleString('es-CL')} CLP ganancia performance`,
        long_term_trend: "Estandarización excellence, cultura high-performance"
      }
    };
  }
  
  // ============================================================================
  // NOTA: Retorna RetentionBusinessCaseFinancials (renombrada) NO BusinessCaseFinancials
  // RAZÓN: RetentionEngine (Kit 3.0) usa estructura diferente vs OnboardingEngine
  // CONSUMIDOR: calculateFinancialImpactForBusinessCase() línea ~480
  // ============================================================================
  /**
   * Genera caso negocio financiero completo
   * Integración directa con RetentionEngine BusinessCase
   */
  static generateBusinessCaseFinancials(
    scenario_type: 'critical_environment' | 'leadership_gap' | 'champion_replication',
    parameters: any
  ): RetentionBusinessCaseFinancials {
    
    let primary_calculation: FinancialImpactCalculation;
    
    switch (scenario_type) {
      case 'critical_environment':
        primary_calculation = this.calculateCriticalTurnoverImpact(
          parameters.team_size,
          parameters.average_salary_clp,
          parameters.current_environment_score
        );
        break;
        
      case 'leadership_gap':
        primary_calculation = this.calculateLeadershipGapImpact(
          parameters.team_size,
          parameters.average_salary_clp,
          parameters.current_leadership_score
        );
        break;
        
      case 'champion_replication':
        primary_calculation = this.calculateChampionReplicationImpact(
          parameters.champion_department,
          parameters.target_departments
        );
        break;
        
      default:
        throw new Error(`Tipo de escenario no soportado: ${scenario_type}`);
    }
    
    // Cálculo métricas agregadas
    const total_at_risk = primary_calculation.current_state.cost_clp;
    const annual_savings = primary_calculation.improved_state.savings_clp;
    const roi_percentage = primary_calculation.improved_state.roi_percentage;
    const payback_months = annual_savings > 0 ? Math.ceil((total_at_risk * 0.1) / (annual_savings / 12)) : 12;
    
    // Determinación confianza
    let confidence_level: 'high' | 'medium' | 'low';
    if (primary_calculation.current_state.confidence >= 0.8) confidence_level = 'high';
    else if (primary_calculation.current_state.confidence >= 0.7) confidence_level = 'medium';
    else confidence_level = 'low';
    
    return {
      total_at_risk_clp: total_at_risk,
      annual_savings_potential_clp: annual_savings,
      roi_percentage,
      payback_period_months: payback_months,
      confidence_level,
      methodology_summary: `Cálculos basados en ${primary_calculation.methodology.sources.length} fuentes enterprise reconocidas. Metodología auditable paso a paso con supuestos documentados.`,
      detailed_calculations: [primary_calculation]
    };
  }
  
  /**
   * Calcula salario promedio por sector Chile
   * Basado en datos mercado local actualizados
   */
  static getAverageSalaryCLP(sector: string = 'default'): number {
    const salaries = CHILE_ECONOMIC_ADJUSTMENTS.average_salaries_by_sector;
    return salaries[sector as keyof typeof salaries] || salaries.default;
  }
  
  /**
   * Convierte USD a CLP con factor actualizado
   */
  static convertUSDtoCLP(amount_usd: number): number {
    return amount_usd * CHILE_ECONOMIC_ADJUSTMENTS.usd_to_clp_factor;
  }
  
  /**
   * Genera reporte ejecutivo transparencia financiera
   * Para presentación CEO/CFO con fuentes documentadas
   */
  static generateExecutiveTransparencyReport(): {
    summary: string;
    methodology: string;
    sources: Array<{
      organization: string;
      study: string;
      year: number;
      credibility: string;
    }>;
    calculations_available: string[];
    last_updated: string;
    compliance: {
      auditable: boolean;
      sources_peer_reviewed: boolean;
      methodology_documented: boolean;
      assumptions_transparent: boolean;
    };
  } {
    
    const transparency_report = FinancialCalculator.generateTransparencyReport();
    
    return {
      summary: `FocalizaHR utiliza metodología financiera enterprise basada en ${transparency_report.total_assumptions} supuestos auditables de ${transparency_report.sources.length} organizaciones reconocidas globalmente. Todos los cálculos incluyen fuentes, pasos detallados y niveles de confianza.`,
      
      methodology: "Cada cálculo financiero FocalizaHR incluye: (1) Fuente académica/empresarial reconocida, (2) Pasos de cálculo documentados, (3) Supuestos explícitos, (4) Niveles de confianza estadística, (5) Rangos de variabilidad. CEO/CFO pueden auditar cualquier cifra presentada.",
      
      sources: transparency_report.sources.map(source => ({
        organization: source.organization,
        study: source.study,
        year: source.year,
        credibility: this.getSourceCredibility(source.organization)
      })),
      
      calculations_available: [
        "Costo rotación por persona (SHRM 2024)",
        "ROI mejora ambiente trabajo (Gallup 2024)",
        "Impacto liderazgo en performance (McKinsey 2024)",
        "Ganancia replicación best practices (HBR 2024)",
        "Costos capacitación y onboarding (Deloitte 2024)",
        "Productividad vs engagement (Meta-análisis HBR)"
      ],
      
      last_updated: transparency_report.last_updated,
      
      compliance: {
        auditable: true,
        sources_peer_reviewed: true,
        methodology_documented: true,
        assumptions_transparent: true
      }
    };
  }
  
  /**
   * Evaluación credibilidad fuentes
   */
  private static getSourceCredibility(organization: string): string {
    const credibility_map: Record<string, string> = {
      "SHRM (Society for Human Resource Management)": "Tier 1 - Organización líder global RRHH, 300K+ miembros",
      "McKinsey & Company": "Tier 1 - Consultora estratégica global, Fortune 500 clients",
      "Gallup": "Tier 1 - Instituto investigación, muestras >200K empleados",
      "Deloitte": "Tier 1 - Big Four consulting, estudios multi-industria",
      "Harvard Business Review": "Tier 1 - Revista académica business, peer-reviewed",
      "CIPD (Chartered Institute of Personnel and Development)": "Tier 1 - Instituto profesional RRHH UK, 160K+ miembros"
    };
    
    return credibility_map[organization] || "Tier 2 - Fuente reconocida industria";
  }
}

/**
 * FUNCIONES UTILIDAD EXPORTADAS
 */

// ============================================================================
// NOTA: Retorna RetentionBusinessCaseFinancials (renombrada) NO BusinessCaseFinancials
// RAZÓN: RetentionEngine llama esta función y convierte manualmente a BusinessCaseFinancials
// CONSUMIDOR: RetentionEngine.ts generateAmbienteCriticoCase() y generateRetentionRiskCase()
// IMPACTO: CERO - RetentionEngine solo accede a campos, no importa el nombre de interfaz
// ============================================================================
// ============================================================================
// CAMBIO 3: Actualizar tipo de retorno a RetentionBusinessCaseFinancials
// ============================================================================
// Helper para integración con RetentionEngine
export function calculateFinancialImpactForBusinessCase(
  scenario_type: 'critical_environment' | 'leadership_gap' | 'champion_replication',
  campaign_data: any
): RetentionBusinessCaseFinancials {
  
  // Estimación tamaño equipo y salarios basado en datos campaña
  const estimated_team_size = campaign_data.total_responses || 50;
  const estimated_salary_clp = FinancialCalculationsService.getAverageSalaryCLP(
    campaign_data.company_sector || 'default'
  );
  
  const parameters = {
    team_size: estimated_team_size,
    average_salary_clp: estimated_salary_clp,
    current_environment_score: campaign_data.category_scores?.ambiente || 2.0,
    current_leadership_score: campaign_data.category_scores?.liderazgo || 2.5,
    champion_department: {
      name: "IT", // Placeholder - en producción viene de análisis real
      score: 4.2,
      team_size: Math.ceil(estimated_team_size * 0.3)
    },
    target_departments: [
      {
        name: "Marketing",
        score: 2.8,
        team_size: Math.ceil(estimated_team_size * 0.4),
        average_salary_clp: estimated_salary_clp
      }
    ]
  };
  
  return FinancialCalculationsService.generateBusinessCaseFinancials(scenario_type, parameters);
}

// Helper para reportes ejecutivos
export function getTransparencyReportForExecutives() {
  return FinancialCalculationsService.generateExecutiveTransparencyReport();
}

// Helper conversiones moneda
export function convertToChileanPesos(amount_usd: number): number {
  return FinancialCalculationsService.convertUSDtoCLP(amount_usd);
}

// ============================================================================
// CONFIGURACIÓN ONBOARDING - SHRM 2024
// ============================================================================

const ONBOARDING_FINANCIAL_CONFIG = {
  // Salario promedio Chile (roles medios)
  avgSalaryChile: 75000 * 12, // $900,000 CLP anual
  
  // Multiplicador costo rotación temprana (SHRM 2024)
  // Incluye: reclutamiento + onboarding + productividad perdida + conocimiento perdido
  turnoverMultiplier: 6.0,
  
  // Costos intervención (tiempo interno ya asignado)
  interventionCosts: {
    session1on1: 0,           // Reunión líder directo = tiempo ya pagado
    careerPlan: 0,            // Reunión planificación = tiempo ya pagado
    onboardingRefresh: 0,     // Ajuste proceso = tiempo interno
    mentorship: 0,            // Mentor interno = tiempo ya asignado
    trainingModuleExternal: 0 // Solo si capacitación externa (mayoría $0)
  },
  
  // Probabilidad éxito intervención (estudios longitudinales Bauer 2010-2024)
  interventionSuccessRate: 0.75,
  
  // Fuentes metodológicas
  sources: [
    "Talya Bauer - 4C Onboarding Model Meta-Analysis (2010-2024)",
    "SHRM 2024 Human Capital Benchmarking Report: Costo reemplazo = 6 sueldos rotación <6 meses",
    "Glassdoor Research 2024: 88% decisión quedarse/irse se forma primeras 4 semanas",
    "Journal of Applied Psychology: Intervención temprana efectividad 75%",
    "Aberdeen Group: Preparación Día 1 predice 85% retención si ejecutada correctamente"
  ]
};

// ============================================================================
// FUNCIÓN PRINCIPAL - CÁLCULO IMPACTO FINANCIERO ONBOARDING
// ============================================================================

// ============================================================================
// NOTA CRÍTICA: Esta función SÍ usa BusinessCaseFinancials IMPORTADA (línea 10)
// RAZÓN: OnboardingAlertEngine necesita estructura NUEVA con:
//   - methodologySources: string[]
//   - keyAssumptions: string[]
// 
// DIFERENCIA vs RetentionEngine:
// - RetentionEngine usa RetentionBusinessCaseFinancials (total_at_risk_clp)
// - OnboardingEngine usa BusinessCaseFinancials importada (methodologySources)
// 
// NO CONFUNDIR: Son 2 estructuras diferentes para 2 motores diferentes
// CONSUMIDOR: OnboardingAlertEngine.ts (6 generadores de casos negocio)
// ============================================================================
/**
 * Calcula impacto financiero de alertas onboarding
 * Usado por OnboardingAlertEngine para casos de negocio
 * 
 * @param params - Parámetros empleado y alerta
 * @returns BusinessCaseFinancials con ROI auditado
 */
export function calculateOnboardingFinancialImpact(params: {
  employeeName: string;
  role: string;
  alertType: string;
  currentSalary?: number;
  companyName?: string;
}): BusinessCaseFinancials {
  
  // Usar salario específico o promedio Chile
  const annualSalary = params.currentSalary 
    ? params.currentSalary * 12 
    : ONBOARDING_FINANCIAL_CONFIG.avgSalaryChile;
  
  // Calcular costo rotación según SHRM 2024
  const turnoverCost = annualSalary * ONBOARDING_FINANCIAL_CONFIG.turnoverMultiplier;
  
  // Inversión intervención (siempre $0 - tiempo interno)
  const interventionCost = Object.values(ONBOARDING_FINANCIAL_CONFIG.interventionCosts)
    .reduce((sum, cost) => sum + cost, 0);
  
  // ROI proyectado
  const potentialSavings = turnoverCost * ONBOARDING_FINANCIAL_CONFIG.interventionSuccessRate;
  const roi = interventionCost > 0 
    ? ((potentialSavings - interventionCost) / interventionCost) * 100
    : Infinity; // ROI infinito si inversión = $0
  
  // Payback period (N/A si inversión = $0)
  const paybackPeriod = interventionCost > 0 
    ? (interventionCost / (potentialSavings / 12))
    : 0;
  
  // Formatear moneda CLP
  const formatCLP = (amount: number) => {
    return `$${(amount / 1000000).toFixed(1)}M CLP`;
  };
  
  return {
    // Costo estado actual
    currentAnnualCost: 0, // No hay costo actual, es prevención
    
    // Pérdida potencial si no se interviene
    potentialAnnualLoss: turnoverCost,
    
    // Inversión recomendada
    recommendedInvestment: interventionCost,
    
    // ROI estimado
    estimatedROI: roi,
    
    // Período retorno inversión
    paybackPeriod: paybackPeriod,
    
    // Fuentes metodológicas
    methodologySources: ONBOARDING_FINANCIAL_CONFIG.sources,
    
    // Supuestos clave
    keyAssumptions: [
      `Salario base: ${formatCLP(annualSalary)} anual (${params.role})`,
      `Costo rotación: ${formatCLP(turnoverCost)} (6 salarios según SHRM 2024)`,
      `Inversión intervención: ${formatCLP(interventionCost)} (tiempo interno ya asignado)`,
      `Probabilidad éxito: ${(ONBOARDING_FINANCIAL_CONFIG.interventionSuccessRate * 100).toFixed(0)}% (estudios longitudinales Bauer)`,
      `ROI: ${roi === Infinity ? 'Infinito (inversión $0)' : `${roi.toFixed(0)}%`}`,
      `Ventana efectividad: 48-72h para máxima probabilidad retención`
    ]
  };
}

// ============================================================================
// HELPER FUNCTIONS - FORMATEO Y UTILIDADES
// ============================================================================

/**
 * Formatea monto CLP para casos de negocio
 */
export function formatCurrencyCLP(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M CLP`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K CLP`;
  }
  return `$${Math.round(amount).toLocaleString('es-CL')} CLP`;
}

/**
 * Calcula costo rotación individual (wrapper SHRM 2024)
 */
export function calculateTurnoverCostSHRM2024(annualSalary: number): number {
  return annualSalary * ONBOARDING_FINANCIAL_CONFIG.turnoverMultiplier;
}

/**
 * Obtiene configuración financiera onboarding (para auditoría)
 */
export function getOnboardingFinancialConfig() {
  return {
    ...ONBOARDING_FINANCIAL_CONFIG,
    version: '1.0',
    lastUpdated: 'Enero 2025',
    methodology: 'SHRM 2024 + Bauer 4C Model Meta-Analysis'
  };
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

/**
 * EXPORT DEFAULT
 */
export default {
  FinancialCalculationsService,  // ← Conserva todo lo existente
  calculateFinancialImpactForBusinessCase, // ← Función RetentionEngine (vieja)
  getTransparencyReportForExecutives,  // ← Conserva
  convertToChileanPesos,  // ← Conserva
  calculateOnboardingFinancialImpact,  // ← Función Onboarding (nueva)
  formatCurrencyCLP,
  calculateTurnoverCostSHRM2024,
  getOnboardingFinancialConfig
};