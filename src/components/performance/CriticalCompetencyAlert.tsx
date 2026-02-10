'use client'

// ════════════════════════════════════════════════════════════════════════════
// CRITICAL COMPETENCY ALERT
// src/components/performance/CriticalCompetencyAlert.tsx
// ════════════════════════════════════════════════════════════════════════════
// Shows alert when any competency score is below 2.5
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface CriticalAlertProps {
  competencies: Array<{ name: string; avgScore: number }>
}

export function CriticalCompetencyAlert({ competencies }: CriticalAlertProps) {
  const critical = competencies.filter(c => c.avgScore < 2.5)

  if (critical.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-red-400 mb-1">
            Atenci&oacute;n Requerida
          </h4>
          <p className="text-[12px] text-white/60 leading-relaxed">
            {critical.length === 1 ? (
              <>
                <strong className="text-red-400">{critical[0].name}</strong> est&aacute;
                en nivel cr&iacute;tico ({critical[0].avgScore.toFixed(1)}). Esto puede
                impactar el desempe&ntilde;o general del equipo.
              </>
            ) : (
              <>
                Las competencias{' '}
                {critical.map((c, i) => (
                  <span key={c.name}>
                    <strong className="text-red-400">{c.name}</strong>
                    {i < critical.length - 2 ? ', ' : i === critical.length - 2 ? ' y ' : ''}
                  </span>
                ))}{' '}
                requieren atenci&oacute;n inmediata.
              </>
            )}
          </p>
          <p className="text-[11px] text-white/40 mt-2 italic">
            Sugerencia: Programa conversaciones 1:1 focalizadas en estas &aacute;reas.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
