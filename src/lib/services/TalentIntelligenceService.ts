// ════════════════════════════════════════════════════════════════════════════
// TALENT INTELLIGENCE SERVICE
// src/lib/services/TalentIntelligenceService.ts
// ════════════════════════════════════════════════════════════════════════════
// Servicio de inteligencia de talento: Matrices de Movilidad y Riesgo
// Cruza Role Fit Score con factores AAE (Aspiration, Engagement)
// Metodología: Test Ácido (solo niveles extremos 1 y 3 generan clasificación)
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import {
  TALENT_INTELLIGENCE_THRESHOLDS,
  MobilityQuadrant,
  RiskQuadrant,
  RiskAlertLevel,
  MOBILITY_QUADRANT_CONFIG,
  RISK_QUADRANT_CONFIG,
  type MobilityQuadrantConfig,
  type RiskQuadrantConfig
} from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface TalentIntelligenceInput {
  roleFitScore: number | null      // 0-100 (desde RoleFitAnalyzer)
  aspiration: 1 | 2 | 3 | null     // Factor AAE
  engagement: 1 | 2 | 3 | null     // Factor AAE
}

export interface MobilityResult {
  quadrant: MobilityQuadrant | null
  config: MobilityQuadrantConfig | null
  reason: string
}

export interface RiskResult {
  quadrant: RiskQuadrant | null
  alertLevel: RiskAlertLevel | null
  config: RiskQuadrantConfig | null
  reason: string
}

export interface TalentIntelligenceResult {
  // Inputs procesados
  inputs: {
    roleFitScore: number | null
    roleFitLevel: 'HIGH' | 'LOW' | null
    aspiration: 1 | 2 | 3 | null
    aspirationLevel: 'HIGH' | 'LOW' | 'NEUTRAL' | null
    engagement: 1 | 2 | 3 | null
    engagementLevel: 'HIGH' | 'LOW' | 'NEUTRAL' | null
  }

  // Resultados de matrices
  mobility: MobilityResult
  risk: RiskResult

  // Metadata
  dataCompleteness: 'FULL' | 'PARTIAL_ROLE_FIT' | 'PARTIAL_AAE' | 'INSUFFICIENT'
  canClassify: boolean
  analyzedAt: Date
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS ALERTAS
// ════════════════════════════════════════════════════════════════════════════

export interface ActiveAlert {
  id: string
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  riskQuadrant: RiskQuadrant
  alertLevel: 'RED' | 'ORANGE'
  message: string
  recommendation: string
  slaHours: number
  createdAt: Date
}

export interface AlertsSummary {
  total: number
  critical: number
  high: number
  byType: Record<RiskQuadrant, number>
  alerts: ActiveAlert[]
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class TalentIntelligenceService {

  private static readonly T = TALENT_INTELLIGENCE_THRESHOLDS

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTODO PRINCIPAL: Analizar empleado
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Calcula matrices de movilidad y riesgo para un empleado
   * Lógica pura sin side effects (no accede a DB)
   */
  static analyze(input: TalentIntelligenceInput): TalentIntelligenceResult {
    const { roleFitScore, aspiration, engagement } = input

    // 1. Clasificar inputs
    const roleFitLevel = this.classifyRoleFit(roleFitScore)
    const aspirationLevel = this.classifyAAEFactor(aspiration)
    const engagementLevel = this.classifyAAEFactor(engagement)

    // 2. Determinar completitud de datos
    const dataCompleteness = this.assessDataCompleteness(roleFitScore, aspiration, engagement)

    // 3. Calcular matrices (solo si hay datos suficientes)
    const mobility = this.calculateMobilityQuadrant(roleFitLevel, aspirationLevel)
    const risk = this.calculateRiskQuadrant(roleFitLevel, engagementLevel)

    // 4. Determinar si se puede clasificar
    const canClassify = mobility.quadrant !== null || risk.quadrant !== null

    return {
      inputs: {
        roleFitScore,
        roleFitLevel,
        aspiration,
        aspirationLevel,
        engagement,
        engagementLevel
      },
      mobility,
      risk,
      dataCompleteness,
      canClassify,
      analyzedAt: new Date()
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CLASIFICADORES DE INPUT
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Clasifica Role Fit Score en HIGH/LOW
   * Threshold: 70% (industria: "70% Rule")
   */
  private static classifyRoleFit(score: number | null): 'HIGH' | 'LOW' | null {
    if (score === null || score === undefined) return null
    return score >= this.T.ROLE_FIT_HIGH ? 'HIGH' : 'LOW'
  }

  /**
   * Clasifica factor AAE en HIGH/LOW/NEUTRAL
   * Test Ácido: solo niveles 1 y 3 generan clasificación
   * Nivel 2 = NEUTRAL (no genera acción, evita tendencia central)
   */
  private static classifyAAEFactor(value: 1 | 2 | 3 | null): 'HIGH' | 'LOW' | 'NEUTRAL' | null {
    if (value === null || value === undefined) return null
    if (value === 3) return 'HIGH'
    if (value === 1) return 'LOW'
    return 'NEUTRAL'  // value === 2
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CÁLCULO DE MATRICES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Matriz de MOVILIDAD: Role Fit × Aspiración
   * Solo clasifica si aspiración es HIGH o LOW (test ácido)
   */
  private static calculateMobilityQuadrant(
    roleFit: 'HIGH' | 'LOW' | null,
    aspiration: 'HIGH' | 'LOW' | 'NEUTRAL' | null
  ): MobilityResult {
    // Sin datos suficientes
    if (roleFit === null) {
      return { quadrant: null, config: null, reason: 'Role Fit no disponible' }
    }
    if (aspiration === null) {
      return { quadrant: null, config: null, reason: 'Aspiración no evaluada' }
    }
    // Test ácido: nivel 2 no clasifica
    if (aspiration === 'NEUTRAL') {
      return { quadrant: null, config: null, reason: 'Aspiración nivel 2: sin clasificación (test ácido)' }
    }

    // Matriz 2×2
    let quadrant: MobilityQuadrant

    if (roleFit === 'HIGH' && aspiration === 'HIGH') {
      quadrant = MobilityQuadrant.SUCESOR_NATURAL
    } else if (roleFit === 'HIGH' && aspiration === 'LOW') {
      quadrant = MobilityQuadrant.EXPERTO_ANCLA
    } else if (roleFit === 'LOW' && aspiration === 'HIGH') {
      quadrant = MobilityQuadrant.AMBICIOSO_PREMATURO
    } else {
      quadrant = MobilityQuadrant.EN_DESARROLLO
    }

    return {
      quadrant,
      config: MOBILITY_QUADRANT_CONFIG[quadrant],
      reason: `Role Fit ${roleFit} + Aspiración ${aspiration}`
    }
  }

  /**
   * Matriz de RIESGO: Role Fit × Engagement
   * Solo clasifica si engagement es HIGH o LOW (test ácido)
   */
  private static calculateRiskQuadrant(
    roleFit: 'HIGH' | 'LOW' | null,
    engagement: 'HIGH' | 'LOW' | 'NEUTRAL' | null
  ): RiskResult {
    // Sin datos suficientes
    if (roleFit === null) {
      return { quadrant: null, alertLevel: null, config: null, reason: 'Role Fit no disponible' }
    }
    if (engagement === null) {
      return { quadrant: null, alertLevel: null, config: null, reason: 'Engagement no evaluado' }
    }
    // Test ácido: nivel 2 no clasifica
    if (engagement === 'NEUTRAL') {
      return { quadrant: null, alertLevel: null, config: null, reason: 'Engagement nivel 2: sin clasificación (test ácido)' }
    }

    // Matriz 2×2
    let quadrant: RiskQuadrant

    if (roleFit === 'HIGH' && engagement === 'HIGH') {
      quadrant = RiskQuadrant.MOTOR_EQUIPO
    } else if (roleFit === 'HIGH' && engagement === 'LOW') {
      quadrant = RiskQuadrant.FUGA_CEREBROS
    } else if (roleFit === 'LOW' && engagement === 'HIGH') {
      quadrant = RiskQuadrant.BURNOUT_RISK
    } else {
      quadrant = RiskQuadrant.BAJO_RENDIMIENTO
    }

    const config = RISK_QUADRANT_CONFIG[quadrant]

    return {
      quadrant,
      alertLevel: config.alertLevel,
      config,
      reason: `Role Fit ${roleFit} + Engagement ${engagement}`
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Evalúa completitud de datos para análisis
   */
  private static assessDataCompleteness(
    roleFitScore: number | null,
    aspiration: number | null,
    engagement: number | null
  ): 'FULL' | 'PARTIAL_ROLE_FIT' | 'PARTIAL_AAE' | 'INSUFFICIENT' {
    const hasRoleFit = roleFitScore !== null
    const hasAAE = aspiration !== null && engagement !== null

    if (hasRoleFit && hasAAE) return 'FULL'
    if (hasRoleFit && !hasAAE) return 'PARTIAL_ROLE_FIT'
    if (!hasRoleFit && hasAAE) return 'PARTIAL_AAE'
    return 'INSUFFICIENT'
  }

  /**
   * Verifica si un cuadrante de riesgo requiere alerta crítica
   */
  static isCriticalAlert(quadrant: RiskQuadrant | null): boolean {
    if (!quadrant) return false
    const config = RISK_QUADRANT_CONFIG[quadrant]
    return config.alertLevel === RiskAlertLevel.RED || config.alertLevel === RiskAlertLevel.ORANGE
  }

  /**
   * Obtiene empleados que requieren atención inmediata
   * Utility para filtrar en reportes
   */
  static filterCriticalQuadrants(quadrant: RiskQuadrant | null): boolean {
    return quadrant === RiskQuadrant.FUGA_CEREBROS || quadrant === RiskQuadrant.BAJO_RENDIMIENTO
  }

  /**
   * Obtiene empleados listos para sucesión
   * Utility para filtrar en reportes
   */
  static filterSuccessionReady(quadrant: MobilityQuadrant | null): boolean {
    return quadrant === MobilityQuadrant.SUCESOR_NATURAL
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ALERTAS ACTIVAS
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene alertas activas de talento para un ciclo
   * Solo riskAlertLevel RED (crítico) y ORANGE (alto)
   */
  static async getActiveAlerts(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ): Promise<AlertsSummary> {

    const where: any = {
      cycleId,
      accountId,
      riskAlertLevel: { in: ['RED', 'ORANGE'] }
    }

    if (departmentIds?.length) {
      where.employee = { departmentId: { in: departmentIds } }
    }

    const ratings = await prisma.performanceRating.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: { select: { displayName: true } }
          }
        }
      },
      orderBy: [
        { riskAlertLevel: 'asc' },  // RED primero (alphabetically before ORANGE)
        { updatedAt: 'desc' }
      ]
    })

    const alerts: ActiveAlert[] = ratings.map(r => {
      const config = RISK_QUADRANT_CONFIG[r.riskQuadrant as RiskQuadrant]
      return {
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employee.fullName,
        position: r.employee.position || 'Sin cargo',
        departmentName: r.employee.department?.displayName || 'Sin departamento',
        riskQuadrant: (r.riskQuadrant as RiskQuadrant) || RiskQuadrant.BAJO_RENDIMIENTO,
        alertLevel: r.riskAlertLevel as 'RED' | 'ORANGE',
        message: config?.label || 'Alerta de talento',
        recommendation: config?.recommendedActions?.[0] || 'Revisar situación',
        slaHours: r.riskAlertLevel === 'RED' ? 48 : 72,
        createdAt: r.updatedAt
      }
    })

    // Contar por tipo
    const byType: Record<string, number> = {}
    alerts.forEach(a => {
      byType[a.riskQuadrant] = (byType[a.riskQuadrant] || 0) + 1
    })

    return {
      total: alerts.length,
      critical: alerts.filter(a => a.alertLevel === 'RED').length,
      high: alerts.filter(a => a.alertLevel === 'ORANGE').length,
      byType: byType as Record<RiskQuadrant, number>,
      alerts
    }
  }
}

export default TalentIntelligenceService
