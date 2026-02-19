// ════════════════════════════════════════════════════════════════════════════
// STEP LINK PARENT - Paso 5: Vincular meta padre (cascada)
// src/components/goals/wizard/StepLinkParent.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback, useState, useEffect } from 'react'
import { Link2, Search, X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import GoalLevelBadge from '../GoalLevelBadge'
import GoalProgressBar from '../GoalProgressBar'
import type { GoalWizardData } from './CreateGoalWizard'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface StepLinkParentProps {
  data: GoalWizardData
  updateData: (updates: Partial<GoalWizardData>) => void
}

type GoalLevel = 'COMPANY' | 'AREA' | 'INDIVIDUAL'
type GoalStatus =
  | 'NOT_STARTED'
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'BEHIND'
  | 'COMPLETED'
  | 'CANCELLED'

interface ParentGoal {
  id: string
  title: string
  level: GoalLevel
  progress: number
  status: GoalStatus
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function StepLinkParent({
  data,
  updateData,
}: StepLinkParentProps) {
  const [parentGoals, setParentGoals] = useState<ParentGoal[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Determinar nivel padre valido
  const parentLevel =
    data.level === 'INDIVIDUAL'
      ? 'AREA'
      : data.level === 'AREA'
        ? 'COMPANY'
        : null

  // Cargar metas padre posibles
  useEffect(() => {
    if (!parentLevel) return

    setIsLoading(true)
    const token = localStorage.getItem('focalizahr_token')

    fetch(`/api/goals?level=${parentLevel}&status=ON_TRACK,NOT_STARTED`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setParentGoals(res.data || [])
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [parentLevel])

  // Filtrar por busqueda
  const filteredGoals = searchTerm
    ? parentGoals.filter((g) =>
        g.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : parentGoals

  const handleSelectParent = useCallback(
    (goal: ParentGoal) => {
      updateData({ parentId: goal.id, parentTitle: goal.title })
    },
    [updateData]
  )

  const handleClearParent = useCallback(() => {
    updateData({ parentId: undefined, parentTitle: undefined })
  }, [updateData])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value)
    },
    []
  )

  const handleWeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateData({ weight: parseFloat(e.target.value) || 0 })
    },
    [updateData]
  )

  // Meta corporativa no puede tener padre
  if (data.level === 'COMPANY') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="fhr-title-card text-xl mb-2">Cascada</h2>
          <p className="text-slate-400 text-sm">
            Las metas corporativas son de nivel superior y no se vinculan a otra
            meta
          </p>
        </div>

        <div className="p-6 bg-slate-800/30 rounded-xl text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-slate-300 text-sm">
            Esta es una meta corporativa (Nivel 0). Las demas metas podran
            derivar de ella.
          </p>
        </div>

        {/* Peso */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300">
            Peso en evaluacion{' '}
            <span className="text-slate-500">(0-100)</span>
          </label>
          <input
            type="number"
            value={data.weight}
            onChange={handleWeightChange}
            min={0}
            max={100}
            className="fhr-input w-full"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="fhr-title-card text-xl mb-2">
          Vincular a meta superior
        </h2>
        <p className="text-slate-400 text-sm">
          Conecta esta meta con una meta de nivel{' '}
          {parentLevel === 'COMPANY' ? 'corporativo' : 'de area'} para
          cascadeo
        </p>
      </div>

      {/* Meta seleccionada */}
      {data.parentId && data.parentTitle && (
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link2 className="w-5 h-5 text-cyan-400 shrink-0" />
            <span className="text-sm text-white truncate">
              {data.parentTitle}
            </span>
          </div>
          <button
            onClick={handleClearParent}
            className="p-1 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Buscador */}
      {!data.parentId && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar meta padre..."
              className="fhr-input w-full pl-10"
            />
          </div>

          {/* Lista de metas */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2">
                <div className="fhr-skeleton h-16 w-full rounded-lg" />
                <div className="fhr-skeleton h-16 w-full rounded-lg" />
              </div>
            ) : filteredGoals.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-4">
                No se encontraron metas de nivel{' '}
                {parentLevel === 'COMPANY' ? 'corporativo' : 'area'}
              </p>
            ) : (
              filteredGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleSelectParent(goal)}
                  className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <GoalLevelBadge level={goal.level} />
                    <span className="text-sm text-white truncate">
                      {goal.title}
                    </span>
                  </div>
                  <GoalProgressBar
                    progress={goal.progress}
                    status={goal.status}
                    size="sm"
                  />
                </button>
              ))
            )}
          </div>

          <p className="text-xs text-slate-500 text-center">
            Este paso es opcional. Puedes vincularla despues.
          </p>
        </>
      )}

      {/* Peso */}
      <div className="space-y-2 pt-4 border-t border-slate-700/50">
        <label className="text-sm text-slate-300">
          Peso en evaluacion{' '}
          <span className="text-slate-500">(0-100)</span>
        </label>
        <input
          type="number"
          value={data.weight}
          onChange={handleWeightChange}
          min={0}
          max={100}
          className="fhr-input w-full"
        />
        <p className="text-xs text-slate-500">
          Define cuanto pesa esta meta en la evaluacion de desempeno del
          colaborador
        </p>
      </div>
    </div>
  )
})
