'use client'

// ════════════════════════════════════════════════════════════════════════════
// TALENT TREEMAP — Pilar 2: Vista org-wide proporcional
// src/components/talent-actions/TalentTreemap.tsx
//
// Filosofía FocalizaHR:
// — El tamaño del bloque comunica proporción (no colores semáforo)
// — Cyan protagonista, purple acento
// — Progressive disclosure: número → narrativa → personas (click)
// — "Inteligencia sin agresividad"
//
// Bloques flex proporcionales al count, ordenados por urgencia.
// Sin agrupación por zonas — el tamaño + la narrativa hacen el trabajo.
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import QuadrantBlock from './QuadrantBlock'
import { getQuadrantLabel, getQuadrantNarrative } from '@/config/tacLabels'

interface OrgStats {
  totalPersonas: number
  clasificadas: number
  riskDistribution: Record<string, number>
  mobilityDistribution: Record<string, number>
  alertasCriticas: number
  alertasAltas: number
}

// Orden por urgencia (más crítico primero) + narrativa contextual
const QUADRANTS_ORDERED = [
  {
    key: 'FUGA_CEREBROS',
    actionTypical: 'Incluir en proxima revision de personas',
    accentColor: '#EF4444',
  },
  {
    key: 'BURNOUT_RISK',
    actionTypical: 'Revisar carga y adecuacion al rol',
    accentColor: '#F59E0B',
  },
  {
    key: 'BAJO_RENDIMIENTO',
    actionTypical: 'Definir continuidad o reubicacion',
    accentColor: '#64748B',
  },
  {
    key: 'MOTOR_EQUIPO',
    actionTypical: 'Mantener desafio y visibilidad',
    accentColor: '#22D3EE',
  },
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

  // Bloques con count > 0, ordenados por urgencia
  const blocks = useMemo(() => {
    if (!stats) return []
    return QUADRANTS_ORDERED
      .map(q => ({
        ...q,
        count: stats.riskDistribution[q.key] || 0,
        label: getQuadrantLabel(q.key),
      }))
      .filter(q => q.count > 0)
  }, [stats])

  const totalEnMapa = useMemo(() =>
    blocks.reduce((sum, b) => sum + b.count, 0),
    [blocks]
  )

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

  if (blocks.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-sm">
          No hay personas con matrices de talento calculadas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Header — estilo onboarding/inicio */}
      <div>
        <h3 className="text-2xl font-light text-white tracking-tight">
          Mapa de{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
            Talento
          </span>
        </h3>
        <p className="text-sm text-slate-500 mt-2">
          {totalEnMapa} personas clasificadas en {blocks.length} cuadrantes
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px w-12 bg-white/10" />
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Treemap proporcional — mosaico 2 filas, expansión in-place */}
      <AnimatePresence mode="wait">
        {expandedQuadrant ? (
          /* EXPANDIDO: 1 bloque ocupa todo */
          <motion.div
            key={`expanded-${expandedQuadrant}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {(() => {
              const block = blocks.find(b => b.key === expandedQuadrant)
              if (!block) return null
              return (
                <QuadrantBlock
                  quadrant={block.key}
                  label={block.label}
                  description={getQuadrantNarrative(block.key)}
                  actionTypical={block.actionTypical}
                  color="text-white"
                  borderColor="border-slate-800/60"
                  bgColor="bg-slate-900/40"
                  accentColor={block.accentColor}
                  count={block.count}
                  totalInMap={totalEnMapa}
                  isExpanded={true}
                  onToggle={() => setExpandedQuadrant(null)}
                />
              )
            })()}
          </motion.div>
        ) : (
          /* COLAPSADO: mosaico proporcional de 2 filas */
          <motion.div
            key="treemap-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3"
          >
            {(() => {
              // Ordenar por count desc para layout de mosaico
              const sorted = [...blocks].sort((a, b) => b.count - a.count)
              // Fila 1: el más grande solo (domina)
              const row1 = sorted[0] ? [sorted[0]] : []
              // Fila 2: el resto, proporcional entre sí
              const row2 = sorted.slice(1)

              return (
                <>
                  {/* Fila 1: bloque dominante, ancho completo */}
                  {row1.map((block, i) => (
                    <motion.div
                      key={block.key}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0 }}
                    >
                      <QuadrantBlock
                        quadrant={block.key}
                        label={block.label}
                        description={getQuadrantNarrative(block.key)}
                        actionTypical={block.actionTypical}
                        color="text-white"
                        borderColor="border-slate-800/60"
                        bgColor="bg-slate-900/40"
                        accentColor={block.accentColor}
                        count={block.count}
                        totalInMap={totalEnMapa}
                        isExpanded={false}
                        onToggle={() => setExpandedQuadrant(block.key)}
                      />
                    </motion.div>
                  ))}

                  {/* Fila 2: resto, flex proporcional, altura fija igual */}
                  {row2.length > 0 && (
                    <div className="flex gap-3 items-stretch overflow-hidden">
                      {row2.map((block, i) => {
                        // Compacto si ocupa menos del 10% del total
                        const isCompact = block.count / totalEnMapa < 0.1
                        return (
                          <motion.div
                            key={block.key}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (i + 1) * 0.06 }}
                            style={{ flex: Math.max(block.count, 1) }}
                            className="min-w-0"
                          >
                            <QuadrantBlock
                              quadrant={block.key}
                              label={block.label}
                              description={getQuadrantNarrative(block.key)}
                              actionTypical={block.actionTypical}
                              color="text-white"
                              borderColor="border-slate-800/60"
                              bgColor="bg-slate-900/40"
                              accentColor={block.accentColor}
                              count={block.count}
                              totalInMap={totalEnMapa}
                              compact={isCompact}
                              isExpanded={false}
                              onToggle={() => setExpandedQuadrant(block.key)}
                            />
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
