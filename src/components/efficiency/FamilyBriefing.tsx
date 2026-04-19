// ════════════════════════════════════════════════════════════════════════════
// FAMILY BRIEFING — Nivel 2 del Efficiency Hub (la "Sala de Situación")
// src/components/efficiency/FamilyBriefing.tsx
// ════════════════════════════════════════════════════════════════════════════
// Aparece entre el Shock Global (Nivel 1) y los lentes específicos (Nivel 3).
// El CEO lee de arriba a abajo como un briefing ejecutivo.
//
// PATRÓN MAESTRO: src/app/dashboard/executive-hub/components/GoalsCorrelation/
//   cascada/CompensationPortada.tsx
//   · Container glassmorphism (rounded-2xl border-slate-800/40 bg-slate-900/60 backdrop-blur-sm)
//   · Tesla line superior (gradient cyan→purple)
//   · Word-split de títulos (white + fhr-title-gradient)
//   · Número hero text-[72px] font-extralight
//   · PremiumButton (Secondary) para CTAs
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { SecondaryButton } from '@/components/ui/PremiumButton'
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
  /** Status eyebrow alineado con el rail (DIAGNÓSTICO / OPORTUNIDAD / PROTECCIÓN) */
  eyebrow: string
  /** Primera palabra del título — white font-extralight */
  titleFirst: string
  /** Segunda palabra — con fhr-title-gradient */
  titleGradient: string
  /** Color accent de familia (solo eyebrow, Tesla line, accents internos) */
  accent: string
  lentes: LenteId[]
  /** Label del potencial de recuperación (/mes vs en 12 meses) */
  potencialLabel: string
  getPotencial: (lentes: Record<LenteId, LenteAPI>) => number
}

const FAMILIA_META: Record<FamiliaId, FamiliaMeta> = {
  choque_tecnologico: {
    eyebrow: 'DIAGNÓSTICO',
    titleFirst: 'Choque',
    titleGradient: 'Tecnológico',
    accent: '#22D3EE',
    lentes: ['l1_inercia', 'l2_zombie'],
    potencialLabel: '/mes',
    getPotencial: lentes => {
      const d = lentes.l1_inercia?.detalle as { totalMonthly?: number } | null
      return d?.totalMonthly ?? 0
    },
  },
  grasa_organizacional: {
    eyebrow: 'OPORTUNIDAD',
    titleFirst: 'Grasa',
    titleGradient: 'Organizacional',
    accent: '#A78BFA',
    lentes: ['l4_fantasma', 'l5_brecha'],
    potencialLabel: '/mes',
    getPotencial: lentes => {
      const d = lentes.l5_brecha?.detalle as { total?: number } | null
      return d?.total ?? 0
    },
  },
  riesgo_financiero: {
    eyebrow: 'PROTECCIÓN',
    titleFirst: 'Riesgo',
    titleGradient: 'Financiero',
    accent: '#F59E0B',
    lentes: ['l7_fuga', 'l9_pasivo'],
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
// CONFIG — copy por lente (D1/D2/D3 aprobados)
// ════════════════════════════════════════════════════════════════════════════

interface LenteCopy {
  titulo: string
  queHay: string
  queEncontramos: (lente: LenteAPI) => string
  queDecides: string
  cta: string
}

const LENTE_COPY: Record<LenteId, LenteCopy> = {
  l1_inercia: {
    titulo: 'L1 · COSTO DE INERCIA',
    queHay: 'Análisis de cargos saturados por tareas automatizables.',
    queEncontramos: lente => {
      const d = lente.detalle as { totalMonthly?: number } | null
      return `${formatCLP(d?.totalMonthly ?? 0)}/mes en inversión atrapada.`
    },
    queDecides: 'Aislar la ineficiencia y liberar presupuesto.',
    cta: 'Iniciar análisis',
  },
  l2_zombie: {
    titulo: 'L2 · TALENTO ZOMBIE',
    queHay:
      'Perfiles que rinden hoy pero con baja capacidad de adaptación frente al cambio tecnológico.',
    queEncontramos: lente => {
      const d = lente.detalle as { count?: number } | null
      return `${formatInt(d?.count ?? 0)} personas en zona crítica.`
    },
    queDecides:
      'Proteger, reubicar o reconvertir antes de que el mercado lo defina.',
    cta: 'Ver perfiles en riesgo',
  },
  l3_adopcion: {
    titulo: 'L3 · RIESGO DE ADOPCIÓN',
    queHay:
      'Clima organizacional de las gerencias con mayor potencial de automatización.',
    queEncontramos: () => 'Guardarraíl aplicado antes del Hub.',
    queDecides: 'No invertir donde el clima no cooperará.',
    cta: 'Ver guardarraíl',
  },
  l4_fantasma: {
    titulo: 'L4 · CARGOS FANTASMA',
    queHay: 'Pares de cargos con títulos distintos y trabajo compartido.',
    queEncontramos: lente => {
      const d = lente.detalle as
        | { pairs?: unknown[]; avgOverlap?: number }
        | null
      const n = d?.pairs?.length ?? 0
      const pct = d?.avgOverlap ?? 0
      return `${formatInt(n)} pares con más del ${formatPct(pct)}% de tareas compartidas.`
    },
    queDecides: 'Consolidar funciones y eliminar duplicidades.',
    cta: 'Revisar duplicidades',
  },
  l5_brecha: {
    titulo: 'L5 · BRECHA DE PRODUCTIVIDAD',
    queHay:
      'Brecha entre el salario pagado y el rendimiento observado por persona.',
    queEncontramos: lente => {
      const d = lente.detalle as { total?: number } | null
      return `${formatCLP(d?.total ?? 0)}/mes en salario pagado sin rendimiento equivalente.`
    },
    queDecides: 'Nivelar el costo al rendimiento o decidir reestructura.',
    cta: 'Radiografía por persona',
  },
  l6_seniority: {
    titulo: 'L6 · COMPRESIÓN DE SENIORITY',
    queHay: 'Familias de cargo donde un Junior con IA iguala al Senior actual.',
    queEncontramos: () => 'Módulo en construcción.',
    queDecides: 'Reperfilar la línea de nómina senior.',
    cta: 'Próximamente',
  },
  l7_fuga: {
    titulo: 'L7+L8 · MAPA DE TALENTO',
    queHay:
      'Mapa de talento aumentado con IA frente a zona de riesgo financiero.',
    queEncontramos: lente => {
      const d = lente.detalle as { count?: number } | null
      return `${formatInt(d?.count ?? 0)} personas analizadas entre zona de protección y decisión.`
    },
    queDecides:
      'Priorizar inversión en quienes multiplicarán el output con IA.',
    cta: 'Abrir mapa',
  },
  l8_retencion: {
    titulo: 'L8 · PRIORIDAD DE RETENCIÓN',
    queHay: 'Fusionado con L7 en el Mapa de Talento.',
    queEncontramos: () => '',
    queDecides: '',
    cta: '',
  },
  l9_pasivo: {
    titulo: 'L9 · PASIVO LABORAL',
    queHay: 'Simulación del pasivo laboral en 12 meses según antigüedad.',
    queEncontramos: lente => {
      const d = lente.detalle as { costoEsperaTotal?: number } | null
      return `${formatCLP(d?.costoEsperaTotal ?? 0)} adicional si postergás 12 meses.`
    },
    queDecides:
      'Postergar con costo medido o actuar antes del aniversario financiero.',
    cta: 'Calcular costo de espera',
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
  if (!meta) return null

  const lentesDeLaFamilia = meta.lentes
    .map(id => ({ id, data: lentes[id] }))
    .filter(x => !!x.data)

  const focosCount = lentesDeLaFamilia.filter(x => x.data.hayData).length
  const potencial = meta.getPotencial(lentes)

  // Fix 5 — CSS var local para eliminar repetición de style={{color: accent}}
  const rootStyle = {
    ['--familia-accent' as string]: meta.accent,
  } as React.CSSProperties

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-8 md:gap-10"
      style={rootStyle}
    >
      {/* ══════════════════════════════════════════════════════════════════
          CENTRO — Portada glassmorphism con Tesla line (Fix 1)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        {/* Tesla line — patrón canónico SKILL.md quick reference
            (gradient cyan→purple + boxShadow glow para visibilidad).
            El overflow-hidden del <section> clipea los extremos redondeados
            sin ocultar la línea en el top del viewport del card. */}
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
          {/* ─── Header: eyebrow + word-split title (Fix 2) ─── */}
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

          {/* ─── Bloques de lentes ─── */}
          <div className="space-y-10">
            {lentesDeLaFamilia.map(({ id, data }, i) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
              >
                <LenteBlock
                  id={id}
                  lente={data}
                  onSelect={onSelectLente}
                  dividerTop={i > 0}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          ASIDE — Potencial de recuperación (Fix 4: hero 72px)
          ══════════════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col pt-10 pl-2">
        <div className="text-[10px] tracking-[0.28em] font-light text-slate-500 mb-5">
          POTENCIAL DE RECUPERACIÓN
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-[56px] xl:text-[72px] font-extralight text-white leading-[0.9] tabular-nums"
        >
          {formatCLP(potencial)}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="text-xs font-light text-slate-500 mt-3"
        >
          {meta.potencialLabel}
        </motion.p>
      </aside>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// BLOQUE DE LENTE — dentro de la portada, separador sutil entre bloques
// ════════════════════════════════════════════════════════════════════════════

interface LenteBlockProps {
  id: LenteId
  lente: LenteAPI
  onSelect: (id: LenteId) => void
  dividerTop: boolean
}

function LenteBlock({ id, lente, onSelect, dividerTop }: LenteBlockProps) {
  const copy = LENTE_COPY[id]
  if (!copy) return null
  const hayData = lente.hayData

  return (
    <div
      className={`${hayData ? '' : 'opacity-40'} ${
        dividerTop ? 'pt-10 border-t border-slate-800/40' : ''
      }`}
    >
      {/* Título del lente con accent via CSS var */}
      <div
        className={`text-[11px] uppercase tracking-[0.22em] font-medium mb-4 ${
          hayData ? 'text-[color:var(--familia-accent)]' : 'text-slate-500'
        }`}
      >
        {copy.titulo}
      </div>

      {/* 3 filas semánticas */}
      <dl className="space-y-3 text-sm font-light">
        <Row label="Qué hay" value={copy.queHay} />
        {hayData ? (
          <Row
            label="Qué encontramos"
            value={copy.queEncontramos(lente)}
            highlight
          />
        ) : (
          <Row
            label="Qué encontramos"
            value="Sin señales detectadas en este análisis."
          />
        )}
        <Row label="Qué decides" value={copy.queDecides} />
      </dl>

      {/* CTA — Fix 3: SecondaryButton de PremiumButton */}
      {hayData && copy.cta && (
        <div className="mt-6">
          <SecondaryButton
            icon={ArrowRight}
            iconPosition="right"
            size="sm"
            onClick={() => onSelect(id)}
          >
            {copy.cta}
          </SecondaryButton>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ROW — label izquierda tenue, valor derecha
// ════════════════════════════════════════════════════════════════════════════

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 items-baseline">
      <dt className="text-[10px] uppercase tracking-widest text-slate-500 font-light">
        {label}
      </dt>
      <dd
        className={
          highlight ? 'text-white font-normal' : 'text-slate-300'
        }
      >
        {value}
      </dd>
    </div>
  )
}
