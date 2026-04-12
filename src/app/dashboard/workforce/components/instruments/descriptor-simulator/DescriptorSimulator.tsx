'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTOR SIMULATOR — Instrumento #1 del Workforce Deck (Gemini)
// src/app/dashboard/workforce/components/instruments/descriptor-simulator/DescriptorSimulator.tsx
// ════════════════════════════════════════════════════════════════════════════
// Simulador de rediseño de cargos. El CEO selecciona un descriptor, edita
// las horas y el estado de cada tarea (Humano / Aumentado / Automatizado),
// y ve en vivo el costo rescatado, las horas liberadas y la nueva exposición.
//
// 100% client-side después de la carga inicial. Cero round-trips al backend.
// Estado mutable local con useState.
// ════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Layers, AlertTriangle, Loader2 } from 'lucide-react'
import TeslaLine from '../_shared/TeslaLine'
import ConfidenceDot from '../_shared/ConfidenceDot'
import { formatCLP } from '../_shared/format'
import DescriptorTaskCard from './DescriptorTaskCard'
import PnLLiveTracker from './PnLLiveTracker'
import ContrastBars from './ContrastBars'
import ScenarioExportModal from './ScenarioExportModal'
import {
  HORAS_MES,
  buildEditableTasks,
  computeAuditBaseline,
  computeSimulation,
  type EditableTask,
  type TaskState,
} from './descriptor-simulator-utils'
import type { SimulatorPayload } from '@/app/api/descriptors/[id]/simulator/route'
import type { SimulatorDescriptorListItem } from '@/app/api/descriptors/simulator-list/route'

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DescriptorSimulator() {
  // ── Listado para el dropdown ─────────────────────────────────────────
  const [descriptorList, setDescriptorList] = useState<SimulatorDescriptorListItem[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  // ── Selección actual ─────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ── Payload del descriptor cargado ───────────────────────────────────
  const [payload, setPayload] = useState<SimulatorPayload | null>(null)
  const [payloadLoading, setPayloadLoading] = useState(false)
  const [payloadError, setPayloadError] = useState<string | null>(null)

  // ── Estado mutable de tareas (la simulación) ─────────────────────────
  const [tasks, setTasks] = useState<EditableTask[]>([])

  // ── Modal de export ──────────────────────────────────────────────────
  const [showExportModal, setShowExportModal] = useState(false)

  // ── 1. Cargar lista de descriptors al montar ─────────────────────────
  useEffect(() => {
    let cancelled = false
    setListLoading(true)
    setListError(null)
    fetch('/api/descriptors/simulator-list')
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        if (!json.success) {
          setListError(json.error || 'Error al cargar descriptors')
          return
        }
        const list: SimulatorDescriptorListItem[] = json.data
        setDescriptorList(list)
        // Seleccionar el primero por defecto
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].id)
        }
      })
      .catch(e => {
        if (cancelled) return
        setListError(e.message || 'Error de red')
      })
      .finally(() => {
        if (cancelled) return
        setListLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 2. Cargar payload al cambiar descriptor seleccionado ─────────────
  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    setPayloadLoading(true)
    setPayloadError(null)
    setPayload(null)
    setTasks([])
    setShowExportModal(false)
    fetch(`/api/descriptors/${selectedId}/simulator`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        if (!json.success) {
          setPayloadError(json.error || 'Error al cargar el descriptor')
          return
        }
        const data: SimulatorPayload = json.data
        setPayload(data)
        setTasks(buildEditableTasks(data))
      })
      .catch(e => {
        if (cancelled) return
        setPayloadError(e.message || 'Error de red')
      })
      .finally(() => {
        if (cancelled) return
        setPayloadLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  // ── 3. Handlers de mutación de tareas ────────────────────────────────
  const handleChangeHours = useCallback((taskId: string, hours: number) => {
    setTasks(prev =>
      prev.map(t => (t.taskId === taskId ? { ...t, hours } : t)),
    )
  }, [])

  const handleChangeState = useCallback((taskId: string, state: TaskState) => {
    setTasks(prev =>
      prev.map(t => (t.taskId === taskId ? { ...t, state } : t)),
    )
  }, [])

  // ── 4. Cálculo en vivo de la simulación ──────────────────────────────
  const simulation = useMemo(() => {
    const monthlySalary = payload?.baseSalary.monthlySalary ?? 0
    return computeSimulation(tasks, monthlySalary)
  }, [tasks, payload?.baseSalary.monthlySalary])

  const baselineExposurePct = useMemo(
    () => (payload ? payload.baseline.adjustedExposure * 100 : 0),
    [payload],
  )

  // ── 4.b Audit baseline (narrativa del gancho) ────────────────────────
  // Snapshot inicial inmutable. Se recalcula solo cuando cambia el descriptor.
  const auditBaseline = useMemo(() => {
    if (!payload) return null
    const initial = buildEditableTasks(payload)
    if (initial.length === 0) return null
    return computeAuditBaseline(initial)
  }, [payload])

  // ── 4.c Total de horas asignadas (running total — sobre todas las tareas) ─
  const totalAssignedHours = useMemo(
    () => tasks.reduce((s, t) => s + t.hours, 0),
    [tasks],
  )

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 md:p-6 lg:p-8">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Instrumento · Rediseño de puestos
            </p>
            <h1 className="text-2xl md:text-3xl font-extralight text-white mt-1.5 tracking-tight">
              Rediseño de Cargos{' '}
              <span className="fhr-title-gradient">× IA</span>
            </h1>

            {/* Narrativa de entrada — Patrón G, siempre visible */}
            <p className="text-sm font-light text-slate-300 mt-3 max-w-3xl leading-relaxed">
              Este simulador descompone las{' '}
              <span className="text-white font-medium">160 horas mensuales</span>{' '}
              de un cargo en sus tareas reales. Cada tarea tiene un{' '}
              <span className="text-white font-medium">grado de dominio IA</span>{' '}
              (la barra de color). Mueve las horas y cambia el estado para ver
              cuánto tiempo y dinero puede rescatar tu estructura.
            </p>

            {/* Narrativa de auditoría — el gancho */}
            {auditBaseline && (
              <div className="mt-4 max-w-3xl">
                {auditBaseline.M > 0 ? (
                  <p className="text-sm font-light text-slate-400 leading-relaxed">
                    De las{' '}
                    <span className="text-white font-bold tabular-nums">
                      {auditBaseline.N}
                    </span>{' '}
                    tareas de este cargo,{' '}
                    <span className="text-cyan-400 font-bold tabular-nums">
                      {auditBaseline.M}
                    </span>{' '}
                    tienen dominio IA superior al{' '}
                    <span className="text-cyan-400 font-bold">70%</span>. Eso
                    representa{' '}
                    <span className="text-cyan-400 font-bold tabular-nums">
                      {auditBaseline.X} horas/mes
                    </span>{' '}
                    en tareas que la IA ya sabe ejecutar
                    <span className="text-amber-300 font-medium italic">
                      {' '}— y que hoy se pagan como si fueran exclusivamente
                      humanas.
                    </span>
                  </p>
                ) : (
                  <p className="text-sm font-light text-slate-400 leading-relaxed">
                    De las{' '}
                    <span className="text-white font-bold tabular-nums">
                      {auditBaseline.N}
                    </span>{' '}
                    tareas de este cargo,{' '}
                    <span className="text-cyan-400 font-bold">ninguna</span>{' '}
                    cruza el umbral crítico de{' '}
                    <span className="text-cyan-400 font-bold">70%</span> de
                    dominio IA. La estructura de tareas es defendible bajo el
                    estado actual.
                  </p>
                )}
              </div>
            )}
          </div>
          {payload && (
            <ConfidenceDot confidence={payload.baseline.confidence} />
          )}
        </div>

        {/* Selector de descriptor + baseline badge */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-end">
          {/* Dropdown */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0 max-w-md">
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Selecciona cargo
            </label>
            <div className="relative">
              <Layers className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedId ?? ''}
                onChange={e => setSelectedId(e.target.value)}
                disabled={listLoading || descriptorList.length === 0}
                className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded text-sm font-light text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
              >
                {listLoading && <option>Cargando…</option>}
                {!listLoading && descriptorList.length === 0 && (
                  <option>Sin descriptors disponibles</option>
                )}
                {descriptorList.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.jobTitle}
                    {d.employeeCount > 0
                      ? `  ·  ${d.employeeCount} ${d.employeeCount === 1 ? 'persona' : 'personas'}`
                      : ''}
                    {d.status === 'DRAFT' ? '  ·  draft' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baseline badge — el ancla */}
          {payload && (
            <div
              className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded border border-amber-500/30 bg-amber-500/[0.06]"
              style={{ boxShadow: '0 0 12px rgba(245, 158, 11, 0.08)' }}
            >
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                Estado actual
              </span>
              <span className="text-base font-bold text-amber-400 tabular-nums font-mono">
                {Math.round(payload.baseline.adjustedExposure * 100)}%
              </span>
              <span className="text-[9px] uppercase tracking-widest text-amber-400/70 font-bold">
                exposición
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── Cuerpo: Tareas + Sidebar P&L ──────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        {/* COLUMNA IZQUIERDA — Tareas */}
        <div className="flex-1 fhr-card relative overflow-hidden flex flex-col p-0 min-h-[400px] md:min-h-0">
          <TeslaLine />

          {listError && (
            <ErrorState message={`Lista: ${listError}`} />
          )}

          {!listError && payloadLoading && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-cyan-400/60 animate-spin" />
            </div>
          )}

          {!listError && !payloadLoading && payloadError && (
            <ErrorState message={payloadError} />
          )}

          {!listError && !payloadLoading && payload && tasks.length === 0 && (
            <EmptyState />
          )}

          {!listError && !payloadLoading && payload && tasks.length > 0 && (
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
              {/* Subhead — occupation + valor hora */}
              <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider mb-2">
                <span className="text-slate-500 font-bold truncate">
                  {payload.occupationTitle}
                </span>
                <span className="text-slate-500 font-mono whitespace-nowrap">
                  Valor hora ·{' '}
                  <span className="text-slate-300">
                    {formatCLP(simulation.valorHora)}
                  </span>
                </span>
              </div>

              {/* Total asignado — running total con barra de progreso */}
              <HoursBudget total={totalAssignedHours} max={HORAS_MES} />

              {/* Leyenda de estados — una sola vez sobre la lista */}
              <StatesLegend />

              {tasks.map(task => (
                <DescriptorTaskCard
                  key={task.taskId}
                  task={task}
                  valorHora={simulation.valorHora}
                  onChangeHours={handleChangeHours}
                  onChangeState={handleChangeState}
                />
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA — P&L Live + Contraste + Botón */}
        <aside className="w-full md:w-[340px] flex-shrink-0 fhr-card relative overflow-hidden flex flex-col p-0">
          <TeslaLine />
          <div className="flex flex-col gap-6 p-6 overflow-y-auto flex-1">
            {payload ? (
              <>
                <PnLLiveTracker
                  simulation={simulation}
                  baselineExposurePct={baselineExposurePct}
                />
                <div className="border-t border-white/5 pt-5">
                  <ContrastBars
                    baselineExposurePct={baselineExposurePct}
                    newExposurePct={simulation.nuevaExposicionPct}
                  />
                </div>
              </>
            ) : (
              <div className="text-center text-xs font-light text-slate-500 py-10">
                {listLoading || payloadLoading
                  ? 'Cargando escenario…'
                  : 'Selecciona un cargo para iniciar la simulación'}
              </div>
            )}
          </div>

          {/* Botón Guardar Escenario */}
          {payload && tasks.length > 0 && (
            <div className="border-t border-white/5 p-4">
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="w-full py-2.5 rounded text-[10px] uppercase tracking-widest font-bold text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all"
              >
                Guardar Escenario
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* ── Modal Export ──────────────────────────────────────────── */}
      {payload && (
        <ScenarioExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          jobTitle={payload.jobTitle}
          baselineExposurePct={baselineExposurePct}
          simulation={simulation}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-STATES
// ─────────────────────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="w-6 h-6 text-amber-400/60 mb-3" />
      <p className="text-sm font-light text-slate-300 max-w-xs">{message}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <p className="text-sm font-light text-slate-400 max-w-xs">
        Este descriptor no tiene tareas activas. Confirma o edita el descriptor
        en el módulo de Descriptors antes de simular.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HOURS BUDGET — running total de horas asignadas con barra de progreso
// El CEO ve cuánto del mes (160h) tiene asignado y cuánto le queda libre
// ─────────────────────────────────────────────────────────────────────────────

function HoursBudget({ total, max }: { total: number; max: number }) {
  const filled = Math.min(100, (total / max) * 100)
  const remaining = Math.max(0, max - total)
  const isOver = total > max

  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider mb-1">
        <span className="text-slate-500 font-bold">Total asignado</span>
        <span className="font-mono tabular-nums">
          <span className={isOver ? 'text-amber-400 font-bold' : 'text-cyan-400 font-bold'}>
            {Math.round(total)}
          </span>
          <span className="text-slate-600"> de </span>
          <span className="text-slate-400">{max} horas</span>
          {!isOver && remaining > 0 && (
            <span className="text-slate-600 ml-2">
              · {Math.round(remaining)}h libres
            </span>
          )}
        </span>
      </div>
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={
            isOver
              ? 'h-full bg-amber-400 transition-all duration-300'
              : 'h-full bg-cyan-400 transition-all duration-300'
          }
          style={{ width: `${filled}%` }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LEYENDA DE ESTADOS — explicativa, una sola vez sobre la lista
// ─────────────────────────────────────────────────────────────────────────────

function StatesLegend() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 rounded border border-slate-800/60 bg-slate-900/30">
      <LegendItem
        dotClass="bg-slate-400"
        labelClass="text-slate-300"
        label="Humano"
        description="La persona ejecuta · costo 100%"
      />
      <LegendItem
        dotClass="bg-amber-400"
        labelClass="text-amber-300"
        label="Aumentado"
        description="Ejecuta con IA · eficiencia mejorada"
      />
      <LegendItem
        dotClass="bg-cyan-400"
        labelClass="text-cyan-300"
        label="Automatizado"
        description="IA ejecuta sola · rescate de EBITDA"
      />
    </div>
  )
}

function LegendItem({
  dotClass,
  labelClass,
  label,
  description,
}: {
  dotClass: string
  labelClass: string
  label: string
  description: string
}) {
  return (
    <div className="flex items-start gap-2">
      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dotClass}`} />
      <div className="min-w-0">
        <span className={`text-[9px] uppercase tracking-widest font-bold ${labelClass}`}>
          {label}
        </span>
        <p className="text-[10px] font-light text-slate-500 leading-snug">
          {description}
        </p>
      </div>
    </div>
  )
}
