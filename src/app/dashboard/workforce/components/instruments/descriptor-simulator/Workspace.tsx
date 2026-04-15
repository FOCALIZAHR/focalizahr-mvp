'use client'

// ════════════════════════════════════════════════════════════════════════════
// PÁGINA 6 — SIMULADOR DE TAREAS (Layout 30/70)
// Workspace.tsx
// ════════════════════════════════════════════════════════════════════════════
// COSTADO 30% IZQ (CostadoCargo, compartido con P5):
//   Cards filtrantes — al click cambia la categoría del centro.
//
// CENTRO 70% DER:
//   - Header con título de la zona seleccionada + botón "Volver al diagnóstico"
//   - Lista de tareas filtradas por categoría (con scroll interno)
//   - StickyFooter absolute bottom: RECUPERABLE | ASISTIDO | Ver Síntesis
// ════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import TaskForensicCard from './atomos/TaskForensicCard'
import CostadoCargo from './CostadoCargo'
import StickyFooter from './StickyFooter'
import {
  buildForensicTasks,
  classifyTasks,
  computeLiveSimulation,
  type BetaCategory,
  type ForensicTask,
} from './descriptor-simulator-utils'
import type { SimulatorPayload } from '@/app/api/descriptors/[id]/simulator/route'
import type { SimulatorDescriptorListItem } from '@/app/api/descriptors/simulator-list/route'

interface WorkspaceProps {
  payload: SimulatorPayload
  /** Categoría inicial del filtro (auto-seleccionada en P5) */
  initialCategory: BetaCategory
  /** Lista completa de cargos para el selector del costado */
  descriptors: SimulatorDescriptorListItem[]
  selectedKey: string | null
  onDescriptorChange: (key: string) => void
  onBack: () => void
  onExport: (simulation: ReturnType<typeof computeLiveSimulation>) => void
}

/** Cada zona tiene una palabra plana + una palabra que recibe gradient cyan→purple */
const ZONE_TITLE_PARTS: Record<BetaCategory, { plain: string; gradient: string }> = {
  soberania: { plain: 'Solo', gradient: 'Personas' },
  aumentado: { plain: 'Personas +', gradient: 'IA' },
  rescate: { plain: 'Delegable a', gradient: 'IA' },
}

const ZONE_SUBTITLE: Record<BetaCategory, string> = {
  soberania: 'Tareas que requieren criterio humano',
  aumentado: 'Tareas asistidas por IA — techo 50%',
  rescate: 'Tareas que la IA puede hacer sola — techo 100%',
}

/** Color de la línea Tesla del header del centro, según zona seleccionada */
const ZONE_TESLA_COLOR: Record<BetaCategory, string> = {
  soberania: '#64748B',  // slate
  aumentado: '#A78BFA',  // purple
  rescate: '#22D3EE',    // cyan
}

export default function Workspace({
  payload,
  initialCategory,
  descriptors,
  selectedKey,
  onDescriptorChange,
  onBack,
  onExport,
}: WorkspaceProps) {
  // Estado de tareas (snapshot mutable)
  const [tasks, setTasks] = useState<ForensicTask[]>(() =>
    buildForensicTasks(payload),
  )

  // Filtro activo
  const [filterCategory, setFilterCategory] = useState<BetaCategory>(initialCategory)

  // Reset al cambiar payload (cambio de cargo)
  useEffect(() => {
    setTasks(buildForensicTasks(payload))
    setFilterCategory(initialCategory)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload.descriptorId])

  // Slider handler — clamp según techo de la zona
  const handleHoursChange = useCallback(
    (taskId: string, newHours: number) => {
      setTasks(prev =>
        prev.map(t => {
          if (t.taskId !== taskId) return t
          if (t.focalizaScore === null || t.focalizaScore === 0) return t
          // Techo: β=0.5 puede reducir hasta 50% de original; β=1.0 hasta 0
          const isAumentado = t.focalizaScore < 0.75
          const minHours = isAumentado ? Math.ceil(t.originalHours * 0.5) : 0
          const clamped = Math.max(minHours, Math.min(t.originalHours, newHours))
          return { ...t, hoursPerMonth: clamped }
        }),
      )
    },
    [],
  )

  // Simulación live
  const simulation = useMemo(
    () => computeLiveSimulation(tasks, payload.costPerHour, payload.headcount),
    [tasks, payload.costPerHour, payload.headcount],
  )

  // Tareas filtradas por categoría
  const grouped = useMemo(() => classifyTasks(tasks), [tasks])
  const filteredTasks = useMemo(() => {
    const items = grouped[filterCategory] ?? []
    return [...items].sort((a, b) => b.importance - a.importance)
  }, [grouped, filterCategory])

  const exposurePct = (payload.rollupClientExposure ?? 0) * 100

  const handleExport = useCallback(() => {
    onExport(simulation)
  }, [simulation, onExport])

  return (
    <div className="h-full flex flex-col md:flex-row relative">
      {/* COSTADO — Mobile: full width arriba · Desktop: 30% IZQ */}
      <aside className="w-full md:w-[30%] md:min-w-[220px] md:max-w-[280px] border-b md:border-b-0 md:border-r border-slate-700/50 shrink-0 max-h-[40%] md:max-h-none overflow-y-auto md:overflow-visible">
        <CostadoCargo
          jobTitle={payload.jobTitle}
          exposurePct={exposurePct}
          tasks={tasks}
          costPerHour={payload.costPerHour}
          headcount={payload.headcount}
          selectedCategory={filterCategory}
          onSelectCategory={setFilterCategory}
          descriptors={descriptors}
          selectedKey={selectedKey}
          onChangeCargo={onDescriptorChange}
        />
      </aside>

      {/* CENTRO — Mobile: full width abajo · Desktop: 70% DER */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Línea Tesla animada — cambia color según zona seleccionada */}
        <motion.div
          key={filterCategory}
          className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${ZONE_TESLA_COLOR[filterCategory]}, transparent)`,
            boxShadow: `0 0 15px ${ZONE_TESLA_COLOR[filterCategory]}`,
          }}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '0%', opacity: 1 }}
          transition={{ duration: 0.6, ease: 'circOut' }}
        />

        {/* Header del centro — título protagónico izquierda, botón Volver a la derecha */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-700/40 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-extralight text-white truncate leading-tight">
              {ZONE_TITLE_PARTS[filterCategory].plain}{' '}
              <span className="fhr-title-gradient">
                {ZONE_TITLE_PARTS[filterCategory].gradient}
              </span>
            </h2>
            <p className="text-[11px] font-light text-slate-500 mt-1">
              {filteredTasks.length}{' '}
              {filteredTasks.length === 1 ? 'tarea' : 'tareas'} · {ZONE_SUBTITLE[filterCategory]}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-slate-500 hover:text-cyan-400 text-[10px] uppercase tracking-widest font-bold transition-colors flex-shrink-0 mt-1"
            aria-label="Volver al diagnóstico"
            title="Volver al diagnóstico"
          >
            <ChevronLeft className="w-3 h-3" />
            Diagnóstico
          </button>
        </div>

        {/* Subtítulo eliminado — ahora vive como sufijo del header (#4 jerarquía) */}

        {/* Lista de tareas — scroll interno (única zona scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 py-3 pb-20 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={filterCategory}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 md:space-y-4"
            >
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm font-light text-slate-500">
                    No hay tareas en esta zona para este cargo.
                  </p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <TaskForensicCard
                    key={task.taskId}
                    task={task}
                    costPerHour={payload.costPerHour}
                    onHoursChange={handleHoursChange}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sticky Footer absolute bottom dentro del centro 70% */}
        <StickyFooter simulation={simulation} onSeeSynthesis={handleExport} />
      </div>
    </div>
  )
}
