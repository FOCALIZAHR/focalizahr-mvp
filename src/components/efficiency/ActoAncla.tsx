// ════════════════════════════════════════════════════════════════════════════
// ACTO ANCLA — Nivel 1B del Efficiency Hub (entre Shock Global y Familia)
// src/components/efficiency/ActoAncla.tsx
// ════════════════════════════════════════════════════════════════════════════
// CLON LITERAL de src/components/executive/AnclaInteligente.tsx
// (el Acto Ancla que usa Workforce y P&L Talent).
//
// Cambios permitidos sobre el original:
//   1. El valor % del gauge se reemplaza por $65.2M (CLP/mes del Shock Global)
//   2. Se elimina el arco de progreso/relleno — queda solo el track tenue
//   3. GAUGE_SIZE agrandado de 272 → 360 para que el CLP quepa sin tocar
//      la tipografía (text-[96px] font-extralight se mantiene intacta)
//
// Todo lo demás (líneas SVG curvas, estructura de nodos, tipografía de
// nodos, micro-barras de 2px, espaciados, animaciones staggered) es
// literal del archivo original.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatCLP,
  type FamiliaId,
} from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import type { DiagnosticData } from '@/hooks/useEfficiencyWorkspace'

// ════════════════════════════════════════════════════════════════════════════
// GAUGE GEOMETRY — clonado del original, agrandado para CLP
// ════════════════════════════════════════════════════════════════════════════

const GAUGE_SIZE = 360 // 272 original → 360 para que $XX.XM quepa en text-[96px]
const GAUGE_STROKE = 10
const GAUGE_RADIUS = GAUGE_SIZE / 2 - GAUGE_STROKE - 8

// ════════════════════════════════════════════════════════════════════════════
// COLOR LOGIC — mismos hex que AnclaInteligente original
// ════════════════════════════════════════════════════════════════════════════

const TIER_HEX = {
  cyan: '#22D3EE',
  amber: '#F59E0B',
  purple: '#A78BFA',
  slate: '#64748B',
} as const

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface ActoAnclaProps {
  shockGlobalMonthly: number
  data: DiagnosticData
  onSelectFamilia: (familia: FamiliaId) => void
  onBack?: () => void
}

interface AnclaNodo {
  /** string ya formateado (ej: "$65.2M", "72%") */
  displayValue: string
  /** label uppercase corto (ej: "Exposición al cambio") */
  label: string
  /** narrativa de una línea */
  narrative: string
  /** tier de color */
  tier: 'cyan' | 'amber' | 'purple' | 'slate'
  /** width 0-100 de la micro-barra */
  barWidth: number
  /** handler de click; si null el nodo es el ancla científica no interactiva */
  onClick: (() => void) | null
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTRUCCIÓN DE NODOS — unidades canónicas del motor
// ════════════════════════════════════════════════════════════════════════════

function buildNodos(
  data: DiagnosticData,
  onSelectFamilia: (familia: FamiliaId) => void
): AnclaNodo[] {
  // L1 = CLP/mes ya mensual · L2 = CLP/año (÷12)
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

  // L9 = CLP total 12 meses (no se mensualiza)
  const riesgoTotal12m =
    (data.lentes.l9_pasivo?.detalle as { costoEsperaTotal?: number } | null)
      ?.costoEsperaTotal ?? 0

  const exposicionPctOrg = Math.round((data.meta.avgExposure ?? 0) * 100)

  return [
    {
      displayValue: formatCLP(exposicionMonthly),
      label: 'Exposición al cambio',
      narrative: 'Trabajo que la IA ya resuelve.',
      tier: 'cyan',
      barWidth: 100,
      onClick: () => onSelectFamilia('choque_tecnologico'),
    },
    {
      displayValue: formatCLP(capacidadMonthly),
      label: 'Capacidad recuperable',
      narrative: 'Rendimiento atrapado por diseño.',
      tier: 'purple',
      barWidth: 100,
      onClick: () => onSelectFamilia('grasa_organizacional'),
    },
    {
      displayValue: formatCLP(riesgoTotal12m),
      label: 'Riesgo de inacción',
      narrative: 'Lo que cuesta esperar un año.',
      tier: 'amber',
      barWidth: 100,
      onClick: () => onSelectFamilia('riesgo_financiero'),
    },
    {
      displayValue: `${exposicionPctOrg}%`,
      label: 'Dato irrefutable',
      narrative: `${(data.meta.enrichedCount ?? data.meta.totalEmployees ?? 0).toLocaleString('es-CL')} personas con focalizaScore.`,
      tier: 'slate',
      barWidth: Math.max(0, Math.min(100, exposicionPctOrg)),
      onClick: null,
    },
  ]
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE — JSX CLONADO LITERAL DE AnclaInteligente
// ════════════════════════════════════════════════════════════════════════════

export default memo(function ActoAncla({
  shockGlobalMonthly,
  data,
  onSelectFamilia,
  onBack,
}: ActoAnclaProps) {
  const nodes = useMemo(() => buildNodos(data, onSelectFamilia), [data, onSelectFamilia])

  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm">
      {/* Tesla line top — literal del original */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="px-6 py-10 md:px-10 md:py-14">
        {/* Back button — literal del original */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Portada
          </button>
        )}

        {/* ═══ GAUGE CENTRAL ═══ (clonado, sin arco de progreso) */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
            style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}
          >
            {/* SVG gauge — SOLO track, sin progress arc */}
            <svg
              className="absolute inset-0 -rotate-90"
              viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
            >
              {/* Track tenue slate-700/30 */}
              <circle
                cx={GAUGE_SIZE / 2}
                cy={GAUGE_SIZE / 2}
                r={GAUGE_RADIUS}
                fill="none"
                stroke="rgba(51, 65, 85, 0.3)"
                strokeWidth={GAUGE_STROKE}
              />
            </svg>

            {/* Número protagonista + label — misma tipografía del original
                (text-[96px] + label text-[10px] tracking-[3px]), única
                diferencia: font-extralight (firma visual Shock Global) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-[96px] font-extralight text-white leading-none tabular-nums tracking-tight"
              >
                {formatCLP(shockGlobalMonthly)}
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-[10px] uppercase tracking-[3px] text-slate-500 font-medium mt-1"
              >
                al mes
              </motion.span>
            </div>
          </motion.div>
        </div>

        {/* ═══ LÍNEAS SVG + NODOS ═══ (literal del original) */}
        <div className="relative mt-2">
          {/* SVG overlay con líneas curvas que irradian del gauge hacia los nodos */}
          <svg
            className="absolute inset-x-0 top-0 w-full pointer-events-none"
            style={{ height: 80 }}
            viewBox="0 0 1000 80"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="ancla-line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            {nodes.map((_, idx) => {
              const originX = 500
              const originY = 0
              const nodeX = 1000 * ((idx + 0.5) / nodes.length)
              const nodeY = 75
              const ctrlX = (originX + nodeX) / 2
              const ctrlY = 40
              const path = `M ${originX} ${originY} Q ${ctrlX} ${ctrlY}, ${nodeX} ${nodeY}`

              return (
                <motion.path
                  key={`line-${idx}`}
                  d={path}
                  stroke="url(#ancla-line-gradient)"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 0.6,
                    delay: 1.2 + idx * 0.15,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              )
            })}
          </svg>

          {/* Nodos — literal del original (text-3xl md:text-4xl font-extralight
              font-mono tabular-nums + barra h-[2px] + label + narrativa).
              Los 3 primeros son <button> clickeables; el 4to es <div>. */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-20">
            {nodes.map((node, idx) => {
              const nodeColor = TIER_HEX[node.tier]
              const isInteractive = node.onClick !== null
              const Element: 'button' | 'div' = isInteractive ? 'button' : 'div'

              return (
                <motion.div
                  key={`node-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.4 + idx * 0.15 }}
                >
                  <Element
                    {...(isInteractive
                      ? { onClick: node.onClick ?? undefined, type: 'button' as const }
                      : {})}
                    className={cn(
                      'w-full text-center',
                      isInteractive &&
                        'cursor-pointer transition-colors rounded-lg hover:bg-slate-900/40 focus:outline-none focus-visible:bg-slate-900/40'
                    )}
                  >
                    {/* Número grande — literal del original */}
                    <p className="text-3xl md:text-4xl font-extralight font-mono tabular-nums leading-none text-white">
                      {node.displayValue}
                    </p>

                    {/* Micro-barra 2px — literal del original */}
                    <div className="h-[2px] bg-slate-800/60 rounded-full mt-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${node.barWidth}%` }}
                        transition={{
                          duration: 0.8,
                          delay: 1.6 + idx * 0.15,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: nodeColor }}
                      />
                    </div>

                    {/* Label — literal del original */}
                    <div className="flex items-center justify-center gap-1 mt-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                        {node.label}
                      </p>
                    </div>

                    {/* Narrativa — literal del original */}
                    <p className="text-[11px] font-light text-slate-500 leading-snug mt-1.5 max-w-[180px] mx-auto">
                      {node.narrative}
                    </p>
                  </Element>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
})
