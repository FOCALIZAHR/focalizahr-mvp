// src/engines/ExitAlertEngine.ts
// 🎯 FOCALIZAHR - EXIT ALERT ENGINE
// Transforma alertas Exit → Casos de negocio con asesoría nivel CEO

import { 
  ExitBusinessCase, 
  ExitAlertType, 
  EmblamaticCase,
  ExitActionStep,
  MethodologySource,
  CostSpectrum,
  ResolutionOptions,
  DepartmentContext,
  ExitRecordData,
  FocalizaProduct
} from '@/types/ExitBusinessCase';
import { BusinessCaseSeverity } from '@/types/BusinessCase';
import { ExitAlert } from '@prisma/client';
import { formatCurrencyCLP } from '@/lib/financialCalculations';
import { 
  CHILE_ECONOMIC_ADJUSTMENTS, 
  FinancialCalculator 
} from '@/config/impactAssumptions';
import { EMBLEMATIC_CASES, MAIN_STATISTICS } from '@/config/emblamaticCases';

/**
 * EXIT ALERT ENGINE
 * 
 * Transforma alertas Exit → Casos de negocio con asesoría nivel CEO
 * 
 * Filosofía:
 * - INDICIOS, no denuncias
 * - OPORTUNIDAD de anticipación  
 * - El costo real es el ESCÁNDALO, no las multas
 * 
 * Análogo a: OnboardingAlertEngine.ts
 * 
 * @version 1.0
 * @date December 2025
 */


// ═══════════════════════════════════════════════════════════════════════════════
// PREGUNTAS EXACTAS DE LA ENCUESTA EXIT SURVEY (P1-P7)
// Estas son las preguntas REALES que respondió el colaborador
// ═══════════════════════════════════════════════════════════════════════════════

const EXIT_SURVEY_QUESTIONS: Record<string, {
  questionId: string;
  questionText: string;
  dimension: string;
  scaleMin: number;
  scaleMax: number;
  scaleType: 'likert' | 'nps' | 'percentage';
}> = {
  p1_satisfaction: {
    questionId: 'P1',
    questionText: 'En general, ¿qué tan satisfecho/a estuviste trabajando en esta empresa?',
    dimension: 'Satisfacción General',
    scaleMin: 1,
    scaleMax: 5,
    scaleType: 'likert'
  },
  p4_leadership: {
    questionId: 'P4',
    questionText: 'Mi jefatura directa me brindó el apoyo y orientación necesarios para desempeñar mi trabajo.',
    dimension: 'Liderazgo',
    scaleMin: 1,
    scaleMax: 5,
    scaleType: 'likert'
  },
  p5_development: {
    questionId: 'P5',
    questionText: 'Sentí que tenía oportunidades reales de crecimiento y desarrollo profesional en esta empresa.',
    dimension: 'Desarrollo',
    scaleMin: 1,
    scaleMax: 5,
    scaleType: 'likert'
  },
  p6_safety: {
    questionId: 'P6',
    questionText: 'Considero que el ambiente de trabajo fue siempre un lugar seguro y respetuoso, libre de acoso o discriminación.',
    dimension: 'Seguridad Psicológica (Ley Karin)',
    scaleMin: 1,
    scaleMax: 5,
    scaleType: 'likert'
  },
  p7_nps: {
    questionId: 'P7',
    questionText: '¿Qué tan probable es que recomiendes esta empresa como lugar de trabajo a un amigo o familiar?',
    dimension: 'Employee NPS',
    scaleMin: 0,
    scaleMax: 10,
    scaleType: 'nps'
  },
  eis_composite: {
    questionId: 'EIS',
    questionText: 'Exit Intelligence Score - Índice compuesto que pondera satisfacción, liderazgo, desarrollo, autonomía y seguridad psicológica.',
    dimension: 'Exit Intelligence Score',
    scaleMin: 0,
    scaleMax: 100,
    scaleType: 'percentage'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTOS FOCALIZAHR PARA SUGERENCIAS
// Solo productos aplicables: Rápidos, focalizados en área, confidenciales
// Propósito: Complementar indicios o descartarlos con datos frescos
// ═══════════════════════════════════════════════════════════════════════════════

const FOCALIZA_PRODUCTS: Record<string, FocalizaProduct> = {
  /**
   * AMBIENTE SANO (Ley Karin)
   * - 8 preguntas, 5-7 minutos
   * - Detección preventiva de toxicidad laboral
   * - Compliance Ley Karin
   * - IDEAL para: Complementar/descartar indicios de seguridad psicológica
   */
  ambiente_sano: {
    name: 'Ambiente Sano',
    description: 'Diagnóstico focalizado de seguridad psicológica en el área. 8 preguntas, 5-7 min, 100% confidencial. Permite confirmar o descartar los indicios detectados con data fresca del equipo.',
    cta: 'Lanzar diagnóstico al área'
  },
  
  /**
   * PULSO EXPRESS
   * - 12 preguntas, 5 minutos
   * - Termómetro rápido de clima organizacional
   * - IDEAL para: Medir estado actual del equipo post-alerta
   */
  pulso_express: {
    name: 'Pulso Express',
    description: 'Termómetro rápido del equipo. 12 preguntas, 5 min, anónimo. Detecta variaciones críticas y permite actuar antes de que escalen. Resultados en 48h.',
    cta: 'Tomar pulso al equipo'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Obtener salario promedio desde impactAssumptions
// NO hardcodear - usar configuración centralizada
// ═══════════════════════════════════════════════════════════════════════════════

function getAverageSalary(sector?: string): number {
  const salaries = CHILE_ECONOMIC_ADJUSTMENTS.average_salaries_by_sector;
  return salaries[sector as keyof typeof salaries] || salaries.default;
}

/**
 * Calcula costo de rotación usando metodología SHRM
 * @param monthlySalary - Salario mensual en CLP
 * @returns Costo de rotación (1.5x salario anual por defecto)
 */
function calculateTurnoverCost(monthlySalary: number): number {
  const turnoverAssumption = FinancialCalculator.getAssumption(
    'turnover_costs', 
    'replacement_cost_percentage'
  );
  const multiplier = turnoverAssumption 
    ? turnoverAssumption.recommended_value / 100 
    : 1.5; // Default 150% si no encuentra config
  
  return monthlySalary * 12 * multiplier;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUENTES METODOLÓGICAS POR TIPO
// ═══════════════════════════════════════════════════════════════════════════════

const METHODOLOGY_SOURCES: Record<string, MethodologySource[]> = {
  ley_karin: [
    { name: 'Ley 21.643 (Ley Karin)', description: 'Vigente desde 01/08/2024 - Prevención acoso laboral', year: 2024 },
    { name: 'Tutela Laboral Art. 489', description: 'Código del Trabajo - Indemnización 6-11 sueldos + daño moral' },
    { name: 'Dirección del Trabajo', description: 'Multas 3-60 UTM ($200K - $4M CLP)' }
  ],
  costos_rotacion: [
    { name: 'SHRM 2024', description: 'Cost-of-Turnover Study: 50-200% salario anual según nivel', year: 2024 },
    { name: 'Gallup 2024', description: 'State of Workplace: 0.5x - 2x salario según cargo', year: 2024 }
  ],
  crisis_reputacional: [
    { name: 'Deloitte Human Capital Trends', description: 'Empresas en crisis pierden hasta 30% valor en días', year: 2023 },
    { name: 'Harvard Business Review', description: 'Respuesta <24h reduce daño reputacional 40%' }
  ],
  liderazgo: [
    { name: 'Gallup 2024', description: '50% renuncia por jefe, 42% rotación es prevenible', year: 2024 },
    { name: 'McKinsey', description: 'Culturas tóxicas: productividad cae hasta 40%' },
    { name: 'Harvard Business Review', description: '75% dice jefe es lo más estresante del trabajo' }
  ],
  glassdoor: [
    { name: 'Glassdoor Research', description: '1 review negativo reduce candidatos 11%' },
    { name: 'LinkedIn Talent Solutions', description: 'Mala reputación = +20-30% costo reclutamiento', year: 2023 }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export class ExitAlertEngine {
  
  /**
   * MÉTODO PRINCIPAL: Genera BusinessCase completo desde alerta Exit
   * 
   * @param alert - Alerta Exit de la base de datos
   * @param exitRecord - Datos de la encuesta de salida (opcional)
   * @param departmentContext - Contexto del departamento para cálculos
   * @returns ExitBusinessCase completo con 8 secciones
   */
  static generateBusinessCaseFromAlert(
    alert: ExitAlert,
    exitRecord?: Partial<ExitRecordData>,
    departmentContext?: Partial<DepartmentContext>
  ): ExitBusinessCase {
    
    // Mapeo tipo alerta → generador específico
    // ⚠️ CRÍTICO: Los keys DEBEN coincidir con los valores que guarda la BD
    // Ver: ExitIntelligenceService.checkAndCreateLeyKarinAlert() → alertType: 'ley_karin'
    // Ver: prisma/schema.prisma → comentarios en ExitAlert.alertType
    const generators: Record<string, Function> = {
      // ═══════════════════════════════════════════════════════════════════
      // VALORES REALES DE LA BD (ExitAlertService + ExitIntelligenceService)
      // ═══════════════════════════════════════════════════════════════════
      'ley_karin': this.generateLeyKarinCase,
      'toxic_exit_detected': this.generateToxicExitCase,
      'nps_critico': this.generateNPSCriticalCase,
      'liderazgo_concentracion': this.generateConcentratedFactorCase,
      'department_exit_pattern': this.generateConcentratedFactorCase,
      'onboarding_exit_correlation': this.generateOnboardingCorrelationCase,
      
      // ═══════════════════════════════════════════════════════════════════
      // ALIASES (por si acaso se usan en algún lugar con nombres distintos)
      // ═══════════════════════════════════════════════════════════════════
      'ley_karin_indicios': this.generateLeyKarinCase,
      'toxic_exit': this.generateToxicExitCase,
      'denuncia_formal': this.generateDenunciaFormalCase,
      'nps_critical': this.generateNPSCriticalCase,
      'concentrated_factor': this.generateConcentratedFactorCase,
      'onboarding_correlation': this.generateOnboardingCorrelationCase
    };
    
    const alertType = alert.alertType as ExitAlertType;
    const generator = generators[alertType] || this.generateGenericCase;
    
    return generator.call(this, alert, exitRecord, departmentContext);
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // GENERADOR: LEY KARIN INDICIOS (v1.0)
  // Trigger: P6 Seguridad Psicológica < 2.5
  // ═══════════════════════════════════════════════════════════════════════════════
  
  private static generateLeyKarinCase(
    alert: ExitAlert,
    exitRecord?: Partial<ExitRecordData>,
    context?: Partial<DepartmentContext>
  ): ExitBusinessCase {
    
    const departmentName = context?.name || 'Sin Departamento';
    const employeeName = exitRecord?.participant?.fullName;
    const securityScore = alert.triggerScore || exitRecord?.p6SecurityPsychological || 0;
    
    // Usar salario desde contexto o desde impactAssumptions (NO hardcodear)
    const avgSalary = context?.avgSalary || getAverageSalary();
    
    // Cálculo de costos usando metodología centralizada
    const rotationCost = calculateTurnoverCost(avgSalary);
    const tutelaCost = avgSalary * 8.5 + 12_000_000; // Promedio 8.5 sueldos + daño moral $12M
    const interventionCost = 5_000_000; // Inversión prevención (diagnóstico + intervención)
    
    // Seleccionar casos emblemáticos relevantes (con rotación)
    const relevantCases = this.selectEmblamaticCases('cultura_toxica', 2);
    const mainStat = this.selectMainStatistic();
    
    return {
      id: `exit_ley_karin_${alert.id}`,
      alertId: alert.id,
      alertType: 'ley_karin_indicios',
      createdAt: new Date(),
      
      // ─────────────────────────────────────────────────────────────────────────
      // SECCIÓN 1: HEADER EJECUTIVO
      // ─────────────────────────────────────────────────────────────────────────
      header: {
        severity: this.calculateSeverity(securityScore, 2.5, 1.5),
        confidenceLevel: 'alta',
        title: `INDICIOS LEY KARIN - ${departmentName}`,
        badge: 'OPORTUNIDAD DE ANTICIPACIÓN',
        riskAmount: tutelaCost,
        riskFormatted: formatCurrencyCLP(tutelaCost),
        departmentName,
        employeeName
      },
      
      // ─────────────────────────────────────────────────────────────────────────
      // SECCIÓN 2: QUÉ DETECTAMOS (con pregunta exacta)
      // ─────────────────────────────────────────────────────────────────────────
      detection: {
        // La pregunta EXACTA que respondió el colaborador
        questionText: EXIT_SURVEY_QUESTIONS.p6_safety.questionText,
        questionId: EXIT_SURVEY_QUESTIONS.p6_safety.questionId,
        
        // Narrativa específica (NO genérica)
        summary: `Un colaborador de ${departmentName}, que dejó ${context?.companyName || 'la empresa'} indicó que NO percibió un ambiente seguro y respetuoso, libre de acoso o discriminación.`,
        
        // Interpretación humana clara
        interpretation: `Esta calificación indica que el colaborador NO percibió un ambiente seguro y respetuoso durante su tiempo en la empresa. Según la Ley 21.643 (Ley Karin), esto constituye un INDICIO —no una denuncia— que debe investigarse preventivamente para proteger a los colaboradores actuales del área.`,
        
        scoreLabel: EXIT_SURVEY_QUESTIONS.p6_safety.dimension,
        scoreValue: securityScore,
        scoreMax: EXIT_SURVEY_QUESTIONS.p6_safety.scaleMax,
        threshold: 2.5,
        
        disclaimer: '⚠️ NOTA LEGAL: Un indicio no implica responsabilidad. Es una señal que activa el deber de investigar preventivamente.',
        opportunityStatement: 'FocalizaHR les da lo que Uber NO tuvo: la capacidad de ver las señales ANTES de que exploten en la prensa.',
        
        additionalIndicators: exitRecord ? [
          { label: 'Exit Intelligence Score', value: `${exitRecord.eis || 0}/100` },
          { label: 'NPS', value: exitRecord.npsScore || 0 }
        ] : undefined
      },
      
      // ─────────────────────────────────────────────────────────────────────────
      // SECCIÓN 3: LA OPORTUNIDAD DE ORO
      // ─────────────────────────────────────────────────────────────────────────
      goldenOpportunity: {
        diagram: {
          stages: ['📍 INDICIOS', '📋 Denuncia Formal', '⚖️ Tutela Laboral', '🔥 ESCÁNDALO PÚBLICO'],
          currentStage: 0,
          currentLabel: 'Ustedes están AQUÍ - Oportunidad de actuar'
        },
        message: 'Tienen tiempo. Tienen información. Tienen la OPORTUNIDAD de actuar antes de que esto escale.',
        callToAction: '¿Cuánto habría pagado Uber por saber 6 meses antes? Ustedes tienen esa información AHORA. La pregunta es: ¿Qué van a hacer con ella?'
      },
      
      // ─────────────────────────────────────────────────────────────────────────
      // SECCIÓN 4: CASOS EMBLEMÁTICOS
      // ─────────────────────────────────────────────────────────────────────────
      emblamaticCases: {
        cases: relevantCases,
        statistic: mainStat
      },
      
      // ─────────────────────────────────────────────────────────────────────────
      // SECCIÓN 5: ESPECTRO DE COSTOS
      // ─────────────────────────────────────────────────────────────────────────
      costSpectrum: {
        actNow: {
          label: 'Actuar AHORA',
          cost: interventionCost,
          description: 'Inversión en diagnóstico + intervención preventiva',
          color: 'green'
        },
        escalateTutela: {
          label: 'Si escala a Tutela Laboral',
          costMin: avgSalary * 6 + 5_000_000,
          costMax: avgSalary * 11 + 20_000_000,
          description: '6-11 sueldos (Art. 489) + daño moral ($5M-$20M) + honorarios legales',
          color: 'yellow'
        },
        escalateScandal: {
          label: 'Si llega a prensa',
          description: 'Hasta 30% valor empresa (INCALCULABLE)',
          reference: 'United Airlines perdió $1.4 MIL MILLONES en UN DÍA por un video',
          color: 'red'
        }
      },
      
      // ─────────────────────────────────────────────────────────────────────────
      // SECCIÓN 6: PLAN DE ACCIÓN
      // ─────────────────────────────────────────────────────────────────────────
      actionPlan: {
        philosophy: 'No estamos juzgando. Estamos verificando para proteger.',
        steps: [
          {
            step: 1,
            title: 'REVISAR DATOS DEL SISTEMA',
            description: 'Antes de salir a terreno, revisa en FocalizaHR: ¿Hay otros Exit con P6 bajo en este departamento? ¿El EXO del área está bajo? ¿Hay alertas onboarding sin gestionar?',
            responsible: 'Tú (Gerente)',
            deadline: 'Mismo día',
            validationMetric: 'Tengo claridad si es señal aislada o patrón'
          },
          {
            step: 2,
            title: 'OBSERVACIÓN DISCRETA',
            description: 'Si hay más señales, pasa tiempo con el equipo. Observa sin alarmar: ¿Hay tensión? ¿Silencios? ¿Alguien evita a alguien?',
            responsible: 'Tú (Gerente)',
            deadline: '1-2 días',
            validationMetric: 'Observé el ambiente sin generar ruido'
          },
          {
            step: 3,
            title: 'CONVERSACIÓN DE CONFIANZA',
            description: 'Habla informalmente con 1-2 personas de confianza del equipo. Pregunta abierto: "¿Cómo sientes el ambiente últimamente?"',
            responsible: 'Tú (Gerente)',
            deadline: '2-3 días',
            validationMetric: 'Tengo perspectiva adicional del clima',
            suggestedProduct: FOCALIZA_PRODUCTS.pulso_express
          },
          {
            step: 4,
            title: 'ESCALAR SI HAY PATRÓN',
            description: 'Si confirmas que hay algo, solicita a Gerencia de Personas desplegar Ambiente Sano o ISD Departamental. Si no hay nada más, registra y monitorea.',
            responsible: 'Gerencia de Personas',
            deadline: 'Antes del SLA (24h)',
            validationMetric: 'Decisión tomada: escalar o monitorear',
            suggestedProduct: FOCALIZA_PRODUCTS.ambiente_sano
          }
        ],
        escalationCriteria: [
          'Ambiente Sano confirma scores críticos (<2.0 en seguridad)',
          'Surge denuncia formal durante la investigación',
          'Nuevas salidas mencionan mismos factores'
        ],
        successMetrics: [
          `Score seguridad psicológica sube de ${securityScore.toFixed(1)} a >3.5`,
          'Cero denuncias formales en 6 meses',
          'Rotación del área controlada (<15%)'
        ]
      },
      
      // ─────────────────────────────────────────────────────────────────────────
      // SECCIÓN 7: FUENTES METODOLÓGICAS
      // ─────────────────────────────────────────────────────────────────────────
      methodology: {
        sources: [
          ...METHODOLOGY_SOURCES.ley_karin,
          ...METHODOLOGY_SOURCES.crisis_reputacional
        ],
        disclaimer: 'Cálculos basados en datos de mercado chileno y estudios internacionales. Los montos son estimaciones conservadoras. El costo real de un escándalo puede ser significativamente mayor.'
      },
      
      // ─────────────────────────────────────────────────────────────────────────
      // SECCIÓN 8: OPCIONES DE RESOLUCIÓN
      // ─────────────────────────────────────────────────────────────────────────
      resolutionOptions: {
        quickPicks: [
          'Revisé datos en FocalizaHR → No hay más señales, registro y monitoreo',
          'Revisé datos → SÍ hay patrón, observé el ambiente en terreno',
          'Tuve conversaciones informales para validar el clima',
          'Solicité a Personas desplegar Ambiente Sano al área',
          'Solicité ISD Departamental para diagnóstico profundo'
        ],
        customPrompt: 'O describe la acción específica que tomaste:',
        minCharacters: 10,
        successMessage: '✅ Acción registrada. El sistema medirá automáticamente la efectividad en 60 días mediante seguimiento de indicadores del área.',
        followUpDays: 10
      }
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // GENERADOR: TOXIC EXIT (v1.1)
  // Trigger: EIS < 25
  // ═══════════════════════════════════════════════════════════════════════════════
  
  private static generateToxicExitCase(
    alert: ExitAlert,
    exitRecord?: Partial<ExitRecordData>,
    context?: Partial<DepartmentContext>
  ): ExitBusinessCase {
    
    const departmentName = context?.name || 'Sin Departamento';
    const employeeName = exitRecord?.participant?.fullName;
    const eis = alert.triggerScore || exitRecord?.eis || 0;
    
    // Usar salario desde contexto o desde impactAssumptions (NO hardcodear)
    const avgSalary = context?.avgSalary || getAverageSalary();
    
    // Riesgo de contagio (Gallup: 61% consideran irse)
    const teamSize = context?.employeeCount || 10;
    const atRiskEmployees = Math.ceil(teamSize * 0.61);
    const contagionRisk = atRiskEmployees * calculateTurnoverCost(avgSalary);
    
    const relevantCases = this.selectEmblamaticCases('cultura_toxica', 2);
    const mainStat = this.selectMainStatistic();
    
    return {
      id: `exit_toxic_${alert.id}`,
      alertId: alert.id,
      alertType: 'toxic_exit',
      createdAt: new Date(),
      
      header: {
        severity: this.calculateSeverityInverse(eis, 25, 15),
        confidenceLevel: 'alta',
        title: `EXIT TÓXICO DETECTADO - ${departmentName}`,
        badge: 'SEÑAL DE PROBLEMA SISTÉMICO',
        riskAmount: contagionRisk,
        riskFormatted: formatCurrencyCLP(contagionRisk),
        departmentName,
        employeeName
      },
      
      detection: {
        // EIS es compuesto, explicar qué mide
        questionText: EXIT_SURVEY_QUESTIONS.eis_composite.questionText,
        questionId: EXIT_SURVEY_QUESTIONS.eis_composite.questionId,
        
        // Narrativa específica
        summary: `Un colaborador de ${departmentName}, que dejó ${context?.companyName || 'la empresa'} tuvo una experiencia tan negativa (EIS: ${eis}/100 - TÓXICO) que representa riesgo de contagio al equipo actual.`,
        
        // Interpretación humana clara
        interpretation: `Un EIS de ${eis} indica una experiencia laboral extremadamente negativa. Según Gallup 2024, cuando un empleado se va por ambiente tóxico, hay 61% de probabilidad de que otros estén considerando irse también. Los problemas que causaron esta salida probablemente están afectando a más personas.`,
        
        scoreLabel: EXIT_SURVEY_QUESTIONS.eis_composite.dimension,
        scoreValue: eis,
        scoreMax: EXIT_SURVEY_QUESTIONS.eis_composite.scaleMax,
        threshold: 25,
        
        disclaimer: '📊 DATO: El EIS pondera P1 Satisfacción (25%), P4 Liderazgo (25%), P5 Desarrollo (20%), P3 Autonomía (15%) y P6 Seguridad (15%).',
        opportunityStatement: 'Esta persona va a hablar. En su círculo, en LinkedIn, en Glassdoor. Y los problemas que causaron su salida... ¿cuántos más los sienten?',
        
        additionalIndicators: exitRecord ? [
          { label: 'Satisfacción General (P1)', value: `${exitRecord.p1Satisfaction || 0}/5` },
          { label: 'Liderazgo (P4)', value: `${exitRecord.p4LeadershipSupport || 0}/5` },
          { label: 'Seguridad (P6)', value: `${exitRecord.p6SecurityPsychological || 0}/5` }
        ] : undefined
      },
      
      goldenOpportunity: {
        diagram: {
          stages: ['📍 1 Exit Tóxico', '👥 Contagio Equipo', '📢 Reviews Negativos', '🔥 Marca Destruida'],
          currentStage: 0,
          currentLabel: 'Oportunidad de contener el daño'
        },
        message: `Según Gallup, ${atRiskEmployees} personas de este equipo podrían estar considerando irse. ¿Van a esperar a que renuncien para actuar?`,
        callToAction: 'La pregunta no es SI van a perder más gente. Es CUÁNTOS y CUÁNDO.'
      },
      
      emblamaticCases: {
        cases: relevantCases,
        statistic: mainStat
      },
      
      costSpectrum: {
        actNow: {
          label: 'Intervenir AHORA',
          cost: 8_000_000,
          description: 'Stay interviews + Pulso al equipo + retención top performers',
          color: 'green'
        },
        escalateTutela: {
          label: 'Si se van 3+ más',
          costMin: calculateTurnoverCost(avgSalary) * 3,
          costMax: calculateTurnoverCost(avgSalary) * atRiskEmployees,
          description: `3 a ${atRiskEmployees} salidas adicionales × costo rotación`,
          color: 'yellow'
        },
        escalateScandal: {
          label: 'Si se hace público',
          description: 'Glassdoor destruido + incapacidad de atraer talento',
          reference: '1 review negativo Glassdoor = -11% candidatos',
          color: 'red'
        }
      },
      
      actionPlan: {
        philosophy: 'Esta salida ya ocurrió. Pero podemos evitar las siguientes.',
        steps: [
          {
            step: 1,
            title: 'ANALIZAR LOS FACTORES',
            description: 'Revisa en FocalizaHR qué factores mencionaron (Liderazgo, Desarrollo, Compensación, etc.). ¿Hay un factor repetido?',
            responsible: 'Tú (Gerente)',
            deadline: '1-2 días',
            validationMetric: 'Identifico qué factores son recurrentes'
          },
          {
            step: 2,
            title: 'CHEQUEAR AL EQUIPO ACTUAL',
            description: 'Conversa con 2-3 personas clave del equipo. No menciones los exits, pregunta: "¿Cómo están? ¿Qué les preocupa?"',
            responsible: 'Tú (Gerente)',
            deadline: '3-5 días',
            validationMetric: 'Tengo pulso informal del equipo actual',
            suggestedProduct: FOCALIZA_PRODUCTS.pulso_express
          },
          {
            step: 3,
            title: 'PROTEGER TALENTO CLAVE',
            description: 'Identifica a tus top performers. Asegúrate de que estén bien. Una salida tóxica puede contagiar a los buenos.',
            responsible: 'Tú (Gerente)',
            deadline: '1 semana',
            validationMetric: 'Talento clave está contenido'
          },
          {
            step: 4,
            title: 'SOLICITAR DIAGNÓSTICO SI HAY DUDA',
            description: 'Si el equipo muestra señales de desgaste, solicita a Personas un Pulso Express para tener mapa claro.',
            responsible: 'Gerencia de Personas',
            deadline: 'Antes del SLA (48h)',
            validationMetric: 'Diagnóstico solicitado o situación estable',
            suggestedProduct: FOCALIZA_PRODUCTS.pulso_express
          }
        ],
        escalationCriteria: [
          'Más de 1 renuncia adicional en 30 días',
          'Aparecen reviews negativos públicos (Glassdoor/LinkedIn)',
          'Top performers piden referencias'
        ],
        successMetrics: [
          'Cero salidas adicionales en 90 días',
          'Engagement del área mejora >10 puntos',
          'Top performers comprometidos y retenidos'
        ]
      },
      
      methodology: {
        sources: [
          ...METHODOLOGY_SOURCES.costos_rotacion,
          ...METHODOLOGY_SOURCES.liderazgo,
          ...METHODOLOGY_SOURCES.glassdoor
        ],
        disclaimer: 'Proyección de contagio basada en estudio Gallup 2024 (61% considera irse cuando compañero sale por ambiente tóxico).'
      },
      
      resolutionOptions: {
        quickPicks: [
          'Analicé factores de salida → No hay patrón, solo casos aislados',
          'Analicé factores → Hay patrón en [factor específico]',
          'Conversé con el equipo y están bien → Monitoreo',
          'Conversé con el equipo y hay desgaste → Solicité Pulso Express',
          'Blindé a talento clave con conversaciones individuales'
        ],
        customPrompt: 'O describe la acción específica que tomaste:',
        minCharacters: 10,
        successMessage: '✅ Acción registrada. Monitorearemos rotación y engagement del área en los próximos 90 días.',
        followUpDays: 14
      }
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // GENERADOR: DENUNCIA FORMAL (v1.2)
  // Trigger: DepartmentMetrics.complaints > 0
  // ═══════════════════════════════════════════════════════════════════════════════
  
  private static generateDenunciaFormalCase(
    alert: ExitAlert,
    exitRecord?: Partial<ExitRecordData>,
    context?: Partial<DepartmentContext>
  ): ExitBusinessCase {
    
    const departmentName = context?.name || 'Sin Departamento';
    
    // Usar salario desde contexto o desde impactAssumptions (NO hardcodear)
    const avgSalary = context?.avgSalary || getAverageSalary();
    const complaintCount = alert.exitCount || 1;
    
    // Cálculo de costos con denuncia formal
    const tutelaCost = avgSalary * 11 + 20_000_000; // Máximo tutela + daño moral alto
    const legalCost = 8_000_000; // Honorarios legales
    const totalRisk = tutelaCost + legalCost;
    
    const relevantCases = this.selectEmblamaticCases('cultura_toxica', 2);
    const mainStat = {
      value: '6-11',
      description: 'sueldos de indemnización por tutela laboral, MÁS daño moral adicional',
      source: 'Art. 489 Código del Trabajo Chile'
    };
    
    return {
      id: `exit_denuncia_${alert.id}`,
      alertId: alert.id,
      alertType: 'denuncia_formal',
      createdAt: new Date(),
      
      header: {
        severity: 'crítica',
        confidenceLevel: 'alta',
        title: `⚠️ DENUNCIA FORMAL - ${departmentName}`,
        badge: 'REQUIERE ACCIÓN INMEDIATA',
        riskAmount: totalRisk,
        riskFormatted: formatCurrencyCLP(totalRisk),
        departmentName
      },
      
      detection: {
        // Denuncia formal - contexto legal
        questionText: 'Denuncia formal registrada bajo protocolo Ley 21.643 (Ley Karin).',
        questionId: 'DENUNCIA',
        
        summary: `Se ha registrado ${complaintCount} denuncia(s) formal(es) en ${departmentName} de ${context?.companyName || 'la empresa'}. Esto activa obligaciones legales con plazos estrictos según la Ley 21.643.`,
        
        interpretation: 'Una vez existe denuncia formal, la empresa tiene obligaciones legales inmediatas: activar protocolo de investigación, implementar medidas de resguardo, y completar la investigación en máximo 30 días. El incumplimiento de plazos agrava las sanciones. La forma en que manejen esta denuncia definirá si el problema se contiene o se convierte en un escándalo mayor.',
        
        scoreLabel: 'Denuncias Activas',
        scoreValue: complaintCount,
        scoreMax: 10,
        threshold: 1,
        
        disclaimer: '⚖️ LEGAL: Plazos Ley Karin son OBLIGATORIOS. Medidas de resguardo en 48h, investigación completa en 30 días.',
        opportunityStatement: 'Ya no es prevención. Es gestión de crisis. Pero AÚN pueden manejar esto internamente si actúan correctamente.'
      },
      
      goldenOpportunity: {
        diagram: {
          stages: ['Indicios', '📍 DENUNCIA', '⚖️ Investigación', '🔥 Resolución/Escándalo'],
          currentStage: 1,
          currentLabel: 'Denuncia activa - Protocolos obligatorios'
        },
        message: 'Ya no es prevención. Es gestión de crisis. Pero AÚN pueden manejar esto internamente si actúan correctamente.',
        callToAction: 'La diferencia entre una denuncia bien manejada y un escándalo es la VELOCIDAD y TRANSPARENCIA de la respuesta.'
      },
      
      emblamaticCases: {
        cases: relevantCases,
        statistic: mainStat
      },
      
      costSpectrum: {
        actNow: {
          label: 'Protocolo Ley Karin correcto',
          cost: legalCost,
          description: 'Investigación formal + asesoría legal + medidas resguardo',
          color: 'green'
        },
        escalateTutela: {
          label: 'Si llega a Tribunales',
          costMin: avgSalary * 6 + 5_000_000 + legalCost,
          costMax: avgSalary * 11 + 20_000_000 + legalCost * 2,
          description: 'Tutela laboral 6-11 sueldos + daño moral + costos legales aumentados',
          color: 'yellow'
        },
        escalateScandal: {
          label: 'Si se hace público',
          description: 'Daño reputacional irreparable + efecto dominó denuncias',
          reference: 'Uber: 1 blog post de Susan Fowler → CEO despedido, 20+ ejecutivos fuera',
          color: 'red'
        }
      },
      
      actionPlan: {
        philosophy: 'Esto ya es gestión de crisis. Cada hora cuenta.',
        steps: [
          {
            step: 1,
            title: 'ACTIVAR PROTOCOLO LEY KARIN',
            description: 'Notificar a Legal inmediatamente. Documentar TODO por escrito. No hablar del caso fuera del círculo necesario.',
            responsible: 'Gerente RRHH + Legal',
            deadline: '24 horas',
            validationMetric: 'Protocolo activado y documentado'
          },
          {
            step: 2,
            title: 'MEDIDAS DE RESGUARDO',
            description: 'Separar funciones denunciante/denunciado si es necesario. Proteger al denunciante de represalias.',
            responsible: 'RRHH + Jefatura',
            deadline: '48 horas',
            validationMetric: 'Medidas implementadas y comunicadas'
          },
          {
            step: 3,
            title: 'INVESTIGACIÓN FORMAL',
            description: 'Iniciar investigación con plazo máximo 30 días. Considerar investigador externo para imparcialidad.',
            responsible: 'Investigador designado',
            deadline: '30 días máximo',
            validationMetric: 'Informe de investigación completo'
          }
        ],
        escalationCriteria: [
          'Denunciante reporta represalias',
          'Aparecen denuncias adicionales',
          'Medios de comunicación contactan a la empresa',
          'Trabajador interpone tutela en tribunales'
        ],
        successMetrics: [
          'Investigación completada en plazo legal',
          'Cero represalias contra denunciante',
          'Medidas correctivas implementadas',
          'Caso resuelto internamente (sin tribunales)'
        ]
      },
      
      methodology: {
        sources: [
          ...METHODOLOGY_SOURCES.ley_karin,
          ...METHODOLOGY_SOURCES.crisis_reputacional
        ],
        disclaimer: 'En caso de denuncia formal, consulte SIEMPRE con asesoría legal especializada. Los plazos y procedimientos de Ley Karin son obligatorios.'
      },
      
      resolutionOptions: {
        quickPicks: [
          'Activé protocolo Ley Karin inmediatamente',
          'Notifiqué a Legal y documenté todo por escrito',
          'Implementé medidas de resguardo para denunciante',
          'Separé funciones denunciante/denunciado temporalmente',
          'Inicié investigación formal con plazo 30 días',
          'Contraté investigador externo para imparcialidad'
        ],
        customPrompt: 'O describe la acción específica que tomaste:',
        minCharacters: 10,
        successMessage: '✅ Acción registrada. CRÍTICO: Asegure cumplimiento de plazos legales Ley Karin.',
        followUpDays: 30
      }
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // GENERADOR: NPS CRÍTICO (v2.0)
  // Trigger: eNPS < -20
  // ═══════════════════════════════════════════════════════════════════════════════
  
  private static generateNPSCriticalCase(
    alert: ExitAlert,
    exitRecord?: Partial<ExitRecordData>,
    context?: Partial<DepartmentContext>
  ): ExitBusinessCase {
    
    const departmentName = context?.name || 'Sin Departamento';
    
    // Usar salario desde contexto o desde impactAssumptions (NO hardcodear)
    const avgSalary = context?.avgSalary || getAverageSalary();
    const enps = alert.enpsValue || -30;
    const teamSize = context?.employeeCount || 15;
    
    // Con eNPS < -20, la mayoría son detractores activos
    const detractorCount = Math.ceil(teamSize * 0.6);
    const projectedTurnover = Math.ceil(detractorCount * 0.4); // 40% de detractores suelen irse
    const turnoverRisk = projectedTurnover * calculateTurnoverCost(avgSalary);
    
    const relevantCases = this.selectEmblamaticCases('reputacion', 2);
    const mainStat = this.selectMainStatistic();
    
    return {
      id: `exit_nps_${alert.id}`,
      alertId: alert.id,
      alertType: 'nps_critical',
      createdAt: new Date(),
      
      header: {
        severity: enps < -40 ? 'crítica' : enps < -30 ? 'alta' : 'media',
        confidenceLevel: 'alta',
        title: `NPS CRÍTICO - ${departmentName}`,
        badge: 'DETRACTORES ACTIVOS',
        riskAmount: turnoverRisk,
        riskFormatted: formatCurrencyCLP(turnoverRisk),
        departmentName
      },
      
      detection: {
        // La pregunta EXACTA de NPS
        questionText: EXIT_SURVEY_QUESTIONS.p7_nps.questionText,
        questionId: EXIT_SURVEY_QUESTIONS.p7_nps.questionId,
        
        // Narrativa específica
        summary: `Un colaborador de ${departmentName}, que dejó ${context?.companyName || 'la empresa'} NO recomendaría la empresa como lugar de trabajo (eNPS: ${enps}). Esto significa que la mayoría de los colaboradores del área NO recomendarían trabajar aquí.`,
        
        // Interpretación humana clara
        interpretation: `Un eNPS negativo indica más detractores que promotores activos. Estos ${detractorCount} empleados no solo NO refieren talento — están hablando MAL de la empresa en sus círculos, LinkedIn y potencialmente en Glassdoor. El costo de reclutamiento puede aumentar 20-30% cuando la marca empleadora está dañada.`,
        
        scoreLabel: EXIT_SURVEY_QUESTIONS.p7_nps.dimension,
        scoreValue: enps,
        scoreMax: 100, // eNPS va de -100 a +100
        threshold: -20,
        
        disclaimer: '📊 eNPS = % Promotores (9-10) - % Detractores (0-6). Un eNPS negativo significa más detractores que promotores.',
        opportunityStatement: `Aproximadamente ${detractorCount} personas en este equipo NO recomendarían trabajar aquí. ¿Qué creen que están diciendo afuera?`
      },
      
      goldenOpportunity: {
        diagram: {
          stages: ['📍 NPS Crítico', '👎 Detractores Vocales', '📢 Reputación Dañada', '🔥 Incapacidad Contratar'],
          currentStage: 0,
          currentLabel: 'Detractores activos - Oportunidad de conversión'
        },
        message: 'Cada detractor es una oportunidad perdida de referido Y un riesgo de review negativo. Pero AÚN pueden convertir detractores en promotores.',
        callToAction: '¿Qué van a hacer para que estas personas QUIERAN recomendar trabajar aquí?'
      },
      
      emblamaticCases: {
        cases: relevantCases,
        statistic: mainStat
      },
      
      costSpectrum: {
        actNow: {
          label: 'Plan de mejora focalizado',
          cost: 6_000_000,
          description: 'Diagnóstico profundo + acciones correctivas + seguimiento',
          color: 'green'
        },
        escalateTutela: {
          label: 'Si detractores se van',
          costMin: calculateTurnoverCost(avgSalary) * 2,
          costMax: turnoverRisk,
          description: `${projectedTurnover} salidas proyectadas × costo rotación`,
          color: 'yellow'
        },
        escalateScandal: {
          label: 'Si marca empleadora colapsa',
          description: 'Time-to-fill duplicado + costos reclutamiento +30%',
          reference: 'LinkedIn: Mala reputación = +20-30% costo reclutamiento',
          color: 'red'
        }
      },
      
      actionPlan: {
        philosophy: 'Convertir detractores en pasivos es más barato que reemplazarlos.',
        steps: [
          {
            step: 1,
            title: 'ENTENDER LA BRECHA',
            description: 'Revisa en FocalizaHR qué dijeron. ¿La decepción es por sueldo? ¿Por promesas incumplidas? ¿Por el jefe?',
            responsible: 'Tú (Gerente)',
            deadline: '1-2 días',
            validationMetric: 'Identifico la causa raíz de la decepción'
          },
          {
            step: 2,
            title: 'VALIDAR CON EQUIPO ACTUAL',
            description: 'Pregunta a tu equipo actual: "¿Lo que les prometimos cuando entraron se cumplió?". Busca la misma brecha.',
            responsible: 'Tú (Gerente)',
            deadline: '1 semana',
            validationMetric: 'Sé si la brecha también afecta a los actuales'
          },
          {
            step: 3,
            title: 'SINCERAR O CORREGIR',
            description: 'Si hay brecha real: corrige lo que puedas (carga, expectativas, desarrollo). Si es percepción: trabaja comunicación.',
            responsible: 'Tú (Gerente) + RRHH si aplica',
            deadline: '2 semanas',
            validationMetric: 'Acción correctiva definida',
            suggestedProduct: FOCALIZA_PRODUCTS.pulso_express
          },
          {
            step: 4,
            title: 'FEEDBACK A ATRACCIÓN',
            description: 'Si el problema viene desde la selección, habla con Personas: "Estamos sobrevendiendo el cargo".',
            responsible: 'Gerencia de Personas',
            deadline: 'Antes del SLA (48h)',
            validationMetric: 'Personas tiene el feedback para ajustar'
          }
        ],
        escalationCriteria: [
          'NPS no mejora después de acciones',
          'Aparecen reviews negativos públicos',
          'Rotación del área supera 20%'
        ],
        successMetrics: [
          `eNPS sube de ${enps} a >0 en 90 días`,
          'Cero reviews negativos nuevos',
          'Rotación controlada (<15%)'
        ]
      },
      
      methodology: {
        sources: [
          ...METHODOLOGY_SOURCES.costos_rotacion,
          ...METHODOLOGY_SOURCES.glassdoor,
          { name: 'Bain & Company', description: 'NPS Methodology - Detractors impact brand 5x more than promoters' }
        ],
        disclaimer: 'El eNPS es un indicador adelantado de problemas. Actuar ahora previene pérdidas mayores.'
      },
      
      resolutionOptions: {
        quickPicks: [
          'Identifiqué la brecha → Es tema de compensación, escalé a Personas',
          'Identifiqué la brecha → Es tema de expectativas, las sinceré con el equipo',
          'Validé con equipo actual → No hay brecha, son casos aislados',
          'Di feedback a Personas sobre el perfil de búsqueda',
          'Realicé actividad de reconocimiento para reforzar pertenencia'
        ],
        customPrompt: 'O describe la acción específica que tomaste:',
        minCharacters: 10,
        successMessage: '✅ Acción registrada. Mediremos evolución del NPS en 90 días.',
        followUpDays: 30
      }
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // GENERADOR: CONCENTRATED FACTOR (v2.0)
  // Trigger: ≥3 exits mencionan mismo factor en 90 días
  // ═══════════════════════════════════════════════════════════════════════════════
  
  private static generateConcentratedFactorCase(
    alert: ExitAlert,
    exitRecord?: Partial<ExitRecordData>,
    context?: Partial<DepartmentContext>
  ): ExitBusinessCase {
    
    const departmentName = context?.name || 'Sin Departamento';
    
    // Usar salario desde contexto o desde impactAssumptions (NO hardcodear)
    const avgSalary = context?.avgSalary || getAverageSalary();
    const factor = alert.triggerFactor || 'Liderazgo';
    const exitCount = alert.exitCount || 3;
    const avgScore = alert.avgScore || 2.0;
    const teamSize = context?.employeeCount || 15;
    
    // Proyección: Si el patrón continúa, cuántos más se irán
    const projectedAdditional = Math.ceil(teamSize * 0.25); // 25% adicional en riesgo
    const turnoverCostUnit = calculateTurnoverCost(avgSalary);
    const historicCost = exitCount * turnoverCostUnit;
    const projectedCost = projectedAdditional * turnoverCostUnit;
    const totalRisk = historicCost + projectedCost;
    
    const isLeadershipFactor = factor.toLowerCase().includes('liderazgo');
    const relevantCases = this.selectEmblamaticCases(isLeadershipFactor ? 'liderazgo' : 'cultura_toxica', 2);
    const mainStat = {
      value: '50%',
      description: 'de empleados renuncian para escapar de su JEFE, no de la empresa',
      source: 'Gallup 2024'
    };
    
    return {
      id: `exit_pattern_${alert.id}`,
      alertId: alert.id,
      alertType: 'concentrated_factor',
      createdAt: new Date(),
      
      header: {
        severity: exitCount >= 5 ? 'crítica' : exitCount >= 4 ? 'alta' : 'media',
        confidenceLevel: 'alta',
        title: `PATRÓN CONFIRMADO: ${factor.toUpperCase()} - ${departmentName}`,
        badge: 'PROBLEMA SISTÉMICO IDENTIFICADO',
        riskAmount: totalRisk,
        riskFormatted: formatCurrencyCLP(totalRisk),
        departmentName
      },
      
      detection: {
        // Determinar qué pregunta aplica según el factor
        questionText: isLeadershipFactor 
          ? EXIT_SURVEY_QUESTIONS.p4_leadership.questionText
          : `Factor detectado: "${factor}" - Mencionado consistentemente por ${exitCount} personas que dejaron el área.`,
        questionId: isLeadershipFactor ? 'P4' : 'P2/P3',
        
        // Narrativa específica
        summary: `${exitCount} colaboradores de ${departmentName}, que dejaron ${context?.companyName || 'la empresa'} mencionaron "${factor}" como factor principal de salida (score promedio: ${avgScore.toFixed(1)}/5.0). Esto NO es coincidencia — es un PATRÓN CONFIRMADO.`,
        
        // Interpretación humana clara
        interpretation: isLeadershipFactor
          ? `Cuando ${exitCount} personas independientes mencionan al mismo líder como factor de salida, la probabilidad de que sea coincidencia es prácticamente CERO. Según Gallup 2024, 50% de empleados renuncian para escapar de su JEFE, no de la empresa. El costo de proteger a un mal líder supera con creces el costo de reemplazarlo.`
          : `Un patrón con ${exitCount}+ coincidencias tiene >95% de probabilidad de ser sistemático, no aleatorio. Las personas están votando "con los pies" — y están diciendo exactamente qué está mal. La pregunta es si van a escuchar.`,
        
        scoreLabel: `Score ${factor}`,
        scoreValue: avgScore,
        scoreMax: 5.0,
        threshold: 3.0,
        
        disclaimer: `📊 ${exitCount} personas independientes reportan el mismo problema. Patrón confirmado con alta confianza estadística.`,
        opportunityStatement: 'La buena noticia: un patrón identificado es un problema que SE PUEDE resolver. La pregunta es si van a actuar.',
        
        additionalIndicators: [
          { label: 'Exits con este factor', value: exitCount },
          { label: 'Período', value: 'Últimos 90 días' },
          { label: 'Proyección adicional', value: `${projectedAdditional} en riesgo` }
        ]
      },
      
      goldenOpportunity: {
        diagram: {
          stages: ['📍 Patrón Detectado', '📋 Diagnóstico Causa', '🔧 Intervención', '✅ Patrón Roto'],
          currentStage: 0,
          currentLabel: 'Patrón confirmado - Causa raíz identificable'
        },
        message: `Ya perdieron ${exitCount} personas por la misma razón. Si no actúan, van a perder ${projectedAdditional} más.`,
        callToAction: isLeadershipFactor 
          ? '¿Van a seguir protegiendo a un líder que les cuesta millones en rotación?'
          : '¿Van a seguir ignorando lo que múltiples personas les están diciendo?'
      },
      
      emblamaticCases: {
        cases: relevantCases,
        statistic: mainStat
      },
      
      costSpectrum: {
        actNow: {
          label: 'Intervención estructural',
          cost: 12_000_000,
          description: isLeadershipFactor 
            ? 'Assessment 360° + coaching/cambio de liderazgo' 
            : 'Diagnóstico profundo + rediseño de área',
          color: 'green'
        },
        escalateTutela: {
          label: 'Si el patrón continúa',
          costMin: projectedCost,
          costMax: projectedCost * 1.5,
          description: `${projectedAdditional}+ salidas adicionales proyectadas`,
          color: 'yellow'
        },
        escalateScandal: {
          label: 'Si se hace público',
          description: 'El patrón se convierte en "lo que todos saben" → nadie quiere trabajar ahí',
          reference: 'Uber: "High performer" protegido → escándalo que tumbó al CEO',
          color: 'red'
        }
      },
      
      actionPlan: {
        philosophy: 'Un patrón identificado es una oportunidad. Ignorarlo es una decisión.',
        steps: isLeadershipFactor ? [
          {
            step: 1,
            title: 'VALIDAR EL PATRÓN',
            description: 'Revisa los 3+ casos en FocalizaHR. ¿Es el mismo líder? ¿El mismo tipo de queja? Confirma que no es coincidencia.',
            responsible: 'Tú (Gerente de área o BP)',
            deadline: '1-2 días',
            validationMetric: 'Patrón confirmado con evidencia'
          },
          {
            step: 2,
            title: 'FEEDBACK DIRECTO AL LÍDER',
            description: `Siéntate con el líder. Muéstrale los datos sin juzgar: "Tenemos ${exitCount} salidas que mencionan tu gestión. Quiero entender qué está pasando."`,
            responsible: 'Tú (Gerente o BP)',
            deadline: '1 semana',
            validationMetric: 'Líder tiene claridad del problema'
          },
          {
            step: 3,
            title: 'PLAN DE CAMBIO CONCRETO',
            description: 'Acuerda 2 cambios de conducta específicos y medibles. Ejemplo: "No interrumpir", "Dar feedback en privado". Monitorea.',
            responsible: 'Líder + Tú',
            deadline: '2 semanas',
            validationMetric: 'Compromisos acordados y en seguimiento'
          },
          {
            step: 4,
            title: 'APOYO PROFESIONAL SI NO MEJORA',
            description: 'Si en 30 días no hay cambio, solicita a Personas apoyo de Coach o evaluación 360° (ISD Departamental).',
            responsible: 'Gerencia de Personas',
            deadline: '30 días',
            validationMetric: 'Intervención profesional activada'
          }
        ] : [
          {
            step: 1,
            title: 'DIAGNOSTICAR CON DATOS',
            description: 'Revisa en FocalizaHR: EIS del área, factores mencionados, EXO si hay, alertas históricas. Busca el patrón.',
            responsible: 'Tú (Gerente)',
            deadline: '1-2 días',
            validationMetric: 'Tengo hipótesis de causa raíz'
          },
          {
            step: 2,
            title: 'ESCUCHA DIRECTA',
            description: 'Junta al equipo (sin mandos medios si es necesario). Pregunta: "¿Qué es lo más difícil de trabajar aquí hoy?"',
            responsible: 'Tú (Gerente)',
            deadline: '1 semana',
            validationMetric: 'Escuché sin filtro del equipo'
          },
          {
            step: 3,
            title: 'QUICK WINS',
            description: 'Identifica 1-2 cosas que puedas resolver rápido (recursos, condiciones, burocracia). Hazlas esta semana.',
            responsible: 'Tú (Gerente)',
            deadline: '1 semana',
            validationMetric: 'Quick win ejecutado y comunicado',
            suggestedProduct: FOCALIZA_PRODUCTS.pulso_express
          },
          {
            step: 4,
            title: 'DIAGNÓSTICO PROFUNDO SI PERSISTE',
            description: 'Si el problema es estructural, solicita a Personas aplicar ISD (Inteligencia Departamental) para análisis completo.',
            responsible: 'Gerencia de Personas',
            deadline: '2-3 semanas',
            validationMetric: 'ISD solicitado o problema resuelto',
            suggestedProduct: FOCALIZA_PRODUCTS.ambiente_sano
          }
        ],
        escalationCriteria: [
          'Líder no reconoce problema después de ver datos',
          'No implementa cambios después de coaching',
          'Rotación continúa o acelera'
        ],
        successMetrics: [
          'Cero salidas por este factor en próximos 6 meses',
          `Score de ${factor} sube de ${avgScore.toFixed(1)} a >3.5`,
          'Equipo reporta mejora en clima'
        ]
      },
      
      methodology: {
        sources: [
          ...METHODOLOGY_SOURCES.liderazgo,
          ...METHODOLOGY_SOURCES.costos_rotacion
        ],
        disclaimer: 'Un patrón con 3+ coincidencias tiene >95% de probabilidad de ser sistemático, no aleatorio.'
      },
      
      resolutionOptions: {
        quickPicks: isLeadershipFactor ? [
          'Validé el patrón → Es real, involucra al mismo líder',
          'Di feedback directo al líder con los datos',
          'Acordamos cambios de conducta específicos',
          'Solicité a Personas apoyo de Coaching/360°',
          'El líder no tiene herramientas → Solicité ISD Departamental'
        ] : [
          'Diagnostiqué con datos → Problema es de recursos/condiciones',
          'Diagnostiqué con datos → Problema es de liderazgo/clima',
          'Realicé sesión de escucha con el equipo',
          'Ejecuté quick wins (mejoras inmediatas)',
          'Solicité a Personas aplicar ISD Departamental'
        ],
        customPrompt: 'O describe la acción específica que tomaste:',
        minCharacters: 10,
        successMessage: '✅ Acción registrada. Monitorearemos si el patrón se rompe en los próximos 120 días.',
        followUpDays: 45
      }
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // GENERADOR: ONBOARDING CORRELATION (v2.0)
  // Trigger: ≥70% exits tuvieron alertas onboarding NO gestionadas
  // ═══════════════════════════════════════════════════════════════════════════════
  
  private static generateOnboardingCorrelationCase(
    alert: ExitAlert,
    exitRecord?: Partial<ExitRecordData>,
    context?: Partial<DepartmentContext>
  ): ExitBusinessCase {
    
    const departmentName = context?.name || 'Sin Departamento';
    
    // Usar salario desde contexto o desde impactAssumptions (NO hardcodear)
    const avgSalary = context?.avgSalary || getAverageSalary();
    const correlationRate = (alert.avgScore || 75) / 100; // % de exits con alertas ignoradas
    const exitCount = alert.exitCount || 5;
    
    // Cálculo: Lo que SE PUDO prevenir
    const turnoverCostUnit = calculateTurnoverCost(avgSalary);
    const preventableCost = Math.ceil(exitCount * correlationRate) * turnoverCostUnit;
    const onboardingWasted = Math.ceil(exitCount * correlationRate) * 3_000_000; // $3M inversión onboarding por persona
    const totalWasted = preventableCost + onboardingWasted;
    
    const relevantCases = this.selectEmblamaticCases('cultura_toxica', 1);
    const mainStat = {
      value: '75%',
      description: 'de quienes renuncian en 18 meses DECIDIERON irse en los primeros 90 días',
      source: 'Aberdeen Group'
    };
    
    return {
      id: `exit_correlation_${alert.id}`,
      alertId: alert.id,
      alertType: 'onboarding_correlation',
      createdAt: new Date(),
      
      header: {
        severity: correlationRate >= 0.8 ? 'crítica' : correlationRate >= 0.7 ? 'alta' : 'media',
        confidenceLevel: 'alta',
        title: `CORRELACIÓN CRÍTICA - ${departmentName}`,
        badge: 'ALERTAS IGNORADAS',
        riskAmount: totalWasted,
        riskFormatted: formatCurrencyCLP(totalWasted),
        departmentName
      },
      
      detection: {
        // Correlación alertas ignoradas
        questionText: 'Análisis de correlación entre alertas de Onboarding ignoradas y salidas posteriores.',
        questionId: 'CORRELACIÓN',
        
        summary: `De las últimas ${exitCount} salidas de ${departmentName} en ${context?.companyName || 'la empresa'}, el ${Math.round(correlationRate * 100)}% tuvieron alertas de onboarding que NO fueron gestionadas. El sistema ADVIRTIÓ que había problemas. Y nadie actuó.`,
        
        interpretation: `${Math.ceil(exitCount * correlationRate)} personas se fueron después de que FocalizaHR generó alertas tempranas sobre ellas. Según Aberdeen Group, 75% de quienes renuncian en los primeros 18 meses DECIDIERON irse en los primeros 90 días. Las alertas de onboarding son PREDICTORES — si nadie actúa sobre ellas, ¿qué esperábamos?`,
        
        scoreLabel: 'Correlación alertas ignoradas',
        scoreValue: correlationRate * 100,
        scoreMax: 100,
        threshold: 70,
        
        disclaimer: '📊 Esta correlación demuestra que el sistema predictivo funciona. El problema no es la detección — es la falta de acción.',
        opportunityStatement: `${Math.ceil(exitCount * correlationRate)} salidas ERAN EVITABLES. El costo total desperdiciado: ${formatCurrencyCLP(totalWasted)}.`,
        
        additionalIndicators: [
          { label: 'Exits analizados', value: exitCount },
          { label: 'Con alertas ignoradas', value: Math.ceil(exitCount * correlationRate) },
          { label: 'Inversión onboarding perdida', value: formatCurrencyCLP(onboardingWasted) }
        ]
      },
      
      goldenOpportunity: {
        diagram: {
          stages: ['⚠️ Alertas Onboarding', '❌ Ignoradas', '👋 Exit', '📍 Ahora: Lección'],
          currentStage: 3,
          currentLabel: 'Oportunidad de arreglar el PROCESO'
        },
        message: 'El sistema de alertas funciona. El problema es que nadie actúa sobre ellas. Eso es un problema de PROCESO, no de tecnología.',
        callToAction: '¿Van a seguir teniendo alertas que nadie gestiona, o van a crear accountability?'
      },
      
      emblamaticCases: {
        cases: relevantCases,
        statistic: mainStat
      },
      
      costSpectrum: {
        actNow: {
          label: 'Arreglar el proceso',
          cost: 4_000_000,
          description: 'Rediseño flujo de alertas + capacitación + KPIs',
          color: 'green'
        },
        escalateTutela: {
          label: 'Si siguen ignorando alertas',
          costMin: preventableCost,
          costMax: preventableCost * 2,
          description: 'Más salidas prevenibles + onboarding desperdiciado',
          color: 'yellow'
        },
        escalateScandal: {
          label: 'Patrón sistemático de negligencia',
          description: 'Cultura de "alertas que nadie lee" → problemas mayores',
          reference: 'Boeing: Ingenieros alertaron sobre 737 MAX. Nadie escuchó. 346 muertes.',
          color: 'red'
        }
      },
      
      actionPlan: {
        philosophy: 'No tiene sentido tener un sistema de alertas si nadie las gestiona.',
        steps: [
          {
            step: 1,
            title: 'ENTENDER QUÉ FALLÓ',
            description: '¿Por qué no se gestionaron las alertas? ¿Falta de tiempo? ¿No se vieron? Revisa las alertas que se ignoraron.',
            responsible: 'Tú + Buddy/Jefe del colaborador',
            deadline: '1-2 días',
            validationMetric: 'Identifico el gap de proceso'
          },
          {
            step: 2,
            title: 'RESCATAR A LOS NUEVOS ACTUALES',
            description: 'Revisa HOY quiénes entraron hace poco al área. ¿Tienen alertas activas? Gestiónalas AHORA.',
            responsible: 'Tú (Gerente)',
            deadline: 'Mismo día',
            validationMetric: 'Nuevos ingresos revisados y alertas gestionadas'
          },
          {
            step: 3,
            title: 'AJUSTAR PROCESO',
            description: 'Si el buddy/jefe no está gestionando alertas, habla con ellos. Aclara que es su responsabilidad.',
            responsible: 'Tú (Gerente)',
            deadline: '1 semana',
            validationMetric: 'Responsabilidades clarificadas'
          },
          {
            step: 4,
            title: 'SOLICITAR APOYO SI HAY MUCHOS JOURNEYS',
            description: 'Si tienes muchos ingresos y no das abasto, pide a Personas apoyo para monitorear Journeys críticos.',
            responsible: 'Gerencia de Personas',
            deadline: '2 semanas',
            validationMetric: 'Apoyo solicitado o situación manejable'
          }
        ],
        escalationCriteria: [
          'Tasa de alertas ignoradas no baja de 50%',
          'Gerentes argumentan que "no tienen tiempo"',
          'Nuevas salidas correlacionan con alertas ignoradas'
        ],
        successMetrics: [
          '% alertas gestionadas en SLA: >90%',
          'Correlación alertas ignoradas → exits: <30%',
          'Rotación primeros 90 días: -30%'
        ]
      },
      
      methodology: {
        sources: [
          { name: 'Aberdeen Group', description: '75% decisión de quedarse/irse se toma en primeros 90 días' },
          ...METHODOLOGY_SOURCES.costos_rotacion
        ],
        disclaimer: 'La correlación alertas-exit demuestra que el sistema predictivo funciona. El desafío es la acción, no la detección.'
      },
      
      resolutionOptions: {
        quickPicks: [
          'Identifiqué por qué no se gestionaron las alertas',
          'Revisé y gestioné alertas de los nuevos ingresos actuales',
          'Tuve conversación de accountability con el responsable',
          'Corregí el proceso de seguimiento de onboarding',
          'Solicité a Personas apoyo en Journeys críticos'
        ],
        customPrompt: 'O describe la acción específica que tomaste:',
        minCharacters: 10,
        successMessage: '✅ Acción registrada. Monitorearemos la tasa de gestión de alertas en 90 días.',
        followUpDays: 45
      }
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // GENERADOR: CASO GENÉRICO (Fallback)
  // ═══════════════════════════════════════════════════════════════════════════════
  
  private static generateGenericCase(
    alert: ExitAlert,
    exitRecord?: Partial<ExitRecordData>,
    context?: Partial<DepartmentContext>
  ): ExitBusinessCase {
    
    const departmentName = context?.name || 'Sin Departamento';
    
    // Usar salario desde contexto o desde impactAssumptions (NO hardcodear)
    const avgSalary = context?.avgSalary || getAverageSalary();
    const baseRisk = calculateTurnoverCost(avgSalary);
    
    const relevantCases = this.selectEmblamaticCases('cultura_toxica', 1);
    const mainStat = this.selectMainStatistic();
    
    return {
      id: `exit_generic_${alert.id}`,
      alertId: alert.id,
      alertType: alert.alertType as ExitAlertType,
      createdAt: new Date(),
      
      header: {
        severity: 'media',
        confidenceLevel: 'media',
        title: `ALERTA EXIT - ${departmentName}`,
        badge: 'REQUIERE ATENCIÓN',
        riskAmount: baseRisk,
        riskFormatted: formatCurrencyCLP(baseRisk),
        departmentName
      },
      
      detection: {
        // Caso genérico pero con mejor contexto
        questionText: 'Alerta generada por el sistema de inteligencia Exit basada en umbrales configurados.',
        questionId: alert.alertType || 'N/A',
        
        summary: alert.description || `Se detectó una señal de alerta en ${departmentName} de ${context?.companyName || 'la empresa'} que requiere análisis. El sistema identificó un indicador fuera de los parámetros esperados.`,
        
        interpretation: 'Esta alerta fue generada automáticamente. Recomendamos investigar la causa raíz antes de tomar acciones. Un diagnóstico con Pulso Express puede ayudar a entender el estado actual del área.',
        
        scoreLabel: 'Score',
        scoreValue: alert.triggerScore || 0,
        scoreMax: 100,
        threshold: 50,
        
        disclaimer: 'Esta alerta requiere análisis contextual adicional para determinar la mejor estrategia de intervención.',
        opportunityStatement: 'Cada alerta es una oportunidad de mejora. La pregunta es qué harán con ella.'
      },
      
      goldenOpportunity: {
        diagram: {
          stages: ['📍 Alerta', 'Investigación', 'Acción', 'Resolución'],
          currentStage: 0,
          currentLabel: 'Inicio del proceso'
        },
        message: 'Detectar temprano es la mitad de la solución.',
        callToAction: '¿Qué acciones tomarán para investigar esta señal?'
      },
      
      emblamaticCases: {
        cases: relevantCases,
        statistic: mainStat
      },
      
      costSpectrum: {
        actNow: {
          label: 'Investigar',
          cost: 2_000_000,
          description: 'Diagnóstico inicial',
          color: 'green'
        },
        escalateTutela: {
          label: 'Si escala',
          costMin: baseRisk,
          costMax: baseRisk * 2,
          description: 'Costo potencial de no actuar',
          color: 'yellow'
        },
        escalateScandal: {
          label: 'Peor caso',
          description: 'Impacto reputacional variable según contexto',
          reference: 'Depende de la naturaleza específica del problema',
          color: 'red'
        }
      },
      
      actionPlan: {
        philosophy: 'Investigar antes de actuar. Actuar antes de que escale.',
        steps: [
          {
            step: 1,
            title: 'DIAGNÓSTICO INICIAL',
            description: 'Revisa en FocalizaHR los datos disponibles. ¿Qué dice el EIS? ¿Hay otros indicadores?',
            responsible: 'Tú (Gerente)',
            deadline: '1-2 días',
            validationMetric: 'Contexto claro de la situación'
          },
          {
            step: 2,
            title: 'PLAN DE ACCIÓN',
            description: 'Basado en diagnóstico, define acciones correctivas si son necesarias.',
            responsible: 'Según diagnóstico',
            deadline: '1 semana',
            validationMetric: 'Plan documentado o caso cerrado',
            suggestedProduct: FOCALIZA_PRODUCTS.pulso_express
          }
        ],
        escalationCriteria: [
          'Patrón se repite',
          'Gravedad aumenta',
          'Impacta a más personas'
        ],
        successMetrics: [
          'Alerta resuelta',
          'Sin recurrencia en 90 días'
        ]
      },
      
      methodology: {
        sources: METHODOLOGY_SOURCES.costos_rotacion,
        disclaimer: 'Caso genérico - requiere análisis contextual adicional para recomendaciones específicas.'
      },
      
      resolutionOptions: {
        quickPicks: [
          'Revisé los datos y no requiere acción → Cierro alerta',
          'Inicié investigación de la causa raíz',
          'Convoqué reunión con stakeholders relevantes',
          'Solicité Pulso Express para diagnóstico',
          'Escalé a nivel superior por complejidad'
        ],
        customPrompt: 'O describe la acción específica que tomaste:',
        minCharacters: 10,
        successMessage: '✅ Acción registrada. Continuaremos monitoreando la situación.',
        followUpDays: 60
      }
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Selecciona casos emblemáticos relevantes (con rotación por hora)
   */
  private static selectEmblamaticCases(category: string, count: number): EmblamaticCase[] {
    const cases = EMBLEMATIC_CASES[category] || EMBLEMATIC_CASES.cultura_toxica;
    
    // Rotación basada en timestamp para variedad
    const seed = Math.floor(Date.now() / (1000 * 60 * 60)); // Cambia cada hora
    const startIndex = seed % cases.length;
    
    const selected: EmblamaticCase[] = [];
    for (let i = 0; i < count && i < cases.length; i++) {
      selected.push(cases[(startIndex + i) % cases.length]);
    }
    
    return selected;
  }
  
  /**
   * Selecciona estadística principal (con rotación por día)
   */
  private static selectMainStatistic() {
    const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // Cambia cada día
    return MAIN_STATISTICS[seed % MAIN_STATISTICS.length];
  }
  
  /**
   * Calcula severidad basada en score (menor es peor)
   */
  private static calculateSeverity(
    score: number, 
    threshold: number, 
    criticalThreshold: number
  ): BusinessCaseSeverity {
    if (score < criticalThreshold) return 'crítica';
    if (score < threshold * 0.8) return 'alta';
    if (score < threshold) return 'media';
    return 'baja';
  }
  
  /**
   * Calcula severidad inversa (para scores donde mayor es peor, como EIS bajo)
   */
  private static calculateSeverityInverse(
    score: number, 
    threshold: number, 
    criticalThreshold: number
  ): BusinessCaseSeverity {
    if (score < criticalThreshold) return 'crítica';
    if (score < threshold * 0.8) return 'alta';
    if (score < threshold) return 'media';
    return 'baja';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default ExitAlertEngine;