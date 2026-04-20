// ════════════════════════════════════════════════════════════════════════════
// ACTO ANCLA — Nivel 1B del Efficiency Hub (entre Shock Global y Familia)
// src/components/efficiency/ActoAncla.tsx
// ════════════════════════════════════════════════════════════════════════════
// El puente narrativo: el número del Shock Global se ramifica en 3 familias
// como acusaciones (Exposición / Capacidad / Riesgo) + 1 ancla científica
// (% exposición IA promedio — no clickeable).
//
// Inspirado visualmente en:
//   src/components/executive/AnclaInteligente.tsx
//
// Diferencias clave con AnclaInteligente:
//   · Centro = número CLP protagonista (no gauge con arco)
//   · Nodos = valores CLP/mes + % (no 0-100 con barras de progreso)
//   · Nodos 1-3 clickeables → seleccionan familia
//   · Nodo 4 es el ancla científica — no clickeable
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import {
  formatCLP,
  type FamiliaId,
} from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import type { DiagnosticData } from '@/hooks/useEfficiencyWorkspace'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface ActoAnclaProps {
  shockGlobalMonthly: number
  data: DiagnosticData
  onSelectFamilia: (familia: FamiliaId) => void
  onBack?: () => void
}

interface NodoFamilia {
  key: 'exposicion' | 'capacidad' | 'riesgo'
  familiaId: FamiliaId
  eyebrow: string
  valor: string
  unidad: string
  narrativa: string
  color: string
  colorText: string
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS DE CÁLCULO — unidades canónicas del motor
// ════════════════════════════════════════════════════════════════════════════

function calcularNodos(data: DiagnosticData): {
  nodos: NodoFamilia[]
  exposicionPctOrg: number
  personasAnalizadas: number
} {
  // L1 = CLP/mes ya mensual · L2 = CLP/año (÷12 para mensualizar)
  const l1Monthly =
    (data.lentes.l1_inercia?.detalle as { totalMonthly?: number } | null)
      ?.totalMonthly ?? 0
  const l2Annual =
    (data.lentes.l2_zombie?.detalle as { totalInertiaCost?: number } | null)
      ?.totalInertiaCost ?? 0
  const exposicionMonthly = l1Monthly + l2Annual / 12

  // L4 = CLP/año (÷12) · L5 = CLP/mes ya mensual
  const l4Annual =
    (data.lentes.l4_fantasma?.detalle as { totalEstimatedSavings?: number } | null)
      ?.totalEstimatedSavings ?? 0
  const l5Monthly =
    (data.lentes.l5_brecha?.detalle as { total?: number } | null)?.total ?? 0
  const capacidadMonthly = l4Annual / 12 + l5Monthly

  // L9 = CLP total 12 meses (no se mensualiza, se muestra como "en 12m")
  const riesgoTotal12m =
    (data.lentes.l9_pasivo?.detalle as { costoEsperaTotal?: number } | null)
      ?.costoEsperaTotal ?? 0

  const nodos: NodoFamilia[] = [
    {
      key: 'exposicion',
      familiaId: 'choque_tecnologico',
      eyebrow: 'Exposición al cambio',
      valor: formatCLP(exposicionMonthly),
      unidad: '/ mes',
      narrativa: 'Trabajo que la IA ya resuelve.',
      color: '#22D3EE',
      colorText: 'text-cyan-400',
    },
    {
      key: 'capacidad',
      familiaId: 'grasa_organizacional',
      eyebrow: 'Capacidad recuperable',
      valor: formatCLP(capacidadMonthly),
      unidad: '/ mes',
      narrativa: 'Rendimiento atrapado por diseño.',
      color: '#A78BFA',
      colorText: 'text-purple-400',
    },
    {
      key: 'riesgo',
      familiaId: 'riesgo_financiero',
      eyebrow: 'Riesgo de inacción',
      valor: formatCLP(riesgoTotal12m),
      unidad: 'en 12 meses',
      narrativa: 'Lo que cuesta esperar un año.',
      color: '#F59E0B',
      colorText: 'text-amber-400',
    },
  ]

  const exposicionPctOrg = Math.round((data.meta.avgExposure ?? 0) * 100)
  const personasAnalizadas = data.meta.enrichedCount ?? data.meta.totalEmployees ?? 0

  return { nodos, exposicionPctOrg, personasAnalizadas }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function ActoAncla({
  shockGlobalMonthly,
  data,
  onSelectFamilia,
  onBack,
}: ActoAnclaProps) {
  const { nodos, exposicionPctOrg, personasAnalizadas } = calcularNodos(data)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-full flex flex-col items-center justify-center px-4 md:px-6"
    >
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="self-start flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Portada
        </button>
      )}

      {/* ═══ CENTRO — número protagonista (mismo que ShockGlobalPortada) ═══ */}
      <div className="text-center">
        <p
          className="font-extralight text-white leading-none"
          style={{
            fontSize: 'clamp(56px, 9vw, 96px)',
            letterSpacing: '-0.03em',
          }}
        >
          {formatCLP(shockGlobalMonthly)}
        </p>
        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 mt-4">
          al mes
        </p>
      </div>

      {/* ═══ LÍNEAS SVG — del centro hacia los 4 nodos ═══ */}
      <div className="relative w-full max-w-5xl mt-10">
        <svg
          className="absolute inset-x-0 top-0 w-full pointer-events-none"
          style={{ height: 80 }}
          viewBox="0 0 1000 80"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="acto-ancla-line"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map(idx => {
            const originX = 500
            const originY = 0
            const nodeX = 1000 * ((idx + 0.5) / 4)
            const nodeY = 75
            const ctrlX = (originX + nodeX) / 2
            const ctrlY = 40
            const path = `M ${originX} ${originY} Q ${ctrlX} ${ctrlY}, ${nodeX} ${nodeY}`

            return (
              <motion.path
                key={`line-${idx}`}
                d={path}
                stroke="url(#acto-ancla-line)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.4 + idx * 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            )
          })}
        </svg>

        {/* ═══ NODOS — 3 clickeables + 1 ancla científica ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-20">
          {nodos.map((nodo, idx) => (
            <motion.button
              key={nodo.key}
              onClick={() => onSelectFamilia(nodo.familiaId)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + idx * 0.15 }}
              className="group text-center rounded-xl px-3 py-4 transition-all duration-300 hover:bg-slate-900/40 focus:outline-none focus-visible:bg-slate-900/40"
            >
              <p
                className={`text-[10px] uppercase tracking-widest font-medium mb-3 ${nodo.colorText}`}
              >
                {nodo.eyebrow}
              </p>
              <p className="text-2xl md:text-3xl font-extralight text-white tabular-nums leading-none">
                {nodo.valor}
              </p>
              <p className="text-[10px] font-light text-slate-500 mt-2 tracking-wide">
                {nodo.unidad}
              </p>
              <p className="text-[11px] font-light text-slate-400 mt-3 leading-snug max-w-[180px] mx-auto">
                {nodo.narrativa}
              </p>

              {/* Micro-línea de color con glow sutil, más intensa en hover */}
              <div
                className="h-[2px] mt-4 mx-auto w-12 rounded-full transition-all duration-300 group-hover:w-16"
                style={{
                  backgroundColor: nodo.color,
                  opacity: 0.5,
                  boxShadow: `0 0 10px ${nodo.color}60`,
                }}
              />
            </motion.button>
          ))}

          {/* Nodo 4: Ancla científica — slate, no clickeable */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + 3 * 0.15 }}
            className="text-center px-3 py-4 cursor-default"
          >
            <p className="text-[10px] uppercase tracking-widest font-medium mb-3 text-slate-500">
              Dato irrefutable
            </p>
            <p className="text-2xl md:text-3xl font-extralight text-slate-300 tabular-nums leading-none">
              {exposicionPctOrg}
              <span className="text-lg text-slate-600 font-light">%</span>
            </p>
            <p className="text-[10px] font-light text-slate-500 mt-2 tracking-wide">
              exposición IA
            </p>
            <p className="text-[11px] font-light text-slate-500 mt-3 leading-snug max-w-[180px] mx-auto">
              {personasAnalizadas.toLocaleString('es-CL')} personas analizadas
              con focalizaScore.
            </p>

            <div
              className="h-[2px] mt-4 mx-auto w-12 rounded-full"
              style={{ backgroundColor: '#64748B', opacity: 0.3 }}
            />
          </motion.div>
        </div>
      </div>

      {/* Nota inferior sutil — indica interactividad */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.4 }}
        className="text-[10px] tracking-[0.2em] uppercase text-slate-600 font-light mt-10"
      >
        Selecciona un frente para operar
      </motion.p>
    </motion.div>
  )
})
