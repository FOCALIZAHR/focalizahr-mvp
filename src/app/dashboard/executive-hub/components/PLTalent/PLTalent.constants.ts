// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS - PLTalent
// src/app/dashboard/executive-hub/components/PLTalent/PLTalent.constants.ts
// ════════════════════════════════════════════════════════════════════════════

import { BarChart3, Scale } from 'lucide-react'
import type { PLTalentTabKey } from './PLTalent.types'

export const PL_TABS: Array<{ key: PLTalentTabKey; label: string; icon: typeof BarChart3 }> = [
  { key: 'brecha', label: 'Brecha Productiva', icon: BarChart3 },
  { key: 'semaforo', label: 'Semáforo Legal', icon: Scale },
]

// Paleta Tesla para barras de roleFit (sin rojo sólido)
export const ROLEFIT_BAR_COLORS = {
  optimal:    'bg-cyan-500/60',     // ≥90%
  solid:      'bg-cyan-500/30',     // 75-89%
  developing: 'bg-purple-500/40',   // 60-74%
  gap:        'bg-purple-700/40',   // 45-59%
  risk:       'bg-indigo-950',      // <45% (severidad via dot pulsante, no barra roja)
} as const

export const SEMAPHORE_CONFIG = {
  yellow: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400', label: 'Observación' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400', label: 'Alerta' },
  red:    { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', label: 'Crítico' },
} as const
