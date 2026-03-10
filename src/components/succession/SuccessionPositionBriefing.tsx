'use client'

// ════════════════════════════════════════════════════════════════════════════
// SUCCESSION POSITION BRIEFING
// src/components/succession/SuccessionPositionBriefing.tsx
//
// Portada ejecutiva que aparece ANTES de las tabs al abrir un cargo crítico.
// Responde el "Acto 1" de la narrativa: ¿Está cubierto? ¿Hay urgencia? ¿Qué hago?
//
// Flujo:
//   click cargo → SuccessionPositionBriefing → click CTA → Tabs (candidates | suggestions)
//
// Estado controlado por showBriefing en SuccessionSpotlightCard.tsx
// NO reemplaza showCover (que controla la portada del tab SUGERIDOS)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { User, AlertTriangle, Users, ArrowRight, Shield, Clock } from 'lucide-react'
import { TalentNarrativeService } from '@/lib/services/TalentNarrativeService'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface BriefingPosition {
  id: string
  positionTitle: string
  standardJobLevel: string | null
  benchStrength: string
  incumbentFlightRisk: string | null
  incumbentRetirementDate: string | null
  department: { displayName: string } | null
  incumbent: {
    fullName: string
    position?: string | null
    riskQuadrant?: string | null
    mobilityQuadrant?: string | null
    riskAlertLevel?: string | null
  } | null
}

interface BriefingCandidate {
  readinessLevel: string
  readinessOverride: string | null
}

interface SuccessionPositionBriefingProps {
  position: BriefingPosition
  candidates: BriefingCandidate[]
  onContinue: (initialTab: 'candidates' | 'suggestions') => void
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVAS — Riesgo del Titular (basado en riskQuadrant de PerformanceRating)
// Fuente: enrichWithTalentQuadrants → incumbent.riskQuadrant
// ════════════════════════════════════════════════════════════════════════════

const INCUMBENT_RISK_CONFIG: Record<string, {
  badge: string
  badgeColor: string
  dotColor: string
  headline: string
  subline: string
  urgency: string | null
}> = {
  FUGA_CEREBROS: {
    badge: 'ALTO',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    dotColor: 'bg-red-500',
    headline: 'Señales activas de desvinculación',
    subline: 'Alto dominio · Bajo engagement',
    urgency: 'Conversación de retención urgente',
  },
  BURNOUT_RISK: {
    badge: 'MEDIO',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    dotColor: 'bg-amber-500',
    headline: 'Riesgo de desgaste',
    subline: 'Señales de agotamiento o sobrecarga',
    urgency: 'Monitorear próximo trimestre',
  },
  BAJO_RENDIMIENTO: {
    badge: 'MEDIO',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    dotColor: 'bg-amber-500',
    headline: 'Bajo rendimiento',
    subline: 'Requiere plan de mejora',
    urgency: 'Evaluar continuidad en el cargo',
  },
  MOTOR_EQUIPO: {
    badge: 'BAJO',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    dotColor: 'bg-emerald-500',
    headline: 'Estable',
    subline: 'Sin señales de riesgo activas',
    urgency: null,
  },
}

const INCUMBENT_RISK_NONE = {
  badge: 'Sin evaluación',
  badgeColor: 'bg-slate-600/40 text-slate-400 border-slate-600/40',
  dotColor: 'bg-slate-500',
  headline: 'Sin evaluación de riesgo',
  subline: 'Requiere evaluación AAE',
  urgency: null,
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVAS — Bench Strength del Pipeline
// Calculado automáticamente en backend según readiness de candidatos:
// STRONG   = 2+ Ready Now
// MODERATE = 1 Ready Now + 2+ Ready 1-2 años
// WEAK     = Solo Ready 1-2 años, sin Ready Now
// NONE     = Sin candidatos viables
// UNKNOWN  = No calculado aún
// ════════════════════════════════════════════════════════════════════════════

const BENCH_NARRATIVES: Record<string, {
  teslaColor: string
  dotColor: string
  headline: string
  subline: string
}> = {
  STRONG: {
    teslaColor: '#10B981',
    dotColor: 'bg-emerald-500',
    headline: 'Pipeline sólido',
    subline: 'Sucesores listos para asumir',
  },
  MODERATE: {
    teslaColor: '#22D3EE',
    dotColor: 'bg-cyan-400',
    headline: 'Pipeline en desarrollo',
    subline: 'Sucesores identificados, requieren preparación',
  },
  WEAK: {
    teslaColor: '#F59E0B',
    dotColor: 'bg-amber-500',
    headline: 'Pipeline frágil',
    subline: 'Cobertura insuficiente',
  },
  NONE: {
    teslaColor: '#EF4444',
    dotColor: 'bg-red-500',
    headline: 'Sin pipeline',
    subline: 'Cargo crítico descubierto',
  },
  UNKNOWN: {
    teslaColor: '#64748B',
    dotColor: 'bg-slate-500',
    headline: 'Sin evaluar',
    subline: 'Pendiente de análisis',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// CTA INTELIGENTE — Muta según estado del cargo
// El sistema decide a qué tab ir; el CEO no tiene que elegir
// ════════════════════════════════════════════════════════════════════════════

interface CTAConfig {
  label: string
  subLabel: string | null
  variant: 'danger' | 'warning' | 'primary' | 'success'
  goTo: 'candidates' | 'suggestions'
}

function getCTA(
  candidatesCount: number,
  readyNowCount: number,
  incumbentFlightRisk: string | null
): CTAConfig {
  // Caso 1: Sin candidatos + Titular en fuga = EMERGENCIA
  if (candidatesCount === 0 && incumbentFlightRisk === 'HIGH') {
    return {
      label: 'Buscar sucesores ahora',
      subLabel: 'Titular con señales de desvinculación',
      variant: 'danger',
      goTo: 'suggestions',
    }
  }

  // Caso 2: Sin candidatos = Buscar
  if (candidatesCount === 0) {
    return {
      label: 'Buscar sucesores',
      subLabel: 'Ver candidatos sugeridos por el sistema',
      variant: 'primary',
      goTo: 'suggestions',
    }
  }

  // Caso 3: Candidatos pero ninguno Ready Now
  if (readyNowCount === 0) {
    return {
      label: `Ver pipeline · ${candidatesCount} en desarrollo`,
      subLabel: 'Ninguno listo para asumir hoy',
      variant: 'warning',
      goTo: 'candidates',
    }
  }

  // Caso 4: Tiene sucesores listos
  return {
    label: `Pipeline listo · ${readyNowCount} sucesor${readyNowCount > 1 ? 'es' : ''} disponible${readyNowCount > 1 ? 's' : ''}`,
    subLabel: 'Ver candidatos y confirmar siguiente paso',
    variant: 'success',
    goTo: 'candidates',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTE: Pipeline Counter
// ════════════════════════════════════════════════════════════════════════════

function PipelineCounter({
  count,
  label,
  variant,
}: {
  count: number
  label: string
  variant: 'ready' | 'developing' | 'longterm'
}) {
  const styles = {
    ready: {
      number: count > 0 ? 'text-emerald-400' : 'text-slate-600',
      label: 'text-slate-500',
      border: count > 0 ? 'border-emerald-500/20' : 'border-slate-800/50',
      bg: count > 0 ? 'bg-emerald-500/5' : 'bg-slate-900/30',
    },
    developing: {
      number: count > 0 ? 'text-amber-400' : 'text-slate-600',
      label: 'text-slate-500',
      border: count > 0 ? 'border-amber-500/20' : 'border-slate-800/50',
      bg: count > 0 ? 'bg-amber-500/5' : 'bg-slate-900/30',
    },
    longterm: {
      number: count > 0 ? 'text-slate-400' : 'text-slate-600',
      label: 'text-slate-500',
      border: 'border-slate-800/50',
      bg: 'bg-slate-900/30',
    },
  }

  const s = styles[variant]

  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-3 rounded-xl border',
      s.border,
      s.bg,
    )}>
      <span className={cn('text-2xl font-bold tabular-nums leading-none', s.number)}>
        {count}
      </span>
      <span className={cn('text-[10px] uppercase tracking-wider mt-1.5 text-center leading-tight', s.label)}>
        {label}
      </span>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTE: CTA Button
// ════════════════════════════════════════════════════════════════════════════

const CTA_STYLES: Record<CTAConfig['variant'], string> = {
  danger: 'bg-red-500 hover:bg-red-400 text-white shadow-[0_4px_20px_rgba(239,68,68,0.35)]',
  warning: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_4px_20px_rgba(245,158,11,0.30)]',
  primary: 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_4px_20px_rgba(34,211,238,0.30)]',
  success: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_4px_20px_rgba(16,185,129,0.30)]',
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function SuccessionPositionBriefing({
  position,
  candidates,
  onContinue,
}: SuccessionPositionBriefingProps) {

  // 1. Calcular métricas del pipeline
  const pipelineStats = useMemo(() => {
    const effective = (c: BriefingCandidate) => c.readinessOverride || c.readinessLevel
    return {
      readyNow:   candidates.filter(c => effective(c) === 'READY_NOW').length,
      ready12:    candidates.filter(c => effective(c) === 'READY_1_2_YEARS').length,
      ready3Plus: candidates.filter(c => effective(c) === 'READY_3_PLUS').length,
      total:      candidates.length,
    }
  }, [candidates])

  // 2. Obtener narrativas
  const incumbent = position.incumbent
  const incumbentRiskKey = incumbent?.riskQuadrant ?? null
  const incumbentNarrative = incumbentRiskKey
    ? (INCUMBENT_RISK_CONFIG[incumbentRiskKey] ?? INCUMBENT_RISK_NONE)
    : INCUMBENT_RISK_NONE
  const benchNarrative = BENCH_NARRATIVES[position.benchStrength] ?? BENCH_NARRATIVES.UNKNOWN

  // 2b. Narrativa de talento del titular — useMemo para recalcular cuando lleguen los datos enriquecidos
  const incumbentTalentNarrative = useMemo(() => {
    if (!incumbent?.riskQuadrant) return null
    return TalentNarrativeService.getIndividualNarrative(
      incumbent.riskQuadrant ?? null,
      incumbent.mobilityQuadrant ?? null,
      null,
      incumbent.fullName
    )
  }, [incumbent?.riskQuadrant, incumbent?.mobilityQuadrant, incumbent?.fullName])

  // 3. Calcular fecha de retiro si existe
  const retirementInfo = useMemo(() => {
    if (!position.incumbentRetirementDate) return null
    const retirementDate = new Date(position.incumbentRetirementDate)
    const now = new Date()
    const diffMs = retirementDate.getTime() - now.getTime()
    const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30))
    if (diffMonths <= 0) return null
    return { months: diffMonths, label: diffMonths === 1 ? '1 mes' : `${diffMonths} meses` }
  }, [position.incumbentRetirementDate])

  // 4. CTA inteligente
  const cta = getCTA(pipelineStats.total, pipelineStats.readyNow, position.incumbentFlightRisk)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative w-full max-w-lg mx-auto"
    >
      {/* Card principal */}
      <div className="relative bg-[#0F172A]/95 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden">

        {/* ── Tesla Line — color dinámico por benchStrength ── */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${benchNarrative.teslaColor} 30%, ${benchNarrative.teslaColor} 70%, transparent 100%)`,
            opacity: 0.9,
          }}
        />

        <div className="p-6 space-y-5">

          {/* ── Header: Identificación del cargo ── */}
          <div className="text-center pt-1">
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">
              {position.positionTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {[
                position.department?.displayName,
                position.standardJobLevel,
              ].filter(Boolean).join(' · ')}
            </p>
          </div>

          {/* ── Sección: Titular ── */}
          {position.incumbent ? (
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-3">
              {/* Label */}
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Titular Actual
              </p>

              {/* Info titular + flight risk */}
              <div className="flex items-center justify-between gap-3">
                {/* Avatar + nombre */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-700/60 border border-slate-600/40 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {position.incumbent.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {incumbentNarrative.headline}
                    </p>
                  </div>
                </div>

                {/* Badge Flight Risk */}
                <span className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border',
                  incumbentNarrative.badgeColor,
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', incumbentNarrative.dotColor)} />
                  {incumbentNarrative.badge}
                </span>
              </div>

              {/* Urgencia + fecha retiro */}
              <div className="space-y-1.5">
                {incumbentNarrative.urgency && (
                  <div className="flex items-center gap-2 text-[11px] text-amber-400/80">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>{incumbentNarrative.urgency}</span>
                  </div>
                )}
                {retirementInfo && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 flex-shrink-0 text-slate-500" />
                    <span>Retiro estimado en <span className="text-white font-medium">{retirementInfo.label}</span></span>
                  </div>
                )}
              </div>

              {/* Narrativa de talento del titular */}
              {incumbentTalentNarrative ? (
                <div className="relative rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden p-3 mt-3">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
                  <p className="text-[12px] font-semibold text-slate-200 mb-1">
                    {incumbentTalentNarrative.headline}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {incumbentTalentNarrative.recommendedAction}
                  </p>
                </div>
              ) : incumbent && !incumbent.riskQuadrant && (
                <div className="relative rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden p-3 mt-3">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
                  <p className="text-[12px] font-semibold text-slate-200 mb-1">
                    {incumbent.fullName} tiene un proceso de evaluación incompleto
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-1">
                    Es titular de un cargo crítico — sin evaluación de potencial no es posible medir su riesgo real ni activar inteligencia de talento.
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Priorizar su evaluación en el módulo de desempeño. Los cargos críticos sin datos de titular son un punto ciego estratégico.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Cargo vacante */
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Titular Actual
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Shield className="w-4 h-4" />
                <span>Cargo vacante — sin titular asignado</span>
              </div>
            </div>
          )}

          {/* ── Sección: Pipeline ── */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-4">
            {/* Label */}
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Estado del Pipeline
            </p>

            {/* Counters */}
            <div className="grid grid-cols-3 gap-2">
              <PipelineCounter
                count={pipelineStats.readyNow}
                label="Ready Now"
                variant="ready"
              />
              <PipelineCounter
                count={pipelineStats.ready12}
                label="1-2 años"
                variant="developing"
              />
              <PipelineCounter
                count={pipelineStats.ready3Plus}
                label="3+ años"
                variant="longterm"
              />
            </div>

            {/* Bench Strength */}
            <div className="flex items-center gap-2 pt-1">
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', benchNarrative.dotColor)} />
              <span className="text-sm font-semibold text-white">
                {benchNarrative.headline}
              </span>
              <span className="text-xs text-slate-500 truncate">
                — {benchNarrative.subline}
              </span>
            </div>
          </div>

          {/* ── CTA Único ── */}
          <button
            onClick={() => onContinue(cta.goTo)}
            className={cn(
              'w-full py-3.5 px-5 rounded-xl font-semibold text-sm',
              'flex items-center justify-between gap-3',
              'transition-all duration-200 active:scale-[0.98]',
              CTA_STYLES[cta.variant],
            )}
          >
            <div className="flex flex-col items-start text-left min-w-0">
              <span className="leading-tight truncate">{cta.label}</span>
              {cta.subLabel && (
                <span className="text-[10px] opacity-70 font-normal mt-0.5 truncate">
                  {cta.subLabel}
                </span>
              )}
            </div>
            <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </button>

        </div>
      </div>
    </motion.div>
  )
})