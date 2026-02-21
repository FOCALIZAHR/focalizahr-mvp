'use client'

// ════════════════════════════════════════════════════════════════════════════
// FALLBACK CARD - Mensaje inspiracional cuando no hay datos
// src/components/performance/summary/FallbackCard.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, type LucideIcon } from 'lucide-react'

interface FallbackCardProps {
  message: string
  icon?: LucideIcon
  className?: string
}

export default memo(function FallbackCard({
  message,
  icon: Icon = AlertCircle,
  className = ''
}: FallbackCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative bg-[#0F172A]/60 backdrop-blur-md border border-slate-800
        rounded-2xl p-8 text-center
        ${className}
      `}
    >
      {/* Línea Tesla sutil */}
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent rounded-t-2xl" />

      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-amber-400" />
      </div>

      <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
        {message}
      </p>
    </motion.div>
  )
})
