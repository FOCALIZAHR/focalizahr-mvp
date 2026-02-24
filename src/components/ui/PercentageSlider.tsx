// ════════════════════════════════════════════════════════════════════════════
// PERCENTAGE SLIDER - Slider reutilizable para porcentajes
// src/components/ui/PercentageSlider.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface PercentageSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  showValue?: boolean
  disabled?: boolean
  className?: string
}

export default memo(function PercentageSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  label,
  showValue = true,
  disabled = false,
  className,
}: PercentageSliderProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseInt(e.target.value))
    },
    [onChange]
  )

  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={cn('space-y-2', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm text-slate-300">{label}</span>}
          {showValue && (
            <span className="text-lg font-bold text-cyan-400 tabular-nums">
              {value}%
            </span>
          )}
        </div>
      )}

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          'w-full h-3 cursor-pointer appearance-none rounded-full transition-all',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-5',
          '[&::-webkit-slider-thumb]:h-5',
          '[&::-webkit-slider-thumb]:bg-cyan-500',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-webkit-slider-thumb]:shadow-lg',
          '[&::-webkit-slider-thumb]:shadow-cyan-500/30',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{
          background: `linear-gradient(to right, #22D3EE ${percentage}%, #334155 ${percentage}%)`
        }}
      />

      <div className="flex justify-between text-xs text-slate-500">
        <span>{min}%</span>
        <span>{Math.round((max - min) / 2 + min)}%</span>
        <span>{max}%</span>
      </div>
    </div>
  )
})
