'use client'

// ════════════════════════════════════════════════════════════════════════════
// CARGOS NUEVOS SECTION - Unknown Positions Grouped
// src/components/admin/employees/CargosNuevosSection.tsx
// ════════════════════════════════════════════════════════════════════════════
// Sección VOLUMEN: Cargos no reconocidos en el diccionario
// - Línea Tesla CYAN
// - Agrupados por nombre de cargo (no filas individuales)
// - Recomendación visual basada en heurística
// - "Ver más" si hay más de 5 grupos
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileQuestion,
  Users,
  UserCheck,
  UserCog,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton'
import type { CargoGroup, ResolutionAction } from '@/hooks/useInconsistencies'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface CargosNuevosSectionProps {
  cargosAgrupados: CargoGroup[]
  totalEmpleados: number
  resolving: string | null
  onResolveGroup: (cargo: string, action: ResolutionAction) => Promise<boolean>
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const INITIAL_VISIBLE = 5

// ════════════════════════════════════════════════════════════════════════════
// CARGO GROUP CARD COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface CargoGroupCardProps {
  group: CargoGroup
  isResolving: boolean
  onResolve: (cargo: string, action: ResolutionAction) => Promise<boolean>
}

function CargoGroupCard({ group, isResolving, onResolve }: CargoGroupCardProps) {
  const isManagerRecommended = group.suggestedTrack === 'MANAGER'
  const isColaboradorRecommended = group.suggestedTrack === 'COLABORADOR'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/30 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Cargo Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
            <FileQuestion className="w-5 h-5 text-cyan-400" />
          </div>

          {/* Cargo Name & Count */}
          <div className="min-w-0">
            <p className="font-medium text-white truncate" title={group.cargo}>
              "{group.cargo}"
            </p>
            <p className="text-sm text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{group.count} empleado{group.count > 1 ? 's' : ''}</span>
            </p>
          </div>
        </div>

        {/* Actions - Botones con mismo ancho fijo */}
        <div className="flex items-center gap-3 shrink-0">
          {isResolving ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Procesando...</span>
            </div>
          ) : (
            <>
              {/* Es Colaborador Button */}
              {isColaboradorRecommended ? (
                <PrimaryButton
                  size="md"
                  icon={UserCheck}
                  onClick={() => onResolve(group.cargo, 'CONFIRM')}
                  disabled={isResolving}
                  className="min-w-[160px]"
                >
                  Es Colaborador
                </PrimaryButton>
              ) : (
                <SecondaryButton
                  size="md"
                  icon={UserCheck}
                  onClick={() => onResolve(group.cargo, 'CONFIRM')}
                  disabled={isResolving}
                  className="min-w-[160px]"
                >
                  Es Colaborador
                </SecondaryButton>
              )}

              {/* Es Manager Button */}
              {isManagerRecommended ? (
                <PrimaryButton
                  size="md"
                  icon={UserCog}
                  onClick={() => onResolve(group.cargo, 'PROMOTE')}
                  disabled={isResolving}
                  className="min-w-[160px]"
                >
                  Es Manager
                </PrimaryButton>
              ) : (
                <SecondaryButton
                  size="md"
                  icon={UserCog}
                  onClick={() => onResolve(group.cargo, 'PROMOTE')}
                  disabled={isResolving}
                  className="min-w-[160px]"
                >
                  Es Manager
                </SecondaryButton>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recommendation Hint */}
      {group.suggestedTrack && (
        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700/30">
          Sugerencia automática:{' '}
          <span className={group.suggestedTrack === 'MANAGER' ? 'text-cyan-400' : 'text-slate-400'}>
            {group.suggestedTrack === 'MANAGER' ? 'Es probable que sea Manager' : 'Es probable que sea Colaborador'}
          </span>
        </p>
      )}
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function CargosNuevosSection({
  cargosAgrupados,
  totalEmpleados,
  resolving,
  onResolveGroup
}: CargosNuevosSectionProps) {
  const [showAll, setShowAll] = useState(false)

  const count = cargosAgrupados.length
  const hasMore = count > INITIAL_VISIBLE
  const visibleGroups = showAll ? cargosAgrupados : cargosAgrupados.slice(0, INITIAL_VISIBLE)
  const hiddenCount = count - INITIAL_VISIBLE

  // Empty state
  if (count === 0) {
    return null
  }

  return (
    <div id="cargos-nuevos" className="fhr-card relative overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════════
          LÍNEA TESLA CYAN (h-[2px] más visible)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
            <FileQuestion className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              CARGOS NUEVOS POR CLASIFICAR
              <span className="text-base font-normal text-cyan-400">({totalEmpleados})</span>
            </h2>
            <p className="text-sm text-slate-400 font-light leading-relaxed mt-1 max-w-xl">
              Cargos que no estaban en nuestro diccionario. Define qué evaluación de desempeño les corresponde.
            </p>
            {count > 1 && (
              <p className="text-xs text-slate-500 mt-2">
                {count} cargos únicos agrupados
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CARGO GROUPS LIST
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="p-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {visibleGroups.map(group => (
            <CargoGroupCard
              key={group.cargo}
              group={group}
              isResolving={resolving === 'bulk'}
              onResolve={onResolveGroup}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER: VER MÁS / VER MENOS
      ═══════════════════════════════════════════════════════════════════════ */}
      {hasMore && (
        <div className="px-6 pb-6">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-3 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50
                       hover:border-cyan-500/30 hover:bg-slate-800/80 transition-all
                       flex items-center justify-center gap-2 text-sm text-slate-300 hover:text-cyan-400"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Ver los {hiddenCount} cargos restantes
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
