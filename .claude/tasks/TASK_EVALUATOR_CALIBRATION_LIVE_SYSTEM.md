# 🎯 TASK: Sistema de Calibración en Vivo - Testigos y Header de Evaluación

## 📋 METADATA
- **Fecha:** 9 Febrero 2026
- **Prioridad:** ALTA
- **Tipo:** Nueva Feature
- **Afecta:** Panel principal `/evaluaciones` + Página `/ratings`

---

## ⚠️ NOTA IMPORTANTE SOBRE COLORES

```yaml
REGLA: NO hardcodear colores específicos.

USAR:
  - Clases del design system FocalizaHR (fhr-*, focaliza-*)
  - Variables CSS definidas en el proyecto
  - Semántica: success, warning, info, neutral

CONSULTAR ANTES DE IMPLEMENTAR:
  - GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md
  - FILOSOFIA_DISENO_FOCALIZAHR_v2.md
  - globals.css / tailwind.config.js del proyecto

Los ejemplos de código en esta TASK son REFERENCIALES.
Code debe adaptar los colores según el design system existente.
```

---

## 🎯 OBJETIVO

Implementar un sistema de retroalimentación en vivo que muestre al jefe cómo se está clasificando su conjunto de evaluaciones mientras evalúa a su equipo.

**PRINCIPIO CLAVE:** NO juzgamos al evaluador como persona. Clasificamos el CONJUNTO DE DATOS de la evaluación.

```yaml
CORRECTO:   "La evaluación presenta Tendencia Central"
INCORRECTO: "Eres un evaluador Consolidado"
```

---

## 🏗️ ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────────┐
│  PANEL PRINCIPAL (/evaluaciones)                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              GAUGE CIRCULAR (existente)                  │   │
│  │                      75%                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  "Evaluaciones completadas. Asigna potencial a 1"              │
│                                                                 │
│       • ED: ÓPTIMA          |          • PT: CENTRAL           │
│       (testigos minimalistas - clic navega a /ratings)         │
│                                                                 │
│  [TU EQUIPO]                                    [VER EQUIPO]   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ clic en testigos
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PÁGINA /ratings (Monitor en Vivo - Detalle)                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  HEADER 3 COLUMNAS (EvaluationProfileHeader)            │   │
│  │                                                         │   │
│  │  COL 1         │  COL 2          │  COL 3              │   │
│  │  Distribución  │  ADN Equipo     │  Smart Feedback     │   │
│  │  σ + coach     │  Top/Low comp   │  Insight dinámico   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LISTA DE EVALUADOS (existente)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 LÓGICA DE CLASIFICACIÓN

### 4 Estados Posibles

```yaml
ÓPTIMA:
  - Término completo: "Evaluación Óptima"
  - Condición: σ >= 0.5 AND σ <= 1.2 AND promedio >= 2.5 AND promedio <= 4.0
  - Tooltip: "Distribución saludable. Los datos distinguen claramente entre alto y bajo desempeño."
  - Semántica visual: ÉXITO

CENTRAL:
  - Término completo: "Tendencia Central"
  - Condición: σ < 0.5
  - Tooltip: "Poca diferenciación. Las notas se agrupan excesivamente en el medio."
  - Semántica visual: NEUTRAL/INFO

SEVERA:
  - Término completo: "Sesgo de Severidad"
  - Condición: promedio < 2.5
  - Tooltip: "Promedio bajo. La evaluación está concentrada en el rango inferior de la escala."
  - Semántica visual: ALERTA

INDULGENTE:
  - Término completo: "Sesgo de Indulgencia"
  - Condición: promedio > 4.0
  - Tooltip: "Promedio inusualmente alto. Los datos sugieren una sobrevaloración generalizada."
  - Semántica visual: ALERTA
```

### Orden de Evaluación (Prioridad)

```typescript
function classifyEvaluation(scores: number[]): EvaluationStatus {
  if (scores.length < 2) return 'OPTIMA' // No hay suficientes datos
  
  const avg = calculateAverage(scores)
  const stdDev = calculateStdDev(scores)
  
  // Orden de prioridad en clasificación
  if (stdDev < 0.5) return 'CENTRAL'      // Primero: poca variación
  if (avg < 2.5) return 'SEVERA'          // Segundo: promedio muy bajo
  if (avg > 4.0) return 'INDULGENTE'      // Tercero: promedio muy alto
  return 'OPTIMA'                          // Default: distribución saludable
}
```

---

## 🔧 IMPLEMENTACIÓN

### 1. ENDPOINT BACKEND

**Archivo:** `src/app/api/evaluator/stats/route.ts`

```typescript
// GET /api/evaluator/stats?cycleId=xxx

interface EvaluatorStatsResponse {
  success: boolean
  data: {
    desempeno: {
      status: 'OPTIMA' | 'CENTRAL' | 'SEVERA' | 'INDULGENTE'
      avg: number
      stdDev: number
      count: number
      distribution: number[] // 5 buckets: [1-2, 2-3, 3-4, 4-5, 5] en porcentaje
    }
    potencial: {
      status: 'OPTIMA' | 'CENTRAL' | 'SEVERA' | 'INDULGENTE'
      avg: number
      stdDev: number
      count: number
      distribution: number[]
    } | null  // null si no hay evaluaciones de potencial aún
    teamDna: {
      top: { code: string, name: string, avgScore: number }
      low: { code: string, name: string, avgScore: number }
    } | null  // null si no hay competencias
  }
}
```

**Lógica del Endpoint:**

```typescript
export async function GET(request: NextRequest) {
  // 1. Extraer contexto del usuario
  const userContext = extractUserContext(request)
  const cycleId = searchParams.get('cycleId')
  
  // 2. Obtener evaluaciones del jefe (MANAGER_TO_EMPLOYEE)
  const assignments = await prisma.evaluationAssignment.findMany({
    where: {
      cycleId,
      evaluatorId: userContext.employeeId, // El jefe logueado
      evaluationType: 'MANAGER_TO_EMPLOYEE',
      status: 'COMPLETED'
    },
    include: {
      participant: {
        include: {
          responses: {
            select: {
              normalizedScore: true,
              questionId: true
            }
          }
        }
      }
    }
  })
  
  // 3. Extraer scores de DESEMPEÑO
  const desempenoScores: number[] = []
  for (const assignment of assignments) {
    const responses = assignment.participant?.responses || []
    const scores = responses
      .map(r => r.normalizedScore)
      .filter((s): s is number => s !== null)
    
    if (scores.length > 0) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
      desempenoScores.push(avgScore)
    }
  }
  
  // 4. Calcular stats de desempeño
  const desempeno = calculateStats(desempenoScores)
  
  // 5. Obtener scores de POTENCIAL (desde performance_ratings)
  const ratings = await prisma.performanceRating.findMany({
    where: {
      cycleId,
      potentialScore: { not: null },
      potentialRatedBy: userContext.userId // Solo los que el jefe evaluó
    },
    select: { potentialScore: true }
  })
  
  const potencialScores = ratings
    .map(r => r.potentialScore)
    .filter((s): s is number => s !== null)
  
  const potencial = potencialScores.length > 0 
    ? calculateStats(potencialScores)
    : null
  
  // 6. Calcular Team DNA (competencias top/low)
  const teamDna = await calculateTeamDna(assignments)
  
  return NextResponse.json({
    success: true,
    data: { desempeno, potencial, teamDna }
  })
}

// Helper: Calcular estadísticas
function calculateStats(scores: number[]) {
  if (scores.length === 0) {
    return { status: 'OPTIMA', avg: 0, stdDev: 0, count: 0, distribution: [0,0,0,0,0] }
  }
  
  const count = scores.length
  const avg = scores.reduce((a, b) => a + b, 0) / count
  const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / count
  const stdDev = Math.sqrt(variance)
  
  // Clasificar
  let status: EvaluationStatus = 'OPTIMA'
  if (stdDev < 0.5) status = 'CENTRAL'
  else if (avg < 2.5) status = 'SEVERA'
  else if (avg > 4.0) status = 'INDULGENTE'
  
  // Distribución en 5 buckets (porcentajes)
  const buckets = [0, 0, 0, 0, 0]
  for (const score of scores) {
    if (score <= 1.5) buckets[0]++
    else if (score <= 2.5) buckets[1]++
    else if (score <= 3.5) buckets[2]++
    else if (score <= 4.5) buckets[3]++
    else buckets[4]++
  }
  const distribution = buckets.map(b => Math.round((b / count) * 100))
  
  return {
    status,
    avg: Number(avg.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    count,
    distribution
  }
}

// Helper: Calcular Team DNA
async function calculateTeamDna(assignments: any[]) {
  // Agrupar scores por competencia
  const competencyScores: Record<string, { name: string, scores: number[] }> = {}
  
  for (const assignment of assignments) {
    const responses = assignment.participant?.responses || []
    for (const response of responses) {
      if (!response.normalizedScore || !response.questionId) continue
      
      // Obtener competencia de la pregunta
      const question = await prisma.question.findUnique({
        where: { id: response.questionId },
        select: { competencyCode: true, competencyName: true }
      })
      
      if (question?.competencyCode) {
        if (!competencyScores[question.competencyCode]) {
          competencyScores[question.competencyCode] = {
            name: question.competencyName || question.competencyCode,
            scores: []
          }
        }
        competencyScores[question.competencyCode].scores.push(response.normalizedScore)
      }
    }
  }
  
  // Calcular promedios por competencia
  const competencyAvgs = Object.entries(competencyScores).map(([code, data]) => ({
    code,
    name: data.name,
    avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length
  }))
  
  if (competencyAvgs.length === 0) return null
  
  // Ordenar y obtener top/low
  const sorted = competencyAvgs.sort((a, b) => b.avgScore - a.avgScore)
  
  return {
    top: sorted[0],
    low: sorted[sorted.length - 1]
  }
}
```

---

### 2. STATS ENGINE (Utilidades Frontend)

**Archivo:** `src/lib/utils/evaluatorStatsEngine.ts`

```typescript
// ══════════════════════════════════════════════════════════════════════════
// EVALUATOR STATS ENGINE
// Lógica de clasificación y helpers para UI
// ══════════════════════════════════════════════════════════════════════════

export type EvaluationStatus = 'OPTIMA' | 'CENTRAL' | 'SEVERA' | 'INDULGENTE'

export interface StatusConfig {
  label: string
  fullTerm: string
  tooltip: string
  semanticType: 'success' | 'info' | 'warning' | 'neutral'
}

export const STATUS_CONFIG: Record<EvaluationStatus, StatusConfig> = {
  OPTIMA: {
    label: 'ÓPTIMA',
    fullTerm: 'Evaluación Óptima',
    tooltip: 'Distribución saludable. Los datos distinguen claramente entre alto y bajo desempeño.',
    semanticType: 'success'
  },
  CENTRAL: {
    label: 'CENTRAL',
    fullTerm: 'Tendencia Central',
    tooltip: 'Poca diferenciación. Las notas se agrupan excesivamente en el medio.',
    semanticType: 'info'
  },
  SEVERA: {
    label: 'SEVERA',
    fullTerm: 'Sesgo de Severidad',
    tooltip: 'Promedio bajo. La evaluación está concentrada en el rango inferior de la escala.',
    semanticType: 'warning'
  },
  INDULGENTE: {
    label: 'INDULGENTE',
    fullTerm: 'Sesgo de Indulgencia',
    tooltip: 'Promedio inusualmente alto. Los datos sugieren una sobrevaloración generalizada.',
    semanticType: 'warning'
  }
}

/**
 * Obtiene el mensaje de coach según el estado
 */
export function getCoachMessage(status: EvaluationStatus): string {
  const messages: Record<EvaluationStatus, string> = {
    OPTIMA: 'Distribución saludable. Estás diferenciando el talento correctamente.',
    CENTRAL: 'Tendencia central detectada. Las notas se agrupan demasiado; considera diferenciar más.',
    SEVERA: 'Promedio bajo detectado. Revisa si los estándares son realistas para el contexto.',
    INDULGENTE: 'Promedio alto detectado. Considera si la escala se está utilizando completamente.'
  }
  return messages[status]
}

/**
 * Genera el insight narrativo dinámico
 */
export function generateTeamInsight(
  status: EvaluationStatus,
  topCompetency: string | null,
  lowCompetency: string | null
): string {
  const statusText = status === 'OPTIMA' 
    ? 'una distribución saludable' 
    : STATUS_CONFIG[status].fullTerm.toLowerCase()
  
  let insight = `El conjunto de datos presenta ${statusText}.`
  
  if (topCompetency && lowCompetency) {
    insight += ` El equipo destaca en ${topCompetency}, mientras que el área de desarrollo prioritaria es ${lowCompetency}.`
  } else if (topCompetency) {
    insight += ` El equipo destaca en ${topCompetency}.`
  }
  
  return insight
}

/**
 * Determina si el estado requiere atención visual (pulse)
 */
export function requiresAttention(status: EvaluationStatus): boolean {
  return status !== 'OPTIMA'
}

/**
 * IMPORTANTE: Esta función debe implementarse consultando GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR
 * 
 * Retorna las clases CSS del design system FocalizaHR para cada tipo semántico.
 * NO hardcodear colores aquí - usar las variables/clases definidas en el design system.
 * 
 * @param semanticType - 'success' | 'info' | 'warning' | 'neutral'
 * @returns Objeto con clases CSS para text, bg, bgBar, bgPing, led
 */
export function getSemanticColorClass(semanticType: 'success' | 'info' | 'warning' | 'neutral') {
  // IMPLEMENTAR consultando GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR
  // Ejemplo de estructura esperada:
  // return {
  //   text: 'text-fhr-success' o clase equivalente del design system,
  //   bg: 'bg-fhr-success' o clase equivalente,
  //   bgBar: 'bg-fhr-success/40' o clase equivalente,
  //   bgPing: 'bg-fhr-success-ping' o clase equivalente,
  //   led: 'fhr-led-success' o clase equivalente con shadow
  // }
  
  // Code debe implementar esto según el design system existente
  throw new Error('Implementar consultando GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR')
}
```

---

### 3. COMPONENTE: DashboardIndicators (Testigos)

**Archivo:** `src/components/performance/DashboardIndicators.tsx`

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  EvaluationStatus, 
  STATUS_CONFIG, 
  requiresAttention 
} from '@/lib/utils/evaluatorStatsEngine'

interface DashboardIndicatorsProps {
  edStatus: EvaluationStatus | null
  ptStatus: EvaluationStatus | null
  cycleId: string
}

/**
 * Testigos minimalistas tipo BMW/Tesla
 * Muestran el estado de la evaluación en vivo
 */
export function DashboardIndicators({ 
  edStatus, 
  ptStatus,
  cycleId 
}: DashboardIndicatorsProps) {
  const router = useRouter()
  
  // No mostrar si no hay datos de desempeño
  if (!edStatus) return null
  
  const handleClick = () => {
    router.push(`/dashboard/performance/cycles/${cycleId}/ratings`)
  }
  
  return (
    <div 
      onClick={handleClick}
      className="flex items-center justify-center gap-8 py-4 cursor-pointer 
        hover:opacity-80 transition-opacity select-none"
      role="button"
      aria-label="Ver detalles de evaluación"
    >
      {/* Testigo Desempeño */}
      <StatusIndicator 
        label="ED" 
        fullLabel="Desempeño"
        status={edStatus} 
      />
      
      {/* Separador */}
      <div className="w-px h-4 bg-white/10" />
      
      {/* Testigo Potencial (solo si existe) */}
      {ptStatus && (
        <StatusIndicator 
          label="PT" 
          fullLabel="Potencial"
          status={ptStatus} 
        />
      )}
    </div>
  )
}

interface StatusIndicatorProps {
  label: string
  fullLabel: string
  status: EvaluationStatus
}

function StatusIndicator({ label, fullLabel, status }: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status]
  const needsAttention = requiresAttention(status)
  
  // IMPORTANTE: Obtener clases de color del design system FocalizaHR
  // Consultar GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR para mapear semanticType a clases
  const colorClass = getSemanticColorClass(config.semanticType)
  
  return (
    <div 
      className="group flex items-center gap-3 relative"
      title={config.tooltip}
    >
      {/* LED Indicator */}
      <div className="relative flex h-2 w-2">
        {needsAttention && (
          <span 
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              colorClass.bgPing
            )}
          />
        )}
        <span 
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            colorClass.led
          )}
        />
      </div>
      
      {/* Label */}
      <div className="flex flex-col">
        <span className="text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase">
          {label}
        </span>
        <span className={cn("text-[10px] font-mono font-medium tracking-wider", colorClass.text)}>
          {config.label}
        </span>
      </div>
      
      {/* Tooltip on hover */}
      <div 
        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 p-3 
          bg-slate-950 border border-slate-800 rounded-xl shadow-2xl 
          opacity-0 group-hover:opacity-100 transition-all duration-200 
          pointer-events-none z-50 translate-y-2 group-hover:translate-y-0"
      >
        <div className="flex items-center gap-2 mb-1 border-b border-slate-800 pb-1">
          <span className="text-[10px] font-bold text-slate-300 uppercase">
            {config.fullTerm}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          {config.tooltip}
        </p>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 
          border-4 border-transparent border-t-slate-950" 
        />
      </div>
    </div>
  )
}
```

---

### 4. COMPONENTE: EvaluationProfileHeader (3 Columnas)

**Archivo:** `src/components/performance/EvaluationProfileHeader.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import { BarChart3, Zap, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  EvaluationStatus,
  STATUS_CONFIG,
  getCoachMessage,
  generateTeamInsight
} from '@/lib/utils/evaluatorStatsEngine'

interface EvaluationProfileHeaderProps {
  desempeno: {
    status: EvaluationStatus
    avg: number
    stdDev: number
    count: number
    distribution: number[]
  }
  teamDna: {
    top: { code: string, name: string, avgScore: number }
    low: { code: string, name: string, avgScore: number }
  } | null
}

export function EvaluationProfileHeader({ 
  desempeno, 
  teamDna 
}: EvaluationProfileHeaderProps) {
  const config = STATUS_CONFIG[desempeno.status]
  
  // Calcular porcentajes para barras de competencias
  const topPercent = teamDna ? Math.round((teamDna.top.avgScore / 5) * 100) : 0
  const lowPercent = teamDna ? Math.round((teamDna.low.avgScore / 5) * 100) : 0
  
  return (
    <div className="grid grid-cols-12 gap-0 fhr-card overflow-hidden mb-8">
      
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* COL 1: DISTRIBUCIÓN DE DATOS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="col-span-4 p-8 border-r border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 size={16} className="fhr-text-primary" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
            Distribución de Datos
          </span>
        </div>
        
        {/* Status + Histograma */}
        <div className="flex items-end gap-6 mb-6">
          {/* Mini Histograma */}
          <div className="flex items-end gap-1.5 h-12">
            {desempeno.distribution.map((percent, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(percent, 5)}%` }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "w-2.5 rounded-t-sm",
                  // IMPORTANTE: Usar helper que consulta design system FocalizaHR
                  getSemanticColorClass(config.semanticType).bgBar
                )}
              />
            ))}
          </div>
          
          {/* σ Display */}
          <div>
            <div className={cn(
              "text-2xl font-black font-mono tracking-tighter",
              // IMPORTANTE: Usar helper que consulta design system FocalizaHR
              getSemanticColorClass(config.semanticType).text
            )}>
              σ {desempeno.stdDev}
            </div>
            <div className="text-[9px] uppercase text-white/30 tracking-widest">
              Desviación Estándar
            </div>
          </div>
        </div>
        
        {/* Coach Message */}
        <p className="text-[11px] text-white/50 leading-relaxed italic 
          border-l-2 border-white/10 pl-4">
          "{getCoachMessage(desempeno.status)}"
        </p>
        
        {/* Stats pequeños */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-white/5">
          <div>
            <span className="text-[9px] text-white/30 uppercase">Promedio</span>
            <div className="text-sm font-mono font-bold text-white/70">
              {desempeno.avg}
            </div>
          </div>
          <div>
            <span className="text-[9px] text-white/30 uppercase">Evaluados</span>
            <div className="text-sm font-mono font-bold text-white/70">
              {desempeno.count}
            </div>
          </div>
        </div>
      </div>
      
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* COL 2: ADN DEL EQUIPO */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="col-span-4 p-8 border-r border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3 mb-8">
          <Zap size={16} className="fhr-text-secondary" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
            ADN del Equipo
          </span>
        </div>
        
        {teamDna ? (
          <div className="space-y-6">
            {/* Fortaleza */}
            <div>
              <div className="flex justify-between text-[10px] mb-2 font-bold uppercase tracking-tighter">
                <span className="fhr-text-primary">Fortaleza</span>
                <span className="text-white/60">{teamDna.top.name}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${topPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full fhr-progress-bar-primary"
                  // NOTA: Usar clase del design system para barra con glow
                />
              </div>
              <div className="text-[9px] text-white/30 mt-1 text-right">
                {teamDna.top.avgScore.toFixed(1)} / 5.0
              </div>
            </div>
            
            {/* Área de Desarrollo */}
            <div>
              <div className="flex justify-between text-[10px] mb-2 font-bold uppercase tracking-tighter">
                <span className="fhr-text-secondary">Área de Desarrollo</span>
                <span className="text-white/60">{teamDna.low.name}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${lowPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full fhr-progress-bar-secondary"
                  // NOTA: Usar clase del design system para barra secundaria
                />
              </div>
              <div className="text-[9px] text-white/30 mt-1 text-right">
                {teamDna.low.avgScore.toFixed(1)} / 5.0
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">
            Sin datos de competencias
          </div>
        )}
      </div>
      
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* COL 3: SMART FEEDBACK */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="col-span-4 p-8 flex flex-col justify-center fhr-gradient-subtle">
        <div className="p-6 rounded-xl bg-black/40 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="fhr-text-primary" />
            <span className="text-[10px] fhr-text-primary font-black uppercase tracking-widest">
              Smart Feedback
            </span>
          </div>
          <p className="text-[12px] text-white/80 leading-relaxed font-medium italic">
            "{generateTeamInsight(
              desempeno.status,
              teamDna?.top.name || null,
              teamDna?.low.name || null
            )}"
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

### 5. INTEGRACIÓN EN PÁGINAS

#### 5.1 Panel Principal (`/evaluaciones`)

```typescript
// En el componente del panel principal, después del gauge y mensaje

import { DashboardIndicators } from '@/components/performance/DashboardIndicators'
import useSWR from 'swr'

// Dentro del componente:
const { data: stats } = useSWR(
  cycleId ? `/api/evaluator/stats?cycleId=${cycleId}` : null,
  fetcher
)

// En el JSX, después de "Evaluaciones completadas...":
{stats?.data && (
  <DashboardIndicators
    edStatus={stats.data.desempeno?.status || null}
    ptStatus={stats.data.potencial?.status || null}
    cycleId={cycleId}
  />
)}
```

#### 5.2 Página `/ratings`

```typescript
// En la página de ratings, antes de la lista

import { EvaluationProfileHeader } from '@/components/performance/EvaluationProfileHeader'
import useSWR from 'swr'

// Dentro del componente:
const { data: stats } = useSWR(
  cycleId ? `/api/evaluator/stats?cycleId=${cycleId}` : null,
  fetcher
)

// En el JSX, antes de la lista de evaluados:
{stats?.data?.desempeno && (
  <EvaluationProfileHeader
    desempeno={stats.data.desempeno}
    teamDna={stats.data.teamDna}
  />
)}
```

---

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] Endpoint `/api/evaluator/stats` devuelve datos correctos
- [ ] Testigos aparecen en panel principal después del gauge
- [ ] Testigos muestran estado correcto (ÓPTIMA/CENTRAL/SEVERA/INDULGENTE)
- [ ] LED hace pulse si NO es ÓPTIMA
- [ ] Clic en testigos navega a `/ratings`
- [ ] Tooltip muestra explicación al hover
- [ ] Header 3 columnas aparece en `/ratings`
- [ ] Histograma refleja distribución real
- [ ] σ se calcula correctamente
- [ ] Team DNA muestra top/low competencia reales
- [ ] Smart Feedback genera narrativa dinámica
- [ ] Colores siguen filosofía FocalizaHR (no hardcodeados)
- [ ] TypeScript compila sin errores

---

## 📚 REFERENCIAS

- `GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md` - Colores y semántica visual
- `FILOSOFIA_DISENO_FOCALIZAHR_v2.md` - Principios de diseño
- `src/lib/services/PerformanceResultsService.ts` - Cálculo de scores
