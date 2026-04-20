// ════════════════════════════════════════════════════════════════════════════
// ACTO ANCLA — Nivel 1B del Efficiency Hub (entre Shock Global y Familia)
// src/components/efficiency/ActoAncla.tsx
// ════════════════════════════════════════════════════════════════════════════
// CLON VISUAL de src/components/executive/AnclaInteligente.tsx
// (el Acto Ancla que usa Workforce y P&L Talent).
//
// Gauge central sin arco de progreso (solo track tenue) con el capital
// comprometido total. Los 4 nodos NO son clickeables — muestran los 3
// cargos con mayor capital expuesto (desde L1.byPosition) + 1 nodo
// ancla científica con la exposición global de la organización.
//
// Un único CTA primario abajo: "Explorar capital en riesgo →" que
// navega a FamilyBriefing de la familia `capital_en_riesgo`.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import {
  formatCLP,
  formatInt,
  type FamiliaId,
} from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import type { DiagnosticData } from '@/hooks/useEfficiencyWorkspace'

// ════════════════════════════════════════════════════════════════════════════
// GAUGE GEOMETRY — clonado del original, agrandado para CLP
// ════════════════════════════════════════════════════════════════════════════

const GAUGE_SIZE = 360
const GAUGE_STROKE = 10
const GAUGE_RADIUS = GAUGE_SIZE / 2 - GAUGE_STROKE - 8

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface ActoAnclaProps {
  data: DiagnosticData
  onSelectFamilia: (familia: FamiliaId) => void
  onBack?: () => void
}

interface NodoData {
  /** Valor grande ya formateado (ej: "$20.5M" o "72%") */
  displayValue: string
  /** Título corto uppercase del cargo o etiqueta ancla */
  label: string
  /** Subtítulo descriptivo (ej: "72% tareas automatizables · 12 FTEs") */
  sublabel: string
  /** Ancla científica → render diferenciado (borde más tenue + icon Info) */
  isAnchor: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// BUILD NODOS — top 3 cargos desde L1.byPosition + nodo ancla (focalizaScore)
// ════════════════════════════════════════════════════════════════════════════

interface PositionCostShape {
  position: string
  monthlyCost: number
  headcount: number
  avgExposure: number
}

function buildNodos(data: DiagnosticData): NodoData[] {
  const byPosition =
    ((data.lentes.l1_inercia?.detalle as { byPosition?: PositionCostShape[] } | null)
      ?.byPosition ?? []) as PositionCostShape[]

  const top3 = [...byPosition]
    .sort((a, b) => b.monthlyCost - a.monthlyCost)
    .slice(0, 3)

  const cargos: NodoData[] = top3.map(p => ({
    displayValue: formatCLP(p.monthlyCost),
    label: p.position,
    sublabel: `${Math.round(p.avgExposure * 100)}% tareas automatizables · ${formatInt(p.headcount)} FTE${p.headcount === 1 ? '' : 's'}`,
    isAnchor: false,
  }))

  // Padding si hay menos de 3 cargos con data — nodos ghost
  while (cargos.length < 3) {
    cargos.push({
      displayValue: '—',
      label: 'Sin señal',
      sublabel: 'No se detectaron cargos en zona crítica',
      isAnchor: false,
    })
  }

  // Nodo 4 — ancla científica (exposición IA global)
  const exposicionPctOrg = Math.round((data.meta.avgExposure ?? 0) * 100)
  const personasAnalizadas =
    data.meta.enrichedCount ?? data.meta.totalEmployees ?? 0
  cargos.push({
    displayValue: `${exposicionPctOrg}%`,
    label: 'Exposición global',
    sublabel: `Basado en ${formatInt(personasAnalizadas)} posiciones analizadas`,
    isAnchor: true,
  })

  return cargos
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function ActoAncla({
  data,
  onSelectFamilia,
  onBack,
}: ActoAnclaProps) {
  const nodes = useMemo(() => buildNodos(data), [data])

  // Capital comprometido en cargos de alta exposición = L1.totalMonthly
  // (inercia mensual). Distinto del número de la portada (L1+L5) porque
  // L5 es brecha de productividad, no exposición IA.
  const capitalMensual = useMemo(() => {
    const d = data.lentes.l1_inercia?.detalle as
      | { totalMonthly?: number }
      | null
    return d?.totalMonthly ?? 0
  }, [data])

  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm">
      {/* Tesla line top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="px-6 py-10 md:px-10 md:py-14">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Portada
          </button>
        )}

        {/* ═══ GAUGE CENTRAL — anillo tenue sin progress ═══ */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
            style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}
          >
            <svg
              className="absolute inset-0 -rotate-90"
              viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
            >
              <circle
                cx={GAUGE_SIZE / 2}
                cy={GAUGE_SIZE / 2}
                r={GAUGE_RADIUS}
                fill="none"
                stroke="rgba(51, 65, 85, 0.3)"
                strokeWidth={GAUGE_STROKE}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-[96px] font-extralight text-white leading-none tabular-nums tracking-tight"
              >
                {formatCLP(capitalMensual)}
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                className="text-xs tracking-widest uppercase text-slate-500 font-light mt-4 max-w-[260px] leading-snug"
              >
                Capital comprometido en cargos de alta exposición
              </motion.span>
            </div>
          </motion.div>
        </div>

        {/* ═══ LÍNEAS SVG + NODOS ═══ */}
        <div className="relative mt-2">
          <svg
            className="absolute inset-x-0 top-0 w-full pointer-events-none"
            style={{ height: 80 }}
            viewBox="0 0 1000 80"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="acto-ancla-line" x1="0%" y1="0%" x2="0%" y2="100%">
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
                  stroke="url(#acto-ancla-line)"
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

          {/* Nodos (NO clickeables) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-20">
            {nodes.map((node, idx) => (
              <motion.div
                key={`node-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.4 + idx * 0.15 }}
                className={
                  node.isAnchor
                    ? 'text-center border-l border-slate-800/30 pl-4'
                    : 'text-center'
                }
              >
                <p
                  className={
                    node.isAnchor
                      ? 'text-3xl md:text-4xl font-extralight font-mono tabular-nums leading-none text-slate-300'
                      : 'text-3xl md:text-4xl font-extralight font-mono tabular-nums leading-none text-white'
                  }
                >
                  {node.displayValue}
                </p>

                <div className="flex items-center justify-center gap-1 mt-3">
                  <p
                    className={
                      node.isAnchor
                        ? 'text-[10px] uppercase tracking-wider text-slate-500 font-medium'
                        : 'text-[10px] uppercase tracking-wider text-slate-400 font-medium'
                    }
                  >
                    {node.label}
                  </p>
                  {node.isAnchor && (
                    <Info className="w-3 h-3 text-slate-600" aria-hidden />
                  )}
                </div>

                <p className="text-[11px] font-light text-slate-500 leading-snug mt-1.5 max-w-[200px] mx-auto">
                  {node.sublabel}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ═══ CTA ÚNICO ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.4 + nodes.length * 0.15 + 0.3 }}
          className="flex justify-center mt-10"
        >
          <PrimaryButton
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => onSelectFamilia('capital_en_riesgo')}
          >
            Explorar capital en riesgo
          </PrimaryButton>
        </motion.div>
      </div>
    </div>
  )
})
