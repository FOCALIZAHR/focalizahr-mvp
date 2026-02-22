'use client'

// ════════════════════════════════════════════════════════════════════════════
// PDI HUB - Role Fit Overview + 4 Category Cards
// src/components/pdi/guided/PDIHub.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Target, Zap, TrendingUp, ArrowRight } from 'lucide-react'
import type { Category, EnrichedGap } from './types'
import { CATEGORY_CONFIG } from './types'

const CATEGORY_ICONS = {
  URGENTE: AlertTriangle,
  IMPACTO: Target,
  QUICK_WIN: Zap,
  POTENCIAR: TrendingUp
} as const

interface PDIHubProps {
  employeeName: string
  roleFitScore: number | null
  enrichedGaps: EnrichedGap[]
  onSelectCategory: (category: Category) => void
  onCreatePlan: () => void
}

export default memo(function PDIHub({
  employeeName,
  roleFitScore,
  enrichedGaps,
  onSelectCategory,
  onCreatePlan
}: PDIHubProps) {

  const firstName = employeeName.split(' ')[0]

  const categoryCounts = useMemo(() => ({
    URGENTE: enrichedGaps.filter(g => g.category === 'URGENTE').length,
    IMPACTO: enrichedGaps.filter(g => g.category === 'IMPACTO').length,
    QUICK_WIN: enrichedGaps.filter(g => g.category === 'QUICK_WIN').length,
    POTENCIAR: enrichedGaps.filter(g => g.category === 'POTENCIAR').length
  }), [enrichedGaps])

  const topGap = enrichedGaps.find(g => g.status === 'CRITICAL') || enrichedGaps[0]

  const activeCategories = (Object.keys(CATEGORY_CONFIG) as Category[]).filter(
    cat => categoryCounts[cat] > 0
  )

  return (
    <motion.div
      key="hub"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 p-8 flex flex-col justify-center"
    >
      {/* Main message */}
      <div className="text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-light text-white leading-relaxed">
          <span className="text-cyan-400 font-medium">{firstName}</span>
          {' tiene un Role Fit del '}
          <span className="text-purple-400 font-medium">
            {roleFitScore ?? 0}%
          </span>
        </h1>
      </div>

      {/* Category Cards */}
      <div className={`grid ${activeCategories.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-3 mb-10`}>
        {activeCategories.map((category, idx) => {
          const config = CATEGORY_CONFIG[category]
          const count = categoryCounts[category]
          const Icon = CATEGORY_ICONS[category]

          return (
            <motion.button
              key={category}
              onClick={() => onSelectCategory(category)}
              className="relative p-4 rounded-xl bg-[#0F172A]/60 backdrop-blur-md border border-slate-800 hover:border-slate-700 transition-all text-left"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
            >
              {/* Tesla Line */}
              <div
                className="absolute top-0 left-3 right-3 h-[2px] rounded-t-xl"
                style={{ background: `linear-gradient(90deg, transparent, ${config.color}, transparent)` }}
              />

              {/* Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${config.color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: config.color }} />
              </div>

              {/* Label */}
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: config.color }}>
                {config.label}
              </p>

              {/* Count */}
              <p className="text-lg font-bold text-white">
                {count} {count === 1 ? 'brecha' : 'brechas'}
              </p>

              {/* Description */}
              <p className="text-xs text-slate-500 mt-1">
                {config.description}
              </p>
            </motion.button>
          )
        })}
      </div>

      {/* Top insight */}
      {topGap && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <p className="text-sm text-slate-400">
            <span className="text-slate-300">
              &ldquo;{topGap.competencyName} requiere atenci&oacute;n inmediata&rdquo;
            </span>
          </p>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center"
      >
        <motion.button
          onClick={onCreatePlan}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all"
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Crear Plan de Desarrollo</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>

    </motion.div>
  )
})
