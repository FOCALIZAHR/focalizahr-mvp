'use client'

// ════════════════════════════════════════════════════════════════════════════
// COSTADO CARGO SELECTOR — dropdowns compactos Gerencia + Cargo
// CostadoCargoSelector.tsx
// ════════════════════════════════════════════════════════════════════════════
// Permite al CEO cambiar de cargo sin salir del simulador (sin volver a P4).
// Vive dentro del Costado 30%. Dos pasos como en P4:
//   1. Gerencia (standardCategory)
//   2. Cargo (filtrado por gerencia seleccionada)
//
// Diseño compact=true para caber en 220-280px de ancho.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useEffect, useMemo, useState } from 'react'
import Selector from './atomos/Selector'
import { toTitleCase } from '@/lib/utils/formatName'
import type { SimulatorDescriptorListItem } from '@/app/api/descriptors/simulator-list/route'

const CATEGORY_LABELS: Record<string, string> = {
  personas: 'G. Personas',
  comercial: 'G. Comercial',
  marketing: 'G. Marketing',
  tecnologia: 'G. Tecnología',
  operaciones: 'G. Operaciones',
  finanzas: 'G. Finanzas',
  servicio: 'G. Servicio',
  legal: 'G. Legal',
}

function categoryLabel(key: string | null): string {
  if (!key || key === '__sin__') return 'Sin clasificar'
  return CATEGORY_LABELS[key] ?? toTitleCase(key)
}

/** Cargos vienen del backend en ALL CAPS. Title case humano para UI. */
function formatCargo(jobTitle: string): string {
  return toTitleCase(jobTitle)
}

interface CostadoCargoSelectorProps {
  descriptors: SimulatorDescriptorListItem[]
  selectedKey: string | null
  onChange: (key: string) => void
}

export default memo(function CostadoCargoSelector({
  descriptors,
  selectedKey,
  onChange,
}: CostadoCargoSelectorProps) {
  // Derivar gerencia actual del cargo seleccionado
  const selectedCargo = descriptors.find(d => d.key === selectedKey) ?? null
  const currentGerencia = selectedCargo?.standardCategory ?? '__sin__'

  const [gerencia, setGerencia] = useState<string>(currentGerencia)

  // Si cambia el cargo seleccionado externamente, re-sincronizar gerencia
  useEffect(() => {
    if (selectedCargo) {
      setGerencia(selectedCargo.standardCategory ?? '__sin__')
    }
  }, [selectedCargo])

  // Gerencias disponibles
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

  // Mostrar dropdown gerencia SOLO si hay diversidad real (≥2 gerencias).
  // Una sola gerencia (sea "__sin__" o real) → ruido inútil, ocultamos.
  const showGerenciaDropdown = gerencias.length > 1

  // Cargos: si oculto gerencia, lista completa. Si no, filtrados por gerencia actual.
  const cargosDeGerencia = useMemo(() => {
    if (!showGerenciaDropdown) return descriptors
    return descriptors.filter(
      d => (d.standardCategory ?? '__sin__') === gerencia,
    )
  }, [descriptors, gerencia, showGerenciaDropdown])

  const handleGerenciaChange = (newCat: string) => {
    setGerencia(newCat)
    // Auto-elegir primer cargo de la nueva gerencia
    const list = descriptors.filter(
      d => (d.standardCategory ?? '__sin__') === newCat,
    )
    const preferred =
      list.find(c => c.kind === 'verified') ??
      list.find(c => c.kind === 'proposed') ??
      list[0]
    if (preferred) onChange(preferred.key)
  }

  return (
    <div className="space-y-2 mb-4">
      {showGerenciaDropdown && (
        <Selector
          label="Gerencia"
          value={categoryLabel(gerencia)}
          options={gerencias.map(g => ({
            id: g.cat,
            label: categoryLabel(g.cat),
            sublabel: `${g.count}`,
          }))}
          onSelect={handleGerenciaChange}
          selectedId={gerencia}
          compact
        />
      )}
      <Selector
        label="Cargo"
        value={selectedCargo ? formatCargo(selectedCargo.jobTitle) : 'Selecciona…'}
        valueClassName="text-cyan-300"
        options={cargosDeGerencia.map(c => ({
          id: c.key,
          label: formatCargo(c.jobTitle),
          sublabel:
            c.kind === 'verified' ? 'Verif.' :
            c.kind === 'proposed' ? 'Prop.' : 'S/C',
          badgeColor:
            c.kind === 'verified' ? 'cyan' :
            c.kind === 'proposed' ? 'purple' : 'slate',
          disabled: c.kind === 'unmapped',
        }))}
        onSelect={id => onChange(id)}
        selectedId={selectedKey}
        compact
      />
    </div>
  )
})
