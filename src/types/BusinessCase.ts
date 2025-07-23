// src/types/BusinessCase.ts
// 🎯 FOCALIZAHR - CHAT 6A: BUSINESS CASE TYPES
// Interfaces para casos negocio ejecutivos automáticos

/**
 * Severidad del caso negocio para priorización ejecutiva
 */
export type BusinessCaseSeverity = 'crítica' | 'alta' | 'media' | 'baja';

/**
 * Tipo de caso negocio basado en área de impacto
 */
export type BusinessCaseType = 
  | 'retención_riesgo'
  | 'ambiente_crítico'
  | 'liderazgo_gap'        // ← AGREGAR ESTA LÍNEA
  | 'productividad_baja'
  | 'liderazgo_débil'
  | 'bienestar_deteriorado'
  | 'desarrollo_estancado';

/**
 * Detalle financiero del caso negocio con transparencia total
 */
export interface BusinessCaseFinancials {
  /** Costo actual anual estimado (CLP) */
  currentAnnualCost: number;
  
  /** Costo potencial de no actuar (CLP) */
  potentialAnnualLoss: number;
  
  /** Inversión requerida para solución (CLP) */
  recommendedInvestment: number;
  
  /** ROI estimado en 12 meses (%) */
  estimatedROI: number;
  
  /** Tiempo para obtener retorno (meses) */
  paybackPeriod: number;
  
  /** Fuentes metodológicas usadas en cálculo */
  methodologySources: string[];
  
  /** Supuestos clave del cálculo financiero */
  keyAssumptions: string[];
}

/**
 * Caso negocio completo ejecutivo-ready
 */
export interface BusinessCase {
  /** ID único del caso */
  id: string;
  
  /** Tipo de caso negocio */
  type: BusinessCaseType;
  
  /** Severidad para priorización */
  severity: BusinessCaseSeverity;
  
  /** Título ejecutivo del caso */
  title: string;
  
  /** Descripción del problema identificado */
  problemDescription: string;
  
  /** Evidencia específica que respalda el caso */
  evidenceData: {
    score: number;
    benchmark: number;
    departmentAffected?: string;
    participantsAffected: number;
  };
  
  /** Análisis financiero transparente */
  financials: BusinessCaseFinancials;
  
  /** Acciones recomendadas específicas */
  recommendedActions: string[];
  
  /** Timeline sugerido para implementación */
  suggestedTimeline: string;
  
  /** Métricas para seguimiento del progreso */
  successMetrics: string[];
  
  /** Fecha de generación del caso */
  createdAt: Date;
  
  /** Confianza en el análisis (basado en muestra) */
  confidenceLevel: 'alta' | 'media' | 'baja';
}

/**
 * Resultado del análisis RetentionEngine
 */
export interface RetentionAnalysisResult {
  /** Casos negocio detectados */
  businessCases: BusinessCase[];
  
  /** Score de riesgo global de retención (0-100) */
  globalRetentionRisk: number;
  
  /** Departamentos en riesgo crítico */
  criticalDepartments: string[];
  
  /** Recomendación de urgencia de intervención */
  interventionUrgency: 'inmediata' | '30_dias' | '90_dias' | 'trimestral';
  
  /** Resumen ejecutivo en una línea */
  executiveSummary: string;
}