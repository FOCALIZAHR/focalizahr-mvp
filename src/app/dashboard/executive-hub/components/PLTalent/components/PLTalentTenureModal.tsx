'use client'

// ════════════════════════════════════════════════════════════════════════════
// P&L TALENT TENURE MODAL — Breakdown financiero por antigüedad
// src/app/dashboard/executive-hub/components/PLTalent/components/PLTalentTenureModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Responde: ¿De los $257M, cuánto viene de cada tramo de antigüedad?
// Datos: riskProfiles agrupados por tenureTrend (zero fetch)
// Portal: renderiza en document.body
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, HelpCircle } from 'lucide-react'
import { TooltipContext } from '@/components/ui/TooltipContext'
import { formatCurrency } from '../PLTalent.utils'
import { TENURE_ROLEFIT_DICTIONARY } from '@/config/narratives/TenureRoleFitDictionary'
import type { ExecutiveRiskPayload } from '@/lib/services/TalentRiskOrchestrator'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface PLTalentTenureModalProps {
  isOpen: boolean
  onClose: () => void
  riskProfiles: ExecutiveRiskPayload[]
}

const TRAMO_CONFIG = [
  { key: 'A1' as const, label: '< 12 meses', subtitle: 'Validación de selección' },
  { key: 'A2' as const, label: '12 - 36 meses', subtitle: 'Zona de verdad' },
  { key: 'A3' as const, label: '> 36 meses', subtitle: 'Decisiones acumuladas' },
]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function PLTalentTenureModal({
  isOpen,
  onClose,
  riskProfiles,
}: PLTalentTenureModalProps) {

  const tramos = useMemo(() => {
    const totalGap = riskProfiles.reduce((sum, p) => sum + p.data.monthlyGap, 0)

    return TRAMO_CONFIG.map(t => {
      const profiles = riskProfiles.filter(p => p.data.tenureTrend === t.key)
      const bajo = profiles.filter(p => p.data.roleFitScore < 75)
      const gap = bajo.reduce((sum, p) => sum + p.data.monthlyGap, 0)
      const pctCosto = totalGap > 0 ? Math.round((gap / totalGap) * 100) : 0
      const avgFit = bajo.length > 0
        ? Math.round(bajo.reduce((sum, p) => sum + p.data.roleFitScore, 0) / bajo.length)
        : 0
      const fitLevel = avgFit >= 75 ? 'high' : 'low' as const
      const narrative = TENURE_ROLEFIT_DICTIONARY[t.key][fitLevel]

      return {
        ...t,
        total: profiles.length,
        bajoEstandar: bajo.length,
        gapMonthly: gap,
        gapAnnual: gap * 12,
        pctCosto,
        avgFit,
        diagnosis: narrative.diagnosis,
        narrativeShort: narrative.narrativeShort,
        prevention: narrative.prevention,
      }
    })
  }, [riskProfiles])

  if (!isOpen || typeof document === 'undefined') return null

  const totalAnnual = tramos.reduce((sum, t) => sum + t.gapAnnual, 0)

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto overflow-x-hidden">
          <div className="fhr-top-line" />

          {/* Header */}
          <div className="text-center pt-8 pb-4 px-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors z-10">
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <h1 className="text-2xl md:text-3xl font-extralight text-white tracking-tight">
              Antigüedad
            </h1>
            <h1 className="text-2xl md:text-3xl font-extralight tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              y Rendimiento
            </h1>

            <div className="flex items-center justify-center gap-3 my-5">
              <div className="h-px w-12 bg-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="h-px w-12 bg-white/20" />
            </div>

          </div>

          {/* Mini-resumen comparativo — las 3 barras visibles */}
          <div className="px-6 pb-6">
            <div className="flex items-end gap-3 justify-center mb-2">
              {tramos.map(t => (
                <div key={t.key} className="text-center flex-1">
                  <p className="text-lg font-mono font-medium text-purple-400 mb-1">
                    {t.pctCosto}%
                  </p>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full bg-purple-400/60"
                      style={{ width: `${t.pctCosto}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-600">{t.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 text-center mt-3">
              {formatCurrency(totalAnnual)} anuales distribuidos por antigüedad
            </p>
          </div>

          {/* Tramos — cada uno con hero financiero */}
          <div className="px-6 pb-8">
            {tramos.map((t, idx) => {
              if (t.bajoEstandar === 0 && t.gapMonthly === 0) return null
              return (
                <div key={t.key} className={idx > 0 ? 'pt-8 mt-8 border-t border-slate-800/50' : ''}>

                  {/* Rango como label sutil */}
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">
                    {t.subtitle}
                  </p>

                  {/* Hero financiero — el dato protagonista */}
                  <p className="text-3xl font-extralight text-purple-400 tracking-tight mb-1">
                    {formatCurrency(t.gapAnnual)}
                    <span className="text-sm text-slate-500 font-light">/año</span>
                  </p>
                  <p className="text-xs text-slate-500 mb-6">
                    {t.bajoEstandar} personas · {t.label}
                  </p>

                  {/* Diagnosis — badge discreto */}
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                    {t.diagnosis} ({t.label})
                  </p>

                  {/* narrativeShort */}
                  <p className="text-sm italic font-light text-slate-300 leading-relaxed mb-4">
                    {t.narrativeShort}
                  </p>

                  {/* Prevention */}
                  {t.prevention && (
                    <div className="mt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
                        <span className="text-xs uppercase tracking-widest text-cyan-400">Recomendación</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
                      </div>
                      <p className="text-sm font-light text-slate-400 leading-relaxed whitespace-pre-line">
                        {t.prevention}
                      </p>
                      {t.key === 'A1' && (
                        <TooltipContext
                          variant="pattern"
                          position="top"
                          title="EXO Score"
                          explanation="El EXO Score mide el desempeño de integración de nuevos ingresos en sus primeros 90 días, agregado por departamento."
                        >
                          <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-slate-500 hover:text-slate-400 cursor-help transition-colors">
                            <HelpCircle className="w-3 h-3" strokeWidth={1.5} />
                            ¿Qué es el EXO Score?
                          </span>
                        </TooltipContext>
                      )}
                      {t.key === 'A2' && (
                        <TooltipContext
                          variant="pattern"
                          position="top"
                          title="Indicadores departamentales"
                          explanation="Revisa en FocalizaHR: clima del departamento, rotación histórica, y razones de salida. Si el patrón se repite, el problema no es la persona — es el sistema."
                        >
                          <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-slate-500 hover:text-slate-400 cursor-help transition-colors">
                            <HelpCircle className="w-3 h-3" strokeWidth={1.5} />
                            ¿Qué indicadores revisar?
                          </span>
                        </TooltipContext>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
})
