'use client'

import { useState, useEffect } from 'react'
import { Search, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Zap } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// SUCCESSION WIZARD - 30 segundos, 0 campos manuales
// Paso 1: Seleccionar empleado (autocomplete)
// Paso 2: Auto-deteccion (roleFit, nineBox, elegibilidad)
// Paso 3: Confirmar (match%, readiness, gaps summary)
// ════════════════════════════════════════════════════════════════════════════

interface SuccessionWizardProps {
  positionId: string
  onClose: () => void
  onNominated: () => void
}

interface SuggestedEmployee {
  employeeId: string
  employeeName: string
  position: string | null
  departmentName: string | null
  roleFitScore: number
  nineBoxPosition: string | null
  matchPercent: number
  readinessLevel: string
  readinessLabel: string
  flightRisk: string | null
  gapsCriticalCount: number
}

const NINEBOX_LABELS: Record<string, string> = {
  star: 'Estrella',
  high_performer: 'Alto Rendimiento',
  growth_potential: 'Potencial de Crecimiento',
}

export default function SuccessionWizard({ positionId, onClose, onNominated }: SuccessionWizardProps) {
  const [step, setStep] = useState(1)
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestedEmployee[]>([])
  const [selected, setSelected] = useState<SuggestedEmployee | null>(null)
  const [loading, setLoading] = useState(false)
  const [nominating, setNominating] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Load suggestions
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/succession/critical-positions/${positionId}/suggestions`)
        const data = await res.json()
        if (data.success) setSuggestions(data.data)
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    load()
  }, [positionId])

  const filtered = search
    ? suggestions.filter(s =>
        s.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        (s.position?.toLowerCase().includes(search.toLowerCase()))
      )
    : suggestions

  async function handleNominate() {
    if (!selected) return
    setNominating(true)
    setError('')

    try {
      const res = await fetch(`/api/succession/critical-positions/${positionId}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selected.employeeId }),
      })
      const data = await res.json()
      if (data.success) {
        onNominated()
      } else {
        setError(data.error || 'Error al nominar')
      }
    } catch {
      setError('Error de conexion')
    }
    setNominating(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="fhr-card w-full max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="fhr-title-card flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Nominar Sucesor
          </h2>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= s ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}>{s}</div>
                {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-cyan-500' : 'bg-slate-700'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* ── STEP 1: Select employee ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  className="fhr-input w-full pl-10"
                  placeholder="Buscar empleado elegible..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
              </div>

              {loading ? (
                <div className="py-8 text-center text-slate-500 animate-pulse">Buscando elegibles...</div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No se encontraron empleados elegibles
                </div>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {filtered.map(emp => (
                    <div
                      key={emp.employeeId}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selected?.employeeId === emp.employeeId
                          ? 'border-cyan-500/50 bg-cyan-500/10'
                          : 'border-slate-700/30 bg-slate-800/40 hover:border-slate-600'
                      }`}
                      onClick={() => setSelected(emp)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-200 font-medium">{emp.employeeName}</span>
                        <span className="text-sm text-cyan-400 font-bold">{emp.matchPercent}%</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {emp.position} {emp.departmentName ? `· ${emp.departmentName}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={onClose} className="fhr-btn fhr-btn-ghost">Cancelar</button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!selected}
                  className="fhr-btn fhr-btn-primary flex items-center gap-1"
                >
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Auto-detection (read only) ── */}
          {step === 2 && selected && (
            <div className="space-y-4">
              <h3 className="text-slate-200 font-medium">{selected.employeeName}</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-800/40">
                  <div className="text-xs text-slate-500">Role Fit</div>
                  <div className="text-2xl font-bold text-cyan-400">{Math.round(selected.roleFitScore)}%</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40">
                  <div className="text-xs text-slate-500">9-Box</div>
                  <div className="text-sm font-medium text-purple-400 mt-1">
                    {NINEBOX_LABELS[selected.nineBoxPosition || ''] || selected.nineBoxPosition || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-sm text-emerald-300">Cumple todos los criterios de elegibilidad</span>
              </div>

              {selected.flightRisk === 'HIGH' && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-300">Alerta: Riesgo de fuga detectado</span>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="fhr-btn fhr-btn-ghost flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Atras
                </button>
                <button onClick={() => setStep(3)} className="fhr-btn fhr-btn-primary flex items-center gap-1">
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 3 && selected && (
            <div className="space-y-4">
              <h3 className="text-slate-200 font-medium">Confirmar Nominacion</h3>

              <div className="p-4 rounded-lg bg-slate-800/40 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Candidato</span>
                  <span className="text-sm text-slate-200 font-medium">{selected.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Match</span>
                  <span className="text-sm text-cyan-400 font-bold">{selected.matchPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Readiness</span>
                  <span className="text-sm text-slate-200">{selected.readinessLabel}</span>
                </div>
                {selected.gapsCriticalCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Gaps criticos</span>
                    <span className="text-sm text-red-400">{selected.gapsCriticalCount}</span>
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="fhr-btn fhr-btn-ghost flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Atras
                </button>
                <button
                  onClick={handleNominate}
                  disabled={nominating}
                  className="fhr-btn fhr-btn-primary"
                >
                  {nominating ? 'Nominando...' : 'Confirmar Nominacion'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
