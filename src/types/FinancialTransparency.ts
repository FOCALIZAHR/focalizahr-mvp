// src/types/FinancialTransparency.ts
// 🎯 FOCALIZAHR - CHAT 6C: FINANCIAL TRANSPARENCY TYPES
// Interfaces para transparencia financiera auditable CEO/CFO level

/**
 * Fuente metodológica con credenciales auditables
 */
export interface MethodologySource {
  /** Nombre organización (ej: SHRM, Gallup) */
  organization: string;
  
  /** Título estudio específico */
  studyTitle: string;
  
  /** Año publicación */
  year: number;
  
  /** URL acceso público si disponible */
  publicUrl?: string;
  
  /** Tipo de fuente para validación */
  sourceType: 'academic' | 'industry_report' | 'government' | 'consulting_firm';
  
  /** Nivel confianza en la fuente */
  credibilityLevel: 'high' | 'medium' | 'low';
  
  /** Descripción específica del hallazgo utilizado */
  specificFinding: string;
}

/**
 * Supuesto financiero modificable con justificación
 */
export interface FinancialAssumption {
  /** Clave única identificadora */
  key: string;
  
  /** Valor numérico del supuesto */
  value: number;
  
  /** Unidad de medida (ej: CLP, %, meses) */
  unit: string;
  
  /** Descripción human-readable */
  description: string;
  
  /** Justificación metodológica */
  rationale: string;
  
  /** Rango válido (mínimo, máximo) */
  validRange: {
    min: number;
    max: number;
  };
  
  /** Fuentes que respaldan este supuesto */
  supportingSources: string[]; // IDs de MethodologySource
  
  /** Sensibilidad en cálculos finales */
  impactLevel: 'critical' | 'high' | 'medium' | 'low';
  
  /** País/región aplicabilidad */
  applicableRegion: 'chile' | 'latam' | 'global';
}

/**
 * Configuración financiera completa por tipo caso negocio
 */
export interface FinancialConfig {
  /** Tipo caso negocio aplicable */
  businessCaseType: string;
  
  /** País/región configuración */
  region: 'chile' | 'latam' | 'global';
  
  /** Moneda cálculos */
  currency: 'CLP' | 'USD' | 'EUR';
  
  /** Supuestos financieros configurables */
  assumptions: FinancialAssumption[];
  
  /** Fuentes metodológicas referenciadas */
  methodologySources: MethodologySource[];
  
  /** Versión configuración para auditoria */
  configVersion: string;
  
  /** Fecha última actualización */
  lastUpdated: Date;
  
  /** Responsable actualización (auditabilidad) */
  updatedBy: string;
  
  /** Notas explicativas adicionales */
  additionalNotes?: string;
}

/**
 * Resultado cálculo con trazabilidad completa
 */
export interface CalculationTrace {
  /** Valor calculado final */
  result: number;
  
  /** Unidad resultado */
  unit: string;
  
  /** Fórmula utilizada (human-readable) */
  formula: string;
  
  /** Inputs utilizados con valores */
  inputs: {
    [key: string]: {
      value: number;
      source: string; // ID del supuesto o fuente
    };
  };
  
  /** Pasos intermedios cálculo */
  calculationSteps: {
    step: number;
    description: string;
    calculation: string;
    result: number;
  }[];
  
  /** Nivel confianza resultado */
  confidenceLevel: 'high' | 'medium' | 'low';
  
  /** Factores que afectan confianza */
  confidenceFactors: string[];
}

/**
 * Análisis sensibilidad para validación CEO/CFO
 */
export interface SensitivityAnalysis {
  /** Variable analizada */
  variable: string;
  
  /** Valor base */
  baseValue: number;
  
  /** Escenarios analizados */
  scenarios: {
    name: string; // 'conservative', 'optimistic', 'pessimistic'
    variableChange: number; // % cambio
    impactOnResult: number; // % impacto resultado final
    newResult: number;
  }[];
  
  /** Nivel sensibilidad general */
  sensitivityLevel: 'very_high' | 'high' | 'medium' | 'low';
  
  /** Recomendación basada en sensibilidad */
  recommendation: string;
}

/**
 * Reporte transparencia financiera completo
 */
export interface FinancialTransparencyReport {
  /** Metadata reporte */
  reportId: string;
  generatedAt: Date;
  businessCaseId: string;
  businessCaseType: string;
  
  /** Resultados principales con trazabilidad */
  mainResults: {
    currentAnnualCost: CalculationTrace;
    potentialAnnualLoss: CalculationTrace;
    recommendedInvestment: CalculationTrace;
    estimatedROI: CalculationTrace;
    paybackPeriod: CalculationTrace;
  };
  
  /** Configuración utilizada (snapshot) */
  configurationSnapshot: FinancialConfig;
  
  /** Análisis sensibilidad variables clave */
  sensitivityAnalysis: SensitivityAnalysis[];
  
  /** Validaciones realizadas */
  validations: {
    assumptionsValid: boolean;
    sourcesVerified: boolean;
    calculationsVerified: boolean;
    rangesRespected: boolean;
    issues: string[];
  };
  
  /** Resumen ejecutivo auditabilidad */
  auditabilitySummary: {
    totalSources: number;
    highCredibilitySources: number;
    criticalAssumptions: number;
    overallConfidence: 'high' | 'medium' | 'low';
    recommendationForCEO: string;
  };
}

/**
 * Configuración regional para localización
 */
export interface RegionalConfig {
  region: 'chile' | 'latam' | 'global';
  currency: 'CLP' | 'USD' | 'EUR';
  
  /** Salarios promedio por sector */
  averageSalaries: {
    [industry: string]: {
      junior: number;
      mid: number;
      senior: number;
      executive: number;
    };
  };
  
  /** Costos operacionales típicos */
  operationalCosts: {
    recruitmentCostMultiplier: number; // % salario
    trainingCostPerEmployee: number;
    productivityLossPercentage: number;
    turnoverCostMultiplier: number; // % salario anual
  };
  
  /** Factores económicos locales */
  economicFactors: {
    inflationRate: number;
    unemploymentRate: number;
    marketCompetitiveness: 'high' | 'medium' | 'low';
  };
}