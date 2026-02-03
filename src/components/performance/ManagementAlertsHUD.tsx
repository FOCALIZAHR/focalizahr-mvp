// ════════════════════════════════════════════════════════════════════════════
// MANAGEMENT ALERTS HUD v2.0 - Consola de Inteligencia (Mobile First)
// src/components/performance/ManagementAlertsHUD.tsx
// ════════════════════════════════════════════════════════════════════════════
// FILOSOFÍA: "Si funciona en un celular, funciona en cualquier lado"
// DISEÑO: Stack vertical limpio, border-left semántico, cero ruido visual
// PRINCIPIO: "FocalizaHR no muestra datos. FocalizaHR guía decisiones."
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, ChevronDown } from 'lucide-react'
import {
  getManagementInsights,
  type ManagementInsight,
  type CompetencyInput
} from '@/lib/management-insights'
import { getPerformanceClassification } from '@/config/performanceClassification'
import { formatDisplayName } from '@/lib/utils/formatName'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface ManagementAlertsHUDProps {
  competencies: CompetencyInput[]
  employeeName: string
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS - Configuración de sección de insights
// ════════════════════════════════════════════════════════════════════════════

type InsightType = 'CRITICAL' | 'STRENGTH' | 'MONITOR'

interface InsightSectionConfig {
  label: string
  borderClass: string
  accentClass: string
  actionLabel: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN VISUAL - Solo border-left semántico
// ════════════════════════════════════════════════════════════════════════════

const SECTION_CONFIG: Record<InsightType, InsightSectionConfig> = {
  CRITICAL: {
    label: 'ATENCIÓN',
    borderClass: 'border-l-4 border-l-red-500',
    accentClass: 'text-red-400',
    actionLabel: 'Pregunta'
  },
  STRENGTH: {
    label: 'FORTALEZA',
    borderClass: 'border-l-4 border-l-emerald-500',
    accentClass: 'text-emerald-400',
    actionLabel: 'Acción'
  },
  MONITOR: {
    label: 'MONITOREAR',
    borderClass: 'border-l-4 border-l-amber-500',
    accentClass: 'text-amber-400',
    actionLabel: 'Seguimiento'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function ManagementAlertsHUD({
  competencies,
  employeeName,
  className = ''
}: ManagementAlertsHUDProps) {
  const [showMonitor, setShowMonitor] = useState(false)

  // Nombre corto para mensajes naturales
  const firstName = useMemo(
    () => formatDisplayName(employeeName, 'short'),
    [employeeName]
  )

  // Generar insights
  const insights = useMemo(
    () => getManagementInsights(competencies, firstName),
    [competencies, firstName]
  )

  // Separar por tipo
  const criticalInsights = insights.filter(i => i.type === 'CRITICAL')
  const strengthInsights = insights.filter(i => i.type === 'STRENGTH')
  const monitorInsights = insights.filter(i => i.type === 'MONITOR')

  // Estado vacío
  const hasContent = criticalInsights.length > 0 || strengthInsights.length > 0 || monitorInsights.length > 0
  if (!hasContent) {
    return (
      <div className={`rounded-xl bg-slate-900/60 border border-slate-800 p-4 md:p-5 ${className}`}>
        <div className="flex items-center gap-3 text-slate-500">
          <Brain className="w-4 h-4" />
          <p className="text-sm">
            Sin alertas para <span className="font-semibold text-cyan-400">{firstName}</span>. Competencias en rango saludable.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden ${className}`}>
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* HEADER - Línea Tesla + Título minimalista */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* Línea Tesla */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

        <div className="px-4 py-3 md:px-5 md:py-4 border-b border-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Brain className="w-4 h-4 text-cyan-400" />
              <div>
                <h3 className="text-sm font-medium text-slate-200">
                  Inteligencia de Gestión
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Para tu conversación con <span className="font-semibold text-cyan-400">{firstName}</span>
                </p>
              </div>
            </div>

            {/* Badges resumen - Solo si hay contenido relevante */}
            <div className="flex items-center gap-1.5">
              {criticalInsights.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-500/15 text-red-400">
                  {criticalInsights.length}
                </span>
              )}
              {strengthInsights.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/15 text-emerald-400">
                  {strengthInsights.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* BODY - Stack vertical limpio */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="p-4 md:p-5 space-y-4">
        {/* CRÍTICOS */}
        {criticalInsights.map((insight, idx) => (
          <InsightCard
            key={`critical-${idx}`}
            insight={insight}
            config={SECTION_CONFIG.CRITICAL}
          />
        ))}

        {/* FORTALEZAS */}
        {strengthInsights.map((insight, idx) => (
          <InsightCard
            key={`strength-${idx}`}
            insight={insight}
            config={SECTION_CONFIG.STRENGTH}
          />
        ))}

        {/* MONITOREAR - Progressive Disclosure */}
        {monitorInsights.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowMonitor(!showMonitor)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors py-2"
            >
              <span>
                {showMonitor ? 'Ocultar' : 'Ver'} {monitorInsights.length} área{monitorInsights.length > 1 ? 's' : ''} a monitorear
              </span>
              <ChevronDown 
                className={`w-3.5 h-3.5 transition-transform duration-200 ${showMonitor ? 'rotate-180' : ''}`} 
              />
            </button>

            <AnimatePresence>
              {showMonitor && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3 overflow-hidden"
                >
                  {monitorInsights.map((insight, idx) => (
                    <InsightCard
                      key={`monitor-${idx}`}
                      insight={insight}
                      config={SECTION_CONFIG.MONITOR}
                      compact
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: INSIGHT CARD (Mobile First)
// ════════════════════════════════════════════════════════════════════════════

interface InsightCardProps {
  insight: ManagementInsight
  config: InsightSectionConfig
  compact?: boolean
}

function InsightCard({ insight, config, compact = false }: InsightCardProps) {
  const classification = getPerformanceClassification(insight.score)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        rounded-r-lg bg-slate-800/40 
        ${config.borderClass}
        overflow-hidden
      `}
    >
      {/* Header: Competencia + Score */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Label de sección */}
          <span className={`text-[10px] font-bold uppercase tracking-wider ${config.accentClass}`}>
            {config.label}
          </span>
          
          {/* Nombre competencia */}
          <h4 className="text-sm font-medium text-slate-100 mt-1 truncate">
            {insight.competencyName}
          </h4>
        </div>

        {/* Score + Clasificación */}
        <div className="text-right flex-shrink-0">
          <span className={`text-lg font-semibold ${config.accentClass}`}>
            {insight.score.toFixed(1)}
          </span>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">
            {classification.labelShort || classification.label}
          </p>
        </div>
      </div>

      {/* Body: Insight + Acción */}
      <div className="px-4 pb-4 space-y-3">
        {/* Insight principal */}
        <p className="text-sm text-slate-300 leading-relaxed">
          {insight.insight}
        </p>

        {/* Acción sugerida - Solo si no es compact */}
        {!compact && (
          <div className="pt-3 border-t border-slate-700/30">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">
              {config.actionLabel}
            </p>
            <p className={`text-sm italic ${config.accentClass}`}>
              "{insight.action}"
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}