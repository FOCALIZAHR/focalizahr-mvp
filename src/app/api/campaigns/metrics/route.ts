// src/app/api/campaigns/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

// GET /api/campaigns/metrics - Métricas tiempo real dashboard
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const accountId = authResult.user.id

    // Métricas principales
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

    // Estadísticas por tipo de campaña
    const campaignTypeStats = await prisma.campaign.groupBy({
      by: ['campaignTypeId', 'status'],
      where: { accountId },
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      overview: {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        draftCampaigns,
        totalParticipants,
        totalResponses,
        globalParticipationRate,
        recentResponses
      },
      activeCampaigns: campaignsWithAlerts,
      alerts: campaignsWithAlerts.filter(c => c.hasAlert),
      typeStats: campaignTypeStats,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}