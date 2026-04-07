'use client'

// ════════════════════════════════════════════════════════════════════════════
// ROLE CARD — Vista Bento Box del descriptor confirmado
// Premium read-only view: purpose + top responsibilities + competencies
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Target,
  ListChecks,
  Sparkles,
  Users,
  ArrowLeft,
} from 'lucide-react'
import { formatDisplayName } from '@/lib/utils/formatName'
import { SecondaryButton } from '@/components/ui/PremiumButton'

// ── Types ──

interface RoleCardTask {
  taskId: string
  description: string
  importance: number
  isActive: boolean
}

interface RoleCardCompetency {
  code: string
  name: string
  description?: string | null
  behaviors?: string[]
  category?: string | null
  expectedLevel?: number | null
}

interface RoleCardProps {
  jobTitle: string
  purpose: string | null
  responsibilities: RoleCardTask[]
  competencies: RoleCardCompetency[]
  employeeCount: number
  departmentName: string | null
  confirmedAt: string | null
  matchConfidence: string | null
  onBack: () => void
}

// ── Helpers ──

const CATEGORY_LABELS: Record<string, string> = {
  CORE: 'Core',
  LEADERSHIP: 'Liderazgo',
  STRATEGIC: 'Estratégica',
  TECHNICAL: 'Técnica',
}

function daysAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'hace 1 día'
  return `hace ${diff} días`
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

// ── Expandable competency ──

function CompetencyItem({ c }: { c: RoleCardCompetency }) {
  const [open, setOpen] = useState(false)
  const hasBehaviors = c.behaviors && c.behaviors.length > 0

  return (
    <div className="group">
      <button
        onClick={() => hasBehaviors && setOpen(!open)}
        className="w-full flex items-center gap-3 py-2.5 text-left"
        disabled={!hasBehaviors}
      >
        <div className="w-1 h-1 rounded-full bg-cyan-400/50 flex-shrink-0" />
        <span className="text-sm font-light text-slate-300 flex-1">{c.name}</span>
        {c.category && (
          <span className="text-[9px] text-slate-600 font-light px-1.5 py-0.5 rounded border border-slate-800/40">
            {CATEGORY_LABELS[c.category] ?? c.category}
          </span>
        )}
        {hasBehaviors && (
          open
            ? <ChevronDown className="w-3 h-3 text-slate-600" />
            : <ChevronRight className="w-3 h-3 text-slate-600" />
        )}
      </button>
      {open && hasBehaviors && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pl-4 pb-3 space-y-1"
        >
          {c.description && (
            <p className="text-[11px] text-slate-500 font-light mb-2">{c.description}</p>
          )}
          {c.behaviors!.map((b, i) => (
            <p key={i} className="text-[11px] text-slate-400/80 font-light flex gap-2">
              <span className="text-cyan-500/30 mt-px">•</span>
              {b}
            </p>
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ── Main Component ──

export default memo(function RoleCard({
  jobTitle,
  purpose,
  responsibilities,
  competencies,
  employeeCount,
  departmentName,
  confirmedAt,
  matchConfidence,
  onBack,
}: RoleCardProps) {
  const activeTasks = responsibilities.filter(t => t.isActive)
  const topTasks = activeTasks
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 6)

  const displayTitle = formatDisplayName(jobTitle, 'full')

  return (
    <div className="space-y-4">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-[11px]"
      >
        <ArrowLeft className="w-3 h-3" />
        Volver al catálogo
      </button>

      {/* ═══ HERO BLOCK ═══ */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl border border-slate-800/40 overflow-hidden"
      >
        {/* Tesla line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE 40%, #A78BFA 60%, transparent)',
            boxShadow: '0 0 12px rgba(34,211,238,0.15)',
          }}
        />

        <div className="bg-slate-900/50 backdrop-blur-xl px-8 py-10 md:px-12 md:py-14">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-cyan-500/20 bg-cyan-500/5 text-cyan-400">
              <CheckCircle className="w-3 h-3" />
              Confirmado
            </span>
            {matchConfidence === 'HIGH' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] text-purple-400/60 border border-purple-500/10">
                <Sparkles className="w-2.5 h-2.5" />
                Alta coincidencia
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            {displayTitle}
          </h1>

          {/* Purpose */}
          {purpose && (
            <p className="text-base text-slate-400 font-light leading-relaxed mt-4 max-w-2xl">
              {purpose}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 mt-6 text-xs text-slate-500 font-light">
            <span className="flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              {employeeCount} persona{employeeCount !== 1 ? 's' : ''}
            </span>
            {departmentName && (
              <span>{departmentName}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ BENTO GRID ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── LEFT: Top Responsibilities ── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-slate-800/40 bg-slate-900/30 backdrop-blur-sm p-6 md:p-8"
        >
          <div className="flex items-center gap-2 mb-5">
            <ListChecks className="w-4 h-4 text-cyan-400/50" />
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
              Responsabilidades principales
            </p>
          </div>

          <div className="space-y-0">
            {topTasks.map((t, idx) => (
              <div key={t.taskId} className="flex gap-3 py-2.5 border-b border-slate-800/20 last:border-0">
                <span className="text-[11px] text-slate-600 font-light tabular-nums w-4 text-right flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-sm font-light text-slate-300 leading-relaxed">
                  {t.description}
                </p>
              </div>
            ))}
          </div>

          {activeTasks.length > 6 && (
            <p className="text-[10px] text-slate-600 font-light mt-4">
              + {activeTasks.length - 6} responsabilidades más
            </p>
          )}
        </motion.div>

        {/* ── RIGHT: Competencies ── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-slate-800/40 bg-slate-900/30 backdrop-blur-sm p-6 md:p-8"
        >
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-purple-400/50" />
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
              Competencias
            </p>
          </div>

          {competencies.length > 0 ? (
            <div className="divide-y divide-slate-800/20">
              {competencies.map(c => (
                <CompetencyItem key={c.code} c={c} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600 font-light">
              Sin competencias asignadas.
            </p>
          )}
        </motion.div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-center justify-between px-2 py-3"
      >
        <p className="text-[10px] text-slate-600 font-light">
          v1.0
          {confirmedAt && ` · Confirmado ${daysAgo(confirmedAt)}`}
          {` · ${employeeCount} persona${employeeCount !== 1 ? 's' : ''}`}
        </p>
        <SecondaryButton onClick={onBack}>
          Volver al catálogo
        </SecondaryButton>
      </motion.div>
    </div>
  )
})
