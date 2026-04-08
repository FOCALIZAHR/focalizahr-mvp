'use client'

// ════════════════════════════════════════════════════════════════════════════
// OCCUPATION MAPPING — Pre-Mapeo de Cargos
// CLONADO de CompensationHub (3 path cards) + CompensationSplit (PersonRow)
// Zero semáforo, tags ghost, acciones protagonistas
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, Search, Loader2, Zap, Check, RefreshCw,
  ChevronDown, Home, Target, AlertTriangle, FileText,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'
import { formatDisplayName } from '@/lib/utils/formatName'

// ── Types ──

interface PositionMapping {
  positionText: string
  employeeCount: number
  socCode: string | null
  occupationTitle: string | null
  confidence: string
  source: string | null
}

interface MappingData {
  total: number
  mapped: number
  high: PositionMapping[]
  medium: PositionMapping[]
  unmapped: PositionMapping[]
  summary: { highCount: number; mediumCount: number; unmappedCount: number; mappingRate: number }
}

type MappingPath = 'confirmar' | 'revisar' | 'buscar'

// ════════════════════════════════════════════════════════════════════════════
// PATH CONFIG — Clonado de CompensationHub PATHS
// ════════════════════════════════════════════════════════════════════════════

interface PathConfig {
  key: MappingPath
  label: string
  description: string
  icon: LucideIcon
  accent: 'cyan' | 'purple'
}

const PATHS: PathConfig[] = [
  { key: 'confirmar', label: 'Confirmar', description: 'Cargos mapeados con alta confianza', icon: CheckCircle2, accent: 'cyan' },
  { key: 'revisar', label: 'Revisar', description: 'Mapeo sugerido que necesita tu validación', icon: AlertTriangle, accent: 'cyan' },
  { key: 'buscar', label: 'Buscar', description: 'Cargos sin match, elige de sugeridos', icon: Search, accent: 'purple' },
]

const ACCENT_STYLES = {
  cyan: {
    hoverBorder: 'group-hover:border-cyan-500/40',
    hoverGlow: 'group-hover:shadow-[0_0_15px_rgba(34,211,238,0.08)]',
    hoverCount: 'group-hover:text-cyan-400',
    watermark: 'text-cyan-400',
  },
  purple: {
    hoverBorder: 'group-hover:border-purple-500/40',
    hoverGlow: 'group-hover:shadow-[0_0_15px_rgba(168,85,247,0.08)]',
    hoverCount: 'group-hover:text-purple-400',
    watermark: 'text-purple-400',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// PATH CARD — Clonado línea por línea de CompensationHub PathCard
// ════════════════════════════════════════════════════════════════════════════

function PathCard({ path, count, delay, onClick }: {
  path: PathConfig; count: number; delay: number; onClick: () => void
}) {
  const Icon = path.icon
  const accent = ACCENT_STYLES[path.accent]

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      className={cn(
        'group relative text-left rounded-2xl border overflow-hidden transition-all duration-300',
        'px-6 py-7 md:px-7 md:py-8',
        'hover:-translate-y-1',
        'bg-slate-900/60 border-slate-800/50',
        accent.hoverBorder, accent.hoverGlow,
      )}
    >
      <Icon className={cn('absolute -bottom-6 -right-6 w-40 h-40 pointer-events-none transition-opacity duration-300', accent.watermark, 'opacity-[0.04] group-hover:opacity-[0.15]')} strokeWidth={1} />

      <div className="relative">
        <span className={cn('text-5xl md:text-6xl font-extralight font-mono tabular-nums text-white transition-colors duration-300 block leading-none', accent.hoverCount)}>
          {count}
        </span>
        <div className="h-px bg-slate-800/60 my-5" />
        <h3 className="text-base font-light text-slate-200 tracking-tight">{path.label}</h3>
        <p className="text-xs font-light text-slate-500 leading-relaxed mt-1 max-w-[220px]">{path.description}</p>
      </div>
    </motion.button>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CARGO ROW — Clonado de CompensationSplit PersonRow (tags ghost, expandible)
// ════════════════════════════════════════════════════════════════════════════

const CargoRow = memo(function CargoRow({ pos, index, onConfirm, onSelectSuggestion }: {
  pos: PositionMapping; index: number
  onConfirm: (positionText: string, socCode: string) => void
  onSelectSuggestion: (positionText: string, socCode: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [candidates, setCandidates] = useState<Array<{ socCode: string; score: number; occupationTitle: string | null; taskCount: number }>>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)

  const handleExpand = useCallback(async () => {
    if (pos.confidence === 'MEDIUM' && pos.socCode) {
      onConfirm(pos.positionText, pos.socCode)
      return
    }
    setExpanded(prev => !prev)
    if (candidates.length === 0 && !expanded) {
      setLoadingCandidates(true)
      try {
        const res = await fetch('/api/descriptors/proposal', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobTitle: pos.positionText }),
        })
        const json = await res.json()
        if (json.success && json.data?.topCandidates) setCandidates(json.data.topCandidates)
      } catch {} finally { setLoadingCandidates(false) }
    }
  }, [pos, candidates.length, expanded, onConfirm])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="relative"
    >
      <button
        onClick={handleExpand}
        className={cn(
          'w-full text-left py-2.5 px-1.5 rounded-lg transition-colors',
          'hover:bg-slate-800/20',
          expanded && 'bg-slate-800/20'
        )}
      >
        {/* Línea 1: rank + nombre */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-600 w-4 text-right flex-shrink-0">{index + 1}</span>
          <span className="text-sm font-light text-slate-200 truncate flex-1">
            {formatDisplayName(pos.positionText, 'full')}
          </span>
          {pos.confidence === 'MEDIUM' && pos.socCode ? (
            <span className="text-[10px] text-cyan-400/60 font-light flex-shrink-0">Confirmar →</span>
          ) : (
            <ChevronDown className={cn('w-3 h-3 text-slate-700 transition-transform flex-shrink-0', expanded && 'rotate-180')} />
          )}
        </div>
        {/* Línea 2: personas · tag ghost */}
        <div className="flex items-center gap-2 mt-1 pl-6">
          <span className="text-[10px] text-slate-600">
            {pos.employeeCount} persona{pos.employeeCount !== 1 ? 's' : ''}
          </span>
          {pos.occupationTitle && (
            <>
              <span className="text-slate-800">·</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 border border-slate-700/30 font-light">
                {pos.occupationTitle}
              </span>
            </>
          )}
        </div>
      </button>

      {/* Expanded: candidates */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="pl-7 pr-2 pb-3 pt-1 space-y-1.5">
              {loadingCandidates ? (
                <Loader2 className="w-4 h-4 text-cyan-400/40 animate-spin mx-auto my-3" />
              ) : candidates.length > 0 ? (
                candidates.map(c => (
                  <button key={c.socCode}
                    onClick={() => onSelectSuggestion(pos.positionText, c.socCode)}
                    className="w-full text-left py-2 px-3 rounded-lg border border-slate-800/30 hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] transition-all flex items-center justify-between">
                    <div>
                      <p className="text-xs font-light text-slate-300">{c.occupationTitle ?? c.socCode}</p>
                      <p className="text-[9px] text-slate-600">{c.taskCount} tareas</p>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 border border-slate-700/30 font-light tabular-nums">
                      {c.score}%
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-[10px] text-slate-600 text-center py-2">Sin sugerencias disponibles</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// MAIN — Orchestrador Hub → Lista (como CompensationBoard)
// ════════════════════════════════════════════════════════════════════════════

export default function OccupationMappingCinema() {
  const [data, setData] = useState<MappingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePath, setActivePath] = useState<MappingPath | null>(null)
  const [classifying, setClassifying] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const fetchData = useCallback(async () => {
    try { setLoading(true); const res = await fetch('/api/descriptors/mapping-status'); const json = await res.json(); if (json.success) setData(json.data) }
    catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleResetAndClassify = useCallback(async () => {
    setClassifying(true)
    try { await fetch('/api/descriptors/reset-mappings', { method: 'POST' }); await fetch('/api/descriptors/classify-all', { method: 'POST' }); await fetchData() }
    catch {} finally { setClassifying(false) }
  }, [fetchData])

  const handleConfirm = useCallback(async (positionText: string, socCode: string) => {
    try {
      await fetch('/api/workforce/occupation/correct', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ positionText, socCode }) })
      await fetchData()
    } catch {}
  }, [fetchData])

  const handleConfirmAllHigh = useCallback(async () => {
    if (!data?.high.length) return
    setConfirming(true)
    try {
      await Promise.all(data.high.filter(p => p.socCode).map(p =>
        fetch('/api/workforce/occupation/correct', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ positionText: p.positionText, socCode: p.socCode }) })
      ))
      await fetchData()
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, colors: ['#22D3EE', '#A78BFA', '#10B981'] })
    } catch {} finally { setConfirming(false) }
  }, [data, fetchData])

  const activePositions = useMemo(() => {
    if (!data || !activePath) return []
    switch (activePath) {
      case 'confirmar': return data.high
      case 'revisar': return data.medium
      case 'buscar': return data.unmapped
    }
  }, [data, activePath])

  if (loading || !data) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>
  }

  // ═══ DETAIL VIEW — Lista dentro del contenedor app ═══
  if (activePath) {
    const pathConfig = PATHS.find(p => p.key === activePath)!
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">
        <AnimatePresence mode="wait">
          <motion.div key={activePath} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

            {/* Contenedor app — mismo que Hub */}
            <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
              {/* Tesla line */}
              <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: 'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)', opacity: 0.7 }} />

              <div className="px-6 py-8 md:px-10 md:py-10">
                {/* Header con back */}
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-extralight text-white tracking-tight">{pathConfig.label}</h2>
                    <p className="text-sm font-light text-slate-400 mt-1">
                      {activePositions.length} cargo{activePositions.length !== 1 ? 's' : ''}
                      {activePath === 'confirmar' && ' · Clic en cada cargo para confirmar'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {activePath === 'confirmar' && data.summary.highCount > 0 && (
                      <button onClick={handleConfirmAllHigh} disabled={confirming}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cyan-500/20 text-cyan-400 text-xs font-light hover:border-cyan-500/40 hover:bg-cyan-500/[0.03] transition-all disabled:opacity-50">
                        <Check className="w-3.5 h-3.5" />
                        {confirming ? 'Confirmando...' : 'Confirmar todos'}
                      </button>
                    )}
                    <button onClick={() => setActivePath(null)}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs">
                      <Home className="w-3.5 h-3.5" /><span className="hidden sm:inline">Hub</span>
                    </button>
                  </div>
                </div>

                {/* Lista */}
                <div className="rounded-xl border border-slate-800/30 bg-slate-900/30 p-4 md:p-5">
                  {activePositions.length > 0 ? (
                    <div className="space-y-0.5">
                      {activePositions.map((pos, idx) => (
                        <CargoRow key={pos.positionText} pos={pos} index={idx}
                          onConfirm={handleConfirm} onSelectSuggestion={handleConfirm} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400/30 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 font-light">No hay cargos en esta categoría.</p>
                    </div>
                  )}

                  {activePath === 'buscar' && activePositions.length > 0 && (
                    <button onClick={handleResetAndClassify} disabled={classifying}
                      className="mt-4 w-full py-2.5 rounded-lg border border-cyan-500/10 bg-transparent text-slate-500 text-xs font-light text-center transition-all hover:border-cyan-500/20 hover:text-cyan-400 hover:bg-cyan-500/[0.03] disabled:opacity-50">
                      {classifying ? 'Re-clasificando...' : 'Re-clasificar automáticamente'}
                    </button>
                  )}
                </div>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ═══ HUB VIEW — 3 path cards (clonado de CompensationHub) ═══
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">
      <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        {/* Tesla line */}
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)', opacity: 0.7 }} />

        <div className="px-6 py-10 md:px-10 md:py-14">
          {/* Header — word split */}
          <div className="flex items-start justify-between gap-4 mb-10 md:mb-14">
            <div>
              <h2 className="text-3xl font-extralight text-white tracking-tight leading-tight">Mapeo de</h2>
              <p className="text-2xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">Cargos</p>
              <p className="text-sm font-light text-slate-400 mt-4 max-w-md">
                {data.mapped} de {data.total} cargos mapeados. Tres caminos para completar.
              </p>
            </div>
            <button onClick={handleResetAndClassify} disabled={classifying}
              className="flex-shrink-0 flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs disabled:opacity-50">
              <RefreshCw className={cn('w-3.5 h-3.5', classifying && 'animate-spin')} />
              <span className="hidden sm:inline">{classifying ? 'Clasificando...' : 'Re-clasificar'}</span>
            </button>
          </div>

          {/* 3 Path cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PATHS.map((path, idx) => (
              <PathCard key={path.key} path={path} delay={0.1 + idx * 0.06}
                count={path.key === 'confirmar' ? data.summary.highCount : path.key === 'revisar' ? data.summary.mediumCount : data.summary.unmappedCount}
                onClick={() => setActivePath(path.key)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
