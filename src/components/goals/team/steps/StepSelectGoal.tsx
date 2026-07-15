// ════════════════════════════════════════════════════════════════════════════
// STEP 2: SELECT GOAL - Elegir meta base (cascadear o crear nueva)
// src/components/goals/team/steps/StepSelectGoal.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback } from 'react'
import { Link2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import FamilySubfamilyPicker from '@/components/goals/wizard/FamilySubfamilyPicker'
import type { BulkAssignData } from '../BulkAssignWizard'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface StepSelectGoalProps {
  data: BulkAssignData
  updateData: (updates: Partial<BulkAssignData>) => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function StepSelectGoal({
  data,
  updateData,
}: StepSelectGoalProps) {
  const handleSourceChange = useCallback((source: 'cascade' | 'new') => {
    updateData({
      goalSource: source,
      parentGoalId: undefined,
      parentGoalTitle: undefined,
      newGoalTitle: undefined,
      newGoalDescription: undefined,
      // La categoría solo aplica a 'new'; limpiarla al cambiar de origen evita
      // que una familia elegida quede pegada si el jefe vuelve a 'cascade'.
      family: undefined,
      subfamily: undefined,
    })
  }, [updateData])

  return (
    <div className="space-y-6">
      {/* Source toggle */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSourceChange('cascade')}
          className={cn(
            'p-4 rounded-xl border-2 text-left transition-all',
            data.goalSource === 'cascade'
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
          )}
        >
          <Link2 className={cn(
            'w-5 h-5 mb-2',
            data.goalSource === 'cascade' ? 'text-cyan-400' : 'text-slate-500'
          )} />
          <p className="text-white text-sm font-medium">Cascadear</p>
          <p className="text-xs text-slate-400 mt-1">Desde meta de área</p>
        </button>

        <button
          onClick={() => handleSourceChange('new')}
          className={cn(
            'p-4 rounded-xl border-2 text-left transition-all',
            data.goalSource === 'new'
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
          )}
        >
          <Plus className={cn(
            'w-5 h-5 mb-2',
            data.goalSource === 'new' ? 'text-cyan-400' : 'text-slate-500'
          )} />
          <p className="text-white text-sm font-medium">Crear nueva</p>
          <p className="text-xs text-slate-400 mt-1">Meta independiente</p>
        </button>
      </div>

      {/* Cascade (Gate 3·B): la meta del banco se elige en el paso siguiente
          (GoalBankScreen, corporativas + de área). Acá solo se confirma el origen. */}
      {data.goalSource === 'cascade' && (
        <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <p className="text-sm text-slate-400">
            Elegirás la meta del banco (corporativa o de área) en el siguiente paso, con el
            indicador ya consolidado. Solo definirás el peso por persona.
          </p>
        </div>
      )}

      {/* New: title + description */}
      {data.goalSource === 'new' && (
        <div className="space-y-4">
          <div>
            <label className="fhr-label mb-1.5 block">Nombre de la meta</label>
            <input
              type="text"
              value={data.newGoalTitle || ''}
              onChange={e => updateData({ newGoalTitle: e.target.value })}
              placeholder="Ej: Aumentar ventas Q1"
              className="fhr-input w-full"
            />
          </div>
          <div>
            <label className="fhr-label mb-1.5 block">
              ¿Cómo se mide el éxito de esta meta? <span className="text-red-400">*</span>
            </label>
            <textarea
              value={data.newGoalDescription || ''}
              onChange={e => updateData({ newGoalDescription: e.target.value })}
              placeholder="Ej: % de vacantes críticas cerradas en menos de 15 días"
              className="fhr-input w-full min-h-[80px] resize-none"
              rows={3}
            />
          </div>
          {/* Gate 3·A: categoría obligatoria para meta libre (mismo picker que Camino D). */}
          <FamilySubfamilyPicker data={data} updateData={updateData} />
        </div>
      )}
    </div>
  )
})
