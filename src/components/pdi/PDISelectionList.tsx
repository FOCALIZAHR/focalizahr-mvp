'use client'

import { useState, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { Check, AlertTriangle, TrendingUp, Zap, Star } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface SelectionItem {
  competencyCode: string
  competencyName: string
  actualScore: number
  targetScore: number
  rawGap: number
  status: 'CRITICAL' | 'IMPROVE' | 'MATCH' | 'EXCEEDS'
  category: 'URGENTE' | 'IMPACTO' | 'QUICK_WIN' | 'POTENCIAR'
  categoryLabel: string
  categoryColor: string
  narrative: string
}

interface PDISelectionListProps {
  items: SelectionItem[]
  preSelected: string[]
  maxSelection?: number
  employeeName?: string
  onConfirm: (selectedCodes: string[]) => void
  onBack?: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════════════════

const CATEGORY_ICONS = {
  URGENTE: AlertTriangle,
  IMPACTO: TrendingUp,
  QUICK_WIN: Zap,
  POTENCIAR: Star
}

const CATEGORY_COLORS = {
  URGENTE: 'border-red-500/50 bg-red-500/10',
  IMPACTO: 'border-amber-500/50 bg-amber-500/10',
  QUICK_WIN: 'border-purple-500/50 bg-purple-500/10',
  POTENCIAR: 'border-emerald-500/50 bg-emerald-500/10'
}

const CATEGORY_DOT = {
  URGENTE: 'bg-red-400',
  IMPACTO: 'bg-amber-400',
  QUICK_WIN: 'bg-purple-400',
  POTENCIAR: 'bg-emerald-400'
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function PDISelectionList({
  items,
  preSelected,
  maxSelection = 6,
  employeeName,
  onConfirm,
  onBack
}: PDISelectionListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(preSelected))

  const toggleSelection = useCallback((code: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else if (next.size < maxSelection) {
        next.add(code)
      }
      return next
    })
  }, [maxSelection])

  const handleConfirm = useCallback(() => {
    onConfirm(Array.from(selected))
  }, [selected, onConfirm])

  const selectedCount = selected.size
  const canContinue = selectedCount >= 1

  return (
    <div className="min-h-[500px]">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            Paso 1 de 2 &middot; Seleccionar focos
          </span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          {employeeName
            ? `Plan de desarrollo para ${employeeName.split(' ')[0]}`
            : '¿En qué competencias quieres enfocarte?'}
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Detectamos <span className="text-white font-medium">{items.length} brechas</span>.
          Selecciona hasta {maxSelection} para trabajar en su plan de desarrollo.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Hemos pre-seleccionado las m&aacute;s relevantes. Puedes cambiarlas.
        </p>
      </div>

      {/* Lista de items */}
      <div className="space-y-3 mb-6">
        {items.map((item, index) => {
          const isSelected = selected.has(item.competencyCode)
          const Icon = CATEGORY_ICONS[item.category]

          return (
            <motion.button
              key={item.competencyCode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleSelection(item.competencyCode)}
              disabled={!isSelected && selectedCount >= maxSelection}
              className={`
                w-full p-4 rounded-xl border-2 transition-all duration-200
                flex items-center gap-4 text-left
                ${isSelected
                  ? 'border-cyan-500/50 bg-cyan-500/10'
                  : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50'
                }
                ${!isSelected && selectedCount >= maxSelection
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
                }
              `}
            >
              {/* Checkbox */}
              <div className={`
                w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0
                transition-all duration-200
                ${isSelected
                  ? 'border-cyan-400 bg-cyan-500/20'
                  : 'border-slate-600'
                }
              `}>
                {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
              </div>

              {/* Dot de categoría */}
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${CATEGORY_DOT[item.category]}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white truncate">
                    {item.competencyName}
                  </span>
                  <span
                    className={`
                      text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                      ${CATEGORY_COLORS[item.category]}
                    `}
                    style={{ color: item.categoryColor }}
                  >
                    {item.categoryLabel}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Brecha: {Math.abs(item.rawGap).toFixed(1)} puntos
                  <span className="mx-2">&middot;</span>
                  {item.actualScore.toFixed(1)} &rarr; {item.targetScore.toFixed(1)}
                </div>
              </div>

              {/* Icon de categoría */}
              <Icon className="w-5 h-5 text-slate-600 flex-shrink-0" />
            </motion.button>
          )
        })}
      </div>

      {/* Footer con contador y botón */}
      <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-[#0F172A] to-transparent">
        <div className="flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="fhr-btn fhr-btn-ghost"
            >
              &larr; Atrás
            </button>
          )}

          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm text-slate-400">
              {selectedCount} de {maxSelection} seleccionados
            </span>
            <button
              onClick={handleConfirm}
              disabled={!canContinue}
              className={`
                fhr-btn fhr-btn-primary
                ${!canContinue ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              Continuar con {selectedCount} &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})
