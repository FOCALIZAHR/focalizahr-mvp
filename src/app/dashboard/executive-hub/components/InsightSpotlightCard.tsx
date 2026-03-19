'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, AlertTriangle, Users, BarChart3, Zap, Target, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TALENT_INTELLIGENCE_THRESHOLDS } from '@/config/performanceClassification'
import { AlertsPanel } from './AlertsPanel'
import { TalentMini9Box } from './TalentMini9Box'
import { CalibrationHealth } from './CalibrationHealth'
import { RoleFitMatrix } from './RoleFitMatrix'
import { SuccessionPanel } from './SuccessionPanel'
import type { InsightType, SummaryData } from '@/hooks/useExecutiveHubData'

// ════════════════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════════════════

const INSIGHT_META: Record<InsightType, {
  icon: typeof AlertTriangle
  title: string
  color: string
  description: string
}> = {
  alertas: {
    icon: AlertTriangle,
    title: 'Alertas de Talento',
    color: 'text-red-400',
    description: 'Situaciones que requieren intervención inmediata'
  },
  talento: {
    icon: Users,
    title: 'Distribución de Talento',
    color: 'text-purple-400',
    description: 'Mapa 9-Box y distribución de ratings'
  },
  calibracion: {
    icon: BarChart3,
    title: 'Salud de Calibración',
    color: 'text-blue-400',
    description: 'Confiabilidad de las evaluaciones por departamento'
  },
  capacidades: {
    icon: Zap,
    title: 'Capacidades Organizacionales',
    color: 'text-cyan-400',
    description: 'Role Fit por capa organizacional y gerencia'
  },
  sucesion: {
    icon: Target,
    title: 'Pipeline de Sucesión',
    color: 'text-amber-400',
    description: 'Cobertura de roles críticos'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface InsightSpotlightCardProps {
  type: InsightType
  summary: SummaryData
  spotlightData: any | null
  isLoading: boolean
  cycleId?: string | null
  userRole?: string | null
  onBack: () => void
  onSelectGerencia?: (gerencia: string) => void
}

export const InsightSpotlightCard = memo(function InsightSpotlightCard({
  type,
  summary,
  spotlightData,
  isLoading,
  cycleId,
  userRole,
  onBack,
  onSelectGerencia
}: InsightSpotlightCardProps) {
  const meta = INSIGHT_META[type]
  const Icon = meta.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-5xl"
    >
      <div className="bg-slate-950/90 backdrop-blur-2xl border border-slate-800/50 rounded-[24px] shadow-2xl flex flex-col md:flex-row relative overflow-hidden">

        {/* Tesla line */}
        <div className="fhr-top-line absolute top-0 left-0 right-0 z-20" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-5 left-5 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
        >
          <ArrowLeft className="w-3 h-3" /> Dashboard
        </button>

        {/* LEFT COLUMN: Summary (30%) — Apple breathing room */}
        <div className="w-full md:w-[260px] md:flex-shrink-0 bg-slate-900/30 p-8 pt-14 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-800/40">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-4', 'bg-slate-800/50 backdrop-blur-sm')}>
            <Icon className={cn('w-7 h-7', meta.color)} />
          </div>

          <h2 className="text-lg font-light text-white text-center mb-1 tracking-tight">{meta.title}</h2>
          <p className="text-xs text-slate-500 text-center mb-6">{meta.description}</p>

          {/* Quick stats */}
          <QuickStats type={type} summary={summary} />
        </div>

        {/* RIGHT COLUMN: Detail (70%) — generous padding */}
        <div className="flex-1 p-6 md:p-8 pt-14 md:pt-8 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
            </div>
          ) : spotlightData ? (
            <DetailContent type={type} data={spotlightData} cycleId={cycleId} userRole={userRole} onSelectGerencia={onSelectGerencia} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-600">Sin datos disponibles</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// QUICK STATS (Left panel summary numbers)
// ════════════════════════════════════════════════════════════════════════════

function QuickStats({ type, summary }: { type: InsightType; summary: SummaryData }) {
  switch (type) {
    case 'alertas':
      return (
        <div className="space-y-3 w-full">
          <StatRow label="Total" value={`${summary.alertas.total}`} tooltip="Situaciones activas que requieren intervención en tu organización." />
          <StatRow label="Críticas" value={`${summary.alertas.critical}`} color="text-red-400" tooltip="Alertas RED: riesgo de fuga inminente o bajo rendimiento severo. Actuar en 24-48h." />
          <StatRow label="Altas" value={`${summary.alertas.high}`} color="text-amber-400" tooltip="Alertas ORANGE: señales de alerta que requieren seguimiento en 3-5 días." />
        </div>
      )
    case 'talento':
      return (
        <div className="space-y-3 w-full">
          <StatRow label="Estrellas" value={`${summary.talento.starsPercent}%`} color="text-cyan-400" tooltip="Porcentaje con alto desempeño + alto potencial. Sobre 10% es saludable." />
          <StatRow label="Total evaluados" value={`${summary.talento.totalEmployees}`} tooltip="Personas con matrices de talento calculadas en este ciclo." />
        </div>
      )
    case 'calibracion':
      const conf = summary.calibracion.confidence

      return (
        <div className="space-y-5 w-full">
          {/* Número principal - protagonista absoluto */}
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-3">
              {/* Gauge minimalista - solo cyan */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="15"
                  fill="none"
                  stroke="rgba(51,65,85,0.3)"
                  strokeWidth="2"
                />
                <circle
                  cx="18" cy="18" r="15"
                  fill="none"
                  stroke="#22D3EE"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${conf * 0.94} 94`}
                  className="transition-all duration-700"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.4))' }}
                />
              </svg>
              {/* Número central */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-white tracking-tight">
                  {conf}%
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
              Integridad
            </p>
          </div>

          {/* Explicación sutil */}
          <p className="text-[10px] text-slate-600 text-center leading-relaxed">
            Fórmula propietaria: completitud − sesgos − varianza
          </p>

          {/* Sesgo organizacional - desde integrityScore */}
          {summary.calibracion.biasLabel && (
            <div className="pt-3 border-t border-slate-700/30 group relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Sesgo detectado
                </span>
                <span className={`text-[11px] font-semibold ${
                  summary.calibracion.biasLabel === 'SEVERA' ? 'text-red-400' :
                  summary.calibracion.biasLabel === 'INDULGENTE' ? 'text-amber-400' :
                  'text-cyan-400'
                }`}>
                  {summary.calibracion.biasLabel}
                </span>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-0 right-0 mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 translate-y-1 group-hover:translate-y-0">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {summary.calibracion.biasLabel === 'SEVERA'
                    ? 'Los evaluadores califican muy bajo. El talento puede estar subvalorado y en riesgo de fuga.'
                    : summary.calibracion.biasLabel === 'INDULGENTE'
                      ? 'Los evaluadores califican muy alto. No se distingue quién realmente destaca, comprometiendo promociones y bonos.'
                      : summary.calibracion.biasLabel === 'CENTRAL'
                        ? 'Los evaluadores evitan extremos. Se ocultan estrellas y underperformers.'
                        : 'Evaluaciones calibradas correctamente.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      )
    case 'capacidades':
      return (
        <div className="space-y-3 w-full">
          <StatRow label="Role Fit Org" value={`${summary.capacidades.roleFit}%`}
            color={summary.capacidades.roleFit >= TALENT_INTELLIGENCE_THRESHOLDS.ROLE_FIT_HIGH ? 'text-cyan-400' : 'text-amber-400'}
            tooltip={`Que tan alineadas estan las personas con lo que exige su cargo. Sobre ${TALENT_INTELLIGENCE_THRESHOLDS.ROLE_FIT_HIGH}% es saludable.`} />
          <StatRow label="Peor capa" value={summary.capacidades.worstLayer || '-'} tooltip="La capa organizacional con mayor brecha de capacidades. Prioridad de inversión en desarrollo." />
          <StatRow label="Peor gerencia" value={summary.capacidades.worstGerencia || '-'} tooltip="La gerencia con menor Role Fit promedio. Revisar brechas de competencias." />
        </div>
      )
    case 'sucesion':
      return (
        <div className="space-y-3 w-full">
          <StatRow label="Cobertura" value={`${summary.sucesion.coverage}%`} tooltip="Porcentaje de roles criticos con al menos un sucesor viable. Sobre 80% es saludable." />
          <StatRow label="Sin cobertura" value={`${summary.sucesion.uncoveredCount}`} tooltip="Roles criticos sin ningun sucesor preparado. Si el titular sale, no hay reemplazo." />
        </div>
      )
  }
}

function StatRow({ label, value, color, tooltip }: { label: string; value: string; color?: string; tooltip?: string }) {
  return (
    <div className="group relative flex items-center justify-between">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={cn('text-sm font-medium font-mono', color || 'text-white')}>{value}</span>

      {tooltip && (
        <div className="absolute bottom-full left-0 right-0 mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 translate-y-1 group-hover:translate-y-0">
          <p className="text-[10px] text-slate-400 leading-relaxed">{tooltip}</p>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DETAIL CONTENT (Right panel)
// ════════════════════════════════════════════════════════════════════════════

function DetailContent({ type, data, cycleId, userRole, onSelectGerencia }: {
  type: InsightType; data: any; cycleId?: string | null; userRole?: string | null; onSelectGerencia?: (g: string) => void
}) {
  const isAdmin = userRole === 'FOCALIZAHR_ADMIN'
  switch (type) {
    case 'alertas':
      return <AlertsPanel data={data} />
    case 'talento':
      return <TalentMini9Box data={data} onSelectGerencia={onSelectGerencia} />
    case 'calibracion':
      return <CalibrationHealth data={data} showManagerNames={isAdmin} />
    case 'capacidades':
      return <RoleFitMatrix data={data} cycleId={cycleId || undefined} />
    case 'sucesion':
      return <SuccessionPanel data={data} />
  }
}
