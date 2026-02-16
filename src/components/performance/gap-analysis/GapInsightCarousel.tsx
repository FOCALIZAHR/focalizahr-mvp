'use client'

// ════════════════════════════════════════════════════════════════════════════
// GAP INSIGHT CAROUSEL - Análisis de Brechas nivel Tesla/Apple
// src/components/performance/gap-analysis/GapInsightCarousel.tsx
// ════════════════════════════════════════════════════════════════════════════
// PATRÓN: InsightCarousel.tsx (Cinema Mode)
// FEATURES: Swipe táctil, flechas laterales, nombre destacado cyan
// FILOSOFÍA: Mismo estilo que Alertas, solo cambia el contenido
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Eye, Diamond, Users, CheckCircle2 } from 'lucide-react'
import { formatDisplayName } from '@/lib/utils/formatName'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

type GapType = 'BLIND_SPOT' | 'HIDDEN_STRENGTH' | 'PEER_DISCONNECT'

interface CompetencyScore {
  competencyCode: string
  competencyName: string
  selfScore: number | null
  managerScore: number | null
  peerAvgScore?: number | null
  overallAvgScore: number
}

interface GapInsightCarouselProps {
  competencyScores: CompetencyScore[]
  employeeName: string
  className?: string
}

interface GapInsight {
  competencyName: string
  competencyCode: string
  gapType: GapType
  delta: number
  selfScore: number
  managerScore: number
  insight: string
  question: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE TIPOS DE GAP - Colores SUTILES (no gritones)
// ════════════════════════════════════════════════════════════════════════════

const GAP_CONFIG: Record<GapType, {
  label: string
  icon: typeof Eye
  borderColor: string
  accentClass: string
  description: string
}> = {
  BLIND_SPOT: {
    label: 'Punto Ciego',
    icon: Eye,
    borderColor: '#F59E0B',  // Amber sutil (como "monitorear")
    accentClass: 'text-amber-400',
    description: 'Se percibe más fuerte de lo que observas'
  },
  HIDDEN_STRENGTH: {
    label: 'Talento Oculto',
    icon: Diamond,
    borderColor: '#10B981',  // Emerald sutil (como "fortaleza")
    accentClass: 'text-emerald-400',
    description: 'Tiene más potencial del que reconoce'
  },
  PEER_DISCONNECT: {
    label: 'Percepción Diferenciada',
    icon: Users,
    borderColor: '#A78BFA',  // Purple corporativo
    accentClass: 'text-purple-400',
    description: 'Los pares lo perciben diferente a ti'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

const SWIPE_THRESHOLD = 50

function calculateGapType(
  selfScore: number | null,
  managerScore: number | null,
  peerAvgScore?: number | null
): { type: GapType | null; delta: number } {
  if (selfScore === null || managerScore === null) {
    return { type: null, delta: 0 }
  }

  const selfManagerGap = selfScore - managerScore

  // BLIND_SPOT: Self > Manager + 0.5
  if (selfManagerGap > 0.5) {
    return { type: 'BLIND_SPOT', delta: selfManagerGap }
  }

  // HIDDEN_STRENGTH: Self < Manager - 0.5
  if (selfManagerGap < -0.5) {
    return { type: 'HIDDEN_STRENGTH', delta: Math.abs(selfManagerGap) }
  }

  // PEER_DISCONNECT: |Peer - Manager| > 0.7
  if (peerAvgScore !== null && peerAvgScore !== undefined) {
    const peerManagerGap = Math.abs(peerAvgScore - managerScore)
    if (peerManagerGap > 0.7) {
      return { type: 'PEER_DISCONNECT', delta: peerManagerGap }
    }
  }

  return { type: null, delta: Math.abs(selfManagerGap) }
}

function generateInsight(gapType: GapType, competencyName: string, firstName: string): string {
  const insights: Record<GapType, string[]> = {
    BLIND_SPOT: [
      `${firstName} se percibe más fuerte en ${competencyName.toLowerCase()} de lo que tú observas. Puede estar confundiendo intención con impacto real.`,
      `Hay una brecha entre cómo ${firstName} ve su ${competencyName.toLowerCase()} y tu evaluación. Vale la pena explorar ejemplos concretos.`
    ],
    HIDDEN_STRENGTH: [
      `${firstName} se subestima en ${competencyName.toLowerCase()}. Tú ves más potencial del que reconoce. El reconocimiento explícito puede ayudar.`,
      `Interesante: ${firstName} no reconoce su fortaleza en ${competencyName.toLowerCase()}. Validar su capacidad puede aumentar su confianza.`
    ],
    PEER_DISCONNECT: [
      `Los pares perciben a ${firstName} diferente a ti en ${competencyName.toLowerCase()}. Puede haber contextos donde se comporta distinto.`,
      `Hay diferencias en cómo los pares vs tú ven a ${firstName} en ${competencyName.toLowerCase()}. Explorar estos contextos puede ser revelador.`
    ]
  }

  const options = insights[gapType]
  return options[Math.floor(Math.random() * options.length)]
}

function generateQuestion(gapType: GapType, competencyName: string, firstName: string): string {
  const questions: Record<GapType, string[]> = {
    BLIND_SPOT: [
      `${firstName}, dame un ejemplo concreto de cuando aplicaste ${competencyName.toLowerCase()} recientemente. ¿Qué feedback recibiste?`,
      `¿Cómo evaluarías tu propio desempeño en ${competencyName.toLowerCase()}? ¿Qué te hace sentir seguro/a en esta área?`
    ],
    HIDDEN_STRENGTH: [
      `${firstName}, noto que tienes más capacidad en ${competencyName.toLowerCase()} de la que reconoces. ¿Qué te hace dudar?`,
      `¿Qué necesitarías para sentirte más seguro/a aplicando ${competencyName.toLowerCase()}?`
    ],
    PEER_DISCONNECT: [
      `${firstName}, hay diferencias en cómo te perciben diferentes personas en ${competencyName.toLowerCase()}. ¿Por qué crees que ocurre?`,
      `¿Aplicas ${competencyName.toLowerCase()} de manera diferente según el contexto o las personas?`
    ]
  }

  const options = questions[gapType]
  return options[Math.floor(Math.random() * options.length)]
}

function highlightName(text: string, name: string): React.ReactNode {
  if (!name || !text.includes(name)) return text
  
  const parts = text.split(name)
  return (
    <>
      {parts[0]}
      <span className="font-semibold text-cyan-400">{name}</span>
      {parts.slice(1).join(name)}
    </>
  )
}

function getFirstName(fullName: string): string {
  const formatted = formatDisplayName(fullName)
  return formatted.split(' ')[0]
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GapInsightCarousel({
  competencyScores,
  employeeName,
  className
}: GapInsightCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const firstName = getFirstName(employeeName)

  // Generar insights de brechas (solo las que tienen gap real)
  const gapInsights = useMemo<GapInsight[]>(() => {
    const results: GapInsight[] = []
    
    for (const c of competencyScores) {
      const { type, delta } = calculateGapType(c.selfScore, c.managerScore, c.peerAvgScore)
      
      // Solo incluir si hay gap real (type no es null) y hay scores
      if (type === null || c.selfScore === null || c.managerScore === null) {
        continue
      }

      results.push({
        competencyName: c.competencyName,
        competencyCode: c.competencyCode,
        gapType: type,
        delta,
        selfScore: c.selfScore,
        managerScore: c.managerScore,
        insight: generateInsight(type, c.competencyName, firstName),
        question: generateQuestion(type, c.competencyName, firstName)
      })
    }
    
    // Ordenar por delta descendente
    return results.sort((a, b) => b.delta - a.delta)
  }, [competencyScores, firstName])

  // Navegación
  const handlePrev = useCallback(() => {
    setDirection(-1)
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : gapInsights.length - 1))
  }, [gapInsights.length])

  const handleNext = useCallback(() => {
    setDirection(1)
    setCurrentIndex(prev => (prev < gapInsights.length - 1 ? prev + 1 : 0))
  }, [gapInsights.length])

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

  // Estado vacío - Sin brechas detectadas
  if (gapInsights.length === 0) {
    return (
      <div className={cn(
        'bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] p-10 text-center',
        className
      )}>
        <CheckCircle2 className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
        <p className="text-sm text-slate-300">
          Sin brechas significativas para <span className="font-semibold text-cyan-400">{firstName}</span>
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Las percepciones están mayormente alineadas. ¡Excelente base para tu conversación!
        </p>
      </div>
    )
  }

  const current = gapInsights[currentIndex]
  const config = GAP_CONFIG[current.gapType]
  const Icon = config.icon

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
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Análisis de Brechas
          </span>
        </div>
      </div>

      {/* Contenedor con flechas laterales */}
      <div className="relative flex items-center">
        {/* Flecha izquierda - centrada verticalmente */}
        {gapInsights.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Card Principal */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="relative flex-1 bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] overflow-hidden cursor-grab active:cursor-grabbing"
        >
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
              transition={{ type: 'spring', stiffness: 220, damping: 30 }}
              className="p-8 md:p-10"
            >
              {/* Encabezado: Para tu conversación con... */}
              <p className="text-sm text-slate-400 mb-6">
                Para tu conversación con <span className="font-semibold text-cyan-400">{firstName}</span>
              </p>

              {/* Tipo de Gap + Competencia */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn('w-4 h-4', config.accentClass)} />
                    <span className={cn('text-[10px] font-bold uppercase tracking-wider', config.accentClass)}>
                      {config.label}
                    </span>
                  </div>
                  <h3 className="text-xl font-medium text-white">
                    {current.competencyName}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {config.description}
                  </p>
                </div>

                {/* Scores comparativos - Sutil, no gritón */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <span className="text-xs text-slate-500 block mb-1">Auto</span>
                      <span className="text-lg font-medium text-blue-400">
                        {current.selfScore.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-slate-600">vs</span>
                    <div className="text-center">
                      <span className="text-xs text-slate-500 block mb-1">Tú</span>
                      <span className="text-lg font-medium text-emerald-400">
                        {current.managerScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className={cn('text-xs mt-1', config.accentClass)}>
                    Δ {current.delta.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Separador */}
              <div className="h-px bg-slate-800 mb-6" />

              {/* Insight - con nombre resaltado */}
              <p className="text-base text-slate-300 leading-relaxed mb-8">
                {highlightName(current.insight, firstName)}
              </p>

              {/* Pregunta para 1:1 */}
              <div className="rounded-xl p-5 bg-slate-800/50 border border-slate-700/50">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">
                  Conversa en tu próximo 1:1
                </p>
                <p className="text-base font-medium italic leading-relaxed text-slate-300">
                  "{current.question}"
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Flecha derecha - centrada verticalmente */}
        {gapInsights.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dots */}
      {gapInsights.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {gapInsights.map((gap, idx) => {
            const gapConfig = GAP_CONFIG[gap.gapType]
            return (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1)
                  setCurrentIndex(idx)
                }}
                className={cn(
                  'h-2 rounded-full transition-all duration-200',
                  idx === currentIndex
                    ? 'w-6'
                    : 'w-2 bg-slate-600 hover:bg-slate-500'
                )}
                style={{
                  backgroundColor: idx === currentIndex ? gapConfig.borderColor : undefined
                }}
              />
            )
          })}
          <span className="text-[10px] text-slate-500 ml-3">
            {currentIndex + 1} de {gapInsights.length}
          </span>
        </div>
      )}
    </div>
  )
})