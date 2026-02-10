'use client'

// ════════════════════════════════════════════════════════════════════════════
// HEAT STRIP - Monocromático cyan
// src/components/performance/HeatStrip.tsx
// ════════════════════════════════════════════════════════════════════════════
// 5 segmentos con intensidad variable, color único: cyan (#22D3EE)
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'

interface HeatStripProps {
  distribution: number[]  // 5 buckets as percentages
  average: number         // 1-5 scale
  stdDev: number
}

export function HeatStrip({ distribution, average }: HeatStripProps) {
  const maxValue = Math.max(...distribution, 1)
  const avgPosition = ((average - 1) / 4) * 100

  return (
    <div className="space-y-3">
      {/* Labels */}
      <div className="flex justify-between text-[10px] text-white/40 uppercase tracking-widest">
        <span>Bajo</span>
        <span>Medio</span>
        <span>Alto</span>
      </div>

      {/* Heat Strip - Monocromático cyan */}
      <div className="relative">
        <div className="h-8 rounded-lg overflow-hidden flex gap-px">
          {distribution.map((value, index) => {
            const intensity = maxValue > 0 ? value / maxValue : 0
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="flex-1 relative group"
                style={{
                  backgroundColor: `rgba(34, 211, 238, ${0.15 + intensity * 0.5})`,
                }}
              >
                {value > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono font-bold text-white/80">
                      {value}%
                    </span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Average marker */}
        <div
          className="absolute top-full mt-1"
          style={{ left: `${avgPosition}%` }}
        >
          <div className="flex flex-col items-center -translate-x-1/2">
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[5px]
              border-transparent border-b-cyan-400" />
            <span className="text-[10px] font-mono font-bold text-cyan-400 mt-0.5">
              x&#772; {average.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Scale */}
      <div className="flex justify-between text-[9px] text-white/30 font-mono pt-4">
        <span>1.0</span>
        <span>2.0</span>
        <span>3.0</span>
        <span>4.0</span>
        <span>5.0</span>
      </div>
    </div>
  )
}
