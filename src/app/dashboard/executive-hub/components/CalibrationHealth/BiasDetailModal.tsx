'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, MinusCircle, X, Users } from 'lucide-react'
import type { GerenciaCalibrationStats, GerenciaDepartmentStats, IntegrityScore } from './CalibrationHealth.types'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface BiasDetailModalProps {
  isOpen: boolean
  onClose: () => void
  byGerencia: GerenciaCalibrationStats[]
  integrityScore: IntegrityScore
  initialGerenciaId?: string | null
}

type NavLevel = 'gerencias' | 'departamentos' | 'evaluadores'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getStatusIcon(status: string | null, hasDeptBias?: boolean) {
  if (!status || status === 'OPTIMA') {
    if (hasDeptBias) return <AlertTriangle className="w-4 h-4 text-amber-400" />
    return <CheckCircle className="w-4 h-4 text-emerald-400" />
  }
  if (status === 'SEVERA') return <AlertTriangle className="w-4 h-4 text-red-400" />
  if (status === 'INDULGENTE') return <AlertTriangle className="w-4 h-4 text-amber-400" />
  return <MinusCircle className="w-4 h-4 text-slate-400" />
}

function getStatusColor(status: string | null) {
  if (status === 'SEVERA') return 'border-red-500/50 bg-red-500/10'
  if (status === 'INDULGENTE') return 'border-amber-500/50 bg-amber-500/10'
  if (status === 'CENTRAL') return 'border-blue-500/50 bg-blue-500/10'
  return 'border-emerald-500/50 bg-emerald-500/10'
}

function getStatusBadgeClass(status: string) {
  if (status === 'SEVERA') return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (status === 'INDULGENTE') return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  if (status === 'CENTRAL') return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
}

function getEvaluatorTooltip(status: string): string {
  const tooltips: Record<string, string> = {
    SEVERA: 'Estándar de Hierro — Califica significativamente por debajo del promedio. Considerar sesión de calibración.',
    INDULGENTE: 'Mano Blanda — Califica significativamente por encima del promedio. Revisar diferenciación de desempeño.',
    CENTRAL: 'Zona Gris — No diferencia entre niveles de desempeño.',
    OPTIMA: 'Criterios de evaluación balanceados.'
  }
  return tooltips[status] || ''
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export function BiasDetailModal({ isOpen, onClose, byGerencia, integrityScore, initialGerenciaId }: BiasDetailModalProps) {
  const [selectedGerenciaId, setSelectedGerenciaId] = useState<string | null>(null)
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)

  // Pre-select gerencia when opening from cell click
  useEffect(() => {
    if (isOpen && initialGerenciaId) {
      setSelectedGerenciaId(initialGerenciaId)
      setSelectedDeptId(null)
    }
  }, [isOpen, initialGerenciaId])

  const activeGerencia = useMemo(() =>
    byGerencia.find(g => g.gerenciaId === selectedGerenciaId),
    [byGerencia, selectedGerenciaId]
  )

  const activeDept = useMemo(() =>
    activeGerencia?.departments?.find(d => d.departmentId === selectedDeptId),
    [activeGerencia, selectedDeptId]
  )

  const navLevel: NavLevel = selectedDeptId ? 'evaluadores' : selectedGerenciaId ? 'departamentos' : 'gerencias'

  const handleBack = () => {
    if (selectedDeptId) {
      setSelectedDeptId(null)
    } else {
      setSelectedGerenciaId(null)
    }
  }

  const handleClose = () => {
    onClose()
    setSelectedGerenciaId(null)
    setSelectedDeptId(null)
  }

  if (!isOpen) return null

  // Breadcrumb text
  const breadcrumb = navLevel === 'evaluadores'
    ? `${activeGerencia?.gerenciaName} › ${activeDept?.departmentName}`
    : navLevel === 'departamentos'
    ? activeGerencia?.gerenciaName
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl mx-4 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Tesla line */}
        <div className="fhr-top-line absolute inset-x-0 top-0 z-10" />

        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            {navLevel !== 'gerencias' ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>
            ) : (
              <h2 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Diagnóstico por Área
              </h2>
            )}
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {breadcrumb && (
            <p className="mt-2 text-sm text-slate-400">{breadcrumb}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {navLevel === 'gerencias' && (
              <GerenciasView
                byGerencia={byGerencia}
                onSelect={setSelectedGerenciaId}
              />
            )}

            {navLevel === 'departamentos' && activeGerencia && (
              <DepartamentosView
                departments={activeGerencia.departments || []}
                onSelect={setSelectedDeptId}
              />
            )}

            {navLevel === 'evaluadores' && activeDept && (
              <EvaluadoresView dept={activeDept} />
            )}
          </AnimatePresence>
        </div>

        {/* Footer - Integridad */}
        <div className="p-6 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Integridad de Datos</p>
              <p className="text-2xl font-bold text-cyan-400">
                {integrityScore.score}%
              </p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>Base {integrityScore.baseScore}%</p>
              {integrityScore.penalties.bias && (
                <p className="text-amber-400">
                  − {integrityScore.penalties.bias.points} sesgo
                </p>
              )}
              {integrityScore.penalties.variance && (
                <p className="text-orange-400">
                  − {integrityScore.penalties.variance.points} varianza
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// LEVEL 1: GERENCIAS
// ════════════════════════════════════════════════════════════════════════════

function GerenciasView({ byGerencia, onSelect }: {
  byGerencia: GerenciaCalibrationStats[]
  onSelect: (id: string) => void
}) {
  return (
    <motion.div
      key="gerencias"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-3"
    >
      {byGerencia.map(gerencia => (
        <button
          key={gerencia.gerenciaId}
          onClick={() => gerencia.evaluatorCount > 0 && onSelect(gerencia.gerenciaId)}
          disabled={gerencia.evaluatorCount === 0}
          className={`w-full p-4 rounded-xl border transition-all text-left ${
            gerencia.evaluatorCount === 0
              ? 'border-slate-700/30 bg-slate-800/30 opacity-50 cursor-not-allowed'
              : `${getStatusColor(gerencia.status)} hover:bg-slate-800/80 cursor-pointer`
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(gerencia.status, gerencia.hasDepartmentWithBias)}
              <div>
                <p className="font-medium text-white">{gerencia.gerenciaName}</p>
                <p className="text-sm text-slate-400">
                  {gerencia.evaluatorCount > 0
                    ? `${gerencia.evaluatorCount} evaluadores · avg ${gerencia.avg?.toFixed(1) ?? '—'}`
                    : 'Sin evaluaciones'
                  }
                </p>
              </div>
            </div>
            {gerencia.evaluatorCount > 0 && (
              <ChevronRight className="w-5 h-5 text-slate-500" />
            )}
          </div>
        </button>
      ))}
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// LEVEL 2: DEPARTAMENTOS
// ════════════════════════════════════════════════════════════════════════════

function DepartamentosView({ departments, onSelect }: {
  departments: GerenciaDepartmentStats[]
  onSelect: (id: string) => void
}) {
  return (
    <motion.div
      key="departamentos"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-3"
    >
      {departments.map(dept => (
        <button
          key={dept.departmentId}
          onClick={() => dept.evaluatorCount > 0 && onSelect(dept.departmentId)}
          disabled={dept.evaluatorCount === 0}
          className={`w-full p-4 rounded-xl border transition-all text-left ${
            dept.evaluatorCount === 0
              ? 'border-slate-700/30 bg-slate-800/30 opacity-50 cursor-not-allowed'
              : `${getStatusColor(dept.status)} hover:bg-slate-800/80 cursor-pointer`
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(dept.status)}
              <div>
                <p className="font-medium text-white">{dept.departmentName}</p>
                <p className="text-sm text-slate-400">
                  {dept.evaluatorCount > 0
                    ? `${dept.evaluatorCount} evaluadores`
                    : 'Sin evaluaciones'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {dept.avg !== null && (
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">{dept.avg.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">σ {dept.stdDev?.toFixed(2) ?? '—'}</p>
                </div>
              )}
              {dept.evaluatorCount > 0 && (
                <ChevronRight className="w-5 h-5 text-slate-500" />
              )}
            </div>
          </div>
        </button>
      ))}

      {departments.length === 0 && (
        <p className="text-center text-slate-400 py-8">
          No hay departamentos en esta gerencia
        </p>
      )}
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// LEVEL 3: EVALUADORES
// ════════════════════════════════════════════════════════════════════════════

function EvaluadoresView({ dept }: { dept: GerenciaDepartmentStats }) {
  const sorted = useMemo(() => {
    if (!dept.evaluators) return []
    // Non-OPTIMA first (bias highlighted), then by avg desc
    return [...dept.evaluators].sort((a, b) => {
      const aBias = a.status !== 'OPTIMA' ? 0 : 1
      const bBias = b.status !== 'OPTIMA' ? 0 : 1
      if (aBias !== bBias) return aBias - bBias
      return b.avg - a.avg
    })
  }, [dept.evaluators])

  return (
    <motion.div
      key="evaluadores"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-3"
    >
      {/* Summary */}
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-400">
          {sorted.length} evaluador{sorted.length !== 1 ? 'es' : ''} en {dept.departmentName}
        </span>
      </div>

      {sorted.map(evaluator => {
        const hasBias = evaluator.status !== 'OPTIMA'
        return (
          <div
            key={evaluator.managerId}
            className={`p-4 rounded-xl border ${
              hasBias
                ? `${getStatusColor(evaluator.status)} ring-1 ring-inset ${
                    evaluator.status === 'SEVERA' ? 'ring-red-500/30' :
                    evaluator.status === 'INDULGENTE' ? 'ring-amber-500/30' :
                    'ring-blue-500/30'
                  }`
                : 'border-slate-700/30 bg-slate-800/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {getStatusIcon(evaluator.status)}
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{evaluator.managerName}</p>
                  <p className="text-xs text-slate-500">
                    {evaluator.ratingsCount} evaluaciones
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-lg font-mono font-semibold text-white">
                    {evaluator.avg.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400">
                    σ {evaluator.stdDev.toFixed(2)}
                  </p>
                </div>
                {hasBias && (
                  <span
                    title={getEvaluatorTooltip(evaluator.status)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border ${getStatusBadgeClass(evaluator.status)}`}
                  >
                    {evaluator.status}
                  </span>
                )}
              </div>
            </div>
            {hasBias && (
              <p className="mt-2 text-[11px] text-slate-500 leading-relaxed pl-7">
                {getEvaluatorTooltip(evaluator.status)}
              </p>
            )}
          </div>
        )
      })}

      {sorted.length === 0 && (
        <p className="text-center text-slate-400 py-8">
          Sin evaluadores en este departamento
        </p>
      )}
    </motion.div>
  )
}

export default BiasDetailModal
