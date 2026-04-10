'use client'

// ════════════════════════════════════════════════════════════════════════════
// SINTESIS — "El Francotirador"
// Cierre de la cascada — donde actuar PRIMERO
// Patron narrativo PURO + decision box + CTA (sin modal — es el cierre)
// Narrativa exacta del script CASCADA_WORKFORCE_PLANNING_SCRIPT_v2.md
// src/app/dashboard/workforce/components/cascada/CascadeSintesis.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import {
  ActSeparator,
  fadeIn,
  fadeInDelay,
} from '@/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/shared'
import { formatCurrency } from '../../utils/format'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'
import type { ComputedCascadeValues } from '../../hooks/useWorkforceCascade'
import type { WorkforceCardType } from '../WorkforceRailCard'

interface CascadeSintesisProps {
  data: WorkforceDiagnosticData
  computed: ComputedCascadeValues
  onBackToLobby: () => void
  onNavigateTab?: (card: WorkforceCardType) => void
}

export default memo(function CascadeSintesis({
  data: _data,
  computed,
  onNavigateTab,
}: CascadeSintesisProps) {
  const { francotirador, cantidadHallazgos } = computed

  // Sin datos suficientes para identificar francotirador
  if (francotirador.costAtRisk === 0 || !francotirador.name || francotirador.name === 'Sin datos') {
    return null
  }

  return (
    <>
      <ActSeparator label="Sintesis" color="cyan" />

      <div>
        {/* Hero — gerencia francotirador en cyan (es entidad/nombre) */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">
            Gerencia con mayor concentracion de riesgo
          </p>
          <p className="text-5xl md:text-6xl font-extralight text-cyan-400 tracking-tight">
            {francotirador.name}
          </p>
        </motion.div>

        {/* Narrativa — del script v2 */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            El sistema analizo todos los hallazgos y calculo donde el impacto de una sola
            conversacion es maximo.
          </p>

          <p className="text-base font-light text-slate-400 leading-relaxed text-center">
            <span className="font-medium text-cyan-400">{francotirador.name}</span>{' '}
            concentra <span className="font-medium text-purple-400">{francotirador.concentrationPct}%</span>{' '}
            del riesgo total.{' '}
            <span className="font-medium text-purple-400">{francotirador.hallazgosCount}</span>{' '}
            de los {cantidadHallazgos} hallazgos estan bajo su responsabilidad.
          </p>

          <p className="text-base font-light text-slate-400 leading-relaxed text-center">
            El costo de inaccion en esa gerencia especifica es de{' '}
            <span className="font-medium text-purple-400">{formatCurrency(francotirador.costAtRisk)}</span>{' '}
            en 12 meses.
          </p>

          <p className="text-base font-light text-slate-300 leading-relaxed text-center pt-4">
            Esta gerencia no es el problema. Es el punto de apalancamiento. Una conversacion
            con su responsable manana puede mover mas aguja que un programa transversal de
            seis meses.
          </p>
        </motion.div>

        {/* Decision box — del script (highlight visual del cierre) */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-12">
          <div className="bg-slate-900/60 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6 md:p-10 text-center relative overflow-hidden">
            {/* Tesla line cyan en el top de la caja */}
            <div
              className="absolute top-0 left-0 right-0 h-[1px]"
              style={{
                background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
                boxShadow: '0 0 12px #22D3EE',
              }}
            />

            <p className="text-base md:text-lg text-white font-light leading-relaxed mb-3">
              &ldquo;Cita al responsable de{' '}
              <span className="font-medium text-cyan-400">{francotirador.name}</span>{' '}
              manana a las 9 AM.
            </p>
            <p className="text-base md:text-lg text-white font-light leading-relaxed mb-5">
              Lleva estos datos. Pide un plan en 48 horas.&rdquo;
            </p>
            <p className="text-sm text-slate-400 font-light italic">
              El resto de la organizacion puede esperar una semana.
              <br />
              Esta gerencia no puede esperar un dia mas.
            </p>
          </div>
        </motion.div>

        {/* Coaching tip final */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-10">
          <div className="border-l-2 border-cyan-500/30 pl-4">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              El sistema hizo el diagnostico. El directorio necesita la decision.
              Y esa decision tiene nombre y apellido.
            </p>
          </div>
        </motion.div>

        {/* Acceso a tabs de exploracion (post-cascada) */}
        {onNavigateTab && (
          <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-12">
            <div className="flex flex-col items-center gap-3">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest">
                Explorar mas
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                <button
                  onClick={() => onNavigateTab('estructura')}
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  Estructura por persona →
                </button>
                <button
                  onClick={() => onNavigateTab('benchmarks')}
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  Benchmarks vs industria →
                </button>
                <button
                  onClick={() => onNavigateTab('simulador')}
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  Simulador de escenarios →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  )
})
