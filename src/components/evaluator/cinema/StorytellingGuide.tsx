'use client'

import { memo, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Star, Eye, Check, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayName } from '@/lib/utils/formatName'

interface StorytellingGuideProps {
  employee: {
    id: string
    displayName: string
    status: string
    avgScore: number | null
    potentialScore: number | null
    potentialLevel: string | null
    assignmentId: string
    participantToken: string | null
  }
  onEvaluate: (token: string) => void
  onEvaluatePotential: () => void
  onViewSummary: (assignmentId: string) => void
}

// ═══════════════════════════════════════════════════════════════════════════════
// NARRATIVAS - Mensajes claros de GUÍA al jefe
// ═══════════════════════════════════════════════════════════════════════════════

type ActionType = 'evaluate' | 'potential' | 'summary'

interface StoryContent {
  prefix: string
  name: string
  suffix: string
  cta: string
  ctaIcon: typeof ArrowRight | typeof Star | typeof Eye
  time: string | null
  action: ActionType
}

function getStoryContent(employee: StorytellingGuideProps['employee']): StoryContent {
  const firstName = formatDisplayName(employee.displayName, 'short').split(' ')[0]
  const hasED = employee.status === 'completed'
  const hasPT = employee.potentialScore !== null

  if (!hasED) {
    return {
      prefix: '',
      name: firstName,
      suffix: ' está esperando tu evaluación de desempeño.',
      cta: 'Comenzar Evaluación',
      ctaIcon: ArrowRight,
      time: '~10 min',
      action: 'evaluate'
    }
  }

  if (!hasPT) {
    return {
      prefix: 'Ya evaluaste a ',
      name: firstName,
      suffix: '. Ahora define su potencial.',
      cta: 'Evaluar Potencial',
      ctaIcon: Star,
      time: '~1 min',
      action: 'potential'
    }
  }

  return {
    prefix: '',
    name: firstName,
    suffix: ' tiene su evaluación completa. Revisa su perfil.',
    cta: 'Ver Resumen Completo',
    ctaIcon: Eye,
    time: null,
    action: 'summary'
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function StorytellingGuide({
  employee,
  onEvaluate,
  onEvaluatePotential,
  onViewSummary
}: StorytellingGuideProps) {
  const hasED = employee.status === 'completed'
  const hasPT = employee.potentialScore !== null

  const story = getStoryContent(employee)

  const handleCTA = () => {
    switch (story.action) {
      case 'evaluate':
        if (employee.participantToken) onEvaluate(employee.participantToken)
        break
      case 'potential':
        onEvaluatePotential()
        break
      case 'summary':
        onViewSummary(employee.assignmentId)
        break
    }
  }

  const isPurpleCTA = story.action === 'potential'

  return (
    <div className="flex flex-col items-center justify-between h-full px-8 py-10">

      {/* 1. ARRIBA: Progress Dots */}
      <div className="mb-16">
        <ProgressDotsMinimal
          hasED={hasED}
          hasPT={hasPT}
          hasPDI={false}
          edScore={employee.avgScore}
          ptScore={employee.potentialScore}
          ptLevel={employee.potentialLevel}
        />
      </div>

      {/* 2. CENTRO: Mensaje Protagonista */}
      <motion.div
        key={employee.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center flex-1 flex items-center"
      >
        <p className="text-3xl md:text-4xl lg:text-5xl font-light text-white leading-tight tracking-tight">
          {story.prefix}
          <span className="text-cyan-400 font-semibold">{story.name}</span>
          {story.suffix}
        </p>
      </motion.div>

      {/* 3. ABAJO: CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-2 mt-16"
      >
        <motion.button
          onClick={handleCTA}
          className={cn(
            "flex items-center justify-center gap-3 py-3 px-8 rounded-xl font-medium text-base transition-all",
            "shadow-xl",
            isPurpleCTA
              ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white shadow-purple-500/25"
              : "bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-900 shadow-cyan-500/25"
          )}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>{story.cta}</span>
          <story.ctaIcon className="w-4 h-4" />
        </motion.button>

        {story.time && (
          <span className="text-xs text-slate-500 font-medium">{story.time}</span>
        )}
      </motion.div>

    </div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Progress Dots Minimalistas con Tooltips
// ═══════════════════════════════════════════════════════════════════════════════

interface ProgressDotsMinimalProps {
  hasED: boolean
  hasPT: boolean
  hasPDI: boolean
  edScore: number | null
  ptScore: number | null
  ptLevel: string | null
}

function ProgressDotsMinimal({
  hasED,
  hasPT,
  hasPDI,
  edScore,
  ptScore,
  ptLevel
}: ProgressDotsMinimalProps) {
  const [hoveredDot, setHoveredDot] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const dots = [
    {
      key: 'ED',
      label: 'Desempeño',
      done: hasED,
      value: hasED ? `${edScore?.toFixed(1) || '-'} · Completado` : 'Pendiente'
    },
    {
      key: 'PT',
      label: 'Potencial',
      done: hasPT,
      value: hasPT ? `${ptScore?.toFixed(1) || '-'} · ${ptLevel || 'Asignado'}` : 'Pendiente'
    },
    {
      key: 'PDI',
      label: 'Plan de Desarrollo',
      done: hasPDI,
      value: hasPDI ? 'Creado' : 'Pendiente'
    }
  ]

  const handleMouseEnter = (key: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 12
    })
    setHoveredDot(key)
  }

  const activeDot = hoveredDot ? dots.find(d => d.key === hoveredDot) : null

  return (
    <>
      <div className="relative flex items-center justify-center gap-16">
        {/* Línea slate conectora */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-44 h-px bg-gradient-to-r from-slate-700/20 via-slate-600/30 to-slate-700/20" />
        {dots.map((dot) => (
          <div
            key={dot.key}
            className="flex items-center gap-2 cursor-default select-none"
            onMouseEnter={(e) => handleMouseEnter(dot.key, e)}
            onMouseLeave={() => setHoveredDot(null)}
          >
            <div className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300",
              dot.done
                ? "bg-purple-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]"
                : "bg-slate-700"
            )} />

            <span className={cn(
              "text-xs font-medium tracking-wide",
              dot.done ? "text-slate-300" : "text-slate-600"
            )}>
              {dot.key}
            </span>
          </div>
        ))}
      </div>

      {/* TOOLTIP CON PORTAL */}
      {mounted && createPortal(
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'none',
            opacity: hoveredDot ? 1 : 0,
            transition: 'opacity 0.15s ease-out'
          }}
        >
          {activeDot && (
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-2xl min-w-[160px]">
              {/* Tesla line */}
              <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {activeDot.done ? (
                    <Check className="w-3.5 h-3.5 text-purple-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span className={cn(
                    "text-xs font-medium",
                    activeDot.done ? "text-slate-200" : "text-slate-500"
                  )}>
                    {activeDot.label}
                  </span>
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  activeDot.done ? "text-purple-400" : "text-slate-600"
                )}>
                  {activeDot.value}
                </span>
              </div>

              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2
                border-4 border-transparent border-t-slate-950" />
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
