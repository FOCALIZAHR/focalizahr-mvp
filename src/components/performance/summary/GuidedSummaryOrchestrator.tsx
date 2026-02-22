'use client'

// ════════════════════════════════════════════════════════════════════════════
// GUIDED SUMMARY ORCHESTRATOR - 3 Niveles: Hub → Cover → Content
// src/components/performance/summary/GuidedSummaryOrchestrator.tsx
// ════════════════════════════════════════════════════════════════════════════
// Filosofía: Replicar experiencia SpotlightCard para consumir inteligencia
// Patrón: HUB → PORTADA NARRATIVA → COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SummaryHub from './SummaryHub'
import MomentCover from './MomentCover'
import MomentContent from './MomentContent'
import SummaryLeftColumn from './SummaryLeftColumn'
import { NINE_BOX_POSITIONS, type NineBoxPosition } from '@/config/performanceClassification'
import { formatDisplayName } from '@/lib/utils/formatName'
import type { CinemaSummaryData, GapAnalysisSummary } from '@/types/evaluator-cinema'
import type { Moment, MomentData } from './SummaryHub'

type ViewLevel = 'hub' | 'cover' | 'content'

interface GuidedSummaryOrchestratorProps {
  summary: CinemaSummaryData
  teamMembers?: { id: string; name: string; score: number }[]
  potentialScore?: number | null
  potentialLevel?: string | null
  nineBoxPosition?: string | null
}

export default function GuidedSummaryOrchestrator({
  summary,
  teamMembers = [],
  potentialScore,
  potentialLevel,
  nineBoxPosition
}: GuidedSummaryOrchestratorProps) {

  // ═══════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════

  const [viewLevel, setViewLevel] = useState<ViewLevel>('hub')
  const [activeMoment, setActiveMoment] = useState<Moment | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null)

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleSelectMoment = (moment: Moment) => {
    setActiveMoment(moment)
    setViewLevel('cover')
    setActiveSubTab(getDefaultSubTab(moment))
  }

  const handleEnterContent = () => {
    setViewLevel('content')
  }

  const handleBack = () => {
    if (viewLevel === 'content') {
      setViewLevel('cover')
    } else if (viewLevel === 'cover') {
      setViewLevel('hub')
      setActiveMoment(null)
    }
  }

  const handleBackToHub = () => {
    setViewLevel('hub')
    setActiveMoment(null)
    setActiveSubTab(null)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════════════

  const firstName = useMemo(() => {
    return formatDisplayName(summary.evaluatee.fullName, 'short').split(' ')[0]
  }, [summary.evaluatee.fullName])

  const momentData = useMemo(() => {
    return computeMomentData(summary, teamMembers, nineBoxPosition, firstName)
  }, [summary, teamMembers, nineBoxPosition, firstName])

  const insightText = useMemo(() => {
    return computeInsightText(summary.gapAnalysis)
  }, [summary.gapAnalysis])

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0F172A] p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-6xl mx-auto"
      >
        <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl flex flex-col md:flex-row relative overflow-hidden">

          {/* TESLA LINE */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px] z-20"
            style={{
              background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
              boxShadow: '0 0 15px #22D3EE'
            }}
          />

          {/* COLUMNA IZQUIERDA (25%) */}
          <SummaryLeftColumn
            evaluatee={summary.evaluatee}
            score={summary.overallScore ?? summary.averageScore}
            potentialLevel={potentialLevel}
            potentialScore={potentialScore}
          />

          {/* COLUMNA DERECHA (75%) */}
          <div className="w-full md:w-[75%] min-h-[500px] flex flex-col">

            <AnimatePresence mode="wait">

              {/* NIVEL 1: HUB */}
              {viewLevel === 'hub' && (
                <motion.div
                  key="hub"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 p-8"
                >
                  <SummaryHub
                    momentData={momentData}
                    evaluateeName={summary.evaluatee.fullName}
                    insightText={insightText}
                    onSelectMoment={handleSelectMoment}
                  />
                </motion.div>
              )}

              {/* NIVEL 2: PORTADA */}
              {viewLevel === 'cover' && activeMoment && (
                <motion.div
                  key="cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 p-8"
                >
                  <MomentCover
                    moment={activeMoment}
                    momentData={momentData[activeMoment]}
                    evaluateeName={summary.evaluatee.fullName}
                    summary={summary}
                    onBack={handleBack}
                    onEnter={handleEnterContent}
                  />
                </motion.div>
              )}

              {/* NIVEL 3: COMPONENTE */}
              {viewLevel === 'content' && activeMoment && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col"
                >
                  <MomentContent
                    moment={activeMoment}
                    summary={summary}
                    teamMembers={teamMembers}
                    activeSubTab={activeSubTab}
                    potentialScore={potentialScore}
                    potentialLevel={potentialLevel}
                    nineBoxPosition={nineBoxPosition}
                    onSubTabChange={setActiveSubTab}
                    onBack={handleBack}
                    onBackToHub={handleBackToHub}
                  />
                </motion.div>
              )}

            </AnimatePresence>

          </div>

        </div>
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getDefaultSubTab(moment: Moment): string {
  switch (moment) {
    case 'diagnostico': return 'resultados'
    case 'conversacion': return 'competencias'
    case 'desarrollo': return 'rolefit'
  }
}

function computeMomentData(
  summary: CinemaSummaryData,
  teamMembers: { id: string; name: string; score: number }[],
  nineBoxPosition: string | null | undefined,
  firstName: string
): Record<Moment, MomentData> {
  const brechasCount = summary.gapAnalysis?.developmentAreas?.length || 0
  const strengthsCount = summary.gapAnalysis?.strengths?.length || 0
  const score = summary.overallScore ?? summary.averageScore

  // 9-Box position label
  const nineBoxConfig = nineBoxPosition
    ? NINE_BOX_POSITIONS[nineBoxPosition as NineBoxPosition]
    : null
  const nineBoxLabel = nineBoxConfig?.label ?? null

  // Score display
  const scoreText = score != null ? score.toFixed(1) : null

  return {
    diagnostico: {
      label: 'DIAGNÓSTICO',
      tagline: 'Analizar Resultados',
      metric: nineBoxLabel
        ? `Posición: ${nineBoxLabel}`
        : scoreText,
      metricLabel: nineBoxLabel ? '' : 'puntos',
      available: true,
      fallback: !nineBoxLabel
        ? `Recuerda asignar el potencial de ${firstName}`
        : null
    },
    conversacion: {
      label: 'CONVERSACIÓN',
      tagline: 'Preparar 1:1',
      metric: `${brechasCount} brechas`,
      metricLabel: strengthsCount > 0 ? `+ ${strengthsCount} fortalezas` : 'detectadas',
      available: brechasCount > 0 || strengthsCount > 0 || summary.competencyScores != null,
      fallback: null
    },
    desarrollo: {
      label: 'DESARROLLO',
      tagline: 'Trazar el Futuro',
      metric: null,
      metricLabel: '',
      available: true,
      fallback: `Evalúa para calcular Role Fit`
    }
  }
}

function computeInsightText(gapAnalysis: GapAnalysisSummary | null): string | null {
  if (!gapAnalysis) return null

  const topDev = gapAnalysis.developmentAreas?.[0]
  if (topDev) {
    return `"${topDev.competencyName} es su área de mayor oportunidad"`
  }

  const topStr = gapAnalysis.strengths?.[0]
  if (topStr) {
    return `"${topStr.competencyName} es su mayor fortaleza"`
  }

  return null
}
