// ════════════════════════════════════════════════════════════════════════════
// EFFICIENCY RAIL — Navegación horizontal de 6 lentes agrupados por familia
// src/components/efficiency/EfficiencyRail.tsx
// ════════════════════════════════════════════════════════════════════════════
// Naming combinado (ID corto + subtítulo dramático):
//   Header pill:     "DIAGNÓSTICO"
//   Subtítulo:       "Diagnóstico · Choque Tecnológico"
//
// Estados:
//  · active   → borde + Tesla line + glow
//  · visited  → dot indicator
//  · pending  → neutro
//  · nodata   → opacidad reducida + label "sin señales"
// ════════════════════════════════════════════════════════════════════════════

'use client'

import type { LenteId, FamiliaId } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import type { LenteAPI } from '@/hooks/useEfficiencyWorkspace'

// ════════════════════════════════════════════════════════════════════════════
// METADATA DE FAMILIAS (naming combinado)
// ════════════════════════════════════════════════════════════════════════════

interface FamiliaMeta {
  id: FamiliaId
  header: string         // ID corto uppercase
  subtitulo: string      // narrativo dramático
  accent: string
  glow: string
  lentes: LenteId[]
}

const FAMILIAS_UI: FamiliaMeta[] = [
  {
    id: 'choque_tecnologico',
    header: 'DIAGNÓSTICO',
    subtitulo: 'Choque Tecnológico',
    accent: '#22D3EE',
    glow: 'rgba(34, 211, 238, 0.35)',
    lentes: ['l1_inercia', 'l2_zombie'],
  },
  {
    id: 'grasa_organizacional',
    header: 'OPORTUNIDAD',
    subtitulo: 'Grasa Organizacional',
    accent: '#A78BFA',
    glow: 'rgba(167, 139, 250, 0.35)',
    lentes: ['l4_fantasma', 'l5_brecha'],
  },
  {
    id: 'riesgo_financiero',
    header: 'PROTECCIÓN',
    subtitulo: 'Riesgo Financiero',
    accent: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.35)',
    lentes: ['l7_fuga', 'l9_pasivo'],
  },
]

// Naming de lentes en el rail (override de LENTES_META para L7 fusionado)
const LENTE_RAIL_TITULO: Record<LenteId, string> = {
  l1_inercia: 'Costo Inercia',
  l2_zombie: 'Talento Zombie',
  l3_adopcion: 'Riesgo Adopción', // no se muestra en rail (guardarraíl)
  l4_fantasma: 'Cargos Fantasma',
  l5_brecha: 'Brecha Productividad',
  l6_seniority: 'Compresión Seniority', // congelado — no en rail
  l7_fuga: 'Mapa de Talento', // L7+L8 fusionados
  l8_retencion: 'Prioridad Retención', // no en rail (fusionado en L7)
  l9_pasivo: 'Pasivo Laboral',
}

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface EfficiencyRailProps {
  activeLenteId: LenteId
  onSelect: (id: LenteId) => void
  lentesVisitados: Set<LenteId>
  lentes: Record<LenteId, LenteAPI>
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function EfficiencyRail({
  activeLenteId,
  onSelect,
  lentesVisitados,
  lentes,
}: EfficiencyRailProps) {
  return (
    <nav
      aria-label="Navegación de lentes"
      className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
    >
      <div className="flex items-stretch gap-0 min-w-max px-4 md:px-8">
        {FAMILIAS_UI.map((familia, idx) => (
          <div key={familia.id} className="flex items-stretch">
            {/* Separador vertical entre familias */}
            {idx > 0 && (
              <div
                className="w-px mx-3 md:mx-4 self-stretch"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent, #334155, transparent)',
                }}
                aria-hidden
              />
            )}

            {/* Header de familia */}
            <div className="flex flex-col justify-center pr-4 md:pr-6 flex-shrink-0">
              <p
                className="text-[9px] uppercase tracking-[0.15em] font-medium leading-tight"
                style={{ color: familia.accent }}
              >
                {familia.header}
              </p>
              <p className="text-[10px] text-slate-500 font-light leading-tight mt-0.5">
                {familia.subtitulo}
              </p>
            </div>

            {/* Pills de lentes de esta familia */}
            <div className="flex gap-2">
              {familia.lentes.map(lenteId => {
                const lente = lentes[lenteId]
                const isActive = activeLenteId === lenteId
                const isVisited = lentesVisitados.has(lenteId)
                const hayData = lente?.hayData ?? false

                return (
                  <button
                    key={lenteId}
                    onClick={() => onSelect(lenteId)}
                    className={`relative flex-shrink-0 text-left px-4 py-2.5 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-slate-800/80 border-slate-600'
                        : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700 hover:bg-slate-800/50'
                    } ${!hayData ? 'opacity-60' : ''}`}
                    style={
                      isActive
                        ? {
                            borderColor: familia.accent,
                            boxShadow: `0 0 18px ${familia.glow}`,
                          }
                        : undefined
                    }
                  >
                    {/* Tesla line — solo cuando activo */}
                    {isActive && (
                      <div
                        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-lg"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${familia.accent}, transparent)`,
                        }}
                        aria-hidden
                      />
                    )}

                    <div className="flex items-center gap-2">
                      {/* Dot visitado */}
                      {isVisited && !isActive && (
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: familia.accent, opacity: 0.6 }}
                          aria-hidden
                        />
                      )}

                      <span
                        className={`text-xs font-medium whitespace-nowrap ${
                          isActive ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {LENTE_RAIL_TITULO[lenteId]}
                      </span>

                      {/* Métrica mini — número del hero metric del lente */}
                      {hayData && (
                        <span
                          className={`text-[10px] font-light ${
                            isActive ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {getMiniMetric(lenteId, lente.datos)}
                        </span>
                      )}
                    </div>

                    {!hayData && (
                      <span className="block text-[9px] text-slate-500 font-light mt-0.5">
                        sin señales
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MINI MÉTRICA POR LENTE — número pequeño a la derecha del título
// ════════════════════════════════════════════════════════════════════════════

function getMiniMetric(lenteId: LenteId, datos: Record<string, string>): string {
  switch (lenteId) {
    case 'l1_inercia':
      return datos.CLP_MES ?? ''
    case 'l2_zombie':
      return datos.N_PERSONAS ? `· ${datos.N_PERSONAS}` : ''
    case 'l4_fantasma':
      return datos.N_PARES ? `· ${datos.N_PARES}` : ''
    case 'l5_brecha':
      return datos.CLP_MES ?? ''
    case 'l7_fuga':
      return datos.N_PERSONAS ? `· ${datos.N_PERSONAS}` : ''
    case 'l9_pasivo':
      return datos.CLP_FINIQUITOS ?? ''
    default:
      return ''
  }
}
