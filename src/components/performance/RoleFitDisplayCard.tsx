'use client'

// ════════════════════════════════════════════════════════════════════════════
// ROLE FIT DISPLAY CARD - FocalizaHR Premium Design
// src/components/performance/RoleFitDisplayCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// FILOSOFÍA: Score % como PROTAGONISTA + Narrativa Inteligente
// VARIANTES: full (portada) | compact (cards) | mini (badges)
// USA: getRoleFitClassification del motor existente
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { 
  Target, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles,
  Lightbulb
} from 'lucide-react'
import { getRoleFitClassification } from '@/config/performanceClassification'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface RoleFitData {
  roleFitScore: number        // 0-100%
  standardJobLevel?: string   // COLABORADOR | MANAGER | EJECUTIVO
  gaps?: Array<{
    competencyCode: string
    competencyName: string
    status: 'MATCH' | 'IMPROVE' | 'CRITICAL' | 'EXCEEDS'
  }>
  summary: {
    totalCompetencies: number
    matching: number
    needsImprovement: number
    critical: number
    exceeds: number
  }
}

export interface RoleFitDisplayCardProps {
  roleFit: RoleFitData
  employeeName: string
  variant?: 'full' | 'compact' | 'mini'
  showNarrative?: boolean
  showQuestion?: boolean
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE ESTADOS
// ════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  MATCH: { 
    icon: CheckCircle, 
    color: '#10B981', 
    label: 'Cumple',
    labelShort: '✓'
  },
  IMPROVE: { 
    icon: TrendingUp, 
    color: '#F59E0B', 
    label: 'Desarrollar',
    labelShort: '↗'
  },
  CRITICAL: { 
    icon: AlertTriangle, 
    color: '#EF4444', 
    label: 'Crítico',
    labelShort: '⚠'
  },
  EXCEEDS: { 
    icon: Sparkles, 
    color: '#22D3EE', 
    label: 'Supera',
    labelShort: '⭐'
  }
} as const

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function RoleFitDisplayCard({
  roleFit,
  employeeName,
  variant = 'full',
  showNarrative = true,
  showQuestion = true,
  className = ''
}: RoleFitDisplayCardProps) {
  const classification = getRoleFitClassification(roleFit.roleFitScore)
  const firstName = employeeName.split(' ')[0]

  // Generar narrativa dinámica basada en datos reales
  const narrative = generateNarrative(roleFit, firstName)

  // ══════════════════════════════════════════════════════════════════════════
  // VARIANTE MINI - Badge inline
  // ══════════════════════════════════════════════════════════════════════════
  if (variant === 'mini') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          className
        )}
        style={{
          backgroundColor: `${classification.color}15`,
          color: classification.color,
          border: `1px solid ${classification.color}30`
        }}
      >
        <Target className="w-3 h-3" />
        <span className="font-semibold">{roleFit.roleFitScore}%</span>
        <span className="opacity-80">{classification.labelShort || classification.label}</span>
      </span>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VARIANTE COMPACT - Card pequeña para grids/hub
  // Filosofía: Score protagonista + contexto mínimo
  // ══════════════════════════════════════════════════════════════════════════
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'relative bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden',
          className
        )}
      >
        {/* Línea Tesla */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${classification.color}, transparent)`
          }}
        />

        <div className="p-5">
          {/* Header compacto */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: classification.color }} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Role Fit
              </span>
            </div>
            {roleFit.standardJobLevel && (
              <span className="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
                {roleFit.standardJobLevel}
              </span>
            )}
          </div>

          {/* Score + Label - Protagonista */}
          <div className="flex items-baseline gap-2 mb-3">
            <span
              className="text-4xl font-light tabular-nums"
              style={{ color: classification.color }}
            >
              {roleFit.roleFitScore}
            </span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
          
          {/* Label de clasificación */}
          <p
            className="text-sm font-medium mb-1"
            style={{ color: classification.color }}
          >
            {classification.label}
          </p>
          
          {/* Contexto de brechas */}
          {(roleFit.summary.needsImprovement + roleFit.summary.critical) > 0 ? (
            <p className="text-[11px] text-slate-500 mb-4">
              {roleFit.summary.needsImprovement + roleFit.summary.critical} brecha
              {(roleFit.summary.needsImprovement + roleFit.summary.critical) > 1 ? 's' : ''} detectada
              {(roleFit.summary.needsImprovement + roleFit.summary.critical) > 1 ? 's' : ''}
            </p>
          ) : (
            <p className="text-[11px] text-emerald-400/70 mb-4">
              Sin brechas detectadas
            </p>
          )}

          {/* Mini Badges */}
          <div className="flex gap-1.5 flex-wrap">
            {roleFit.summary.matching > 0 && (
              <StatusBadge status="MATCH" count={roleFit.summary.matching} size="sm" />
            )}
            {roleFit.summary.needsImprovement > 0 && (
              <StatusBadge status="IMPROVE" count={roleFit.summary.needsImprovement} size="sm" />
            )}
            {roleFit.summary.critical > 0 && (
              <StatusBadge status="CRITICAL" count={roleFit.summary.critical} size="sm" />
            )}
            {roleFit.summary.exceeds > 0 && (
              <StatusBadge status="EXCEEDS" count={roleFit.summary.exceeds} size="sm" />
            )}
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VARIANTE FULL - Card completa con narrativa
  // Filosofía: PROTAGONISTA (score) + CONTEXTO (label) + INSIGHT (narrativa)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className={cn(
        'relative bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] overflow-hidden',
        className
      )}
    >
      {/* Línea Tesla Premium - Color dinámico + Glow */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-10"
        style={{
          background: `linear-gradient(90deg, transparent, ${classification.color}, transparent)`,
          boxShadow: `0 0 20px ${classification.color}50`
        }}
      />

      <div className="p-8 md:p-10">
        {/* Header minimalista */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" style={{ color: classification.color }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Adecuación al Cargo
            </span>
          </div>
          {roleFit.standardJobLevel && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50">
              {roleFit.standardJobLevel}
            </span>
          )}
        </div>

        {/* Score Principal - PROTAGONISTA (48-60px según filosofía) */}
        <div className="flex items-center gap-10 mb-8">
          {/* Círculo de Progreso SVG */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Track de fondo */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#1E293B"
                strokeWidth="6"
              />
              {/* Progreso animado con glow */}
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={classification.color}
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 264' }}
                animate={{ 
                  strokeDasharray: `${(roleFit.roleFitScore / 100) * 264} 264` 
                }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ 
                  filter: `drop-shadow(0 0 10px ${classification.color}60)` 
                }}
              />
            </svg>
            
            {/* Score centrado - HEADLINE NUMBER */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="text-4xl md:text-5xl font-light tabular-nums leading-none"
                style={{ color: classification.color }}
              >
                {roleFit.roleFitScore}
              </motion.span>
              <span className="text-xs text-slate-500 mt-1">/100</span>
            </div>
          </div>

          {/* Label + Contexto + Badges */}
          <div className="flex-1 min-w-0">
            {/* Label de clasificación */}
            <p
              className="text-2xl font-medium mb-2"
              style={{ color: classification.color }}
            >
              {classification.label}
            </p>
            
            {/* Descripción corta del motor */}
            {classification.description && (
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                {classification.description}
              </p>
            )}

            {/* Status Badges - Resumen visual */}
            <div className="flex flex-wrap gap-2">
              {roleFit.summary.matching > 0 && (
                <StatusBadge status="MATCH" count={roleFit.summary.matching} />
              )}
              {roleFit.summary.needsImprovement > 0 && (
                <StatusBadge status="IMPROVE" count={roleFit.summary.needsImprovement} />
              )}
              {roleFit.summary.critical > 0 && (
                <StatusBadge status="CRITICAL" count={roleFit.summary.critical} />
              )}
              {roleFit.summary.exceeds > 0 && (
                <StatusBadge status="EXCEEDS" count={roleFit.summary.exceeds} />
              )}
            </div>
          </div>
        </div>

        {/* Divider elegante */}
        {(showNarrative || showQuestion) && (
          <div 
            className="h-px mb-6" 
            style={{
              background: `linear-gradient(90deg, transparent, ${classification.color}30, transparent)`
            }}
          />
        )}

        {/* Narrativa Inteligente - INSIGHT */}
        {showNarrative && narrative && (
          <div className="flex items-start gap-3 mb-5">
            <div 
              className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0"
              style={{ backgroundColor: `${classification.color}60` }}
            />
            <p className="text-sm text-slate-300 leading-relaxed">
              {narrative}
            </p>
          </div>
        )}

        {/* Pregunta de Coaching - ACCIÓN */}
        {showQuestion && classification.question && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70 mb-1">
                Pregunta de Coaching
              </p>
              <p className="text-sm text-slate-300">
                {classification.question}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: STATUS BADGE
// ════════════════════════════════════════════════════════════════════════════

interface StatusBadgeProps {
  status: keyof typeof STATUS_CONFIG
  count: number
  size?: 'sm' | 'md'
}

const StatusBadge = memo(function StatusBadge({ 
  status, 
  count, 
  size = 'md' 
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  if (size === 'sm') {
    return (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
        style={{
          backgroundColor: `${config.color}15`,
          color: config.color
        }}
      >
        <span>{count}</span>
        <span>{config.labelShort}</span>
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${config.color}15`,
        color: config.color,
        border: `1px solid ${config.color}30`
      }}
    >
      <Icon className="w-3 h-3" />
      <span>{count}</span>
      <span className="opacity-80">{config.label}</span>
    </span>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// GENERADOR DE NARRATIVA INTELIGENTE
// ════════════════════════════════════════════════════════════════════════════

function generateNarrative(roleFit: RoleFitData, firstName: string): string {
  const { summary, gaps, roleFitScore } = roleFit
  const totalGaps = summary.needsImprovement + summary.critical

  // Caso: Sin brechas
  if (totalGaps === 0 && summary.exceeds > 0) {
    return `${firstName} supera el perfil esperado para su cargo en ${summary.exceeds} competencia${summary.exceeds > 1 ? 's' : ''}. Es un talento que puede aportar como mentor o líder de proyecto.`
  }

  if (totalGaps === 0) {
    return `${firstName} cumple con todas las competencias esperadas para su cargo. Su perfil está alineado con los requerimientos del puesto.`
  }

  // Construir narrativa basada en datos reales
  let narrative = `${firstName} `

  // Clasificación general
  if (roleFitScore >= 85) {
    narrative += 'tiene un perfil sólido para su cargo. '
  } else if (roleFitScore >= 70) {
    narrative += 'tiene un perfil adecuado con oportunidades de desarrollo. '
  } else if (roleFitScore >= 50) {
    narrative += 'presenta brechas que requieren atención. '
  } else {
    narrative += 'tiene brechas significativas que requieren un plan de acción inmediato. '
  }

  // Detalle de brechas
  if (summary.critical > 0) {
    narrative += `Hay ${summary.critical} competencia${summary.critical > 1 ? 's' : ''} en estado crítico. `
  }

  if (summary.needsImprovement > 0) {
    narrative += `${summary.needsImprovement} competencia${summary.needsImprovement > 1 ? 's requieren' : ' requiere'} desarrollo. `
  }

  // Fortalezas
  if (summary.exceeds > 0 && gaps) {
    const topStrength = gaps.find(g => g.status === 'EXCEEDS')
    if (topStrength) {
      narrative += `Su mayor fortaleza está en ${topStrength.competencyName}.`
    }
  }

  return narrative.trim()
}