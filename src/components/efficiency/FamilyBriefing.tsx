// ════════════════════════════════════════════════════════════════════════════
// FAMILY BRIEFING — Nivel 2 del Efficiency Hub (la "Sala de Situación")
// src/components/efficiency/FamilyBriefing.tsx
// ════════════════════════════════════════════════════════════════════════════
// Aparece entre el Shock Global (Nivel 1) y los lentes específicos (Nivel 3).
// El CEO lee de arriba a abajo como un briefing ejecutivo: eyebrow, narrativa,
// bloques de lentes de la familia, y a la derecha el "potencial de recuperación"
// en estado quiet.
//
// FILOSOFÍA:
//  · Sin cajas pesadas. Sin semáforos. Sin emojis.
//  · Espaciado generoso entre bloques.
//  · Un bloque por lente de la familia: 4 líneas + CTA.
//  · Lentes sin datos → opacity-40, label "Sin señales detectadas", sin CTA.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { ArrowRight } from 'lucide-react'
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
  eyebrow: string
  subtitulo: string
  accent: string
  /** Lentes que pertenecen a esta familia, en orden canónico */
  lentes: LenteId[]
  /** Label del "potencial de recuperación" (p.ej. "/mes" vs "en 12 meses") */
  potencialLabel: string
  /** Extractor del potencial desde el diccionario de lentes */
  getPotencial: (lentes: Record<LenteId, LenteAPI>) => number
}

const FAMILIA_META: Record<FamiliaId, FamiliaMeta> = {
  choque_tecnologico: {
    eyebrow: 'CHOQUE TECNOLÓGICO',
    subtitulo: 'Inercia frente a las capacidades de IA disponibles',
    accent: '#22D3EE',
    lentes: ['l1_inercia', 'l2_zombie'],
    potencialLabel: '/mes',
    getPotencial: lentes => {
      const d = lentes.l1_inercia?.detalle as { totalMonthly?: number } | null
      return d?.totalMonthly ?? 0
    },
  },
  grasa_organizacional: {
    eyebrow: 'GRASA ORGANIZACIONAL',
    subtitulo: 'Costo estructural sin rendimiento equivalente',
    accent: '#A78BFA',
    lentes: ['l4_fantasma', 'l5_brecha'],
    potencialLabel: '/mes',
    getPotencial: lentes => {
      const d = lentes.l5_brecha?.detalle as { total?: number } | null
      return d?.total ?? 0
    },
  },
  riesgo_financiero: {
    eyebrow: 'RIESGO FINANCIERO',
    subtitulo: 'Pasivos latentes y talento en ventana de decisión',
    accent: '#F59E0B',
    // l7_fuga representa también a l8_retencion (fusionados en el rail)
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
  /** Fn que arma el texto "Qué encontramos" usando datos y detalle del lente */
  queEncontramos: (lente: LenteAPI) => string
  queDecides: string
  cta: string
}

const LENTE_COPY: Record<LenteId, LenteCopy> = {
  l1_inercia: {
    titulo: 'L1 · COSTO DE INERCIA',
    queHay:
      'Análisis de cargos saturados por tareas automatizables.',
    queEncontramos: lente => {
      const d = lente.detalle as { totalMonthly?: number } | null
      const mes = d?.totalMonthly ?? 0
      return `${formatCLP(mes)}/mes en inversión atrapada.`
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
      const n = d?.count ?? 0
      return `${formatInt(n)} personas en zona crítica.`
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
    queHay:
      'Pares de cargos con títulos distintos y trabajo compartido.',
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
      const total = d?.total ?? 0
      return `${formatCLP(total)}/mes en salario pagado sin rendimiento equivalente.`
    },
    queDecides: 'Nivelar el costo al rendimiento o decidir reestructura.',
    cta: 'Radiografía por persona',
  },
  l6_seniority: {
    titulo: 'L6 · COMPRESIÓN DE SENIORITY',
    queHay:
      'Familias de cargo donde un Junior con IA iguala al Senior actual.',
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
      const n = d?.count ?? 0
      return `${formatInt(n)} personas analizadas entre zona de protección y decisión.`
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
      const costo = d?.costoEsperaTotal ?? 0
      return `${formatCLP(costo)} adicional si postergás 12 meses.`
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-10 md:gap-14">
      {/* ── CENTRO 70% ───────────────────────────────────────────────── */}
      <div className="min-w-0 space-y-10">
        {/* Eyebrow con color de familia */}
        <div
          className="text-xs tracking-[0.3em] font-light"
          style={{ color: meta.accent }}
        >
          {meta.eyebrow}
        </div>

        {/* Narrativa de briefing */}
        <p className="text-base md:text-lg font-light text-slate-300 leading-relaxed max-w-2xl">
          El motor ha procesado la inercia del modelo operativo frente a las
          capacidades de IA disponibles. Se detectaron{' '}
          <span className="text-white font-normal">
            {focosCount === 1
              ? '1 foco'
              : `${focosCount} focos`}
          </span>{' '}
          que requieren intervención.
        </p>

        {/* Bloques de lentes */}
        <div className="space-y-10 pt-2">
          {lentesDeLaFamilia.map(({ id, data }) => (
            <LenteBlock
              key={id}
              id={id}
              lente={data}
              accent={meta.accent}
              onSelect={onSelectLente}
            />
          ))}
        </div>
      </div>

      {/* ── DERECHA 30% — Potencial quiet ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col border-l border-slate-800/40 pl-8 pt-1">
        <div className="text-[10px] tracking-[0.28em] font-light text-slate-500 mb-6">
          POTENCIAL DE RECUPERACIÓN
        </div>
        <div
          className="text-3xl md:text-4xl font-extralight tabular-nums leading-none"
          style={{ color: '#E2E8F0' }}
        >
          {formatCLP(potencial)}
        </div>
        <div className="text-xs font-light text-slate-500 mt-3">
          {meta.potencialLabel}
        </div>
      </aside>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// BLOQUE DE LENTE
// ════════════════════════════════════════════════════════════════════════════

interface LenteBlockProps {
  id: LenteId
  lente: LenteAPI
  accent: string
  onSelect: (id: LenteId) => void
}

function LenteBlock({ id, lente, accent, onSelect }: LenteBlockProps) {
  const copy = LENTE_COPY[id]
  if (!copy) return null

  const hayData = lente.hayData

  return (
    <div className={hayData ? '' : 'opacity-40'}>
      {/* Título del lente */}
      <div
        className="text-[11px] uppercase tracking-[0.22em] font-medium mb-4"
        style={{ color: hayData ? accent : '#64748B' }}
      >
        {copy.titulo}
      </div>

      {/* 3 líneas semánticas — label tenue + texto blanco */}
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

      {/* CTA — sólo si hay data */}
      {hayData && copy.cta && (
        <button
          onClick={() => onSelect(id)}
          className="mt-6 inline-flex items-center gap-2 text-sm font-light px-4 py-2 rounded-md border transition-all group"
          style={{
            borderColor: `${accent}40`,
            color: accent,
            background: `linear-gradient(135deg, ${accent}08, ${accent}14)`,
          }}
        >
          <span>{copy.cta}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ROW auxiliar — label izquierda tenue, valor derecha
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
          highlight
            ? 'text-white font-normal'
            : 'text-slate-300'
        }
      >
        {value}
      </dd>
    </div>
  )
}
