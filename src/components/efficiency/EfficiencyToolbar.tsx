// ════════════════════════════════════════════════════════════════════════════
// EFFICIENCY TOOLBAR — Barra lateral flotante con 3 tools por familia
// src/components/efficiency/EfficiencyToolbar.tsx
// ════════════════════════════════════════════════════════════════════════════
// Reutiliza ModuleToolbar (patrón WorkforceToolbar). 3 tools:
//   · Diagnóstico (Zap) → L1 + L2 agregados
//   · Oportunidad (GitBranch) → L4 + L5
//   · Protección (ShieldAlert) → L7+L8 + L9
// Glassmorphism, fixed right, visible en todas las vistas del hub.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useMemo } from 'react'
import { Zap, GitBranch, ShieldAlert } from 'lucide-react'
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

function headlineMetric(lente?: LenteAPI): string {
  if (!lente || !lente.hayData) return '—'
  // Priorizar datos canónicos por lente
  switch (lente.id) {
    case 'l1_inercia':
      return formatCLP(getNumber(lente.detalle, 'totalMonthly'))
    case 'l2_zombie':
      return `${getNumber(lente.detalle, 'count')}`
    case 'l4_fantasma':
      return `${getArrayLen(lente.detalle, 'pairs')}`
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
      return getArrayLen(lente.detalle, 'pairs')
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
    const l4 = lentes.l4_fantasma
    const l5 = lentes.l5_brecha
    const l7 = lentes.l7_fuga
    const l9 = lentes.l9_pasivo

    // Tool 1 — Diagnóstico (Choque Tecnológico)
    const diagnosticoMetric =
      l1?.hayData
        ? formatCLP(getNumber(l1.detalle, 'totalMonthly'))
        : l2?.hayData
        ? `${getNumber(l2.detalle, 'count')}`
        : '—'
    const diagnosticoBreakdown: ToolBreakdown[] = [
      {
        label: 'Costo inercia',
        value: headlineValue(l1),
        formatted: headlineMetric(l1),
      },
      {
        label: 'Talento zombie',
        value: headlineValue(l2),
        formatted: l2?.hayData
          ? `${getNumber(l2.detalle, 'count')} ${
              getNumber(l2.detalle, 'count') === 1 ? 'persona' : 'personas'
            }`
          : '—',
      },
    ]

    // Tool 2 — Oportunidad (Grasa Organizacional)
    const oportunidadMetric = l5?.hayData
      ? formatCLP(getNumber(l5.detalle, 'total'))
      : l4?.hayData
      ? `${getArrayLen(l4.detalle, 'pairs')}`
      : '—'
    const oportunidadBreakdown: ToolBreakdown[] = [
      {
        label: 'Cargos fantasma',
        value: headlineValue(l4),
        formatted: l4?.hayData
          ? `${getArrayLen(l4.detalle, 'pairs')} ${
              getArrayLen(l4.detalle, 'pairs') === 1 ? 'par' : 'pares'
            }`
          : '—',
      },
      {
        label: 'Brecha productividad',
        value: headlineValue(l5),
        formatted: headlineMetric(l5),
      },
    ]

    // Tool 3 — Protección (Riesgo Financiero)
    const proteccionMetric = l9?.hayData
      ? formatCLP(getNumber(l9.detalle, 'costoEsperaTotal'))
      : '—'
    const proteccionBreakdown: ToolBreakdown[] = [
      {
        label: 'Mapa de talento',
        value: headlineValue(l7),
        formatted: l7?.hayData
          ? `${getNumber(l7.detalle, 'count')} ${
              getNumber(l7.detalle, 'count') === 1 ? 'persona' : 'personas'
            }`
          : '—',
      },
      {
        label: 'Pasivo laboral',
        value: headlineValue(l9),
        formatted: headlineMetric(l9),
      },
    ]

    return [
      {
        id: 'diagnostico',
        label: 'Diagnóstico',
        icon: Zap,
        metric: diagnosticoMetric,
        unit: l1?.hayData ? '/mes' : '',
        color: '#22D3EE',
        breakdown: diagnosticoBreakdown,
        narrative: l1?.hayData
          ? `La organización paga ${formatCLP(getNumber(l1.detalle, 'totalMonthly'))} al mes por trabajo que la IA ya resolvió.`
          : undefined,
      },
      {
        id: 'oportunidad',
        label: 'Oportunidad',
        icon: GitBranch,
        metric: oportunidadMetric,
        unit: l5?.hayData ? '/mes' : '',
        color: '#A78BFA',
        breakdown: oportunidadBreakdown,
        narrative: l5?.hayData
          ? `${formatCLP(getNumber(l5.detalle, 'total'))} de salario sin rendimiento equivalente cada mes.`
          : undefined,
      },
      {
        id: 'proteccion',
        label: 'Protección',
        icon: ShieldAlert,
        metric: proteccionMetric,
        unit: l9?.hayData ? 'costo espera' : '',
        color: '#F59E0B',
        breakdown: proteccionBreakdown,
        narrative: l9?.hayData
          ? `${formatCLP(getNumber(l9.detalle, 'costoEsperaTotal'))} adicional si postergás la decisión doce meses.`
          : undefined,
      },
    ]
  }, [data])

  return <ModuleToolbar tools={tools} />
}
