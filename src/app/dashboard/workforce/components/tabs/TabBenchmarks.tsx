'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAB BENCHMARKS — Comparacion exposicion vs industria
// Placeholder hasta que metrica exposure_ia exista en benchmark system
// src/app/dashboard/workforce/components/tabs/TabBenchmarks.tsx
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

export default function TabBenchmarks() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-2xl mx-auto px-4"
    >
      <div className="flex flex-col items-center justify-center text-center min-h-[40vh]">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <TrendingUp className="w-8 h-8 text-slate-600" />
        </div>
        <h2 className="text-xl font-light text-white mb-2">
          Benchmarks de Exposicion IA
        </h2>
        <p className="text-sm text-slate-400 font-light max-w-sm mb-2">
          Proximamente — compara tu exposicion organizacional contra empresas de tu industria y tamaño.
        </p>
        <p className="text-xs text-slate-600 font-light">
          Este modulo se activa cuando la metrica de benchmark exposure_ia este disponible.
        </p>
      </div>
    </motion.div>
  )
}
