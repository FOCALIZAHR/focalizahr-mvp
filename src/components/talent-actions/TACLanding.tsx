'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAC LANDING — Pantalla inicial limpia (revelacion progresiva)
// src/components/talent-actions/TACLanding.tsx
//
// Solo: Headline + Mision + CTA unico con glow + link secundario
// SIN grid, SIN cards, SIN sidebar = solo la decision
// Mandamiento #3: UN CTA por pantalla
// Mandamiento #5: Progressive Disclosure
// ════════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { formatCurrencyCLP } from '@/lib/financialCalculations'
import type { OrgMapResult, GerenciaMapItem } from '@/lib/services/TalentActionService'

interface TACLandingProps {
  orgMap: OrgMapResult
  onNavigate: (view: 'gerencias' | 'personas') => void
  userRole?: string | null
}

// ════════════════════════════════════════════════════════════════════════════
// AGGREGATES + BUILDERS (reutilizados de TACHeader)
// ════════════════════════════════════════════════════════════════════════════

function computeAggregates(gerencias: GerenciaMapItem[]) {
  let plTotal = 0
  let fugaTotal = 0
  let potencialPerdido = 0
  let gerenciasFragiles = 0
  let gerenciaMasCritica: GerenciaMapItem | null = null
  let maxFuga = 0

  for (const g of gerencias) {
    if (g.financialImpact) {
      plTotal += g.financialImpact.fugaCerebrosCostCLP + g.financialImpact.iccRiskCLP
    }
    fugaTotal += g.riskDistribution.FUGA_CEREBROS
    potencialPerdido += g.sucesores.potencialNoActivado

    if (g.pattern === 'FRAGIL' || g.pattern === 'QUEMADA') {
      gerenciasFragiles++
    }

    if (g.riskDistribution.FUGA_CEREBROS > maxFuga && !g.dataInsufficient) {
      maxFuga = g.riskDistribution.FUGA_CEREBROS
      gerenciaMasCritica = g
    }
  }

  return { plTotal, fugaTotal, potencialPerdido, gerenciasFragiles, gerenciaMasCritica }
}

function buildHeadline(orgMap: OrgMapResult, agg: ReturnType<typeof computeAggregates>): string {
  if (agg.plTotal > 100_000_000) {
    return `${formatCurrencyCLP(agg.plTotal)} en riesgo de fuga concentrado en ${agg.gerenciasFragiles || orgMap.orgStats.totalGerencias} gerencias`
  }
  if (orgMap.orgStats.iccOrganizacional && orgMap.orgStats.iccOrganizacional > 25) {
    return `${orgMap.orgStats.iccOrganizacional}% del conocimiento critico esta en manos de personas en riesgo`
  }
  if (agg.potencialPerdido > 5) {
    return `${agg.potencialPerdido} sucesores naturales se estan yendo sin plan activo`
  }
  if (orgMap.orgStats.patronDominante === 'SALUDABLE') {
    return 'Tu organizacion es modelo a replicar'
  }
  return `${orgMap.orgStats.totalClasificadas} personas mapeadas en ${orgMap.orgStats.totalGerencias} gerencias`
}

function buildMission(orgMap: OrgMapResult, agg: ReturnType<typeof computeAggregates>): string {
  if (agg.gerenciaMasCritica && agg.gerenciaMasCritica.riskDistribution.FUGA_CEREBROS > 0) {
    const g = agg.gerenciaMasCritica
    return `Revisar ${g.gerenciaName} (${g.riskDistribution.FUGA_CEREBROS} en fuga)`
  }
  if (orgMap.orgStats.patronDominante === 'FRAGIL') return 'Contener fuga antes de perder mas talento critico'
  if (orgMap.orgStats.patronDominante === 'QUEMADA') return 'Revisar cargas de trabajo en equipos sobrecargados'
  if (orgMap.orgStats.patronDominante === 'SALUDABLE') return 'Reconocer a los equipos que sostienen la operacion'
  return 'Explorar el mapa de talento de tu organizacion'
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function TACLanding({ orgMap, onNavigate, userRole }: TACLandingProps) {
  const agg = useMemo(() => computeAggregates(orgMap.gerencias), [orgMap.gerencias])
  const headline = useMemo(() => buildHeadline(orgMap, agg), [orgMap, agg])
  const mission = useMemo(() => buildMission(orgMap, agg), [orgMap, agg])

  const gerenciasEnRiesgo = agg.gerenciasFragiles
  const personasEnRiesgo = agg.fugaTotal
  const primaryView: 'gerencias' | 'personas' = gerenciasEnRiesgo > 0 ? 'gerencias' : 'personas'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="min-h-[60vh] flex flex-col items-center justify-center text-center px-8"
    >
      {/* HEADLINE */}
      <h1 className="text-3xl font-light text-white mb-6 leading-snug max-w-2xl">
        {headline}
      </h1>

      {/* MISION */}
      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-10">
        <span className="text-cyan-400 text-sm">Tu mision ahora:</span>
        <span className="text-white text-sm font-medium">{mission}</span>
      </div>

      {/* CTA PRINCIPAL — con glow */}
      <button
        onClick={() => onNavigate(primaryView)}
        className="px-8 py-4 rounded-xl font-medium text-lg transition-all duration-300
          bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-900
          shadow-[0_0_30px_rgba(34,211,238,0.4)]
          hover:shadow-[0_0_40px_rgba(34,211,238,0.6)]"
      >
        {primaryView === 'gerencias'
          ? `Ver ${gerenciasEnRiesgo} gerencia${gerenciasEnRiesgo !== 1 ? 's' : ''} en riesgo`
          : `Ver ${personasEnRiesgo} persona${personasEnRiesgo !== 1 ? 's' : ''} en riesgo`
        }
      </button>

      {/* LINK SECUNDARIO — sutil (oculto para AREA_MANAGER) */}
      {userRole !== 'AREA_MANAGER' && (
        <button
          onClick={() => onNavigate(primaryView === 'gerencias' ? 'personas' : 'gerencias')}
          className="mt-4 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
        >
          {primaryView === 'gerencias'
            ? `Tambien: ${personasEnRiesgo} persona${personasEnRiesgo !== 1 ? 's' : ''} en cuadrantes criticos →`
            : 'Tambien: Vista por gerencias →'
          }
        </button>
      )}
    </motion.div>
  )
}
