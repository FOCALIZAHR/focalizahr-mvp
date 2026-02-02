'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Users, ArrowRight } from 'lucide-react'
import confetti from 'canvas-confetti'
import type { VictoryScreenProps } from '@/types/evaluator-cinema'

export default function VictoryScreen({ total, onViewTeam }: VictoryScreenProps) {

  useEffect(() => {
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22D3EE', '#A78BFA', '#10B981']
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22D3EE', '#A78BFA', '#10B981']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="text-center max-w-md mx-auto"
    >
      {/* Trophy animado */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="mb-8"
      >
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/30">
          <Trophy className="w-12 h-12 text-white" />
        </div>
      </motion.div>

      {/* Mensaje principal */}
      <h2 className="text-3xl font-bold text-white mb-4">
        Mision Cumplida!
      </h2>

      <p className="text-slate-400 mb-2">
        Completaste todas las evaluaciones de tu equipo.
      </p>

      <p className="text-cyan-400 font-medium mb-8">
        Tu feedback es valioso para el desarrollo de {total} colaboradores.
      </p>

      {/* Stats */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-center gap-4">
          <Users className="w-8 h-8 text-emerald-400" />
          <div className="text-left">
            <p className="text-2xl font-bold text-white">{total}</p>
            <p className="text-slate-400 text-sm">Evaluaciones completadas</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onViewTeam}
        className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 mx-auto"
      >
        Ver mi equipo
        <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  )
}
