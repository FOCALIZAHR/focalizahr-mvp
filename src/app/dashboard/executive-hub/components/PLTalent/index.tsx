'use client'

// ════════════════════════════════════════════════════════════════════════════
// P&L TALENT - Executive Hub Panel
// src/app/dashboard/executive-hub/components/PLTalent/index.tsx
// ════════════════════════════════════════════════════════════════════════════
// Split-Brain: Datos Duros (35%) + Oráculo Condicional (65%)
// Integra: LensSelector, SplitBrain, LeadershipAlert, IndividualDrawer,
//          SemaforoDrawer, BrechaProductivaTab, SemaforoLegalTab,
//          GerenciaDetailView
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Scale } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { PLTalentProps } from './PLTalent.types'
import { getPortadaNarrative } from './PLTalent.utils'
import { PanelPortada } from '../PanelPortada'
import BrechaProductivaTab from './tabs/BrechaProductivaTab'
import SemaforoLegalTab from './tabs/SemaforoLegalTab'
import { GerenciaDetailView } from './shared/GerenciaDetailView'

// New Split-Brain components
import PLTalentLensSelector, { type LensType } from './components/PLTalentLensSelector'
import PLTalentSplitBrain from './components/PLTalentSplitBrain'
import PLTalentLeadershipAlert from './components/PLTalentLeadershipAlert'
import PLTalentIndividualDrawer from './components/PLTalentIndividualDrawer'
import PLTalentSemaforoDrawer from './components/PLTalentSemaforoDrawer'

import { BUSINESS_IMPACT_DICTIONARY } from '@/config/narratives/BusinessImpactDictionary'
import { LEADERSHIP_RISK_DICTIONARY } from '@/config/narratives/LeadershipRiskDictionary'
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
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const PLTalent = memo(function PLTalent({ data, cycleId }: PLTalentProps & { cycleId?: string }) {
  const [view, setView] = useState<View>('portada')
  const [selectedGerencia, setSelectedGerencia] = useState<{ id: string; name: string } | null>(null)

  // Split-Brain state
  const [activeLens, setActiveLens] = useState<LensType>('gerencia')
  const [selectedGerenciaName, setSelectedGerenciaName] = useState<string | null>(null)
  const [riskProfiles, setRiskProfiles] = useState<ExecutiveRiskPayload[]>([])
  const [riskSummary, setRiskSummary] = useState<RiskProfilesSummary | null>(null)
  const [riskLoading, setRiskLoading] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<ExecutiveRiskPayload | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const narrative = useMemo(() => getPortadaNarrative(data), [data])

  // Fetch risk profiles when entering split-brain view
  useEffect(() => {
    if (view !== 'split-brain' || !cycleId || riskProfiles.length > 0) return

    const fetchRiskProfiles = async () => {
      setRiskLoading(true)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null
        const headers: Record<string, string> = {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
        const res = await fetch(`/api/executive-hub/pl-talent/risk-profiles?cycleId=${cycleId}`, { headers })
        if (res.ok) {
          const json = await res.json()
          if (json.success) {
            setRiskProfiles(json.data.profiles)
            setRiskSummary(json.data.summary)
          }
        }
      } catch (err) {
        console.error('[PLTalent] Error fetching risk profiles:', err)
      } finally {
        setRiskLoading(false)
      }
    }

    fetchRiskProfiles()
  }, [view, cycleId, riskProfiles.length])

  // Gerencia impact lookup for Split-Brain oráculo
  const gerenciaImpact = useMemo(() => {
    if (!selectedGerenciaName) return null
    // Find standardCategory from brecha data or risk profiles
    const ger = data.brecha.byGerencia.find(g => g.gerenciaName === selectedGerenciaName)
    if (!ger) return null
    // Try to find category from risk profiles
    const profileInGerencia = riskProfiles.find(p =>
      p.data.departmentName.toLowerCase().includes(selectedGerenciaName.toLowerCase().split(' ')[0])
    )
    const category = profileInGerencia?.data.gerenciaCategory
    if (!category) return null
    return BUSINESS_IMPACT_DICTIONARY[category] || null
  }, [selectedGerenciaName, data.brecha.byGerencia, riskProfiles])

  // Leadership alert data
  const leadershipData = useMemo(() => {
    const leaders = riskProfiles.filter(p => p.narratives.leadershipRisk !== null)
    return {
      leadersAtRisk: leaders.length,
      totalDirectReports: leaders.reduce((sum, p) => sum + p.data.directReportsCount, 0),
    }
  }, [riskProfiles])

  // Lens counts
  const lensCounts = useMemo(() => ({
    gerencias: data.brecha.byGerencia.length,
    critical: riskSummary?.criticalPositions ?? 0,
    tenureRisk: riskSummary ? (riskSummary.byTenureTrend.A1 + riskSummary.byTenureTrend.A2) : 0,
  }), [data.brecha.byGerencia.length, riskSummary])

  // Which "tab" is active for NavPill highlight
  const activeSection = view === 'semaforo' ? 'semaforo' : 'mapa'

  const handleSelectGerencia = useCallback((id: string, name: string) => {
    setSelectedGerencia({ id, name })
    setView('detalle-gerencia')
  }, [])

  const handleNavChange = useCallback((section: string) => {
    if (section === 'semaforo') {
      setView('semaforo')
    } else {
      setView('mapa')
    }
    setSelectedGerencia(null)
  }, [])

  const handleOpenProfile = useCallback((profile: ExecutiveRiskPayload) => {
    setSelectedProfile(profile)
    setDrawerOpen(true)
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
              <NavPill active={activeSection} onChange={(section) => {
                if (section === 'semaforo') setView('semaforo')
                else setView('mapa')
              }} />
            </div>

            {/* Lens Selector */}
            <PLTalentLensSelector
              activeLens={activeLens}
              onLensChange={setActiveLens}
              counts={lensCounts}
              disabled={riskLoading}
            />

            {/* Leadership Alert (Motor 3) */}
            {leadershipData.leadersAtRisk > 0 && (
              <PLTalentLeadershipAlert
                leadersAtRisk={leadershipData.leadersAtRisk}
                totalDirectReports={leadershipData.totalDirectReports}
                leadershipRisk={LEADERSHIP_RISK_DICTIONARY}
              />
            )}

            {/* Split-Brain Main */}
            <PLTalentSplitBrain
              heroNumber={data.brecha.totalGapMonthly * 12}
              monthlyGap={data.brecha.totalGapMonthly}
              totalPeople={data.brecha.totalPeople}
              fteLoss={data.brecha.fteLoss}
              ranking={data.brecha.byGerencia}
              salarySource={data.brecha.salarySource}
              selectedGerencia={selectedGerenciaName}
              gerenciaImpact={gerenciaImpact}
              onGerenciaSelect={setSelectedGerenciaName}
            />

            {/* Semáforo Drawer (bottom bar) */}
            <PLTalentSemaforoDrawer
              summary={{
                totalPeople: data.semaforo.totalPeople,
                totalLiability: data.semaforo.totalLiability,
                monthlyGrowth: data.semaforo.monthlyGrowth,
              }}
              people={data.semaforo.people}
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
                Dashboard
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
                Dashboard
              </button>
              <NavPill active={activeSection} onChange={handleNavChange} />
            </div>

            <SemaforoLegalTab data={data.semaforo} />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Individual Drawer (overlay, fuera de AnimatePresence) */}
      <PLTalentIndividualDrawer
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedProfile(null) }}
        profile={selectedProfile}
      />
    </div>
  )
})

export default PLTalent

// ════════════════════════════════════════════════════════════════════════════
// NAV PILL — Localización | Zona Legal
// ════════════════════════════════════════════════════════════════════════════

function NavPill({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  const tabs = [
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
