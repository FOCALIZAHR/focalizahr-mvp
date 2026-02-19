// ════════════════════════════════════════════════════════════════════════════
// SELECTION BAR - Barra inferior de selección para asignación bulk
// src/components/goals/team/SelectionBar.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { X, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface SelectionBarProps {
  selectedCount: number
  onClear: () => void
  onAssign: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export const SelectionBar = memo(function SelectionBar({
  selectedCount,
  onClear,
  onAssign,
}: SelectionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 ? (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800"
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 font-medium">{selectedCount}</span>
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium text-sm md:text-base">
                  {selectedCount} {selectedCount === 1 ? 'colaborador seleccionado' : 'colaboradores seleccionados'}
                </p>
                <p className="text-xs text-slate-400 hidden md:block">
                  Listo para asignar metas en grupo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <GhostButton icon={X} onClick={onClear} size="sm">
                <span className="hidden md:inline">Cancelar</span>
              </GhostButton>
              <PrimaryButton icon={Target} onClick={onAssign} size="sm">
                <span className="hidden md:inline">Asignar Metas</span>
                <span className="md:hidden">Asignar</span>
              </PrimaryButton>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800/50"
        >
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-slate-400 text-sm">
              Selecciona colaboradores para asignar metas en grupo
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
