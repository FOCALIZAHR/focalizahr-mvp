'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CINEMA SUMMARY ORCHESTRATOR
// Orquestador principal de la vista Cinema Summary
// Integra: Header + Carrusel de Competencias + Panel de Detalle
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CinemaSummaryHeader from '@/components/performance/summary/CinemaSummaryHeader'
import CompetencyCarouselCard from '@/components/performance/summary/CompetencyCarouselCard'
import CompetencyDetailPanel from '@/components/performance/summary/CompetencyDetailPanel'
import type { CinemaSummaryData, CompetencyScoreSummary } from '@/types/evaluator-cinema'

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface CinemaSummaryOrchestratorProps {
  summary: CinemaSummaryData
  /** Contenido custom para inyectar en columna derecha del header */
  rightColumnSlot?: React.ReactNode
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CinemaSummaryOrchestrator({ summary, rightColumnSlot }: CinemaSummaryOrchestratorProps) {
  // ═══════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // ═══════════════════════════════════════════════════════════════════════
  // MEMOIZED DATA
  // ═══════════════════════════════════════════════════════════════════════

  const competencyMap = useMemo(() => {
    if (!summary.competencyScores) return new Map<string, CompetencyScoreSummary>()

    const map = new Map<string, CompetencyScoreSummary>()
    summary.competencyScores.forEach(c => {
      map.set(c.competencyName, c)
    })
    return map
  }, [summary.competencyScores])

  const categories = useMemo(() => {
    return Object.keys(summary.categorizedResponses)
  }, [summary.categorizedResponses])

  const activeCategory = selectedCategory || categories[0] || ''

  const activeResponses = summary.categorizedResponses[activeCategory] || []

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleSelectCategory = useCallback((category: string) => {
    setSelectedCategory(category)
  }, [])

  const handlePrevCategory = useCallback(() => {
    const currentIdx = categories.indexOf(activeCategory)
    const newIdx = currentIdx > 0 ? currentIdx - 1 : categories.length - 1
    setSelectedCategory(categories[newIdx])
  }, [categories, activeCategory])

  const handleNextCategory = useCallback(() => {
    const currentIdx = categories.indexOf(activeCategory)
    const newIdx = currentIdx < categories.length - 1 ? currentIdx + 1 : 0
    setSelectedCategory(categories[newIdx])
  }, [categories, activeCategory])

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0F172A] p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header Cinema */}
        <CinemaSummaryHeader
          evaluatee={summary.evaluatee}
          completedAt={summary.completedAt}
          score={summary.overallScore || summary.averageScore}
          gapAnalysis={summary.gapAnalysis}
          rightColumnSlot={rightColumnSlot}
        />

        {/* Carrusel de Competencias */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            {/* Header de sección con navegación */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Competencias Evaluadas
              </h3>

              {categories.length > 4 && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevCategory}
                    className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                    aria-label="Competencia anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextCategory}
                    className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                    aria-label="Competencia siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Carrusel horizontal */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((category) => {
                const competencyData = competencyMap.get(category)
                const categoryResponses = summary.categorizedResponses[category] || []
                const competencyCode = competencyData?.competencyCode
                  || getCompetencyCodeFromResponses(categoryResponses)

                // Calcular promedio de esta categoría (normalizedScore ya está en escala 1-5)
                const ratings = categoryResponses
                  .map(r => r.rating ?? (r.normalizedScore ? r.normalizedScore : null))
                  .filter((r): r is number => r !== null)
                const avgScore = ratings.length > 0
                  ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                  : 0

                return (
                  <CompetencyCarouselCard
                    key={category}
                    code={competencyCode}
                    name={category}
                    score={avgScore}
                    questionCount={categoryResponses.length}
                    isSelected={category === activeCategory}
                    onClick={() => handleSelectCategory(category)}
                  />
                )
              })}
            </div>

            {/* Indicadores de posición (dots) */}
            {categories.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleSelectCategory(category)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      category === activeCategory
                        ? 'bg-cyan-400'
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                    aria-label={`Ir a ${category}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Panel de Detalle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CompetencyDetailPanel
            responses={activeResponses}
            categoryName={activeCategory}
            avgScore={calculateCategoryAverage(activeResponses)}
          />
        </motion.div>

      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getCompetencyCodeFromResponses(responses: any[]): string {
  if (!responses || responses.length === 0) return 'DEFAULT'
  const withCode = responses.find(r => r.competencyCode)
  return withCode?.competencyCode || 'DEFAULT'
}

function calculateCategoryAverage(responses: any[]): number | null {
  if (!responses || responses.length === 0) return null

  const ratings = responses
    .map(r => r.rating ?? (r.normalizedScore ? r.normalizedScore : null))
    .filter((r): r is number => r !== null)

  if (ratings.length === 0) return null

  return ratings.reduce((a, b) => a + b, 0) / ratings.length
}
