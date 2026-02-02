'use client'

import { motion } from 'framer-motion'

interface SegmentedRingProps {
  total: number
  completed: number
}

function getInsightText(completed: number, total: number): string {
  const pct = total > 0 ? (completed / total) * 100 : 0
  if (pct === 0) return 'Inicio de Ciclo'
  if (pct < 50) return 'Ritmo Constante'
  if (pct < 100) return 'Recta Final'
  return 'Mision Cumplida'
}

function getProgressColor(pct: number): string {
  if (pct >= 100) return '#10B981'  // emerald
  if (pct >= 60) return '#22D3EE'   // cyan
  if (pct >= 30) return '#A78BFA'   // purple
  return '#22D3EE'                   // cyan default
}

export default function SegmentedRing({ total, completed }: SegmentedRingProps) {
  const size = 280
  const strokeWidth = 10
  const radius = (size / 2) - strokeWidth
  const circumference = 2 * Math.PI * radius
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  const color = getProgressColor(percentage)
  const pending = total - completed

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow sutil */}
      <div
        className="absolute rounded-full blur-[60px]"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          backgroundColor: color,
          opacity: 0.08
        }}
      />

      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(71, 85, 105, 0.3)"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            filter: `drop-shadow(0 0 6px ${color})`
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          className="text-7xl font-black text-white tracking-tighter font-mono"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {percentage}%
        </motion.span>
        <span className="text-xs font-bold tracking-[0.2em] uppercase mt-2" style={{ color }}>
          {getInsightText(completed, total)}
        </span>
        <span className="text-xs text-slate-500 font-mono mt-1">
          {completed}/{total} · {pending} pendiente{pending !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
