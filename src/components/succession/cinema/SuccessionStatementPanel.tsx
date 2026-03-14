'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, MessageSquareText, Zap, ChevronDown, ChevronUp,
  Target, Loader2, Save, Brain,
  Shield, Crosshair, Landmark, RefreshCw,
  Settings, AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/components/ui/toast-system'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface StatementData {
  aiDiagnostic: string | null
  managerBet: string | null
  immediateAction: string | null
  targetPositionTitle: string | null
  targetJobLevel: string | null
  estimatedReadinessMonths: number | null
  status: string
  visibleToDirectManager: boolean
  includeInEmployeeReport: boolean
  originGapAnalysis: {
    diagnosisCaseId?: number
    diagnosisUrgency?: 'CRITICAL' | 'HIGH' | 'NORMAL'
  } | null
  goals: Array<{
    id: string
    title: string
    status: string
    progressPercent: number
    priority: string
    aiGenerated: boolean
  }>
}

interface SuccessionStatementPanelProps {
  candidateId: string
  canManage?: boolean
  candidateName?: string
  targetPosition?: string
  onDirtyChange?: (dirty: boolean) => void
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const IMMEDIATE_ACTIONS: Record<string, { label: string; icon: typeof Shield; description: string }> = {
  RETENTION_TALK:    { label: 'Conversacion de Retencion', icon: Shield,    description: 'Agendar 1:1 para comunicar interes y plan de carrera' },
  CRITICAL_PROJECT:  { label: 'Proyecto Estrategico',     icon: Crosshair, description: 'Asignar un proyecto de alto impacto como stretch assignment' },
  BOARD_EXPOSURE:    { label: 'Exposicion a Directorio',  icon: Landmark,  description: 'Incluir en presentaciones ejecutivas para ganar visibilidad' },
  LATERAL_ROTATION:  { label: 'Rotacion Lateral',         icon: RefreshCw, description: 'Mover a otra area para ampliar perspectiva y experiencia' },
}

const URGENCY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CRITICAL: { label: 'CRITICA', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
  HIGH:     { label: 'ALTA',    color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  NORMAL:   { label: 'NORMAL',  color: 'text-cyan-400',  bg: 'bg-cyan-500/10 border-cyan-500/30' },
}

const ACT_CONFIG = {
  diagnostic: { label: 'Diagnostico Focaliza', icon: Brain, color: '#A78BFA', num: 1 },
  bet:        { label: 'Apuesta del Gerente', icon: MessageSquareText, color: '#22D3EE', num: 2 },
  action:     { label: 'Accion Inmediata', icon: Zap, color: '#22D3EE', num: 3 },
} as const

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function SuccessionStatementPanel({
  candidateId,
  canManage = true,
  candidateName,
  targetPosition,
  onDirtyChange,
}: SuccessionStatementPanelProps) {
  const { success: toastSuccess, error: toastError } = useToast()
  const [data, setData] = useState<StatementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedAct, setExpandedAct] = useState<string | null>('diagnostic')

  // Editable fields
  const [managerBet, setManagerBet] = useState('')
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [visibleToManager, setVisibleToManager] = useState(false)
  const [includeInReport, setIncludeInReport] = useState(false)
  const [showVisibility, setShowVisibility] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Notify parent of dirty state changes
  function markDirty(value: boolean) {
    setDirty(value)
    onDirtyChange?.(value)
  }

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/succession/candidates/${candidateId}/development-plan`)
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
        setManagerBet(json.data.managerBet || '')
        setSelectedAction(json.data.immediateAction || null)
        setVisibleToManager(json.data.visibleToDirectManager || false)
        setIncludeInReport(json.data.includeInEmployeeReport || false)
      } else {
        setData(null)
      }
    } catch (err) {
      console.error('[SuccessionStatementPanel] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [candidateId])

  useEffect(() => { fetchPlan() }, [fetchPlan])

  // ── Generate plan (POST) ──
  async function handleGenerate() {
    setCreating(true)
    try {
      const res = await fetch(`/api/succession/candidates/${candidateId}/development-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toastError(json.error || 'Error al generar plan', 'Error')
        return
      }
      toastSuccess('Plan de sucesion generado', 'Plan creado')
      await fetchPlan()
      setExpandedAct('diagnostic')
    } catch {
      toastError('Error de conexion', 'Error')
    } finally {
      setCreating(false)
    }
  }

  // ── Save manager input (PUT) ──
  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/succession/candidates/${candidateId}/development-plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerBet: managerBet.trim() || null,
          immediateAction: selectedAction,
          visibleToDirectManager: visibleToManager,
          includeInEmployeeReport: includeInReport,
        }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
        markDirty(false)
        toastSuccess('Plan guardado correctamente', 'Guardado')
      } else {
        toastError(json.error || 'Error al guardar', 'Error')
      }
    } catch {
      toastError('Error de conexion', 'Error')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
      </div>
    )
  }

  // ── Empty state: no plan yet ──
  if (!data) {
    return (
      <div className="text-center py-4 space-y-3">
        <div className="w-11 h-11 mx-auto rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Target className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <p className="text-sm text-slate-300 font-medium">Sin Plan de Sucesion</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Genera un diagnostico basado en las brechas, readiness y perfil de talento
          </p>
        </div>
        {canManage && (
          <button
            onClick={handleGenerate}
            disabled={creating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(167,139,250,0.3)',
            }}
          >
            {creating ? (
              <span className="animate-pulse">Generando...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generar Plan
              </>
            )}
          </button>
        )}
      </div>
    )
  }

  // ── Plan exists — 3 Acts ──
  const isComplete = data.aiDiagnostic && data.managerBet && data.immediateAction
  const completedActs = [data.aiDiagnostic, data.managerBet, data.immediateAction].filter(Boolean).length

  return (
    <div className="space-y-3">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          Plan de Sucesion
        </span>
        <span className="text-[10px] text-slate-400">
          {completedActs}/3 actos{isComplete && ' ✓'}
        </span>
      </div>
      <div className="h-1 rounded-full bg-slate-700 overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(completedActs / 3) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-[#22D3EE]"
        />
      </div>

      {/* ── ACT 1: Diagnostico Focaliza ── */}
      <ActAccordion
        actKey="diagnostic"
        config={ACT_CONFIG.diagnostic}
        isExpanded={expandedAct === 'diagnostic'}
        isComplete={!!data.aiDiagnostic}
        onToggle={() => setExpandedAct(expandedAct === 'diagnostic' ? null : 'diagnostic')}
      >
        {data.aiDiagnostic ? (() => {
          const urgencyKey = data.originGapAnalysis?.diagnosisUrgency || 'NORMAL'
          const urgency = URGENCY_CONFIG[urgencyKey] || URGENCY_CONFIG.NORMAL
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${urgency.bg} ${urgency.color}`}>
                  {urgency.label}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{data.aiDiagnostic}"
              </p>
              {data.estimatedReadinessMonths != null && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-500">Horizonte estimado:</span>
                  <span className="text-xs text-purple-400 font-mono font-semibold">
                    {data.estimatedReadinessMonths === 0 ? 'Inmediato' : `${data.estimatedReadinessMonths} meses`}
                  </span>
                </div>
              )}
            </div>
          )
        })() : (
          <p className="text-xs text-slate-500 italic">Pendiente de generacion</p>
        )}
      </ActAccordion>

      {/* ── ACT 2: Manager Bet ── */}
      <ActAccordion
        actKey="bet"
        config={ACT_CONFIG.bet}
        isExpanded={expandedAct === 'bet'}
        isComplete={!!data.managerBet}
        onToggle={() => setExpandedAct(expandedAct === 'bet' ? null : 'bet')}
      >
        {canManage ? (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {candidateName
                ? `¿Que ve en ${candidateName} que los datos no capturan? ¿Cual es su apuesta personal?`
                : '¿Que ve en este candidato que los datos no capturan? ¿Cual es su apuesta personal?'}
            </p>
            <textarea
              className="fhr-input w-full min-h-[80px] resize-none text-sm"
              placeholder="Escriba su vision sobre este candidato..."
              value={managerBet}
              onChange={(e) => { setManagerBet(e.target.value); markDirty(true) }}
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-600">{managerBet.length}/1000</span>
            </div>
          </div>
        ) : data.managerBet ? (
          <p className="text-xs text-slate-300 leading-relaxed italic">
            "{data.managerBet}"
          </p>
        ) : (
          <p className="text-xs text-slate-500 italic">El gerente aun no ha registrado su vision</p>
        )}
      </ActAccordion>

      {/* ── ACT 3: Immediate Action ── */}
      <ActAccordion
        actKey="action"
        config={ACT_CONFIG.action}
        isExpanded={expandedAct === 'action'}
        isComplete={!!data.immediateAction}
        onToggle={() => setExpandedAct(expandedAct === 'action' ? null : 'action')}
      >
        {canManage ? (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Seleccione la primera accion concreta para este candidato:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(IMMEDIATE_ACTIONS).map(([key, cfg]) => {
                const isSelected = selectedAction === key
                const ActionIcon = cfg.icon
                return (
                  <button
                    key={key}
                    onClick={() => { setSelectedAction(isSelected ? null : key); markDirty(true) }}
                    className="relative p-3 rounded-2xl text-left transition-all overflow-hidden"
                    style={{
                      background: isSelected
                        ? 'rgba(34, 211, 238, 0.06)'
                        : 'rgba(30, 41, 59, 0.6)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: `1px solid ${isSelected ? 'rgba(34, 211, 238, 0.3)' : 'rgba(51, 65, 85, 0.4)'}`,
                      ...(isSelected ? { boxShadow: '0 0 12px rgba(34, 211, 238, 0.08)' } : {}),
                    }}
                  >
                    {/* Tesla line top */}
                    {isSelected && (
                      <div
                        className="absolute top-0 left-0 right-0 h-[1px]"
                        style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)' }}
                      />
                    )}
                    <ActionIcon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-[#22D3EE]' : 'text-slate-400'}`} />
                    <span className={`text-[11px] font-medium block ${isSelected ? 'text-[#22D3EE]' : 'text-slate-300'}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[9px] text-slate-500 leading-tight block mt-0.5">
                      {cfg.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : data.immediateAction ? (() => {
          const actionCfg = IMMEDIATE_ACTIONS[data.immediateAction]
          const ReadOnlyIcon = actionCfg?.icon || Zap
          return (
            <div
              className="relative flex items-center gap-3 p-3 rounded-2xl overflow-hidden"
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
              <ReadOnlyIcon className="w-5 h-5 text-[#22D3EE] flex-shrink-0" />
              <div>
                <p className="text-sm text-[#22D3EE] font-medium">
                  {actionCfg?.label || data.immediateAction}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {actionCfg?.description}
                </p>
              </div>
            </div>
          )
        })() : (
          <p className="text-xs text-slate-500 italic">Sin accion definida aun</p>
        )}
      </ActAccordion>

      {/* ── Visibility controls ── */}
      {canManage && data.aiDiagnostic && (
        <div className="mt-1">
          <button
            onClick={() => setShowVisibility(!showVisibility)}
            className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Settings className="w-3 h-3" />
            Control de Visibilidad
            {showVisibility
              ? <ChevronUp className="w-3 h-3" />
              : <ChevronDown className="w-3 h-3" />
            }
          </button>
          <AnimatePresence>
            {showVisibility && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                  {/* Toggle: Visible to direct manager */}
                  <label className="flex items-center justify-between gap-3 cursor-pointer group">
                    <span className="text-[11px] text-slate-300 group-hover:text-white transition-colors">
                      Visible para el jefe directo
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={visibleToManager}
                      onClick={() => { setVisibleToManager(!visibleToManager); markDirty(true) }}
                      className={`relative w-8 h-[18px] rounded-full transition-colors flex-shrink-0 ${
                        visibleToManager ? 'bg-cyan-500' : 'bg-slate-600'
                      }`}
                    >
                      <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform ${
                        visibleToManager ? 'translate-x-[16px]' : 'translate-x-[2px]'
                      }`} />
                    </button>
                  </label>

                  {/* Warning when visible to manager */}
                  {visibleToManager && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-400/80 leading-relaxed">
                        Al activar esta opcion, el diagnostico y la accion seran visibles inmediatamente en el portal del jefe directo.
                      </p>
                    </div>
                  )}

                  {/* Toggle: Include in employee report */}
                  <label className="flex items-center justify-between gap-3 cursor-pointer group">
                    <span className="text-[11px] text-slate-300 group-hover:text-white transition-colors">
                      Incluir en reporte del colaborador
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={includeInReport}
                      onClick={() => { setIncludeInReport(!includeInReport); markDirty(true) }}
                      className={`relative w-8 h-[18px] rounded-full transition-colors flex-shrink-0 ${
                        includeInReport ? 'bg-cyan-500' : 'bg-slate-600'
                      }`}
                    >
                      <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform ${
                        includeInReport ? 'translate-x-[16px]' : 'translate-x-[2px]'
                      }`} />
                    </button>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Save button ── */}
      {canManage && dirty && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2"
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #22D3EE, #0891B2)',
              color: '#0F172A',
              boxShadow: '0 4px 15px rgba(34, 211, 238, 0.25)',
            }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Guardando...' : 'Guardar Plan'}
          </button>
        </motion.div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ACT ACCORDION SUB-COMPONENT (glassmorphism + Tesla line)
// ════════════════════════════════════════════════════════════════════════════

function ActAccordion({
  actKey,
  config,
  isExpanded,
  isComplete,
  onToggle,
  children,
}: {
  actKey: string
  config: { label: string; icon: React.ComponentType<{ className?: string }>; color: string; num: number }
  isExpanded: boolean
  isComplete: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const Icon = config.icon
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${isComplete ? config.color + '30' : 'rgba(51, 65, 85, 0.4)'}`,
      }}
    >
      {/* Tesla line top */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] z-10"
        style={{
          background: `linear-gradient(90deg, transparent, ${isComplete ? config.color : 'rgba(71,85,105,0.3)'}, transparent)`,
          ...(isComplete ? { boxShadow: `0 0 8px ${config.color}40` } : {}),
        }}
      />

      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: isComplete ? `${config.color}15` : 'rgba(51,65,85,0.4)',
            border: `1px solid ${isComplete ? config.color + '40' : 'rgba(71,85,105,0.3)'}`,
          }}
        >
          {isComplete ? (
            <span style={{ color: config.color }}><Icon className="w-3.5 h-3.5" /></span>
          ) : (
            <span className="text-[10px] text-slate-500 font-bold">{config.num}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-medium ${isComplete ? 'text-white' : 'text-slate-400'}`}>
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isComplete && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
          )}
          {isExpanded
            ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          }
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0">
              {/* Separator */}
              <div
                className="h-px mb-3 rounded-full"
                style={{ background: `linear-gradient(90deg, transparent, ${config.color}30, transparent)` }}
              />
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
