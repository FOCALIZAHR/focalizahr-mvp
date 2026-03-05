'use client'

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, Eye, Bell, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HeatmapBar } from './HeatmapBar'
import { getGerenciaDiagnostic } from '../CalibrationHealth.utils'
import type { GerenciaCalibrationStats } from '../CalibrationHealth.types'

interface GerenciaRowProps {
  data: GerenciaCalibrationStats
  onAction?: (type: 'view_evaluator' | 'notify_manager', gerenciaId: string) => void
}

const ICONS = {
  alert: AlertTriangle,
  warning: AlertCircle,
  success: CheckCircle,
  blind: Eye,
  neutral: Info
}

const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: 'text-red-400'
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: 'text-amber-400'
  },
  info: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    icon: 'text-cyan-400'
  },
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    icon: 'text-emerald-400'
  },
  neutral: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    icon: 'text-slate-500'
  }
}

export const GerenciaRow = memo(function GerenciaRow({
  data,
  onAction
}: GerenciaRowProps) {
  const [isHovered, setIsHovered] = useState(false)

  const diagnostic = getGerenciaDiagnostic(data)
  const styles = SEVERITY_STYLES[diagnostic.severity]
  const Icon = ICONS[diagnostic.icon]

  const hasData = data.evaluatorCount > 0

  // Formato compacto: 5·0·1·0
  const compactCounts = hasData
    ? `${data.counts.OPTIMA}·${data.counts.CENTRAL}·${data.counts.SEVERA}·${data.counts.INDULGENTE}`
    : '—'

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Row Principal */}
      <div className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200",
        "border border-transparent",
        isHovered && "bg-slate-800/50 border-slate-700/50",
        !hasData && "opacity-50"
      )}>
        {/* Nombre Gerencia */}
        <div className="w-48 flex-shrink-0">
          <span className={cn(
            "text-sm font-medium",
            hasData ? "text-white" : "text-slate-500"
          )}>
            {data.gerenciaName}
          </span>
        </div>

        {/* Heatmap Bar */}
        <div className="flex-1">
          <HeatmapBar
            counts={data.counts}
            evaluatorCount={data.evaluatorCount}
          />
        </div>

        {/* Counts compactos */}
        <div className="w-20 text-right">
          <span className={cn(
            "text-xs font-mono",
            hasData ? "text-slate-400" : "text-slate-600"
          )}>
            {compactCounts}
          </span>
        </div>
      </div>

      {/* Tooltip on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2",
              "w-80 p-4 rounded-xl",
              "bg-slate-900/95 backdrop-blur-xl",
              "border shadow-xl shadow-black/20",
              styles.border
            )}
          >
            {/* Tesla line */}
            <div className={cn(
              "absolute inset-x-0 top-0 h-px rounded-t-xl",
              "bg-gradient-to-r from-transparent via-current to-transparent",
              styles.text
            )} style={{ opacity: 0.5 }} />

            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                styles.bg
              )}>
                <Icon className={cn("w-4 h-4", styles.icon)} />
              </div>
              <h4 className={cn("font-semibold", styles.text)}>
                {diagnostic.title}
              </h4>
            </div>

            {/* Body */}
            <p className="text-sm text-slate-300 mb-4">
              {diagnostic.body}
            </p>

            {/* Action Button */}
            {diagnostic.action && (
              <button
                onClick={() => onAction?.(diagnostic.action!.type, data.gerenciaId)}
                className={cn(
                  "w-full py-2 px-4 rounded-lg text-sm font-medium",
                  "transition-all duration-200",
                  "bg-slate-800 hover:bg-slate-700",
                  "border border-slate-700 hover:border-slate-600",
                  "text-white flex items-center justify-center gap-2"
                )}
              >
                {diagnostic.action.type === 'notify_manager' ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {diagnostic.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
