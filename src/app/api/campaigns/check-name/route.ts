// src/app/api/campaigns/check-name/route.ts - VALIDACIÓN NOMBRES ÚNICOS
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { z } from 'zod'

// Schema para validar request de check name
const checkNameSchema = z.object({
  name: z.string()
    .min(3, 'Nombre muy corto (mínimo 3 caracteres)')
    .max(100, 'Nombre muy largo (máximo 100 caracteres)')
    .regex(/^[a-zA-Z0-9\s\-_áéíóúñÁÉÍÓÚÑ().,]+$/, 'Caracteres no válidos en el nombre')
    .transform(val => val.trim()),
  excludeId: z.string().cuid().optional() // Para editar campañas existentes
})

// POST /api/campaigns/check-name - Verificar disponibilidad nombre
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🔍 Check name availability request started')
    
    // Autenticación
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('📥 Check name body:', { name: body.name, excludeId: body.excludeId })
    
    // Validación esquema
    const validationResult = checkNameSchema.safeParse(body)
    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: 'Datos inválidos',
          issues: validationResult.error.errors.map(err => err.message),
          field_errors: validationResult.error.errors.reduce((acc, err) => {
            const field = err.path.join('.')
            acc[field] = err.message
            return acc
          }, {} as Record<string, string>)
        },
        { status: 400 }
      )
    }

    const { name, excludeId } = validationResult.data
    console.log('✅ Validation passed, checking name:', name)

    // === VERIFICACIÓN DISPONIBILIDAD ===

    // Construir query de búsqueda
    const whereClause: any = {
      accountId: authResult.user.id,
      name: {
        equals: name,
        mode: 'insensitive' // Case insensitive
      },
      status: {
        not: 'cancelled' // Ignorar campañas canceladas
      }
    }

    // Si estamos editando, excluir la campaña actual
    if (excludeId) {
      whereClause.id = {
        not: excludeId
      }
    }

    console.log('🔍 Searching for existing campaigns...')
    
    // Buscar campañas con el mismo nombre
    const existingCampaign = await prisma.campaign.findFirst({
      where: whereClause,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        campaignType: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })

    const isAvailable = !existingCampaign
    console.log(`${isAvailable ? '✅' : '❌'} Name availability result:`, { 
      available: isAvailable, 
      conflictId: existingCampaign?.id 
    })

    // === GENERAR SUGERENCIAS SI NO DISPONIBLE ===

    let suggestions: string[] = []
    let similarNames: string[] = []

    if (!isAvailable) {
      console.log('💡 Generating name suggestions...')
      
      // Obtener nombres similares para análisis
      const similarCampaigns = await prisma.campaign.findMany({
        where: {
          accountId: authResult.user.id,
          status: { not: 'cancelled' },
          name: {
            contains: name.split(' ')[0], // Primera palabra
            mode: 'insensitive'
          }
        },
        select: {
          name: true
        },
        take: 5
      })

      similarNames = similarCampaigns.map(c => c.name)

      // Generar sugerencias inteligentes
      const baseName = name
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().toLocaleDateString('es-ES', { month: 'long' })
      
      suggestions = [
        `${baseName} ${currentYear}`,
        `${baseName} ${currentMonth}`,
        `${baseName} v2`,
        `${baseName} - Seguimiento`,
        `${baseName} (Actualizado)`,
        `Nuevo ${baseName}`,
        `${baseName} Plus`
      ].slice(0, 3) // Máximo 3 sugerencias

      // Verificar que las sugerencias también estén disponibles
      const suggestionsToCheck = suggestions.map(suggestion => ({
          accountId: authResult.user!.id,  // ← FIX: Agregado !
        name: { equals: suggestion, mode: 'insensitive' as const },
        status: { not: 'cancelled' as const }
      }))

      if (suggestionsToCheck.length > 0) {
        const conflictingSuggestions = await prisma.campaign.findMany({
          where: {
            OR: suggestionsToCheck
          },
          select: { name: true }
        })

        const conflictingNames = new Set(conflictingSuggestions.map(c => c.name.toLowerCase()))
        suggestions = suggestions.filter(s => !conflictingNames.has(s.toLowerCase()))
      }
    }

    // === ANÁLISIS ADICIONAL ===

    // Obtener estadísticas de nombres para contexto
    const nameStats = await prisma.campaign.findMany({
      where: {
        accountId: authResult.user.id,
        status: { not: 'cancelled' }
      },
      select: {
        name: true,
        status: true
      }
    })

    const totalCampaigns = nameStats.length
    const nameLength = name.length
    const averageNameLength = totalCampaigns > 0 
      ? Math.round(nameStats.reduce((sum, c) => sum + c.name.length, 0) / totalCampaigns)
      : 0

    // === RESPONSE ESTRUCTURADO ===

    const responseData = {
      success: true,
      available: isAvailable,
      name: name,
      
      // Información del conflicto (si existe)
      conflict: existingCampaign ? {
        id: existingCampaign.id,
        name: existingCampaign.name,
        status: existingCampaign.status,
        type: existingCampaign.campaignType.name,
        created: existingCampaign.createdAt.toISOString(),
        message: `Ya existe una campaña ${existingCampaign.status === 'active' ? 'activa' : 'en borrador'} con este nombre`
      } : null,

      // Sugerencias alternativas
      suggestions: {
        alternatives: suggestions,
        similar_names: similarNames,
        strategy: suggestions.length > 0 ? 'Se agregó año/versión para diferenciación' : null
      },

      // Análisis y recomendaciones
      analysis: {
        name_length: nameLength,
        length_assessment: nameLength < 10 ? 'corto' : nameLength > 50 ? 'largo' : 'adecuado',
        account_average_length: averageNameLength,
        total_campaigns: totalCampaigns,
        uniqueness_score: isAvailable ? 100 : Math.max(0, 100 - (similarNames.length * 20)),
        recommendations: [
          ...(nameLength > 50 ? ['Considerar un nombre más corto para mejor legibilidad'] : []),
          ...(nameLength < 5 ? ['Considerar un nombre más descriptivo'] : []),
          ...(!isAvailable ? ['Agregar año o versión para diferenciación'] : []),
          ...(isAvailable && totalCampaigns === 0 ? ['¡Perfecto! Este será tu primera campaña'] : [])
        ]
      },

      // Validación adicional
      validation: {
        format_valid: true,
        length_valid: nameLength >= 3 && nameLength <= 100,
        characters_valid: /^[a-zA-Z0-9\s\-_áéíóúñÁÉÍÓÚÑ().,]+$/.test(name),
        uniqueness_valid: isAvailable
      },

      // Performance y metadata
      performance: {
        check_time_ms: Date.now() - startTime,
        search_scope: 'account_campaigns',
        exclude_cancelled: true
      }
    }

    // Headers de response
    const responseHeaders = new Headers()
    responseHeaders.set('Cache-Control', 'no-cache, must-revalidate') // No cache para disponibilidad
    responseHeaders.set('X-Availability-Check', isAvailable ? 'available' : 'conflict')
    responseHeaders.set('X-Response-Time', String(Date.now() - startTime))

    const status = isAvailable ? 200 : 409 // 409 Conflict si no disponible

    console.log(`✅ Check name completed in ${Date.now() - startTime}ms`)

    return new NextResponse(
      JSON.stringify(responseData),
      { 
        status,
        headers: responseHeaders
      }
    )

  } catch (error) {
    console.error('❌ Check name error:', error)
    
    return NextResponse.json(
      {
        success: false,
        available: false,
        error: 'Error interno durante verificación',
        check_time_ms: Date.now() - startTime,
        debug: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        } : undefined
      },
      { status: 500 }
    )
  }
}

// GET /api/campaigns/check-name - Obtener reglas de nomenclatura
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener estadísticas de nombres existentes
    const existingCampaigns = await prisma.campaign.findMany({
      where: {
        accountId: authResult.user.id,
        status: { not: 'cancelled' }
      },
      select: {
        name: true,
        status: true,
        campaignType: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })

    const namePatterns = existingCampaigns.reduce((patterns, campaign) => {
      const type = campaign.campaignType.slug
      if (!patterns[type]) {
        patterns[type] = []
      }
      patterns[type].push(campaign.name)
      return patterns
    }, {} as Record<string, string[]>)

    const namingRules = {
      success: true,
      rules: {
        length: {
          min: 3,
          max: 100,
          recommended_min: 10,
          recommended_max: 50
        },
        format: {
          allowed_characters: 'letras, números, espacios, guiones, paréntesis, puntos y comas',
          regex: '^[a-zA-Z0-9\\s\\-_áéíóúñÁÉÍÓÚÑ().,]+$',
          case_sensitive: false
        },
        uniqueness: {
          scope: 'account',
          exclude_cancelled: true,
          case_insensitive: true
        },
        suggestions: {
          use_year: 'Para campañas anuales',
          use_version: 'Para iteraciones (v1, v2)',
          use_month: 'Para campañas mensuales',
          use_department: 'Para segmentación específica'
        }
      },
      account_context: {
        total_campaigns: existingCampaigns.length,
        patterns_by_type: namePatterns,
        common_prefixes: ['Estudio', 'Encuesta', 'Evaluación', 'Diagnóstico'],
        reserved_names: ['Test', 'Demo', 'Ejemplo', 'Prueba']
      },
      validation_endpoint: '/api/campaigns/check-name'
    }

    return NextResponse.json(namingRules, {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache 5 minutos
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Error fetching naming rules:', error)
    return NextResponse.json(
      { success: false, error: 'Error obteniendo reglas de nomenclatura' },
      { status: 500 }
    )
  }
}