// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/competencies/initialize
// POST - Inicializa biblioteca de competencias desde un template
// ════════════════════════════════════════════════════════════════════════════
// DIRECTRIZ 4: Lazy Initialization
// Se copia el template solo cuando el cliente ACTIVA el módulo Performance
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { CompetencyService } from '@/lib/services/CompetencyService'

// ════════════════════════════════════════════════════════════════════════════
// POST /api/admin/competencies/initialize
// Inicializa la biblioteca de competencias desde un template
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

    // Validar permisos (solo ACCOUNT_OWNER, HR_ADMIN o superior)
    if (!hasPermission(userContext.role, 'competencies:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para inicializar competencias' },
        { status: 403 }
      )
    }

    // Parsear body
    const body = await request.json()
    const { templateId, accountId: bodyAccountId } = body

    // Validar templateId
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'templateId es requerido' },
        { status: 400 }
      )
    }

    // Para FOCALIZAHR_ADMIN, usar accountId del body (cliente seleccionado)
    const targetAccountId = userContext.role === 'FOCALIZAHR_ADMIN' && bodyAccountId
      ? bodyAccountId
      : userContext.accountId

    // Verificar si ya tiene competencias
    const hasCompetencies = await CompetencyService.hasCompetencies(targetAccountId)
    if (hasCompetencies) {
      return NextResponse.json(
        {
          success: false,
          error: 'Esta cuenta ya tiene competencias inicializadas. No se puede reinicializar.',
          hint: 'Puedes agregar competencias personalizadas o editar las existentes.'
        },
        { status: 409 }
      )
    }

    // Inicializar desde template
    const result = await CompetencyService.initializeFromTemplate(
      targetAccountId,
      templateId
    )

    // Obtener competencias creadas para retornar
    const competencies = await CompetencyService.getByAccount(targetAccountId)

    return NextResponse.json({
      success: true,
      message: `Biblioteca de competencias inicializada exitosamente con ${result.created} competencias`,
      data: {
        created: result.created,
        template: result.template,
        competencies
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error en POST /api/admin/competencies/initialize:', error)

    // Error de template no encontrado
    if (error instanceof Error && error.message.includes('no encontrado')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Error de ya inicializado
    if (error instanceof Error && error.message.includes('ya tiene competencias')) {
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
