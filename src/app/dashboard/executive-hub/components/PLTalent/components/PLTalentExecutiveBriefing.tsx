'use client'

// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE BRIEFING — "La Cascada de la Verdad"
// src/app/dashboard/executive-hub/components/PLTalent/components/PLTalentExecutiveBriefing.tsx
// ════════════════════════════════════════════════════════════════════════════
// Dossier Ejecutivo — 4 actos con número ancla por acto.
// Arquitectura: Flujo tipográfico libre, whileInView, space-y-24.
// Motores: 1 (Tenure), 2 (Gerencia), 3 (Liderazgo), 4 (Sucesión)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useState } from 'react'
import { HelpCircle, X, Target, ArrowRight, Clock, Zap, Shield, UserMinus, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatCurrency } from '../PLTalent.utils'
import type { BrechaProductivaData, SemaforoLegalData } from '../PLTalent.types'
import { ACOTADO_LABELS } from '@/lib/services/PositionAdapter'
import { getFamiliaVolumenNarrative, getWorstCellNarrative } from '@/config/narratives/FamiliaVolumenDictionary'
import { BUSINESS_IMPACT_DICTIONARY } from '@/config/narratives/BusinessImpactDictionary'
import { LEADERSHIP_RISK_DICTIONARY } from '@/config/narratives/LeadershipRiskDictionary'
import { TENURE_ROLEFIT_DICTIONARY, type TenureTrend } from '@/config/narratives/TenureRoleFitDictionary'
import ScientificBackingTooltip from '@/components/shared/ScientificBackingTooltip'
import { SCIENTIFIC_BACKING } from '@/config/narratives/ScientificBackingDictionary'
import type { GerenciaImpact } from '@/config/narratives/BusinessImpactDictionary'
import type { ExecutiveRiskPayload } from '@/lib/services/TalentRiskOrchestrator'
import PLTalentRadarModal from './PLTalentRadarModal'
import PLTalentLeadersModal from './PLTalentLeadersModal'
import PLTalentTenureModal from './PLTalentTenureModal'
import PLTalentCriticalRolesModal from './PLTalentCriticalRolesModal'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface RiskSummary {
  successionNarrative: string
  successionCombination: 'A' | 'B' | 'C' | 'D'
  successionMetrics?: { totalCriticalPositions: number; avgFitCriticos: number }
  tenureNarrative: { narrative: string; tone: 'positive' | 'negative'; tramo: 'A1' | 'A2' | 'A3' } | null
  byTenureTrend: { A1: number; A2: number; A3: number }
  gerenciaImpact: Record<string, GerenciaImpact>
  executiveSynthesis?: { classification: string; implication: string; risks?: { label: string; narrative: string }[]; financialNote?: string; path: string; accountability: string; supportingData?: { primaryMetric: string; primaryValue: string | number; secondaryMetrics?: { label: string; value: string | number }[] } } | null
}

interface PLTalentExecutiveBriefingProps {
  brecha: BrechaProductivaData
  semaforo: SemaforoLegalData
  riskSummary: RiskSummary | null
  riskProfiles: ExecutiveRiskPayload[]
  leadersAtRisk: number
  totalDirectReports: number
  totalManagers: number
  roleFit: number
  worstLayer?: string
  worstGerencia?: string
  worstCellCount?: number
  worstCellScore?: number
  companyName: string
  onNavigateToLens?: (lens: string) => void
  onNavigateToCargoFamily?: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const TOOLTIP_ITEMS = [
  { label: 'Metas', desc: 'qué se comprometió cada persona' },
  { label: 'Desempeño', desc: 'cuánto domina cada uno su cargo' },
  { label: 'Calibración', desc: 'si los criterios de evaluación son justos' },
  { label: 'Sucesión', desc: 'quién está listo para el siguiente nivel' },
]

const RISK_ICON_MAP: Record<string, typeof Clock> = {
  'Riesgo de Velocidad': Clock,
  'Vulnerabilidad de Continuidad': Zap,
  'Riesgo de Seguridad': Shield,
  'Fuga de Talento Técnico': UserMinus,
}

// ════════════════════════════════════════════════════════════════════════════
// TENURE CONNECTORS — Frase de transición por tramo × tone
// ════════════════════════════════════════════════════════════════════════════

const TENURE_CONNECTORS: Record<string, string> = {
  A3_negative: 'Para entender por qué este problema persiste, hay que mirar la composición de la dotación:',
  A2_negative: 'La inversión en desarrollo tampoco está dando los resultados esperados:',
  A1_negative: 'La señal más temprana viene de los ingresos recientes:',
  A1_positive: 'Los ingresos recientes muestran una señal alentadora:',
  A2_positive: 'La inversión en desarrollo está mostrando resultados:',
  A3_positive: 'El talento senior es una fortaleza de la organización:',
}

// ════════════════════════════════════════════════════════════════════════════
// ANIMATION — whileInView (scroll-triggered, once)
// ════════════════════════════════════════════════════════════════════════════

const viewport = { once: true, margin: '-80px' }

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport,
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
}

const fadeInDelay = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport,
  transition: { duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const },
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function PLTalentExecutiveBriefing({
  brecha,
  semaforo,
  riskSummary,
  riskProfiles,
  leadersAtRisk,
  totalDirectReports,
  totalManagers,
  roleFit,
  worstLayer,
  worstGerencia,
  worstCellCount,
  worstCellScore,
  companyName,
  onNavigateToLens,
  onNavigateToCargoFamily,
}: PLTalentExecutiveBriefingProps) {

  const [leadershipModalOpen, setLeadershipModalOpen] = useState(false)
  const [radarModalOpen, setRadarModalOpen] = useState(false)
  const [tenureModalOpen, setTenureModalOpen] = useState(false)
  const [criticalRolesModalOpen, setCriticalRolesModalOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)

  // ── Derived data (NO TOCAR) ─────────────────────────────────────────

  const totalGapAnnual = brecha.totalGapMonthly * 12
  const pctBajoEstandar = brecha.totalEvaluated > 0
    ? Math.round((brecha.totalPeople / brecha.totalEvaluated) * 100) : 0
  const pctLideres = totalManagers > 0
    ? Math.round((leadersAtRisk / totalManagers) * 100) : 0

  const nCriticosBajoEstandar = useMemo(() =>
    riskProfiles.filter(p => p.data.isIncumbentOfCriticalPosition && p.data.roleFitScore < 75).length
  , [riskProfiles])

  const familiaVolumen = useMemo(() => {
    if (brecha.byCargoFamily.length === 0) return null
    return [...brecha.byCargoFamily].sort((a, b) => b.headcount - a.headcount)[0]
  }, [brecha.byCargoFamily])

  const pctFamilia = familiaVolumen && brecha.totalPeople > 0
    ? Math.round((familiaVolumen.headcount / brecha.totalPeople) * 100)
    : 0

  const gerenciaTopCosto = useMemo(() => {
    if (brecha.byGerencia.length === 0) return null
    return [...brecha.byGerencia].sort((a, b) => b.gapMonthly - a.gapMonthly)[0]
  }, [brecha.byGerencia])

  const motor2Impact = useMemo((): GerenciaImpact | null => {
    if (!gerenciaTopCosto?.standardCategory) return null
    if (riskSummary?.gerenciaImpact?.[gerenciaTopCosto.standardCategory]) {
      return riskSummary.gerenciaImpact[gerenciaTopCosto.standardCategory]
    }
    return BUSINESS_IMPACT_DICTIONARY[gerenciaTopCosto.standardCategory] || null
  }, [gerenciaTopCosto, riskSummary])

  const gerenciaTramoData = useMemo(() => {
    if (!gerenciaTopCosto || riskProfiles.length === 0) return null
    const gerName = gerenciaTopCosto.gerenciaName.toLowerCase().split(' ').pop() || ''
    const gerProfiles = riskProfiles.filter(p =>
      p.data.departmentName.toLowerCase().includes(gerName)
    )
    if (gerProfiles.length === 0) return null
    const count = (trend: TenureTrend) => {
      const all = gerProfiles.filter(p => p.data.tenureTrend === trend)
      return {
        total: all.length,
        low: all.filter(p => p.data.roleFitScore < 75).length,
        high: all.filter(p => p.data.roleFitScore >= 75).length,
      }
    }
    const a1 = count('A1'), a2 = count('A2'), a3 = count('A3')
    const lowCounts = [
      { trend: 'A1' as TenureTrend, count: a1.low },
      { trend: 'A2' as TenureTrend, count: a2.low },
      { trend: 'A3' as TenureTrend, count: a3.low },
    ].sort((a, b) => b.count - a.count)
    const dominant = lowCounts[0].count > 0 ? lowCounts[0].trend : 'A2' as TenureTrend
    const dominantCount = lowCounts[0].count
    const narrative = TENURE_ROLEFIT_DICTIONARY[dominant].low
    return { a1, a2, a3, dominant, dominantCount, total: gerProfiles.length, totalLow: a1.low + a2.low + a3.low, totalHigh: a1.high + a2.high + a3.high, narrative }
  }, [gerenciaTopCosto, riskProfiles])

  const gerenciaBreakevenMonths = useMemo(() => {
    if (!gerenciaTopCosto || gerenciaTopCosto.gapMonthly <= 0) return null
    const legalPeople = semaforo.people.filter(p =>
      p.departmentName.toLowerCase().includes(
        gerenciaTopCosto.gerenciaName.toLowerCase().split(' ').pop() || ''
      )
    )
    if (legalPeople.length === 0) return null
    const totalFiniquito = legalPeople.reduce((s, p) => s + p.finiquitoToday, 0)
    return totalFiniquito > 0 ? Math.round(totalFiniquito / gerenciaTopCosto.gapMonthly) : null
  }, [gerenciaTopCosto, semaforo.people])

  const pctCriticos = nCriticosBajoEstandar > 0 && riskSummary?.successionMetrics
    ? Math.round((nCriticosBajoEstandar / riskSummary.successionMetrics.totalCriticalPositions) * 100)
    : 0

  // ── Guards ────────────────────────────────────────────────────────────

  if (brecha.totalPeople === 0) return null

  // ── Render — Dossier Ejecutivo ────────────────────────────────────────

  return (
    <>
      <div className="space-y-24">

        {/* ═══ SEPARADOR INICIAL ═══ */}
        <ActSeparator label="Productividad" color="cyan" />

        {/* ═══════════════════════════════════════════════════════════════
            ACTO 1 — EL DIAGNÓSTICO
            Ancla: {roleFit}% en cyan
        ═══════════════════════════════════════════════════════════════ */}
        <div>
          {/* Ancla — PICO 1 */}
          <motion.div {...fadeInDelay} className="text-center mb-10">
            <p className="text-7xl md:text-8xl font-extralight text-cyan-400 tracking-tight">
              {roleFit}%
            </p>
          </motion.div>

          {/* Narrativa P1 */}
          <motion.div {...fadeIn} className="space-y-4 max-w-2xl mx-auto">
            <p className="text-xl font-light text-slate-300 text-center">
              Tu organización opera al {roleFit}% de las competencias que sus cargos exigen.
            </p>

            <p className="text-base font-light text-slate-400 leading-relaxed">
              Al completar el proceso de gestión de talento en{' '}
              <span className="font-medium text-slate-200">{companyName}</span>,{' '}
              los algoritmos de FocalizaHR analizaron cada cargo contra las competencias que ese rol específicamente exige.{' '}
              <span className="relative inline-block align-middle">
                <button
                  onClick={() => setTooltipOpen(!tooltipOpen)}
                  onMouseEnter={() => setTooltipOpen(true)}
                  onMouseLeave={() => setTooltipOpen(false)}
                  className="text-slate-500 hover:text-slate-400 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 inline" strokeWidth={1.5} />
                </button>
                {tooltipOpen && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 shadow-xl z-50">
                    <p className="text-xs text-slate-300 mb-2.5">
                      El proceso de gestión de talento en {companyName} midió:
                    </p>
                    <div className="space-y-1.5">
                      {TOOLTIP_ITEMS.map(item => (
                        <div key={item.label} className="flex items-baseline gap-2">
                          <span className="text-slate-600 text-xs">·</span>
                          <span className="text-xs">
                            <span className="text-cyan-400 font-medium">{item.label}</span>
                            <span className="text-slate-500"> — {item.desc}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </span>
            </p>

            <p className="text-base font-light text-slate-400 leading-relaxed">
              De ese análisis, el <span className="font-medium text-slate-200">{pctBajoEstandar}%</span> de{' '}
              <span className="font-medium text-slate-200">{brecha.totalEvaluated}</span>{' '}
              personas evaluadas no alcanzan el estándar mínimo de su cargo, y se les paga igual que si lo cumplieran.
            </p>

            <p className="text-sm text-slate-500 mt-6">
              El análisis revela tres dimensiones del problema:
            </p>
          </motion.div>

          {/* P2 — Las tres dimensiones del problema */}
          {familiaVolumen && gerenciaTopCosto && (
            <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-8">
              {/* ── LA CONCENTRACIÓN ── */}
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">La concentración</p>

              <p className="text-base font-light text-slate-400 leading-relaxed mb-2">
                El <span className="font-medium text-slate-200">{pctFamilia}%</span> de esas personas,{' '}
                <span className="font-medium text-slate-200">{familiaVolumen.headcount}</span> de{' '}
                <span className="font-medium text-slate-200">{brecha.totalPeople}</span>, están en{' '}
                <span className="font-medium text-slate-200">{familiaVolumen.label}</span>.
              </p>

              {familiaVolumen.acotadoGroup && getFamiliaVolumenNarrative(familiaVolumen.acotadoGroup) && (
                <p className="text-base italic font-light text-slate-300 leading-relaxed mb-8">
                  {getFamiliaVolumenNarrative(familiaVolumen.acotadoGroup)}
                </p>
              )}

              {/* ── LA MAYOR EXPOSICIÓN AL RIESGO ── */}
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">La mayor exposición al riesgo</p>

              <p className="text-base font-light text-slate-400 leading-relaxed mb-8">
                <span className="font-medium text-slate-200">{gerenciaTopCosto.gerenciaName}</span>{' '}
                concentra el mayor riesgo de no alcanzar los objetivos del negocio.
                Adicional a este riesgo, su brecha de capacidades representa{' '}
                <span className="font-medium text-purple-400">{formatCurrency(gerenciaTopCosto.gapMonthly)}/mes</span>{' '}
                en gasto en salarios por productividad no entregada.
              </p>

              {/* ── EL PUNTO MÁS CRÍTICO ── */}
              {worstLayer && worstGerencia && worstCellScore !== undefined && (
                <>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">El punto más crítico</p>

                  <p className="text-base italic font-light text-slate-300 leading-relaxed mb-6">
                    {getWorstCellNarrative(worstLayer, worstGerencia, worstCellScore)}
                  </p>
                </>
              )}

              <SubtleLink onClick={() => setRadarModalOpen(true)}>
                Ver por familia de cargo
              </SubtleLink>
            </motion.div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SEPARADOR ACTO 1 → ACTO 2
        ═══════════════════════════════════════════════════════════════ */}
        {leadersAtRisk > 0 && (
          <ActSeparator label="Liderazgo" color="amber" />
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ACTO 2 — EL FRENO (condicional: leadersAtRisk > 0)
            Ancla: {pctLideres}% en amber
        ═══════════════════════════════════════════════════════════════ */}
        {leadersAtRisk > 0 && (
          <div>
            {/* Ancla */}
            <motion.div {...fadeInDelay} className="text-center mb-10">
              <p className="text-7xl md:text-8xl font-extralight text-amber-400 tracking-tight">
                {pctLideres}%
              </p>
            </motion.div>

            <motion.div {...fadeIn} className="space-y-4 max-w-2xl mx-auto">
              <p className="text-base font-light text-slate-400 leading-relaxed">
                De ese análisis, el <span className="font-medium text-amber-400">{pctLideres}%</span> de los{' '}
                <span className="font-medium text-amber-400">{leadersAtRisk}</span>{' '}
                líderes no alcanzan el estándar mínimo de su cargo, y se les paga igual que si lo cumplieran. Este dato es delicado porque amplifica el problema.
              </p>

              {/* ── EL AMPLIFICADOR ── */}
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">El amplificador</p>

              <p className="text-base font-light text-slate-400 leading-relaxed">
                Estos <span className="font-medium text-amber-400">{leadersAtRisk}</span> líderes operan bajo el estándar y afectan directamente a{' '}
                <span className="font-medium text-white">{totalDirectReports}</span> personas.
              </p>

              <p className="text-base italic font-light text-slate-300 leading-relaxed">
                Un líder que no domina su rol no solo compromete su propio resultado, arrastra el rendimiento de cada persona que depende de su dirección.
              </p>

              {/* CEO Message inline (no modal) */}
              <div className="border-l-2 border-cyan-500/30 pl-4 mt-6 mb-6">
                <p className="text-base italic text-slate-300 leading-relaxed">
                  &ldquo;{LEADERSHIP_RISK_DICTIONARY.ceoMessage}&rdquo;
                </p>
              </div>

              <ScientificBackingTooltip
                backing={SCIENTIFIC_BACKING.leadership_impact}
                position="bottom"
              />

              {/* Tax Items */}
              <div className="mt-4 mb-6">
                <p className="text-sm font-light text-slate-400 leading-relaxed mb-2">
                  {LEADERSHIP_RISK_DICTIONARY.taxNarrative}
                </p>
                <div className="space-y-2">
                  {LEADERSHIP_RISK_DICTIONARY.taxItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 mt-2 flex-shrink-0" />
                      <p className="text-sm font-light text-slate-400 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <SubtleLink onClick={() => setLeadershipModalOpen(true)}>
                Ver los {leadersAtRisk} líderes y sus equipos
              </SubtleLink>
            </motion.div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SEPARADOR ACTO 2 → ACTO 3: IMPACTO EN EL NEGOCIO
        ═══════════════════════════════════════════════════════════════ */}
        {motor2Impact && gerenciaTopCosto && (
          <ActSeparator label="Impacto en el Negocio" color="cyan" />
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ACTO 3 — DONDE EL LIDERAZGO FRENA AL NEGOCIO
        ═══════════════════════════════════════════════════════════════ */}
        {motor2Impact && gerenciaTopCosto && (
          <div>
            {/* Ancla */}
            <motion.div {...fadeInDelay} className="text-center mb-10">
              <p className="text-7xl md:text-8xl font-extralight text-amber-400 tracking-tight">
                -{100 - Math.round(gerenciaTopCosto.avgRoleFit)}%
              </p>
            </motion.div>

            <motion.div {...fadeIn} className="max-w-2xl mx-auto">
              <p className="text-xl font-light text-slate-300 text-center mb-10">
                Déficit de capacidad en {gerenciaTopCosto.gerenciaName}
              </p>

              {/* Narrativa de transición */}
              <div className="space-y-4 mb-10">
                <p className="text-base font-light text-slate-400 leading-relaxed">
                  La meta estructural de esta unidad es{' '}
                  <span className="font-medium text-slate-200">{motor2Impact.meta}</span>.
                  Sin embargo, operar con este déficit no solo representa{' '}
                  <span className="font-medium text-purple-400">{formatCurrency(gerenciaTopCosto.gapMonthly)}/mes</span>{' '}
                  en salarios sin retorno completo. Ese es el mal menor.
                </p>
                <p className="text-base font-light text-slate-400 leading-relaxed">
                  El verdadero impacto es el costo de oportunidad. Cuando esta área opera bajo el mínimo, frena los resultados de toda la organización y expone la operación a riesgos concretos:
                </p>
              </div>

              {/* Riesgos — contexto que sostiene la afirmación */}
              <div className="space-y-6 mb-10">
                {motor2Impact.risks.map((risk, idx) => {
                  const icons = [Clock, Zap, Shield, UserMinus]
                  const Icon = icons[idx] || Clock
                  return (
                    <div key={idx}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon size={14} className="text-slate-500 flex-shrink-0" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-slate-200">{risk.label}</p>
                      </div>
                      <p className="text-sm font-light text-slate-400 leading-relaxed">{risk.narrative}</p>
                    </div>
                  )
                })}
              </div>

              <ScientificBackingTooltip
                backing={SCIENTIFIC_BACKING.brecha_productiva}
                position="bottom"
              />

              {/* Ownership */}
              <p className="mt-10 text-base italic font-light text-slate-300 leading-relaxed">
                La mitigación de estos riesgos no es delegable. Es responsabilidad del liderazgo de {gerenciaTopCosto.gerenciaName}.
              </p>

            </motion.div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SEPARADOR ACTO 2 → ACTO 3
        ═══════════════════════════════════════════════════════════════ */}
        <ActSeparator label="Impacto Financiero" color="purple" />

        {/* ═══════════════════════════════════════════════════════════════
            ACTO 3 — EL COSTO
            Ancla: {totalGapAnnual} en purple
        ═══════════════════════════════════════════════════════════════ */}
        <div>
          {/* Ancla — PICO 2 */}
          <motion.div {...fadeInDelay} className="text-center mb-10">
            <p className="text-7xl md:text-8xl font-extralight text-purple-400 tracking-tight">
              {formatCurrency(totalGapAnnual)}
            </p>
            <p className="text-xl text-purple-400 mt-3">
              anuales
            </p>
            <p className="text-xl font-light text-slate-300 mt-4">
              en productividad no entregada
            </p>
          </motion.div>

          <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4 mb-10">
            <p className="text-base font-light text-slate-400 leading-relaxed">
              Los riesgos que vimos por gerencia tienen un costo concreto: salarios pagados sobre el rendimiento real entregado.
            </p>
            <p className="text-base font-light text-slate-400 leading-relaxed">
              Operar al <span className="font-medium text-cyan-400">{roleFit}%</span> de las competencias requeridas genera{' '}
              <span className="font-medium text-purple-400">{formatCurrency(totalGapAnnual)}</span> anuales en productividad no entregada. No es una proyección, es lo que la organización ya está pagando hoy.
            </p>
          </motion.div>

          {/* P7 — Antigüedad (fluye desde P5) */}
          {riskSummary?.tenureNarrative && (
            <motion.div {...fadeIn} className="mt-10 max-w-2xl mx-auto">
              <div>
                <p className="text-sm font-light text-slate-400 mb-3">
                  {TENURE_CONNECTORS[`${riskSummary.tenureNarrative.tramo}_${riskSummary.tenureNarrative.tone}`]}
                </p>
                <p className="text-sm italic font-light text-slate-300 mb-3">
                  {riskSummary.tenureNarrative.narrative}
                </p>
                <SubtleLink onClick={() => setTenureModalOpen(true)}>
                  Ver análisis por antigüedad
                </SubtleLink>
              </div>
            </motion.div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SEPARADOR ACTO 3 → ACTO 4
        ═══════════════════════════════════════════════════════════════ */}
        {riskSummary && riskSummary.successionNarrative && nCriticosBajoEstandar > 0 && (
          <ActSeparator label="Cargos Críticos" color="amber" />
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ACTO 4 — EL RIESGO FUTURO (condicional: cargos críticos)
            Ancla: {pctCriticos}% en amber
        ═══════════════════════════════════════════════════════════════ */}
        {riskSummary && riskSummary.successionNarrative && nCriticosBajoEstandar > 0 && riskSummary.successionMetrics && (
          <div>
            {/* Ancla */}
            <motion.div {...fadeInDelay} className="text-center mb-10">
              <p className="text-7xl md:text-8xl font-extralight text-amber-400 tracking-tight">
                {pctCriticos}%
              </p>
              <p className="text-xl font-light text-slate-300 mt-4">
                de cargos críticos bajo el estándar
              </p>
            </motion.div>

            <motion.div {...fadeIn} className="space-y-4 max-w-2xl mx-auto">
              <p className="text-base font-light text-slate-400 leading-relaxed">
                Los cargos críticos son el motor del negocio. No el complemento. El motor.
              </p>

              <p className="text-base font-light text-slate-400 leading-relaxed">
                Cuando ese motor opera bajo el mínimo, no falla solo. Arrastra a toda la cadena que depende de sus resultados.
              </p>

              <p className="text-base italic font-light text-slate-300 leading-relaxed">
                Una organización es tan fuerte como su eslabón más débil. Hoy, ese eslabón son sus posiciones críticas.
              </p>

              <p className="text-base text-slate-300">
                El <span className="font-medium text-amber-400">{pctCriticos}%</span> de los cargos críticos (
                <span className="font-medium text-white">{nCriticosBajoEstandar}</span> de{' '}
                <span className="font-medium text-white">{riskSummary.successionMetrics.totalCriticalPositions}</span>)
                {' '}no rinde al nivel que la operación exige.
              </p>

              <p className="text-sm italic font-light text-slate-300">
                {riskSummary.successionNarrative}
              </p>

              <SubtleLink onClick={() => setCriticalRolesModalOpen(true)}>
                {(riskSummary.successionCombination === 'B' || riskSummary.successionCombination === 'D') && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block mr-1.5" />
                )}
                Ver Matriz Predictiva de Continuidad
              </SubtleLink>
            </motion.div>
          </div>
        )}

        {/* ═══ SEPARADOR → SÍNTESIS (prominente) ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center gap-4"
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-700/40 to-transparent" />
          <span className="px-5 py-2 text-[11px] font-semibold uppercase tracking-widest border rounded-full bg-cyan-500/10 border-cyan-500/20 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Síntesis Ejecutiva
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-700/40 to-transparent" />
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            CIERRE — SÍNTESIS EJECUTIVA (El Veredicto)
            Ancla: supportingData.primaryValue en cyan
        ═══════════════════════════════════════════════════════════════ */}
        {riskSummary?.executiveSynthesis && (
          <div>
            {/* Ancla — Primary Metric del diagnóstico */}
            {riskSummary.executiveSynthesis.supportingData && (
              <motion.div {...fadeInDelay} className="text-center mb-10">
                <p className="text-7xl md:text-8xl font-extralight text-cyan-400 tracking-tight">
                  {riskSummary.executiveSynthesis.supportingData.primaryValue}
                </p>
                <p className="text-sm text-slate-500 mt-3">
                  {riskSummary.executiveSynthesis.supportingData.primaryMetric}
                </p>
              </motion.div>
            )}

            <motion.div {...fadeIn} className="max-w-2xl mx-auto">
              {/* Classification — La frase asesina */}
              <p className="text-xl font-light text-slate-200 leading-relaxed mb-6">
                {riskSummary.executiveSynthesis.classification}
              </p>

              {/* Implication — La evidencia */}
              <p className="text-base italic font-light text-slate-300 leading-relaxed mb-8">
                {riskSummary.executiveSynthesis.implication}
              </p>

              {/* Riesgos estructurados (solo CONCENTRACION) */}
              {riskSummary.executiveSynthesis.risks && riskSummary.executiveSynthesis.risks.length > 0 && (
                <div className="space-y-6 mb-8">
                  {riskSummary.executiveSynthesis.risks.map((risk, idx) => {
                    const icons = [Clock, Zap, Shield, UserMinus]
                    const Icon = icons[idx] || Clock
                    return (
                      <div key={idx}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon size={14} className="text-slate-500 flex-shrink-0" strokeWidth={1.5} />
                          <p className="text-sm font-medium text-slate-200">{risk.label}</p>
                        </div>
                        <p className="text-sm font-light text-slate-400 leading-relaxed">{risk.narrative}</p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Nota financiera (solo CONCENTRACION) */}
              {riskSummary.executiveSynthesis.financialNote && (
                <p className="text-base font-light text-slate-400 leading-relaxed mb-8">
                  {riskSummary.executiveSynthesis.financialNote}
                </p>
              )}

              {/* Separador Tesla — "El Camino" */}
              <div className="flex items-center gap-3 mb-6 mt-10">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
                <span className="text-xs uppercase tracking-widest text-cyan-400">El Camino</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
              </div>

              {/* Path — La dirección */}
              <p className="text-base font-light text-slate-300 leading-relaxed mb-10">
                {riskSummary.executiveSynthesis.path}
              </p>

              {/* Accountability — Footer institucional */}
              <div className="border-t border-slate-800/50 pt-6">
                <p className="text-sm font-light text-slate-500 italic text-center">
                  {riskSummary.executiveSynthesis.accountability}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* ═══ CIERRE — FIN DEL ANÁLISIS ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center justify-center gap-4 pt-8"
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />
          <div className="flex items-center gap-3">
            <div className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-light">
              Fin del Análisis
            </span>
            <div className="w-1 h-1 rounded-full bg-slate-600" />
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />
        </motion.div>

      </div>

      {/* ═══ LEADERS MODAL ═══ */}
      <PLTalentLeadersModal
        isOpen={leadershipModalOpen}
        onClose={() => setLeadershipModalOpen(false)}
        riskProfiles={riskProfiles}
      />

      {/* ═══ RADAR MODAL ═══ */}
      <PLTalentRadarModal
        isOpen={radarModalOpen}
        onClose={() => setRadarModalOpen(false)}
        byCargoFamily={brecha.byCargoFamily}
        totalPeople={brecha.totalPeople}
      />

      {/* ═══ TENURE MODAL ═══ */}
      <PLTalentTenureModal
        isOpen={tenureModalOpen}
        onClose={() => setTenureModalOpen(false)}
        riskProfiles={riskProfiles}
      />

      {/* ═══ CRITICAL ROLES MODAL ═══ */}
      <PLTalentCriticalRolesModal
        isOpen={criticalRolesModalOpen}
        onClose={() => setCriticalRolesModalOpen(false)}
        riskProfiles={riskProfiles}
        pctCriticos={pctCriticos}
        avgFitCriticos={riskSummary?.successionMetrics?.avgFitCriticos ?? 0}
      />
    </>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// ACT SEPARATOR — Badge entre actos
// ════════════════════════════════════════════════════════════════════════════

function ActSeparator({ label, color }: { label: string; color: 'amber' | 'purple' | 'cyan' }) {
  const colors = {
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  }
  const lineColor = {
    amber: 'via-amber-700/30',
    purple: 'via-purple-700/30',
    cyan: 'via-cyan-700/30',
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center gap-4"
    >
      <div className={cn('flex-1 h-px bg-gradient-to-r from-transparent to-transparent', lineColor[color])} />
      <span className={cn('px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest border rounded-full', colors[color])}>
        {label}
      </span>
      <div className={cn('flex-1 h-px bg-gradient-to-r from-transparent to-transparent', lineColor[color])} />
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUBTLE LINK — Reutilizable con flecha animada
// ════════════════════════════════════════════════════════════════════════════

const SubtleLink = memo(function SubtleLink({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
    >
      {children}
      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
})
