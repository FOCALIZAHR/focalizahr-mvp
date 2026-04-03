'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION SPLIT — Capa 3: Categorías + Narrativa + Evidencia
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationSplit.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón G: Split 50/50 — narrativa izquierda, personas derecha
// Auto-selección categoría más crítica. Labels 11px visibles.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Home, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { CompensationPath } from './CompensationHub'
import type { CorrelationPoint, ManagerGoalsStats } from '../GoalsCorrelation.types'
import { getCompensacionNarrative } from '@/config/narratives/CompensacionNarrativeDictionary'
import { getSignalNarrative, classifySignal } from '@/config/narratives/CompensationSignalsDictionary'
import type { SignalType } from '@/config/narratives/CompensationSignalsDictionary'

// ════════════════════════════════════════════════════════════════════════════
// CATEGORY CONFIG
// ════════════════════════════════════════════════════════════════════════════

interface CategoryDef {
  key: string
  label: string
  filterFn: (c: CorrelationPoint) => boolean
  narrativeSource: 'compensation' | 'signal'
  narrativeKey: string
  actionLabel: string
  coachingTip?: string
}

function getCategories(path: CompensationPath): CategoryDef[] {
  if (path === 'merito') return [
    { key: 'PB', label: 'Sesgo evaluador', filterFn: c => c.quadrant === 'PERCEPTION_BIAS', narrativeSource: 'compensation', narrativeKey: 'PERCEPTION_BIAS', actionLabel: 'Enviar a RRHH', coachingTip: 'Revisa estos perfiles antes de la reunión de compensaciones.' },
    { key: 'HP', label: 'Talento invisible', filterFn: c => c.quadrant === 'HIDDEN_PERFORMER', narrativeSource: 'compensation', narrativeKey: 'HIDDEN_PERFORMER', actionLabel: 'Enviar a RRHH', coachingTip: 'El talento invisible no avisa antes de irse.' },
    { key: 'DR', label: 'Doble riesgo', filterFn: c => c.quadrant === 'DOUBLE_RISK', narrativeSource: 'compensation', narrativeKey: 'DOUBLE_RISK', actionLabel: 'Escalar decisión', coachingTip: 'Cada mes sin decisión es pasivo laboral.' },
    { key: 'CO', label: 'Alineados', filterFn: c => c.quadrant === 'CONSISTENT', narrativeSource: 'compensation', narrativeKey: 'CONSISTENT', actionLabel: 'Revisar retención' },
  ]
  if (path === 'bonos') return [
    { key: 'HP', label: 'Talento invisible', filterFn: c => c.quadrant === 'HIDDEN_PERFORMER', narrativeSource: 'compensation', narrativeKey: 'HIDDEN_PERFORMER', actionLabel: 'Enviar a RRHH', coachingTip: 'El talento invisible no avisa antes de irse.' },
    { key: 'PB', label: 'Sesgo evaluador', filterFn: c => c.quadrant === 'PERCEPTION_BIAS', narrativeSource: 'compensation', narrativeKey: 'PERCEPTION_BIAS', actionLabel: 'Enviar a RRHH', coachingTip: 'Revisa estos perfiles antes de la reunión de compensaciones.' },
    { key: 'DR', label: 'Doble riesgo', filterFn: c => c.quadrant === 'DOUBLE_RISK', narrativeSource: 'compensation', narrativeKey: 'DOUBLE_RISK', actionLabel: 'Escalar decisión', coachingTip: 'Cada mes sin decisión es pasivo laboral.' },
    { key: 'CO', label: 'Alineados', filterFn: c => c.quadrant === 'CONSISTENT', narrativeSource: 'compensation', narrativeKey: 'CONSISTENT', actionLabel: 'Revisar retención' },
  ]
  // Señales
  return [
    { key: 'HB', label: 'Alto bono, bajo mérito', filterFn: c => classifySignal(c.score360, c.goalsPercent) === 'HIGH_BONUS_LOW_MERIT', narrativeSource: 'signal', narrativeKey: 'HIGH_BONUS_LOW_MERIT', actionLabel: 'Enviar a RRHH' },
    { key: 'LB', label: 'Alto mérito, bajo bono', filterFn: c => classifySignal(c.score360, c.goalsPercent) === 'LOW_BONUS_HIGH_MERIT', narrativeSource: 'signal', narrativeKey: 'LOW_BONUS_HIGH_MERIT', actionLabel: 'Enviar a RRHH' },
    { key: 'BL', label: 'Doble negativa', filterFn: c => classifySignal(c.score360, c.goalsPercent) === 'BOTH_LOW', narrativeSource: 'signal', narrativeKey: 'BOTH_LOW', actionLabel: 'Escalar decisión' },
    { key: 'BH', label: 'Señal coherente', filterFn: c => classifySignal(c.score360, c.goalsPercent) === 'BOTH_HIGH', narrativeSource: 'signal', narrativeKey: 'BOTH_HIGH', actionLabel: 'Revisar retención' },
  ]
}

// Auto-select priority: first non-empty non-consistent category
function autoSelectIndex(categories: CategoryDef[], counts: number[]): number {
  // Priority: DOUBLE_RISK > PERCEPTION_BIAS/HIDDEN_PERFORMER > rest
  const priorityKeys = ['DR', 'BL', 'PB', 'HP', 'HB', 'LB']
  for (const pk of priorityKeys) {
    const idx = categories.findIndex((c, i) => c.key === pk && counts[i] > 0)
    if (idx >= 0) return idx
  }
  return categories.findIndex((_, i) => counts[i] > 0) ?? 0
}

// ════════════════════════════════════════════════════════════════════════════
// EVALUATOR TAG — segunda variable para mérito
// ════════════════════════════════════════════════════════════════════════════

function getSecondVarTag(point: CorrelationPoint, path: CompensationPath): { label: string; colorClass: string } | null {
  if (path === 'merito' && point.evaluatorStatus) {
    if (point.evaluatorStatus === 'INDULGENTE') return { label: 'Jefe indulgente', colorClass: 'tg-warning' }
    if (point.evaluatorStatus === 'SEVERA') return { label: 'Jefe severo', colorClass: 'tg-amber' }
  }
  if (path === 'bonos' && point.riskQuadrant) {
    if (point.riskQuadrant === 'FUGA_CEREBROS') return { label: 'Riesgo de fuga', colorClass: 'tg-purple' }
    if (point.riskQuadrant === 'BURNOUT_RISK') return { label: 'Riesgo burnout', colorClass: 'tg-amber' }
  }
  if (path === 'bonos' && point.mobilityQuadrant) {
    if (point.mobilityQuadrant === 'SUCESOR_NATURAL') return { label: 'Sucesor natural', colorClass: 'tg-purple' }
    if (point.mobilityQuadrant === 'MOTOR_EQUIPO') return { label: 'Motor equipo', colorClass: 'tg-purple' }
  }
  return null
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface CompensationSplitProps {
  path: CompensationPath
  correlation: CorrelationPoint[]
  byManager: ManagerGoalsStats[]
  onBack: () => void
  onHome: () => void
}

export default memo(function CompensationSplit({
  path,
  correlation,
  byManager,
  onBack,
  onHome,
}: CompensationSplitProps) {
  const withGoals = useMemo(() =>
    correlation.filter(c => c.quadrant !== 'NO_GOALS' && c.goalsPercent !== null)
  , [correlation])

  const categories = useMemo(() => getCategories(path), [path])
  const counts = useMemo(() =>
    categories.map(cat => withGoals.filter(cat.filterFn).length)
  , [categories, withGoals])

  const [selected, setSelected] = useState(() => autoSelectIndex(categories, counts))
  const cat = categories[selected]
  const people = useMemo(() =>
    withGoals.filter(cat.filterFn)
  , [withGoals, cat])

  // Narrative
  const narrative = cat.narrativeSource === 'compensation'
    ? getCompensacionNarrative(cat.narrativeKey)
    : null
  const signalNarr = cat.narrativeSource === 'signal'
    ? getSignalNarrative(cat.narrativeKey as SignalType)
    : null

  // Second variable summary for narrative panel
  const secondVarSummary = useMemo(() => {
    if (path === 'merito') {
      const indulgent = people.filter(p => p.evaluatorStatus === 'INDULGENTE')
      if (indulgent.length > 0) return `En <b>${indulgent.length} caso${indulgent.length !== 1 ? 's' : ''}</b>, el evaluador fue clasificado como indulgente.`
    }
    if (path === 'bonos') {
      const withRisk = people.filter(p => p.riskQuadrant || p.mobilityQuadrant)
      if (withRisk.length > 0) return `<b>${withRisk.length}</b> con señal de riesgo o talento especial detectado.`
    }
    return null
  }, [path, people])

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-[11px] font-light">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a narrativa
        </button>
        <button onClick={onHome} className="flex items-center gap-1.5 border border-slate-800/50 text-slate-600 hover:border-cyan-500/20 hover:text-slate-400 text-[10px] px-3 py-1.5 rounded-md transition-all">
          <Home className="w-3 h-3" /> Inicio
        </button>
      </div>

      {/* Category selectors */}
      <div className="flex gap-2 mb-4">
        {categories.map((c, i) => (
          <button
            key={c.key}
            onClick={() => setSelected(i)}
            className={cn(
              'flex-1 text-left px-3 py-3 rounded-xl border transition-all duration-300 relative overflow-hidden',
              selected === i
                ? 'border-cyan-500/15 bg-slate-900/40'
                : 'border-slate-800/20 bg-transparent hover:border-slate-700/40 hover:bg-slate-900/15'
            )}
          >
            {/* Mini Tesla line on active */}
            {selected === i && (
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />
            )}
            {/* Dot indicator */}
            {selected === i && (
              <span className="absolute top-2 right-2 w-[3px] h-[3px] rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
            )}
            <span className={cn(
              'text-2xl font-extralight block leading-none transition-colors',
              selected === i ? 'text-white' : 'text-slate-800'
            )}>
              {counts[i]}
            </span>
            <span className={cn(
              'text-[11px] block mt-1 font-light transition-colors',
              selected === i ? 'text-slate-500' : 'text-slate-700'
            )}>
              {c.label}
            </span>
          </button>
        ))}
      </div>

      {/* Split: Narrative + Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Narrative */}
        <div className="rounded-2xl border border-slate-800/30 bg-slate-900/30 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent" />

          {/* La observación */}
          <div className="mb-4">
            <p className="text-[11px] text-slate-500 font-normal mb-1.5">— La observación</p>
            <p className="text-[13px] text-slate-400 font-light leading-[1.7] [&>b]:text-slate-200 [&>b]:font-normal"
              dangerouslySetInnerHTML={{ __html:
                narrative?.observacion ??
                signalNarr?.observation ?? ''
              }}
            />
          </div>

          {/* La decisión de valor */}
          <div className="mb-4">
            <p className="text-[11px] text-slate-500 font-normal mb-1.5">— La decisión de valor</p>
            <div
              className="text-xs text-slate-500 font-light leading-relaxed pl-3 [&>b]:text-slate-400 [&>b]:font-normal"
              style={{ borderLeft: '1.5px solid', borderImage: 'linear-gradient(180deg, #22D3EE30, #A78BFA20) 1' }}
              dangerouslySetInnerHTML={{ __html:
                narrative?.decisionValor ??
                signalNarr?.decisionOfValue ?? ''
              }}
            />
          </div>

          {/* Segunda variable (conditional) */}
          {secondVarSummary && (
            <div className="mb-4">
              <p className="text-[11px] text-slate-500 font-normal mb-1.5">— Segunda variable</p>
              <div className="text-xs text-slate-500 font-light leading-relaxed p-3 rounded-xl bg-[#0B1120]/80 border border-slate-800/40 [&>b]:text-cyan-400 [&>b]:font-normal"
                dangerouslySetInnerHTML={{ __html: secondVarSummary }}
              />
            </div>
          )}

          {/* Implicit message for signals */}
          {signalNarr?.implicitMessage && (
            <p className="text-xs italic text-slate-600 font-light mb-4">
              &ldquo;{signalNarr.implicitMessage}&rdquo;
            </p>
          )}

          {/* Coaching tip */}
          {cat.coachingTip && (
            <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-[#0B1120]/50">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500/30 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 font-light leading-snug">{cat.coachingTip}</p>
            </div>
          )}
        </div>

        {/* Right: Evidence (people) */}
        <div className="rounded-2xl border border-slate-800/30 bg-slate-900/30 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/15 to-transparent" />

          <p className="text-[9px] uppercase tracking-[1.5px] text-slate-700 font-medium mb-3">
            {people.length} persona{people.length !== 1 ? 's' : ''}
          </p>

          <div className="space-y-0.5">
            {people.map((p, idx) => {
              const tag = getSecondVarTag(p, path)
              const isRisk = cat.key === 'DR' || cat.key === 'BL' || cat.key === 'PB'
              return (
                <motion.div
                  key={p.employeeId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    'flex items-center gap-2 py-2 px-1.5 rounded-lg',
                    isRisk && 'border-l-2 border-amber-500/15 pl-1 rounded-l-none bg-amber-500/[0.02]'
                  )}
                >
                  <span className="text-[10px] font-mono text-slate-700 w-4 text-right flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[13px] text-slate-300 font-light truncate block">
                      {p.employeeName}
                    </span>
                    <span className="text-[10px] text-slate-700 font-light block">
                      {p.departmentName}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 flex-shrink-0">
                    {path === 'senales'
                      ? `${p.score360.toFixed(1)}/${Math.round(p.goalsPercent ?? 0)}%`
                      : path === 'merito'
                        ? p.score360.toFixed(1)
                        : `${Math.round(p.goalsPercent ?? 0)}%`
                    }
                  </span>
                  {tag && (
                    <span className={cn(
                      'text-[9px] px-2 py-0.5 rounded-full border flex-shrink-0 font-light',
                      tag.colorClass === 'tg-warning' && 'text-amber-500/60 border-amber-500/10',
                      tag.colorClass === 'tg-purple' && 'text-purple-400/60 border-purple-500/10',
                      tag.colorClass === 'tg-amber' && 'text-amber-400/60 border-amber-400/10',
                    )}>
                      {tag.label}
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Action button */}
          <button className="mt-3 w-full py-2.5 rounded-lg border border-cyan-500/10 bg-transparent text-slate-500 text-xs font-light text-center transition-all hover:border-cyan-500/20 hover:text-cyan-400 hover:bg-cyan-500/[0.03]">
            {cat.actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
})
