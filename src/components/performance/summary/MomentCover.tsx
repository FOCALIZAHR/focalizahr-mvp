'use client'

// ════════════════════════════════════════════════════════════════════════════
// MOMENT COVER - Portada Narrativa con Journey Indicator + CTA
// src/components/performance/summary/MomentCover.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { formatDisplayName } from '@/lib/utils/formatName'
import type { Moment, MomentData } from './SummaryHub'

interface MomentCoverProps {
  moment: Moment
  momentData: MomentData
  evaluateeName: string
  onBack: () => void
  onEnter: () => void
}

const MOMENT_NARRATIVES: Record<Moment, {
  getNarrative: (name: string, data: MomentData) => string
  cta: string
  color: string
}> = {
  diagnostico: {
    getNarrative: (name, data) =>
      data.metric
        ? `obtuvo ${data.metric}. Revisa su desempeño detallado.`
        : `tiene resultados listos para revisar.`,
    cta: 'Ver Diagnóstico',
    color: '#22D3EE'
  },
  conversacion: {
    getNarrative: (name, data) =>
      data.metric
        ? `tiene ${data.metric} importantes. Prepara tu próxima conversación con insights específicos.`
        : `tiene resultados listos. Prepara tu próxima conversación.`,
    cta: 'Preparar mi 1:1',
    color: '#A78BFA'
  },
  desarrollo: {
    getNarrative: () =>
      `necesita un plan de crecimiento. Define su camino de desarrollo.`,
    cta: 'Trazar el Futuro',
    color: '#10B981'
  }
}

const MOMENTS_ORDER: Moment[] = ['diagnostico', 'conversacion', 'desarrollo']

export default memo(function MomentCover({
  moment,
  momentData,
  evaluateeName,
  onBack,
  onEnter
}: MomentCoverProps) {

  const firstName = formatDisplayName(evaluateeName, 'short').split(' ')[0]
  const config = MOMENT_NARRATIVES[moment]
  const narrative = config.getNarrative(firstName, momentData)

  return (
    <div className="flex flex-col h-full">

      {/* Botón Volver */}
      <button
        onClick={onBack}
        className="self-start flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-medium mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      {/* Journey Indicator */}
      <div className="flex items-center justify-center gap-0 mb-12">
        <div className="relative flex items-center">

          {/* Línea conectora */}
          <div
            className="absolute top-1/2 left-8 right-8 h-[1px] -translate-y-1/2"
            style={{
              background: 'linear-gradient(90deg, rgba(34,211,238,0.3) 0%, rgba(167,139,250,0.2) 50%, rgba(16,185,129,0.1) 100%)'
            }}
          />

          {MOMENTS_ORDER.map((m, idx) => {
            const isActive = m === moment
            const isPast = MOMENTS_ORDER.indexOf(m) < MOMENTS_ORDER.indexOf(moment)
            const color = MOMENT_NARRATIVES[m].color

            return (
              <div key={m} className="flex items-center">
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-4 h-4 rounded-full border-2 transition-all ${isActive ? 'shadow-lg' : ''}`}
                    style={{
                      backgroundColor: isActive || isPast ? color : '#334155',
                      borderColor: isActive || isPast ? color : '#475569',
                      boxShadow: isActive ? `0 0 12px ${color}50` : 'none'
                    }}
                  />
                  <span
                    className="text-[10px] font-bold mt-2 uppercase tracking-wider"
                    style={{
                      color: isActive || isPast ? color : '#64748B'
                    }}
                  >
                    {m === 'diagnostico' ? 'DIAG' : m === 'conversacion' ? 'CONV' : 'DEV'}
                  </span>
                </div>

                {/* Espaciador entre dots */}
                {idx < MOMENTS_ORDER.length - 1 && (
                  <div className="w-24" />
                )}
              </div>
            )
          })}

        </div>
      </div>

      {/* Narrativa Protagonista */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-3xl font-light text-white leading-relaxed max-w-lg"
        >
          <span className="text-cyan-400 font-medium">{firstName}</span>
          {' '}{narrative}
        </motion.p>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-3 mt-8 pb-4"
      >
        <motion.button
          onClick={onEnter}
          className="flex items-center gap-3 px-8 py-3 rounded-xl font-medium text-base transition-all shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${config.color}, ${config.color}DD)`,
            color: moment === 'diagnostico' ? '#0F172A' : '#FFFFFF',
            boxShadow: `0 8px 24px -6px ${config.color}40`
          }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>{config.cta}</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

    </div>
  )
})
