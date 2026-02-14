'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Users, Sparkles } from 'lucide-react'

interface PositionAssignmentCardProps {
  position: string
  employeeCount: number
  suggestedLevel: string | null
  suggestedTrack: string
  isSelected: boolean
  onClick: () => void
}

const TRACK_ACCENT: Record<string, string> = {
  EJECUTIVO: 'border-purple-500/40 bg-purple-500/5',
  MANAGER: 'border-cyan-500/40 bg-cyan-500/5',
  COLABORADOR: 'border-blue-500/40 bg-blue-500/5'
}

const LEVEL_LABELS: Record<string, string> = {
  gerente_director: 'Gerente / Director',
  subgerente_subdirector: 'Subgerente',
  jefe: 'Jefe / Head',
  supervisor_coordinador: 'Supervisor / Coord.',
  profesional_analista: 'Profesional / Analista',
  asistente_otros: 'Asistente / Otros',
  operativo_auxiliar: 'Operativo / Auxiliar'
}

export default memo(function PositionAssignmentCard({
  position,
  employeeCount,
  suggestedLevel,
  suggestedTrack,
  isSelected,
  onClick
}: PositionAssignmentCardProps) {
  const accent = TRACK_ACCENT[suggestedTrack] || TRACK_ACCENT.COLABORADOR

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
      className={`
        w-full text-left p-3 rounded-xl border transition-all duration-200
        ${isSelected
          ? 'border-cyan-500/60 bg-cyan-500/10 ring-1 ring-cyan-500/30'
          : `${accent} hover:border-slate-600`
        }
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-200 truncate">
          {position}
        </p>
        <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
          <Users className="w-3 h-3" />
          {employeeCount}
        </span>
      </div>

      {suggestedLevel && (
        <div className="flex items-center gap-1 mt-1.5">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span className="text-[10px] text-slate-500">
            Sugerencia: {LEVEL_LABELS[suggestedLevel] || suggestedLevel}
          </span>
        </div>
      )}
    </motion.button>
  )
})
