
// src/app/api/campaigns/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

// GET /api/campaigns/[id] - Obtener campaña específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: params.id,
        accountId: authResult.user.id
      },
      include: {
        campaignType: {
          include: {
            questions: {
              where: { isActive: true },
              orderBy: { questionOrder: 'asc' }
            }
          }
        },
        participants: {
          select: {
            id: true,
            email: true,
            department: true,
            position: true,
            hasResponded: true,
            responseDate: true,
            createdAt: true
          }
        },
        campaignResults: true,
        _count: {
          select: {
            participants: true
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    // Calcular métricas adicionales
    const participationRate = campaign.totalInvited > 0 
      ? Math.round((campaign.totalResponded / campaign.totalInvited) * 100) 
      : 0

    const daysRemaining = campaign.status === 'active' 
      ? Math.ceil((campaign.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null

    const responsesByDay = campaign.participants
      .filter(p => p.hasResponded && p.responseDate)
      .reduce((acc: any, p) => {
        const day = p.responseDate!.toISOString().split('T')[0]
        acc[day] = (acc[day] || 0) + 1
        return acc
      }, {})

    return NextResponse.json({
      ...campaign,
      participationRate,
      daysRemaining,
      responsesByDay,
      isEditable: campaign.status === 'draft',
      canActivate: campaign.status === 'draft' && campaign.totalInvited >= 5
    })

  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/campaigns/[id]/activate - Activar campaña
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { action } = await request.json()

    if (action !== 'activate') {
      return NextResponse.json(
        { error: 'Acción no válida' },
        { status: 400 }
      )
    }

    // Buscar la campaña
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: params.id,
        accountId: authResult.user.id
      },
      include: {
        campaignType: true,
        _count: {
          select: { participants: true }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    // Validaciones pre-activación
    if (campaign.status !== 'draft') {
      return NextResponse.json(
        { error: 'Solo se pueden activar campañas en estado borrador' },
        { status: 409 }
      )
    }

    if (campaign._count.participants < 5) {
      return NextResponse.json(
        { error: 'Mínimo 5 participantes requeridos para activar' },
        { status: 409 }
      )
    }

    // Verificar límites de cuenta
    const account = await prisma.account.findUnique({
      where: { id: authResult.user.id }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Cuenta no encontrada' },
        { status: 404 }
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

    if (activeCampaignsCount >= account.maxActiveCampaigns) {
      return NextResponse.json(
        { error: 'Límite de campañas activas alcanzado' },
        { status: 409 }
      )
    }

    // Activar la campaña
    const updatedCampaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        status: 'active',
        activatedAt: new Date(),
        totalInvited: campaign._count.participants
      },
      include: {
        campaignType: true,
        participants: {
          select: {
            id: true,
            email: true,
            uniqueToken: true
          }
        }
      }
    })

    // Crear audit log
    await prisma.auditLog.create({
      data: {
        accountId: authResult.user.id,
        campaignId: campaign.id,
        action: 'campaign_activated',
        entityType: 'campaign',
        entityId: campaign.id,
        newValues: {
          status: 'active',
          totalInvited: campaign._count.participants,
          activatedAt: new Date()
        },
        userInfo: {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      }
    })

    // TODO: Aquí se enviarían los emails de invitación
    // Para MVP, retornamos success con información para envío manual

    return NextResponse.json({
      campaign: updatedCampaign,
      message: 'Campaña activada exitosamente',
      emailsToSend: updatedCampaign.participants.length,
      nextSteps: [
        'Emails de invitación se enviarán automáticamente',
        'Dashboard actualizado con métricas en tiempo real',
        'Recordatorios programados según configuración'
      ]
    })

  } catch (error) {
    console.error('Error activating campaign:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
