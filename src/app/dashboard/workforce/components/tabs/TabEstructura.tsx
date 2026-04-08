'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAB ESTRUCTURA — Drill-down por persona
// Usa retentionPriority.ranking para lista completa con filtros
// src/app/dashboard/workforce/components/tabs/TabEstructura.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkforceDiagnosticData, RetentionPriorityResult } from '../../types/workforce.types'

// ═══════════════════════════════════════════════════════════════════════
// TIER BADGE
// ═══════════════════════════════════════════════════════════════════════

const TIER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  intocable: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', label: 'Intocable' },
  valioso: { bg: 'bg-cyan-500/10 border-cyan-500/30', text: 'text-cyan-400', label: 'Valioso' },
  neutro: { bg: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-400', label: 'Neutro' },
  prescindible: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', label: 'Prescindible' },
}

function TierBadge({ tier }: { tier: string }) {
  const style = TIER_STYLES[tier] ?? TIER_STYLES.neutro
  return (
    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', style.bg, style.text)}>
      {style.label}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// FILTER PILLS
// ═══════════════════════════════════════════════════════════════════════

const TIER_FILTERS = ['todos', 'intocable', 'valioso', 'neutro', 'prescindible'] as const
type TierFilter = typeof TIER_FILTERS[number]

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

interface TabEstructuraProps {
  data: WorkforceDiagnosticData
}

export default function TabEstructura({ data }: TabEstructuraProps) {
  const [tierFilter, setTierFilter] = useState<TierFilter>('todos')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = data.retentionPriority.ranking

    if (tierFilter !== 'todos') {
      list = list.filter(p => p.tier === tierFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.employeeName.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        p.departmentName.toLowerCase().includes(q)
      )
    }

    return list
  }, [data.retentionPriority.ranking, tierFilter, search])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-4xl mx-auto px-4"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-light text-white mb-1">Estructura por Persona</h2>
        <p className="text-xs text-slate-500">
          {data.retentionPriority.ranking.length} personas evaluadas — {data.retentionPriority.intocablesCount} intocables, {data.retentionPriority.prescindiblesCount} prescindibles
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, cargo o gerencia..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800/40 rounded-lg text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/30"
          />
        </div>

        {/* Tier pills */}
        <div className="flex gap-1.5 flex-wrap">
          {TIER_FILTERS.map(tier => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                tierFilter === tier
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-slate-900/40 border-slate-800/40 text-slate-500 hover:text-slate-300'
              )}
            >
              {tier === 'todos' ? 'Todos' : TIER_STYLES[tier]?.label ?? tier}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/40 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="text-left text-xs text-slate-500 font-medium p-3">Nombre</th>
                <th className="text-left text-xs text-slate-500 font-medium p-3 hidden sm:table-cell">Cargo</th>
                <th className="text-left text-xs text-slate-500 font-medium p-3 hidden md:table-cell">Gerencia</th>
                <th className="text-right text-xs text-slate-500 font-medium p-3">Exposicion</th>
                <th className="text-right text-xs text-slate-500 font-medium p-3 hidden sm:table-cell">RoleFit</th>
                <th className="text-center text-xs text-slate-500 font-medium p-3">Tier</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-600 text-sm">
                    {search ? 'Sin resultados para la busqueda' : 'Sin datos disponibles'}
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 50).map(person => (
                  <tr key={person.employeeId} className="border-b border-slate-800/20 hover:bg-slate-800/20 transition-colors">
                    <td className="p-3">
                      <span className="text-cyan-400 font-light">{person.employeeName}</span>
                    </td>
                    <td className="p-3 text-slate-400 font-light hidden sm:table-cell">{person.position}</td>
                    <td className="p-3 text-slate-400 font-light hidden md:table-cell">{person.departmentName}</td>
                    <td className="p-3 text-right text-slate-300 font-light">
                      {Math.round(person.observedExposure * 100)}%
                    </td>
                    <td className="p-3 text-right text-slate-300 font-light hidden sm:table-cell">
                      {Math.round(person.roleFitScore)}%
                    </td>
                    <td className="p-3 text-center">
                      <TierBadge tier={person.tier} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 50 && (
          <div className="px-3 py-2 border-t border-slate-800/30 text-center">
            <span className="text-xs text-slate-600">
              Mostrando 50 de {filtered.length} personas
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
