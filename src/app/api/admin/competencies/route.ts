// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/competencies
// GET - Lista competencias de una cuenta
// POST - Crea competencia personalizada
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { CompetencyService } from '@/lib/services/CompetencyService'
import type { CompetencyCategory } from '@prisma/client'

// ════════════════════════════════════════════════════════════════════════════
// GET /api/admin/competencies
// Lista competencias de la cuenta del usuario
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    // Validar autenticación
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Validar permisos (HR_ADMIN o superior puede gestionar competencias)
    if (!hasPermission(userContext.role, 'competencies:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para gestionar competencias' },
        { status: 403 }
      )
    }

    // Obtener parámetros
    const searchParams = request.nextUrl.searchParams
    const queryAccountId = searchParams.get('accountId')
    const category = searchParams.get('category') as CompetencyCategory | null
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    // Para FOCALIZAHR_ADMIN, usar accountId del query param (cliente seleccionado)
    const targetAccountId = userContext.role === 'FOCALIZAHR_ADMIN' && queryAccountId
      ? queryAccountId
      : userContext.accountId

    // Obtener competencias
    const competencies = await CompetencyService.getByAccount(
      targetAccountId,
      {
        category: category || undefined,
        activeOnly
      }
    )

    // Obtener estadísticas
    const stats = await CompetencyService.getStats(targetAccountId)

    return NextResponse.json({
      success: true,
      data: competencies,
      stats,
      meta: {
        total: competencies.length,
        filters: {
          category,
          activeOnly
        }
      }
    })

  } catch (error) {
    console.error('Error en GET /api/admin/competencies:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST /api/admin/competencies
// Crea una competencia personalizada
// ════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    // Validar autenticación
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Validar permisos
    if (!hasPermission(userContext.role, 'competencies:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para crear competencias' },
        { status: 403 }
      )
    }

    // Parsear body
    const body = await request.json()
    const { code, name, description, category, behaviors, audienceRule, dimensionCode, subdimensionCode, accountId: bodyAccountId } = body

    // Para FOCALIZAHR_ADMIN, usar accountId del body (cliente seleccionado)
    const targetAccountId = userContext.role === 'FOCALIZAHR_ADMIN' && bodyAccountId
      ? bodyAccountId
      : userContext.accountId

    // Validaciones básicas
    if (!code || !name || !category) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: code, name, category' },
        { status: 400 }
      )
    }

    // Validar categoría
    const validCategories = ['CORE', 'LEADERSHIP', 'STRATEGIC', 'TECHNICAL']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Categoría inválida. Valores permitidos: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Validar audienceRule si existe
    if (audienceRule && audienceRule.minTrack) {
      const validTracks = ['COLABORADOR', 'MANAGER', 'EJECUTIVO']
      if (!validTracks.includes(audienceRule.minTrack)) {
        return NextResponse.json(
          { success: false, error: `Track inválido en audienceRule. Valores permitidos: ${validTracks.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Crear competencia
    const competency = await CompetencyService.createCustom(
      targetAccountId,
      {
        code: code.toUpperCase(),
        name,
        description,
        category: category as CompetencyCategory,
        behaviors: behaviors || [],
        audienceRule: audienceRule || null,
        dimensionCode,
        subdimensionCode
      }
    )

    return NextResponse.json({
      success: true,
      data: competency,
      message: 'Competencia creada exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error en POST /api/admin/competencies:', error)

    // Error de código duplicado
    if (error instanceof Error && error.message.includes('Ya existe una competencia')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    )
  }
}
