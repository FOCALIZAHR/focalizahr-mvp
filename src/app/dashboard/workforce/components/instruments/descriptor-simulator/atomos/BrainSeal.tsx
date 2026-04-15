'use client'

// ════════════════════════════════════════════════════════════════════════════
// BRAIN SEAL — sello de veracidad (dato Anthropic real)
// src/app/dashboard/workforce/components/instruments/descriptor-simulator/atomos/BrainSeal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Icono BrainCircuit purple junto a la tarea cuando hay dato Anthropic real.
// Sin icono = clasificación Eloundou (teórica).
//
// Tooltip:
//   Con dato:    "Dato de uso real verificado mediante telemetría Anthropic"
//   Sin dato:    "Clasificación científica (Eloundou 2023)"
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { BrainCircuit } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface BrainSealProps {
  hasAnthropicData: boolean
}

export default memo(function BrainSeal({ hasAnthropicData }: BrainSealProps) {
  const [show, setShow] = useState(false)

  if (!hasAnthropicData) {
    // Placeholder invisible para preservar layout — tooltip en hover del espacio
    return (
      <div
        className="relative inline-flex items-center justify-center w-[14px] h-[14px] cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        role="img"
        aria-label="Clasificación científica Eloundou 2023"
      >
        <AnimatePresence>
          {show && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 rounded-md bg-slate-900/95 border border-white/10 shadow-xl whitespace-nowrap pointer-events-none"
            >
              <span className="text-[10px] text-slate-400 font-light">
                Clasificación científica (Eloundou 2023)
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div
      className="relative inline-flex items-center justify-center w-[14px] h-[14px] cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      role="img"
      aria-label="Dato Anthropic verificado"
    >
      <BrainCircuit className="w-[14px] h-[14px] text-purple-400" strokeWidth={1.5} />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 rounded-md bg-slate-900/95 border border-purple-400/20 shadow-xl whitespace-nowrap pointer-events-none"
          >
            <span className="text-[10px] text-purple-300 font-light">
              Dato de uso real verificado · Anthropic Economic Index
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
