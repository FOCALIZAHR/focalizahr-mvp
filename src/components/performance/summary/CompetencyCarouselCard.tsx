'use client'

// ═══════════════════════════════════════════════════════════════════════════
// COMPETENCY CAROUSEL CARD
// Card 200px para carrusel horizontal de competencias
// Diseño FocalizaHR: Línea Tesla + Colores dinámicos + Score protagonista
// ═══════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare, Users, Target, RefreshCw, Lightbulb,
  Eye, GraduationCap, Scale, Megaphone, TrendingUp, Zap, Star,
  type LucideIcon
} from 'lucide-react'
import { getPerformanceClassification } from '@/config/performanceClassification'
import { cn } from '@/lib/utils'
import type { CompetencyCarouselCardProps } from '@/types/evaluator-cinema'

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS POR COMPETENCIA
// ═══════════════════════════════════════════════════════════════════════════

const COMPETENCY_ICONS: Record<string, LucideIcon> = {
  'CORE-COMM': MessageSquare,
  'CORE-TEAM': Users,
  'CORE-RESULT': Target,
  'CORE-ADAPT': RefreshCw,
  'CORE-INNOV': Lightbulb,
  'LEAD-VISION': Eye,
  'LEAD-DEVELOP': GraduationCap,
  'LEAD-DECISION': Scale,
  'LEAD-INFLUENCE': Megaphone,
  'STRAT-BUSINESS': TrendingUp,
  'STRAT-CHANGE': Zap,
}

function getCompetencyIcon(code: string): LucideIcon {
  return COMPETENCY_ICONS[code] || Star
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export default memo(function CompetencyCarouselCard({
  code,
  name,
  score,
  questionCount,
  isSelected,
  onClick
}: CompetencyCarouselCardProps) {
  const classification = getPerformanceClassification(score)
  const Icon = getCompetencyIcon(code)

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        // ANCHO GRANDE: 200px, altura mínima 140px
        'relative flex-shrink-0 w-[200px] min-h-[140px] p-4 rounded-xl border transition-all duration-200',
        'bg-slate-800/60 backdrop-blur text-left',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',

        isSelected
          ? 'border-cyan-500/50 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
          : 'border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/80'
      )}
      style={{
        borderColor: isSelected ? undefined : `${classification.color}30`
      }}
    >
      {/* Línea Tesla */}
      <div
        className="absolute top-0 left-0 right-0 h-px rounded-t-xl"
        style={{
          background: `linear-gradient(90deg, transparent, ${classification.color}, transparent)`
        }}
      />

      {/* Ícono pequeño en esquina */}
      <div
        className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${classification.color}20` }}
      >
        <Icon
          className="w-4 h-4"
          style={{ color: classification.color }}
        />
      </div>

      {/* Nombre de competencia - 2 líneas máximo */}
      <h4 className="text-sm font-medium text-slate-200 mb-3 line-clamp-2 pr-10">
        {name}
      </h4>

      {/* Score GRANDE - PROTAGONISTA */}
      <div className="text-center mt-2">
        <span
          className="text-3xl font-light tabular-nums"
          style={{ color: classification.color }}
        >
          {score.toFixed(1)}
        </span>
        <span className="text-slate-500 text-sm">/5</span>
      </div>

      {/* Label de clasificación */}
      <p
        className="text-xs text-center mt-2 font-medium"
        style={{ color: classification.color }}
      >
        {classification.label}
      </p>

      {/* Cantidad de preguntas */}
      <p className="text-[10px] text-slate-500 text-center mt-2">
        {questionCount} pregunta{questionCount !== 1 ? 's' : ''}
      </p>

      {/* Indicador de selección */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400"
        />
      )}
    </motion.button>
  )
})
