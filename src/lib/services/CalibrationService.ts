// ════════════════════════════════════════════════════════════════════════════
// CALIBRATION SERVICE - Helpers de calibración
// src/lib/services/CalibrationService.ts
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface CalibrationSessionLike {
  cycleId: string
  departmentIds?: string[]
  filterMode?: string | null
  filterConfig?: any
}

// ════════════════════════════════════════════════════════════════════════════
// MULTI-CRITERIO QUERY BUILDER - TASK 17B
// ════════════════════════════════════════════════════════════════════════════

/**
 * Construye query para obtener candidatos usando multi-criterio.
 * Soporta sistema legacy (departmentIds) y nuevo (filterMode + filterConfig).
 */
export function buildCandidatesQuery(
  session: CalibrationSessionLike,
  accountId: string
): any {
  const baseWhere: any = {
    accountId,
    isActive: true,
    performanceRatings: {
      some: {
        cycleId: session.cycleId,
        calculatedScore: { not: null }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SISTEMA NUEVO (v3.1+) - Prioridad si filterMode definido y no es department legacy
  // ══════════════════════════════════════════════════════════════════════════

  if (session.filterMode && session.filterMode !== 'department' && session.filterConfig) {
    return buildMultiCriteriaQuery(session, baseWhere)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SISTEMA NUEVO: filterMode=department con filterConfig
  // ══════════════════════════════════════════════════════════════════════════

  if (session.filterMode === 'department' && session.filterConfig?.departmentIds?.length > 0) {
    return {
      ...baseWhere,
      departmentId: { in: session.filterConfig.departmentIds }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SISTEMA LEGACY - Backward Compatibility (departmentIds directo)
  // ══════════════════════════════════════════════════════════════════════════

  if (session.departmentIds && session.departmentIds.length > 0) {
    return {
      ...baseWhere,
      departmentId: { in: session.departmentIds }
    }
  }

  // Sin filtro (toda la empresa)
  return baseWhere
}

/**
 * Query builder para sistema multi-criterio.
 * Soporta: jobLevel, jobFamily, customPicks
 */
function buildMultiCriteriaQuery(
  session: CalibrationSessionLike,
  baseWhere: any
): any {
  const config = session.filterConfig as any

  if (!config) return baseWhere

  switch (session.filterMode) {
    // ════════════════════════════════════════════════════════════════════════
    // MODO 1: Por Nivel Jerárquico (standardJobLevel)
    // Uso: "Calibrar todos los Gerentes/Directores"
    // Employee.standardJobLevel: 'gerente_director' | 'subgerente_subdirector' | 'jefe' | etc.
    // ════════════════════════════════════════════════════════════════════════
    case 'jobLevel': {
      const query: any = {
        ...baseWhere,
        standardJobLevel: { in: config.levels || [] }
      }

      if (config.includeOnlyManagers) {
        query.directReports = { some: {} }
      }

      return query
    }

    // ════════════════════════════════════════════════════════════════════════
    // MODO 2: Por Familia de Cargos (position / jobTitle)
    // Uso: "Calibrar todos los Sales Managers"
    // ════════════════════════════════════════════════════════════════════════
    case 'jobFamily': {
      return {
        ...baseWhere,
        OR: [
          { position: { in: config.jobTitles || [] } },
          { jobTitle: { in: config.jobTitles || [] } }
        ]
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // MODO 3: Por Reportes de Manager (directReports)
    // Uso: "Calibrar todos los reportes directos de María"
    // Employee.managerId → filtra subordinados directos
    // ════════════════════════════════════════════════════════════════════════
    case 'directReports': {
      return {
        ...baseWhere,
        managerId: { in: config.managerIds || [] }
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // MODO 4: Selección Manual (customPicks)
    // Uso: Promotion committees, succession planning
    // ════════════════════════════════════════════════════════════════════════
    case 'customPicks': {
      return {
        ...baseWhere,
        id: { in: config.employeeIds || [] }
      }
    }

    default:
      return baseWhere
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PREVIEW - Para Wizard Step 2
// ════════════════════════════════════════════════════════════════════════════

/**
 * Obtiene preview de empleados que coinciden con criterios.
 * Retorna máximo `limit` empleados para mostrar en el wizard.
 */
export async function getEmployeesPreview(
  filterMode: string,
  filterConfig: any,
  cycleId: string,
  accountId: string,
  limit: number = 20
): Promise<{ employees: any[]; totalCount: number }> {
  const tempSession: CalibrationSessionLike = {
    filterMode,
    filterConfig,
    cycleId,
    departmentIds: []
  }

  const whereClause = buildCandidatesQuery(tempSession, accountId)

  const [employees, totalCount] = await Promise.all([
    prisma.employee.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        position: true,
        jobTitle: true,
        standardJobLevel: true,
        department: {
          select: { displayName: true }
        }
      },
      take: limit,
      orderBy: { fullName: 'asc' }
    }),
    prisma.employee.count({ where: whereClause })
  ])

  return {
    employees: employees.map(emp => ({
      id: emp.id,
      fullName: emp.fullName,
      position: emp.position || emp.jobTitle || 'Sin cargo',
      standardJobLevel: emp.standardJobLevel,
      departmentName: emp.department?.displayName || 'Sin departamento'
    })),
    totalCount
  }
}

// Backward compat alias
export const buildCandidatesQueryBase = buildCandidatesQuery
