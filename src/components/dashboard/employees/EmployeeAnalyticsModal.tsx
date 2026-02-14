// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE ANALYTICS MODAL - Design System FocalizaHR v2
// src/components/dashboard/employees/EmployeeAnalyticsModal.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Users, UserCheck,
  TrendingUp, TrendingDown, ChevronRight,
  AlertCircle, RefreshCw, Layers, Activity,
  Star, Target, Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { GhostButton } from '@/components/ui/PremiumButton'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface LevelData {
  level: string
  label: string
  count: number
  percentage: number
  withTeam: number
  withoutTeam: number
  avgTenure: number
  avgDirectReports: number
}

interface LeadershipData {
  totalManagers: number
  totalContributors: number
  avgDirectReports: number
  maxDirectReports: { name: string; count: number }
  leadershipRatio: string
  industryBenchmark: string
  healthStatus: 'OK' | 'WARNING' | 'CRITICAL'
}

interface TrendsData {
  months: Array<{ period: string; count: number; delta: number }>
  lastMonth: { hires: number; terminations: number; transfers: number; promotions: number }
}

interface InsightData {
  type: 'success' | 'warning' | 'info'
  text: string
}

interface AnalyticsResponse {
  success: boolean
  analytics: {
    byLevel: LevelData[]
    leadership: LeadershipData
    trends: TrendsData
    insights: InsightData[]
  }
}

interface EmployeeAnalyticsModalProps {
  open: boolean
  onClose: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const LEVEL_HIERARCHY_ORDER: Record<string, number> = {
  'gerente_director': 1,
  'subgerente_subdirector': 2,
  'jefe': 3,
  'supervisor_coordinador': 4,
  'profesional_analista': 5,
  'asistente_otros': 6,
  'operativo_auxiliar': 7
}

// Paleta FocalizaHR jerárquica: Purple (dirección) → Blue (mandos) → Cyan (técnicos) → Green (operativos)
const LEVEL_COLORS: Record<string, string> = {
  'gerente_director': 'var(--fhr-purple, #A78BFA)',
  'subgerente_subdirector': '#8B5CF6',
  'jefe': 'var(--fhr-blue, #3B82F6)',
  'supervisor_coordinador': '#06B6D4',
  'profesional_analista': 'var(--fhr-cyan, #22D3EE)',
  'asistente_otros': 'var(--fhr-success, #10B981)',
  'operativo_auxiliar': '#84CC16'
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: KPICard
// ════════════════════════════════════════════════════════════════════════════

interface KPICardProps {
  icon: React.ElementType
  value: string | number
  label: string
  sublabel?: string
}

const KPICard = memo(function KPICard({ icon: Icon, value, label, sublabel }: KPICardProps) {
  return (
    <div className="fhr-card p-4 md:p-5 flex flex-col items-center text-center">
      <Icon className="w-5 h-5 mb-2 text-[var(--fhr-cyan)]" />
      <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{label}</p>
      {sublabel && <p className="text-[10px] text-slate-600 mt-0.5">{sublabel}</p>}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: TeslaLine
// ════════════════════════════════════════════════════════════════════════════

const TeslaLine = memo(function TeslaLine() {
  return (
    <div className="fhr-divider my-6">
      <div className="flex items-center gap-4 px-6 md:px-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700/50 to-slate-700" />
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--fhr-cyan)] shadow-lg shadow-cyan-400/50" />
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-700/50 to-slate-700" />
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: LevelBar
// ════════════════════════════════════════════════════════════════════════════

const LevelBar = memo(function LevelBar({ level, maxCount }: { level: LevelData; maxCount: number }) {
  const color = LEVEL_COLORS[level.level] || 'var(--fhr-cyan)'
  const widthPercent = maxCount > 0 ? (level.count / maxCount) * 100 : 0

  return (
    <div className="group flex items-center gap-3 py-2">
      <div className="w-28 md:w-36 flex-shrink-0 text-right">
        <p className="text-xs md:text-sm text-slate-300 truncate group-hover:text-white transition-colors">
          {level.label}
        </p>
      </div>
      <div className="flex-1 h-7 bg-slate-800/60 rounded-lg overflow-hidden relative">
        <motion.div
          className="h-full rounded-lg"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${widthPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 rounded-lg opacity-30 blur-sm"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${widthPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <div className="w-20 md:w-24 flex-shrink-0 flex items-center gap-2">
        <span className="text-sm md:text-base font-semibold text-white">{level.count}</span>
        <span className="text-[10px] text-slate-500">({level.percentage}%)</span>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: InsightBadge
// ════════════════════════════════════════════════════════════════════════════

const InsightBadge = memo(function InsightBadge({ type, text }: InsightData) {
  const config = {
    success: { Icon: Star, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', textColor: 'text-emerald-300' },
    warning: { Icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', textColor: 'text-amber-300' },
    info: { Icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', textColor: 'text-cyan-300' }
  }
  const { Icon, color, bg, textColor } = config[type]

  return (
    <div className={cn("p-3 md:p-4 rounded-xl border", bg)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", color)} />
        <p className={cn("text-xs md:text-sm leading-relaxed", textColor)}>{text}</p>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: CollapsibleSection
// ════════════════════════════════════════════════════════════════════════════

const CollapsibleSection = memo(function CollapsibleSection({
  title, icon: Icon, children, defaultOpen = false
}: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="px-6 md:px-8">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between py-3 text-left group">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[var(--fhr-cyan)]" />
          </div>
          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{title}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: LeadershipDetail
// ════════════════════════════════════════════════════════════════════════════

const LeadershipDetail = memo(function LeadershipDetail({ data }: { data: LeadershipData }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="fhr-card-metric p-3 text-center">
        <Users className="w-4 h-4 text-[var(--fhr-cyan)] mx-auto mb-1" />
        <p className="text-lg font-semibold text-white">{data.totalManagers}</p>
        <p className="text-[10px] text-slate-500 uppercase">Managers</p>
      </div>
      <div className="fhr-card-metric p-3 text-center">
        <UserCheck className="w-4 h-4 text-[var(--fhr-cyan)] mx-auto mb-1" />
        <p className="text-lg font-semibold text-white">{data.totalContributors}</p>
        <p className="text-[10px] text-slate-500 uppercase">Colaboradores</p>
      </div>
      <div className="fhr-card-metric p-3 text-center">
        <Target className="w-4 h-4 text-[var(--fhr-cyan)] mx-auto mb-1" />
        <p className="text-lg font-semibold text-white">{data.avgDirectReports}</p>
        <p className="text-[10px] text-slate-500 uppercase">Prom. Reportes</p>
      </div>
      <div className="fhr-card-metric p-3 text-center">
        <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
        <p className="text-lg font-semibold text-white">{data.maxDirectReports.count}</p>
        <p className="text-[10px] text-slate-500 uppercase truncate" title={data.maxDirectReports.name}>
          Max ({data.maxDirectReports.name.split(' ')[0]})
        </p>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: TrendsDetail
// ════════════════════════════════════════════════════════════════════════════

const TrendsDetail = memo(function TrendsDetail({ trends }: { trends: TrendsData }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {trends.months.map((month, i) => (
          <motion.div key={month.period} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="fhr-card-metric flex-shrink-0 p-3 min-w-[100px] text-center">
            <p className="text-[10px] text-slate-500 uppercase">{month.period}</p>
            <p className="text-lg font-semibold text-white">{month.count}</p>
            <p className={cn("text-xs font-medium", month.delta >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {month.delta >= 0 ? '+' : ''}{month.delta}
            </p>
          </motion.div>
        ))}
      </div>
      <div className="fhr-card p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Último Import</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-300">Ingresos: <span className="text-white font-medium">{trends.lastMonth.hires}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <span className="text-sm text-slate-300">Bajas: <span className="text-white font-medium">{trends.lastMonth.terminations}</span></span>
          </div>
        </div>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: LoadingState
// ════════════════════════════════════════════════════════════════════════════

const LoadingState = memo(function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 rounded-full border-2 border-[var(--fhr-cyan)]/20 border-t-[var(--fhr-cyan)] animate-spin" />
      <p className="text-sm text-slate-500 mt-4">Cargando analytics...</p>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: ErrorState
// ════════════════════════════════════════════════════════════════════════════

const ErrorState = memo(function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-8">
      <AlertCircle className="w-10 h-10 text-rose-400 mb-4" />
      <p className="text-sm text-slate-400 mb-4">{message}</p>
      <GhostButton icon={RefreshCw} onClick={onRetry}>Reintentar</GhostButton>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function EmployeeAnalyticsModal({ open, onClose }: EmployeeAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<AnalyticsResponse['analytics'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchAnalytics = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('focalizahr_token')
      const res = await fetch('/api/admin/employees/analytics', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal
      })
      const data: AnalyticsResponse = await res.json()
      if (data.success && data.analytics) setAnalytics(data.analytics)
      else setError('Error al cargar analytics')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) fetchAnalytics()
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort() }
  }, [open, fetchAnalytics])

  // Métricas REALES calculadas
  const totalEmployees = analytics?.byLevel.reduce((sum, l) => sum + l.count, 0) ?? 0
  const maxLevelCount = analytics?.byLevel.reduce((max, l) => Math.max(max, l.count), 0) ?? 0
  const totalWithTeam = analytics?.byLevel.reduce((sum, l) => sum + l.withTeam, 0) ?? 0
  const totalWithoutTeam = totalEmployees - totalWithTeam
  const leaderPercentage = totalEmployees > 0 ? Math.round((totalWithTeam / totalEmployees) * 100) : 0
  const ratioValue = totalWithTeam > 0 ? (totalWithoutTeam / totalWithTeam).toFixed(1) : '0'

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] p-0 gap-0 bg-[var(--fhr-bg-primary,#0F172A)]/95 backdrop-blur-2xl border-slate-800" showCloseButton={false}>
        {/* HEADER */}
        <div className="p-5 md:p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-[var(--fhr-cyan)]" />
              </div>
              <h2 className="text-lg md:text-xl font-bold fhr-title-gradient">Analytics de Dotación</h2>
            </div>
            <GhostButton icon={X} onClick={onClose} size="sm">Cerrar</GhostButton>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={fetchAnalytics} /> : analytics ? (
            <>
              {/* KPIs HERO - Métricas REALES */}
              <section className="p-5 md:p-6">
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  <KPICard icon={Briefcase} value={totalEmployees} label="Dotación" sublabel="Activos" />
                  <KPICard icon={Users} value={`${leaderPercentage}%`} label="Líderes" sublabel="Con equipo" />
                  <KPICard icon={Target} value={`1:${ratioValue}`} label="Ratio" sublabel="Líder:Colab" />
                </div>
              </section>

              <TeslaLine />

              {/* DISTRIBUCIÓN POR NIVEL */}
              <section className="py-5 md:py-6 px-5 md:px-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Distribución por Nivel</h3>
                <div className="space-y-1">
                  {analytics.byLevel
                    .sort((a, b) => (LEVEL_HIERARCHY_ORDER[a.level] ?? 99) - (LEVEL_HIERARCHY_ORDER[b.level] ?? 99))
                    .map((level) => <LevelBar key={level.level} level={level} maxCount={maxLevelCount} />)}
                </div>
              </section>

              <TeslaLine />

              {/* INSIGHTS */}
              <section className="py-5 md:py-6 px-5 md:px-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Insights Automáticos</h3>
                <div className="grid grid-cols-1 gap-3">
                  {analytics.insights.map((insight, i) => <InsightBadge key={i} {...insight} />)}
                </div>
              </section>

              <TeslaLine />

              {/* DETALLE COLAPSABLE */}
              <section className="py-2">
                <CollapsibleSection title="Detalle de Liderazgo" icon={Users}>
                  <LeadershipDetail data={analytics.leadership} />
                </CollapsibleSection>
                <CollapsibleSection title="Tendencias Históricas" icon={Activity}>
                  <TrendsDetail trends={analytics.trends} />
                </CollapsibleSection>
              </section>

              <div className="h-4" />
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
})