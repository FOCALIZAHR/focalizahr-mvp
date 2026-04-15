'use client'

// ════════════════════════════════════════════════════════════════════════════
// NINE BOX MATRIX — SVG 3x3 + dots con jitter + lasso libre
// src/app/dashboard/workforce/components/instruments/nine-box/NineBoxMatrix.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patron: Bloomberg Terminal — grid sutil, tipografía técnica, dots tabular.
// Cero libs: SVG nativo + ray casting para point-in-polygon.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useRef, useState, useCallback } from 'react'
import type { RetentionEntry } from '@/lib/services/WorkforceIntelligenceService'
import {
  exposureColor,
  getGridCell,
  jitterPosition,
  pointInPolygon,
  salaryRadius,
  type Point,
} from './nine-box-utils'
import { getNineBoxLabel } from '@/config/nineBoxLabels'
import { formatDisplayName } from '@/lib/utils/formatName'
import { PersonExposureNarrativeService } from '@/lib/services/PersonExposureNarrativeService'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DE LAYOUT — viewBox fijo, escalable con preserveAspectRatio
// ─────────────────────────────────────────────────────────────────────────────

const VIEWBOX_W = 900
const VIEWBOX_H = 700

const PAD_LEFT = 80   // espacio para eje Y
const PAD_RIGHT = 20
const PAD_TOP = 40
const PAD_BOTTOM = 60 // espacio para eje X

const GRID_W = VIEWBOX_W - PAD_LEFT - PAD_RIGHT
const GRID_H = VIEWBOX_H - PAD_TOP - PAD_BOTTOM
const CELL_W = GRID_W / 3
const CELL_H = GRID_H / 3

const DOT_PADDING = 18 // padding interior de la celda para que los dots no toquen bordes

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface NineBoxMatrixProps {
  people: RetentionEntry[]
  selectedIds: Set<string>
  /** Personas que pasan el filtro del escenario (sliders). Las demas se dimean. */
  eligibleIds: Set<string>
  onLassoSelect: (ids: string[]) => void
  onDotClick: (personId: string) => void
  onDotHover: (person: RetentionEntry | null) => void
  /** Click en SVG vacío (sin lasso significativo) — desfija pin (tap-outside Apple pattern) */
  onEmptyClick?: () => void
}

interface PositionedPerson {
  person: RetentionEntry
  cx: number
  cy: number
  r: number
  color: string
  /** Accent narrativo del PersonExposureNarrativeService (cyan|amber|slate).
   *  'amber' = patrón crítico (FUGA_INMINENTE, NO_REEMPLAZO, BRECHA_CORE_HUMANO).
   *  Los amber reciben outer-ring visible ANTES del click → urgencia detectable a simple vista. */
  accent: 'amber' | 'cyan' | 'slate'
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

export default memo(function NineBoxMatrix({
  people,
  selectedIds,
  eligibleIds,
  onLassoSelect,
  onDotClick,
  onDotHover,
  onEmptyClick,
}: NineBoxMatrixProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [lassoPath, setLassoPath] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  // Hover state interno — para feedback visual inmediato (scale + glow + tooltip)
  const [hoverId, setHoverId] = useState<string | null>(null)
  // Hint inicial — desaparece tras el primer hover de cualquier dot
  const [hasHoveredOnce, setHasHoveredOnce] = useState(false)
  // Debounce timer para "ocultar" el HUD lateral cuando el mouse sale del dot.
  // El visual del dot (hoverId) se limpia inmediato; el HUD se retiene 150ms
  // por si el mouse cruza espacios entre dots cercanos (evita flicker).
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const HIDE_DELAY_MS = 150

  const cancelHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const scheduleHide = useCallback(() => {
    cancelHideTimer()
    hideTimerRef.current = setTimeout(() => {
      onDotHover(null)
      hideTimerRef.current = null
    }, HIDE_DELAY_MS)
  }, [cancelHideTimer, onDotHover])

  // ── Calcular posiciones de todos los dots (memoizado) ────────────────
  const positioned = useMemo<PositionedPerson[]>(() => {
    if (people.length === 0) return []

    const salaries = people.map(p => p.salary).filter(s => s > 0)
    const minSal = salaries.length > 0 ? Math.min(...salaries) : 0
    const maxSal = salaries.length > 0 ? Math.max(...salaries) : 1

    return people
      .map(person => {
        const cell = getGridCell(person.nineBoxPosition)
        if (!cell) return null

        const { dx, dy } = jitterPosition(
          person.employeeId,
          CELL_W,
          CELL_H,
          DOT_PADDING,
        )
        // SVG y-down: invertir row para que row 0 (alto potencial) quede arriba
        const cx = PAD_LEFT + cell.col * CELL_W + dx
        const cy = PAD_TOP + (2 - cell.row) * CELL_H + dy

        // Accent narrativo per-persona — clasifica con el mismo servicio que PersonView.
        // Garantiza que el halo visible coincida con la narrativa que aparece al click.
        const narrativeAccent = PersonExposureNarrativeService.build({
          focalizaScore: person.focalizaScore,
          roleFit: person.roleFitScore,
          engagement: person.potentialEngagement,
        }).accent

        return {
          person,
          cx,
          cy,
          r: salaryRadius(person.salary, minSal, maxSal),
          // Color por focalizaScore del cargo (Eloundou, indicador PADRE).
          // Fallback a observedExposure (Anthropic rollup) si el cargo no tiene Eloundou.
          color: exposureColor(person.focalizaScore ?? person.observedExposure),
          accent: narrativeAccent,
        }
      })
      .filter((p): p is PositionedPerson => p !== null)
  }, [people])

  // ── SVG point coords desde mouse event ───────────────────────────────
  const getSVGPoint = useCallback((e: React.MouseEvent): Point => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const transformed = pt.matrixTransform(ctm.inverse())
    return { x: transformed.x, y: transformed.y }
  }, [])

  // ── Lasso handlers ───────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      // Si el target es un círculo (dot), no iniciar lasso — dejar que el dot maneje el click
      if ((e.target as Element).tagName === 'circle') return
      const point = getSVGPoint(e)
      setIsDrawing(true)
      setLassoPath([point])
    },
    [getSVGPoint],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDrawing) return
      const point = getSVGPoint(e)
      setLassoPath(prev => [...prev, point])
    },
    [isDrawing, getSVGPoint],
  )

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (lassoPath.length < 3) {
      // Click simple en SVG vacío — limpiar selección Y desfijar pin (tap-outside)
      setLassoPath([])
      onLassoSelect([])
      onEmptyClick?.()
      return
    }

    // Computar dots dentro del polígono — solo eligibles entran en la selección
    const selected = positioned
      .filter(p => eligibleIds.has(p.person.employeeId))
      .filter(p => pointInPolygon({ x: p.cx, y: p.cy }, lassoPath))
      .map(p => p.person.employeeId)

    onLassoSelect(selected)
    setLassoPath([])
  }, [isDrawing, lassoPath, positioned, eligibleIds, onLassoSelect])

  // ── Cell labels (esquina superior izquierda de cada celda) ───────────
  const cellMeta = useMemo(() => {
    // [keyPosition, row, col]
    const cells: Array<{ key: string; row: number; col: number }> = [
      { key: 'growth_potential', row: 0, col: 0 },
      { key: 'potential_gem', row: 0, col: 1 },
      { key: 'star', row: 0, col: 2 },
      { key: 'inconsistent', row: 1, col: 0 },
      { key: 'core_player', row: 1, col: 1 },
      { key: 'high_performer', row: 1, col: 2 },
      { key: 'underperformer', row: 2, col: 0 },
      { key: 'average_performer', row: 2, col: 1 },
      { key: 'trusted_professional', row: 2, col: 2 },
    ]
    return cells.map(c => ({
      ...c,
      label: getNineBoxLabel(c.key).toUpperCase(),
      x: PAD_LEFT + c.col * CELL_W,
      y: PAD_TOP + (2 - c.row) * CELL_H,
    }))
  }, [])

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full select-none cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ═══════════════════════════════════════════════════════════════
          DEFS — Glassmorphism Focaliza Premium (9 placas de vidrio Tesla)
          Capas: bgGlow → cellGlass (vidrio diagonal) → cellStroke (edge cyan→purple)
                 → cellTopHighlight (luz superior tipo glass reflection)
                 → teslaLine (gradient principal top de matriz)
          ═══════════════════════════════════════════════════════════════ */}
      <defs>
        {/* Glow radial cyan puro de fondo — sin purple para evitar café */}
        <radialGradient id="nineBoxBgGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.05)" />
          <stop offset="100%" stopColor="rgba(15,23,42,0)" />
        </radialGradient>
        {/* Cell glass — gradient diagonal cyan top-left → purple bottom-right.
            Opacities muy bajas (0.04 → 0.015) para que sea VIDRIO, no color sólido.
            Es la diferencia entre Apple Vision Pro y PowerPoint 2000. */}
        <linearGradient id="nineBoxCellGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.05)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.015)" />
          <stop offset="100%" stopColor="rgba(167,139,250,0.025)" />
        </linearGradient>
        {/* Edge — gradiente cyan→purple. El borde es lo que define la "placa" */}
        <linearGradient id="nineBoxCellStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.22)" />
          <stop offset="100%" stopColor="rgba(167,139,250,0.14)" />
        </linearGradient>
        {/* Top highlight — fake "luz superior" tipo reflexión de vidrio.
            Sutil pero define la materialidad. Apple Vision Pro pattern. */}
        <linearGradient id="nineBoxCellTopHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        {/* Tesla line top de matriz — gradient cyan→purple→cyan principal */}
        <linearGradient id="nineBoxTeslaLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(34,211,238,0)" />
          <stop offset="35%" stopColor="rgba(34,211,238,0.5)" />
          <stop offset="65%" stopColor="rgba(167,139,250,0.5)" />
          <stop offset="100%" stopColor="rgba(167,139,250,0)" />
        </linearGradient>
      </defs>

      {/* ─── Capa 0: Fondo glow radial — deja ver glassmorphism del card ─── */}
      <rect
        x={PAD_LEFT}
        y={PAD_TOP}
        width={GRID_W}
        height={GRID_H}
        fill="url(#nineBoxBgGlow)"
        pointerEvents="none"
      />

      {/* ─── Capa 0b: Tesla line en top de la matriz ────────────────── */}
      <line
        x1={PAD_LEFT}
        y1={PAD_TOP}
        x2={PAD_LEFT + GRID_W}
        y2={PAD_TOP}
        stroke="url(#nineBoxTeslaLine)"
        strokeWidth={1.5}
        pointerEvents="none"
      />

      {/* ─── Capa 1: Cells — 9 placas de vidrio Tesla ───────────────────
           Glassmorphism real: gradient diagonal cyan→white→purple muy sutil
           + edge cyan→purple + top highlight (luz reflejada).
           SIN tint cromático por exposición — los dots ya codifican esa señal.
           El cerebro lee la concentración cromática del cluster como agregado.
           Eliminar el tint resuelve el café/marrón de mezcla cálido+frío. */}
      <g>
        {cellMeta.map(cell => (
          <g key={cell.key}>
            {/* Placa de vidrio */}
            <rect
              x={cell.x}
              y={cell.y}
              width={CELL_W}
              height={CELL_H}
              fill="url(#nineBoxCellGlass)"
              stroke="url(#nineBoxCellStroke)"
              strokeWidth={1}
              rx={2}
            />
            {/* Top highlight — luz superior, fake glass reflection (Apple Vision Pro pattern).
                Solo 30% de la altura, dentro del rect con offset 1px del borde. */}
            <rect
              x={cell.x + 1}
              y={cell.y + 1}
              width={CELL_W - 2}
              height={CELL_H * 0.3}
              fill="url(#nineBoxCellTopHighlight)"
              pointerEvents="none"
              rx={2}
            />
          </g>
        ))}
      </g>

      {/* ─── Capa 2: Cell labels (esquina superior izquierda) ───────── */}
      <g>
        {cellMeta.map(cell => (
          <text
            key={`label-${cell.key}`}
            x={cell.x + 12}
            y={cell.y + 22}
            fontSize={10}
            fontWeight={700}
            letterSpacing={1.5}
            fill="rgba(148, 163, 184, 0.45)"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
          >
            {cell.label}
          </text>
        ))}
      </g>

      {/* ─── Capa 3: Ejes ───────────────────────────────────────────── */}
      <g>
        {/* Eje Y vertical (izquierda) */}
        <text
          x={20}
          y={PAD_TOP + GRID_H / 2}
          fontSize={11}
          fontWeight={700}
          letterSpacing={2}
          fill="rgba(148, 163, 184, 0.6)"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          transform={`rotate(-90, 20, ${PAD_TOP + GRID_H / 2})`}
          textAnchor="middle"
        >
          POTENCIAL →
        </text>
        {/* Marcas Y: Bajo / Medio / Alto */}
        {['ALTO', 'MEDIO', 'BAJO'].map((label, i) => (
          <text
            key={`y-${label}`}
            x={PAD_LEFT - 12}
            y={PAD_TOP + i * CELL_H + CELL_H / 2 + 4}
            fontSize={9}
            fontWeight={600}
            letterSpacing={1.5}
            fill="rgba(148, 163, 184, 0.5)"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
            textAnchor="end"
          >
            {label}
          </text>
        ))}

        {/* Eje X horizontal (abajo) */}
        <text
          x={PAD_LEFT + GRID_W / 2}
          y={VIEWBOX_H - 14}
          fontSize={11}
          fontWeight={700}
          letterSpacing={2}
          fill="rgba(148, 163, 184, 0.6)"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          textAnchor="middle"
        >
          PERFORMANCE →
        </text>
        {/* Marcas X: Bajo / Medio / Alto */}
        {['BAJO', 'MEDIO', 'ALTO'].map((label, i) => (
          <text
            key={`x-${label}`}
            x={PAD_LEFT + i * CELL_W + CELL_W / 2}
            y={PAD_TOP + GRID_H + 18}
            fontSize={9}
            fontWeight={600}
            letterSpacing={1.5}
            fill="rgba(148, 163, 184, 0.5)"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
            textAnchor="middle"
          >
            {label}
          </text>
        ))}
      </g>

      {/* ─── Capa 4: Dots (empleados) ───────────────────────────────── */}
      {/* Mejoras visuales aplicadas:
          - Halo glow del propio color (separa del bg-slate sin perder identidad)
          - Stroke = color del dot al 60% (define borde sin negro duro)
          - Hover: scale 1.25 + glow fuerte + transition spring
          - Hit area expandida (circle invisible r+8) — captura mouse confiable
          - Debounce 150ms en hide → evita flicker entre dots cercanos */}
      <g>
        {positioned.map(({ person, cx, cy, r, color, accent }) => {
          const isSelected = selectedIds.has(person.employeeId)
          const isEligible = eligibleIds.has(person.employeeId)
          const isHovered = hoverId === person.employeeId
          // Outer ring de patrón narrativo: codifica accent del PersonExposureNarrativeService.
          //   - amber = patrón urgente (FUGA_INMINENTE, NO_REEMPLAZO, BRECHA_CORE_HUMANO)
          //   - cyan  = patrón estratégico (TALENTO_CRITICO_MOVER, NUCLEO_INTOCABLE)
          //   - slate = OPERACION_ESTABLE → SIN ring (no satura, mayoría de la población)
          // Hace los hallazgos del motor visibles ANTES del click.
          const ringColor =
            accent === 'amber' ? '#F59E0B'
            : accent === 'cyan' ? '#22D3EE'
            : null
          const showPatternRing = ringColor !== null && isEligible

          const fillOpacity = !isEligible ? 0.12 : isSelected ? 1 : 0.85
          const effectiveR = isHovered ? r * 1.25 : r

          // Halo glow:
          //   - hovered:  glow fuerte (12px) del propio color
          //   - selected: glow cyan (selección)
          //   - eligible: glow base sutil (6px) del propio color
          //   - dimmed:   sin glow
          const filter = !isEligible
            ? 'none'
            : isHovered
              ? `drop-shadow(0 0 12px ${color})`
              : isSelected
                ? 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.7))'
                : `drop-shadow(0 0 6px ${color}40)`

          // Stroke: cyan si selected, color del dot 60% si eligible, transparente si dimmed
          const strokeColor = isSelected
            ? '#22D3EE'
            : isEligible
              ? `${color}99`
              : 'rgba(0,0,0,0.3)'
          const strokeW = isSelected ? 2.5 : isHovered ? 2 : 1

          // Hit area expandida — mínimo 18px de radio, o r+8 si el dot es grande
          const hitR = Math.max(effectiveR + 8, 18)

          return (
            <g key={person.employeeId}>
              {/* Outer ring de patrón narrativo (amber=urgente / cyan=estratégico).
                  Se renderiza ANTES del fill, queda atrás. No interfiere con hit area.
                  Grosor 2px + opacity 0.85 para que sea visible sin saturar. */}
              {showPatternRing && ringColor && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={effectiveR + 5}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth={2}
                  strokeOpacity={isHovered ? 1 : 0.85}
                  style={{
                    pointerEvents: 'none',
                    transition: 'r 200ms cubic-bezier(0.4,0,0.2,1), stroke-opacity 200ms',
                  }}
                />
              )}
              {/* Visual circle — pointer-events:none para que el hit lo maneje el invisible */}
              <circle
                cx={cx}
                cy={cy}
                r={effectiveR}
                fill={color}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeW}
                style={{
                  filter,
                  pointerEvents: 'none',
                  transition: 'r 200ms cubic-bezier(0.4,0,0.2,1), fill-opacity 250ms, stroke-width 200ms, filter 200ms',
                }}
              />
              {/* Hit area invisible — captura mouse en área generosa */}
              <circle
                cx={cx}
                cy={cy}
                r={hitR}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  cancelHideTimer()
                  onDotClick(person.employeeId)
                }}
                onMouseEnter={() => {
                  cancelHideTimer()
                  setHoverId(person.employeeId)
                  if (!hasHoveredOnce) setHasHoveredOnce(true)
                  onDotHover(person)
                }}
                onMouseLeave={() => {
                  setHoverId(null)
                  scheduleHide()
                }}
              />
            </g>
          )
        })}
      </g>

      {/* ─── Capa 4b: Tooltip flotante extendido — nombre + cargo + datos clave ─── */}
      {(() => {
        if (!hoverId) return null
        const hovered = positioned.find(p => p.person.employeeId === hoverId)
        if (!hovered) return null
        const TT_W = 280
        const TT_H = 108
        // Si el dot está en el tercio derecho del viewbox, posicionar tooltip a la izquierda
        const isRightSide = hovered.cx > VIEWBOX_W * 0.66
        const ttX = isRightSide
          ? hovered.cx - hovered.r - TT_W - 6
          : hovered.cx + hovered.r + 6
        const ttY = hovered.cy - TT_H / 2
        const p = hovered.person
        // Datos clave: Exposición (focalizaScore canónico, fallback observed),
        // Dominio (roleFit) y Compromiso (engagement discreto AAE).
        const expo = p.focalizaScore ?? p.observedExposure
        const expoStr = expo !== null ? `${Math.round(expo * 100)}%` : '—'
        const fitStr = `${Math.round(p.roleFitScore)}%`
        const engStr =
          p.potentialEngagement === 3 ? 'Alto'
          : p.potentialEngagement === 1 ? 'Crítico'
          : p.potentialEngagement === 2 ? 'Estable'
          : '—'
        // Border color refleja accent narrativo — coherente con outer ring
        const borderColor = hovered.accent === 'amber'
          ? 'rgba(245, 158, 11, 0.5)'
          : hovered.accent === 'cyan'
            ? 'rgba(34, 211, 238, 0.5)'
            : 'rgba(148, 163, 184, 0.4)'
        return (
          <foreignObject
            x={ttX}
            y={ttY}
            width={TT_W}
            height={TT_H}
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${borderColor}`,
                borderRadius: 6,
                padding: '8px 10px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#E2E8F0',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: '#F1F5F9',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {formatDisplayName(p.employeeName)}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 300,
                  color: '#CBD5E1',
                  lineHeight: 1.3,
                  marginTop: 3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {p.position}
              </div>
              {p.departmentName && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 300,
                    color: '#94A3B8',
                    lineHeight: 1.3,
                    marginTop: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.departmentName}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 8,
                  paddingTop: 7,
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 11,
                  color: '#94A3B8',
                  fontWeight: 300,
                }}
              >
                <span>Exposición <span style={{ color: '#67E8F9', fontWeight: 500 }}>{expoStr}</span></span>
                <span>Dominio <span style={{ color: '#67E8F9', fontWeight: 500 }}>{fitStr}</span></span>
                <span>Compromiso <span style={{
                  color: engStr === 'Crítico' ? '#FBBF24'
                    : engStr === 'Alto' ? '#67E8F9'
                    : '#CBD5E1',
                  fontWeight: 500,
                }}>{engStr}</span></span>
              </div>
            </div>
          </foreignObject>
        )
      })()}

      {/* ─── Capa 4c: Hint inicial — desaparece tras primer hover ───── */}
      {!hasHoveredOnce && positioned.length > 0 && (
        <text
          x={VIEWBOX_W / 2}
          y={VIEWBOX_H - 32}
          fontSize={11}
          fill="rgba(148, 163, 184, 0.55)"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontStyle="italic"
          textAnchor="middle"
          style={{ pointerEvents: 'none' }}
        >
          Pasa el mouse sobre cualquier punto para ver detalle
        </text>
      )}

      {/* ─── Capa 5: Lasso path (mientras se dibuja) ────────────────── */}
      {lassoPath.length > 1 && (
        <path
          d={`M ${lassoPath.map(p => `${p.x},${p.y}`).join(' L ')} Z`}
          fill="rgba(34, 211, 238, 0.06)"
          stroke="#22D3EE"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </svg>
  )
})
