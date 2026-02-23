// src/components/ui/GuidedGateway/index.tsx
// ════════════════════════════════════════════════════════════════════════════
// GUIDED GATEWAY - Workspace Asistido
// Diseño: Estilo MissionControl (minimalista, sin borders, centrado)
// Narrativas: Dinámicas desde getRoleFitClassification
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface GuidedGatewayProps {
  /** Título principal */
  title: string
  
  /** Narrativa principal (soporta JSX para nombre en cyan) */
  narrative: React.ReactNode
  
  /** Instrucción / reflexión para el jefe */
  instruction?: React.ReactNode
  
  /** Nota de escape (texto pequeño) */
  escapeNote?: string
  
  /** Texto del CTA principal */
  ctaText: string
  
  /** Handler del CTA principal */
  onCtaClick: () => void
  
  /** CTA secundario (opcional) */
  secondaryCtaText?: string
  
  /** Handler CTA secundario */
  onSecondaryCta?: () => void
  
  /** Indicador de fase activa: 'ED' | 'PT' | 'PDI' */
  activePhase?: 'ED' | 'PT' | 'PDI'
  
  /** Fases completadas */
  completedPhases?: ('ED' | 'PT')[]
  
  /** Clase adicional */
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// INDICADOR DE AVANCE (ED • PT • PDI)
// ════════════════════════════════════════════════════════════════════════════

interface PhaseIndicatorProps {
  activePhase?: 'ED' | 'PT' | 'PDI'
  completedPhases?: ('ED' | 'PT')[]
}

const PhaseIndicator = memo(function PhaseIndicator({ 
  activePhase = 'PDI',
  completedPhases = ['ED', 'PT']
}: PhaseIndicatorProps) {
  const phases = [
    { key: 'ED', label: 'ED', tooltip: 'Evaluación de Desempeño' },
    { key: 'PT', label: 'PT', tooltip: 'Potencial' },
    { key: 'PDI', label: 'PDI', tooltip: 'Plan de Desarrollo' }
  ] as const

  return (
    <div className="flex items-center justify-center gap-6 mb-12">
      {phases.map((phase, idx) => {
        const isCompleted = completedPhases?.includes(phase.key as 'ED' | 'PT')
        const isActive = phase.key === activePhase
        
        return (
          <div key={phase.key} className="flex items-center gap-6">
            <div className="flex items-center gap-2 group relative">
              {/* Dot indicator */}
              <div 
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  isActive && 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]',
                  isCompleted && !isActive && 'bg-cyan-400',
                  !isActive && !isCompleted && 'bg-slate-600'
                )}
              />
              {/* Label */}
              <span 
                className={cn(
                  'text-xs font-medium tracking-wide transition-colors',
                  isActive && 'text-purple-400',
                  isCompleted && !isActive && 'text-cyan-400',
                  !isActive && !isCompleted && 'text-slate-600'
                )}
              >
                {phase.label}
              </span>
              
              {/* Tooltip on hover */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {phase.tooltip}
                </span>
              </div>
            </div>
            
            {/* Connector line */}
            {idx < phases.length - 1 && (
              <div 
                className={cn(
                  'w-8 h-px',
                  isCompleted ? 'bg-cyan-400/50' : 'bg-slate-700'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

const GuidedGateway = memo(function GuidedGateway({
  title,
  narrative,
  instruction,
  escapeNote,
  ctaText,
  onCtaClick,
  secondaryCtaText,
  onSecondaryCta,
  activePhase = 'PDI',
  completedPhases = ['ED', 'PT'],
  className
}: GuidedGatewayProps) {
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className={cn(
        'relative flex flex-col items-center justify-center min-h-[60vh] px-6',
        className
      )}
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* WATERMARK - Sparkles (IA Asistiendo) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-0 right-0 pointer-events-none overflow-hidden">
        <Sparkles 
          className="w-48 h-48 md:w-64 md:h-64 text-purple-500/[0.04]"
          strokeWidth={1}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* INDICADOR DE AVANCE */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <PhaseIndicator 
        activePhase={activePhase}
        completedPhases={completedPhases}
      />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-2xl text-center">
        
        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-light text-white tracking-tight mb-8"
        >
          {title}
        </motion.h1>

        {/* Línea decorativa */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="h-px w-12 bg-white/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <div className="h-px w-12 bg-white/20" />
        </motion.div>

        {/* Narrativa principal */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-lg md:text-xl text-slate-300 leading-relaxed mb-6"
        >
          {narrative}
        </motion.p>

        {/* Instrucción / Reflexión */}
        {instruction && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-base text-slate-400 leading-relaxed mb-8"
          >
            {instruction}
          </motion.p>
        )}

        {/* Nota de escape */}
        {escapeNote && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-sm text-slate-500 mb-8"
          >
            {escapeNote}
          </motion.p>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* CTAs */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-4 mt-10"
        >
          {/* CTA Principal - Estilo cyan sólido */}
          <button
            onClick={onCtaClick}
            className={cn(
              'group relative px-8 py-4 rounded-xl font-medium',
              'bg-cyan-400 text-slate-950',
              'shadow-[0_10px_40px_-10px_rgba(34,211,238,0.3)]',
              'hover:bg-cyan-300 hover:shadow-[0_10px_40px_-5px_rgba(34,211,238,0.4)]',
              'transition-all duration-300 transform hover:-translate-y-0.5',
              'flex items-center gap-3'
            )}
          >
            {ctaText}
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>

          {/* CTA Secundario */}
          {secondaryCtaText && onSecondaryCta && (
            <button
              onClick={onSecondaryCta}
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              {secondaryCtaText}
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════
export default GuidedGateway
export { GuidedGateway }