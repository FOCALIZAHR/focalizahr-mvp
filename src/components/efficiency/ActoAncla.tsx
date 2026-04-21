// ════════════════════════════════════════════════════════════════════════════
// ACTO ANCLA — Nivel 1B del Efficiency Hub (entre Shock Global y Familia)
// src/components/efficiency/ActoAncla.tsx
// ════════════════════════════════════════════════════════════════════════════
// CLON LITERAL del patrón visual de
//   src/components/executive/AnclaInteligente.tsx
// (el Acto Ancla que usa Workforce y P&L Talent).
//
// Preserva los 7 elementos canónicos:
//   1. GAUGE_SIZE 272                       2. Glow background detrás del gauge
//   3. Tipografía font-semibold del score   4. Label corto dentro del gauge
//   5. Tier dinámico de nodos               6. Micro-barra 2px proporcional
//   7. Sin border-l decorativo en ningún nodo
//
// Adaptaciones permitidas para CLP:
//   · Sin arco de progreso (queda solo el track)
//   · Número central = capital comprometido en CLP, formato "$XX[.X]M"
//     manteniendo el patrón "{score}<suffix>" del original
//   · Label corto "AL MES"
//   · barWidth = proporción del nodo sobre el total (en % 0-100)
//   · Tier por proporción: mayor=cyan · medio=amber · menor=purple · ancla=slate
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import {
  formatInt,
  type FamiliaId,
} from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import { normalizePositionText } from '@/lib/utils/normalizePosition'
import { toTitleCase } from '@/lib/utils/formatName'
import type { DiagnosticData } from '@/hooks/useEfficiencyWorkspace'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface ActoAnclaProps {
  data: DiagnosticData
  onSelectFamilia: (familia: FamiliaId) => void
  onBack?: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COLOR LOGIC — clonado de AnclaInteligente + tier 'slate' para ancla
// ════════════════════════════════════════════════════════════════════════════

type TierColor = 'cyan' | 'amber' | 'purple' | 'slate'

const TIER_HEX: Record<TierColor, string> = {
  cyan: '#22D3EE',
  amber: '#F59E0B',
  purple: '#A78BFA',
  slate: '#64748B',
}

const TIER_TEXT: Record<TierColor, string> = {
  cyan: 'text-cyan-400',
  amber: 'text-amber-400',
  purple: 'text-purple-400',
  slate: 'text-slate-400',
}

// ════════════════════════════════════════════════════════════════════════════
// GAUGE GEOMETRY — reducido a 220px para caber sin scroll en una pantalla
// (gauge + líneas SVG + 4 nodos + CTA en h-[calc(100vh-120px)]).
// ════════════════════════════════════════════════════════════════════════════

const GAUGE_SIZE = 220
const GAUGE_STROKE = 8
const GAUGE_RADIUS = GAUGE_SIZE / 2 - GAUGE_STROKE - 8

// ════════════════════════════════════════════════════════════════════════════
// HELPER — split CLP en mainText + unit para usar el patrón "{score}<suffix>"
// "$782M" → { mainText: "$782", unit: "M" }   (anual sin decimales)
// "$1MM"  → { mainText: "$1",   unit: "MM" }
// El Acto Ancla usa siempre noDecimals=true (valor anual, números limpios).
// ════════════════════════════════════════════════════════════════════════════

function splitCLP(
  value: number,
  noDecimals = false
): { mainText: string; unit: string } {
  if (!isFinite(value) || value <= 0) return { mainText: '$0', unit: '' }
  if (value >= 1_000_000_000) {
    const main = noDecimals
      ? String(Math.round(value / 1_000_000_000))
      : (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')
    return { mainText: `$${main}`, unit: 'MM' }
  }
  if (value >= 1_000_000) {
    const main = noDecimals
      ? String(Math.round(value / 1_000_000))
      : (value / 1_000_000).toFixed(1).replace(/\.0$/, '')
    return { mainText: `$${main}`, unit: 'M' }
  }
  if (value >= 1_000) {
    return { mainText: `$${Math.round(value / 1_000)}`, unit: 'k' }
  }
  return { mainText: `$${Math.round(value)}`, unit: '' }
}

// ════════════════════════════════════════════════════════════════════════════
// BUILD NODOS — top 3 cargos + ancla científica
// ════════════════════════════════════════════════════════════════════════════

interface PositionCostShape {
  position: string
  monthlyCost: number
  headcount: number
  avgExposure: number
}

interface NodoData {
  /** Texto principal del número (ej: "$20.5", "43") */
  mainText: string
  /** Sufijo pequeño (ej: "M", "%", "MM") */
  unit: string
  /** Label uppercase corto (cargo o etiqueta ancla) */
  label: string
  /** Narrativa de una línea */
  narrative: string
  /** Tier de color */
  tier: TierColor
  /** Width 0-100 de la micro-barra */
  barWidth: number
  /** Tooltip opcional con sustento (solo nodo ancla) */
  tooltip?: string
}

function buildNodos(data: DiagnosticData): NodoData[] {
  const byPosition =
    ((data.lentes.l1_inercia?.detalle as { byPosition?: PositionCostShape[] } | null)
      ?.byPosition ?? []) as PositionCostShape[]

  const top3 = [...byPosition]
    .sort((a, b) => b.monthlyCost - a.monthlyCost)
    .slice(0, 3)

  const totalTop3 = top3.reduce((s, p) => s + p.monthlyCost, 0)

  // Tiers asignados por orden: mayor → cyan, medio → amber, menor → purple
  const TIERS_BY_RANK: TierColor[] = ['cyan', 'amber', 'purple']

  const cargos: NodoData[] = top3.map((p, idx) => {
    // Valor anual sin decimales — alineado con el contexto "MM$ / AÑO" central
    const annual = p.monthlyCost * 12
    const split = splitCLP(annual, true)
    const proporcion = totalTop3 > 0 ? (p.monthlyCost / totalTop3) * 100 : 0
    return {
      mainText: split.mainText,
      unit: split.unit,
      // "ANALISTA_RRHH" → normalize → "analista rrhh" → toTitleCase → "Analista Rrhh"
      label: toTitleCase(normalizePositionText(p.position)),
      narrative: `${Math.round(p.avgExposure * 100)}% tareas automatizables · ${formatInt(p.headcount)} FTE${p.headcount === 1 ? '' : 's'}`,
      tier: TIERS_BY_RANK[idx] ?? 'purple',
      barWidth: proporcion,
    }
  })

  // Padding ghost si hay menos de 3 cargos con data
  while (cargos.length < 3) {
    const idx = cargos.length
    cargos.push({
      mainText: '0',
      unit: '',
      label: 'Sin señal',
      narrative: 'No se detectaron cargos en zona crítica',
      tier: TIERS_BY_RANK[idx] ?? 'purple',
      barWidth: 0,
    })
  }

  // Nodo 4 — ancla científica (exposición IA global) · tier 'slate' especial
  const exposicionPctOrg = Math.round((data.meta.avgExposure ?? 0) * 100)
  const personasAnalizadas =
    data.meta.enrichedCount ?? data.meta.totalEmployees ?? 0
  cargos.push({
    mainText: String(exposicionPctOrg),
    unit: '%',
    label: 'Exposición global',
    narrative: `Basado en ${formatInt(personasAnalizadas)} posiciones analizadas`,
    tier: 'slate',
    barWidth: Math.max(0, Math.min(100, exposicionPctOrg)),
    tooltip:
      'focalizaScore Eloundou — promedio ponderado de la exposición IA de cada cargo de la dotación analizada.',
  })

  return cargos
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE — JSX clonado literal de AnclaInteligente
// ════════════════════════════════════════════════════════════════════════════

export default memo(function ActoAncla({
  data,
  onSelectFamilia,
  onBack,
}: ActoAnclaProps) {
  const nodes = useMemo(() => buildNodos(data), [data])

  // Capital comprometido en cargos de alta exposición — visto en escala
  // ANUAL sin decimales (más letal que mensual: "$782M / año" pega más
  // fuerte en sala de directorio que "$65M / mes"). El label inferior
  // "MM$ / AÑO" da el contexto, no el número.
  const capitalAnual = useMemo(() => {
    const d = data.lentes.l1_inercia?.detalle as
      | { totalMonthly?: number }
      | null
    return (d?.totalMonthly ?? 0) * 12
  }, [data])

  // Número central limpio — solo el entero en millones.
  // La leyenda "MM$ / AÑO" da el contexto. Sin $ ni M redundantes.
  const centralNumber = useMemo(
    () => Math.round(capitalAnual / 1_000_000),
    [capitalAnual]
  )

  // Color del glow del gauge: cyan (color de la familia destino del CTA)
  const scoreColor = TIER_HEX.cyan

  return (
    <div className="relative h-[calc(100vh-120px)] overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm flex flex-col">
      {/* Tesla line top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-10"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="flex-1 min-h-0 px-6 py-5 md:px-10 md:py-6 flex flex-col">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs mb-3 self-start"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Portada
          </button>
        )}

        {/* ═══ GAUGE CENTRAL ═══ */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
            style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}
          >
            {/* Glow background — restaurado, color cyan (familia destino) */}
            <div
              className="absolute inset-0 rounded-full blur-[60px] opacity-20"
              style={{ backgroundColor: scoreColor }}
            />

            {/* SVG gauge — solo track, sin progress arc */}
            <svg
              className="absolute inset-0 -rotate-90"
              viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
            >
              <circle
                cx={GAUGE_SIZE / 2}
                cy={GAUGE_SIZE / 2}
                r={GAUGE_RADIUS}
                fill="none"
                stroke="rgba(51, 65, 85, 0.4)"
                strokeWidth={GAUGE_STROKE}
              />
            </svg>

            {/* Score (font-semibold, blanco) + label "AL MES" — patrón canónico */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-[96px] font-semibold text-white leading-none tabular-nums tracking-tight"
              >
                {formatInt(centralNumber)}
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-[10px] uppercase tracking-[3px] text-slate-500 font-medium mt-1"
              >
                MM$ / AÑO
              </motion.span>
            </div>
          </motion.div>
        </div>

        {/* ═══ LÍNEAS SVG + NODOS ═══ — altura compactada (60px) */}
        <div className="relative mt-1">
          <svg
            className="absolute inset-x-0 top-0 w-full pointer-events-none"
            style={{ height: 60 }}
            viewBox="0 0 1000 60"
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
              const nodeY = 55
              const ctrlX = (originX + nodeX) / 2
              const ctrlY = 30
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

          {/* Nodos — patrón canónico: número + suffix, micro-barra, label, narrativa */}
          <div
            className={cn(
              'grid gap-4 pt-16',
              nodes.length === 4 && 'grid-cols-2 md:grid-cols-4'
            )}
          >
            {nodes.map((node, idx) => {
              const nodeColor = TIER_HEX[node.tier]
              const nodeTextClass = TIER_TEXT[node.tier]
              const isGhost = node.barWidth === 0

              return (
                <motion.div
                  key={`node-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.4 + idx * 0.15 }}
                  className="text-center"
                >
                  {/* Número grande — white por defecto, slate-500 en ghost */}
                  <p
                    className={cn(
                      'text-3xl md:text-4xl font-extralight font-mono tabular-nums leading-none',
                      isGhost ? 'text-slate-500' : 'text-white'
                    )}
                  >
                    {node.mainText}
                    {node.unit && (
                      <span className="text-lg text-slate-600">{node.unit}</span>
                    )}
                  </p>

                  {/* Micro-barra 2px — proporción del nodo sobre el total */}
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
                      style={{
                        backgroundColor: isGhost ? '#475569' : nodeColor,
                        opacity: isGhost ? 0.3 : 1,
                      }}
                    />
                  </div>

                  {/* Label + tooltip opcional (i) */}
                  <div className="flex items-center justify-center gap-1 mt-3">
                    <p
                      className={cn(
                        'text-[10px] uppercase tracking-wider font-medium',
                        isGhost ? 'text-slate-500' : nodeTextClass
                      )}
                    >
                      {node.label}
                    </p>
                    {node.tooltip && (
                      <span className="group/tip relative inline-flex">
                        <Info className="w-3 h-3 text-slate-600 hover:text-slate-400 cursor-help transition-colors" />
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700/40 text-[10px] text-slate-300 leading-relaxed opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl shadow-black/50 text-left normal-case tracking-normal font-light">
                          {node.tooltip}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Narrativa (una línea) */}
                  <p className="text-[11px] font-light text-slate-500 leading-snug mt-1.5 max-w-[180px] mx-auto">
                    {node.narrative}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ═══ CTA ÚNICO ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.4 + nodes.length * 0.15 + 0.3 }}
          className="flex justify-center mt-auto pt-6"
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
