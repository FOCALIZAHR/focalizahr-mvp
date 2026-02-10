'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUATION DIAGNOSTIC MODAL
// src/components/performance/EvaluationDiagnosticModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón de posicionamiento: FocalizaIntelligenceModal
// (fixed inset-0 wrapper con flex-center, NO fixed en el modal)
// Patrón colapsable: ChevronRight rotate-90 + AnimatePresence
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, TrendingUp, ChevronRight, AlertTriangle } from 'lucide-react'
import { HeatStrip } from './HeatStrip'
import { CompetencyList } from './CompetencyList'
import type { EvaluationStatus } from '@/lib/utils/evaluatorStatsEngine'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface EvaluationDiagnosticModalProps {
  isOpen: boolean
  onClose: () => void
  data: {
    desempeno: {
      status: EvaluationStatus
      avg: number
      stdDev: number
      count: number
      distribution: number[]
    }
    competencies: Array<{
      code: string
      name: string
      avgScore: number
    }>
    teamDna: {
      top: { code: string; name: string; avgScore: number }
      low: { code: string; name: string; avgScore: number }
    } | null
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function EvaluationDiagnosticModal({
  isOpen,
  onClose,
  data
}: EvaluationDiagnosticModalProps) {
  const { desempeno, competencies, teamDna } = data
  const [competenciesExpanded, setCompetenciesExpanded] = useState(false)

  // Reset collapsible when closing
  useEffect(() => {
    if (!isOpen) setCompetenciesExpanded(false)
  }, [isOpen])

  const executiveInsight = generateExecutiveInsight(desempeno, competencies, teamDna)
  const distributionMessage = getDistributionMessage(desempeno)
  const criticalCompetencies = competencies.filter(c => c.avgScore < 2.5)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* ═══════════════════════════════════════════════════════
              BACKDROP (patrón FocalizaIntelligenceModal)
          ═══════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
          />

          {/* ═══════════════════════════════════════════════════════
              MODAL CONTENT
          ═══════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="
              relative z-10 w-full max-w-2xl mx-4
              bg-[#0F172A]/95 backdrop-blur-2xl
              border border-slate-700/50
              rounded-2xl
              shadow-2xl shadow-black/50
              max-h-[85vh] overflow-hidden
              flex flex-col
            "
          >
            {/* ═══════════════════════════════════════════════════════
                LÍNEA TESLA - Firma visual
            ═══════════════════════════════════════════════════════ */}
            <div
              className="absolute top-0 left-0 right-0 h-[1px] z-20"
              style={{
                background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
                boxShadow: '0 0 15px #22D3EE'
              }}
            />

            {/* ═══════════════════════════════════════════════════════
                HEADER
            ═══════════════════════════════════════════════════════ */}
            <div className="p-6 border-b border-slate-700/30 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white tracking-tight">
                      Diagn&oacute;stico de tu Evaluaci&oacute;n
                    </h2>
                    <p className="text-[12px] text-slate-500 mt-0.5 font-mono">
                      {desempeno.count} colaboradores &middot; Promedio {desempeno.avg.toFixed(2)} &middot; &sigma; {desempeno.stdDev.toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10
                    flex items-center justify-center text-slate-500 hover:text-white
                    transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                CONTENT - Scrollable
            ═══════════════════════════════════════════════════════ */}
            <div className="flex-1 overflow-y-auto">

              {/* SECCIÓN 1: Distribución + HeatStrip */}
              <div className="p-6 border-b border-slate-700/30">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Distribuci&oacute;n de tu Equipo
                  </h3>
                </div>

                <HeatStrip
                  distribution={desempeno.distribution}
                  average={desempeno.avg}
                  stdDev={desempeno.stdDev}
                />

                <p className="text-[12px] text-slate-500 mt-4 italic leading-relaxed">
                  &ldquo;{distributionMessage}&rdquo;
                </p>
              </div>

              {/* SECCIÓN 2: ADN del Equipo (Top + Low) */}
              {teamDna && (
                <div className="p-6 border-b border-slate-700/30">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-5">
                    ADN del Equipo
                  </h3>

                  <div className="space-y-4">
                    {/* Fortaleza - CYAN */}
                    <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                          Fortaleza
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">
                          {teamDna.top.avgScore.toFixed(1)} / 5.0
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium">{teamDna.top.name}</p>
                      <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(teamDna.top.avgScore / 5) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Área de Desarrollo - AMBER */}
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                          &Aacute;rea de Desarrollo
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                          {teamDna.low.avgScore.toFixed(1)} / 5.0
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium">{teamDna.low.name}</p>
                      <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(teamDna.low.avgScore / 5) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 3: Alerta Crítica (si aplica) */}
              {criticalCompetencies.length > 0 && (
                <div className="px-6 pt-5">
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-red-400 mb-1">
                          Atenci&oacute;n Requerida
                        </h4>
                        <p className="text-[12px] text-slate-400 leading-relaxed">
                          {criticalCompetencies.length === 1 ? (
                            <>
                              <strong className="text-red-400">{criticalCompetencies[0].name}</strong> est&aacute; en nivel cr&iacute;tico ({criticalCompetencies[0].avgScore.toFixed(1)}).
                            </>
                          ) : (
                            <>
                              {criticalCompetencies.map((c, i) => (
                                <span key={c.code}>
                                  <strong className="text-red-400">{c.name}</strong>
                                  {i < criticalCompetencies.length - 2 ? ', ' : i === criticalCompetencies.length - 2 ? ' y ' : ''}
                                </span>
                              ))}{' '}requieren atenci&oacute;n inmediata.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 4: Collapsible - Todas las competencias */}
              {competencies.length > 2 && (
                <div className="border-b border-slate-700/30">
                  <button
                    onClick={() => setCompetenciesExpanded(!competenciesExpanded)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left
                      hover:bg-white/[0.02] transition-colors min-h-[44px]"
                  >
                    <span className="text-slate-300 text-sm font-medium">
                      Ver todas las competencias ({competencies.length})
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                      competenciesExpanded ? 'rotate-90' : ''
                    }`} />
                  </button>

                  <AnimatePresence>
                    {competenciesExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5">
                          <CompetencyList
                            competencies={competencies}
                            topCode={teamDna?.top.code || ''}
                            lowCode={teamDna?.low.code || ''}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* SECCIÓN 5: Insight Ejecutivo */}
              <div className="p-6">
                <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">
                      Insight Ejecutivo
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-300 leading-relaxed font-medium italic">
                    &ldquo;{executiveInsight}&rdquo;
                  </p>
                </div>
              </div>

            </div>

            {/* ═══════════════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════════════ */}
            <div className="px-6 py-4 border-t border-slate-700/50 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full text-center text-slate-500 hover:text-slate-300 text-sm
                  transition-colors min-h-[44px]"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getDistributionMessage(desempeno: { status: EvaluationStatus; avg: number; stdDev: number }): string {
  const { status, stdDev, avg } = desempeno

  if (status === 'OPTIMA') {
    return `Concentraci\u00f3n saludable en rango ${avg >= 3.5 ? 'alto' : avg >= 2.5 ? 'medio-alto' : 'medio'}. Buena diferenciaci\u00f3n entre niveles (\u03c3 ${stdDev.toFixed(2)}).`
  }
  if (status === 'CENTRAL') {
    return `Las notas se concentran excesivamente en el centro (\u03c3 ${stdDev.toFixed(2)}). Considera diferenciar m\u00e1s entre alto y bajo desempe\u00f1o.`
  }
  if (status === 'SEVERA') {
    return `Promedio bajo (${avg.toFixed(2)}). La mayor\u00eda de tu equipo est\u00e1 en el rango inferior. Revisa si los est\u00e1ndares son apropiados.`
  }
  return `Promedio alto (${avg.toFixed(2)}). La mayor\u00eda de tu equipo est\u00e1 en el rango superior. Considera si est\u00e1s diferenciando suficientemente.`
}

function generateExecutiveInsight(
  desempeno: { status: EvaluationStatus; avg: number; stdDev: number },
  competencies: Array<{ name: string; avgScore: number }>,
  teamDna: { top: { name: string }; low: { name: string } } | null
): string {
  const parts: string[] = []

  if (teamDna) {
    const topName = teamDna.top.name.toLowerCase()
    const cultureLabel =
      topName.includes('resultado') ? 'cultura de logro' :
      topName.includes('equipo') ? 'buena colaboraci\u00f3n' :
      topName.includes('innovaci') ? 'mentalidad de mejora continua' :
      'una competencia clave bien desarrollada'
    parts.push(`Tu equipo tiene una base s\u00f3lida en ${teamDna.top.name}, lo que indica ${cultureLabel}.`)
  }

  if (teamDna) {
    const critical = competencies.filter(c => c.avgScore < 2.5)
    if (critical.length > 0) {
      parts.push(`Atenci\u00f3n: ${critical.map(c => c.name).join(' y ')} ${critical.length > 1 ? 'requieren' : 'requiere'} intervenci\u00f3n inmediata.`)
    } else {
      parts.push(`El \u00e1rea de desarrollo est\u00e1 en ${teamDna.low.name} \u2013 considera un workshop o capacitaci\u00f3n focalizada para el pr\u00f3ximo trimestre.`)
    }
  }

  if (desempeno.status === 'OPTIMA') {
    parts.push('Tu estilo de evaluaci\u00f3n es saludable: diferencias bien entre alto y bajo desempe\u00f1o, facilitando la calibraci\u00f3n posterior.')
  } else if (desempeno.status === 'CENTRAL') {
    parts.push('Tip: Intenta usar m\u00e1s el rango completo de la escala para diferenciar mejor el desempe\u00f1o de tu equipo.')
  } else if (desempeno.status === 'SEVERA') {
    parts.push('Tu evaluaci\u00f3n muestra severidad. Aseg\u00farate de reconocer tambi\u00e9n los logros de tu equipo.')
  } else {
    parts.push('Tu evaluaci\u00f3n tiende a la indulgencia. Considera ser m\u00e1s exigente para diferenciar el talento.')
  }

  return parts.join(' ')
}
