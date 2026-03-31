'use client'

// ════════════════════════════════════════════════════════════════════════════
// P&L TALENT CRITICAL ROLES MODAL — Matriz de Continuidad Operacional
// src/app/dashboard/executive-hub/components/PLTalent/components/PLTalentCriticalRolesModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Matriz 2×2: Rendimiento × Sucesión
// Click en cuadrante → expande lista de personas
// CTA → navega al SuccessionPanel para detalle completo
// Datos: riskProfiles filtrados (zero fetch)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Shield, ShieldOff, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExecutiveRiskPayload } from '@/lib/services/TalentRiskOrchestrator'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface PLTalentCriticalRolesModalProps {
  isOpen: boolean
  onClose: () => void
  riskProfiles: ExecutiveRiskPayload[]
  pctCriticos: number
  avgFitCriticos: number
}

type Quadrant = 'D' | 'C' | 'B' | 'A'

interface QuadrantConfig {
  key: Quadrant
  label: string
  description: string
  dotColor: string
  textColor: string
  tooltip: string
  gaugeColor: string      // Color del gauge en detalle expandido
  gaugeTextColor: string  // Color del texto % en detalle expandido
}

const QUADRANTS: QuadrantConfig[] = [
  { key: 'D', label: 'Urgencia', description: 'Bajo estándar, sin sucesor', dotColor: 'bg-red-400', textColor: 'text-red-400', tooltip: 'No rinden y no tienen reemplazo. Si salen, no hay respuesta preparada para proteger la operación.', gaugeColor: 'bg-amber-400', gaugeTextColor: 'text-amber-400' },
  { key: 'C', label: 'Recambio posible', description: 'Bajo estándar, con sucesor', dotColor: 'bg-amber-400', textColor: 'text-amber-400', tooltip: 'No rinden, pero tienen sucesor listo. El recambio es posible apenas lo decidas.', gaugeColor: 'bg-amber-400', gaugeTextColor: 'text-amber-400' },
  { key: 'B', label: 'Vulnerable', description: 'Rinde, sin sucesor', dotColor: 'bg-purple-400', textColor: 'text-purple-400', tooltip: 'Rinden, pero si salen no hay reemplazo inmediato. Vulnerabilidad oculta de dependencia.', gaugeColor: 'bg-cyan-400', gaugeTextColor: 'text-cyan-400' },
  { key: 'A', label: 'Protegido', description: 'Rinde, con sucesor', dotColor: 'bg-emerald-400', textColor: 'text-emerald-400', tooltip: 'Rinden y tienen sucesor listo. La continuidad del negocio tiene respaldo real.', gaugeColor: 'bg-cyan-400', gaugeTextColor: 'text-cyan-400' },
]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function PLTalentCriticalRolesModal({
  isOpen,
  onClose,
  riskProfiles,
  pctCriticos,
  avgFitCriticos,
}: PLTalentCriticalRolesModalProps) {

  const [expandedQuadrant, setExpandedQuadrant] = useState<Quadrant | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  const toggleQuadrant = useCallback((q: Quadrant) => {
    const next = expandedQuadrant === q ? null : q
    setExpandedQuadrant(next)
    if (next) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 50)
    }
  }, [expandedQuadrant])

  if (!isOpen || typeof document === 'undefined') return null

  const critical = riskProfiles.filter(p => p.data.isIncumbentOfCriticalPosition)

  // Clasificar en 4 cuadrantes
  const grouped: Record<Quadrant, ExecutiveRiskPayload[]> = {
    D: critical.filter(p => p.data.roleFitScore < 75 && !p.data.hasSuccessor),
    C: critical.filter(p => p.data.roleFitScore < 75 && p.data.hasSuccessor),
    B: critical.filter(p => p.data.roleFitScore >= 75 && !p.data.hasSuccessor),
    A: critical.filter(p => p.data.roleFitScore >= 75 && p.data.hasSuccessor),
  }

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto overflow-x-hidden">
          <div className="fhr-top-line" />

          {/* Header */}
          <div className="text-center pt-8 pb-4 px-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors z-10">
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <h1 className="text-2xl md:text-3xl font-extralight text-white tracking-tight">
              Continuidad
            </h1>
            <h1 className="text-2xl md:text-3xl font-extralight tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Operacional
            </h1>

            <div className="flex items-center justify-center gap-3 my-5">
              <div className="h-px w-12 bg-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="h-px w-12 bg-white/20" />
            </div>

            <p className="text-xs text-slate-500">
              {critical.length} cargos críticos · Rendimiento × Sucesión
            </p>
          </div>

          {/* Hero — % ancla del acto */}
          <div className="text-center pb-6 px-6">
            <p className="text-4xl font-extralight text-amber-400 tracking-tight">
              {pctCriticos}%
            </p>
            <p className="text-sm text-slate-500 mt-1">
              bajo el estándar
            </p>
            <p className="text-xs text-slate-600 mt-1">
              RoleFit promedio: {avgFitCriticos}%
            </p>
          </div>

          {/* Matriz 2×2 visual */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 gap-px bg-slate-800/50 rounded-xl overflow-hidden">
              {/* Headers de columna */}
              <div className="col-span-2 grid grid-cols-[auto_1fr_1fr]">
                <div className="w-24" />
                <p className="text-[9px] uppercase tracking-widest text-slate-500 text-center py-2">Sin sucesor</p>
                <p className="text-[9px] uppercase tracking-widest text-slate-500 text-center py-2">Con sucesor</p>
              </div>
            </div>

            <div className="grid grid-cols-[auto_1fr_1fr] gap-px bg-slate-800/30 rounded-xl mt-px">
              {/* Fila 1: Bajo estándar */}
              <div className="bg-slate-900 flex items-center px-3 py-1">
                <p className="text-[9px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Bajo estándar</p>
              </div>
              <MatrixCell
                quadrant="D"
                count={grouped.D.length}
                config={QUADRANTS[0]}
                isExpanded={expandedQuadrant === 'D'}
                onClick={() => toggleQuadrant('D')}
              />
              <MatrixCell
                quadrant="C"
                count={grouped.C.length}
                config={QUADRANTS[1]}
                isExpanded={expandedQuadrant === 'C'}
                onClick={() => toggleQuadrant('C')}
              />

              {/* Fila 2: Rinde */}
              <div className="bg-slate-900 flex items-center px-3 py-1">
                <p className="text-[9px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Rinde</p>
              </div>
              <MatrixCell
                quadrant="B"
                count={grouped.B.length}
                config={QUADRANTS[2]}
                isExpanded={expandedQuadrant === 'B'}
                onClick={() => toggleQuadrant('B')}
              />
              <MatrixCell
                quadrant="A"
                count={grouped.A.length}
                config={QUADRANTS[3]}
                isExpanded={expandedQuadrant === 'A'}
                onClick={() => toggleQuadrant('A')}
              />
            </div>
          </div>

          {/* Detalle expandido del cuadrante seleccionado */}
          {expandedQuadrant && grouped[expandedQuadrant].length > 0 && (
            <div ref={detailRef} className="px-6 pb-6">
              <div className="pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-2 mb-4">
                  <span className={cn('w-2 h-2 rounded-full', QUADRANTS.find(q => q.key === expandedQuadrant)?.dotColor)} />
                  <p className="text-xs font-medium text-slate-300">
                    {QUADRANTS.find(q => q.key === expandedQuadrant)?.label}
                  </p>
                  <p className="text-xs text-slate-500">
                    — {QUADRANTS.find(q => q.key === expandedQuadrant)?.description}
                  </p>
                </div>

                <div>
                  {grouped[expandedQuadrant].map(p => {
                    const qConfig = QUADRANTS.find(q => q.key === expandedQuadrant)!
                    return (
                    <div key={p.data.employeeId} className="flex items-center gap-4 py-3 border-b border-slate-800/30 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-light text-slate-200 truncate">
                          {p.data.employeeName}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {p.data.criticalPositionTitle || p.data.position} · {p.data.departmentName}
                        </p>
                      </div>

                      {/* Gauge capacidad — color contextual por cuadrante */}
                      <div className="flex-shrink-0 w-20 group relative">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', qConfig.gaugeColor)}
                              style={{ width: `${p.data.roleFitScore}%` }}
                            />
                          </div>
                          <span className={cn('text-xs font-mono font-medium w-8 text-right', qConfig.gaugeTextColor)}>
                            {p.data.roleFitScore}%
                          </span>
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                          <p className="text-[10px] text-slate-300">RoleFit: {p.data.roleFitScore}% · Estándar: 75%</p>
                        </div>
                      </div>

                      {/* Indicador sucesor */}
                      <div className="flex-shrink-0 w-8 flex justify-center">
                        {p.data.hasSuccessor ? (
                          <Shield className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
                        ) : (
                          <ShieldOff className="w-4 h-4 text-red-400/60" strokeWidth={1.5} />
                        )}
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Leyenda + CTA */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-center gap-4 text-[9px] text-slate-500 mb-4">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" strokeWidth={1.5} />
                Sucesor listo
              </span>
              <span className="flex items-center gap-1">
                <ShieldOff className="w-3 h-3 text-red-400/60" strokeWidth={1.5} />
                Sin sucesor
              </span>
            </div>

            <p className="text-xs text-slate-500 text-center">
              {grouped.D.length + grouped.C.length} bajo estándar · {grouped.D.length + grouped.B.length} sin sucesor
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
})

// ════════════════════════════════════════════════════════════════════════════
// MATRIX CELL
// ════════════════════════════════════════════════════════════════════════════

function MatrixCell({
  quadrant,
  count,
  config,
  isExpanded,
  onClick,
}: {
  quadrant: Quadrant
  count: number
  config: QuadrantConfig
  isExpanded: boolean
  onClick: () => void
}) {
  const isUrgencia = quadrant === 'D'

  return (
    <button
      onClick={onClick}
      disabled={count === 0}
      className={cn(
        'bg-slate-900 py-4 flex flex-col items-center justify-center transition-all relative group',
        isUrgencia && count > 0 && 'border-t-2 border-red-400/50',
        count > 0 ? 'hover:bg-slate-800/80 cursor-pointer' : 'opacity-40 cursor-default',
        isExpanded && 'ring-1 ring-slate-600'
      )}
    >
      {/* Dot pulsante — solo celda D con personas */}
      {isUrgencia && count > 0 && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
        </span>
      )}

      <p className={cn('text-2xl font-mono font-medium', count > 0 ? config.textColor : 'text-slate-600')}>
        {count}
      </p>
      <p className="text-[9px] text-slate-500 mt-1">{config.label}</p>
      {count > 0 && (
        <ChevronDown className={cn('w-3 h-3 text-slate-600 mt-1 transition-transform', isExpanded && 'rotate-180')} />
      )}

      {/* Tooltip Motor 4 narrative */}
      {count > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-52 text-left">
          <p className={cn('text-[10px] font-medium mb-1', config.textColor)}>{config.label}</p>
          <p className="text-[10px] text-slate-400 leading-relaxed">{config.tooltip}</p>
        </div>
      )}
    </button>
  )
}
