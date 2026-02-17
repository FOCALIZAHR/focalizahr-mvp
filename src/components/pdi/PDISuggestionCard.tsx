'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Target, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PDISuggestionCardProps {
  goal: {
    id: string
    competencyCode: string
    competencyName: string
    gapType: string
    originalGap: number
    title: string
    description: string
    targetOutcome: string
    priority: string
    suggestedResources?: Array<{ type: string; title: string }> | null
  }
  isSelected: boolean
  onToggle: () => void
}

const PRIORITY_CONFIG: Record<string, { bg: string; text: string }> = {
  ALTA: { bg: 'bg-red-500/10', text: 'text-red-400' },
  MEDIA: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  BAJA: { bg: 'bg-slate-500/10', text: 'text-slate-400' }
}

const GAP_TYPE_LABELS: Record<string, string> = {
  BLIND_SPOT: 'Punto Ciego',
  DEVELOPMENT_AREA: 'Área de Desarrollo',
  HIDDEN_STRENGTH: 'Talento Oculto',
  PEER_DISCONNECT: 'Desconexión con Pares'
}

export default memo(function PDISuggestionCard({ goal, isSelected, onToggle }: PDISuggestionCardProps) {
  const priorityConfig = PRIORITY_CONFIG[goal.priority] || PRIORITY_CONFIG.MEDIA
  const resources = Array.isArray(goal.suggestedResources) ? goal.suggestedResources : []

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'relative rounded-2xl border p-5 transition-all cursor-pointer',
        'bg-[#0F172A]/90 backdrop-blur-xl',
        isSelected
          ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10'
          : 'border-slate-700/50 hover:border-slate-600'
      )}
      onClick={onToggle}
    >
      {/* Línea superior dinámica */}
      <div
        className="absolute top-0 left-4 right-4 h-[2px] rounded-full"
        style={{
          background: isSelected
            ? 'linear-gradient(90deg, #22D3EE, #A78BFA)'
            : undefined
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className={cn('text-[10px] font-bold uppercase tracking-wider mb-1', priorityConfig.text)}>
            Prioridad {goal.priority}
          </div>
          <h4 className="text-white font-semibold">{goal.competencyName}</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {GAP_TYPE_LABELS[goal.gapType] || goal.gapType} · Gap: {goal.originalGap?.toFixed(1)}
          </p>
        </div>

        {/* Toggle */}
        <button
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0',
            isSelected
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          )}
        >
          {isSelected ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
      </div>

      {/* Contenido */}
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-200">{goal.title}</p>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{goal.description}</p>
          </div>
        </div>

        <div className="rounded-lg bg-slate-800/50 p-3 border border-slate-700/50">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Meta</p>
          <p className="text-sm text-slate-300">{goal.targetOutcome}</p>
        </div>

        {/* Recursos */}
        {resources.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{resources.length} recurso(s) sugerido(s)</span>
          </div>
        )}
      </div>
    </motion.div>
  )
})
