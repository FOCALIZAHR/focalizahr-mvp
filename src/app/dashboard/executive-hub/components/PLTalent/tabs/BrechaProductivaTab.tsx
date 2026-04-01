'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAB 1: MAPA DE LOCALIZACIÓN
// src/app/dashboard/executive-hub/components/PLTalent/tabs/BrechaProductivaTab.tsx
// ════════════════════════════════════════════════════════════════════════════
// "¿A quién llamo a mi oficina primero?"
// Lista única por gerencia, ordenada por impacto.
// Cada card cuenta una micro-historia, no muestra un número.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronDown, AlertTriangle } from 'lucide-react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  Tooltip,
} from 'recharts'
import type { BrechaProductivaData, BrechaGerencia, BrechaByCargoFamily, SemaforoLegalData } from '../PLTalent.types'
import { formatCurrency } from '../PLTalent.utils'
import { BUSINESS_IMPACT_DICTIONARY } from '@/config/narratives/BusinessImpactDictionary'

interface Props {
  data: BrechaProductivaData
  semaforoData: SemaforoLegalData
  onSelectGerencia: (gerenciaId: string, gerenciaName: string) => void
}

const SHORT_LABELS: Record<string, string> = {
  alta_gerencia: 'Alta Gerencia',
  mandos_medios: 'Mandos Medios',
  profesionales: 'Profesionales',
  base_operativa: 'Base Operativa',
}

function RadarTooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-700/50 px-3 py-2 rounded-lg shadow-xl text-xs">
      <p className="text-white font-medium mb-1">{d.familia}</p>
      <p className="text-slate-400">Fit: <span className="text-cyan-400 font-mono">{d.roleFit}%</span> · {d.headcount} personas</p>
    </div>
  )
}

export default memo(function BrechaProductivaTab({ data, semaforoData, onSelectGerencia }: Props) {
  const [showCargo, setShowCargo] = useState(false)

  const radarData = useMemo(() =>
    data.byCargoFamily.map(f => ({
      familia: SHORT_LABELS[f.acotadoGroup] || f.label,
      roleFit: f.avgRoleFit,
      benchmark: 75,
      headcount: f.headcount,
    }))
  , [data.byCargoFamily])

  if (data.totalPeople === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <p className="text-sm font-light">Sin brecha productiva detectada.</p>
        <p className="text-xs text-slate-600 mt-1">Todos los evaluados superan el 75% de Role Fit.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ═══ SECTION TITLE ═══ */}
      <p className="text-[10px] uppercase tracking-widest text-slate-500 text-center">
        ¿Dónde está el problema?
      </p>

      {/* ═══ SALARY SOURCE WARNING ═══ */}
      {data.salarySource === 'default_chile' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-[10px] text-amber-400/80">Salarios estimados. Configura tus datos reales para mayor precisión.</p>
        </div>
      )}

      {/* ═══ RADAR INLINE — Overview por familia de cargo ═══ */}
      {radarData.length > 0 && (
        <div className="w-full h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
              <PolarGrid stroke="#334155" strokeDasharray="4 4" />
              <PolarAngleAxis dataKey="familia" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <RechartsRadar
                dataKey="benchmark"
                stroke="#475569"
                fill="transparent"
                strokeWidth={1}
                strokeDasharray="6 4"
                isAnimationActive={false}
              />
              <RechartsRadar
                dataKey="roleFit"
                stroke="#22D3EE"
                fill="rgba(34, 211, 238, 0.12)"
                fillOpacity={1}
                strokeWidth={2}
                isAnimationActive={false}
                dot={{ r: 3, fill: '#22D3EE', strokeWidth: 0 }}
              />
              <Tooltip content={<RadarTooltipContent />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ═══ GERENCIA CARDS — lista única ═══ */}
      <div className="space-y-3">
        {data.byGerencia.map((ger, idx) => {
          // Cross with semaforo to check if there are legal zone people
          const legalPeople = semaforoData.people.filter(p =>
            p.departmentName.toLowerCase().includes(ger.gerenciaName.toLowerCase().split(' ')[0])
          )
          const hasLegalRisk = legalPeople.length > 0
          const groupFiniquito = legalPeople.reduce((s, p) => s + p.finiquitoToday, 0)
          const breakevenMonths = ger.gapMonthly > 0 && groupFiniquito > 0
            ? Math.round(groupFiniquito / ger.gapMonthly)
            : null

          return (
            <motion.button
              key={ger.gerenciaId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.06 }}
              onClick={() => onSelectGerencia(ger.gerenciaId, ger.gerenciaName)}
              className="w-full text-left rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur p-5 hover:border-slate-700/60 hover:bg-slate-800/40 transition-all duration-200 group"
            >
              {/* Row 1: Name + risk dot */}
              <div className="flex items-center gap-2 mb-3">
                {ger.avgRoleFit < 45 && (
                  <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                )}
                <p className="text-base text-white font-medium group-hover:text-cyan-400 transition-colors">
                  {ger.gerenciaName}
                </p>
              </div>

              {/* Row 2: The story — not just numbers */}
              <p className="text-sm text-slate-300 font-light leading-relaxed mb-1">
                <span className="text-purple-400 font-medium">{formatCurrency(ger.gapMonthly)}/mes</span>
                {' '}en pérdida de productividad
              </p>
              <p className="text-xs text-slate-500 mb-2">
                {ger.headcount} persona{ger.headcount !== 1 ? 's' : ''} bajo el estándar de su cargo
              </p>

              {/* Motor 2 — Narrativa de impacto por categoría */}
              {ger.standardCategory && BUSINESS_IMPACT_DICTIONARY[ger.standardCategory] && (
                <p className="text-[11px] font-light text-slate-400 leading-relaxed mb-3">
                  Su meta estructural es {BUSINESS_IMPACT_DICTIONARY[ger.standardCategory].meta.toLowerCase()}.
                </p>
              )}

              {/* Row 3: Breakeven narrative (only if legal data exists) */}
              {breakevenMonths && (
                <p className="text-[11px] text-amber-400/70 font-light italic leading-relaxed">
                  Si no se interviene, en {breakevenMonths} meses esta pérdida superará el costo de resolver el problema hoy.
                </p>
              )}

              {/* Row 4: CTA hint */}
              <p className="text-[10px] text-cyan-400/60 mt-3 group-hover:text-cyan-400 transition-colors">
                Ver detalle →
              </p>
            </motion.button>
          )
        })}
      </div>

      {/* ═══ FAMILIA DE CARGO — colapsable ═══ */}
      {data.byCargoFamily.length > 0 && (
        <div>
          <button
            onClick={() => setShowCargo(!showCargo)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-800/40 hover:border-slate-700/40 bg-slate-900/20 transition-colors"
          >
            <span className="text-xs text-slate-500">Ver por familia de cargo</span>
            <ChevronDown className={cn(
              'w-3.5 h-3.5 text-slate-600 transition-transform',
              showCargo && 'rotate-180'
            )} />
          </button>

          <AnimatePresence>
            {showCargo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2">
                  {data.byCargoFamily.map((cargo, idx) => (
                    <div
                      key={cargo.acotadoGroup}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-900/30 border border-slate-800/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">{cargo.label}</p>
                        <p className="text-[10px] text-slate-500">{cargo.headcount} persona{cargo.headcount !== 1 ? 's' : ''} · Fit {cargo.avgRoleFit}%</p>
                      </div>
                      <p className="text-sm text-purple-400 font-light flex-shrink-0 ml-3">
                        {formatCurrency(cargo.gapMonthly)}/mes
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
})
