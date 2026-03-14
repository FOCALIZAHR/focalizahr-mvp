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
   * @param currentSalary - Salario mensual cuenta-específico (server-side via SalaryConfigService)
   */
  static generateBusinessCaseFromAlert(
    alert: JourneyAlert,
    journey: AlertJourney,
    currentSalary?: number
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

    };

    // Guardar salario en contexto para que los generadores lo usen
    this._currentSalary = currentSalary;

    const generator = generators[alert.alertType as keyof typeof generators];

    if (!generator) {
      console.warn(`[OnboardingAlertEngine] Tipo alerta no reconocido: ${alert.alertType}`);
      return this.generateGenericCase(alert, journey);
    }

    return generator.call(this, alert, journey);
  }

  // Salario temporal para la generación actual
  private static _currentSalary?: number;
  
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
      alertType: 'riesgo_fuga',
      currentSalary: this._currentSalary
    });
    
    const actionPlan: ActionStep[] = [
      {
        step: 1,
        action: "Stay Interview (Entrevista de permanencia): Reunión 1 a 1 sin agenda de trabajo, " +
                "solo para preguntar '¿Cómo te sientes?' y '¿Qué te frustra?'",
        responsible: "Gerente Directo",
        deadline: "Próximas 24 horas (URGENTE)",
        validationMetric: `Reunión realizada + causa raíz frustración identificada`
      },
      {
        step: 2,
        action: "Escucha activa: No prometer sueldos ni cargos imposibles. Solo escuchar " +
                "para entender el dolor real (a veces es solo un mal jefe o mal horario)",
        responsible: "Gerente Directo",
        deadline: "Durante stay interview",
        validationMetric: `${journey.fullName} siente que fue escuchado(a) genuinamente`
      },
      {
        step: 3,
        action: "Quick Win: Identificar UNA pequeña cosa que se pueda arreglar rápido " +
                "(ej: cambio de puesto, home office 1 día) para mostrar voluntad",
        responsible: "Gerente + HRBP",
        deadline: "Próximos 7 días",
        validationMetric: `Al menos 1 ajuste concreto implementado`
      }
    ];
    
    return {
      id: `onboarding_riesgo_fuga_${alert.id}`,
      type: 'onboarding_crisis',
      severity: 'crítica',
      title: `🚨 RIESGO FUGA CRÍTICO - ${journey.fullName} (${journey.department?.displayName || 'Sin Depto'})`,
      problemDescription: 
        `Atención prioritaria: ${journey.fullName} ha declarado explícitamente una baja ` +
        `proyección de permanencia a 1 año. No es una suposición; es una señal de salida ` +
        `activa. Según el Modelo 4C Bauer (meta-análisis 2010-2024), esta declaración ` +
        `tiene 90% de precisión predictiva de renuncia en próximos 3-6 meses, y requiere ` +
        `intervención de retención inmediata para revertir el proceso.`,
      
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
        `${journey.fullName} confirma intención permanencia en check-in 15 días post-intervención`,
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
      alertType: 'abandono_dia_1',
      currentSalary: this._currentSalary
    });
    
    const actionPlan: ActionStep[] = [
      {
        step: 1,
        action: "Llamada de reparación: El jefe directo debe llamar hoy mismo para " +
                "disculparse (aunque no haya sido su culpa) y reconectar emocionalmente",
        responsible: "Gerente Directo",
        deadline: "Hoy mismo (próximas 6 horas)",
        validationMetric: `Llamada realizada + ${journey.fullName} confirma sentirse escuchado(a)`
      },
      {
        step: 2,
        action: "Gesto simbólico: Organizar café o almuerzo de bienvenida con el equipo " +
                "para romper el hielo y generar sentido de pertenencia",
        responsible: "Gerente + Equipo",
        deadline: "Próximas 48 horas",
        validationMetric: `Actividad realizada + ${journey.fullName} integrado(a) socialmente`
      },
      {
        step: 3,
        action: "Asignar un compañero tutor que lo acompañe durante la primera semana " +
                "para responder consultas prácticas y facilitar su integración al equipo",
        responsible: "HRBP + Gerente",
        deadline: "Esta semana",
        validationMetric: `Tutor asignado + ${journey.fullName} reporta sentirse acompañado(a) y orientado(a)`
      }
    ];
    
    return {
      id: `onboarding_abandono_dia1_${alert.id}`,
      type: 'onboarding_crisis',
      severity: 'crítica',
      title: `🚨 ABANDONO DÍA 1 - ${journey.fullName} (${journey.department?.displayName || 'Sin Depto'})`,
      problemDescription:
        `${journey.fullName} del equipo de ${journey.department?.displayName || 'su área'} ` +
        `reporta que nadie lo recibió personalmente en su primer día. Esta "bienvenida vacía" ` +
        `genera una sensación inmediata de no pertenencia. Según Aberdeen Group (2024), ` +
        `la ausencia de recepción personal en Día 1 predice correctamente el 86% de casos ` +
        `de rotación temprana, y el Modelo 4C Bauer (estudios 2010-2024) confirma que ` +
        `duplica la probabilidad de renuncia por desconexión emocional.`,
      
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
        `${journey.fullName} asiste Día 2 confirmado`,
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
      alertType: 'bienvenida_fallida',
      currentSalary: this._currentSalary
    });
    
    const actionPlan: ActionStep[] = [
      {
        step: 1,
        action: "Gestión de jefe: El líder debe contactar a Soporte/IT personalmente " +
                "para acelerar el ticket usando peso jerárquico",
        responsible: "Gerente Directo",
        deadline: "Hoy mismo",
        validationMetric: `Ticket escalado + herramientas funcionando en <24h`
      },
      {
        step: 2,
        action: "Explicación directa: Hablar con el colaborador para explicarle que " +
                "es un error del proceso, no falta de interés en él/ella",
        responsible: "Gerente Directo",
        deadline: "Hoy mismo",
        validationMetric: `Conversación realizada + ${journey.fullName} comprende situación`
      },
      {
        step: 3,
        action: "Plan B temporal: Darle tareas alternativas o materiales provisorios " +
                "para que no se sienta inútil mientras espera",
        responsible: "Gerente Directo",
        deadline: "Mientras se resuelve",
        validationMetric: `${journey.fullName} tiene tareas asignadas mientras espera`
      }
    ];
    
    return {
      id: `onboarding_bienvenida_fallida_${alert.id}`,
      type: 'onboarding_warning',
      severity: 'alta',
      title: `⚠️ BIENVENIDA FALLIDA - ${journey.fullName} (${journey.department?.displayName || 'Sin Depto'})`,
      problemDescription:
        `${journey.fullName} indica que no contaba con las herramientas o accesos básicos ` +
        `para trabajar en su primer día. Más que un problema de TI, esto transmite el ` +
        `mensaje "no te esperábamos", afectando su percepción de profesionalismo. ` +
        `Según Glassdoor Research (2024), el 88% de las decisiones de permanencia ` +
        `se forman en las primeras 4 semanas, y la falta de preparación logística ` +
        `genera ansiedad innecesaria que acelera esta decisión negativa.`,
      
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
      alertType: 'confusion_rol',
      currentSalary: this._currentSalary
    });
    
    const actionPlan: ActionStep[] = [
      {
        step: 1,
        action: "Reunión de enfoque (20 min): El jefe debe sentarse con él/ella y " +
                "repasar las 3 prioridades concretas de la primera semana",
        responsible: "Gerente Directo",
        deadline: "Próximas 48 horas",
        validationMetric: `Reunión realizada + ${journey.fullName} lista 3 prioridades claras`
      },
      {
        step: 2,
        action: "Validación bidireccional: Preguntar '¿Qué necesitas de mí para lograr esto?' " +
                "para abrir el canal de ayuda y desbloquear trabas",
        responsible: "Gerente Directo",
        deadline: "En la misma reunión",
        validationMetric: `${journey.fullName} identifica al menos 1 necesidad específica`
      },
      {
        step: 3,
        action: "Email de confirmación: Mandar un punteo simple confirmando lo hablado " +
                "para dar seguridad y que pueda releerlo",
        responsible: "Gerente Directo",
        deadline: "Mismo día de reunión",
        validationMetric: `Email enviado + ${journey.fullName} confirma recepción`
      }
    ];
    
    return {
      id: `onboarding_confusion_rol_${alert.id}`,
      type: 'onboarding_warning',
      severity: 'media',
      title: `⚠️ CONFUSIÓN ROL - ${journey.fullName} (${journey.department?.displayName || 'Sin Depto'})`,
      problemDescription:
        `Detectamos que ${journey.fullName} siente confusión sobre qué se espera de su rol. ` +
        `Sin objetivos claros en la primera semana, el colaborador entra en "ansiedad de ` +
        `desempeño" (miedo a equivocarse). Según Journal of Applied Psychology (2023), ` +
        `la falta de claridad de rol es el predictor #1 de bajo rendimiento a los 90 días, ` +
        `con un 78% de correlación entre confusión temprana y resultados deficientes.`,
      
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
        `${journey.fullName} confirma claridad 100% post-sesión`,
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
      alertType: 'desajuste_rol',
      currentSalary: this._currentSalary
    });
    
    const actionPlan: ActionStep[] = [
      {
        step: 1,
        action: "Entrevista de realidad: Reunión honesta para entender dónde está la brecha " +
                "(¿Es la tarea? ¿El horario? ¿El jefe? ¿El ambiente?)",
        responsible: "HRBP + Gerente",
        deadline: "Próximas 72 horas",
        validationMetric: `Reunión realizada + brecha específica identificada`
      },
      {
        step: 2,
        action: "Re-encuadre: Si el rol cambió, explicar el 'por qué' del cambio de negocio. " +
                "Si fue error de venta, reconocerlo honestamente",
        responsible: "Gerente + HRBP",
        deadline: "En la misma reunión",
        validationMetric: `${journey.fullName} comprende razón del desajuste`
      },
      {
        step: 3,
        action: "Conexión de propósito: Mostrar cómo sus tareas actuales (aunque sean distintas) " +
                "impactan en el objetivo grande del equipo o empresa",
        responsible: "Gerente Directo",
        deadline: "Próximos 7 días",
        validationMetric: `${journey.fullName} verbaliza cómo su trabajo aporta valor`
      }
    ];
    
    return {
      id: `onboarding_desajuste_rol_${alert.id}`,
      type: 'onboarding_warning',
      severity: 'media',
      title: `⚠️ DESAJUSTE ROL - ${journey.fullName} (${journey.department?.displayName || 'Sin Depto'})`,
      problemDescription:
        `Alerta crítica de coherencia: ${journey.fullName} percibe que el trabajo diario ` +
        `no coincide con lo prometido en la entrevista. Esta "ruptura del contrato psicológico" ` +
        `es la causa raíz más frecuente de rotación voluntaria rápida. Según Deloitte (2024), ` +
        `el 72% de la rotación temprana se atribuye a desajustes entre expectativas ` +
        `de la entrevista y realidad del rol.`,
      
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
        `${journey.fullName} alineado(a) con plan elegido`,
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
      alertType: 'detractor_cultural',
      currentSalary: this._currentSalary
    });
    
    const actionPlan: ActionStep[] = [
      {
        step: 1,
        action: "Feedback bidireccional: Preguntar '¿Qué te ha sorprendido (para mal) de nuestra cultura?' " +
                "para entender desajuste específico",
        responsible: "HRBP + Gerente",
        deadline: "Próximas 72 horas",
        validationMetric: `Reunión realizada + desajuste cultural específico identificado`
      },
      {
        step: 2,
        action: "Inclusión social: Invitarlo a una instancia fuera de lo laboral (café, almuerzo) " +
                "con pares, no con jefes, para generar vínculos informales",
        responsible: "Equipo (voluntario)",
        deadline: "Próximos 7 días",
        validationMetric: `Actividad realizada + ${journey.fullName} establece 1+ conexión personal`
      },
      {
        step: 3,
        action: "Asignar un colaborador senior de referencia que le ayude a entender " +
                "las dinámicas culturales informales del equipo y la organización",
        responsible: "HRBP",
        deadline: "Próximos 14 días",
        validationMetric: `Mentor asignado + al menos 2 conversaciones informales realizadas`
      }
    ];
    
    return {
      id: `onboarding_detractor_cultural_${alert.id}`,
      type: 'onboarding_warning',
      severity: 'alta',
      title: `⚠️ DETRACTOR CULTURAL - ${journey.fullName} (${journey.department?.displayName || 'Sin Depto'})`,
      problemDescription:
        `${journey.fullName} muestra señales de desconexión con los valores y el clima del equipo ` +
        `(eNPS bajo). Un detractor cultural en etapa temprana (Día 90) tiene alto riesgo de ` +
        `contagiar negativamente al equipo o salir silenciosamente. Según Deloitte (2023), ` +
        `el desajuste cultural es el predictor #1 de rotación en el primer año (89% de precisión), ` +
        `y detectarlo temprano permite intervención correctiva o separación ética antes de ` +
        `toxicidad organizacional.`,
      
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
      alertType: 'generic',
      currentSalary: this._currentSalary
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