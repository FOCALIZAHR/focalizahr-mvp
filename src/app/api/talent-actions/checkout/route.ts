/**
 * POST /api/talent-actions/checkout
 *
 * Registra accion ejecutiva del Checkout (Acto 4) via IntelligenceInsight.
 * Crea insight en ACKNOWLEDGED directamente (CEO ya esta actuando).
 *
 * Body:
 * {
 *   gerenciaId: string
 *   gerenciaName: string
 *   pattern: string (FRAGIL, QUEMADA, etc.)
 *   action: 'NOTIFY_HRBP' | 'SCHEDULE_COMMITTEE' | 'FLAG_FOR_REVIEW'
 * }
 *
 * Response (LEY 2 Manifiesto UX - micro-copy estrategico):
 * {
 *   success: true,
 *   data: {
 *     insightId: "...",
 *     status: "ACKNOWLEDGED",
 *     actionTitle: "Comite de Riesgo programado",
 *     message: "FocalizaHR medira si esta intervencion..."
 *   }
 * }
 *
 * GET /api/talent-actions/checkout
 * → Devuelve gerencias con FLAG_FOR_REVIEW activo (para badge en Hub)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission
} from '@/lib/services/AuthorizationService'
import { IntelligenceInsightService } from '@/lib/services/IntelligenceInsightService'

const VALID_ACTIONS = ['NOTIFY_HRBP', 'SCHEDULE_COMMITTEE', 'FLAG_FOR_REVIEW']

// ═══════════════════════════════════════════════════════════════════════════
// POST: Registrar accion → IntelligenceInsight
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'talent-actions:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { gerenciaId, gerenciaName, pattern, action } = body

    if (!gerenciaId || !pattern || !action) {
      return NextResponse.json(
        { success: false, error: 'gerenciaId, pattern y action son requeridos' },
        { status: 400 }
      )
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Accion invalida. Use: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      )
    }

    const userEmail = request.headers.get('x-user-email') || 'unknown'
    const userId = request.headers.get('x-user-id') || userEmail

    // Crear IntelligenceInsight
    const result = await IntelligenceInsightService.createFromTAC({
      accountId: userContext.accountId,
      departmentId: gerenciaId,
      departmentName: gerenciaName || 'Gerencia',
      actionCode: action,
      actionTaken: action,
      acknowledgedBy: userId,
      pattern
    })

    // Acciones adicionales (email, etc.)
    if (action === 'NOTIFY_HRBP') {
      const hrManagers = await prisma.user.findMany({
        where: {
          accountId: userContext.accountId,
          role: { in: ['HR_ADMIN', 'HR_MANAGER'] },
          isActive: true
        },
        select: { email: true, name: true },
        take: 3
      })

      console.log('[TAC Checkout] NOTIFY_HRBP:', {
        from: userEmail,
        to: hrManagers.map(h => h.email),
        gerenciaId,
        pattern,
        insightId: result.insightId
      })
    }

    // LEY 2: Response con micro-copy estrategico
    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('[TAC checkout] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET: Consultar gerencias flagged (para badge en Hub)
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'talent-actions:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const flaggedGerencias = await IntelligenceInsightService.getFlaggedGerencias(
      userContext.accountId
    )

    return NextResponse.json({
      success: true,
      data: {
        flaggedGerencias
      }
    })

  } catch (error: any) {
    console.error('[TAC checkout GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
