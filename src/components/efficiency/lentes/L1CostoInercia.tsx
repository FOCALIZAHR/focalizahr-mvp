// ════════════════════════════════════════════════════════════════════════════
// L1 — COSTO DE INERCIA (FTEs liberables + tabla por área con IPI + slider)
// src/components/efficiency/lentes/L1CostoInercia.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón G:
//  · Portada   → $X CLP atrapados (hero) + N FTEs + narrativa McKinsey
//  · Evidencia → tabla por área con IPI dominante
//                (Delegación Activa / Asistencia Productiva / Aprendizaje Acelerado)
//  · Interacción → slider % captura por área (decisionesActuales persistidas)
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bot, Zap, Sparkles } from 'lucide-react'
import { LenteCard } from './LenteCard'
import type { LenteComponentProps } from './_LentePlaceholder'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import type { DecisionItem } from '@/lib/services/efficiency/EfficiencyCalculator'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS DEL DETALLE (según EfficiencyDataResolver → L1)
// ════════════════════════════════════════════════════════════════════════════

interface DepartmentCost {
  departmentName: string
  departmentId: string
  monthlyCost: number
  annualCost: number
  headcount: number
  avgExposure: number
}

interface DepartmentFTE {
  departmentName: string
  departmentId: string
  liberatedFTEs: number
  monthlySavings: number
  headcount: number
}

interface L1Detalle {
  totalFTEs: number
  totalMonthly: number
  totalAnnual: number
  byDepartment: DepartmentCost[]
  ftesByDepartment: DepartmentFTE[]
}

// ════════════════════════════════════════════════════════════════════════════
// PERFIL DE IMPACTO DOMINANTE (IPI) — heurística basada en avgExposure
// ════════════════════════════════════════════════════════════════════════════

type IPI = 'delegacion' | 'asistencia' | 'aprendizaje'

interface IPIMeta {
  id: IPI
  label: string
  description: string
  color: string
  icon: React.ComponentType<{ className?: string }>
}

const IPI_META: Record<IPI, IPIMeta> = {
  delegacion: {
    id: 'delegacion',
    label: 'Delegación Activa',
    description: 'La IA ejecuta de principio a fin. Requiere decidir cuándo activarla.',
    color: '#22D3EE',
    icon: Bot,
  },
  asistencia: {
    id: 'asistencia',
    label: 'Asistencia Productiva',
    description: 'La IA copilotea. Liberar esta capacidad es cambiar procesos, no eliminar cargos.',
    color: '#A78BFA',
    icon: Zap,
  },
  aprendizaje: {
    id: 'aprendizaje',
    label: 'Aprendizaje Acelerado',
    description: 'La IA mejora con los datos de la empresa. Cada mes de espera es conocimiento que no se acumula.',
    color: '#F59E0B',
    icon: Sparkles,
  },
}

function inferIPI(avgExposure: number): IPI {
  if (avgExposure >= 0.5) return 'delegacion'
  if (avgExposure >= 0.3) return 'asistencia'
  return 'aprendizaje'
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function L1CostoInercia({
  lente,
  decisionesActuales,
  onUpsert,
  onRemove,
}: LenteComponentProps) {
  const detalle = lente.detalle as L1Detalle | null

  // Estado local: % captura por área
  const [captureByDept, setCaptureByDept] = useState<Record<string, number>>({})

  // Hidrata estado inicial desde decisiones existentes del carrito
  useEffect(() => {
    const hydrated: Record<string, number> = {}
    for (const d of decisionesActuales) {
      const pct = d.fteEquivalente > 0
        ? Math.round(d.fteEquivalente * 100 / (d.fteEquivalente || 1))
        : 0
      // Más simple: guardamos % en metadata del nombre (workaround):
      // dejamos 50 por default si existe; el % real lo lee L1 del Map local
      hydrated[d.id] = hydrated[d.id] ?? 0
    }
    // Solo inicializa una vez — si ya hay captureByDept, no pisar
    setCaptureByDept(prev =>
      Object.keys(prev).length === 0 ? hydrated : prev
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Combina byDepartment + ftesByDepartment en un array único por área
  const rows = useMemo(() => {
    if (!detalle) return []
    const fteMap = new Map(detalle.ftesByDepartment.map(f => [f.departmentId, f]))
    return detalle.byDepartment
      .map(d => ({
        ...d,
        liberatedFTEs: fteMap.get(d.departmentId)?.liberatedFTEs ?? 0,
        ipi: inferIPI(d.avgExposure),
      }))
      .sort((a, b) => b.monthlyCost - a.monthlyCost)
  }, [detalle])

  if (!lente.hayData || !detalle || rows.length === 0) {
    return <LenteCard lente={lente} estado="vacio">{null}</LenteCard>
  }

  const handleSliderChange = (
    dept: typeof rows[number],
    pct: number
  ) => {
    const pctClamped = Math.max(0, Math.min(100, pct))
    setCaptureByDept(prev => ({ ...prev, [dept.departmentId]: pctClamped }))

    if (pctClamped === 0) {
      onRemove(`area:${dept.departmentId}`)
      return
    }
    const factor = pctClamped / 100
    const item: DecisionItem = {
      id: dept.departmentId,
      lenteId: 'l1_inercia',
      tipo: 'area',
      nombre: dept.departmentName,
      gerencia: dept.departmentName,
      ahorroMes: Math.round(dept.monthlyCost * factor),
      finiquito: 0,
      fteEquivalente: Math.round(dept.liberatedFTEs * factor * 10) / 10,
      narrativa: lente.narrativa,
      aprobado: false,
    }
    onUpsert(item)
  }

  return (
    <LenteCard lente={lente}>
      {/* ── Portada ─────────────────────────────────────────────── */}
      <LenteCard.Portada
        metricaProtagonista={formatCLP(detalle.totalMonthly)}
        metricaLabel={`atrapados / mes · ${detalle.totalFTEs.toFixed(1)} FTE equivalentes`}
      >
        {lente.narrativa}
      </LenteCard.Portada>

      {/* ── Evidencia: tabla por área con IPI ──────────────────── */}
      <LenteCard.Evidencia titulo="Mapa por área con perfil de impacto IA">
        <div className="space-y-3">
          {rows.map(r => {
            const ipi = IPI_META[r.ipi]
            const Icon = ipi.icon
            return (
              <div
                key={r.departmentId}
                className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">
                        {r.departmentName}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border font-medium"
                        style={{
                          color: ipi.color,
                          borderColor: `${ipi.color}60`,
                          backgroundColor: `${ipi.color}15`,
                        }}
                      >
                        <Icon className="w-3 h-3" />
                        {ipi.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-light mt-1 leading-snug">
                      {ipi.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-light">
                      <span>
                        Costo atrapado{' '}
                        <span className="text-white font-medium">
                          {formatCLP(r.monthlyCost)}
                        </span>
                        /mes
                      </span>
                      <span>
                        FTEs liberables{' '}
                        <span className="text-cyan-300 font-medium">
                          {r.liberatedFTEs.toFixed(1)}
                        </span>
                      </span>
                      <span className="text-slate-500">
                        Exposición{' '}
                        <span className="text-slate-300">
                          {Math.round(r.avgExposure * 100)}%
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </LenteCard.Evidencia>

      {/* ── Interacción: slider % captura por área ─────────────── */}
      <LenteCard.Interaccion titulo="Cuánta capacidad capturar por área">
        <p className="text-xs text-slate-400 font-light mb-4 leading-relaxed">
          Mueve el slider para proyectar cuánta de la capacidad liberable vas
          a capturar este trimestre. El panel derecho actualiza el plan en
          tiempo real.
        </p>
        <div className="space-y-4">
          {rows.map(r => {
            const pct = captureByDept[r.departmentId] ?? 0
            const ipi = IPI_META[r.ipi]
            const ahorroProyectado = Math.round(r.monthlyCost * (pct / 100))
            return (
              <div key={r.departmentId}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-slate-300 font-light">
                    {r.departmentName}
                  </span>
                  <span className="text-xs font-medium" style={{ color: ipi.color }}>
                    {pct}% ·{' '}
                    <span className="text-emerald-300">
                      {formatCLP(ahorroProyectado)}/mes
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={pct}
                  onChange={e => handleSliderChange(r, parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-800"
                  style={{
                    background: `linear-gradient(to right, ${ipi.color} 0%, ${ipi.color} ${pct}%, rgb(30 41 59) ${pct}%, rgb(30 41 59) 100%)`,
                  }}
                />
              </div>
            )
          })}
        </div>
      </LenteCard.Interaccion>
    </LenteCard>
  )
}
