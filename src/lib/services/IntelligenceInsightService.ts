// ═══════════════════════════════════════════════════════════════════════════
// src/lib/services/IntelligenceInsightService.ts
// INTELLIGENCE INSIGHT — Auditor de Intervenciones FocalizaHR
//
// Filosofia: Detecto → Te aviso → Tu decides → Yo mido → Te muestro ROI
// NO SOY: Task manager, recordatorios, % avance, responsables, subtareas
//
// v1.0 Scope: Solo TAC (Talent Action Center)
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { getChildDepartmentIds } from './AuthorizationService'
import { SuccessionService } from './SuccessionService'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateFromTACParams {
  accountId: string
  departmentId: string
  departmentName: string
  actionCode: string       // NOTIFY_HRBP | SCHEDULE_COMMITTEE | FLAG_FOR_REVIEW
  actionTaken: string      // Descripcion legible de la accion
  acknowledgedBy: string   // userId o email del CEO/HR
  pattern: string          // FRAGIL | QUEMADA | etc.
}

export interface TACInsightResult {
  insightId: string
  status: string
  actionTitle: string
  message: string
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const ACTION_TITLES: Record<string, string> = {
  'NOTIFY_HRBP': 'Notificacion a HR Business Partner enviada',
  'SCHEDULE_COMMITTEE': 'Comite de Riesgo programado',
  'FLAG_FOR_REVIEW': 'Gerencia marcada para revision trimestral',
  // Extensibles v1.1+
  'COMITE_RIESGO': 'Comite de Riesgo programado',
  'INTERVENCION_LIDERAZGO': 'Intervencion de Liderazgo activada',
  'PULSO_FOCALIZADO': 'Pulso Express Focalizado solicitado',
  'PLAN_RETENCION': 'Plan de Retencion Grupal iniciado',
}

// Micro-copy Manifiesto UX LEY 2: valor futuro, no confirmacion vacia
const TAC_MESSAGE = 'FocalizaHR evaluara el impacto de esta intervencion en el proximo ciclo de evaluacion. No tienes que hacer nada mas.'

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export class IntelligenceInsightService {

  // ═════════════════════════════════════════════════════════════════════════
  // createFromTAC: Crear insight cuando CEO/HR toma accion en checkout
  // TAC v1.0: targetType = DEPARTMENT siempre
  // Estado: Directamente ACKNOWLEDGED (CEO ya esta actuando)
  // ═════════════════════════════════════════════════════════════════════════

  static async createFromTAC(params: CreateFromTACParams): Promise<TACInsightResult> {
    const {
      accountId, departmentId, departmentName,
      actionCode, actionTaken, acknowledgedBy, pattern
    } = params

    // FLAG_FOR_REVIEW es reactivo/manual (bookmark), no predictivo
    const isFlag = actionCode === 'FLAG_FOR_REVIEW'
    const category = isFlag ? 'REACTIVE' : 'PREDICTIVE'
    const resolutionMode = isFlag ? 'MANUAL' : 'AUTO'

    // Baseline para auto-resolve (solo PREDICTIVE)
    let baselineValue: number | null = null
    let cycleId: string | null = null

    if (!isFlag) {
      cycleId = await SuccessionService.getCurrentCycleId(accountId)
      if (cycleId) {
        const baseline = await this.getDepartmentBaseline(accountId, departmentId, cycleId)
        baselineValue = baseline.riskScore
      }
    }

    const actionTitle = ACTION_TITLES[actionCode] || 'Accion Ejecutiva registrada'

    const insight = await prisma.intelligenceInsight.create({
      data: {
        accountId,

        // Clasificacion
        category,
        resolutionMode,

        // Origen
        sourceModule: 'TAC',
        sourceEntityId: cycleId,
        sourceType: 'RISK_QUADRANT',

        // Target
        targetType: 'DEPARTMENT',
        targetId: departmentId,

        // Recomendacion
        actionCode,
        title: `${actionTitle} - ${departmentName}`,
        description: `Patron detectado: ${pattern}`,

        // Estado: Directamente ACKNOWLEDGED (CEO ya esta actuando)
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy,
        actionTaken,

        // Metricas para auto-resolve (solo PREDICTIVE)
        metricCode: isFlag ? null : 'DEPARTMENT_RISK_STATUS',
        baselineValue,

        // Proxima evaluacion: se recalculará al cierre del próximo PerformanceCycle
        // Por ahora 180 días como placeholder — el CRON usará el ciclo real
        nextEvaluationAt: isFlag ? null : addDays(new Date(), 180)
      }
    })

    return {
      insightId: insight.id,
      status: insight.status,
      actionTitle,
      message: TAC_MESSAGE
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // createBulkFromTAC: Acciones masivas sobre multiples empleados (Pilar 2)
  // targetType = EMPLOYEE (diferente de createFromTAC que es DEPARTMENT)
  // ═════════════════════════════════════════════════════════════════════════

  static async createBulkFromTAC(params: {
    accountId: string
    employeeIds: string[]
    actionCode: string
    quadrant: string
    acknowledgedBy: string
  }): Promise<{ count: number; message: string }> {
    const { accountId, employeeIds, actionCode, quadrant, acknowledgedBy } = params

    if (employeeIds.length === 0) {
      return { count: 0, message: 'Sin personas seleccionadas' }
    }

    const actionTitle = ACTION_TITLES[actionCode] || 'Accion Ejecutiva registrada'
    const now = new Date()

    await prisma.intelligenceInsight.createMany({
      data: employeeIds.map(employeeId => ({
        accountId,
        category: 'PREDICTIVE',
        resolutionMode: 'AUTO',
        sourceModule: 'TAC',
        sourceType: 'RISK_QUADRANT',
        targetType: 'EMPLOYEE',
        targetId: employeeId,
        actionCode,
        title: `${actionTitle} - ${quadrant}`,
        description: `Accion masiva sobre cuadrante ${quadrant}`,
        status: 'ACKNOWLEDGED',
        acknowledgedAt: now,
        acknowledgedBy,
        actionTaken: actionCode,
        metricCode: 'EMPLOYEE_RISK_STATUS',
        nextEvaluationAt: addDays(now, 180)
      }))
    })

    return {
      count: employeeIds.length,
      message: TAC_MESSAGE
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // getFlaggedGerencias: Gerencias con FLAG_FOR_REVIEW activo
  // Reemplaza la query directa a TACActionLog
  // ═════════════════════════════════════════════════════════════════════════

  static async getFlaggedGerencias(accountId: string): Promise<string[]> {
    const flagged = await prisma.intelligenceInsight.findMany({
      where: {
        accountId,
        sourceModule: 'TAC',
        actionCode: 'FLAG_FOR_REVIEW',
        status: { in: ['OPEN', 'ACKNOWLEDGED'] } // No resueltos
      },
      select: { targetId: true },
      distinct: ['targetId']
    })

    return flagged.map(f => f.targetId)
  }

  // ═════════════════════════════════════════════════════════════════════════
  // getDepartmentBaseline: % de personas en riesgo (RED/ORANGE)
  // Usa jerarquia completa (gerencia + hijos) para consistencia con org-map
  // ═════════════════════════════════════════════════════════════════════════

  private static async getDepartmentBaseline(
    accountId: string,
    departmentId: string,
    cycleId: string
  ): Promise<{ riskScore: number }> {
    const childIds = await getChildDepartmentIds(departmentId)
    const allDeptIds = [departmentId, ...childIds]

    const [riskCount, totalCount] = await Promise.all([
      prisma.performanceRating.count({
        where: {
          accountId,
          cycleId,
          riskAlertLevel: { in: ['RED', 'ORANGE'] },
          employee: {
            isActive: true,
            status: 'ACTIVE',
            departmentId: { in: allDeptIds }
          }
        }
      }),
      prisma.performanceRating.count({
        where: {
          accountId,
          cycleId,
          employee: {
            isActive: true,
            status: 'ACTIVE',
            departmentId: { in: allDeptIds }
          }
        }
      })
    ])

    const riskScore = totalCount > 0
      ? Math.round((riskCount / totalCount) * 100)
      : 0

    return { riskScore }
  }
}
