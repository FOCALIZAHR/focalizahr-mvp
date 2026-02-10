'use client'

// ════════════════════════════════════════════════════════════════════════════
// FACTOR EVALUATOR - Selector de nivel (v3 Final - Balanced)
// src/components/potential/FactorEvaluator.tsx
// ════════════════════════════════════════════════════════════════════════════
// JERARQUÍA VISUAL:
// 1. PROTAGONISTAS: Indicadores conductuales (centro, breathing room)
// 2. SECUNDARIO: Círculos de nivel (pequeños, discretos, abajo)
// 3. CONTEXTO: Header compacto (identidad sin dominar)
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { FactorEvaluatorProps, FactorLevel } from '@/types/potential'

// ════════════════════════════════════════════════════════════════════════════
// LEVEL CIRCLE - Círculos discretos, NO protagonistas
// ════════════════════════════════════════════════════════════════════════════

interface LevelCircleProps {
  level: FactorLevel
  label: string
  isSelected: boolean
  color: string
  colorGlow: string
  onSelect: () => void
}

const LevelCircle = memo(function LevelCircle({
  level,
  label,
  isSelected,
  color,
  colorGlow,
  onSelect
}: LevelCircleProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Círculo pequeño - NO protagonista */}
      <motion.button
        onClick={onSelect}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          // Círculo PEQUEÑO y discreto
          "relative w-11 h-11 md:w-12 md:h-12",
          "rounded-full cursor-pointer transition-all duration-300",
          "flex items-center justify-center",
          "border",
          isSelected
            ? "border-opacity-100 bg-opacity-20"
            : "border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60"
        )}
        style={{
          borderColor: isSelected ? color : undefined,
          backgroundColor: isSelected ? `${color}15` : undefined,
          boxShadow: isSelected ? `0 0 15px ${colorGlow}` : undefined
        }}
      >
        <span 
          className={cn(
            "text-lg font-medium transition-colors duration-300",
            isSelected ? "text-white" : "text-slate-500"
          )}
        >
          {level}
        </span>
      </motion.button>

      {/* Label muy pequeño */}
      <span
        className={cn(
          "text-[9px] font-medium uppercase tracking-wider transition-colors duration-300",
          isSelected ? "" : "text-slate-600"
        )}
        style={{ color: isSelected ? color : undefined }}
      >
        {label}
      </span>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// INDICATORS LIST
// ════════════════════════════════════════════════════════════════════════════

interface IndicatorsListProps {
  indicators: string[]
  color: string
}

const IndicatorsList = memo(function IndicatorsList({
  indicators,
  color
}: IndicatorsListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.06
          }
        }
      }}
      className="space-y-2.5"
    >
      {indicators.map((indicator, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, x: -10 },
            visible: { opacity: 1, x: 0 }
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex items-start gap-2.5"
        >
          {/* Bullet sutil con color del factor */}
          <div
            className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm text-slate-300 leading-relaxed">
            {indicator}
          </span>
        </motion.div>
      ))}
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function FactorEvaluator({
  factor,
  selectedLevel,
  onLevelSelect,
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
  isLastFactor
}: FactorEvaluatorProps) {
  const Icon = factor.icon
  const selectedLevelData = selectedLevel
    ? factor.levels.find(l => l.value === selectedLevel)
    : null

  const hasSelection = selectedLevel !== null

  return (
    <div className="flex flex-col h-full">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER - Compacto pero con identidad
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-start gap-3 mb-3 pb-3 border-b border-slate-800/30">
        {/* Icono con color del factor */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${factor.color}15` }}
        >
          <Icon
            className="w-5 h-5"
            style={{ color: factor.color }}
            strokeWidth={1.5}
          />
        </div>
        
        {/* Texto */}
        <div className="min-w-0 flex-1">
          <h3 
            className="text-base font-medium mb-0.5"
            style={{ color: factor.color }}
          >
            {factor.name}
          </h3>
          <p className="text-sm text-slate-400 leading-snug">
            {factor.question}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ÁREA PROTAGONISTA - Indicadores conductuales (mucho espacio)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center py-2">
        <AnimatePresence mode="wait">
          {selectedLevelData ? (
            <motion.div
              key={`indicators-${selectedLevel}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Indicadores conductuales - PROTAGONISTAS */}
              <IndicatorsList
                indicators={selectedLevelData.indicators}
                color={factor.color}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <p className="text-sm text-slate-500">
                Selecciona un nivel abajo
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SELECTOR DE NIVELES - Círculos discretos abajo
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="pt-5 mt-auto border-t border-slate-800/30">
        {/* Círculos de nivel estilo encuestas */}
        <div className="flex justify-center items-end gap-4 md:gap-6 mb-3">
          {factor.levels.map((level) => (
            <LevelCircle
              key={level.value}
              level={level.value}
              label={level.label}
              isSelected={selectedLevel === level.value}
              color={factor.color}
              colorGlow={factor.colorGlow}
              onSelect={() => onLevelSelect(level.value)}
            />
          ))}
        </div>

        {/* Descripción del nivel seleccionado */}
        <div className="text-center h-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {selectedLevelData ? (
              <motion.p
                key={`desc-${selectedLevel}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-slate-400"
              >
                {selectedLevelData.shortDescription}
              </motion.p>
            ) : (
              <motion.span
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                className="text-xs text-slate-600"
              >
                Selecciona un nivel
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            BOTONES NAVEGACIÓN - Atrás / Siguiente
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/30">
          {/* Botón Atrás */}
          {canGoPrev ? (
            <button
              onClick={onPrev}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>
          ) : (
            <div /> 
          )}

          {/* Botón Siguiente / Ver Resumen */}
          <button
            onClick={onNext}
            disabled={!hasSelection}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all",
              hasSelection
                ? "bg-cyan-500 hover:bg-cyan-400 text-slate-900"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            )}
          >
            <span>{isLastFactor ? 'Ver Resumen' : 'Siguiente'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
})