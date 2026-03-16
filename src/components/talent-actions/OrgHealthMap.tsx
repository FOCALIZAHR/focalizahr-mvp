'use client'

// ════════════════════════════════════════════════════════════════════════════
// ORG HEALTH MAP — Vista Hub: Mapa de gerencias con patron + ICC
// src/components/talent-actions/OrgHealthMap.tsx
//
// Briefing Ejecutivo:
// - Grid asimetrico (FRAGIL/QUEMADA dominan con col-span-2)
// - Saludables colapsadas al final
// - Edge states: All-healthy celebratorio, calibracion parcial
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Sparkles } from 'lucide-react'
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

// Orden de severidad: menor = mas urgente
const PATTERN_SEVERITY: Record<string, number> = {
  FRAGIL: 1, QUEMADA: 2, ESTANCADA: 3,
  RIESGO_OCULTO: 4, EN_TRANSICION: 5, SALUDABLE: 6
}

const RED_PATTERNS = new Set(['FRAGIL', 'QUEMADA'])

export default function OrgHealthMap({
  gerencias, orgStats, flaggedGerencias, onSelectGerencia
}: OrgHealthMapProps) {

  const [showSaludables, setShowSaludables] = useState(false)

  // Potencial perdido global
  const totalPotencialNoActivado = gerencias.reduce(
    (sum, g) => sum + g.sucesores.potencialNoActivado, 0
  )

  // Separar en riesgo vs saludables
  const enRiesgo = gerencias
    .filter(g => g.pattern !== 'SALUDABLE' && !g.dataInsufficient)
    .sort((a, b) => {
      const sevA = a.pattern ? (PATTERN_SEVERITY[a.pattern] ?? 7) : 7
      const sevB = b.pattern ? (PATTERN_SEVERITY[b.pattern] ?? 7) : 7
      return sevA - sevB
    })

  const saludables = gerencias.filter(g => g.pattern === 'SALUDABLE')
  const insuficientes = gerencias.filter(g => g.dataInsufficient)

  const insufficientCount = insuficientes.length
  const sufficientCount = gerencias.length - insufficientCount

  // Edge state: all-healthy
  const isAllHealthy = enRiesgo.length === 0 && saludables.length > 0 && insuficientes.length === 0

  // Totales para celebracion
  const totalMotores = gerencias.reduce((sum, g) => sum + g.riskDistribution.MOTOR_EQUIPO, 0)

  // ══════════════════════════════════════════════════════════════════════
  // EDGE STATE: All-Healthy Celebration
  // ══════════════════════════════════════════════════════════════════════

  if (isAllHealthy) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 mb-6"
          >
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium text-lg">Organizacion Modelo</span>
          </motion.div>

          <h2 className="text-3xl font-light text-white">
            Tu organizacion es modelo a replicar
          </h2>

          <p className="text-slate-400 mt-4 max-w-lg mx-auto">
            {saludables.length} gerencias en estado saludable.
            $0 en riesgo de fuga.
            {totalMotores > 0 && ` ${totalMotores} motores sostienen la operacion.`}
          </p>

          {/* Saludables grid compacto */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8 max-w-2xl mx-auto">
            {saludables.map(g => (
              <button
                key={g.gerenciaId}
                onClick={() => onSelectGerencia(g.gerenciaId)}
                className="bg-slate-800/30 border border-emerald-500/20 rounded-xl p-3
                  hover:border-emerald-500/40 transition-colors text-left"
              >
                <p className="text-slate-300 text-sm font-medium truncate">{g.gerenciaName}</p>
                <p className="text-emerald-400/70 text-xs mt-0.5">Modelo a replicar</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════
  // NORMAL STATE
  // ══════════════════════════════════════════════════════════════════════

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

      {/* Calibracion parcial — linea discreta */}
      {insufficientCount > 0 && (
        <div className="flex items-center justify-between py-2 px-4 bg-slate-800/30 rounded-lg text-sm">
          <span className="text-amber-400">
            {insufficientCount} gerencia{insufficientCount !== 1 ? 's' : ''} en calibracion
          </span>
          <span className="text-slate-500 text-xs">
            {sufficientCount} de {gerencias.length} con datos
          </span>
        </div>
      )}

      {/* Potencial perdido banner */}
      {totalPotencialNoActivado > 0 && (
        <SuccessionGapBanner count={totalPotencialNoActivado} />
      )}

      {/* Grid de gerencias en riesgo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {enRiesgo.map((gerencia, index) => {
          const isRed = gerencia.pattern ? RED_PATTERNS.has(gerencia.pattern) : false

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
                severity={isRed ? 'red' : 'normal'}
              />
            </motion.div>
          )
        })}

        {/* Insuficientes inline */}
        {insuficientes.map((gerencia, index) => (
          <motion.div
            key={gerencia.gerenciaId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (enRiesgo.length + index) * 0.05, type: 'spring', stiffness: 220, damping: 30 }}
          >
            <GerenciaPatternCard
              gerencia={gerencia}
              isFlagged={flaggedGerencias?.has(gerencia.gerenciaId) || false}
              onClick={() => onSelectGerencia(gerencia.gerenciaId)}
            />
          </motion.div>
        ))}
      </div>

      {/* Saludables colapsadas */}
      {saludables.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowSaludables(!showSaludables)}
            className="text-slate-500 text-sm flex items-center gap-2 hover:text-slate-300 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showSaludables ? 'rotate-180' : ''}`} />
            {saludables.length} {saludables.length === 1 ? 'gerencia saludable' : 'gerencias saludables'}
          </button>

          <AnimatePresence>
            {showSaludables && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  {saludables.map(g => (
                    <button
                      key={g.gerenciaId}
                      onClick={() => onSelectGerencia(g.gerenciaId)}
                      className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-3
                        opacity-50 hover:opacity-70 transition-opacity text-left"
                    >
                      <p className="text-slate-400 text-sm font-medium truncate">{g.gerenciaName}</p>
                      <p className="text-emerald-400/70 text-xs mt-0.5">Modelo a replicar</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

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
