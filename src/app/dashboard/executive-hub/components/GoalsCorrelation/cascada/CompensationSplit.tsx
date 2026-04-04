'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION SPLIT — Capa 3: Categorías + Narrativa + Evidencia
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationSplit.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón G: Split 50/50 — narrativa izquierda, personas derecha
// Auto-selección categoría más crítica. Labels 11px visibles.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Home, Lightbulb, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TalentNarrativeService } from '@/lib/services/TalentNarrativeService'
import { formatDisplayName } from '@/lib/utils/formatName'

import type { CompensationPath } from './CompensationHub'
import type { CorrelationPoint, ManagerGoalsStats } from '../GoalsCorrelation.types'
import { getCompensacionNarrative } from '@/config/narratives/CompensacionNarrativeDictionary'
import { getSignalNarrative, classifySignal } from '@/config/narratives/CompensationSignalsDictionary'
import type { SignalType } from '@/config/narratives/CompensationSignalsDictionary'
import { getMeritoNarratives, getBonosNarratives } from '@/config/narratives/CompensationActsDictionary'

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

function getSecondVarTag(point: CorrelationPoint, path: CompensationPath): { label: string } | null {
  if (path === 'merito' && point.evaluatorStatus) {
    if (point.evaluatorStatus === 'INDULGENTE') return { label: 'Jefe indulgente' }
    if (point.evaluatorStatus === 'SEVERA') return { label: 'Jefe severo' }
  }
  if (path === 'bonos' || path === 'senales') {
    if (point.riskQuadrant === 'FUGA_CEREBROS') return { label: 'Riesgo de fuga' }
    if (point.riskQuadrant === 'BURNOUT_RISK') return { label: 'Riesgo burnout' }
    if (point.riskQuadrant === 'BAJO_RENDIMIENTO') return { label: 'Bajo rendimiento' }
    if (point.mobilityQuadrant === 'SUCESOR_NATURAL') return { label: 'Sucesor natural' }
    if (point.mobilityQuadrant === 'MOTOR_EQUIPO') return { label: 'Motor equipo' }
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

  // FIX 9: Second variable desglosado por tipo concreto
  const secondVarSummary = useMemo(() => {
    if (path === 'merito') {
      const indulgent = people.filter(p => p.evaluatorStatus === 'INDULGENTE')
      const { secondVar } = getMeritoNarratives(0, 0, indulgent.length, indulgent.length > 0)
      return secondVar
    }
    if (path === 'bonos') {
      const fuga = people.filter(p => p.riskQuadrant === 'FUGA_CEREBROS').length
      const burnout = people.filter(p => p.riskQuadrant === 'BURNOUT_RISK').length
      const motor = people.filter(p => p.mobilityQuadrant === 'MOTOR_EQUIPO').length
      const sucesor = people.filter(p => p.mobilityQuadrant === 'SUCESOR_NATURAL').length
      const parts: string[] = []
      if (fuga > 0) parts.push(`<b>${fuga}</b> con riesgo de fuga`)
      if (burnout > 0) parts.push(`<b>${burnout}</b> en riesgo de burnout`)
      if (motor > 0) parts.push(`<b>${motor}</b> motor del equipo`)
      if (sucesor > 0) parts.push(`<b>${sucesor}</b> sucesor natural`)
      if (parts.length === 0) return null
      return parts.join(', ') + ' — invisibles para quien los evalúa.'
    }
    return null
  }, [path, people])

  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="p-7">
      {/* Top bar — FIX 20: breadcrumb persistente */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-[11px] font-light">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a narrativa
          </button>
          <span className="text-slate-700">·</span>
          <span className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-wider">
            {path === 'merito' ? 'Mérito' : path === 'bonos' ? 'Bonos' : 'Señales'}
          </span>
        </div>
        <button onClick={onHome} className="flex items-center gap-1.5 border border-slate-800/50 text-slate-600 hover:border-cyan-500/20 hover:text-slate-400 text-[10px] px-3 py-1.5 rounded-md transition-all">
          <Home className="w-3 h-3" /> Inicio
        </button>
      </div>

      {/* FIX 17: Título patrón FocalizaHR */}
      <h3 className="text-xl font-extralight text-white tracking-tight mb-4">
        Clasificación del{' '}
        <span className="fhr-title-gradient">hallazgo</span>
      </h3>
      <div className="flex gap-2 mb-4">
        {categories.map((c, i) => (
          <button
            key={c.key}
            onClick={() => setSelected(i)}
            className={cn(
              'flex-1 text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden cursor-pointer',
              selected === i
                ? 'border-cyan-500/20 bg-slate-900/80'
                : 'border-slate-800/50 hover:border-slate-700 hover:bg-slate-800/20'
            )}
          >
            {/* Tesla line solo en activa */}
            {selected === i && (
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
            )}
            {/* Dot indicator */}
            {selected === i && (
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 6px #22D3EE40' }} />
            )}
            <span className={cn(
              'text-2xl font-extralight block leading-none transition-colors',
              selected === i ? 'text-white' : 'text-slate-600'
            )}>
              {counts[i]}
            </span>
            <span className={cn(
              'text-xs block mt-1 transition-colors',
              selected === i ? 'text-slate-400' : 'text-slate-600'
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
            <p className="text-xs text-slate-300 font-medium tracking-wide mb-1.5">La observación</p>
            <p className="text-[13px] text-slate-400 font-light leading-[1.7] [&>b]:text-slate-200 [&>b]:font-normal"
              dangerouslySetInnerHTML={{ __html:
                narrative?.observacion ??
                signalNarr?.observation ?? ''
              }}
            />
          </div>

          {/* La decisión de valor */}
          <div className="mb-4">
            <p className="text-xs text-slate-300 font-medium tracking-wide mb-1.5">La decisión de valor</p>
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
              <p className="text-xs text-slate-300 font-medium tracking-wide mb-1.5">Segunda variable</p>
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
            {people.map((p, idx) => (
              <PersonRow
                key={p.employeeId}
                point={p}
                index={idx}
                path={path}
              />
            ))}
          </div>

          {/* Action button */}
          <button className="mt-3 w-full py-2.5 rounded-lg border border-cyan-500/10 bg-transparent text-slate-500 text-xs font-light text-center transition-all hover:border-cyan-500/20 hover:text-cyan-400 hover:bg-cyan-500/[0.03]">
            {cat.actionLabel}
          </button>
        </div>
      </div>
      </div>{/* close p-7 */}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PERSON ROW — FIX 8: expandible con narrativa individual
// ════════════════════════════════════════════════════════════════════════════

const PersonRow = memo(function PersonRow({
  point: p,
  index: idx,
  path,
}: {
  point: CorrelationPoint
  index: number
  path: CompensationPath
}) {
  const [expanded, setExpanded] = useState(false)
  const tag = getSecondVarTag(p, path)
  const hasSignal = p.riskQuadrant !== null || p.evaluatorStatus !== null || p.quadrant === 'DOUBLE_RISK'

  // FIX 8: narrativa individual on expand
  const narrative = useMemo(() => {
    if (!expanded) return null
    return TalentNarrativeService.getIndividualNarrative(
      p.riskQuadrant ?? null,
      p.mobilityQuadrant ?? null,
      p.roleFitScore ?? null,
      formatDisplayName(p.employeeName)
    )
  }, [expanded, p])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="relative"
    >
      {/* Tesla line purple si tiene señal — "merece atención" */}
      {hasSignal && (
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #A78BFA, transparent)',
            boxShadow: '0 0 8px #A78BFA30',
          }}
        />
      )}

      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full text-left py-2.5 px-1.5 rounded-lg transition-colors',
          'hover:bg-slate-800/20',
          expanded && 'bg-slate-800/20'
        )}
      >
        {/* Línea 1: rank + nombre completo */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-600 w-4 text-right flex-shrink-0">
            {idx + 1}
          </span>
          <span className="text-sm font-light text-slate-200 truncate flex-1">
            {formatDisplayName(p.employeeName, 'full')}
          </span>
          <ChevronDown className={cn(
            'w-3 h-3 text-slate-700 transition-transform flex-shrink-0',
            expanded && 'rotate-180'
          )} />
        </div>
        {/* Línea 2: depto · métrica · tag */}
        <div className="flex items-center gap-2 mt-1 pl-6">
          <span className="text-[10px] text-slate-600 truncate">{p.departmentName}</span>
          <span className="text-slate-800">·</span>
          <span className="text-[11px] font-mono text-slate-400">
            {path === 'senales'
              ? `${p.score360.toFixed(1)}/${Math.round(p.goalsPercent ?? 0)}%`
              : path === 'merito'
                ? p.score360.toFixed(1)
                : `${Math.round(p.goalsPercent ?? 0)}%`
            }
          </span>
          {tag && (
            <span className="text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 border border-slate-700/30 font-light">
              {tag.label}
            </span>
          )}
        </div>
      </button>

      {/* FIX 8: Expanded narrative */}
      <AnimatePresence>
        {expanded && narrative && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-7 pr-2 pb-3 pt-1 space-y-2.5">
              {/* Métricas clave con tooltips */}
              <div className="flex items-center gap-4">
                {p.goalsPercent !== null && (
                  <div className="group/tip relative">
                    <span className="text-xs text-slate-500">Metas</span>
                    <span className="text-sm font-mono text-cyan-400/70 ml-1">{Math.round(p.goalsPercent)}%</span>
                    <div className="absolute bottom-full left-0 mb-1.5 w-44 px-2.5 py-1.5 rounded-lg bg-slate-950/95 border border-slate-700/30 opacity-0 group-hover/tip:opacity-100 transition-all pointer-events-none z-50">
                      <p className="text-[10px] text-slate-300">Porcentaje de cumplimiento de metas del negocio asignadas</p>
                    </div>
                  </div>
                )}
                {p.goalsPercent !== null && p.roleFitScore !== null && (
                  <span className="text-slate-800">·</span>
                )}
                {p.roleFitScore !== null && (
                  <div className="group/tip relative">
                    <span className="text-xs text-slate-500">RoleFit</span>
                    <span className="text-sm font-mono text-purple-400/70 ml-1">{Math.round(p.roleFitScore)}%</span>
                    <div className="absolute bottom-full left-0 mb-1.5 w-44 px-2.5 py-1.5 rounded-lg bg-slate-950/95 border border-slate-700/30 opacity-0 group-hover/tip:opacity-100 transition-all pointer-events-none z-50">
                      <p className="text-[10px] text-slate-300">Nivel de dominio del cargo según evaluación 360° de competencias</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Narrativa individual */}
              <p className="text-xs font-normal text-slate-300">
                {narrative.headline}
              </p>
              <p className="text-[11px] font-light text-slate-500 leading-relaxed">
                {narrative.context}
              </p>
              {narrative.urgencySignal && (
                <p className="text-[10px] font-light text-amber-400/60 italic">
                  {narrative.urgencySignal}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})
