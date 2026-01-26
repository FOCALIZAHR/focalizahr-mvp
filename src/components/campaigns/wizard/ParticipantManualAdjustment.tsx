'use client'

import { useState, useMemo } from 'react'
import { X, Search, Users, UserX, ChevronLeft, ChevronRight, History } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { InclusionCriteria } from './ParticipantCriteriaSelector'
import { calculateEligibility } from './ParticipantEligibilityPreview'
import EmployeeEligibilityRow, { EligibleEmployee, calculateTenureMonths } from './EmployeeEligibilityRow'
import type { ManualOverrides, ManualOverride } from './index'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type FilterStatus = 'all' | 'included' | 'excluded' | 'manual'

interface ParticipantManualAdjustmentProps {
  employees: EligibleEmployee[]
  criteria: InclusionCriteria
  manualOverrides: ManualOverrides
  onManualOverrideChange: (
    employeeId: string,
    excluded: boolean,
    originalStatus: 'eligible' | 'excluded_by_criteria'
  ) => void
  onClose: () => void
  currentUserName: string
}

const ITEMS_PER_PAGE = 20

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function ParticipantManualAdjustment({
  employees,
  criteria,
  manualOverrides,
  onManualOverrideChange,
  onClose,
  currentUserName
}: ParticipantManualAdjustmentProps) {
  const [search, setSearch] = useState('')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Convertir overrides a array de IDs excluidos para calculateEligibility
  const manualExclusionIds = useMemo(() => {
    return Object.entries(manualOverrides)
      .filter(([, override]) => override.excluded)
      .map(([id]) => id)
  }, [manualOverrides])

  // Get unique departments
  const departments = useMemo(() => {
    const deptMap = new Map<string, string>()
    employees.forEach(emp => {
      if (emp.department) {
        deptMap.set(emp.department.id, emp.department.displayName)
      }
    })
    return Array.from(deptMap.entries()).map(([id, name]) => ({ id, displayName: name }))
  }, [employees])

  // Calculate eligibility and filter
  const { filteredEmployees, stats } = useMemo(() => {
    let filtered = employees.map(emp => {
      const result = calculateEligibility(emp, criteria, manualExclusionIds)
      const tenureMonths = calculateTenureMonths(emp.hireDate)
      const override = manualOverrides[emp.id] || null
      return { ...emp, eligibility: result, tenureMonths, override }
    })

    // Calculate stats before filtering
    const included = filtered.filter(e => e.eligibility.eligible).length
    const excluded = filtered.length - included
    const manualCount = Object.keys(manualOverrides).length

    // Apply search filter
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(emp =>
        emp.fullName.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.nationalId.toLowerCase().includes(q) ||
        emp.department?.displayName.toLowerCase().includes(q)
      )
    }

    // Apply department filter
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department?.id === filterDepartment)
    }

    // Apply status filter
    if (filterStatus === 'included') {
      filtered = filtered.filter(emp => emp.eligibility.eligible)
    } else if (filterStatus === 'excluded') {
      filtered = filtered.filter(emp => !emp.eligibility.eligible)
    } else if (filterStatus === 'manual') {
      filtered = filtered.filter(emp => emp.override !== null)
    }

    return {
      filteredEmployees: filtered,
      stats: { included, excluded, total: employees.length, manual: manualCount }
    }
  }, [employees, criteria, manualExclusionIds, manualOverrides, search, filterDepartment, filterStatus])

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE)
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="relative px-6 py-4 border-b border-slate-800 flex-shrink-0">
            <div className="fhr-top-line" />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-light text-slate-200">Ajustar Participantes</h2>
                <p className="text-sm text-slate-500">
                  Revisa y ajusta manualmente la lista de participantes
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-slate-800 flex-shrink-0">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); handleFilterChange() }}
                  placeholder="Buscar por nombre, email, RUT..."
                  className="fhr-input pl-10 w-full"
                />
              </div>

              {/* Department Filter */}
              <select
                value={filterDepartment}
                onChange={(e) => { setFilterDepartment(e.target.value); handleFilterChange() }}
                className="fhr-input w-48"
              >
                <option value="all">Todos los departamentos</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.displayName}</option>
                ))}
              </select>

              {/* Status Filter */}
              <div className="flex rounded-lg overflow-hidden border border-slate-700">
                <button
                  onClick={() => { setFilterStatus('all'); handleFilterChange() }}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    filterStatus === 'all'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => { setFilterStatus('included'); handleFilterChange() }}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    filterStatus === 'included'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Incluidos
                </button>
                <button
                  onClick={() => { setFilterStatus('excluded'); handleFilterChange() }}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    filterStatus === 'excluded'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Excluidos
                </button>
                <button
                  onClick={() => { setFilterStatus('manual'); handleFilterChange() }}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    filterStatus === 'manual'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <History className="w-3 h-3 inline mr-1" />
                  Editados
                </button>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="px-6 py-2 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 uppercase">
              <div className="w-5"></div>
              <div className="flex-1">Empleado</div>
              <div className="hidden md:block w-32">Departamento</div>
              <div className="hidden sm:block w-20 text-right">Antigüedad</div>
              <div className="w-28">Estado</div>
            </div>
          </div>

          {/* Employee List */}
          <div className="flex-1 overflow-y-auto px-6 py-2">
            {paginatedEmployees.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No se encontraron empleados con los filtros actuales
              </div>
            ) : (
              <div className="space-y-1">
                {paginatedEmployees.map(emp => (
                  <EmployeeEligibilityRow
                    key={emp.id}
                    employee={emp}
                    status={emp.eligibility.status}
                    exclusionReason={emp.eligibility.reason}
                    tenureMonths={emp.tenureMonths}
                    override={emp.override}
                    onToggle={(excluded) => {
                      const originalStatus = emp.eligibility.status === 'excludedByCriteria'
                        ? 'excluded_by_criteria'
                        : 'eligible'
                      onManualOverrideChange(emp.id, excluded, originalStatus)
                    }}
                    disabled={emp.eligibility.status === 'excludedByCriteria'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer with Pagination and Summary */}
          <div className="px-6 py-4 border-t border-slate-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              {/* Summary */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-slate-300">
                    <span className="font-medium text-cyan-400">{stats.included}</span> incluidos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UserX className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-slate-300">
                    <span className="font-medium text-amber-400">{stats.excluded}</span> excluidos
                  </span>
                </div>
                {stats.manual > 0 && (
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-slate-300">
                      <span className="font-medium text-purple-400">{stats.manual}</span> editados
                    </span>
                  </div>
                )}
                <span className="text-sm text-slate-500">
                  de {stats.total} total
                </span>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>
                  <span className="text-sm text-slate-400">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="fhr-btn fhr-btn-primary"
              >
                Confirmar Selección
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
