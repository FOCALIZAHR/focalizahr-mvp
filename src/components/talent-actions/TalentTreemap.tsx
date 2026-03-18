'use client'

// ════════════════════════════════════════════════════════════════════════════
// TALENT TREEMAP — Pilar 2: Vista org-wide por zonas de urgencia
// src/components/talent-actions/TalentTreemap.tsx
//
// 3 zonas: ACCION_INMEDIATA (rojo), MONITOREAR (ambar), PROTEGER (verde)
// Cada zona contiene QuadrantBlocks expandibles
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import QuadrantBlock from './QuadrantBlock'
import { getQuadrantLabel } from '@/config/tacLabels'

interface OrgStats {
  totalPersonas: number
  clasificadas: number
  riskDistribution: Record<string, number>
  mobilityDistribution: Record<string, number>
  alertasCriticas: number
  alertasAltas: number
}

// Config de cuadrantes — labels de tacLabels.ts, descripciones propias de este componente
const QUADRANT_CONFIG: Record<string, {
  description: string
  actionTypical: string
  color: string
  borderColor: string
  bgColor: string
}> = {
  FUGA_CEREBROS: {
    description: 'Alto dominio + bajo engagement',
    actionTypical: 'Incluir en proxima revision de personas',
    color: 'text-red-400',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/5'
  },
  BURNOUT_RISK: {
    description: 'Bajo dominio + alto engagement',
    actionTypical: 'Revisar carga y adecuacion al rol',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    bgColor: 'bg-orange-500/5'
  },
  BAJO_RENDIMIENTO: {
    description: 'Bajo dominio + bajo engagement',
    actionTypical: 'Definir continuidad o reubicacion',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/5'
  },
  MOTOR_EQUIPO: {
    description: 'Alto dominio + alto engagement',
    actionTypical: 'Mantener desafio y visibilidad',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/5'
  }
}

const ZONES = [
  {
    key: 'ACCION_INMEDIATA',
    label: 'Accion Inmediata',
    color: 'text-red-400',
    borderColor: 'border-red-500/20',
    quadrants: ['FUGA_CEREBROS', 'BURNOUT_RISK']
  },
  {
    key: 'MONITOREAR',
    label: 'Monitorear',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    quadrants: ['BAJO_RENDIMIENTO']
  },
  {
    key: 'PROTEGER',
    label: 'Proteger',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    quadrants: ['MOTOR_EQUIPO']
  }
]

interface TalentTreemapProps {
  initialQuadrant?: string
}

export default function TalentTreemap({ initialQuadrant }: TalentTreemapProps = {}) {
  const [stats, setStats] = useState<OrgStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedQuadrant, setExpandedQuadrant] = useState<string | null>(initialQuadrant ?? null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/talent-actions/stats')
        if (!res.ok) throw new Error(`Error ${res.status}`)

        const result = await res.json()
        if (!result.success) throw new Error(result.error)

        setStats(result.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-sm">{error || 'Sin datos disponibles'}</p>
      </div>
    )
  }

  const totalPersonas = stats.totalPersonas

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h3 className="text-xl font-light text-white">
          Mapa de Talento
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          {totalPersonas} personas clasificadas
          {stats.alertasCriticas > 0 && (
            <>
              <span className="mx-2 text-slate-600">·</span>
              <span className="text-red-400">{stats.alertasCriticas} alertas criticas</span>
            </>
          )}
          {stats.alertasAltas > 0 && (
            <>
              <span className="mx-2 text-slate-600">·</span>
              <span className="text-orange-400">{stats.alertasAltas} alertas altas</span>
            </>
          )}
        </p>
      </div>

      {/* Zonas */}
      {ZONES.map((zone, zi) => {
        // Contar personas en esta zona
        const zoneCount = zone.quadrants.reduce(
          (sum, q) => sum + (stats.riskDistribution[q] || 0), 0
        )
        if (zoneCount === 0) return null

        return (
          <motion.div
            key={zone.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: zi * 0.1 }}
          >
            {/* Zone label */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs font-medium uppercase tracking-wider ${zone.color}`}>
                {zone.label}
              </span>
              <div className={`flex-1 h-px ${zone.borderColor} border-t`} />
              <span className="text-xs text-slate-500">{zoneCount} personas</span>
            </div>

            {/* Quadrant blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {zone.quadrants.map(q => {
                const config = QUADRANT_CONFIG[q]
                if (!config) return null
                const count = stats.riskDistribution[q] || 0

                return (
                  <QuadrantBlock
                    key={q}
                    quadrant={q}
                    label={getQuadrantLabel(q)}
                    description={config.description}
                    actionTypical={config.actionTypical}
                    color={config.color}
                    borderColor={config.borderColor}
                    bgColor={config.bgColor}
                    count={count}
                    isExpanded={expandedQuadrant === q}
                    onToggle={() => setExpandedQuadrant(expandedQuadrant === q ? null : q)}
                  />
                )
              })}
            </div>
          </motion.div>
        )
      })}

      {/* Empty state */}
      {totalPersonas === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm">
            No hay personas con matrices de talento calculadas.
          </p>
        </div>
      )}
    </div>
  )
}
