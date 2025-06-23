// src/app/api/campaigns/[id]/status/route.ts
// 📁 INSTRUCCIÓN: CREAR NUEVO ARCHIVO EN: src/app/api/campaigns/[id]/status/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { campaignStateTransitionSchema } from '@/lib/validations'

// PUT /api/campaigns/[id]/status - Cambiar estado campaña
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log('🔄 Campaign status change request:', params.id)
    
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const campaignId = params.id

    console.log('📋 Status change data:', body)

    // Obtener campaña actual
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: authResult.user.id
      },
      include: {
        campaignType: true,
        participants: {
          select: {
            id: true,
            hasResponded: true
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    console.log('✅ Campaign found:', campaign.name, 'Status:', campaign.status)

    // Validar transición de estado
    const transitionData = {
      campaignId,
      fromStatus: campaign.status,
      toStatus: body.toStatus,
      action: body.action,
      reason: body.reason,
      forceTransition: body.forceTransition || false
    }

    const validation = campaignStateTransitionSchema.safeParse(transitionData)
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transición de estado inválida',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    // Validaciones específicas por transición
    const validTransitions: Record<string, string[]> = {
      draft: ['active', 'cancelled'],
      active: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    }

    const allowedTargets = validTransitions[campaign.status as keyof typeof validTransitions] || []
    if (!body.forceTransition && !allowedTargets.includes(body.toStatus)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `No se puede cambiar de ${campaign.status} a ${body.toStatus}`,
          code: 'INVALID_TRANSITION'
        },
        { status: 409 }
      )
    }

    // Validaciones específicas para activación
    if (body.toStatus === 'active') {
      console.log('🔍 Validating activation requirements...')
      
      if (campaign.totalInvited < 5) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Mínimo 5 participantes requeridos para activar',
            code: 'INSUFFICIENT_PARTICIPANTS'
          },
          { status: 409 }
        )
      }

      const now = new Date()
      const hoursDiff = (campaign.startDate.getTime() - now.getTime()) / (1000 * 60 * 60)
        if (hoursDiff > 24) {
          return NextResponse.json(
          { 
            success: false, 
            error: 'No se puede activar más de 24 horas antes de la fecha de inicio',
            code: 'INVALID_START_DATE'
          },
          { status: 409 }
        )
      }

      // Verificar límite de campañas activas
      const activeCampaignsCount = await prisma.campaign.count({
        where: {
          accountId: authResult.user.id,
          campaignTypeId: campaign.campaignTypeId,
          status: 'active'
        }
      })

      const account = await prisma.account.findUnique({
        where: { id: authResult.user.id },
        select: { maxActiveCampaigns: true }
      })

      if (account && activeCampaignsCount >= account.maxActiveCampaigns) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Límite de campañas activas alcanzado (${account.maxActiveCampaigns})`,
            code: 'CAMPAIGN_LIMIT_REACHED'
          },
          { status: 409 }
        )
      }

      console.log('✅ Activation requirements validated')
    }

    // Actualizar estado con metadatos
    const updateData: any = {
      status: body.toStatus,
      updatedAt: new Date()
    }

    if (body.toStatus === 'active') {
      updateData.activatedAt = new Date()
      
  
    } else if (body.toStatus === 'completed') {
      updateData.completedAt = new Date()
    }

    console.log('💾 Updating campaign status...', updateData)

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: updateData,
      include: {
        campaignType: true,
        participants: {
          select: {
            id: true,
            email: true,
            hasResponded: true,
            uniqueToken: true
          }
        },
        _count: {
          select: { participants: true }
        }
      }
    })

    // Crear audit log
    await prisma.auditLog.create({
      data: {
        accountId: authResult.user.id,
        campaignId,
        action: `campaign_status_changed`,
        entityType: 'campaign',
        entityId: campaignId,
        oldValues: { 
          status: campaign.status,
          activatedAt: campaign.activatedAt,
          completedAt: campaign.completedAt
        },
        newValues: { 
          status: body.toStatus,
          action: body.action,
          reason: body.reason,
          activatedAt: updateData.activatedAt,
          completedAt: updateData.completedAt
        },
        userInfo: {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      }
    })

    console.log('📝 Audit log created')

    // Side effects según el nuevo estado
    const sideEffects = []
    
    if (body.toStatus === 'active') {
      sideEffects.push('Tokens generados para participantes')
      sideEffects.push('Emails de invitación listos para envío')
      
      // TODO: Aquí se integraría el sistema de emails
      console.log('📧 Email system integration point - tokens ready')
    }

    if (body.toStatus === 'completed') {
      sideEffects.push('Campaña lista para análisis de resultados')
    }

    // Calcular métricas actualizadas
    const participationRate = updatedCampaign.totalInvited > 0 
      ? Math.round((updatedCampaign.totalResponded / updatedCampaign.totalInvited) * 100) 
      : 0

    const response = {
      success: true,
      campaign: {
        ...updatedCampaign,
        participationRate,
        daysRemaining: updatedCampaign.status === 'active' 
          ? Math.ceil((updatedCampaign.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        canActivate: false,
        canViewResults: updatedCampaign.status === 'completed',
        canEdit: ['draft', 'active'].includes(updatedCampaign.status),
        canDelete: updatedCampaign.status === 'draft'
      },
      transition: {
        from: campaign.status,
        to: body.toStatus,
        action: body.action,
        timestamp: new Date(),
        reason: body.reason
      },
      sideEffects,
      message: `Campaña ${
        body.action === 'activate' ? 'activada' : 
        body.action === 'complete' ? 'completada' :
        body.action === 'cancel' ? 'cancelada' : 'actualizada'
      } exitosamente`,
      performance: {
        queryTime: Date.now() - startTime
      }
    }

    console.log('🎉 Status change completed successfully')

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Error updating campaign status:', error)
    
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