'use client'

// ════════════════════════════════════════════════════════════════════════════
// ALERTS PANEL — Executive Hub · Nivel Apple/Tesla/FocalizaHR
//
// NO duplica el TAC. Muestra señales agrupadas + dirige al Centro de Acción.
// Narrativas centralizadas: misma fuente que TalentMapNarratives/tacLabels
// Layout: Narrativa izquierda · Personas derecha · Dot LED · CTA al TAC
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDisplayName } from '@/lib/utils/formatName'
import { getQuadrantLabel, getQuadrantNarrative } from '@/config/tacLabels'
import { PanelPortada } from './PanelPortada'

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
// PORTADA NARRATIVA
// ════════════════════════════════════════════════════════════════════════════

function getPortadaNarrative(data: AlertsPanelProps['data']) {
  const regrettedCount = data.regrettedAttrition?.count ?? 0
  if (data.total === 0 && regrettedCount === 0) return null

  if (data.critical > 0) {
    return {
      narrative: {
        highlight: `${data.critical} persona${data.critical !== 1 ? 's' : ''}`,
        suffix: ` necesita${data.critical === 1 ? '' : 'n'} tu atención.`
      },
      ctaVariant: 'red' as const,
      coachingTip: 'Las señales tempranas permiten actuar antes de que se conviertan en salidas.'
    }
  }

  if (data.total > 0) {
    return {
      narrative: {
        highlight: `${data.total} señal${data.total !== 1 ? 'es' : ''}`,
        suffix: ` detectada${data.total !== 1 ? 's' : ''} en tu organización.`
      },
      ctaVariant: 'amber' as const,
      coachingTip: 'Ninguna es crítica hoy, pero conviene revisarlas.'
    }
  }

  return {
    narrative: {
      highlight: `${regrettedCount} salida${regrettedCount !== 1 ? 's' : ''}`,
      suffix: ` lamentable${regrettedCount !== 1 ? 's' : ''}. Talento que se fue.`
    },
    ctaVariant: 'red' as const,
    coachingTip: 'Entender por qué se fueron ayuda a retener a quienes quedan.'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const AlertsPanel = memo(function AlertsPanel({ data }: AlertsPanelProps) {
  const [view, setView] = useState<'portada' | 'content'>('portada')
  const narrativeData = getPortadaNarrative(data)

  const hasAlerts = data.total > 0
  const hasRegretted = (data.regrettedAttrition?.count ?? 0) > 0

  // Agrupar alertas por cuadrante (máx 3 grupos, top 3 personas por grupo)
  const grouped = new Map<string, Alert[]>()
  // Críticas primero, luego altas
  const sorted = [...data.alerts].sort((a, b) =>
    a.alertLevel === 'RED' && b.alertLevel !== 'RED' ? -1 :
    a.alertLevel !== 'RED' && b.alertLevel === 'RED' ? 1 : 0
  )
  sorted.forEach(a => {
    if (!grouped.has(a.riskQuadrant)) grouped.set(a.riskQuadrant, [])
    grouped.get(a.riskQuadrant)!.push(a)
  })

  if (!hasAlerts && !hasRegretted) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12 px-8">
        <p className="text-lg font-light text-white mb-2">Sin señales activas</p>
        <p className="text-sm text-slate-600">Tu organización no muestra alertas en este momento.</p>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div className="fhr-top-line absolute inset-x-0 top-0 z-10" />

      <AnimatePresence mode="wait">
        {view === 'portada' && narrativeData ? (
          <motion.div
            key="portada"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <PanelPortada
              narrative={narrativeData.narrative}
              ctaLabel="Ver señales"
              ctaVariant={narrativeData.ctaVariant}
              onCtaClick={() => setView('content')}
              coachingTip={narrativeData.coachingTip}
            />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6 md:p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              {narrativeData && (
                <button
                  onClick={() => setView('portada')}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Portada
                </button>
              )}
              <span className="text-[10px] text-slate-600">
                {data.total} señal{data.total !== 1 ? 'es' : ''}
              </span>
            </div>

            <div className="space-y-8 max-h-[420px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded">

              {/* ── Señales agrupadas por tipo ── */}
              {Array.from(grouped.entries()).slice(0, 3).map(([quadrant, alerts], gi) => {
                const hasCritical = alerts.some(a => a.alertLevel === 'RED')
                const narrative = getQuadrantNarrative(quadrant)
                const label = getQuadrantLabel(quadrant)
                const topPersons = alerts.slice(0, 3)

                return (
                  <motion.div
                    key={quadrant}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gi * 0.08 }}
                  >
                    {/* Layout: narrativa izq + personas der */}
                    <div className="flex gap-6">

                      {/* Izquierda: señal + narrativa */}
                      <div className="w-2/5 shrink-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            hasCritical
                              ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                              : 'bg-amber-400/50'
                          )} />
                          <span className="text-xs text-slate-400 font-medium">
                            {label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {narrative}
                        </p>
                      </div>

                      {/* Derecha: personas */}
                      <div className="flex-1 space-y-1.5">
                        {topPersons.map((alert, pi) => (
                          <div
                            key={alert.id}
                            className="flex items-center justify-between py-1.5"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-light text-white truncate">
                                {formatDisplayName(alert.employeeName, 'short')}
                              </p>
                              <p className="text-[10px] text-slate-600 truncate">
                                {alert.departmentName}
                              </p>
                            </div>
                            <div className={cn(
                              'w-1.5 h-1.5 rounded-full shrink-0 ml-3',
                              alert.alertLevel === 'RED'
                                ? 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                                : 'bg-amber-400/40'
                            )} />
                          </div>
                        ))}
                        {alerts.length > 3 && (
                          <p className="text-[10px] text-slate-600">
                            +{alerts.length - 3} más
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Separador sutil entre grupos */}
                    {gi < Math.min(grouped.size, 3) - 1 && (
                      <div className="h-px bg-white/5 mt-6" />
                    )}
                  </motion.div>
                )
              })}

              {/* ── Salidas lamentables (compacto) ── */}
              {hasRegretted && data.regrettedAttrition && data.regrettedAttrition.count > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="h-px bg-white/5 mb-6" />
                  <div className="flex gap-6">
                    <div className="w-2/5 shrink-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-slate-500/50 shrink-0" />
                        <span className="text-xs text-slate-500 font-medium">
                          Salidas recientes
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Talento valioso que se fue. Entender las causas previene la siguiente.
                      </p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {data.regrettedAttrition.employees.slice(0, 3).map((emp, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-light text-slate-400 truncate">
                              {formatDisplayName(emp.name, 'short')}
                            </p>
                            <p className="text-[10px] text-slate-700">{emp.department}</p>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-600/40 shrink-0 ml-3" />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* CTA final — lleva al TAC */}
            <div className="mt-8 flex justify-center">
              <a
                href="/dashboard/talent-actions"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-cyan-400 text-slate-950 text-sm font-medium hover:bg-cyan-300 transition-all duration-300"
              >
                <span>Gestionar en Centro de Acción</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
