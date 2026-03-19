'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAC ORG COVER — Portada Pilar 2: Vista org-wide antes de TalentTreemap
// Clonado visual de TACGerenciaCover (1 solo paso, sin metodología)
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { Users, ArrowRight } from 'lucide-react'

interface TACOrgCoverProps {
  fugaCount: number
  burnoutCount: number
  bajoRendimientoCount: number
  onEnter: () => void
}

export default function TACOrgCover({
  fugaCount,
  burnoutCount,
  bajoRendimientoCount,
  onEnter
}: TACOrgCoverProps) {

  // Narrativa dinámica según la situación más crítica
  let narrative: React.ReactNode
  let subtext: string

  if (fugaCount > 0) {
    narrative = (
      <>
        <span className="text-red-400 font-medium">{fugaCount}</span>
        {' '}persona{fugaCount !== 1 ? 's' : ''} con alto dominio
        {fugaCount !== 1 ? ' están' : ' está'} enviando señales de salida.
        {burnoutCount > 0 && (
          <>
            {' Y '}
            <span className="text-orange-400 font-medium">{burnoutCount}</span>
            {' '}más {burnoutCount !== 1 ? 'están sobrecargadas' : 'está sobrecargada'}.
          </>
        )}
      </>
    )
    subtext = 'El talento que más domina es el que más fácil se va.'
  } else if (burnoutCount > 0) {
    narrative = (
      <>
        <span className="text-orange-400 font-medium">{burnoutCount}</span>
        {' '}persona{burnoutCount !== 1 ? 's están sobrecargadas' : ' está sobrecargada'}
        {' '}en tu organización hoy.
      </>
    )
    subtext = 'Energía alta sin resultado es señal de sobrecarga, no de bajo rendimiento.'
  } else if (bajoRendimientoCount > 0) {
    narrative = (
      <>
        <span className="text-amber-400 font-medium">{bajoRendimientoCount}</span>
        {' '}persona{bajoRendimientoCount !== 1 ? 's requieren' : ' requiere'}
        {' '}una conversación que no puede esperar.
      </>
    )
    subtext = 'No hay datos suficientes para explicar esta combinación — se necesita contexto.'
  } else {
    narrative = 'Tu organización no tiene alertas activas en este momento.'
    subtext = 'El equipo parece estable. Buen momento para reconocer a los pilares.'
  }

  return (
    <div className="flex flex-col h-full">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col items-center justify-center text-center px-6 relative"
      >
        {/* Watermark */}
        <Users className="w-6 h-6 text-slate-700 absolute top-4 right-4" />

        {/* Narrativa */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-xl md:text-2xl font-light text-white leading-relaxed max-w-2xl mb-6"
        >
          {narrative}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-base text-slate-400 font-light max-w-md mb-10"
        >
          {subtext}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <motion.button
            onClick={onEnter}
            className="flex items-center gap-3 px-8 py-3 rounded-xl font-medium text-base transition-all shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #22D3EE, #22D3EEDD)',
              color: '#0F172A',
              boxShadow: '0 8px 24px -6px rgba(34,211,238,0.4)',
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Ver quiénes son</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}
