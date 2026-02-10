'use client'

// ════════════════════════════════════════════════════════════════════════════
// TRINITY PILLS - Selector de factores AAE (Refinado v2)
// src/components/potential/TrinityCards.tsx
// ════════════════════════════════════════════════════════════════════════════
// Pills compactos horizontales para seleccionar factor a evaluar
// Refinamiento: De cards grandes → pills minimalistas
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

import { AAE_FACTORS, FACTORS_ORDER, FACTOR_COLORS } from '@/lib/potential-content'
import type { TrinityCardsProps, FactorKey, FactorLevel } from '@/types/potential'

// ════════════════════════════════════════════════════════════════════════════
// TRINITY PILL COMPONENT (refinado: compacto, sin gauge)
// ════════════════════════════════════════════════════════════════════════════

interface TrinityCardProps {
  factorKey: FactorKey
  value: FactorLevel | null
  isActive: boolean
  onClick: () => void
}

const TrinityCard = memo(function TrinityCard({
  factorKey,
  value,
  isActive,
  onClick
}: TrinityCardProps) {
  const factor = AAE_FACTORS[factorKey]
  const colors = FACTOR_COLORS[factorKey]
  const Icon = factor.icon
  const isComplete = value !== null

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        // Base - PILL COMPACTO
        "relative flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5",
        "rounded-full cursor-pointer transition-all duration-300",
        "border overflow-hidden group",
        
        // Estados
        isActive
          ? "bg-slate-800 shadow-lg"
          : isComplete
            ? "bg-slate-800/60"
            : "bg-slate-900/50 hover:bg-slate-800/80"
      )}
      style={{
        borderColor: isActive 
          ? colors.primary 
          : isComplete 
            ? `${colors.primary}40`
            : 'rgba(71, 85, 105, 0.5)',
        boxShadow: isActive 
          ? `0 0 15px ${colors.glow}`
          : undefined
      }}
    >
      {/* Icono pequeño */}
      <Icon
        className="w-4 h-4 transition-all duration-300"
        style={{
          color: isActive || isComplete ? colors.primary : undefined
        }}
        strokeWidth={1.5}
      />

      {/* Nombre del factor */}
      <span
        className={cn(
          "text-xs font-semibold transition-colors duration-300",
          isActive
            ? "text-white"
            : isComplete
              ? ""
              : "text-slate-400 group-hover:text-slate-300"
        )}
        style={{
          color: isComplete && !isActive ? colors.primary : undefined
        }}
      >
        {factor.name}
      </span>

      {/* Check para completado */}
      {isComplete && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center justify-center"
        >
          <Check 
            className="w-4 h-4 text-emerald-400" 
            strokeWidth={2.5} 
          />
        </motion.div>
      )}
    </motion.button>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function TrinityCards({
  factors,
  activeFactor,
  onFactorSelect
}: TrinityCardsProps) {
  const completedCount = [factors.aspiration, factors.ability, factors.engagement]
    .filter(v => v !== null).length

  return (
    <div className="w-full">
      {/* Pills container - centrados */}
      <div className="flex justify-center items-center gap-2 md:gap-3">
        {FACTORS_ORDER.map((key) => (
          <TrinityCard
            key={key}
            factorKey={key}
            value={factors[key]}
            isActive={activeFactor === key}
            onClick={() => onFactorSelect(key)}
          />
        ))}
      </div>

      {/* Indicador minimalista */}
      <div className="flex justify-center mt-3">
        <span className="text-[11px] text-slate-500">
          {completedCount}/3
        </span>
      </div>
    </div>
  )
})