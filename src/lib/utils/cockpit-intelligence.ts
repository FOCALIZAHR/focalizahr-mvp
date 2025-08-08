// ====================================================================
// CAPA DE INTELIGENCIA COCKPIT - ARQUITECTURA CORRECTA
// src/lib/utils/cockpit-intelligence.ts
// RESPONSABILIDAD: Procesar datos ya calculados del hook en formato UI
// ====================================================================

import type { CockpitHeaderProps } from '@/components/monitor/CockpitHeader';

// 🎯 INTERFACES PARA UI
export interface CockpitIntelligence {
  vectorMomentum: string;
  projection: {
    finalProjection: number;
    confidence: number;
    methodology: string;
    confidenceText: string;
  };
  action: {
    primary: string;
    reasoning: string;
    urgency: 'baja' | 'media' | 'alta' | 'crítica';
    nextSteps: string[];
    urgencyColor: string;
  };
  pattern: {
    dominantPattern: string;
    description: string;
    insights: string[];
    patternColor: string;
  };
}

// 🧠 FUNCIÓN PRINCIPAL - SOLO PROCESA DATOS YA CALCULADOS
export function processCockpitIntelligence(props: CockpitHeaderProps): CockpitIntelligence {
  const {
    participationRate,
    daysRemaining,
    topMovers,
    negativeAnomalies,
    participationPrediction,
    crossStudyComparison
  } = props;

  return {
    vectorMomentum: getVectorMomentum(props),
    projection: getProjectionIntelligence(props),
    action: getActionRecommendation(props),
    pattern: getPatternAnalysis(props)
  };
}

// 🎯 FUNCIÓN 1: VECTOR MOMENTUM (datos ya calculados)
function getVectorMomentum(props: CockpitHeaderProps): string {
  const { participationRate, daysRemaining, topMovers, participationPrediction } = props;
  
  // Campaña cerrada
  if (daysRemaining <= 0) {
    if (participationRate >= 100) return "Metodología Exitosa Documentada";
    if (participationRate >= 70) return "Campaña Finalizada - Resultados Aceptables";
    return "Campaña Cerrada - Análisis Post-Mortem Disponible";
  }
  
  // Sin actividad inicial
  if (participationRate === 0) return "Impulso Inicial Requerido";
  
  // Objetivo alcanzado
  if (participationRate >= 100) return "Objetivo Alcanzado - Mantener Momentum";
  
  // Usar datos ya calculados de topMovers
  const leadMover = topMovers?.[0];
  if (!leadMover) return "Analizando patrones...";
  
  // Usar velocidad ya calculada
  const velocity = participationPrediction?.velocity || 0;
  const trendSymbol = leadMover.trend === 'acelerando' ? '+' : 
                     leadMover.trend === 'desacelerando' ? '⚠️' : '';
  
  return `${trendSymbol}${velocity.toFixed(1)}/día`;
}

// 🎯 FUNCIÓN 2: PROYECCIÓN (usar datos hook + históricos)
function getProjectionIntelligence(props: CockpitHeaderProps) {
  const { participationRate, participationPrediction, crossStudyComparison } = props;
  
  if (!participationPrediction) {
    return {
      finalProjection: 0,
      confidence: 0,
      methodology: 'Sin datos suficientes',
      confidenceText: 'Datos insuficientes'
    };
  }
  
  // Base ya calculada en el hook
  let adjustedConfidence = participationPrediction.confidence;
  let methodology = 'Análisis temporal actual';
  
  // ✅ INTEGRAR datos históricos para mejorar confianza
  if (crossStudyComparison?.patternSimilarity && crossStudyComparison.patternSimilarity > 0.8) {
    adjustedConfidence = Math.min(95, adjustedConfidence + 15);
    methodology = 'Patrón similar a campañas exitosas anteriores';
  }
  
  // ✅ AJUSTAR confianza por magnitud participación
  if (participationRate >= 80) adjustedConfidence += 10;
  else if (participationRate >= 60) adjustedConfidence += 5;
  else if (participationRate <= 20) adjustedConfidence -= 10;
  
  const finalConfidence = Math.max(30, Math.min(95, adjustedConfidence));
  
  // Texto confianza para UI
  const confidenceText = finalConfidence >= 85 ? 'Muy Alta' :
                        finalConfidence >= 70 ? 'Alta' :
                        finalConfidence >= 50 ? 'Media' :
                        finalConfidence >= 35 ? 'Baja' : 'Muy Baja';
  
  return {
    finalProjection: participationPrediction.finalProjection,
    confidence: finalConfidence,
    methodology,
    confidenceText
  };
}

// 🎯 FUNCIÓN 3: ACCIÓN RECOMENDADA (lógica coherente)
function getActionRecommendation(props: CockpitHeaderProps) {
  const { participationRate, negativeAnomalies, participationPrediction } = props;
  
  const criticalCount = negativeAnomalies?.length || 0;
  
  // CASO 1: Departamentos críticos anulan mensajes positivos
  if (criticalCount >= 2) {
    return {
      primary: 'Intervención Diferenciada Urgente',
      reasoning: `${criticalCount} departamentos críticos requieren atención inmediata`,
      urgency: 'crítica' as const,
      urgencyColor: 'text-red-400',
      nextSteps: [
        'Análisis específico departamentos críticos',
        'Estrategia comunicación diferenciada',
        'Seguimiento diario departamentos rezagados'
      ]
    };
  }
  
  // CASO 2: Campaña completada exitosamente
  if (participationRate >= 100) {
    return {
      primary: 'Replicar Mejores Prácticas',
      reasoning: 'Campaña completada exitosamente sin departamentos críticos',
      urgency: 'baja' as const,
      urgencyColor: 'text-green-400',
      nextSteps: [
        'Documentar metodología exitosa',
        'Identificar factores clave de éxito',
        'Crear playbook para futuras campañas',
        'Capacitar equipos con insights obtenidos'
      ]
    };
  }
  
  // CASO 3: Sin actividad inicial
  if (participationRate === 0) {
    return {
      primary: 'Activación Urgente Comunicaciones',
      reasoning: 'Campaña sin actividad - requiere impulso inicial',
      urgency: 'alta' as const,
      urgencyColor: 'text-orange-400',
      nextSteps: [
        'Verificar envío comunicación inicial',
        'Revisar canales de distribución',
        'Confirmar tokens de acceso válidos',
        'Impulso directo departamentos clave'
      ]
    };
  }
  
  // CASO 4: Proyección baja con riesgo
  if (participationPrediction?.finalProjection < 60 && participationPrediction?.riskLevel === 'high') {
    return {
      primary: 'Estrategia de Recuperación',
      reasoning: `Proyección ${participationPrediction.finalProjection}% con alto riesgo`,
      urgency: 'alta' as const,
      urgencyColor: 'text-orange-400',
      nextSteps: [
        'Recordatorios dirigidos departamentos específicos',
        'Extensión plazo si es viable',
        'Comunicación refuerzo desde liderazgo',
        'Análisis barreras participación'
      ]
    };
  }
  
  // CASO 5: Éxito parcial con advertencias
  if (participationRate >= 70 && criticalCount === 1) {
    return {
      primary: 'Completar Cobertura',
      reasoning: 'Éxito general con departamento crítico pendiente',
      urgency: 'media' as const,
      urgencyColor: 'text-yellow-400',
      nextSteps: [
        `Atención especial: ${negativeAnomalies?.[0]?.department || 'departamento crítico'}`,
        'Mantener momentum departamentos exitosos',
        'Estrategia específica departamento rezagado',
        'Validar antes de declarar éxito total'
      ]
    };
  }
  
  // CASO 6: Monitoreo continuo
  return {
    primary: 'Monitoreo Continuo',
    reasoning: 'Estado estable requiere seguimiento',
    urgency: 'baja' as const,
    urgencyColor: 'text-cyan-400',
    nextSteps: [
      'Mantener comunicación regular',
      'Monitorear indicadores cada 24h',
      'Preparado para ajustes si necesario',
      'Seguimiento departamentos con menor participación'
    ]
  };
}

// 🎯 FUNCIÓN 4: PATRÓN ORGANIZACIONAL
function getPatternAnalysis(props: CockpitHeaderProps) {
  const { topMovers, negativeAnomalies } = props;
  
  if (!topMovers?.length) {
    return {
      dominantPattern: 'Datos Insuficientes',
      description: 'Esperando actividad departamental',
      insights: ['Análisis disponible cuando haya datos suficientes'],
      patternColor: 'text-gray-400'
    };
  }
  
  const totalDepts = topMovers.length;
  const completados = topMovers.filter(tm => tm.trend === 'completado').length;
  const acelerando = topMovers.filter(tm => tm.trend === 'acelerando').length;
  const desacelerando = topMovers.filter(tm => tm.trend === 'desacelerando').length;
  const critical = negativeAnomalies?.length || 0;
  
  // Priorizar problemas críticos
  if (critical >= Math.ceil(totalDepts * 0.3)) {
    return {
      dominantPattern: 'Crisis Comunicacional',
      description: `${critical} departamentos sin respuesta efectiva`,
      insights: [
        'Crisis de comunicación organizacional detectada',
        'Revisar estrategia y canales de distribución',
        'Intervención inmediata requerida'
      ],
      patternColor: 'text-red-400'
    };
  }
  
  if (completados >= Math.ceil(totalDepts * 0.6)) {
    const message = critical > 0 
      ? 'Éxito Mayoritario con Reservas'
      : 'Adopción Organizacional Exitosa';
    
    return {
      dominantPattern: message,
      description: `${completados} de ${totalDepts} departamentos completaron`,
      insights: [
        critical > 0 
          ? 'Éxito general con departamentos pendientes'
          : 'Respuesta organizacional rápida y efectiva',
        critical > 0 
          ? 'Completar cobertura antes de declarar éxito total'
          : 'Metodología exitosa identificada para replicar'
      ],
      patternColor: critical > 0 ? 'text-yellow-400' : 'text-green-400'
    };
  }
  
  if (acelerando >= Math.ceil(totalDepts * 0.4)) {
    return {
      dominantPattern: 'Momentum Creciente',
      description: `${acelerando} departamentos ganando velocidad`,
      insights: [
        'Momentum organizacional en ascenso',
        'Capitalizar energía positiva detectada',
        'Mantener comunicación con departamentos activos'
      ],
      patternColor: 'text-cyan-400'
    };
  }
  
  if (desacelerando >= Math.ceil(totalDepts * 0.4)) {
    return {
      dominantPattern: 'Pérdida de Impulso',
      description: `${desacelerando} departamentos desacelerando`,
      insights: [
        'Momentum organizacional descendente',
        'Estrategia re-activación requerida',
        'Revisar fatiga comunicacional'
      ],
      patternColor: 'text-orange-400'
    };
  }
  
  return {
    dominantPattern: 'Comportamiento Mixto',
    description: 'Comportamiento organizacional heterogéneo',
    insights: [
      'Análisis específico por departamento requerido',
      'Estrategia diferenciada recomendada',
      'Identificar factores de variación departamental'
    ],
    patternColor: 'text-purple-400'
  };
}