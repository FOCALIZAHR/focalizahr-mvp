// ════════════════════════════════════════════════════════════════════════════
// src/lib/services/SalaryConfigService.ts
// FOCALIZAHR - Servicio Configuración Salarial
// Jerarquía de fallback: empresa_nivel → empresa_promedio → default_chile
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import {
  CHILE_SALARY_DEFAULTS,
  CHILE_HEADCOUNT_DISTRIBUTION,
  METHODOLOGY_CONSTANTS,
  SALARY_CONFIG_METADATA,
  type SalaryCategory,
  type SalaryByJobLevel,
  type HeadcountDistribution,
  isValidSalaryCategory
} from '@/config/SalaryConfig'

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════════════════

export interface SalaryResult {
  monthlySalary: number
  annualSalary: number
  source: 'empresa_nivel' | 'empresa_promedio' | 'default_chile'
  salaryCategory?: SalaryCategory
  confidence: 'high' | 'medium' | 'low'
  metadata: {
    accountId: string
    industry?: string
    configuredByClient: boolean
  }
}

export interface TurnoverCostResult {
  annualSalary: number
  turnoverCost: number
  multiplier: number
  methodology: string
}

export interface AccountSalaryConfig {
  hasCustomConfig: boolean
  averageMonthlySalary: number | null
  salaryByJobLevel: SalaryByJobLevel | null
  headcountDistribution: HeadcountDistribution | null
  turnoverBaselineRate: number | null
  headcount: number | null
  newHiresPerYear: number | null
  effectiveSalary: number
  source: string
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICIO PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export class SalaryConfigService {

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTODO PRINCIPAL: Obtiene salario con jerarquía de fallback
  // ══════════════════════════════════════════════════════════════════════════

  static async getSalaryForAccount(
    accountId: string,
    acotadoGroup?: string | null
  ): Promise<SalaryResult> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        industry: true,
        averageMonthlySalary: true,
        salaryByJobLevel: true,
        headcountDistribution: true
      }
    })

    if (!account) {
      return this.getDefaultSalary(acotadoGroup, null, accountId)
    }

    // NIVEL 1a: Sueldos por nivel + acotadoGroup específico
    if (account.salaryByJobLevel && isValidSalaryCategory(acotadoGroup)) {
      const salaryConfig = account.salaryByJobLevel as unknown as SalaryByJobLevel
      const levelSalary = salaryConfig[acotadoGroup as keyof SalaryByJobLevel]

      if (levelSalary && levelSalary > 0) {
        return {
          monthlySalary: levelSalary,
          annualSalary: levelSalary * 12,
          source: 'empresa_nivel',
          salaryCategory: acotadoGroup,
          confidence: 'high',
          metadata: {
            accountId: account.id,
            industry: account.industry || undefined,
            configuredByClient: true
          }
        }
      }
    }

    // NIVEL 1b: Sueldos por nivel sin acotadoGroup → promedio ponderado
    if (account.salaryByJobLevel && !isValidSalaryCategory(acotadoGroup)) {
      const salaryConfig = account.salaryByJobLevel as unknown as SalaryByJobLevel
      const dist = (account.headcountDistribution as unknown as HeadcountDistribution)
                   || CHILE_HEADCOUNT_DISTRIBUTION

      const weightedAvg = Math.round(
        (salaryConfig.alta_gerencia * dist.alta_gerencia) +
        (salaryConfig.mandos_medios * dist.mandos_medios) +
        (salaryConfig.profesionales * dist.profesionales) +
        (salaryConfig.base_operativa * dist.base_operativa)
      )

      if (weightedAvg > 0) {
        return {
          monthlySalary: weightedAvg,
          annualSalary: weightedAvg * 12,
          source: 'empresa_nivel',
          confidence: 'high',
          metadata: {
            accountId: account.id,
            industry: account.industry || undefined,
            configuredByClient: true
          }
        }
      }
    }

    // NIVEL 2: Promedio general empresa
    if (account.averageMonthlySalary && account.averageMonthlySalary > 0) {
      return {
        monthlySalary: account.averageMonthlySalary,
        annualSalary: account.averageMonthlySalary * 12,
        source: 'empresa_promedio',
        salaryCategory: isValidSalaryCategory(acotadoGroup) ? acotadoGroup : undefined,
        confidence: 'medium',
        metadata: {
          accountId: account.id,
          industry: account.industry || undefined,
          configuredByClient: true
        }
      }
    }

    // NIVEL 3: Defaults FocalizaHR
    return this.getDefaultSalary(acotadoGroup, account.industry, accountId)
  }

  private static getDefaultSalary(
    acotadoGroup?: string | null,
    industry?: string | null,
    accountId: string = 'default'
  ): SalaryResult {
    if (isValidSalaryCategory(acotadoGroup)) {
      const salary = CHILE_SALARY_DEFAULTS[acotadoGroup as keyof typeof CHILE_SALARY_DEFAULTS]
      return {
        monthlySalary: salary,
        annualSalary: salary * 12,
        source: 'default_chile',
        salaryCategory: acotadoGroup,
        confidence: 'low',
        metadata: {
          accountId,
          industry: industry || undefined,
          configuredByClient: false
        }
      }
    }

    return {
      monthlySalary: CHILE_SALARY_DEFAULTS.promedio_general,
      annualSalary: CHILE_SALARY_DEFAULTS.promedio_general * 12,
      source: 'default_chile',
      confidence: 'low',
      metadata: {
        accountId,
        industry: industry || undefined,
        configuredByClient: false
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CÁLCULO COSTO ROTACIÓN
  // ══════════════════════════════════════════════════════════════════════════

  static calculateTurnoverCost(
    monthlySalary: number,
    acotadoGroup?: SalaryCategory
  ): TurnoverCostResult {
    const annualSalary = monthlySalary * 12
    const multiplier = acotadoGroup
      ? METHODOLOGY_CONSTANTS.TURNOVER_COST_MULTIPLIER[acotadoGroup]
      : 1.25
    const turnoverCost = annualSalary * multiplier

    return {
      annualSalary,
      turnoverCost,
      multiplier,
      methodology: `Costo rotacion = Salario Anual x ${(multiplier * 100).toFixed(0)}% (SHRM 2024)`
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GESTIÓN CONFIGURACIÓN CUENTA
  // ══════════════════════════════════════════════════════════════════════════

  static async getAccountSalaryConfig(accountId: string): Promise<AccountSalaryConfig> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: {
        averageMonthlySalary: true,
        salaryByJobLevel: true,
        headcountDistribution: true,
        turnoverBaselineRate: true,
        headcount: true,
        newHiresPerYear: true,
        industry: true
      }
    })

    if (!account) {
      return {
        hasCustomConfig: false,
        averageMonthlySalary: null,
        salaryByJobLevel: null,
        headcountDistribution: null,
        turnoverBaselineRate: null,
        headcount: null,
        newHiresPerYear: null,
        effectiveSalary: CHILE_SALARY_DEFAULTS.promedio_general,
        source: 'Default Chile'
      }
    }

    const hasCustomConfig = !!(account.averageMonthlySalary || account.salaryByJobLevel)

    let effectiveSalary = CHILE_SALARY_DEFAULTS.promedio_general
    let source = 'Default Chile'

    if (account.salaryByJobLevel) {
      const config = account.salaryByJobLevel as unknown as SalaryByJobLevel
      const dist = (account.headcountDistribution as unknown as HeadcountDistribution)
                   || CHILE_HEADCOUNT_DISTRIBUTION

      effectiveSalary = Math.round(
        (config.alta_gerencia * dist.alta_gerencia) +
        (config.mandos_medios * dist.mandos_medios) +
        (config.profesionales * dist.profesionales) +
        (config.base_operativa * dist.base_operativa)
      )
      source = 'Configuracion por nivel'
    } else if (account.averageMonthlySalary) {
      effectiveSalary = account.averageMonthlySalary
      source = 'Promedio empresa'
    }

    return {
      hasCustomConfig,
      averageMonthlySalary: account.averageMonthlySalary,
      salaryByJobLevel: account.salaryByJobLevel as SalaryByJobLevel | null,
      headcountDistribution: account.headcountDistribution as HeadcountDistribution | null,
      turnoverBaselineRate: account.turnoverBaselineRate,
      headcount: account.headcount,
      newHiresPerYear: account.newHiresPerYear,
      effectiveSalary,
      source
    }
  }

  static async updateAccountSalaryConfig(
    accountId: string,
    config: {
      averageMonthlySalary?: number | null
      salaryByJobLevel?: SalaryByJobLevel | null
      headcountDistribution?: HeadcountDistribution | null
      turnoverBaselineRate?: number | null
      headcount?: number | null
      newHiresPerYear?: number | null
    }
  ): Promise<void> {
    await prisma.account.update({
      where: { id: accountId },
      data: {
        averageMonthlySalary: config.averageMonthlySalary,
        salaryByJobLevel: config.salaryByJobLevel as any,
        headcountDistribution: config.headcountDistribution as any,
        turnoverBaselineRate: config.turnoverBaselineRate,
        headcount: config.headcount,
        newHiresPerYear: config.newHiresPerYear
      }
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UTILIDADES
  // ══════════════════════════════════════════════════════════════════════════

  static getConfigMetadata() {
    return SALARY_CONFIG_METADATA
  }

  static getChileDefaults() {
    return CHILE_SALARY_DEFAULTS
  }

  static getChileDistribution() {
    return CHILE_HEADCOUNT_DISTRIBUTION
  }

  static getMethodologyConstants() {
    return METHODOLOGY_CONSTANTS
  }
}
