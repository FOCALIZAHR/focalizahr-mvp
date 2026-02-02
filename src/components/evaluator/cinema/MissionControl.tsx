'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SegmentedRing from './SegmentedRing'
import type { MissionControlProps } from '@/types/evaluator-cinema'

export default function MissionControl({
  stats,
  cycle,
  nextEmployee,
  onStart
}: MissionControlProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="flex flex-col items-center gap-8"
    >
      {/* Cycle name */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">
          {cycle.name}
        </h1>
        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          {cycle.daysRemaining} dias restantes
        </p>
      </div>

      {/* Segmented Ring */}
      <SegmentedRing total={stats.total} completed={stats.completed} />

      {/* CTA Principal */}
      {nextEmployee && (
        <motion.button
          onClick={() => onStart(nextEmployee.id)}
          className="group relative bg-gradient-to-r from-cyan-400 to-cyan-500 hover:to-cyan-300 text-slate-950 pl-8 pr-2 py-3 rounded-xl flex items-center gap-6 shadow-[0_10px_40px_-10px_rgba(34,211,238,0.25)] hover:shadow-[0_10px_40px_-5px_rgba(34,211,238,0.4)] transition-all transform hover:-translate-y-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-left">
            <span className="block text-[10px] text-slate-800 uppercase tracking-wider font-bold opacity-70">
              Siguiente Evaluacion
            </span>
            <span className="block text-lg font-bold leading-none">
              {nextEmployee.displayName}
            </span>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <ArrowRight className="w-6 h-6" />
          </div>
        </motion.button>
      )}
    </motion.div>
  )
}
