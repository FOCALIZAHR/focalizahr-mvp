# TASK 04: Crear CompetencyCarouselCard Component

## Objetivo
Crear el componente card para el carrusel horizontal de competencias.

## Archivo a Crear
```
src/components/performance/summary/CompetencyCarouselCard.tsx
```

## Contexto
- Card compacta (120px width) para carrusel horizontal
- Ícono dinámico por código de competencia
- Color dinámico según score (verde/cyan/amber/rojo)
- Línea Tesla superior
- Estado seleccionado con highlight cyan

## Dependencias Existentes a Usar
```typescript
import { getPerformanceClassification } from '@/config/performanceClassification'
import { cn } from '@/lib/utils'
```

## Código del Componente

```typescript
'use client'

// ═══════════════════════════════════════════════════════════════════════════
// COMPETENCY CAROUSEL CARD
// Card compacta para carrusel horizontal de competencias
// Diseño FocalizaHR: Línea Tesla + Colores dinámicos + Ícono contextual
// ═══════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Users, 
  Target, 
  RefreshCw, 
  Lightbulb,
  Eye, 
  GraduationCap, 
  Scale, 
  Megaphone, 
  TrendingUp, 
  Zap, 
  Star,
  type LucideIcon
} from 'lucide-react'
import { getPerformanceClassification } from '@/config/performanceClassification'
import { cn } from '@/lib/utils'
import type { CompetencyCarouselCardProps } from '@/types/evaluator-cinema'

// ═══════════════════════════════════════════════════════════════════════════
// MAPEO DE ÍCONOS POR CÓDIGO DE COMPETENCIA
// ═══════════════════════════════════════════════════════════════════════════

const COMPETENCY_ICONS: Record<string, LucideIcon> = {
  // CORE Competencies
  'CORE-COMM': MessageSquare,      // Comunicación
  'CORE-TEAM': Users,              // Trabajo en Equipo
  'CORE-RESULT': Target,           // Orientación a Resultados
  'CORE-ADAPT': RefreshCw,         // Adaptabilidad
  'CORE-INNOV': Lightbulb,         // Innovación
  
  // LEADERSHIP Competencies
  'LEAD-VISION': Eye,              // Visión Estratégica
  'LEAD-DEVELOP': GraduationCap,   // Desarrollo de Personas
  'LEAD-DECISION': Scale,          // Toma de Decisiones
  'LEAD-INFLUENCE': Megaphone,     // Influencia
  
  // STRATEGIC Competencies
  'STRAT-BUSINESS': TrendingUp,    // Visión de Negocio
  'STRAT-CHANGE': Zap,             // Gestión del Cambio
}

/**
 * Obtiene el ícono para un código de competencia
 * Fallback a Star si no hay mapeo
 */
function getCompetencyIcon(code: string): LucideIcon {
  return COMPETENCY_ICONS[code] || Star
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default memo(function CompetencyCarouselCard({
  code,
  name,
  score,
  isSelected,
  onClick
}: CompetencyCarouselCardProps) {
  // Obtener clasificación y color basado en score (escala 1-5)
  const classification = getPerformanceClassification(score)
  const Icon = getCompetencyIcon(code)
  const barWidth = (score / 5) * 100

  // Nombre corto para el card (máx 10 caracteres)
  const shortName = name.length > 10 ? name.slice(0, 9) + '.' : name

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        // Base styles
        'relative flex-shrink-0 w-[120px] p-4 rounded-xl border transition-all duration-200',
        'bg-slate-800/60 backdrop-blur',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
        
        // Estado seleccionado vs normal
        isSelected
          ? 'border-cyan-500/50 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
          : 'border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/80'
      )}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          LÍNEA TESLA SUPERIOR
          Color basado en clasificación, más visible si está seleccionado
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="absolute top-0 left-2 right-2 h-[1px] rounded-t-xl transition-opacity duration-200"
        style={{
          background: `linear-gradient(90deg, transparent 10%, ${classification.color} 50%, transparent 90%)`,
          opacity: isSelected ? 1 : 0.5
        }}
      />

      {/* Ícono de competencia */}
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 mx-auto transition-colors duration-200"
        style={{ backgroundColor: `${classification.color}20` }}
      >
        <Icon 
          className="w-4 h-4 transition-colors duration-200" 
          style={{ color: classification.color }}
        />
      </div>

      {/* Nombre de competencia (truncado) */}
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center mb-1 truncate">
        {shortName}
      </p>

      {/* Score HERO - Número grande protagonista */}
      <p 
        className="text-xl font-light text-center tabular-nums transition-colors duration-200"
        style={{ color: classification.color }}
      >
        {score.toFixed(1)}
      </p>

      {/* Mini barra de progreso */}
      <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden mt-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: classification.color }}
        />
      </div>

      {/* Indicador de selección (dot) */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400"
        />
      )}
    </motion.button>
  )
})
```

## Validación

```bash
# Verificar que compila
npx tsc --noEmit

# Probar en Storybook o directamente en la página
# El card debe:
# 1. Mostrar ícono correcto según código
# 2. Cambiar color según score
# 3. Resaltar cuando está seleccionado
# 4. Animar al hover/tap
```

## Criterios de Éxito
- [ ] El componente renderiza sin errores
- [ ] El ícono cambia según el código de competencia
- [ ] Los colores son dinámicos según el score (verde > 4, cyan 3-4, amber 2-3, rojo < 2)
- [ ] El estado seleccionado tiene highlight cyan visible
- [ ] La barra de progreso se anima al montar
- [ ] El nombre se trunca correctamente si es largo
- [ ] Las animaciones de hover/tap funcionan

## NO Modificar
- getPerformanceClassification existente
- cn utility existente
