'use client'

// ════════════════════════════════════════════════════════════════════════════
// QUADRANT BLOCK — Bloque expandible por cuadrante (Pilar 2)
// src/components/talent-actions/QuadrantBlock.tsx
//
// Colapsado: nombre + count + color
// Expandido: fetch personas + PersonTalentCards con narrativas
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  count: number
  isExpanded: boolean
  onToggle: () => void
}

export default function QuadrantBlock({
  quadrant, label, description, actionTypical,
  color, borderColor, bgColor, count,
  isExpanded, onToggle
}: QuadrantBlockProps) {
  const [persons, setPersons] = useState<QuadrantPerson[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Error desconocido' }))
      throw new Error(data.error || `Error ${res.status}`)
    }
    setSelectedIds(new Set())
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
  const redCount = persons.filter(p => p.riskAlertLevel === 'RED').length
  const veteranosCount = persons.filter(p => p.tenureMonths > 60).length

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`rounded-2xl border ${borderColor} ${bgColor} ${isExpanded ? 'sm:col-span-2' : ''} overflow-hidden`}
    >
      {/* Header — siempre visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${color}`}>{label}</span>
          <span className="text-xs text-slate-500">{count} personas</span>
        </div>
        <div className="flex items-center gap-3">
          {!isExpanded && (
            <span className="text-[11px] text-slate-500 hidden sm:block">{description}</span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Contenido expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-800/50"
          >
            {loading && persons.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Resumen agregado */}
                {persons.length > 0 && (
                  <div className="p-3 rounded-lg bg-slate-800/50 text-sm text-slate-300">
                    <span className="text-red-400 font-medium">{redCount}</span> RED
                    <span className="mx-2 text-slate-600">·</span>
                    <span className="text-purple-400 font-medium">{veteranosCount}</span> Veteranos
                    <span className="mx-2 text-slate-600">·</span>
                    <span className="text-slate-400">{total} total</span>
                  </div>
                )}

                {/* Accion tipica */}
                <div className="text-xs text-cyan-400/70">
                  Accion tipica: {actionTypical}
                </div>

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
                {selectedIds.size > 0 && (
                  <MassActionBar
                    selectedCount={selectedIds.size}
                    quadrant={quadrant}
                    onAction={handleMassAction}
                    onClearSelection={handleClearSelection}
                  />
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
