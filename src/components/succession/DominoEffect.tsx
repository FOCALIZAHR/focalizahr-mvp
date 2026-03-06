'use client'

import { ArrowDown, User, AlertCircle } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// DOMINO EFFECT COMPONENT
// Muestra vacantes en cascada al promover un sucesor
// ════════════════════════════════════════════════════════════════════════════

interface DominoNode {
  positionTitle: string
  employeeName: string
  department?: string
  action: 'PROMOTE' | 'VACANT' | 'EXTERNAL_HIRE'
}

interface DominoEffectProps {
  chain: DominoNode[]
  candidateName: string
  targetPosition: string
}

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PROMOTE: { label: 'Promover', color: 'text-emerald-400', bg: 'border-emerald-500/30' },
  VACANT: { label: 'Vacante', color: 'text-amber-400', bg: 'border-amber-500/30' },
  EXTERNAL_HIRE: { label: 'Contratacion externa', color: 'text-blue-400', bg: 'border-blue-500/30' },
}

export default function DominoEffect({ chain, candidateName, targetPosition }: DominoEffectProps) {
  if (chain.length === 0) return null

  return (
    <div className="space-y-1">
      <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">
        Efecto Domino al promover a {candidateName}
      </h4>

      {/* Target position (the one being filled) */}
      <div className={`p-3 rounded-lg border ${ACTION_CONFIG.PROMOTE.bg} bg-slate-800/40`}>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-200 font-medium text-sm">{targetPosition}</span>
        </div>
        <div className="text-xs text-emerald-400 mt-1">
          ← {candidateName} asume el cargo
        </div>
      </div>

      {/* Chain of domino effects */}
      {chain.map((node, idx) => {
        const config = ACTION_CONFIG[node.action] || ACTION_CONFIG.VACANT
        return (
          <div key={idx}>
            {/* Arrow connector */}
            <div className="flex justify-center py-1">
              <ArrowDown className="w-4 h-4 text-slate-600" />
            </div>

            {/* Node card */}
            <div className={`p-3 rounded-lg border ${config.bg} bg-slate-800/40`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-200 text-sm font-medium">{node.positionTitle}</span>
                  {node.department && (
                    <span className="text-xs text-slate-500 ml-2">{node.department}</span>
                  )}
                </div>
                <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {node.action === 'VACANT' ? (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    {node.employeeName} deja esta posicion
                  </span>
                ) : node.action === 'PROMOTE' ? (
                  <span>{node.employeeName} asciende a este cargo</span>
                ) : (
                  <span>Requiere busqueda externa</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
