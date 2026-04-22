// ════════════════════════════════════════════════════════════════════════════
// FAMILY BRIEFING — Nivel 2 del Efficiency Hub (la "Sala de Situación")
// src/components/efficiency/FamilyBriefing.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón: EXPEDIENTE EJECUTIVO (híbrido A+C).
//
//   1. Tesis letal arriba (McKinsey — consecuencia, no instrucción).
//   2. Fichas forenses numeradas por lente, con triada explícita:
//        QUÉ HAY · QUÉ ENCONTRÓ · QUÉ DECIDES
//      Sin Tesla Line, sin hover de catálogo. Border slate-800/40, padding
//      generoso. Número grande como ancla visual a la izquierda.
//   3. Conectores narrativos en prosa entre cada par de fichas.
//
// Sin cierre de priorización — el CTA "Operar →" por ficha sustituye al
// llamado global a la acción.
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

export interface FamiliaMeta {
  titleFirst: string
  titleGradient: string
  accent: string
  lentes: LenteId[]
  /** Tesis letal tipo McKinsey — recibe los lentes para inyectar dato duro.
      Renderizada sin highlights (text-slate-300 uniforme). Las 3 partes
      se concatenan como prosa pura. */
  getTesis: (lentes: Record<LenteId, LenteAPI>) => {
    frasePreKeyword: string
    keyword: string
    frasePostKeyword: string
  }
  /** Conectores narrativos entre pares consecutivos de lentes (orden alineado con `lentes`) */
  conectores: string[]
}

export const FAMILIA_META: Record<FamiliaId, FamiliaMeta> = {
  capital_en_riesgo: {
    titleFirst: 'Capital',
    titleGradient: 'en riesgo',
    accent: '#22D3EE',
    lentes: ['l1_inercia', 'l4_fantasma'],
    getTesis: lentes => {
      const l1 = lentes.l1_inercia?.detalle as { totalMonthly?: number } | null
      const cifra = formatCLP(l1?.totalMonthly ?? 0)
      return {
        frasePreKeyword: `${cifra} al mes del payroll `,
        keyword: 'financian trabajo que la IA ya resuelve',
        frasePostKeyword: ' sin supervisión humana.',
      }
    },
    conectores: [
      'Pero la inercia no vive solo en cargos saturados — también en duplicaciones de rol que la organización paga dos veces.',
    ],
  },

  ruta_ejecucion: {
    titleFirst: 'Ruta de',
    titleGradient: 'ejecución',
    accent: '#A78BFA',
    lentes: ['l2_zombie', 'l5_brecha', 'l7_fuga'],
    getTesis: lentes => {
      const l2 = lentes.l2_zombie?.detalle as { count?: number } | null
      const n = formatInt(l2?.count ?? 0)
      return {
        frasePreKeyword: `${n} personas rinden hoy y `,
        keyword: 'no podrán adaptarse cuando el negocio cambie',
        frasePostKeyword: ' sin ellas.',
      }
    },
    conectores: [
      'El problema no es solo de adaptabilidad futura. Hoy ya hay rendimiento pagado que no está llegando.',
      'Y en paralelo, quienes sí se volverán más productivos con IA son justamente los más expuestos a salir.',
    ],
  },

  costo_esperar: {
    titleFirst: 'Costo de',
    titleGradient: 'esperar',
    accent: '#F59E0B',
    lentes: ['l3_adopcion', 'l9_pasivo'],
    getTesis: lentes => {
      const l9 = lentes.l9_pasivo?.detalle as
        | { costoEsperaTotal?: number }
        | null
      const cifra = formatCLP(l9?.costoEsperaTotal ?? 0)
      return {
        frasePreKeyword: 'Cada mes de postergación suma a la factura: ',
        keyword: `${cifra} adicionales en 12 meses`,
        frasePostKeyword: ' si la decisión sigue esperando.',
      }
    },
    conectores: [
      'El clima bloquea la intervención — y mientras se espera a que mejore, el pasivo laboral crece.',
    ],
  },
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIG — triada forense por lente (Qué hay · Qué encontró · Qué decides)
// ════════════════════════════════════════════════════════════════════════════

interface LenteCopy {
  titulo: string
  /** Descripción en 1 línea — qué análisis es este */
  queHay: string
  /** Dato real del backend — lo que el motor encontró */
  getQueEncontro: (lente: LenteAPI) => string
  /** Acción posible — qué decide el CEO sobre esta evidencia */
  queDecides: string
}

const LENTE_COPY: Record<LenteId, LenteCopy> = {
  l1_inercia: {
    titulo: 'Costo de no decidir',
    queHay: 'Cargos saturados por tareas que la IA ya puede resolver.',
    getQueEncontro: lente => {
      const d = lente.detalle as
        | { totalMonthly?: number; totalFTEs?: number }
        | null
      return `${formatCLP(d?.totalMonthly ?? 0)}/mes atrapados · ${formatInt(d?.totalFTEs ?? 0)} FTEs equivalentes`
    },
    queDecides: 'Reasignar la capacidad liberada o consolidar cargos.',
  },
  l2_zombie: {
    titulo: 'Talento estancado',
    queHay:
      'Perfiles que rinden hoy pero no podrán adaptarse al cambio tecnológico.',
    getQueEncontro: lente => {
      const d = lente.detalle as
        | { count?: number; avgExposure?: number }
        | null
      const n = d?.count ?? 0
      return `${formatInt(n)} ${n === 1 ? 'persona' : 'personas'} en zona crítica · ${formatPct((d?.avgExposure ?? 0) * 100)}% de exposición IA promedio`
    },
    queDecides: 'Reentrenar, reubicar o planificar una salida con dignidad.',
  },
  l3_adopcion: {
    titulo: 'Riesgo de adopción',
    queHay:
      'Gerencias donde el clima no acompañará la inversión. La resistencia encarece cualquier cambio.',
    getQueEncontro: lente => {
      const d = lente.detalle as { ranking?: unknown[] } | null
      const n = d?.ranking?.length ?? 0
      return `${formatInt(n)} ${n === 1 ? 'gerencia' : 'gerencias'} bajo el umbral de clima 2.5 / 5`
    },
    queDecides: 'Intervenir clima antes de desplegar, o aceptar menor retorno.',
  },
  l4_fantasma: {
    titulo: 'Arquitectura de Liderazgo',
    queHay:
      'Jefaturas con span fuera del rango óptimo de su arquetipo McKinsey.',
    getQueEncontro: lente => {
      const d = lente.detalle as
        | {
            org?: {
              managersEnRojo?: number
              managersEnAmarillo?: number
              totalManagers?: number
              costoCapasSuboptimas?: number
            }
          }
        | null
      const enRojo = d?.org?.managersEnRojo ?? 0
      const enAmarillo = d?.org?.managersEnAmarillo ?? 0
      const totalManagers = d?.org?.totalManagers ?? 0
      const fuera = enRojo + enAmarillo
      const costo = d?.org?.costoCapasSuboptimas ?? 0
      return `${formatInt(fuera)} de ${formatInt(totalManagers)} ${totalManagers === 1 ? 'jefatura' : 'jefaturas'} fuera de rango · ${formatCLP(costo)}/mes en capas subóptimas`
    },
    queDecides:
      'Consolidar capas sin valor, ampliar equipos sub-spanning o redistribuir equipos sobredimensionados.',
  },
  l5_brecha: {
    titulo: 'Brecha de productividad',
    queHay:
      'Salario pagado sin rendimiento equivalente. Se acumula cada mes.',
    getQueEncontro: lente => {
      const d = lente.detalle as
        | { total?: number; affectedCount?: number }
        | null
      return `${formatCLP(d?.total ?? 0)}/mes sobre el estándar · ${formatInt(d?.affectedCount ?? 0)} personas bajo el 40% de dominio`
    },
    queDecides: 'Cerrar la brecha con coaching o gestionar una salida.',
  },
  l6_seniority: {
    titulo: 'Compresión de seniority',
    queHay: 'Módulo en construcción.',
    getQueEncontro: () => 'Pendiente',
    queDecides: 'Reperfilar la línea senior con IA cuando esté disponible.',
  },
  l7_fuga: {
    titulo: 'Talento en riesgo',
    queHay:
      'Mapa de talento aumentado con IA cruzado con zona de riesgo financiero.',
    getQueEncontro: lente => {
      const d = lente.detalle as
        | { count?: number; totalReplacementCost?: number }
        | null
      const n = d?.count ?? 0
      return `${formatInt(n)} ${n === 1 ? 'persona' : 'personas'} a priorizar · ${formatCLP(d?.totalReplacementCost ?? 0)} costo de reemplazo estimado`
    },
    queDecides: 'Retener con paquetes específicos o soltar con tiempo.',
  },
  l8_retencion: {
    titulo: 'Prioridad de retención',
    queHay: 'Fusionado con L7 en el Mapa de Talento.',
    getQueEncontro: () => '',
    queDecides: '',
  },
  l9_pasivo: {
    titulo: 'Costo de esperar',
    queHay:
      'Pasivo laboral que crece mes a mes con la antigüedad de la dotación.',
    getQueEncontro: lente => {
      const d = lente.detalle as
        | { costoEsperaTotal?: number; totalElegibles?: number }
        | null
      return `${formatCLP(d?.costoEsperaTotal ?? 0)} adicionales en 12 meses · ${formatInt(d?.totalElegibles ?? 0)} personas con derecho a indemnización`
    },
    queDecides: 'Actuar ahora o aceptar el costo incremental cada mes.',
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

  const tesis = meta.getTesis(lentes)
  const lentesDeLaFamilia = meta.lentes.map(id => ({ id, data: lentes[id] }))

  const rootStyle = {
    ['--familia-accent' as string]: meta.accent,
  } as React.CSSProperties

  return (
    <div className="max-w-4xl mx-auto" style={rootStyle}>
      {/* ─── Header (sin eyebrow — el wrapper del accordion lo aporta) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <h2 className="text-3xl md:text-4xl font-extralight text-white tracking-tight leading-tight">
          {meta.titleFirst}{' '}
          <span className="fhr-title-gradient">{meta.titleGradient}</span>
        </h2>
      </motion.div>

      {/* ─── Tesis letal — text-slate-300 uniforme, sin highlights ─── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-lg md:text-xl font-light text-slate-300 leading-relaxed max-w-3xl mb-14"
      >
        {tesis.frasePreKeyword}
        {tesis.keyword}
        {tesis.frasePostKeyword}
      </motion.p>

      {/* ─── Fichas forenses + conectores ─── */}
      <div>
        {lentesDeLaFamilia.map(({ id, data }, idx) => (
          <div key={id}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + idx * 0.12 }}
            >
              <FichaForense
                numero={String(idx + 1).padStart(2, '0')}
                id={id}
                lente={data}
                accent={meta.accent}
                onSelect={onSelectLente}
              />
            </motion.div>

            {/* Conector narrativo entre cada par */}
            {idx < lentesDeLaFamilia.length - 1 && meta.conectores[idx] && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.45 + idx * 0.12 }}
                className="pl-0 md:pl-[88px] py-6 md:py-8"
              >
                <p className="text-sm md:text-[15px] font-light italic text-slate-500 leading-relaxed max-w-2xl">
                  {meta.conectores[idx]}
                </p>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// FICHA FORENSE — triada Qué hay / Qué encontró / Qué decides
// ════════════════════════════════════════════════════════════════════════════

interface FichaForenseProps {
  numero: string
  id: LenteId
  lente: LenteAPI | undefined
  accent: string
  onSelect: (id: LenteId) => void
}

function FichaForense({
  numero,
  id,
  lente,
  accent,
  onSelect,
}: FichaForenseProps) {
  const copy = LENTE_COPY[id]
  if (!copy) return null

  const hayData = lente?.hayData ?? false

  // Sin data: ficha discreta, sin acción.
  if (!lente || !hayData) {
    return (
      <div className="rounded-2xl border border-slate-800/40 px-6 py-8 md:px-10 md:py-10 opacity-50">
        <div className="grid grid-cols-[auto_1fr] gap-6 md:gap-10">
          <span
            className="text-5xl md:text-6xl font-extralight tabular-nums leading-none text-slate-700"
            aria-hidden
          >
            {numero}
          </span>
          <div>
            <h3 className="text-base font-light text-slate-400 mb-2">
              {copy.titulo}
            </h3>
            <p className="text-sm font-light text-slate-500">
              Sin señales en este análisis.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const queEncontro = copy.getQueEncontro(lente)

  return (
    <div className="rounded-2xl border border-slate-800/40 bg-slate-900/30 px-6 py-8 md:px-10 md:py-10">
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-10">
        {/* Número ancla — marca de agua grande */}
        <span
          className="text-5xl md:text-7xl font-extralight tabular-nums leading-none"
          style={{ color: accent, opacity: 0.35 }}
          aria-hidden
        >
          {numero}
        </span>

        {/* Contenido forense */}
        <div>
          {/* Título del lente */}
          <h3 className="text-lg md:text-xl font-light text-white mb-8 leading-tight">
            {copy.titulo}
          </h3>

          {/* Triada apilada */}
          <div className="space-y-6">
            <div>
              <div className="text-[10px] tracking-[0.22em] uppercase text-slate-500 font-medium mb-2">
                Qué hay
              </div>
              <p className="text-sm md:text-[15px] font-light text-slate-300 leading-relaxed max-w-2xl">
                {copy.queHay}
              </p>
            </div>

            <div>
              <div className="text-[10px] tracking-[0.22em] uppercase text-slate-500 font-medium mb-2">
                Qué encontró
              </div>
              <p className="text-base md:text-lg font-light text-white leading-relaxed tabular-nums max-w-2xl">
                {queEncontro}
              </p>
            </div>

            <div>
              <div className="text-[10px] tracking-[0.22em] uppercase text-slate-500 font-medium mb-2">
                Qué decides
              </div>
              <p className="text-sm md:text-[15px] font-light text-slate-300 leading-relaxed max-w-2xl">
                {copy.queDecides}
              </p>
            </div>
          </div>

          {/* CTA alineado a la derecha */}
          <div className="flex justify-end mt-8">
            <SecondaryButton
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => onSelect(id)}
              size="sm"
            >
              Operar
            </SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  )
}
