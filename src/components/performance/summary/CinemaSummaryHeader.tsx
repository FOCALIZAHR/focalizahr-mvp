'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CINEMA SUMMARY HEADER
// Header estilo Cinema Mode para vista de resumen de evaluación
// Mismo ADN visual que SpotlightCard: Línea Tesla + Split 35/65 + Glassmorphism
// ═══════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDisplayNameFull, getInitials } from '@/lib/utils/formatName'
import { PerformanceResultCard } from '@/components/performance/PerformanceResultCard'
import { getPerformanceClassification } from '@/config/performanceClassification'
import type { CinemaSummaryHeaderProps } from '@/types/evaluator-cinema'

// ═══════════════════════════════════════════════════════════════════════════
// EXTENDED PROPS - Permite inyectar contenido custom en columna derecha
// ═══════════════════════════════════════════════════════════════════════════

interface ExtendedHeaderProps extends CinemaSummaryHeaderProps {
  /** Contenido custom para la columna derecha (reemplaza PerformanceResultCard si se provee) */
  rightColumnSlot?: React.ReactNode
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default memo(function CinemaSummaryHeader({
  evaluatee,
  completedAt,
  score,
  gapAnalysis,
  rightColumnSlot
}: ExtendedHeaderProps) {
  const router = useRouter()

  // Formatear nombre PRIMERO, luego extraer iniciales
  const displayName = formatDisplayNameFull(evaluatee.fullName)
  const initials = getInitials(displayName)

  // Color dinámico de línea Tesla basado en score
  // Score puede venir en 1-5 (overallScore) o 0-100 (averageScore)
  const scoreOn5 = score ? (score <= 5 ? score : score / 20) : null
  const classification = scoreOn5
    ? getPerformanceClassification(scoreOn5)
    : { color: '#10B981' } // Verde default para completado sin score

  // Formatear fecha en español
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="relative bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl flex flex-col md:flex-row overflow-hidden"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          LÍNEA TESLA - Firma visual FocalizaHR
          Color dinámico según clasificación del score
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] z-20"
        style={{
          background: `linear-gradient(90deg, transparent, ${classification.color}, transparent)`,
          boxShadow: `0 0 15px ${classification.color}`
        }}
      />

      {/* Botón Volver al Portal */}
      <button
        onClick={() => router.push('/dashboard/evaluaciones')}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
      >
        <ArrowLeft className="w-3 h-3" /> Portal
      </button>

      {/* ═══════════════════════════════════════════════════════════════════
          COLUMNA IZQUIERDA: Identidad (35%)
          Avatar + Badge completado + Nombre + Cargo
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="w-full md:w-[35%] bg-slate-900/50 p-8 md:p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">

        {/* Avatar con iniciales */}
        <div className="relative mb-6">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-2xl md:text-3xl font-bold text-slate-400 border border-slate-700 shadow-2xl">
            {initials}
          </div>

          {/* Badge estado completado */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              Completada
            </span>
          </div>
        </div>

        {/* Info del evaluado */}
        <div className="text-center mt-2">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1 tracking-tight">
            {displayName}
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            {evaluatee.position || 'Sin cargo'}
          </p>
          <p className="text-[10px] text-slate-600 font-mono mt-2 uppercase tracking-widest">
            {evaluatee.department}
          </p>
          <p className="text-xs text-slate-500 mt-3">
            {formatDate(completedAt)}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          COLUMNA DERECHA: Resultado + Insights (65%)
          Usa rightColumnSlot si se provee, sino PerformanceResultCard default
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="w-full md:w-[65%] p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-[#0F172A] to-[#162032]">

        {/* Si hay slot custom, usarlo. Sino, contenido por defecto */}
        {rightColumnSlot ? (
          rightColumnSlot
        ) : (
          <>
            {/* Score Principal - Usando componente existente */}
            {scoreOn5 !== null && (
              <div className="mb-6">
                <PerformanceResultCard
                  score={scoreOn5 * 20}
                  variant="expanded"
                  className="max-w-sm"
                />
              </div>
            )}

            {/* Gap Insights - Fortalezas y Áreas de Desarrollo */}
            {gapAnalysis && (
              <div className="flex flex-wrap gap-2">
                {gapAnalysis.strengths.slice(0, 2).map((s) => (
                  <span
                    key={s.competencyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  >
                    <span>{'\uD83D\uDD25'}</span>
                    <span>{s.competencyName}</span>
                  </span>
                ))}

                {gapAnalysis.developmentAreas.slice(0, 2).map((d) => (
                  <span
                    key={d.competencyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  >
                    <span>{'\u26A0\uFE0F'}</span>
                    <span>{d.competencyName}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Fallback si no hay score ni gap */}
            {scoreOn5 === null && !gapAnalysis && (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-slate-300">Evaluación completada exitosamente</p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
})
