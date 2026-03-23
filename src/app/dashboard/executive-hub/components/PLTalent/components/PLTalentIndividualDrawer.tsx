'use client'

// ════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL DRAWER — Ficha persona con 3 motores narrativos
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback } from 'react'
import { X, Clock, AlertTriangle, Crown, Users, Target, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '../PLTalent.utils'
import { formatDisplayName } from '@/lib/utils/formatName'
import type { ExecutiveRiskPayload } from '@/lib/services/TalentRiskOrchestrator'

interface PLTalentIndividualDrawerProps {
  isOpen: boolean
  onClose: () => void
  profile: ExecutiveRiskPayload | null
}

const TENURE_LABELS: Record<string, string> = {
  A1: 'Validación (< 1 año)',
  A2: 'Verdad (1-3 años)',
  A3: 'Decisión (> 3 años)',
}

export default memo(function PLTalentIndividualDrawer({
  isOpen,
  onClose,
  profile,
}: PLTalentIndividualDrawerProps) {
  const [actionDone, setActionDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = useCallback(async () => {
    if (!profile || actionDone || loading) return
    setLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
      const res = await fetch('/api/executive-hub/pl-talent', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employeeId: profile.data.employeeId,
          employeeName: profile.data.employeeName,
          yearsOfService: Math.round(profile.data.tenureMonths / 12 * 10) / 10,
          actionCode: 'INDIVIDUAL_REVIEW',
          gapMonthly: profile.data.monthlyGap,
        }),
      })
      if (res.ok || res.status === 409) setActionDone(true)
    } catch (err) {
      console.error('[IndividualDrawer] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [profile, actionDone, loading])

  if (!isOpen || !profile) return null

  const { data, narratives } = profile
  const yearsOfService = (data.tenureMonths / 12).toFixed(1)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-slate-900 border-l border-slate-700 z-50 overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 p-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-white truncate">{formatDisplayName(data.employeeName)}</h2>
              <p className="text-slate-400 text-sm truncate">{data.position} · {data.departmentName}</p>
              <p className="text-slate-500 text-xs">{yearsOfService} años en la empresa</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 ml-2">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            {data.isLeader && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs flex items-center gap-1">
                <Users className="w-3 h-3" />
                Líder · {data.directReportsCount} reportes
              </span>
            )}
            {data.isIncumbentOfCriticalPosition && (
              <span className={cn(
                'px-2 py-1 rounded-full text-xs flex items-center gap-1',
                data.hasSuccessor
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/20 text-red-300'
              )}>
                <Crown className="w-3 h-3" />
                {data.criticalPositionTitle || 'Posición Crítica'}
                {!data.hasSuccessor && ' · Sin sucesor'}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">

          {/* ═══ Motor 1: Diagnóstico Tenure ═══ */}
          <section className="p-4 bg-slate-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white">{narratives.tenureNarrative.diagnosis}</h3>
              <span className="text-[10px] text-slate-500">({TENURE_LABELS[data.tenureTrend]})</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {narratives.tenureNarrative.narrativeNormal}
            </p>
            {narratives.tenureNarrative.prevention && (
              <div className="mt-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <p className="text-cyan-300 text-sm">
                  <strong>Recomendación:</strong> {narratives.tenureNarrative.prevention}
                </p>
              </div>
            )}
          </section>

          {/* ═══ Breakeven ═══ */}
          {data.breakevenMonths !== null && (
            <section className="p-4 bg-slate-800/50 rounded-xl">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Punto de Quiebre
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-center flex-shrink-0">
                  <p className="text-3xl font-bold text-amber-400">{data.breakevenMonths}</p>
                  <p className="text-[10px] text-slate-500">meses</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 text-sm">
                    En <strong className="text-white">{data.breakevenMonths} meses</strong>,
                    el costo de mantener supera el costo de desvincular.
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    <span>Finiquito hoy: {formatCurrency(data.finiquitoToday || 0)}</span>
                    <span>Brecha/mes: {formatCurrency(data.monthlyGap)}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ═══ Motor 2: Riesgos de Gerencia ═══ */}
          {narratives.gerenciaImpact && (
            <section className="p-4 bg-slate-800/50 rounded-xl">
              <h3 className="font-semibold text-white mb-1">
                Impacto en {narratives.gerenciaImpact.category}
              </h3>
              <p className="text-cyan-400 text-sm mb-3">Meta: {narratives.gerenciaImpact.meta}</p>
              <div className="space-y-2">
                {narratives.gerenciaImpact.risks.slice(0, 3).map((risk, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-lg flex-shrink-0">{risk.icon}</span>
                    <div>
                      <p className="text-white">{risk.label}</p>
                      <p className="text-slate-400 text-xs leading-relaxed">{risk.narrative}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ═══ Motor 3: Liderazgo Cascada ═══ */}
          {narratives.leadershipRisk && data.isLeader && (
            <section className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-red-400">Riesgo de Liderazgo</h3>
              </div>
              <p className="text-slate-300 text-sm italic mb-3">
                &ldquo;{narratives.leadershipRisk.ceoMessage}&rdquo;
              </p>
              <p className="text-slate-400 text-xs mb-2">{narratives.leadershipRisk.taxNarrative}</p>
              <ul className="space-y-1">
                {narratives.leadershipRisk.taxItems.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-300 text-xs">
                    <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ═══ CTA ═══ */}
          <button
            onClick={handleRegister}
            disabled={actionDone || loading}
            className={cn(
              'w-full py-3 font-medium rounded-xl transition-all min-h-[44px] flex items-center justify-center gap-2',
              actionDone
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90'
            )}
          >
            {actionDone ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Conversación registrada
              </>
            ) : loading ? (
              <span className="text-slate-300">Registrando...</span>
            ) : (
              'Registrar Conversación'
            )}
          </button>
        </div>
      </div>
    </>
  )
})
