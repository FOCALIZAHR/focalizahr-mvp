// ════════════════════════════════════════════════════════════════════════════
// FAMILY / SUBFAMILY PICKER — categoría de la meta (Gate C, punto 5 / 4.6)
// src/components/goals/wizard/FamilySubfamilyPicker.tsx
// ════════════════════════════════════════════════════════════════════════════
// Píldoras de 2 niveles: 4 Familias (Nivel 1) → al elegir una, se despliegan sus
// Subfamilias (Nivel 2, "Otros" siempre al final) con animación suave. Consume el
// catálogo de goalCategories.ts directo — sin endpoint.
//
// SOLO Camino D (metas que escriben su propio KPI): el banco NO lo muestra, la
// categoría se hereda del padre. Estilo: tokens .fhr-*, sin colores ad-hoc.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GoalFamily } from '@prisma/client'
import { cn } from '@/lib/utils'
import {
  GOAL_FAMILY_ORDER,
  GOAL_FAMILY_LABELS,
  GOAL_SUBFAMILIES,
  GOAL_FAMILY_PAIN_POINTS,
} from '@/lib/constants/goalCategories'

// Forma MÍNIMA que el picker necesita — desacoplado de cualquier wizard concreto
// para reusarse en CreateGoalWizard (Camino D) y BulkAssignWizard (crear nueva).
interface CategorizableData {
  family?: GoalFamily
  subfamily?: string
}

interface FamilySubfamilyPickerProps {
  data: CategorizableData
  updateData: (updates: Partial<CategorizableData>) => void
}

export default memo(function FamilySubfamilyPicker({ data, updateData }: FamilySubfamilyPickerProps) {
  const selectedFamily = data.family as GoalFamily | undefined

  const handleFamily = useCallback(
    (family: GoalFamily) => {
      // Cambiar de familia limpia la subfamilia: quedaría huérfana.
      updateData({ family, subfamily: undefined })
    },
    [updateData]
  )
  const handleSubfamily = useCallback(
    (subfamily: string) => updateData({ subfamily }),
    [updateData]
  )

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-slate-300">Categoría de la meta</label>
        <p className="text-xs text-slate-500 mt-0.5">¿A qué contribuye? Ayuda a que aparezca en los reportes correctos.</p>
      </div>

      {/* Nivel 1 — Familias */}
      <div className="flex flex-wrap gap-2">
        {GOAL_FAMILY_ORDER.map((family) => {
          const isSelected = selectedFamily === family
          return (
            <button
              key={family}
              onClick={() => handleFamily(family)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-light border transition-all',
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
              )}
            >
              {GOAL_FAMILY_LABELS[family]}
            </button>
          )
        })}
      </div>

      {/* Nivel 2 — narrativa de la familia + subfamilias */}
      <AnimatePresence>
        {selectedFamily && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden space-y-3"
          >
            {/* Narrativa corta de la familia (4.6) */}
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              {GOAL_FAMILY_PAIN_POINTS[selectedFamily]}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {GOAL_SUBFAMILIES[selectedFamily].map((sub) => {
                const isSelected = data.subfamily === sub
                return (
                  <button
                    key={sub}
                    onClick={() => handleSubfamily(sub)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-light border transition-all',
                      isSelected
                        ? 'bg-purple-500/15 border-purple-400/50 text-purple-200'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                    )}
                  >
                    {sub}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
