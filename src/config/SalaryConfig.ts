// ════════════════════════════════════════════════════════════════════════════
// src/config/SalaryConfig.ts
// FOCALIZAHR - Configuración Salarial por País
// Integrado con PositionAdapter.ACOTADO_CONFIG
// ════════════════════════════════════════════════════════════════════════════

import { PositionAdapter } from '@/lib/services/PositionAdapter'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS - Derivados de ACOTADO_CONFIG existente
// ════════════════════════════════════════════════════════════════════════════

export type SalaryCategory = keyof typeof PositionAdapter.ACOTADO_CONFIG
// Resultado: 'alta_gerencia' | 'mandos_medios' | 'profesionales' | 'base_operativa'

export interface SalaryByJobLevel {
  alta_gerencia: number
  mandos_medios: number
  profesionales: number
  base_operativa: number
}

export interface HeadcountDistribution {
  alta_gerencia: number   // 0.0 - 1.0
  mandos_medios: number
  profesionales: number
  base_operativa: number
  // Suma debe ser 1.0 (100%)
}

// ════════════════════════════════════════════════════════════════════════════
// DEFAULTS CHILE 2024-2025
// Fuentes: Centro UC, SHRM Chile, Robert Half 2024-2025
// ════════════════════════════════════════════════════════════════════════════

export const CHILE_SALARY_DEFAULTS: SalaryByJobLevel & { promedio_general: number } = {
  alta_gerencia: 4500000,     // $4.5M CLP/mes
  mandos_medios: 2200000,     // $2.2M CLP/mes
  profesionales: 1500000,     // $1.5M CLP/mes
  base_operativa: 750000,     // $750K CLP/mes
  promedio_general: 1200000   // $1.2M CLP/mes (ponderado)
}

export const CHILE_HEADCOUNT_DISTRIBUTION: HeadcountDistribution = {
  alta_gerencia: 0.10,
  mandos_medios: 0.20,
  profesionales: 0.35,
  base_operativa: 0.35
}

export const CHILE_TURNOVER_BASELINE: Record<string, number> = {
  technology: 0.15,
  finance: 0.12,
  healthcare: 0.18,
  manufacturing: 0.16,
  retail: 0.35,
  services: 0.22,
  default: 0.18
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES METODOLÓGICAS (NO MODIFICABLES)
// Basadas en estudios científicos — dan credibilidad al sistema
// ════════════════════════════════════════════════════════════════════════════

export const METHODOLOGY_CONSTANTS = {
  INTERVENTION_EFFECTIVENESS: 0.75,  // Bauer 4C Meta-Analysis 2010-2024
  TURNOVER_COST_MULTIPLIER: {
    alta_gerencia: 2.0,      // 200% salario anual
    mandos_medios: 1.5,      // 150%
    profesionales: 1.25,     // 125%
    base_operativa: 0.75     // 75%
  } as Record<SalaryCategory, number>,
  PRODUCTIVITY_LOSS_TOXIC: 0.23,     // Gallup 2024
  TURNOVER_INCREASE_TOXIC: 0.50      // Gallup 2024
} as const

export const SALARY_CONFIG_METADATA = {
  version: '1.2.0',
  country: 'CL',
  currency: 'CLP',
  lastUpdated: '2025-01',
  sources: [
    'Centro UC Encuesta Bienestar Laboral 2024',
    'SHRM Human Capital Benchmarking Report 2024',
    'Robert Half Chile Salary Guide 2025',
    'INE Chile - Encuesta Suplementaria de Ingresos 2024',
    'Bauer 4C Onboarding Model Meta-Analysis 2010-2024',
    'Gallup State of the Global Workplace 2024'
  ],
  notes: 'Valores ajustados por inflacion proyectada 2025 (4.5%)'
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS DE VALIDACIÓN
// ════════════════════════════════════════════════════════════════════════════

export function isValidSalaryCategory(category: string | null | undefined): category is SalaryCategory {
  if (!category) return false
  return category in CHILE_SALARY_DEFAULTS && category !== 'promedio_general'
}

export function validateHeadcountDistribution(dist: HeadcountDistribution): boolean {
  const sum = dist.alta_gerencia + dist.mandos_medios +
              dist.profesionales + dist.base_operativa
  return Math.abs(sum - 1.0) < 0.001
}

export function getSalaryCategoryLabel(category: SalaryCategory): string {
  return PositionAdapter.ACOTADO_CONFIG[category]?.label_es || 'Sin Clasificar'
}
