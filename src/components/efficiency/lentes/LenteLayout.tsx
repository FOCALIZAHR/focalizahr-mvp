// ════════════════════════════════════════════════════════════════════════════
// LENTE LAYOUT — Molde maestro de 3 actos reutilizable (L1..L9)
// src/components/efficiency/lentes/LenteLayout.tsx
// ════════════════════════════════════════════════════════════════════════════
// Orquesta el flujo narrativo de cualquier lente del Efficiency Hub:
//
//   ACTO 1 (silencio)    → hero centrado + CTA "Ver origen ↓"
//   ACTO 2 (expediente)  → hero vuela top-right + hallazgo (70%) + expediente
//                          lateral opcional (30%) + narrativa puente + CTA
//   ACTO 3 (quirófano)   → hero top + eyebrow custom + slot simulador +
//                          narrativa dinámica reactiva + totalizador opcional
//                          + CTA "Siguiente: X →" condicional a interacción
//
// RÍGIDO (lo controla el layout):
//   · Estado del acto, transiciones AnimatePresence, layoutId del hero
//   · Contenedor canónico + Tesla line color familia
//   · Estructura de headers de los actos 2 y 3
//   · Back buttons internos entre actos
//
// FLEXIBLE (lo provee el lente consumidor):
//   · renderHallazgo / renderExpediente / renderQuirofano (render props)
//   · narrativaPuente (string) / narrativaDinamica (string reactiva)
//   · totalizador (data estructurada, opcional)
//   · hasInteraction (boolean) controla visibilidad del CTA final
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

/** layoutId único que conecta el número hero entre los 3 actos. */
const HERO_LAYOUT_ID = 'lente-hero-value'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type LenteActo = 'silencio' | 'expediente' | 'quirofano'
type Acto = LenteActo

type TotalizadorTint = 'default' | 'accent' | 'emerald' | 'warning'

export interface TotalizadorMetrica {
  label: string
  value: string
  tint?: TotalizadorTint
}

export interface LenteLayoutProps {
  // ─── Identidad visual ───
  /** Color accent de la familia (Tesla line + tints 'accent' del totalizador). */
  familiaAccent: string

  // ─── ACTO 1: SILENCIO ───
  /** Número o etiqueta protagonista que vuela entre los 3 actos vía layoutId. */
  heroValue: string
  /** Unidad o contexto del hero (ej: "atrapados / mes · 20.7 FTEs"). */
  heroUnit?: string
  /** Texto del CTA que lleva del Acto 1 al Acto 2. Default: "Ver origen ↓". */
  ctaVerOrigenLabel?: string

  // ─── ACTO 2: EXPEDIENTE ───
  /** Slot principal (columna ~70%): mapa, scatter, ficha rica, lo que sea. */
  renderHallazgo: () => ReactNode
  /** Slot lateral opcional (columna ~30%): stats del expediente. */
  renderExpediente?: () => ReactNode
  /** Narrativa puente que explica POR QUÉ simular, antes del CTA. */
  narrativaPuente: string
  /** Texto del CTA que lleva del Acto 2 al Acto 3. Default: "Simular captura →". */
  ctaSimularLabel?: string

  // ─── ACTO 3: QUIRÓFANO ───
  /** Slot del simulador: sliders, toggles, escenarios, drag-drop, etc. */
  renderQuirofano: () => ReactNode
  /** Eyebrow del acto (ej: "SIMULACIÓN DE CAPTURA", "MODELADO DE ESCENARIOS",
   *  "PROYECCIÓN TEMPORAL"). Default: "SIMULACIÓN". */
  ctaQuirofanoEyebrow?: string
  /** Copy reactivo del estado del simulador. Cambia con fade al cambiar. */
  narrativaDinamica?: string
  /** Totalizador en vivo opcional. Si no viene, no renderiza. */
  totalizador?: {
    metricas: TotalizadorMetrica[]
  }

  // ─── Estado de interacción ───
  /** Si false, el CTA "Siguiente" no se renderiza. El lente decide qué
   *  cuenta como interacción (slider > 0, toggle activado, etc). */
  hasInteraction: boolean

  // ─── Navegación externa (al siguiente lente de la familia) ───
  onNextLente?: () => void
  /** Para el label del CTA: "Siguiente: {proximoLenteTitulo} →". */
  proximoLenteTitulo?: string

  // ─── Hook de acto al consumidor (opcional) ───
  /** Notifica al consumidor cuando cambia el acto. Útil para que el
   *  EfficiencyHub ajuste elementos fuera del layout (ej: atenuar el
   *  PanelAcumuladores durante el Acto Silencio). */
  onActChange?: (act: LenteActo) => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export function LenteLayout(props: LenteLayoutProps) {
  const [act, setAct] = useState<Acto>('silencio')

  // Notificar al consumidor cuando cambia el acto — ajustes externos
  // (ej: PanelAcumuladores atenuado en el Acto Silencio).
  useEffect(() => {
    props.onActChange?.(act)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [act])

  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Tesla line color familia (firma canónica del proyecto) */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-10"
        style={{
          background: `linear-gradient(90deg, transparent, ${props.familiaAccent}, transparent)`,
          boxShadow: `0 0 20px ${props.familiaAccent}`,
        }}
        aria-hidden
      />

      <div className="px-6 py-10 md:px-10 md:py-14">
        <AnimatePresence mode="wait">
          {act === 'silencio' && (
            <ActoSilencio
              key="silencio"
              heroValue={props.heroValue}
              heroUnit={props.heroUnit}
              ctaLabel={props.ctaVerOrigenLabel ?? 'Ver origen'}
              onVerOrigen={() => setAct('expediente')}
            />
          )}

          {act === 'expediente' && (
            <ActoExpediente
              key="expediente"
              heroValue={props.heroValue}
              heroUnit={props.heroUnit}
              renderHallazgo={props.renderHallazgo}
              renderExpediente={props.renderExpediente}
              narrativaPuente={props.narrativaPuente}
              ctaLabel={props.ctaSimularLabel ?? 'Simular captura'}
              onSimular={() => setAct('quirofano')}
              onBack={() => setAct('silencio')}
            />
          )}

          {act === 'quirofano' && (
            <ActoQuirofano
              key="quirofano"
              heroValue={props.heroValue}
              heroUnit={props.heroUnit}
              eyebrow={props.ctaQuirofanoEyebrow ?? 'SIMULACIÓN'}
              accent={props.familiaAccent}
              renderQuirofano={props.renderQuirofano}
              narrativaDinamica={props.narrativaDinamica}
              totalizador={props.totalizador}
              hasInteraction={props.hasInteraction}
              onNextLente={props.onNextLente}
              proximoLenteTitulo={props.proximoLenteTitulo}
              onBack={() => setAct('expediente')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ACTO 1: SILENCIO
// ════════════════════════════════════════════════════════════════════════════

interface ActoSilencioProps {
  heroValue: string
  heroUnit?: string
  ctaLabel: string
  onVerOrigen: () => void
}

function ActoSilencio({ heroValue, heroUnit, ctaLabel, onVerOrigen }: ActoSilencioProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <motion.p
        layoutId={HERO_LAYOUT_ID}
        className="text-[72px] font-extralight text-white tabular-nums leading-none"
      >
        {heroValue}
      </motion.p>
      {heroUnit && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-[10px] uppercase tracking-widest text-slate-500 mt-4 max-w-md"
        >
          {heroUnit}
        </motion.p>
      )}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-16"
      >
        <GhostButton icon={ArrowDown} iconPosition="right" onClick={onVerOrigen}>
          {ctaLabel}
        </GhostButton>
      </motion.div>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ACTO 2: EXPEDIENTE
// ════════════════════════════════════════════════════════════════════════════

interface ActoExpedienteProps {
  heroValue: string
  heroUnit?: string
  renderHallazgo: () => ReactNode
  renderExpediente?: () => ReactNode
  narrativaPuente: string
  ctaLabel: string
  onSimular: () => void
  onBack: () => void
}

function ActoExpediente({
  heroValue,
  heroUnit,
  renderHallazgo,
  renderExpediente,
  narrativaPuente,
  ctaLabel,
  onSimular,
  onBack,
}: ActoExpedienteProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header: back + hero volado top-right */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver
        </button>

        <div className="text-right">
          <motion.p
            layoutId={HERO_LAYOUT_ID}
            className="text-[40px] md:text-[48px] font-extralight text-white tabular-nums leading-none"
          >
            {heroValue}
          </motion.p>
          {heroUnit && (
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-2">
              {heroUnit}
            </p>
          )}
        </div>
      </div>

      {/* Grid hallazgo (70%) + expediente lateral (30%) */}
      <div
        className={
          renderExpediente
            ? 'grid gap-8 grid-cols-1 md:grid-cols-[1fr_280px]'
            : 'grid gap-8 grid-cols-1'
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="min-w-0"
        >
          {renderHallazgo()}
        </motion.div>

        {renderExpediente && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="min-w-0"
          >
            {renderExpediente()}
          </motion.div>
        )}
      </div>

      {/* Narrativa puente */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="text-sm md:text-base text-slate-400 font-light leading-relaxed max-w-2xl mt-10"
      >
        {narrativaPuente}
      </motion.p>

      {/* CTA Simular */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="flex justify-center mt-10"
      >
        <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onSimular}>
          {ctaLabel}
        </PrimaryButton>
      </motion.div>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ACTO 3: QUIRÓFANO
// ════════════════════════════════════════════════════════════════════════════

interface ActoQuirofanoProps {
  heroValue: string
  heroUnit?: string
  eyebrow: string
  accent: string
  renderQuirofano: () => ReactNode
  narrativaDinamica?: string
  totalizador?: { metricas: TotalizadorMetrica[] }
  hasInteraction: boolean
  onNextLente?: () => void
  proximoLenteTitulo?: string
  onBack: () => void
}

function ActoQuirofano({
  heroValue,
  heroUnit,
  eyebrow,
  accent,
  renderQuirofano,
  narrativaDinamica,
  totalizador,
  hasInteraction,
  onNextLente,
  proximoLenteTitulo,
  onBack,
}: ActoQuirofanoProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header: back + hero top-right (misma posición que Acto 2) */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver
        </button>

        <div className="text-right">
          <motion.p
            layoutId={HERO_LAYOUT_ID}
            className="text-[40px] md:text-[48px] font-extralight text-white tabular-nums leading-none"
          >
            {heroValue}
          </motion.p>
          {heroUnit && (
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-2">
              {heroUnit}
            </p>
          )}
        </div>
      </div>

      {/* Eyebrow del quirófano (custom por lente) */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-[10px] uppercase tracking-[0.22em] font-medium mb-6"
        style={{ color: accent }}
      >
        {eyebrow}
      </motion.p>

      {/* Slot del simulador */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {renderQuirofano()}
      </motion.div>

      {/* Narrativa dinámica reactiva */}
      {narrativaDinamica && (
        <div className="mt-8 border-t border-slate-800/40 pt-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={narrativaDinamica}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-base font-light text-slate-300 italic leading-relaxed max-w-2xl"
            >
              {narrativaDinamica}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {/* Totalizador en vivo (opcional) */}
      {totalizador && totalizador.metricas.length > 0 && (
        <Totalizador metricas={totalizador.metricas} accent={accent} />
      )}

      {/* CTA Siguiente — solo visible si hay interacción Y hay callback */}
      <AnimatePresence>
        {hasInteraction && onNextLente && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center mt-10"
          >
            <PrimaryButton
              icon={ArrowRight}
              iconPosition="right"
              onClick={onNextLente}
            >
              {proximoLenteTitulo
                ? `Siguiente: ${proximoLenteTitulo}`
                : 'Siguiente'}
            </PrimaryButton>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TOTALIZADOR — subcomponente privado (visual unificado entre lentes)
// ════════════════════════════════════════════════════════════════════════════

interface TotalizadorProps {
  metricas: TotalizadorMetrica[]
  accent: string
}

function Totalizador({ metricas, accent }: TotalizadorProps) {
  const cols =
    metricas.length === 1
      ? 'grid-cols-1'
      : metricas.length === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-3'

  return (
    <div className="mt-6 p-5 md:p-6 rounded-xl border border-slate-800/40 bg-slate-900/40">
      <div className={`grid ${cols} gap-6`}>
        {metricas.map((m, i) => (
          <div key={i}>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
              {m.label}
            </p>
            <p
              className={tintToClass(m.tint)}
              style={m.tint === 'accent' ? { color: accent } : undefined}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function tintToClass(tint?: TotalizadorTint): string {
  const base = 'text-2xl md:text-3xl font-extralight tabular-nums leading-tight'
  if (tint === 'emerald') return `${base} text-emerald-300`
  if (tint === 'warning') return `${base} text-amber-300`
  // 'accent' se aplica via inline style (color dinámico)
  if (tint === 'accent') return base
  return `${base} text-white`
}
