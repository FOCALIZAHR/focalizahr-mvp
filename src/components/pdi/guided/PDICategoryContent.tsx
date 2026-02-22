'use client'

// ════════════════════════════════════════════════════════════════════════════
// PDI CATEGORY CONTENT - Wrapper for PDIWizardCard per category
// src/components/pdi/guided/PDICategoryContent.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Home } from 'lucide-react'
import PDIWizardCard from '../PDIWizardCard'
import type { WizardSuggestion, EditedGoal } from '../PDIWizardCard'
import type { EnrichedGap, Category } from './types'
import { CATEGORY_CONFIG } from './types'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface PDICategoryContentProps {
  category: Category
  gaps: EnrichedGap[]
  suggestions: WizardSuggestion[]
  pdiGoals: any[]
  onBack: () => void
  onBackToHub: () => void
  onAddGoal: (edited: EditedGoal) => void
  onUpdateGoal: (goalId: string, updates: { title?: string; targetOutcome?: string }) => void
  onCategoryComplete: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function PDICategoryContent({
  category,
  gaps,
  suggestions,
  pdiGoals,
  onBack,
  onBackToHub,
  onAddGoal,
  onUpdateGoal,
  onCategoryComplete
}: PDICategoryContentProps) {

  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  const config = CATEGORY_CONFIG[category]

  const handleNext = useCallback((edited: EditedGoal) => {
    onAddGoal(edited)

    if (currentIndex < gaps.length - 1) {
      setDirection(1)
      setCurrentIndex(prev => prev + 1)
    } else {
      onCategoryComplete()
    }
  }, [currentIndex, gaps.length, onAddGoal, onCategoryComplete])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex(prev => prev - 1)
    } else {
      onBack()
    }
  }, [currentIndex, onBack])

  if (!gaps[currentIndex] || !suggestions[currentIndex]) {
    return null
  }

  const currentGap = gaps[currentIndex]
  const currentSuggestion = suggestions[currentIndex]
  const goalId = pdiGoals.find(
    (g: any) => g.competencyCode === currentGap.competencyCode
  )?.id || `gap-${currentIndex}`

  return (
    <motion.div
      key={`content-${category}`}
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 p-6 md:p-8 flex flex-col"
    >
      {/* Navigation header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <button
          onClick={onBackToHub}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <Home className="w-4 h-4" />
          Hub
        </button>
      </div>

      {/* Category + progress indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {currentIndex + 1} de {gaps.length}
        </span>
      </div>

      {/* PDIWizardCard */}
      <div className="flex-1">
        <AnimatePresence mode="wait" custom={direction}>
          <PDIWizardCard
            key={`${category}-gap-${currentIndex}`}
            gap={currentGap}
            suggestion={currentSuggestion}
            goalId={goalId}
            currentIndex={currentIndex}
            totalCount={gaps.length}
            direction={direction}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onUpdateGoal={(updates) => onUpdateGoal(goalId, updates)}
          />
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      {gaps.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {gaps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? 'scale-125' : 'opacity-30'
              }`}
              style={{ backgroundColor: i === currentIndex ? config.color : '#64748B' }}
            />
          ))}
        </div>
      )}

    </motion.div>
  )
})
