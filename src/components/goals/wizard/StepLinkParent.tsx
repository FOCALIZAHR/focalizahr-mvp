// ════════════════════════════════════════════════════════════════════════════
// STEP LINK PARENT - Paso 5: Alineación a una meta mayor (Gate C)
// src/components/goals/wizard/StepLinkParent.tsx
// ════════════════════════════════════════════════════════════════════════════
// El jefe vincula (opcional) su meta a una Corporativa/Área como REFERENCIA. NO se
// hereda contenido: solo isAligned interno. El peso se mudó a su propio paso (7).
//
// Gate C (mockup "Google", 4.3): al elegir el padre se muestra su contexto real
// ("Mide: ...", que YA viene en el fetch) para que el jefe decida informado, con el
// copy explícito de que su meta sigue siendo suya. Filtrado por la Familia ya elegida.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback, useState, useEffect } from 'react'
import { Link2, Search, X, Target } from 'lucide-react'
import GoalLevelBadge from '../GoalLevelBadge'
import GoalProgressBar from '../GoalProgressBar'
import type { GoalWizardData } from './CreateGoalWizard'

interface StepLinkParentProps {
  data: GoalWizardData
  updateData: (updates: Partial<GoalWizardData>) => void
}

type GoalLevel = 'COMPANY' | 'AREA' | 'INDIVIDUAL'
type GoalStatus = 'NOT_STARTED' | 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED' | 'CANCELLED'

interface ParentGoal {
  id: string
  title: string
  level: GoalLevel
  progress: number
  status: GoalStatus
  description?: string | null // "Mide:" — YA viene en el fetch (Gate 0), antes no se usaba
  targetValue?: number
  unit?: string | null
  family?: string | null
}

export default memo(function StepLinkParent({ data, updateData }: StepLinkParentProps) {
  const [parentGoals, setParentGoals] = useState<ParentGoal[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Niveles padre válidos según el nivel de la meta que se crea.
  const parentLevels: GoalLevel[] =
    data.level === 'INDIVIDUAL' ? ['AREA', 'COMPANY'] : data.level === 'AREA' ? ['COMPANY'] : []

  useEffect(() => {
    if (parentLevels.length === 0) return
    setIsLoading(true)
    const token = localStorage.getItem('focalizahr_token')
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all(
      parentLevels.map((level) =>
        fetch(`/api/goals?level=${level}&status=ON_TRACK,NOT_STARTED`, { headers })
          .then((res) => res.json())
          .then((res) => (res.success ? res.data || [] : []))
          .catch(() => [] as ParentGoal[])
      )
    )
      .then((results) => setParentGoals(results.flat()))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.level])

  // Filtrar por búsqueda + por la Familia ya elegida (reduce el universo — Gate C 4.3).
  const filteredGoals = parentGoals
    .filter((g) => !data.family || !g.family || g.family === data.family)
    .filter((g) => (searchTerm ? g.title.toLowerCase().includes(searchTerm.toLowerCase()) : true))

  const selectedParent = data.parentId ? parentGoals.find((g) => g.id === data.parentId) : null

  const handleSelectParent = useCallback(
    (goal: ParentGoal) => updateData({ parentId: goal.id, parentTitle: goal.title }),
    [updateData]
  )
  const handleClearParent = useCallback(
    () => updateData({ parentId: undefined, parentTitle: undefined }),
    [updateData]
  )

  // Meta corporativa: no puede tener padre (es el Nivel 0).
  if (data.level === 'COMPANY') {
    return (
      <div className="p-6 bg-slate-800/30 rounded-xl text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-500/10 flex items-center justify-center">
          <Target className="w-6 h-6 text-cyan-400" />
        </div>
        <p className="text-slate-300 text-sm">
          Esta es una meta corporativa (Nivel 0). Las demás metas podrán derivar de ella.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Meta seleccionada — con contexto real del padre (mockup "Google") */}
      {data.parentId && data.parentTitle && (
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm p-5">
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)' }}
          />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-sm text-white truncate">Te estás alineando a: {data.parentTitle}</span>
              </div>
              {selectedParent?.description && (
                <p className="text-sm text-slate-400 mt-1">Mide: {selectedParent.description}</p>
              )}
            </div>
            <button onClick={handleClearParent} className="p-1 text-slate-400 hover:text-white transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            💡 Tu meta sigue siendo 100% tuya. Vincularla solo muestra cómo el esfuerzo de tu equipo sostiene este objetivo de la empresa.
          </p>
        </div>
      )}

      {/* Buscador + lista */}
      {!data.parentId && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar meta a la que alinearte..."
              className="fhr-input w-full pl-10"
            />
          </div>

          <div className="space-y-4 max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2">
                <div className="fhr-skeleton h-16 w-full rounded-lg" />
                <div className="fhr-skeleton h-16 w-full rounded-lg" />
              </div>
            ) : filteredGoals.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-4">No se encontraron metas para vincular</p>
            ) : (
              filteredGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleSelectParent(goal)}
                  className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <GoalLevelBadge level={goal.level} />
                    <span className="text-sm text-white truncate">{goal.title}</span>
                  </div>
                  {goal.description && <p className="text-xs text-slate-500 truncate mb-1">Mide: {goal.description}</p>}
                  <GoalProgressBar progress={goal.progress} status={goal.status} size="sm" />
                </button>
              ))
            )}
          </div>

          <p className="text-xs text-slate-500 text-center">Este paso es opcional. Puedes vincularla después.</p>
        </>
      )}
    </div>
  )
})
