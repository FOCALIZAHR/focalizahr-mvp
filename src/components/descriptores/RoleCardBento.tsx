'use client'

// ════════════════════════════════════════════════════════════════════════════
// ROLE CARD BENTO — Side-sheet stack vertical full-width
// Hero title → Propósito → Responsabilidades → Skills barras → Ocupantes
// Tesla line + footer sutil
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle } from 'lucide-react'
import { formatDisplayName } from '@/lib/utils/formatName'

interface BentoPosition {
  jobTitle: string
  departmentId: string
  departmentName: string
  employeeCount: number
  descriptorStatus: string
  employees: Array<{ id: string; fullName: string }>
}

interface DescriptorData {
  purpose: string | null
  responsibilities: Array<{ taskId: string; description: string; importance: number; isActive: boolean }>
  competencies: Array<{ code: string; name: string; description?: string | null; expectedLevel?: number | null }>
  confirmedAt: string | null
  onetTasksTotal: number | null
  onetTasksKept: number | null
}

interface RoleCardBentoProps {
  position: BentoPosition | null
  onClose: () => void
}

function daysAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'hace 1 día'
  return `hace ${diff} días`
}

export default function RoleCardBento({ position, onClose }: RoleCardBentoProps) {
  const [descriptor, setDescriptor] = useState<DescriptorData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!position) { setDescriptor(null); return }

    setLoading(true)
    fetch(`/api/descriptors/by-title?jobTitle=${encodeURIComponent(position.jobTitle)}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) setDescriptor(json.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [position])

  const topTasks = descriptor?.responsibilities
    ?.filter(t => t.isActive)
    ?.sort((a, b) => b.importance - a.importance)
    ?.slice(0, 5) ?? []

  const competencies = descriptor?.competencies ?? []
  const tasksKept = descriptor?.onetTasksKept ?? topTasks.length
  const tasksTotal = descriptor?.onetTasksTotal ?? topTasks.length

  return (
    <AnimatePresence>
      {position && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Side-sheet */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-[420px] h-full z-50 bg-[#0F172A]/95 backdrop-blur-2xl border-l border-slate-800 flex flex-col"
          >
            {/* Tesla line */}
            <div
              className="absolute top-0 left-0 right-0 h-px z-20"
              style={{
                background: 'linear-gradient(90deg, transparent, #22D3EE 30%, #A78BFA 70%, transparent)',
                boxShadow: '0 0 12px rgba(34,211,238,0.15)',
              }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50 flex-shrink-0">
              <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
                Centro de Inteligencia de Roles
              </p>
              <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content — scrollable */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-2 border-slate-800 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="p-6 space-y-4">

                  {/* ═══ HERO — Job Title full width ═══ */}
                  <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 p-5">
                    <p className="text-[9px] uppercase tracking-widest text-slate-600 font-medium">Cargo</p>
                    <h2 className="text-2xl font-bold text-white mt-1.5 leading-tight">
                      {formatDisplayName(position.jobTitle, 'full')}
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-2.5">
                      {position.departmentName} · {position.employeeCount} persona{position.employeeCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* ═══ PROPÓSITO — full width ═══ */}
                  <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 p-5">
                    <p className="text-[9px] uppercase tracking-widest text-slate-600 font-medium">Propósito</p>
                    <p className="text-sm text-slate-300 font-light mt-2 leading-relaxed">
                      {descriptor?.purpose || 'Sin propósito definido.'}
                    </p>
                  </div>

                  {/* ═══ RESPONSABILIDADES — full width, checklist ═══ */}
                  {topTasks.length > 0 && (
                    <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 p-5">
                      <p className="text-[9px] uppercase tracking-widest text-slate-600 font-medium">
                        Responsabilidades Clave
                      </p>
                      <div className="space-y-2.5 mt-3">
                        {topTasks.map(t => (
                          <div key={t.taskId} className="flex items-start gap-2.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span className="text-[11px] text-slate-300 font-light leading-snug line-clamp-2">
                              {t.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ═══ SKILLS — full width, barras gruesas ═══ */}
                  {competencies.length > 0 && (
                    <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 p-5">
                      <p className="text-[9px] uppercase tracking-widest text-slate-600 font-medium">
                        Skills Críticos
                      </p>
                      <div className="space-y-3.5 mt-3">
                        {competencies.slice(0, 5).map(c => {
                          const level = c.expectedLevel ?? 4
                          const pct = Math.round((level / 5) * 100)
                          return (
                            <div key={c.code}>
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="text-[11px] text-slate-300 font-light">{c.name}</span>
                                <span className="text-[10px] text-purple-400 tabular-nums font-medium ml-2">
                                  {pct}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-800 rounded-full">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ═══ OCUPANTES — pills ═══ */}
                  {position.employees.length > 0 && (
                    <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 p-5">
                      <p className="text-[9px] uppercase tracking-widest text-slate-600 font-medium">
                        Ocupantes ({position.employees.length})
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {position.employees.slice(0, 6).map(emp => (
                          <span key={emp.id} className="text-[10px] text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700/30 font-light">
                            ● {formatDisplayName(emp.fullName, 'short')}
                          </span>
                        ))}
                        {position.employees.length > 6 && (
                          <span className="text-[10px] text-slate-500 px-2.5 py-1">
                            + {position.employees.length - 6} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ═══ FOOTER — sutil, fuera del scroll ═══ */}
            {descriptor && (
              <div className="flex-shrink-0 px-6 py-3 border-t border-slate-800/40 bg-[#0F172A]/80">
                <p className="text-[10px] text-slate-600 font-light">
                  v1.0
                  {descriptor.confirmedAt && ` · Validado ${daysAgo(descriptor.confirmedAt)}`}
                </p>
                <p className="text-[9px] text-slate-700 mt-0.5">
                  {tasksKept} de {tasksTotal} tareas · {competencies.length} competencia{competencies.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
