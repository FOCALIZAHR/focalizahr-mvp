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
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission
} from '@/lib/services/AuthorizationService'
import { IntelligenceInsightService } from '@/lib/services/IntelligenceInsightService'
import { renderTACAlertEmail } from '@/lib/templates/tac-alert-template'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'FocalizaHR <noreply@focalizahr.cl>'

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

    // Verificar duplicado: misma gerencia + misma acción + no resuelta
    const existing = await prisma.intelligenceInsight.findFirst({
      where: {
        accountId: userContext.accountId,
        sourceModule: 'TAC',
        targetType: 'DEPARTMENT',
        targetId: gerenciaId,
        actionCode: action,
        status: { in: ['OPEN', 'ACKNOWLEDGED'] }
      },
      select: { id: true }
    })

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Esta acción ya fue ejecutada para esta gerencia',
        code: 'DUPLICATE_ACTION'
      }, { status: 409 })
    }

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

    // Acciones adicionales + contexto para UX
    let contextMessage = result.message
    let notifiedNames: string[] = []

    if (action === 'NOTIFY_HRBP') {
      const hrManagers = await prisma.user.findMany({
        where: {
          accountId: userContext.accountId,
          role: { in: ['HR_ADMIN', 'HR_MANAGER'] },
          isActive: true
        },
        select: { email: true, name: true, role: true },
        take: 3
      })

      notifiedNames = hrManagers.map(h => {
        const roleName = h.role === 'HR_ADMIN' ? 'HR Admin' : 'HR Manager'
        return `${h.name || h.email} (${roleName})`
      })

      const recipients = hrManagers.map(h => h.email).filter(Boolean)

      if (recipients.length > 0) {
        try {
          const companyName = request.headers.get('x-company-name') || 'Empresa'

          const { subject, html } = renderTACAlertEmail({
            company_name: companyName,
            department_name: gerenciaName || 'Gerencia',
            pattern,
            manager_name: userEmail,
            action_date: new Date().toLocaleDateString('es-CL', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            }),
            action_code: action
          })

          const { error: emailError } = await resend.emails.send({
            from: FROM_EMAIL,
            to: recipients,
            subject,
            html
          })

          if (emailError) {
            console.error('[TAC Checkout] NOTIFY_HRBP email error:', emailError)
          } else {
            console.log('[TAC Checkout] NOTIFY_HRBP email sent to:', recipients)
          }
        } catch (emailErr) {
          console.error('[TAC Checkout] Email send failed:', emailErr)
        }
      }

      contextMessage = notifiedNames.length > 0
        ? `Se alertó a ${notifiedNames.join(', ')}. FocalizaHR correlacionará esta intervención con la evolución del equipo.`
        : 'No se encontraron responsables de HR activos. El insight quedó registrado para seguimiento.'

    } else if (action === 'SCHEDULE_COMMITTEE') {
      contextMessage = 'Comité registrado con CEO, CHRO y Gerente titular. FocalizaHR vinculará esta decisión con los indicadores futuros.'

    } else if (action === 'FLAG_FOR_REVIEW') {
      contextMessage = `${gerenciaName || 'Gerencia'} marcada para seguimiento. FocalizaHR monitoreará su evolución en los próximos ciclos.`
    }

    // LEY 2: Response con micro-copy contextual
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        contextMessage,
        notifiedNames
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

    // Si viene ?gerenciaId=X, devolver acciones completadas para esa gerencia
    const gerenciaId = request.nextUrl.searchParams.get('gerenciaId')

    if (gerenciaId) {
      const completedInsights = await prisma.intelligenceInsight.findMany({
        where: {
          accountId: userContext.accountId,
          sourceModule: 'TAC',
          targetType: 'DEPARTMENT',
          targetId: gerenciaId,
          status: { in: ['OPEN', 'ACKNOWLEDGED'] }
        },
        select: { actionCode: true }
      })

      const completedActions = completedInsights.map(i => i.actionCode)

      return NextResponse.json({
        success: true,
        data: { completedActions }
      })
    }

    // Sin gerenciaId: devolver flagged (comportamiento original)
    const flaggedGerencias = await IntelligenceInsightService.getFlaggedGerencias(
      userContext.accountId
    )

    return NextResponse.json({
      success: true,
      data: { flaggedGerencias }
    })

  } catch (error: any) {
    console.error('[TAC checkout GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
