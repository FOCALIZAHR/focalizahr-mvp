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

import type { PLTalentProps } from './PLTalent.types'
import { getPortadaNarrative } from './PLTalent.utils'
import { PanelPortada } from '../PanelPortada'
import BrechaProductivaTab from './tabs/BrechaProductivaTab'
import SemaforoLegalTab from './tabs/SemaforoLegalTab'
import { GerenciaDetailView } from './shared/GerenciaDetailView'
import PLTalentExecutiveBriefing from './components/PLTalentExecutiveBriefing'

import type { ExecutiveRiskPayload } from '@/lib/services/TalentRiskOrchestrator'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type View = 'portada' | 'split-brain' | 'mapa' | 'detalle-gerencia' | 'semaforo'

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

  const narrative = useMemo(() => getPortadaNarrative(data), [data])

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
              onCtaClick={() => setView('split-brain')}
              coachingTip={narrative.coachingTip}
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
              <NavPill active={activeSection} onChange={handleNavChange} />
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
              <NavPill active={activeSection} onChange={handleNavChange} />
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
              <NavPill active={activeSection} onChange={handleNavChange} />
            </div>

            <SemaforoLegalTab data={data.semaforo} />
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  )
})

export default PLTalent

// ════════════════════════════════════════════════════════════════════════════
// NAV PILL — Localización | Zona Legal
// ════════════════════════════════════════════════════════════════════════════

function NavPill({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  const tabs = [
    { key: 'analisis', icon: Brain, label: 'Análisis' },
    { key: 'mapa', icon: MapPin, label: 'Localización' },
    { key: 'semaforo', icon: Scale, label: 'Zona Legal' },
  ]
  return (
    <div className="flex gap-0.5 bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-full p-[3px]">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={cn(
            'relative px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.1em] transition-colors duration-200',
            active === t.key ? 'text-white' : 'text-slate-500 hover:text-slate-400'
          )}>
          {active === t.key && (
            <motion.div layoutId="pl-talent-nav" className="absolute inset-0 bg-slate-700/50 rounded-full"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
          )}
          <span className="relative z-10 flex items-center gap-1.5"><t.icon size={10} />{t.label}</span>
        </button>
      ))}
    </div>
  )
}
