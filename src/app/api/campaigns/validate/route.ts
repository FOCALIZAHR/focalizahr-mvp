// src/app/api/campaigns/validate/route.ts - ENDPOINT VALIDACIÓN CAMPAÑA
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { wizardStep1Schema, wizardStep2Schema } from '@/lib/validations'
import { z } from 'zod'

// Schema para validar request de validación completa
const campaignValidationSchema = z.object({
  // Información básica (Step 1)
  name: z.string().min(3, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  description: z.string().max(500, 'Descripción muy larga').optional(),
  campaignTypeId: z.string().cuid('ID tipo campaña inválido'),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  
  // Configuración (Step 2)
  estimatedParticipants: z.number().min(5, 'Mínimo 5 participantes').max(1000, 'Máximo 1000 participantes'),
  targetDepartments: z.array(z.string()).optional(),
  targetLevels: z.array(z.string()).optional(),
  
  // Configuraciones adicionales
  sendReminders: z.boolean().default(true),
  anonymousResults: z.boolean().default(true),
  
  // Metadata de validación
  validateOnly: z.boolean().default(true), // Por defecto solo validar
  skipAdvancedValidation: z.boolean().default(false)
}).refine((data) => {
  // Validar que end date > start date
  return data.endDate > data.startDate
}, {
  message: 'Fecha de fin debe ser posterior a fecha de inicio',
  path: ['endDate']
}).refine((data) => {
  // Validar duración máxima (90 días)
  const diffTime = data.endDate.getTime() - data.startDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 90
}, {
  message: 'Duración máxima de campaña es 90 días',
  path: ['endDate']
})

// POST /api/campaigns/validate - Validación completa antes de crear
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Autenticación
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('🔍 Validating campaign data:', { 
      name: body.name, 
      type: body.campaignTypeId,
      participants: body.estimatedParticipants 
    })

    // Validación esquema principal
    const validationResult = campaignValidationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de campaña inválidos',
          validationErrors: validationResult.error.errors,
          field_errors: validationResult.error.errors.reduce((acc, err) => {
            const field = err.path.join('.')
            acc[field] = err.message
            return acc
          }, {} as Record<string, string>)
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // === VALIDACIONES DE NEGOCIO ===

    const validationIssues: string[] = []
    const validationWarnings: string[] = []
    const validationInfo: Record<string, any> = {}

    // 1. Verificar que el tipo de campaña existe y está activo
    const campaignType = await prisma.campaignType.findUnique({
      where: { id: data.campaignTypeId },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        questionCount: true,
        estimatedDuration: true,
        methodology: true,
        _count: {
          select: {
            campaigns: {
              where: { status: { in: ['active', 'completed'] } }
            }
          }
        }
      }
    })

    if (!campaignType) {
      validationIssues.push('Tipo de campaña no válido')
    } else if (!campaignType.isActive) {
      validationIssues.push('Tipo de campaña no está disponible')
    } else {
      validationInfo.campaignType = {
        name: campaignType.name,
        questionCount: campaignType.questionCount,
        estimatedDuration: campaignType.estimatedDuration,
        methodology: campaignType.methodology,
        popularity: campaignType._count.campaigns
      }
    }

    // 2. Verificar duplicados de nombre en la cuenta
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        accountId: authResult.user.id,
        name: data.name,
        status: { not: 'cancelled' }
      },
      select: { id: true, status: true, name: true }
    })

    if (existingCampaign) {
      validationIssues.push(`Ya existe una campaña activa con el nombre "${data.name}"`)
    }

    // 3. Verificar límites de campañas activas
    const activeCampaignsCount = await prisma.campaign.count({
      where: {
        accountId: authResult.user.id,
        status: 'active'
      }
    })

    // Obtener límites por tier de suscripción
    const accountLimits = {
      free: { maxActiveCampaigns: 1, maxParticipants: 50 },
      basic: { maxActiveCampaigns: 3, maxParticipants: 200 },
      pro: { maxActiveCampaigns: 10, maxParticipants: 1000 },
      enterprise: { maxActiveCampaigns: 50, maxParticipants: 5000 }
    }

    const userTier = authResult.user.subscriptionTier || 'free'
    const limits = accountLimits[userTier as keyof typeof accountLimits] || accountLimits.free

    if (activeCampaignsCount >= limits.maxActiveCampaigns) {
      validationIssues.push(`Límite de campañas activas alcanzado (${limits.maxActiveCampaigns})`)
    }

    if (data.estimatedParticipants > limits.maxParticipants) {
      validationIssues.push(`Número de participantes excede límite del plan (${limits.maxParticipants})`)
    }

    // 4. Validaciones de fechas avanzadas
    const now = new Date()
    const daysDiff = Math.ceil((data.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (data.startDate < now) {
      // Permitir hasta 2 horas en el pasado (zona horaria)
      const hoursDiff = (now.getTime() - data.startDate.getTime()) / (1000 * 60 * 60)
      if (hoursDiff > 2) {
        validationIssues.push('Fecha de inicio no puede ser en el pasado')
      } else {
        validationWarnings.push('Fecha de inicio muy cercana al momento actual')
      }
    }

    if (daysDiff > 365) {
      validationWarnings.push('Fecha de inicio muy lejana (más de 1 año)')
    }

    // 5. Validaciones de participantes
    if (data.estimatedParticipants < 10) {
      validationWarnings.push('Se recomienda mínimo 10 participantes para resultados estadísticamente significativos')
    }

    if (campaignType && data.estimatedParticipants > 500 && campaignType.questionCount > 30) {
      validationWarnings.push('Muchas preguntas + muchos participantes puede reducir tasa de respuesta')
    }

    // 6. Verificar disponibilidad de recursos del sistema
    if (!body.skipAdvancedValidation) {
      // Verificar carga del sistema en fechas propuestas
      const overlappingCampaigns = await prisma.campaign.count({
        where: {
          status: 'active',
          startDate: { lte: data.endDate },
          endDate: { gte: data.startDate }
        }
      })

      if (overlappingCampaigns > 100) {
        validationWarnings.push('Alta carga del sistema en las fechas seleccionadas')
      }

      validationInfo.systemLoad = {
        overlappingCampaigns,
        recommendedTimeSlots: overlappingCampaigns > 50 ? [
          'Madrugada (2-6 AM)',
          'Mediodía (12-2 PM)', 
          'Fin de semana'
        ] : null
      }
    }

    // === RESULTADO VALIDACIÓN ===

    const isValid = validationIssues.length === 0
    const hasWarnings = validationWarnings.length > 0

    const validationSummary = {
      success: true,
      valid: isValid,
      ready_to_create: isValid && !body.validateOnly,
      issues: validationIssues,
      warnings: validationWarnings,
      info: validationInfo,
      
      // Métricas para el frontend
      validation_score: Math.max(0, 100 - (validationIssues.length * 25) - (validationWarnings.length * 5)),
      estimated_success_probability: isValid ? (hasWarnings ? 0.85 : 0.95) : 0.3,
      
      // Próximos pasos sugeridos
      next_steps: isValid ? [
        'Revisar configuración final',
        'Preparar lista de participantes', 
        'Activar campaña'
      ] : [
        'Corregir errores listados',
        'Verificar configuración',
        'Validar nuevamente'
      ],
      
      // Límites y contexto
      account_limits: {
        subscription_tier: userTier,
        max_active_campaigns: limits.maxActiveCampaigns,
        max_participants: limits.maxParticipants,
        current_active_campaigns: activeCampaignsCount
      },
      
      // Performance
      validation_time_ms: Date.now() - startTime
    }

    // Headers de response
    const responseHeaders = new Headers()
    responseHeaders.set('Cache-Control', 'no-cache, must-revalidate')
    responseHeaders.set('X-Validation-Score', validationSummary.validation_score.toString())
    responseHeaders.set('X-Response-Time', String(Date.now() - startTime))

    const status = isValid ? 200 : 422 // 422 Unprocessable Entity para errores de validación

    return new NextResponse(
      JSON.stringify(validationSummary),
      { 
        status,
        headers: responseHeaders
      }
    )

  } catch (error) {
    console.error('❌ Campaign validation error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno durante validación',
        validation_time_ms: Date.now() - startTime,
        debug: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        } : undefined
      },
      { status: 500 }
    )
  }
}

// GET /api/campaigns/validate - Obtener reglas de validación
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener límites de la cuenta
    const userTier = authResult.user.subscriptionTier || 'free'
    const accountLimits = {
      free: { maxActiveCampaigns: 1, maxParticipants: 50 },
      basic: { maxActiveCampaigns: 3, maxParticipants: 200 },
      pro: { maxActiveCampaigns: 10, maxParticipants: 1000 },
      enterprise: { maxActiveCampaigns: 50, maxParticipants: 5000 }
    }

    const limits = accountLimits[userTier as keyof typeof accountLimits] || accountLimits.free

    // Obtener tipos de campaña disponibles
    const campaignTypes = await prisma.campaignType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        questionCount: true,
        estimatedDuration: true,
        methodology: true
      },
      orderBy: { sortOrder: 'asc' }
    })

    const validationRules = {
      success: true,
      rules: {
        campaign_name: {
          min_length: 3,
          max_length: 100,
          unique_per_account: true,
          allowed_characters: 'letras, números, espacios, guiones y paréntesis'
        },
        dates: {
          min_start_date: 'ahora - 2 horas',
          max_duration_days: 90,
          max_future_days: 365
        },
        participants: {
          min_recommended: 10,
          min_required: 5,
          max_allowed: limits.maxParticipants,
          statistical_significance: 'mínimo 30 para análisis profundo'
        },
        campaigns: {
          max_active: limits.maxActiveCampaigns,
          duplicate_names: false
        }
      },
      account_context: {
        subscription_tier: userTier,
        current_limits: limits,
        available_campaign_types: campaignTypes
      },
      validation_endpoints: {
        validate_campaign: '/api/campaigns/validate',
        check_name_availability: '/api/campaigns/check-name',
        estimate_success: '/api/campaigns/estimate'
      }
    }

    return NextResponse.json(validationRules, {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache 5 minutos
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Error fetching validation rules:', error)
    return NextResponse.json(
      { success: false, error: 'Error obteniendo reglas de validación' },
      { status: 500 }
    )
  }
}