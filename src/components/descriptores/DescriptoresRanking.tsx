'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTORES RANKING — Layer 1: Cargos por validar
// Cards clickeables con tabs underline. Ordenadas por headcount DESC.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Home, ChevronRight, Search, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { PositionWithStatus, DescriptorSummary } from '@/lib/services/JobDescriptorService'
import { SOC_TITLES_ES } from '@/config/OnetOccupationConfig'

type TabFilter = 'pending' | 'confirmed' | 'unclassified' | 'all'

// SOC options for search
const SOC_OPTIONS = Object.entries(SOC_TITLES_ES).map(([code, title]) => ({
  code,
  title,
  searchKey: `${code} ${title}`.toLowerCase(),
}))

interface DescriptoresRankingProps {
  positions: PositionWithStatus[]
  summary: DescriptorSummary | null
  onHome: () => void
  onRefresh: () => void
}

export default memo(function DescriptoresRanking({
  positions,
  summary,
  onHome,
  onRefresh,
}: DescriptoresRankingProps) {
  const [tab, setTab] = useState<TabFilter>('pending')
  const router = useRouter()

  const unclassifiedCount = positions.filter(p => !p.socCode && p.matchConfidence === 'UNCLASSIFIED').length

  const filtered = positions.filter(p => {
    if (tab === 'pending') return p.descriptorStatus === 'NONE'
    if (tab === 'confirmed') return p.descriptorStatus === 'CONFIRMED'
    if (tab === 'unclassified') return !p.socCode && p.matchConfidence === 'UNCLASSIFIED'
    return true
  })

  const pendingCount = positions.filter(p => p.descriptorStatus === 'NONE').length
  const confirmedCount = positions.filter(p => p.descriptorStatus === 'CONFIRMED').length

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'pending', label: `Pendientes (${pendingCount})` },
    { key: 'confirmed', label: `Confirmados (${confirmedCount})` },
    ...(unclassifiedCount > 0
      ? [{ key: 'unclassified' as const, label: `Sin clasificar (${unclassifiedCount})` }]
      : []),
    { key: 'all', label: 'Todos' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extralight text-white tracking-tight leading-tight">
            Cargos por{' '}
            <span className="fhr-title-gradient">Validar</span>
          </h2>
        </div>
        <button
          onClick={onHome}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
        >
          <Home className="w-3.5 h-3.5" />
          Portada
        </button>
      </div>

      {/* Tabs underline (no pills) */}
      <div className="flex gap-6 border-b border-slate-700/50">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'pb-2.5 text-sm font-light transition-colors',
              tab === t.key
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-500 hover:text-slate-400'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista de cargos como cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm font-light">
            {tab === 'pending'
              ? 'Todos los cargos tienen descriptor. Excelente.'
              : tab === 'confirmed'
              ? 'Aún no hay descriptores confirmados.'
              : tab === 'unclassified'
              ? 'Todos los cargos están clasificados.'
              : 'Sin cargos en la nómina.'}
          </p>
        </div>
      ) : tab === 'unclassified' ? (
        <div className="space-y-2">
          {filtered.map((pos, idx) => (
            <UnclassifiedCard
              key={`${pos.jobTitle}-${idx}`}
              position={pos}
              index={idx}
              onCorrected={onRefresh}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((pos, idx) => (
            <motion.button
              key={`${pos.jobTitle}-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
              onClick={() => router.push(`/dashboard/descriptores/${encodeURIComponent(pos.jobTitle)}`)}
              className="w-full text-left fhr-card p-4 flex items-center gap-4 group hover:border-slate-700/70 transition-all"
            >
              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
                  {pos.jobTitle}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-400">
                    {pos.employeeCount} persona{pos.employeeCount !== 1 ? 's' : ''}
                  </span>
                  {pos.departmentNames.length > 0 && (
                    <>
                      <span className="text-slate-700">·</span>
                      <span className="text-xs text-slate-500 truncate">
                        {pos.departmentNames.slice(0, 2).join(', ')}
                        {pos.departmentNames.length > 2 && ` +${pos.departmentNames.length - 2}`}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Status badge ghost */}
              {pos.descriptorStatus !== 'NONE' && (
                <span className={cn(
                  'text-[9px] px-2.5 py-1 rounded-full border font-light',
                  pos.descriptorStatus === 'CONFIRMED'
                    ? 'text-cyan-400/60 border-cyan-500/20'
                    : 'text-slate-400/60 border-slate-700/30'
                )}>
                  {pos.descriptorStatus === 'CONFIRMED' ? 'Confirmado' : 'Borrador'}
                </span>
              )}

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      )}

      {/* Coaching tip */}
      <p className="text-xs text-slate-600 text-center mt-4">
        {tab === 'unclassified'
          ? '● Busca y asigna la ocupación O*NET correcta para cada cargo.'
          : '● Valida primero los cargos que impactan más personas.'}
      </p>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// UNCLASSIFIED CARD — inline SOC correction
// ════════════════════════════════════════════════════════════════════════════

function UnclassifiedCard({
  position,
  index,
  onCorrected,
}: {
  position: PositionWithStatus
  index: number
  onCorrected: () => void
}) {
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const suggestions = query.length >= 2
    ? SOC_OPTIONS.filter(o => o.searchKey.includes(query.toLowerCase())).slice(0, 6)
    : []

  const handleSelect = useCallback(async (socCode: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/workforce/occupation/correct', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionText: position.jobTitle, socCode }),
      })
      const json = await res.json()
      if (json.success) {
        setSaved(true)
        setTimeout(() => onCorrected(), 600)
      }
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }, [position.jobTitle, onCorrected])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={cn(
        'fhr-card p-4 transition-all',
        saved && 'border-cyan-500/30'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            {position.jobTitle}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {position.employeeCount} persona{position.employeeCount !== 1 ? 's' : ''}
            {position.departmentNames.length > 0 && ` · ${position.departmentNames.slice(0, 2).join(', ')}`}
          </p>
        </div>

        {saved ? (
          <span className="flex items-center gap-1 text-cyan-400 text-xs">
            <Check className="w-3.5 h-3.5" />
            Asignado
          </span>
        ) : (
          <span className="text-[9px] px-2.5 py-1 rounded-full border text-slate-400/60 border-slate-700/30 font-light">
            Sin clasificar
          </span>
        )}
      </div>

      {/* Search input */}
      {!saved && (
        <div className="mt-3 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar ocupación O*NET..."
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/30 transition-colors"
            />
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-slate-800 border border-slate-700/50 rounded-lg overflow-hidden shadow-xl">
              {suggestions.map(sug => (
                <button
                  key={sug.code}
                  onClick={() => handleSelect(sug.code)}
                  disabled={saving}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-700/50 transition-colors flex items-center gap-3"
                >
                  <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                    {sug.code}
                  </span>
                  <span className="text-xs text-slate-300 truncate">
                    {sug.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
