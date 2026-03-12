'use client'

import { motion } from 'framer-motion'

// ════════════════════════════════════════════════════════════════════════════
// DOMINO EFFECT — Cascade Narrative
// Narra el impacto post-nominación como historia vertical cinematográfica
// ════════════════════════════════════════════════════════════════════════════

interface DominoNode {
  positionTitle: string
  employeeName: string
  department?: string
  action: 'PROMOTE' | 'COVERED' | 'VACANT' | 'EXTERNAL_HIRE'
}

interface DominoEffectProps {
  chain: DominoNode[]
  candidateName: string
  targetPosition: string
}

const ACTION_CONFIG = {
  PROMOTE: {
    label: 'Asume el cargo',
    sublabel: (name: string) => `${name} asume el cargo`,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/5 border-cyan-500/20',
    tesla: '#22D3EE',
    badge: '✅ Resuelta',
    badgeColor: 'text-cyan-400',
  },
  COVERED: {
    label: 'Cubierta',
    sublabel: (name: string) => `${name} disponible`,
    color: 'text-amber-400',
    bg: 'bg-amber-500/5 border-amber-500/20',
    tesla: '#F59E0B',
    badge: '⚠️ Cubierta',
    badgeColor: 'text-amber-400',
  },
  VACANT: {
    label: 'Posición vacante',
    sublabel: () => 'Sin candidatos disponibles',
    color: 'text-rose-400',
    bg: 'bg-rose-500/5 border-rose-500/20',
    tesla: '#FB7185',
    badge: '🔴 Vacante',
    badgeColor: 'text-rose-400',
  },
  EXTERNAL_HIRE: {
    label: 'Búsqueda externa',
    sublabel: () => 'Se cubre con contratación externa',
    color: 'text-slate-400',
    bg: 'bg-slate-500/5 border-slate-700/30',
    tesla: '#64748B',
    badge: '◻️ Externa',
    badgeColor: 'text-slate-400',
  },
} as const

export default function DominoEffect({ chain, candidateName, targetPosition }: DominoEffectProps) {
  if (chain.length === 0) return null

  const promoteConfig = ACTION_CONFIG.PROMOTE

  return (
    <div className="space-y-0">
      {/* Header narrativo */}
      <p className="text-xs text-slate-300 font-light mb-4">
        Al nominar a{' '}
        <span className="text-cyan-400 font-medium">{candidateName}</span>
        ...
      </p>

      {/* Nodo 0 — cargo destino (siempre PROMOTE) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0, duration: 0.3 }}
        className={`relative rounded-xl border ${promoteConfig.bg} backdrop-blur-sm p-3 overflow-hidden`}
      >
        <div
          className="absolute top-0 inset-x-0 h-[1px]"
          style={{ background: `linear-gradient(90deg, transparent, ${promoteConfig.tesla}, transparent)` }}
        />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-200 font-medium">{targetPosition}</p>
            <p className={`text-xs mt-0.5 ${promoteConfig.color}`}>
              {promoteConfig.sublabel(candidateName)}
            </p>
          </div>
          <span className={`text-[10px] font-medium ${promoteConfig.badgeColor}`}>
            {promoteConfig.badge}
          </span>
        </div>
      </motion.div>

      {/* Chain of domino effects */}
      {chain.map((node, idx) => {
        const config = ACTION_CONFIG[node.action] || ACTION_CONFIG.VACANT
        return (
          <div key={idx}>
            {/* Conector vertical animado */}
            <div className="flex justify-center py-1">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: idx * 0.12 + 0.1, duration: 0.2 }}
                className="w-[1px] h-5 bg-gradient-to-b from-slate-600 to-transparent"
                style={{ originY: 0 }}
              />
            </div>

            {/* Node card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx + 1) * 0.12, duration: 0.3 }}
              className={`relative rounded-xl border ${config.bg} backdrop-blur-sm p-3 overflow-hidden`}
            >
              <div
                className="absolute top-0 inset-x-0 h-[1px]"
                style={{ background: `linear-gradient(90deg, transparent, ${config.tesla}, transparent)` }}
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-200 font-medium">{node.positionTitle}</p>
                  {node.department && (
                    <p className="text-[10px] text-slate-500">{node.department}</p>
                  )}
                  <p className={`text-xs mt-0.5 ${config.color}`}>
                    {config.sublabel(node.employeeName)}
                  </p>
                </div>
                <span className={`text-[10px] font-medium ${config.badgeColor}`}>
                  {config.badge}
                </span>
              </div>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
