// src/app/api/campaigns/metrics/route.ts - OPTIMIZADO CHAT 3A
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

// Cache simple en memoria (para producción usar Redis/Upstash)
interface CachedMetrics {
  data: any;
  timestamp: number;
  accountId: string;
}

const metricsCache = new Map<string, CachedMetrics>()
const CACHE_TTL = 60 * 1000 // 60 segundos

// Función para limpiar cache expirado
function cleanExpiredCache() {
  const now = Date.now()
  for (const [key, cached] of metricsCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      metricsCache.delete(key)
    }
  }
}

// GET /api/campaigns/metrics - Métricas tiempo real dashboard con cache
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const accountId = authResult.user.id
    const cacheKey = `metrics_${accountId}`

    // Limpiar cache expirado
    cleanExpiredCache()

    // Verificar cache
    const cached = metricsCache.get(cacheKey)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      const response = {
        ...cached.data,
        cache: {
          lastUpdated: new Date(cached.timestamp).toISOString(),
          ttl: Math.ceil((CACHE_TTL - (now - cached.timestamp)) / 1000),
          source: 'cache'
        },
        performance: {
          queryTime: Date.now() - startTime,
          cacheHit: true
        }
      }

      const headers = new Headers()
      headers.set('Cache-Control', 'private, max-age=60')
      headers.set('X-Cache-Status', 'HIT')
      headers.set('X-Response-Time', String(Date.now() - startTime))
      
      return new NextResponse(JSON.stringify(response), {
        status: 200,
        headers
      })
    }

    // Métricas principales (mantenidas del original)
    const [
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      draftCampaigns,
      totalParticipants,
      totalResponses
    ] = await Promise.all([
      prisma.campaign.count({ where: { accountId } }),
      prisma.campaign.count({ where: { accountId, status: 'active' } }),
      prisma.campaign.count({ where: { accountId, status: 'completed' } }),
      prisma.campaign.count({ where: { accountId, status: 'draft' } }),
      prisma.participant.count({
        where: { campaign: { accountId } }
      }),
      prisma.participant.count({
        where: { 
          campaign: { accountId },
          hasResponded: true
        }
      })
    ])

    // Calcular tasa de participación global
    const globalParticipationRate = totalParticipants > 0 
      ? Math.round((totalResponses / totalParticipants) * 100) 
      : 0

    // Obtener campañas activas con detalle
    const activeCampaignsDetail = await prisma.campaign.findMany({
      where: {
        accountId,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        endDate: true,
        totalInvited: true,
        totalResponded: true,
        campaignType: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: { endDate: 'asc' }
    })

    // Calcular días restantes y alertas
    const campaignsWithAlerts = activeCampaignsDetail.map(campaign => {
      const daysRemaining = Math.ceil(
        (campaign.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      
      const participationRate = campaign.totalInvited > 0 
        ? (campaign.totalResponded / campaign.totalInvited) * 100 
        : 0

      return {
        ...campaign,
        daysRemaining,
        participationRate: Math.round(participationRate),
        hasAlert: daysRemaining <= 2 || participationRate < 30
      }
    })

    // Respuestas recientes (últimas 24 horas)
    const recentResponses = await prisma.participant.count({
      where: {
        campaign: { accountId },
        hasResponded: true,
        responseDate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24 horas
        }
      }
    })

    // ✨ NUEVAS MÉTRICAS AVANZADAS CHAT 3A ✨

    // Métricas de crecimiento (últimos 30 días vs 30 días anteriores)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    const [
      campaignsLast30Days,
      campaignsPrevious30Days,
      responsesLast30Days,
      responsesPrevious30Days
    ] = await Promise.all([
      prisma.campaign.count({
        where: {
          accountId,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.campaign.count({
        where: {
          accountId,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        }
      }),
      prisma.participant.count({
        where: {
          campaign: { accountId },
          hasResponded: true,
          responseDate: { gte: thirtyDaysAgo }
        }
      }),
      prisma.participant.count({
        where: {
          campaign: { accountId },
          hasResponded: true,
          responseDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        }
      })
    ])

    // Calcular crecimiento
    const campaignGrowth = campaignsPrevious30Days > 0 
      ? Math.round(((campaignsLast30Days - campaignsPrevious30Days) / campaignsPrevious30Days) * 100)
      : campaignsLast30Days > 0 ? 100 : 0

    const responseGrowth = responsesPrevious30Days > 0
      ? Math.round(((responsesLast30Days - responsesPrevious30Days) / responsesPrevious30Days) * 100)
      : responsesLast30Days > 0 ? 100 : 0

    // Campaña con mejor participación
    const topPerformingCampaign = await prisma.campaign.findFirst({
      where: {
        accountId,
        status: { in: ['active', 'completed'] },
        totalInvited: { gt: 0 }
      },
      orderBy: [
        { totalResponded: 'desc' },
        { totalInvited: 'asc' }
      ],
      select: {
        name: true,
        totalResponded: true,
        totalInvited: true
      }
    })

    const topCampaignRate = topPerformingCampaign && topPerformingCampaign.totalInvited > 0
      ? Math.round((topPerformingCampaign.totalResponded / topPerformingCampaign.totalInvited) * 100)
      : 0

    // Tiempo promedio de completar encuestas (estimado)
    const averageCompletionTime = await prisma.response.aggregate({
      where: {
        participant: {
          campaign: { accountId }
        },
        responseTimeSeconds: { not: null }
      },
      _avg: {
        responseTimeSeconds: true
      }
    })

    const avgCompletionMinutes = averageCompletionTime._avg.responseTimeSeconds
      ? Math.round(averageCompletionTime._avg.responseTimeSeconds / 60)
      : null

    // Determinar tendencia de participación
    let participationTrend: 'up' | 'down' | 'stable' = 'stable'
    if (responseGrowth > 10) participationTrend = 'up'
    else if (responseGrowth < -10) participationTrend = 'down'

    // Alertas de riesgo
    const riskAlerts = campaignsWithAlerts
      .filter(c => c.hasAlert)
      .map(campaign => ({
        type: campaign.daysRemaining <= 2 ? 'expiring_soon' : 'low_participation' as const,
        campaignId: campaign.id,
        campaignName: campaign.name,
        value: campaign.daysRemaining <= 2 ? campaign.daysRemaining : campaign.participationRate,
        threshold: campaign.daysRemaining <= 2 ? 2 : 30
      }))

    // Estadísticas por tipo de campaña
    const campaignTypeStats = await prisma.campaign.groupBy({
      by: ['campaignTypeId', 'status'],
      where: { accountId },
      _count: {
        id: true
      }
    })

    const queryTime = Date.now() - startTime

    // Construir respuesta optimizada
    const responseData = {
      success: true,
      overview: {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        draftCampaigns,
        totalParticipants,
        totalResponses,
        globalParticipationRate,
        recentResponses,
        
        // ✨ Métricas avanzadas Chat 3A
        weeklyGrowth: Math.round(campaignGrowth / 4), // Aproximación semanal
        monthlyGrowth: campaignGrowth,
        averageCompletionTime: avgCompletionMinutes,
        topPerformingCampaign: topPerformingCampaign ? 
          `${topPerformingCampaign.name} (${topCampaignRate}%)` : 'N/A',
        participationTrend,
        riskAlerts
      },
      activeCampaigns: campaignsWithAlerts,
      alerts: riskAlerts,
      typeStats: campaignTypeStats,
      cache: {
        lastUpdated: new Date().toISOString(),
        ttl: 60,
        source: 'database'
      },
      performance: {
        queryTime,
        cacheHit: false
      },
      lastUpdated: new Date().toISOString()
    }

    // Guardar en cache
    metricsCache.set(cacheKey, {
      data: responseData,
      timestamp: now,
      accountId
    })

    // Headers optimizados
    const headers = new Headers()
    headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30')
    headers.set('X-Cache-Status', 'MISS')
    headers.set('X-Response-Time', String(queryTime))
    headers.set('ETag', `"metrics-${accountId}-${now}"`)

    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error fetching metrics:', error)
    
    const errorResponse = {
      success: false,
      error: 'Error interno del servidor',
      code: 'METRICS_ERROR',
      performance: {
        queryTime: Date.now() - startTime,
        cacheHit: false
      }
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}