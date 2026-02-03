// ════════════════════════════════════════════════════════════════════════════
// INSIGHT CAROUSEL - Carrusel de Inteligencia Premium
// src/components/performance/summary/InsightCarousel.tsx
// ════════════════════════════════════════════════════════════════════════════
// PATRONES: SpotlightCard.tsx (Cinema Mode)
// FEATURES: Swipe táctil, flechas laterales centradas, nombre destacado cyan
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Brain } from 'lucide-react'
import {
  getManagementInsights,
  type CompetencyInput,
  type InsightType
} from '@/lib/management-insights'
import { getPerformanceClassification } from '@/config/performanceClassification'
import { formatDisplayName } from '@/lib/utils/formatName'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface InsightCarouselProps {
  competencies: CompetencyInput[]
  employeeName: string
  className?: string
}

interface InsightConfig {
  label: string
  sublabel: string
  borderColor: string
  accentColor: string
  actionLabel: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN - Labels actualizados para mencionar 1:1
// ════════════════════════════════════════════════════════════════════════════

const INSIGHT_CONFIG: Record<InsightType, InsightConfig> = {
  CRITICAL: {
    label: 'ATENCIÓN',
    sublabel: 'Requiere conversación pronto',
    borderColor: '#EF4444',
    accentColor: 'text-red-400',
    actionLabel: 'Pregunta sugerida para tu 1:1'
  },
  STRENGTH: {
    label: 'FORTALEZA',
    sublabel: 'Oportunidad de desarrollo',
    borderColor: '#10B981',
    accentColor: 'text-emerald-400',
    actionLabel: 'Conversa en tu próximo 1:1'
  },
  MONITOR: {
    label: 'MONITOREAR',
    sublabel: 'Seguimiento próximo ciclo',
    borderColor: '#F59E0B',
    accentColor: 'text-amber-400',
    actionLabel: 'Observa y pregunta en 1:1'
  },
  HEALTHY: {
    label: 'SALUDABLE',
    sublabel: 'En buen estado',
    borderColor: '#22D3EE',
    accentColor: 'text-cyan-400',
    actionLabel: 'Reconoce en tu 1:1'
  }
}

// Umbral de swipe en px
const SWIPE_THRESHOLD = 50

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Resaltar nombre en texto
// ════════════════════════════════════════════════════════════════════════════

function highlightName(text: string, name: string): React.ReactNode {
  if (!name || !text.includes(name)) return text
  
  const parts = text.split(name)
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <span className="font-semibold text-cyan-400">{name}</span>
      )}
    </span>
  ))
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function InsightCarousel({
  competencies,
  employeeName,
  className = ''
}: InsightCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const firstName = useMemo(
    () => formatDisplayName(employeeName, 'short'),
    [employeeName]
  )

  // Generar insights y filtrar HEALTHY
  const insights = useMemo(() => {
    const all = getManagementInsights(competencies, firstName)
    return all.filter(i => i.type !== 'HEALTHY')
  }, [competencies, firstName])

  const handlePrev = useCallback(() => {
    setDirection(-1)
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : insights.length - 1))
  }, [insights.length])

  const handleNext = useCallback(() => {
    setDirection(1)
    setCurrentIndex(prev => (prev < insights.length - 1 ? prev + 1 : 0))
  }, [insights.length])

  // Swipe handler
  const handleDragEnd = useCallback((
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      handlePrev()
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      handleNext()
    }
  }, [handlePrev, handleNext])

  // Estado vacío
  if (insights.length === 0) {
    return (
      <div className={cn(
        'bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] p-10 text-center',
        className
      )}>
        <Brain className="w-8 h-8 text-slate-600 mx-auto mb-4" />
        <p className="text-sm text-slate-400">
          Sin alertas para <span className="font-semibold text-cyan-400">{firstName}</span>
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Todas las competencias están en rango saludable.
        </p>
      </div>
    )
  }

  const current = insights[currentIndex]
  const config = INSIGHT_CONFIG[current.type]
  const classification = getPerformanceClassification(current.score)

  // Variantes para animación direccional
  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 })
  }

  return (
    <div className={cn('relative', className)}>
      {/* Header */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Inteligencia de Gestión
          </span>
        </div>
      </div>

      {/* Contenedor con flechas laterales */}
      <div className="relative flex items-center">
        {/* Flecha izquierda - centrada verticalmente */}
        {insights.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Card Principal */}
        <div className="relative flex-1 bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] overflow-hidden">
          {/* Línea Tesla con glow */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px] z-10"
            style={{
              background: `linear-gradient(90deg, transparent, ${config.borderColor}, transparent)`,
              boxShadow: `0 0 15px ${config.borderColor}`
            }}
          />

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="p-10 cursor-grab active:cursor-grabbing"
            >
              {/* Subtítulo */}
              <p className="text-xs text-slate-500 mb-8">
                Para tu conversación con{' '}
                <span className="font-semibold text-cyan-400">{firstName}</span>
              </p>

              {/* Header: Label + Score */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-[0.2em]',
                    config.accentColor
                  )}>
                    {config.label}
                  </span>
                  <h3 className="text-2xl font-light text-white mt-2">
                    {current.competencyName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {config.sublabel}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className="text-5xl font-extralight tabular-nums"
                    style={{ color: config.borderColor }}
                  >
                    {current.score.toFixed(1)}
                  </span>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                    {classification.label}
                  </p>
                </div>
              </div>

              {/* Separador */}
              <div className="h-px bg-slate-800 mb-8" />

              {/* Insight - con nombre resaltado */}
              <p className="text-base text-slate-300 leading-relaxed mb-10">
                {highlightName(current.insight, firstName)}
              </p>

              {/* Acción */}
              <div className="rounded-xl p-5 bg-slate-800/50 border border-slate-700/50">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">
                  {config.actionLabel}
                </p>
                <p className="text-base font-medium italic leading-relaxed text-slate-300">
                  "{current.action}"
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Flecha derecha - centrada verticalmente */}
        {insights.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dots */}
      {insights.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {insights.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1)
                setCurrentIndex(idx)
              }}
              className={cn(
                'h-2 rounded-full transition-all duration-200',
                idx === currentIndex
                  ? 'w-6 bg-cyan-400'
                  : 'w-2 bg-slate-600 hover:bg-slate-500'
              )}
            />
          ))}
          <span className="text-[10px] text-slate-500 ml-3">
            {currentIndex + 1} de {insights.length}
          </span>
        </div>
      )}
    </div>
  )
})