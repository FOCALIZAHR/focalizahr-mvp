// ════════════════════════════════════════════════════════════════════════════
// EFFICIENCY TOOLBAR — Barra lateral flotante con 3 tools por familia
// src/components/efficiency/EfficiencyToolbar.tsx
// ════════════════════════════════════════════════════════════════════════════
// Reutiliza ModuleToolbar (patrón WorkforceToolbar). 3 tools:
//   · Capital en riesgo  (Target)    → L1 + L4
//   · Ruta de ejecución  (GitBranch) → L2 + L5 + L7+L8
//   · Costo de esperar   (Clock)     → L9 + L3
// Glassmorphism, fixed right, visible en todas las vistas del hub.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useMemo } from 'react'
import { Target, GitBranch, Clock } from 'lucide-react'
import ModuleToolbar, {
  type ToolDefinition,
  type ToolBreakdown,
} from '@/components/ui/ModuleToolbar'
import type {
  DiagnosticData,
  LenteAPI,
} from '@/hooks/useEfficiencyWorkspace'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

interface EfficiencyToolbarProps {
  data: DiagnosticData
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getNumber(detalle: unknown, key: string): number {
  if (!detalle || typeof detalle !== 'object') return 0
  const v = (detalle as Record<string, unknown>)[key]
  return typeof v === 'number' ? v : 0
}

function getArrayLen(detalle: unknown, key: string): number {
  if (!detalle || typeof detalle !== 'object') return 0
  const v = (detalle as Record<string, unknown>)[key]
  return Array.isArray(v) ? v.length : 0
}

/** Managers fuera de rango (ROJA + AMARILLA) del detalle de L4. */
function getL4FueraDeRango(detalle: unknown): number {
  if (!detalle || typeof detalle !== 'object') return 0
  const org = (detalle as { org?: Record<string, unknown> }).org
  if (!org || typeof org !== 'object') return 0
  const rojo = typeof org.managersEnRojo === 'number' ? org.managersEnRojo : 0
  const amarillo =
    typeof org.managersEnAmarillo === 'number' ? org.managersEnAmarillo : 0
  return rojo + amarillo
}

function headlineMetric(lente?: LenteAPI): string {
  if (!lente || !lente.hayData) return '—'
  // Priorizar datos canónicos por lente
  switch (lente.id) {
    case 'l1_inercia':
      return formatCLP(getNumber(lente.detalle, 'totalMonthly'))
    case 'l2_zombie':
      return `${getNumber(lente.detalle, 'count')}`
    case 'l4_fantasma':
      return `${getL4FueraDeRango(lente.detalle)}`
    case 'l5_brecha':
      return formatCLP(getNumber(lente.detalle, 'total'))
    case 'l7_fuga':
      return `${getNumber(lente.detalle, 'count')}`
    case 'l9_pasivo':
      return formatCLP(getNumber(lente.detalle, 'costoEsperaTotal'))
    default:
      return '—'
  }
}

function headlineValue(lente?: LenteAPI): number {
  if (!lente || !lente.hayData) return 0
  switch (lente.id) {
    case 'l1_inercia':
      return getNumber(lente.detalle, 'totalMonthly')
    case 'l2_zombie':
      return getNumber(lente.detalle, 'count')
    case 'l4_fantasma':
      return getL4FueraDeRango(lente.detalle)
    case 'l5_brecha':
      return getNumber(lente.detalle, 'total')
    case 'l7_fuga':
      return getNumber(lente.detalle, 'count')
    case 'l9_pasivo':
      return getNumber(lente.detalle, 'costoEsperaTotal')
    default:
      return 0
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default function EfficiencyToolbar({ data }: EfficiencyToolbarProps) {
  const tools: ToolDefinition[] = useMemo(() => {
    const lentes = data.lentes

    const l1 = lentes.l1_inercia
    const l2 = lentes.l2_zombie
    const l3 = lentes.l3_adopcion
    const l4 = lentes.l4_fantasma
    const l5 = lentes.l5_brecha
    const l7 = lentes.l7_fuga
    const l9 = lentes.l9_pasivo

    // Tool 1 — Capital en riesgo (L1 + L4)
    const capitalMetric =
      l1?.hayData
        ? formatCLP(getNumber(l1.detalle, 'totalMonthly'))
        : l4?.hayData
        ? `${getArrayLen(l4.detalle, 'pairs')}`
        : '—'
    const capitalBreakdown: ToolBreakdown[] = [
      {
        label: 'Costo de no decidir',
        value: headlineValue(l1),
        formatted: headlineMetric(l1),
      },
      {
        label: 'Cargos sin impacto',
        value: headlineValue(l4),
        formatted: l4?.hayData
          ? `${getArrayLen(l4.detalle, 'pairs')} ${
              getArrayLen(l4.detalle, 'pairs') === 1 ? 'par' : 'pares'
            }`
          : '—',
      },
    ]

    // Tool 2 — Ruta de ejecución (L2 + L5 + L7+L8)
    const rutaMetric = l5?.hayData
      ? formatCLP(getNumber(l5.detalle, 'total'))
      : l2?.hayData
      ? `${getNumber(l2.detalle, 'count')}`
      : '—'
    const rutaBreakdown: ToolBreakdown[] = [
      {
        label: 'Talento estancado',
        value: headlineValue(l2),
        formatted: l2?.hayData
          ? `${getNumber(l2.detalle, 'count')} ${
              getNumber(l2.detalle, 'count') === 1 ? 'persona' : 'personas'
            }`
          : '—',
      },
      {
        label: 'Brecha productividad',
        value: headlineValue(l5),
        formatted: headlineMetric(l5),
      },
      {
        label: 'Talento en riesgo',
        value: headlineValue(l7),
        formatted: l7?.hayData
          ? `${getNumber(l7.detalle, 'count')} ${
              getNumber(l7.detalle, 'count') === 1 ? 'persona' : 'personas'
            }`
          : '—',
      },
    ]

    // Tool 3 — Costo de esperar (L9 + L3)
    const esperarMetric = l9?.hayData
      ? formatCLP(getNumber(l9.detalle, 'costoEsperaTotal'))
      : '—'
    const rankingLen = l3?.hayData ? getArrayLen(l3.detalle, 'ranking') : 0
    const esperarBreakdown: ToolBreakdown[] = [
      {
        label: 'Pasivo laboral',
        value: headlineValue(l9),
        formatted: headlineMetric(l9),
      },
      {
        label: 'Riesgo de adopción',
        value: rankingLen,
        formatted: l3?.hayData
          ? `${rankingLen} ${rankingLen === 1 ? 'gerencia' : 'gerencias'}`
          : '—',
      },
    ]

    return [
      {
        id: 'capital_en_riesgo',
        label: 'Capital en riesgo',
        icon: Target,
        metric: capitalMetric,
        unit: l1?.hayData ? '/mes' : '',
        color: '#22D3EE',
        breakdown: capitalBreakdown,
        narrative: l1?.hayData
          ? `La organización paga ${formatCLP(getNumber(l1.detalle, 'totalMonthly'))} al mes por trabajo que la IA ya resolvió.`
          : undefined,
      },
      {
        id: 'ruta_ejecucion',
        label: 'Ruta de ejecución',
        icon: GitBranch,
        metric: rutaMetric,
        unit: l5?.hayData ? '/mes' : '',
        color: '#A78BFA',
        breakdown: rutaBreakdown,
        narrative: l5?.hayData
          ? `${formatCLP(getNumber(l5.detalle, 'total'))} de salario sin rendimiento equivalente cada mes.`
          : undefined,
      },
      {
        id: 'costo_esperar',
        label: 'Costo de esperar',
        icon: Clock,
        metric: esperarMetric,
        unit: l9?.hayData ? 'en 12m' : '',
        color: '#F59E0B',
        breakdown: esperarBreakdown,
        narrative: l9?.hayData
          ? `${formatCLP(getNumber(l9.detalle, 'costoEsperaTotal'))} adicional si postergás la decisión doce meses.`
          : undefined,
      },
    ]
  }, [data])

  return <ModuleToolbar tools={tools} />
}
