// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/competencies/templates
// GET - Lista templates de competencias disponibles
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { CompetencyService } from '@/lib/services/CompetencyService'
import { COMPETENCY_TEMPLATES, countByCategory } from '@/lib/constants/competencyTemplates'

// ════════════════════════════════════════════════════════════════════════════
// GET /api/admin/competencies/templates
// Lista templates de competencias disponibles para inicialización
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

    // Validar permisos
    if (!hasPermission(userContext.role, 'competencies:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    // Para FOCALIZAHR_ADMIN, usar accountId del query param (cliente seleccionado)
    // Para otros roles, usar su propio accountId
    const { searchParams } = new URL(request.url)
    const queryAccountId = searchParams.get('accountId')

    const targetAccountId = userContext.role === 'FOCALIZAHR_ADMIN' && queryAccountId
      ? queryAccountId
      : userContext.accountId

    // Verificar si ya tiene competencias inicializadas
    const hasCompetencies = await CompetencyService.hasCompetencies(targetAccountId)

    // Obtener templates disponibles
    const templates = CompetencyService.getAvailableTemplates()

    // Enriquecer con conteo por categoría
    const templatesWithDetails = templates.map(template => ({
      ...template,
      byCategory: countByCategory(template.id),
      preview: COMPETENCY_TEMPLATES[template.id]?.competencies.slice(0, 3).map(c => ({
        code: c.code,
        name: c.name,
        category: c.category
      }))
    }))

    return NextResponse.json({
      success: true,
      data: templatesWithDetails,
      meta: {
        hasCompetencies,
        canInitialize: !hasCompetencies,
        message: hasCompetencies
          ? 'Ya tienes competencias inicializadas. Puedes agregar competencias personalizadas.'
          : 'Selecciona un template para inicializar tu biblioteca de competencias.'
      }
    })

  } catch (error) {
    console.error('Error en GET /api/admin/competencies/templates:', error)
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
