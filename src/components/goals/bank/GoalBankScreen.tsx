// ════════════════════════════════════════════════════════════════════════════
// GOAL BANK SCREEN — Banco de metas definidas (Gate C, punto 2, mockup "Netflix")
// src/components/goals/bank/GoalBankScreen.tsx
// ════════════════════════════════════════════════════════════════════════════
// Pantalla ÚNICA: el jefe elige una meta ya definida (COMPANY o AREA) del banco, ve
// su KPI de SOLO LECTURA (candado), y asigna un PESO por persona (lo único editable).
// Sirve igual para 1 destinatario que para varios.
//
// Reemplaza StepSelectGoal + StepSetTargets + StepWeightsConfirm del BulkAssignWizard.
// Estilo: tokens .fhr-*, Tesla line y glassmorphism reutilizados tal cual (no se
// rediseña la piel). Peso: PercentageSlider existente. Peso disponible: número REAL
// post-Gate A (getAvailableWeight), fail-closed si no llega.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Lock, Target, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import { useToast } from '@/components/ui/toast-system'
import { GOAL_FAMILY_LABELS } from '@/lib/constants/goalCategories'
import {
  buildBankPayload,
  getAvailableWeight,
  type BankParentGoal,
  type AssignmentStatus,
} from './bankPayload'
import PercentageSlider from '@/components/ui/PercentageSlider'

interface TeamMember {
  id: string
  fullName: string
  position?: string
  assignmentStatus?: AssignmentStatus
  goalParentIds?: string[]   // Gate 3·B: metas-padre que ya tiene (para excluir duplicados)
}

interface GoalBankScreenProps {
  bankLevel: 'COMPANY' | 'AREA' | 'COMPANY,AREA'   // masiva ve ambos niveles (Punto 1)
  /** Personas precargadas (entrada masiva): filtra la lista a solo ellas. */
  preselectedIds?: string[]
  /** Se llama al terminar (crear) para que el orquestador redirija/cierre. */
  onDone: () => void
  /** Opcional: si viene, el botón "Cancelar" lo llama en vez de onDone (masiva:
   *  volver al Paso 2 sin cerrar todo). Individual no lo pasa → comportamiento actual. */
  onCancel?: () => void
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default memo(function GoalBankScreen({ bankLevel, preselectedIds, onDone, onCancel }: GoalBankScreenProps) {
  const { success, error } = useToast()

  const [bankGoals, setBankGoals] = useState<BankParentGoal[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [selected, setSelected] = useState<BankParentGoal | null>(null)
  // employeeId -> peso asignado. Presencia en el map = destinatario incluido.
  const [weights, setWeights] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  // Cargar banco (COMPANY o AREA) + equipo (con assignmentStatus post-Gate A)
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/goals?level=${bankLevel}&status=ON_TRACK,NOT_STARTED`, { headers: authHeaders(), credentials: 'include' })
        .then((r) => r.json())
        .then((r) => (r.success ? (r.data as BankParentGoal[]) : []))
        .catch(() => [] as BankParentGoal[]),
      fetch('/api/goals/team', { headers: authHeaders(), credentials: 'include' })
        .then((r) => r.json())
        .then((r) => (r.success ? (r.data as TeamMember[]) : []))
        .catch(() => [] as TeamMember[]),
    ])
      .then(([goals, members]) => {
        setBankGoals(goals)
        // Gate 3·B: en masiva mostramos SOLO las personas elegidas en el grid (misma UX
        // de hoy). En individual (sin preselectedIds) mostramos el equipo completo — igual.
        setTeam(preselectedIds ? members.filter((m) => preselectedIds.includes(m.id)) : members)
      })
      .finally(() => setLoading(false))
  }, [bankLevel, preselectedIds])

  const filtered = useMemo(
    () => (search ? bankGoals.filter((g) => g.title.toLowerCase().includes(search.toLowerCase())) : bankGoals),
    [bankGoals, search]
  )

  const suggested = selected?.weight ?? 0

  // Gate 3·B: al elegir la meta, auto-incluir a los precargados con el peso sugerido
  // (respetando el disponible real y saltando a quien YA tiene esa meta). Solo aplica
  // en masiva (preselectedIds presente); en individual no hace nada.
  useEffect(() => {
    if (!selected || !preselectedIds?.length) return
    setWeights((prev) => {
      const next = { ...prev }
      for (const id of preselectedIds) {
        if (id in next) continue
        const m = team.find((t) => t.id === id)
        if (!m || m.goalParentIds?.includes(selected.id)) continue // ya la tiene → excluir
        const avail = getAvailableWeight(m.assignmentStatus)
        next[id] = avail === null ? 0 : Math.min(suggested, avail)
      }
      return next
    })
  }, [selected, preselectedIds, team, suggested])

  const toggleMember = useCallback(
    (emp: TeamMember) => {
      setWeights((prev) => {
        const next = { ...prev }
        if (emp.id in next) {
          delete next[emp.id]
        } else {
          const avail = getAvailableWeight(emp.assignmentStatus)
          // Sugerido, pero nunca por encima del disponible real
          next[emp.id] = avail === null ? 0 : Math.min(suggested, avail)
        }
        return next
      })
    },
    [suggested]
  )

  const setWeight = useCallback((employeeId: string, weight: number) => {
    setWeights((prev) => ({ ...prev, [employeeId]: weight }))
  }, [])

  const selectedIds = Object.keys(weights)
  const canSubmit = !!selected && selectedIds.length > 0 && !submitting

  const handleSubmit = useCallback(async () => {
    if (!selected) return
    setSubmitting(true)
    let ok = 0
    const errors: string[] = []

    for (const employeeId of selectedIds) {
      const payload = buildBankPayload(selected, employeeId, weights[employeeId])
      try {
        const res = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          ok++
        } else {
          const j = await res.json().catch(() => ({}))
          const name = team.find((m) => m.id === employeeId)?.fullName ?? employeeId
          errors.push(`${name}: ${j.error ?? 'error'}`)
        }
      } catch {
        errors.push(`${employeeId}: error de red`)
      }
    }

    setSubmitting(false)
    if (ok > 0) success(`${ok} ${ok === 1 ? 'meta asignada' : 'metas asignadas'}${errors.length ? ` · ${errors.length} con error` : ''}`)
    if (errors.length > 0) error(errors.slice(0, 3).join(' · '))
    if (ok > 0 && errors.length === 0) onDone()
  }, [selected, selectedIds, weights, team, success, error, onDone])

  // ── Render ──
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extralight text-white tracking-tight">
          Distribuir{' '}
          <span className="fhr-title-gradient">
            {bankLevel === 'COMPANY' ? 'meta corporativa' : bankLevel === 'AREA' ? 'meta de área' : 'meta del banco'}
          </span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Elegí una meta ya definida y asignala a tu equipo. El indicador viene consolidado: solo definís el peso.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="fhr-skeleton h-16 w-full rounded-lg" />
          <div className="fhr-skeleton h-16 w-full rounded-lg" />
        </div>
      ) : !selected ? (
        // ── Selección de la meta del banco ──
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar meta..."
              className="fhr-input w-full pl-10"
            />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-6">
                No hay metas {bankLevel === 'COMPANY' ? 'corporativas' : bankLevel === 'AREA' ? 'de área' : 'del banco'} disponibles. Pedí al equipo estratégico que cree una.
              </p>
            ) : (
              filtered.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelected(g)}
                  className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-left transition-colors border border-slate-700/50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-sm text-white truncate">{g.title}</span>
                  </div>
                  {g.family && (
                    <span className="text-[10px] text-slate-500">{GOAL_FAMILY_LABELS[g.family]}{g.subfamily ? ` · ${g.subfamily}` : ''}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        // ── KPI bloqueado + distribución por persona ──
        <>
          <div className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm p-5">
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)' }}
            />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-white font-medium truncate">{selected.title}</span>
                </div>
                <p className="text-sm text-slate-400">Mide: {selected.description || 'sin indicador registrado'}</p>
                <p className="text-sm text-slate-400">Objetivo: {selected.targetValue}{selected.unit ? ` ${selected.unit}` : ''}</p>
              </div>
              <button onClick={() => { setSelected(null); setWeights({}) }} className="text-xs text-slate-500 hover:text-white shrink-0">
                Cambiar
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
              <Lock className="w-3 h-3" />
              Esta meta está consolidada. Los indicadores no son editables.
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-slate-300">Distribución por persona</p>
            <p className="text-xs text-slate-500">Sugerido: {suggested}%</p>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {team.map((emp) => {
              const included = emp.id in weights
              const avail = getAvailableWeight(emp.assignmentStatus)
              const noData = avail === null
              // Gate 3·B: quien YA tiene esta meta-padre se pre-excluye (aplica a los DOS
              // flujos — individual y masiva). Evita el 400 de duplicado en el submit.
              const alreadyHas = !!selected && !!emp.goalParentIds?.includes(selected.id)
              const disabled = noData || alreadyHas
              return (
                <div key={emp.id} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/40">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => toggleMember(emp)}
                      disabled={disabled}
                      className="flex items-center gap-3 min-w-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span
                        className={cn(
                          'w-6 h-6 rounded-md flex items-center justify-center shrink-0 border',
                          included ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'
                        )}
                      >
                        {included && <Check className="w-4 h-4 text-white" />}
                      </span>
                      <span className="text-sm text-white truncate">{emp.fullName}</span>
                    </button>
                    {alreadyHas ? (
                      <span className="text-xs text-slate-500 shrink-0">ya tiene esta meta</span>
                    ) : noData ? (
                      <span className="text-xs text-amber-400 shrink-0">Sin datos de peso — no se puede asignar</span>
                    ) : (
                      <span className="text-xs text-slate-500 shrink-0">disp. {avail}%</span>
                    )}
                  </div>
                  {included && !noData && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 overflow-hidden">
                      <PercentageSlider
                        value={weights[emp.id]}
                        onChange={(v) => setWeight(emp.id, Math.min(v, avail))}
                        max={avail}
                        label="Peso en su evaluación"
                      />
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-700/50">
            <GhostButton onClick={onCancel ?? onDone}>Cancelar</GhostButton>
            <PrimaryButton icon={submitting ? Loader2 : Target} onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? 'Asignando...' : `Asignar a ${selectedIds.length || ''}`}
            </PrimaryButton>
          </div>
        </>
      )}
    </div>
  )
})
