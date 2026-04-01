// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE SYNTHESIS ENGINE
// src/lib/services/ExecutiveSynthesisEngine.ts
// ════════════════════════════════════════════════════════════════════════════
// Motor de Síntesis Ejecutiva — Diagnóstico Diferencial Post Evaluación
// 
// Genera la síntesis final del reporte de desempeño.
// NO repite datos — aporta el diagnóstico de qué TIPO de problema es.
// 
// Filosofía McKinsey:
//   Línea 1: Clasificación ("Este no es un problema de X, es de Y")
//   Línea 2-3: Implicación estratégica
//   Línea 4: El camino (dirección, no pasos)
//   Cierre: Accountability silencioso
//
// Versión: 1.0
// ════════════════════════════════════════════════════════════════════════════

import { BUSINESS_IMPACT_DICTIONARY, type GerenciaImpact } from '@/config/narratives/BusinessImpactDictionary'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Tipos de diagnóstico diferencial
 * Ordenados por PRIORIDAD (liderazgo amplifica todos los demás)
 */
export type DiagnosticType =
  | 'LIDERAZGO'           // Los multiplicadores fallan
  | 'CONCENTRACION'       // Una gerencia concentra el problema
  | 'ANTIGUEDAD_SENIOR'   // Decisiones postergadas (36+ meses)
  | 'RECAMBIO'            // Selección/Onboarding falla
  | 'GENERIC'             // Ninguno supera umbral

/**
 * Prioridad fija para empates
 * Liderazgo > Concentración > Antigüedad > Recambio
 */
export const DIAGNOSTIC_PRIORITY: DiagnosticType[] = [
  'LIDERAZGO',
  'CONCENTRACION',
  'ANTIGUEDAD_SENIOR',
  'RECAMBIO'
]

/**
 * Score de un diagnóstico detectado
 */
export interface DiagnosticScore {
  type: DiagnosticType
  score: number
  trigger: string
  data: Record<string, unknown>
}

/**
 * Análisis de antigüedad por banda
 */
export interface TenureBandAnalysis {
  band: '0-12' | '12-36' | '36+'
  headcount: number
  percentOfWorkforce: number
  avgRoleFit: number
  underperformersCount: number
  underperformersPercent: number
}

/**
 * Análisis de gerencia
 */
export interface GerenciaAnalysis {
  name: string
  standardCategory: string
  headcount: number
  avgRoleFit: number
  deficit: number  // 100 - avgRoleFit
  percentOfTotalDeficit: number
  monthlyCost: number
}

/**
 * Datos de entrada para el motor de síntesis
 */
export interface SynthesisInputData {
  // Globales
  globalRoleFit: number
  totalHeadcount: number
  underperformersCount: number
  totalMonthlyCost: number
  
  // Liderazgo
  totalLeaders: number
  leadersUnderStandard: number
  peopleAffectedByLeaders: number
  
  // Cargos críticos
  criticalRolesTotal: number
  criticalRolesUnderStandard: number
  criticalRolesWithSuccessor: number
  
  // Análisis por antigüedad
  tenureAnalysis: TenureBandAnalysis[]
  
  // Análisis por gerencia (ordenado por déficit desc)
  gerenciaAnalysis: GerenciaAnalysis[]
}

/**
 * Síntesis ejecutiva generada
 */
export interface ExecutiveSynthesis {
  diagnosticType: DiagnosticType
  trigger: string

  // Contenido de la síntesis
  classification: string      // "Este no es un problema de X. Es un problema de Y."
  implication: string         // Por qué esa clasificación importa (texto, sin riesgos)
  risks?: { label: string; narrative: string }[]  // Riesgos separados (solo CONCENTRACION)
  financialNote?: string      // Nota de costo (solo CONCENTRACION)
  path: string                // "El camino:" + dirección
  accountability: string      // Cierre

  // Datos de soporte (para UI si necesita)
  supportingData: {
    primaryMetric: string
    primaryValue: string | number
    secondaryMetrics?: { label: string; value: string | number }[]
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UMBRALES DE DIAGNÓSTICO
// ════════════════════════════════════════════════════════════════════════════

const THRESHOLDS = {
  // LIDERAZGO: % de líderes bajo estándar Y % de personas afectadas
  LIDERAZGO_LEADERS_PCT: 30,
  LIDERAZGO_AFFECTED_PCT: 40,
  
  // CONCENTRACIÓN: % del déficit total en una sola gerencia
  CONCENTRACION_PCT: 50,
  
  // ANTIGÜEDAD SENIOR: % del déficit en personal >36 meses
  ANTIGUEDAD_SENIOR_PCT: 40,
  
  // RECAMBIO: Gap de RoleFit nuevos vs existentes + volumen mínimo de nuevos
  RECAMBIO_GAP_POINTS: 10,
  RECAMBIO_MIN_WORKFORCE_PCT: 15
}

// ════════════════════════════════════════════════════════════════════════════
// MOTOR DE DIAGNÓSTICO
// ════════════════════════════════════════════════════════════════════════════

export class ExecutiveSynthesisEngine {
  
  /**
   * Genera la síntesis ejecutiva a partir de los datos del análisis
   */
  static generate(data: SynthesisInputData): ExecutiveSynthesis {
    // 1. Detectar todos los diagnósticos que superan umbral
    const diagnostics = this.detectDiagnostics(data)
    
    // 2. Seleccionar el dominante (por score, o prioridad fija si empate)
    const dominant = this.selectDominant(diagnostics)
    
    // 3. Generar la síntesis correspondiente
    return this.generateSynthesis(dominant, data)
  }
  
  /**
   * Detecta qué diagnósticos superan sus umbrales
   */
  private static detectDiagnostics(data: SynthesisInputData): DiagnosticScore[] {
    const scores: DiagnosticScore[] = []
    
    // ═══════════════════════════════════════════════════════════════════════
    // REGLA 1: LIDERAZGO
    // Los líderes bajo estándar afectan a muchas personas
    // ═══════════════════════════════════════════════════════════════════════
    if (data.totalLeaders > 0) {
      const leadersUnderPct = (data.leadersUnderStandard / data.totalLeaders) * 100
      const affectedPct = (data.peopleAffectedByLeaders / data.totalHeadcount) * 100
      
      if (leadersUnderPct >= THRESHOLDS.LIDERAZGO_LEADERS_PCT && 
          affectedPct >= THRESHOLDS.LIDERAZGO_AFFECTED_PCT) {
        scores.push({
          type: 'LIDERAZGO',
          score: (leadersUnderPct + affectedPct) / 2,
          trigger: `${data.leadersUnderStandard} líderes bajo estándar afectan a ${data.peopleAffectedByLeaders} personas`,
          data: {
            leadersUnderStandard: data.leadersUnderStandard,
            leadersUnderPct,
            peopleAffected: data.peopleAffectedByLeaders,
            affectedPct
          }
        })
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // REGLA 2: CONCENTRACIÓN
    // Una gerencia explica la mayoría del problema
    // ═══════════════════════════════════════════════════════════════════════
    if (data.gerenciaAnalysis.length > 0) {
      const worstGerencia = data.gerenciaAnalysis[0]
      
      if (worstGerencia.percentOfTotalDeficit >= THRESHOLDS.CONCENTRACION_PCT) {
        scores.push({
          type: 'CONCENTRACION',
          score: worstGerencia.percentOfTotalDeficit,
          trigger: `${worstGerencia.name} concentra ${worstGerencia.percentOfTotalDeficit.toFixed(0)}% del déficit`,
          data: {
            gerencia: worstGerencia.name,
            category: worstGerencia.standardCategory,
            concentration: worstGerencia.percentOfTotalDeficit,
            monthlyCost: worstGerencia.monthlyCost,
            roleFit: worstGerencia.avgRoleFit
          }
        })
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // REGLA 3: ANTIGÜEDAD SENIOR (36+ meses)
    // El problema está en gente que ya tuvo tiempo de desarrollarse
    // ═══════════════════════════════════════════════════════════════════════
    const senior = data.tenureAnalysis.find(t => t.band === '36+')
    if (senior && data.underperformersCount > 0) {
      const seniorConcentration = (senior.underperformersCount / data.underperformersCount) * 100
      
      if (seniorConcentration >= THRESHOLDS.ANTIGUEDAD_SENIOR_PCT) {
        scores.push({
          type: 'ANTIGUEDAD_SENIOR',
          score: seniorConcentration,
          trigger: `${seniorConcentration.toFixed(0)}% del déficit en personal >36 meses`,
          data: {
            seniorUnderperformers: senior.underperformersCount,
            seniorConcentration,
            seniorHeadcount: senior.headcount,
            seniorRoleFit: senior.avgRoleFit
          }
        })
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // REGLA 4: RECAMBIO (0-12 meses)
    // El talento nuevo entra peor que el existente
    // ═══════════════════════════════════════════════════════════════════════
    const nuevos = data.tenureAnalysis.find(t => t.band === '0-12')
    const medios = data.tenureAnalysis.find(t => t.band === '12-36')
    
    if (nuevos && medios) {
      const gap = medios.avgRoleFit - nuevos.avgRoleFit
      
      if (gap >= THRESHOLDS.RECAMBIO_GAP_POINTS && 
          nuevos.percentOfWorkforce >= THRESHOLDS.RECAMBIO_MIN_WORKFORCE_PCT) {
        scores.push({
          type: 'RECAMBIO',
          score: gap + nuevos.percentOfWorkforce,
          trigger: `Nuevos ingresan con ${gap.toFixed(0)} pts menos que personal existente`,
          data: {
            nuevosRoleFit: nuevos.avgRoleFit,
            mediosRoleFit: medios.avgRoleFit,
            gap,
            nuevosPercent: nuevos.percentOfWorkforce
          }
        })
      }
    }
    
    return scores
  }
  
  /**
   * Selecciona el diagnóstico dominante
   * Si hay empate en score, usa prioridad fija
   */
  private static selectDominant(diagnostics: DiagnosticScore[]): DiagnosticScore {
    if (diagnostics.length === 0) {
      return {
        type: 'GENERIC',
        score: 0,
        trigger: 'Ningún diagnóstico específico supera umbral',
        data: {}
      }
    }
    
    if (diagnostics.length === 1) {
      return diagnostics[0]
    }
    
    // Ordenar por score descendente
    diagnostics.sort((a, b) => b.score - a.score)
    
    // Si hay empate (diferencia < 5 puntos), usar prioridad fija
    const top = diagnostics[0]
    const second = diagnostics[1]
    
    if (top.score - second.score < 5) {
      // Desempatar por prioridad
      const topPriority = DIAGNOSTIC_PRIORITY.indexOf(top.type)
      const secondPriority = DIAGNOSTIC_PRIORITY.indexOf(second.type)
      
      return topPriority <= secondPriority ? top : second
    }
    
    return top
  }
  
  /**
   * Genera la síntesis completa según el diagnóstico
   */
  private static generateSynthesis(
    diagnostic: DiagnosticScore,
    data: SynthesisInputData
  ): ExecutiveSynthesis {
    
    switch (diagnostic.type) {
      case 'LIDERAZGO':
        return this.generateLiderazgoSynthesis(diagnostic, data)
      
      case 'CONCENTRACION':
        return this.generateConcentracionSynthesis(diagnostic, data)
      
      case 'ANTIGUEDAD_SENIOR':
        return this.generateAntiguedadSynthesis(diagnostic, data)
      
      case 'RECAMBIO':
        return this.generateRecambioSynthesis(diagnostic, data)
      
      default:
        return this.generateGenericSynthesis(data)
    }
  }
  
  // ══════════════════════════════════════════════════════════════════════════
  // GENERADORES POR VARIANTE
  // ══════════════════════════════════════════════════════════════════════════
  
  private static generateLiderazgoSynthesis(
    diagnostic: DiagnosticScore,
    data: SynthesisInputData
  ): ExecutiveSynthesis {
    const { leadersUnderStandard, peopleAffected } = diagnostic.data as {
      leadersUnderStandard: number
      peopleAffected: number
    }
    
    return {
      diagnosticType: 'LIDERAZGO',
      trigger: diagnostic.trigger,
      
      classification: 'Este no es un problema de talento individual. Es un problema de quién lo lidera.',
      
      implication: `${leadersUnderStandard} líderes operan bajo el estándar de su cargo y arrastran ` +
        `directamente a ${peopleAffected} personas. Un líder que no domina su rol no solo ` +
        `compromete su propio resultado — arrastra el rendimiento de cada persona que depende ` +
        `de su dirección. Mientras esta capa no funcione, ninguna inversión en talento individual escala.`,
      
      path: 'Intervenir el liderazgo primero. Desarrollo acelerado para los que tienen potencial, ' +
        'recambio para los que ya tuvieron su oportunidad.',
      
      accountability: 'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
      
      supportingData: {
        primaryMetric: 'Líderes bajo estándar',
        primaryValue: leadersUnderStandard,
        secondaryMetrics: [
          { label: 'Personas afectadas', value: peopleAffected },
          { label: '% de la dotación impactada', value: `${((peopleAffected / data.totalHeadcount) * 100).toFixed(0)}%` }
        ]
      }
    }
  }
  
  private static generateConcentracionSynthesis(
    diagnostic: DiagnosticScore,
    data: SynthesisInputData
  ): ExecutiveSynthesis {
    const { gerencia, category, concentration, monthlyCost, roleFit } = diagnostic.data as {
      gerencia: string
      category: string
      concentration: number
      monthlyCost: number
      roleFit: number
    }
    
    // Obtener meta del BusinessImpactDictionary
    const impact = BUSINESS_IMPACT_DICTIONARY[category]

    return {
      diagnosticType: 'CONCENTRACION',
      trigger: diagnostic.trigger,

      classification: 'Este no es un problema de cultura organizacional. Es un problema con responsable identificado.',

      implication: `${gerencia} concentra el ${concentration.toFixed(0)}% ` +
        `del déficit. Su rol es ${impact?.meta}. ` +
        `Cuando ese rol falla, no falla solo, arrastra a quienes ` +
        `dependen de sus resultados y a quienes le entregan trabajo. ` +
        `El déficit se propaga.`,

      path: `Una conversación directa con el liderazgo ` +
        `de ${gerencia}. No un programa transversal, ` +
        `el problema tiene origen identificado.`,

      accountability: 'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
      
      supportingData: {
        primaryMetric: 'Concentración del déficit',
        primaryValue: `${concentration.toFixed(0)}%`,
        secondaryMetrics: [
          { label: 'Gerencia', value: gerencia },
          { label: 'RoleFit', value: `${roleFit.toFixed(0)}%` },
          { label: 'Costo mensual', value: `$${(monthlyCost / 1000000).toFixed(1)}M` }
        ]
      }
    }
  }
  
  private static generateAntiguedadSynthesis(
    diagnostic: DiagnosticScore,
    data: SynthesisInputData
  ): ExecutiveSynthesis {
    const { seniorConcentration, seniorUnderperformers, seniorRoleFit } = diagnostic.data as {
      seniorConcentration: number
      seniorUnderperformers: number
      seniorRoleFit: number
    }
    
    // Verificar si hay sucesores disponibles
    const hasSuccessors = data.criticalRolesWithSuccessor > 0
    const successorPath = hasSuccessors
      ? `Donde hay sucesores listos (${data.criticalRolesWithSuccessor} posiciones), ejecutar el recambio.`
      : 'Construir el pipeline de sucesión con el talento que sí está respondiendo.'
    
    return {
      diagnosticType: 'ANTIGUEDAD_SENIOR',
      trigger: diagnostic.trigger,
      
      classification: 'Este no es un problema de capacitación. Es un problema de decisiones que no se tomaron.',
      
      implication: `El ${seniorConcentration.toFixed(0)}% del déficit está en personal con más de 3 años — ` +
        `tiempo suficiente para que cualquier plan de desarrollo funcionara si iba a funcionar. ` +
        `Estos ${seniorUnderperformers} colaboradores operan al ${seniorRoleFit.toFixed(0)}% del estándar ` +
        `después de años de oportunidades. Seguir invirtiendo ahí es repetir lo que ya no dio resultado.`,
      
      path: `${successorPath} El talento nuevo está respondiendo mejor.`,
      
      accountability: 'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
      
      supportingData: {
        primaryMetric: 'Déficit en personal >36 meses',
        primaryValue: `${seniorConcentration.toFixed(0)}%`,
        secondaryMetrics: [
          { label: 'Personas', value: seniorUnderperformers },
          { label: 'RoleFit promedio', value: `${seniorRoleFit.toFixed(0)}%` },
          { label: 'Sucesores listos', value: data.criticalRolesWithSuccessor }
        ]
      }
    }
  }
  
  private static generateRecambioSynthesis(
    diagnostic: DiagnosticScore,
    data: SynthesisInputData
  ): ExecutiveSynthesis {
    const { nuevosRoleFit, mediosRoleFit, gap, nuevosPercent } = diagnostic.data as {
      nuevosRoleFit: number
      mediosRoleFit: number
      gap: number
      nuevosPercent: number
    }
    
    return {
      diagnosticType: 'RECAMBIO',
      trigger: diagnostic.trigger,
      
      classification: 'Este no es un problema del talento existente. Es un problema de cómo se selecciona al nuevo.',
      
      implication: `El personal de menos de 12 meses (${nuevosPercent.toFixed(0)}% de la dotación) ` +
        `tiene un RoleFit de ${nuevosRoleFit.toFixed(0)}% — ${gap.toFixed(0)} puntos menos que ` +
        `el personal existente (${mediosRoleFit.toFixed(0)}%). No es que "les falta tiempo para aprender" — ` +
        `es que están entrando sin las competencias que el cargo exige. ` +
        `El onboarding no está cerrando la brecha, o el proceso de selección no está identificando el fit correcto.`,
      
      path: 'Antes de invertir en desarrollo del personal existente, revisar por qué el talento nuevo entra con brecha.',
      
      accountability: 'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
      
      supportingData: {
        primaryMetric: 'Gap nuevos vs existentes',
        primaryValue: `${gap.toFixed(0)} pts`,
        secondaryMetrics: [
          { label: 'RoleFit nuevos (0-12m)', value: `${nuevosRoleFit.toFixed(0)}%` },
          { label: 'RoleFit existentes (12-36m)', value: `${mediosRoleFit.toFixed(0)}%` },
          { label: '% de la dotación en recambio', value: `${nuevosPercent.toFixed(0)}%` }
        ]
      }
    }
  }
  
  private static generateGenericSynthesis(data: SynthesisInputData): ExecutiveSynthesis {
    const deficit = 100 - data.globalRoleFit
    
    return {
      diagnosticType: 'GENERIC',
      trigger: 'Análisis distribuido sin concentración clara',
      
      classification: 'El déficit de capacidad está distribuido sin un factor dominante claro.',
      
      implication: `La organización opera al ${data.globalRoleFit.toFixed(0)}% del estándar mínimo, ` +
        `con ${data.underperformersCount} personas bajo el umbral. El problema no se concentra ` +
        `en una gerencia, ni en el liderazgo, ni en una banda de antigüedad específica. ` +
        `Esto sugiere un desafío sistémico que requiere revisión de múltiples frentes.`,
      
      path: 'Revisar simultáneamente: calibración de estándares, efectividad de desarrollo, y procesos de selección.',
      
      accountability: 'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
      
      supportingData: {
        primaryMetric: 'RoleFit global',
        primaryValue: `${data.globalRoleFit.toFixed(0)}%`,
        secondaryMetrics: [
          { label: 'Bajo estándar', value: data.underperformersCount },
          { label: 'Costo mensual', value: `$${(data.totalMonthlyCost / 1000000).toFixed(1)}M` }
        ]
      }
    }
  }
}