/**
 * POST /api/talent-actions/mass-action
 *
 * Acciones masivas sobre multiples empleados (Pilar 2 QuadrantBlock)
 * Crea N IntelligenceInsights (1 por persona) targetType = EMPLOYEE
 * Envía email al AREA_MANAGER de cada gerencia (agrupado por depto padre)
 *
 * Body:
 * {
 *   employeeIds: string[]
 *   quadrant: string
 *   actionCode: string
 * }
 *
 * Permiso: talent-actions:view (cualquiera que vea puede actuar)
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import {
  extractUserContext,
  hasPermission
} from '@/lib/services/AuthorizationService'
import { IntelligenceInsightService } from '@/lib/services/IntelligenceInsightService'
import { renderTACMassActionEmail } from '@/lib/templates/tac-alert-template'
import { formatDisplayName } from '@/lib/utils/formatName'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'FocalizaHR <noreply@focalizahr.cl>'

const VALID_ACTIONS = [
  'RETENTION_ROUND', 'WORKLOAD_REVIEW', 'DIRECT_EVALUATION', 'TEAM_RECOGNITION'
]

const ACTION_TO_QUADRANT: Record<string, string> = {
  RETENTION_ROUND: 'FUGA_CEREBROS',
  WORKLOAD_REVIEW: 'BURNOUT_RISK',
  DIRECT_EVALUATION: 'BAJO_RENDIMIENTO',
  TEAM_RECOGNITION: 'MOTOR_EQUIPO',
}

const MAX_EMPLOYEES = 100

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
    const { employeeIds, quadrant, actionCode } = body

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'employeeIds debe ser un array no vacio' },
        { status: 400 }
      )
    }

    if (employeeIds.length > MAX_EMPLOYEES) {
      return NextResponse.json(
        { success: false, error: `Maximo ${MAX_EMPLOYEES} personas por accion masiva` },
        { status: 400 }
      )
    }

    if (!quadrant || !actionCode) {
      return NextResponse.json(
        { success: false, error: 'quadrant y actionCode son requeridos' },
        { status: 400 }
      )
    }

    if (!VALID_ACTIONS.includes(actionCode)) {
      return NextResponse.json(
        { success: false, error: `Accion invalida. Use: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      )
    }

    const userId = request.headers.get('x-user-id') || request.headers.get('x-user-email') || 'unknown'
    const companyName = request.headers.get('x-company-name') || 'Empresa'

    // 1. Filtrar duplicados — no crear insights para empleados que ya tienen esta acción OPEN/ACKNOWLEDGED
    const existing = await prisma.intelligenceInsight.findMany({
      where: {
        accountId: userContext.accountId,
        sourceModule: 'TAC',
        targetType: 'EMPLOYEE',
        targetId: { in: employeeIds },
        actionCode,
        status: { in: ['OPEN', 'ACKNOWLEDGED'] }
      },
      select: { targetId: true }
    })
    const existingIds = new Set(existing.map(e => e.targetId))
    const newEmployeeIds = employeeIds.filter((id: string) => !existingIds.has(id))

    // Si todos son duplicados, retornar éxito sin crear nada
    if (newEmployeeIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          count: 0,
          contextMessage: 'Estas personas ya tienen esta acción registrada.'
        }
      })
    }

    // 2. Crear IntelligenceInsights solo para nuevos
    const result = await IntelligenceInsightService.createBulkFromTAC({
      accountId: userContext.accountId,
      employeeIds: newEmployeeIds,
      actionCode,
      quadrant,
      acknowledgedBy: userId
    })

    // 3. Enviar emails al gerente de cada área (usa employeeIds completo, no solo nuevos)
    const emailQuadrant = ACTION_TO_QUADRANT[actionCode] || quadrant
    const notifiedManagers: string[] = []

    try {
      // Obtener empleados con su depto (nivel 3) y depto padre (nivel 2 = gerencia)
      const employees = await prisma.employee.findMany({
        where: {
          id: { in: employeeIds },
          accountId: userContext.accountId
        },
        select: {
          id: true,
          fullName: true,
          position: true,
          departmentId: true,
          department: {
            select: {
              displayName: true,
              parentId: true,
              parent: { select: { id: true, displayName: true } }
            }
          }
        }
      })

      // Agrupar por gerencia padre (nivel 2)
      const byGerencia = new Map<string, {
        gerenciaId: string
        gerenciaName: string
        persons: { name: string; position: string }[]
      }>()

      for (const emp of employees) {
        const gerenciaId = emp.department?.parentId || emp.departmentId
        const gerenciaName = emp.department?.parent?.displayName || emp.department?.displayName || 'Área'

        if (!byGerencia.has(gerenciaId)) {
          byGerencia.set(gerenciaId, { gerenciaId, gerenciaName, persons: [] })
        }
        byGerencia.get(gerenciaId)!.persons.push({
          name: formatDisplayName(emp.fullName, 'full'),
          position: emp.position
            ?.replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (c: string) => c.toUpperCase())
            || 'Sin cargo'
        })
      }

      // Obtener nombre del CEO que ejecuta
      const ceoUser = await prisma.user.findFirst({
        where: {
          accountId: userContext.accountId,
          id: userId
        },
        select: { name: true, email: true }
      })
      const ceoName = ceoUser?.name || ceoUser?.email || 'Dirección'

      // Por cada gerencia: buscar AREA_MANAGER → fallback HR_ADMIN → fallback ACCOUNT_OWNER
      for (const [gerenciaId, group] of byGerencia) {
        // Intento 1: AREA_MANAGER asignado a la gerencia
        let recipient = await prisma.user.findFirst({
          where: {
            accountId: userContext.accountId,
            departmentId: gerenciaId,
            role: 'AREA_MANAGER',
            isActive: true
          },
          select: { email: true, name: true, role: true }
        })

        // Fallback: HR_ADMIN o ACCOUNT_OWNER (alguien que pueda actuar)
        if (!recipient?.email) {
          recipient = await prisma.user.findFirst({
            where: {
              accountId: userContext.accountId,
              role: { in: ['HR_ADMIN', 'ACCOUNT_OWNER'] },
              isActive: true
            },
            select: { email: true, name: true, role: true }
          })
        }

        if (!recipient?.email) {
          console.warn(`[TAC mass-action] No recipient for gerencia ${gerenciaId} (${group.gerenciaName})`)
          continue
        }

        // Construir lista HTML de personas
        const peopleListHtml = group.persons
          .map(p => `<p style="margin: 4px 0; font-size: 14px; color: #334155;">${p.name} — <span style="color: #64748B;">${p.position}</span></p>`)
          .join('')

        const { subject, html } = renderTACMassActionEmail(emailQuadrant, {
          ceo_name: ceoName,
          manager_name: recipient.name || 'Gerente',
          company_name: companyName,
          department_name: group.gerenciaName,
          people_count: group.persons.length,
          people_list: peopleListHtml
        })

        const { error: emailError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: [recipient.email],
          subject,
          html
        })

        if (emailError) {
          console.error(`[TAC mass-action] Email error for ${recipient.email}:`, emailError)
        } else {
          notifiedManagers.push(`${recipient.name || recipient.email} (${group.gerenciaName})`)
          console.log(`[TAC mass-action] Email sent to ${recipient.email} for ${group.gerenciaName}`)
        }
      }
    } catch (emailErr) {
      console.error('[TAC mass-action] Email flow failed:', emailErr)
    }

    // Respuesta con contexto para el modal
    const contextMessage = notifiedManagers.length > 0
      ? `Se notificó a ${notifiedManagers.join(', ')}. FocalizaHR medirá el impacto en el próximo ciclo.`
      : 'Acción registrada. FocalizaHR medirá el impacto en el próximo ciclo.'

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        contextMessage,
        notifiedManagers
      }
    })

  } catch (error: any) {
    console.error('[TAC mass-action] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
