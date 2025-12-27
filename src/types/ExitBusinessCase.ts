// src/types/ExitBusinessCase.ts
// 🎯 FOCALIZAHR - EXIT INTELLIGENCE: BUSINESS CASE TYPES
// Interfaces para asesoría ejecutiva nivel CEO en alertas Exit

import { BusinessCaseSeverity } from './BusinessCase';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TIPOS DE ALERTA EXIT
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Tipo de alerta Exit para generación de casos de negocio
 * 
 * Roadmap:
 * - v1.0: ley_karin_indicios
 * - v1.1: + toxic_exit
 * - v1.2: + denuncia_formal (DepartmentMetrics.complaints)
 * - v2.0: + nps_critical, concentrated_factor, onboarding_correlation
 */
export type ExitAlertType = 
  | 'ley_karin_indicios'        // v1.0: P6 Seguridad < 2.5
  | 'toxic_exit'                // v1.1: EIS < 25
  | 'denuncia_formal'           // v1.2: DepartmentMetrics.complaints
  | 'nps_critical'              // v2.0: eNPS < -20
  | 'concentrated_factor'       // v2.0: Patrón repetitivo mismo factor
  | 'onboarding_correlation';   // v2.0: Alertas onboarding ignoradas

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CASOS EMBLEMÁTICOS (Sección 4)
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Caso emblemático para sección de ejemplos
 * Propósito: Mostrar consecuencias reales de ignorar señales
 */
export interface EmblamaticCase {
  /** Nombre de la empresa */
  company: string;
  
  /** URL del logo (futuro) */
  logo?: string;
  
  /** Descripción breve del incidente */
  incident: string;
  
  /** Costo monetario o impacto cuantificado */
  cost: string;
  
  /** Consecuencias para la empresa */
  consequence: string;
  
  /** Lección aprendida */
  lesson: string;
  
  /** Fuente de la información */
  source: string;
  
  /** Año del incidente */
  year: number;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PLAN DE ACCIÓN (Sección 6)
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Producto FocalizaHR sugerido en el plan de acción
 */
export interface FocalizaProduct {
  /** Nombre del producto */
  name: string;
  
  /** Descripción breve del beneficio */
  description: string;
  
  /** Call to action */
  cta: string;
}

/**
 * Paso del plan de acción con producto sugerido opcional
 */
export interface ExitActionStep {
  /** Número de paso (1, 2, 3...) */
  step: number;
  
  /** Título del paso */
  title: string;
  
  /** Descripción detallada de la acción */
  description: string;
  
  /** Responsable de ejecutar */
  responsible: string;
  
  /** Plazo sugerido */
  deadline: string;
  
  /** Métrica de validación del éxito */
  validationMetric: string;
  
  /** Producto FocalizaHR sugerido (opcional) */
  suggestedProduct?: FocalizaProduct;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ESPECTRO DE COSTOS (Sección 5)
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Espectro de costos: desde actuar ahora hasta escándalo público
 * Filosofía: Mostrar la progresión del riesgo si no se actúa
 */
export interface CostSpectrum {
  /** 🟢 Escenario óptimo: Actuar preventivamente */
  actNow: {
    label: string;
    cost: number;
    description: string;
    color: 'green';
  };
  
  /** 🟡 Escenario medio: Escala a tutela laboral */
  escalateTutela: {
    label: string;
    costMin: number;
    costMax: number;
    description: string;
    color: 'yellow';
  };
  
  /** 🔴 Peor escenario: Escándalo público */
  escalateScandal: {
    label: string;
    description: string;
    reference: string;  // Caso emblemático de referencia
    color: 'red';
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FUENTES METODOLÓGICAS (Sección 7)
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Fuente metodológica para credibilidad científica
 */
export interface MethodologySource {
  /** Nombre de la fuente (ej: "SHRM 2024") */
  name: string;
  
  /** Descripción de lo que aporta */
  description: string;
  
  /** Año de publicación */
  year?: number;
  
  /** URL de referencia */
  url?: string;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OPCIONES DE RESOLUCIÓN (Sección 8)
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Opciones de resolución con Quick Picks
 * Propósito: Facilitar la acción y crear accountability
 */
export interface ResolutionOptions {
  /** 4-6 opciones predefinidas alineadas al Plan de Acción */
  quickPicks: string[];
  
  /** Prompt para texto libre */
  customPrompt: string;
  
  /** Mínimo de caracteres para texto libre */
  minCharacters: number;
  
  /** Mensaje mostrado después de resolver */
  successMessage: string;
  
  /** Días para medición automática de efectividad */
  followUpDays: number;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXIT BUSINESS CASE - ESTRUCTURA COMPLETA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Propósito: Asesoría nivel CEO para cada alerta Exit
 * Filosofía: INDICIOS → Oportunidad de anticipación → Prevenir escándalo
 * 
 * 8 Secciones:
 * 1. Header Ejecutivo (siempre visible)
 * 2. Qué Detectamos (colapsable)
 * 3. La Oportunidad de Oro (colapsable) ← DIFERENCIADOR
 * 4. Casos Emblemáticos (colapsable) ← DIFERENCIADOR
 * 5. Espectro de Costos (colapsable)
 * 6. Plan de Acción (colapsable)
 * 7. Fuentes Metodológicas (colapsable)
 * 8. Opciones de Resolución (siempre visible)
 */
export interface ExitBusinessCase {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════
  
  /** ID único del caso de negocio */
  id: string;
  
  /** ID de la alerta que generó este caso */
  alertId: string;
  
  /** Tipo de alerta */
  alertType: ExitAlertType;
  
  /** Fecha de generación */
  createdAt: Date;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 1: HEADER EJECUTIVO (Siempre visible)
  // ═══════════════════════════════════════════════════════════════════════════
  
  header: {
    /** Severidad para priorización visual */
    severity: BusinessCaseSeverity;
    
    /** Nivel de confianza en el análisis */
    confidenceLevel: 'alta' | 'media' | 'baja';
    
    /** Título ejecutivo (ej: "INDICIOS LEY KARIN - Ventas") */
    title: string;
    
    /** Badge descriptivo (ej: "OPORTUNIDAD DE ANTICIPACIÓN") */
    badge: string;
    
    /** Riesgo potencial en CLP (número) */
    riskAmount: number;
    
    /** Riesgo formateado (ej: "$45.2M CLP") */
    riskFormatted: string;
    
    /** Nombre del departamento afectado */
    departmentName: string;
    
    /** Nombre del empleado (si alerta individual) */
    employeeName?: string;
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 2: QUÉ DETECTAMOS (Colapsable)
  // ═══════════════════════════════════════════════════════════════════════════
  
  detection: {
    /** Resumen de lo detectado */
    summary: string;
    
    /** Etiqueta del score (ej: "Seguridad Psicológica") */
    scoreLabel: string;
    
    /** Valor del score */
    scoreValue: number;
    
    /** Máximo posible */
    scoreMax: number;
    
    /** Umbral de riesgo */
    threshold: number;
    
    /** Disclaimer importante (ej: "Esto NO es una denuncia...") */
    disclaimer: string;
    
    /** Statement de oportunidad (ej: "FocalizaHR les da lo que Uber NO tuvo") */
    opportunityStatement: string;
    
    /** Indicadores adicionales relevantes */
    additionalIndicators?: {
      label: string;
      value: string | number;
    }[];
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 3: LA OPORTUNIDAD DE ORO (Colapsable) ← DIFERENCIADOR
  // ═══════════════════════════════════════════════════════════════════════════
  
  goldenOpportunity: {
    /** Diagrama de progresión del riesgo */
    diagram: {
      /** Etapas de escalamiento */
      stages: string[];  // ["📍 INDICIOS", "Denuncia", "Tutela", "🔥 ESCÁNDALO"]
      
      /** Etapa actual (0-indexed) */
      currentStage: number;
      
      /** Label de la etapa actual */
      currentLabel: string;  // "Ustedes están AQUÍ"
    };
    
    /** Mensaje de oportunidad */
    message: string;
    
    /** Pregunta de cierre / Call to action */
    callToAction: string;
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 4: CASOS EMBLEMÁTICOS (Colapsable) ← DIFERENCIADOR
  // ═══════════════════════════════════════════════════════════════════════════
  
  emblamaticCases: {
    /** 2-3 casos relevantes al tipo de alerta */
    cases: EmblamaticCase[];
    
    /** Estadística principal destacada */
    statistic: {
      value: string;        // "60%"
      description: string;  // "de empresas en crisis NUNCA se recuperan"
      source: string;       // "Deloitte 2023"
    };
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 5: ESPECTRO DE COSTOS (Colapsable)
  // ═══════════════════════════════════════════════════════════════════════════
  
  costSpectrum: CostSpectrum;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 6: PLAN DE ACCIÓN (Colapsable)
  // ═══════════════════════════════════════════════════════════════════════════
  
  actionPlan: {
    /** Filosofía del plan */
    philosophy: string;  // "No apagamos incendios. Prevenimos."
    
    /** Pasos del plan (2-4 típicamente) */
    steps: ExitActionStep[];
    
    /** Criterios de escalación */
    escalationCriteria: string[];
    
    /** Métricas de éxito */
    successMetrics: string[];
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 7: FUENTES METODOLÓGICAS (Colapsable)
  // ═══════════════════════════════════════════════════════════════════════════
  
  methodology: {
    /** Fuentes utilizadas */
    sources: MethodologySource[];
    
    /** Disclaimer general */
    disclaimer: string;
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECCIÓN 8: OPCIONES DE RESOLUCIÓN (Siempre visible)
  // ═══════════════════════════════════════════════════════════════════════════
  
  resolutionOptions: ResolutionOptions;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TIPOS DE SOPORTE
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Contexto del departamento para cálculos
 */
export interface DepartmentContext {
  name: string;
  employeeCount: number;
  avgSalary: number;
}

/**
 * Datos del ExitRecord para generación de caso
 */
export interface ExitRecordData {
  id: string;
  participantId: string;
  departmentId: string;
  exitDate: Date;
  eis: number;
  eisClassification: string;
  p1Satisfaction: number;
  p2FactorsPrimary: string[];
  p3FactorsSecondary: string[];
  p4LeadershipSupport: number;
  p5GrowthOpportunities: number;
  p6SecurityPsychological: number;
  p7Recommendation: number;
  npsScore: number;
  npsClassification: string;
  hasLeyKarinAlert: boolean;
  participant?: {
    fullName: string;
    email: string;
  };
}

/**
 * Props para el componente de resolución
 */
export interface ResolutionSectionProps {
  options: ResolutionOptions;
  alertId: string;
  onResolve: (action: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Estado de resolución guardado
 */
export interface ResolutionRecord {
  alertId: string;
  action: string;
  resolvedAt: Date;
  resolvedBy: string;
  followUpDate: Date;
  effectivenessScore?: number;  // Calculado después de followUpDays
  effectivenessNotes?: string;
}