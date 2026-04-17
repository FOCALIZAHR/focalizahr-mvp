'use client'

// Instancia de ModuleToolbar para Workforce.
// 4 tools de diagnostico + CTA presupuesto.
// Los datos vienen de WorkforceDiagnosticData (ya cargado por useWorkforceData).

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Banknote, GitBranch, Cpu, Zap } from 'lucide-react'
import ModuleToolbar, { type ToolDefinition, type ToolBreakdown } from '@/components/ui/ModuleToolbar'
import type { WorkforceDiagnosticData } from '../types/workforce.types'

interface WorkforceToolbarProps {
  data: WorkforceDiagnosticData
}

function formatMonto(v: number): string {
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(v) >= 1_000_000) return `$${Math.round(v / 1_000_000)}M`
  if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${Math.round(v)}`
}

const CATEGORY_SHORT: Record<string, string> = {
  tecnologia: 'TI',
  comercial: 'Comercial',
  marketing: 'Marketing',
  operaciones: 'Operaciones',
  finanzas: 'Finanzas',
  personas: 'RRHH',
  servicio: 'Servicio',
  legal: 'Legal',
}

function formatGerenciaLabel(raw: string): string {
  const parts = raw.split(' de ')
  if (parts.length === 2) {
    const cargo = parts[0].toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    const cat = parts[1].toLowerCase().trim()
    const short = CATEGORY_SHORT[cat] ?? cat.charAt(0).toUpperCase() + cat.slice(1)
    return `${cargo} · ${short}`
  }
  return raw.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// Corta a maxItems y agrega "Otros" si hay mas, para que la suma cuadre con el total.
function sliceWithOtros(
  items: ToolBreakdown[],
  total: number,
  maxItems: number,
  formatFn: (v: number) => string,
): ToolBreakdown[] {
  const sorted = [...items].sort((a, b) => b.value - a.value)
  if (sorted.length <= maxItems) return sorted
  const top = sorted.slice(0, maxItems)
  const topSum = top.reduce((s, i) => s + i.value, 0)
  const otros = total - topSum
  if (otros > 0) {
    top.push({ label: 'Otros', value: otros, formatted: formatFn(otros) })
  }
  return top
}

export default function WorkforceToolbar({ data }: WorkforceToolbarProps) {
  const router = useRouter()

  const tools: ToolDefinition[] = useMemo(() => {
    const deptCosts = data.inertiaCost.byDepartment
    const totalHeadcount = data.totalEmployees
    const totalCosto = data.inertiaCost.totalMonthly

    // Span de control real
    const spanData = data.spanData
    const spanGlobal = spanData?.global ?? 0
    const spanPorGerencia = spanData?.porGerencia ?? []
    const fueraDeRango = spanPorGerencia.filter(g => g.avgSpan > 9 || g.avgSpan < 4).length

    const iaByCategory = data.exposure.byCategory ?? {}
    const avgIA = data.exposure.avgExposure ?? 0

    const brechaTotal = data.productivityGap.total
    const brechaSegments = data.productivityGap.bySegment
    const brechaAffected = data.productivityGap.affectedCount

    // Headcount total real por departamento
    const totalHeadcountDepts = deptCosts.reduce((s, d) => s + d.headcount, 0)
    // IA: total headcount mapeado
    const totalIAHeadcount = Object.values(iaByCategory).reduce((s, d) => s + d.headcount, 0)
    // Brecha: total gap
    const totalBrechaGap = brechaSegments.reduce((s, d) => s + d.total, 0)

    return [
      {
        id: 'headcount',
        label: 'Headcount',
        icon: Users,
        metric: `${totalHeadcount}`,
        unit: 'personas',
        color: 'rgba(255,255,255,0.5)',
        breakdown: sliceWithOtros(
          deptCosts.map(d => ({
            label: formatGerenciaLabel(d.departmentName),
            value: d.headcount,
            formatted: `${d.headcount}`,
          })),
          totalHeadcountDepts,
          8,
          v => `${v}`,
        ),
        narrative: deptCosts.length > 0
          ? (() => {
              const top = [...deptCosts].sort((a, b) => b.headcount - a.headcount)[0]
              return `${formatGerenciaLabel(top.departmentName)} concentra ${Math.round((top.headcount / totalHeadcount) * 100)}% de la dotacion.`
            })()
          : undefined,
      },
      {
        id: 'costo',
        label: 'Costo',
        icon: Banknote,
        metric: formatMonto(totalCosto),
        unit: '/mes',
        color: '#22D3EE',
        breakdown: sliceWithOtros(
          deptCosts.map(d => ({
            label: formatGerenciaLabel(d.departmentName),
            value: d.monthlyCost,
            formatted: formatMonto(d.monthlyCost),
          })),
          totalCosto,
          8,
          formatMonto,
        ),
        narrative: deptCosts.length > 0
          ? (() => {
              const top = [...deptCosts].sort((a, b) => b.monthlyCost - a.monthlyCost)[0]
              return `${formatGerenciaLabel(top.departmentName)} es la gerencia mas cara.`
            })()
          : undefined,
      },
      {
        id: 'span',
        label: 'Span',
        icon: GitBranch,
        metric: `${spanGlobal}`,
        unit: 'promedio',
        color: fueraDeRango > 0 ? '#F59E0B' : 'rgba(148,163,184,0.6)',
        breakdown: sliceWithOtros(
          spanPorGerencia.map(g => ({
            label: formatGerenciaLabel(g.nombre),
            value: g.avgSpan,
            formatted: `${g.avgSpan}`,
          })),
          spanGlobal,
          8,
          v => `${v}`,
        ),
        narrative: fueraDeRango > 0
          ? `${fueraDeRango} ${fueraDeRango === 1 ? 'gerencia' : 'gerencias'} fuera del rango optimo de 4-9 reportes por lider.`
          : `Todas las gerencias dentro del rango optimo (4-9).`,
      },
      {
        id: 'ia',
        label: 'Exp. IA',
        icon: Cpu,
        metric: `${Math.round(avgIA * 100)}%`,
        unit: 'promedio',
        color: '#A78BFA',
        breakdown: sliceWithOtros(
          Object.entries(iaByCategory).map(([cat, d]) => ({
            label: formatGerenciaLabel(cat),
            value: Math.round(d.avgExposure * 100),
            formatted: `${Math.round(d.avgExposure * 100)}%`,
          })),
          100,
          8,
          v => `${v}%`,
        ),
        narrative: Object.entries(iaByCategory).length > 0
          ? (() => {
              const top = Object.entries(iaByCategory).sort((a, b) => b[1].avgExposure - a[1].avgExposure)[0]
              return top ? `${formatGerenciaLabel(top[0])} con ${Math.round(top[1].avgExposure * 100)}% de exposicion IA.` : undefined
            })()
          : undefined,
      },
      {
        id: 'brecha',
        label: 'Brecha',
        icon: Zap,
        metric: formatMonto(brechaTotal),
        unit: 'no entregado',
        color: '#F59E0B',
        breakdown: sliceWithOtros(
          brechaSegments.map(s => ({
            label: formatGerenciaLabel(s.key),
            value: s.total,
            formatted: formatMonto(s.total),
          })),
          totalBrechaGap,
          8,
          formatMonto,
        ),
        narrative: brechaSegments.length > 0
          ? `${formatGerenciaLabel(brechaSegments[0].key)} concentra ${formatMonto(brechaSegments[0].total)}. ${brechaSegments[0].count} personas afectadas.`
          : undefined,
      },
    ]
  }, [data])

  return (
    <ModuleToolbar
      tools={tools}
      ctaLabel="Crear presupuesto"
      onCTA={() => router.push('/dashboard/workforce/presupuesto')}
    />
  )
}
