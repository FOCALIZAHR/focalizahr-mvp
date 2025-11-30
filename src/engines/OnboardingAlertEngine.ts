// src/engines/OnboardingAlertEngine.ts

import { BusinessCase, BusinessCaseFinancials } from '@/types/BusinessCase';
import { JourneyAlert, JourneyOrchestration } from '@prisma/client';
import { calculateOnboardingFinancialImpact, formatCurrencyCLP } from '@/lib/financialCalculations';

/**
 * ONBOARDING ALERT ENGINE
 * 
 * Transforma alertas técnicas → Casos de negocio ejecutivos
 * 
 * Pattern: Reutiliza Kit Comunicación 2.5/3.0
 * - FinancialCalculator centralizado para costos (SHRM 2024, 6 salarios, $0 inversión)
 * - BusinessCase para estructura
 * - InsightAccionable para UI
 * 
 * Filosofía: Plan de acción SIMPLE (2-3 pasos) con validación concreta
 * 
 * CORRECCIONES APLICADAS:
 * ✅ BusinessCaseType: Usar 'onboarding_crisis' y 'onboarding_warning' (tras extender enum)
 * ✅ evidenceData: Adaptado a estructura real {score, benchmark, departmentAffected, participantsAffected}
 * ✅ confidenceLevel: Solo 'alta' | 'media' | 'baja'
 * ✅ Finanzas centralizadas: calculateOnboardingFinancialImpact desde @/lib/financialCalculations
 */

// ========================================
// INTERFACES
// ========================================

/**
 * AlertJourney - Tipo adaptado a lo que retorna useOnboardingAlerts
 * NO extiende JourneyOrchestration porque el hook retorna subset simplificado
 */
interface AlertJourney {
  id: string;
  fullName: string;
  departmentId: string;
  currentStage: number;
  exoScore: number | null;
  retentionRisk: string | null;
  department: {
    id: string;
    displayName: string;
    standardCategory: string | null;
  } | null;
}

interface ActionStep {
  step: number;
  action: string;
  responsible: string;
  deadline: string;
  validationMetric: string;
}

// ========================================
// ENGINE PRINCIPAL
// ========================================

export class OnboardingAlertEngine {
  
  /**
   * MÉTODO PRINCIPAL: Genera BusinessCase desde alerta
   */
  static generateBusinessCaseFromAlert(
    alert: JourneyAlert,
    journey: AlertJourney
  ): BusinessCase {
    
    // Mapeo tipo alerta → generador específico
    // ✅ VALORES CORRECTOS: Coinciden con validación Zod y backend
    const generators = {
      'RIESGO_FUGA': this.generateRiesgoFugaCase,
      'ABANDONO_DIA_1': this.generateAbandonoDia1Case,
      'BIENVENIDA_FALLIDA': this.generateBienvenidaFallidaCase,
      'CONFUSION_ROL': this.generateConfusionRolCase,
      'DESAJUSTE_ROL': this.generateDesajusteRolCase,
      'DESAJUSTE_CULTURAL': this.generateDesajusteRolCase, // Alias
      'DETRACTOR_CULTURAL': this.generateDetractorCase,
      'low_score': this.generateLowScoreCase  // Alertas genéricas backend
    };
    
    const generator = generators[alert.alertType as keyof typeof generators];
    
    if (!generator) {
      console.warn(`[OnboardingAlertEngine] Tipo alerta no reconocido: ${alert.alertType}`);
      return this.generateGenericCase(alert, journey);
    }
    
    return generator.call(this, alert, journey);
  }
  
  // ========================================
  // CASO 1: RIESGO FUGA (MÁS CRÍTICO)
  // ========================================
  
  private static generateRiesgoFugaCase(
    alert: JourneyAlert,
    journey: AlertJourney
  ): BusinessCase {
    
    // ✅ CAMBIO QUIRÚRGICO: Usar función centralizada
    const financials = calculateOnboardingFinancialImpact({
      employeeName: journey.fullName,
      role: journey.department?.displayName || 'Sin Depto',
      alertType: 'riesgo_fuga'
    });
    
    const actionPlan: ActionStep[] = [
      {
        step: 1,
        action: "Sesión 1:1 con HRBP para diagnosticar causa raíz específica (expectativas, cultura, rol)",
        responsible: "HRBP + Gerente Directo",
        deadline: "24 horas",
        validationMetric: "Empleado confirma causa raíz identificada en sesión"
      },
      {
        step: 2,
        action: "Diseñar e implementar plan carrera individualizado con hitos claros 3-6-12 meses",
        responsible: "Gerente Directo",
        deadline: "7 días",
        validationMetric: "Plan documentado + firmado por empleado y gerente"
      },
      {
        step: 3,
        action: "Check-in validación progreso + ajustes según feedback",
        responsible: "Gerente Directo",
        deadline: "15 días post-intervención",
        validationMetric: "EXO Score Día 60 >70 + Dimensión Connection >75"
      }
    ];
    
    return {
      id: `onboarding_riesgo_fuga_${alert.id}`,
      type: 'onboarding_crisis',
      severity: 'crítica',
      title: `🚨 RIESGO FUGA CRÍTICO - ${journey.fullName} (${journey.department?.displayName || 'Sin Depto'})`,
      problemDescription: 
        `${journey.fullName} expresó no verse en la empresa en 1 año durante evaluación Día ${alert.stage}. ` +
        `Según metodología 4C Bauer (predictor #1 validado de rotación temprana), esto indica 90% probabilidad ` +
        `de renuncia en próximos 3-6 meses sin intervención. Costo proyectado: ${formatCurrencyCLP(financials.potentialAnnualLoss)}.`,
      
      evidenceData: {
        score: journey.exoScore || 0,
        benchmark: this.getBenchmarkForStage(alert.stage || 1),
        departmentAffected: journey.department?.displayName,
        participantsAffected: 1
      },
      
      financials,
      
      recommendedActions: actionPlan.map(step => 
        `${step.step}. ${step.action}\n   ⏱️ Plazo: ${step.deadline}\n   👤 Responsable: ${step.responsible}\n   ✓ Validación: ${step.validationMetric}`
      ),
      
      suggestedTimeline: `ACCIÓN INMEDIATA - Ventana intervención: Próximas 48 horas críticas (efectividad cae 15% cada semana de demora)`,
      
      successMetrics: [
        `Empleado confirma intención permanencia en check-in 15 días post-intervención`,
        `EXO Score Día 60 >70 puntos (actual: ${journey.exoScore || 'N/A'})`,
        `Dimensión Connection >75 puntos (relaciones consolidadas)`,
        `Plan carrera documentado + hitos trimestre 1 cumplidos`,
        `Retención confirmada a 6 meses (validación final)`
      ],
      
      createdAt: new Date(),
      confidenceLevel: 'alta'
    };
  }
  
  // ========================================
  // CASO 2: ABANDONO DÍA 1
  // ========================================
  
  private static generateAbandonoDia1Case(
    alert: JourneyAlert,
    journey: AlertJourney
  ): BusinessCase {
    
    // ✅ CAMBIO QUIRÚRGICO: Usar función centralizada
    const financials = calculateOnboardingFinancialImpact({
      employeeName: journey.fullName,
      role: journey.department?.displayName || 'Sin Depto',
      alertType: 'abandono_dia_1'
    });
    
    const actionPlan: ActionStep[] = [
      {
        step: 1,
        action: "Llamada inmediata HRBP para entender razón ausencia (logística, segunda pensamiento, problema personal)",
        responsible: "HRBP",
        deadline: "2 horas desde no presentación",
        validationMetric: "Contacto establecido + causa identificada"
      },
      {
        step: 2,
        action: "Resolver obstáculo específico (ej: ajustar horario, aclarar expectativas, apoyo logístico)",
        responsible: "HRBP + Gerente",
        deadline: "24 horas",
        validationMetric: "Empleado confirma asistencia Día 2 + obstáculo resuelto"
      },
      {
        step: 3,
        action: "Rediseñar proceso bienvenida para prevenir (checklist pre-arrival, welcome pack, buddy)",
        responsible: "HR Team",
        deadline: "7 días",
        validationMetric: "Proceso documentado + aplicado en próximos 3 onboardings sin abandono"
      }
    ];
    
    return {
      id: `onboarding_abandono_dia1_${alert.id}`,
      type: 'onboarding_crisis',
      severity: 'crítica',
      title: `🚨 ABANDONO DÍA 1 - ${journey.fullName} (${journey.department?.displayName || 'Sin Depto'})`,
      problemDescription:
        `${journey.fullName} no se presentó en su primer día de trabajo. 86% de estos casos son prevenibles ` +
        `con preparación adecuada (Aberdeen Group). Contacto inmediato puede recuperar 85% de casos. ` +
        `Costo si se pierde: ${formatCurrencyCLP(financials.potentialAnnualLoss)} (reclutamiento duplicado).`,
      
      evidenceData: {
        score: 0,
        benchmark: this.getBenchmarkForStage(1),
        departmentAffected: journey.department?.displayName,
        participantsAffected: 1
      },
      
      financials,
      
      recommendedActions: actionPlan.map(step =>
        `${step.step}. ${step.action}\n   ⏱️ Plazo: ${step.deadline}\n   👤 Responsable: ${step.responsible}\n   ✓ Validación: ${step.validationMetric}`
      ),
      
      suggestedTimeline: `URGENCIA MÁXIMA - Contactar en próximas 2 horas (tasa recuperación cae 20% cada hora)`,
      
      successMetrics: [
        `Contacto establecido en <2 horas`,
        `Empleado asiste Día 2 confirmado`,
        `Causa raíz documentada`,
        `Proceso rediseñado previene 100% casos en próximos 3 onboardings`
      ],
      
      createdAt: new Date(),
      confidenceLevel: 'alta'
    };
  }
  
  // ========================================
  // CASO 3: BIENVENIDA FALLIDA
  // ========================================
  
  private static generateBienvenidaFallidaCase(
    alert: JourneyAlert,
    journey: AlertJourney
  ): BusinessCase {
    
    // ✅ CAMBIO QUIRÚRGICO: Usar función centralizada
    const financials = calculateOnboardingFinancialImpact({
      employeeName: journey.fullName,
      role: journey.department?.displayName || 'Sin Depto',
      alertType: 'bienvenida_fallida'
    });
    
    const actionPlan: ActionStep[] = [
      {
        step: 1,
        action: "Sesión retroalimentación con empleado: identificar qué falló específicamente (logística, tecnología, personas)",
        responsible: "HRBP",
        deadline: "24 horas",
        validationMetric: "3 problemas concretos identificados y documentados"
      },
      {
        step: 2,
        action: "Implementar correcciones inmediatas (ej: reasignar buddy, setup tecnológico, tour oficina)",
        responsible: "Gerente + IT/Facilities",
        deadline: "48 horas",
        validationMetric: "Empleado confirma problema resuelto + score Compliance >70 en Día 30"
      }
    ];
    
    return {
      id: `onboarding_bienvenida_fallida_${alert.id}`,
      type: 'onboarding_warning',
      severity: 'alta',
      title: `⚠️ BIENVENIDA FALLIDA - ${journey.fullName} (${journey.department?.displayName || 'Sin Depto'})`,
      problemDescription:
        `${journey.fullName} reportó experiencia negativa en Día 1 (score Compliance <50). ` +
        `Glassdoor Research indica que 88% de decisión quedarse/irse se forma en primeras 4 semanas. ` +
        `Intervención rápida puede recuperar 80% de estos casos.`,
      
      evidenceData: {
        score: journey.exoScore || alert.score || 0,
        benchmark: this.getBenchmarkForStage(alert.stage || 1),
        departmentAffected: journey.department?.displayName,
        participantsAffected: 1
      },
      
      financials,
      
      recommendedActions: actionPlan.map(step =>
        `${step.step}. ${step.action}\n   ⏱️ Plazo: ${step.deadline}\n   👤 Responsable: ${step.responsible}\n   ✓ Validación: ${step.validationMetric}`
      ),
      
      suggestedTimeline: `ACCIÓN URGENTE - Próximas 48 horas (ventana de corrección)`,
      
      successMetrics: [
        `3 problemas específicos identificados en <24h`,
        `Correcciones implementadas validadas por empleado`,
        `Score Compliance Día 30 >70 (vs actual <50)`,
        `EXO Score Día 90 >75`
      ],
      
      createdAt: new Date(),
      confidenceLevel: 'alta'
    };
  }
  
  // ========================================
  // CASO 4: CONFUSIÓN ROL
  // ========================================
  
  private static generateConfusionRolCase(
    alert: JourneyAlert,
    journey: AlertJourney
  ): BusinessCase {
    
    // ✅ CAMBIO QUIRÚRGICO: Usar función centralizada
    const financials = calculateOnboardingFinancialImpact({
      employeeName: journey.fullName,
      role: journey.department?.displayName || 'Sin Depto',
      alertType: 'confusion_rol'
    });
    
    const actionPlan: ActionStep[] = [
      {
        step: 1,
        action: "Sesión clarificación expectativas: Job description detallado + objetivos 30-60-90 días",
        responsible: "Gerente Directo",
        deadline: "48 horas",
        validationMetric: "Documento firmado por ambas partes + empleado confirma claridad 100%"
      },
      {
        step: 2,
        action: "Check-in semanal primeras 4 semanas para validar alineación tareas vs expectativas",
        responsible: "Gerente Directo",
        deadline: "Implementar desde hoy",
        validationMetric: "Score Clarification Día 30 >75 (vs actual <60)"
      }
    ];
    
    return {
      id: `onboarding_confusion_rol_${alert.id}`,
      type: 'onboarding_warning',
      severity: 'media',
      title: `⚠️ CONFUSIÓN ROL - ${journey.fullName} (${journey.department?.displayName || 'Sin Depto'})`,
      problemDescription:
        `${journey.fullName} reportó falta claridad sobre responsabilidades (score Clarification <60). ` +
        `LinkedIn identifica esto como causa #2 de rotación en primeros 6 meses. ` +
        `Sesión clarificación inmediata puede prevenir desalineación crónica.`,
      
      evidenceData: {
        score: journey.exoScore || alert.score || 0,
        benchmark: this.getBenchmarkForStage(alert.stage || 1),
        departmentAffected: journey.department?.displayName,
        participantsAffected: 1
      },
      
      financials,
      
      recommendedActions: actionPlan.map(step =>
        `${step.step}. ${step.action}\n   ⏱️ Plazo: ${step.deadline}\n   👤 Responsable: ${step.responsible}\n   ✓ Validación: ${step.validationMetric}`
      ),
      
      suggestedTimeline: `ACCIÓN REQUERIDA - Próximas 48 horas para clarificación`,
      
      successMetrics: [
        `Job description detallado + objetivos 30-60-90 firmado`,
        `Empleado confirma claridad 100% post-sesión`,
        `Score Clarification Día 30 >75`,
        `Check-ins semanales implementados y documentados`
      ],
      
      createdAt: new Date(),
      confidenceLevel: 'alta'
    };
  }
  
  // ========================================
  // CASO 5: DESAJUSTE ROL
  // ========================================
  
  private static generateDesajusteRolCase(
    alert: JourneyAlert,
    journey: AlertJourney
  ): BusinessCase {
    
    // ✅ CAMBIO QUIRÚRGICO: Usar función centralizada
    const financials = calculateOnboardingFinancialImpact({
      employeeName: journey.fullName,
      role: journey.department?.displayName || 'Sin Depto',
      alertType: 'desajuste_rol'
    });
    
    const actionPlan: ActionStep[] = [
      {
        step: 1,
        action: "Evaluación skills reales vs requeridos del rol + identificar gaps específicos",
        responsible: "Gerente + HRBP",
        deadline: "5 días",
        validationMetric: "Assessment completado + 3 gaps prioritarios identificados"
      },
      {
        step: 2,
        action: "Decisión: A) Ajustar tareas del rol, B) Plan capacitación, o C) Reasignación interna",
        responsible: "Gerente + HR",
        deadline: "7 días",
        validationMetric: "Plan aprobado + empleado alineado con decisión"
      },
      {
        step: 3,
        action: "Implementar plan elegido + validar mejora en siguiente evaluación",
        responsible: "Gerente",
        deadline: "30 días",
        validationMetric: "Score Clarification Día 60 >70 + gaps cerrados ≥66%"
      }
    ];
    
    return {
      id: `onboarding_desajuste_rol_${alert.id}`,
      type: 'onboarding_warning',
      severity: 'media',
      title: `⚠️ DESAJUSTE ROL - ${journey.fullName} (${journey.department?.displayName || 'Sin Depto'})`,
      problemDescription:
        `${journey.fullName} evidencia desajuste entre skills y demandas del rol. ` +
        `Deloitte identifica esto como causa del 72% de rotación temprana. ` +
        `Ajuste proactivo (tareas, capacitación, o reasignación) retiene 85% de casos.`,
      
      evidenceData: {
        score: journey.exoScore || alert.score || 0,
        benchmark: this.getBenchmarkForStage(alert.stage || 1),
        departmentAffected: journey.department?.displayName,
        participantsAffected: 1
      },
      
      financials,
      
      recommendedActions: actionPlan.map(step =>
        `${step.step}. ${step.action}\n   ⏱️ Plazo: ${step.deadline}\n   👤 Responsable: ${step.responsible}\n   ✓ Validación: ${step.validationMetric}`
      ),
      
      suggestedTimeline: `ACCIÓN REQUERIDA - Próximos 7 días para assessment y decisión`,
      
      successMetrics: [
        `Assessment skills completado`,
        `Plan ajuste (A/B/C) aprobado en <7 días`,
        `Empleado alineado con plan elegido`,
        `Score Clarification Día 60 >70`,
        `Gaps cerrados ≥66% en evaluación siguiente`
      ],
      
      createdAt: new Date(),
      confidenceLevel: 'alta'
    };
  }
  
  // ========================================
  // CASO 6: DETRACTOR CULTURAL
  // ========================================
  
  private static generateDetractorCase(
    alert: JourneyAlert,
    journey: AlertJourney
  ): BusinessCase {
    
    // ✅ CAMBIO QUIRÚRGICO: Usar función centralizada
    const financials = calculateOnboardingFinancialImpact({
      employeeName: journey.fullName,
      role: journey.department?.displayName || 'Sin Depto',
      alertType: 'detractor_cultural'
    });
    
    const actionPlan: ActionStep[] = [
      {
        step: 1,
        action: "Sesión profunda valores/cultura: entender qué aspectos específicos generan fricción",
        responsible: "HRBP + Gerente",
        deadline: "48 horas",
        validationMetric: "3 desajustes culturales concretos identificados"
      },
      {
        step: 2,
        action: "Evaluar si desajustes son: A) Salvables (mentor, ajuste team), o B) Fundamentales (considerar salida digna)",
        responsible: "HR Leadership",
        deadline: "7 días",
        validationMetric: "Decisión documentada + plan implementación"
      },
      {
        step: 3,
        action: "Si salvable: Asignar mentor cultural + integración gradual. Si fundamental: Off-boarding ético con referencia",
        responsible: "HRBP + Gerente",
        deadline: "14 días",
        validationMetric: "Score Culture Día 60 >70 (si A) o Salida ejecutada con dignidad (si B)"
      }
    ];
    
    return {
      id: `onboarding_detractor_cultural_${alert.id}`,
      type: 'onboarding_warning',
      severity: 'alta',
      title: `⚠️ DETRACTOR CULTURAL - ${journey.fullName} (${journey.department?.displayName || 'Sin Depto'})`,
      problemDescription:
        `${journey.fullName} evidencia desajuste cultural significativo (score Culture <50). ` +
        `Deloitte identifica esto como predictor #1 de rotación en primer año (89% casos). ` +
        `Decisión temprana (salvar o salida ética) previene toxicidad y reduce costos 70%.`,
      
      evidenceData: {
        score: journey.exoScore || alert.score || 0,
        benchmark: this.getBenchmarkForStage(alert.stage || 1),
        departmentAffected: journey.department?.displayName,
        participantsAffected: 1
      },
      
      financials,
      
      recommendedActions: actionPlan.map(step =>
        `${step.step}. ${step.action}\n   ⏱️ Plazo: ${step.deadline}\n   👤 Responsable: ${step.responsible}\n   ✓ Validación: ${step.validationMetric}`
      ),
      
      suggestedTimeline: `EVALUACIÓN CRÍTICA - Próximos 7 días para decidir estrategia (salvable o salida ética)`,
      
      successMetrics: [
        `3 desajustes culturales específicos identificados`,
        `Decisión salvable/fundamental tomada en <7 días`,
        `Si salvable: Mentor asignado + score Culture Día 60 >70`,
        `Si fundamental: Salida ejecutada con dignidad + referencia positiva`,
        `Equipo sin impacto negativo post-decisión`
      ],
      
      createdAt: new Date(),
      confidenceLevel: 'alta'
    };
  }
  
  // ========================================
  // CASO 7: LOW SCORE (GENÉRICO POR DIMENSIÓN)
  // ========================================
  
  private static generateLowScoreCase(
    alert: JourneyAlert,
    journey: AlertJourney
  ): BusinessCase {
    
    // ✅ Usar función centralizada
    const financials = calculateOnboardingFinancialImpact({
      employeeName: journey.fullName,
      role: journey.department?.displayName || 'Sin Depto',
      alertType: 'low_score'
    });
    
    // Determinar dimensión (si no viene en alert, inferir del título)
    const dimension = (alert as any).dimension || 
                     alert.title?.toLowerCase().includes('compliance') ? 'compliance' :
                     alert.title?.toLowerCase().includes('clarification') ? 'clarification' :
                     alert.title?.toLowerCase().includes('culture') ? 'culture' :
                     alert.title?.toLowerCase().includes('connection') ? 'connection' : 'general';
    
    const score = (alert as any).score || journey.exoScore || 0;
    
    // Plan de acción específico por dimensión
    const dimensionPlans: Record<string, ActionStep[]> = {
      compliance: [
        {
          step: 1,
          action: "Auditar preparación logística Día 1: equipamiento, accesos, desk setup completados 100%",
          responsible: "IT + Facilities + HRBP",
          deadline: "24 horas",
          validationMetric: "Checklist pre-arrival completado + empleado confirma herramientas funcionando"
        },
        {
          step: 2,
          action: "Sesión bienvenida de recuperación con gerente + tour oficina completo",
          responsible: "Gerente Directo",
          deadline: "48 horas",
          validationMetric: "Empleado confirma sentirse bienvenido + orientación espacios completada"
        },
        {
          step: 3,
          action: "Rediseñar checklist pre-arrival con responsables y deadlines claros",
          responsible: "HRBP",
          deadline: "7 días",
          validationMetric: "Proceso documentado + aplicado en próximos 3 onboardings sin fallas"
        }
      ],
      
      clarification: [
        {
          step: 1,
          action: "Sesión clarificación expectativas: Job description detallado + objetivos 30-60-90 días específicos",
          responsible: "Gerente Directo",
          deadline: "48 horas",
          validationMetric: "Documento firmado por ambas partes + empleado confirma claridad 100%"
        },
        {
          step: 2,
          action: "Implementar check-ins semanales estructurados primeras 4 semanas (30 min, agenda fija)",
          responsible: "Gerente Directo",
          deadline: "Desde hoy",
          validationMetric: "4 sesiones completadas + score Clarification Día 30 >70"
        },
        {
          step: 3,
          action: "Asignar mentor/buddy para consultas diarias operativas",
          responsible: "HRBP",
          deadline: "5 días",
          validationMetric: "Buddy activo + empleado reporta consultas resueltas <24h"
        }
      ],
      
      culture: [
        {
          step: 1,
          action: "Sesión profunda valores/cultura: identificar 3 desajustes culturales específicos",
          responsible: "HRBP + Gerente",
          deadline: "48 horas",
          validationMetric: "3 desajustes documentados con ejemplos concretos"
        },
        {
          step: 2,
          action: "Decidir: A) Salvable (asignar mentor cultural + integración gradual), o B) Salida ética",
          responsible: "HR Leadership",
          deadline: "7 días",
          validationMetric: "Decisión documentada + plan implementación aprobado"
        },
        {
          step: 3,
          action: "Ejecutar plan: Si A) Mentor + check-ins cultura. Si B) Off-boarding digno con referencia",
          responsible: "HRBP + Gerente",
          deadline: "14 días",
          validationMetric: "Score Culture Día 60 >70 (A) o Salida ejecutada profesionalmente (B)"
        }
      ],
      
      connection: [
        {
          step: 1,
          action: "Diagnóstico profundo intención permanencia: causas específicas de desconexión",
          responsible: "HRBP + Gerente",
          deadline: "24 horas",
          validationMetric: "Empleado identifica 3 factores que afectan compromiso"
        },
        {
          step: 2,
          action: "Plan carrera individualizado con hitos 3-6-12 meses + sponsor ejecutivo asignado",
          responsible: "Gerente + HR",
          deadline: "7 días",
          validationMetric: "Plan documentado + firmado + sponsor comprometido"
        },
        {
          step: 3,
          action: "Check-ins mensuales validación progreso + ajustes según feedback",
          responsible: "Gerente + Sponsor",
          deadline: "Ciclo permanente",
          validationMetric: "Score Connection Día 90 >75 + empleado confirma intención permanencia"
        }
      ]
    };
    
    const actionPlan = dimensionPlans[dimension] || dimensionPlans.clarification;
    
    const dimensionTitles: Record<string, string> = {
      compliance: 'PREPARACIÓN LOGÍSTICA DEFICIENTE',
      clarification: 'FALTA CLARIDAD EXPECTATIVAS',
      culture: 'DESAJUSTE CULTURAL',
      connection: 'DESCONEXIÓN / BAJO COMPROMISO'
    };
    
    const dimensionDescriptions: Record<string, string> = {
      compliance: 
        `${journey.fullName} reportó experiencia negativa en preparación logística (score: ${score.toFixed(1)}/5.0). ` +
        `Glassdoor Research: 88% de decisión quedarse/irse se forma en primeras 4 semanas. ` +
        `Falta equipamiento Día 1 genera percepción "no me esperaban" → abandono emocional.`,
      
      clarification:
        `${journey.fullName} evidencia falta de claridad sobre expectativas y rol (score: ${score.toFixed(1)}/5.0). ` +
        `LinkedIn identifica esto como causa #2 de rotación en primeros 6 meses. ` +
        `Sesión clarificación inmediata puede prevenir desalineación crónica.`,
      
      culture:
        `${journey.fullName} evidencia desajuste cultural significativo (score: ${score.toFixed(1)}/5.0). ` +
        `Deloitte: desajuste cultural es predictor #1 de rotación primer año (89% casos). ` +
        `Decisión temprana (salvar o salida ética) previene toxicidad y reduce costos 70%.`,
      
      connection:
        `${journey.fullName} muestra bajo compromiso y desconexión con la organización (score: ${score.toFixed(1)}/5.0). ` +
        `Metodología 4C Bauer: Connection es predictor final de retención a largo plazo. ` +
        `Intervención ahora puede recuperar 75% de casos vs 15% si se espera a renuncia.`
    };
    
    return {
      id: `onboarding_low_score_${alert.id}`,
      type: 'onboarding_warning',
      severity: score < 2.0 ? 'crítica' : score < 3.0 ? 'alta' : 'media',
      title: `⚠️ ${dimensionTitles[dimension] || 'SCORE BAJO'} - ${journey.fullName} (${journey.department?.displayName || 'Sin Depto'})`,
      problemDescription: dimensionDescriptions[dimension] || alert.description,
      
      evidenceData: {
        score,
        benchmark: this.getBenchmarkForStage(alert.stage || 1),
        departmentAffected: journey.department?.displayName,
        participantsAffected: 1
      },
      
      financials,
      
      recommendedActions: actionPlan.map(step =>
        `${step.step}. ${step.action}\n   ⏱️ Plazo: ${step.deadline}\n   👤 Responsable: ${step.responsible}\n   ✓ Validación: ${step.validationMetric}`
      ),
      
      suggestedTimeline: score < 2.0 
        ? `URGENCIA ALTA - Próximas 48 horas para intervención` 
        : `ACCIÓN REQUERIDA - Próximos 7 días`,
      
      successMetrics: [
        `Causa raíz específica identificada`,
        `Plan corrección implementado en <7 días`,
        `Score ${dimension} mejora >+20 puntos en próxima evaluación`,
        `Empleado confirma mejora tangible en sesión validación`
      ],
      
      createdAt: new Date(),
      confidenceLevel: 'alta'
    };
  }
  
  // ========================================
  // CASO GENÉRICO (FALLBACK)
  // ========================================
  
  private static generateGenericCase(
    alert: JourneyAlert,
    journey: AlertJourney
  ): BusinessCase {
    
    // ✅ CAMBIO QUIRÚRGICO: Usar función centralizada
    const financials = calculateOnboardingFinancialImpact({
      employeeName: journey.fullName,
      role: journey.department?.displayName || 'Sin Depto',
      alertType: 'generic'
    });
    
    return {
      id: `onboarding_generic_${alert.id}`,
      type: 'onboarding_warning',
      severity: this.mapSeverityToSpanish(alert.severity),
      title: `⚠️ ${alert.title}`,
      problemDescription: alert.description,
      
      evidenceData: {
        score: journey.exoScore || alert.score || 0,
        benchmark: this.getBenchmarkForStage(alert.stage || 1),
        departmentAffected: journey.department?.displayName,
        participantsAffected: 1
      },
      
      financials,
      
      recommendedActions: [
        '1. Sesión diagnóstico con HRBP para entender causa raíz',
        '2. Implementar plan corrección específico',
        '3. Validar mejora en siguiente evaluación'
      ],
      
      suggestedTimeline: 'Acción requerida en próximos 7 días',
      
      successMetrics: [
        'Causa raíz identificada',
        'Plan corrección implementado',
        'Mejora validada en próxima evaluación'
      ],
      
      createdAt: new Date(),
      confidenceLevel: 'media'
    };
  }
  
  // ========================================
  // HELPERS
  // ========================================
  
  private static calculateDaysInCompany(createdAt: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(createdAt).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Helper para obtener benchmark esperado por etapa
   * Basado en metodología 4C Bauer
   */
  private static getBenchmarkForStage(stage: number): number {
    const benchmarks = {
      1: 60,  // Día 1: Compliance básico
      2: 65,  // Día 7: Clarification
      3: 70,  // Día 30: Connection
      4: 75   // Día 90: Culture
    };
    return benchmarks[stage as keyof typeof benchmarks] || 70;
  }
  
  /**
   * Mapea severity de JourneyAlert (inglés) a BusinessCase (español)
   */
  private static mapSeverityToSpanish(severity: string): 'crítica' | 'alta' | 'media' | 'baja' {
    const mapping: Record<string, 'crítica' | 'alta' | 'media' | 'baja'> = {
      'critical': 'crítica',
      'high': 'alta',
      'medium': 'media',
      'low': 'baja'
    };
    
    return mapping[severity] || 'media';
  }
}