'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { Target, UserX, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface UncoveredRole {
  role: string
  bestCandidate: {
    name: string
    readiness: string
    readinessLabel: string
  } | null
}

interface SuccessionPanelProps {
  data: {
    coverage: number
    coveredRoles: number
    totalRoles: number
    uncoveredRoles: UncoveredRole[]
    bench: {
      readyNow: number
      ready1to2Years: number
      notReady: number
    }
    hasData: boolean
  }
}

// ════════════════════════════════════════════════════════════════════════════
// READINESS BADGE COLORS
// ════════════════════════════════════════════════════════════════════════════

const READINESS_COLORS: Record<string, { bg: string; text: string }> = {
  ready_now:     { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  ready_1_year:  { bg: 'bg-cyan-500/15',    text: 'text-cyan-400' },
  ready_2_years: { bg: 'bg-amber-500/15',   text: 'text-amber-400' },
  not_ready:     { bg: 'bg-red-500/15',     text: 'text-red-400' },
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const SuccessionPanel = memo(function SuccessionPanel({ data }: SuccessionPanelProps) {

  // ── Empty state ──
  if (!data.hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-slate-700" />
        </div>
        <p className="text-lg text-slate-400 font-medium mb-2">Sin datos de sucesion configurados</p>
        <p className="text-sm text-slate-600 max-w-sm">
          Asigna <span className="text-slate-400">targetRoles</span> y <span className="text-slate-400">successionReadiness</span> en las evaluaciones de desempeno para activar este modulo.
        </p>
      </div>
    )
  }

  const benchTotal = data.bench.readyNow + data.bench.ready1to2Years + data.bench.notReady

  return (
    <div className="space-y-5">

      {/* ── Gauge: Cobertura de Sucesión ── */}
      <div className="text-center">
        <span className={cn(
          'text-4xl font-bold',
          data.coverage >= 80 ? 'text-emerald-400' :
          data.coverage >= 50 ? 'text-amber-400' : 'text-red-400'
        )}>
          {data.coverage}%
        </span>
        <p className="text-xs text-slate-500 mt-1">Cobertura de Sucesion</p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          {data.coveredRoles} de {data.totalRoles} roles con sucesor viable
        </p>
      </div>

      {/* ── Pipeline Bench por Readiness ── */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
          Pipeline de Sucesion ({benchTotal} candidatos)
        </p>

        <div className="grid grid-cols-3 gap-2">
          {/* Ready Now */}
          <BenchCard
            icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            label="Ready Now"
            count={data.bench.readyNow}
            total={benchTotal}
            barColor="bg-emerald-500/50"
          />

          {/* 1-2 Years */}
          <BenchCard
            icon={<Clock className="w-3.5 h-3.5 text-cyan-400" />}
            label="1-2 anos"
            count={data.bench.ready1to2Years}
            total={benchTotal}
            barColor="bg-cyan-500/40"
          />

          {/* Not Ready */}
          <BenchCard
            icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
            label="No listo"
            count={data.bench.notReady}
            total={benchTotal}
            barColor="bg-red-500/30"
          />
        </div>

        {/* Stacked bar */}
        {benchTotal > 0 && (
          <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-800/50">
            {data.bench.readyNow > 0 && (
              <div
                className="bg-emerald-500/60 rounded-l-full"
                style={{ width: `${(data.bench.readyNow / benchTotal) * 100}%` }}
                title={`Ready Now: ${data.bench.readyNow}`}
              />
            )}
            {data.bench.ready1to2Years > 0 && (
              <div
                className="bg-cyan-500/50"
                style={{ width: `${(data.bench.ready1to2Years / benchTotal) * 100}%` }}
                title={`1-2 años: ${data.bench.ready1to2Years}`}
              />
            )}
            {data.bench.notReady > 0 && (
              <div
                className="bg-red-500/40 rounded-r-full"
                style={{ width: `${(data.bench.notReady / benchTotal) * 100}%` }}
                title={`No listo: ${data.bench.notReady}`}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Roles sin Sucesor Inmediato ── */}
      {data.uncoveredRoles.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <UserX className="w-3 h-3" />
            Roles sin Sucesor Inmediato ({data.uncoveredRoles.length})
          </p>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded">
            {data.uncoveredRoles.map((ur, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/40 border border-white/5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white font-medium truncate">{ur.role}</p>
                  {ur.bestCandidate ? (
                    <p className="text-[10px] text-slate-500 truncate">
                      Mejor: {ur.bestCandidate.name}
                    </p>
                  ) : (
                    <p className="text-[10px] text-red-400/80">Sin candidatos</p>
                  )}
                </div>

                {ur.bestCandidate && (
                  <span className={cn(
                    'text-[9px] font-medium px-2 py-0.5 rounded-md flex-shrink-0 ml-2',
                    READINESS_COLORS[ur.bestCandidate.readiness]?.bg || 'bg-slate-800',
                    READINESS_COLORS[ur.bestCandidate.readiness]?.text || 'text-slate-500'
                  )}>
                    {ur.bestCandidate.readinessLabel}
                  </span>
                )}

                {!ur.bestCandidate && (
                  <span className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 flex-shrink-0 ml-2">
                    Vacio
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── All covered message ── */}
      {data.uncoveredRoles.length === 0 && data.hasData && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-emerald-300">
            Todos los roles tienen al menos un sucesor inmediato
          </span>
        </div>
      )}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// BENCH CARD
// ════════════════════════════════════════════════════════════════════════════

function BenchCard({
  icon,
  label,
  count,
  total,
  barColor
}: {
  icon: React.ReactNode
  label: string
  count: number
  total: number
  barColor: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div className="text-center px-2 py-2.5 rounded-lg bg-slate-800/40 border border-white/5">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-lg font-bold text-white font-mono">{count}</span>
      </div>
      <p className="text-[8px] text-slate-600 uppercase tracking-wider">{label}</p>
      <div className="mt-1.5 h-1 rounded-full bg-slate-900/50 overflow-hidden">
        <div
          className={cn('h-full rounded-full', barColor)}
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>
      <p className="text-[8px] text-slate-600 font-mono mt-0.5">{pct}%</p>
    </div>
  )
}
