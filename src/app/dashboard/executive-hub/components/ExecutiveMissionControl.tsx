'use client'

// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE MISSION CONTROL - Gauge + Narrative + CTA
// Patrón clonado de evaluator/cinema/MissionControl.tsx
// Colores: Siempre cyan (#22D3EE) — identidad FocalizaHR
// CTA: PrimaryButton del design system
// src/app/dashboard/executive-hub/components/ExecutiveMissionControl.tsx
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'

// ═══════════════════════════════════════════════════════════════════════
// EXECUTIVE GAUGE (Role Fit ring)
// Always cyan — FocalizaHR identity color
// ═══════════════════════════════════════════════════════════════════════

const CYAN = '#22D3EE'

function ExecutiveGauge({ score }: { score: number }) {
  const size = 240
  const strokeWidth = 10
  const radius = (size / 2) - strokeWidth
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow */}
      <div
        className="absolute rounded-full blur-[50px]"
        style={{ width: size * 0.5, height: size * 0.5, backgroundColor: CYAN, opacity: 0.1 }}
      />

      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(71, 85, 105, 0.3)" strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={CYAN} strokeWidth={strokeWidth} strokeLinecap="round"
          style={{ strokeDasharray: circumference, filter: `drop-shadow(0 0 8px ${CYAN})` }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          className="text-6xl font-black text-white tracking-tighter font-mono"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {score}%
        </motion.span>
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase mt-1 text-cyan-400">
          Role Fit
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export interface ExecutiveMissionControlProps {
  roleFitScore: number
  headline: string
  subheadline: string
  severity: 'ok' | 'warning' | 'critical'
  ctaLabel: string
  ctaDestination: string
  cycleName: string
  onCTA: (destination: string) => void
}

export default function ExecutiveMissionControl({
  roleFitScore,
  headline,
  subheadline,
  severity,
  ctaLabel,
  ctaDestination,
  cycleName,
  onCTA
}: ExecutiveMissionControlProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="flex flex-col items-center gap-6 w-full max-w-4xl px-4"
    >
      {/* Cycle name */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">
          Executive Hub
        </h1>
        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          {cycleName}
        </p>
      </div>

      {/* CONTENEDOR PRINCIPAL - Responsive */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full">
        {/* GAUGE - Protagonista */}
        <ExecutiveGauge score={roleFitScore} />

        {/* NARRATIVE + CTA */}
        <div className="flex flex-col items-center md:items-start max-w-sm text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold mb-2 text-cyan-400">
            {headline}
          </h2>
          <p className="text-sm text-slate-400 mb-5 leading-relaxed">
            {subheadline}
          </p>

          {/* CTA - PrimaryButton del design system */}
          <PrimaryButton
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => onCTA(ctaDestination)}
          >
            {ctaLabel}
          </PrimaryButton>
        </div>
      </div>
    </motion.div>
  )
}
