// src/app/api/campaigns/route.ts - FIX NULL PARAMETERS
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { z } from 'zod'


// Schema de validación para crear campaña (mantenido igual)
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

// Schema para validar query parameters - FIXED para manejar null
const queryParamsSchema = z.object({
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
  search: z.string().optional(),
  campaignType: z.string().cuid().optional(),
  limit: z.string().transform(val => Math.min(Math.max(parseInt(val) || 10, 1), 50)).optional(),
  offset: z.string().transform(val => Math.max(parseInt(val) || 0, 0)).optional(),
  sortBy: z.enum(['name', 'startDate', 'participationRate', 'status', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// GET /api/campaigns - Listar campañas con filtros avanzados
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No autorizado' 
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // 🔧 FIX CRÍTICO: Convertir null a undefined antes de validar
    const rawParams = {
      status: searchParams.get('status') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      campaignType: searchParams.get('campaignType') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined
    }

    // Validar y parsear query parameters
    const queryValidation = queryParamsSchema.safeParse(rawParams)

    if (!queryValidation.success) {
      console.error('Query validation error:', queryValidation.error.errors)
      return NextResponse.json(
        { 
          success: false,
          error: 'Parámetros de consulta inválidos',
          details: queryValidation.error.errors
        },
        { status: 400 }
      )
    }

    const params = queryValidation.data
    const limit = params.limit || 10
    const offset = params.offset || 0

    // Construir filtros dinámicos
    const where: any = {
      accountId: authResult.user.id
    }

    // Filtro por status
    if (params.status) {
      where.status = params.status
    }

    // Filtro por tipo de campaña
    if (params.campaignType) {
      where.campaignTypeId = params.campaignType
    }

    // Filtro de búsqueda en nombre y descripción
    if (params.search && params.search.trim()) {
      where.OR = [
        {
          name: {
            contains: params.search.trim(),
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: params.search.trim(),
            mode: 'insensitive'
          }
        }
      ]
    }

    // Construir ordenamiento dinámico
    let orderBy: any = {}
    
    switch (params.sortBy) {
      case 'participationRate':
        // Ordenar por tasa de participación calculada
        orderBy = [
          { totalResponded: params.sortOrder },
          { totalInvited: params.sortOrder === 'asc' ? 'desc' : 'asc' }
        ]
        break
      case 'name':
        orderBy = { name: params.sortOrder }
        break
      case 'startDate':
        orderBy = { startDate: params.sortOrder }
        break
      case 'status':
        orderBy = { status: params.sortOrder }
        break
      case 'createdAt':
      default:
        orderBy = { createdAt: params.sortOrder }
        break
    }

    // Ejecutar consulta principal con optimizaciones
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
           account: {
    select: {
      companyName: true,
      adminEmail: true
    }
  },
          campaignType: {
            select: {
              id: true,
              name: true,
              slug: true,
              estimatedDuration: true,
              questionCount: true,
              methodology: true
            }
          },
          _count: {
            select: {
              participants: true
            }
          }
        },
        orderBy,
        take: limit,
        skip: offset
      }),
      prisma.campaign.count({ where })
    ])

    // Procesar campañas con métricas calculadas
    const campaignsWithMetrics = campaigns.map(campaign => {
      const participationRate = campaign.totalInvited > 0 
        ? Math.round((campaign.totalResponded / campaign.totalInvited) * 100) 
        : 0

      const now = new Date()
      const daysRemaining = campaign.status === 'active' 
        ? Math.ceil((campaign.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null

      const isOverdue = campaign.status === 'active' && campaign.endDate < now

      // Calcular nivel de riesgo
      let riskLevel: 'low' | 'medium' | 'high' = 'low'
      if (campaign.status === 'active') {
        if (participationRate < 30 || isOverdue) {
          riskLevel = 'high'
        } else if (participationRate < 50 || (daysRemaining && daysRemaining <= 2)) {
          riskLevel = 'medium'
        }
      }

      // Determinar capacidades del usuario
      const canActivate = campaign.status === 'draft' && campaign.totalInvited > 0
      const canViewResults = campaign.status === 'completed' && campaign.totalResponded > 0
      const canEdit = ['draft', 'active'].includes(campaign.status)
      const canDelete = campaign.status === 'draft'

      return {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        campaignType: campaign.campaignType,
        
        // Métricas básicas
        totalInvited: campaign.totalInvited,
        totalResponded: campaign.totalResponded,
        participationRate,
        
        // Fechas
        startDate: campaign.startDate.toISOString(),
        endDate: campaign.endDate.toISOString(),
        createdAt: campaign.createdAt.toISOString(),
        activatedAt: campaign.activatedAt?.toISOString() || null,
        completedAt: campaign.completedAt?.toISOString() || null,
        
        // Métricas avanzadas Chat 3A
        daysRemaining,
        isOverdue,
        riskLevel,
        participantCount: campaign._count.participants,
        
        // Configuraciones
        sendReminders: campaign.sendReminders,
        anonymousResults: campaign.anonymousResults,
        createdByName: campaign.createdByName,
        
        // Capacidades de usuario
        canActivate,
        canViewResults,
        canEdit,
        canDelete
      }
    })

    // Calcular información de paginación
    const totalPages = Math.ceil(total / limit)
    const currentPage = Math.floor(offset / limit) + 1

    // Estructura de respuesta optimizada
    const response = {
      success: true,
      campaigns: campaignsWithMetrics,
      pagination: {
        page: currentPage,
        limit,
        offset,
        total,
        totalPages,
        hasNext: offset + limit < total,
        hasPrev: offset > 0
      },
      filters: {
        status: params.status || null,
        search: params.search || null,
        campaignType: params.campaignType || null,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder
      },
      performance: {
        queryTime: Date.now() - Date.now(), // Se calculará en implementación real
        resultCount: campaignsWithMetrics.length
      }
    }

    // Headers de optimización
    const headers = new Headers()
    headers.set('Cache-Control', 'private, max-age=30') // Cache 30 segundos
    headers.set('X-Total-Count', total.toString())
    headers.set('X-Page-Count', totalPages.toString())

    return new NextResponse(
      JSON.stringify(response),
      { 
        status: 200,
        headers
      }
    )

  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// POST /api/campaigns - Crear nueva campaña (mantenido igual)
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No autorizado' 
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar datos de entrada
    const validationResult = createCampaignSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Datos inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Verificar que el tipo de campaña existe y está activo
    const campaignType = await prisma.campaignType.findUnique({
      where: { 
        id: data.campaignTypeId,
        isActive: true
      }
    })

    if (!campaignType) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tipo de campaña no encontrado o inactivo' 
        },
        { status: 404 }
      )
    }

    // Obtener configuraciones de la cuenta
    const account = await prisma.account.findUnique({
      where: { id: authResult.user.id },
      select: {
        maxActiveCampaigns: true,
        maxCampaignDurationDays: true,
        companyName: true
      }
    })

    if (!account) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cuenta no encontrada' 
        },
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
          success: false,
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
          success: false,
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
          success: false,
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
            questionCount: true,
            methodology: true
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
          duration: durationDays,
          company: account.companyName
        },
        userInfo: {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      }
    })

    return NextResponse.json(
      { 
        success: true,
        campaign: {
          ...campaign,
          participationRate: 0,
          daysRemaining: Math.ceil((campaign.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          isOverdue: false,
          riskLevel: 'low' as const,
          canActivate: false, // No participants yet
          canViewResults: false,
          canEdit: true,
          canDelete: true
        },
        message: 'Campaña creada exitosamente'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}