// ====================================================================
// FOCALIZAHR HISTORICAL CAMPAIGNS API - PROTOCOLO AGREGACIONES DB
// src/app/api/historical/route.ts
// Chat 4B: Cross-Study Comparator - BACKEND CEREBRO IMPLEMENTATION
// ====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// ✅ INTERFACE DATOS HISTÓRICOS PROCESADOS
interface HistoricalCampaignData {
  id: string;
  name: string;
  campaignType: {
    name: string;
    slug: string;
  };
  startDate: string;
  endDate: string;
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  durationDays: number;
  velocityMetrics: {
    averageResponsesPerDay: number;
    peakResponseDay: number;
    completionVelocity: number;
    firstWeekRate: number;
  };
  engagementPattern: {
    dayTwoRate: number;
    dayThreeRate: number;
    finalWeekSurge: number;
    consistencyScore: number;
    peakEngagementDay: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = authResult.user.id;
    const limit = parseInt(searchParams.get('limit') || '10');
    const campaignType = searchParams.get('type');
    const currentCampaignId = searchParams.get('current');

    console.log('[HISTORICAL API] Iniciando consulta para accountId:', accountId);

    // ✅ PASO 1: OBTENER CAMPAÑAS BÁSICAS (CON CAMPAIGN TYPE)
    const campaignsQuery = await prisma.campaign.findMany({
      where: {
        accountId,
        status: 'completed',
        ...(campaignType && { campaignTypeId: campaignType })
      },
      include: {
        campaignType: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        endDate: 'desc'
      },
      take: limit
    });

    if (campaignsQuery.length === 0) {
      return NextResponse.json({
        campaigns: [],
        total: 0,
        lastUpdated: new Date().toISOString()
      });
    }

    const campaignIds = campaignsQuery.map(c => c.id);
    console.log('[HISTORICAL API] Procesando', campaignIds.length, 'campañas históricas');

    // ✅ PASO 2: AGREGACIONES DB - CONTEOS BÁSICOS POR CAMPAÑA
    const participantCounts = await prisma.participant.groupBy({
      by: ['campaignId'],
      where: {
        campaignId: { in: campaignIds }
      },
      _count: {
        id: true
      }
    });

    // ✅ PASO 3: AGREGACIONES DB - CONTEOS COMPLETADOS POR CAMPAÑA
    const completedCounts = await prisma.participant.groupBy({
      by: ['campaignId'],
      where: {
        campaignId: { in: campaignIds },
        hasResponded: true,
        responseDate: { not: null }
      },
      _count: {
        id: true
      }
    });

    // ✅ PASO 4: AGREGACIONES DB - DATOS TEMPORALES PARA VELOCITY
    const temporalData = await prisma.participant.findMany({
      where: {
        campaignId: { in: campaignIds },
        hasResponded: true,
        responseDate: { not: null }
      },
      select: {
        campaignId: true,
        responseDate: true,
        createdAt: true
      }
    });

    console.log('[HISTORICAL API] Datos temporales obtenidos:', temporalData.length, 'registros');

    // ✅ PASO 5: PROCESAMIENTO BACKEND - CALCULAR MÉTRICAS
    const processedData: HistoricalCampaignData[] = campaignsQuery.map(campaign => {
      // Encontrar conteos para esta campaña
      const totalCount = participantCounts.find(p => p.campaignId === campaign.id)?._count.id || 0;
      const completedCount = completedCounts.find(p => p.campaignId === campaign.id)?._count.id || 0;
      
      const participationRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      
      // Calcular duración campaña
      const startDate = new Date(campaign.startDate);
      const endDate = new Date(campaign.endDate);
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Filtrar datos temporales para esta campaña
      const campaignTemporalData = temporalData.filter(p => p.campaignId === campaign.id);

      // ✅ CALCULAR VELOCITY METRICS EN BACKEND
      const velocityMetrics = calculateVelocityMetrics(campaignTemporalData, startDate, endDate, durationDays);
      
      // ✅ CALCULAR ENGAGEMENT PATTERNS EN BACKEND
      const engagementPattern = calculateEngagementPattern(campaignTemporalData, startDate, durationDays);

      return {
        id: campaign.id,
        name: campaign.name,
        campaignType: campaign.campaignType,
        startDate: campaign.startDate.toISOString(),
        endDate: campaign.endDate.toISOString(),
        totalInvited: totalCount,
        totalResponded: completedCount,
        participationRate: Math.round(participationRate * 10) / 10,
        durationDays,
        velocityMetrics,
        engagementPattern
      };
    });

    console.log('[HISTORICAL API] Procesamiento completado en backend');

    // ✅ PASO 6: CALCULAR COMPARACIÓN ACTUAL SI SE PROPORCIONA
    let currentComparison = null;
    if (currentCampaignId && processedData.length > 0) {
      try {
        // Obtener datos de la campaña actual
        const currentCampaign = await prisma.campaign.findUnique({
          where: { id: currentCampaignId },
          include: {
            campaignType: {
              select: { name: true, slug: true }
            }
          }
        });

        if (currentCampaign) {
          // Obtener datos de participación actual
          const currentParticipants = await prisma.participant.findMany({
            where: { campaignId: currentCampaignId },
            select: {
              hasResponded: true,
              responseDate: true,
              createdAt: true
            }
          });

          const currentTotal = currentParticipants.length;
          const currentResponded = currentParticipants.filter(p => p.hasResponded).length;
          const currentRate = currentTotal > 0 ? (currentResponded / currentTotal) * 100 : 0;

          // Buscar campaña histórica del mismo tipo
          const matchingHistorical = processedData.find(h => 
            h.campaignType.slug === currentCampaign.campaignType?.slug ||
            h.campaignType.name === currentCampaign.campaignType?.name
          );

          if (matchingHistorical) {
            // Calcular velocidad actual
            const currentStart = new Date(currentCampaign.startDate);
            const now = new Date();
            const currentDuration = Math.max(1, Math.ceil((now.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)));
            const currentVelocity = currentResponded / currentDuration;

            // Calcular comparación
            const velocityDiff = matchingHistorical.velocityMetrics.averageResponsesPerDay > 0 ? 
              ((currentVelocity - matchingHistorical.velocityMetrics.averageResponsesPerDay) / matchingHistorical.velocityMetrics.averageResponsesPerDay) * 100 : 0;

            const velocityTrend: 'faster' | 'slower' | 'similar' = 
              Math.abs(velocityDiff) <= 15 ? 'similar' : velocityDiff > 0 ? 'faster' : 'slower';

            // Calcular similaridad de patrón
            const rateAlignment = Math.abs(currentRate - matchingHistorical.participationRate);
            const patternSimilarity = Math.max(50, Math.min(95, 90 - (rateAlignment * 1.5)));

            // Proyección final
            const baseProjection = currentRate;
            const velocityBonus = velocityTrend === 'faster' ? 8 : velocityTrend === 'slower' ? -5 : 0;
            const patternBonus = patternSimilarity > 80 ? 3 : patternSimilarity < 60 ? -3 : 0;
            const finalRate = Math.max(30, Math.min(95, baseProjection + velocityBonus + patternBonus));

            // Confianza
            const dataQuality = currentParticipants.length > 5 ? 20 : 10;
            const confidence = Math.max(50, Math.min(90, 60 + dataQuality + (patternSimilarity > 70 ? 15 : 0)));

            const riskLevel: 'low' | 'medium' | 'high' = finalRate < 60 ? 'high' : finalRate < 75 ? 'medium' : 'low';

            // Generar insights
            const insights = [
              `La velocidad de respuesta es **${Math.round(Math.abs(velocityDiff))}% ${velocityTrend === 'faster' ? 'superior' : velocityTrend === 'slower' ? 'inferior' : 'similar'}** a la campaña de referencia "${matchingHistorical.name}".`,
              `La tasa de participación actual ${Math.abs(currentRate - matchingHistorical.participationRate) < 5 ? 'se alinea estrechamente' : 'difiere significativamente'} con el rendimiento histórico reciente.`,
              `Proyección sugiere ${riskLevel === 'low' ? 'cumplimiento exitoso' : riskLevel === 'medium' ? 'riesgo moderado' : 'riesgo alto'} de objetivos.`
            ];

            // Generar recomendaciones
            const recommendations = [];
            if (velocityTrend === 'slower') {
              recommendations.push('Considerar el envío de un recordatorio para mejorar el ritmo de respuesta.');
            } else {
              recommendations.push('La estrategia de comunicación actual está funcionando bien; mantener el momentum.');
            }
            recommendations.push('Analizar los picos de actividad del mapa de calor para optimizar futuras comunicaciones.');

            currentComparison = {
              lastCampaign: {
                name: matchingHistorical.name,
                type: matchingHistorical.campaignType.name,
                participationRate: matchingHistorical.participationRate,
                velocityMetrics: matchingHistorical.velocityMetrics
              },
              comparison: {
                velocityTrend,
                velocityDifference: Math.round(velocityDiff),
                patternSimilarity: Math.round(patternSimilarity),
                projectedOutcome: {
                  finalRate: Math.round(finalRate),
                  confidence: Math.round(confidence),
                  riskLevel
                }
              },
              insights,
              recommendations
            };
          }
        }
      } catch (error) {
        console.error('[HISTORICAL API] Error calculando comparación actual:', error);
        // No fallar la API, solo omitir comparación
      }
    }

    return NextResponse.json({
      campaigns: processedData,
      total: processedData.length,
      lastUpdated: new Date().toISOString(),
      ...(currentComparison && { currentComparison })
    });

  } catch (error) {
    console.error('[HISTORICAL API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ✅ FUNCIÓN BACKEND - CÁLCULO VELOCITY METRICS
function calculateVelocityMetrics(
  temporalData: Array<{ responseDate: Date | null; createdAt: Date | null }>,
  startDate: Date,
  endDate: Date,
  durationDays: number
) {
  if (temporalData.length === 0) {
    return {
      averageResponsesPerDay: 0,
      peakResponseDay: 0,
      completionVelocity: 0,
      firstWeekRate: 0
    };
  }

  // Agrupar respuestas por día
  const responsesByDay: Record<string, number> = {};
  const firstWeekEnd = new Date(startDate);
  firstWeekEnd.setDate(firstWeekEnd.getDate() + 7);
  
  let firstWeekResponses = 0;

  temporalData.forEach(participant => {
    if (!participant.responseDate) return;
    
    const completedDate = new Date(participant.responseDate);
    const dayKey = completedDate.toISOString().split('T')[0];
    responsesByDay[dayKey] = (responsesByDay[dayKey] || 0) + 1;
    
    // Contar primera semana
    if (completedDate <= firstWeekEnd) {
      firstWeekResponses++;
    }
  });

  const dailyCounts = Object.values(responsesByDay);
  const averageResponsesPerDay = temporalData.length / Math.max(durationDays, 1);
  const peakResponseDay = dailyCounts.length > 0 ? Math.max(...dailyCounts) : 0;
  
  // Velocidad completitud: % en primera mitad vs total
  const midPoint = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2);
  const firstHalf = temporalData.filter(p => 
    p.responseDate && new Date(p.responseDate) <= midPoint
  ).length;
  const completionVelocity = temporalData.length > 0 ? (firstHalf / temporalData.length) * 100 : 0;
  
  const firstWeekRate = temporalData.length > 0 ? (firstWeekResponses / temporalData.length) * 100 : 0;

  return {
    averageResponsesPerDay: Math.round(averageResponsesPerDay * 10) / 10,
    peakResponseDay,
    completionVelocity: Math.round(completionVelocity),
    firstWeekRate: Math.round(firstWeekRate)
  };
}

// ✅ FUNCIÓN BACKEND - CÁLCULO ENGAGEMENT PATTERNS
function calculateEngagementPattern(
  temporalData: Array<{ responseDate: Date | null }>,
  startDate: Date,
  durationDays: number
) {
  if (temporalData.length === 0) {
    return {
      dayTwoRate: 0,
      dayThreeRate: 0,
      finalWeekSurge: 0,
      consistencyScore: 0,
      peakEngagementDay: 1
    };
  }

  // Calcular días específicos
  const dayTwo = new Date(startDate);
  dayTwo.setDate(dayTwo.getDate() + 1);
  
  const dayThree = new Date(startDate);
  dayThree.setDate(dayThree.getDate() + 2);
  
  const finalWeekStart = new Date(startDate);
  finalWeekStart.setDate(finalWeekStart.getDate() + Math.max(0, durationDays - 7));

  // Contar respuestas por período
  let dayTwoResponses = 0;
  let dayThreeResponses = 0;
  let finalWeekResponses = 0;
  
  const responsesByDay: Record<number, number> = {};

  temporalData.forEach(participant => {
    if (!participant.responseDate) return;
    
    const completed = new Date(participant.responseDate);
    const daysDiff = Math.floor((completed.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Agrupar por día
    responsesByDay[daysDiff] = (responsesByDay[daysDiff] || 0) + 1;
    
    // Contadores específicos
    if (completed.toDateString() === dayTwo.toDateString()) {
      dayTwoResponses++;
    }
    if (completed.toDateString() === dayThree.toDateString()) {
      dayThreeResponses++;
    }
    if (completed >= finalWeekStart) {
      finalWeekResponses++;
    }
  });

  // Calcular tasas
  const total = temporalData.length;
  const dayTwoRate = Math.round((dayTwoResponses / total) * 100);
  const dayThreeRate = Math.round((dayThreeResponses / total) * 100);
  const finalWeekSurge = Math.round((finalWeekResponses / total) * 100);

  // Calcular consistencia (distribución uniforme)
  const dailyCounts = Object.values(responsesByDay);
  let consistencyScore = 50; // Default medio
  
  if (dailyCounts.length > 0) {
    const mean = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;
    const variance = dailyCounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dailyCounts.length;
    consistencyScore = Math.max(0, Math.min(100, 100 - (Math.sqrt(variance) / Math.max(mean, 1)) * 50));
  }

  // Encontrar día pico
  const peakDay = Object.entries(responsesByDay).reduce((max, [day, count]) => 
    count > (responsesByDay[max] || 0) ? parseInt(day) : max, 1
  );

  return {
    dayTwoRate,
    dayThreeRate,
    finalWeekSurge,
    consistencyScore: Math.round(consistencyScore),
    peakEngagementDay: peakDay + 1 // +1 para mostrar día humano-readable
  };
}