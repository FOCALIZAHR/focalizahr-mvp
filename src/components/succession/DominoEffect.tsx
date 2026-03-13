'use client'

import { motion } from 'framer-motion'
import { formatDisplayName, getInitials as getInitialsHelper } from '@/lib/utils/formatName'

// ════════════════════════════════════════════════════════════════════════════
// DOMINO EFFECT — 3-level narrative cascade
// Level 0: The promotion  |  Level 1: Vacated position  |  Level 2: Who covers
// ════════════════════════════════════════════════════════════════════════════

interface DominoEffectProps {
  candidateName: string
  candidatePosition: string
  targetPosition: string
  roleFitScore?: number
  readinessLevel?: string
  nineBoxPosition?: string | null
  flightRisk?: string | null
  vacatedPosition?: string | null
  backfillResolution?: string | null
  backfillEmployeeName?: string | null
}

// ── Readiness label map ──
const READINESS_LABEL: Record<string, string> = {
  READY_NOW: 'Listo ahora',
  READY_1_2_YEARS: '1-2 años',
  READY_3_PLUS: '3+ años',
  NOT_VIABLE: 'En desarrollo',
}

// ── Nine-box label map ──
const NINE_BOX_LABEL: Record<string, string> = {
  STAR: 'Star',
  HIGH_PERFORMER: 'High Performer',
  GROWTH_POTENTIAL: 'Growth Potential',
  CORE_PLAYER: 'Core Player',
  SOLID_PERFORMER: 'Solid Performer',
  INCONSISTENT: 'Inconsistente',
  UNDERPERFORMER: 'Underperformer',
  RISK: 'Riesgo',
  NEW_IN_ROLE: 'Nuevo en rol',
}

// ── Resolution config for Level 1 ──
const RESOLUTION_CONFIG: Record<string, {
  badge: string
  badgeColor: string
  borderColor: string
  bgColor: string
  tesla: string
}> = {
  COVERED: {
    badge: '✓ Cubierta',
    badgeColor: 'text-emerald-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-slate-800/40',
    tesla: '#F59E0B',
  },
  PENDING: {
    badge: '● Sin resolver',
    badgeColor: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-slate-800/40',
    tesla: '#FB7185',
  },
  EXTERNAL_SEARCH: {
    badge: '◌ Externa',
    badgeColor: 'text-slate-400',
    borderColor: 'border-slate-600/40',
    bgColor: 'bg-slate-800/30',
    tesla: '#64748B',
  },
  POSITION_ELIMINATED: {
    badge: '◌ Eliminado',
    badgeColor: 'text-slate-400',
    borderColor: 'border-slate-600/40',
    bgColor: 'bg-slate-800/30',
    tesla: '#64748B',
  },
}

const DEFAULT_RES = RESOLUTION_CONFIG.PENDING

export default function DominoEffect({
  candidateName,
  candidatePosition,
  targetPosition,
  roleFitScore,
  readinessLevel,
  nineBoxPosition,
  vacatedPosition,
  backfillResolution,
  backfillEmployeeName,
}: DominoEffectProps) {
  const resConfig = (backfillResolution && RESOLUTION_CONFIG[backfillResolution]) || DEFAULT_RES
  const isCovered = backfillResolution === 'COVERED'
  const readinessText = readinessLevel ? READINESS_LABEL[readinessLevel] || readinessLevel : null
  const nineBoxText = nineBoxPosition ? NINE_BOX_LABEL[nineBoxPosition] || nineBoxPosition : null

  return (
    <div className="mt-2 mb-1">
      {/* ━━━ NIVEL 0 — EL ASCENSO ━━━ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0, duration: 0.3 }}
        className="relative bg-slate-800/60 border border-cyan-500/30 rounded-xl p-4 overflow-hidden"
      >
        <div
          className="absolute top-0 inset-x-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
            boxShadow: '0 0 8px rgba(34,211,238,0.4)',
          }}
        />
        {/* Row 1: Avatar + Name + Readiness badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700/80 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-cyan-400 font-bold text-xs">{getInitialsHelper(candidateName)}</span>
          </div>
          <p className="text-white font-semibold text-sm flex-1 min-w-0 truncate">
            ↑ {candidateName}
          </p>
          {readinessText && (
            <span className="text-xs text-slate-300 flex-shrink-0">{readinessText}</span>
          )}
        </div>
        {/* Row 2: Position transition + Fit + NineBox */}
        <div className="flex items-center gap-2 mt-2 ml-4 sm:ml-12 flex-wrap">
          <span className="text-slate-400 text-xs">
            {candidatePosition} → {targetPosition}
          </span>
          {roleFitScore != null && (
            <span className="text-cyan-400 text-xs">Fit {Math.round(roleFitScore)}%</span>
          )}
          {nineBoxText && (
            <span className="text-purple-400 text-xs">{nineBoxText}</span>
          )}
        </div>
      </motion.div>

      {/* ━━━ CONECTOR 1 ━━━ */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.15, duration: 0.2 }}
        className="ml-8 w-px h-6 bg-gradient-to-b from-cyan-500/40 to-amber-500/40"
        style={{ originY: 0 }}
      />

      {/* ━━━ NIVEL 1 — EL CARGO VACANTE ━━━ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className={`relative ml-4 border rounded-xl p-4 overflow-hidden ${resConfig.borderColor} ${resConfig.bgColor}`}
      >
        <div
          className="absolute top-0 inset-x-0 h-[1px]"
          style={{ background: `linear-gradient(90deg, transparent, ${resConfig.tesla}, transparent)` }}
        />
        <div className="flex items-center justify-between">
          <p className="text-white font-medium text-sm">
            {vacatedPosition || 'Sin cargo previo'} queda libre
          </p>
          <span className={`text-[10px] font-medium ${resConfig.badgeColor}`}>
            {resConfig.badge}
          </span>
        </div>
      </motion.div>

      {/* ━━━ CONECTOR 2 + NIVEL 2 — QUIÉN CUBRE (solo si COVERED) ━━━ */}
      {isCovered && backfillEmployeeName && (
        <>
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.4, duration: 0.2 }}
            className="ml-12 w-px h-6 bg-amber-500/20"
            style={{ originY: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="relative ml-8 bg-slate-800/30 border border-slate-700/30 rounded-lg px-3 py-2 flex items-center gap-2 overflow-hidden"
          >
            <div
              className="absolute top-0 inset-x-0 h-[1px]"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)' }}
            />
            <div className="w-7 h-7 rounded-full bg-slate-700/80 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-amber-400 font-bold text-[10px]">{getInitialsHelper(formatDisplayName(backfillEmployeeName, 'short'))}</span>
            </div>
            <span className="text-xs text-white font-medium">{formatDisplayName(backfillEmployeeName, 'short')}</span>
            <span className="text-[10px] text-slate-400">cubre el cargo</span>
          </motion.div>
        </>
      )}
    </div>
  )
}
