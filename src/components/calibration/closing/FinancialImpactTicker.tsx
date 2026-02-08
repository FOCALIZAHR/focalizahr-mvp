// ════════════════════════════════════════════════════════════════════════════
// FINANCIAL IMPACT TICKER - Before/After bonus factor
// src/components/calibration/closing/FinancialImpactTicker.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface FinancialImpactTickerProps {
  originalFactor: number
  calibratedFactor: number
  affectedEmployees: number
}

export default memo(function FinancialImpactTicker({
  originalFactor,
  calibratedFactor,
  affectedEmployees
}: FinancialImpactTickerProps) {

  const delta = calibratedFactor - originalFactor
  const deltaPct = originalFactor > 0
    ? (delta / originalFactor) * 100
    : 0

  const isUp = delta > 0.001
  const isDown = delta < -0.001

  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Before */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
          Factor Inicial
        </p>
        <p className="text-4xl font-bold text-slate-400">
          {(originalFactor * 100).toFixed(1)}%
        </p>
        <p className="text-xs text-slate-600 mt-2">
          {affectedEmployees} empleados
        </p>
      </div>

      {/* After */}
      <div className={cn(
        'rounded-xl p-6 border',
        isUp && 'bg-emerald-500/10 border-emerald-500/30',
        isDown && 'bg-rose-500/10 border-rose-500/30',
        !isUp && !isDown && 'bg-slate-900/30 border-slate-800'
      )}>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
          Factor Calibrado
          <Icon size={14} className={cn(
            isUp && 'text-emerald-400',
            isDown && 'text-rose-400',
            !isUp && !isDown && 'text-slate-500'
          )} />
        </p>
        <p className={cn(
          'text-4xl font-bold',
          isUp && 'text-emerald-400',
          isDown && 'text-rose-400',
          !isUp && !isDown && 'text-slate-400'
        )}>
          {(calibratedFactor * 100).toFixed(1)}%
        </p>
        <p className={cn(
          'text-xs mt-2',
          isUp && 'text-emerald-400/80',
          isDown && 'text-rose-400/80',
          !isUp && !isDown && 'text-slate-600'
        )}>
          {isUp ? '+' : ''}{deltaPct.toFixed(1)}%
        </p>
      </div>
    </div>
  )
})
