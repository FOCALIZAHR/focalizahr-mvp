// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS — Capacidades Intelligence
// ════════════════════════════════════════════════════════════════════════════

import { BarChart3, Grid3X3, Target } from 'lucide-react'
import { TALENT_INTELLIGENCE_THRESHOLDS } from '@/config/performanceClassification'
import type { CapacidadesTab } from './Capacidades.types'

export const ROLE_FIT_HIGH = TALENT_INTELLIGENCE_THRESHOLDS.ROLE_FIT_HIGH

export const LAYER_ORDER = ['alta_gerencia', 'mandos_medios', 'profesionales', 'base_operativa', 'sin_clasificar']

export const ACOTADO_LABELS: Record<string, string> = {
  'alta_gerencia': 'Alta Gerencia',
  'mandos_medios': 'Mandos Medios',
  'profesionales': 'Profesionales',
  'base_operativa': 'Base Operativa',
  'sin_clasificar': 'Sin Clasificar'
}

export const TABS: Array<{ key: CapacidadesTab; label: string; icon: typeof BarChart3 }> = [
  { key: 'overview', label: 'Resumen', icon: BarChart3 },
  { key: 'heatmap', label: 'Heatmap', icon: Grid3X3 },
  { key: 'focus', label: 'Foco Estratégico', icon: Target },
]
