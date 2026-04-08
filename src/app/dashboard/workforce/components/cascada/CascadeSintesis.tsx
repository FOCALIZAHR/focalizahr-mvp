'use client'

// ════════════════════════════════════════════════════════════════════════════
// CASCADE SINTESIS — "El Francotirador"
// Donde actuar PRIMERO. Una gerencia, una accion.
// Narrativas exactas del script CASCADA_WORKFORCE_PLANNING_SCRIPT_v2.md
// src/app/dashboard/workforce/components/cascada/CascadeSintesis.tsx
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { Target } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import { formatCurrency } from '../../utils/format'
import type { WorkforceDiagnosticData, WorkforceView } from '../../types/workforce.types'
import type { ComputedCascadeValues } from '../../hooks/useWorkforceCascade'

interface CascadeSintesisProps {
  data: WorkforceDiagnosticData
  computed: ComputedCascadeValues
  onBackToLobby: () => void
  onNavigateTab?: (view: WorkforceView) => void
}

export default function CascadeSintesis({
  data,
  computed,
  onBackToLobby,
  onNavigateTab,
}: CascadeSintesisProps) {
  const { francotirador, cantidadHallazgos } = computed

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-3xl mx-auto px-4"
    >
      {/* Hero */}
      <div className="text-center mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">Sintesis</p>
        <div className="w-12 h-12 mx-auto mb-4 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center">
          <Target className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-3xl md:text-4xl font-light text-cyan-400 mb-1">
          {francotirador.name}
        </p>
        <p className="text-xs text-slate-500 uppercase tracking-widest">
          Gerencia con mayor concentracion de riesgo
        </p>
      </div>

      {/* Narrativa — del script */}
      <p className="text-sm text-slate-400 font-light leading-relaxed max-w-lg mx-auto text-center mb-4">
        El sistema analizo todos los hallazgos y calculo donde el impacto de una sola conversacion es maximo.
      </p>
      <p className="text-sm text-slate-400 font-light leading-relaxed max-w-lg mx-auto text-center mb-4">
        <span className="text-cyan-400">{francotirador.department}</span> concentra <span className="text-purple-400">{francotirador.concentrationPct}%</span> del riesgo total. <span className="text-purple-400">{francotirador.hallazgosCount}</span> de los {cantidadHallazgos} hallazgos estan bajo su responsabilidad.
      </p>
      <p className="text-sm text-slate-400 font-light leading-relaxed max-w-lg mx-auto text-center mb-8">
        El costo de inaccion en esa gerencia especifica es de <span className="text-purple-400">{formatCurrency(francotirador.costAtRisk)}</span> en 12 meses.
      </p>

      {/* Caja de decision — del script */}
      <div className="bg-slate-900/60 backdrop-blur-sm border border-amber-500/20 rounded-xl p-6 md:p-8 mb-8 text-center">
        <p className="text-base text-white font-light leading-relaxed mb-2">
          &ldquo;Cita a <span className="text-cyan-400 font-medium">{francotirador.name}</span> mañana a las 9 AM.
        </p>
        <p className="text-base text-white font-light leading-relaxed mb-4">
          Lleva estos datos. Pide un plan en 48 horas.&rdquo;
        </p>
        <p className="text-sm text-slate-500 font-light italic">
          El resto de la organizacion puede esperar una semana. Esta gerencia no puede esperar un dia mas.
        </p>
      </div>

      {/* Coaching tip — del script */}
      <p className="text-xs text-slate-500 font-light text-center mb-8">
        ● El sistema hizo el diagnostico. El directorio necesita la decision. Y esa decision tiene nombre y apellido.
      </p>

      {/* CTA */}
      <div className="flex justify-center mb-8">
        <PrimaryButton
          icon={Target}
          iconPosition="right"
          onClick={onBackToLobby}
        >
          Volver al inicio
        </PrimaryButton>
      </div>

      {/* Acceso a tabs */}
      <div className="flex flex-col items-center gap-2 text-sm">
        <p className="text-xs text-slate-600 uppercase tracking-wider mb-1">Explorar mas</p>
        <button onClick={() => onNavigateTab?.('simulador')} className="text-slate-500 hover:text-slate-300 transition-colors">
          ○ Explorar Simulador de Escenarios
        </button>
        <button onClick={() => onNavigateTab?.('estructura')} className="text-slate-500 hover:text-slate-300 transition-colors">
          ○ Ver Estructura por Persona
        </button>
        <button onClick={() => onNavigateTab?.('benchmarks')} className="text-slate-500 hover:text-slate-300 transition-colors">
          ○ Comparar con Benchmarks de Industria
        </button>
      </div>
    </motion.div>
  )
}
