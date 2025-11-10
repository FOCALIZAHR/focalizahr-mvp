'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'
import EXOScoreGauge from '@/components/onboarding/EXOScoreGauge'
import OnboardingTimeline from '@/components/onboarding/OnboardingTimeline'
import { useOnboardingMetrics, type OnboardingMetrics } from '@/hooks/useOnboardingMetrics'

function isMetricsArray(data: OnboardingMetrics | OnboardingMetrics[] | null): data is OnboardingMetrics[] {
  return Array.isArray(data)
}

function isMetricsObject(data: OnboardingMetrics | OnboardingMetrics[] | null): data is OnboardingMetrics {
  return data !== null && !Array.isArray(data)
}

export default function OnboardingDashboard() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  
  const { data: rawData, loading, error, refetch } = useOnboardingMetrics(
    selectedDepartment === 'all' ? undefined : selectedDepartment
  )

  let metrics: OnboardingMetrics | null = null
  
  if (isMetricsArray(rawData)) {
    metrics = rawData.length > 0 ? rawData[0] : null
  } else if (isMetricsObject(rawData)) {
    metrics = rawData
  }

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto border-2 border-slate-800 border-t-cyan-400 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Cargando métricas...</p>
        </div>
      </div>
    )
  }

  // ERROR
  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 max-w-md text-center space-y-4">
          <p className="text-red-400 text-lg font-medium">Error al cargar datos</p>
          <p className="text-sm text-slate-500">{error}</p>
          <button 
            onClick={() => refetch()}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // EMPTY
  if (!metrics) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 max-w-md text-center space-y-3">
          <p className="text-slate-300 text-lg font-medium">Sin journeys activos</p>
          <p className="text-sm text-slate-500">No hay procesos de onboarding en curso.</p>
        </div>
      </div>
    )
  }

  const timelineStages = [
    { day: 1, label: 'Compliance', completed: 0, total: metrics.totalJourneys, avgScore: metrics.avgComplianceScore },
    { day: 7, label: 'Clarificación', completed: 0, total: metrics.totalJourneys, avgScore: metrics.avgClarificationScore },
    { day: 30, label: 'Cultura', completed: 0, total: metrics.totalJourneys, avgScore: metrics.avgCultureScore },
    { day: 90, label: 'Conexión', completed: 0, total: metrics.totalJourneys, avgScore: metrics.avgConnectionScore }
  ]

  const avgProgressPercentage = metrics.totalJourneys > 0
    ? (metrics.activeJourneys / metrics.totalJourneys) * 100
    : 0

  const avgResponseTime = 0

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        
        {/* HERO - EXACTO COMO ENCUESTA PREMIUM */}
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-extralight text-white tracking-tight">
              Onboarding Intelligence
            </h1>
            <p className="text-xl text-slate-400 font-light">
              Seguimiento predictivo de integración organizacional
            </p>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="flex items-center justify-center gap-3">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-80 h-12 bg-slate-900/50 border-slate-800 text-slate-300 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">📊 Todos los departamentos</SelectItem>
              <SelectItem value="ventas">💰 Ventas</SelectItem>
              <SelectItem value="marketing">📢 Marketing</SelectItem>
              <SelectItem value="desarrollo">💻 Desarrollo</SelectItem>
              <SelectItem value="rrhh">👥 RRHH</SelectItem>
              <SelectItem value="operaciones">⚙️ Operaciones</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={() => refetch()}
            className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* KPI CARDS - COMO TU SCREENSHOT (números gigantes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-6 space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
              Journeys Activos
            </p>
            <p className="text-6xl font-extralight text-white tabular-nums">
              {metrics.totalJourneys}
            </p>
            <p className="text-sm text-slate-400">
              {metrics.activeJourneys} en progreso
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-6 space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
              Progreso Promedio
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-6xl font-extralight text-white tabular-nums">
                {avgProgressPercentage.toFixed(0)}
              </p>
              <span className="text-2xl text-cyan-400 font-light">%</span>
            </div>
            <p className="text-sm text-slate-400">
              Completitud general
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-6 space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
              Tiempo Respuesta
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-6xl font-extralight text-white tabular-nums">
                {avgResponseTime.toFixed(1)}
              </p>
              <span className="text-2xl text-cyan-400 font-light">h</span>
            </div>
            <p className="text-sm text-slate-400">
              Promedio respuesta
            </p>
          </div>

          {/* Card 4 */}
          <div className={`bg-slate-900/30 border rounded-lg p-6 space-y-3 ${
            metrics.criticalAlerts > 0 
              ? 'border-red-500/50 border-l-4 border-l-red-500' 
              : 'border-slate-800/50'
          }`}>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
              Alertas Críticas
            </p>
            <p className={`text-6xl font-extralight tabular-nums ${
              metrics.criticalAlerts > 0 ? 'text-red-400' : 'text-white'
            }`}>
              {metrics.criticalAlerts}
            </p>
            <Badge 
              variant={metrics.criticalAlerts > 0 ? "destructive" : "secondary"}
              className="text-xs font-normal"
            >
              {metrics.criticalAlerts === 0 ? 'Sin alertas' : 'Requiere atención'}
            </Badge>
          </div>
        </div>

        {/* GAUGE + TIMELINE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <EXOScoreGauge 
              score={metrics.avgEXOScore} 
              label="EXO Score Global"
              size="lg"
            />
          </div>

          <div className="lg:col-span-2">
            <OnboardingTimeline 
              stages={timelineStages}
              totalJourneys={metrics.totalJourneys}
            />
          </div>
        </div>

        {/* MÉTRICAS DETALLADAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Completitud */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800/50">
              <h3 className="text-base font-medium text-slate-200">Completitud por Etapa</h3>
            </div>
            <div className="p-6 space-y-5">
              {timelineStages.map(stage => {
                const completionRate = stage.total > 0 ? (stage.completed / stage.total) * 100 : 0
                return (
                  <div key={stage.day} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 font-light">
                        Día {stage.day} · {stage.label}
                      </span>
                      <span className="text-slate-500 font-mono text-xs">
                        {stage.completed}/{stage.total}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/50 rounded-full h-1.5">
                      <div 
                        className="h-1.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-700"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Scores */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800/50">
              <h3 className="text-base font-medium text-slate-200">Scores Promedio por Etapa</h3>
            </div>
            <div className="p-6 space-y-4">
              {timelineStages.map(stage => (
                <div key={stage.day} className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-300 font-light">
                    Día {stage.day} · {stage.label}
                  </span>
                  {stage.avgScore !== null ? (
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-extralight tabular-nums ${
                        stage.avgScore >= 80 ? 'text-green-400' :
                        stage.avgScore >= 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {stage.avgScore.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500">/ 100</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-600">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="pt-8 border-t border-slate-800/50 text-center space-y-1">
          <p className="text-sm text-slate-500">
            Última actualización: <span className="text-slate-400">{new Date(metrics.updatedAt).toLocaleString('es-CL')}</span>
          </p>
          {metrics.department && (
            <p className="text-sm text-slate-500">
              Departamento: <span className="text-cyan-400">{metrics.department.displayName}</span>
            </p>
          )}
        </div>

      </div>
    </div>
  )
}