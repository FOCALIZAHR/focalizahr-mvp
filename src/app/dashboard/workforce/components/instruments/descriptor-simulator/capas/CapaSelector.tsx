'use client'

// ════════════════════════════════════════════════════════════════════════════
// CAPA SELECTOR — buscador de cargos con badges Verificado/Propuesto/Sin mapear
// capas/CapaSelector.tsx
// ════════════════════════════════════════════════════════════════════════════
// Lista TODOS los cargos del account (no solo los confirmados):
//   - "Verificado" (cyan)        → kind='verified'  → JobDescriptor afinado
//   - "Propuesto"  (purple)      → kind='proposed'  → SOC mapeado, datos O*NET
//   - "Sin clasif."(slate)       → kind='unmapped'  → sin SOC, deshabilitado
//
// El badge es un sello de confianza, no un gate de workflow.
// El CEO ve el negocio completo desde el día 1.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useRef, useState, useEffect } from 'react'
import { Search, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  SimulatorDescriptorListItem,
  SimulatorListKind,
} from '@/app/api/descriptors/simulator-list/route'

interface CapaSelectorProps {
  descriptors: SimulatorDescriptorListItem[]
  selectedKey: string | null
  loading: boolean
  onChange: (key: string) => void
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export default memo(function CapaSelector({
  descriptors,
  selectedKey,
  loading,
  onChange,
}: CapaSelectorProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = descriptors.find(d => d.key === selectedKey) ?? null

  const filtered = useMemo(() => {
    if (!query.trim()) return descriptors
    const q = normalize(query)
    return descriptors.filter(d => normalize(d.jobTitle).includes(q))
  }, [query, descriptors])

  // Click-outside cierra el dropdown
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (item: SimulatorDescriptorListItem) => {
    if (item.kind === 'unmapped') return
    onChange(item.key)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Display actual (cerrado) */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={loading || descriptors.length === 0}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg',
            'bg-slate-900/60 border border-slate-700/50 text-sm font-light text-slate-200',
            'hover:border-slate-600 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="truncate">
              {loading
                ? 'Cargando cargos…'
                : descriptors.length === 0
                  ? 'Sin cargos disponibles'
                  : selected
                    ? selected.jobTitle
                    : 'Buscar cargo…'}
            </span>
            {selected && <StatusBadge kind={selected.kind} />}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        </button>
      )}

      {/* Input + dropdown abiertos */}
      {open && (
        <>
          <div className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900/80 border border-cyan-500/50">
            <Search className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Busca un cargo…"
              className="flex-1 bg-transparent text-sm font-light text-slate-200 placeholder-slate-500 focus:outline-none"
            />
            {filtered.length > 0 && (
              <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                {filtered.length}
              </span>
            )}
          </div>

          <div className="absolute top-full left-0 right-0 mt-1 z-30 max-h-[280px] overflow-y-auto rounded-lg bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl shadow-2xl">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-slate-500 font-light text-center">
                Sin coincidencias
              </p>
            ) : (
              <ul className="py-1">
                {filtered.map(d => {
                  const isSelected = d.key === selectedKey
                  const disabled = d.kind === 'unmapped'
                  return (
                    <li key={d.key}>
                      <button
                        type="button"
                        onClick={() => handleSelect(d)}
                        disabled={disabled}
                        title={
                          disabled
                            ? 'Cargo sin clasificación O*NET — pendiente de mapeo'
                            : undefined
                        }
                        className={cn(
                          'w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-light transition-colors',
                          isSelected
                            ? 'bg-cyan-500/10 text-cyan-300'
                            : disabled
                              ? 'text-slate-600 cursor-not-allowed'
                              : 'text-slate-300 hover:bg-slate-800/60',
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isSelected && (
                            <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                          )}
                          <span className="truncate">{d.jobTitle}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {d.employeeCount > 0 && (
                            <span className="text-[10px] font-mono text-slate-500">
                              {d.employeeCount}
                            </span>
                          )}
                          <StatusBadge kind={d.kind} compact />
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE — Verificado (cyan) · Propuesto (purple) · Sin clasif (slate)
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_STYLE: Record<
  SimulatorListKind,
  {
    label: string
    border: string
    bg: string
    dot: string
    text: string
    title: string
  }
> = {
  verified: {
    label: 'Verificado',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/[0.06]',
    dot: 'bg-cyan-400',
    text: 'text-cyan-300',
    title: 'Descriptor afinado por tu empresa — alta confianza',
  },
  proposed: {
    label: 'Propuesto',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/[0.04]',
    dot: 'bg-purple-400/60',
    text: 'text-purple-400/70',
    title: 'Datos teóricos O*NET — confianza media. Verifique para afinar.',
  },
  unmapped: {
    label: 'Sin clasif.',
    border: 'border-slate-600/30',
    bg: 'bg-slate-700/20',
    dot: 'bg-slate-500',
    text: 'text-slate-500',
    title: 'Cargo sin clasificación O*NET — pendiente de mapeo',
  },
}

export function StatusBadge({
  kind,
  compact = false,
  className,
}: {
  kind: SimulatorListKind
  compact?: boolean
  className?: string
}) {
  const s = BADGE_STYLE[kind]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border',
        compact ? 'px-1.5 py-0.5' : 'px-2 py-1',
        s.border,
        s.bg,
        className,
      )}
      title={s.title}
    >
      <span
        className={cn(
          'rounded-full',
          compact ? 'w-0.5 h-0.5' : 'w-1 h-1',
          s.dot,
        )}
      />
      <span
        className={cn(
          'uppercase tracking-widest font-bold',
          compact ? 'text-[8px]' : 'text-[9px]',
          s.text,
        )}
      >
        {s.label}
      </span>
    </span>
  )
}
