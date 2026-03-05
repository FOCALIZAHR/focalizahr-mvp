// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS - CalibrationHealth
// src/app/dashboard/executive-hub/components/CalibrationHealth/CalibrationHealth.constants.ts
// ════════════════════════════════════════════════════════════════════════════

import { BarChart3, Shield } from 'lucide-react'
import type { TabKey } from './CalibrationHealth.types'

// ════════════════════════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════════════════════════

export const TABS: Array<{ key: TabKey; label: string; icon: typeof BarChart3 }> = [
  { key: 'distribution', label: 'Distribución', icon: BarChart3 },
  { key: 'gerencia',     label: 'Salud Gerencias', icon: Shield },
]

// ════════════════════════════════════════════════════════════════════════════
// STATUS COLORS (Heatmap + Bias)
// ════════════════════════════════════════════════════════════════════════════

export const STATUS_COLORS: Record<string, { bg: string; text: string; led: string; bgBar: string }> = {
  OPTIMA:     { bg: 'bg-emerald-500/15', text: 'text-emerald-400', led: 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]', bgBar: 'bg-emerald-500/60' },
  CENTRAL:    { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    led: 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]',    bgBar: 'bg-cyan-500/60' },
  SEVERA:     { bg: 'bg-amber-500/15',   text: 'text-amber-400',   led: 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]',   bgBar: 'bg-amber-500/60' },
  INDULGENTE: { bg: 'bg-red-500/15',     text: 'text-red-400',     led: 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]',      bgBar: 'bg-red-500/60' },
}

