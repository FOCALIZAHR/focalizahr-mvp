'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAB SIMULADOR — 3 Tesis con sliders (futuro)
// Placeholder con descripcion de las 3 tesis
// src/app/dashboard/workforce/components/tabs/TabSimulador.tsx
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { Sliders, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react'

const TESIS = [
  {
    icon: TrendingDown,
    title: 'Eficiencia (Cash-Out)',
    description: 'Reducir headcount en posiciones de alta exposicion y bajo rendimiento. Calcular finiquitos, ahorro anual y payback.',
  },
  {
    icon: TrendingUp,
    title: 'Crecimiento (Augmentacion)',
    description: 'Mantener headcount, reasignar capacidad liberada a trabajo de alto valor. Calcular FTEs reasignados y valor equivalente.',
  },
  {
    icon: RefreshCw,
    title: 'Evolucion (Reestructuracion)',
    description: 'Eliminar cargos transaccionales, crear cargos especializados. Calcular balance neto y timeline.',
  },
]

export default function TabSimulador() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-2xl mx-auto px-4"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 mx-auto">
          <Sliders className="w-8 h-8 text-slate-600" />
        </div>
        <h2 className="text-xl font-light text-white mb-2">
          Simulador de Escenarios
        </h2>
        <p className="text-sm text-slate-400 font-light">
          Proximamente — explora 3 tesis con sliders interactivos y calcula ROI en tiempo real.
        </p>
      </div>

      <div className="space-y-4">
        {TESIS.map((tesis, i) => {
          const Icon = tesis.icon
          return (
            <div
              key={i}
              className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/40 rounded-xl p-5 flex items-start gap-4"
            >
              <div className="w-10 h-10 flex-shrink-0 bg-slate-800/50 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white mb-1">{tesis.title}</h3>
                <p className="text-xs text-slate-500 font-light">{tesis.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
