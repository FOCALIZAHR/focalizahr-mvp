// src/app/api/campaigns/[id]/route.ts
// ARCHIVO FALTANTE - IMPLEMENTACIÓN BASADA EN PATRONES EXISTENTES

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/campaigns/[id] - Detalles campaña individual
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log('📊 Campaign details request:', params.id)
    
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const accountId = authResult.user.id

    // Buscar campaña con multi-tenancy isolation
    const campaign = await prisma.campaign.findUnique({
      where: { 
        id: campaignId,
        accountId: accountId // Aislamiento multi-tenant
      },
      include: {
        account: {
          select: {
            id: true,
            companyName: true,
            adminEmail: true,
            subscriptionTier: true
          }
        },
        campaignType: {
          select: {
            id: true,
            name: true,
            description: true,
            questionCount: true,
            estimatedDuration: true
          }
        },
        participants: {
          select: {
            id: true,
            email: true,
            hasResponded: true,
            responseDate: true,
            department: true,
            position: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            participants: true,
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Campaña no encontrada',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Calcular métricas
    const totalInvited = campaign._count.participants
    const totalResponded = campaign.participants.filter(p => p.hasResponded).length
    const participationRate = totalInvited > 0 ? (totalResponded / totalInvited) * 100 : 0
    
    // Estado inteligente
    const now = new Date()
    const endDate = new Date(campaign.endDate)
    const isOverdue = now > endDate && campaign.status === 'active'
    const daysRemaining = campaign.status === 'active' 
      ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Risk level básico
    let riskLevel = 'low'
    if (campaign.status === 'active') {
      if (participationRate < 30) riskLevel = 'high'
      else if (participationRate < 60) riskLevel = 'medium'
    }

    // Respuesta compatible con frontend existente
    const response = {
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        activatedAt: campaign.activatedAt,
        completedAt: campaign.completedAt,
        
        // Company info (estructura compatible)
        company: {
          name: campaign.account.companyName,
          admin_email: campaign.account.adminEmail
        },
        
        // Campaign type
        campaignType: campaign.campaignType,
        
        // Métricas calculadas
        totalInvited,
        totalResponded,
        participationRate: Math.round(participationRate * 100) / 100,
        
        // Estados inteligentes
        isOverdue,
        daysRemaining,
        riskLevel,
        
        // Participants summary
        participants: campaign.participants.map(p => ({
          id: p.id,
          hasResponded: p.hasResponded,
          responseDate: p.responseDate,
          department: p.department,
          position: p.position,
          createdAt: p.createdAt
          // Email omitido por privacy
        }))
      },
      performance: {
        queryTime: Date.now() - startTime
      }
    }

    console.log(`✅ Campaign details retrieved: ${campaign.name}`)

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=30'
      }
    })

  } catch (error) {
    console.error('❌ Error fetching campaign details:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        performance: {
          queryTime: Date.now() - startTime
        }
      },
      { status: 500 }
    )
  }
}