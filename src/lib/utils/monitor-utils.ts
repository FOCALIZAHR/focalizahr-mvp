// ====================================================================
// FOCALIZAHR MONITOR UTILS - MOTOR DE CÁLCULOS REALES
// src/lib/utils/monitor-utils.ts  
// Chat 2: Foundation Schema + Services - REPARACIÓN QUIRÚRGICA
// ====================================================================

import type { 
  Participant, 
  DepartmentMonitorData, 
  DailyResponse, 
  ActivityItem,
  EngagementHeatmapData,
  ParticipationPredictionData,
  DepartmentAnomalyData,
  CrossStudyComparisonData,
} from '@/types';

// ✅ NUEVA FUNCIÓN CERTIFICADA para calcular la participación real por departamento
export function calculateDepartmentParticipation(participants: Participant[]): Record<string, DepartmentMonitorData> {
  const deptStats: Record<string, { invited: number; responded: number }> = {};

  participants.forEach(p => {
    const dept = p.department || 'Sin Departamento Asignado';
    if (!deptStats[dept]) {
      deptStats[dept] = { invited: 0, responded: 0 };
    }
    deptStats[dept].invited++;
    if (p.hasResponded) {
      deptStats[dept].responded++;
    }
  });

  // Convertir a formato esperado por UI
  const result: Record<string, DepartmentMonitorData> = {};
  Object.entries(deptStats).forEach(([dept, data]) => {
    result[dept] = {
      invited: data.invited,
      responded: data.responded,
      rate: data.invited > 0 ? Math.round((data.responded / data.invited) * 100) : 0
    };
  });

  return result;
}

// ✅ NUEVA FUNCIÓN CERTIFICADA para obtener la actividad real y reciente - SIGNATURA CORREGIDA
export function calculateRecentActivity(participants: Participant[], departmentMapping?: Record<string, string>): ActivityItem[] {
  return participants
    .filter(p => p.hasResponded && p.responseDate)
    .sort((a, b) => new Date(b.responseDate!).getTime() - new Date(a.responseDate!).getTime())
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      dept: departmentMapping?.[p.department?.toLowerCase() || ''] || p.department || 'Sin Depto.',
      participant: `Participante (${departmentMapping?.[p.department?.toLowerCase() || ''] || p.department || 'N/A'})`,
      timestamp: new Date(p.responseDate!).toTimeString().split(' ')[0],
      status: 'completed',
      action: 'Completó encuesta',
    }));
}

// ✅ NUEVA FUNCIÓN CERTIFICADA para obtener la fecha de la última respuesta real
export function getLastActivityDate(participants: Participant[]): Date | null {
  const responseDates = participants
    .map(p => p.responseDate ? new Date(p.responseDate).getTime() : 0)
    .filter(t => t > 0);

  if (responseDates.length === 0) return null;
  
  return new Date(Math.max(...responseDates));
}

export function calculateDaysRemaining(endDate: string | Date): number {
  // ✅ VALIDACIÓN ROBUSTA - Proteger contra datos inválidos
  if (!endDate) {
    console.warn('⚠️ calculateDaysRemaining: endDate is null/undefined');
    return 0;
  }
  
  const end = new Date(endDate);
  const now = new Date();
  
  // ✅ VALIDACIÓN FECHA VÁLIDA
  if (isNaN(end.getTime())) {
    console.warn('⚠️ calculateDaysRemaining: Invalid endDate format:', endDate);
    return 0;
  }
  
  const diffTime = end.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // ✅ DEBUG TEMPORAL - Remover después de verificar
  console.log('🔍 calculateDaysRemaining:', {
    endDate: endDate,
    endDateParsed: end.toISOString(),
    now: now.toISOString(),
    diffTime,
    daysRemaining
  });
  
  return Math.max(0, daysRemaining);
}

export function formatLocalDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-CL');
}

export function formatLocalDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('es-CL');
}

export function getParticipationColor(rate: number): string {
  if (rate >= 70) return 'from-green-500 to-emerald-500';
  if (rate >= 50) return 'from-yellow-500 to-orange-500';
  return 'from-red-500 to-pink-500';
}

export function processDailyResponses(trendData: any[]): DailyResponse[] {
  if (!Array.isArray(trendData)) return [];
  
  return trendData.map(item => ({
    day: item.day || new Date(item.date).toLocaleDateString('es-CL', { weekday: 'short' }),
    responses: Number(item.responses) || 0,
    date: item.date ? new Date(item.date).toLocaleDateString('es-CL', { 
      month: '2-digit', 
      day: '2-digit' 
    }) : ''
  }));
}

// ✅ FUNCIÓN LEGACY DEPRECADA - MANTENER PARA BACKWARD COMPATIBILITY
/**
 * @deprecated - Usar calculateDepartmentParticipation() con datos reales
 */
export function transformScoresToByDepartment(analytics: any): Record<string, DepartmentMonitorData> {
  console.warn('⚠️ transformScoresToByDepartment() is deprecated. Use calculateDepartmentParticipation() with real participants data.');
  
  const byDepartment: Record<string, DepartmentMonitorData> = {};
  
  if (!analytics?.departmentScoresDisplay || !analytics.segmentationData) {
    return byDepartment;
  }

  for (const segment of analytics.segmentationData) {
    const deptName = segment.segment;
    if (analytics.departmentScoresDisplay[deptName] !== undefined) {
      const invited = segment.count;
      const responded = Math.round(invited * (analytics.participationRate / 100));
      byDepartment[deptName] = {
        invited: invited,
        responded: responded,
        rate: invited > 0 ? Math.round((responded / invited) * 100) : 0
      };
    }
  }
  
  return byDepartment;
}

// ====================================================================
// 🔥 COMPONENTES WOW - EXTENSIÓN QUIRÚRGICA (CÓDIGO NUEVO)
// Funciones para calcular inteligencia en el hook central
// ====================================================================

// 🔥 COMPONENTE WOW #1: MAPA DE CALOR ENGAGEMENT
export function processEngagementHeatmap(
  recentActivity: ActivityItem[],
  byDepartment: Record<string, DepartmentMonitorData>
): EngagementHeatmapData {
  // Crear array de 24 horas (0-23)
  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
    intensity: 0
  }));

  // Procesar actividad por hora
  recentActivity.forEach(activity => {
    try {
      // Extraer hora del timestamp (formato: "14:30:45")
      const hour = new Date(`2025-01-01 ${activity.timestamp}`).getHours();
      if (hour >= 0 && hour <= 23) {
        hourlyData[hour].count++;
      }
    } catch (error) {
      console.warn('Timestamp inválido:', activity.timestamp);
    }
  });

  // Calcular intensidad relativa (0-100%)
  const maxCount = Math.max(...hourlyData.map(h => h.count));
  hourlyData.forEach(hour => {
    hour.intensity = maxCount > 0 ? Math.round((hour.count / maxCount) * 100) : 0;
  });

  // Encontrar hora óptima
  const optimalHour = hourlyData.reduce((max, current) => 
    current.count > max.count ? current : max
  );

  // ✅ CALCULAR DATOS PARA EL COMPONENTE (MOVIDO DESDE COMPONENTE)
  const maxHour = hourlyData.findIndex(h => h.count === optimalHour.count);
  const maxActivity = optimalHour.count;
  const totalActivity = hourlyData.reduce((sum, h) => sum + h.count, 0);
  
  const hourBars = hourlyData.map((hourData, hour) => ({
    hour,
    count: hourData.count,
    percentage: totalActivity > 0 ? (hourData.count / totalActivity) * 100 : 0,
    isPeak: hour === maxHour && hourData.count > 0
  }));

  // Generar recomendaciones inteligentes
  const recommendations = [];
  if (optimalHour.count > 0) {
    recommendations.push({
      message: `Mejor horario: ${optimalHour.hour}:00-${optimalHour.hour + 1}:00 (${optimalHour.count} respuestas)`,
      confidence: Math.min(95, 50 + (optimalHour.intensity / 2))
    });
  }

  // Identificar horarios a evitar
  const lowActivity = hourlyData.filter(h => h.intensity < 20 && h.count > 0);
  if (lowActivity.length > 0) {
    recommendations.push({
      message: `Evitar: ${lowActivity[0].hour}:00-${lowActivity[0].hour + 1}:00 (baja actividad)`,
      confidence: 70
    });
  }

  return {
    hourlyData,
    recommendations,
    nextOptimalWindow: {
      hour: optimalHour.hour,
      day: 'Mañana',
      confidence: Math.min(90, optimalHour.intensity)
    },
    totalEngagementScore: Math.round(hourlyData.reduce((sum, h) => sum + h.intensity, 0) / 24),
    // ✅ DATOS CALCULADOS AGREGADOS
    maxHour,
    maxActivity,
    totalActivity,
    hourBars
  };
}

// 🔥 COMPONENTE WOW #2: PREDICTOR PARTICIPACIÓN - VERSIÓN PROFESIONAL
export function calculateParticipationPrediction(
  dailyResponses: DailyResponse[],
  participationRate: number,
  daysRemaining: number,
  totalInvited: number  // ← NUEVO PARÁMETRO
): ParticipationPredictionData {
  
  // Validación de entrada
  if (!dailyResponses.length || totalInvited === 0 || daysRemaining <= 0) {
    return {
      finalProjection: participationRate,
      confidence: 0,
      velocity: 0,
      riskLevel: 'high',
      recommendedActions: [],
      projectionPoints: []
    };
  }

  // 1. CALCULAR TASAS ACUMULATIVAS REALES
  let cumulativeResponses = 0;
  const cumulativeRates = dailyResponses.map((day, index) => {
    cumulativeResponses += day.responses;
    return (cumulativeResponses / totalInvited) * 100;
  });

  // 2. REGRESIÓN LINEAL (Least Squares Method)
  const n = cumulativeRates.length;
  if (n < 2) {
    // No hay suficientes datos para regresión
    const simpleVelocity = participationRate / Math.max(1, n);
    const simpleFinalProjection = Math.min(100, participationRate + (simpleVelocity * daysRemaining));
    
    return {
      finalProjection: Math.round(simpleFinalProjection),
      confidence: 40, // Baja confianza con pocos datos
      velocity: Math.round(simpleVelocity * 10) / 10,
      riskLevel: simpleFinalProjection < 60 ? 'high' : simpleFinalProjection < 75 ? 'medium' : 'low',
      recommendedActions: [],
      projectionPoints: [
        { dayLabel: `+${daysRemaining}d`, rate: simpleFinalProjection }
      ]
    };
  }

  // Cálculo de regresión lineal
  const sumX = (n * (n + 1)) / 2;  // Suma de 1..n
  const sumY = cumulativeRates.reduce((a, b) => a + b, 0);
  const sumXY = cumulativeRates.reduce((sum, y, x) => sum + ((x + 1) * y), 0);
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;  // Suma de cuadrados
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // 3. COEFICIENTE DE DETERMINACIÓN (R²) - Calidad del modelo
  const yMean = sumY / n;
  const ssTotal = cumulativeRates.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const ssResidual = cumulativeRates.reduce((sum, y, x) => {
    const predicted = intercept + slope * (x + 1);
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const r2 = ssTotal > 0 ? Math.max(0, 1 - (ssResidual / ssTotal)) : 0;
  
  // 4. PROYECCIÓN FINAL
  const finalDay = n + daysRemaining;
  const rawProjection = intercept + slope * finalDay;
  const finalProjection = Math.min(100, Math.max(participationRate, rawProjection));
  
  // 5. VELOCIDAD DIARIA (respuestas/día)
  const avgDailyResponses = dailyResponses
    .map(d => d.responses)
    .filter(r => r > 0);
  const velocity = avgDailyResponses.length > 0 
    ? avgDailyResponses.reduce((sum, r) => sum + r, 0) / avgDailyResponses.length 
    : slope * totalInvited / 100; // Convertir slope de % a respuestas
  
  // 6. GENERAR PUNTOS DE PROYECCIÓN PARA EL GRÁFICO
  const projectionPoints = [];
  const intervals = Math.min(7, daysRemaining); // Máximo 7 puntos
  
  for (let i = 1; i <= intervals; i++) {
    const projectionDay = n + Math.floor((i * daysRemaining) / intervals);
    const projectedRate = intercept + slope * projectionDay;
    
    projectionPoints.push({
      dayLabel: `+${Math.floor((i * daysRemaining) / intervals)}d`,
      rate: Math.round(Math.min(100, Math.max(0, projectedRate)) * 10) / 10
    });
  }
  
  // 7. CALCULAR CONFIANZA AJUSTADA
  let confidence = Math.round(r2 * 100);
  
  // Ajustar confianza por cantidad de datos
  if (n >= 7) confidence = Math.min(95, confidence + 10);
  else if (n >= 5) confidence = Math.min(90, confidence + 5);
  else if (n <= 2) confidence = Math.max(40, confidence - 20);
  
  // Ajustar por consistencia de datos
  const avgResponses = avgDailyResponses.reduce((a, b) => a + b, 0) / avgDailyResponses.length;
  const variance = avgDailyResponses.reduce((sum, r) => sum + Math.pow(r - avgResponses, 2), 0) / avgDailyResponses.length;
  const coefficientOfVariation = avgResponses > 0 ? Math.sqrt(variance) / avgResponses : 1;
  
  if (coefficientOfVariation < 0.3) confidence = Math.min(95, confidence + 5);
  else if (coefficientOfVariation > 0.7) confidence = Math.max(40, confidence - 10);
  
  // 8. DETERMINAR NIVEL DE RIESGO
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (finalProjection < 60) riskLevel = 'high';
  else if (finalProjection < 75) riskLevel = 'medium';
  
  // También considerar velocidad
  const requiredDailyRate = (70 - participationRate) / daysRemaining;
  if (slope < requiredDailyRate * 0.8) riskLevel = 'high';
  else if (slope < requiredDailyRate) riskLevel = 'medium';
  
  // 9. GENERAR RECOMENDACIONES INTELIGENTES
  const recommendedActions = [];
  
  // Recomendación basada en proyección
  if (riskLevel === 'high') {
    const gapToTarget = Math.max(0, 70 - finalProjection);
    const additionalResponsesNeeded = Math.ceil((gapToTarget / 100) * totalInvited);
    
    recommendedActions.push({
      action: `Acción urgente: ${additionalResponsesNeeded} respuestas adicionales necesarias`,
      impact: 90
    });
    
    if (daysRemaining > 3) {
      recommendedActions.push({
        action: 'Activar protocolo de escalamiento a gerencia',
        impact: 85
      });
    }
  }
  
  // Recomendación basada en velocidad
  if (velocity < 5 && daysRemaining > 5) {
    recommendedActions.push({
      action: `Aumentar ritmo: actual ${velocity.toFixed(1)}/día, necesario ${(requiredDailyRate * totalInvited / 100).toFixed(1)}/día`,
      impact: 75
    });
  }
  
  // Recomendación basada en tendencia
  if (slope < 0 && participationRate > 30) {
    recommendedActions.push({
      action: 'Tendencia negativa detectada - revisar estrategia de comunicación',
      impact: 80
    });
  }
  
  // 10. RETORNAR RESULTADO COMPLETO
  return {
    finalProjection: Math.round(finalProjection * 10) / 10,
    confidence: Math.max(40, Math.min(95, confidence)),
    velocity: Math.round(velocity * 10) / 10,
    riskLevel,
    recommendedActions,
    projectionPoints, // ← NUEVO: Array para el gráfico
    // Campos opcionales para debugging/explicación
    methodology: `Regresión lineal (R²=${(r2 * 100).toFixed(1)}%, n=${n} días)`,
    slope: Math.round(slope * 100) / 100,
    intercept: Math.round(intercept * 100) / 100
  };
}
// ====================================================================
// 🔥 COMPONENTES WOW FALTANTES - AGREGADOS AHORA
// ====================================================================

// 🔥 COMPONENTE WOW #3: DETECTOR DE ANOMALÍAS
export function calculateDepartmentAnomalies(
  byDepartment: Record<string, DepartmentMonitorData>
): {
  departmentAnomalies: DepartmentAnomalyData[];
  positiveAnomalies: DepartmentAnomalyData[];
  negativeAnomalies: DepartmentAnomalyData[];
  meanRate: number;
  totalDepartments: number;
} {
  const departments = Object.entries(byDepartment);
  const rates = departments.map(([_, data]) => data.rate);
  
  if (rates.length === 0) {
    return {
      departmentAnomalies: [],
      positiveAnomalies: [],
      negativeAnomalies: [],
      meanRate: 0,
      totalDepartments: 0
    };
  }

  // Calcular estadísticas
  const meanRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - meanRate, 2), 0) / rates.length;
  const stdDev = Math.sqrt(variance);

  // Detectar anomalías con Z-Score
  const anomalies: DepartmentAnomalyData[] = [];
  
  departments.forEach(([deptName, data]) => {
    if (stdDev === 0) return; // No hay variación
    
    const zScore = (data.rate - meanRate) / stdDev;
    const absZScore = Math.abs(zScore);
    
    // Detectar anomalías (Z-Score > 1.5)
    if (absZScore > 1.5) {
      anomalies.push({
        department: deptName,
        rate: data.rate,
        zScore: Math.round(zScore * 100) / 100,
        type: zScore > 0 ? 'positive_outlier' : 'negative_outlier',
        severity: absZScore > 2.0 ? 'high' : 'medium'
      });
    }
  });

  // Separar por tipo
  const positiveAnomalies = anomalies.filter(a => a.type === 'positive_outlier');
  const negativeAnomalies = anomalies.filter(a => a.type === 'negative_outlier');

  return {
    departmentAnomalies: anomalies,
    positiveAnomalies,
    negativeAnomalies,
    meanRate: Math.round(meanRate * 10) / 10,
    totalDepartments: departments.length
  };
}

// 🔥 COMPONENTE WOW #4: COMPARADOR CROSS-STUDY
// ✅ FUNCIÓN ELIMINADA - Los cálculos se realizan ahora en el backend (/api/historical)
// CrossStudyComparatorCard usa datos pre-calculados del hook useCampaignHistory

// ✅ DEFINIR TIPO ESPECÍFICO PARA CLARIDAD
export type TopMoverTrend = 'completado' | 'acelerando' | 'estable' | 'desacelerando';

export function calculateDepartmentMomentum(
  trendDataByDepartment: Record<string, Array<{ date: string; responses: number }>>
): Array<{ name: string; momentum: number; trend: TopMoverTrend }> {
  
  if (!trendDataByDepartment || Object.keys(trendDataByDepartment).length === 0) {
    return [];
  }

  const departmentMomentum = Object.entries(trendDataByDepartment).map(([name, trendArray]) => {
    // Filtrar días con respuestas para análisis efectivo
    const activeDays = trendArray.filter(day => day.responses > 0);
    
    if (activeDays.length === 0) {
      return { name, momentum: 0, trend: 'estable' as const };
    }

    // CASO 1: Campaña con 1 solo día activo
    if (activeDays.length === 1) {
      return { 
        name, 
        momentum: activeDays[0].responses * 100, // Peso por volumen
        trend: 'completado' as const 
      };
    }

    // CASO 2: Campaña con múltiples días - Análisis temporal
    const totalResponses = activeDays.reduce((sum, day) => sum + day.responses, 0);
    
    // Analizar distribución temporal
    const firstHalf = activeDays.slice(0, Math.ceil(activeDays.length / 2));
    const secondHalf = activeDays.slice(Math.ceil(activeDays.length / 2));
    
    const firstHalfSum = firstHalf.reduce((sum, day) => sum + day.responses, 0);
    const secondHalfSum = secondHalf.reduce((sum, day) => sum + day.responses, 0);
    
    // Calcular momentum basado en distribución temporal
    let momentum = 0;
    let trendDirection: TopMoverTrend = 'estable';
    
    if (secondHalf.length > 0) {
      const firstAvg = firstHalf.length > 0 ? firstHalfSum / firstHalf.length : 0;
      const secondAvg = secondHalfSum / secondHalf.length;
      
      if (firstAvg > 0) {
        const percentageChange = ((secondAvg - firstAvg) / firstAvg) * 100;
        momentum = Math.abs(percentageChange);
        
        if (percentageChange > 25) trendDirection = 'acelerando';
        else if (percentageChange < -25) trendDirection = 'desacelerando';
        else trendDirection = 'estable';
      } else {
        // Caso especial: inicio lento, aceleración posterior
        momentum = secondAvg * 50;
        trendDirection = 'acelerando';
      }
    }
    
    // CASO 3: Detectar campañas completadas (últimos días sin actividad)
    const allDays = trendArray;
    const lastDays = allDays.slice(-3); // Últimos 3 días
    const hasRecentActivity = lastDays.some(day => day.responses > 0);
    
    if (!hasRecentActivity && totalResponses > 0) {
      // Campaña completada - momentum basado en volumen total
      momentum = totalResponses * 25;
      trendDirection = 'completado';
    }

    // Aplicar peso por volumen para priorizar departamentos activos
    const volumeWeight = Math.min(totalResponses * 10, 100);
    momentum = Math.round(momentum + volumeWeight);

    return { name, momentum, trend: trendDirection };
  });

  // Filtrar y ordenar: solo departamentos con actividad significativa
  return departmentMomentum
    .filter(d => d.momentum > 0)
    .sort((a, b) => b.momentum - a.momentum)
    .slice(0, 5); // Top 5 más significativos
}

