'use client'

// ════════════════════════════════════════════════════════════════════════════
// ORG HEALTH MAP — Vista Hub: Mapa de gerencias con patron + ICC
// src/components/talent-actions/OrgHealthMap.tsx
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import GerenciaPatternCard from './GerenciaPatternCard'
import SuccessionGapBanner from './SuccessionGapBanner'
import type { GerenciaMapItem } from '@/lib/services/TalentActionService'

interface OrgHealthMapProps {
  gerencias: GerenciaMapItem[]
  orgStats: {
    totalPersonas: number
    totalClasificadas: number
    totalGerencias: number
    patronDominante: string | null
    iccOrganizacional: number | null
  }
  flaggedGerencias?: Set<string>
  onSelectGerencia: (id: string) => void
}

// Orden de severidad: menor = más urgente → aparece primero
const PATTERN_SEVERITY: Record<string, number> = {
  FRAGIL: 1,
  QUEMADA: 2,
  ESTANCADA: 3,
  RIESGO_OCULTO: 4,
  EN_TRANSICION: 5,
  SALUDABLE: 6
}

// Patrones "RED" que obtienen col-span-2 + glow
const RED_PATTERNS = new Set(['FRAGIL', 'QUEMADA'])

export default function OrgHealthMap({
  gerencias,
  orgStats,
  flaggedGerencias,
  onSelectGerencia
}: OrgHealthMapProps) {

  // Calcular potencial perdido global
  const totalPotencialNoActivado = gerencias.reduce(
    (sum, g) => sum + g.sucesores.potencialNoActivado, 0
  )

  // Ordenar por severidad del patron (FRAGIL primero, SALUDABLE al final)
  const sortedGerencias = [...gerencias].sort((a, b) => {
    const sevA = a.pattern ? (PATTERN_SEVERITY[a.pattern] ?? 7) : 7
    const sevB = b.pattern ? (PATTERN_SEVERITY[b.pattern] ?? 7) : 7
    return sevA - sevB
  })

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h3 className="text-xl font-light text-white">
          Mapa de Salud del Talento
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          {orgStats.totalGerencias} gerencias analizadas
          <span className="mx-2 text-slate-600">·</span>
          {orgStats.totalPersonas} colaboradores
        </p>
      </div>

      {/* Potencial perdido banner */}
      {totalPotencialNoActivado > 0 && (
        <SuccessionGapBanner count={totalPotencialNoActivado} />
      )}

      {/* Grid de gerencias — jerarquía visual por severidad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedGerencias.map((gerencia, index) => {
          const isRed = gerencia.pattern ? RED_PATTERNS.has(gerencia.pattern) : false
          const isSaludable = gerencia.pattern === 'SALUDABLE'

          return (
            <motion.div
              key={gerencia.gerenciaId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 220, damping: 30 }}
              className={isRed ? 'sm:col-span-2' : ''}
            >
              <GerenciaPatternCard
                gerencia={gerencia}
                isFlagged={flaggedGerencias?.has(gerencia.gerenciaId) || false}
                onClick={() => onSelectGerencia(gerencia.gerenciaId)}
                severity={isRed ? 'red' : isSaludable ? 'muted' : 'normal'}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Empty state */}
      {gerencias.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm">
            No hay gerencias con datos de matrices de talento calculadas.
          </p>
          <p className="text-slate-600 text-xs mt-2">
            Completa un ciclo de evaluacion con calibracion para activar esta vista.
          </p>
        </div>
      )}
    </div>
  )
}
