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
}

interface PositionedPerson {
  person: RetentionEntry
  cx: number
  cy: number
  r: number
  color: string
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
}: NineBoxMatrixProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [lassoPath, setLassoPath] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)

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

        return {
          person,
          cx,
          cy,
          r: salaryRadius(person.salary, minSal, maxSal),
          // Color por focalizaScore del cargo (Eloundou, indicador PADRE).
          // Fallback a observedExposure (Anthropic rollup) si el cargo no tiene Eloundou.
          color: exposureColor(person.focalizaScore ?? person.observedExposure),
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
      // Click simple — limpiar selección
      setLassoPath([])
      onLassoSelect([])
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
      {/* ─── Capa 1: Cells (9 rectángulos sutiles) ──────────────────── */}
      <g>
        {cellMeta.map(cell => (
          <rect
            key={cell.key}
            x={cell.x}
            y={cell.y}
            width={CELL_W}
            height={CELL_H}
            fill="rgba(15, 23, 42, 0.3)"
            stroke="rgba(34, 211, 238, 0.08)"
            strokeWidth={1}
          />
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
      <g>
        {positioned.map(({ person, cx, cy, r, color }) => {
          const isSelected = selectedIds.has(person.employeeId)
          const isEligible = eligibleIds.has(person.employeeId)
          // Opacity:
          //   eligible + selected: 1.0
          //   eligible + not selected: 0.7
          //   not eligible (fuera del escenario): 0.12
          const fillOpacity = !isEligible ? 0.12 : isSelected ? 1 : 0.7
          return (
            <circle
              key={person.employeeId}
              cx={cx}
              cy={cy}
              r={r}
              fill={color}
              fillOpacity={fillOpacity}
              stroke={isSelected ? '#22D3EE' : 'rgba(0,0,0,0.4)'}
              strokeWidth={isSelected ? 2.5 : 0.5}
              style={{
                cursor: 'pointer',
                filter: isSelected
                  ? 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.7))'
                  : 'none',
                transition: 'fill-opacity 250ms, stroke-width 200ms',
              }}
              onClick={(e) => {
                e.stopPropagation()
                onDotClick(person.employeeId)
              }}
              onMouseEnter={() => onDotHover(person)}
              onMouseLeave={() => onDotHover(null)}
            />
          )
        })}
      </g>

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
