'use client'

// ════════════════════════════════════════════════════════════════════════════
// GAP INSIGHT CAROUSEL v2.0 - Con Motor de Feedback Inteligente
// src/components/performance/gap-analysis/GapInsightCarousel.tsx
// ════════════════════════════════════════════════════════════════════════════
// PATRÓN: InsightCarousel.tsx (Cinema Mode)
// FEATURES: Motor de feedback + Card resumen final + No repite templates
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { 
  ChevronLeft, ChevronRight, Eye, Diamond, Users, CheckCircle2,
  ClipboardList, MessageSquare, Target, Lightbulb
} from 'lucide-react'
import { formatDisplayName } from '@/lib/utils/formatName'
import { cn } from '@/lib/utils'
import { 
  FeedbackIntelligenceService,
  type GapType,
  type GeneratedFeedback,
  type ExecutiveSummary,
  type CompetencySummary
} from '@/lib/services/FeedbackIntelligenceService'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

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
  overallScore?: number
  className?: string
}

interface GapCard {
  type: 'gap'
  competencyName: string
  competencyCode: string
  gapType: GapType
  delta: number
  selfScore: number
  managerScore: number
  feedback: GeneratedFeedback
}

interface SummaryCard {
  type: 'summary'
  summary: ExecutiveSummary
}

type CarouselCard = GapCard | SummaryCard

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE TIPOS DE GAP - Colores SUTILES
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
    borderColor: '#F59E0B',
    accentClass: 'text-amber-400',
    description: 'Se percibe más fuerte de lo que observas'
  },
  HIDDEN_STRENGTH: {
    label: 'Talento Oculto',
    icon: Diamond,
    borderColor: '#10B981',
    accentClass: 'text-emerald-400',
    description: 'Tiene más potencial del que reconoce'
  },
  PEER_DISCONNECT: {
    label: 'Percepción Diferenciada',
    icon: Users,
    borderColor: '#A78BFA',
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

  if (selfManagerGap > 0.5) {
    return { type: 'BLIND_SPOT', delta: selfManagerGap }
  }

  if (selfManagerGap < -0.5) {
    return { type: 'HIDDEN_STRENGTH', delta: Math.abs(selfManagerGap) }
  }

  if (peerAvgScore !== null && peerAvgScore !== undefined) {
    const peerManagerGap = Math.abs(peerAvgScore - managerScore)
    if (peerManagerGap > 0.7) {
      return { type: 'PEER_DISCONNECT', delta: peerManagerGap }
    }
  }

  return { type: null, delta: Math.abs(selfManagerGap) }
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
// COMPONENTE: CARD DE BRECHA
// ════════════════════════════════════════════════════════════════════════════

interface GapCardContentProps {
  card: GapCard
  firstName: string
}

function GapCardContent({ card, firstName }: GapCardContentProps) {
  const config = GAP_CONFIG[card.gapType]
  const Icon = config.icon

  return (
    <div className="p-8 md:p-10">
      {/* Encabezado */}
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
            {card.competencyName}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {config.description}
          </p>
        </div>

        {/* Scores comparativos */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <span className="text-xs text-slate-500 block mb-1">Auto</span>
              <span className="text-lg font-medium text-blue-400">
                {card.selfScore.toFixed(1)}
              </span>
            </div>
            <span className="text-slate-600">vs</span>
            <div className="text-center">
              <span className="text-xs text-slate-500 block mb-1">Tú</span>
              <span className="text-lg font-medium text-emerald-400">
                {card.managerScore.toFixed(1)}
              </span>
            </div>
          </div>
          <p className={cn('text-xs mt-1', config.accentClass)}>
            Δ {card.delta.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Separador */}
      <div className="h-px bg-slate-800 mb-6" />

      {/* Insight del Motor */}
      <p className="text-base text-slate-300 leading-relaxed mb-8">
        {highlightName(card.feedback.insight, firstName)}
      </p>

      {/* Pregunta para 1:1 */}
      <div className="rounded-xl p-5 bg-slate-800/50 border border-slate-700/50">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">
          Conversa en tu próximo 1:1
        </p>
        <p className="text-base font-medium italic leading-relaxed text-slate-300">
          "{card.feedback.question}"
        </p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: CARD DE RESUMEN FINAL (Premium Design)
// ════════════════════════════════════════════════════════════════════════════

interface SummaryCardContentProps {
  summary: ExecutiveSummary
  firstName: string
  totalGaps: number
}

function SummaryCardContent({ summary, firstName, totalGaps }: SummaryCardContentProps) {
  const [showOpening, setShowOpening] = useState(false)

  return (
    <div className="p-8 md:p-10">
      {/* Header compacto */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-full bg-cyan-500/20 flex items-center justify-center">
          <ClipboardList className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Resumen para tu 1:1
          </p>
          <h3 className="text-lg font-medium text-white">
            {firstName}
          </h3>
        </div>
      </div>

      {/* Patrón detectado - Estilo Línea Tesla (sin tarjeta de color) */}
      <div className="relative pl-4 mb-5">
        <div 
          className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full"
          style={{ 
            background: 'linear-gradient(180deg, #F59E0B, #F59E0B)',
            boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)'
          }}
        />
        <p className="text-sm font-medium text-amber-400">
          {summary.headline}
        </p>
      </div>

      {/* Overview - más compacto */}
      <p className="text-sm text-slate-300 leading-relaxed mb-5">
        {highlightName(summary.overview, firstName)}
      </p>

      {/* Prioridades - inline más compacto */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-3.5 h-3.5 text-cyan-400" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Tus 3 Prioridades
          </p>
        </div>
        <div className="space-y-2">
          {summary.priorities.map((priority) => (
            <div 
              key={priority.rank}
              className="flex items-center gap-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-slate-700/80 flex items-center justify-center text-[10px] font-bold text-cyan-400 flex-shrink-0">
                {priority.rank}
              </span>
              <span className="text-sm font-medium text-white">{priority.competency}</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-500">{priority.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tip de Coaching - más sutil */}
      <div className="flex items-start gap-2.5 mb-4 p-3 rounded-lg bg-slate-800/30">
        <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-slate-400 leading-relaxed">
          {summary.coachingTip}
        </p>
      </div>

      {/* Cómo empezar - COLAPSABLE */}
      <div className="border-t border-slate-800 pt-4">
        <button
          onClick={() => setShowOpening(!showOpening)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-400 transition-colors">
              Cómo empezar la conversación
            </span>
          </div>
          <motion.div
            animate={{ rotate: showOpening ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4 text-slate-500 rotate-90" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showOpening && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3">
                <p className="text-sm font-medium italic leading-relaxed text-cyan-300/90">
                  "{summary.openingStatement}"
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GapInsightCarousel({
  competencyScores,
  employeeName,
  overallScore,
  className
}: GapInsightCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const firstName = getFirstName(employeeName)

  // Reset templates usados cuando cambia el empleado
  useEffect(() => {
    FeedbackIntelligenceService.resetUsedTemplates()
  }, [employeeName])

  // Generar cards (brechas + resumen final)
  const cards = useMemo<CarouselCard[]>(() => {
    const gapCards: GapCard[] = []
    const gapSummaries: CompetencySummary[] = []
    
    for (const c of competencyScores) {
      const { type, delta } = calculateGapType(c.selfScore, c.managerScore, c.peerAvgScore)
      
      if (type === null || c.selfScore === null || c.managerScore === null) {
        continue
      }

      // Generar feedback usando el motor
      const feedback = FeedbackIntelligenceService.generateCompetencyFeedback({
        employeeName,
        firstName,
        competencyName: c.competencyName,
        gapType: type,
        selfScore: c.selfScore,
        managerScore: c.managerScore,
        delta,
        overallScore
      })

      gapCards.push({
        type: 'gap',
        competencyName: c.competencyName,
        competencyCode: c.competencyCode,
        gapType: type,
        delta,
        selfScore: c.selfScore,
        managerScore: c.managerScore,
        feedback
      })

      gapSummaries.push({
        competencyCode: c.competencyCode,
        competencyName: c.competencyName,
        gapType: type,
        delta,
        selfScore: c.selfScore,
        managerScore: c.managerScore
      })
    }
    
    // Ordenar por delta descendente
    gapCards.sort((a, b) => b.delta - a.delta)
    gapSummaries.sort((a, b) => b.delta - a.delta)

    // Si hay brechas, agregar card de resumen al final
    if (gapCards.length > 0) {
      const executiveSummary = FeedbackIntelligenceService.generateExecutiveSummary(
        employeeName,
        gapSummaries,
        overallScore
      )

      return [
        ...gapCards,
        { type: 'summary', summary: executiveSummary } as SummaryCard
      ]
    }

    return gapCards
  }, [competencyScores, employeeName, firstName, overallScore])

  // Navegación
  const handlePrev = useCallback(() => {
    setDirection(-1)
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : cards.length - 1))
  }, [cards.length])

  const handleNext = useCallback(() => {
    setDirection(1)
    setCurrentIndex(prev => (prev < cards.length - 1 ? prev + 1 : 0))
  }, [cards.length])

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
  if (cards.length === 0) {
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

  const current = cards[currentIndex]
  const isGapCard = current.type === 'gap'
  const isSummaryCard = current.type === 'summary'

  // Determinar color de línea Tesla
  const borderColor = isGapCard 
    ? GAP_CONFIG[(current as GapCard).gapType].borderColor
    : '#22D3EE' // Cyan para resumen

  // Variantes de animación
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

      {/* Contenedor con flechas */}
      <div className="relative flex items-center">
        {/* Flecha izquierda */}
        {cards.length > 1 && (
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
          {/* Línea Tesla */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px] z-10"
            style={{
              background: `linear-gradient(90deg, transparent, ${borderColor}, transparent)`,
              boxShadow: `0 0 15px ${borderColor}`
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
            >
              {isGapCard && (
                <GapCardContent 
                  card={current as GapCard} 
                  firstName={firstName} 
                />
              )}
              {isSummaryCard && (
                <SummaryCardContent 
                  summary={(current as SummaryCard).summary}
                  firstName={firstName}
                  totalGaps={cards.length - 1}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Flecha derecha */}
        {cards.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dots */}
      {cards.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {cards.map((card, idx) => {
            const dotColor = card.type === 'summary' 
              ? '#22D3EE' 
              : GAP_CONFIG[(card as GapCard).gapType].borderColor
            
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
                  backgroundColor: idx === currentIndex ? dotColor : undefined
                }}
              />
            )
          })}
          <span className="text-[10px] text-slate-500 ml-3">
            {currentIndex + 1} de {cards.length}
          </span>
        </div>
      )}
    </div>
  )
})