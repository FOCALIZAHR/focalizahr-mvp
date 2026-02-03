# 🔧 CORRECCIÓN FINAL: 3 Fixes para Summary Page

## ARCHIVOS A MODIFICAR
```
1. src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx
2. src/components/performance/TeamCalibrationHUD.tsx
```

---

# 🐛 FIX 1: Score 0.0 (usar componente correcto)

## Problema:
`PerformanceResultCard` espera score en **0-100** pero el API retorna **1-5**.

## Solución:
Usar `PerformanceScoreCard` que espera score en **1-5**.

### En summary/page.tsx:

```typescript
// ❌ QUITAR este import
import { PerformanceResultCard } from '@/components/performance/PerformanceResultCard'

// ✅ AGREGAR este import
import PerformanceScoreCard from '@/components/performance/PerformanceScoreCard'
```

### En el JSX de vista Calibración:

```typescript
// ❌ QUITAR
<PerformanceResultCard 
  score={summary.averageScore} 
  variant="compact" 
/>

// ✅ PONER
<PerformanceScoreCard 
  score={summary.averageScore}  // Ya está en 1-5, sin conversión
  showProgressBar
  showTeslaLine
  size="md"
  className="w-full"
/>
```

---

# 🎨 FIX 2: Rediseño TeamCalibrationHUD

## Problemas actuales:
- Barras color slate/gris sin significado
- Sin colapsable para ver todos los miembros
- No resalta al evaluado actual
- Sin footer con estadísticas

## Reemplazar COMPLETAMENTE src/components/performance/TeamCalibrationHUD.tsx:

```tsx
'use client'

import { memo, useState } from 'react'
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { getPerformanceClassification } from '@/config/performanceClassification'

interface TeamMember {
  id: string
  name: string
  score: number  // 1-5
}

interface TeamCalibrationHUDProps {
  teamMembers: TeamMember[]
  currentEvaluateeId?: string
  maxVisible?: number
  className?: string
}

export default memo(function TeamCalibrationHUD({
  teamMembers,
  currentEvaluateeId,
  maxVisible = 5,
  className = ''
}: TeamCalibrationHUDProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Ordenar por score descendente
  const sorted = [...teamMembers].sort((a, b) => b.score - a.score)
  const visibleMembers = isExpanded ? sorted : sorted.slice(0, maxVisible)
  const hasMore = sorted.length > maxVisible
  
  // Encontrar posición del evaluado actual
  const currentPosition = sorted.findIndex(m => m.id === currentEvaluateeId) + 1
  
  // Calcular promedio del equipo
  const teamAvg = sorted.length > 0
    ? sorted.reduce((sum, m) => sum + m.score, 0) / sorted.length
    : 0

  // Determinar si el evaluado actual está en top 10%
  const isTopPerformer = currentPosition > 0 && currentPosition <= Math.ceil(sorted.length * 0.1)

  return (
    <div className={`bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-slate-200">
            CALIBRACIÓN DE EQUIPO
          </span>
        </div>
        {isTopPerformer && (
          <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded">
            TOP 10%
          </span>
        )}
      </div>
      
      {/* Lista de miembros */}
      <div className="p-3 space-y-2">
        {visibleMembers.map((member) => {
          const rank = sorted.indexOf(member) + 1
          const classification = getPerformanceClassification(member.score)
          const isCurrentUser = member.id === currentEvaluateeId
          const barWidth = (member.score / 5) * 100
          
          // Formatear nombre: "García Ximena" → "G. Ximena"
          const nameParts = member.name.split(' ')
          const shortName = nameParts.length >= 2 
            ? `${nameParts[0][0]}. ${nameParts.slice(1).join(' ')}`
            : member.name
          
          return (
            <div
              key={member.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isCurrentUser 
                  ? 'bg-cyan-500/10 border border-cyan-500/30' 
                  : 'hover:bg-slate-700/30'
              }`}
            >
              {/* Posición */}
              <span className={`w-6 text-xs font-mono ${
                isCurrentUser ? 'text-cyan-400 font-bold' : 'text-slate-500'
              }`}>
                {String(rank).padStart(2, '0')}
              </span>
              
              {/* Nombre */}
              <span className={`flex-1 text-sm truncate ${
                isCurrentUser ? 'text-cyan-300 font-medium' : 'text-slate-300'
              }`}>
                {shortName}
                {isCurrentUser && <span className="ml-1 text-cyan-400">◀</span>}
              </span>
              
              {/* Score con color de clasificación */}
              <span 
                className="w-10 text-sm font-medium text-right"
                style={{ color: classification.color }}
              >
                {member.score.toFixed(1)}
              </span>
              
              {/* Barra con color de clasificación */}
              <div className="w-24 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: classification.color
                  }}
                />
              </div>
            </div>
          )
        })}
        
        {/* Botón Mostrar más/menos */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 text-xs text-slate-400 hover:text-cyan-400 flex items-center justify-center gap-1 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                +{sorted.length - maxVisible} más en el equipo
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Footer - Promedio y posición */}
      <div className="px-4 py-3 border-t border-slate-700/30 bg-slate-800/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Promedio Equipo: <span className="text-slate-200 font-medium">{teamAvg.toFixed(2)}</span>
          </span>
          {currentPosition > 0 && (
            <span className="text-slate-400">
              Posición <span className="text-cyan-400 font-bold">#{currentPosition}</span> de {sorted.length}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})
```

---

# 📐 FIX 3: Ancho Consistente

En summary/page.tsx, agregar `className="w-full"` a ambos componentes:

```tsx
{activeView === 'calibracion' ? (
  <div className="space-y-4">
    
    {/* Score Card */}
    {summary.averageScore !== null && (
      <PerformanceScoreCard 
        score={summary.averageScore}
        showProgressBar
        showTeslaLine
        size="md"
        className="w-full"  // ← AGREGAR
      />
    )}
    
    {/* Team Calibration */}
    {teamMembers.length > 0 ? (
      <TeamCalibrationHUD
        teamMembers={teamMembers}
        currentEvaluateeId={summary.evaluatee?.id || assignmentId}
        maxVisible={5}
        className="w-full"  // ← AGREGAR
      />
    ) : (
      <div className="w-full bg-slate-800/30 rounded-xl p-4 border border-slate-700/30 text-center">
        <p className="text-sm text-slate-400">
          No hay suficientes evaluaciones completadas para mostrar el ranking.
        </p>
      </div>
    )}
    
  </div>
) : (
  <ManagementAlertsHUD
    competencies={competencies}
    employeeName={displayName}
    className="w-full"  // ← AGREGAR
  />
)}
```

---

# 📋 CHECKLIST

- [ ] **FIX 1:** Cambiar `PerformanceResultCard` → `PerformanceScoreCard`
- [ ] **FIX 2:** Reemplazar `TeamCalibrationHUD.tsx` con código nuevo
- [ ] **FIX 3:** Agregar `className="w-full"` a los 3 componentes

---

# 🎯 RESULTADO ESPERADO

```
┌──────────────────┬─────────────────────────────────────┐
│                  │            [Calibración] [Alertas] │
│       PI         ├─────────────────────────────────────┤
│                  │  ════════════════════════════════  │
│  ✓ COMPLETADA    │  RESULTADO                          │
│                  │       4.0                           │
│  Paulina...      │  Supera Expectativas               │
│                  │  ████████████████░░░░              │
│                  │  ════════════════════════════════  │
│                  ├─────────────────────────────────────┤
│                  │  🏆 CALIBRACIÓN DE EQUIPO  [TOP 10%]│
│                  │  01  G. Ximena      4.2  ████████  │ verde
│                  │  02  M. Isabel ◀    4.0  ███████▓  │ cyan (actual)
│                  │  03  V. Jose        4.0  ███████   │ cyan
│                  │  04  Z. Solange     3.8  ██████    │ purple
│                  │  05  Z. Patricio    3.3  █████     │ amber
│                  │        ▼ +3 más en el equipo       │
│                  │  ─────────────────────────────────  │
│                  │  Promedio: 3.78    Posición #2 de 8│
└──────────────────┴─────────────────────────────────────┘
```
