'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION BOARD v2.0 — Patrón G: Guided Intelligence Orchestrator
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationBoard.tsx
// ════════════════════════════════════════════════════════════════════════════
// 3 capas: Hub → Acts → Split
// Hub: CEO ve magnitud + elige perspectiva (Mérito | Bonos | Señales)
// Acts: 2-3 actos narrativos con Hallazgo Focaliza
// Split: Categorías + narrativa izq + personas der
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import type { CorrelationPoint, ManagerGoalsStats } from '../GoalsCorrelation.types'
import CompensationHub from './CompensationHub'
import type { CompensationPath } from './CompensationHub'
import CompensationActs from './CompensationActs'
import CompensationSplit from './CompensationSplit'

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface CompensationBoardProps {
  correlation: CorrelationPoint[]
  byManager: ManagerGoalsStats[]
}

export default memo(function CompensationBoard({ correlation, byManager }: CompensationBoardProps) {
  const [layer, setLayer] = useState<'hub' | 'acts' | 'split'>('hub')
  const [path, setPath] = useState<CompensationPath>('merito')

  const handleSelectPath = useCallback((p: CompensationPath) => {
    setPath(p)
    setLayer('acts')
  }, [])

  const handleHome = useCallback(() => {
    setLayer('hub')
  }, [])

  return (
    <AnimatePresence mode="wait">
      {layer === 'hub' && (
        <motion.div
          key="hub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <CompensationHub
            correlation={correlation}
            onSelectPath={handleSelectPath}
          />
        </motion.div>
      )}

      {layer === 'acts' && (
        <motion.div
          key={`acts-${path}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CompensationActs
            path={path}
            correlation={correlation}
            byManager={byManager}
            onComplete={() => setLayer('split')}
            onBack={handleHome}
            onHome={handleHome}
          />
        </motion.div>
      )}

      {layer === 'split' && (
        <motion.div
          key={`split-${path}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CompensationSplit
            path={path}
            correlation={correlation}
            byManager={byManager}
            onBack={() => setLayer('acts')}
            onHome={handleHome}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
})
