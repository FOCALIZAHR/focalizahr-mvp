'use client'

// ════════════════════════════════════════════════════════════════════════════
// PDI CATEGORY COVER - Narrative cover per category
// src/components/pdi/guided/PDICategoryCover.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, AlertTriangle, Target, Zap, TrendingUp } from 'lucide-react'
import type { Category, EnrichedGap } from './types'
import { CATEGORY_CONFIG } from './types'

// ════════════════════════════════════════════════════════════════════════════
// CATEGORY ICONS
// ════════════════════════════════════════════════════════════════════════════

const CATEGORY_ICONS = {
  URGENTE: AlertTriangle,
  IMPACTO: Target,
  QUICK_WIN: Zap,
  POTENCIAR: TrendingUp
} as const

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVES PER CATEGORY
// ════════════════════════════════════════════════════════════════════════════

const CATEGORY_NARRATIVES: Record<Category, {
  getTitle: () => string
  getNarrative: (firstName: string, count: number) => ReactNode
  getPreview: (gaps: EnrichedGap[]) => Array<{ icon: string; text: string }>
  cta: string
}> = {
  URGENTE: {
    getTitle: () => 'Brechas Urgentes',
    getNarrative: (firstName, count) => (
      <>
        <span className="text-cyan-400 font-medium">{firstName}</span>
        {' tiene '}
        <span className="text-purple-400 font-medium">{count} competencias</span>
        {' en zona cr\u00EDtica que est\u00E1n impactando su desempe\u00F1o actual.'}
      </>
    ),
    getPreview: (gaps) => gaps.map(g => ({
      icon: '\u26A0\uFE0F',
      text: `${g.competencyName}: ${Math.abs(g.rawGap).toFixed(1)} bajo el target`
    })),
    cta: 'Abordar Brechas Cr\u00EDticas'
  },

  IMPACTO: {
    getTitle: () => 'Alto Impacto',
    getNarrative: (firstName, count) => (
      <>
        <span className="text-cyan-400 font-medium">{firstName}</span>
        {' tiene '}
        <span className="text-purple-400 font-medium">{count} competencias</span>
        {' clave para avanzar al siguiente nivel de su carrera.'}
      </>
    ),
    getPreview: (gaps) => gaps.map(g => ({
      icon: '\uD83C\uDFAF',
      text: `${g.competencyName}: oportunidad de desarrollo`
    })),
    cta: 'Desarrollar Competencias Clave'
  },

  QUICK_WIN: {
    getTitle: () => 'Quick Wins',
    getNarrative: (firstName, count) => (
      <>
        <span className="text-cyan-400 font-medium">{firstName}</span>
        {' puede cerrar '}
        <span className="text-purple-400 font-medium">{count} brechas</span>
        {' r\u00E1pidamente con acciones de alto retorno.'}
      </>
    ),
    getPreview: (gaps) => gaps.map(g => ({
      icon: '\u26A1',
      text: `${g.competencyName}: mejora r\u00E1pida posible`
    })),
    cta: 'Activar Quick Wins'
  },

  POTENCIAR: {
    getTitle: () => 'Fortalezas a Potenciar',
    getNarrative: (firstName, count) => (
      <>
        <span className="text-cyan-400 font-medium">{firstName}</span>
        {' destaca en '}
        <span className="text-purple-400 font-medium">{count} competencias</span>
        {' que puede usar para expandir su influencia.'}
      </>
    ),
    getPreview: (gaps) => gaps.map(g => ({
      icon: '\uD83D\uDC8E',
      text: `${g.competencyName}: +${Math.abs(g.rawGap).toFixed(1)} sobre el target`
    })),
    cta: 'Expandir Fortalezas'
  }
}

const CATEGORY_ORDER: Category[] = ['URGENTE', 'IMPACTO', 'QUICK_WIN', 'POTENCIAR']

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface PDICategoryCoverProps {
  category: Category
  gaps: EnrichedGap[]
  employeeName: string
  allCategories: Category[]
  onBack: () => void
  onEnter: () => void
}

export default memo(function PDICategoryCover({
  category,
  gaps,
  employeeName,
  allCategories,
  onBack,
  onEnter
}: PDICategoryCoverProps) {

  const firstName = employeeName.split(' ')[0]
  const config = CATEGORY_CONFIG[category]
  const narrativeConfig = CATEGORY_NARRATIVES[category]
  const Icon = CATEGORY_ICONS[category]
  const preview = narrativeConfig.getPreview(gaps)
  const visibleCategories = CATEGORY_ORDER.filter(c => allCategories.includes(c))

  return (
    <motion.div
      key={`cover-${category}`}
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 p-8 flex flex-col"
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6 self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al Hub
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 justify-center flex-wrap">
        {visibleCategories.map((cat, idx) => (
          <div key={cat} className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                cat === category ? 'scale-125' : 'opacity-40'
              }`}
              style={{ backgroundColor: CATEGORY_CONFIG[cat].color }}
            />
            <span
              className={`text-[10px] uppercase tracking-wider font-medium ${
                cat === category ? '' : 'text-slate-600'
              }`}
              style={cat === category ? { color: config.color } : undefined}
            >
              {CATEGORY_CONFIG[cat].label}
            </span>
            {idx < visibleCategories.length - 1 && (
              <div className="w-6 h-px bg-slate-700" />
            )}
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
        {/* Category icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 mx-auto"
          style={{ background: `${config.color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color: config.color }} />
        </div>

        {/* Title */}
        <h2
          className="text-2xl font-bold text-center mb-4"
          style={{ color: config.color }}
        >
          {narrativeConfig.getTitle()}
        </h2>

        {/* Narrative */}
        <p className="text-lg text-slate-200 text-center leading-relaxed mb-8">
          {narrativeConfig.getNarrative(firstName, gaps.length)}
        </p>

        {/* Gap preview */}
        <div className="space-y-3 mb-8">
          {preview.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50"
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-sm text-slate-300">{item.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <motion.button
            onClick={onEnter}
            className="flex items-center gap-3 px-6 py-3 rounded-xl font-medium text-white transition-all"
            style={{
              background: `linear-gradient(135deg, ${config.color}, ${config.color}CC)`,
              boxShadow: `0 0 20px ${config.color}30`
            }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{narrativeConfig.cta}</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

    </motion.div>
  )
})
