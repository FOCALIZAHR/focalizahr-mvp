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
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Lock, Target, Loader2, Check, ArrowLeft, ChevronRight } from 'lucide-react'
import type { GoalFamily } from '@prisma/client'
import { cn } from '@/lib/utils'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import { useToast } from '@/components/ui/toast-system'
import { GOAL_FAMILY_ORDER, GOAL_FAMILY_LABELS_SHORT, GOAL_FAMILY_CONTEXT, GOAL_SUBFAMILIES } from '@/lib/constants/goalCategories'
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

  // Gate CAT·B: navegación del catálogo por Familia → Subfamilia → metas (reemplaza
  // el agrupado/colapsable de UX·B, que escondía 10/11 metas tras un chevron). Estado
  // LOCAL de filtro (no toca la categoría de ninguna meta).
  const [filterFamily, setFilterFamily] = useState<GoalFamily | 'NONE' | null>(null)
  const [filterSubfamily, setFilterSubfamily] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false) // buscador colapsable (lupa en el header)

  // Conteo por familia (+ 'NONE' = sin categoría). O(N) memoizado sobre `filtered`.
  const familyCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const g of filtered) {
      const k = g.family ?? 'NONE'
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    return counts
  }, [filtered])

  // Metas visibles según el filtro actual. 'NONE' = sin familia; familia+subfamilia =
  // match exacto (subfamily null cae en 'Otros' para no esconder metas familia-solo).
  const visibleGoals = useMemo(() => {
    if (filterFamily === 'NONE') return filtered.filter((g) => !g.family)
    if (filterFamily && filterSubfamily) {
      return filtered.filter((g) => g.family === filterFamily && (g.subfamily ?? 'Otros') === filterSubfamily)
    }
    return []
  }, [filtered, filterFamily, filterSubfamily])

  // Cuántas metas hay en una subdimensión (para el contador de la lista) y cuál es la
  // primera CON metas (para aterrizar en un resultado, no en un "0 metas"). N chico.
  const countInSub = (fam: GoalFamily, sub: string) =>
    filtered.filter((g) => g.family === fam && (g.subfamily ?? 'Otros') === sub).length
  const firstSubWithGoals = (fam: GoalFamily): string | null => {
    const subs = GOAL_SUBFAMILIES[fam]
    return subs.find((s) => countInSub(fam, s) > 0) ?? subs[0] ?? null
  }

  // Fila de meta del catálogo: título + KPI/objetivo para entender sin adivinar por el
  // nombre. Click → distribución sellada (Opción A: su cabecera candado ES el "ver KPI").
  const renderGoalRow = useCallback((g: BankParentGoal) => (
    <button
      key={g.id}
      onClick={() => setSelected(g)}
      className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-left transition-colors border border-slate-700/50"
    >
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-cyan-400 shrink-0" />
        <span className="text-sm text-white truncate">{g.title}</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-1 truncate">
        Mide: {g.description || 'sin indicador'} · Objetivo: {g.targetValue}{g.unit ? ` ${g.unit}` : ''}
      </p>
    </button>
  ), [])

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
      {loading ? (
        <div className="space-y-2">
          <div className="fhr-skeleton h-16 w-full rounded-lg" />
          <div className="fhr-skeleton h-16 w-full rounded-lg" />
        </div>
      ) : (
        // UX·A: transición suave catálogo ↔ distribución (mode="wait": el saliente
        // termina su fade antes de que entre el nuevo). No toca la lógica de ninguno.
        <AnimatePresence mode="wait" initial={false}>
        {!selected ? (
          // ── Selección de la meta del banco ──
          <motion.div key="catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-5">
          {/* Header (mockup muestra_code): BANCO DE METAS + lupa; "Elegí la categoría"; conteo */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-slate-500">Banco de metas</span>
              <button
                onClick={() => { if (searchOpen) { setSearch(''); setSearchOpen(false) } else setSearchOpen(true) }}
                className={cn('p-1 transition-colors', searchOpen ? 'text-cyan-400' : 'text-slate-400 hover:text-white')}
                aria-label="Buscar meta"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-start justify-between gap-4 mt-1">
              <h2 className="text-2xl font-extralight text-white tracking-tight">
                Elegí la <span className="fhr-title-gradient">categoría</span>
              </h2>
              <p className="text-sm text-slate-400 font-light shrink-0 mt-1">
                {filtered.length} {filtered.length === 1 ? 'meta consolidada disponible' : 'metas consolidadas disponibles'}
              </p>
            </div>
          </div>

          {searchOpen && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar meta..."
                className="fhr-input w-full pl-10"
              />
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-6">
              No hay metas {bankLevel === 'COMPANY' ? 'corporativas' : bankLevel === 'AREA' ? 'de área' : 'del banco'} disponibles. Pedí al equipo estratégico que cree una.
            </p>
          ) : search ? (
            // Búsqueda por nombre → lista plana (no obliga a navegar por categoría).
            <div className="space-y-2">{filtered.map(renderGoalRow)}</div>
          ) : (
            // VISTA ÚNICA (mockup): dimensiones SIEMPRE visibles arriba; al elegir una, debajo
            // (misma pantalla) aparecen subdimensiones + "de qué se trata" + la meta. Sin navegar.
            <>
              {/* Dimensiones: grilla completa HASTA elegir; luego colapsa a un breadcrumb
                  compacto para liberar el alto (y que las subdimensiones envuelvan sin scroll). */}
              {filterFamily === null ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {GOAL_FAMILY_ORDER.map((fam) => {
                    const count = familyCounts.get(fam) ?? 0
                    const has = count > 0
                    return (
                      <button
                        key={fam}
                        onClick={() => { setFilterFamily(fam); setFilterSubfamily(firstSubWithGoals(fam)) }}
                        className={cn('min-h-[96px] p-3 rounded-lg border flex flex-col items-center justify-center text-center transition-all',
                          has ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600' : 'bg-slate-800/30 border-slate-700/40 hover:border-slate-600')}
                      >
                        <span className={cn('text-3xl font-extralight tabular-nums leading-none', has ? 'text-cyan-400' : 'text-slate-600')}>{count}</span>
                        <p className="text-xs mt-2 leading-tight text-slate-400">{GOAL_FAMILY_LABELS_SHORT[fam]}</p>
                      </button>
                    )
                  })}
                  {(familyCounts.get('NONE') ?? 0) > 0 && (
                    <button
                      onClick={() => { setFilterFamily('NONE'); setFilterSubfamily(null) }}
                      className="min-h-[96px] p-3 rounded-lg border bg-slate-800/60 border-slate-700/60 hover:border-slate-600 flex flex-col items-center justify-center text-center transition-all"
                    >
                      <span className="text-3xl font-extralight tabular-nums text-cyan-400 leading-none">{familyCounts.get('NONE')}</span>
                      <p className="text-xs mt-2 leading-tight text-slate-400">Sin categoría</p>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setFilterFamily(null); setFilterSubfamily(null) }} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
                    <ArrowLeft className="w-3.5 h-3.5" /> Familias
                  </button>
                  <span className="text-slate-600">·</span>
                  <span className="text-sm text-white">{filterFamily === 'NONE' ? 'Sin categoría' : GOAL_FAMILY_LABELS_SHORT[filterFamily]}</span>
                  <span className="text-xs text-slate-500">· {filterFamily === 'NONE' ? (familyCounts.get('NONE') ?? 0) : (familyCounts.get(filterFamily) ?? 0)}</span>
                </div>
              )}

              {/* Familia real → LISTA VERTICAL de subdimensiones (menú, cada ítem su renglón,
                  nombres largos envuelven natural; contador por subdimensión para ver de un
                  vistazo dónde está la meta) | "de qué se trata" + metas. Un solo scroll. */}
              {filterFamily && filterFamily !== 'NONE' && (
                <div className="pt-4 border-t border-slate-700/40 grid md:grid-cols-3 gap-x-6 gap-y-4">
                  {/* Menú de subdimensiones */}
                  <div className="md:col-span-1 space-y-0.5">
                    {GOAL_SUBFAMILIES[filterFamily].map((sub) => {
                      const subCount = countInSub(filterFamily as GoalFamily, sub)
                      const active = filterSubfamily === sub
                      return (
                        <button
                          key={sub}
                          onClick={() => setFilterSubfamily(sub)}
                          className={cn('w-full text-left flex items-center gap-2 px-2 py-2.5 rounded-md transition-colors',
                            active ? 'bg-slate-800/60 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30')}
                        >
                          <span className="flex-1 text-sm leading-snug">{sub}</span>
                          <span className={cn('text-xs tabular-nums shrink-0', subCount > 0 ? 'text-cyan-400' : 'text-slate-600')}>{subCount}</span>
                          <ChevronRight className={cn('w-4 h-4 shrink-0', active ? 'text-cyan-400' : 'text-slate-500')} />
                        </button>
                      )
                    })}
                  </div>
                  {/* Detalle: de qué se trata + metas */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">— De qué se trata</p>
                      <p className="text-sm text-slate-300 font-light leading-relaxed">{GOAL_FAMILY_CONTEXT[filterFamily]}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                        {visibleGoals.length} {visibleGoals.length === 1 ? 'meta encontrada' : 'metas encontradas'}
                      </p>
                      {visibleGoals.length === 0 ? (
                        <p className="text-sm text-slate-500">No hay metas en {filterSubfamily}.</p>
                      ) : (
                        <div className="space-y-2">{visibleGoals.map(renderGoalRow)}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* "Sin categoría" → metas directas (sin subdimensiones) */}
              {filterFamily === 'NONE' && (
                <div className="pt-4 border-t border-slate-700/40 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                    {visibleGoals.length} {visibleGoals.length === 1 ? 'meta sin categoría' : 'metas sin categoría'}
                  </p>
                  <div className="space-y-2">{visibleGoals.map(renderGoalRow)}</div>
                </div>
              )}
            </>
          )}
          </motion.div>
        ) : (
          // ── KPI bloqueado + distribución por persona ──
          <motion.div key="distribution" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm p-5">
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)' }}
            />
            <div className="flex items-start justify-between gap-5">
              {/* Izquierda: título + "Mide" con su propio label, texto completo */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-white font-medium truncate">{selected.title}</span>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Mide</p>
                <p className="text-sm text-slate-300 font-light leading-relaxed">
                  {selected.description || 'sin indicador registrado'}
                </p>
              </div>
              {/* Derecha: Objetivo como número HERO, BLANCO (no cyan), separado por divisoria */}
              <div className="shrink-0 pl-5 border-l border-slate-700/50 text-right">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Objetivo</p>
                <p className="text-5xl font-extralight tabular-nums text-white leading-none">{selected.targetValue}</p>
                {selected.unit && <p className="text-xs text-slate-500 mt-1.5">{selected.unit}</p>}
              </div>
            </div>
            {/* Candado + "consolidada" abajo, sin competir; "Cambiar" al lado */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Lock className="w-3 h-3 shrink-0" />
                Esta meta está consolidada. Los indicadores no son editables.
              </div>
              <button onClick={() => { setSelected(null); setWeights({}) }} className="text-xs text-slate-500 hover:text-white shrink-0">
                Cambiar
              </button>
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
                    ) : included ? (
                      // UX·B: totalizador POR PERSONA (usado / disponible), en vivo con el slider.
                      <span className="text-xs text-cyan-400 shrink-0">Asignado: {weights[emp.id]}% · Disp: {avail - weights[emp.id]}%</span>
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
          </motion.div>
        )}
        </AnimatePresence>
      )}
    </div>
  )
})
