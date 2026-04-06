'use client'

// ════════════════════════════════════════════════════════════════════════════
// P&L TALENT - Executive Hub Panel
// src/app/dashboard/executive-hub/components/PLTalent/index.tsx
// ════════════════════════════════════════════════════════════════════════════
// Navegación: Portada → 3 tabs (Análisis Profundo | Localización | Zona Legal)
// Integra: ExecutiveBriefing, BrechaProductivaTab, SemaforoLegalTab,
//          GerenciaDetailView
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Brain, MapPin, Scale } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavPill } from '../shared/NavPill'
import type { NavPillTab } from '../shared/NavPill'

import type { PLTalentProps } from './PLTalent.types'
import { getPortadaNarrative, computeGlobalRoleFit, buildPLTalentAnclaComponents } from './PLTalent.utils'
import { PanelPortada } from '../PanelPortada'
import AnclaInteligente from '@/components/executive/AnclaInteligente'
import BrechaProductivaTab from './tabs/BrechaProductivaTab'
import SemaforoLegalTab from './tabs/SemaforoLegalTab'
import { GerenciaDetailView } from './shared/GerenciaDetailView'
import PLTalentExecutiveBriefing from './components/PLTalentExecutiveBriefing'

import type { ExecutiveRiskPayload } from '@/lib/services/TalentRiskOrchestrator'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type View = 'portada' | 'ancla' | 'split-brain' | 'mapa' | 'detalle-gerencia' | 'semaforo'

interface RiskProfilesSummary {
  total: number
  withLeadershipRisk: number
  criticalPositions: number
  withoutSuccessor: number
  byTenureTrend: { A1: number; A2: number; A3: number }
  byFitLevel: { low: number; high: number }
  successionNarrative: string
  successionCombination: 'A' | 'B' | 'C' | 'D'
  tenureNarrative: { narrative: string; tone: 'positive' | 'negative'; tramo: 'A1' | 'A2' | 'A3' } | null
  gerenciaImpact: Record<string, any>
  executiveSynthesis?: { classification: string; implication: string; risks?: { label: string; narrative: string }[]; financialNote?: string; path: string; accountability: string } | null
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const PLTalent = memo(function PLTalent({ data, cycleId, companyName, roleFit, worstLayer, worstGerencia, worstCellCount, worstCellScore }: PLTalentProps & { cycleId?: string; companyName?: string; roleFit?: number; worstLayer?: string; worstGerencia?: string; worstCellCount?: number; worstCellScore?: number }) {
  const [view, setView] = useState<View>('portada')
  const [selectedGerencia, setSelectedGerencia] = useState<{ id: string; name: string } | null>(null)

  // Read risk data from pre-fetched spotlight data (null if /risk-profiles failed — graceful)
  const riskData = (data as any).riskProfiles as { profiles: ExecutiveRiskPayload[]; summary: RiskProfilesSummary } | null
  const riskProfiles = riskData?.profiles ?? []
  const riskSummary = riskData?.summary ?? null

  const globalRoleFit = useMemo(() => computeGlobalRoleFit(riskProfiles), [riskProfiles])
  const narrative = useMemo(() => getPortadaNarrative(data, globalRoleFit), [data, globalRoleFit])
  const anclaComponents = useMemo(() => buildPLTalentAnclaComponents(data.brecha, riskProfiles), [data.brecha, riskProfiles])

  // Leadership alert data
  const leadershipData = useMemo(() => {
    const leaders = riskProfiles.filter(p => p.narratives.leadershipRisk !== null)
    return {
      leadersAtRisk: leaders.length,
      totalDirectReports: leaders.reduce((sum, p) => sum + p.data.directReportsCount, 0),
    }
  }, [riskProfiles])

  const totalManagers = useMemo(() =>
    riskProfiles.filter(p => p.data.isLeader).length
  , [riskProfiles])

  // Which "tab" is active for NavPill highlight
  const activeSection = view === 'semaforo' ? 'semaforo' : view === 'mapa' ? 'mapa' : 'analisis'

  const handleSelectGerencia = useCallback((id: string, name: string) => {
    setSelectedGerencia({ id, name })
    setView('detalle-gerencia')
  }, [])

  const PL_TABS: NavPillTab[] = useMemo(() => [
    { key: 'analisis', icon: Brain, label: 'Análisis' },
    { key: 'mapa', icon: MapPin, label: 'Localización' },
    { key: 'semaforo', icon: Scale, label: 'Zona Legal' },
  ], [])

  const handleNavChange = useCallback((section: string) => {
    if (section === 'semaforo') setView('semaforo')
    else if (section === 'mapa') setView('mapa')
    else setView('split-brain')
    setSelectedGerencia(null)
  }, [])

  return (
    <div className="relative">
      {/* Tesla line — cyan */}
      <div className="fhr-top-line absolute inset-x-0 top-0 z-10" />

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════════ */}
        {/* PORTADA                                        */}
        {/* ══════════════════════════════════════════════ */}
        {view === 'portada' && (
          <motion.div
            key="portada"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <PanelPortada
              statusBadge={narrative.statusBadge}
              narrative={{
                prefix: narrative.prefix,
                highlight: narrative.highlight,
                suffix: narrative.suffix,
              }}
              ctaLabel={narrative.ctaLabel}
              ctaVariant={narrative.ctaVariant}
              onCtaClick={() => setView('ancla')}
              coachingTip={narrative.coachingTip}
            />
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* ACTO ANCLA (Pre-Cascada)                       */}
        {/* ══════════════════════════════════════════════ */}
        {view === 'ancla' && (
          <motion.div
            key="ancla"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-6"
          >
            <AnclaInteligente
              score={globalRoleFit}
              scoreLabel="Productividad"
              components={anclaComponents}
              onContinue={() => setView('split-brain')}
              onBack={() => setView('portada')}
              ctaLabel="Ver diagnóstico completo"
            />
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* SPLIT-BRAIN VIEW                               */}
        {/* ══════════════════════════════════════════════ */}
        {view === 'split-brain' && (
          <motion.div
            key="split-brain"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 p-4 md:p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setView('portada')}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Portada
              </button>
              <NavPill tabs={PL_TABS} active={activeSection} onChange={handleNavChange} layoutId="pl-talent-nav" />
            </div>

            {/* Executive Briefing — La Cascada de la Verdad */}
            <PLTalentExecutiveBriefing
              brecha={data.brecha}
              semaforo={data.semaforo}
              riskSummary={riskSummary}
              riskProfiles={riskProfiles}
              leadersAtRisk={leadershipData.leadersAtRisk}
              totalDirectReports={leadershipData.totalDirectReports}
              totalManagers={totalManagers}
              roleFit={roleFit ?? 0}
              worstLayer={worstLayer}
              worstGerencia={worstGerencia}
              worstCellCount={worstCellCount}
              worstCellScore={worstCellScore}
              companyName={companyName || 'tu organización'}
              onNavigateToCargoFamily={() => { setView('mapa') }}
            />
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* MAPA DE LOCALIZACIÓN (legacy)                  */}
        {/* ══════════════════════════════════════════════ */}
        {view === 'mapa' && (
          <motion.div
            key="mapa"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 p-6 md:p-8"
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => setView('split-brain')}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Análisis
              </button>
              <NavPill tabs={PL_TABS} active={activeSection} onChange={handleNavChange} layoutId="pl-talent-nav" />
            </div>

            <BrechaProductivaTab
              data={data.brecha}
              semaforoData={data.semaforo}
              onSelectGerencia={handleSelectGerencia}
            />
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* DETALLE GERENCIA (3 palancas)                  */}
        {/* ══════════════════════════════════════════════ */}
        {view === 'detalle-gerencia' && selectedGerencia && (
          <motion.div
            key="detalle"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-6 md:p-8"
          >
            <GerenciaDetailView
              gerenciaId={selectedGerencia.id}
              gerenciaName={selectedGerencia.name}
              brechaData={data.brecha}
              semaforoData={data.semaforo}
              onBack={() => setView('mapa')}
            />
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* ZONA LEGAL (SemaforoLegalTab)                  */}
        {/* ══════════════════════════════════════════════ */}
        {view === 'semaforo' && (
          <motion.div
            key="semaforo"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 p-6 md:p-8"
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => setView('split-brain')}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Análisis
              </button>
              <NavPill tabs={PL_TABS} active={activeSection} onChange={handleNavChange} layoutId="pl-talent-nav" />
            </div>

            <SemaforoLegalTab data={data.semaforo} />
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  )
})

export default PLTalent

// NavPill imported from ../shared/NavPill
