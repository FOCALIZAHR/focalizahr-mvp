'use client'

// ════════════════════════════════════════════════════════════════════════════
// QUADRANT BLOCK — Bloque expandible proporcional (Pilar 2)
// src/components/talent-actions/QuadrantBlock.tsx
//
// Filosofía FocalizaHR:
// — Colapsado: número grande + narrativa + barra proporcional cyan
// — Expandido: personas + selección + acciones masivas
// — Sin colores semáforo — cyan protagonista, slate neutro
// — "El tamaño comunica proporción, la narrativa comunica urgencia"
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { ChevronDown, Loader2 } from 'lucide-react'
import PersonTalentCard from './PersonTalentCard'
import MassActionBar from './MassActionBar'
import type { QuadrantPerson } from '@/lib/services/TalentActionService'

interface QuadrantBlockProps {
  quadrant: string
  label: string
  description: string
  actionTypical: string
  color: string
  borderColor: string
  bgColor: string
  accentColor?: string
  count: number
  totalInMap?: number
  compact?: boolean
  isExpanded: boolean
  onToggle: () => void
}

export default function QuadrantBlock({
  quadrant, label, description, actionTypical,
  color, borderColor, bgColor, accentColor, count, totalInMap,
  compact, isExpanded, onToggle
}: QuadrantBlockProps) {
  const [persons, setPersons] = useState<QuadrantPerson[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [massActionCompleted, setMassActionCompleted] = useState(false)

  const percent = totalInMap && totalInMap > 0 ? Math.round((count / totalInMap) * 100) : 0

  const handleToggleSelect = useCallback((employeeId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(employeeId)) next.delete(employeeId)
      else next.add(employeeId)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(persons.map(p => p.employeeId)))
  }, [persons])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleMassAction = useCallback(async (actionCode: string) => {
    const res = await fetch('/api/talent-actions/mass-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeIds: Array.from(selectedIds),
        quadrant,
        actionCode
      })
    })
    const result = await res.json()
    if (!res.ok) {
      throw new Error(result.error || `Error ${res.status}`)
    }
    setMassActionCompleted(true)
    return result.data?.contextMessage as string | undefined
  }, [selectedIds, quadrant])

  const fetchPersons = useCallback(async (skip = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ skip: String(skip), take: '20' })
      const res = await fetch(`/api/talent-actions/quadrant/${quadrant}?${params}`)
      if (!res.ok) return

      const result = await res.json()
      if (!result.success) return

      if (skip === 0) {
        setPersons(result.data.persons)
      } else {
        setPersons(prev => [...prev, ...result.data.persons])
      }
      setTotal(result.data.total)
      setHasMore(result.data.pagination.hasMore)
    } catch (err) {
      console.error(`[QuadrantBlock ${quadrant}] Error:`, err)
    } finally {
      setLoading(false)
    }
  }, [quadrant])

  // Fetch on expand
  useEffect(() => {
    if (isExpanded && persons.length === 0) {
      fetchPersons()
    }
  }, [isExpanded, persons.length, fetchPersons])

  if (count === 0) return null

  // Conteos para resumen
  const seniorCount = persons.filter(p => p.tenureMonths > 36).length

  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  return (
    <div
      className={`rounded-2xl bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 relative overflow-hidden transition-all duration-300 ${
        isExpanded ? 'ring-1 ring-cyan-500/20' : 'hover:border-slate-700/80 hover:bg-slate-900/60'
      } ${!isExpanded ? 'h-full' : ''}`}
    >
      {/* Línea Tesla severity — sutil, solo 2px */}
      {accentColor && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
          }}
        />
      )}

      {/* ═══════════ HEADER ═══════════ */}
      <button
        onClick={onToggle}
        onMouseEnter={compact ? (e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 })
          setShowTooltip(true)
        } : undefined}
        onMouseLeave={compact ? () => setShowTooltip(false) : undefined}
        className={`w-full text-left transition-colors hover:bg-white/[0.02] ${compact ? 'p-3' : 'p-5'}`}
      >
        {compact ? (
          /* Modo compacto: % hero + label, centrado + tooltip */
          <div className="text-center relative">
            <span className="text-2xl font-light text-white">{percent}%</span>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{label}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{count} pers.</p>

            {/* Tooltip via portal — escapa cualquier overflow */}
            {showTooltip && typeof document !== 'undefined' && createPortal(
              <div
                style={{
                  position: 'fixed',
                  left: tooltipPos.x,
                  top: tooltipPos.y,
                  transform: 'translate(-50%, -100%)',
                  zIndex: 99999,
                  pointerEvents: 'none',
                }}
              >
                <div className="px-4 py-3 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 text-left max-w-[260px] shadow-2xl">
                  <p className="text-sm text-white font-medium">{label}</p>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{description}</p>
                  <p className="text-xs text-cyan-400/70 mt-1.5">{percent}% · {count} personas</p>
                </div>
              </div>,
              document.body
            )}
          </div>
        ) : (
          /* Modo normal: % hero + count secundario + narrativa + barra */
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* % como hero */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-light text-white">{percent}%</span>
                <span className="text-sm text-slate-600">{count} personas</span>
              </div>

              <p className="text-sm text-slate-400 mt-1">{label}</p>

              {!isExpanded && (
                <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-2">
                  {description}
                </p>
              )}

              {!isExpanded && (
                <div className="h-0.5 rounded-full bg-slate-800 mt-3">
                  <motion.div
                    className="h-0.5 rounded-full bg-cyan-400/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(percent, 3)}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                </div>
              )}
            </div>

            <ChevronDown className={`w-4 h-4 text-slate-600 shrink-0 mt-2 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        )}
      </button>

      {/* ═══════════ CONTENIDO EXPANDIDO ═══════════ */}
      {isExpanded && (
          <div className="border-t border-slate-800/40">
            {loading && persons.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* Resumen */}
                {persons.length > 0 && (
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{total} personas</span>
                    {seniorCount > 0 && (
                      <>
                        <span className="text-slate-700">·</span>
                        <span>{seniorCount} senior (+3 años)</span>
                      </>
                    )}
                  </div>
                )}

                {/* Recomendación */}
                <p className="text-xs text-cyan-400/70">
                  Recomendacion: {actionTypical}
                </p>

                {/* Seleccionar todos */}
                {persons.length > 0 && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={selectedIds.size === persons.length ? handleClearSelection : handleSelectAll}
                      className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      {selectedIds.size === persons.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                    {selectedIds.size > 0 && (
                      <span className="text-xs text-slate-500">
                        {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}

                {/* Lista de personas */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {persons.map(person => (
                    <PersonTalentCard
                      key={person.employeeId}
                      person={person}
                      selectable
                      selected={selectedIds.has(person.employeeId)}
                      onToggleSelect={handleToggleSelect}
                    />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => fetchPersons(persons.length)}
                      disabled={loading}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {loading ? 'Cargando...' : `Ver mas (${total - persons.length} restantes)`}
                    </button>
                  </div>
                )}

                {/* Acciones masivas */}
                {(selectedIds.size > 0 || massActionCompleted) && (
                  <MassActionBar
                    selectedCount={selectedIds.size}
                    quadrant={quadrant}
                    onAction={handleMassAction}
                    onClearSelection={handleClearSelection}
                  />
                )}
              </div>
            )}
          </div>
      )}
    </div>
  )
}
