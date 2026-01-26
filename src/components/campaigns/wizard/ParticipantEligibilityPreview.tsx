'use client'

import { useMemo } from 'react'
import { Users, UserX, UsersRound, Eye, Clock, Building2, UserMinus, AlertTriangle } from 'lucide-react'
import { InclusionCriteria } from './ParticipantCriteriaSelector'
import { EligibleEmployee, calculateTenureMonths, EligibilityStatus } from './EmployeeEligibilityRow'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface ExclusionBreakdown {
  tenure: number
  department: number
  probation: number
  onLeave: number
  noManager: number
  manual: number
}

interface ParticipantEligibilityPreviewProps {
  employees: EligibleEmployee[]
  criteria: InclusionCriteria
  manualExclusions: string[]
  onManualExclusionChange: (employeeId: string, excluded: boolean) => void
  onOpenAdjustment: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// ELIGIBILITY CALCULATION
// ════════════════════════════════════════════════════════════════════════════

export interface EligibilityResult {
  eligible: boolean
  reason?: string
  status: EligibilityStatus
}

export function calculateEligibility(
  employee: EligibleEmployee,
  criteria: InclusionCriteria,
  manualExclusions: string[]
): EligibilityResult {
  // 1. Check manual exclusion first
  if (manualExclusions.includes(employee.id)) {
    return { eligible: false, reason: 'Excluido manualmente', status: 'excludedManually' }
  }

  // 2. Check tenure
  const tenureMonths = calculateTenureMonths(employee.hireDate)
  if (tenureMonths < criteria.minTenureMonths) {
    return {
      eligible: false,
      reason: `Antigüedad ${tenureMonths}m < ${criteria.minTenureMonths}m requeridos`,
      status: 'excludedByCriteria'
    }
  }

  // 3. Check department
  if (criteria.departments !== 'all') {
    if (!employee.department || !criteria.departments.includes(employee.department.id)) {
      return { eligible: false, reason: 'Departamento no seleccionado', status: 'excludedByCriteria' }
    }
  }

  // 4. Check probation (using status or tenure < 3 months as proxy)
  if (criteria.excludeProbation && tenureMonths < 3) {
    return { eligible: false, reason: 'En período de prueba', status: 'excludedByCriteria' }
  }

  // 5. Check leave status
  if (criteria.excludeOnLeave && employee.status === 'ON_LEAVE') {
    return { eligible: false, reason: 'Con licencia activa', status: 'excludedByCriteria' }
  }

  // 6. Check manager
  if (criteria.excludeWithoutManager && !employee.managerId) {
    return { eligible: false, reason: 'Sin jefe asignado', status: 'excludedByCriteria' }
  }

  return { eligible: true, status: 'included' }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function ParticipantEligibilityPreview({
  employees,
  criteria,
  manualExclusions,
  onManualExclusionChange,
  onOpenAdjustment
}: ParticipantEligibilityPreviewProps) {
  // Calculate eligibility for all employees
  const { eligible, excluded, breakdown, eligibilityMap } = useMemo(() => {
    const eligibilityMap = new Map<string, EligibilityResult>()
    const breakdown: ExclusionBreakdown = {
      tenure: 0,
      department: 0,
      probation: 0,
      onLeave: 0,
      noManager: 0,
      manual: 0
    }

    let eligibleCount = 0
    let excludedCount = 0

    for (const employee of employees) {
      const result = calculateEligibility(employee, criteria, manualExclusions)
      eligibilityMap.set(employee.id, result)

      if (result.eligible) {
        eligibleCount++
      } else {
        excludedCount++
        // Track breakdown
        if (result.status === 'excludedManually') {
          breakdown.manual++
        } else if (result.reason?.includes('Antigüedad')) {
          breakdown.tenure++
        } else if (result.reason?.includes('Departamento')) {
          breakdown.department++
        } else if (result.reason?.includes('prueba')) {
          breakdown.probation++
        } else if (result.reason?.includes('licencia')) {
          breakdown.onLeave++
        } else if (result.reason?.includes('jefe')) {
          breakdown.noManager++
        }
      }
    }

    return {
      eligible: eligibleCount,
      excluded: excludedCount,
      breakdown,
      eligibilityMap
    }
  }, [employees, criteria, manualExclusions])

  const totalEmployees = employees.length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Eligible */}
        <div className="fhr-card-metric text-center p-4 border-l-4 border-l-cyan-500">
          <Users className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
          <p className="text-3xl font-light text-cyan-400">{eligible}</p>
          <p className="text-sm text-slate-500">Elegibles</p>
          <p className="text-xs text-slate-600 mt-1">
            {totalEmployees > 0 ? Math.round((eligible / totalEmployees) * 100) : 0}%
          </p>
        </div>

        {/* Excluded */}
        <div className="fhr-card-metric text-center p-4 border-l-4 border-l-amber-500">
          <UserX className="w-8 h-8 mx-auto mb-2 text-amber-400" />
          <p className="text-3xl font-light text-amber-400">{excluded}</p>
          <p className="text-sm text-slate-500">Excluidos</p>
          <p className="text-xs text-slate-600 mt-1">
            {totalEmployees > 0 ? Math.round((excluded / totalEmployees) * 100) : 0}%
          </p>
        </div>

        {/* Total */}
        <div className="fhr-card-metric text-center p-4 border-l-4 border-l-slate-500">
          <UsersRound className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p className="text-3xl font-light text-slate-300">{totalEmployees}</p>
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-xs text-slate-600 mt-1">empleados</p>
        </div>
      </div>

      {/* Exclusion Breakdown */}
      {excluded > 0 && (
        <div className="fhr-card p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Razones de Exclusión
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {breakdown.tenure > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 p-2 rounded">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Antigüedad: {breakdown.tenure}</span>
              </div>
            )}
            {breakdown.department > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 p-2 rounded">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>Departamento: {breakdown.department}</span>
              </div>
            )}
            {breakdown.probation > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 p-2 rounded">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Prueba: {breakdown.probation}</span>
              </div>
            )}
            {breakdown.onLeave > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 p-2 rounded">
                <UserMinus className="w-4 h-4 text-slate-500" />
                <span>Licencia: {breakdown.onLeave}</span>
              </div>
            )}
            {breakdown.noManager > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 p-2 rounded">
                <UserX className="w-4 h-4 text-slate-500" />
                <span>Sin jefe: {breakdown.noManager}</span>
              </div>
            )}
            {breakdown.manual > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/30">
                <AlertTriangle className="w-4 h-4" />
                <span>Manual: {breakdown.manual}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Full List Button */}
      <button
        onClick={onOpenAdjustment}
        className="fhr-btn fhr-btn-secondary w-full flex items-center justify-center gap-2"
      >
        <Eye className="w-4 h-4" />
        Ver Lista Completa y Ajustar
      </button>

      {/* Warning if low participation */}
      {eligible < 5 && totalEmployees > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 font-medium">Participación baja</p>
            <p className="text-sm text-amber-300/80">
              Se recomienda un mínimo de 5 participantes para resultados significativos.
              Considera ajustar los criterios de inclusión.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
