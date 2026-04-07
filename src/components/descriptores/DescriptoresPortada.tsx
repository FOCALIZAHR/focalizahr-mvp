'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTORES PORTADA — Smart Router Lobby
// Gauge semicircular + CTA dinámico + cards pendientes
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton'
import type { DescriptorSummary, PositionWithStatus } from '@/lib/services/JobDescriptorService'

interface DescriptoresPortadaProps {
  summary: DescriptorSummary
  positions: PositionWithStatus[]
  onRefresh?: () => void
}

// ── Gauge semicircular SVG ──
function GaugeSemiCircle({ percent }: { percent: number }) {
  const clampedPercent = Math.max(0, Math.min(100, percent))
  // Arc length: 251 units for full semicircle
  const progress = (clampedPercent / 100) * 251
  const color = clampedPercent >= 50 ? '#22D3EE' : '#64748B'

  return (
    <div className="relative w-48 mx-auto">
      <svg viewBox="0 0 200 120" className="w-full h-auto">
        {/* Track */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${progress} 251`}
          style={{
            filter: clampedPercent >= 50 ? 'drop-shadow(0 0 6px rgba(34,211,238,0.4))' : 'none',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <span className="text-3xl font-extralight text-white tabular-nums">{clampedPercent}%</span>
        <span className="text-[10px] text-slate-500">completado</span>
      </div>
    </div>
  )
}

export default memo(function DescriptoresPortada({
  summary,
  positions,
  onRefresh,
}: DescriptoresPortadaProps) {
  const router = useRouter()
  const [classifying, setClassifying] = useState(false)
  const [classifyResult, setClassifyResult] = useState<string | null>(null)

  const percent = summary.totalPositions > 0
    ? Math.round((summary.confirmed / summary.totalPositions) * 100)
    : 0

  const pending = positions
    .filter(p => p.descriptorStatus === 'NONE')
    .sort((a, b) => b.employeeCount - a.employeeCount)

  const nextJob = pending[0] ?? null
  const visibleCards = pending.slice(0, 6)
  const hasMore = pending.length > 6

  function navigateToJob(jobTitle: string) {
    router.push(`/dashboard/descriptores/${encodeURIComponent(jobTitle)}`)
  }

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

      <div className="px-6 py-10 md:px-10 md:py-14 space-y-10">
        {/* Title split */}
        <div className="text-center">
          <h2 className="text-3xl font-extralight text-white tracking-tight leading-tight">
            Descriptores
          </h2>
          <p className="text-2xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">
            Inteligentes
          </p>
        </div>

        {/* Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <GaugeSemiCircle percent={percent} />
          <p className="text-center text-xs text-slate-400 font-light mt-2">
            {summary.confirmed} de {summary.totalPositions} cargos validados
          </p>
        </motion.div>

        {/* CTA Dinámico — Tu Misión Ahora */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="fhr-glass-card p-6 text-center space-y-4"
        >
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
            Tu misión ahora
          </p>

          {nextJob ? (
            <>
              <p className="text-base text-slate-300 font-light">
                Validar el descriptor de{' '}
                <span className="text-white font-medium">{nextJob.jobTitle}</span>
                {' '}({nextJob.employeeCount} persona{nextJob.employeeCount !== 1 ? 's' : ''})
              </p>
              <PrimaryButton
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => navigateToJob(nextJob.jobTitle)}
              >
                Comenzar
              </PrimaryButton>
            </>
          ) : (
            <>
              <p className="text-base text-slate-300 font-light">
                Todos los cargos tienen descriptor. Excelente.
              </p>
              <SecondaryButton onClick={() => router.push('/dashboard/descriptores')}>
                Ver catálogo
              </SecondaryButton>
            </>
          )}
        </motion.div>

        {/* Cards de cargos pendientes */}
        {visibleCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
              Cargos pendientes
            </p>

            <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
              {visibleCards.map((pos, idx) => (
                <button
                  key={`${pos.jobTitle}-${idx}`}
                  onClick={() => navigateToJob(pos.jobTitle)}
                  className="flex-shrink-0 w-44 md:w-auto fhr-card p-4 text-left group hover:border-cyan-500/20 transition-all"
                >
                  <p className="text-sm font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
                    {pos.jobTitle}
                  </p>
                  <p className="text-lg font-light text-white mt-1">
                    {pos.employeeCount}
                  </p>
                  <p className="text-[10px] text-slate-500 font-light">
                    persona{pos.employeeCount !== 1 ? 's' : ''}
                    {pos.departmentNames[0] ? ` · ${pos.departmentNames[0]}` : ''}
                  </p>
                </button>
              ))}
            </div>

            {hasMore && (
              <p className="text-xs text-slate-600 text-center mt-3">
                Ver todos ({pending.length})
              </p>
            )}
          </motion.div>
        )}

        {/* Classify all button */}
        {summary.pending > 0 && (
          <div className="flex flex-col items-center gap-2">
            <SecondaryButton
              icon={Zap}
              onClick={handleClassifyAll}
              disabled={classifying}
            >
              {classifying ? 'Clasificando...' : 'Clasificar todos los cargos'}
            </SecondaryButton>
            {classifyResult && (
              <p className="text-xs text-cyan-400/80 font-light">{classifyResult}</p>
            )}
          </div>
        )}

        {/* Coaching tip */}
        <p className="text-xs text-slate-600 text-center">
          ● Ahorro estimado: {Math.round(summary.totalPositions * 2.5)} horas de consultoría
        </p>
      </div>
    </div>
  )
})
