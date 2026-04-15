'use client'

// ════════════════════════════════════════════════════════════════════════════
// PÁGINA 4 — SELECCIÓN (Gerencia + Cargo)
// pasos/Seleccion.tsx
// ════════════════════════════════════════════════════════════════════════════
// Dos selectores en cascada + CTA "Iniciar Evaluación".
//   Gerencia = standardCategory (8 categorías)
//   Cargo    = filtrado por gerencia, con badge Verificado/Propuesto/Sin clasif.
// Auto-selección: primera gerencia con cargos verificados; luego primer cargo
// verificado de esa gerencia.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronDown, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SimulatorDescriptorListItem } from '@/app/api/descriptors/simulator-list/route'

interface SeleccionProps {
  descriptors: SimulatorDescriptorListItem[]
  onConfirm: (key: string) => void
  onBack: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  personas: 'Gerencia de Personas',
  comercial: 'Gerencia Comercial',
  marketing: 'Gerencia de Marketing',
  tecnologia: 'Gerencia de Tecnología',
  operaciones: 'Gerencia de Operaciones',
  finanzas: 'Gerencia de Finanzas',
  servicio: 'Gerencia de Servicio',
  legal: 'Gerencia Legal',
}

function categoryLabel(key: string | null): string {
  if (!key) return 'Sin gerencia'
  return CATEGORY_LABELS[key] ?? key
}

export default memo(function Seleccion({
  descriptors,
  onConfirm,
  onBack,
}: SeleccionProps) {
  // Lista de gerencias presentes (orden por # cargos desc)
  const gerencias = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of descriptors) {
      const cat = d.standardCategory ?? '__sin__'
      counts.set(cat, (counts.get(cat) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => ({ cat, count }))
  }, [descriptors])

  const [gerencia, setGerencia] = useState<string | null>(null)
  const [cargoKey, setCargoKey] = useState<string | null>(null)

  // Auto-selección: primera gerencia
  useEffect(() => {
    if (!gerencia && gerencias.length > 0) {
      setGerencia(gerencias[0].cat)
    }
  }, [gerencia, gerencias])

  // Cargos de la gerencia seleccionada
  const cargosDeGerencia = useMemo(() => {
    if (!gerencia) return []
    return descriptors.filter(
      d => (d.standardCategory ?? '__sin__') === gerencia,
    )
  }, [descriptors, gerencia])

  // Auto-selección: primer cargo verificado o el primero disponible
  useEffect(() => {
    if (cargosDeGerencia.length === 0) {
      setCargoKey(null)
      return
    }
    const isCurrentValid = cargosDeGerencia.some(c => c.key === cargoKey)
    if (isCurrentValid) return
    const preferred =
      cargosDeGerencia.find(c => c.kind === 'verified') ??
      cargosDeGerencia.find(c => c.kind === 'proposed') ??
      cargosDeGerencia[0]
    setCargoKey(preferred.key)
  }, [cargosDeGerencia, cargoKey])

  const selectedCargo = cargosDeGerencia.find(c => c.key === cargoKey) ?? null
  const canConfirm = selectedCargo !== null && selectedCargo.kind !== 'unmapped'

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 relative">
      {/* Línea Tesla */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
        }}
      />

      {/* Botón Volver */}
      <button
        type="button"
        onClick={onBack}
        className="absolute top-6 left-6 text-slate-500 hover:text-slate-400 text-[11px] flex items-center gap-1.5 transition-all"
      >
        <ChevronLeft className="w-3 h-3" />
        Volver
      </button>

      {/* Contexto */}
      <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-6">
        Selecciona el cargo a evaluar
      </span>

      <h2 className="text-2xl font-extralight text-white mb-10">
        ¿Qué{' '}
        <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
          cargo
        </span>{' '}
        quieres analizar?
      </h2>

      {/* Selector Gerencia */}
      <div className="w-full max-w-sm mb-4">
        <Selector
          label="Gerencia"
          value={gerencia ? categoryLabel(gerencia) : 'Selecciona…'}
          options={gerencias.map(g => ({
            id: g.cat,
            label: categoryLabel(g.cat),
            sublabel: `${g.count} ${g.count === 1 ? 'cargo' : 'cargos'}`,
          }))}
          onSelect={id => {
            setGerencia(id)
            setCargoKey(null)
          }}
          selectedId={gerencia}
        />
      </div>

      {/* Selector Cargo */}
      <div className="w-full max-w-sm mb-10">
        <Selector
          label="Cargo"
          value={selectedCargo ? selectedCargo.jobTitle : 'Selecciona…'}
          options={cargosDeGerencia.map(c => ({
            id: c.key,
            label: c.jobTitle,
            sublabel:
              c.kind === 'verified'
                ? `Verificado · ${c.employeeCount} pers.`
                : c.kind === 'proposed'
                  ? `Propuesto · ${c.employeeCount} pers.`
                  : `Sin clasificar · ${c.employeeCount} pers.`,
            badgeColor:
              c.kind === 'verified'
                ? 'cyan'
                : c.kind === 'proposed'
                  ? 'purple'
                  : 'slate',
            disabled: c.kind === 'unmapped',
          }))}
          onSelect={id => setCargoKey(id)}
          selectedId={cargoKey}
        />
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => cargoKey && canConfirm && onConfirm(cargoKey)}
        disabled={!canConfirm}
        className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-medium px-8 py-3 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none disabled:cursor-not-allowed"
      >
        Iniciar Evaluación
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// SELECTOR — dropdown elegante reusable
// ─────────────────────────────────────────────────────────────────────────────

interface SelectorOption {
  id: string
  label: string
  sublabel?: string
  badgeColor?: 'cyan' | 'purple' | 'slate'
  disabled?: boolean
}

function Selector({
  label,
  value,
  options,
  onSelect,
  selectedId,
}: {
  label: string
  value: string
  options: SelectorOption[]
  onSelect: (id: string) => void
  selectedId: string | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-700/50 text-sm font-light text-slate-200 hover:border-slate-600 transition-colors"
      >
        <div className="flex flex-col items-start min-w-0">
          <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500">
            {label}
          </span>
          <span className="truncate text-slate-200">{value}</span>
        </div>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-slate-500 flex-shrink-0 transition-transform',
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
          <div className="absolute top-full left-0 right-0 mt-1 z-40 max-h-[200px] overflow-y-auto rounded-lg bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl shadow-2xl">
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
                        'w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-light transition-colors',
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
                            'text-[9px] uppercase tracking-widest font-bold flex-shrink-0',
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
}
