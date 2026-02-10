# 🎯 TASK: Modal Diagnóstico de Evaluación

## 📋 METADATA
- **Fecha:** 9 Febrero 2026
- **Prioridad:** ALTA
- **Tipo:** Nueva Feature
- **Prerequisito:** TASK_EVALUATOR_CALIBRATION_LIVE_SYSTEM.md (ya ejecutada)
- **Afecta:** Header de Evaluación en `/ratings`

---

## ⚠️ NOTA IMPORTANTE SOBRE DISEÑO

```yaml
REGLA: Seguir filosofía de diseño FocalizaHR.

CONSULTAR ANTES DE IMPLEMENTAR:
  - GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md
  - FILOSOFIA_DISENO_FOCALIZAHR_v2.md
  - Componentes existentes: SpotlightCard, InsightCarousel, CinemaSummaryHeader

PATRONES FOCALIZAHR A USAR:
  - Glassmorphism (bg-[#0F172A]/90 backdrop-blur-2xl)
  - Línea Tesla superior (gradient cyan)
  - Bordes sutiles (border-white/5, border-slate-800)
  - Tipografía: tracking-widest en labels, font-mono en datos
  - Animaciones: framer-motion, transiciones suaves
```

---

## 🎯 OBJETIVO

Crear un modal que expanda el Header de Evaluación con análisis profundo y narrativa coherente. Al hacer clic en el header de 3 columnas, se abre un modal con el diagnóstico completo.

---

## 🏗️ ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER 3 COLUMNAS (ya implementado)                           │
│  ┌─────────────┬─────────────┬─────────────┐                   │
│  │ Distribución│ ADN Equipo  │Smart Feedback│                   │
│  └─────────────┴─────────────┴─────────────┘                   │
│                          │                                      │
│                    CLIC (affordance)                            │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              MODAL DIAGNÓSTICO                          │   │
│  │                                                         │   │
│  │  1. Heat Strip (distribución visual)                    │   │
│  │  2. Todas las competencias (ordenadas)                  │   │
│  │  3. Alertas de competencias críticas                    │   │
│  │  4. Insight ejecutivo narrativo                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 PARTE 1: AFFORDANCE DE CLIC EN HEADER

El header debe "invitar" al clic con estilo FocalizaHR premium.

### Comportamiento:

```yaml
IDLE (sin hover):
  - Card normal
  - Sin indicadores extras

HOVER:
  - Card sube 2px (translate-y-[-2px])
  - Borde brilla cyan sutil (shadow glow)
  - Aparece texto "Ver diagnóstico completo →" 
  - Cursor pointer

ACTIVE (click):
  - Scale 0.98 momentáneo
  - Abre modal
```

### Código Referencial:

```typescript
// Modificar EvaluationProfileHeader.tsx

export function EvaluationProfileHeader({ 
  desempeno, 
  teamDna,
  onOpenDiagnostic  // NUEVO: callback para abrir modal
}: EvaluationProfileHeaderProps) {
  
  return (
    <div 
      onClick={onOpenDiagnostic}
      className="
        group cursor-pointer
        grid grid-cols-12 gap-0 fhr-card overflow-hidden mb-8
        transition-all duration-300 ease-out
        hover:translate-y-[-2px]
        hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]
        hover:border-cyan-500/20
        active:scale-[0.99]
      "
    >
      {/* Contenido existente de las 3 columnas */}
      
      {/* Indicador de clic - aparece en hover */}
      <div className="
        absolute bottom-4 right-6
        flex items-center gap-2
        opacity-0 group-hover:opacity-100
        transition-all duration-300
        translate-x-2 group-hover:translate-x-0
      ">
        <span className="text-[10px] font-medium text-cyan-400/70 tracking-wide">
          Ver diagnóstico completo
        </span>
        <ChevronRight className="w-4 h-4 text-cyan-400/70" />
      </div>
    </div>
  )
}
```

---

## 🎨 PARTE 2: MODAL DE DIAGNÓSTICO

### Estructura Visual:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                    [X]  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🧠  DIAGNÓSTICO DE TU EVALUACIÓN                               │   │
│  │      9 colaboradores · Promedio 3.25 · σ 1.14                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  DISTRIBUCIÓN DE TU EQUIPO                                             │
│                                                                         │
│    Bajo            Medio              Alto                             │
│      │               │                  │                              │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │ ░░░░░░▒▒▒▒▒▒████████████████████▓▓▓▓▓▓░░░░                  │     │
│  └──────────────────────────────────────────────────────────────┘     │
│    1.0           2.0           3.0           4.0           5.0        │
│                                 ▲                                      │
│                            x̄ 3.25                                      │
│                                                                         │
│    "Concentración saludable en rango medio-alto. Buena                 │
│     diferenciación entre niveles de desempeño."                        │
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  COMPETENCIAS DE TU EQUIPO                                             │
│                                                                         │
│    Orientación a Resultados                                            │
│    ████████████████████████████████░░░░░░░░  3.5 / 5.0    🏆          │
│                                                                         │
│    Trabajo en Equipo                                                   │
│    ██████████████████████████████░░░░░░░░░░  3.2 / 5.0                │
│                                                                         │
│    Innovación                                                          │
│    ████████████████████████░░░░░░░░░░░░░░░░  3.0 / 5.0                │
│                                                                         │
│    Liderazgo                                                           │
│    ██████████████████████░░░░░░░░░░░░░░░░░░  2.9 / 5.0                │
│                                                                         │
│    Comunicación Efectiva                                               │
│    ██████████████████████░░░░░░░░░░░░░░░░░░  2.9 / 5.0    ⚠️          │
│                                                                         │
│    Gap top-bottom: 0.6 pts (moderado)                                  │
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  💡 INSIGHT EJECUTIVO                                           │   │
│  │                                                                 │   │
│  │  "Tu equipo tiene una base sólida en Orientación a Resultados,  │   │
│  │   lo que indica cultura de logro. El área de desarrollo está    │   │
│  │   en Comunicación Efectiva - considera un workshop de           │   │
│  │   comunicación asertiva para Q2.                                │   │
│  │                                                                 │   │
│  │   Tu estilo de evaluación es saludable: diferencias bien        │   │
│  │   entre alto y bajo desempeño, facilitando la calibración."     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                                                    [ Cerrar ]          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 PARTE 3: HEAT STRIP COMPONENT

### Visualización de Distribución:

```typescript
// Componente: HeatStrip.tsx

interface HeatStripProps {
  distribution: number[]  // 5 buckets [0-20, 20-40, 40-60, 60-80, 80-100] en %
  average: number         // Promedio (1-5)
  stdDev: number          // Desviación estándar
}

export function HeatStrip({ distribution, average, stdDev }: HeatStripProps) {
  // Normalizar distribution para intensidad de color
  const maxValue = Math.max(...distribution)
  
  // Generar gradiente basado en distribución
  // Más personas en un rango = color más intenso
  
  return (
    <div className="space-y-4">
      {/* Labels superiores */}
      <div className="flex justify-between text-[10px] text-white/40 uppercase tracking-widest">
        <span>Bajo</span>
        <span>Medio</span>
        <span>Alto</span>
      </div>
      
      {/* Heat Strip */}
      <div className="relative">
        <div className="h-8 rounded-lg overflow-hidden flex">
          {distribution.map((value, index) => {
            // Calcular intensidad basada en cantidad
            const intensity = maxValue > 0 ? value / maxValue : 0
            
            return (
              <div
                key={index}
                className="flex-1 transition-all duration-500"
                style={{
                  // NOTA: Usar variables CSS del design system
                  backgroundColor: `rgba(var(--fhr-primary-rgb), ${0.1 + intensity * 0.6})`,
                }}
              />
            )
          })}
        </div>
        
        {/* Marcador de promedio */}
        <div 
          className="absolute top-full mt-1"
          style={{ left: `${((average - 1) / 4) * 100}%` }}
        >
          <div className="flex flex-col items-center -translate-x-1/2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 
              border-transparent border-b-cyan-400" 
            />
            <span className="text-[10px] font-mono font-bold text-cyan-400 mt-1">
              x̄ {average.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Escala numérica */}
      <div className="flex justify-between text-[9px] text-white/30 font-mono pt-4">
        <span>1.0</span>
        <span>2.0</span>
        <span>3.0</span>
        <span>4.0</span>
        <span>5.0</span>
      </div>
    </div>
  )
}
```

---

## 🎨 PARTE 4: LISTA DE COMPETENCIAS

### Con indicadores visuales:

```typescript
interface CompetencyListProps {
  competencies: Array<{
    code: string
    name: string
    avgScore: number
  }>
  topCode: string   // Código de la fortaleza
  lowCode: string   // Código del área de desarrollo
}

export function CompetencyList({ 
  competencies, 
  topCode, 
  lowCode 
}: CompetencyListProps) {
  
  // Ordenar por score descendente
  const sorted = [...competencies].sort((a, b) => b.avgScore - a.avgScore)
  
  // Calcular gap
  const gap = sorted.length > 1 
    ? sorted[0].avgScore - sorted[sorted.length - 1].avgScore 
    : 0
  
  return (
    <div className="space-y-4">
      {sorted.map((comp, index) => {
        const isTop = comp.code === topCode
        const isLow = comp.code === lowCode
        const isCritical = comp.avgScore < 2.5
        const percent = (comp.avgScore / 5) * 100
        
        return (
          <div key={comp.code} className="space-y-2">
            {/* Nombre y badges */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">{comp.name}</span>
              <div className="flex items-center gap-2">
                {isTop && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full 
                    bg-emerald-500/20 text-emerald-400 font-medium">
                    🏆 Fortaleza
                  </span>
                )}
                {isLow && !isCritical && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full 
                    bg-amber-500/20 text-amber-400 font-medium">
                    ⚠️ Desarrollo
                  </span>
                )}
                {isCritical && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full 
                    bg-red-500/20 text-red-400 font-medium animate-pulse">
                    🔴 Crítico
                  </span>
                )}
              </div>
            </div>
            
            {/* Barra de progreso */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={cn(
                    "h-full rounded-full",
                    isTop && "fhr-progress-bar-primary",
                    isLow && !isCritical && "fhr-progress-bar-warning",
                    isCritical && "fhr-progress-bar-critical",
                    !isTop && !isLow && !isCritical && "fhr-progress-bar-neutral"
                  )}
                />
              </div>
              <span className="text-xs font-mono text-white/60 w-16 text-right">
                {comp.avgScore.toFixed(1)} / 5.0
              </span>
            </div>
          </div>
        )
      })}
      
      {/* Gap indicator */}
      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/40">Gap entre top y bottom</span>
          <span className={cn(
            "font-mono font-medium",
            gap < 0.5 && "text-emerald-400",
            gap >= 0.5 && gap < 1.0 && "text-amber-400",
            gap >= 1.0 && "text-red-400"
          )}>
            {gap.toFixed(1)} pts 
            ({gap < 0.5 ? 'bajo' : gap < 1.0 ? 'moderado' : 'alto'})
          </span>
        </div>
      </div>
    </div>
  )
}
```

---

## 🎨 PARTE 5: ALERTA DE COMPETENCIA CRÍTICA

Si hay competencias < 2.5, mostrar alerta especial:

```typescript
interface CriticalAlertProps {
  competencies: Array<{ name: string, avgScore: number }>
}

export function CriticalCompetencyAlert({ competencies }: CriticalAlertProps) {
  const critical = competencies.filter(c => c.avgScore < 2.5)
  
  if (critical.length === 0) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-red-400 mb-1">
            Atención Requerida
          </h4>
          <p className="text-[12px] text-white/60 leading-relaxed">
            {critical.length === 1 ? (
              <>
                <strong className="text-red-400">{critical[0].name}</strong> está 
                en nivel crítico ({critical[0].avgScore.toFixed(1)}). Esto puede 
                impactar el desempeño general del equipo.
              </>
            ) : (
              <>
                Las competencias{' '}
                {critical.map((c, i) => (
                  <span key={c.name}>
                    <strong className="text-red-400">{c.name}</strong>
                    {i < critical.length - 2 ? ', ' : i === critical.length - 2 ? ' y ' : ''}
                  </span>
                ))}{' '}
                requieren atención inmediata.
              </>
            )}
          </p>
          <p className="text-[11px] text-white/40 mt-2 italic">
            💡 Sugerencia: Programa conversaciones 1:1 focalizadas en estas áreas.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
```

---

## 🎨 PARTE 6: MODAL COMPLETO

### Componente Principal:

```typescript
// Componente: EvaluationDiagnosticModal.tsx

'use client'

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, TrendingUp, Users } from 'lucide-react'
import { HeatStrip } from './HeatStrip'
import { CompetencyList } from './CompetencyList'
import { CriticalCompetencyAlert } from './CriticalCompetencyAlert'
import { 
  EvaluationStatus, 
  getCoachMessage,
  generateTeamInsight 
} from '@/lib/utils/evaluatorStatsEngine'

interface EvaluationDiagnosticModalProps {
  isOpen: boolean
  onClose: () => void
  data: {
    desempeno: {
      status: EvaluationStatus
      avg: number
      stdDev: number
      count: number
      distribution: number[]
    }
    competencies: Array<{
      code: string
      name: string
      avgScore: number
    }>
    teamDna: {
      top: { code: string, name: string, avgScore: number }
      low: { code: string, name: string, avgScore: number }
    } | null
  }
}

export default memo(function EvaluationDiagnosticModal({
  isOpen,
  onClose,
  data
}: EvaluationDiagnosticModalProps) {
  
  const { desempeno, competencies, teamDna } = data
  
  // Generar insight narrativo completo
  const executiveInsight = generateExecutiveInsight(
    desempeno,
    competencies,
    teamDna
  )
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 
              md:-translate-x-1/2 md:-translate-y-1/2
              md:w-full md:max-w-2xl md:max-h-[85vh]
              bg-[#0A0E1A]/95 backdrop-blur-2xl 
              border border-white/10 rounded-2xl 
              shadow-2xl z-50 overflow-hidden
              flex flex-col"
          >
            {/* Línea Tesla superior */}
            <div 
              className="absolute top-0 left-0 right-0 h-px z-10"
              style={{
                background: 'linear-gradient(90deg, transparent, var(--fhr-primary), transparent)'
              }}
            />
            
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 
                    flex items-center justify-center">
                    <Brain className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Diagnóstico de tu Evaluación
                    </h2>
                    <p className="text-[12px] text-white/50 mt-0.5">
                      {desempeno.count} colaboradores · 
                      Promedio {desempeno.avg.toFixed(2)} · 
                      σ {desempeno.stdDev.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10
                    flex items-center justify-center text-white/40 hover:text-white
                    transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Sección 1: Distribución */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 fhr-text-primary" />
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                    Distribución de tu Equipo
                  </h3>
                </div>
                
                <HeatStrip
                  distribution={desempeno.distribution}
                  average={desempeno.avg}
                  stdDev={desempeno.stdDev}
                />
                
                <p className="text-[12px] text-white/50 mt-4 italic leading-relaxed">
                  "{getDistributionMessage(desempeno)}"
                </p>
              </section>
              
              {/* Sección 2: Competencias */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 fhr-text-secondary" />
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                    Competencias de tu Equipo
                  </h3>
                </div>
                
                {/* Alerta crítica si aplica */}
                <CriticalCompetencyAlert competencies={competencies} />
                
                <CompetencyList
                  competencies={competencies}
                  topCode={teamDna?.top.code || ''}
                  lowCode={teamDna?.low.code || ''}
                />
              </section>
              
              {/* Sección 3: Insight Ejecutivo */}
              <section>
                <div className="p-6 rounded-xl fhr-gradient-subtle border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] fhr-text-primary font-black uppercase tracking-widest">
                      💡 Insight Ejecutivo
                    </span>
                  </div>
                  <p className="text-[13px] text-white/80 leading-relaxed font-medium italic">
                    "{executiveInsight}"
                  </p>
                </div>
              </section>
              
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-white/5 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl fhr-btn-secondary text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getDistributionMessage(desempeno: { status: EvaluationStatus, avg: number, stdDev: number }): string {
  const { status, stdDev, avg } = desempeno
  
  if (status === 'OPTIMA') {
    return `Concentración saludable en rango ${avg >= 3.5 ? 'alto' : avg >= 2.5 ? 'medio-alto' : 'medio'}. Buena diferenciación entre niveles de desempeño (σ ${stdDev.toFixed(2)}).`
  }
  
  if (status === 'CENTRAL') {
    return `Las notas se concentran excesivamente en el centro (σ ${stdDev.toFixed(2)}). Considera diferenciar más entre alto y bajo desempeño.`
  }
  
  if (status === 'SEVERA') {
    return `Promedio bajo (${avg.toFixed(2)}). La mayoría de tu equipo está en el rango inferior. Revisa si los estándares son apropiados.`
  }
  
  return `Promedio alto (${avg.toFixed(2)}). La mayoría de tu equipo está en el rango superior. Considera si estás diferenciando suficientemente.`
}

function generateExecutiveInsight(
  desempeno: { status: EvaluationStatus, avg: number, stdDev: number },
  competencies: Array<{ name: string, avgScore: number }>,
  teamDna: { top: { name: string }, low: { name: string } } | null
): string {
  const parts: string[] = []
  
  // Parte 1: Fortaleza del equipo
  if (teamDna) {
    parts.push(
      `Tu equipo tiene una base sólida en ${teamDna.top.name}, lo que indica ${
        teamDna.top.name.toLowerCase().includes('resultado') ? 'cultura de logro' :
        teamDna.top.name.toLowerCase().includes('equipo') ? 'buena colaboración' :
        teamDna.top.name.toLowerCase().includes('innovación') ? 'mentalidad de mejora continua' :
        'una competencia clave bien desarrollada'
      }.`
    )
  }
  
  // Parte 2: Área de desarrollo
  if (teamDna) {
    const critical = competencies.filter(c => c.avgScore < 2.5)
    if (critical.length > 0) {
      parts.push(
        `⚠️ Atención: ${critical.map(c => c.name).join(' y ')} ${critical.length > 1 ? 'requieren' : 'requiere'} intervención inmediata.`
      )
    } else {
      parts.push(
        `El área de desarrollo está en ${teamDna.low.name} - considera un workshop o capacitación focalizada para Q2.`
      )
    }
  }
  
  // Parte 3: Estilo de evaluación
  if (desempeno.status === 'OPTIMA') {
    parts.push(
      'Tu estilo de evaluación es saludable: diferencias bien entre alto y bajo desempeño, facilitando la calibración posterior.'
    )
  } else if (desempeno.status === 'CENTRAL') {
    parts.push(
      'Tip: Intenta usar más el rango completo de la escala para diferenciar mejor el desempeño de tu equipo.'
    )
  }
  
  return parts.join(' ')
}
```

---

## 📊 DATOS REQUERIDOS DEL ENDPOINT

El endpoint `/api/evaluator/stats` ya devuelve `distribution[]`, pero necesitamos agregar `competencies[]`:

```typescript
// Agregar a la respuesta del endpoint

interface EvaluatorStatsResponse {
  // ... campos existentes ...
  
  competencies: Array<{
    code: string
    name: string
    avgScore: number
  }>
}

// En el endpoint, agregar:
const competencyAvgs = await calculateAllCompetencyAverages(cycleId, evaluatorId)

return {
  // ... campos existentes ...
  competencies: competencyAvgs
}
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Affordance de Clic:
- [ ] Header tiene hover:translate-y-[-2px]
- [ ] Border brilla cyan en hover
- [ ] Texto "Ver diagnóstico completo →" aparece en hover
- [ ] Cursor es pointer
- [ ] Click abre modal

### Modal:
- [ ] Backdrop oscuro con blur
- [ ] Modal centrado en desktop, fullscreen en mobile
- [ ] Línea Tesla superior visible
- [ ] Scroll interno funciona
- [ ] Botón X cierra modal
- [ ] Click en backdrop cierra modal
- [ ] ESC cierra modal

### Heat Strip:
- [ ] Muestra 5 segmentos con intensidad variable
- [ ] Marcador de promedio posicionado correctamente
- [ ] Labels "Bajo / Medio / Alto" visibles
- [ ] Escala 1.0 - 5.0 visible

### Competencias:
- [ ] Ordenadas de mayor a menor score
- [ ] Badge "🏆 Fortaleza" en la top
- [ ] Badge "⚠️ Desarrollo" en la bottom
- [ ] Badge "🔴 Crítico" si score < 2.5 (con pulse)
- [ ] Barras animadas al abrir modal
- [ ] Gap indicator muestra diferencia

### Alerta Crítica:
- [ ] Aparece solo si hay competencia < 2.5
- [ ] Mensaje personalizado según cantidad
- [ ] Sugerencia de acción incluida

### Insight Ejecutivo:
- [ ] Narrativa coherente y completa
- [ ] Menciona fortaleza del equipo
- [ ] Menciona área de desarrollo
- [ ] Incluye recomendación de acción
- [ ] Comenta sobre estilo de evaluación

---

## 📚 REFERENCIAS

- `src/components/performance/summary/InsightCarousel.tsx` - Patrón de animaciones
- `src/components/evaluator/cinema/SpotlightCard.tsx` - Patrón glassmorphism
- `GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md` - Design system
- `FILOSOFIA_DISENO_FOCALIZAHR_v2.md` - Principios de diseño
