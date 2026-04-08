'use client'

import { memo, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// EXPOSURE HEATMAP
// src/components/charts/ExposureHeatmap.tsx
//
// Componente de heatmap reutilizable para el módulo de Workforce Planning.
// Usa CSS Grid + Tailwind. Cero dependencias externas.
//
// Contextos de uso:
// - Cascada Acto 1: gerencias × exposición IA
// - Cascada Acto Ancla: composición del % organizacional
// - Tab Estructura: gerencias × headcount × costo
// - Executive Hub: mini preview
// - Tab Benchmarks: tu empresa × industria
// - Hallazgos: concentración por gerencia
//
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface HeatmapCell {
  /** ID único de la fila (gerencia) */
  rowId: string
  /** Label visible de la fila */
  rowLabel: string
  /** ID único de la columna */
  colId: string
  /** Label visible de la columna */
  colLabel: string
  /** Valor numérico (0-100 para %, o cualquier número) */
  value: number
  /** Valor formateado para mostrar (ej: "45%", "$12M") */
  displayValue?: string
  /** Metadata adicional para tooltip */
  meta?: Record<string, string | number>
}

export interface HeatmapProps {
  /** Array de celdas con datos */
  data: HeatmapCell[]

  /** Variante de tamaño */
  variant?: 'full' | 'compact' | 'mini'

  /** Orientación de la matriz */
  orientation?: 'horizontal' | 'vertical'

  /** Mostrar labels de filas (gerencias) */
  showRowLabels?: boolean

  /** Mostrar labels de columnas */
  showColLabels?: boolean

  /** Mostrar valores dentro de celdas */
  showValues?: boolean

  /** Mostrar tooltip en hover */
  showTooltip?: boolean

  /** Escala de color: 'danger' (verde→rojo), 'success' (rojo→verde) */
  colorScale?: 'danger' | 'success'

  /** Rango de valores [min, max] para calcular intensidad. Auto-detecta si no se provee */
  valueRange?: [number, number]

  /** Callback al hacer click en celda */
  onCellClick?: (cell: HeatmapCell) => void

  /** Título del heatmap (opcional) */
  title?: string

  /** Clase CSS adicional */
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const COLOR_SCALES = {
  // Verde (bajo) → Amarillo (medio) → Rojo (alto) — para métricas donde alto = peligro
  danger: {
    low: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    medium: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400' },
    high: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' },
  },
  // Rojo (bajo) → Amarillo (medio) → Verde (alto) — para métricas donde alto = bueno
  success: {
    low: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' },
    medium: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400' },
    high: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  },
}

const VARIANT_STYLES = {
  full: {
    cell: 'h-12 min-w-[80px]',
    text: 'text-sm',
    label: 'text-xs',
    gap: 'gap-1',
  },
  compact: {
    cell: 'h-9 min-w-[60px]',
    text: 'text-xs',
    label: 'text-[10px]',
    gap: 'gap-0.5',
  },
  mini: {
    cell: 'h-6 min-w-[40px]',
    text: 'text-[10px]',
    label: 'text-[8px]',
    gap: 'gap-px',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════════════════

function getIntensityLevel(value: number, min: number, max: number): 'low' | 'medium' | 'high' {
  const range = max - min
  if (range === 0) return 'medium'
  const normalized = (value - min) / range

  if (normalized <= 0.33) return 'low'
  if (normalized <= 0.66) return 'medium'
  return 'high'
}

/**
 * Interpola color RGBA basado en valor normalizado.
 * Produce gradiente suave: Verde → Amarillo → Rojo (o inverso para 'success')
 */
function interpolateColor(value: number, min: number, max: number, scale: 'danger' | 'success'): string {
  const range = max - min
  if (range === 0) return 'rgba(245, 158, 11, 0.3)'

  const t = Math.max(0, Math.min(1, (value - min) / range))
  const opacity = 0.15 + (t * 0.45)

  if (scale === 'danger') {
    if (t < 0.5) {
      const r = Math.round(16 + (245 - 16) * (t * 2))
      const g = Math.round(185 + (158 - 185) * (t * 2))
      const b = Math.round(129 + (11 - 129) * (t * 2))
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    } else {
      const r = Math.round(245 + (239 - 245) * ((t - 0.5) * 2))
      const g = Math.round(158 + (68 - 158) * ((t - 0.5) * 2))
      const b = Math.round(11 + (68 - 11) * ((t - 0.5) * 2))
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
  } else {
    if (t < 0.5) {
      const r = Math.round(239 + (245 - 239) * (t * 2))
      const g = Math.round(68 + (158 - 68) * (t * 2))
      const b = Math.round(68 + (11 - 68) * (t * 2))
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    } else {
      const r = Math.round(245 + (16 - 245) * ((t - 0.5) * 2))
      const g = Math.round(158 + (185 - 158) * ((t - 0.5) * 2))
      const b = Math.round(11 + (129 - 11) * ((t - 0.5) * 2))
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TOOLTIP COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface TooltipProps {
  cell: HeatmapCell
  position: { x: number; y: number }
}

// TODO v1.1: Implementar edge detection para evitar overflow en bordes de pantalla
const Tooltip = memo(function Tooltip({ cell, position }: TooltipProps) {
  return (
    <div
      className="fixed z-50 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg shadow-xl pointer-events-none"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="text-xs font-medium text-white mb-1">
        {cell.rowLabel} × {cell.colLabel}
      </div>
      <div className="text-lg font-light text-cyan-400">
        {cell.displayValue ?? cell.value}
      </div>
      {cell.meta && (
        <div className="mt-1 pt-1 border-t border-white/10 space-y-0.5">
          {Object.entries(cell.meta).map(([key, val]) => (
            <div key={key} className="text-[10px] text-slate-400">
              {key}: <span className="text-slate-300">{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const ExposureHeatmap = memo(function ExposureHeatmap({
  data,
  variant = 'full',
  orientation = 'horizontal',
  showRowLabels = true,
  showColLabels = true,
  showValues = true,
  showTooltip = true,
  colorScale = 'danger',
  valueRange,
  onCellClick,
  title,
  className,
}: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const { rows, cols, cellMap, range } = useMemo(() => {
    const rowSet = new Map<string, string>()
    const colSet = new Map<string, string>()
    const map = new Map<string, HeatmapCell>()
    let min = Infinity
    let max = -Infinity

    data.forEach(cell => {
      rowSet.set(cell.rowId, cell.rowLabel)
      colSet.set(cell.colId, cell.colLabel)
      map.set(`${cell.rowId}-${cell.colId}`, cell)
      min = Math.min(min, cell.value)
      max = Math.max(max, cell.value)
    })

    return {
      rows: Array.from(rowSet.entries()),
      cols: Array.from(colSet.entries()),
      cellMap: map,
      range: valueRange ?? [min, max] as [number, number],
    }
  }, [data, valueRange])

  const styles = VARIANT_STYLES[variant]

  const handleMouseEnter = (cell: HeatmapCell, e: React.MouseEvent) => {
    if (!showTooltip) return
    setHoveredCell(cell)
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!showTooltip || !hoveredCell) return
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseLeave = () => {
    setHoveredCell(null)
  }

  const isVertical = orientation === 'vertical'
  const gridRows = isVertical ? cols : rows
  const gridCols = isVertical ? rows : cols

  return (
    <div className={cn('relative', className)}>
      {title && (
        <div className="mb-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </div>
      )}

      <div className={cn('flex', isVertical ? 'flex-row' : 'flex-col', styles.gap)}>
        {showColLabels && (
          <div className={cn(
            'flex',
            isVertical ? 'flex-col' : 'flex-row',
            styles.gap,
            showRowLabels && !isVertical && 'ml-24',
            showRowLabels && isVertical && 'mt-6',
          )}>
            {gridCols.map(([id, label]) => (
              <div
                key={id}
                className={cn(
                  'flex items-center justify-center text-slate-400 font-light truncate',
                  styles.cell,
                  styles.label,
                )}
              >
                {label}
              </div>
            ))}
          </div>
        )}

        <div className={cn('flex', isVertical ? 'flex-row' : 'flex-col', styles.gap)}>
          {gridRows.map(([rowId, rowLabel]) => (
            <div
              key={rowId}
              className={cn('flex', isVertical ? 'flex-col' : 'flex-row', styles.gap)}
            >
              {showRowLabels && (
                <div
                  className={cn(
                    'flex items-center text-slate-400 font-light truncate',
                    isVertical ? 'justify-center' : 'justify-end pr-3 w-24',
                    styles.label,
                    !isVertical && styles.cell,
                  )}
                >
                  {rowLabel}
                </div>
              )}

              {gridCols.map(([colId]) => {
                const cellKey = isVertical
                  ? `${colId}-${rowId}`
                  : `${rowId}-${colId}`
                const cell = cellMap.get(cellKey)

                if (!cell) {
                  return (
                    <div
                      key={colId}
                      className={cn(
                        'flex items-center justify-center bg-white/5 border border-white/5 rounded',
                        styles.cell,
                      )}
                    >
                      <span className="text-slate-600 text-xs">—</span>
                    </div>
                  )
                }

                const bgColor = interpolateColor(cell.value, range[0], range[1], colorScale)
                const level = getIntensityLevel(cell.value, range[0], range[1])
                const colorClasses = COLOR_SCALES[colorScale][level]

                return (
                  <div
                    key={colId}
                    className={cn(
                      'relative flex items-center justify-center rounded border transition-all duration-200',
                      'hover:scale-105 hover:z-10 hover:shadow-lg',
                      styles.cell,
                      colorClasses.border,
                      onCellClick && 'cursor-pointer',
                    )}
                    style={{ backgroundColor: bgColor }}
                    onMouseEnter={(e) => handleMouseEnter(cell, e)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => onCellClick?.(cell)}
                  >
                    {showValues && (
                      <span className={cn(
                        'font-light',
                        styles.text,
                        colorClasses.text,
                      )}>
                        {cell.displayValue ?? cell.value}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {showTooltip && hoveredCell && (
        <Tooltip cell={hoveredCell} position={tooltipPos} />
      )}
    </div>
  )
})

export default ExposureHeatmap
