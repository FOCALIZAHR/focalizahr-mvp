// ====================================================================
// FOCALIZAHR CAMPAIGN MONITOR - HOOK ORQUESTADOR UNIFICADO COMPLETO
// src/hooks/useCampaignMonitor.ts
// SOLUCIÓN: SINGLE useMemo CON TODO EL CÓDIGO ORIGINAL PRESERVADO
// 🧠 PROTOCOLO DE UNIFICACIÓN - SIN ELIMINAR FUNCIONALIDAD
// ✅ TODAS LAS 1000+ LÍNEAS PRESERVADAS Y REORGANIZADAS
// ====================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCampaignResults } from './useCampaignResults';
import { useCampaignParticipants } from './useCampaignParticipants';
import { useCampaignHistory } from './useCampaignHistory';
import { useCampaignDetails } from './useCampaignDetails';
import { 
  calculateRecentActivity,
  getLastActivityDate,
  calculateDaysRemaining,
  formatLocalDate,
  formatLocalDateTime,
  getParticipationColor,
  processDailyResponses,
  processEngagementHeatmap,
  calculateParticipationPrediction,
  calculateDepartmentAnomalies,
  calculateDepartmentMomentum,
  TopMoverTrend // ✅ AGREGAR ESTO
} from '@/lib/utils/monitor-utils';
import type { 
  DepartmentMonitorData, 
  DailyResponse, 
  ActivityItem, 
  AlertItem,
  EngagementHeatmapData,
  ParticipationPredictionData,
  DepartmentAnomalyData,
  CrossStudyComparisonData,
  DepartmentalIntelligence,
  TacticalRecommendation,  // ← AGREGAR ESTA LÍNEA
  DepartmentMomentumData,  // ← AGREGAR ESTA LÍNEA
} from '@/types'

// ✅ INTERFACE EXTENDIDA PARA CORREGIR ERROR TYPESCRIPT
interface HistoricalDataResponse {
  campaigns: any[];
  total: number;
  lastUpdated: string;
  crossStudyComparison?: CrossStudyComparisonData; // ← AGREGAR ESTA LÍNEA
}

// ====================================================================
// 🧠 COCKPIT INTELLIGENCE - TRASPLANTE DE CEREBRO DIRECTO
// TODAS LAS FUNCIONES ORIGINALES PRESERVADAS
// ====================================================================

// 🎯 INTERFACES PARA COCKPIT INTELLIGENCE
interface CockpitIntelligence {
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
  // ✅ AGREGAR AQUÍ:
  tacticalAction: TacticalRecommendation;
}

// 🎯 NUEVA FUNCIÓN - GENERAR RECOMENDACIÓN TÁCTICA
function generateTacticalRecommendation(
  topMovers: Array<{ name: string; momentum: number; trend: string }> = [],
  negativeAnomalies: Array<{ department: string; rate: number; severity: string }> = [],
  participationRate: number = 0,
  daysRemaining: number = 0,
  totalInvited: number = 0,
  totalResponded: number = 0
): TacticalRecommendation {
  
  // ✅ ESCENARIO 0: CAMPAÑA 100% COMPLETADA (PRIORIDAD MÁXIMA)
  if (participationRate >= 100 || totalInvited === totalResponded) {
    return {
      primary: 'Documentar Metodología Exitosa',
      reasoning: 'Campaña completada con 100% participación - analizar factores de éxito',
      urgency: 'baja',
      action: 'post-campaign',
      urgencyColor: 'green'
    };
  }

  // ✅ ESCENARIO 1: CAMPAÑA CERRADA SIN 100%
  if (daysRemaining <= 0 && participationRate < 100) {
    return {
      primary: 'Análisis Post-Mortem Requerido',
      reasoning: `Campaña cerrada con ${participationRate}% participación - identificar barreras`,
      urgency: 'media',
      action: 'post-campaign',
      urgencyColor: 'orange'
    };
  }

  // ✅ ESCENARIO 2: URGENCIA EXTREMA (< 2 días y < 60%)
  if (daysRemaining <= 1 && participationRate < 60) {
    return {
      primary: 'Extensión Urgente Requerida',
      reasoning: `Solo ${daysRemaining} día(s) restante(s) con ${participationRate}% participación`,
      urgency: 'crítica',
      action: 'emergency',
      urgencyColor: 'red'
    };
  }
  
  const champion = topMovers[0];
  const risk = negativeAnomalies[0];

  
  
  // Escenario 1: Campeón + Riesgo = Replicar éxito
  if (champion && risk) {
    return {
      primary: `Replicar éxito de ${champion.name} en ${risk.department}`,
      reasoning: `${champion.name} tiene momentum superior vs ${risk.rate}% de ${risk.department}`,
      urgency: risk.severity === 'high' ? 'crítica' : 'alta',
      action: 'tactical',
      urgencyColor: risk.severity === 'high' ? 'red' : 'purple'
    };
  }
  
  // Escenario 2: Solo campeón = Documentar mejores prácticas
  if (champion && !risk) {
    return {
      primary: `Documentar mejores prácticas de ${champion.name}`,
      reasoning: `${champion.name} lidera con momentum excepcional`,
      urgency: 'media',
      action: 'tactical',
      urgencyColor: 'green'
    };
  }
  
  // Escenario 3: Solo riesgo = Intervención inmediata
  if (!champion && risk) {
    return {
      primary: `Intervención inmediata en ${risk.department}`,
      reasoning: `${risk.department} requiere atención urgente (${risk.rate}%)`,
      urgency: risk.severity === 'high' ? 'crítica' : 'alta',
      action: 'tactical',
      urgencyColor: risk.severity === 'high' ? 'red' : 'orange'
    };
  }
  
  // Escenario 4: Sin datos claros = Análisis profundo
  return {
    primary: 'Análisis departamental profundo necesario',
    reasoning: 'Patrones no suficientemente claros para recomendación específica',
    urgency: 'baja',
    action: 'tactical',
    urgencyColor: 'gray'
  };
}

// ✅ NUEVA FUNCIÓN - GENERAR MOMENTUM DEPARTAMENTAL VISUAL
function generateDepartmentMomentumData(
  topMovers: Array<{ name: string; momentum: number; trend: string }> = [],
  negativeAnomalies: Array<{ department: string; rate: number; severity: string }> = []
): DepartmentMomentumData {
  
  // Combinar datos para análisis completo
  const allDepartments = [
    ...topMovers.map(m => ({ 
      name: m.name, 
      rate: m.momentum, 
      trend: m.trend,
      velocity: calculateVelocity(m.momentum, m.trend),
      status: 'positive' as const
    })),
    ...negativeAnomalies.map(a => ({ 
      name: a.department, 
      rate: a.rate, 
      trend: 'declining',
      velocity: -Math.abs(a.rate - 50) / 10, // Velocidad negativa
      status: a.severity === 'high' ? 'critical' as const : 'warning' as const
    }))
  ].slice(0, 5); // Top 5 para visual limpio

  const accelerating = allDepartments.filter(d => d.velocity > 0).length;
  const critical = allDepartments.filter(d => d.status === 'critical').length;
  const stable = allDepartments.filter(d => Math.abs(d.velocity) < 0.5).length;

  return {
    departments: allDepartments,
    summary: {
      accelerating,
      stable,
      critical,
      total: allDepartments.length
    },
    insights: generateMomentumInsights(allDepartments),
    sparklineData: allDepartments.map(d => ({ 
      name: d.name.slice(0, 3), 
      value: d.rate,
      velocity: d.velocity 
    }))
  };
}

// ✅ FUNCIONES AUXILIARES PARA MOMENTUM
function calculateVelocity(momentum: number, trend: string): number {
  const baseVelocity = momentum / 10;
  switch(trend) {
    case 'acelerando': return baseVelocity * 1.5;
    case 'completado': return baseVelocity;
    case 'estable': return baseVelocity * 0.5;
    case 'desacelerando': return -baseVelocity * 0.5;
    default: return 0;
  }
}

function generateMomentumInsights(departments: any[]): string[] {
  if (departments.length === 0) return ['Sin datos suficientes para análisis'];
  
  const critical = departments.filter(d => d.status === 'critical').length;
  const accelerating = departments.filter(d => d.velocity > 0).length;
  
  if (critical > 0) {
    return [`${critical} departamentos requieren intervención inmediata`];
  }
  if (accelerating >= departments.length * 0.7) {
    return ['Momentum organizacional excepcional detectado'];
  }
  return ['Análisis de momentum en progreso'];
}

// ====================================================================
// ✅ NUEVAS FUNCIONES AUXILIARES PARA TARJETAS VIVAS - PRESERVADAS
// ====================================================================

// Función auxiliar para datos del gauge momentum - CON DEBUG
const prepareMomentumGaugeData = (topMover: any) => {
  console.log('🔍 [prepareMomentumGaugeData] INPUT:', topMover);
  
  if (!topMover) {
    console.log('🔍 [prepareMomentumGaugeData] No topMover, retornando datos vacíos');
    return [{ value: 0, fill: '#6B7280' }];
  }
  
  const momentum = topMover.momentum || 0;
  const result = [
    { value: momentum, fill: '#22C55E' },           // Verde para momentum actual
    { value: Math.max(0, 100 - momentum), fill: '#374151' }  // Gris para el resto
  ];
  
  console.log('🔍 [prepareMomentumGaugeData] OUTPUT:', result);
  return result;
};

// Función auxiliar para datos de tendencia de riesgo - CON DEBUG
const calculateRiskTrendData = (department: string, analytics: any) => {
  console.log('🔍 [calculateRiskTrendData] INPUT:', { department, analyticsExists: !!analytics, trendDataExists: !!analytics?.trendData });
  
  if (!department || !analytics?.trendData) {
    console.log('🔍 [calculateRiskTrendData] No department o no trendData, retornando vacío');
    return [];
  }
  
  // Simular tendencia descendente para el departamento en riesgo
  const result = analytics.trendData.slice(-7).map((item: any, index: number) => ({
    date: item.date,
    rate: Math.max(20, 60 - (index * 5)) // Tendencia descendente simulada
  }));
  
  console.log('🔍 [calculateRiskTrendData] OUTPUT:', result);
  return result;
};

// Función auxiliar para tamaños departamentales - CON DEBUG
const calculateDepartmentSizes = (byDepartment: any) => {
  console.log('🔍 [calculateDepartmentSizes] INPUT:', byDepartment);
  
  const sizes: Record<string, number> = {};
  Object.entries(byDepartment).forEach(([dept, data]: [string, any]) => {
    sizes[dept] = data.invited || 0;
  });
  
  console.log('🔍 [calculateDepartmentSizes] OUTPUT:', sizes);
  return sizes;
};

// 🧠 FUNCIÓN PRINCIPAL - PROCESA DATOS YA CALCULADOS DEL HOOK
function processCockpitIntelligence(
  participationRate: number,
  daysRemaining: number,
  topMovers?: Array<{
    name: string;
    momentum: number;
    trend: TopMoverTrend;
  }>,
  negativeAnomalies?: Array<{
    department: string;
    rate: number;
    severity: 'high' | 'medium';
    zScore: number;
  }>,
  participationPrediction?: {
    finalProjection: number;
    confidence: number;
    velocity: number;
    riskLevel: 'low' | 'medium' | 'high';
  },
  crossStudyComparison?: CrossStudyComparisonData,
  totalInvited: number = 0,
  totalResponded: number = 0
): CockpitIntelligence {
  return {
    vectorMomentum: getVectorMomentum(participationRate, daysRemaining, topMovers, participationPrediction),
    projection: getProjectionIntelligence(participationRate, participationPrediction, crossStudyComparison),
    action: getActionRecommendation(participationRate, daysRemaining, topMovers, negativeAnomalies),
    pattern: getPatternAnalysis(topMovers, negativeAnomalies),
    // ✅ AGREGAR ESTA LÍNEA:
    tacticalAction: generateTacticalRecommendation(topMovers, negativeAnomalies, participationRate, daysRemaining, totalInvited, totalResponded)
  };
}

// 🎯 FUNCIÓN 1: VECTOR MOMENTUM (datos ya calculados)
function getVectorMomentum(
  participationRate: number,
  daysRemaining: number,
  topMovers?: Array<{ name: string; momentum: number; trend: TopMoverTrend }>,
  participationPrediction?: { velocity?: number }
): string {
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
  // ✅ CORRECCIÓN: CALCULAR VELOCITY REAL DINÁMICAMENTE
  const campaignDays = Math.max(1, 21 - daysRemaining);
  const realVelocity = participationRate / campaignDays;

// Ajustar velocidad basada en trend del departamento líder
  let adjustedVelocity = realVelocity;
   switch (leadMover.trend) {
   case 'acelerando':
    adjustedVelocity = realVelocity * 1.3;
    break;
   case 'desacelerando':
    adjustedVelocity = realVelocity * 0.7;
    break;
   case 'completado':
    adjustedVelocity = realVelocity;
    break;
   default:
    adjustedVelocity = realVelocity;
}
    const trendSymbol = leadMover.trend === 'acelerando' ? '⚡' : 
                   leadMover.trend === 'desacelerando' ? '⚠️' : 
                   leadMover.trend === 'completado' ? '✅' : '';

  console.log('🧠 [getVectorMomentum] CORREGIDO:', { 
  campaignDays, 
  realVelocity: realVelocity.toFixed(2), 
  adjustedVelocity: adjustedVelocity.toFixed(2),
  leadTrend: leadMover.trend
});

return `${trendSymbol}${adjustedVelocity.toFixed(1)}/día`;
}

// 🎯 FUNCIÓN 2: PROYECCIÓN INTELIGENCIA
function getProjectionIntelligence(
  participationRate: number,
  participationPrediction?: { finalProjection: number; confidence: number },
  crossStudyComparison?: { patternSimilarity?: number }
) {
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
                        finalConfidence >= 50 ? 'Media' : 'Baja';
  
  return {
    finalProjection: participationPrediction.finalProjection,
    confidence: finalConfidence,
    methodology,
    confidenceText
  };
}

// 🎯 FUNCIÓN 3: RECOMENDACIÓN ACCIÓN
function getActionRecommendation(
  participationRate: number,
  daysRemaining: number,
  topMovers?: Array<{ trend: TopMoverTrend }>,
  negativeAnomalies?: Array<{ department: string; severity: string }>
) {
  const critical = negativeAnomalies?.length || 0;
  
  // CASO 1: Crisis crítica
  if (critical >= 3 || participationRate < 20) {
    return {
      primary: 'Intervención Inmediata',
      reasoning: 'Crisis de comunicación detectada',
      urgency: 'crítica' as const,
      urgencyColor: 'text-red-400',
      nextSteps: [
        'Revisar canales comunicación inmediatamente',
        'Contacto directo departamentos críticos',
        'Escalar a dirección general si necesario',
        'Análisis post-mortem activación'
      ]
    };
  }
  
  // CASO 2: Campaña exitosa completada
  if (participationRate >= 100) {
    return {
      primary: 'Éxito Documentado',
      reasoning: 'Objetivo alcanzado completamente',
      urgency: 'baja' as const,
      urgencyColor: 'text-green-400',
      nextSteps: [
        'Documentar metodología exitosa',
        'Análisis factores éxito para replicar',
        'Comunicar resultados stakeholders',
        'Preparar template futuras campañas'
      ]
    };
  }
  
  // CASO 3: Progreso excelente
  if (participationRate >= 70 && critical === 0) {
    return {
      primary: 'Mantener Momentum',
      reasoning: 'Progreso excelente sin problemas críticos',
      urgency: 'baja' as const,
      urgencyColor: 'text-green-400',
      nextSteps: [
        'Continuar estrategia actual',
        'Monitoreo rutinario departamentos',
        'Preparar cierre campaña',
        'Validar completitud antes declarar éxito'
      ]
    };
  }
  
  // CASO 4: Requiere atención moderada
  if (critical > 0 || participationRate < 50) {
    return {
      primary: 'Atención Focalizada',
      reasoning: `${critical} departamentos requieren intervención`,
      urgency: 'media' as const,
      urgencyColor: 'text-yellow-400',
      nextSteps: [
        'Contactar departamentos específicos',
        'Analizar barreras participación',
        'Ajustar estrategia comunicación',
        'Seguimiento cercano próximas 48h'
      ]
    };
  }
  
  // CASO 5: Progreso aceptable
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

// 🎯 FUNCIÓN 4: ANÁLISIS PATRÓN
function getPatternAnalysis(
  topMovers?: Array<{ trend: TopMoverTrend }>,
  negativeAnomalies?: Array<{ department: string; severity: string }>
) {
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
  
  // Análisis balanceado
  return {
    dominantPattern: 'Comportamiento Mixto',
    description: `Patrones heterogéneos: ${completados}C/${acelerando}A/${desacelerando}D`,
    insights: [
      'Análisis específico por departamento requerido',
      'Estrategia diferenciada recomendada',
      'Identificar factores de variación organizacional'
    ],
    patternColor: 'text-blue-400'
  };
}

// ✅ INTERFACE PRINCIPAL DEL MONITOR - EXTENDIDA CON COCKPIT INTELLIGENCE
export interface CampaignMonitorData {
  isLoading: boolean;
  id: string;
  name: string;
  type: string;
  status: string;
  participationRate: number;
  totalInvited: number;
  totalResponded: number;
  daysRemaining: number;
  lastActivity: string;
  startDate: string;
  endDate: string;
  byDepartment: Record<string, DepartmentMonitorData & { displayName?: string }>;
  dailyResponses: DailyResponse[];
  alerts: AlertItem[];
  recentActivity: ActivityItem[];
  lastRefresh: Date;
  // 🔥 COMPONENTES WOW - DATOS CALCULADOS COMPLETOS
  engagementHeatmap?: EngagementHeatmapData;
  participationPrediction?: ParticipationPredictionData;
  departmentAnomalies: DepartmentAnomalyData[];
  positiveAnomalies: DepartmentAnomalyData[];
  negativeAnomalies: DepartmentAnomalyData[];
  meanRate: number;
  totalDepartments: number;
  crossStudyComparison?: CrossStudyComparisonData;
  // 🧠 DEPARTMENTAL INTELLIGENCE - Datos procesados para componente híbrido
  departmentalIntelligence: DepartmentalIntelligence;
  // 🎯 TOP MOVERS - Nueva inteligencia momentum departamental
  topMovers: Array<{ name: string; momentum: number; trend: TopMoverTrend }>;
  // 🧠 COCKPIT INTELLIGENCE - CEREBRO TRASPLANTADO
  cockpitIntelligence?: CockpitIntelligence;
  // ✅ AGREGAR NUEVO CAMPO - MOMENTUM DEPARTAMENTAL
  departmentMomentum?: DepartmentMomentumData;
  // ✅ EXTENSIÓN TARJETAS VIVAS - NUEVAS PROPIEDADES
  riskTrendData: Array<{date: string, rate: number}>;
  departmentSizes: Record<string, number>;
  momentumGaugeData: Array<{value: number, fill: string}>;
}

// ====================================================================
// 🎯 HOOK PRINCIPAL - REORGANIZADO EN SINGLE useMemo (SIN ELIMINAR CÓDIGO)
// ====================================================================

export function useCampaignMonitor(campaignId: string) {
  // ✅ FUSIÓN DE FUENTES DE DATOS - ARQUITECTURA HÍBRIDA CERTIFICADA
  const { data: campaignData, isLoading: resultsLoading, error, refreshData } = useCampaignResults(campaignId);
  const { data: participantsData, isLoading: participantsLoading, refreshData: refreshParticipants } = useCampaignParticipants(campaignId, { includeDetails: true });
  const { data: historicalData, isLoading: historyLoading} = useCampaignHistory({ 
    limit: 5, 
    currentCampaignId: campaignId 
  });
  const { campaignDetails, isLoading: detailsLoading } = useCampaignDetails(campaignId);
  
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ✅ AUTO-REFRESH SINCRONIZADO
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
      refreshParticipants();
      setLastRefresh(new Date());
    }, 600000);
    return () => clearInterval(interval);
  }, [campaignId, refreshData, refreshParticipants]);

  // 🎯 SINGLE useMemo UNIFICADO - TODA LA LÓGICA ORIGINAL PRESERVADA
  const monitorDataCompleto = useMemo((): CampaignMonitorData => {
 
    
    if (!campaignData || !participantsData || !campaignDetails) {
      return {
        isLoading: true,
        id: campaignId,
        name: 'Cargando...',
        type: '',
        status: 'loading',
        participationRate: 0,
        totalInvited: 0,
        totalResponded: 0,
        daysRemaining: 0,
        lastActivity: '',
        startDate: '',
        endDate: '',
        byDepartment: {},
        dailyResponses: [],
        alerts: [],
        recentActivity: [],
        lastRefresh,
        // 🔥 COMPONENTES WOW - VALORES LOADING - PRESERVADOS
        departmentAnomalies: [],
        positiveAnomalies: [],
        negativeAnomalies: [],
        meanRate: 0,
        totalDepartments: 0,
        // 🧠 DEPARTMENTAL INTELLIGENCE - Valor loading - PRESERVADO
        departmentalIntelligence: {
          topPerformers: [],
          attentionNeeded: [],
          totalDepartments: 0,
          averageRate: 0,
          excellentCount: 0,
          criticalCount: 0,
          allDepartments: [],
          hasRealData: false, // ✅ Estado loading sin datos reales
          scenarioType: 'NO_DATA' as const,
          displayMessage: 'Cargando datos departamentales...'
        },
         topMovers: [],  // ✅ PRESERVADO
         // ✅ VALORES LOADING PARA EXTENSIÓN TARJETAS VIVAS - PRESERVADOS
         riskTrendData: [],
         departmentSizes: {},
         momentumGaugeData: [],
      };
    }

    const { campaign, analytics } = campaignData;
    const { participants, summary } = participantsData;
    
    // 🎭 FUSIÓN DE METADATOS COMPLETOS - CHEF EJECUTIVO - PRESERVADO
    const completeCampaign = { ...campaign, ...campaignDetails };
    
    // --- REPARACIÓN QUIRÚRGICA: FUSIÓN CORRECTA DE DATOS - PRESERVADA ---

    // 1. ✅ PARTICIPACIÓN POR DEPARTAMENTO: LÓGICA CORREGIDA Y CERTIFICADA - PRESERVADA
    const byDepartment: Record<string, DepartmentMonitorData> = {};
    const departmentMapping = analytics.departmentMapping || {};
    const sourceSummary = participantsData.summary?.byDepartment || {};

    // 🔍 DIAGNÓSTICO SISTEMÁTICO - INSPECCIÓN COMPLETA DE AMBAS TUBERÍAS - PRESERVADO
    console.log("🔍 [DIAGNÓSTICO SISTEMÁTICO] =====================================");
    console.log("🔍 [TUBERÍA ANALÍTICA] analytics completo:", analytics);
    console.log("🔍 [TUBERÍA ANALÍTICA] analytics.segmentationData:", analytics.segmentationData);
    console.log("🔍 [TUBERÍA ANALÍTICA] analytics.departmentMapping:", analytics.departmentMapping);
    console.log("🔍 [TUBERÍA ANALÍTICA] analytics.departmentScores:", analytics.departmentScores);
    console.log("🔍 [TUBERÍA PARTICIPACIÓN] participantsData.summary completo:", participantsData.summary);
    console.log("🔍 [TUBERÍA PARTICIPACIÓN] participantsData.summary.byDepartment:", participantsData.summary?.byDepartment);
    console.log("🔍 [TUBERÍA PARTICIPACIÓN] Object.keys(summary.byDepartment):", Object.keys(participantsData.summary?.byDepartment || {}));
    console.log("🔍 [DIAGNÓSTICO SISTEMÁTICO] =====================================");

    // 🏗️ LÓGICA CONDICIONAL INTELIGENTE - SOPORTE PARA AMBAS GENERACIONES - PRESERVADA
    let departmentsToShow: string[] = [];
    
    if (analytics.segmentationData && analytics.segmentationData.length > 0) {
      // ✅ CAMPAÑA NUEVA: Usar tubería analítica + DepartmentAdapter
      console.log("🔍 [FLUJO] Campaña NUEVA - Usando tubería analítica");
      departmentsToShow = analytics.segmentationData.map(s => s.segment);
    } else if (Object.keys(sourceSummary).length > 0) {
      // ✅ CAMPAÑA ANTIGUA: Usar tubería participación directa
      console.log("🔍 [FLUJO] Campaña ANTIGUA - Usando tubería participación");
      departmentsToShow = Object.keys(sourceSummary);
    }
    
    console.log("🔍 [FLUJO] departmentsToShow final:", departmentsToShow);

    departmentsToShow.forEach(standardCategory => {
        // LÓGICA CONDICIONAL PARA MAPEO - PRESERVADA
        let displayName: string;
        let stats: any;
        
        if (analytics.segmentationData && analytics.segmentationData.length > 0) {
          // CAMPAÑA NUEVA: Usar mapping + buscar en sourceSummary con standardCategory
          displayName = departmentMapping[standardCategory.toLowerCase()] || standardCategory;
          stats = sourceSummary[standardCategory];
          console.log("🔍 [FLUJO NUEVO] Procesando:", standardCategory, "→", displayName, "con stats:", stats);
        } else {
          // CAMPAÑA ANTIGUA: Usar nombres directos (standardCategory ES el displayName)
          displayName = standardCategory;
          stats = sourceSummary[standardCategory];
          console.log("🔍 [FLUJO ANTIGUO] Procesando:", standardCategory, "→", displayName, "con stats:", stats);
        }
        
        if (stats) {
            // Lógica de cálculo UNIFICADA - PRESERVADA
            byDepartment[displayName] = {
                invited: stats.total,
                responded: stats.responded,
                rate: stats.total > 0 ? Math.round((stats.responded / stats.total) * 100) : 0,
                displayName: displayName // ✅ AGREGADO PARA COMPATIBILIDAD
            };
        }
    });

    console.log("🔍 [DEBUG CRÍTICO] byDepartment final:", byDepartment);

    // 2. ✅ ACTIVIDAD RECIENTE: USAR FUNCIÓN DE UTILIDAD calculateRecentActivity - PRESERVADA
    const recentActivity: ActivityItem[] = [];
    if (participants && participants.length > 0) {
      // Usar función de utilidad específica mencionada en la directriz
      const calculatedActivity = calculateRecentActivity(participants, departmentMapping);
      recentActivity.push(...calculatedActivity);
    }
    
    // Fallback: generar actividad basada en departamentos si no hay detalles - PRESERVADO
    if (recentActivity.length === 0 && analytics.segmentationData) {
      analytics.segmentationData
        .filter(segment => segment.percentage > 0)
        .slice(0, 5)
        .forEach((segment, index) => {
          const displayName = departmentMapping[segment.segment.toLowerCase()] || segment.segment;
          recentActivity.push({
            id: `activity-${index}`,
            dept: displayName,
            participant: `${Math.round((segment.count * segment.percentage) / 100)} respuesta(s)`,
            timestamp: new Date(Date.now() - index * 3600000).toLocaleTimeString('es-CL'),
            status: 'completed',
            action: `Actividad departamental (${Math.round(segment.percentage)}%)`
          });
        });
    }

    // 3. ✅ ÚLTIMA ACTIVIDAD: USAR FUNCIÓN DE UTILIDAD getLastActivityDate - PRESERVADA
    let lastActivity = 'Sin actividad registrada';
    
    if (participants && participants.length > 0) {
      // Usar función de utilidad específica mencionada en la directriz
      const lastActivityDate = getLastActivityDate(participants);
      if (lastActivityDate) {
        lastActivity = `Última actividad: ${lastActivityDate.toLocaleString('es-CL')}`;
      }
    }
    
    // Fallback: usar datos de summary si no hay participantes detallados - PRESERVADO
    if (lastActivity === 'Sin actividad registrada') {
      if (summary && summary.responded > 0) {
        const participationRate = summary.participationRate || 
          (summary.total > 0 ? Math.round((summary.responded / summary.total) * 100) : 0);
        lastActivity = `Última actualización: ${participationRate}% participación (${summary.responded}/${summary.total} respuestas)`;
      } else if (analytics.totalResponded > 0) {
        const rate = analytics.participationRate || 
          (analytics.totalInvited > 0 ? Math.round((analytics.totalResponded / analytics.totalInvited) * 100) : 0);
        lastActivity = `Analytics: ${rate}% participación (${analytics.totalResponded}/${analytics.totalInvited} respuestas)`;
      }
    }

    // 4. ✅ ALERTAS REALES: BASADAS EN DATOS FUSIONADOS CON MAPEO DEPARTAMENTAL - PRESERVADAS
    const alerts: AlertItem[] = [];
    Object.entries(byDepartment).forEach(([displayName, data]) => {
      if (data.rate < 50 && data.invited > 2) {
        alerts.push({ 
          id: `alert-${displayName.replace(/\s+/g, '-').toLowerCase()}`, 
          type: 'warning', 
          message: `Baja participación en ${displayName} (${data.rate}% - ${data.responded}/${data.invited})`,
          department: displayName,
          timestamp: new Date().toLocaleTimeString('es-CL'),
          priority: data.rate < 33 ? 'high' : 'medium'
        });
      }
    });

    // ✅ UTILIZAR UTILIDADES PURAS PARA RESTO DE TRANSFORMACIONES - PRESERVADAS
    const daysRemaining = calculateDaysRemaining(completeCampaign.endDate);
    const dailyResponses = processDailyResponses(analytics.trendData);

    // 🔥 COMPONENTES WOW - CÁLCULOS COMPLETOS EN HOOK - PRESERVADOS
    const anomalyData = calculateDepartmentAnomalies(byDepartment);
    
    // 🎯 TOP MOVERS - VOLVER A LA LÓGICA QUE FUNCIONABA
    const topMovers = Object.entries(byDepartment)
      .map(([name, data]) => ({
        name: data.displayName || name,
        momentum: data.rate,  // PARTICIPACIÓN REAL (0-100%)
        trend: (data.rate >= 80 ? 'completado' :
               data.rate >= 60 ? 'acelerando' :
               data.rate >= 40 ? 'estable' : 'desacelerando') as TopMoverTrend
      }))
      .sort((a, b) => b.momentum - a.momentum);

    // 📊 LOG VERIFICACIÓN - Datos reales por momentum temporal:
    console.log('🎯 [Glass Cockpit] Top Movers - Momentum Temporal:', {
      inputTrendData: !!analytics.trendDataByDepartment,
      outputRanking: topMovers,
      totalDepartments: topMovers.length,
      firstMover: topMovers[0]
    });
    
    // ✅ DATOS HISTÓRICOS REALES DE API (reemplaza mock) - PRESERVADOS
    const historicalCampaigns = historicalData?.campaigns || [];

    // 🔍 DEBUG TEMPRANO - CORREGIDO PARA topMovers
    console.log('🔍 [DEBUG TEMPRANO] topMovers:', topMovers);
    console.log('🔍 [DEBUG TEMPRANO] analytics.trendDataByDepartment exists:', !!analytics.trendDataByDepartment);
    console.log('🔍 [DEBUG TEMPRANO] byDepartment:', Object.keys(byDepartment));

    // 🔧 CORRECCIÓN: Verificar datos antes de pasar a funciones auxiliares - PRESERVADO
    console.log('🔍 [DEBUG PARÁMETROS] topMovers:', topMovers);
    console.log('🔍 [DEBUG PARÁMETROS] analytics disponible:', !!analytics);
    console.log('🔍 [DEBUG PARÁMETROS] analytics.trendDataByDepartment disponible:', !!analytics?.trendDataByDepartment);
    
    const riskDepartment = topMovers.length > 0 ? 
      topMovers.filter(d => d.momentum < 50)[0]?.name || '' : '';
    const topMover = topMovers.length > 0 ? topMovers[0] : null;

    console.log('🔍 [DEBUG PARÁMETROS FINALES] riskDepartment:', riskDepartment);
    console.log('🔍 [DEBUG PARÁMETROS FINALES] topMover:', topMover);
    console.log('🔍 [DEBUG PARÁMETROS FINALES] byDepartment keys:', Object.keys(byDepartment));

    // 🔍 DEBUG FINAL - PRESERVADO
    console.log('🔍 [ANTES DEL RETURN] Llegamos hasta aquí');

    // 🧠 DEPARTMENTAL INTELLIGENCE - CALCULADO INLINE PARA EVITAR BUCLE INFINITO - PRESERVADO
    const departmentalIntelligenceCalculated: DepartmentalIntelligence = (() => {
      console.log('🔍 [DEPARTMENTAL INTELLIGENCE INLINE] Calculando...');
      
      // 🔧 CASO 1: SIN DATOS REALES
      if (!Object.keys(byDepartment).length) {
        return {
          topPerformers: [],
          attentionNeeded: [],
          totalDepartments: 0,
          averageRate: 0,
          excellentCount: 0,
          criticalCount: 0,
          allDepartments: [],
          hasRealData: false,
          scenarioType: 'NO_DATA' as const,
          displayMessage: 'Sin datos departamentales suficientes para análisis'
        };
      }

      // Convertir a array para procesamiento con estructura correcta - PRESERVADO
      const deptArray = Object.entries(byDepartment).map(([name, data]) => ({
        name,
        participationRate: data.rate,
        count: data.responded,
        total: data.invited,
      }));

      // TOP 3 PERFORMERS - Solo departamentos con participación > 0 - PRESERVADO
      const topPerformers = deptArray
        .filter(dept => dept.participationRate > 0)
        .sort((a, b) => b.participationRate - a.participationRate)
        .slice(0, 3)
        .map((dept, index) => ({
          ...dept,
          rank: index + 1,
          medal: index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉',
          status: 'excellent'
        }));

      // ATTENTION NEEDED - Departamentos <85% participación - PRESERVADO
      const attentionNeeded = deptArray
        .filter(dept => dept.participationRate < 85 && dept.total > 0)
        .sort((a, b) => a.participationRate - b.participationRate)
        .slice(0, 3)
        .map(dept => ({
          ...dept,
          urgency: dept.participationRate < 50 ? 'critical' : 
                   dept.participationRate < 70 ? 'high' : 'medium',
          action: dept.participationRate < 50 ? 'llamar' : 
                  dept.participationRate < 70 ? 'recordar' : 'seguimiento',
          icon: dept.participationRate < 50 ? '🚨' : 
                dept.participationRate < 70 ? '⚡' : '⚠️'
        }));

      // MÉTRICAS AGREGADAS - PRESERVADAS
      const totalDepartments = deptArray.length;
      const averageRate = totalDepartments > 0 
        ? deptArray.reduce((sum, dept) => sum + dept.participationRate, 0) / totalDepartments 
        : 0;
      const excellentCount = deptArray.filter(dept => dept.participationRate >= 85).length;
      const criticalCount = deptArray.filter(dept => dept.participationRate < 50).length;

      console.log('🔍 [DEPARTMENTAL INTELLIGENCE INLINE] Completado exitosamente');
      
      return {
        topPerformers,
        attentionNeeded,
        totalDepartments,
        averageRate: Math.round(averageRate * 10) / 10,
        excellentCount,
        criticalCount,
        allDepartments: deptArray,
        hasRealData: true,
        scenarioType: 'MIXED_DATA' as const,
        displayMessage: `📊 ${attentionNeeded.length} departamento(s) requieren seguimiento`
      };
    })();

    // ✅ ANOMALÍAS NEGATIVAS - CORREGIDO PARA USAR byDepartment REAL
    const negativeAnomaliesCalculated = Object.entries(byDepartment)
      .filter(([name, data]) => data.rate < 50 && data.invited > 0) // < 50% participación real
      .map(([name, data]) => ({ 
        department: data.displayName || name, 
        rate: data.rate, // PARTICIPACIÓN REAL 0-100%
        type: 'negative_outlier' as const,
        severity: (data.rate < 30 ? 'high' : 'medium') as const,
        zScore: data.rate < 30 ? -2.5 : -1.5 
      }));

    // ✅ EXTENSIÓN TARJETAS VIVAS - DATOS PRE-CALCULADOS - PRESERVADOS
    const riskTrendDataCalculated = calculateRiskTrendData(riskDepartment, analytics);
    const departmentSizesCalculated = calculateDepartmentSizes(byDepartment);
    const momentumGaugeDataCalculated = prepareMomentumGaugeData(topMover);

    // ✅ PARTICIPATION PREDICTION - PRESERVADO
    const participationPredictionCalculated = calculateParticipationPrediction(dailyResponses, analytics.participationRate || 0, daysRemaining);

    // ✅ DEPARTMENT MOMENTUM - BASADO EN TOPMOVERS UNIFICADOS
    const departmentMomentumCalculated = generateDepartmentMomentumData(topMovers, negativeAnomaliesCalculated);

    // 🧠 COCKPIT INTELLIGENCE - BASADO EN TOPMOVERS UNIFICADOS
    const cockpitIntelligenceCalculated = processCockpitIntelligence(
      summary?.participationRate || analytics.participationRate || 0,
      daysRemaining,
      topMovers,
      negativeAnomaliesCalculated,
      participationPredictionCalculated,
      historicalData?.crossStudyComparison,
      summary?.total || analytics.totalInvited || 0,
      summary?.responded || analytics.totalResponded || 0
    );

    // 🎯 RETURN FINAL COMPLETO - TODAS LAS PROPIEDADES PRESERVADAS
    return {
      isLoading: false,
      id: campaignId,
      name: completeCampaign.name || 'Campaña',
      type: completeCampaign.campaignType?.name || completeCampaign.type || 'Estudio',
      status: completeCampaign.status || 'active',
      participationRate: summary?.participationRate || analytics.participationRate || 0,
      totalInvited: summary?.total || analytics.totalInvited || 0,
      totalResponded: summary?.responded || analytics.totalResponded || 0,
      daysRemaining,
      lastActivity,
      startDate: formatLocalDate(completeCampaign.startDate || new Date()),
      endDate: formatLocalDate(completeCampaign.endDate || new Date()),
      byDepartment,
      dailyResponses,
      alerts,
      recentActivity,
      lastRefresh,
      // 🔥 COMPONENTES WOW - CÁLCULOS EN HOOK COMPLETADOS - PRESERVADOS
      engagementHeatmap: processEngagementHeatmap(recentActivity, byDepartment),
      participationPrediction: participationPredictionCalculated,
      // 🔥 NUEVOS CÁLCULOS AGREGADOS - PRESERVADOS
      departmentAnomalies: anomalyData.departmentAnomalies,
      positiveAnomalies: anomalyData.positiveAnomalies,
      
      // 🔥 VISTA DINÁMICA - Datos basados en momentum temporal unificado
      topMovers: topMovers,
      
      // 🚨 ANOMALÍAS NEGATIVAS - PRESERVADAS
      negativeAnomalies: negativeAnomaliesCalculated,
      
      meanRate: anomalyData.meanRate,
      totalDepartments: anomalyData.totalDepartments,
      crossStudyComparison: historicalData?.crossStudyComparison || null,
      
      // ✅ MOMENTUM DEPARTAMENTAL VISUAL - PRESERVADO
      departmentMomentum: departmentMomentumCalculated,
      
      // ✅ EXTENSIÓN TARJETAS VIVAS - PRESERVADAS
      riskTrendData: riskTrendDataCalculated,
      departmentSizes: departmentSizesCalculated,
      momentumGaugeData: momentumGaugeDataCalculated,
      
      // 🧠 DEPARTMENTAL INTELLIGENCE - PRESERVADO
      departmentalIntelligence: departmentalIntelligenceCalculated,
      
      // 🧠 COCKPIT INTELLIGENCE - PRESERVADO
      cockpitIntelligence: cockpitIntelligenceCalculated,
    };
  
  }, [campaignData, participantsData, historicalData, campaignDetails, campaignId]);// ✅ DEPENDENCIAS DIRECTAS

  console.log('🔍 [DESPUÉS DE MONITORDATA COMPLETO] Hook continúa al return final...');

  // ✅ HANDLERS Y UTILIDADES DE UI - PRESERVADOS
  const handleRefresh = useCallback(() => {
    refreshData();
    refreshParticipants();
    setLastRefresh(new Date());
  }, [refreshData, refreshParticipants]);

  console.log('🔍 [DESPUÉS DE HANDLERS] Hook sigue...');

  // ✅ CONECTAR BOTONES A APIS REALES - PRESERVADOS
  const handleSendReminder = useCallback(async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/reminders`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'general' })
      });
      
      if (response.ok) {
        console.log('✅ Reminder sent successfully');
        handleRefresh(); // Refresh data after action
      } else {
        console.error('❌ Error sending reminder');
        alert('Error enviando recordatorio. Inténtelo nuevamente.');
      }
    } catch (error) {
      console.error('❌ Network error sending reminder:', error);
      alert('Funcionalidad de recordatorio será implementada en próxima fase');
    }
  }, [campaignId, handleRefresh]);

  const handleExtendCampaign = useCallback(async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/extend`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 7 })
      });
      
      if (response.ok) {
        console.log('✅ Campaign extended successfully');
        handleRefresh(); // Refresh data after action
      } else {
        console.error('❌ Error extending campaign');
        alert('Error extendiendo campaña. Inténtelo nuevamente.');
      }
    } catch (error) {
      console.error('❌ Network error extending campaign:', error);
      alert('Funcionalidad de extensión será implementada en próxima fase');
    }
  }, [campaignId, handleRefresh]);

  const handleSendDepartmentReminder = useCallback(async (department: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/reminders`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'department', department })
      });
      
      if (response.ok) {
        console.log(`✅ Department reminder sent to ${department}`);
        handleRefresh(); // Refresh data after action
      } else {
        console.error(`❌ Error sending reminder to ${department}`);
        alert(`Error enviando recordatorio a ${department}. Inténtelo nuevamente.`);
      }
    } catch (error) {
      console.error(`❌ Network error sending reminder to ${department}:`, error);
      alert(`Funcionalidad de recordatorio para ${department} será implementada en próxima fase`);
    }
  }, [campaignId, handleRefresh]);

  console.log('🔍 [FINAL HOOK] Llegando al return final...');

  return {
    ...monitorDataCompleto,
    // 🧠 HANDLERS FINALES - PRESERVADOS
    error: error || null,
    isLoading: resultsLoading || participantsLoading || historyLoading || detailsLoading,
    handleRefresh,
    handleSendReminder,
    handleExtendCampaign,
    handleSendDepartmentReminder,
    getParticipationColor // Función utilitaria expuesta para componentes
  };
}