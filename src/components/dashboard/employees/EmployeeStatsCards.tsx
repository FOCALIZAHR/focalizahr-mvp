// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE STATS CARDS - VERSIÓN FINAL
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface TrackData {
  count: number
  percentage: number
}

interface StatsResponse {
  success: boolean
  stats: {
    totalActive: number
    delta: number
    byTrack: {
      ejecutivo: TrackData
      manager: TrackData
      colaborador: TrackData
    }
    insights: {
      avgTenure: number
      dominantLevel: string
    }
  }
}

interface AnalyticsResponse {
  success: boolean
  analytics: {
    trends: {
      months: Array<{ period: string; count: number; delta: number }>
    }
  }
}

const TRACKS = [
  { key: 'ejecutivo', label: 'Ejecutivos' },
  { key: 'manager', label: 'Managers' },
  { key: 'colaborador', label: 'Colaboradores' }
] as const

type TrackKey = 'ejecutivo' | 'manager' | 'colaborador'

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Tesla Line
// ════════════════════════════════════════════════════════════════════════════

const TeslaLine = memo(function TeslaLine({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700/50 to-slate-700" />
      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse" />
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-700/50 to-slate-700" />
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Track Item - MINIMALISTA
// ════════════════════════════════════════════════════════════════════════════

const TrackItem = memo(function TrackItem({
  label,
  data
}: {
  label: string
  data: TrackData
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-3xl md:text-4xl font-semibold text-white">
        {data.count}
      </p>
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mt-1">
        {label}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">
        {data.percentage}%
      </p>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function EmployeeStatsCards() {
  const [stats, setStats] = useState<StatsResponse['stats'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('focalizahr_token')
      
      // Fetch stats
      const res = await fetch('/api/admin/employees/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data: StatsResponse = await res.json()
      
      // Fetch analytics para obtener período
      const analyticsRes = await fetch('/api/admin/employees/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const analyticsData: AnalyticsResponse = await analyticsRes.json()
      
      if (data.success && data.stats) {
        setStats(data.stats)
        
        // Extraer período de trends
        if (analyticsData.success && analyticsData.analytics?.trends?.months?.[0]) {
          const period = analyticsData.analytics.trends.months[0].period
          // Formatear "2026-02" → "Febrero 2026"
          const [year, month] = period.split('-')
          const monthNames = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                             'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
          setLastUpdate(`${monthNames[parseInt(month)]} ${year}`)
        }
      } else {
        setError('Error al cargar')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-8">
        <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
        <button onClick={fetchStats} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="text-center">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 mb-3">
          Dotación Activa
        </p>

        {/* THE ROCK - ÚNICO gradiente */}
        <h1 className="text-7xl md:text-8xl font-bold bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent leading-none">
          {stats.totalActive}
        </h1>

        {/* Última actualización */}
        {lastUpdate && (
          <p className="text-[10px] text-slate-600 mt-2">
            Última actualización: {lastUpdate}
          </p>
        )}

        {stats.delta !== 0 && (
          <div className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full mt-3 text-xs border",
            stats.delta > 0 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          )}>
            {stats.delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {stats.delta > 0 ? '+' : ''}{stats.delta} este mes
          </div>
        )}
      </motion.div>

      <TeslaLine className="my-8" />

      <div className="grid grid-cols-3 gap-6 md:gap-12 max-w-sm mx-auto">
        {TRACKS.map((track, i) => (
          <motion.div
            key={track.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (i * 0.1) }}
          >
            <TrackItem 
              label={track.label} 
              data={stats.byTrack[track.key as TrackKey]} 
            />
          </motion.div>
        ))}
      </div>

      <TeslaLine className="my-8" />
    </div>
  )
})