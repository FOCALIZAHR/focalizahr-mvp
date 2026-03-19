'use client'

// ════════════════════════════════════════════════════════════════════════════
// TALENT DISTRIBUTION — Executive Hub · Nivel Apple/Tesla/FocalizaHR
//
// Portada narrativa → Contenido: ADN + Concentración + 9-Box flotante
// Narrativas centralizadas: nineBoxLabels.ts + tacLabels.ts
// El 9-Box es referencia (flotante), no protagonista
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ArrowLeft, ChevronRight, Grid3X3, X } from 'lucide-react'
import { getNineBoxLabel, getNineBoxNarrative, getNineBoxSubtitle, getNineBoxZone } from '@/config/nineBoxLabels'
import { getOrgDNANarrative, getOrgDNANarrativeShort } from '@/config/tacLabels'
import { getConcentracionNarratives } from '@/config/ConcentracionNarratives'
import { PanelPortada } from './PanelPortada'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface TalentMini9BoxProps {
  onSelectGerencia?: (gerencia: string) => void
  data: {
    nineBox: {
      total: number
      summary: Array<{ position: string; count: number; percent: number }>
    }
    distribution: {
      total: number
      distribution: Array<{ level: string; calculatedCount: number; calculatedPercent: number }>
    }
    starConcentration?: {
      totalStars: number
      concentration: Array<{ gerencia: string; starsCount: number; starsPercent: number }>
      concentrationRisk: boolean
      riskMessage: string | null
    }
    orgDNA?: {
      topStrength: { competency: string; avgTarget: number; expected?: number; gap?: number } | null
      topDevelopment: { competency: string; avgTarget: number; expected?: number; gap?: number } | null
      insight: string | null
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 9-BOX GRID LAYOUT (row/col para renderizar)
// ════════════════════════════════════════════════════════════════════════════

const GRID_POSITIONS = [
  { key: 'growth_potential', row: 0, col: 0 },
  { key: 'potential_gem',    row: 0, col: 1 },
  { key: 'star',             row: 0, col: 2 },
  { key: 'inconsistent',     row: 1, col: 0 },
  { key: 'core_player',      row: 1, col: 1 },
  { key: 'high_performer',   row: 1, col: 2 },
  { key: 'underperformer',   row: 2, col: 0 },
  { key: 'average_performer', row: 2, col: 1 },
  { key: 'trusted_professional', row: 2, col: 2 },
]

const RISK_POSITIONS = new Set(['underperformer', 'inconsistent', 'average_performer'])

// ════════════════════════════════════════════════════════════════════════════
// PORTADA NARRATIVA
// ════════════════════════════════════════════════════════════════════════════

function getPortadaNarrative(data: TalentMini9BoxProps['data']) {
  const { summary, total } = data.nineBox
  const countMap: Record<string, number> = {}
  summary.forEach(s => { countMap[s.position] = s.count })

  // Calcular zonas
  const altoPositions = new Set(['star', 'high_performer', 'potential_gem', 'growth_potential'])
  const bajoPositions = new Set(['inconsistent', 'underperformer'])
  let altoCount = 0, bajoCount = 0
  summary.forEach(s => {
    if (altoPositions.has(s.position)) altoCount += s.count
    else if (bajoPositions.has(s.position)) bajoCount += s.count
  })
  const altoPct = total > 0 ? Math.round((altoCount / total) * 100) : 0
  const bajoPct = total > 0 ? Math.round((bajoCount / total) * 100) : 0

  // ADN
  const hasStrength = !!data.orgDNA?.topStrength
  const hasDevelopment = !!data.orgDNA?.topDevelopment
  const developmentName = data.orgDNA?.topDevelopment?.competency || ''

  // Narrativa combinada: distribución + ADN
  if (bajoPct > 30 && hasDevelopment) {
    return {
      narrative: {
        highlight: `${bajoPct}% de los colaboradores evaluados`,
        suffix: ` no entrega el retorno esperado y la brecha mas urgente está en ${developmentName}.`
      },
      ctaVariant: 'cyan' as const,
      coachingTip: `${altoPct}% de alto retorno sostiene la operacion. Los lideres son la palanca.`
    }
  }

  if (bajoPct > 15 && hasDevelopment) {
    return {
      narrative: {
        highlight: `${altoPct}% de alto retorno`,
        suffix: ` contra ${bajoPct}% en riesgo. La brecha: ${developmentName}.`
      },
      ctaVariant: 'cyan' as const,
      coachingTip: hasStrength
        ? getOrgDNANarrative(data.orgDNA!.topStrength, data.orgDNA!.topDevelopment)
        : `Ninguna competencia supera el estandar aun.`
    }
  }

  if (hasDevelopment) {
    return {
      narrative: {
        highlight: `${total} personas evaluadas`,
        suffix: `. Tu mayor oportunidad: ${developmentName}.`
      },
      ctaVariant: 'cyan' as const,
      coachingTip: hasStrength
        ? getOrgDNANarrative(data.orgDNA!.topStrength, data.orgDNA!.topDevelopment)
        : `${altoPct}% de alto retorno. ${bajoPct}% en zona de riesgo.`
    }
  }

  return {
    narrative: {
      highlight: `${total} personas evaluadas`,
      suffix: `. ${altoPct}% de alto retorno, ${bajoPct}% en zona de riesgo.`
    },
    ctaVariant: 'cyan' as const,
    coachingTip: 'Explora la distribucion de talento y las brechas de competencia.'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const TalentMini9Box = memo(function TalentMini9Box({ data, onSelectGerencia }: TalentMini9BoxProps) {
  const [view, setView] = useState<'portada' | 'content'>('portada')
  const [show9Box, setShow9Box] = useState(false)
  const [activeTab, setActiveTab] = useState<'adn' | 'concentracion'>('adn')
  const [zonaActiva, setZonaActiva] = useState<'alto' | 'medio' | 'bajo' | null>(null)
  const [perspectiva, setPerspectiva] = useState<'pl' | 'do'>('pl')

  const { summary, total } = data.nineBox
  const countMap: Record<string, number> = {}
  summary.forEach(s => { countMap[s.position] = s.count })

  const { narrative, ctaVariant, coachingTip } = getPortadaNarrative(data)

  return (
    <div className="relative h-full">
      <div className="fhr-top-line absolute inset-x-0 top-0 z-10" />

      <AnimatePresence mode="wait">
        {view === 'portada' ? (
          <motion.div
            key="portada"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <PanelPortada
              narrative={narrative}
              ctaLabel="Ver distribución"
              ctaVariant={ctaVariant}
              onCtaClick={() => setView('content')}
              coachingTip={coachingTip}
            />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6 md:p-8"
          >
            {/* Header con bimodal toggle */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setView('portada')}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Portada
              </button>

              {/* Bimodal toggle — patrón CockpitHeaderBimodal */}
              <div
                className="relative flex items-center rounded-full"
                style={{
                  width: '180px',
                  height: '36px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                }}
              >
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    top: '2px',
                    height: '30px',
                    width: '87px',
                    background: activeTab === 'adn'
                      ? 'linear-gradient(135deg, #22D3EE, #0891B2)'
                      : 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
                  }}
                  animate={{ x: activeTab === 'adn' ? '2px' : '89px' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
                />
                <button
                  onClick={() => setActiveTab('adn')}
                  className="absolute left-0.5 top-0.5 bottom-0.5 z-10 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    width: '87px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: activeTab === 'adn' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(148, 163, 184, 0.8)',
                  }}
                >
                  ADN
                </button>
                <button
                  onClick={() => setActiveTab('concentracion')}
                  className="absolute right-0.5 top-0.5 bottom-0.5 z-10 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    width: '87px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: activeTab === 'concentracion' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(148, 163, 184, 0.8)',
                  }}
                >
                  Estrellas
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'adn' ? (
                <motion.div
                  key="adn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-center"
                >
                  {data.orgDNA && (data.orgDNA.topStrength || data.orgDNA.topDevelopment) ? (
                    <div className="w-full max-w-sm space-y-1">

                      {/* Fortaleza — hero */}
                      {data.orgDNA.topStrength && (
                        <>
                          <p className="text-[10px] uppercase tracking-widest text-slate-500">
                            Tu organización destaca en
                          </p>
                          <h3 className="text-3xl font-light tracking-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                              {data.orgDNA.topStrength.competency}
                            </span>
                          </h3>
                          {data.orgDNA.topStrength.gap !== undefined && data.orgDNA.topStrength.gap > 0 && (
                            <p className="text-sm text-cyan-400 font-light mt-1">
                              +{data.orgDNA.topStrength.gap.toFixed(1)} pts sobre el estándar
                            </p>
                          )}
                        </>
                      )}

                      {/* Separador */}
                      {data.orgDNA.topStrength && data.orgDNA.topDevelopment && (
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 my-5">
                          y necesita crecer en
                        </p>
                      )}
                      {!data.orgDNA.topStrength && data.orgDNA.topDevelopment && (
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">
                          La brecha más urgente
                        </p>
                      )}

                      {/* Oportunidad */}
                      {data.orgDNA.topDevelopment && (
                        <>
                          <h3 className="text-3xl font-semibold tracking-tight text-white">
                            {data.orgDNA.topDevelopment.competency}
                          </h3>
                          {data.orgDNA.topDevelopment.gap !== undefined && data.orgDNA.topDevelopment.gap < 0 && (
                            <p className="text-sm text-purple-400 font-light mt-1">
                              -{Math.abs(data.orgDNA.topDevelopment.gap).toFixed(1)} pts bajo lo que el cargo exige
                            </p>
                          )}
                        </>
                      )}

                      {/* Divider dot */}
                      <div className="flex justify-center my-6">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      </div>

                      {/* Narrativa — short version (títulos hero ya muestran nombres) */}
                      <p className="text-xs text-slate-500 text-center italic max-w-sm mx-auto leading-relaxed">
                        {getOrgDNANarrativeShort(data.orgDNA.topStrength, data.orgDNA.topDevelopment)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 py-8">Sin evaluaciones suficientes para el ADN.</p>
                  )}

                  {/* Acciones */}
                  <div className="flex items-center justify-between w-full mt-8">
                    <button
                      onClick={() => setShow9Box(true)}
                      className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      <Grid3X3 className="w-3.5 h-3.5" />
                      Ver 9-Box
                    </button>
                    <a
                      href="/dashboard/performance/nine-box"
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-cyan-400 text-slate-950 text-xs font-medium hover:bg-cyan-300 transition-all duration-300"
                    >
                      9-Box Interactivo
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="concentracion"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {(() => {
                    const altoPositions = new Set(['star', 'high_performer', 'potential_gem', 'growth_potential'])
                    const medioPositions = new Set(['core_player', 'trusted_professional'])
                    const bajoPositions = new Set(['inconsistent', 'underperformer'])

                    let altoCount = 0, medioCount = 0, bajoCount = 0
                    summary.forEach(s => {
                      if (altoPositions.has(s.position)) altoCount += s.count
                      else if (medioPositions.has(s.position)) medioCount += s.count
                      else if (bajoPositions.has(s.position)) bajoCount += s.count
                    })

                    const altoPct = total > 0 ? Math.round((altoCount / total) * 100) : 0
                    const medioPct = total > 0 ? Math.round((medioCount / total) * 100) : 0
                    const bajoPct = total > 0 ? Math.round((bajoCount / total) * 100) : 0

                    const narratives = getConcentracionNarratives(altoPct, medioPct, bajoPct)

                    let narrativaActual = narratives.global
                    if (zonaActiva === 'alto') narrativaActual = perspectiva === 'pl' ? narratives.altoRetorno.ceo : narratives.altoRetorno.do
                    else if (zonaActiva === 'medio') narrativaActual = perspectiva === 'pl' ? narratives.retornoMedio.ceo : narratives.retornoMedio.do
                    else if (zonaActiva === 'bajo') narrativaActual = perspectiva === 'pl' ? narratives.gastoEnRiesgo.ceo : narratives.gastoEnRiesgo.do

                    return (
                      <div className="w-full space-y-6">

                        {/* Pill toggle P&L / Personas */}
                        <div className="flex justify-center">
                          <div
                            className="relative flex items-center rounded-full"
                            style={{
                              width: '170px', height: '32px',
                              background: 'rgba(30, 41, 59, 0.6)',
                              border: '1px solid rgba(71, 85, 105, 0.3)',
                            }}
                          >
                            <motion.div
                              className="absolute rounded-full"
                              style={{
                                top: '2px', height: '26px', width: '82px',
                                background: perspectiva === 'pl'
                                  ? 'linear-gradient(135deg, #22D3EE, #0891B2)'
                                  : 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
                              }}
                              animate={{ x: perspectiva === 'pl' ? '2px' : '84px' }}
                              transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
                            />
                            <button
                              onClick={() => { setPerspectiva('pl'); setZonaActiva(null) }}
                              className="absolute left-0.5 top-0.5 bottom-0.5 z-10 rounded-full flex items-center justify-center"
                              style={{
                                width: '82px', fontSize: '10px', fontWeight: 500,
                                color: perspectiva === 'pl' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(148, 163, 184, 0.7)',
                              }}
                            >
                              P&L
                            </button>
                            <button
                              onClick={() => { setPerspectiva('do'); setZonaActiva(null) }}
                              className="absolute right-0.5 top-0.5 bottom-0.5 z-10 rounded-full flex items-center justify-center"
                              style={{
                                width: '82px', fontSize: '10px', fontWeight: 500,
                                color: perspectiva === 'do' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(148, 163, 184, 0.7)',
                              }}
                            >
                              Personas
                            </button>
                          </div>
                        </div>

                        {/* Vistas completamente diferentes por perspectiva */}
                        <AnimatePresence mode="wait">
                          {perspectiva === 'pl' ? (
                            /* ══════ VISTA P&L — 3 columnas % protagonistas ══════ */
                            <motion.div
                              key="vista-pl"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="grid grid-cols-3 gap-4"
                            >
                              {[
                                { key: 'alto' as const, label: 'Alto retorno', pct: altoPct, color: 'text-cyan-400', action: 'Cuidar e invertir' },
                                { key: 'medio' as const, label: 'Retorno medio', pct: medioPct, color: 'text-slate-400', action: 'Retorno estable' },
                                { key: 'bajo' as const, label: 'Gasto en riesgo', pct: bajoPct, color: 'text-purple-400', action: 'Tomar decisiones' },
                              ].map(zona => (
                                <motion.button
                                  key={zona.key}
                                  onClick={() => setZonaActiva(zonaActiva === zona.key ? null : zona.key)}
                                  animate={{
                                    opacity: zonaActiva === null || zonaActiva === zona.key ? 1 : 0.35,
                                    scale: zonaActiva === zona.key ? 1.02 : 1,
                                  }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                  className="text-center py-3 cursor-pointer"
                                >
                                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                                    {zona.label}
                                  </p>
                                  <p className={cn('text-4xl font-light', zona.color)}>
                                    {zona.pct}%
                                  </p>
                                  <p className="text-xs text-slate-600 mt-2">
                                    {zona.action}
                                  </p>
                                </motion.button>
                              ))}
                            </motion.div>
                          ) : (
                            /* ══════ VISTA PERSONAS — Grid framework completo ══════ */
                            <motion.div
                              key="vista-personas"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="space-y-0"
                            >
                              {/* Headers */}
                              <div className="grid grid-cols-4 gap-x-3 pb-3 border-b border-slate-800/30">
                                <div />
                                <p className="text-[10px] uppercase tracking-widest text-cyan-400 text-center">Alto retorno</p>
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 text-center">Retorno medio</p>
                                <p className="text-[10px] uppercase tracking-widest text-purple-400 text-center">Gasto en riesgo</p>
                              </div>

                              {/* Fila P&L */}
                              <div className="grid grid-cols-4 gap-x-3 py-3 border-b border-slate-800/20">
                                <p className="text-[10px] uppercase tracking-widest text-slate-600 self-center">P&L</p>
                                <p className="text-xs text-slate-400 italic text-center">Sobre la exigencia</p>
                                <p className="text-xs text-slate-400 italic text-center">Cumple lo esperado</p>
                                <p className="text-xs text-slate-400 italic text-center">Bajo lo esperado</p>
                              </div>

                              {/* Fila Gestión */}
                              <div className="grid grid-cols-4 gap-x-3 py-3 border-b border-slate-800/20">
                                <p className="text-[10px] uppercase tracking-widest text-slate-600 self-center">Gestión</p>
                                <p className="text-xs font-medium text-cyan-400 text-center">Cuidar e invertir</p>
                                <p className="text-xs font-medium text-slate-300 text-center">Entender y desarrollar</p>
                                <p className="text-xs font-medium text-purple-400 text-center">Tomar decisiones</p>
                              </div>

                              {/* Fila Quiénes */}
                              <div className="grid grid-cols-4 gap-x-3 py-3 border-b border-slate-800/20">
                                <p className="text-[10px] uppercase tracking-widest text-slate-600 self-start pt-0.5">Quiénes</p>
                                <div className="text-center space-y-1">
                                  <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-cyan-400 shrink-0" />{getNineBoxLabel('star')}
                                  </p>
                                  <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-cyan-400/60 shrink-0" />{getNineBoxLabel('high_performer')}
                                  </p>
                                  <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-cyan-400/40 shrink-0" />{getNineBoxLabel('potential_gem')}
                                  </p>
                                  <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-cyan-400/30 shrink-0" />{getNineBoxLabel('growth_potential')}
                                  </p>
                                </div>
                                <div className="text-center space-y-1">
                                  <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />{getNineBoxLabel('core_player')}
                                  </p>
                                  <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-slate-400/60 shrink-0" />{getNineBoxLabel('trusted_professional')}
                                  </p>
                                </div>
                                <div className="text-center space-y-1">
                                  <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-purple-400 shrink-0" />{getNineBoxLabel('inconsistent')}
                                  </p>
                                  <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-purple-400/60 shrink-0" />{getNineBoxLabel('underperformer')}
                                  </p>
                                </div>
                              </div>

                              {/* Fila % — clickeable */}
                              <div className="grid grid-cols-4 gap-x-3 py-3">
                                <p className="text-[10px] uppercase tracking-widest text-slate-600 self-center">%</p>
                                <motion.button
                                  onClick={() => setZonaActiva(zonaActiva === 'alto' ? null : 'alto')}
                                  animate={{ opacity: zonaActiva === null || zonaActiva === 'alto' ? 1 : 0.35 }}
                                  className="text-center"
                                >
                                  <p className="text-2xl font-light text-cyan-400">{altoPct}%</p>
                                </motion.button>
                                <motion.button
                                  onClick={() => setZonaActiva(zonaActiva === 'medio' ? null : 'medio')}
                                  animate={{ opacity: zonaActiva === null || zonaActiva === 'medio' ? 1 : 0.35 }}
                                  className="text-center"
                                >
                                  <p className="text-2xl font-light text-slate-400">{medioPct}%</p>
                                </motion.button>
                                <motion.button
                                  onClick={() => setZonaActiva(zonaActiva === 'bajo' ? null : 'bajo')}
                                  animate={{ opacity: zonaActiva === null || zonaActiva === 'bajo' ? 1 : 0.35 }}
                                  className="text-center"
                                >
                                  <p className="text-2xl font-light text-purple-400">{bajoPct}%</p>
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Divider dot */}
                        <div className="flex justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        </div>

                        {/* Narrativa dinámica */}
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={`${zonaActiva}-${perspectiva}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="text-sm text-slate-300 text-center italic max-w-sm mx-auto leading-relaxed"
                          >
                            {narrativaActual}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    )
                  })()}

                  {/* Acciones */}
                  <div className="flex items-center justify-between w-full mt-8">
                    <button
                      onClick={() => setShow9Box(true)}
                      className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      <Grid3X3 className="w-3.5 h-3.5" />
                      Ver 9-Box
                    </button>
                    <a
                      href="/dashboard/performance/nine-box"
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-cyan-400 text-slate-950 text-xs font-medium hover:bg-cyan-300 transition-all duration-300"
                    >
                      9-Box Interactivo
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════ 9-BOX FLOTANTE ════════════ */}
      <AnimatePresence>
        {show9Box && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-[24px]"
              onClick={() => setShow9Box(false)}
            />

            {/* 9-Box Grid */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-sm mx-4 p-5 bg-slate-900/95 backdrop-blur-xl border border-slate-800/60 rounded-2xl shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-400 font-medium">9-Box · {total} personas</span>
                <button
                  onClick={() => setShow9Box(false)}
                  className="text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {GRID_POSITIONS.map(cell => {
                  const count = countMap[cell.key] || 0
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  const hasPersons = count > 0
                  const label = getNineBoxLabel(cell.key)

                  return (
                    <NineBoxCell
                      key={cell.key}
                      position={cell.key}
                      count={count}
                      percent={pct}
                      label={label}
                      hasPersons={hasPersons}
                    />
                  )
                })}
              </div>

              {/* Axis labels */}
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[8px] text-slate-700">↑ Potencial</span>
                <span className="text-[8px] text-slate-700">Desempeño →</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// 9-BOX CELL — con tooltip narrativo
// ════════════════════════════════════════════════════════════════════════════

const ZONE_ACCENT: Record<string, string> = {
  top: '#22D3EE',       // cyan — top talent
  core: '#A78BFA',      // purple — core
  development: '#F59E0B', // amber — development
  risk: '#64748B',      // slate — risk (sutil, no rojo)
}

function NineBoxCell({ position, count, percent, label, hasPersons }: {
  position: string; count: number; percent: number; label: string; hasPersons: boolean
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const subtitle = getNineBoxSubtitle(position)
  const narrativeText = getNineBoxNarrative(position)
  const zone = getNineBoxZone(position)
  const accent = zone ? ZONE_ACCENT[zone] : '#475569'

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={cn(
          'rounded-xl border p-2.5 text-center min-h-[56px] flex flex-col items-center justify-center transition-all relative overflow-hidden',
          hasPersons
            ? 'bg-slate-800/50 border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/70'
            : 'bg-slate-900/20 border-slate-800/15 opacity-20'
        )}
      >
        {/* Acento de zona — línea Tesla top visible */}
        {hasPersons && (
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent 10%, ${accent} 50%, transparent 90%)`,
              boxShadow: `0 0 8px ${accent}40`,
            }}
          />
        )}

        <span className={cn(
          'text-lg font-light',
          hasPersons ? 'text-white' : 'text-slate-700'
        )}>
          {hasPersons ? `${percent}%` : '—'}
        </span>
        <span className="text-[8px] text-slate-500 font-medium leading-tight mt-0.5">
          {label}
        </span>
      </div>

      {/* Tooltip narrativo */}
      {showTooltip && hasPersons && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2.5 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl pointer-events-none z-50 w-[200px]">
          <p className="text-[11px] text-white font-medium">{label}</p>
          <p className="text-[10px] mt-0.5" style={{ color: `${accent}AA` }}>{subtitle}</p>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{narrativeText}</p>
          <p className="text-[10px] text-slate-600 mt-1.5">{count} persona{count !== 1 ? 's' : ''} · {percent}%</p>
        </div>
      )}
    </div>
  )
}
