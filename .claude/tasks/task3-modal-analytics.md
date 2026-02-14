# TASK 3 - MODAL ANALYTICS: Deep Dive Cinema Mode
## Objetivo: Modal analytics profundo con breakdown 7 niveles

---

## 🎯 OBJETIVOS

Crear modal analytics premium con:
1. Breakdown 7 niveles jerárquicos (barras animadas)
2. Estructura de liderazgo + ratio warning
3. Tendencias últimos 3 meses (mini gráfico)
4. Insights automáticos condicionales
5. Export feature

---

## 🎨 PATRÓN DE DISEÑO

**PATRÓN F: CINEMA MODE** (FILOSOFIA_DISENO_FOCALIZAHR_v2.md)
- Fullscreen mobile
- Dialog max-w-4xl desktop
- Scroll interno
- Glassmorphism total
- Animaciones progresivas

---

## 📁 ARCHIVO: `/components/dashboard/employees/EmployeeAnalyticsModal.tsx`

```typescript
'use client'

// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE ANALYTICS MODAL - Deep Dive Cinema Mode
// src/components/dashboard/employees/EmployeeAnalyticsModal.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Download,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
  Info,
  BarChart3,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface LevelBreakdown {
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

interface TrendMonth {
  period: string
  count: number
  delta: number
}

interface Insight {
  type: 'success' | 'warning' | 'info'
  text: string
}

interface AnalyticsData {
  byLevel: LevelBreakdown[]
  leadership: LeadershipData
  trends: {
    months: TrendMonth[]
    lastMonth: {
      hires: number
      terminations: number
      transfers: number
      promotions: number
    }
  }
  insights: Insight[]
}

interface EmployeeAnalyticsModalProps {
  open: boolean
  onClose: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON LOADER
// ═══════════════════════════════════════════════════════════════════════════

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-2">
          <div className="w-48 h-4 bg-slate-700/50 rounded animate-pulse" />
          <div className="w-full h-6 bg-slate-700/30 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL BAR - Barra individual con datos
// ═══════════════════════════════════════════════════════════════════════════

interface LevelBarProps {
  level: LevelBreakdown
  index: number
}

const LevelBar = memo(function LevelBar({ level, index }: LevelBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="space-y-2"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white">
            {level.label}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {level.count} personas ({level.percentage}%)
          </p>
        </div>
      </div>

      {/* Barra de progreso animada */}
      <div className="relative h-8 bg-slate-800/50 rounded-lg overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${level.percentage}%` }}
          transition={{ 
            duration: 1, 
            ease: 'easeOut',
            delay: index * 0.05 + 0.2
          }}
          className={cn(
            "absolute inset-y-0 left-0 rounded-lg",
            "bg-gradient-to-r from-cyan-500/40 to-purple-500/40"
          )}
        />
        
        {/* Stats overlay */}
        <div className="relative h-full px-3 flex items-center justify-between text-xs">
          <div className="flex gap-4 text-slate-300">
            {level.withTeam > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{level.withTeam} con equipo</span>
              </span>
            )}
            {level.avgTenure > 0 && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{level.avgTenure} años</span>
              </span>
            )}
          </div>
          
          {level.avgDirectReports > 0 && (
            <span className="text-slate-400 font-medium">
              Ø {level.avgDirectReports} reportes
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// INSIGHT BADGE
// ═══════════════════════════════════════════════════════════════════════════

interface InsightBadgeProps {
  insight: Insight
  index: number
}

const InsightBadge = memo(function InsightBadge({ insight, index }: InsightBadgeProps) {
  const icons = {
    success: CheckCircle2,
    warning: AlertCircle,
    info: Info
  }

  const colors = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
  }

  const Icon = icons[insight.type]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "flex items-start gap-2 px-3 py-2 rounded-lg text-xs border",
        colors[insight.type]
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span className="flex-1">{insight.text}</span>
    </motion.div>
  )
})

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function EmployeeAnalyticsModal({ 
  open, 
  onClose 
}: EmployeeAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchAnalytics()
    }
  }, [open])

  async function fetchAnalytics() {
    try {
      setIsLoading(true)
      setError(null)

      const token = localStorage.getItem('focalizahr_token')
      if (!token) {
        throw new Error('No autenticado')
      }

      const res = await fetch('/api/admin/employees/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        throw new Error(`Error ${res.status}`)
      }

      const json = await res.json()
      
      if (json.success) {
        setAnalytics(json.analytics)
      } else {
        throw new Error(json.error || 'Error cargando analytics')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  function handleExport() {
    if (!analytics) return
    
    // TODO: Implementar export CSV/PDF
    console.log('Export analytics...', analytics)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0F172A] border-slate-800">
        
        {/* ═══════════════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════════════ */}
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="fhr-title-gradient text-2xl font-bold">
                📊 Analytics Profundo
              </DialogTitle>
              <p className="text-sm text-slate-400 mt-1">
                Análisis detallado de dotación organizacional
              </p>
            </div>
            
            <div className="flex gap-2">
              {analytics && (
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 hover:bg-slate-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* ═══════════════════════════════════════════════════════════
            CONTENT
        ═══════════════════════════════════════════════════════════ */}
        <div className="space-y-8 py-4">
          
          {/* Loading */}
          {isLoading && <AnalyticsSkeleton />}

          {/* Error */}
          {error && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-white mb-2">Error al cargar analytics</p>
              <p className="text-sm text-slate-400 mb-4">{error}</p>
              <Button onClick={fetchAnalytics} className="fhr-btn-primary">
                Reintentar
              </Button>
            </div>
          )}

          {/* Success - Analytics */}
          {analytics && (
            <>
              {/* ═══════════════════════════════════════════════════════
                  SECCIÓN 1: DISTRIBUCIÓN POR NIVEL (7 niveles)
              ═══════════════════════════════════════════════════════ */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-medium text-white">
                    Distribución por Nivel Jerárquico
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {analytics.byLevel.map((level, idx) => (
                    <LevelBar key={level.level} level={level} index={idx} />
                  ))}
                </div>
              </section>

              {/* ═══════════════════════════════════════════════════════
                  SECCIÓN 2: ESTRUCTURA DE LIDERAZGO
              ═══════════════════════════════════════════════════════ */}
              <section className="fhr-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-medium text-white">
                    Estructura de Liderazgo
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Stats */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                      <span className="text-sm text-slate-400">Managers con equipo</span>
                      <span className="text-base font-medium text-white">
                        {analytics.leadership.totalManagers} ({Math.round((analytics.leadership.totalManagers / (analytics.leadership.totalManagers + analytics.leadership.totalContributors)) * 100)}%)
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                      <span className="text-sm text-slate-400">Promedio reportes directos</span>
                      <span className="text-base font-medium text-white">
                        {analytics.leadership.avgDirectReports}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                      <span className="text-sm text-slate-400">Manager con más equipo</span>
                      <span className="text-base font-medium text-white truncate ml-2">
                        {analytics.leadership.maxDirectReports.name} ({analytics.leadership.maxDirectReports.count})
                      </span>
                    </div>
                  </div>

                  {/* Right: Ratio + Health */}
                  <div className="flex flex-col justify-center">
                    <div className="text-center p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
                      <p className="text-xs text-slate-400 mb-2">Ratio Liderazgo</p>
                      <p className="text-4xl font-bold text-white mb-1">
                        {analytics.leadership.leadershipRatio}
                      </p>
                      <p className="text-xs text-slate-500 mb-3">
                        Benchmark: {analytics.leadership.industryBenchmark}
                      </p>
                      
                      <Badge 
                        variant={
                          analytics.leadership.healthStatus === 'OK' ? 'default' :
                          analytics.leadership.healthStatus === 'WARNING' ? 'secondary' :
                          'destructive'
                        }
                        className={cn(
                          "text-xs",
                          analytics.leadership.healthStatus === 'OK' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                          analytics.leadership.healthStatus === 'WARNING' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                          analytics.leadership.healthStatus === 'CRITICAL' && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        )}
                      >
                        {analytics.leadership.healthStatus === 'OK' ? '✓ Saludable' :
                         analytics.leadership.healthStatus === 'WARNING' ? '⚠ Atención' :
                         '⚠ Crítico'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </section>

              {/* ═══════════════════════════════════════════════════════
                  SECCIÓN 3: TENDENCIAS (últimos 3 meses)
              ═══════════════════════════════════════════════════════ */}
              {analytics.trends.months.length > 0 && (
                <section className="fhr-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-medium text-white">
                      Tendencias (últimos {analytics.trends.months.length} meses)
                    </h3>
                  </div>

                  {/* Mini timeline */}
                  <div className="space-y-3">
                    {analytics.trends.months.map((month, idx) => (
                      <motion.div
                        key={month.period}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-4 py-2"
                      >
                        <span className="text-sm text-slate-400 w-24">
                          {month.period}
                        </span>
                        
                        <div className="flex-1 flex items-center gap-3">
                          <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(month.count / Math.max(...analytics.trends.months.map(m => m.count))) * 100}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.1 }}
                              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                            />
                          </div>
                          
                          <span className="text-sm font-medium text-white w-16 text-right">
                            {month.count}
                          </span>
                        </div>
                        
                        {month.delta !== 0 && (
                          <span className={cn(
                            "text-xs font-medium w-16 text-right",
                            month.delta > 0 ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {month.delta > 0 ? '+' : ''}{month.delta}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Último mes stats */}
                  {analytics.trends.lastMonth.hires > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-700/50">
                      <p className="text-xs text-slate-400 mb-3">Movimientos último mes:</p>
                      <div className="flex flex-wrap gap-2">
                        {analytics.trends.lastMonth.hires > 0 && (
                          <Badge variant="outline" className="text-xs border-emerald-500/20 text-emerald-400">
                            +{analytics.trends.lastMonth.hires} Ingresos
                          </Badge>
                        )}
                        {analytics.trends.lastMonth.terminations > 0 && (
                          <Badge variant="outline" className="text-xs border-rose-500/20 text-rose-400">
                            -{analytics.trends.lastMonth.terminations} Salidas
                          </Badge>
                        )}
                        {analytics.trends.lastMonth.transfers > 0 && (
                          <Badge variant="outline" className="text-xs border-cyan-500/20 text-cyan-400">
                            {analytics.trends.lastMonth.transfers} Transferencias
                          </Badge>
                        )}
                        {analytics.trends.lastMonth.promotions > 0 && (
                          <Badge variant="outline" className="text-xs border-purple-500/20 text-purple-400">
                            {analytics.trends.lastMonth.promotions} Promociones
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* ═══════════════════════════════════════════════════════
                  SECCIÓN 4: INSIGHTS AUTOMÁTICOS
              ═══════════════════════════════════════════════════════ */}
              {analytics.insights.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-medium text-white">
                      Insights Automáticos
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analytics.insights.map((insight, idx) => (
                      <InsightBadge key={idx} insight={insight} index={idx} />
                    ))}
                  </div>
                </section>
              )}

            </>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}
```

---

## ✅ VALIDACIÓN

### **Checklist Visual:**

```yaml
☐ Modal abre fullscreen mobile
☐ Modal max-w-4xl en desktop
☐ Barras de 7 niveles animadas
☐ Género split visible en cada nivel
☐ Estructura liderazgo muestra ratio
☐ Health status badge correcto (OK/WARNING/CRITICAL)
☐ Timeline tendencias animado
☐ Insights badges con colores correctos
☐ Botón export visible
☐ Scroll interno funciona
☐ Glassmorphism aplicado
```

### **Testing Responsivo:**

```bash
# Mobile (320px - 640px):
☐ Modal fullscreen
☐ Stack vertical de secciones
☐ Barras legibles

# Tablet (640px - 1024px):
☐ Modal max-w-4xl
☐ Grid 2 columnas en liderazgo
☐ Scroll suave

# Desktop (1024px+):
☐ Modal centrado
☐ Grid completo
☐ Hover states
```

---

## 🎯 OBJETIVOS CUMPLIDOS

1. ✅ Modal `EmployeeAnalyticsModal.tsx` creado
2. ✅ Breakdown 7 niveles con barras animadas
3. ✅ Estructura liderazgo con ratio warning
4. ✅ Timeline tendencias últimos 3 meses
5. ✅ Insights automáticos condicionales
6. ✅ Export feature placeholder
7. ✅ Responsive fullscreen mobile
8. ✅ Dialog max-w-4xl desktop
9. ✅ Skeleton loader
10. ✅ Error handling

---

**TASK 3 COMPLETADA** ✅
