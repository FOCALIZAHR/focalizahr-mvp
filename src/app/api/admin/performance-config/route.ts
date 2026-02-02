// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-config
// GET - Obtener configuración | PUT - Actualizar configuración
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'
import {
  FOCALIZAHR_DEFAULT_CONFIG,
  FOCALIZAHR_DEFAULT_WEIGHTS,
  validateLevelsConfig,
  validateEvaluatorWeights
} from '@/config/performanceClassification'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'performance:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const config = await PerformanceRatingService.getConfig(userContext.accountId)
    const weights = await PerformanceRatingService.getResolvedWeights(userContext.accountId)

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        evaluatorWeights: weights
      },
      isDefaultConfig: JSON.stringify(config) === JSON.stringify(FOCALIZAHR_DEFAULT_CONFIG),
      isDefaultWeights: JSON.stringify(weights) === JSON.stringify(FOCALIZAHR_DEFAULT_WEIGHTS)
    })

  } catch (error) {
    console.error('[API] Error en GET /api/admin/performance-config:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Solo ACCOUNT_OWNER o superior pueden modificar config
    const allowedRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'CEO']
    if (!userContext.role || !allowedRoles.includes(userContext.role)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para modificar configuración' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { levels, scaleType, evaluatorWeights } = body

    const errors: string[] = []

    // Validar escalas si se envían
    if (levels) {
      const levelsValidation = validateLevelsConfig(levels)
      if (!levelsValidation.valid) {
        errors.push(...levelsValidation.errors)
      }
    }

    // Validar pesos si se envían
    if (evaluatorWeights) {
      const weightsValidation = validateEvaluatorWeights(evaluatorWeights)
      if (!weightsValidation.valid) {
        errors.push(...weightsValidation.errors)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Configuración inválida', details: errors },
        { status: 400 }
      )
    }

    // Guardar config (upsert)
    const saved = await prisma.performanceRatingConfig.upsert({
      where: { accountId: userContext.accountId },
      create: {
        accountId: userContext.accountId,
        scaleType: scaleType || 'five_level',
        levels: levels || [],
        evaluatorWeights: evaluatorWeights || null
      },
      update: {
        ...(scaleType && { scaleType }),
        ...(levels && { levels }),
        ...(evaluatorWeights !== undefined && { evaluatorWeights }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: saved,
      message: 'Configuración guardada exitosamente'
    })

  } catch (error) {
    console.error('[API] Error en PUT /api/admin/performance-config:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
