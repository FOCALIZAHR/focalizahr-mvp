'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Target, Brain, MessageSquareText, Zap,
  Shield, Crosshair, Landmark, RefreshCw,
} from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface Plan {
  id: string
  status: string
  aiDiagnostic: string | null
  managerBet: string | null
  immediateAction: string | null
  targetPositionTitle: string | null
  targetJobLevel: string | null
  estimatedReadinessMonths: number | null
  originGapAnalysis: {
    diagnosisCaseId?: number
    diagnosisUrgency?: 'CRITICAL' | 'HIGH' | 'NORMAL'
  } | null
  createdAt: string
  candidate?: {
    criticalPosition?: {
      positionTitle?: string
    }
  }
}

interface SuccessionPlanDrawerProps {
  employeeId: string
  employeeName: string
  isOpen: boolean
  onClose: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const IMMEDIATE_ACTIONS: Record<string, { label: string; icon: typeof Shield; description: string }> = {
  RETENTION_TALK:   { label: 'Conversacion de Retencion', icon: Shield,    description: 'Agendar 1:1 para comunicar interes y plan de carrera' },
  CRITICAL_PROJECT: { label: 'Proyecto Estrategico',     icon: Crosshair, description: 'Asignar un proyecto de alto impacto como stretch assignment' },
  BOARD_EXPOSURE:   { label: 'Exposicion a Directorio',  icon: Landmark,  description: 'Incluir en presentaciones ejecutivas para ganar visibilidad' },
  LATERAL_ROTATION: { label: 'Rotacion Lateral',         icon: RefreshCw, description: 'Mover a otra area para ampliar perspectiva y experiencia' },
}

const URGENCY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CRITICAL: { label: 'CRITICA', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
  HIGH:     { label: 'ALTA',    color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  NORMAL:   { label: 'NORMAL',  color: 'text-cyan-400',  bg: 'bg-cyan-500/10 border-cyan-500/30' },
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function SuccessionPlanDrawer({
  employeeId,
  employeeName,
  isOpen,
  onClose,
}: SuccessionPlanDrawerProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/employees/${employeeId}/succession-plan`)
      const json = await res.json()
      if (json.success) {
        setPlans(json.data || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    if (isOpen) fetchPlans()
  }, [isOpen, fetchPlans])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0F172A]/98 backdrop-blur-xl border-l border-slate-800 z-[91] overflow-y-auto"
          >
            {/* Tesla line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

            {/* Header */}
            <div className="p-5 border-b border-slate-800/50 flex items-center justify-between sticky top-0 bg-[#0F172A]/95 backdrop-blur-xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Plan de Sucesion</h3>
                  <p className="text-xs text-slate-400">{employeeName}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-slate-500">Sin planes de sucesion visibles</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {plans.map(plan => {
                    const positionTitle = plan.targetPositionTitle || plan.candidate?.criticalPosition?.positionTitle
                    const urgencyKey = (plan.originGapAnalysis as Plan['originGapAnalysis'])?.diagnosisUrgency || 'NORMAL'
                    const urgency = URGENCY_CONFIG[urgencyKey] || URGENCY_CONFIG.NORMAL
                    const actionCfg = plan.immediateAction ? IMMEDIATE_ACTIONS[plan.immediateAction] : null
                    const ActionIcon = actionCfg?.icon || Zap

                    return (
                      <div key={plan.id} className="space-y-4">
                        {/* Position target */}
                        {positionTitle && (
                          <p className="text-xs text-slate-400">
                            Preparacion para: <span className="text-white font-medium">{positionTitle}</span>
                          </p>
                        )}

                        {/* ── Diagnostico Focaliza ── */}
                        {plan.aiDiagnostic && (
                          <div
                            className="relative rounded-2xl overflow-hidden p-4"
                            style={{
                              background: 'rgba(30, 41, 59, 0.6)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              border: '1px solid rgba(167, 139, 250, 0.2)',
                            }}
                          >
                            {/* Tesla line */}
                            <div
                              className="absolute top-0 left-0 right-0 h-[1px]"
                              style={{ background: 'linear-gradient(90deg, transparent, #A78BFA, transparent)' }}
                            />
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="w-4 h-4 text-purple-400" />
                              <span className="text-[11px] text-white font-medium">Diagnostico Focaliza</span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${urgency.bg} ${urgency.color}`}>
                                {urgency.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed italic">
                              &ldquo;{plan.aiDiagnostic}&rdquo;
                            </p>
                            {plan.estimatedReadinessMonths != null && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] text-slate-500">Horizonte estimado:</span>
                                <span className="text-xs text-purple-400 font-mono font-semibold">
                                  {plan.estimatedReadinessMonths === 0 ? 'Inmediato' : `${plan.estimatedReadinessMonths} meses`}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── Accion Inmediata ── */}
                        {plan.immediateAction && actionCfg && (
                          <div
                            className="relative rounded-2xl overflow-hidden p-4"
                            style={{
                              background: 'rgba(34, 211, 238, 0.04)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              border: '1px solid rgba(34, 211, 238, 0.15)',
                            }}
                          >
                            <div
                              className="absolute top-0 left-0 right-0 h-[1px]"
                              style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)' }}
                            />
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="w-4 h-4 text-cyan-400" />
                              <span className="text-[11px] text-white font-medium">Accion Inmediata</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <ActionIcon className="w-5 h-5 text-[#22D3EE] flex-shrink-0" />
                              <div>
                                <p className="text-sm text-[#22D3EE] font-medium">{actionCfg.label}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{actionCfg.description}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ── Apuesta del Gerente ── */}
                        {plan.managerBet && (
                          <div
                            className="relative rounded-2xl overflow-hidden p-4"
                            style={{
                              background: 'rgba(30, 41, 59, 0.6)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              border: '1px solid rgba(34, 211, 238, 0.15)',
                            }}
                          >
                            <div
                              className="absolute top-0 left-0 right-0 h-[1px]"
                              style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)' }}
                            />
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquareText className="w-4 h-4 text-cyan-400" />
                              <span className="text-[11px] text-white font-medium">Apuesta del Gerente</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed italic">
                              &ldquo;{plan.managerBet}&rdquo;
                            </p>
                          </div>
                        )}

                        {/* Empty statement */}
                        {!plan.aiDiagnostic && !plan.immediateAction && !plan.managerBet && (
                          <p className="text-sm text-slate-500 text-center py-6">Plan en elaboracion</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
