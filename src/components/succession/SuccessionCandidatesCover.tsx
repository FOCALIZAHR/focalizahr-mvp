'use client'

// ════════════════════════════════════════════════════════════════════════════
// SUCCESSION CANDIDATES COVER - Portada de 2 pantallas antes de sugeridos
// src/components/succession/SuccessionCandidatesCover.tsx
// Patrón clonado de MomentCover.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, HelpCircle, ArrowRight, X } from 'lucide-react'

interface SuccessionCandidatesCoverProps {
  positionTitle: string
  totalEmployees: number
  candidatesFound: number
  onEnter: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// HELP MODAL CONTENT
// ════════════════════════════════════════════════════════════════════════════

const HELP_STEPS = [
  {
    num: '①',
    title: 'Solo talento que puede hacer el trabajo',
    body: 'Calculamos cuanto domina cada persona las competencias que exige este cargo especifico, no su cargo actual. Solo consideramos quienes superan el 75%.',
  },
  {
    num: '②',
    title: 'Solo quienes quieren crecer',
    body: 'Sabemos quien tiene aspiraciones de ascenso porque sus jefes lo evaluaron. Excluimos a quienes estan felices donde estan — nominar a alguien que no quiere el rol no tiene sentido.',
  },
  {
    num: '③',
    title: 'Match contra el perfil objetivo',
    body: 'Comparamos las competencias actuales de cada persona contra lo que exige exactamente este nivel, brecha por brecha.',
  },
  {
    num: '④',
    title: 'Estimacion de tiempo',
    body: 'Basado en las brechas que quedan, calculamos en cuanto tiempo estaria realmente listo.',
  },
]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function SuccessionCandidatesCover({
  positionTitle,
  totalEmployees,
  candidatesFound,
  onEnter,
}: SuccessionCandidatesCoverProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="flex flex-col h-full">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center text-center px-6 relative"
          >
            {/* Icon — watermark */}
            <Crown className="w-6 h-6 text-slate-700 absolute top-4 right-4" />

            {/* Narrative */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl md:text-3xl font-light text-white leading-relaxed max-w-lg mb-4"
            >
              Las organizaciones que planifican su sucesion retienen al{' '}
              <span className="text-cyan-400 font-medium">doble</span>{' '}
              de su talento critico.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-base text-slate-400 font-light max-w-md mb-10"
            >
              Esto no es un tramite. Es una decision estrategica.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <motion.button
                onClick={() => setStep(2)}
                className="flex items-center gap-3 px-8 py-3 rounded-xl font-medium text-base transition-all shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #22D3EE, #22D3EEDD)',
                  color: '#0F172A',
                  boxShadow: '0 8px 24px -6px rgba(34,211,238,0.4)',
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center text-center px-6"
          >
            {/* Title */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl md:text-3xl font-light text-white leading-relaxed max-w-lg mb-8"
            >
              Analizamos{' '}
              <span className="text-cyan-400 font-medium">{totalEmployees}</span>{' '}
              colaboradores activos paso a paso y encontramos{' '}
              <span className="text-purple-400 font-medium">{candidatesFound}</span>{' '}
              talentos.
            </motion.p>

            {/* 4 Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col gap-2 text-left max-w-sm w-full mb-8"
            >
              {['Solo quienes dominan el perfil tecnico del rol',
                'Solo quienes sus jefes dicen que quieren crecer',
                'Match calculado brecha por brecha',
                'Tiempo estimado segun las brechas que quedan',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-cyan-400 text-sm font-medium flex-shrink-0 w-5">
                    {'①②③④'[i]}
                  </span>
                  <span className="text-sm text-slate-300 leading-relaxed">{text}</span>
                </div>
              ))}
            </motion.div>

            {/* Help icon + CTA row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col items-center gap-4"
            >
              {/* Help */}
              <button
                onClick={() => setShowHelp(true)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-cyan-400 transition-colors text-xs"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>¿Como funciona?</span>
              </button>

              {/* CTA */}
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
                <span>Elegir sucesores para {positionTitle}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-md rounded-2xl bg-[#0F172A]/95 backdrop-blur-2xl border border-slate-700/50 shadow-2xl p-6"
              onClick={e => e.stopPropagation()}
            >
              {/* Tesla line */}
              <div
                className="h-[2px] w-full rounded-t-2xl absolute top-0 left-0 right-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
                  boxShadow: '0 0 10px rgba(34,211,238,0.3)',
                }}
              />

              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-medium text-white">Como encontramos estos candidatos</h3>
                <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {HELP_STEPS.map((s, i) => (
                  <div key={i}>
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-cyan-400 text-sm font-medium flex-shrink-0">{s.num}</span>
                      <span className="text-sm text-white font-medium">{s.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pl-6">{s.body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
