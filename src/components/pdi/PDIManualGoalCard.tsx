'use client'

import { memo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

interface PDIManualGoalCardProps {
  onAdd: (goal: { title: string; targetOutcome: string }) => void
  onSkip: () => void
  onPrevious: () => void
}

export default memo(function PDIManualGoalCard({
  onAdd,
  onSkip,
  onPrevious
}: PDIManualGoalCardProps) {
  const [title, setTitle] = useState('')
  const [targetOutcome, setTargetOutcome] = useState('')

  const canAdd = title.trim().length > 0 && targetOutcome.trim().length > 0

  const handleAdd = useCallback(() => {
    if (!canAdd) return
    onAdd({ title: title.trim(), targetOutcome: targetOutcome.trim() })
  }, [canAdd, title, targetOutcome, onAdd])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="relative bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] overflow-hidden"
    >
      {/* Tesla line cyan-purple */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] z-10"
        style={{
          background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
          boxShadow: '0 0 15px #22D3EE'
        }}
      />

      <div className="p-8 md:p-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Plus className="w-5 h-5 text-cyan-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Objetivo Adicional
          </span>
        </div>

        <h3 className="text-2xl font-light text-white mb-2">
          Objetivo personalizado
        </h3>

        <p className="text-sm text-slate-400 mb-8">
          Agrega un objetivo de desarrollo que no esté relacionado con las brechas detectadas.
        </p>

        {/* Divider */}
        <div className="h-px bg-slate-800 mb-6" />

        {/* Title */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Objetivo
          </span>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="¿Qué quieres desarrollar?"
            rows={2}
            className="w-full bg-transparent text-sm text-slate-200 leading-relaxed resize-none focus:outline-none placeholder:text-slate-600"
          />
        </div>

        {/* Target Outcome */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 mb-8">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Meta Medible
          </span>
          <textarea
            value={targetOutcome}
            onChange={(e) => setTargetOutcome(e.target.value)}
            placeholder="¿Cómo sabrás que lo lograste?"
            rows={2}
            className="w-full bg-transparent text-sm text-slate-200 leading-relaxed resize-none focus:outline-none placeholder:text-slate-600"
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800">
          <button
            onClick={onPrevious}
            className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
          >
            &larr; Anterior
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onSkip}
              className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
            >
              Omitir
            </button>
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              Agregar objetivo
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
})
