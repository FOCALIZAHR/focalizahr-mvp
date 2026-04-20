// ════════════════════════════════════════════════════════════════════════════
// FAMILY BRIEFING — Nivel 2 del Efficiency Hub (la "Sala de Situación")
// src/components/efficiency/FamilyBriefing.tsx
// ════════════════════════════════════════════════════════════════════════════
// Aparece entre el Shock Global (Nivel 1) y los lentes específicos (Nivel 3).
//
// Layout:
//   · Portada glassmorphism con Tesla line (patrón CompensationPortada).
//   · Cada lente es un NODO INTERACTIVO clickeable completo:
//       - Izquierda: eyebrow (L# · NOMBRE) + narrativa corta (2 líneas).
//       - Derecha: número protagonista + ícono ↗ que aparece en hover.
//   · Aside 30% reactivo: default "Seleccione un análisis"; en hover sobre un
//     nodo, muestra preview de impacto + desglose.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { LenteAPI } from '@/hooks/useEfficiencyWorkspace'
import {
  formatCLP,
  formatInt,
  formatPct,
  type FamiliaId,
  type LenteId,
} from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// CONFIG — metadatos de familia
// ════════════════════════════════════════════════════════════════════════════

interface FamiliaMeta {
  /** Eyebrow ejecutivo — nombre visible nuevo (ex-DIAGNÓSTICO/OPORTUNIDAD/PROTECCIÓN) */
  eyebrow: string
  titleFirst: string
  titleGradient: string
  accent: string
  lentes: LenteId[]
  potencialLabel: string
  getPotencial: (lentes: Record<LenteId, LenteAPI>) => number
}

const FAMILIA_META: Record<FamiliaId, FamiliaMeta> = {
  capital_en_riesgo: {
    eyebrow: 'DECISIÓN PENDIENTE',
    titleFirst: 'Capital',
    titleGradient: 'en riesgo',
    accent: '#22D3EE',
    lentes: ['l1_inercia', 'l4_fantasma'],
    potencialLabel: '/mes',
    getPotencial: lentes => {
      const d = lentes.l1_inercia?.detalle as { totalMonthly?: number } | null
      return d?.totalMonthly ?? 0
    },
  },
  ruta_ejecucion: {
    eyebrow: 'A QUIÉN MOVER',
    titleFirst: 'Ruta de',
    titleGradient: 'ejecución',
    accent: '#A78BFA',
    lentes: ['l2_zombie', 'l5_brecha', 'l7_fuga'],
    potencialLabel: '/mes',
    getPotencial: lentes => {
      const d = lentes.l5_brecha?.detalle as { total?: number } | null
      return d?.total ?? 0
    },
  },
  costo_esperar: {
    eyebrow: 'PRECIO DE LA POSTERGACIÓN',
    titleFirst: 'Costo de',
    titleGradient: 'esperar',
    accent: '#F59E0B',
    lentes: ['l3_adopcion', 'l9_pasivo'],
    potencialLabel: 'en 12 meses',
    getPotencial: lentes => {
      const d = lentes.l9_pasivo?.detalle as
        | { costoEsperaTotal?: number }
        | null
      return d?.costoEsperaTotal ?? 0
    },
  },
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIG — copy por lente (nombres ejecutivos + preview hover)
// ════════════════════════════════════════════════════════════════════════════

interface LenteCopy {
  titulo: string
  /** Narrativa corta — 2 líneas, se muestra dentro del nodo */
  narrativa: string
  /** Número hero a la derecha del nodo (ya formateado) */
  getHero: (lente: LenteAPI) => string
  /** Label breve para el hero (ej: /mes, personas, pares) */
  getHeroUnit: (lente: LenteAPI) => string
  /** Titular de impacto proyectado (se muestra en el aside durante hover) */
  getImpacto: (lente: LenteAPI) => string
  /** 2–3 líneas de desglose en el aside durante hover */
  getDesglose: (lente: LenteAPI) => string[]
}

const LENTE_COPY: Record<LenteId, LenteCopy> = {
  l1_inercia: {
    titulo: 'L1 · COSTO DE NO DECIDIR',
    narrativa:
      'Cargos saturados por tareas que la IA ya puede resolver. Inversión atrapada cada mes que se posterga.',
    getHero: lente => {
      const d = lente.detalle as { totalMonthly?: number } | null
      return formatCLP(d?.totalMonthly ?? 0)
    },
    getHeroUnit: () => '/mes',
    getImpacto: lente => {
      const d = lente.detalle as { totalMonthly?: number } | null
      return `${formatCLP(d?.totalMonthly ?? 0)}/mes atrapados`
    },
    getDesglose: lente => {
      const d = lente.detalle as
        | { totalFTEs?: number; totalAnnual?: number }
        | null
      return [
        `${formatInt(d?.totalFTEs ?? 0)} FTEs equivalentes en tareas automatizables`,
        `${formatCLP(d?.totalAnnual ?? 0)} al año si no se libera capacidad`,
      ]
    },
  },
  l2_zombie: {
    titulo: 'L2 · TALENTO ESTANCADO',
    narrativa:
      'Perfiles que rinden hoy pero no podrán adaptarse al cambio tecnológico.',
    getHero: lente => {
      const d = lente.detalle as { count?: number } | null
      return formatInt(d?.count ?? 0)
    },
    getHeroUnit: lente => {
      const d = lente.detalle as { count?: number } | null
      return (d?.count ?? 0) === 1 ? 'persona' : 'personas'
    },
    getImpacto: lente => {
      const d = lente.detalle as { count?: number } | null
      return `${formatInt(d?.count ?? 0)} personas en zona crítica`
    },
    getDesglose: lente => {
      const d = lente.detalle as
        | { avgExposure?: number; totalInertiaCost?: number }
        | null
      return [
        `Exposición IA promedio: ${formatPct((d?.avgExposure ?? 0) * 100)}%`,
        `${formatCLP(d?.totalInertiaCost ?? 0)} en costo de inercia asociado`,
      ]
    },
  },
  l3_adopcion: {
    titulo: 'L3 · RIESGO DE ADOPCIÓN',
    narrativa:
      'Gerencias donde el clima no acompañará la inversión. Cada mes de demora aumenta la resistencia.',
    getHero: lente => {
      const d = lente.detalle as { ranking?: unknown[] } | null
      return formatInt(d?.ranking?.length ?? 0)
    },
    getHeroUnit: lente => {
      const d = lente.detalle as { ranking?: unknown[] } | null
      return (d?.ranking?.length ?? 0) === 1 ? 'gerencia' : 'gerencias'
    },
    getImpacto: lente => {
      const d = lente.detalle as { ranking?: unknown[] } | null
      const n = d?.ranking?.length ?? 0
      return `${formatInt(n)} en zona de fricción`
    },
    getDesglose: () => [
      'Clima crítico bajo el umbral 2.5 / 5',
      'Inversión rendirá menos sin acompañamiento previo',
    ],
  },
  l4_fantasma: {
    titulo: 'L4 · CARGOS SIN IMPACTO',
    narrativa:
      'Cargos con títulos distintos que comparten la mayor parte del trabajo.',
    getHero: lente => {
      const d = lente.detalle as { pairs?: unknown[] } | null
      return formatInt(d?.pairs?.length ?? 0)
    },
    getHeroUnit: lente => {
      const d = lente.detalle as { pairs?: unknown[] } | null
      return (d?.pairs?.length ?? 0) === 1 ? 'par' : 'pares'
    },
    getImpacto: lente => {
      const d = lente.detalle as { pairs?: unknown[]; avgOverlap?: number } | null
      const n = d?.pairs?.length ?? 0
      const pct = d?.avgOverlap ?? 0
      return `${formatInt(n)} pares con +${formatPct(pct)}% de overlap`
    },
    getDesglose: lente => {
      const d = lente.detalle as
        | { totalEstimatedSavings?: number; avgAutomation?: number }
        | null
      return [
        `Ahorro estimado por consolidación: ${formatCLP(d?.totalEstimatedSavings ?? 0)}`,
        `Automatización proyectada: ${formatPct((d?.avgAutomation ?? 0) * 100)}%`,
      ]
    },
  },
  l5_brecha: {
    titulo: 'L5 · BRECHA DE PRODUCTIVIDAD',
    narrativa:
      'Salario pagado sin el rendimiento equivalente. Se acumula cada mes.',
    getHero: lente => {
      const d = lente.detalle as { total?: number } | null
      return formatCLP(d?.total ?? 0)
    },
    getHeroUnit: () => '/mes',
    getImpacto: lente => {
      const d = lente.detalle as { total?: number } | null
      return `${formatCLP(d?.total ?? 0)}/mes sobre el estándar`
    },
    getDesglose: lente => {
      const d = lente.detalle as { affectedCount?: number } | null
      return [
        `${formatInt(d?.affectedCount ?? 0)} personas sobre el percentil 40`,
        'Dominio del cargo bajo el 40%',
      ]
    },
  },
  l6_seniority: {
    titulo: 'L6 · COMPRESIÓN DE SENIORITY',
    narrativa: 'Módulo en construcción.',
    getHero: () => '—',
    getHeroUnit: () => '',
    getImpacto: () => 'Pendiente',
    getDesglose: () => ['Reperfilar la línea senior con IA.'],
  },
  l7_fuga: {
    titulo: 'L7+L8 · TALENTO EN RIESGO',
    narrativa:
      'Mapa de talento aumentado con IA frente a zona de riesgo financiero.',
    getHero: lente => {
      const d = lente.detalle as { count?: number } | null
      return formatInt(d?.count ?? 0)
    },
    getHeroUnit: lente => {
      const d = lente.detalle as { count?: number } | null
      return (d?.count ?? 0) === 1 ? 'persona' : 'personas'
    },
    getImpacto: lente => {
      const d = lente.detalle as { count?: number } | null
      return `${formatInt(d?.count ?? 0)} personas a priorizar`
    },
    getDesglose: lente => {
      const d = lente.detalle as { totalReplacementCost?: number } | null
      return [
        'Entre zona de protección y zona de decisión',
        `Costo de reemplazo estimado: ${formatCLP(d?.totalReplacementCost ?? 0)}`,
      ]
    },
  },
  l8_retencion: {
    titulo: 'L8 · PRIORIDAD DE RETENCIÓN',
    narrativa: 'Fusionado con L7 en el Mapa de Talento.',
    getHero: () => '—',
    getHeroUnit: () => '',
    getImpacto: () => '',
    getDesglose: () => [],
  },
  l9_pasivo: {
    titulo: 'L9 · COSTO DE ESPERAR',
    narrativa:
      'Pasivo laboral que crece mes a mes con la antigüedad de la dotación.',
    getHero: lente => {
      const d = lente.detalle as { costoEsperaTotal?: number } | null
      return formatCLP(d?.costoEsperaTotal ?? 0)
    },
    getHeroUnit: () => 'en 12m',
    getImpacto: lente => {
      const d = lente.detalle as { costoEsperaTotal?: number } | null
      return `${formatCLP(d?.costoEsperaTotal ?? 0)} adicional en 12 meses`
    },
    getDesglose: lente => {
      const d = lente.detalle as
        | { totalElegibles?: number; totalHoy?: number }
        | null
      return [
        `${formatInt(d?.totalElegibles ?? 0)} personas con derecho a indemnización`,
        `Pasivo hoy: ${formatCLP(d?.totalHoy ?? 0)}`,
      ]
    },
  },
}

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface FamilyBriefingProps {
  familiaId: FamiliaId
  lentes: Record<LenteId, LenteAPI>
  onSelectLente: (id: LenteId) => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function FamilyBriefing({
  familiaId,
  lentes,
  onSelectLente,
}: FamilyBriefingProps) {
  const meta = FAMILIA_META[familiaId]
  const [hoveredLenteId, setHoveredLenteId] = useState<LenteId | null>(null)

  if (!meta) return null

  const lentesDeLaFamilia = meta.lentes
    .map(id => ({ id, data: lentes[id] }))
    .filter(x => !!x.data)

  const focosCount = lentesDeLaFamilia.filter(x => x.data.hayData).length
  const potencial = meta.getPotencial(lentes)
  const hoveredLente = hoveredLenteId ? lentes[hoveredLenteId] : null
  const hoveredCopy = hoveredLenteId ? LENTE_COPY[hoveredLenteId] : null

  const rootStyle = {
    ['--familia-accent' as string]: meta.accent,
  } as React.CSSProperties

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-8 md:gap-10"
      style={rootStyle}
    >
      {/* ══════════════════════════════════════════════════════════════════
          CENTRO — Portada glassmorphism con Tesla line
          ══════════════════════════════════════════════════════════════════ */}
      <section className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{
            background:
              'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
            boxShadow: '0 0 20px #22D3EE',
          }}
          aria-hidden
        />

        <div className="px-6 py-10 md:px-10 md:py-14">
          {/* ─── Header ─── */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="text-[10px] tracking-[0.3em] font-light mb-3 text-[color:var(--familia-accent)]">
              {meta.eyebrow}
            </div>
            <h2 className="text-3xl md:text-4xl font-extralight text-white tracking-tight leading-tight">
              {meta.titleFirst}
            </h2>
            <p className="text-2xl md:text-3xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">
              {meta.titleGradient}
            </p>
          </motion.div>

          {/* ─── Narrativa de briefing ─── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base md:text-lg font-light text-slate-300 leading-relaxed max-w-2xl mb-10"
          >
            El motor ha procesado la inercia del modelo operativo frente a las
            capacidades de IA disponibles. Se detectaron{' '}
            <span className="text-white font-normal">
              {focosCount === 1 ? '1 foco' : `${focosCount} focos`}
            </span>{' '}
            que requieren intervención.
          </motion.p>

          {/* ─── Nodos interactivos por lente ─── */}
          <div className="space-y-4">
            {lentesDeLaFamilia.map(({ id, data }, i) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
              >
                <LenteNode
                  id={id}
                  lente={data}
                  onSelect={onSelectLente}
                  onHover={setHoveredLenteId}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          ASIDE — Reactivo: default "Seleccione un análisis" / hover → preview
          ══════════════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col pt-10 pl-2 min-h-[260px]">
        <AnimatePresence mode="wait">
          {hoveredLente && hoveredCopy && hoveredLente.hayData ? (
            <motion.div
              key={`preview-${hoveredLenteId}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <div className="text-[10px] tracking-[0.28em] font-light text-slate-500 mb-5">
                IMPACTO PROYECTADO
              </div>
              <p className="text-[28px] xl:text-[36px] font-extralight text-white leading-[1.05] tabular-nums mb-5">
                {hoveredCopy.getImpacto(hoveredLente)}
              </p>
              <ul className="space-y-2 text-sm font-light text-slate-400 leading-relaxed">
                {hoveredCopy.getDesglose(hoveredLente).map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <span
                      className="text-[color:var(--familia-accent)] mt-[6px] flex-shrink-0"
                      aria-hidden
                    >
                      —
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex items-center justify-center text-center"
            >
              <p className="text-xs font-light text-slate-500 tracking-wide">
                Seleccione un análisis
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Potencial total de la familia — anclaje inferior discreto */}
        <div className="mt-auto pt-6 border-t border-slate-800/40">
          <div className="text-[9px] tracking-[0.28em] font-light text-slate-600 mb-1.5">
            POTENCIAL DE RECUPERACIÓN
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extralight text-slate-300 tabular-nums">
              {formatCLP(potencial)}
            </span>
            <span className="text-[10px] font-light text-slate-600">
              {meta.potencialLabel}
            </span>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// NODO INTERACTIVO DE LENTE
// ════════════════════════════════════════════════════════════════════════════

interface LenteNodeProps {
  id: LenteId
  lente: LenteAPI
  onSelect: (id: LenteId) => void
  onHover: (id: LenteId | null) => void
}

function LenteNode({ id, lente, onSelect, onHover }: LenteNodeProps) {
  const copy = LENTE_COPY[id]
  if (!copy) return null

  const hayData = lente.hayData

  // Estado sin data: opacity-40, sin interacción, sin cursor.
  if (!hayData) {
    return (
      <div
        className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 opacity-40"
        aria-disabled
      >
        <div className="text-xs tracking-widest uppercase text-slate-500 mb-2">
          {copy.titulo}
        </div>
        <p className="text-sm font-light text-slate-500">
          Sin señales en este análisis.
        </p>
      </div>
    )
  }

  const hero = copy.getHero(lente)
  const unit = copy.getHeroUnit(lente)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(id)
        }
      }}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(id)}
      onBlur={() => onHover(null)}
      className="group relative rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 transition-all duration-300 cursor-pointer hover:border-cyan-500/30 hover:bg-slate-900/60 focus:outline-none focus-visible:border-cyan-500/50"
    >
      <div className="flex items-start justify-between gap-6">
        {/* ── Izquierda: eyebrow + narrativa corta ── */}
        <div className="min-w-0 flex-1">
          <div className="text-xs tracking-widest uppercase text-[color:var(--familia-accent)] mb-3">
            {copy.titulo}
          </div>
          <p className="text-sm font-light text-slate-400 leading-relaxed max-w-md">
            {copy.narrativa}
          </p>
        </div>

        {/* ── Derecha: número protagonista + ícono ↗ en hover ── */}
        <div className="flex flex-col items-end text-right flex-shrink-0">
          <ArrowUpRight
            className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1"
            aria-hidden
          />
          <div className="text-2xl font-extralight text-white tabular-nums leading-none">
            {hero}
          </div>
          {unit && (
            <div className="text-[10px] font-light text-slate-500 mt-1.5 tracking-wide">
              {unit}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
