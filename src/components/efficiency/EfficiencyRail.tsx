// ════════════════════════════════════════════════════════════════════════════
// EFFICIENCY RAIL — 3 tabs underline por familia (sin pills)
// src/components/efficiency/EfficiencyRail.tsx
// ════════════════════════════════════════════════════════════════════════════
// Minimalista: solo número de familia + nombre + subtítulo dramático.
// Sin pills, sin métricas inline, sin bordes agresivos.
// La familia activa tiene línea inferior cyan 1px. Las visitadas llevan
// un dot sutil. Las no visitadas quedan en slate-500.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import type { FamiliaId } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// METADATA DE FAMILIAS
// ════════════════════════════════════════════════════════════════════════════

interface FamiliaMeta {
  id: FamiliaId
  numero: '01' | '02' | '03'
  header: string
  subtitulo: string
  accent: string
}

const FAMILIAS_UI: FamiliaMeta[] = [
  {
    id: 'choque_tecnologico',
    numero: '01',
    header: 'DIAGNÓSTICO',
    subtitulo: 'Choque Tecnológico',
    accent: '#22D3EE',
  },
  {
    id: 'grasa_organizacional',
    numero: '02',
    header: 'OPORTUNIDAD',
    subtitulo: 'Grasa Organizacional',
    accent: '#A78BFA',
  },
  {
    id: 'riesgo_financiero',
    numero: '03',
    header: 'PROTECCIÓN',
    subtitulo: 'Riesgo Financiero',
    accent: '#F59E0B',
  },
]

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface EfficiencyRailProps {
  activeFamiliaId: FamiliaId | null
  familiasVisitadas: Set<FamiliaId>
  onSelect: (familia: FamiliaId) => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function EfficiencyRail({
  activeFamiliaId,
  familiasVisitadas,
  onSelect,
}: EfficiencyRailProps) {
  return (
    <nav
      aria-label="Familias de diagnóstico"
      className="flex items-center gap-5 md:gap-8 overflow-x-auto scrollbar-hide"
    >
      {FAMILIAS_UI.map(familia => {
        const isActive = activeFamiliaId === familia.id
        const isVisited = familiasVisitadas.has(familia.id)

        return (
          <button
            key={familia.id}
            onClick={() => onSelect(familia.id)}
            className="group relative flex items-center gap-1.5 flex-shrink-0 py-2 transition-colors"
            title={familia.subtitulo}
          >
            <span
              className="text-[10px] font-light tabular-nums tracking-widest transition-colors"
              style={{
                color: isActive ? familia.accent : '#64748B',
              }}
            >
              {familia.numero}
            </span>
            <span
              className="text-[11px] uppercase tracking-[0.18em] font-medium transition-colors whitespace-nowrap"
              style={{
                color: isActive
                  ? '#FFFFFF'
                  : isVisited
                  ? '#CBD5E1'
                  : '#64748B',
              }}
            >
              {familia.header}
            </span>
            {isVisited && !isActive && (
              <span
                className="w-1 h-1 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: familia.accent,
                  opacity: 0.5,
                }}
                aria-hidden
              />
            )}

            {/* Underline cyan 1px cuando activo */}
            {isActive && (
              <div
                className="absolute bottom-0 left-0 right-0 h-[1px]"
                style={{
                  background: familia.accent,
                  boxShadow: `0 0 8px ${familia.accent}80`,
                }}
                aria-hidden
              />
            )}

            {/* Underline gris sutil en hover cuando NO activo */}
            {!isActive && (
              <div
                className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity bg-slate-600"
                aria-hidden
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
