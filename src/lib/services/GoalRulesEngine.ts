// src/lib/services/GoalRulesEngine.ts
import { prisma } from '@/lib/prisma'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface AffectedEmployee {
  id: string
  fullName: string
  standardJobLevel: string | null
  alreadyHasGoal: boolean
}

interface RulePreview {
  rule: {
    id: string
    name: string
    sourceGoal: { title: string }
  }
  affectedEmployees: AffectedEmployee[]
  toCreate: number
  toSkip: number
}

interface ExecutionResult {
  success: boolean
  created: number
  skipped: number
  errors: string[]
}

// ════════════════════════════════════════════════════════════════════════════
// ENGINE
// ════════════════════════════════════════════════════════════════════════════

export class GoalRulesEngine {
  /**
   * Obtiene los standardJobLevel elegibles según la regla
   */
  private static async getEligibleJobLevels(
    accountId: string,
    targetGroupId: string | null
  ): Promise<string[]> {
    const where: Record<string, unknown> = {
      accountId,
      hasGoals: true,
    }
    if (targetGroupId) {
      where.goalGroupId = targetGroupId
    }

    const configs = await prisma.goalJobConfig.findMany({
      where,
      select: { standardJobLevel: true },
    })

    return configs.map((c) => c.standardJobLevel)
  }

  /**
   * Preview: muestra qué empleados serían afectados sin crear nada
   */
  static async previewRuleImpact(ruleId: string, accountId: string): Promise<RulePreview> {
    const rule = await prisma.goalCascadeRule.findFirst({
      where: { id: ruleId, accountId },
      include: {
        sourceGoal: { select: { id: true, title: true, targetValue: true } },
        targetGroup: { select: { id: true, name: true } },
      },
    })

    if (!rule) throw new Error('Regla no encontrada')

    // Obtener niveles de cargo elegibles
    const eligibleLevels = await this.getEligibleJobLevels(accountId, rule.targetGroupId)

    if (eligibleLevels.length === 0) {
      return {
        rule: { id: rule.id, name: rule.name, sourceGoal: { title: rule.sourceGoal.title } },
        affectedEmployees: [],
        toCreate: 0,
        toSkip: 0,
      }
    }

    // Buscar empleados con esos niveles
    const employeeWhere: Record<string, unknown> = {
      accountId,
      status: 'ACTIVE',
      standardJobLevel: { in: eligibleLevels },
    }

    // Si isLeaderOnly, filtrar solo quienes tienen subordinados
    if (rule.isLeaderOnly) {
      employeeWhere.directReports = { some: {} }
    }

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        fullName: true,
        standardJobLevel: true,
        goals: {
          where: { parentId: rule.sourceGoalId, status: { not: 'CANCELLED' } },
          select: { id: true },
        },
      },
    })

    const affectedEmployees: AffectedEmployee[] = employees.map((e) => ({
      id: e.id,
      fullName: e.fullName,
      standardJobLevel: e.standardJobLevel,
      alreadyHasGoal: e.goals.length > 0,
    }))

    return {
      rule: { id: rule.id, name: rule.name, sourceGoal: { title: rule.sourceGoal.title } },
      affectedEmployees,
      toCreate: affectedEmployees.filter((e) => !e.alreadyHasGoal).length,
      toSkip: affectedEmployees.filter((e) => e.alreadyHasGoal).length,
    }
  }

  /**
   * Ejecutar regla: crea metas individuales para empleados elegibles
   */
  static async applyCascadeRule(
    ruleId: string,
    accountId: string,
    executedBy: string
  ): Promise<ExecutionResult> {
    const preview = await this.previewRuleImpact(ruleId, accountId)
    const rule = await prisma.goalCascadeRule.findFirst({
      where: { id: ruleId, accountId },
      include: { sourceGoal: true },
    })

    if (!rule) throw new Error('Regla no encontrada')

    const errors: string[] = []
    let created = 0

    const toCreate = preview.affectedEmployees.filter((e) => !e.alreadyHasGoal)

    for (const employee of toCreate) {
      try {
        await prisma.goal.create({
          data: {
            accountId,
            employeeId: employee.id,
            title: rule.sourceGoal.title,
            description: `Cascadeada desde: ${rule.sourceGoal.title}`,
            level: 'INDIVIDUAL',
            originType: 'STRATEGIC_CASCADE',
            type: rule.sourceGoal.type,
            metricType: rule.sourceGoal.metricType,
            startValue: rule.sourceGoal.startValue,
            currentValue: rule.sourceGoal.startValue,
            targetValue: rule.sourceGoal.targetValue,
            unit: rule.sourceGoal.unit,
            startDate: rule.sourceGoal.startDate,
            dueDate: rule.sourceGoal.dueDate,
            periodYear: rule.sourceGoal.periodYear,
            periodQuarter: rule.sourceGoal.periodQuarter,
            weight: rule.assignedWeight,
            status: 'NOT_STARTED',
            parentId: rule.sourceGoalId,
            createdById: executedBy,
            isAligned: true,
            isOrphan: false,
          },
        })
        created++
      } catch (err) {
        errors.push(`Error creando meta para ${employee.fullName}: ${err}`)
      }
    }

    const skipped = preview.affectedEmployees.filter((e) => e.alreadyHasGoal).length

    // Actualizar regla
    await prisma.goalCascadeRule.update({
      where: { id: ruleId },
      data: {
        lastExecutedAt: new Date(),
        lastExecutedBy: executedBy,
        executionCount: { increment: 1 },
      },
    })

    return { success: errors.length === 0, created, skipped, errors }
  }

  /**
   * Ejecutar todas las reglas activas
   */
  static async executeAllRules(
    accountId: string,
    executedBy: string
  ): Promise<{ total: number; results: ExecutionResult[] }> {
    const rules = await prisma.goalCascadeRule.findMany({
      where: { accountId, isActive: true },
    })

    const results: ExecutionResult[] = []
    for (const rule of rules) {
      const result = await this.applyCascadeRule(rule.id, accountId, executedBy)
      results.push(result)
    }

    return { total: rules.length, results }
  }
}
