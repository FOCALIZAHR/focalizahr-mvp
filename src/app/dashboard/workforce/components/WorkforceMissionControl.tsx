'use client'

// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE MISSION CONTROL — Gauge + Narrative + CTA
// Patron clonado de ExecutiveMissionControl.tsx
// Gauge: exposicion IA organizacional (siempre cyan)
// CTA: "Ver evidencia" → abre cascada
// src/app/dashboard/workforce/components/WorkforceMissionControl.tsx
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { ArrowRight, Cpu } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import type { WorkforceDiagnosticData } from '../types/workforce.types'

// ═══════════════════════════════════════════════════════════════════════
// EXPOSURE GAUGE (always cyan — FocalizaHR identity)
// ═══════════════════════════════════════════════════════════════════════

const CYAN = '#22D3EE'

function ExposureGauge({ score }: { score: number }) {
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
          Exposicion IA
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export interface WorkforceMissionControlProps {
  data: WorkforceDiagnosticData
  onStartCascade: () => void
}

export default function WorkforceMissionControl({
  data,
  onStartCascade,
}: WorkforceMissionControlProps) {
  const router = useRouter()

  const exposureScore = Math.round(data.exposure.avgExposure * 100)
  const hasMappings = data.headcountExpuestos > 0

  // Cantidad total de hallazgos
  const cantidadHallazgos =
    data.zombies.count +
    data.flightRisk.count +
    data.redundancy.pairs.length +
    data.adoptionRisk.departments.length +
    data.seniorityCompression.opportunities.length

  // ── Fallback: sin OccupationMapping ──────────────────────────────────
  if (!hasMappings) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 220, damping: 30 }}
        className="flex flex-col items-center gap-6 w-full max-w-4xl px-4"
      >
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">
            Planificacion de Fuerza de Trabajo
          </h1>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
            Modulo de Inteligencia IA
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
            <Cpu className="w-10 h-10 text-slate-600" />
          </div>
          <div className="text-center max-w-sm">
            <h2 className="text-xl font-bold text-white mb-2">
              Clasifica tus cargos para activar el diagnostico
            </h2>
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">
              El modulo necesita que los cargos de tu organizacion esten clasificados para calcular la exposicion a la automatizacion.
            </p>
          </div>
          <PrimaryButton
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => router.push('/dashboard/descriptores')}
          >
            Clasificar cargos
          </PrimaryButton>
        </div>
      </motion.div>
    )
  }

  // ── Estado normal: con datos ─────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="flex flex-col items-center gap-6 w-full max-w-4xl px-4"
    >
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">
          Planificacion de Fuerza de Trabajo
        </h1>
        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          Inteligencia IA Organizacional
        </p>
      </div>

      {/* Gauge + Narrative */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full">
        <ExposureGauge score={exposureScore} />

        <div className="flex flex-col items-center md:items-start max-w-sm text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold mb-2 text-cyan-400">
            {exposureScore}% de exposicion a la automatizacion
          </h2>
          <p className="text-sm text-slate-400 mb-5 leading-relaxed">
            Tu organizacion opera con {exposureScore}% de exposicion a la automatizacion.
            {cantidadHallazgos > 0
              ? ` ${cantidadHallazgos} situaciones requieren atencion.`
              : ' Sin hallazgos criticos detectados.'
            }
          </p>

          <PrimaryButton
            icon={ArrowRight}
            iconPosition="right"
            onClick={onStartCascade}
          >
            Ver evidencia
          </PrimaryButton>
        </div>
      </div>
    </motion.div>
  )
}
