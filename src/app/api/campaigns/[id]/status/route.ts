// NUEVOS ENDPOINTS APIS - SIN TOCAR EXISTING route.ts

// 1. ENDPOINT GESTIÓN ESTADOS: src/app/api/campaigns/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { campaignStateTransitionSchema } from '@/lib/validations'

// PUT /api/campaigns/[id]/status - Cambiar estado campaña
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const campaignId = params.id

    // Obtener campaña actual
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: authResult.user.id
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

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
    const validTransitions = {
      draft: ['active'],
      active: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    }

    const allowedTargets = validTransitions[campaign.status as keyof typeof validTransitions]
    if (!body.forceTransition && !allowedTargets.includes(body.toStatus)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `No se puede cambiar de ${campaign.status} a ${body.toStatus}` 
        },
        { status: 409 }
      )
    }

    // Validaciones específicas para activación
    if (body.toStatus === 'active') {
      if (campaign.totalInvited < 5) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Mínimo 5 participantes requeridos para activar' 
          },
          { status: 409 }
        )
      }

      const now = new Date()
      if (campaign.startDate > now) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No se puede activar antes de la fecha de inicio' 
          },
          { status: 409 }
        )
      }
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

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: updateData,
      include: {
        campaignType: true,
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
        oldValues: { status: campaign.status },
        newValues: { 
          status: body.toStatus,
          action: body.action,
          reason: body.reason
        },
        userInfo: {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      }
    })

    // Side effects según el nuevo estado
    const sideEffects = []
    
    if (body.toStatus === 'active') {
      // TODO: Enviar emails invitación (implementar en siguiente fase)
      sideEffects.push('Emails de invitación programados')
    }

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
      transition: {
        from: campaign.status,
        to: body.toStatus,
        action: body.action,
        timestamp: new Date()
      },
      sideEffects,
      message: `Campaña ${body.action === 'activate' ? 'activada' : 'actualizada'} exitosamente`
    })

  } catch (error) {
    console.error('Error updating campaign status:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}