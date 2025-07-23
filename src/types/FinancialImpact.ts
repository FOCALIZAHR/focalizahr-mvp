/**
 * FocalizaHR - Tipos Transparencia Financiera Enterprise
 * Interfaces para casos de negocio auditables CEO/CFO ready
 */

export interface FinancialSource {
  organization: string;
  study_name: string;
  publication_year: number;
  url?: string;
  sample_size?: string;
  geographic_scope?: string;
  confidence_level?: string;
  peer_reviewed: boolean;
  credibility_tier: 'tier_1' | 'tier_2' | 'tier_3';
}

export interface CalculationStep {
  step_number: number;
  description: string;
  formula?: string;
  input_values: Record<string, number | string>;
  result_value: number;
  result_unit: 'CLP' | 'USD' | 'percentage' | 'ratio' | 'count';
}

export interface FinancialAssumption {
  category: 'turnover_costs' | 'training_costs' | 'leadership_impact' | 'environment_impact' | 'engagement_roi';
  metric_name: string;
  value_range: {
    minimum: number;
    maximum: number;
    recommended: number;
  };
  currency: 'CLP' | 'USD';
  measurement_unit: 'percentage_salary' | 'absolute_amount' | 'percentage' | 'multiplier';
  source: FinancialSource;
  geographical_adjustment?: {
    chile_factor: number;
    ppp_adjusted: boolean;
    local_market_validation: boolean;
  };
  last_updated: string;
  notes?: string;
}

export interface TransparencyAuditTrail {
  calculation_id: string;
  methodology_version: string;
  input_parameters: Record<string, any>;
  assumptions_used: FinancialAssumption[];
  calculation_steps: CalculationStep[];
  sensitivity_analysis?: {
    parameter: string;
    variations: Array<{
      change_percentage: number;
      result_impact: number;
    }>;
  };
  confidence_assessment: {
    overall_confidence: number; // 0-1
    confidence_factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }>;
  };
  generated_at: string;
  auditable_by: 'ceo' | 'cfo' | 'finance_team' | 'external_auditor';
}

export interface FinancialImpactScenario {
  scenario_id: string;
  scenario_name: string;
  scenario_type: 'critical_risk' | 'improvement_opportunity' | 'champion_replication' | 'cost_avoidance';
  
  current_state: {
    annual_cost_clp: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    confidence_level: number;
    impact_timeline: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  };
  
  target_state: {
    annual_cost_clp: number;
    annual_savings_clp: number;
    roi_percentage: number;
    payback_period_months: number;
  };
  
  intervention_required: {
    description: string;
    estimated_investment_clp: number;
    implementation_timeline: string;
    success_probability: number;
    key_success_factors: string[];
  };
  
  audit_trail: TransparencyAuditTrail;
}

export interface BusinessCaseFinancials {
  business_case_id: string;
  title: string;
  executive_summary: string;
  
  financial_summary: {
    total_at_risk_clp: number;
    total_opportunity_clp: number;
    net_annual_impact_clp: number;
    roi_percentage: number;
    payback_period_months: number;
    confidence_level: 'high' | 'medium' | 'low';
  };
  
  scenarios: FinancialImpactScenario[];
  
  methodology: {
    approach_summary: string;
    sources_count: number;
    primary_sources: FinancialSource[];
    assumptions_documented: number;
    calculations_auditable: boolean;
  };
  
  executive_recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    financial_impact_clp: number;
    implementation_effort: 'low' | 'medium' | 'high';
    risk_level: 'low' | 'medium' | 'high';
  }>;
  
  approval_readiness: {
    ceo_ready: boolean;
    cfo_ready: boolean;
    board_ready: boolean;
    external_audit_ready: boolean;
    compliance_notes: string[];
  };
  
  generated_at: string;
  valid_until: string;
}

export interface ChileanMarketAdjustments {
  currency_conversion: {
    usd_to_clp_rate: number;
    rate_date: string;
    source: string;
  };
  
  economic_factors: {
    gdp_per_capita_ratio_vs_usa: number;
    salary_inflation_annual: number;
    labor_market_tightness: 'tight' | 'balanced' | 'loose';
  };
  
  sector_salaries: Record<string, {
    average_monthly_clp: number;
    salary_range: {
      p25: number;
      p50: number;
      p75: number;
      p90: number;
    };
    source: string;
    last_updated: string;
  }>;
  
  regulatory_considerations: {
    labor_law_compliance: string[];
    taxation_impact: number;
    social_security_costs: number;
  };
}

export interface FinancialTransparencyReport {
  report_id: string;
  report_type: 'executive_summary' | 'detailed_methodology' | 'audit_compliance' | 'source_validation';
  
  executive_summary: {
    total_assumptions: number;
    total_sources: number;
    methodology_version: string;
    last_methodology_update: string;
    compliance_status: 'fully_compliant' | 'minor_gaps' | 'major_gaps';
  };
  
  source_analysis: {
    tier_1_sources: number; // SHRM, McKinsey, Gallup, etc.
    tier_2_sources: number; // Industry associations, regional studies
    tier_3_sources: number; // Company-specific, limited scope
    peer_reviewed_percentage: number;
    average_study_year: number;
    geographic_coverage: string[];
  };
  
  methodology_strength: {
    calculation_auditability: 'full' | 'partial' | 'limited';
    assumption_transparency: 'complete' | 'mostly_complete' | 'partial';
    sensitivity_analysis: 'included' | 'partial' | 'not_included';
    confidence_intervals: 'provided' | 'estimated' | 'not_provided';
  };
  
  compliance_checklist: Array<{
    requirement: string;
    status: 'compliant' | 'partial' | 'non_compliant';
    evidence: string;
    remediation_needed?: string;
  }>;
  
  generated_for: 'internal_audit' | 'external_audit' | 'board_presentation' | 'regulatory_submission';
  generated_at: string;
}

// Tipos helper para componentes UI
export interface FinancialDisplayProps {
  amount_clp: number;
  show_confidence?: boolean;
  confidence_level?: number;
  show_methodology_link?: boolean;
  currency_format?: 'compact' | 'full' | 'millions';
  audit_trail_available?: boolean;
}

export interface ROIDisplayProps extends FinancialDisplayProps {
  roi_percentage: number;
  payback_months: number;
  risk_adjusted?: boolean;
}

export interface SourceCredibilityBadgeProps {
  source: FinancialSource;
  show_details?: boolean;
  compact_mode?: boolean;
}

// Tipos para integración con RetentionEngine
export interface RetentionEngineFinancialInput {
  team_size: number;
  average_salary_clp: number;
  current_scores: {
    ambiente: number;
    liderazgo: number;
    desarrollo: number;
    bienestar: number;
  };
  industry_sector?: string;
  company_size_category?: 'startup' | 'pyme' | 'enterprise';
  turnover_risk_indicators?: {
    historical_turnover_rate?: number;
    engagement_trends?: 'improving' | 'stable' | 'declining';
    market_competition?: 'low' | 'medium' | 'high';
  };
}

export interface RetentionEngineFinancialOutput {
  business_case: BusinessCaseFinancials;
  executive_summary: string;
  priority_actions: Array<{
    action: string;
    financial_impact_clp: number;
    urgency: 'immediate' | 'short_term' | 'medium_term';
    effort_required: 'low' | 'medium' | 'high';
  }>;
  transparency_summary: {
    sources_used: number;
    confidence_overall: number;
    methodology_strength: 'high' | 'medium' | 'low';
    audit_ready: boolean;
  };
}

/**
 * EXPORT TYPES PRINCIPALES
 */
export type {
  FinancialSource,
  CalculationStep,
  FinancialAssumption,
  TransparencyAuditTrail,
  FinancialImpactScenario,
  BusinessCaseFinancials,
  ChileanMarketAdjustments,
  FinancialTransparencyReport,
  FinancialDisplayProps,
  ROIDisplayProps,
  SourceCredibilityBadgeProps,
  RetentionEngineFinancialInput,
  RetentionEngineFinancialOutput
};

// Constantes para validación
export const FINANCIAL_CONSTANTS = {
  MIN_CONFIDENCE_LEVEL: 0.5,
  HIGH_CONFIDENCE_THRESHOLD: 0.8,
  MAX_PAYBACK_PERIOD_MONTHS: 36,
  MIN_ROI_PERCENTAGE: 10,
  CURRENCY_PRECISION_DECIMALS: 0,
  PERCENTAGE_PRECISION_DECIMALS: 1
} as const;

// Enums para tipos específicos
export enum ConfidenceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ScenarioType {
  CRITICAL_RISK = 'critical_risk',
  IMPROVEMENT_OPPORTUNITY = 'improvement_opportunity',
  CHAMPION_REPLICATION = 'champion_replication',
  COST_AVOIDANCE = 'cost_avoidance'
}

export default {
  FINANCIAL_CONSTANTS,
  ConfidenceLevel,
  RiskLevel,
  ScenarioType
};