// ════════════════════════════════════════════════════════════════════════════
// L1 — COSTO DE NO DECIDIR (refactorizado con LenteLayout 3 actos)
// src/components/efficiency/lentes/L1CostoInercia.tsx
// ════════════════════════════════════════════════════════════════════════════
// Primer lente migrado al molde maestro LenteLayout. Delgado — la
// orquestación de actos, transiciones y estructura visual vive en
// LenteLayout. Este archivo solo aporta:
//
//   · Cálculo del IPI (perfil de impacto IA) por departamento
//   · Narrativa dinámica reactiva basada en % promedio capturado
//   · Fórmula lineal del slider (idéntica a versión previa)
//   · 3 sub-componentes de slot: HallazgoMapa, ExpedienteLateral,
//     QuirofanoSliders
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useMemo, useState } from 'react'
import { Bot, Zap, Sparkles } from 'lucide-react'
import { LenteLayout } from './LenteLayout'
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

type Row = DepartmentCost & { liberatedFTEs: number; ipi: IPI }

// ════════════════════════════════════════════════════════════════════════════
// IPI — Perfil de Impacto IA (heurística por avgExposure)
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
    description:
      'La IA ejecuta de principio a fin. Requiere decidir cuándo activarla.',
    color: '#22D3EE',
    icon: Bot,
  },
  asistencia: {
    id: 'asistencia',
    label: 'Asistencia Productiva',
    description:
      'La IA copilotea. Liberar esta capacidad es cambiar procesos, no eliminar cargos.',
    color: '#A78BFA',
    icon: Zap,
  },
  aprendizaje: {
    id: 'aprendizaje',
    label: 'Aprendizaje Acelerado',
    description:
      'La IA mejora con los datos de la empresa. Cada mes de espera es conocimiento que no se acumula.',
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
// NARRATIVA DINÁMICA — reactiva al % promedio capturado
// ════════════════════════════════════════════════════════════════════════════

function narrativaDinamica(avgPct: number): string {
  if (avgPct === 0) return 'Sin captura. El capital sigue atrapado.'
  if (avgPct <= 20) return 'Captura conservadora. Mínima fricción, menor retorno.'
  if (avgPct <= 50)
    return 'Adopción balanceada. Progreso visible con riesgo moderado.'
  if (avgPct <= 80)
    return 'Captura decidida. Impacto financiero significativo.'
  return 'Migración agresiva hacia IA. Máxima eficiencia, máximo impacto organizacional.'
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const L1_ACCENT = '#22D3EE' // capital_en_riesgo

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export function L1CostoInercia({
  lente,
  onUpsert,
  onRemove,
  onNextLente,
  proximoLenteTitulo,
  onActChange,
}: LenteComponentProps) {
  const detalle = lente.detalle as L1Detalle | null
  const [captureByDept, setCaptureByDept] = useState<Record<string, number>>({})

  // Cross-merge byDepartment + ftesByDepartment + inferencia IPI
  const rows: Row[] = useMemo(() => {
    if (!detalle) return []
    const fteMap = new Map(
      detalle.ftesByDepartment.map(f => [f.departmentId, f])
    )
    return detalle.byDepartment
      .map(d => ({
        ...d,
        liberatedFTEs: fteMap.get(d.departmentId)?.liberatedFTEs ?? 0,
        ipi: inferIPI(d.avgExposure),
      }))
      .sort((a, b) => b.monthlyCost - a.monthlyCost)
  }, [detalle])

  // Empty state: sin data, usa LenteCard legacy para estado vacío consistente
  if (!lente.hayData || !detalle || rows.length === 0) {
    return (
      <LenteCard lente={lente} estado="vacio">
        {null}
      </LenteCard>
    )
  }

  // Handler del slider — fórmula lineal pura (sin cambios)
  const handleSliderChange = (dept: Row, pct: number) => {
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

  // ─── Derivados reactivos para el LenteLayout ────────────────────────────
  const hasInteraction = Object.values(captureByDept).some(v => v > 0)
  const avgPct =
    rows.length > 0
      ? rows.reduce((s, r) => s + (captureByDept[r.departmentId] ?? 0), 0) /
        rows.length
      : 0
  const capitalRecuperado = rows.reduce(
    (s, r) =>
      s + r.monthlyCost * ((captureByDept[r.departmentId] ?? 0) / 100),
    0
  )
  const ftesLiberados = rows.reduce(
    (s, r) =>
      s + r.liberatedFTEs * ((captureByDept[r.departmentId] ?? 0) / 100),
    0
  )

  return (
    <LenteLayout
      familiaAccent={L1_ACCENT}
      heroValue={formatCLP(detalle.totalMonthly)}
      heroUnit={`atrapados / mes · ${detalle.totalFTEs.toFixed(1)} FTE equivalentes`}
      narrativaPuente="Cada mes que este capital sigue atrapado, la organización financia trabajo que la IA ya resuelve. El simulador modela cuánta capacidad puedes liberar este trimestre."
      ctaQuirofanoEyebrow="SIMULACIÓN DE CAPTURA"
      narrativaDinamica={narrativaDinamica(avgPct)}
      hasInteraction={hasInteraction}
      onNextLente={onNextLente}
      proximoLenteTitulo={proximoLenteTitulo}
      onActChange={onActChange}
      totalizador={{
        metricas: [
          {
            label: 'Capital recuperado',
            value: `${formatCLP(capitalRecuperado)}/mes`,
            tint: 'emerald',
          },
          {
            label: 'FTEs liberados',
            value: ftesLiberados.toFixed(1),
            tint: 'accent',
          },
        ],
      }}
      renderHallazgo={() => <HallazgoMapa rows={rows} />}
      renderExpediente={() => <ExpedienteLateral detalle={detalle} />}
      renderQuirofano={() => (
        <QuirofanoSliders
          rows={rows}
          captureByDept={captureByDept}
          onChange={handleSliderChange}
        />
      )}
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// HALLAZGO — mapa por área con perfil IA protagónico (no badge secundario)
// ════════════════════════════════════════════════════════════════════════════

function HallazgoMapa({ rows }: { rows: Row[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-400 font-medium mb-2">
        EL MAPA
      </p>
      <h3 className="text-xl md:text-2xl font-light text-white mb-4 leading-tight">
        Por área, cómo actúa la IA
      </h3>

      {/* Narrativa contextual — por qué esto es un descubrimiento
          (Mandamiento 8: narrativa antes que dato). */}
      <p className="text-sm text-slate-400 font-light leading-relaxed max-w-2xl mb-6">
        El motor cruzó tu nómina con el mapa de exposición a IA de{' '}
        <span className="text-slate-300">O*NET</span> y el índice de automatización{' '}
        <span className="text-slate-300">Eloundou</span>. Esto es lo que encontró.
      </p>

      <div className="space-y-3">
        {rows.map(r => {
          const ipi = IPI_META[r.ipi]
          const Icon = ipi.icon
          return (
            <div
              key={r.departmentId}
              className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30 transition-colors hover:border-slate-600/40"
            >
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider px-2.5 py-1 rounded-md font-medium"
                  style={{
                    color: ipi.color,
                    backgroundColor: `${ipi.color}15`,
                    border: `1px solid ${ipi.color}40`,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {ipi.label}
                </span>
              </div>
              <p className="text-base font-medium text-white mb-1.5">
                {r.departmentName}
              </p>
              <p className="text-[11px] text-slate-500 font-light mb-3 leading-snug max-w-xl">
                {ipi.description}
              </p>
              <div className="flex items-center gap-x-5 gap-y-1 text-xs text-slate-400 font-light flex-wrap">
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
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EXPEDIENTE LATERAL — stats del lente (columna 30%)
// ════════════════════════════════════════════════════════════════════════════

function ExpedienteLateral({ detalle }: { detalle: L1Detalle }) {
  return (
    <aside className="rounded-lg border border-slate-800/40 bg-slate-900/30 p-5 space-y-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium">
        EL EXPEDIENTE
      </p>

      {/* Segundo hero — río del número: $65M/mes arriba (hero global)
          conecta con $XXX.XM/año acá (hero anual del lente).
          Regla del Río: el CEO ve la continuidad cronológica del impacto. */}
      <div>
        <p
          className="font-extralight text-white tabular-nums leading-none"
          style={{
            fontSize: 'clamp(36px, 4vw, 48px)',
            letterSpacing: '-0.02em',
          }}
        >
          {formatCLP(detalle.totalAnnual)}
        </p>
        <p className="text-[11px] uppercase tracking-widest text-amber-300/90 font-medium mt-2">
          Si no actúas · al año
        </p>
      </div>

      <div className="h-px bg-slate-800/40" aria-hidden />

      <div>
        <p className="text-xl font-extralight text-white tabular-nums leading-tight">
          {detalle.totalFTEs.toFixed(1)}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          FTE liberables
        </p>
      </div>

      <div className="h-px bg-slate-800/40" aria-hidden />

      <div>
        <p className="text-xl font-extralight text-white tabular-nums leading-tight">
          {detalle.byDepartment.length}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          Áreas con señal
        </p>
      </div>
    </aside>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// QUIRÓFANO — grid de sliders por área
// ════════════════════════════════════════════════════════════════════════════

interface QuirofanoSlidersProps {
  rows: Row[]
  captureByDept: Record<string, number>
  onChange: (row: Row, pct: number) => void
}

function QuirofanoSliders({ rows, captureByDept, onChange }: QuirofanoSlidersProps) {
  return (
    <>
      <p className="text-xs md:text-sm text-slate-400 font-light mb-6 leading-relaxed max-w-2xl">
        Mueve el slider para proyectar cuánta capacidad liberable vas a
        capturar este trimestre. El totalizador y la narrativa se actualizan
        en vivo con cada movimiento.
      </p>

      <div className="space-y-5">
        {rows.map(r => {
          const pct = captureByDept[r.departmentId] ?? 0
          const ipi = IPI_META[r.ipi]
          const ahorroProyectado = Math.round(r.monthlyCost * (pct / 100))

          return (
            <div key={r.departmentId}>
              <div className="flex items-baseline justify-between mb-2 gap-2 flex-wrap">
                <span className="text-sm text-slate-200 font-light">
                  {r.departmentName}
                </span>
                <span
                  className="text-xs font-medium tabular-nums"
                  style={{ color: ipi.color }}
                >
                  {pct}%{' '}
                  <span className="text-slate-600">·</span>{' '}
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
                onChange={e => onChange(r, parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-800"
                style={{
                  background: `linear-gradient(to right, ${ipi.color} 0%, ${ipi.color} ${pct}%, rgb(30 41 59) ${pct}%, rgb(30 41 59) 100%)`,
                }}
                aria-label={`Captura en ${r.departmentName}`}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}
