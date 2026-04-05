'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION BOARD v3.0 — Patrón G: Guided Intelligence Orchestrator
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationBoard.tsx
// ════════════════════════════════════════════════════════════════════════════
// 5 capas: Portada → Ranking → Hub → Acts → Split
// Portada: título + dato + consecuencia + CTA único
// Ranking: cards colapsables de gerencia por gravedad (reemplaza modal)
// Hub: CEO elige perspectiva (Mérito | Bonos | Señales)
// Acts: 2-3 actos narrativos con Hallazgo Focaliza
// Split: Categorías + narrativa izq + personas der
// Home SIEMPRE vuelve a Portada
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import type { CorrelationPoint, ManagerGoalsStats } from '../GoalsCorrelation.types'
import type { GerenciaGoalsStatsV2 } from '@/lib/services/GoalsDiagnosticService'
import CompensationPortada from './CompensationPortada'
import CompensationRanking from './CompensationRanking'
import CompensationHub from './CompensationHub'
import type { CompensationPath } from './CompensationHub'
import CompensationActs from './CompensationActs'
import CompensationSplit from './CompensationSplit'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type CompensationLayer = 'portada' | 'ranking' | 'hub' | 'acts' | 'split'

interface CompensationBoardProps {
  correlation: CorrelationPoint[]
  byManager: ManagerGoalsStats[]
  byGerencia: GerenciaGoalsStatsV2[]
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function CompensationBoard({
  correlation,
  byManager,
  byGerencia,
}: CompensationBoardProps) {
  const [layer, setLayer] = useState<CompensationLayer>('portada')
  const [path, setPath] = useState<CompensationPath>('merito')

  const handleSelectPath = useCallback((p: CompensationPath) => {
    setPath(p)
    setLayer('acts')
  }, [])

  // Home SIEMPRE vuelve a Portada
  const handleHome = useCallback(() => {
    setLayer('portada')
  }, [])

  return (
    <AnimatePresence mode="wait">
      {layer === 'portada' && (
        <motion.div
          key="portada"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <CompensationPortada
            correlation={correlation}
            onContinue={() => setLayer('ranking')}
          />
        </motion.div>
      )}

      {layer === 'ranking' && (
        <motion.div
          key="ranking"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <CompensationRanking
            byGerencia={byGerencia}
            byManager={byManager}
            correlation={correlation}
            onContinue={() => setLayer('hub')}
            onBack={() => setLayer('portada')}
            onHome={handleHome}
          />
        </motion.div>
      )}

      {layer === 'hub' && (
        <motion.div
          key="hub"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <CompensationHub
            correlation={correlation}
            onSelectPath={handleSelectPath}
            onHome={handleHome}
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
            onBack={() => setLayer('hub')}
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
