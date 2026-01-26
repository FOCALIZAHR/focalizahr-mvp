// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/competencies/[id]
// GET - Obtiene una competencia específica
// PATCH - Actualiza una competencia
// DELETE - Elimina una competencia custom (soft delete para templates)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { CompetencyService } from '@/lib/services/CompetencyService'

interface RouteParams {
  params: Promise<{ id: string }>
}

// ════════════════════════════════════════════════════════════════════════════
// GET /api/admin/competencies/[id]
// Obtiene una competencia específica
// ════════════════════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
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

    // Obtener competencia
    const competency = await CompetencyService.getById(userContext.accountId, id)

    if (!competency) {
      return NextResponse.json(
        { success: false, error: 'Competencia no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: competency
    })

  } catch (error) {
    console.error('Error en GET /api/admin/competencies/[id]:', error)
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
// PATCH /api/admin/competencies/[id]
// Actualiza una competencia (nombre, descripción, behaviors, isActive)
// ════════════════════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
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
        { success: false, error: 'Sin permisos para editar competencias' },
        { status: 403 }
      )
    }

    // Verificar que la competencia existe
    const existing = await CompetencyService.getById(userContext.accountId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Competencia no encontrada' },
        { status: 404 }
      )
    }

    // Parsear body
    const body = await request.json()
    const { name, description, behaviors, isActive, sortOrder } = body

    // Construir objeto de actualización (solo campos permitidos)
    const updateData: {
      name?: string
      description?: string
      behaviors?: string[]
      isActive?: boolean
      sortOrder?: number
    } = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (behaviors !== undefined) updateData.behaviors = behaviors
    if (isActive !== undefined) updateData.isActive = isActive
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    // Validar que hay algo que actualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    // Actualizar
    const competency = await CompetencyService.update(
      userContext.accountId,
      id,
      updateData
    )

    return NextResponse.json({
      success: true,
      data: competency,
      message: 'Competencia actualizada exitosamente'
    })

  } catch (error) {
    console.error('Error en PATCH /api/admin/competencies/[id]:', error)
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
// DELETE /api/admin/competencies/[id]
// Elimina una competencia custom o desactiva una de template
// ════════════════════════════════════════════════════════════════════════════

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
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
        { success: false, error: 'Sin permisos para eliminar competencias' },
        { status: 403 }
      )
    }

    // Verificar que la competencia existe
    const existing = await CompetencyService.getById(userContext.accountId, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Competencia no encontrada' },
        { status: 404 }
      )
    }

    // Si es custom, eliminar físicamente
    // Si es de template, solo desactivar
    if (existing.isCustom) {
      await CompetencyService.deleteCustom(userContext.accountId, id)
      return NextResponse.json({
        success: true,
        message: 'Competencia eliminada exitosamente'
      })
    } else {
      // Desactivar competencia de template
      await CompetencyService.toggleActive(userContext.accountId, id, false)
      return NextResponse.json({
        success: true,
        message: 'Competencia desactivada exitosamente (las competencias de template no se pueden eliminar)',
        data: { isActive: false }
      })
    }

  } catch (error) {
    console.error('Error en DELETE /api/admin/competencies/[id]:', error)
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
