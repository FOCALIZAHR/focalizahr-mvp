'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTOR VICTORY — Confeti + celebración post-confirmación
// Patrón: VictoryOverlay de Cinema Mode adaptado a descriptores.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton'
import { formatDisplayName } from '@/lib/utils/formatName'

interface DescriptorVictoryProps {
  jobTitle: string
  employeeCount: number
  departmentName: string | null
  onNextJob: () => void
  onHome: () => void
}

export default function DescriptorVictory({
  jobTitle,
  employeeCount,
  departmentName,
  onNextJob,
  onHome,
}: DescriptorVictoryProps) {
  // Confetti burst
  useEffect(() => {
    const duration = 2500
    const end = Date.now() + duration
    const colors = ['#22D3EE', '#A78BFA', '#FFFFFF']

    ;(function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    })()
  }, [])

  return (
    <div className="fhr-card-glass relative overflow-hidden p-8 md:p-12">
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          className="relative mb-8"
        >
          <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.15)]">
            <CheckCircle className="w-10 h-10 text-cyan-400" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-3 -right-3"
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-extralight text-white mb-2"
        >
          Descriptor confirmado
        </motion.h2>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mt-2 rounded-full border border-cyan-500/20 bg-cyan-950/20"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE] animate-pulse" />
          <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest">
            {formatDisplayName(jobTitle, 'full')}
          </span>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 space-y-1"
        >
          <p className="text-sm font-light text-slate-400">
            Este descriptor ahora es el estándar para{' '}
            <span className="text-white">{employeeCount} persona{employeeCount !== 1 ? 's' : ''}</span>
            {departmentName ? ` de ${departmentName}` : ''}.
          </p>
          <p className="text-xs text-slate-600">
            Ahorro estimado: 2.5 horas de consultoría.
          </p>
        </motion.div>

        {/* Tesla divider */}
        <motion.div
          className="w-16 h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent my-10"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        />

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-4"
        >
          <PrimaryButton onClick={onNextJob}>
            Siguiente cargo →
          </PrimaryButton>
          <SecondaryButton onClick={onHome}>
            Volver al catálogo
          </SecondaryButton>
        </motion.div>
      </div>
    </div>
  )
}
