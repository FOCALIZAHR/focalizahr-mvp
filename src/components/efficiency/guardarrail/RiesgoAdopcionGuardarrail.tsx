// ════════════════════════════════════════════════════════════════════════════
// RIESGO ADOPCIÓN GUARDARRAÍL — Pantalla pre-Hub (L3 no es lente, es contexto)
// src/components/efficiency/guardarrail/RiesgoAdopcionGuardarrail.tsx
// ════════════════════════════════════════════════════════════════════════════
// Aparece ANTES de entrar al Hub cuando hay gerencias con clima crítico +
// alta exposición IA. El CEO ve qué gerencias quedan excluidas del plan
// y puede incluirlas manualmente (queda documentado).
//
// Narrativa McKinsey (skill focalizahr-narrativas):
//   "Comprar licencias aquí es quemar dinero. La tecnología no resuelve
//    la falta de liderazgo. La amplifica."
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface GerenciaCritica {
  departmentId: string
  departmentName: string
  climaScale5: number
  pctPotencial: number
  usandoFallback: boolean
}

interface RiesgoAdopcionGuardarrailProps {
  gerenciasCriticas: GerenciaCritica[]
  gerenciasExcluidas: Set<string>
  onToggleExclusion: (departmentId: string) => void
  onAccept: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function RiesgoAdopcionGuardarrail({
  gerenciasCriticas,
  gerenciasExcluidas,
  onToggleExclusion,
  onAccept,
}: RiesgoAdopcionGuardarrailProps) {
  const totalCriticas = gerenciasCriticas.length
  const incluidasManualmente = gerenciasCriticas.filter(
    g => !gerenciasExcluidas.has(g.departmentId)
  ).length

  return (
    <div className="fhr-bg-main min-h-screen flex items-center justify-center px-4 md:px-8 py-12">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              boxShadow: '0 0 24px rgba(239, 68, 68, 0.2)',
            }}
          >
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-red-400 font-medium">
              Antes de entrar al hub · Guardarraíl
            </p>
            <h1 className="text-2xl md:text-3xl font-extralight text-white leading-tight mt-1">
              Hay {totalCriticas === 1 ? 'una gerencia' : `${totalCriticas} gerencias`}{' '}
              <span className="fhr-title-gradient">donde invertir en IA es quemar dinero</span>.
            </h1>
          </div>
        </div>

        {/* Narrativa ejecutiva */}
        <div className="fhr-card p-6 md:p-8 mb-6 space-y-4">
          <p className="text-base text-slate-200 font-light leading-relaxed">
            El clima organizacional está en su punto más bajo justo donde la
            exposición a la nueva tecnología es más alta. La tecnología no
            resuelve la falta de liderazgo.{' '}
            <span className="text-white font-medium">La amplifica.</span>
          </p>
          <p className="text-sm text-slate-400 font-light leading-relaxed">
            Estas gerencias quedan excluidas del plan por defecto. Cualquier
            decisión de automatización en estas áreas es inversión en riesgo
            hasta que se intervenga el clima primero. Puedes incluirlas
            manualmente — quedará documentado en el plan.
          </p>
        </div>

        {/* Lista de gerencias críticas */}
        <div className="space-y-3 mb-8">
          {gerenciasCriticas.map(g => {
            const excluida = gerenciasExcluidas.has(g.departmentId)
            return (
              <div
                key={g.departmentId || g.departmentName}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  excluida
                    ? 'bg-slate-900/60 border-slate-800/70'
                    : 'bg-amber-500/5 border-amber-500/40'
                }`}
              >
                {/* Toggle checkbox */}
                <label className="flex-shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excluida}
                    onChange={() => onToggleExclusion(g.departmentId)}
                    className="sr-only peer"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      excluida
                        ? 'bg-red-500/80 border-red-400'
                        : 'bg-transparent border-slate-600'
                    }`}
                  >
                    {excluida && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </label>

                {/* Info gerencia */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white">
                      {g.departmentName}
                    </p>
                    {g.usandoFallback && (
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-light italic">
                        · señal estimada
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-400 font-light">
                    <span>
                      Clima{' '}
                      <span className="text-red-300 font-medium">
                        {g.climaScale5.toFixed(1)}/5
                      </span>
                    </span>
                    {g.pctPotencial > 0 && (
                      <span>
                        Potencial de ahorro{' '}
                        <span className="text-amber-300 font-medium">
                          {Math.round(g.pctPotencial)}%
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Estado visual */}
                <div className="flex-shrink-0 text-right">
                  {excluida ? (
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-light">
                      Excluida
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider text-amber-300 font-medium inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Incluida manual
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary + CTA */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-slate-400 font-light">
            {incluidasManualmente === 0 ? (
              <>
                Las {totalCriticas} gerencias quedarán excluidas del plan.
                Puedes revisarlas más tarde desde el Hub.
              </>
            ) : (
              <>
                {incluidasManualmente} gerencia{incluidasManualmente === 1 ? '' : 's'}{' '}
                incluida{incluidasManualmente === 1 ? '' : 's'} manualmente —
                quedará documentado en el plan.
              </>
            )}
          </p>
          <button
            onClick={onAccept}
            className="inline-flex items-center gap-2 text-sm font-medium px-6 py-3 rounded-lg border border-cyan-400/50 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-200 hover:text-white hover:border-cyan-300 hover:from-cyan-500/30 hover:to-purple-500/30 transition-all"
            style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.25)' }}
          >
            Entendido, continuar al Hub
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
