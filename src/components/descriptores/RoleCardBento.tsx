'use client'

// ════════════════════════════════════════════════════════════════════════════
// ROLE CARD BENTO — Réplica fiel de referencia.jpg
// Panel sólido, secciones divididas por líneas finas, 2 columnas asimétricas
// [Title|Propósito] [Responsabilidades|Skills+Barras] [Estado footer]
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, ChevronRight } from 'lucide-react'
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
      .then(json => { if (json.success && json.data) setDescriptor(json.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [position])

  const topTasks = descriptor?.responsibilities
    ?.filter(t => t.isActive)
    ?.sort((a, b) => b.importance - a.importance)
    ?.slice(0, 5) ?? []

  const competenciesWithTarget = (descriptor?.competencies ?? [])
    .filter(c => c.expectedLevel != null)
    .slice(0, 5)

  return (
    <AnimatePresence>
      {position && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-[460px] h-full z-50 bg-[#131B2E] border-l border-[#1E293B] flex flex-col overflow-hidden"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-slate-800 border-t-cyan-400 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-y-auto">

                {/* ═══ ROW 1: Title (left 55%) | Propósito (right 45%) ═══ */}
                <div className="flex border-b border-[#1E293B]">
                  {/* Title */}
                  <div className="w-[55%] p-5 border-r border-[#1E293B]">
                    <p className="text-[10px] text-slate-500 mb-3">Job Title</p>
                    <h2 className="text-[22px] font-bold text-white leading-tight">
                      {formatDisplayName(position.jobTitle, 'full')}
                    </h2>
                  </div>
                  {/* Propósito */}
                  <div className="w-[45%] p-5">
                    <p className="text-[10px] text-slate-500 mb-3">
                      <span className="border-b border-purple-500/40 pb-0.5">Propósito</span>
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {descriptor?.purpose || 'Sin propósito definido.'}
                    </p>
                  </div>
                </div>

                {/* ═══ ROW 2: Responsabilidades (left 55%) | Skills (right 45%) ═══ */}
                <div className="flex flex-1 border-b border-[#1E293B]">
                  {/* Responsabilidades */}
                  <div className="w-[55%] p-5 border-r border-[#1E293B]">
                    <p className="text-[10px] text-slate-500 mb-3">Responsabilidades Clave</p>
                    {topTasks.map((t, idx) => (
                      <div
                        key={t.taskId}
                        className={`flex items-start gap-2 py-2 ${
                          idx < topTasks.length - 1 ? 'border-b border-[#1E293B]/60' : ''
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="text-[11px] text-slate-300 leading-snug flex-1 line-clamp-2">
                          {t.description}
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-700 flex-shrink-0 mt-0.5" />
                      </div>
                    ))}
                    {topTasks.length === 0 && (
                      <p className="text-[11px] text-slate-600 py-2">Sin responsabilidades</p>
                    )}
                  </div>

                  {/* Skills con barras */}
                  <div className="w-[45%] p-5 flex flex-col">
                    <p className="text-[10px] text-slate-500 mb-3">
                      <span className="border-b border-purple-500/40 pb-0.5">Skills Críticos</span>
                    </p>

                    {competenciesWithTarget.length > 0 ? (
                      <>
                        {/* Lista nombre + % */}
                        <div className="space-y-2.5 flex-1">
                          {competenciesWithTarget.map(c => (
                            <div key={c.code} className="flex justify-between items-center">
                              <span className="text-[11px] text-slate-300">{c.name}</span>
                              <span className="text-[10px] text-slate-500 tabular-nums ml-2">
                                {Math.round((c.expectedLevel! / 5) * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Barras apiladas debajo */}
                        <div className="space-y-1.5 mt-4 pt-3 border-t border-[#1E293B]/60">
                          {competenciesWithTarget.map(c => {
                            const pct = Math.round((c.expectedLevel! / 5) * 100)
                            return (
                              <div key={`b-${c.code}`} className="w-full h-[6px] bg-[#1E293B] rounded-full">
                                <div
                                  className="h-[6px] rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )
                          })}
                        </div>

                        {/* Fila de % debajo de barras */}
                        <div className="flex justify-between mt-1.5">
                          {competenciesWithTarget.map(c => (
                            <span key={`p-${c.code}`} className="text-[8px] text-slate-600 tabular-nums">
                              {Math.round((c.expectedLevel! / 5) * 100)}%
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-600">Sin nivel de exigencia definido</p>
                    )}
                  </div>
                </div>

                {/* ═══ ROW 3: Estado footer ═══ */}
                <div className="px-5 py-3 flex items-center justify-between flex-shrink-0 border-b border-[#1E293B]">
                  <p className="text-[10px] text-slate-500 font-medium">Estado</p>
                  <p className="text-[10px] text-slate-500">
                    v1.0{descriptor?.confirmedAt && ` · Validado ${daysAgo(descriptor.confirmedAt)}`}
                  </p>
                </div>

              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
