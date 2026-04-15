'use client'

// ════════════════════════════════════════════════════════════════════════════
// PÁGINA 5 — DASHBOARD DEL CARGO (Layout 30/70)
// pasos/Dashboard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Costado IZQ 30%: CostadoCargo (header + exposición + 3 cards montos β)
// Centro DER 70%: mensaje cascada + CTA "Ver tareas"
//
// LÓGICA CASCADA (mensaje central por prioridad):
//   1. Si hay tareas β=1.0 con costo > 0  → "$X delegables a IA. ¿Quieres ver cuáles?"
//   2. Sino si hay tareas β=0.5 con costo  → "$X que pueden acelerarse con IA."
//   3. Fallback: 100% humano → "No hay oportunidad de delegación en este cargo."
//      (sin CTA)
//
// Click en card del costado → navega a P6 con filtro pre-aplicado a esa categoría.
// Click "Ver tareas" → navega a P6 con filtro = categoría con más oportunidad.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ArrowRight } from 'lucide-react'
import CostadoCargo from '../CostadoCargo'
import { formatCLP } from '../../_shared/format'
import MoneyTooltip from '../atomos/MoneyTooltip'
import {
  buildForensicTasks,
  calcBlockStats,
  classifyTasks,
  type BetaCategory,
} from '../descriptor-simulator-utils'
import type { SimulatorPayload } from '@/app/api/descriptors/[id]/simulator/route'

interface DashboardProps {
  payload: SimulatorPayload
  onContinue: (filterCategory: BetaCategory) => void
  onBack: () => void
}

export default memo(function Dashboard({
  payload,
  onContinue,
  onBack,
}: DashboardProps) {
  const tasks = useMemo(() => buildForensicTasks(payload), [payload])
  const grouped = useMemo(() => classifyTasks(tasks), [tasks])
  const stats = useMemo(
    () => ({
      soberania: calcBlockStats(grouped.soberania, payload.costPerHour),
      aumentado: calcBlockStats(grouped.aumentado, payload.costPerHour),
      rescate: calcBlockStats(grouped.rescate, payload.costPerHour),
    }),
    [grouped, payload.costPerHour],
  )

  // Cascada de prioridad
  const cascada = useMemo(() => {
    const headcount = Math.max(1, payload.headcount)
    const personasLabel = headcount === 1 ? 'persona' : 'personas'

    if (stats.rescate.totalCost > 0) {
      return {
        priority: 'rescate' as BetaCategory,
        amount: stats.rescate.totalCost * headcount,
        showCTA: true,
        intro: `${headcount} ${personasLabel} ejecutando este cargo.`,
        body: 'en tareas que la IA puede hacer sola.',
        question: '¿Quieres ver cuáles?',
      }
    }
    if (stats.aumentado.totalCost > 0) {
      return {
        priority: 'aumentado' as BetaCategory,
        amount: stats.aumentado.totalCost * headcount,
        showCTA: true,
        intro: `${headcount} ${personasLabel} ejecutando este cargo.`,
        body: 'en tareas que pueden acelerarse con IA.',
        question: '¿Quieres ver cuáles?',
      }
    }
    return {
      priority: 'soberania' as BetaCategory,
      amount: 0,
      showCTA: false,
      intro: `${headcount} ${personasLabel} ejecutando este cargo.`,
      body: '100% de sus tareas requieren criterio humano.',
      question: 'No hay oportunidad de delegación en este cargo.',
    }
  }, [stats, payload.headcount])

  const exposurePct = (payload.rollupClientExposure ?? 0) * 100

  return (
    <div className="h-full flex flex-col md:flex-row relative">
      {/* Botón Volver */}
      <button
        type="button"
        onClick={onBack}
        className="absolute top-3 right-3 z-10 text-slate-500 hover:text-slate-400 text-[10px] flex items-center gap-1 transition-all"
      >
        <ChevronLeft className="w-3 h-3" />
        Volver
      </button>

      {/* COSTADO — Mobile: full width arriba · Desktop: 30% IZQ */}
      <aside className="w-full md:w-[30%] md:min-w-[220px] md:max-w-[280px] border-b md:border-b-0 md:border-r border-slate-700/50 shrink-0 max-h-[40%] md:max-h-none overflow-y-auto md:overflow-visible">
        <CostadoCargo
          jobTitle={payload.jobTitle}
          exposurePct={exposurePct}
          tasks={tasks}
          costPerHour={payload.costPerHour}
          headcount={payload.headcount}
          selectedCategory={null}
          onSelectCategory={cat => onContinue(cat)}
        />
      </aside>

      {/* CENTRO — Mobile: full width abajo · Desktop: 70% DER */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 py-6 md:py-0 overflow-y-auto">
        <motion.div
          key={cascada.priority}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-center max-w-md"
        >
          {/* Contexto */}
          <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-6 block">
            Diagnóstico del cargo
          </span>

          {/* Intro: N personas */}
          <p className="text-base font-light text-slate-300 mb-4 leading-relaxed">
            {cascada.intro}
          </p>

          {/* Monto protagonista (si aplica) */}
          {cascada.showCTA && (
            <MoneyTooltip
              showIcon
              iconSize="md"
              iconColor={
                cascada.priority === 'rescate' ? 'text-cyan-400' : 'text-purple-400'
              }
              className="block mb-3"
            >
              <p
                className="text-5xl font-extralight leading-none tabular-nums"
                style={{
                  color: cascada.priority === 'rescate' ? '#22D3EE' : '#A78BFA',
                  textShadow:
                    cascada.priority === 'rescate'
                      ? '0 0 40px rgba(34, 211, 238, 0.25)'
                      : '0 0 40px rgba(167, 139, 250, 0.25)',
                }}
              >
                {formatCLP(cascada.amount)}
                <span className="text-base text-slate-500 font-light ml-2">/mes</span>
              </p>
            </MoneyTooltip>
          )}

          {/* Cuerpo */}
          <p className="text-sm font-light text-slate-400 mb-6 leading-relaxed">
            {cascada.body}
          </p>

          {/* Pregunta o fallback */}
          <p
            className={
              cascada.showCTA
                ? 'text-sm text-slate-500 font-light mb-8 italic'
                : 'text-sm text-slate-500 font-light'
            }
          >
            {cascada.question}
          </p>

          {/* CTA único (oculto en fallback 100% humano) */}
          {cascada.showCTA && (
            <button
              type="button"
              onClick={() => onContinue(cascada.priority)}
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-medium px-6 py-2.5 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30"
            >
              Ver tareas
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </div>
    </div>
  )
})
