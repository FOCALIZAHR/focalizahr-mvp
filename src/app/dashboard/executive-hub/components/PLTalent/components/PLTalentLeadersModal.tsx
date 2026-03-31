'use client'

// ════════════════════════════════════════════════════════════════════════════
// P&L TALENT LEADERS MODAL — Líderes bajo el estándar
// src/app/dashboard/executive-hub/components/PLTalent/components/PLTalentLeadersModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Responde: ¿Quiénes son los líderes que amplifican el problema?
// Datos: riskProfiles filtrados por leadershipRisk !== null (zero fetch)
// Portal: renderiza en document.body (evita transform de framer-motion)
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { createPortal } from 'react-dom'
import { X, Users } from 'lucide-react'
import type { ExecutiveRiskPayload } from '@/lib/services/TalentRiskOrchestrator'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface PLTalentLeadersModalProps {
  isOpen: boolean
  onClose: () => void
  riskProfiles: ExecutiveRiskPayload[]
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function PLTalentLeadersModal({
  isOpen,
  onClose,
  riskProfiles,
}: PLTalentLeadersModalProps) {

  if (!isOpen || typeof document === 'undefined') return null

  const leaders = riskProfiles.filter(p => p.narratives.leadershipRisk !== null)

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Modal — centrado en viewport */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto overflow-x-hidden">
          <div className="fhr-top-line" />

          {/* Header — Patrón FocalizaHR */}
          <div className="text-center pt-8 pb-4 px-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors z-10">
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <h1 className="text-2xl md:text-3xl font-extralight text-white tracking-tight">
              Líderes
            </h1>
            <h1 className="text-2xl md:text-3xl font-extralight tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              bajo el estándar
            </h1>

            <div className="flex items-center justify-center gap-3 my-5">
              <div className="h-px w-12 bg-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="h-px w-12 bg-white/20" />
            </div>
          </div>

          {/* Lista de líderes */}
          <div className="px-6 pb-6">
            {leaders.length === 0 ? (
              <p className="text-sm font-light text-slate-500 text-center py-8">
                No hay líderes bajo el estándar en este ciclo.
              </p>
            ) : (
              <div>
                {/* Headers de columna */}
                <div className="flex items-center gap-4 pb-2 mb-1">
                  <div className="flex-1" />
                  <div className="flex-shrink-0 w-24">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider">Capacidad</p>
                  </div>
                  <div className="flex-shrink-0 w-14">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider text-center">Equipo</p>
                  </div>
                </div>

                {leaders.map((leader) => {
                  const fit = leader.data.roleFitScore
                  return (
                    <div key={leader.data.employeeId} className="flex items-center gap-4 py-3 border-b border-slate-800/30 last:border-0">
                      {/* Nombre + cargo */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-light text-slate-200 truncate">
                          {leader.data.employeeName}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {leader.data.position} · {leader.data.departmentName}
                        </p>
                      </div>

                      {/* Mini gauge */}
                      <div className="flex-shrink-0 w-24 group relative">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-amber-400"
                              style={{ width: `${fit}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-medium text-amber-400 w-8 text-right">
                            {fit}%
                          </span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                          <p className="text-[10px] text-slate-300">RoleFit: {fit}% · Estándar: 75%</p>
                        </div>
                      </div>

                      {/* Equipo */}
                      <div className="flex-shrink-0 w-14 group relative">
                        <div className="flex items-center justify-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                          <span className="text-sm font-mono font-medium text-slate-300">
                            {leader.data.directReportsCount}
                          </span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                          <p className="text-[10px] text-slate-300">{leader.data.directReportsCount} personas dependen de su dirección</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Total */}
            {leaders.length > 0 && (
              <p className="text-xs text-slate-500 text-center mt-6">
                {leaders.length} líderes · {leaders.reduce((sum, l) => sum + l.data.directReportsCount, 0)} personas afectadas
              </p>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
})
