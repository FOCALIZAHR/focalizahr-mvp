'use client'

// Selector cascada Familia → Cargo → Delta del Paso 2.
// Mobile-first: familias en grid 2x2, cargo dropdown, input numerico.
// Delta negativo tiene limite inferior = -headcount del cargo seleccionado.

import { useState, useMemo, useEffect } from 'react'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CargoDisponible {
  cargo: string
  acotadoGroup: string
  headcount: number
}

interface FamiliaCargoSelectorProps {
  cargosDisponibles: CargoDisponible[]
  onAgregar: (entry: { acotadoGroup: string; cargo: string; delta: number }) => void
}

const FAMILIAS: Array<{ value: string; label: string }> = [
  { value: 'alta_gerencia', label: 'Alta Gerencia' },
  { value: 'mandos_medios', label: 'Mandos Medios' },
  { value: 'profesionales', label: 'Profesionales' },
  { value: 'base_operativa', label: 'Base Operativa' },
]

export default function FamiliaCargoSelector({
  cargosDisponibles,
  onAgregar,
}: FamiliaCargoSelectorProps) {
  const [familia, setFamilia] = useState<string | null>(null)
  const [cargo, setCargo] = useState<string>('')
  const [delta, setDelta] = useState<number>(1)

  const cargosFiltrados = useMemo(
    () =>
      familia
        ? cargosDisponibles
            .filter(c => c.acotadoGroup === familia)
            .sort((a, b) => a.cargo.localeCompare(b.cargo))
        : [],
    [familia, cargosDisponibles],
  )

  // Headcount del cargo seleccionado — define el limite inferior del delta.
  const cargoSeleccionado = useMemo(
    () => cargosFiltrados.find(c => c.cargo === cargo) ?? null,
    [cargosFiltrados, cargo],
  )
  const headcountCargo = cargoSeleccionado?.headcount ?? 0
  const deltaMin = headcountCargo > 0 ? -headcountCargo : -1

  // Clamp reactivo si el cargo cambia y el delta queda fuera de rango.
  useEffect(() => {
    if (cargoSeleccionado && delta < deltaMin) {
      setDelta(deltaMin)
    }
  }, [cargoSeleccionado, delta, deltaMin])

  const handleDeltaChange = (raw: number) => {
    if (Number.isNaN(raw)) return
    if (cargoSeleccionado && raw < deltaMin) {
      setDelta(deltaMin)
      return
    }
    setDelta(raw)
  }

  const canSubmit = familia && cargo && delta !== 0

  const handleAgregar = () => {
    if (!canSubmit) return
    onAgregar({ acotadoGroup: familia!, cargo, delta })
    setCargo('')
    setDelta(1)
  }

  return (
    <div className="space-y-4">
      {/* NIVEL 1 — Familia */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
          Familia de cargo
        </label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {FAMILIAS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setFamilia(f.value)
                setCargo('')
              }}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-light border transition-all text-left',
                familia === f.value
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900/40 border-slate-700/50 text-slate-400 hover:border-slate-500',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* NIVEL 2 — Cargo */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
          Cargo
        </label>
        <select
          value={cargo}
          onChange={e => setCargo(e.target.value)}
          disabled={!familia}
          className={cn(
            'mt-2 w-full px-3 py-2 rounded-lg text-sm font-light',
            'bg-slate-900/40 border border-slate-700/50 text-slate-200',
            'focus:outline-none focus:border-cyan-500/40',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <option value="">
            {familia
              ? cargosFiltrados.length === 0
                ? 'Sin cargos disponibles en esta familia'
                : 'Seleccionar cargo...'
              : 'Elige una familia primero'}
          </option>
          {cargosFiltrados.map(c => (
            <option key={c.cargo} value={c.cargo}>
              {c.cargo} · {c.headcount}{' '}
              {c.headcount === 1 ? 'persona' : 'personas'}
            </option>
          ))}
        </select>
      </div>

      {/* NIVEL 3 — Delta */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
          Cambio de dotacion
        </label>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDeltaChange(delta - 1)}
            disabled={cargoSeleccionado !== null && delta <= deltaMin}
            className="w-9 h-9 rounded-lg bg-slate-900/40 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            value={delta}
            min={cargoSeleccionado ? deltaMin : undefined}
            onChange={e => handleDeltaChange(Number.parseInt(e.target.value, 10))}
            title={
              cargoSeleccionado && delta <= deltaMin
                ? `Maximo ${headcountCargo} salida${headcountCargo > 1 ? 's' : ''} disponible${headcountCargo > 1 ? 's' : ''} en este cargo`
                : undefined
            }
            className="flex-1 px-3 py-2 rounded-lg text-center text-lg font-light bg-slate-900/40 border border-slate-700/50 text-white focus:outline-none focus:border-cyan-500/40 tabular-nums"
          />
          <button
            type="button"
            onClick={() => handleDeltaChange(delta + 1)}
            className="w-9 h-9 rounded-lg bg-slate-900/40 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-slate-500 font-light mt-2">
          {cargoSeleccionado ? (
            <>
              Positivo agrega personas. Negativo retira — hasta{' '}
              <span className="text-slate-300 tabular-nums">{headcountCargo}</span>{' '}
              {headcountCargo === 1 ? 'salida disponible' : 'salidas disponibles'} en
              este cargo.
            </>
          ) : (
            'Positivo agrega personas. Negativo retira. El impacto mensual se calcula contra el salario efectivo del cargo.'
          )}
        </p>
        {cargoSeleccionado && delta <= deltaMin && (
          <span className="text-xs text-slate-500 mt-1 block">
            Limite alcanzado · {headcountCargo} persona
            {headcountCargo > 1 ? 's' : ''} en este cargo
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleAgregar}
        disabled={!canSubmit}
        className="fhr-btn fhr-btn-secondary w-full disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Agregar movimiento
      </button>
    </div>
  )
}
