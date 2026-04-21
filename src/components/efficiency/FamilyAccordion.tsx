// ════════════════════════════════════════════════════════════════════════════
// FAMILY ACCORDION — Nivel 2 del Efficiency Hub (vista expandible 3 familias)
// src/components/efficiency/FamilyAccordion.tsx
// ════════════════════════════════════════════════════════════════════════════
// Layout horizontal acordeón:
//   · Card expandida (familia activa)   → 75% ancho, contenido FamilyBriefing
//   · Cards colapsadas (otras familias) → 12.5% cada una, label vertical
//
// Mobile: stack vertical. Card activa h-auto, colapsadas h-16.
//
// Reusa FamilyBriefing como contenido de la card expandida — cero duplicación
// de tesis, fichas forenses, conectores narrativos.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  FAMILIA_ORDEN,
  type LenteAPI,
} from '@/hooks/useEfficiencyWorkspace'
import {
  type FamiliaId,
  type LenteId,
} from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import { FamilyBriefing, FAMILIA_META } from './FamilyBriefing'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface FamilyAccordionProps {
  activeFamiliaId: FamiliaId
  lentes: Record<LenteId, LenteAPI>
  onSelectLente: (id: LenteId) => void
  onSelectFamilia: (id: FamiliaId) => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function FamilyAccordion({
  activeFamiliaId,
  lentes,
  onSelectLente,
  onSelectFamilia,
}: FamilyAccordionProps) {
  // Defensa: garantizar que SIEMPRE haya una familia expandida.
  // Si el upstream pasa un ID fuera de FAMILIA_ORDEN o vacío, default
  // a F1 'capital_en_riesgo' — nunca el accordion se monta con las 3
  // colapsadas.
  const safeActive: FamiliaId = FAMILIA_ORDEN.includes(activeFamiliaId)
    ? activeFamiliaId
    : 'capital_en_riesgo'

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch">
      {FAMILIA_ORDEN.map(familiaId => {
        const isActive = familiaId === safeActive
        const meta = FAMILIA_META[familiaId]
        if (!meta) return null

        return (
          <FamilyCard
            key={familiaId}
            familiaId={familiaId}
            isActive={isActive}
            lentes={lentes}
            onSelectLente={onSelectLente}
            onSelectFamilia={onSelectFamilia}
          />
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CARD — Expandida o colapsada según isActive
// ════════════════════════════════════════════════════════════════════════════

interface FamilyCardProps {
  familiaId: FamiliaId
  isActive: boolean
  lentes: Record<LenteId, LenteAPI>
  onSelectLente: (id: LenteId) => void
  onSelectFamilia: (id: FamiliaId) => void
}

function FamilyCard({
  familiaId,
  isActive,
  lentes,
  onSelectLente,
  onSelectFamilia,
}: FamilyCardProps) {
  const meta = FAMILIA_META[familiaId]
  const nombre = `${meta.titleFirst} ${meta.titleGradient}`

  return (
    <div
      className={`transition-all duration-500 ease-in-out ${
        isActive
          ? 'w-full md:w-[80%] h-auto'
          : 'w-full md:w-[10%] h-16 md:h-auto'
      }`}
    >
      <AnimatePresence mode="wait">
        {isActive ? (
          // ─── CARD EXPANDIDA — wrapper canónico con más vidrio, Tesla line accent ───
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.5 }}
            className="relative h-full rounded-2xl border border-slate-800/40 bg-slate-900/40 backdrop-blur-2xl overflow-hidden"
          >
            {/* Tesla line — color y glow adoptan el accent de la familia
                activa (cyan / purple / amber). Firma cromática coherente
                con el eyebrow del h2 gradient y las cards colapsadas. */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] z-10"
              style={{
                background: `linear-gradient(90deg, transparent 5%, ${meta.accent} 50%, transparent 95%)`,
                boxShadow: `0 0 25px ${meta.accent}60`,
              }}
              aria-hidden
            />

            <div className="px-6 py-10 md:px-10 md:py-12">
              <FamilyBriefing
                familiaId={familiaId}
                lentes={lentes}
                onSelectLente={onSelectLente}
              />
            </div>
          </motion.div>
        ) : (
          // ─── CARD COLAPSADA — solo título rotado, sin border ni bg ───
          <motion.button
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.5 }}
            onClick={() => onSelectFamilia(familiaId)}
            aria-label={`Expandir ${nombre}`}
            className="group h-full w-full rounded-2xl bg-slate-950 cursor-pointer hover:bg-slate-800/50 transition-colors duration-200 overflow-hidden focus:outline-none focus-visible:bg-slate-800/50"
          >
            {/* Mobile: solo nombre, horizontal */}
            <div className="flex md:hidden h-full items-center justify-center px-4">
              <span
                className="text-xs uppercase tracking-widest font-medium truncate"
                style={{ color: meta.accent }}
              >
                {nombre}
              </span>
            </div>

            {/* Desktop: solo nombre, vertical rotado -90deg */}
            <div className="hidden md:flex h-full min-h-[400px] items-center justify-center">
              <span
                className="text-xs uppercase tracking-widest font-medium whitespace-nowrap"
                style={{
                  color: meta.accent,
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                }}
              >
                {nombre}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
