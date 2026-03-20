'use client'

// ════════════════════════════════════════════════════════════════════════════
// SUCCESSION PANEL - Executive Hub Card
// src/app/dashboard/executive-hub/components/SuccessionPanel.tsx
// ════════════════════════════════════════════════════════════════════════════
// Matriz Predictiva de Continuidad + Efecto Dominó de Sucesión
// Recibe data de /api/executive-hub/succession via orchestrator
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Shield, ChevronRight, AlertTriangle, Crown,
  Link2, UserX, Target, ArrowLeft, X,
} from 'lucide-react'
import FocalizaIntelligenceModal from '@/components/ui/FocalizaIntelligenceModal'
import type { VulnerabilityRow } from '@/config/successionNarratives'
import { formatDisplayName, toTitleCase } from '@/lib/utils/formatName'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface Pos {
  id: string; title: string; short: string; incumbent: string
  flight: 'HIGH' | 'MEDIUM' | 'LOW' | null
  bench: 'STRONG' | 'MODERATE' | 'WEAK' | 'NONE'
  candidate: string | null
  readiness: string | null; readinessLabel: string | null
  chain: 'covered' | 'domino_open' | 'no_candidate'
  chainTarget: string | null
  urgency: 'CRITICAL' | 'URGENT' | 'NEEDS_ATTENTION' | 'NORMAL' | 'NO_DATA'
}

// ════════════════════════════════════════════════════════════════════════════
// API → Pos MAPPER
// ════════════════════════════════════════════════════════════════════════════

function makeShortTitle(title: string): string {
  // Abbreviate long titles for matrix labels
  const map: Record<string, string> = {
    'gerente': 'Ger.', 'gerencia': 'Ger.', 'director': 'Dir.', 'directora': 'Dir.',
    'vicepresidente': 'VP', 'jefe': 'Jefe', 'jefa': 'Jefa',
    'coordinador': 'Coord.', 'coordinadora': 'Coord.',
    'superintendente': 'Sup.', 'subgerente': 'Subger.',
  }
  const words = title.split(' ')
  if (words.length <= 2) return title
  const first = words[0].toLowerCase()
  const prefix = map[first] || words[0]
  const rest = words.slice(1).filter(w => !['de', 'del', 'la', 'el', 'y', 'e'].includes(w.toLowerCase()))
  const abbr = rest.map(w => w.length > 6 ? w.slice(0, 4) + '.' : w).join(' ')
  return `${prefix} ${abbr}`
}

function vulnRowToPos(row: VulnerabilityRow): Pos {
  const flight = ['HIGH', 'MEDIUM', 'LOW'].includes(row.flightRisk || '')
    ? row.flightRisk as 'HIGH' | 'MEDIUM' | 'LOW'
    : null
  const bench = ['STRONG', 'MODERATE', 'WEAK', 'NONE'].includes(row.benchStrength)
    ? row.benchStrength as 'STRONG' | 'MODERATE' | 'WEAK' | 'NONE'
    : 'NONE'

  // Extract chainTarget from chainDetail narrative
  let chainTarget: string | null = null
  if (row.chainStatus === 'domino_open' && row.chainDetail) {
    const match = row.chainDetail.match(/deja (.+?) sin cobertura/)
    chainTarget = match ? toTitleCase(match[1]) : null
  }

  // Normalize: titles and names may come in ALL CAPS from DB
  const title = toTitleCase(row.positionTitle)
  const incumbent = row.incumbentName ? formatDisplayName(row.incumbentName) : 'Sin titular'
  const candidate = row.bestCandidateName ? formatDisplayName(row.bestCandidateName) : null

  return {
    id: row.positionId,
    title,
    short: makeShortTitle(title),
    incumbent,
    flight,
    bench,
    candidate,
    readiness: row.bestCandidateReadiness,
    readinessLabel: row.bestCandidateReadinessLabel,
    chain: row.chainStatus,
    chainTarget,
    urgency: row.urgency,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ZONES
// ════════════════════════════════════════════════════════════════════════════

type ZoneKey = 'emergency' | 'urgent' | 'accelerate' | 'search' | 'develop' | 'safe'

const ZONE_MAP: Record<string, ZoneKey> = {
  'HIGH-NONE': 'emergency', 'HIGH-WEAK': 'emergency',
  'HIGH-MODERATE': 'urgent', 'HIGH-STRONG': 'accelerate',
  'MEDIUM-NONE': 'urgent', 'MEDIUM-WEAK': 'urgent',
  'MEDIUM-MODERATE': 'develop', 'MEDIUM-STRONG': 'safe',
  'LOW-NONE': 'search', 'LOW-WEAK': 'search',
  'LOW-MODERATE': 'develop', 'LOW-STRONG': 'safe',
  'null-NONE': 'search', 'null-WEAK': 'search',
  'null-MODERATE': 'develop', 'null-STRONG': 'safe',
}

const Z: Record<ZoneKey, { label: string; action: string; color: string; glow: string; narrative: string }> = {
  emergency:  { label: 'Emergencia', action: 'Actuar hoy', color: '#EF4444', glow: 'rgba(239,68,68,0.5)', narrative: 'Titular con señales de fuga y sin sucesor viable. Si se va, no hay reemplazo.' },
  urgent:     { label: 'Urgente', action: 'Esta semana', color: '#F59E0B', glow: 'rgba(245,158,11,0.4)', narrative: 'Riesgo real de vacante con banco insuficiente. Acelerar desarrollo o buscar externamente.' },
  accelerate: { label: 'Acelerar', action: 'Activar sucesor', color: '#22D3EE', glow: 'rgba(34,211,238,0.4)', narrative: 'Titular en riesgo pero hay sucesor preparado. Considerar activación inmediata.' },
  search:     { label: 'Buscar', action: 'Identificar candidatos', color: '#3B82F6', glow: 'rgba(59,130,246,0.4)', narrative: 'Titular estable pero sin sucesores identificados. Ventana de oportunidad para planificar.' },
  develop:    { label: 'Desarrollar', action: 'Plan de desarrollo', color: '#A78BFA', glow: 'rgba(167,139,250,0.4)', narrative: 'Hay candidatos en desarrollo. Mantener el plan y monitorear progreso.' },
  safe:       { label: 'Protegido', action: 'Monitorear', color: '#10B981', glow: 'rgba(16,185,129,0.4)', narrative: 'Titular estable con sucesor listo. Posición protegida.' },
}

function getZone(p: Pos): ZoneKey {
  return ZONE_MAP[`${p.flight}-${p.bench}`] || 'develop'
}

// Zone labels positioned in the SVG grid
const ZONE_LABELS: { row: number; col: number; text: string; color: string }[] = [
  { row: 0, col: 0, text: 'EMERGENCIA', color: 'rgba(239,68,68,0.15)' },
  { row: 2, col: 3, text: 'PROTEGIDO', color: 'rgba(16,185,129,0.12)' },
  { row: 0, col: 2, text: 'URGENTE', color: 'rgba(245,158,11,0.10)' },
  { row: 1, col: 2, text: 'DESARROLLO', color: 'rgba(167,139,250,0.10)' },
  { row: 2, col: 0, text: 'BUSCAR', color: 'rgba(59,130,246,0.10)' },
  { row: 0, col: 3, text: 'ACELERAR', color: 'rgba(34,211,238,0.10)' },
]

type View = 'mapa-portada' | 'matrix' | 'domino-portada' | 'domino'

// ════════════════════════════════════════════════════════════════════════════
// PROPS — data comes from orchestrator via /api/executive-hub/succession
// ════════════════════════════════════════════════════════════════════════════

interface SuccessionPanelProps {
  data: {
    coverage: number
    coveredRoles: number
    totalRoles: number
    uncoveredRoles: any[]
    bench: { readyNow: number; ready1to2Years: number; notReady: number }
    hasData: boolean
    vulnerabilityMap?: VulnerabilityRow[]
    dominoOpenCount?: number
    chainCoverage?: number | null
    benchDistribution?: Record<string, number>
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TOOLTIP PORTAL
// ════════════════════════════════════════════════════════════════════════════

function Tooltip({ x, y, children, visible }: { x: number; y: number; children: React.ReactNode; visible: boolean }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted || !visible) return null

  return createPortal(
    <div
      className="fixed z-[100] pointer-events-none"
      style={{ left: x, top: y - 8, transform: 'translate(-50%, -100%)' }}
    >
      <div className="px-3 py-2.5 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/40 shadow-2xl max-w-[220px]">
        {children}
      </div>
    </div>,
    document.body
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const SuccessionPanel = memo(function SuccessionPanel({ data }: SuccessionPanelProps) {
  const router = useRouter()
  const [view, setView] = useState<View>('mapa-portada')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [clusterPositions, setClusterPositions] = useState<Pos[] | null>(null)

  // Map API data to Pos[]
  const DATA = useMemo(() => {
    if (!data.vulnerabilityMap?.length) return []
    return data.vulnerabilityMap.map(vulnRowToPos)
  }, [data.vulnerabilityMap])

  const dominoOpen = useMemo(() => DATA.filter(p => p.chain === 'domino_open'), [DATA])
  const sinCobertura = useMemo(() => DATA.filter(p => p.urgency === 'NEEDS_ATTENTION' || p.urgency === 'CRITICAL').length, [DATA])
  const selectedPos = DATA.find(p => p.id === selectedId) || null

  // ── Empty state ──
  if (DATA.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <Target className="w-8 h-8 text-slate-700 mb-4" />
        <p className="text-sm text-slate-400 font-light">Sin posiciones críticas configuradas.</p>
        <button
          onClick={() => router.push('/dashboard/succession')}
          className="text-cyan-400 hover:text-cyan-300 text-xs mt-4 transition-colors"
        >
          Configurar Sucesión →
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Tesla line */}
      <div className="fhr-top-line absolute inset-x-0 top-0 z-10" />

      <div className="p-5 sm:p-6">
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════ */}
          {/* TAB 1 PORTADA — MAPA                          */}
          {/* ══════════════════════════════════════════════ */}
          {view === 'mapa-portada' && (
            <motion.div
              key="mapa-portada"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center text-center px-6 min-h-[360px]"
            >
              <Crown className="w-5 h-5 text-slate-700 mb-6" />

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-2xl md:text-3xl font-light text-white leading-relaxed max-w-lg mb-4"
              >
                {sinCobertura > 0 ? (
                  <>
                    <span className="text-red-400 font-medium">{sinCobertura} cargo{sinCobertura > 1 ? 's' : ''} crítico{sinCobertura > 1 ? 's' : ''}</span>{' '}
                    sin cobertura.
                  </>
                ) : (
                  <>
                    Todos tus cargos críticos tienen{' '}
                    <span className="text-cyan-400 font-medium">sucesor identificado.</span>
                  </>
                )}
              </motion.p>

              {sinCobertura > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-base text-slate-400 font-light max-w-md mb-10"
                >
                  Si alguno queda vacante hoy, hay una parte de tu operación que nadie puede sostener.
                </motion.p>
              )}

              {sinCobertura === 0 && <div className="mb-10" />}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex flex-col items-center gap-4"
              >
                <motion.button
                  onClick={() => setView('matrix')}
                  className="flex items-center gap-3 px-8 py-3 rounded-xl font-medium text-base transition-all shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #22D3EE, #22D3EEDD)',
                    color: '#0F172A',
                    boxShadow: '0 8px 24px -6px rgba(34,211,238,0.4)',
                  }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Ver Mapa de Vulnerabilidad</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </motion.button>

                <button
                  onClick={() => setView('domino-portada')}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Ir a Efecto Dominó →
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* TAB 2 PORTADA — DOMINÓ                        */}
          {/* ══════════════════════════════════════════════ */}
          {view === 'domino-portada' && (
            <motion.div
              key="domino-portada"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center text-center px-6 min-h-[360px]"
            >
              <Link2 className="w-5 h-5 text-slate-700 mb-6" />

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-2xl md:text-3xl font-light text-white leading-relaxed max-w-lg mb-4"
              >
                <span className="text-cyan-400 font-medium">{data.coverage}%</span>{' '}
                de tus cargos críticos tienen sucesor identificado.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-base text-slate-400 font-light max-w-md mb-10"
              >
                {dominoOpen.length > 0 ? (
                  <>
                    Pero si asciendes a esos candidatos hoy,{' '}
                    <span className="text-amber-400 font-medium">{dominoOpen.length} posición{dominoOpen.length > 1 ? 'es' : ''}</span>{' '}
                    quedaría{dominoOpen.length > 1 ? 'n' : ''} sin cobertura.
                    La primera capa está resuelta. La segunda, no.
                  </>
                ) : (
                  <>
                    Si asciendes a cualquier candidato hoy, ninguna posición queda sin cobertura.
                    Ambas capas están resueltas.
                  </>
                )}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex flex-col items-center gap-4"
              >
                <motion.button
                  onClick={() => setView('domino')}
                  className="flex items-center gap-3 px-8 py-3 rounded-xl font-medium text-base transition-all shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #22D3EE, #22D3EEDD)',
                    color: '#0F172A',
                    boxShadow: '0 8px 24px -6px rgba(34,211,238,0.4)',
                  }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Ver Cadena</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </motion.button>

                <button
                  onClick={() => setView('mapa-portada')}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  ← Ir a Mapa de Vulnerabilidad
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* MATRIX + DETAIL                               */}
          {/* ══════════════════════════════════════════════ */}
          {view === 'matrix' && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setView('mapa-portada')}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Portada
                </button>
                <NavPill active="matrix" onChange={v => setView(v as View)} />
                <p className="text-[9px] text-slate-500 font-mono">{DATA.length} posiciones</p>
              </div>

              <div className="text-center space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-extralight tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                    Matriz Predictiva de Continuidad
                  </span>
                </h2>
                <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500">
                  Riesgo de Fuga × Cobertura · Cargos Críticos
                </p>
              </div>

              {/* Layout: matrix + detail */}
              <div className="flex flex-col md:flex-row gap-4">
                <motion.div layout className={cn('transition-all duration-300', selectedPos ? 'md:w-[55%]' : 'md:w-full')}>
                  <DefenseMatrix positions={DATA} selectedId={selectedId} onSelect={id => setSelectedId(id === selectedId ? null : id)} onClusterClick={setClusterPositions} />
                </motion.div>

                <AnimatePresence mode="wait">
                  {selectedPos && (
                    <motion.div
                      key={selectedPos.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="md:w-[45%] min-w-0"
                    >
                      <PositionDetail pos={selectedPos} onClose={() => setSelectedId(null)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 pt-2">
                {(Object.entries(Z) as [ZoneKey, typeof Z[ZoneKey]][]).map(([key, zone]) => {
                  const count = DATA.filter(p => getZone(p) === key).length
                  if (count === 0) return null
                  return (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: zone.color, boxShadow: `0 0 6px ${zone.glow}` }} />
                      <span className="text-[9px] text-slate-400">{zone.label} — {zone.action} ({count})</span>
                    </div>
                  )
                })}
              </div>

              {/* Domino link */}
              {dominoOpen.length > 0 && (
                <button
                  onClick={() => setView('domino')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-amber-500/30 hover:border-amber-500/50 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-[5px] h-[5px] rounded-full bg-amber-400" style={{ boxShadow: '0 0 8px rgba(245,158,11,0.5)' }} />
                    <span className="text-[11px] text-slate-400 group-hover:text-amber-400/80 transition-colors">
                      {dominoOpen.length} cadena{dominoOpen.length > 1 ? 's' : ''} de dominó — resolver antes de mover piezas
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
                </button>
              )}

            </motion.div>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* DOMINO CHAINS                                 */}
          {/* ══════════════════════════════════════════════ */}
          {view === 'domino' && (
            <motion.div
              key="domino"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button onClick={() => setView('domino-portada')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Portada
                </button>
                <NavPill active="domino" onChange={v => setView(v as View)} />
                <p className="text-[9px] text-slate-500 font-mono">{dominoOpen.length} cadenas</p>
              </div>

              <div className="text-center space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-extralight tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                    Efecto Dominó de Sucesión
                  </span>
                </h2>
                <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500">
                  Cadenas de Riesgo · Cada promoción genera una vacante
                </p>
                <p className="text-[11px] text-slate-400/70 font-light max-w-sm mx-auto pt-1">
                  Si esa vacante no tiene cobertura, el dominó sigue cayendo.
                </p>
              </div>

              <div className="space-y-5">
                {dominoOpen.map((pos, i) => (
                  <motion.div key={pos.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <DominoChain pos={pos} />
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center pt-4 pb-12">
                <button
                  onClick={() => router.push('/dashboard/succession')}
                  className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-cyan-400 text-slate-950 text-sm font-medium hover:bg-cyan-300 transition-all duration-300 shadow-[0_10px_30px_-8px_rgba(34,211,238,0.45)]"
                >
                  Gestionar Sucesión <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Cluster Modal — when 4+ positions in same cell */}
      <FocalizaIntelligenceModal
        isOpen={!!clusterPositions}
        onClose={() => setClusterPositions(null)}
        entityName={clusterPositions ? `${clusterPositions.length} cargos en la misma zona` : ''}
        entityType="área"
        customMessage={{
          before: 'detectó',
          after: 'selecciona uno para ver el detalle',
        }}
        cta={{
          label: 'Ver Sucesión Completa',
          icon: Crown,
          onClick: () => router.push('/dashboard/succession'),
        }}
        sections={
          clusterPositions?.map(p => {
            const zone = getZone(p)
            const z = Z[zone]
            return {
              id: p.id,
              title: `${p.title} — ${p.incumbent}`,
              content: (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: z.color }} />
                    <span className="text-xs font-medium" style={{ color: z.color }}>{z.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Riesgo: {p.flight || 'Sin datos'} · Banco: {({ STRONG: 'Fuerte', MODERATE: 'Moderado', WEAK: 'Débil', NONE: 'Vacío' } as Record<string, string>)[p.bench]}</p>
                  {p.candidate && <p className="text-[11px] text-slate-300">Sucesor: {p.candidate} · {p.readinessLabel}</p>}
                  {!p.candidate && <p className="text-[11px] text-red-400/70">Sin sucesor identificado</p>}
                  <button
                    onClick={() => { setSelectedId(p.id); setClusterPositions(null); setView('matrix') }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors mt-1"
                  >
                    Ver detalle en matriz →
                  </button>
                </div>
              ),
            }
          }) || []
        }
        source="Matriz Predictiva de Continuidad"
      />
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// DEFENSE MATRIX
// ════════════════════════════════════════════════════════════════════════════

const CLUSTER_THRESHOLD = 3

function DefenseMatrix({ positions, selectedId, onSelect, onClusterClick }: {
  positions: Pos[]; selectedId: string | null; onSelect: (id: string) => void; onClusterClick: (positions: Pos[]) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; pos: Pos } | null>(null)
  const [zoneTooltip, setZoneTooltip] = useState<{ x: number; y: number; zone: ZoneKey } | null>(null)

  const benchOrder = ['NONE', 'WEAK', 'MODERATE', 'STRONG']
  const flightOrder = ['HIGH', 'MEDIUM', 'LOW_NULL']

  function flightGroup(f: string | null): string {
    return f === 'HIGH' ? 'HIGH' : f === 'MEDIUM' ? 'MEDIUM' : 'LOW_NULL'
  }

  const placed = positions.map(p => ({
    pos: p,
    col: benchOrder.indexOf(p.bench),
    row: flightOrder.indexOf(flightGroup(p.flight)),
  }))

  const cellMap: Record<string, number[]> = {}
  placed.forEach((p, i) => {
    const k = `${p.row}-${p.col}`
    if (!cellMap[k]) cellMap[k] = []
    cellMap[k].push(i)
  })

  const VB_W = 400
  const VB_H = 200
  const colW = VB_W / 4
  const rowH = VB_H / 3

  const svgToScreen = useCallback((sx: number, sy: number) => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    return {
      x: rect.left + (sx / VB_W) * rect.width,
      y: rect.top + (sy / VB_H) * rect.height,
    }
  }, [])

  // Zone for each cell (row, col)
  const cellZone = (row: number, col: number): ZoneKey => {
    const flight = row === 0 ? 'HIGH' : row === 1 ? 'MEDIUM' : 'null'
    const bench = benchOrder[col]
    return ZONE_MAP[`${flight}-${bench}`] || 'develop'
  }

  return (
    <div className="relative">
      <div className="flex">
        {/* Y axis */}
        <div className="w-10 sm:w-14 flex flex-col pt-6 pb-1 pr-1">
          {['Alto', 'Medio', 'Bajo'].map(l => (
            <div key={l} className="flex-1 flex items-center justify-end">
              <p className="text-[7px] sm:text-[8px] uppercase tracking-widest text-slate-500 text-right">{l}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col">
          {/* X axis */}
          <div className="flex mb-1.5">
            {['Vacío', 'Débil', 'Moderado', 'Fuerte'].map(l => (
              <p key={l} className="flex-1 text-center text-[7px] sm:text-[8px] uppercase tracking-widest text-slate-500">{l}</p>
            ))}
          </div>

          {/* SVG */}
          <div className="relative rounded-xl overflow-hidden border border-slate-700/30 bg-slate-900/50 backdrop-blur-sm" style={{ aspectRatio: '2/1' }}>
            <svg ref={svgRef} viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 w-full h-full"
              onMouseLeave={() => { setTooltip(null); setZoneTooltip(null) }}>
              <defs>
                <linearGradient id="tl-red" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="transparent" /><stop offset="50%" stopColor="rgba(239,68,68,0.4)" /><stop offset="100%" stopColor="transparent" />
                </linearGradient>
                <linearGradient id="tl-green" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="transparent" /><stop offset="50%" stopColor="rgba(16,185,129,0.3)" /><stop offset="100%" stopColor="transparent" />
                </linearGradient>
                <linearGradient id="tl-amber-v" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="transparent" /><stop offset="50%" stopColor="rgba(245,158,11,0.2)" /><stop offset="100%" stopColor="transparent" />
                </linearGradient>
                <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
              </defs>

              {/* Grid lines */}
              {[1, 2, 3].map(i => <line key={`v${i}`} x1={i * colW} y1={0} x2={i * colW} y2={VB_H} stroke="rgba(148,163,184,0.12)" strokeWidth="1" />)}
              {[1, 2].map(i => <line key={`h${i}`} x1={0} y1={i * rowH} x2={VB_W} y2={i * rowH} stroke="rgba(148,163,184,0.12)" strokeWidth="1" />)}

              {/* Tesla accent lines */}
              <line x1={0} y1={1} x2={VB_W / 2} y2={1} stroke="url(#tl-red)" strokeWidth="2" />
              <line x1={VB_W / 2} y1={VB_H - 1} x2={VB_W} y2={VB_H - 1} stroke="url(#tl-green)" strokeWidth="2" />
              <line x1={colW * 2} y1={0} x2={colW * 2} y2={VB_H} stroke="url(#tl-amber-v)" strokeWidth="1.5" />

              {/* Zone labels — ultra subtle watermarks */}
              {ZONE_LABELS.map((zl, i) => (
                <text key={i}
                  x={zl.col * colW + colW / 2}
                  y={zl.row * rowH + rowH / 2 + 2}
                  textAnchor="middle" fontSize="7" fontFamily="system-ui" fontWeight="600"
                  letterSpacing="0.15em" fill={zl.color}
                >{zl.text}</text>
              ))}

              {/* Clickable zone rects (invisible, for tooltip) */}
              {[0, 1, 2].map(row =>
                [0, 1, 2, 3].map(col => {
                  const zk = cellZone(row, col)
                  const hasPositions = placed.some(p => p.row === row && p.col === col)
                  if (hasPositions) return null // nodes handle their own tooltip
                  return (
                    <rect
                      key={`zone-${row}-${col}`}
                      x={col * colW} y={row * rowH} width={colW} height={rowH}
                      fill="transparent" className="cursor-help"
                      onMouseEnter={(e) => {
                        const screen = svgToScreen(col * colW + colW / 2, row * rowH + 10)
                        setZoneTooltip({ x: screen.x, y: screen.y, zone: zk })
                      }}
                      onMouseLeave={() => setZoneTooltip(null)}
                    />
                  )
                })
              )}

              {/* Nodes — individual or cluster */}
              {(() => {
                const rendered = new Set<string>()
                return placed.map((p) => {
                  const k = `${p.row}-${p.col}`
                  if (rendered.has(k)) return null
                  const siblings = cellMap[k]
                  const total = siblings.length
                  const cx0 = p.col * colW + colW / 2
                  const cy0 = p.row * rowH + rowH / 2

                  // CLUSTER: 4+ nodes in same cell → show single cluster node
                  if (total >= CLUSTER_THRESHOLD) {
                    rendered.add(k)
                    const cellPositions = siblings.map(i => placed[i].pos)
                    const worstZone = cellPositions.reduce((worst, cp) => {
                      const uz = getZone(cp)
                      const order: Record<ZoneKey, number> = { emergency: 0, urgent: 1, accelerate: 2, search: 3, develop: 4, safe: 5 }
                      return order[uz] < order[worst] ? uz : worst
                    }, getZone(cellPositions[0]))
                    const z = Z[worstZone]
                    const hasCritical = cellPositions.some(cp => cp.urgency === 'CRITICAL')

                    return (
                      <g key={`cluster-${k}`} className="cursor-pointer"
                        onClick={() => onClusterClick(cellPositions)}
                        onMouseEnter={() => {
                          const screen = svgToScreen(cx0, cy0 - 16)
                          setTooltip({ x: screen.x, y: screen.y, pos: { ...cellPositions[0], short: `${total} cargos`, title: `${total} posiciones`, incumbent: `Zona ${z.label}` } as Pos })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <circle cx={cx0} cy={cy0} r={18} fill="none" stroke={z.color} strokeWidth="0.8" opacity={0.3} strokeDasharray="3,2" />
                        <circle cx={cx0} cy={cy0} r={8} fill={z.color} opacity={0.15} />
                        <circle cx={cx0} cy={cy0} r={5} fill={z.color}>
                          {hasCritical && <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />}
                        </circle>
                        <circle cx={cx0} cy={cy0} r={5} fill={z.color} opacity={0.3} filter="url(#nodeGlow)" />
                        <text x={cx0} y={cy0 + 22} textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize="7" fontFamily="system-ui" fontWeight="400">
                          {total} cargos
                        </text>
                        {/* Badge count */}
                        <circle cx={cx0 + 12} cy={cy0 - 12} r={6} fill={z.color} opacity={0.9} />
                        <text x={cx0 + 12} y={cy0 - 9} textAnchor="middle" fill="white" fontSize="7" fontFamily="system-ui" fontWeight="700">{total}</text>
                      </g>
                    )
                  }

                  // INDIVIDUAL nodes (1-3 per cell)
                  const myIdx = siblings.indexOf(placed.indexOf(p))
                  const cx = cx0 + (myIdx - (total - 1) / 2) * 28
                  const cy = cy0

                  const zone = getZone(p.pos)
                  const z = Z[zone]
                  const isSelected = selectedId === p.pos.id
                  const isPulsing = p.pos.urgency === 'CRITICAL'

                  return (
                    <g key={p.pos.id}
                      className="cursor-pointer"
                      onClick={() => onSelect(p.pos.id)}
                      onMouseEnter={() => {
                        const screen = svgToScreen(cx, cy - 16)
                        setTooltip({ x: screen.x, y: screen.y, pos: p.pos })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {isSelected && (
                        <circle cx={cx} cy={cy} r={20} fill="none" stroke={z.color} strokeWidth="0.5" opacity={0.4}>
                          <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle cx={cx} cy={cy} r={14} fill="none" stroke={z.color} strokeWidth={isSelected ? 1.5 : 0.8} opacity={isSelected ? 0.7 : 0.3} />
                      <circle cx={cx} cy={cy} r={5} fill={z.color}>
                        {isPulsing && <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />}
                      </circle>
                      <circle cx={cx} cy={cy} r={5} fill={z.color} opacity={0.3} filter="url(#nodeGlow)">
                        {isPulsing && <animate attributeName="r" values="5;9;5" dur="1.5s" repeatCount="indefinite" />}
                      </circle>
                      <text x={cx} y={cy + 22} textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize="7" fontFamily="system-ui" fontWeight="400">
                        {p.pos.short}
                      </text>
                      {p.pos.chain === 'domino_open' && (
                        <circle cx={cx + 10} cy={cy - 10} r={2.5} fill="#F59E0B" opacity={0.8} />
                      )}
                    </g>
                  )
                })
              })()}
            </svg>

            {/* Axis titles */}
            <p className="absolute bottom-1.5 right-3 text-[7px] uppercase tracking-[0.15em] text-slate-600/50">Banco →</p>
            <p className="absolute top-1.5 left-2 text-[7px] uppercase tracking-[0.15em] text-slate-600/50">↑ Riesgo</p>
          </div>
        </div>
      </div>

      {/* Node tooltip */}
      <Tooltip x={tooltip?.x || 0} y={tooltip?.y || 0} visible={!!tooltip}>
        {tooltip && (() => {
          const z = Z[getZone(tooltip.pos)]
          return (
            <>
              <p className="text-[11px] text-white font-medium">{tooltip.pos.title}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{tooltip.pos.incumbent}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-[4px] h-[4px] rounded-full" style={{ backgroundColor: z.color, boxShadow: `0 0 4px ${z.glow}` }} />
                <span className="text-[9px] font-medium" style={{ color: z.color }}>{z.label} — {z.action}</span>
              </div>
              {tooltip.pos.candidate && (
                <p className="text-[9px] text-slate-400 mt-1.5">Sucesor: {tooltip.pos.candidate} · {tooltip.pos.readinessLabel}</p>
              )}
              {!tooltip.pos.candidate && (
                <p className="text-[9px] text-red-400/80 mt-1.5">Sin sucesor identificado</p>
              )}
              {tooltip.pos.chain === 'domino_open' && (
                <p className="text-[8px] text-amber-400/70 mt-1 italic">⚠ Efecto cascada activo</p>
              )}
            </>
          )
        })()}
      </Tooltip>

      {/* Zone tooltip (for empty cells) */}
      <Tooltip x={zoneTooltip?.x || 0} y={zoneTooltip?.y || 0} visible={!!zoneTooltip}>
        {zoneTooltip && (() => {
          const z = Z[zoneTooltip.zone]
          return (
            <>
              <p className="text-[10px] font-medium" style={{ color: z.color }}>{z.label}</p>
              <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">{z.narrative}</p>
            </>
          )
        })()}
      </Tooltip>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// POSITION DETAIL
// ════════════════════════════════════════════════════════════════════════════

function PositionDetail({ pos, onClose }: { pos: Pos; onClose: () => void }) {
  const zone = getZone(pos)
  const z = Z[zone]
  const flightLabel = pos.flight ? ({ HIGH: 'Alto', MEDIUM: 'Medio', LOW: 'Bajo' } as Record<string, string>)[pos.flight] : 'Sin datos'
  const benchLabel = ({ STRONG: 'Fuerte', MODERATE: 'Moderado', WEAK: 'Débil', NONE: 'Vacío' } as Record<string, string>)[pos.bench]

  return (
    <div className="relative rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 overflow-hidden h-full">
      <div className="h-[2px]" style={{
        background: `linear-gradient(90deg, transparent 5%, ${z.color} 50%, transparent 95%)`,
        boxShadow: `0 0 10px ${z.glow}`,
      }} />

      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-light text-white">{pos.title}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{pos.incumbent}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700/30 text-slate-500 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: z.color, boxShadow: `0 0 6px ${z.glow}` }} />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: z.color }}>{z.label}</span>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
          <DetailRow label="Riesgo de fuga" value={flightLabel}
            color={pos.flight === 'HIGH' ? 'text-red-400' : pos.flight === 'MEDIUM' ? 'text-amber-400' : pos.flight === 'LOW' ? 'text-emerald-400' : 'text-slate-500'} />
          <DetailRow label="Fuerza de banco" value={benchLabel} color={z.color} />
          <DetailRow label="Mejor sucesor" value={pos.candidate || 'Ninguno'} color={pos.candidate ? 'text-slate-300' : 'text-slate-500'} />
          {pos.readinessLabel && (
            <DetailRow label="Preparación" value={pos.readinessLabel}
              color={pos.readiness === 'READY_NOW' ? 'text-emerald-400' : pos.readiness === 'READY_1_2_YEARS' ? 'text-cyan-400' : 'text-amber-400'} />
          )}
          <DetailRow label="Cadena" value={pos.chain === 'covered' ? 'Cubierta' : pos.chain === 'domino_open' ? 'Dominó abierto' : 'Sin candidato'}
            color={pos.chain === 'covered' ? 'text-emerald-400' : pos.chain === 'domino_open' ? 'text-amber-400' : 'text-slate-500'} />
        </div>

        {/* Narratives — filosas, con presión temporal */}
        <div className="pt-2 border-t border-white/[0.06] space-y-2.5">
          {pos.chain === 'domino_open' && pos.chainTarget && (
            <NarrativeRow icon={<AlertTriangle className="w-3 h-3 text-amber-400/80" />} color="text-amber-400/80">
              Activar a {pos.candidate} resuelve {pos.title} pero deja {pos.chainTarget} sin cobertura. Resultado neto: resuelves 1 vacante, creas 1 nueva.
            </NarrativeRow>
          )}
          {!pos.candidate && pos.flight === 'HIGH' && (
            <NarrativeRow icon={<UserX className="w-3 h-3 text-red-400/80" />} color="text-red-400/80">
              Sin candidatos y titular con señales activas de fuga. La ventana de retención se cierra cada semana que pasa sin actuar.
            </NarrativeRow>
          )}
          {!pos.candidate && pos.flight !== 'HIGH' && (
            <NarrativeRow icon={<UserX className="w-3 h-3 text-red-400/70" />} color="text-red-400/70">
              Sin candidatos identificados. Búsqueda activa necesaria.
            </NarrativeRow>
          )}
          {pos.candidate && pos.readiness === 'READY_NOW' && pos.chain !== 'domino_open' && (
            <NarrativeRow icon={<Target className="w-3 h-3 text-emerald-400/80" />} color="text-emerald-400/80">
              {pos.candidate} puede asumir hoy. Cadena resuelta. Posición protegida.
            </NarrativeRow>
          )}
          {pos.candidate && pos.readiness === 'READY_3_PLUS' && pos.flight === 'HIGH' && (
            <NarrativeRow icon={<AlertTriangle className="w-3 h-3 text-amber-400/80" />} color="text-amber-400/80">
              {pos.candidate} necesita 3+ años pero el titular puede salir antes. Se necesita un plan B inmediato.
            </NarrativeRow>
          )}

          <p className="text-[10px] pt-1" style={{ color: z.color }}>→ {z.action}</p>
        </div>
      </div>
    </div>
  )
}

function NarrativeRow({ icon, color, children }: { icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <p className={cn('text-[11px] leading-relaxed font-light italic', color)}>{children}</p>
    </div>
  )
}

function DetailRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[8px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className={cn('text-[11px] font-light', color)}>{value}</p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DOMINO CHAIN
// ════════════════════════════════════════════════════════════════════════════

function DominoChain({ pos }: { pos: Pos }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dTooltip, setDTooltip] = useState<{ x: number; y: number; node: 'vacancy' | 'successor' | 'exposed' } | null>(null)

  const svgToScreen = useCallback((sx: number, sy: number) => {
    if (!svgRef.current) return { x: 0, y: 0 }
    const rect = svgRef.current.getBoundingClientRect()
    return {
      x: rect.left + (sx / 400) * rect.width,
      y: rect.top + (sy / 60) * rect.height,
    }
  }, [])

  const flightLabel = pos.flight ? ({ HIGH: 'Alto', MEDIUM: 'Medio', LOW: 'Bajo' } as Record<string, string>)[pos.flight] : 'Sin datos'

  return (
    <div className="relative rounded-2xl border border-slate-700/30 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      <div className="h-[2px]" style={{
        background: 'linear-gradient(90deg, transparent 5%, rgba(245,158,11,0.4) 50%, transparent 95%)',
        boxShadow: '0 0 8px rgba(245,158,11,0.15)',
      }} />

      <div className="p-5 sm:p-6">
        <svg ref={svgRef} viewBox="0 0 400 60" className="w-full h-auto mb-5" style={{ maxHeight: '60px' }}
          onMouseLeave={() => setDTooltip(null)}>
          <defs>
            <linearGradient id={`cg-${pos.id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.5" />
            </linearGradient>
            <filter id={`gl-${pos.id}`}><feGaussianBlur stdDeviation="2" /></filter>
          </defs>

          <line x1={55} y1={30} x2={345} y2={30} stroke={`url(#cg-${pos.id})`} strokeWidth="1.5" strokeDasharray="5,4">
            <animate attributeName="stroke-dashoffset" values="0;-18" dur="2s" repeatCount="indefinite" />
          </line>
          <polygon points="148,27 156,30 148,33" fill="#22D3EE" opacity="0.5" />
          <polygon points="248,27 256,30 248,33" fill="#F59E0B" opacity="0.5" />

          {/* Node 1: Vacancy */}
          <g className="cursor-help"
            onMouseEnter={() => { const s = svgToScreen(35, 5); setDTooltip({ x: s.x, y: s.y, node: 'vacancy' }) }}
            onMouseLeave={() => setDTooltip(null)}>
            <circle cx={35} cy={30} r={16} fill="transparent" />
            <circle cx={35} cy={30} r={12} fill="none" stroke="#22D3EE" strokeWidth="0.8" opacity="0.4" />
            <circle cx={35} cy={30} r={4} fill="#22D3EE" opacity="0.8" />
            <circle cx={35} cy={30} r={4} fill="#22D3EE" opacity="0.25" filter={`url(#gl-${pos.id})`} />
          </g>

          {/* Node 2: Successor assumes */}
          <g className="cursor-help"
            onMouseEnter={() => { const s = svgToScreen(200, 5); setDTooltip({ x: s.x, y: s.y, node: 'successor' }) }}
            onMouseLeave={() => setDTooltip(null)}>
            <circle cx={200} cy={30} r={16} fill="transparent" />
            <circle cx={200} cy={30} r={12} fill="none" stroke="#F59E0B" strokeWidth="0.8" opacity="0.4" />
            <circle cx={200} cy={30} r={4} fill="#F59E0B" opacity="0.8" />
          </g>

          {/* Node 3: Exposed position */}
          <g className="cursor-help"
            onMouseEnter={() => { const s = svgToScreen(365, 5); setDTooltip({ x: s.x, y: s.y, node: 'exposed' }) }}
            onMouseLeave={() => setDTooltip(null)}>
            <circle cx={365} cy={30} r={16} fill="transparent" />
            <circle cx={365} cy={30} r={12} fill="none" stroke="#EF4444" strokeWidth="0.8" opacity="0.4" />
            <circle cx={365} cy={30} r={4} fill="#EF4444">
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={365} cy={30} r={4} fill="#EF4444" opacity="0.3" filter={`url(#gl-${pos.id})`}>
              <animate attributeName="r" values="4;8;4" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>

        {/* Domino node tooltips */}
        <Tooltip x={dTooltip?.x || 0} y={dTooltip?.y || 0} visible={!!dTooltip}>
          {dTooltip?.node === 'vacancy' && (
            <>
              <p className="text-[11px] text-cyan-400 font-medium">{pos.title}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Titular: {pos.incumbent}</p>
              <p className="text-[9px] text-slate-400 mt-1">Riesgo de fuga: <span className={pos.flight === 'HIGH' ? 'text-red-400' : pos.flight === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}>{flightLabel}</span></p>
            </>
          )}
          {dTooltip?.node === 'successor' && (
            <>
              <p className="text-[11px] text-amber-400 font-medium">{pos.candidate}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Asume: {pos.title}</p>
              {pos.readinessLabel && <p className="text-[9px] text-slate-400 mt-1">Preparación: <span className="text-cyan-400">{pos.readinessLabel}</span></p>}
            </>
          )}
          {dTooltip?.node === 'exposed' && (
            <>
              <p className="text-[11px] text-red-400 font-medium">{pos.chainTarget}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Queda descubierto al mover a {pos.candidate}</p>
              <p className="text-[9px] text-red-400/70 mt-1 italic">Sin cobertura identificada</p>
            </>
          )}
        </Tooltip>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[11px] text-cyan-400/80 font-medium">{pos.title}</p>
            <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">Vacante</p>
          </div>
          <div>
            <p className="text-[11px] text-amber-400/80 font-medium">{pos.candidate}</p>
            <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">Asume</p>
          </div>
          <div>
            <p className="text-[11px] text-red-400/80 font-medium">{pos.chainTarget}</p>
            <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">Descubierto</p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-start gap-2">
          <AlertTriangle className="w-3 h-3 text-amber-400/60 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-400 leading-relaxed font-light italic">
            Activar a {pos.candidate} resuelve {pos.title} pero deja {pos.chainTarget} sin cobertura. Resultado neto: resuelves 1 vacante, creas 1 nueva.
          </p>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// NAV PILL
// ════════════════════════════════════════════════════════════════════════════

function NavPill({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  const tabs = [
    { key: 'matrix', target: 'mapa-portada', icon: Shield, label: 'Mapa' },
    { key: 'domino', target: 'domino-portada', icon: Link2, label: 'Dominó' },
  ]
  return (
    <div className="flex gap-0.5 bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-full p-[3px]">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.target)}
          className={cn(
            'relative px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.1em] transition-colors duration-200',
            active === t.key ? 'text-white' : 'text-slate-500 hover:text-slate-400'
          )}>
          {active === t.key && (
            <motion.div layoutId="succ-nav-v7" className="absolute inset-0 bg-slate-700/50 rounded-full"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
          )}
          <span className="relative z-10 flex items-center gap-1.5"><t.icon size={10} />{t.label}</span>
        </button>
      ))}
    </div>
  )
}
