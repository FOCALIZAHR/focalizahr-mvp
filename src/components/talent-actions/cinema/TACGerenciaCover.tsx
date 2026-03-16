'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAC GERENCIA COVER - Portada de 2 pantallas antes del SpotlightCard
// src/components/talent-actions/cinema/TACGerenciaCover.tsx
//
// CLONADO de: SuccessionCandidatesCover.tsx (estructura HTML/CSS/animaciones)
// DATOS de: GerenciaCover.tsx (narrativas por patron, ICC, metodologia)
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, HelpCircle, ArrowRight, X } from 'lucide-react'
import { getPatternLabel } from '@/config/tacLabels'
import type { GerenciaMapItem } from '@/lib/services/TalentActionService'

interface TACGerenciaCoverProps {
  gerencia: GerenciaMapItem
  onEnter: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVAS POR PATRON (de GerenciaCover.tsx)
// ════════════════════════════════════════════════════════════════════════════

const PATTERN_NARRATIVES: Record<string, {
  label: string
  color: string
  narrative: (name: string, icc: number | null) => string
  subtext: string
  methodology: string[]
}> = {
  FRAGIL: {
    label: 'Fragil',
    color: 'text-amber-400',
    narrative: (name, icc) =>
      `${name} tiene el talento para ejecutar, pero esta a punto de perderlo. Alto ajuste al rol, fuga activa y sin sucesores preparados.`,
    subtext: 'La proxima salida no tiene reemplazo.',
    methodology: [
      'RoleFit promedio del equipo superior al 75%',
      'Mas del 30% del equipo clasificado como Fuga de Cerebros',
      'Menos de 2 sucesores en plan formal de desarrollo',
    ]
  },
  QUEMADA: {
    label: 'Quemada',
    color: 'text-orange-400',
    narrative: (name) =>
      `${name} esta agotando a su equipo. El burnout no es un problema individual, es un patron que se detecta cuando persiste mas de 6 meses.`,
    subtext: 'La productividad cae antes de que la gente se vaya.',
    methodology: [
      'Mas del 35% del equipo clasificado como Riesgo de Burnout',
      'Mediana de antiguedad superior a 6 meses (no es desgaste de nuevos)',
      'Patron persistente que indica sobrecarga estructural',
    ]
  },
  ESTANCADA: {
    label: 'Estancada',
    color: 'text-yellow-400',
    narrative: (name) =>
      `${name} tiene gente que lleva anos sin moverse. No son nuevos. Llevan mas de 18 meses en desarrollo sin avance.`,
    subtext: 'Senal de gestion que no desarrolla ni rota.',
    methodology: [
      'Mas del 50% del equipo clasificado como En Desarrollo',
      'Mediana de antiguedad superior a 18 meses',
      'Combinacion que indica estancamiento, no crecimiento',
    ]
  },
  RIESGO_OCULTO: {
    label: 'Riesgo Oculto',
    color: 'text-purple-400',
    narrative: (name, icc) =>
      `${name} parece estable por fuera, pero concentra el ${icc ?? '--'}% de su conocimiento critico en pocas personas con alerta activa.`,
    subtext: 'El riesgo no es visible hasta que alguien se va.',
    methodology: [
      'Distribucion general de cuadrantes aparentemente sana',
      'ICC (Indice de Conocimiento Critico) superior al 25%',
      'Personas con alerta RED/ORANGE que ademas son Experto Ancla',
    ]
  },
  EN_TRANSICION: {
    label: 'En Transicion',
    color: 'text-blue-400',
    narrative: (name) =>
      `${name} tiene gente que quiere crecer pero todavia no esta lista. Ambicion sin preparacion genera frustacion y fuga prematura.`,
    subtext: 'Necesitan planes de desarrollo antes de que busquen afuera.',
    methodology: [
      'Mas del 35% del equipo clasificado como Ambicioso Prematuro',
      'Alta aspiracion de crecimiento con bajo ajuste al nivel siguiente',
      'Oportunidad si se canaliza, riesgo si se ignora',
    ]
  },
  SALUDABLE: {
    label: 'Fabrica de Talento',
    color: 'text-emerald-400',
    narrative: (name) =>
      `${name} es el modelo a replicar. Alto rendimiento sostenido, conocimiento distribuido y retencion activa del talento critico.`,
    subtext: 'Esta gerencia esta construyendo la organizacion del futuro.',
    methodology: [
      'Ningun patron de riesgo detectado',
      'Distribucion equilibrada de cuadrantes',
      'Conocimiento critico no concentrado en pocas personas',
    ]
  }
}

const DEFAULT_NARRATIVE = {
  label: 'Sin clasificar',
  color: 'text-slate-400',
  narrative: () => 'No hay suficientes datos para determinar el patron de esta gerencia.',
  subtext: 'Completa la calibracion para activar el diagnostico.',
  methodology: ['Requiere al menos 50% del equipo con matrices calculadas']
}

// ════════════════════════════════════════════════════════════════════════════
// HELP MODAL CONTENT (de GerenciaCover.tsx — ICC explanation)
// ════════════════════════════════════════════════════════════════════════════

const HELP_STEPS = [
  {
    num: '①',
    title: 'Que mide el ICC',
    body: 'Que porcentaje del equipo concentra conocimiento critico y al mismo tiempo tiene alerta de riesgo activa (RED u ORANGE).',
  },
  {
    num: '②',
    title: 'Como se calcula',
    body: 'Formula: personas con (alerta RED/ORANGE + perfil Experto Ancla) / total equipo x 100.',
  },
  {
    num: '③',
    title: 'ICC alto (>25%)',
    body: 'El conocimiento critico esta en manos de pocas personas que podrian irse. Accion urgente.',
  },
  {
    num: '④',
    title: 'ICC bajo (<10%)',
    body: 'Conocimiento distribuido. El equipo puede absorber salidas sin perder capacidad operativa.',
  },
]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT — Clonado de SuccessionCandidatesCover.tsx
// ════════════════════════════════════════════════════════════════════════════

export default function TACGerenciaCover({
  gerencia,
  onEnter,
}: TACGerenciaCoverProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [showHelp, setShowHelp] = useState(false)

  const config = gerencia.pattern
    ? (PATTERN_NARRATIVES[gerencia.pattern] || DEFAULT_NARRATIVE)
    : DEFAULT_NARRATIVE

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
            <Activity className="w-6 h-6 text-slate-700 absolute top-4 right-4" />

            {/* Narrative — nombre en cyan, datos en purple (patron Cinema Mode) */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xl md:text-2xl font-light text-white leading-relaxed max-w-2xl mb-6"
            >
              <span className="text-cyan-400 font-medium">{gerencia.gerenciaName}</span>
              {' '}
              {config.narrative(gerencia.gerenciaName, gerencia.icc).replace(gerencia.gerenciaName + ' ', '')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-base text-slate-400 font-light max-w-md mb-10"
            >
              {config.subtext}
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
                <span>Como lo detectamos</span>
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
            {/* Title — datos en cyan y purple (patron Cinema Mode) */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xl md:text-2xl font-light text-white leading-relaxed max-w-2xl mb-8"
            >
              Analizamos{' '}
              <span className="text-cyan-400 font-medium">{gerencia.totalPersonas}</span>{' '}
              personas y{' '}
              <span className="text-purple-400 font-medium">{gerencia.clasificadas}</span>{' '}
              tienen matrices calculadas. Tipologia{' '}
              <span className={`font-medium ${config.color}`}>{getPatternLabel(gerencia.pattern)}</span>{' '}
              detectada.
            </motion.p>

            {/* Methodology steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col gap-2 text-left max-w-xl w-full mb-8"
            >
              {config.methodology.map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-cyan-400 text-sm font-medium flex-shrink-0 w-5">
                    {'①②③④⑤'[i] || '·'}
                  </span>
                  <span className="text-xs text-slate-400 leading-relaxed">{text}</span>
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
                <span>Que es el ICC</span>
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
                <span>Ver personas de {gerencia.gerenciaName}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal — clonado de SuccessionCandidatesCover */}
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
                <h3 className="text-sm font-medium text-white">Indice de Conocimiento Critico (ICC)</h3>
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
