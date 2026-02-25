// src/components/goals/hub/GoalsMissionControl.tsx
'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { Users, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { PrimaryButton } from '@/components/ui/PremiumButton'

interface GoalsMissionControlProps {
  percentage: number
  total: number
  withGoals: number
  message: string
  ctaText: string
  ctaHref: string
  state: string
}

export const GoalsMissionControl = memo(function GoalsMissionControl({
  percentage,
  total,
  withGoals,
  message,
  ctaText,
  ctaHref,
}: GoalsMissionControlProps) {
  const router = useRouter()

  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="fhr-card p-6"
    >
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
          boxShadow: '0 0 15px #22D3EE',
        }}
      />

      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Gauge */}
        <div className="relative w-36 h-36 flex-shrink-0">
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 144 144">
            {/* Background circle */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              fill="none"
              stroke="#334155"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <motion.circle
              cx="72"
              cy="72"
              r={radius}
              fill="none"
              stroke="url(#goalsGaugeGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="goalsGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-light text-white">{percentage}%</span>
            {total > 0 && (
              <span className="text-sm text-slate-400">
                {withGoals}/{total}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg text-white font-medium">Cobertura del Equipo</h2>
          </div>

          <p className="text-slate-400 mb-4">{message}</p>

          <PrimaryButton
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => router.push(ctaHref)}
          >
            {ctaText}
          </PrimaryButton>
        </div>
      </div>
    </motion.div>
  )
})
