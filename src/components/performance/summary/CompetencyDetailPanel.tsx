'use client'

// ═══════════════════════════════════════════════════════════════════════════
// COMPETENCY DETAIL PANEL
// Panel expandido que muestra TODAS las respuestas de una competencia
// Sin filtros - renderiza rating, texto y cualquier tipo directamente
// ═══════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Star, MessageSquare } from 'lucide-react'
import { getPerformanceClassification } from '@/config/performanceClassification'
import type { CompetencyDetailPanelProps } from '@/types/evaluator-cinema'

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export default memo(function CompetencyDetailPanel({
  responses,
  categoryName,
  avgScore
}: CompetencyDetailPanelProps) {

  // DEBUG - remover después de verificar
  console.log('[DetailPanel] Rendering:', {
    categoryName,
    responsesCount: responses?.length,
    firstResponse: responses?.[0],
    avgScore
  })

  // Si no hay respuestas
  if (!responses || responses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fhr-card p-6 text-center"
      >
        <p className="text-slate-500">No hay respuestas para &ldquo;{categoryName}&rdquo;</p>
      </motion.div>
    )
  }

  // Clasificación para el header
  const classification = avgScore ? getPerformanceClassification(avgScore) : null

  return (
    <motion.div
      key={categoryName}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fhr-card p-6 relative overflow-hidden"
    >
      {/* Línea Tesla */}
      {classification && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${classification.color}, transparent)`
          }}
        />
      )}

      {/* Header */}
      <h3 className="text-base font-medium text-slate-200 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        {categoryName}
        {avgScore && (
          <span
            className="ml-auto text-sm font-normal"
            style={{ color: classification?.color }}
          >
            Promedio: {avgScore.toFixed(1)}/5
          </span>
        )}
      </h3>

      {/* ═══════════════════════════════════════════════════════════════════
          LISTA DE RESPUESTAS - SIN FILTROS, RENDERIZA TODO
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {responses.map((r, idx) => (
          <div
            key={r.questionId || idx}
            className="border-b border-slate-700/50 last:border-0 pb-4 last:pb-0"
          >
            {/* Texto de la pregunta */}
            <p className="text-sm text-slate-300 mb-2">
              {r.questionText}
            </p>

            {/* Rating con estrellas - SI EXISTE */}
            {r.rating !== null && r.rating !== undefined && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < r.rating!
                          ? 'text-cyan-400 fill-cyan-400'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-cyan-400 ml-1">
                  {r.rating}/5
                </span>
              </div>
            )}

            {/* NormalizedScore como fallback si no hay rating */}
            {r.rating === null && r.normalizedScore !== null && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    // normalizedScore ya está en escala 1-5
                    const scoreOn5 = r.normalizedScore!
                    return (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < scoreOn5
                            ? 'text-cyan-400 fill-cyan-400'
                            : 'text-slate-600'
                        }`}
                      />
                    )
                  })}
                </div>
                <span className="text-sm font-medium text-cyan-400 ml-1">
                  {r.normalizedScore!.toFixed(1)}/5
                </span>
              </div>
            )}

            {/* Respuesta de texto */}
            {r.textResponse && r.textResponse.trim().length > 0 && (
              <div className="flex items-start gap-2 bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 mt-2">
                <MessageSquare className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300 italic">
                  &ldquo;{r.textResponse}&rdquo;
                </p>
              </div>
            )}

            {/* DEBUG: Mostrar tipo y valores raw - REMOVER DESPUÉS */}
            <p className="text-[9px] text-slate-600 mt-1 font-mono">
              tipo: {r.responseType || 'null'} | rating: {r.rating ?? 'null'} | normalized: {r.normalizedScore ?? 'null'}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  )
})
