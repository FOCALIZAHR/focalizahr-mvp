'use client'

// ════════════════════════════════════════════════════════════════════════════
// AAE POTENTIAL RENDERER
// src/components/potential/AAEPotentialRenderer.tsx
// ════════════════════════════════════════════════════════════════════════════
// Componente premium para evaluar potencial usando modelo AAE
// Inspirado en CompetencyBehaviorRenderer + filosofía FocalizaHR
// Patrón: Cinema Display + Trinity Cards + Indicadores Conductuales
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, MousePointerClick, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

import { AAE_FACTORS, FACTORS_ORDER, FACTOR_COLORS } from '@/lib/potential-content'
import {
  type AAEPotentialRendererProps,
  type PotentialFactors,
  type FactorKey,
  type FactorLevel,
  areFactorsComplete,
  calculatePotentialScore,
  countCompletedFactors
} from '@/types/potential'
import { scoreToNineBoxLevel, calculate9BoxPosition } from '@/config/performanceClassification'

import TrinityCards from './TrinityCards'
import FactorEvaluator from './FactorEvaluator'
import NineBoxMiniPreview from './NineBoxMiniPreview'

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function AAEPotentialRenderer({
  ratingId,
  employeeName,
  performanceScore,
  existingFactors,
  existingNotes = '',
  onSave,
  onCancel
}: AAEPotentialRendererProps) {
  // ══════════════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════════════

  const [factors, setFactors] = useState<PotentialFactors>(
    existingFactors || {
      aspiration: null,
      ability: null,
      engagement: null
    }
  )

  const [activeFactor, setActiveFactor] = useState<FactorKey | null>(null)
  const [notes, setNotes] = useState(existingNotes)
  const [isSaving, setIsSaving] = useState(false)

  // Derived state
  const isComplete = areFactorsComplete(factors)
  const potentialScore = calculatePotentialScore(factors)
  const completedCount = countCompletedFactors(factors)

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleFactorSelect = useCallback((factor: FactorKey) => {
    setActiveFactor(factor)
  }, [])

  const handleLevelSelect = useCallback((level: FactorLevel) => {
    if (!activeFactor) return

    setFactors(prev => ({
      ...prev,
      [activeFactor]: level
    }))
  }, [activeFactor])

  // Navegación entre factores
  const handleNextFactor = useCallback(() => {
    if (!activeFactor) return
    
    const currentIndex = FACTORS_ORDER.indexOf(activeFactor)
    
    if (currentIndex < FACTORS_ORDER.length - 1) {
      // Ir al siguiente factor
      setActiveFactor(FACTORS_ORDER[currentIndex + 1])
    } else {
      // Último factor → mostrar resumen
      setActiveFactor(null)
    }
  }, [activeFactor])

  const handlePrevFactor = useCallback(() => {
    if (!activeFactor) return
    
    const currentIndex = FACTORS_ORDER.indexOf(activeFactor)
    
    if (currentIndex > 0) {
      setActiveFactor(FACTORS_ORDER[currentIndex - 1])
    }
  }, [activeFactor])

  const handleBackToEdit = useCallback(() => {
    // Volver al último factor para editar
    setActiveFactor(FACTORS_ORDER[FACTORS_ORDER.length - 1])
  }, [])

  const handleSave = useCallback(async () => {
    if (!isComplete) return

    setIsSaving(true)
    try {
      await onSave(factors as PotentialFactors, notes)
    } catch (error) {
      console.error('Error saving potential:', error)
    } finally {
      setIsSaving(false)
    }
  }, [factors, notes, isComplete, onSave])

  // ══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES FOR 9-BOX PREVIEW
  // ══════════════════════════════════════════════════════════════════════════

  const nineBoxPreview = potentialScore
    ? {
        potentialLevel: scoreToNineBoxLevel(potentialScore),
        performanceLevel: scoreToNineBoxLevel(performanceScore),
        position: calculate9BoxPosition(
          scoreToNineBoxLevel(performanceScore),
          scoreToNineBoxLevel(potentialScore)
        )
      }
    : null

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIVE FACTOR CONTENT
  // ══════════════════════════════════════════════════════════════════════════

  const activeFactorContent = activeFactor ? AAE_FACTORS[activeFactor] : null
  const activeFactorColor = activeFactor 
    ? FACTOR_COLORS[activeFactor].primary 
    : '#22D3EE'

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="w-full flex flex-col gap-6">

      {/* ════════════════════════════════════════════════════════════════════
          CINEMA DISPLAY
          ════════════════════════════════════════════════════════════════════ */}
      <div
        className={cn(
          "relative w-full rounded-2xl overflow-hidden",
          "bg-slate-900/80 backdrop-blur-xl",
          "border transition-all duration-500",
          activeFactor
            ? "border-slate-700/50 shadow-xl"
            : isComplete
              ? "border-emerald-500/30 shadow-xl shadow-emerald-900/10"
              : "border-slate-800"
        )}
        style={{
          minHeight: activeFactor ? '320px' : isComplete ? '280px' : '200px'
        }}
      >
        {/* TESLA LINE - Color dinámico según factor activo */}
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden z-10">
          <motion.div
            className="w-full h-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${activeFactorColor}, transparent)`,
              boxShadow: `0 0 15px ${activeFactorColor}`
            }}
            initial={{ x: '-100%' }}
            animate={{
              x: activeFactor || isComplete ? '0%' : '-100%',
              opacity: activeFactor || isComplete ? 1 : 0
            }}
            transition={{ duration: 0.6, ease: 'circOut' }}
          />
        </div>

        {/* WATERMARK - Número del factor o score final */}
        <AnimatePresence mode="popLayout">
          {(activeFactor || isComplete) && (
            <motion.div
              key={activeFactor || 'complete'}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 0.06, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute -bottom-8 -right-4 text-[180px] font-black text-white leading-none tracking-tighter select-none pointer-events-none z-0"
            >
              {isComplete && !activeFactor
                ? potentialScore?.toFixed(1)
                : activeFactor
                  ? FACTORS_ORDER.indexOf(activeFactor) + 1
                  : ''}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTENIDO PRINCIPAL */}
        <div className="relative z-10 w-full h-full flex flex-col px-6 py-6">
          <AnimatePresence mode="wait">

            {/* ═══════════════════════════════════════════════════════════════
                ESTADO CERO - Ningún factor seleccionado, no completado
                ═══════════════════════════════════════════════════════════════ */}
            {!activeFactor && !isComplete && (
              <motion.div
                key="zero-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center h-full py-8 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mb-4">
                  <MousePointerClick className="w-5 h-5 text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm max-w-[280px]">
                  Selecciona un factor para comenzar la evaluación de potencial
                </p>
                <p className="text-slate-600 text-xs mt-2">
                  {completedCount}/3 factores evaluados
                </p>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                ESTADO EVALUANDO - Factor activo seleccionado
                ═══════════════════════════════════════════════════════════════ */}
            {activeFactor && activeFactorContent && (
              <motion.div
                key={`factor-${activeFactor}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
                <FactorEvaluator
                  factor={activeFactorContent}
                  selectedLevel={factors[activeFactor]}
                  onLevelSelect={handleLevelSelect}
                  onNext={handleNextFactor}
                  onPrev={handlePrevFactor}
                  canGoNext={factors[activeFactor] !== null}
                  canGoPrev={FACTORS_ORDER.indexOf(activeFactor) > 0}
                  isLastFactor={FACTORS_ORDER.indexOf(activeFactor) === FACTORS_ORDER.length - 1}
                />
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                ESTADO COMPLETO - Todos los factores evaluados
                ═══════════════════════════════════════════════════════════════ */}
            {isComplete && !activeFactor && (
              <motion.div
                key="complete-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 25 }}
                className="flex flex-col h-full"
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">
                    Evaluación Completa
                  </span>
                </div>

                {/* Score grande - font-light según filosofía */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-5xl font-light text-white mb-1">
                      {potentialScore?.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">
                      Score Potencial
                    </div>
                  </div>

                  {/* Mini resumen de factores */}
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    {FACTORS_ORDER.map(key => {
                      const factor = AAE_FACTORS[key]
                      const value = factors[key]
                      const color = FACTOR_COLORS[key].primary

                      return (
                        <button
                          key={key}
                          onClick={() => handleFactorSelect(key)}
                          className="text-center p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer group"
                        >
                          <div
                            className="text-lg font-bold mb-0.5 group-hover:scale-110 transition-transform"
                            style={{ color }}
                          >
                            {value}
                          </div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-wider">
                            {factor.name}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 9-Box Preview */}
                {nineBoxPreview && (
                  <div className="mb-4">
                    <NineBoxMiniPreview
                      performanceScore={performanceScore}
                      potentialScore={potentialScore}
                    />
                  </div>
                )}

                {/* Notas */}
                <div className="mt-auto">
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                    Notas confidenciales (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Agrega observaciones sobre el potencial de este colaborador..."
                    className={cn(
                      "w-full h-20 px-4 py-3 rounded-xl resize-none",
                      "bg-slate-800/50 border border-slate-700",
                      "text-sm text-slate-300 placeholder:text-slate-600",
                      "focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20",
                      "transition-all"
                    )}
                  />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TRINITY CARDS - Selector de factores
          ════════════════════════════════════════════════════════════════════ */}
      <TrinityCards
        factors={factors}
        activeFactor={activeFactor}
        onFactorSelect={handleFactorSelect}
      />

      {/* ════════════════════════════════════════════════════════════════════
          FOOTER - Botones de acción (cambia según estado)
          ════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        {isComplete && !activeFactor ? (
          // Estado Completo: Editar / Guardar
          <>
            <button
              onClick={handleBackToEdit}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "text-slate-400 hover:text-white",
                "bg-transparent hover:bg-slate-800",
                "border border-slate-700 hover:border-slate-600",
                "transition-all flex items-center gap-2"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Editar
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-semibold",
                "flex items-center gap-2",
                "transition-all",
                "bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/25"
              )}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Guardar Potencial
                </>
              )}
            </button>
          </>
        ) : (
          // Estados Cero/Evaluando: solo Cancelar
          <>
            <button
              onClick={onCancel}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "text-slate-400 hover:text-white",
                "bg-transparent hover:bg-slate-800",
                "border border-slate-700 hover:border-slate-600",
                "transition-all"
              )}
            >
              Cancelar
            </button>
            <div /> {/* Spacer */}
          </>
        )}
      </div>
    </div>
  )
})