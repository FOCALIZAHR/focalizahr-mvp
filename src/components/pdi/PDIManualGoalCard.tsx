'use client'

import { memo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, ArrowLeft, Compass } from 'lucide-react'
import { GhostButton, SecondaryButton } from '@/components/ui/PremiumButton'

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
      className="relative bg-[#0F172A] backdrop-blur-2xl border border-slate-800 rounded-2xl overflow-hidden"
    >
      {/* ═══ LÍNEA TESLA PÚRPURA (Creatividad/Estrategia) ═══ */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-10 bg-purple-500"
        style={{ boxShadow: '0 0 15px rgba(167, 139, 250, 0.4)' }}
      />

      <div className="p-6 sm:p-8">
        {/* ═══ ENCABEZADO ═══ */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20
            flex items-center justify-center">
            <Compass className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-400">
            Objetivo Estratégico
          </span>
        </div>

        <h2 className="text-3xl font-light text-white mb-3">
          Objetivo personalizado
        </h2>

        <p className="text-slate-400 leading-relaxed mb-8">
          Este es tu espacio de liderazgo puro. Aquí puedes agregar un desafío estratégico,
          un proyecto de innovación o una mentoría clave que tú sabes que hará crecer a tu colaborador.
        </p>

        {/* ═══ INPUT: Objetivo ═══ */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Objetivo
          </label>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Liderar la migración de la base de datos del cliente X para Q3"
            rows={2}
            className="w-full bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl
              p-5 text-lg text-white placeholder:text-slate-500 resize-none
              transition-all duration-200
              hover:border-slate-600
              focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 focus:outline-none"
          />
        </div>

        {/* ═══ INPUT: Meta Medible ═══ */}
        <div className="mb-8">
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Meta Medible
          </label>
          <textarea
            value={targetOutcome}
            onChange={(e) => setTargetOutcome(e.target.value)}
            placeholder="Ej: Migración completada con 0% de pérdida de datos y aprobada por el cliente."
            rows={2}
            className="w-full bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl
              p-5 text-lg text-white placeholder:text-slate-500 resize-none
              transition-all duration-200
              hover:border-slate-600
              focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 focus:outline-none"
          />
        </div>

        {/* ═══ BARRA DE ACCIÓN (Responsive) ═══ */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between w-full gap-3 pt-6 border-t border-slate-800/50">
          <div className="w-full sm:w-auto">
            <GhostButton
              icon={ArrowLeft}
              onClick={onPrevious}
              size="md"
              fullWidth
            >
              Anterior
            </GhostButton>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-auto order-2 sm:order-1">
              <GhostButton
                onClick={onSkip}
                size="md"
                fullWidth
              >
                Omitir
              </GhostButton>
            </div>

            <div className="w-full sm:w-auto order-1 sm:order-2">
              <SecondaryButton
                icon={Plus}
                onClick={handleAdd}
                disabled={!canAdd}
                size="lg"
                glow
                fullWidth
              >
                Agregar objetivo estratégico
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
})
