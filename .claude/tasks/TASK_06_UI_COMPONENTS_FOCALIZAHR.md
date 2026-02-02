# TASK 06: COMPONENTES UI - PERFORMANCE BADGES
## Filosofía FocalizaHR | Línea Tesla | Design System Corporativo

## 🎯 OBJETIVO
Crear componentes UI reutilizables para mostrar clasificaciones de performance **siguiendo estrictamente** la filosofía de diseño FocalizaHR.

## 📐 FILOSOFÍA OBLIGATORIA

```yaml
PRINCIPIO RECTOR: "DATOS → INSIGHT → ACCIÓN"

❌ MAL:  "4.5"
✅ BIEN: "4.5 • Excepcional"

❌ MAL:  Badge genérico con Tailwind directo
✅ BIEN: Clases .fhr-badge-* del design system

❌ MAL:  Card sin identidad
✅ BIEN: Card con Línea Tesla + Glassmorphism
```

## 📁 ARCHIVOS A CREAR
```
src/components/performance/
├── PerformanceBadge.tsx        # Badge reutilizable
├── PerformanceScoreCard.tsx    # Card premium con línea Tesla
├── NineBoxBadge.tsx            # Badge para 9-Box
└── index.ts                    # Exports
```

## ⚠️ REGLAS INQUEBRANTABLES

1. **USAR CLASES CSS EXISTENTES** - NO crear clases nuevas
2. **IMPORTAR de `@/config/performanceClassification`** (TASK 02)
3. **Mobile-First** - Base = 375px
4. **Línea Tesla** en cards premium

---

## 📋 PASO 1: PerformanceBadge.tsx

**Crear:** `src/components/performance/PerformanceBadge.tsx`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE BADGE - Filosofía FocalizaHR
// src/components/performance/PerformanceBadge.tsx
// ════════════════════════════════════════════════════════════════════════════
// REGLA: Usar clases .fhr-badge-* existentes, NO Tailwind directo
// FILOSOFÍA: DATOS → INSIGHT → ACCIÓN (score + significado)
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import {
  getPerformanceClassification,
  PerformanceLevel,
  type PerformanceRatingConfigData
} from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// MAPEO: Nivel → Clase CSS FocalizaHR existente
// ════════════════════════════════════════════════════════════════════════════
const LEVEL_TO_FHR_BADGE: Record<PerformanceLevel, string> = {
  [PerformanceLevel.EXCEPTIONAL]:       'fhr-badge-success',   // Verde esmeralda
  [PerformanceLevel.EXCEEDS]:           'fhr-badge-active',    // Cyan
  [PerformanceLevel.MEETS]:             'fhr-badge-purple',    // Purple
  [PerformanceLevel.DEVELOPING]:        'fhr-badge-warning',   // Amarillo
  [PerformanceLevel.NEEDS_IMPROVEMENT]: 'fhr-badge-error'      // Rojo
}

// ════════════════════════════════════════════════════════════════════════════
// TAMAÑOS - Mobile-First
// ════════════════════════════════════════════════════════════════════════════
const SIZE_CLASSES = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1',
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2'
}

// ════════════════════════════════════════════════════════════════════════════
// INTERFACE
// ════════════════════════════════════════════════════════════════════════════
interface PerformanceBadgeProps {
  /** Score numérico 1.0 - 5.0 */
  score: number
  /** Config personalizada del cliente (opcional) */
  config?: PerformanceRatingConfigData
  /** Tamaño del badge */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Mostrar score numérico */
  showScore?: boolean
  /** Mostrar label de clasificación */
  showLabel?: boolean
  /** Variante visual */
  variant?: 'badge' | 'outline' | 'minimal'
  /** Clases adicionales */
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════
export default memo(function PerformanceBadge({
  score,
  config,
  size = 'md',
  showScore = true,
  showLabel = true,
  variant = 'badge',
  className
}: PerformanceBadgeProps) {
  // Obtener clasificación desde config centralizada (TASK 02)
  const classification = getPerformanceClassification(score, config)
  
  // Obtener clase FocalizaHR correspondiente
  const fhrBadgeClass = LEVEL_TO_FHR_BADGE[classification.level] || 'fhr-badge-default'
  
  // Variante MINIMAL: solo texto coloreado, sin fondo
  if (variant === 'minimal') {
    return (
      <span
        className={cn(
          'inline-flex items-center font-medium',
          SIZE_CLASSES[size],
          classification.textClass,
          className
        )}
      >
        {showScore && <span className="font-semibold">{score.toFixed(1)}</span>}
        {showScore && showLabel && <span className="opacity-60">•</span>}
        {showLabel && <span>{size === 'xs' ? classification.labelShort : classification.label}</span>}
      </span>
    )
  }
  
  // Variante OUTLINE: borde sin fondo
  if (variant === 'outline') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          'bg-transparent border-2',
          classification.borderClass,
          classification.textClass,
          SIZE_CLASSES[size],
          className
        )}
      >
        {showScore && <span className="font-semibold">{score.toFixed(1)}</span>}
        {showScore && showLabel && <span className="opacity-60">•</span>}
        {showLabel && <span>{size === 'xs' ? classification.labelShort : classification.label}</span>}
      </span>
    )
  }
  
  // Variante BADGE (default): usa clases .fhr-badge-* corporativas
  return (
    <span
      className={cn(
        'fhr-badge',
        fhrBadgeClass,
        'inline-flex items-center rounded-full font-medium',
        SIZE_CLASSES[size],
        className
      )}
    >
      {showScore && <span className="font-semibold">{score.toFixed(1)}</span>}
      {showScore && showLabel && <span className="opacity-60">•</span>}
      {showLabel && <span>{size === 'xs' ? classification.labelShort : classification.label}</span>}
    </span>
  )
})
```

---

## 📋 PASO 2: PerformanceScoreCard.tsx (CON LÍNEA TESLA)

**Crear:** `src/components/performance/PerformanceScoreCard.tsx`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE SCORE CARD - Card Premium con Línea Tesla
// src/components/performance/PerformanceScoreCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// FILOSOFÍA: Card premium FocalizaHR con glassmorphism + línea Tesla
// PATRÓN: Apple 70% + Tesla 20% + Institucional 10%
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import {
  getPerformanceClassification,
  type PerformanceRatingConfigData
} from '@/config/performanceClassification'
import PerformanceBadge from './PerformanceBadge'

// ════════════════════════════════════════════════════════════════════════════
// INTERFACE
// ════════════════════════════════════════════════════════════════════════════
interface PerformanceScoreCardProps {
  /** Score numérico 1.0 - 5.0 */
  score: number
  /** Config personalizada del cliente (opcional) */
  config?: PerformanceRatingConfigData
  /** Título opcional */
  title?: string
  /** Mostrar descripción del nivel */
  showDescription?: boolean
  /** Mostrar barra de progreso */
  showProgressBar?: boolean
  /** Mostrar línea Tesla (signature FocalizaHR) */
  showTeslaLine?: boolean
  /** Tamaño */
  size?: 'sm' | 'md' | 'lg'
  /** Clases adicionales */
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════
export default memo(function PerformanceScoreCard({
  score,
  config,
  title = 'Score de Desempeño',
  showDescription = false,
  showProgressBar = true,
  showTeslaLine = true,
  size = 'md',
  className
}: PerformanceScoreCardProps) {
  const classification = getPerformanceClassification(score, config)
  const progressPercent = (score / 5) * 100
  
  // Tamaños responsive (mobile-first)
  const sizeStyles = {
    sm: {
      padding: 'p-4',
      score: 'text-3xl',
      title: 'text-xs',
      bar: 'h-1.5'
    },
    md: {
      padding: 'p-5 md:p-6',
      score: 'text-4xl md:text-5xl',
      title: 'text-sm',
      bar: 'h-2'
    },
    lg: {
      padding: 'p-6 md:p-8',
      score: 'text-5xl md:text-6xl',
      title: 'text-base',
      bar: 'h-3'
    }
  }
  
  const styles = sizeStyles[size]
  
  return (
    <div
      className={cn(
        // Clase base FocalizaHR con glassmorphism
        'fhr-card relative overflow-hidden',
        styles.padding,
        className
      )}
    >
      {/* ════════════════════════════════════════════════════════════════════
          LÍNEA TESLA - Signature Element FocalizaHR
          ════════════════════════════════════════════════════════════════════ */}
      {showTeslaLine && (
        <div 
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${classification.color}, transparent)`
          }}
        />
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className={cn('text-slate-400 font-medium', styles.title)}>
          {title}
        </span>
        <PerformanceBadge 
          score={score} 
          config={config}
          size="sm"
          showScore={false}
        />
      </div>
      
      {/* Score Principal - PROTAGONISTA */}
      <div className="flex items-baseline gap-3 mb-4">
        <span
          className={cn('font-bold tracking-tight', styles.score)}
          style={{ color: classification.color }}
        >
          {score.toFixed(1)}
        </span>
        <span className="text-slate-500 text-lg">/5.0</span>
      </div>
      
      {/* Clasificación */}
      <div 
        className="text-lg font-semibold mb-3"
        style={{ color: classification.color }}
      >
        {classification.label}
      </div>
      
      {/* Progress Bar - Visual de contexto */}
      {showProgressBar && (
        <div className="mb-4">
          <div className={cn(
            'w-full bg-slate-700/50 rounded-full overflow-hidden',
            styles.bar
          )}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${classification.color}80, ${classification.color})`
              }}
            />
          </div>
          {/* Marcadores de referencia */}
          <div className="flex justify-between mt-1 text-[10px] text-slate-500">
            <span>1.0</span>
            <span>2.5</span>
            <span>4.0</span>
            <span>5.0</span>
          </div>
        </div>
      )}
      
      {/* Descripción - Progressive Disclosure */}
      {showDescription && classification.description && (
        <p className="text-xs text-slate-400 leading-relaxed">
          {classification.description}
        </p>
      )}
    </div>
  )
})
```

---

## 📋 PASO 3: NineBoxBadge.tsx

**Crear:** `src/components/performance/NineBoxBadge.tsx`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// NINE BOX BADGE - Badge para posición 9-Box
// src/components/performance/NineBoxBadge.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import {
  getNineBoxPositionConfig,
  NineBoxPosition
} from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// MAPEO: 9-Box → Clase CSS FocalizaHR
// ════════════════════════════════════════════════════════════════════════════
const NINEBOX_TO_FHR_BADGE: Record<NineBoxPosition, string> = {
  [NineBoxPosition.STAR]:            'fhr-badge-success',   // ⭐ Estrella
  [NineBoxPosition.HIGH_POTENTIAL]:  'fhr-badge-active',    // Alto potencial
  [NineBoxPosition.HIGH_PERFORMER]:  'fhr-badge-active',    // Alto desempeño
  [NineBoxPosition.FUTURE_STAR]:     'fhr-badge-cyan',      // Futura estrella
  [NineBoxPosition.CORE_PLAYER]:     'fhr-badge-purple',    // Pilar
  [NineBoxPosition.SOLID_PERFORMER]: 'fhr-badge-purple',    // Sólido
  [NineBoxPosition.INCONSISTENT]:    'fhr-badge-warning',   // Inconsistente
  [NineBoxPosition.DEVELOPMENT]:     'fhr-badge-warning',   // En desarrollo
  [NineBoxPosition.UNDERPERFORMER]:  'fhr-badge-error'      // Bajo desempeño
}

// ════════════════════════════════════════════════════════════════════════════
// INTERFACE
// ════════════════════════════════════════════════════════════════════════════
interface NineBoxBadgeProps {
  /** Posición en la matriz 9-Box */
  position: NineBoxPosition
  /** Tamaño */
  size?: 'sm' | 'md' | 'lg'
  /** Mostrar emoji/icono */
  showIcon?: boolean
  /** Mostrar label completo */
  showLabel?: boolean
  /** Clases adicionales */
  className?: string
}

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2'
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════
export default memo(function NineBoxBadge({
  position,
  size = 'md',
  showIcon = true,
  showLabel = true,
  className
}: NineBoxBadgeProps) {
  const config = getNineBoxPositionConfig(position)
  
  if (!config) {
    return null
  }
  
  const fhrBadgeClass = NINEBOX_TO_FHR_BADGE[position] || 'fhr-badge-default'
  
  return (
    <span
      className={cn(
        'fhr-badge',
        fhrBadgeClass,
        'inline-flex items-center rounded-full font-medium',
        SIZE_CLASSES[size],
        className
      )}
    >
      {showIcon && <span>{config.labelShort}</span>}
      {showIcon && showLabel && <span className="opacity-60">•</span>}
      {showLabel && <span>{config.label}</span>}
    </span>
  )
})
```

---

## 📋 PASO 4: index.ts (Exports)

**Crear/Actualizar:** `src/components/performance/index.ts`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE COMPONENTS - Exports
// src/components/performance/index.ts
// ════════════════════════════════════════════════════════════════════════════

// Componentes de clasificación (TASK 06)
export { default as PerformanceBadge } from './PerformanceBadge'
export { default as PerformanceScoreCard } from './PerformanceScoreCard'
export { default as NineBoxBadge } from './NineBoxBadge'

// Componentes existentes (si los hay)
// export { default as EvaluationReviewModal } from './EvaluationReviewModal'
```

---

## ✅ CHECKLIST DE VALIDACIÓN

```bash
# Verificar compilación
npx tsc --noEmit
```

- [ ] `PerformanceBadge.tsx` usa clases `.fhr-badge-*`
- [ ] `PerformanceScoreCard.tsx` tiene Línea Tesla
- [ ] `PerformanceScoreCard.tsx` usa `.fhr-card`
- [ ] `NineBoxBadge.tsx` usa clases `.fhr-badge-*`
- [ ] Todos importan de `@/config/performanceClassification`
- [ ] Mobile-first (base styles para 375px)
- [ ] `npm run build` pasa

---

## 🧪 EJEMPLOS DE USO

```tsx
import { 
  PerformanceBadge, 
  PerformanceScoreCard, 
  NineBoxBadge 
} from '@/components/performance'
import { NineBoxPosition } from '@/config/performanceClassification'

function DashboardExample() {
  return (
    <div className="space-y-6">
      
      {/* Badge en tabla */}
      <PerformanceBadge score={4.5} size="sm" />
      
      {/* Badge solo label */}
      <PerformanceBadge score={3.2} showScore={false} variant="outline" />
      
      {/* Card premium con línea Tesla */}
      <PerformanceScoreCard 
        score={4.2}
        title="Score General"
        showDescription
        showProgressBar
        showTeslaLine  // ← Signature FocalizaHR
      />
      
      {/* 9-Box Badge */}
      <NineBoxBadge position={NineBoxPosition.STAR} />
      
    </div>
  )
}
```

---

## 📐 DIFERENCIAS VS TASK ORIGINAL

| Aspecto | TASK Original | TASK Corregida |
|---------|---------------|----------------|
| Clases CSS | Tailwind directo | `.fhr-badge-*` corporativas |
| Cards | `rounded-lg border` | `.fhr-card` glassmorphism |
| Línea Tesla | ❌ No existe | ✅ Signature element |
| Mobile-First | Parcial | Completo |
| Filosofía | Solo datos | DATOS → INSIGHT → ACCIÓN |

---

**FocalizaHR - Donde la inteligencia organizacional se convierte en acción.**
