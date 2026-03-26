'use client'

// ════════════════════════════════════════════════════════════════════════════
// EXECUTIVE BRIEFING — "La Cascada de la Verdad"
// src/app/dashboard/executive-hub/components/PLTalent/components/PLTalentExecutiveBriefing.tsx
// ════════════════════════════════════════════════════════════════════════════
// 6 párrafos condicionales que traducen datos duros en narrativa ejecutiva.
// Motores: 1 (Tenure), 2 (Gerencia), 3 (Liderazgo), 4 (Sucesión)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useState } from 'react'
import { HelpCircle, X, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatCurrency } from '../PLTalent.utils'
import type { BrechaProductivaData, SemaforoLegalData } from '../PLTalent.types'
import { BUSINESS_IMPACT_DICTIONARY } from '@/config/narratives/BusinessImpactDictionary'
import { LEADERSHIP_RISK_DICTIONARY } from '@/config/narratives/LeadershipRiskDictionary'
import { TENURE_ROLEFIT_DICTIONARY, type TenureTrend } from '@/config/narratives/TenureRoleFitDictionary'
import ScientificBackingTooltip from '@/components/shared/ScientificBackingTooltip'
import { SCIENTIFIC_BACKING } from '@/config/narratives/ScientificBackingDictionary'
import type { GerenciaImpact } from '@/config/narratives/BusinessImpactDictionary'
import type { ExecutiveRiskPayload } from '@/lib/services/TalentRiskOrchestrator'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface RiskSummary {
  successionNarrative: string
  successionCombination: 'A' | 'B' | 'C' | 'D'
  successionMetrics?: { totalCriticalPositions: number; avgFitCriticos: number }
  tenureNarrative: { narrative: string; tone: 'positive' | 'negative' } | null
  byTenureTrend: { A1: number; A2: number; A3: number }
  gerenciaImpact: Record<string, GerenciaImpact>
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
  companyName: string
  onNavigateToLens?: (lens: string) => void
  onNavigateToCargoFamily?: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// TOOLTIP CONTENT
// ════════════════════════════════════════════════════════════════════════════

const TOOLTIP_ITEMS = [
  { label: 'Metas', desc: 'qué se comprometió cada persona' },
  { label: 'Desempeño', desc: 'cuánto domina cada uno su cargo' },
  { label: 'Calibración', desc: 'si los criterios de evaluación son justos' },
  { label: 'Sucesión', desc: 'quién está listo para el siguiente nivel' },
]

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
  companyName,
  onNavigateToLens,
  onNavigateToCargoFamily,
}: PLTalentExecutiveBriefingProps) {

  const [leadershipModalOpen, setLeadershipModalOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)

  // ── Derived data ──────────────────────────────────────────────────────

  const totalGapAnnual = brecha.totalGapMonthly * 12
  const pctBajoEstandar = brecha.totalEvaluated > 0
    ? Math.round((brecha.totalPeople / brecha.totalEvaluated) * 100) : 0
  const pctLideres = totalManagers > 0
    ? Math.round((leadersAtRisk / totalManagers) * 100) : 0
  const nCriticosBajoEstandar = useMemo(() =>
    riskProfiles.filter(p => p.data.isIncumbentOfCriticalPosition && p.data.roleFitScore < 75).length
  , [riskProfiles])

  // Párrafo 2: familia con más PERSONAS (volumen)
  const familiaVolumen = useMemo(() => {
    if (brecha.byCargoFamily.length === 0) return null
    return [...brecha.byCargoFamily].sort((a, b) => b.headcount - a.headcount)[0]
  }, [brecha.byCargoFamily])

  // Párrafo 2 línea 2 + Párrafo 3: gerencia con mayor COSTO (impacto)
  const gerenciaTopCosto = useMemo(() => {
    if (brecha.byGerencia.length === 0) return null
    return [...brecha.byGerencia].sort((a, b) => b.gapMonthly - a.gapMonthly)[0]
  }, [brecha.byGerencia])

  // Párrafo 3: Motor 2 de esa gerencia
  const motor2Impact = useMemo((): GerenciaImpact | null => {
    if (!gerenciaTopCosto?.standardCategory) return null
    if (riskSummary?.gerenciaImpact?.[gerenciaTopCosto.standardCategory]) {
      return riskSummary.gerenciaImpact[gerenciaTopCosto.standardCategory]
    }
    return BUSINESS_IMPACT_DICTIONARY[gerenciaTopCosto.standardCategory] || null
  }, [gerenciaTopCosto, riskSummary])

  // Párrafo 3: risks inline como lista de labels
  const motor2RisksInline = useMemo(() => {
    if (!motor2Impact) return ''
    const labels = motor2Impact.risks.map(r => r.label.toLowerCase())
    if (labels.length <= 1) return labels[0] || ''
    return labels.slice(0, -1).join(', ') + ' y ' + labels[labels.length - 1]
  }, [motor2Impact])

  // Párrafo 3: distribución por tramo de la gerencia top (Motor 1 × Motor 2 cruzado)
  // Base total (sin filtro prematuro) — separa fit alto y bajo por tramo
  const gerenciaTramoData = useMemo(() => {
    if (!gerenciaTopCosto || riskProfiles.length === 0) return null

    // TODOS los profiles de esta gerencia (fit alto Y bajo)
    const gerName = gerenciaTopCosto.gerenciaName.toLowerCase().split(' ').pop() || ''
    const gerProfiles = riskProfiles.filter(p =>
      p.data.departmentName.toLowerCase().includes(gerName)
    )
    if (gerProfiles.length === 0) return null

    // Conteo por tramo: total, bajo fit, alto fit
    const count = (trend: TenureTrend) => {
      const all = gerProfiles.filter(p => p.data.tenureTrend === trend)
      return {
        total: all.length,
        low: all.filter(p => p.data.roleFitScore < 75).length,
        high: all.filter(p => p.data.roleFitScore >= 75).length,
      }
    }
    const a1 = count('A1')
    const a2 = count('A2')
    const a3 = count('A3')

    // Tramo dominante (por cantidad de bajo fit)
    const lowCounts = [
      { trend: 'A1' as TenureTrend, count: a1.low },
      { trend: 'A2' as TenureTrend, count: a2.low },
      { trend: 'A3' as TenureTrend, count: a3.low },
    ].sort((a, b) => b.count - a.count)

    const dominant = lowCounts[0].count > 0 ? lowCounts[0].trend : 'A2' as TenureTrend
    const dominantCount = lowCounts[0].count
    const narrative = TENURE_ROLEFIT_DICTIONARY[dominant].low

    return {
      a1, a2, a3,
      dominant, dominantCount,
      total: gerProfiles.length,
      totalLow: a1.low + a2.low + a3.low,
      totalHigh: a1.high + a2.high + a3.high,
      narrative,
    }
  }, [gerenciaTopCosto, riskProfiles])

  // Párrafo 3: breakeven por gerencia (cruce brecha × semáforo)
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

  // Párrafo 5: narrativa de tenure viene pre-calculada del backend (summary.tenureNarrative)

  // ── Guards ────────────────────────────────────────────────────────────

  if (brecha.totalPeople === 0) return null

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <>
      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-6 md:p-8">

        {/* ═══ TOOLTIP — Proceso de gestión de talento ═══ */}
        <div className="relative inline-block mb-8">
          <button
            onClick={() => setTooltipOpen(!tooltipOpen)}
            onMouseEnter={() => setTooltipOpen(true)}
            onMouseLeave={() => setTooltipOpen(false)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Proceso de gestión de talento</span>
          </button>

          {tooltipOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 shadow-xl z-50">
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
        </div>

        <div className="space-y-6">

          {/* ═══ P1 — Capacidad organizacional + hallazgo ═══ */}
          <p className="text-base font-light text-slate-300 leading-relaxed">
            Tu organización opera al{' '}
            <span className="text-cyan-400 font-medium">{roleFit}%</span>{' '}
            de las competencias que sus cargos exigen.
          </p>
          <p className="text-base font-light text-slate-300 leading-relaxed">
            Al completar el proceso de gestión de talento en {companyName}, los algoritmos de FocalizaHR analizaron cada cargo contra las competencias que ese rol específicamente exige.
          </p>
          <p className="text-base font-light text-slate-300 leading-relaxed">
            <span className="text-cyan-400 font-medium">{pctBajoEstandar}%</span> de{' '}
            <span className="text-cyan-400 font-medium">{brecha.totalEvaluated}</span>{' '}
            personas evaluadas no alcanzan el estándar mínimo de su cargo, y se les paga igual que si lo cumplieran.
          </p>

          {/* ═══ P2 — Concentración + costo ═══ */}
          {familiaVolumen && gerenciaTopCosto && (
            <div>
              <p className="text-base font-light text-slate-300 leading-relaxed">
                <span className="text-cyan-400 font-medium">{familiaVolumen.headcount}</span>{' '}
                de esas personas están en{' '}
                <span className="text-cyan-400 font-medium">{familiaVolumen.label}</span>,{' '}
                la mayor concentración del problema.
              </p>
              <p className="text-base font-light text-slate-300 leading-relaxed mt-4">
                El mayor costo financiero está en{' '}
                <span className="text-cyan-400 font-medium">{gerenciaTopCosto.gerenciaName}</span>:{' '}
                <span className="text-cyan-400 font-medium">{formatCurrency(gerenciaTopCosto.gapMonthly)}/mes</span>.
              </p>
              <button
                onClick={onNavigateToCargoFamily}
                className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
              >
                Ver por familia de cargo →
              </button>
            </div>
          )}

          {/* ═══ P3 — Motor 3: Liderazgo (condicional) ═══ */}
          {leadersAtRisk > 0 && (
            <div>
              <p className="text-base font-light text-slate-300 leading-relaxed">
                El dato más delicado está en la línea de mando:{' '}
                <span className="text-cyan-400 font-medium">{pctLideres}%</span> de los{' '}
                <span className="text-cyan-400 font-medium">{leadersAtRisk}</span>{' '}
                líderes operan bajo el estándar de su cargo.
              </p>
              <p className="text-base font-light text-slate-300 leading-relaxed">
                Un líder que no domina su rol no solo compromete su propio resultado, arrastra el rendimiento de las{' '}
                <span className="text-cyan-400 font-medium">{totalDirectReports}</span>{' '}
                personas que dependen de su dirección.
              </p>
              <button
                onClick={() => setLeadershipModalOpen(true)}
                className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
              >
                Ver detalle →
              </button>
            </div>
          )}

          {/* ═══ P4 — Motor 2 × Motor 1: Revelación de Negocio ═══ */}
          {motor2Impact && gerenciaTopCosto && (
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-2xl overflow-hidden">
              <div className="fhr-top-line" />

              {/* ── ZONA 1: Hero financiero + badge meta ── */}
              <div className="px-6 pt-8 pb-6 text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-medium text-cyan-400 uppercase tracking-widest mb-4">
                  Meta: {motor2Impact.meta}
                </span>
                <p className="text-sm text-slate-400 font-light mb-2">{gerenciaTopCosto.gerenciaName}</p>
                <p className="text-4xl md:text-5xl font-light text-purple-400 tracking-tight">
                  {formatCurrency(gerenciaTopCosto.gapMonthly)}
                  <span className="text-lg text-slate-500 font-light">/mes</span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {gerenciaTopCosto.headcount} personas bajo el estándar · Fit promedio {gerenciaTopCosto.avgRoleFit}%
                </p>
                {gerenciaBreakevenMonths && (
                  <p className="text-xs text-amber-400/70 mt-2 font-light italic">
                    En {gerenciaBreakevenMonths} meses, mantener esta brecha costará más que resolverla.
                  </p>
                )}
              </div>

              {/* ── ZONA 1.5: Diagnóstico temporal (Motor 1 cruzado) ── */}
              {gerenciaTramoData && (
                <div className="px-6 pb-5">
                  <div className="flex items-center justify-center gap-5 text-xs">
                    {gerenciaTramoData.a1.low > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span className="text-slate-400">{gerenciaTramoData.a1.low} nuevos bajo estándar</span>
                      </span>
                    )}
                    {gerenciaTramoData.a2.low > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="text-slate-400">{gerenciaTramoData.a2.low} en zona de verdad</span>
                      </span>
                    )}
                    {gerenciaTramoData.a3.low > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className={cn('w-1.5 h-1.5 rounded-full', gerenciaTramoData.dominant === 'A3' ? 'bg-red-400 animate-pulse' : 'bg-red-400')} />
                        <span className="text-slate-400">{gerenciaTramoData.a3.low} con decisión pendiente</span>
                      </span>
                    )}
                  </div>
                  {gerenciaTramoData.dominantCount > 1 && (
                    <p className="text-xs text-slate-500 text-center mt-2 font-light italic">
                      {gerenciaTramoData.narrative.narrativeShort}
                    </p>
                  )}
                </div>
              )}

              {/* ── ZONA 2: Consecuencia de negocio ── */}
              <div className="px-6 pb-6 space-y-4">
                <p className="text-base font-light text-slate-300 leading-relaxed">
                  Operar bajo el estándar en{' '}
                  <span className="text-cyan-400 font-medium">{gerenciaTopCosto.gerenciaName}</span>{' '}
                  no es un problema de personas, es un problema de resultados.
                </p>
                <p className="text-sm font-light text-slate-400 leading-relaxed">
                  {motor2Impact.introNarrative}
                </p>

                {/* Risks con accordion */}
                <div className="space-y-1 pl-1">
                  {motor2Impact.risks.map((risk, idx) => (
                    <RiskAccordionItem key={idx} label={risk.label} narrative={risk.narrative} />
                  ))}
                </div>

                {/* Respaldo científico */}
                <ScientificBackingTooltip
                  backing={SCIENTIFIC_BACKING.brecha_productiva}
                  position="bottom"
                />
              </div>

              {/* ── ZONA 3: Ownership ── */}
              <div className="px-6 pb-6">
                <div className="bg-slate-800/40 backdrop-blur border border-slate-700/20 rounded-xl p-4 flex items-start gap-3">
                  <Target className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-light text-slate-200 leading-relaxed">
                      Eso lo gestiona el liderazgo de {gerenciaTopCosto.gerenciaName}, no la Gerencia de Personas.
                    </p>
                    <button
                      onClick={() => onNavigateToLens?.('gerencia')}
                      className="mt-2 text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors"
                    >
                      Ver qué pasa en {gerenciaTopCosto.gerenciaName} →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ P5 — Ineficiencia financiera directa ═══ */}
          <div>
            <p className="text-base font-light text-slate-300 leading-relaxed">
              Operar bajo el estándar no solo expone al negocio a los riesgos que ya vimos por gerencia.
            </p>
            <p className="text-base font-light text-slate-300 leading-relaxed">
              También genera una ineficiencia directa en el gasto:{' '}
              <span className="text-cyan-400 font-medium">{formatCurrency(totalGapAnnual)}</span>{' '}
              anuales en salarios pagados sobre el rendimiento real entregado.
            </p>
          </div>

          {/* ═══ P6 — Motor 4: Cargos Críticos (condicional) ═══ */}
          {riskSummary && riskSummary.successionNarrative && (
            <div>
              {nCriticosBajoEstandar > 0 && riskSummary.successionMetrics && (
                <>
                  <p className="text-base font-light text-slate-300 leading-relaxed">
                    El negocio exige rendimiento en sus posiciones críticas sobre todo. Cuando algunas operan bajo el mínimo, toda la cadena pierde efectividad — la organización es tan fuerte como su eslabón más débil, y hoy, parte de ese eslabón opera bajo su capacidad real.
                  </p>
                  <p className="text-base font-light text-slate-300 leading-relaxed mb-4">
                    El{' '}
                    <span className="text-cyan-400 font-medium">
                      {Math.round((nCriticosBajoEstandar / riskSummary.successionMetrics.totalCriticalPositions) * 100)}%
                    </span>{' '}
                    de los cargos críticos (
                    <span className="text-cyan-400 font-medium">{nCriticosBajoEstandar}</span> de{' '}
                    <span className="text-cyan-400 font-medium">{riskSummary.successionMetrics.totalCriticalPositions}</span>)
                    {' '}no rinde al nivel que la operación exige.
                  </p>
                </>
              )}
              <p className="text-base font-light text-slate-300 leading-relaxed">
                {riskSummary.successionNarrative}
              </p>
              <button
                onClick={() => onNavigateToLens?.('critical')}
                className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors inline-flex items-center gap-1.5"
              >
                {(riskSummary.successionCombination === 'B' || riskSummary.successionCombination === 'D') && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                )}
                Ver Matriz Predictiva de Continuidad →
              </button>
            </div>
          )}

          {/* ═══ P7 — Motor 1: Antigüedad (backend-driven) ═══ */}
          {riskSummary?.tenureNarrative && (
            <div>
              <p className="text-sm font-light text-slate-400 leading-relaxed mb-2">
                {riskSummary.tenureNarrative.tone === 'negative'
                  ? 'A esto se suma una señal que viene desde la composición misma de la dotación:'
                  : 'Hay una señal que matiza el escenario:'}
              </p>
              <p className="text-base font-light text-slate-300 leading-relaxed">
                {riskSummary.tenureNarrative.narrative}
              </p>
              <button
                onClick={() => onNavigateToLens?.('tenure')}
                className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
              >
                Ver análisis por antigüedad →
              </button>
            </div>
          )}

          {/* ═══ P8 — Síntesis ejecutiva ═══ */}
          <div className="border-l-2 border-cyan-500/30 pl-4 mt-4">
            <p className="text-base font-light text-slate-200 leading-relaxed">
              <span className="text-cyan-400 font-medium">{roleFit}%</span> de capacidad organizacional real.{' '}
              <span className="text-cyan-400 font-medium">{formatCurrency(totalGapAnnual)}</span> en productividad pagada y no entregada.
              {leadersAtRisk > 0 && (
                <>{' '}<span className="text-cyan-400 font-medium">{leadersAtRisk}</span> líderes que amplifican el problema.</>
              )}
            </p>
            <p className="text-base font-light text-slate-200 leading-relaxed mt-4">
              La conversación que exigen estos números no la lidera la Gerencia de Personas. La dan los líderes de cada área sobre la eficiencia de su propia máquina.
            </p>
          </div>

        </div>
      </div>

      {/* ═══ LEADERSHIP MODAL ═══ */}
      {leadershipModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setLeadershipModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
              <div className="fhr-top-line" />

              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-0">
                <h3 className="text-lg font-light text-white">Multiplicador de Liderazgo</h3>
                <button
                  onClick={() => setLeadershipModalOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* CEO Quote */}
                <div className="border-l-2 border-cyan-500/30 pl-4">
                  <p className="text-sm italic text-slate-300 leading-relaxed">
                    &ldquo;{LEADERSHIP_RISK_DICTIONARY.ceoMessage}&rdquo;
                  </p>
                </div>

                {/* Scientific Backing */}
                <ScientificBackingTooltip
                  backing={SCIENTIFIC_BACKING.leadership_impact}
                  position="bottom"
                />

                {/* Tax Items — las 4 consecuencias */}
                <div>
                  <p className="text-xs text-slate-500 mb-3">{LEADERSHIP_RISK_DICTIONARY.taxNarrative}</p>
                  <div className="space-y-2">
                    {LEADERSHIP_RISK_DICTIONARY.taxItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 mt-1.5 flex-shrink-0" />
                        <p className="text-sm font-light text-slate-300 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Context */}
                <p className="text-xs text-slate-600 text-center">
                  {leadersAtRisk} líderes afectan a {totalDirectReports} personas
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// RISK ACCORDION ITEM — Expand inline para Motor 2 risks
// ════════════════════════════════════════════════════════════════════════════

function RiskAccordionItem({ label, narrative }: { label: string; narrative: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left py-1.5 group"
      >
        <span className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors',
          open ? 'bg-cyan-400' : 'bg-slate-600 group-hover:bg-slate-400'
        )} />
        <span className={cn(
          'text-sm transition-colors',
          open ? 'text-cyan-400 font-medium' : 'text-slate-400 group-hover:text-slate-300 font-light'
        )}>
          {label}
        </span>
      </button>
      {open && (
        <p className="text-sm font-light text-slate-400 leading-relaxed pl-[22px] pb-2">
          {narrative}
        </p>
      )}
    </div>
  )
}
