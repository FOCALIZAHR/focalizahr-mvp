// ════════════════════════════════════════════════════════════════════════════
// L3 — RIESGO DE ADOPCIÓN (migrado a LenteLayout — 4 actos)
// src/components/efficiency/lentes/L3RiesgoAdopcion.tsx
// ════════════════════════════════════════════════════════════════════════════
// Lente de gobernanza, no de plan financiero. Surface el ranking de gerencias
// (exposición × clima) y deja al CEO curar el Set `gerenciasExcluidas` con
// un toggle binario "En ruta" / "En espera". Las exclusiones NO entran al
// carrito: filtran los demás lentes operativos (hoy L5, mañana más).
//
// Pre-init: las gerencias con `climaScale5 < 2.5` ya vienen marcadas "en
// espera" desde `useEfficiencyWorkspace` al cargar la data. El CEO confirma
// o ajusta.
//
// Patrón visual: clonado de L9PasivoLaboral.tsx (mismo molde LenteLayout,
// mismos tokens del módulo, mismo amber accent F59E0B = familia costo_esperar).
//
// L3 NO recalcula nada. Lee `lente.detalle` (ranking + peor) directo del
// resolver `EfficiencyDataResolver.case 'l3_adopcion'`.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Check, Circle, MapPin } from 'lucide-react'
import { LenteLayout } from './LenteLayout'
import { LenteCard } from './LenteCard'
import type { LenteComponentProps } from './_LentePlaceholder'
import { formatPct } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS DE FORMATO (clonados de L9)
// ════════════════════════════════════════════════════════════════════════════

/** Normaliza strings de BD ("RECURSOS_HUMANOS") a display humano. */
function formatLabel(raw: string): string {
  if (!raw) return ''
  const cleaned = raw
    .trim()
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map(word => {
      const isSigla = /^[A-ZÁÉÍÓÚÜÑ]{2,5}$/.test(word)
      if (isSigla) return word
      const lower = word.toLowerCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

function formatClima(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1)
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS (matchean el shape de EfficiencyDataResolver case 'l3_adopcion')
// ════════════════════════════════════════════════════════════════════════════

interface EntradaRanking {
  departmentId: string
  departmentName: string
  avgExposure: number
  avgEngagement: number
  headcount: number
  climaScale5: number
  pctPotencial: number
  climaFuente: string | null
  usandoFallback: boolean
  matchStrict: boolean
}

interface L3Detalle {
  ranking: EntradaRanking[]
  peor: EntradaRanking | undefined
}

const L3_ACCENT = '#F59E0B'
/** Umbral canónico de clima crítico — mismo que `CLIMA_CRITICO_THRESHOLD`
 *  del hook useEfficiencyWorkspace que pre-puebla `gerenciasExcluidas`. */
const CLIMA_CRITICO = 2.5

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export function L3RiesgoAdopcion({
  lente,
  gerenciasExcluidas,
  toggleGerenciaExclusion,
  onNextLente,
  proximoLenteTitulo,
  onActChange,
}: LenteComponentProps) {
  const detalle = lente.detalle as L3Detalle | null

  // ─── Derivados reactivos sobre gerenciasExcluidas ──────────────────────
  // Hooks ANTES de cualquier early return (regla de orden de hooks React).
  // Si `detalle` es null, los memos devuelven valores neutros y el guard
  // de empty state se aplica después.
  const ranking = detalle?.ranking ?? []

  const gerenciasEnEspera = useMemo(
    () => ranking.filter(g => gerenciasExcluidas.has(g.departmentId)),
    [ranking, gerenciasExcluidas],
  )

  const oportunidadEnPausa = useMemo(
    () => gerenciasEnEspera.reduce((s, g) => s + g.pctPotencial, 0),
    [gerenciasEnEspera],
  )

  const climaPromedioEspera = useMemo(() => {
    if (gerenciasEnEspera.length === 0) return null
    const sum = gerenciasEnEspera.reduce((s, g) => s + g.climaScale5, 0)
    return sum / gerenciasEnEspera.length
  }, [gerenciasEnEspera])

  const criticasCount = useMemo(
    () => ranking.filter(g => g.matchStrict).length,
    [ranking],
  )

  // Edge case: sin data (después de los hooks)
  if (!lente.hayData || !detalle || detalle.ranking.length === 0) {
    return (
      <LenteCard lente={lente} estado="vacio">
        {null}
      </LenteCard>
    )
  }

  const hasInteraction = gerenciasEnEspera.length > 0

  // Hero number sale del resolver (string ya formateado, p.ej. "42%")
  const heroValue = lente.datos.PCT_POTENCIAL ?? '0%'
  const heroUnit = `de tu costo de trabajo expuesto a la IA, el más alto de tu empresa. Clima: ${lente.datos.CLIMA ?? '0'}/5, el más bajo.`

  // Totalizador del Quirófano
  const totalizadorMetricas: Array<{ label: string; value: string; tint?: 'default' | 'accent' | 'emerald' | 'warning' }> = [
    {
      label: 'Gerencias en espera',
      value: String(gerenciasEnEspera.length),
      tint: 'accent',
    },
    {
      label: 'Oportunidad en pausa',
      value: formatPct(oportunidadEnPausa),
      tint: 'warning',
    },
    {
      label: 'Clima promedio en espera',
      value:
        climaPromedioEspera !== null ? `${formatClima(climaPromedioEspera)}/5` : '—',
    },
  ]

  // Checkpoint informativo (NO carrito). Solo si hay exclusiones.
  const checkpointSummary = hasInteraction
    ? {
        items: gerenciasEnEspera.map(g => ({
          label: formatLabel(g.departmentName),
          detail: `${formatClima(g.climaScale5)}/5 clima`,
          value: `${formatPct(g.pctPotencial)} potencial`,
        })),
        totalLabel: `${gerenciasEnEspera.length} ${
          gerenciasEnEspera.length === 1 ? 'gerencia' : 'gerencias'
        } en espera: el terreno primero`,
        totalValue: `${formatPct(oportunidadEnPausa)} de la oportunidad, en pausa hasta que el clima coopere`,
      }
    : undefined

  return (
    <LenteLayout
      familiaAccent={L3_ACCENT}
      heroValue={heroValue}
      heroUnit={heroUnit}
      narrativaPuente="Cada gerencia combina distinto la oportunidad y el terreno. Donde el clima está más bajo, forzar el cambio no lo acelera. Lo frena. La pregunta no es si actuar, sino dónde el terreno todavía no está listo para recibirlo."
      ctaSimularLabel="Revisar gerencias"
      ctaQuirofanoEyebrow="EXPEDIENTE DE TERRENO"
      hasInteraction={hasInteraction}
      checkpointSummary={checkpointSummary}
      onNextLente={onNextLente}
      proximoLenteTitulo={proximoLenteTitulo}
      onActChange={onActChange}
      totalizador={{ metricas: totalizadorMetricas }}
      renderHallazgo={() => <HallazgoScatter ranking={detalle.ranking} />}
      renderExpediente={() => (
        <ExpedienteLateral
          peor={detalle.peor}
          criticasCount={criticasCount}
          usandoFallback={lente.usandoFallback ?? false}
        />
      )}
      renderQuirofano={() => (
        <QuirofanoGerencias
          ranking={detalle.ranking}
          gerenciasExcluidas={gerenciasExcluidas}
          onToggle={toggleGerenciaExclusion}
        />
      )}
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ACTO 2 — HALLAZGO: scatter exposición × clima
// ════════════════════════════════════════════════════════════════════════════
//
// Layout SVG simple, sin librería. Eje X = avgExposure (0-1), eje Y =
// climaScale5 (0-5, invertido para que el cuadrante peligroso quede abajo-
// derecha). Dot size proporcional a pctPotencial. Cuadrante peligroso
// resaltado con bg amber muy sutil. matchStrict resaltado con anillo.
// ════════════════════════════════════════════════════════════════════════════

const SCATTER_W = 640
const SCATTER_H = 360
const PAD_L = 56
const PAD_R = 24
const PAD_T = 24
const PAD_B = 44

function HallazgoScatter({ ranking }: { ranking: EntradaRanking[] }) {
  const xRange = SCATTER_W - PAD_L - PAD_R
  const yRange = SCATTER_H - PAD_T - PAD_B

  // Proyecciones
  const xOf = (exp: number) => PAD_L + Math.max(0, Math.min(1, exp)) * xRange
  const yOf = (clima: number) =>
    PAD_T + (1 - Math.max(0, Math.min(5, clima)) / 5) * yRange

  // Cuadrante peligroso: exp > 0.5 + clima < CLIMA_CRITICO. Bg sutil.
  const dangerX = xOf(0.5)
  const dangerY = yOf(CLIMA_CRITICO)
  const dangerW = SCATTER_W - PAD_R - dangerX
  const dangerH = SCATTER_H - PAD_B - dangerY

  // Tamaño dot proporcional a pctPotencial (3-14 radio)
  const maxPct = Math.max(1, ...ranking.map(g => g.pctPotencial))
  const radiusOf = (pct: number) => 3 + (pct / maxPct) * 11

  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-amber-400 font-medium mb-2">
        EL TERRENO
      </p>
      <h3 className="text-xl md:text-2xl font-extralight text-white mb-4 leading-tight">
        Cada gerencia,{' '}
        <span className="fhr-title-gradient">su combinación</span>
      </h3>
      <p className="text-sm text-slate-400 font-light leading-relaxed max-w-2xl mb-6">
        Cada punto es una gerencia. Cuanto más a la derecha, más trabajo
        expuesto a la IA. Cuanto más abajo, peor el clima para sostener
        un cambio. El cuadrante inferior derecho es donde la oportunidad
        cae sobre el terreno menos preparado.
      </p>

      <div className="overflow-x-auto -mx-2 px-2">
        <svg
          viewBox={`0 0 ${SCATTER_W} ${SCATTER_H}`}
          width="100%"
          className="max-w-full"
          role="img"
          aria-label="Distribución de gerencias por exposición a IA y clima organizacional"
        >
          {/* Cuadrante peligroso */}
          <rect
            x={dangerX}
            y={dangerY}
            width={dangerW}
            height={dangerH}
            fill={L3_ACCENT}
            opacity={0.06}
          />
          <line
            x1={dangerX}
            y1={PAD_T}
            x2={dangerX}
            y2={SCATTER_H - PAD_B}
            stroke={L3_ACCENT}
            strokeOpacity={0.15}
            strokeDasharray="3 3"
          />
          <line
            x1={PAD_L}
            y1={dangerY}
            x2={SCATTER_W - PAD_R}
            y2={dangerY}
            stroke={L3_ACCENT}
            strokeOpacity={0.15}
            strokeDasharray="3 3"
          />

          {/* Ejes */}
          <line
            x1={PAD_L}
            y1={SCATTER_H - PAD_B}
            x2={SCATTER_W - PAD_R}
            y2={SCATTER_H - PAD_B}
            stroke="rgb(51 65 85)"
            strokeWidth={1}
          />
          <line
            x1={PAD_L}
            y1={PAD_T}
            x2={PAD_L}
            y2={SCATTER_H - PAD_B}
            stroke="rgb(51 65 85)"
            strokeWidth={1}
          />

          {/* Labels ejes */}
          <text
            x={PAD_L}
            y={SCATTER_H - 14}
            fill="rgb(100 116 139)"
            fontSize={10}
            fontFamily="ui-sans-serif, system-ui"
          >
            menos expuesto
          </text>
          <text
            x={SCATTER_W - PAD_R}
            y={SCATTER_H - 14}
            fill="rgb(100 116 139)"
            fontSize={10}
            textAnchor="end"
            fontFamily="ui-sans-serif, system-ui"
          >
            más expuesto a IA
          </text>
          <text
            x={12}
            y={PAD_T + 8}
            fill="rgb(100 116 139)"
            fontSize={10}
            fontFamily="ui-sans-serif, system-ui"
          >
            buen clima
          </text>
          <text
            x={12}
            y={SCATTER_H - PAD_B - 6}
            fill="rgb(100 116 139)"
            fontSize={10}
            fontFamily="ui-sans-serif, system-ui"
          >
            clima bajo
          </text>

          {/* Dots por gerencia */}
          {ranking.map(g => {
            const cx = xOf(g.avgExposure)
            const cy = yOf(g.climaScale5)
            const r = radiusOf(g.pctPotencial)
            const enZonaCritica =
              g.avgExposure > 0.5 && g.climaScale5 < CLIMA_CRITICO
            const fill = enZonaCritica ? L3_ACCENT : 'rgb(148 163 184)'
            const fillOpacity = enZonaCritica ? 0.7 : 0.45
            return (
              <g key={g.departmentId}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={fill}
                  fillOpacity={fillOpacity}
                  stroke={g.matchStrict ? L3_ACCENT : 'transparent'}
                  strokeWidth={g.matchStrict ? 1.5 : 0}
                />
                <title>
                  {formatLabel(g.departmentName)} · exposición{' '}
                  {formatPct(g.avgExposure * 100)} · clima{' '}
                  {formatClima(g.climaScale5)}/5 · potencial{' '}
                  {formatPct(g.pctPotencial)}
                </title>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ACTO 2 — EXPEDIENTE LATERAL (peor + criticas + nota fallback)
// ════════════════════════════════════════════════════════════════════════════

function ExpedienteLateral({
  peor,
  criticasCount,
  usandoFallback,
}: {
  peor: EntradaRanking | undefined
  criticasCount: number
  usandoFallback: boolean
}) {
  return (
    <aside className="rounded-[20px] border border-slate-800 bg-[#0F172A]/90 backdrop-blur-2xl p-5 md:p-6 space-y-5">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
        EN CIFRAS
      </p>

      <div>
        <p className="text-xl font-extralight text-white tabular-nums leading-tight">
          {criticasCount}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          {criticasCount === 1
            ? 'Gerencia en zona crítica'
            : 'Gerencias en zona crítica'}
        </p>
      </div>

      {peor && (
        <>
          <div className="h-px bg-slate-800/40" aria-hidden />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-2">
              La más expuesta sobre el terreno más bajo
            </p>
            <p className="text-sm font-light text-white leading-snug">
              {formatLabel(peor.departmentName)}
            </p>
            <p className="text-xs text-slate-400 font-light mt-1.5 tabular-nums">
              Clima {formatClima(peor.climaScale5)}/5 ·{' '}
              {formatPct(peor.pctPotencial)} del potencial
            </p>
          </div>
        </>
      )}

      {usandoFallback && (
        <>
          <div className="h-px bg-slate-800/40" aria-hidden />
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] font-light text-slate-400 leading-snug">
              Clima estimado desde engagement (sin pulso de clima dedicado).
            </p>
          </div>
        </>
      )}
    </aside>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ACTO 3 — QUIRÓFANO: lista de gerencias con toggle En ruta / En espera
// ════════════════════════════════════════════════════════════════════════════

interface QuirofanoGerenciasProps {
  ranking: EntradaRanking[]
  gerenciasExcluidas: Set<string>
  onToggle: ((departmentId: string) => void) | undefined
}

function QuirofanoGerencias({
  ranking,
  gerenciasExcluidas,
  onToggle,
}: QuirofanoGerenciasProps) {
  return (
    <div className="space-y-6">
      {/* Narrativa contextual arriba */}
      <div className="pb-6 border-b border-slate-800/40">
        <AnimatePresence mode="wait">
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-sm md:text-base font-light text-slate-300 italic leading-relaxed max-w-3xl"
          >
            Dejar una gerencia en espera la saca de las decisiones de cambio
            de los demás lentes. No la castigas, la proteges hasta que el
            terreno la sostenga. Las de clima más crítico ya vienen marcadas.
            Tú confirmas o ajustas.
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Lista de gerencias */}
      <ul className="space-y-2.5" role="list">
        {ranking.map(g => (
          <GerenciaRow
            key={g.departmentId}
            entrada={g}
            enEspera={gerenciasExcluidas.has(g.departmentId)}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </div>
  )
}

function GerenciaRow({
  entrada,
  enEspera,
  onToggle,
}: {
  entrada: EntradaRanking
  enEspera: boolean
  onToggle: ((departmentId: string) => void) | undefined
}) {
  const handleClick = () => {
    if (!onToggle) return
    onToggle(entrada.departmentId)
  }

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={enEspera}
        disabled={!onToggle}
        className={`w-full text-left rounded-[20px] backdrop-blur-2xl transition-colors p-4 md:p-5 ${
          enEspera
            ? 'border border-solid border-amber-400/60 bg-amber-500/10'
            : 'border border-dashed border-slate-700 bg-[#0F172A]/90 hover:border-slate-600'
        } ${onToggle ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* IZQ: identidad + métricas */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <MapPin
              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                enEspera ? 'text-amber-300' : 'text-slate-500'
              }`}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {formatLabel(entrada.departmentName)}
                {entrada.matchStrict && (
                  <span className="ml-2 text-[10px] uppercase tracking-widest text-amber-400/80 font-medium">
                    Crítica
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-400 font-light mt-1 tabular-nums">
                Exposición {formatPct(entrada.avgExposure * 100)} · Clima{' '}
                {formatClima(entrada.climaScale5)}/5 ·{' '}
                {formatPct(entrada.pctPotencial)} del potencial ·{' '}
                {entrada.headcount}{' '}
                {entrada.headcount === 1 ? 'persona' : 'personas'}
              </p>
            </div>
          </div>

          {/* DER: estado del toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {enEspera ? (
              <Check className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span
              className={`text-[11px] uppercase tracking-widest font-medium ${
                enEspera ? 'text-amber-300' : 'text-slate-400'
              }`}
            >
              {enEspera ? 'En espera' : 'En ruta'}
            </span>
          </div>
        </div>
      </button>
    </li>
  )
}
