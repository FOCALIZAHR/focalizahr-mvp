'use client'

// ════════════════════════════════════════════════════════════════════════════
// MOMENT CONTENT - Componente con Sub-tabs (DEFINITIVA)
// src/components/performance/summary/MomentContent.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Home, MessageCircle } from 'lucide-react'
import { formatDisplayName } from '@/lib/utils/formatName'

// Componentes existentes (NO modificados)
import { GapInsightCarousel } from '@/components/performance/gap-analysis'
import TeamCalibrationHUD from '@/components/performance/TeamCalibrationHUD'
import InsightCarousel from '@/components/performance/summary/InsightCarousel'
import PerformanceScoreCard from '@/components/performance/PerformanceScoreCard'
import PotentialNineBoxCard from '@/components/performance/PotentialNineBoxCard'
import CompetencyDetailPanel from '@/components/performance/summary/CompetencyDetailPanel'
import PDIWizardOrchestrator from '@/components/pdi/PDIWizardOrchestrator'
import PDIDetailView from '@/components/pdi/PDIDetailView'

// Nuevos componentes
import FallbackCard from './FallbackCard'
import CompetencyRadarInline from './CompetencyRadarInline'

import type { CinemaSummaryData } from '@/types/evaluator-cinema'
import type { Moment } from './SummaryHub'

interface MomentContentProps {
  moment: Moment
  summary: CinemaSummaryData
  teamMembers: { id: string; name: string; score: number }[]
  activeSubTab: string | null
  potentialScore?: number | null
  potentialLevel?: string | null
  nineBoxPosition?: string | null
  onSubTabChange: (tab: string) => void
  onBack: () => void
  onBackToHub: () => void
}

const SUB_TABS: Record<Moment, { key: string; label: string }[]> = {
  diagnostico: [
    { key: 'resultados', label: 'Resultados' },
    { key: 'competencias', label: 'Competencias' }
  ],
  conversacion: [
    { key: 'guia', label: 'Guía 1:1' },
    { key: 'brechas', label: 'Brechas' }
  ],
  desarrollo: [
    { key: 'pdi', label: 'Plan de Desarrollo' }
  ]
}

export default memo(function MomentContent({
  moment,
  summary,
  teamMembers,
  activeSubTab,
  potentialScore,
  potentialLevel,
  nineBoxPosition,
  onSubTabChange,
  onBack,
  onBackToHub
}: MomentContentProps) {

  const tabs = SUB_TABS[moment]
  const currentTab = activeSubTab || tabs[0].key

  const firstName = useMemo(() => {
    return formatDisplayName(summary.evaluatee.fullName, 'short').split(' ')[0]
  }, [summary.evaluatee.fullName])

  // PDI state
  const [existingPDI, setExistingPDI] = useState<{ id: string; status: string } | null>(null)

  useEffect(() => {
    if (moment !== 'desarrollo') return

    async function checkPDI() {
      try {
        const res = await fetch(
          `/api/pdi/by-employee?employeeId=${summary.evaluateeId}&cycleId=${summary.cycleId}`
        )
        const data = await res.json()
        if (data.success && data.exists) {
          setExistingPDI({ id: data.data.id, status: data.data.status })
        }
      } catch { /* ignore */ }
    }

    checkPDI()
  }, [moment, summary.evaluateeId, summary.cycleId])

  // Competencies for coaching (Guía 1:1)
  const competencies = useMemo(() => {
    if (!summary?.categorizedResponses) return []
    return Object.entries(summary.categorizedResponses).map(([name, responses]) => {
      const ratings = (responses as any[])
        .filter((r: any) => r.rating != null)
        .map((r: any) => r.rating as number)
      const avgScore = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0
      return { name, score: avgScore }
    })
  }, [summary?.categorizedResponses])

  // Current evaluatee ID for ranking highlight
  const currentEvaluateeId = useMemo(() => {
    if (!summary?.evaluatee?.fullName || teamMembers.length === 0) return undefined
    const evalName = summary.evaluatee.fullName.toLowerCase()
    const found = teamMembers.find(m =>
      m.name.toLowerCase().includes(evalName) ||
      evalName.includes(m.name.toLowerCase())
    )
    return found?.id
  }, [summary?.evaluatee?.fullName, teamMembers])

  // Has potential data?
  const hasPotential = potentialScore != null || potentialLevel != null || nineBoxPosition != null

  // Has self-evaluation data?
  const hasSelfEvaluation = useMemo(() => {
    return summary.competencyScores?.some(c => c.selfScore != null) ?? false
  }, [summary.competencyScores])

  const scoreOn5 = summary.averageScore ?? summary.overallScore ?? null

  // Selected competency for detail panel (Competencias tab)
  const [selectedCompetency, setSelectedCompetency] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-full">

      {/* Header con navegación */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">

        {/* Botones de navegación */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors text-xs font-medium"
          >
            <ArrowLeft className="w-3 h-3" />
            Volver
          </button>

          <button
            onClick={onBackToHub}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors text-xs font-medium"
          >
            <Home className="w-3 h-3" />
            Hub
          </button>
        </div>

        {/* Sub-tabs */}
        {tabs.length > 1 && (
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => onSubTabChange(tab.key)}
                className={`
                  px-4 py-2 rounded-lg text-xs font-medium transition-all
                  ${currentTab === tab.key
                    ? 'bg-cyan-500 text-slate-900'
                    : 'text-slate-400 hover:text-white'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Contenido del componente */}
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >

          {/* ═══════════════ DIAGNÓSTICO: RESULTADOS ═══════════════ */}
          {moment === 'diagnostico' && currentTab === 'resultados' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Score Card */}
              {scoreOn5 != null && (
                <PerformanceScoreCard
                  score={scoreOn5}
                  showProgressBar
                  showTeslaLine
                  size="lg"
                  className="w-full"
                />
              )}

              {/* 9-Box Card or Fallback */}
              {hasPotential ? (
                <PotentialNineBoxCard
                  potentialScore={potentialScore ?? null}
                  potentialLevel={potentialLevel ?? null}
                  nineBoxPosition={nineBoxPosition ?? null}
                  showTeslaLine
                />
              ) : (
                <FallbackCard
                  message={`Recuerda asignar el potencial de ${firstName}, permitirá guiar su desarrollo y retención.`}
                />
              )}

              {/* Ranking */}
              {teamMembers.length > 0 ? (
                <TeamCalibrationHUD
                  teamMembers={teamMembers}
                  currentEvaluateeId={currentEvaluateeId}
                  maxVisible={10}
                  className="w-full"
                />
              ) : (
                <FallbackCard
                  message="No hay suficientes evaluaciones completadas para mostrar el ranking."
                />
              )}
            </div>
          )}

          {/* ═══════════════ DIAGNÓSTICO: COMPETENCIAS ═══════════════ */}
          {moment === 'diagnostico' && currentTab === 'competencias' && (
            <div className="space-y-6">
              {/* Radar INLINE */}
              {summary.competencyScores && summary.competencyScores.length > 0 && (
                <CompetencyRadarInline competencyScores={summary.competencyScores} />
              )}

              {/* Competency chips */}
              {Object.keys(summary.categorizedResponses).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.categorizedResponses).map(([category, responses]) => {
                    const ratings = (responses as any[])
                      .filter((r: any) => r.rating != null)
                      .map((r: any) => r.rating as number)
                    const avg = ratings.length > 0
                      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                      : null
                    const isSelected = selectedCompetency === category

                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCompetency(isSelected ? null : category)}
                        className={`
                          px-3 py-2 rounded-xl text-xs font-medium transition-all border
                          ${isSelected
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-[#0F172A]/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                          }
                        `}
                      >
                        {category}
                        {avg != null && (
                          <span className={`ml-2 font-bold ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                            {avg.toFixed(1)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Detail panel for selected competency */}
              {selectedCompetency && summary.categorizedResponses[selectedCompetency] && (
                <CompetencyDetailPanel
                  categoryName={selectedCompetency}
                  responses={summary.categorizedResponses[selectedCompetency]}
                  avgScore={(() => {
                    const ratings = (summary.categorizedResponses[selectedCompetency] as any[])
                      .filter((r: any) => r.rating != null)
                      .map((r: any) => r.rating as number)
                    return ratings.length > 0
                      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                      : null
                  })()}
                />
              )}
            </div>
          )}

          {/* ═══════════════ CONVERSACIÓN: GUÍA 1:1 ═══════════════ */}
          {moment === 'conversacion' && currentTab === 'guia' && (
            competencies.length > 0 ? (
              <InsightCarousel
                competencies={competencies}
                employeeName={summary.evaluatee.fullName}
                className="w-full"
              />
            ) : (
              <FallbackCard message="No hay datos de competencias disponibles para generar la guía." />
            )
          )}

          {/* ═══════════════ CONVERSACIÓN: BRECHAS ═══════════════ */}
          {moment === 'conversacion' && currentTab === 'brechas' && (
            hasSelfEvaluation && summary.competencyScores ? (
              <GapInsightCarousel
                competencyScores={summary.competencyScores}
                employeeName={summary.evaluatee.fullName}
                overallScore={summary.overallScore || undefined}
              />
            ) : (
              <FallbackCard
                message={`Aún no recibimos la autoevaluación de ${firstName}, motívalo para completarla ya que es parte importante de su feedback cruzado.`}
                icon={MessageCircle}
              />
            )
          )}

          {/* ═══════════════ DESARROLLO: PDI ═══════════════ */}
          {moment === 'desarrollo' && currentTab === 'pdi' && (
            <div className="space-y-4">
              {/* Fallback Role Fit */}
              <FallbackCard
                message={`Recuerda evaluar a ${firstName} para calcular su Role Fit y trazar mejor su camino de crecimiento.`}
              />

              {/* PDI Wizard or Detail */}
              {existingPDI && existingPDI.status !== 'DRAFT' ? (
                <PDIDetailView pdiId={existingPDI.id} />
              ) : (
                <PDIWizardOrchestrator
                  employeeId={summary.evaluateeId}
                  cycleId={summary.cycleId}
                  employeeName={summary.evaluatee.fullName}
                  onComplete={(pdiId) => {
                    setExistingPDI({ id: pdiId, status: 'PENDING_REVIEW' })
                  }}
                />
              )}
            </div>
          )}

        </motion.div>
      </div>

    </div>
  )
})
