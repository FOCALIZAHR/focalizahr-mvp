'use client'

import { Lock, AlertTriangle, Check, History } from 'lucide-react'
import type { ManualOverride } from './index'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type EligibilityStatus = 'included' | 'excludedByCriteria' | 'excludedManually'

export interface EligibleEmployee {
  id: string
  fullName: string
  email: string | null
  nationalId: string
  position: string | null
  hireDate: string
  status: string
  managerId: string | null
  department: {
    id: string
    displayName: string
  } | null
}

interface EmployeeEligibilityRowProps {
  employee: EligibleEmployee
  status: EligibilityStatus
  exclusionReason?: string
  onToggle: (excluded: boolean) => void
  disabled?: boolean
  tenureMonths: number
  override?: ManualOverride | null
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function formatAuditDate(date: Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ════════════════════════════════════════════════════════════════════════════
// UTILITY
// ════════════════════════════════════════════════════════════════════════════

export function calculateTenureMonths(hireDate: string): number {
  const hire = new Date(hireDate)
  const now = new Date()
  const diffTime = now.getTime() - hire.getTime()
  const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44) // Average month
  return Math.floor(diffMonths)
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function EmployeeEligibilityRow({
  employee,
  status,
  exclusionReason,
  onToggle,
  disabled = false,
  tenureMonths,
  override
}: EmployeeEligibilityRowProps) {
  const isExcludedByCriteria = status === 'excludedByCriteria'
  const isExcludedManually = status === 'excludedManually'
  const isIncluded = status === 'included'
  const hasOverride = override !== null && override !== undefined

  const handleCheckboxChange = () => {
    if (isExcludedByCriteria || disabled) return
    onToggle(!isExcludedManually)
  }

  // Row styles based on status
  const rowClasses = `
    flex items-center gap-4 p-3 rounded-lg transition-all
    ${isIncluded ? 'bg-slate-800/30 hover:bg-slate-800/50' : ''}
    ${isExcludedByCriteria ? 'bg-slate-900/50 opacity-60' : ''}
    ${isExcludedManually ? 'bg-amber-500/10 border border-amber-500/30' : ''}
    ${hasOverride && !isExcludedManually ? 'ring-1 ring-purple-500/30' : ''}
  `

  return (
    <div className={rowClasses}>
      {/* Checkbox */}
      <div className="flex-shrink-0">
        {isExcludedByCriteria ? (
          <div
            className="w-5 h-5 flex items-center justify-center text-slate-500"
            title={exclusionReason || 'Excluido por criterios'}
          >
            <Lock className="w-4 h-4" />
          </div>
        ) : (
          <input
            type="checkbox"
            checked={isIncluded}
            onChange={handleCheckboxChange}
            disabled={disabled}
            className={`w-5 h-5 rounded focus:ring-cyan-500 ${
              isExcludedManually
                ? 'text-amber-500 bg-slate-800 border-amber-500'
                : 'text-cyan-500 bg-slate-800 border-slate-600'
            }`}
          />
        )}
      </div>

      {/* Employee Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-200 truncate">
            {employee.fullName}
          </span>
          {isExcludedManually && (
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          )}
          {isIncluded && !hasOverride && (
            <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          )}
          {/* Indicador de override con auditoría */}
          {hasOverride && (
            <div
              className="flex items-center gap-1 cursor-help"
              title={`Editado por ${override.updatedBy} el ${formatAuditDate(override.updatedAt)}`}
            >
              <History className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <span className="text-xs text-purple-400 hidden lg:inline">
                {override.updatedBy}
              </span>
            </div>
          )}
        </div>
        <div className="text-sm text-slate-500 truncate">
          {employee.position || 'Sin cargo'}
        </div>
      </div>

      {/* Department */}
      <div className="hidden md:block w-32 text-sm text-slate-400 truncate">
        {employee.department?.displayName || 'Sin asignar'}
      </div>

      {/* Tenure */}
      <div className="hidden sm:block w-20 text-sm text-slate-400 text-right">
        {tenureMonths} {tenureMonths === 1 ? 'mes' : 'meses'}
      </div>

      {/* Status Badge */}
      <div className="flex-shrink-0 w-28">
        {isIncluded && !hasOverride && (
          <span className="fhr-badge fhr-badge-active text-xs">
            Incluido
          </span>
        )}
        {isIncluded && hasOverride && (
          <span className="fhr-badge fhr-badge-premium text-xs">
            Incluido *
          </span>
        )}
        {isExcludedByCriteria && (
          <span
            className="fhr-badge fhr-badge-draft text-xs cursor-help"
            title={exclusionReason}
          >
            Excluido
          </span>
        )}
        {isExcludedManually && (
          <span className="fhr-badge fhr-badge-warning text-xs">
            Excluido *
          </span>
        )}
      </div>
    </div>
  )
}
