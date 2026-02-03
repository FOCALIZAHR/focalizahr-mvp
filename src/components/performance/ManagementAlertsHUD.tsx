// ════════════════════════════════════════════════════════════════════════════
// MANAGEMENT ALERTS HUD - Consola de Inteligencia Unificada
// src/components/performance/ManagementAlertsHUD.tsx
// ════════════════════════════════════════════════════════════════════════════
// FILOSOFÍA: NO es una lista de post-its. ES un sistema inteligente cohesivo.
// DISEÑO: Monolito único con línea de circuito conectando hallazgos.
// PRINCIPIO: "FocalizaHR no muestra datos. FocalizaHR guía decisiones."
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  AlertTriangle,
  Zap,
  Activity,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from 'lucide-react'
import {
  getManagementInsights,
  type ManagementInsight,
  type CompetencyInput
} from '@/lib/management-insights'
import { getPerformanceClassification } from '@/config/performanceClassification'
import { formatDisplayName } from '@/lib/utils/formatName'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface ManagementAlertsHUDProps {
  competencies: CompetencyInput[]
  employeeName: string
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN VISUAL
// ════════════════════════════════════════════════════════════════════════════

const SECTION_CONFIG = {
  CRITICAL: {
    title: 'REQUIERE TU ATENCIÓN',
    subtitle: 'Agenda una conversación pronto',
    icon: AlertTriangle,
    accentColor: 'text-red-400',
    bgColor: 'bg-red-500/5',
    borderColor: 'border-red-500/20',
    dotColor: 'bg-red-500',
    lineColor: 'from-red-500',
    labelAction: 'Pregunta sugerida para tu 1:1:'
  },
  STRENGTH: {
    title: 'FORTALEZA PARA APROVECHAR',
    subtitle: 'Oportunidad de desarrollo',
    icon: Zap,
    accentColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/5',
    borderColor: 'border-emerald-500/20',
    dotColor: 'bg-emerald-500',
    lineColor: 'from-emerald-500',
    labelAction: 'Acción recomendada:'
  },
  MONITOR: {
    title: 'MONITOREAR',
    subtitle: 'Seguimiento próximo ciclo',
    icon: Activity,
    accentColor: 'text-amber-400',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500/20',
    dotColor: 'bg-amber-500',
    lineColor: 'from-amber-500',
    labelAction: 'Pregunta opcional para tu 1:1:'
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
  const [isExpanded, setIsExpanded] = useState(true)
  const [showMonitor, setShowMonitor] = useState(false)

  // Obtener primer nombre para mensajes naturales
  const firstName = useMemo(() => formatDisplayName(employeeName, 'short'), [employeeName])

  // Generar insights con nombre personalizado
  const insights = useMemo(
    () => getManagementInsights(competencies, firstName),
    [competencies, firstName]
  )

  // Separar por tipo
  const criticalInsights = insights.filter(i => i.type === 'CRITICAL')
  const strengthInsights = insights.filter(i => i.type === 'STRENGTH')
  const monitorInsights = insights.filter(i => i.type === 'MONITOR')

  // Si no hay alertas, no mostrar nada
  const hasAlerts = criticalInsights.length > 0 || strengthInsights.length > 0
  if (!hasAlerts && monitorInsights.length === 0) {
    return (
      <div className={`fhr-card p-6 ${className}`}>
        <div className="flex items-center gap-3 text-slate-400">
          <Brain className="w-5 h-5" />
          <p className="text-sm">
            No hay alertas de gestión para {firstName}. 
            Todas las competencias están en rango saludable.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`fhr-card overflow-hidden ${className}`}>
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HEADER - Línea Tesla + Título */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* Línea Tesla superior */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        
        <div className="px-5 py-4 border-b border-slate-700/50">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Brain className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-slate-200">
                  Inteligencia de Gestión
                </h3>
                <p className="text-xs text-slate-500">
                  Análisis para tu próxima conversación con {firstName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Badges resumen */}
              <div className="flex items-center gap-2">
                {criticalInsights.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
                    {criticalInsights.length} atención
                  </span>
                )}
                {strengthInsights.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400">
                    {strengthInsights.length} fortaleza{strengthInsights.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {/* Chevron */}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-slate-400 group-hover:text-slate-200"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </div>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* BODY - Consola de Inteligencia */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative">
              {/* ════════════════════════════════════════════════════════════ */}
              {/* LÍNEA DE CIRCUITO - Conecta todos los hallazgos */}
              {/* ════════════════════════════════════════════════════════════ */}
              <div className="absolute left-7 top-6 bottom-6 w-px">
                <div className="h-full bg-gradient-to-b from-red-500 via-emerald-500 to-amber-500 opacity-30" />
              </div>

              <div className="p-5 pl-12 space-y-6">
                {/* ══════════════════════════════════════════════════════════ */}
                {/* SECCIÓN CRÍTICA */}
                {/* ══════════════════════════════════════════════════════════ */}
                {criticalInsights.length > 0 && (
                  <InsightSection
                    type="CRITICAL"
                    insights={criticalInsights}
                  />
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* SECCIÓN FORTALEZAS */}
                {/* ══════════════════════════════════════════════════════════ */}
                {strengthInsights.length > 0 && (
                  <InsightSection
                    type="STRENGTH"
                    insights={strengthInsights}
                  />
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* SECCIÓN MONITOREAR (Colapsable) */}
                {/* ══════════════════════════════════════════════════════════ */}
                {monitorInsights.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowMonitor(!showMonitor)}
                      className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <Activity className="w-3 h-3" />
                      <span>
                        {showMonitor ? 'Ocultar' : 'Ver'} {monitorInsights.length} área{monitorInsights.length > 1 ? 's' : ''} a monitorear
                      </span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${showMonitor ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {showMonitor && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4"
                        >
                          <InsightSection
                            type="MONITOR"
                            insights={monitorInsights}
                            compact
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: SECCIÓN DE INSIGHTS
// ════════════════════════════════════════════════════════════════════════════

interface InsightSectionProps {
  type: 'CRITICAL' | 'STRENGTH' | 'MONITOR'
  insights: ManagementInsight[]
  compact?: boolean
}

function InsightSection({ type, insights, compact = false }: InsightSectionProps) {
  const config = SECTION_CONFIG[type]
  const Icon = config.icon

  return (
    <div className="relative">
      {/* Dot en la línea de circuito */}
      <div className={`absolute -left-7 top-1 w-3 h-3 rounded-full ${config.dotColor} ring-2 ring-slate-900`} />
      
      {/* Header de sección */}
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${config.accentColor}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${config.accentColor}`}>
          {config.title}
        </span>
      </div>

      {/* Lista de insights */}
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <InsightItem
            key={`${insight.competencyName}-${index}`}
            insight={insight}
            config={config}
            compact={compact}
          />
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: ITEM DE INSIGHT
// ════════════════════════════════════════════════════════════════════════════

interface InsightItemProps {
  insight: ManagementInsight
  config: typeof SECTION_CONFIG.CRITICAL
  compact?: boolean
}

function InsightItem({ insight, config, compact = false }: InsightItemProps) {
  const classification = getPerformanceClassification(insight.score)

  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} overflow-hidden`}>
      {/* Header del insight */}
      <div className="px-4 py-3 border-b border-slate-700/30">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-200">
            {insight.competencyName}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${config.accentColor}`}>
              {insight.score.toFixed(1)}/5
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${classification.bgClass} ${classification.textClass}`}>
              {classification.label}
            </span>
          </div>
        </div>
      </div>

      {/* Body del insight */}
      <div className="px-4 py-3 space-y-3">
        {/* Insight principal */}
        <p className="text-sm text-slate-300 leading-relaxed">
          {insight.insight}
        </p>

        {/* Acción sugerida */}
        {!compact && (
          <div className="pt-2 border-t border-slate-700/30">
            <div className="flex items-start gap-2">
              <MessageCircle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  {config.labelAction}
                </p>
                <p className="text-sm text-cyan-300 italic">
                  "{insight.action}"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// NOTA: El componente se exporta como default arriba con:
// export default memo(function ManagementAlertsHUD(...))
// ════════════════════════════════════════════════════════════════════════════