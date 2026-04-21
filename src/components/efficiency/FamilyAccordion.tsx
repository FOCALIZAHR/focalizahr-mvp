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
  formatCLP,
  type FamiliaId,
  type LenteId,
} from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import { FamilyBriefing, FAMILIA_META } from './FamilyBriefing'

// ════════════════════════════════════════════════════════════════════════════
// POTENCIAL POR FAMILIA — canónico, usado en card colapsada
// Cada familia tiene un lente "ancla" cuyo dato duro resume la magnitud.
// ════════════════════════════════════════════════════════════════════════════

function getPotencialFamilia(
  familiaId: FamiliaId,
  lentes: Record<LenteId, LenteAPI>
): number {
  switch (familiaId) {
    case 'capital_en_riesgo': {
      const d = lentes.l1_inercia?.detalle as { totalMonthly?: number } | null
      return d?.totalMonthly ?? 0
    }
    case 'ruta_ejecucion': {
      const d = lentes.l5_brecha?.detalle as { total?: number } | null
      return d?.total ?? 0
    }
    case 'costo_esperar': {
      const d = lentes.l9_pasivo?.detalle as
        | { costoEsperaTotal?: number }
        | null
      return d?.costoEsperaTotal ?? 0
    }
    default:
      return 0
  }
}

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
  const potencial = getPotencialFamilia(familiaId, lentes)
  const nombre = `${meta.titleFirst} ${meta.titleGradient}`
  // Lentes con data real dentro de esta familia
  const lentesActivos = meta.lentes.filter(id => lentes[id]?.hayData).length

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
          // ─── CARD EXPANDIDA — contenido FamilyBriefing ───
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.5 }}
            className="h-full"
          >
            <FamilyBriefing
              familiaId={familiaId}
              lentes={lentes}
              onSelectLente={onSelectLente}
            />
          </motion.div>
        ) : (
          // ─── CARD COLAPSADA — label vertical + número protagonista ───
          <motion.button
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.5 }}
            onClick={() => onSelectFamilia(familiaId)}
            aria-label={`Expandir ${nombre}`}
            className="group h-full w-full rounded-2xl border border-slate-800/40 bg-slate-900/30 cursor-pointer hover:bg-slate-800/50 transition-colors duration-200 overflow-hidden focus:outline-none focus-visible:bg-slate-800/50"
            style={{
              boxShadow: `inset 2px 0 0 ${meta.accent}`,
            }}
          >
            {/* Mobile: layout horizontal compacto */}
            <div className="flex md:hidden h-full items-center justify-between px-4 gap-3">
              <div className="flex flex-col min-w-0">
                <span
                  className="text-[10px] uppercase tracking-widest font-medium truncate"
                  style={{ color: meta.accent }}
                >
                  {nombre}
                </span>
                <span className="text-[9px] font-light text-slate-500 truncate">
                  {lentesActivos} {lentesActivos === 1 ? 'análisis disponible' : 'análisis disponibles'}
                </span>
              </div>
              <span className="text-xl font-extralight text-white tabular-nums flex-shrink-0">
                {formatCLP(potencial)}
              </span>
            </div>

            {/* Desktop: texto vertical rotado */}
            <div className="hidden md:flex h-full min-h-[400px] items-center justify-center py-8">
              <div
                className="flex items-center gap-6 whitespace-nowrap"
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                }}
              >
                <span
                  className="text-[10px] uppercase tracking-widest font-medium"
                  style={{ color: meta.accent }}
                >
                  {nombre}
                </span>
                <span className="text-[9px] font-light text-slate-500">
                  {lentesActivos} {lentesActivos === 1 ? 'análisis disponible' : 'análisis disponibles'}
                </span>
                <span className="text-xl font-extralight text-white tabular-nums">
                  {formatCLP(potencial)}
                </span>
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
