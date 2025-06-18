// src/app/api/campaigns/metrics/route.ts - OPTIMIZADO CON COMPATIBILIDAD 100%
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

// Cache optimizado con TTL dinámico
interface CachedMetrics {
  data: any;
  timestamp: number;
  accountId: string;
}

const metricsCache = new Map<string, CachedMetrics>()
const CACHE_TTL = 45 * 1000 // 45 segundos para balance performance/actualidad

// Función de limpieza cache más eficiente
function cleanExpiredCache() {
  const now = Date.now()
  const keysToDelete: string[] = []
  
  for (const [key, cached] of metricsCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      keysToDelete.push(key)
    }
  }
  
  keysToDelete.forEach(key => metricsCache.delete(key))
}

// GET /api/campaigns/metrics - OPTIMIZACIÓN CON COMPATIBILIDAD TOTAL
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

    // Limpieza cache optimizada
    cleanExpiredCache()

    // Verificar cache con TTL dinámico
    const cached = metricsCache.get(cacheKey)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      // 🎯 ESTRUCTURA EXACTA MANTENIDA - CACHE HIT
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

      return NextResponse.json(response, {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=45',
          'X-Cache-Status': 'HIT',
          'X-Response-Time': String(Date.now() - startTime)
        }
      })
    }

    // 🚀 SUPER OPTIMIZACIÓN: CONSULTAS AGREGADAS MASIVAS
    console.log('🔄 Executing optimized metrics query...')
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    // ✨ OPTIMIZACIÓN CRÍTICA: Promise.all con consultas agregadas masivas
    const [
      // 🎯 CONSULTA 1: Aggregate masivo de campañas por status
      campaignMetrics,
      
      // 🎯 CONSULTA 2: Aggregate masivo de participantes
      participantsData,
      
      // 🎯 CONSULTA 3: Métricas de crecimiento en una sola consulta
      growthData,
      
      // 🎯 CONSULTA 4: Top campaign optimizada
      topCampaign,
      
      // 🎯 CONSULTA 5: Respuestas recientes
      recentResponses,
      
      // 🎯 CONSULTA 6: Tiempo promedio completar (solo si hay respuestas)
      averageCompletionTime
    ] = await Promise.all([
      // Aggregate de campañas por status en lugar de múltiples counts
      prisma.campaign.groupBy({
        by: ['status'],
        where: { accountId },
        _count: {
          id: true
        }
      }),

      // Aggregate de participantes por respuesta en lugar de counts separados
      prisma.participant.groupBy({
        by: ['hasResponded'],
        where: {
          campaign: { accountId }
        },
        _count: {
          id: true
        }
      }),

      // Crecimiento de campañas con un solo aggregate
      prisma.campaign.groupBy({
        by: ['status'],
        where: {
          accountId,
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        _count: {
          id: true
        }
      }),

      // Top performing campaign optimizada
      prisma.campaign.findFirst({
        where: {
          accountId,
          status: { in: ['active', 'completed'] },
          totalInvited: { gt: 0 }
        },
        orderBy: [
          { totalResponded: 'desc' }
        ],
        select: {
          name: true,
          totalResponded: true,
          totalInvited: true
        }
      }),

      // Respuestas recientes (últimas 24h)
      (() => {
        const twentyFourHoursAgo = new Date()
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
        
        return prisma.participant.count({
          where: {
            campaign: { accountId },
            hasResponded: true,
            responseDate: {
              gte: twentyFourHoursAgo
            }
          }
        })
      })(),

      // Tiempo promedio solo si hay respuestas
      prisma.response.aggregate({
        where: {
          participant: {
            campaign: { accountId },
            hasResponded: true
          },
          responseTimeSeconds: { not: null }
        },
        _avg: {
          responseTimeSeconds: true
        }
      })
    ])

    console.log('📊 Aggregated queries completed in:', Date.now() - startTime, 'ms')

    // 🎯 TRANSFORMACIÓN A ESTRUCTURA EXACTA ORIGINAL

    // Procesar métricas campañas desde aggregate
    const statusCounts = campaignMetrics.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    const totalCampaigns = Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
    const activeCampaigns = statusCounts['active'] || 0
    const completedCampaigns = statusCounts['completed'] || 0
    const draftCampaigns = statusCounts['draft'] || 0
    const cancelledCampaigns = statusCounts['cancelled'] || 0

    // Procesar participantes desde aggregate
    const participantCounts = participantsData.reduce((acc, item) => {
      if (item.hasResponded) {
        acc.responded = item._count.id
      } else {
        acc.pending = item._count.id
      }
      return acc
    }, { responded: 0, pending: 0 })

    const totalParticipants = participantCounts.responded + participantCounts.pending
    const totalResponses = participantCounts.responded

    // Tasa de participación global
    const globalParticipationRate = totalParticipants > 0 
      ? Math.round((totalResponses / totalParticipants) * 100) 
      : 0

    // Crecimiento de campañas desde aggregate
    const campaignGrowthLast30 = growthData.reduce((sum, item) => sum + item._count.id, 0)

    // Tiempo promedio en minutos
    const averageCompletionTimeValue = averageCompletionTime._avg.responseTimeSeconds
      ? Math.round(averageCompletionTime._avg.responseTimeSeconds / 60)
      : 0

    // Top performing campaign
    const topPerformingCampaignType = topCampaign 
      ? `${topCampaign.name} (${Math.round((topCampaign.totalResponded / topCampaign.totalInvited) * 100)}%)`
      : null

    const queryTime = Date.now() - startTime

    // 🎯 RESPUESTA LIMPIA Y CONSISTENTE - ESTRUCTURA PLANA
    const responseData = {
      // ✅ MÉTRICAS PRINCIPALES EN ROOT (formato estándar)
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      draftCampaigns,
      cancelledCampaigns,
      globalParticipationRate,
      totalResponses,
      totalParticipants,
      averageCompletionTime: averageCompletionTimeValue,
      topPerformingCampaignType,
      
      // ✅ MÉTRICAS ADICIONALES
      weeklyGrowth: Math.round(campaignGrowthLast30 / 4),
      monthlyGrowth: campaignGrowthLast30,
      topPerformingCampaign: topPerformingCampaignType, // Alias para compatibilidad
      recentResponses,
      
      // ✅ METADATA
      cache: {
        lastUpdated: new Date().toISOString(),
        ttl: Math.ceil(CACHE_TTL / 1000),
        source: 'database'
      },
      performance: {
        queryTime,
        cacheHit: false,
        queriesExecuted: 6,
        optimizationLevel: 'maximum'
      },
      lastUpdated: new Date().toISOString()
    }

    // ⚡ GUARDAR EN CACHE
    metricsCache.set(cacheKey, {
      data: responseData,
      timestamp: now,
      accountId
    })

    console.log('✅ Metrics endpoint completed in:', Date.now() - startTime, 'ms')

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=45',
        'X-Cache-Status': 'MISS',
        'X-Response-Time': String(Date.now() - startTime),
        'X-Optimization-Level': 'maximum',
        'X-Queries-Count': '6'
      }
    })

  } catch (error) {
    console.error('💥 Error fetching metrics:', error)
    
    // Error response manteniendo estructura
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        code: 'METRICS_ERROR',
        performance: {
          queryTime: Date.now() - startTime,
          cacheHit: false
        }
      },
      { status: 500 }
    )
  }
}