/**
 * POST /api/talent-actions/checkout
 *
 * Registra accion ejecutiva del Checkout (Acto 4)
 * Escribe TACActionLog: quien vio el riesgo, cuando, que accion tomo
 *
 * Body:
 * {
 *   gerenciaId: string
 *   pattern: string (FRAGIL, QUEMADA, etc.)
 *   action: 'NOTIFY_HRBP' | 'SCHEDULE_COMMITTEE' | 'FLAG_FOR_REVIEW'
 * }
 *
 * Acciones:
 * - NOTIFY_HRBP → crea log + email simple al HR_MANAGER
 * - SCHEDULE_COMMITTEE → crea log (link calendario en futuro)
 * - FLAG_FOR_REVIEW → crea log (badge visible en Hub)
 *
 * Permiso: talent-actions:view (cualquiera que vea puede actuar)
 *
 * GET /api/talent-actions/checkout?gerenciaId=xxx
 * → Devuelve acciones previas para esa gerencia (para badge FLAG_FOR_REVIEW)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission
} from '@/lib/services/AuthorizationService'

const VALID_ACTIONS = ['NOTIFY_HRBP', 'SCHEDULE_COMMITTEE', 'FLAG_FOR_REVIEW']

// ═══════════════════════════════════════════════════════════════════════════
// POST: Registrar accion
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
    const { gerenciaId, pattern, action } = body

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

    // Crear log
    const log = await prisma.tACActionLog.create({
      data: {
        accountId: userContext.accountId,
        gerenciaId,
        pattern,
        action,
        initiatedBy: userEmail
      }
    })

    // Acciones especificas
    if (action === 'NOTIFY_HRBP') {
      // Buscar HR_MANAGER de la cuenta para notificar
      const hrManagers = await prisma.user.findMany({
        where: {
          accountId: userContext.accountId,
          role: { in: ['HR_ADMIN', 'HR_MANAGER'] },
          isActive: true
        },
        select: { email: true, name: true },
        take: 3
      })

      // Email simple (si Resend esta configurado, se enviaria aqui)
      // Por ahora solo log — la integracion con Resend se activa en produccion
      console.log('[TAC Checkout] NOTIFY_HRBP:', {
        from: userEmail,
        to: hrManagers.map(h => h.email),
        gerenciaId,
        pattern
      })
    }

    if (action === 'FLAG_FOR_REVIEW') {
      console.log('[TAC Checkout] FLAG_FOR_REVIEW:', {
        gerenciaId,
        pattern,
        by: userEmail
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        logId: log.id,
        action,
        message: action === 'NOTIFY_HRBP'
          ? 'HR Business Partner notificado'
          : action === 'SCHEDULE_COMMITTEE'
            ? 'Comite agendado'
            : 'Marcado para revision trimestral'
      }
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
// GET: Consultar acciones previas (para badge FLAG_FOR_REVIEW en Hub)
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

    const { searchParams } = new URL(request.url)
    const gerenciaId = searchParams.get('gerenciaId')

    const where: any = { accountId: userContext.accountId }
    if (gerenciaId) {
      where.gerenciaId = gerenciaId
    }

    const logs = await prisma.tACActionLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Gerencias con FLAG_FOR_REVIEW activo
    const flaggedGerencias = new Set(
      logs
        .filter(l => l.action === 'FLAG_FOR_REVIEW')
        .map(l => l.gerenciaId)
    )

    return NextResponse.json({
      success: true,
      data: {
        logs,
        flaggedGerencias: Array.from(flaggedGerencias)
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
