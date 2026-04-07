'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTORES PORTADA — Layer 0: La Misión
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton'
import type { DescriptorSummary } from '@/lib/services/JobDescriptorService'

interface DescriptoresPortadaProps {
  summary: DescriptorSummary
  onStart: () => void
  onRefresh?: () => void
}

export default memo(function DescriptoresPortada({ summary, onStart, onRefresh }: DescriptoresPortadaProps) {
  const [classifying, setClassifying] = useState(false)
  const [classifyResult, setClassifyResult] = useState<string | null>(null)

  const matchRate = summary.totalPositions > 0
    ? Math.round(((summary.confirmed + summary.draft) / summary.totalPositions) * 100)
    : 0

  async function handleClassifyAll() {
    setClassifying(true)
    setClassifyResult(null)
    try {
      const res = await fetch('/api/descriptors/classify-all', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setClassifyResult(json.data.message)
        onRefresh?.()
      } else {
        setClassifyResult(`Error: ${json.error}`)
      }
    } catch {
      setClassifyResult('Error de conexión.')
    } finally {
      setClassifying(false)
    }
  }

  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="px-6 py-14 md:px-10 md:py-20 flex flex-col items-center text-center">
        {/* Título split */}
        <div className="mb-10">
          <h2 className="text-3xl font-extralight text-white tracking-tight leading-tight">
            Descriptores
          </h2>
          <p className="text-2xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">
            Inteligentes
          </p>
        </div>

        {/* Hero number: total cargos únicos */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[72px] font-extralight text-white leading-[0.9] tabular-nums"
        >
          {summary.totalPositions}
        </motion.p>

        {/* Narrativa */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-lg mt-6"
        >
          <p className="text-base font-light text-slate-400 leading-relaxed">
            cargos únicos en tu organización.
          </p>
          <p className="text-sm font-light text-slate-500 leading-relaxed mt-3">
            Sin un descriptor validado, evalúas contra un estándar que nadie acordó.
            FocalizaHR mapeó el {matchRate}% de tus cargos usando inteligencia de mercado.
            Solo necesitas confirmar lo que sobra.
          </p>
        </motion.div>

        {/* Métricas sutiles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-6 mt-8"
        >
          {summary.pending > 0 && (
            <div className="fhr-card px-4 py-2.5">
              <span className="text-amber-400 font-mono text-lg font-extralight">{summary.pending}</span>
              <p className="text-[10px] text-slate-500 mt-0.5">cargos sin descriptor</p>
            </div>
          )}
          {summary.confirmed > 0 && (
            <div className="fhr-card px-4 py-2.5">
              <span className="text-cyan-400 font-mono text-lg font-extralight">{summary.confirmed}</span>
              <p className="text-[10px] text-slate-500 mt-0.5">descriptores confirmados</p>
            </div>
          )}
        </motion.div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 mt-12">
          <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onStart}>
            Comenzar Validación
          </PrimaryButton>

          {summary.pending > 0 && (
            <SecondaryButton
              icon={Zap}
              onClick={handleClassifyAll}
              disabled={classifying}
            >
              {classifying ? 'Clasificando...' : 'Clasificar todos los cargos'}
            </SecondaryButton>
          )}

          {classifyResult && (
            <p className="text-xs text-cyan-400/80 font-light">{classifyResult}</p>
          )}
        </div>

        {/* Coaching tip */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-slate-600 mt-8"
        >
          ● Ahorro estimado: {Math.round(summary.totalPositions * 2.5)} horas de consultoría
        </motion.p>
      </div>
    </div>
  )
})
