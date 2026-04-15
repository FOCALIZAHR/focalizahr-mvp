'use client'

// ════════════════════════════════════════════════════════════════════════════
// SELECTOR — dropdown reusable del Simulador de Cargos IA
// atomos/Selector.tsx
// ════════════════════════════════════════════════════════════════════════════
// Usado por:
//   - Página 4 Seleccion (tamaño full)
//   - CostadoCargoSelector del Costado 30% (tamaño compacto)
//
// Prop `compact` reduce padding, tipografía y altura del dropdown.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BadgeColor = 'cyan' | 'purple' | 'slate'

export interface SelectorOption {
  id: string
  label: string
  sublabel?: string
  badgeColor?: BadgeColor
  disabled?: boolean
}

interface SelectorProps {
  label: string
  value: string
  options: SelectorOption[]
  onSelect: (id: string) => void
  selectedId: string | null
  /** compact: menos padding, menor tipografía, dropdown más angosto. */
  compact?: boolean
  /** Override del color del valor mostrado (default: text-slate-200) */
  valueClassName?: string
}

export default memo(function Selector({
  label,
  value,
  options,
  onSelect,
  selectedId,
  compact = false,
  valueClassName,
}: SelectorProps) {
  const [open, setOpen] = useState(false)

  const triggerPadding = compact ? 'px-2.5 py-2' : 'px-4 py-3'
  const labelSize = compact ? 'text-[8px]' : 'text-[9px]'
  const valueSize = compact ? 'text-xs' : 'text-sm'
  const dropdownMaxH = compact ? 'max-h-[180px]' : 'max-h-[200px]'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 rounded-lg bg-slate-900/60 border border-slate-700/50 font-light text-slate-200 hover:border-slate-600 transition-colors',
          triggerPadding,
          valueSize,
        )}
      >
        <div className="flex flex-col items-start min-w-0">
          <span
            className={cn(
              'uppercase tracking-widest font-bold text-slate-500',
              labelSize,
            )}
          >
            {label}
          </span>
          <span className={cn('truncate', valueClassName ?? 'text-slate-200')}>{value}</span>
        </div>
        <ChevronDown
          className={cn(
            'text-slate-500 flex-shrink-0 transition-transform',
            compact ? 'w-3 h-3' : 'w-3.5 h-3.5',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className={cn(
              'absolute top-full left-0 right-0 mt-1 z-40 overflow-y-auto rounded-lg bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl shadow-2xl',
              dropdownMaxH,
            )}
          >
            <ul className="py-1">
              {options.length === 0 ? (
                <li className="px-3 py-2 text-xs text-slate-500 font-light text-center">
                  Sin opciones
                </li>
              ) : (
                options.map(opt => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (opt.disabled) return
                        onSelect(opt.id)
                        setOpen(false)
                      }}
                      disabled={opt.disabled}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-3 py-2 text-left font-light transition-colors',
                        compact ? 'text-[11px]' : 'text-xs',
                        selectedId === opt.id
                          ? 'bg-cyan-500/10 text-cyan-300'
                          : opt.disabled
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-slate-300 hover:bg-slate-800/60',
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {selectedId === opt.id && (
                          <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        )}
                        <span className="truncate">{opt.label}</span>
                      </div>
                      {opt.sublabel && (
                        <span
                          className={cn(
                            'uppercase tracking-widest font-bold flex-shrink-0',
                            compact ? 'text-[8px]' : 'text-[9px]',
                            opt.badgeColor === 'cyan' && 'text-cyan-400/70',
                            opt.badgeColor === 'purple' && 'text-purple-400/70',
                            opt.badgeColor === 'slate' && 'text-slate-500',
                            !opt.badgeColor && 'text-slate-500',
                          )}
                        >
                          {opt.sublabel}
                        </span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
})
