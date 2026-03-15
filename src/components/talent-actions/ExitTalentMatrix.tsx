'use client'

// ════════════════════════════════════════════════════════════════════════════
// EXIT TALENT MATRIX — Matriz exitFactors x riskQuadrant (agregada)
// Nunca muestra nombres individuales
// InsufficientDataGuard si < MIN_EXIT_RECORDS
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import InsufficientDataGuard from './InsufficientDataGuard'

interface MatrixEntry {
  factor: string
  quadrants: Record<string, number>
  totalMentions: number
}

interface ExitCrossData {
  insufficient: boolean
  reason?: string
  matrix: MatrixEntry[] | null
  totalExits: number
  matchedWithRating?: number
  minRequired?: number
}

const QUADRANT_LABELS: Record<string, { label: string; color: string }> = {
  FUGA_CEREBROS:    { label: 'Fuga',    color: 'text-amber-400' },
  BURNOUT_RISK:     { label: 'Burnout', color: 'text-orange-400' },
  BAJO_RENDIMIENTO: { label: 'Bajo',    color: 'text-slate-400' },
  MOTOR_EQUIPO:     { label: 'Motor',   color: 'text-emerald-400' }
}

const QUADRANT_ORDER = ['FUGA_CEREBROS', 'BURNOUT_RISK', 'BAJO_RENDIMIENTO', 'MOTOR_EQUIPO']

export default function ExitTalentMatrix() {
  const [data, setData] = useState<ExitCrossData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetch_data() {
      try {
        const res = await fetch('/api/talent-actions/exit-cross')
        if (res.status === 403) {
          setError('Sin permisos para esta vista')
          return
        }
        if (!res.ok) throw new Error('Error cargando datos')

        const result = await res.json()
        if (!result.success) throw new Error(result.error)

        setData(result.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetch_data()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <InsufficientDataGuard message={error} />
  }

  if (!data || data.insufficient) {
    return (
      <InsufficientDataGuard
        message={data?.reason || 'Datos insuficientes para generar la matriz'}
        detail={data?.minRequired
          ? `Se necesitan al menos ${data.minRequired} salidas con factores registrados.`
          : undefined}
      />
    )
  }

  if (!data.matrix || data.matrix.length === 0) {
    return (
      <InsufficientDataGuard
        message="Sin cruce disponible"
        detail="No se encontraron coincidencias entre salidas y matrices de talento."
      />
    )
  }

  const maxValue = Math.max(...data.matrix.flatMap(m => Object.values(m.quadrants)))

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-light text-white">
          Cruce Exit Intelligence x Matrices de Talento
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          {data.totalExits} salidas analizadas
          <span className="mx-2 text-slate-600">·</span>
          {data.matchedWithRating} con rating activo
          <span className="mx-2 text-slate-600">·</span>
          Datos agregados, sin identificacion individual
        </p>
      </div>

      {/* Tabla matrix */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-2 pr-4 text-xs text-slate-500 font-normal">
                Factor de salida
              </th>
              {QUADRANT_ORDER.map(q => (
                <th key={q} className="text-center py-2 px-2 text-xs font-normal">
                  <span className={QUADRANT_LABELS[q]?.color || 'text-slate-400'}>
                    {QUADRANT_LABELS[q]?.label || q}
                  </span>
                </th>
              ))}
              <th className="text-right py-2 pl-4 text-xs text-slate-500 font-normal">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((entry, i) => (
              <motion.tr
                key={entry.factor}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-slate-800/50"
              >
                <td className="py-2 pr-4 text-slate-300 text-xs">
                  {entry.factor}
                </td>
                {QUADRANT_ORDER.map(q => {
                  const value = entry.quadrants[q] || 0
                  const intensity = maxValue > 0 ? value / maxValue : 0

                  return (
                    <td key={q} className="text-center py-2 px-2">
                      {value > 0 ? (
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium tabular-nums"
                          style={{
                            backgroundColor: `rgba(34, 211, 238, ${intensity * 0.2})`,
                            color: intensity > 0.5 ? '#22D3EE' : '#94A3B8'
                          }}
                        >
                          {value}
                        </span>
                      ) : (
                        <span className="text-slate-700 text-xs">-</span>
                      )}
                    </td>
                  )
                })}
                <td className="text-right py-2 pl-4 text-xs text-slate-400 tabular-nums font-medium">
                  {entry.totalMentions}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
