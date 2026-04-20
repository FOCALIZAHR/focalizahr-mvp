// ════════════════════════════════════════════════════════════════════════════
// LENTE CARD — Shell Patrón G reutilizable (wrapper)
// src/components/efficiency/lentes/LenteCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Wrapper común para L1..L9. Provee:
//  · Tesla line color de familia
//  · Header (breadcrumb familia + título + estado)
//  · Container con scroll interno
//  · Sub-componentes de sección (Portada / Evidencia / Interacción)
//
// Uso:
//   <LenteCard lente={lente} estado="activo">
//     <LenteCard.Portada metrica="$4.2M" label="atrapados">
//       {narrativa}
//     </LenteCard.Portada>
//     <LenteCard.Evidencia>
//       { tabla / lista / etc. }
//     </LenteCard.Evidencia>
//     <LenteCard.Interaccion>
//       { slider / toggle / botones }
//     </LenteCard.Interaccion>
//   </LenteCard>
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { type ReactNode } from 'react'
import { Snowflake } from 'lucide-react'
import type { LenteAPI } from '@/hooks/useEfficiencyWorkspace'
import type { FamiliaId } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// COLORES POR FAMILIA
// ════════════════════════════════════════════════════════════════════════════

const FAMILIA_COLORS: Record<FamiliaId, { accent: string; glow: string; label: string }> = {
  capital_en_riesgo: {
    accent: '#22D3EE',
    glow: 'rgba(34, 211, 238, 0.25)',
    label: 'Capital en riesgo',
  },
  ruta_ejecucion: {
    accent: '#A78BFA',
    glow: 'rgba(167, 139, 250, 0.25)',
    label: 'Ruta de ejecución',
  },
  costo_esperar: {
    accent: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.25)',
    label: 'Costo de esperar',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT — LENTE CARD SHELL
// ════════════════════════════════════════════════════════════════════════════

export type LenteEstado = 'activo' | 'vacio' | 'congelado'

interface LenteCardProps {
  lente: Pick<LenteAPI, 'id' | 'familia' | 'titulo' | 'subtitulo' | 'hayData'>
  estado?: LenteEstado
  /** Override titulo (útil para lentes fusionados ej. L7+L8) */
  tituloOverride?: string
  children: ReactNode
}

function LenteCardRoot({
  lente,
  estado,
  tituloOverride,
  children,
}: LenteCardProps) {
  const color = FAMILIA_COLORS[lente.familia]
  const effectiveEstado: LenteEstado = estado ?? (lente.hayData ? 'activo' : 'vacio')

  // Sin contenedor envolvente con borders/background. El contenido vive
  // directamente sobre el fondo oscuro del Hub. Espacio negativo y scroll
  // lo maneja el panel izquierdo del EfficiencyHub.
  return (
    <div className="relative w-full">
      {/* Header — eyebrow familia + título del lente */}
      <header className="mb-6">
        <p
          className="text-[10px] uppercase tracking-[0.18em] font-medium"
          style={{ color: color.accent }}
        >
          {color.label}
        </p>
        <div className="flex items-start justify-between gap-4 mt-1">
          <div>
            <h2 className="text-2xl md:text-3xl font-extralight text-white leading-tight">
              {tituloOverride ?? lente.titulo}
            </h2>
            <p className="text-sm text-slate-400 mt-1 font-light">
              {lente.subtitulo}
            </p>
          </div>

          {/* Badge estado */}
          {effectiveEstado === 'congelado' && (
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border border-slate-700 bg-slate-800/40 text-slate-400">
              <Snowflake className="w-3 h-3" />
              Congelado
            </span>
          )}
        </div>
      </header>

      {/* Contenido — sin contenedor, flow libre */}
      {effectiveEstado === 'vacio' ? (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-400 font-light">
            Sin señales detectadas en este lente por ahora.
          </p>
          <p className="text-xs text-slate-500 font-light mt-2 max-w-sm mx-auto">
            Cuando los motores detecten el patrón, el lente se activa
            automáticamente.
          </p>
        </div>
      ) : effectiveEstado === 'congelado' ? (
        <div className="py-16 text-center">
          <Snowflake className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-light">
            Lente temporalmente congelado.
          </p>
          <p className="text-xs text-slate-500 font-light mt-2 max-w-sm mx-auto">
            Falta cobertura suficiente de datos para activarlo con confianza.
          </p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTE: PORTADA (Nivel 1 — número protagonista + narrativa una línea)
// ════════════════════════════════════════════════════════════════════════════

interface PortadaProps {
  metricaProtagonista: string
  metricaLabel: string
  /** Narrativa corta tipo una-línea; el resto va en Evidencia */
  children: ReactNode
  /** Badge inline opcional (ej. "Pasivo Tóxico" para L2) */
  badge?: ReactNode
}

function Portada({ metricaProtagonista, metricaLabel, children, badge }: PortadaProps) {
  return (
    <section className="mb-8">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p
            className="font-extralight text-white leading-none"
            style={{
              fontSize: 'clamp(48px, 6vw, 72px)',
              letterSpacing: '-0.02em',
            }}
          >
            {metricaProtagonista}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-2">
            {metricaLabel}
          </p>
        </div>
        {badge && <div className="flex-shrink-0">{badge}</div>}
      </div>
      <div className="text-sm text-slate-300 font-light leading-relaxed mt-5 max-w-3xl">
        {children}
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTE: EVIDENCIA (Nivel 2 — detalle completo + contexto del riesgo)
// ════════════════════════════════════════════════════════════════════════════

interface EvidenciaProps {
  /** Etiqueta pequeña que guía la lectura de la sección */
  titulo?: string
  children: ReactNode
}

function Evidencia({ titulo = 'La evidencia', children }: EvidenciaProps) {
  return (
    <section className="mb-8">
      <SectionSeparator />
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-4">
        — {titulo}
      </p>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTE: INTERACCIÓN (Nivel 3 — la captura de la decisión)
// ════════════════════════════════════════════════════════════════════════════

interface InteraccionProps {
  titulo?: string
  children: ReactNode
}

function Interaccion({ titulo = 'La decisión', children }: InteraccionProps) {
  return (
    <section>
      <SectionSeparator />
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-4">
        — {titulo}
      </p>
      <div>{children}</div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SEPARADOR DE SECCIÓN (divider sutil entre niveles del Patrón G)
// ════════════════════════════════════════════════════════════════════════════

function SectionSeparator() {
  return (
    <div
      className="h-px mb-4"
      style={{
        background:
          'linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.15), transparent)',
      }}
      aria-hidden
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORT COMPUESTO
// ════════════════════════════════════════════════════════════════════════════

export const LenteCard = Object.assign(LenteCardRoot, {
  Portada,
  Evidencia,
  Interaccion,
})
