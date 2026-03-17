'use client'

// ════════════════════════════════════════════════════════════════════════════
// GERENCIA COVER — Portada vertical con insight + metricas + acciones
// Rediseño: layout vertical claro, sin 2 columnas, sin pasos
// Datos: mismos que antes (GerenciaMapItem + pattern narratives)
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, HelpCircle, X } from 'lucide-react'
import CheckoutPanel from './CheckoutPanel'
import type { GerenciaMapItem } from '@/lib/services/TalentActionService'

interface GerenciaCoverProps {
  gerencia: GerenciaMapItem
  onEnterContent: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVAS POR PATRON
// ════════════════════════════════════════════════════════════════════════════

const PATTERN_CONFIG: Record<string, {
  label: string
  badgeClass: string
  coachingTip: string
  narrative: (name: string, icc: number | null) => string
}> = {
  FRAGIL: {
    label: 'Fragil',
    badgeClass: 'bg-red-500/15 text-red-400 border border-red-500/20',
    coachingTip: 'Priorizar retención del conocimiento crítico antes de cualquier movimiento. La próxima salida no tiene reemplazo.',
    narrative: (name, icc) =>
      `Equipo con alto ajuste al rol pero fuga activa y sin sucesores preparados. ${icc ? `${icc}% del conocimiento crítico concentrado en personas con alerta.` : ''}`,
  },
  QUEMADA: {
    label: 'Quemada',
    badgeClass: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    coachingTip: 'El burnout no es un problema individual. Revisar carga de trabajo estructural antes de intervenciones individuales.',
    narrative: (name) =>
      `Equipo sobrecargado con señales de burnout activo. El patrón persiste más de 6 meses, indicando sobrecarga estructural.`,
  },
  ESTANCADA: {
    label: 'Estancada',
    badgeClass: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
    coachingTip: 'Gente que lleva años sin moverse no es estabilidad, es estancamiento. Revisar planes de desarrollo y rotación.',
    narrative: () =>
      `Más del 50% del equipo lleva +18 meses en desarrollo sin avance. Señal de gestión que no desarrolla ni rota.`,
  },
  RIESGO_OCULTO: {
    label: 'Riesgo Oculto',
    badgeClass: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
    coachingTip: 'El riesgo no es visible hasta que alguien se va. Distribuir conocimiento crítico es la prioridad.',
    narrative: (name, icc) =>
      `Parece estable por fuera, pero concentra el ${icc ?? '--'}% de su conocimiento crítico en pocas personas con alerta activa.`,
  },
  EN_TRANSICION: {
    label: 'En Transicion',
    badgeClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    coachingTip: 'Ambición sin preparación genera frustración y fuga prematura. Canalizar con planes de desarrollo.',
    narrative: () =>
      `Equipo con alta aspiración de crecimiento pero bajo ajuste al nivel siguiente. Oportunidad si se canaliza, riesgo si se ignora.`,
  },
  SALUDABLE: {
    label: 'Fabrica de Talento',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    coachingTip: 'Esta gerencia es el modelo a replicar. Documentar sus prácticas para transferir a otras áreas.',
    narrative: () =>
      `Alto rendimiento sostenido, conocimiento distribuido y retención activa del talento crítico. Modelo a replicar.`,
  }
}

const DEFAULT_CONFIG = {
  label: 'Sin clasificar',
  badgeClass: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',
  coachingTip: 'Completa la calibración para activar el diagnóstico automático.',
  narrative: () => 'No hay suficientes datos para determinar el patrón de esta gerencia.',
}

// ════════════════════════════════════════════════════════════════════════════
// COLORES METRICAS
// ════════════════════════════════════════════════════════════════════════════

const METRIC_COLORS = {
  FUGA_CEREBROS: 'text-amber-400',
  BURNOUT_RISK: 'text-red-400',
  MOTOR_EQUIPO: 'text-emerald-400',
  BAJO_RENDIMIENTO: 'text-slate-400',
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function GerenciaCover({ gerencia, onEnterContent }: GerenciaCoverProps) {
  const [showHelp, setShowHelp] = useState(false)

  const config = gerencia.pattern
    ? (PATTERN_CONFIG[gerencia.pattern] || DEFAULT_CONFIG)
    : DEFAULT_CONFIG

  const narrativeText = config.narrative(gerencia.gerenciaName, gerencia.icc)

  return (
    <div className="flex flex-col items-center">

      {/* ═══════════════════════════════════════════════════════════════
          1. CARD PRINCIPAL — Insight + Metricas
         ═══════════════════════════════════════════════════════════════ */}
      <div className="w-full max-w-3xl rounded-2xl bg-[#0F172A] border border-slate-800 p-8 relative overflow-hidden">

        {/* Esferas difusas */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">

          {/* a) Badge patron */}
          {gerencia.pattern && (
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`inline-flex px-4 py-1.5 rounded-full text-sm font-medium ${config.badgeClass}`}
            >
              {config.label}
            </motion.span>
          )}

          {/* b) Nombre gerencia */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-light text-white mt-4"
          >
            {gerencia.gerenciaName}
          </motion.h1>

          {/* c) Linea Tesla */}
          <div className="flex items-center justify-center gap-3 my-6">
            <div className="h-px w-16 bg-white/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <div className="h-px w-16 bg-white/20" />
          </div>

          {/* d) Narrativa insight */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-lg text-slate-300 text-center max-w-2xl mx-auto leading-relaxed"
          >
            {narrativeText}
          </motion.p>

          {/* Contexto secundario */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4 text-xs text-slate-500 mt-4"
          >
            {gerencia.icc !== null && (
              <span>ICC: <span className="text-cyan-400 font-medium">{gerencia.icc}%</span></span>
            )}
            <span>{gerencia.clasificadas} de {gerencia.totalPersonas} clasificados</span>
            {gerencia.sucesores.total > 0 && (
              <button
                onClick={() => setShowHelp(true)}
                className="flex items-center gap-1 text-slate-500 hover:text-cyan-400 transition-colors"
              >
                <HelpCircle className="w-3 h-3" />
                ICC
              </button>
            )}
          </motion.div>

          {/* e) Metricas — grid 4 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-4 gap-4 mt-8 max-w-xl mx-auto w-full"
          >
            <MetricCard
              value={gerencia.riskDistribution.FUGA_CEREBROS}
              label="Talento en riesgo"
              color={METRIC_COLORS.FUGA_CEREBROS}
            />
            <MetricCard
              value={gerencia.riskDistribution.BURNOUT_RISK}
              label="Sobrecargado"
              color={METRIC_COLORS.BURNOUT_RISK}
            />
            <MetricCard
              value={gerencia.riskDistribution.MOTOR_EQUIPO}
              label="Pilar"
              color={METRIC_COLORS.MOTOR_EQUIPO}
            />
            <MetricCard
              value={gerencia.riskDistribution.BAJO_RENDIMIENTO}
              label="Bajo rendimiento"
              color={METRIC_COLORS.BAJO_RENDIMIENTO}
            />
          </motion.div>

          {/* f) Link ver detalle */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            onClick={onEnterContent}
            className="text-cyan-400 hover:text-cyan-300 text-sm mt-6 inline-flex items-center gap-1 transition-colors"
          >
            Ver distribucion de talento completa
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. COACHING TIP
         ═══════════════════════════════════════════════════════════════ */}
      <div className="w-full max-w-3xl">
        <div className="h-px bg-slate-700/50 my-8" />
        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
            Coaching Tip
          </p>
          <p className="text-slate-400 text-sm italic max-w-xl mx-auto">
            {config.coachingTip}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          3. ACCIONES
         ═══════════════════════════════════════════════════════════════ */}
      {gerencia.pattern && gerencia.pattern !== 'SALUDABLE' && (
        <div className="w-full max-w-3xl">
          <div className="h-px bg-slate-700/50 my-8" />
          <CheckoutPanel
            gerenciaId={gerencia.gerenciaId}
            gerenciaName={gerencia.gerenciaName}
            pattern={gerencia.pattern}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          HELP MODAL — ICC
         ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-medium text-white">Indice de Conocimiento Critico</h4>
                <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <p>
                  El ICC mide que porcentaje del equipo concentra conocimiento critico
                  y al mismo tiempo tiene alerta de riesgo activa (RED u ORANGE).
                </p>
                <p className="text-slate-400">
                  Formula: personas con (alerta RED/ORANGE + perfil Experto Ancla) / total equipo x 100
                </p>
                <p className="text-slate-400">
                  Un ICC alto significa que el conocimiento critico esta en manos de pocas personas
                  que podrian irse. Un ICC bajo indica conocimiento distribuido.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// METRIC CARD — Cinema Mode style
// ════════════════════════════════════════════════════════════════════════════

function MetricCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-slate-800 rounded-[16px] p-4 text-center">
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  )
}
