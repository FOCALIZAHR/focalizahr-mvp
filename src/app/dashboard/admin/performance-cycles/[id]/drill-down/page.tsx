'use client'

// ════════════════════════════════════════════════════════════════════════════
// DRILL-DOWN HIERARCHY - Vista jerárquica performance por departamento
// src/app/dashboard/admin/performance-cycles/[id]/drill-down/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Building2,
  Users,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Home,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Search,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface GlobalStats {
  total: number
  completed: number
  pending: number
  inProgress: number
  expired: number
  completionRate: number
}

interface DepartmentStats {
  departmentId: string
  departmentName: string
  total: number
  completed: number
  pending: number
  inProgress: number
  expired: number
  completionRate: number
  evaluateeCount: number
}

interface EvaluateeStats {
  id: string
  name: string
  total: number
  completed: number
  pending: number
  inProgress: number
  expired: number
  completionRate: number
}

interface DrillDownData {
  departmentId: string
  departmentName: string
  evaluatees: EvaluateeStats[]
}

interface HierarchyData {
  cycleId: string
  cycleName: string
  cycleStatus: string
  globalStats: GlobalStats
  departments: DepartmentStats[]
  drillDown: DrillDownData | null
}

type ViewLevel = 'company' | 'department'

function getToken(): string | null {
  if (typeof window !== 'undefined') return localStorage.getItem('focalizahr_token')
  return null
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getCompletionColor(rate: number): string {
  if (rate >= 80) return 'text-green-400'
  if (rate >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function getCompletionBg(rate: number): string {
  if (rate >= 80) return 'bg-green-500/20 border-green-500/30'
  if (rate >= 50) return 'bg-amber-500/20 border-amber-500/30'
  return 'bg-red-500/20 border-red-500/30'
}

function getCompletionBarColor(rate: number): string {
  if (rate >= 80) return 'bg-green-500'
  if (rate >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function getCompletionIcon(rate: number) {
  if (rate >= 80) return TrendingUp
  if (rate >= 50) return Minus
  return TrendingDown
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function DrillDownPage() {
  const params = useParams()
  const router = useRouter()
  const cycleId = params.id as string

  const [data, setData] = useState<HierarchyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Drill-down state
  const [viewLevel, setViewLevel] = useState<ViewLevel>('company')
  const [selectedDept, setSelectedDept] = useState<DepartmentStats | null>(null)
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null)
  const [isDrilling, setIsDrilling] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const token = getToken()
        const res = await fetch(`/api/admin/performance-cycles/${cycleId}/hierarchy-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Error cargando datos')
        const json = await res.json()
        if (json.success) setData(json.hierarchy)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    if (cycleId) loadData()
  }, [cycleId])

  // Drill into department
  const handleDrillDown = async (dept: DepartmentStats) => {
    try {
      setIsDrilling(true)
      setSelectedDept(dept)
      const token = getToken()
      const res = await fetch(
        `/api/admin/performance-cycles/${cycleId}/hierarchy-stats?departmentId=${dept.departmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Error cargando detalle')
      const json = await res.json()
      if (json.success && json.hierarchy.drillDown) {
        setDrillDownData(json.hierarchy.drillDown)
        setViewLevel('department')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsDrilling(false)
    }
  }

  const handleBackToCompany = () => {
    setViewLevel('company')
    setSelectedDept(null)
    setDrillDownData(null)
    setSearchQuery('')
  }

  // Filtered departments
  const filteredDepartments = useMemo(() => {
    if (!data) return []
    if (!searchQuery.trim()) return data.departments
    const q = searchQuery.toLowerCase()
    return data.departments.filter(d =>
      d.departmentName.toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  // Filtered evaluatees
  const filteredEvaluatees = useMemo(() => {
    if (!drillDownData) return []
    if (!searchQuery.trim()) return drillDownData.evaluatees
    const q = searchQuery.toLowerCase()
    return drillDownData.evaluatees.filter(e =>
      e.name.toLowerCase().includes(q)
    )
  }, [drillDownData, searchQuery])

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="fhr-card p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-slate-400">{error || 'No se pudo cargar datos'}</p>
          <button onClick={() => router.back()} className="fhr-btn fhr-btn-secondary mt-4 flex items-center gap-2 mx-auto">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5" />Admin</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <button onClick={() => router.push('/dashboard/admin/performance-cycles')} className="hover:text-cyan-400 transition-colors">
          Ciclos
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <button onClick={() => router.push(`/dashboard/admin/performance-cycles/${cycleId}`)} className="hover:text-cyan-400 transition-colors truncate max-w-[200px]">
          {data.cycleName}
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        {viewLevel === 'department' && selectedDept ? (
          <>
            <button onClick={handleBackToCompany} className="hover:text-cyan-400 transition-colors">
              Drill-Down
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-200 truncate max-w-[200px]">{selectedDept.departmentName}</span>
          </>
        ) : (
          <span className="text-slate-200">Drill-Down</span>
        )}
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-light text-slate-200 flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          <span className="fhr-title-gradient">Vista Jerarquica</span>
        </h1>
        <p className="text-slate-400 mt-1">{data.cycleName}</p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fhr-card p-4 text-center">
          <Users className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
          <div className="text-2xl font-bold text-slate-200">{data.globalStats.total}</div>
          <div className="text-xs text-slate-400">Total</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="fhr-card p-4 text-center border-green-500/20">
          <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1.5" />
          <div className="text-2xl font-bold text-green-400">{data.globalStats.completed}</div>
          <div className="text-xs text-slate-400">Completados</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="fhr-card p-4 text-center border-blue-500/20">
          <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
          <div className="text-2xl font-bold text-blue-400">{data.globalStats.inProgress}</div>
          <div className="text-xs text-slate-400">En Progreso</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="fhr-card p-4 text-center border-amber-500/20">
          <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
          <div className="text-2xl font-bold text-amber-400">{data.globalStats.pending}</div>
          <div className="text-xs text-slate-400">Pendientes</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="fhr-card p-4 text-center col-span-2 md:col-span-1">
          <BarChart3 className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
          <div className={`text-2xl font-bold ${getCompletionColor(data.globalStats.completionRate)}`}>
            {data.globalStats.completionRate}%
          </div>
          <div className="text-xs text-slate-400">Completado</div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="fhr-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={viewLevel === 'company' ? 'Buscar departamento...' : 'Buscar evaluado...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="fhr-input w-full pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewLevel === 'company' ? (
          /* ── Company Level: Department Cards ── */
          <motion.div
            key="company"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            {filteredDepartments.length === 0 ? (
              <div className="fhr-card p-8 text-center">
                <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  {data.departments.length === 0
                    ? 'No hay asignaciones en este ciclo'
                    : 'No se encontraron departamentos'}
                </p>
              </div>
            ) : (
              filteredDepartments.map((dept, idx) => {
                const Icon = getCompletionIcon(dept.completionRate)
                return (
                  <motion.button
                    key={dept.departmentId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => handleDrillDown(dept)}
                    disabled={isDrilling}
                    className="fhr-card p-5 w-full text-left hover:border-cyan-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Department Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${getCompletionBg(dept.completionRate)}`}>
                        <Building2 className={`w-6 h-6 ${getCompletionColor(dept.completionRate)}`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-medium text-slate-200 truncate">{dept.departmentName}</span>
                          <Icon className={`w-4 h-4 ${getCompletionColor(dept.completionRate)}`} />
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-700/50 rounded-full h-2 mb-1.5">
                          <div
                            className={`h-2 rounded-full transition-all ${getCompletionBarColor(dept.completionRate)}`}
                            style={{ width: `${dept.completionRate}%` }}
                          />
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {dept.evaluateeCount} evaluados
                          </span>
                          <span className="text-green-400">{dept.completed} completados</span>
                          <span className="text-amber-400">{dept.pending + dept.inProgress} pendientes</span>
                          {dept.expired > 0 && (
                            <span className="text-red-400">{dept.expired} expirados</span>
                          )}
                        </div>
                      </div>

                      {/* Completion Rate + Arrow */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className={`text-xl font-bold ${getCompletionColor(dept.completionRate)}`}>
                            {dept.completionRate}%
                          </div>
                          <div className="text-xs text-slate-500">{dept.total} asign.</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>
                  </motion.button>
                )
              })
            )}
          </motion.div>
        ) : (
          /* ── Department Level: Evaluatee Cards ── */
          <motion.div
            key="department"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {/* Department Header */}
            {selectedDept && (
              <div className={`fhr-card p-4 border ${getCompletionBg(selectedDept.completionRate)}`}>
                <div className="flex items-center gap-3">
                  <Building2 className={`w-5 h-5 ${getCompletionColor(selectedDept.completionRate)}`} />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-200">{selectedDept.departmentName}</span>
                    <span className="text-xs text-slate-400 ml-3">{selectedDept.evaluateeCount} evaluados</span>
                  </div>
                  <span className={`text-lg font-bold ${getCompletionColor(selectedDept.completionRate)}`}>
                    {selectedDept.completionRate}%
                  </span>
                </div>
              </div>
            )}

            {/* Evaluatees List */}
            {filteredEvaluatees.length === 0 ? (
              <div className="fhr-card p-8 text-center">
                <User className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No se encontraron evaluados</p>
              </div>
            ) : (
              filteredEvaluatees.map((evaluatee, idx) => (
                <motion.div
                  key={evaluatee.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="fhr-card p-4"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      evaluatee.completionRate === 100 ? 'bg-green-500/20' :
                      evaluatee.completionRate > 0 ? 'bg-amber-500/20' : 'bg-slate-700'
                    }`}>
                      {evaluatee.completionRate === 100 ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <User className={`w-5 h-5 ${evaluatee.completionRate > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-200 truncate">{evaluatee.name}</span>
                        {evaluatee.completionRate === 100 && (
                          <span className="fhr-badge fhr-badge-success text-xs">Completo</span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-700/50 rounded-full h-1.5 mb-1">
                        <div
                          className={`h-1.5 rounded-full transition-all ${getCompletionBarColor(evaluatee.completionRate)}`}
                          style={{ width: `${evaluatee.completionRate}%` }}
                        />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{evaluatee.completed}/{evaluatee.total} evaluaciones</span>
                        {evaluatee.pending > 0 && <span className="text-amber-400">{evaluatee.pending} pend.</span>}
                        {evaluatee.inProgress > 0 && <span className="text-blue-400">{evaluatee.inProgress} en prog.</span>}
                        {evaluatee.expired > 0 && <span className="text-red-400">{evaluatee.expired} exp.</span>}
                      </div>
                    </div>

                    {/* Rate */}
                    <div className={`text-lg font-bold flex-shrink-0 ${getCompletionColor(evaluatee.completionRate)}`}>
                      {evaluatee.completionRate}%
                    </div>
                  </div>
                </motion.div>
              ))
            )}

            {/* Back Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={handleBackToCompany}
                className="fhr-btn fhr-btn-ghost flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a Departamentos
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back to Cycle */}
      {viewLevel === 'company' && (
        <div className="flex justify-center">
          <button
            onClick={() => router.push(`/dashboard/admin/performance-cycles/${cycleId}`)}
            className="fhr-btn fhr-btn-ghost flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Ciclo
          </button>
        </div>
      )}

      {/* Loading Overlay for Drill-Down */}
      {isDrilling && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="fhr-card p-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <span className="text-slate-300 text-sm">Cargando detalle...</span>
          </div>
        </div>
      )}
    </div>
  )
}
