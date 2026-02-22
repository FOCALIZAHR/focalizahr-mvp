'use client'

// ════════════════════════════════════════════════════════════════════════════
// ROLE FIT DISPLAY CARD - FocalizaHR Premium Design
// src/components/performance/RoleFitDisplayCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// DISEÑO: Apple 70% + Tesla 20% + FocalizaHR 10%
// PROTAGONISTA: Narrativa con jerarquía visual
// CONTEXTO: Gauge con glow (30%)
// ACCIÓN: Pregunta coaching del motor
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Target, AlertCircle } from 'lucide-react'
import { getRoleFitClassification } from '@/config/performanceClassification'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface RoleFitData {
  roleFitScore: number
  standardJobLevel?: string
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
  roleFit: RoleFitData | null
  employeeName: string
  variant?: 'full' | 'compact' | 'mini'
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// GAUGE PREMIUM - Con glow real estilo FocalizaHR
// ════════════════════════════════════════════════════════════════════════════

const RoleFitGauge = memo(function RoleFitGauge({ 
  value, 
  color 
}: { 
  value: number
  color: string
}) {
  const circumference = 2 * Math.PI * 38
  const dashOffset = circumference - (circumference * value / 100)

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Track de fondo */}
        <circle
          cx="50" cy="50" r="38"
          fill="none"
          stroke="#1E293B"
          strokeWidth="8"
        />
        {/* Progreso con glow */}
        <motion.circle
          cx="50" cy="50" r="38"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ 
            filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color}50)` 
          }}
        />
      </svg>
      {/* Score centrado */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="text-4xl font-light tabular-nums"
          style={{ 
            color,
            textShadow: `0 0 20px ${color}60, 0 0 40px ${color}30`
          }}
        >
          {value}
        </motion.span>
        <span 
          className="text-sm font-medium"
          style={{ color: `${color}90` }}
        >
          %
        </span>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function RoleFitDisplayCard({
  roleFit,
  employeeName,
  variant = 'full',
  className = ''
}: RoleFitDisplayCardProps) {
  
  const firstName = employeeName.split(' ')[0]

  // ══════════════════════════════════════════════════════════════════════════
  // FALLBACK: roleFit es null
  // ══════════════════════════════════════════════════════════════════════════
  if (!roleFit) {
    return (
      <div
        className={cn(
          'relative bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] overflow-hidden',
          className
        )}
      >
        {/* Línea Tesla apagada */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #475569, transparent)'
          }}
        />

        <div className="p-8">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-4 h-4 text-slate-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Adecuación al Cargo
            </span>
          </div>

          <div className="flex items-start gap-4 py-4">
            <AlertCircle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-400">
                Role Fit no disponible para este ciclo.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Verifica que tenga todas las evaluaciones del proceso.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DATOS DEL MOTOR
  // ══════════════════════════════════════════════════════════════════════════
  const classification = getRoleFitClassification(roleFit.roleFitScore)
  const criticalGaps = roleFit.summary.critical

  // ══════════════════════════════════════════════════════════════════════════
  // VARIANTE MINI
  // ══════════════════════════════════════════════════════════════════════════
  if (variant === 'mini') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium',
          'bg-slate-800/80 border border-slate-700/50',
          className
        )}
      >
        <span 
          className="font-semibold tabular-nums"
          style={{ 
            color: classification.color,
            textShadow: `0 0 8px ${classification.color}50`
          }}
        >
          {roleFit.roleFitScore}%
        </span>
        <span className="text-purple-400 font-medium">{classification.label}</span>
      </span>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VARIANTE COMPACT
  // ══════════════════════════════════════════════════════════════════════════
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'relative bg-[#0F172A]/90 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden',
          className
        )}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${classification.color}, transparent)`,
            boxShadow: `0 0 15px ${classification.color}`
          }}
        />

        <div className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center flex-shrink-0">
              <span 
                className="text-3xl font-light tabular-nums"
                style={{ 
                  color: classification.color,
                  textShadow: `0 0 15px ${classification.color}50`
                }}
              >
                {roleFit.roleFitScore}
                <span className="text-lg">%</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                Role Fit
              </span>
            </div>
            
            {/* Línea Tesla vertical */}
            <div 
              className="w-px h-12 flex-shrink-0"
              style={{ 
                background: `linear-gradient(180deg, transparent, ${classification.color}60, transparent)`,
                boxShadow: `0 0 8px ${classification.color}30`
              }}
            />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300">
                <span className="text-cyan-400 font-medium">{firstName}</span>
                {' tiene un '}
                <span className="text-purple-400 font-semibold">{classification.label}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VARIANTE FULL - Split 30/70, narrativa protagonista
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
      {/* ═══ LÍNEA TESLA SUPERIOR con glow real ═══ */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-10"
        style={{
          background: `linear-gradient(90deg, transparent, ${classification.color}, transparent)`,
          boxShadow: `0 0 20px ${classification.color}, 0 0 40px ${classification.color}40`
        }}
      />

      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Target 
              className="w-4 h-4" 
              style={{ color: classification.color }} 
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Adecuación al Cargo
            </span>
          </div>
          {roleFit.standardJobLevel && (
            <span 
              className="text-[10px] font-medium px-2.5 py-1 rounded-lg border"
              style={{ 
                color: classification.color,
                borderColor: `${classification.color}40`,
                backgroundColor: `${classification.color}10`
              }}
            >
              {roleFit.standardJobLevel}
            </span>
          )}
        </div>

        {/* ═══ CONTENIDO: Split 30/70 ═══ */}
        <div className="flex items-start gap-8">
          
          {/* IZQUIERDA 30% - Gauge como contexto */}
          <div className="flex flex-col items-center flex-shrink-0">
            <RoleFitGauge 
              value={roleFit.roleFitScore} 
              color={classification.color} 
            />
            {/* Categoría debajo del gauge */}
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-3">
              Role Fit
            </span>
          </div>

          {/* LÍNEA TESLA VERTICAL - Separador sutil */}
          <div 
            className="w-px self-stretch flex-shrink-0"
            style={{ 
              background: `linear-gradient(180deg, transparent, ${classification.color}50, ${classification.color}50, transparent)`,
              boxShadow: `0 0 10px ${classification.color}20`
            }}
          />

          {/* DERECHA 70% - Narrativa PROTAGONISTA */}
          <div className="flex-1 min-w-0 py-2">
            {/* TÍTULO - Headline */}
            <p className="text-lg text-slate-200">
              <span className="text-cyan-400 font-semibold">{firstName}</span>
              {' tiene un '}
              <span className="text-purple-400 font-semibold">{classification.label}</span>
              {'.'}
            </p>

            {/* NARRATIVA DEL MOTOR - Punto aparte */}
            {classification.description && (
              <p className="text-slate-300 mt-3 leading-relaxed">
                {classification.description}
              </p>
            )}

            {/* BRECHAS - Si hay */}
            {criticalGaps > 0 && (
              <p className="text-slate-400 mt-3">
                Hay {criticalGaps} competencias críticas que requieren priorización.
              </p>
            )}
          </div>
        </div>

        {/* ═══ PREGUNTA DE COACHING ═══ */}
        {classification.question && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* Línea Tesla sutil separadora */}
            <div
              className="h-px mt-8 mb-6"
              style={{
                background: `linear-gradient(90deg, transparent, ${classification.color}40, transparent)`
              }}
            />

            {/* Coaching limpio */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                Pregunta de Coaching
              </p>
              <p className="text-base text-slate-300 font-medium leading-relaxed">
                {classification.question}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
})