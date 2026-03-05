'use client'

import { memo } from 'react'
import { AlertTriangle, Clock, UserX, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface Alert {
  id: string
  employeeName: string
  position: string
  departmentName: string
  riskQuadrant: string
  alertLevel: 'RED' | 'ORANGE'
  message: string
  recommendation: string
  slaHours: number
}

interface RegrettedEmployee {
  name: string
  department: string
  exitDate: string
  nineBoxPosition: string | null
  roleFitScore: number | null
  isRegretted: boolean
}

interface AlertsPanelProps {
  data: {
    total: number
    critical: number
    high: number
    byType?: Record<string, number>
    alerts: Alert[]
    regrettedAttrition?: {
      count: number
      employees: RegrettedEmployee[]
      message: string | null
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// RISK TYPE LABELS
// ════════════════════════════════════════════════════════════════════════════

const RISK_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  FUGA_CEREBROS:    { label: 'Fuga Cerebros',   color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  BAJO_RENDIMIENTO: { label: 'Bajo Rendimiento', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  BURNOUT_RISK:     { label: 'Riesgo Burnout',   color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  MOTOR_EQUIPO:     { label: 'Motor Equipo',     color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
}

const NINE_BOX_LABELS: Record<string, string> = {
  star: 'Estrella',
  high_performer: 'High Performer',
  consistent_star: 'Consistent Star',
  growth_potential: 'Alto Potencial',
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const AlertsPanel = memo(function AlertsPanel({ data }: AlertsPanelProps) {
  const hasAlerts = data.total > 0
  const hasRegretted = (data.regrettedAttrition?.count ?? 0) > 0
  const hasByType = data.byType && Object.keys(data.byType).length > 0

  if (!hasAlerts && !hasRegretted) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6 text-emerald-400" />
        </div>
        <p className="text-lg font-medium text-white">Sin alertas activas</p>
        <p className="text-sm text-slate-500 mt-1">No hay situaciones que requieran intervención</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded">

      {/* ── Contador por Tipo ── */}
      {hasByType && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.byType!).map(([type, count]) => {
            if (count === 0) return null
            const meta = RISK_TYPE_LABELS[type] || { label: type, color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' }
            return (
              <span
                key={type}
                className={cn('text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border', meta.color)}
              >
                {meta.label}: {count}
              </span>
            )
          })}
        </div>
      )}

      {/* ── Alertas activas ── */}
      {hasAlerts && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Alertas Activas ({data.total})
          </p>
          {data.alerts.map(alert => (
            <div
              key={alert.id}
              className={cn(
                'p-3 rounded-xl border backdrop-blur-sm',
                alert.alertLevel === 'RED'
                  ? 'bg-red-500/5 border-red-500/30'
                  : 'bg-amber-500/5 border-amber-500/30'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                      alert.alertLevel === 'RED'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-amber-500/20 text-amber-400'
                    )}>
                      {alert.alertLevel === 'RED' ? 'Crítica' : 'Alta'}
                    </span>
                    <span className="text-[10px] text-slate-600">{alert.message}</span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">{alert.employeeName}</p>
                  <p className="text-xs text-slate-500">{alert.position} · {alert.departmentName}</p>
                  <p className="text-xs text-slate-600 mt-1">{alert.recommendation}</p>
                </div>
                <div className="flex items-center gap-1 text-slate-500 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-mono">{alert.slaHours}h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Regretted Attrition ── */}
      {hasRegretted && data.regrettedAttrition && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <UserX className="w-3 h-3 text-red-400" />
            Renuncias Lamentables ({data.regrettedAttrition.count})
          </p>

          {data.regrettedAttrition.message && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20">
              <TrendingDown className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-300">{data.regrettedAttrition.message}</span>
            </div>
          )}

          {data.regrettedAttrition.employees.map((emp, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-800/40 border border-white/5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{emp.name}</p>
                <p className="text-[10px] text-slate-500">{emp.department}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {emp.nineBoxPosition && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    {NINE_BOX_LABELS[emp.nineBoxPosition] || emp.nineBoxPosition}
                  </span>
                )}
                {emp.roleFitScore !== null && (
                  <span className="text-[10px] font-mono text-slate-400">{emp.roleFitScore}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
