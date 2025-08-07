// ====================================================================
// ALGORITMOS DINÁMICOS COCKPIT HEADER - LÓGICA COHERENTE
// src/components/monitor/cockpit/CockpitAlgorithms.ts  
// Fase 2.1: Corrección lógica internal + sincronización vistas
// ====================================================================

// 🧠 INTERFACES DINÁMICAS
export interface MomentumAnalysis {
  value: number;
  trend: 'acelerando' | 'estable' | 'desacelerando' | 'completado';
  velocity: number;
  description: string;
}

export interface ProjectionAnalysis {
  finalProjection: number;
  confidence: number;
  methodology: string;
  reasoning: string;
}

export interface ActionRecommendation {
  primary: string;
  reasoning: string;
  urgency: 'baja' | 'media' | 'alta' | 'crítica';
  nextSteps: string[];
}

export interface PatternAnalysis {
  dominantPattern: 'completado' | 'acelerando' | 'mixto' | 'desacelerando' | 'estancado';
  departmentsCount: number;
  description: string;
  insights: string[];
}

// 🎯 MOTOR ANÁLISIS MOMENTUM REAL
export function calculateMomentumDynamic(
  participationRate: number,
  trendData: any[] = [],
  daysRemaining: number,
  topMovers: any[] = []
): MomentumAnalysis {
  
  // CASO 1: Campaña completada (100%)
  if (participationRate >= 100) {
    return {
      value: 100,
      trend: 'completado',
      velocity: 0,
      description: 'Campaña completada exitosamente'
    };
  }

  // CASO 2: Sin datos suficientes
  if (!trendData?.length || trendData.length < 2) {
    return {
      value: Math.round(participationRate * 0.8), // Conservative estimate
      trend: 'estable',
      velocity: participationRate / Math.max(1, (21 - daysRemaining)), // Assumed 21 day campaign
      description: 'Datos insuficientes - estimación conservadora'
    };
  }

  // CASO 3: Análisis temporal real
  const recentTrend = trendData.slice(-3); // Últimos 3 días
  const previousTrend = trendData.slice(-6, -3); // 3 días anteriores
  
  const recentAvg = recentTrend.reduce((sum, day) => sum + (day.responses || 0), 0) / recentTrend.length;
  const previousAvg = previousTrend.length > 0 
    ? previousTrend.reduce((sum, day) => sum + (day.responses || 0), 0) / previousTrend.length 
    : recentAvg;

  // Calcular velocidad actual
  const currentVelocity = recentAvg;
  
  // Determinar momentum y trend
  let momentumValue: number;
  let trend: MomentumAnalysis['trend'];
  let description: string;

  const changePercent = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

  if (changePercent > 25) {
    momentumValue = Math.min(participationRate + 30, 150);
    trend = 'acelerando';
    description = `Aceleración ${Math.round(changePercent)}% últimos días`;
  } else if (changePercent < -25) {
    momentumValue = Math.max(participationRate - 20, 20);
    trend = 'desacelerando'; 
    description = `Desaceleración ${Math.abs(Math.round(changePercent))}% últimos días`;
  } else if (Math.abs(changePercent) <= 10) {
    momentumValue = participationRate;
    trend = 'estable';
    description = 'Velocidad constante mantenida';
  } else {
    momentumValue = participationRate + (changePercent > 0 ? 10 : -10);
    trend = changePercent > 0 ? 'acelerando' : 'desacelerando';
    description = `Variación leve ${Math.round(Math.abs(changePercent))}%`;
  }

  return {
    value: Math.round(momentumValue),
    trend,
    velocity: Math.round(currentVelocity * 10) / 10, // 1 decimal
    description
  };
}

// 📊 MOTOR PROYECCIÓN MATEMÁTICA REAL  
export function calculateProjectionDynamic(
  participationRate: number,
  momentum: MomentumAnalysis,
  daysRemaining: number,
  trendData: any[] = []
): ProjectionAnalysis {
  
  // CASO 1: Campaña completada
  if (participationRate >= 100) {
    return {
      finalProjection: 100,
      confidence: 100,
      methodology: 'Resultado confirmado',
      reasoning: 'Campaña ya completada con éxito'
    };
  }

  // CASO 2: Sin días restantes
  if (daysRemaining <= 0) {
    return {
      finalProjection: participationRate,
      confidence: 100,
      methodology: 'Estado final',
      reasoning: 'Campaña finalizó con participación actual'
    };
  }

  // CASO 3: Proyección basada en momentum
  let projectedGrowth = 0;
  let confidence = 50; // Base confidence
  let methodology = 'Análisis estadístico';
  let reasoning = '';

  // Calcular crecimiento proyectado basado en trend
  switch (momentum.trend) {
    case 'acelerando':
      // Proyectar aceleración pero con límite realista
      projectedGrowth = Math.min(
        momentum.velocity * daysRemaining * 1.5, // Factor aceleración
        40 - (participationRate - 60) // Límite realista basado en participación actual
      );
      confidence = Math.min(85, 60 + (momentum.value - participationRate));
      reasoning = `Aceleración detectada: +${momentum.velocity}/día proyectado`;
      break;
      
    case 'desacelerando':
      // Proyección pesimista pero realista
      projectedGrowth = Math.max(
        momentum.velocity * daysRemaining * 0.5, // Factor desaceleración
        -(participationRate * 0.2) // No puede bajar más del 20%
      );
      confidence = Math.max(60, 80 - Math.abs(momentum.value - participationRate));
      reasoning = `Desaceleración detectada: riesgo de estancamiento`;
      break;
      
    case 'estable':
      // Proyección lineal conservadora
      projectedGrowth = momentum.velocity * daysRemaining;
      confidence = 75;
      reasoning = `Ritmo estable: ${momentum.velocity}/día consistente`;
      break;
      
    case 'completado':
      projectedGrowth = 100 - participationRate;
      confidence = 100;
      reasoning = 'Participación ya completada';
      break;
  }

  // Calcular proyección final
  const finalProjection = Math.min(
    Math.max(
      participationRate + projectedGrowth,
      participationRate * 0.8 // Minimum: no puede bajar más de 20%
    ),
    100 // Maximum: 100%
  );

  // Ajustar confianza basada en datos disponibles
  if (trendData?.length >= 5) {
    confidence += 10; // More data = more confidence
  } else if (trendData?.length <= 2) {
    confidence -= 15; // Less data = less confidence  
  }

  return {
    finalProjection: Math.round(finalProjection),
    confidence: Math.max(40, Math.min(95, confidence)), // Between 40-95%
    methodology,
    reasoning
  };
}

// 🎯 MOTOR RECOMENDACIONES ACCIÓN COHERENTE
export function calculateActionRecommendation(
  participationRate: number,
  momentum: MomentumAnalysis,
  projection: ProjectionAnalysis,
  negativeAnomalies: any[] = []
): ActionRecommendation {
  
  const anomaliesCount = negativeAnomalies?.length || 0;
  
  // LÓGICA COHERENTE: Momentum + Proyección + Anomalías
  
  // CASO 1: Crítico - Múltiples problemas
  if (momentum.trend === 'desacelerando' && projection.finalProjection < 50 && anomaliesCount >= 2) {
    return {
      primary: 'Intervención Inmediata',
      reasoning: `Desaceleración + proyección baja (${projection.finalProjection}%) + ${anomaliesCount} departamentos críticos`,
      urgency: 'crítica',
      nextSteps: [
        'Contactar líderes departamentos críticos HOY',
        'Enviar recordatorios personalizados',
        'Reunión urgente equipo RRHH',
        'Revisar estrategia comunicación'
      ]
    };
  }

  // CASO 2: Desaceleración detectada
  if (momentum.trend === 'desacelerando') {
    return {
      primary: 'Acelerar Acciones',
      reasoning: `Momentum descendente detectado: ${momentum.description}`,
      urgency: 'alta',
      nextSteps: [
        'Enviar recordatorios focalizados',
        'Revisar timing comunicaciones',
        'Seguimiento 48h departamentos lentos',
        'Considerar incentivos participación'
      ]
    };
  }

  // CASO 3: Proyección baja pero momentum estable/positivo  
  if (projection.finalProjection < 65 && momentum.trend !== 'desacelerando') {
    return {
      primary: 'Intensificar Esfuerzos',
      reasoning: `Proyección ${projection.finalProjection}% requiere impulso adicional`,
      urgency: 'media',
      nextSteps: [
        'Recordatorios departamentos específicos',
        'Comunicar importancia iniciativa',
        'Monitorear progreso cada 2 días',
        'Ajustar metodología si necesario'
      ]
    };
  }

  // CASO 4: Acelerando - aprovechar momentum
  if (momentum.trend === 'acelerando') {
    return {
      primary: 'Aprovechar Momentum',
      reasoning: `Aceleración positiva: ${momentum.description}`,
      urgency: 'baja',
      nextSteps: [
        'Mantener estrategia actual',
        'Comunicar progreso a organización',
        'Preparar análisis intermedio',
        'Documentar mejores prácticas'
      ]
    };
  }

  // CASO 5: Completado
  if (momentum.trend === 'completado' || participationRate >= 100) {
    return {
      primary: 'Analizar Resultados',
      reasoning: 'Campaña completada exitosamente',
      urgency: 'baja',
      nextSteps: [
        'Generar informe final',
        'Analizar insights obtenidos', 
        'Documentar metodología exitosa',
        'Preparar próxima campaña'
      ]
    };
  }

  // CASO 6: Default - Estable
  return {
    primary: 'Monitoreo Continuo',
    reasoning: `Estado estable: ${momentum.description}`,
    urgency: 'baja',
    nextSteps: [
      'Mantener comunicación regular',
      'Monitorear indicadores cada 24h',
      'Preparado para ajustes si necesario',
      'Seguimiento departamentos rezagados'
    ]
  };
}

// 🎭 MOTOR ANÁLISIS PATRÓN DINÁMICO
export function calculatePatternAnalysis(
  topMovers: any[] = [],
  negativeAnomalies: any[] = [],
  participationRate: number
): PatternAnalysis {
  
  if (!topMovers?.length) {
    return {
      dominantPattern: 'estancado',
      departmentsCount: 0,
      description: 'Datos insuficientes para análisis',
      insights: ['Esperando actividad departamental']
    };
  }

  // Analizar trends de topMovers
  const completados = topMovers.filter(tm => tm.trend === 'completado').length;
  const acelerando = topMovers.filter(tm => tm.trend === 'acelerando').length; 
  const desacelerando = topMovers.filter(tm => tm.trend === 'desacelerando').length;
  const estables = topMovers.filter(tm => tm.trend === 'estable').length;
  
  const totalDepts = topMovers.length;
  const critical = negativeAnomalies?.length || 0;

  let dominantPattern: PatternAnalysis['dominantPattern'];
  let description: string;
  let insights: string[] = [];

  // Determinar patrón dominante
  if (completados >= totalDepts * 0.6) {
    dominantPattern = 'completado';
    description = `${completados} de ${totalDepts} departamentos completaron`;
    insights = [
      'Respuesta organizacional rápida y efectiva',
      'Metodología exitosa identificada',
      'Replicar estrategia para futuras campañas'
    ];
  } else if (acelerando >= totalDepts * 0.4) {
    dominantPattern = 'acelerando';  
    description = `${acelerando} departamentos acelerando momentum`;
    insights = [
      'Momentum organizacional creciente',
      'Capitalizar energía positiva detectada',
      'Mantener comunicación con departamentos activos'
    ];
  } else if (desacelerando >= totalDepts * 0.4 || critical >= 2) {
    dominantPattern = 'desacelerando';
    description = `${desacelerando} departamentos desacelerando, ${critical} críticos`;
    insights = [
      'Intervención preventiva recomendada',
      'Revisar estrategia comunicación',
      'Foco en departamentos rezagados'
    ];
  } else if (Math.max(completados, acelerando, desacelerando, estables) <= totalDepts * 0.4) {
    dominantPattern = 'mixto';
    description = `Comportamiento heterogéneo: ${completados}C/${acelerando}A/${desacelerando}D/${estables}E`;
    insights = [
      'Análisis específico por departamento requerido',
      'Estrategia diferenciada recomendada',
      'Identificar factores de variación'
    ];
  } else {
    dominantPattern = 'estable';
    description = `Mayoría departamentos en ritmo constante`;
    insights = [
      'Patrón organizacional estable',
      'Mantener estrategia actual',
      'Monitorear posibles cambios tendencia'
    ];
  }

  return {
    dominantPattern,
    departmentsCount: totalDepts,
    description,
    insights
  };
}

// 🔧 FUNCIÓN INTEGRACIÓN COMPLETA
export function processCockpitIntelligence(props: any) {
  const {
    participationRate = 0,
    daysRemaining = 0,
    topMovers = [],
    negativeAnomalies = [],
    insights = [],
    analytics = {}
  } = props;

  // Procesar trendData si está disponible
  const trendData = analytics?.trendData || [];

  // 1. Análisis Momentum
  const momentum = calculateMomentumDynamic(
    participationRate, 
    trendData, 
    daysRemaining, 
    topMovers
  );

  // 2. Proyección Matemática  
  const projection = calculateProjectionDynamic(
    participationRate,
    momentum, 
    daysRemaining,
    trendData
  );

  // 3. Recomendación Acción
  const action = calculateActionRecommendation(
    participationRate,
    momentum,
    projection, 
    negativeAnomalies
  );

  // 4. Análisis Patrón
  const pattern = calculatePatternAnalysis(
    topMovers,
    negativeAnomalies, 
    participationRate
  );

  return {
    momentum,
    projection, 
    action,
    pattern,
    // Estados derivados para UI
    isCompleted: participationRate >= 100,
    needsUrgentAction: action.urgency === 'crítica' || action.urgency === 'alta',
    showOptimisticProjection: projection.finalProjection > participationRate + 10
  };
}