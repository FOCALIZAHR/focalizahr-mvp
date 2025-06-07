// src/app/api/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { z } from 'zod'

// Schema de validación para crear campaña
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(255, 'Nombre muy largo'),
  description: z.string().optional(),
  campaignTypeId: z.string().cuid('ID de tipo campaña inválido'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  sendReminders: z.boolean().default(true),
  anonymousResults: z.boolean().default(true)
}).refine((data) => {
  return data.endDate > data.startDate
}, {
  message: 'Fecha de fin debe ser posterior a fecha de inicio',
  path: ['endDate']
})

// GET /api/campaigns - Listar campañas del usuario
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir filtros
    const where: any = {
      accountId: authResult.user.id
    }

    if (status && ['draft', 'active', 'completed', 'cancelled'].includes(status)) {
      where.status = status
    }

    // Consulta con relaciones
    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        campaignType: {
          select: {
            id: true,
            name: true,
            slug: true,
            estimatedDuration: true,
            questionCount: true
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // Activas primero
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    // Contar total para paginación
    const total = await prisma.campaign.count({ where })

    // Calcular métricas por campaña
    const campaignsWithMetrics = campaigns.map(campaign => {
      const participationRate = campaign.totalInvited > 0 
        ? Math.round((campaign.totalResponded / campaign.totalInvited) * 100) 
        : 0

      const daysRemaining = campaign.status === 'active' 
        ? Math.ceil((campaign.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null

      return {
        ...campaign,
        participationRate,
        daysRemaining,
        participantCount: campaign._count.participants
      }
    })

    return NextResponse.json({
      campaigns: campaignsWithMetrics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns - Crear nueva campaña
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar datos de entrada
    const validationResult = createCampaignSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Verificar que el tipo de campaña existe
    const campaignType = await prisma.campaignType.findUnique({
      where: { id: data.campaignTypeId }
    })

    if (!campaignType) {
      return NextResponse.json(
        { error: 'Tipo de campaña no encontrado' },
        { status: 404 }
      )
    }

    // Obtener configuraciones de la cuenta
    const account = await prisma.account.findUnique({
      where: { id: authResult.user.id },
      select: {
        maxActiveCampaigns: true,
        maxCampaignDurationDays: true
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Cuenta no encontrada' },
        { status: 404 }
      )
    }

    // Verificar límite de campañas activas del mismo tipo
    const activeCampaignsCount = await prisma.campaign.count({
      where: {
        accountId: authResult.user.id,
        campaignTypeId: data.campaignTypeId,
        status: 'active'
      }
    })

    if (activeCampaignsCount >= account.maxActiveCampaigns) {
      return NextResponse.json(
        { 
          error: `Límite alcanzado: máximo ${account.maxActiveCampaigns} campaña(s) activa(s) del mismo tipo`,
          code: 'CAMPAIGN_LIMIT_REACHED'
        },
        { status: 409 }
      )
    }

    // Verificar duración de la campaña
    const durationDays = Math.ceil(
      (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (durationDays > account.maxCampaignDurationDays) {
      return NextResponse.json(
        { 
          error: `Duración máxima permitida: ${account.maxCampaignDurationDays} días`,
          code: 'DURATION_LIMIT_EXCEEDED'
        },
        { status: 409 }
      )
    }

    // Verificar que el nombre no esté duplicado para esta cuenta
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        accountId: authResult.user.id,
        name: data.name
      }
    })

    if (existingCampaign) {
      return NextResponse.json(
        { 
          error: 'Ya existe una campaña con este nombre',
          code: 'DUPLICATE_NAME'
        },
        { status: 409 }
      )
    }

    // Crear la campaña
    const campaign = await prisma.campaign.create({
      data: {
        accountId: authResult.user.id,
        campaignTypeId: data.campaignTypeId,
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        sendReminders: data.sendReminders,
        anonymousResults: data.anonymousResults,
        createdByName: authResult.user.adminName,
        status: 'draft'
      },
      include: {
        campaignType: {
          select: {
            id: true,
            name: true,
            slug: true,
            estimatedDuration: true,
            questionCount: true
          }
        }
      }
    })

    // Crear audit log
    await prisma.auditLog.create({
      data: {
        accountId: authResult.user.id,
        campaignId: campaign.id,
        action: 'campaign_created',
        entityType: 'campaign',
        entityId: campaign.id,
        newValues: {
          name: campaign.name,
          type: campaignType.name,
          duration: durationDays
        },
        userInfo: {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      }
    })

    return NextResponse.json(
      { 
        campaign,
        message: 'Campaña creada exitosamente'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
