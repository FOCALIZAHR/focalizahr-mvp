# ════════════════════════════════════════════════════════════════════════════
# TASK C: Cinema Mode para /ratings + Diamond Renderer
# ════════════════════════════════════════════════════════════════════════════
# Archivo: .claude/tasks/TASK_C_ratings_cinema_mode.md
# Proyecto: FocalizaHR
# Prioridad: Alta
# Estimación: 4-5 horas
# Dependencias: TASK A y TASK B completadas
# ════════════════════════════════════════════════════════════════════════════

## 📋 RESUMEN

Transformar la página `/dashboard/performance/cycles/[cycleId]/ratings` de una lista
de filas con botones 1-5 a una experiencia Cinema Mode con:
1. Carrusel Netflix de empleados
2. SpotlightCard con Diamond Renderer (3 preguntas AAE)
3. Mantener textarea para comentarios
4. Navegación de vuelta a /evaluaciones al guardar

**REUTILIZA componentes existentes** de Cinema Mode donde sea posible.

---

## 🎯 OBJETIVOS

1. Crear componentes Diamond Renderer (visual WOW)
2. Crear librería con contenido AAE (preguntas, indicadores)
3. Reemplazar UI de lista → Cinema Mode en /ratings
4. Mantener funcionalidad de notas/comentarios
5. Navegación fluida entre empleados y de vuelta a /evaluaciones

---

## ✅ CRITERIOS DE ÉXITO

```yaml
Componentes Diamond:
  - [ ] DiamondVisual.tsx renderiza diamante SVG animado
  - [ ] FactorSelector.tsx muestra 3 preguntas con Cinema Display
  - [ ] NineBoxPreview.tsx muestra preview de posición
  - [ ] DiamondPotentialRenderer.tsx orquesta todo

UI Cinema Mode:
  - [ ] Header con distribución gauge
  - [ ] Carrusel Netflix con empleados
  - [ ] SpotlightCard con Diamond al seleccionar
  - [ ] Textarea para notas MANTENIDO

Funcionalidad:
  - [ ] Seleccionar 3 factores calcula score en tiempo real
  - [ ] Guardar llama API PATCH /potential con factors
  - [ ] Al guardar, pasa al siguiente o vuelve a /evaluaciones
  - [ ] Highlight del empleado si viene de query param

UX:
  - [ ] Animaciones suaves
  - [ ] Responsive mobile
  - [ ] Feedback visual claro
```

---

## 🏗️ ARQUITECTURA

### Archivos Nuevos

```
src/
├── lib/
│   └── potential-content.ts                  # CREAR - Contenido AAE (preguntas)
│
└── components/
    └── potential/
        ├── DiamondVisual.tsx                 # CREAR - SVG diamante
        ├── FactorSelector.tsx                # CREAR - Selector Cinema Display
        ├── NineBoxPreview.tsx                # CREAR - Preview 9-Box
        └── DiamondPotentialRenderer.tsx      # CREAR - Orquestador
```

### Archivo a Reemplazar

```
src/app/dashboard/performance/cycles/[cycleId]/ratings/
└── page.tsx                                  # MODIFICAR - De lista a Cinema Mode
```

---

## 📝 ARCHIVO 1: lib/potential-content.ts

```typescript
// src/lib/potential-content.ts
// Contenido metodológico AAE para el Diamond Renderer

export type PotentialFactorKey = 'aspiration' | 'ability' | 'engagement'
export type PotentialFactorLevel = 1 | 2 | 3

export interface FactorLevelContent {
  label: string
  title: string
  description: string
  indicators: string[]
  emoji: string
}

export interface FactorContent {
  key: PotentialFactorKey
  icon: string
  title: string
  question: string
  color: string
  levels: Record<PotentialFactorLevel, FactorLevelContent>
}

export const POTENTIAL_FACTORS: Record<PotentialFactorKey, FactorContent> = {
  aspiration: {
    key: 'aspiration',
    icon: '🎯',
    title: 'Aspiración',
    question: '¿Quiere asumir roles de mayor responsabilidad?',
    color: '#F59E0B',  // Amber
    levels: {
      1: {
        label: 'BAJO',
        title: 'Satisfecho con rol actual',
        description: 'No busca activamente más responsabilidades.',
        emoji: '😌',
        indicators: [
          'Prefiere mantener su posición actual',
          'Evita oportunidades de mayor exposición',
          'No expresa interés en liderar equipos'
        ]
      },
      2: {
        label: 'MEDIO',
        title: 'Abierto a crecer',
        description: 'Interés moderado en desarrollo profesional.',
        emoji: '🤔',
        indicators: [
          'Acepta desafíos cuando se los ofrecen',
          'Participa en desarrollo cuando es conveniente',
          'Interés variable según el momento'
        ]
      },
      3: {
        label: 'ALTO',
        title: 'Busca activamente crecer',
        description: 'Expresa claro interés en liderar y avanzar.',
        emoji: '🚀',
        indicators: [
          'Solicita proyectos desafiantes',
          'Invierte tiempo propio en desarrollo',
          'Comunica sus aspiraciones de carrera'
        ]
      }
    }
  },
  
  ability: {
    key: 'ability',
    icon: '⚡',
    title: 'Capacidad',
    question: '¿Tiene las competencias para roles más complejos?',
    color: '#3B82F6',  // Blue
    levels: {
      1: {
        label: 'BAJO',
        title: 'Competencias limitadas',
        description: 'Requiere desarrollo significativo para avanzar.',
        emoji: '📚',
        indicators: [
          'Cumple expectativas básicas del rol',
          'Dificultad con tareas fuera de su zona',
          'Aprendizaje lento de nuevas habilidades'
        ]
      },
      2: {
        label: 'MEDIO',
        title: 'Competencias sólidas',
        description: 'Potencial demostrable con desarrollo adicional.',
        emoji: '💪',
        indicators: [
          'Supera expectativas en algunas áreas',
          'Adapta conocimientos a nuevos contextos',
          'Aprende de manera consistente'
        ]
      },
      3: {
        label: 'ALTO',
        title: 'Excede el rol actual',
        description: 'Listo para desafíos de mayor complejidad.',
        emoji: '⭐',
        indicators: [
          'Referente técnico o de liderazgo',
          'Resuelve problemas complejos autónomamente',
          'Aprende y aplica conocimientos rápidamente'
        ]
      }
    }
  },
  
  engagement: {
    key: 'engagement',
    icon: '💎',
    title: 'Compromiso',
    question: '¿Se quedará en la organización a largo plazo?',
    color: '#A78BFA',  // Purple
    levels: {
      1: {
        label: 'BAJO',
        title: 'Riesgo de fuga',
        description: 'Señales de desconexión. Riesgo en 12 meses.',
        emoji: '🚪',
        indicators: [
          'Desenganche visible en reuniones',
          'Menciona ofertas externas',
          'Participación mínima en iniciativas'
        ]
      },
      2: {
        label: 'MEDIO',
        title: 'Comprometido condicionalmente',
        description: 'Permanencia depende de factores específicos.',
        emoji: '⚖️',
        indicators: [
          'Comprometido pero abierto a ofertas',
          'Sensible a cambios organizacionales',
          'Lealtad vinculada a su equipo directo'
        ]
      },
      3: {
        label: 'ALTO',
        title: 'Fuerte identificación',
        description: 'Ve su futuro profesional en la organización.',
        emoji: '🏠',
        indicators: [
          'Embajador de la cultura organizacional',
          'Rechaza ofertas externas',
          'Invierte en relaciones de largo plazo'
        ]
      }
    }
  }
}

// Helper para obtener el orden de factores
export const FACTOR_ORDER: PotentialFactorKey[] = ['aspiration', 'ability', 'engagement']
```

---

## 📝 ARCHIVO 2: components/potential/DiamondVisual.tsx

```typescript
// src/components/potential/DiamondVisual.tsx
'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Target, Zap, Gem, Check } from 'lucide-react'
import { POTENTIAL_FACTORS, type PotentialFactorKey, type PotentialFactorLevel } from '@/lib/potential-content'

interface DiamondVisualProps {
  score: number
  factors: Partial<Record<PotentialFactorKey, PotentialFactorLevel>>
  activeFactor: PotentialFactorKey
  onFactorClick: (factor: PotentialFactorKey) => void
}

const ICONS = { aspiration: Target, ability: Zap, engagement: Gem }

export default memo(function DiamondVisual({
  score,
  factors,
  activeFactor,
  onFactorClick
}: DiamondVisualProps) {
  
  const glowIntensity = useMemo(() => Math.min(1, score / 5), [score])
  const completedCount = Object.values(factors).filter(v => v != null).length
  
  const diamondColor = useMemo(() => {
    if (score >= 4) return '#22D3EE'
    if (score >= 2.5) return '#A78BFA'
    return '#64748B'
  }, [score])
  
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      
      {/* DIAMANTE SVG */}
      <div className="relative">
        <motion.div
          className="absolute inset-0 blur-2xl rounded-full"
          style={{ backgroundColor: diamondColor }}
          animate={{ opacity: glowIntensity * 0.3, scale: 1 + glowIntensity * 0.1 }}
        />
        
        <motion.svg
          width="100" height="100" viewBox="0 0 100 100"
          className="relative z-10"
          animate={{ filter: `drop-shadow(0 0 ${15 * glowIntensity}px ${diamondColor})` }}
        >
          <motion.path
            d="M50 5 L95 40 L50 95 L5 40 Z"
            fill={diamondColor}
            fillOpacity={0.15 + glowIntensity * 0.1}
            stroke={diamondColor}
            strokeWidth="2"
          />
          <motion.path
            d="M50 5 L50 95 M5 40 L95 40"
            fill="none" stroke={diamondColor} strokeWidth="1" strokeOpacity="0.3"
          />
          {completedCount === 3 && (
            <>
              <motion.circle cx="50" cy="30" r="2" fill="white"
                animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.circle cx="35" cy="50" r="1.5" fill="white"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}
        </motion.svg>
        
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <span className="text-2xl font-bold" style={{ color: diamondColor }}>
            {score > 0 ? score.toFixed(1) : '—'}
          </span>
        </div>
      </div>
      
      {/* TABS DE FACTORES */}
      <div className="flex gap-3">
        {(['aspiration', 'ability', 'engagement'] as const).map((key) => {
          const factor = POTENTIAL_FACTORS[key]
          const Icon = ICONS[key]
          const isActive = activeFactor === key
          const isCompleted = factors[key] != null
          const value = factors[key]
          
          return (
            <button
              key={key}
              onClick={() => onFactorClick(key)}
              className={cn(
                'relative flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all min-w-[80px]',
                isActive
                  ? 'bg-slate-800 border border-slate-600'
                  : 'bg-slate-900/50 border border-slate-800 hover:border-slate-700'
              )}
            >
              <div className="relative">
                <Icon 
                  className={cn('w-4 h-4', isCompleted ? 'text-white' : 'text-slate-500')}
                  style={{ color: isCompleted ? factor.color : undefined }}
                />
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center"
                  >
                    <Check className="w-1.5 h-1.5 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </div>
              
              <span className={cn(
                'text-[9px] font-semibold uppercase tracking-wide',
                isActive ? 'text-white' : 'text-slate-500'
              )}>
                {factor.title}
              </span>
              
              <div className="h-0.5 w-full rounded-full bg-slate-800">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: factor.color }}
                  animate={{ width: value ? `${(value / 3) * 100}%` : '0%' }}
                />
              </div>
              
              {isActive && (
                <motion.div
                  layoutId="activeFactorIndicator"
                  className="absolute -bottom-px left-1 right-1 h-[2px] rounded-full"
                  style={{ backgroundColor: factor.color }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
})
```

---

## 📝 ARCHIVO 3: components/potential/FactorSelector.tsx

```typescript
// src/components/potential/FactorSelector.tsx
'use client'

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { POTENTIAL_FACTORS, type PotentialFactorKey, type PotentialFactorLevel } from '@/lib/potential-content'

interface FactorSelectorProps {
  factorKey: PotentialFactorKey
  selectedLevel: PotentialFactorLevel | undefined
  onSelect: (level: PotentialFactorLevel) => void
}

export default memo(function FactorSelector({
  factorKey,
  selectedLevel,
  onSelect
}: FactorSelectorProps) {
  
  const factor = POTENTIAL_FACTORS[factorKey]
  const selectedContent = selectedLevel ? factor.levels[selectedLevel] : null
  
  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-xl">{factor.icon}</span>
          <h3 className="text-base font-bold text-white uppercase tracking-wide">
            {factor.title}
          </h3>
        </div>
        <p className="text-sm text-slate-400">{factor.question}</p>
      </div>
      
      {/* Level Buttons */}
      <div className="flex gap-2 justify-center">
        {([1, 2, 3] as const).map((level) => {
          const content = factor.levels[level]
          const isSelected = selectedLevel === level
          
          return (
            <motion.button
              key={level}
              onClick={() => onSelect(level)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative flex-1 max-w-[120px] p-3 rounded-xl border-2 transition-all',
                'flex flex-col items-center gap-1',
                isSelected
                  ? 'bg-slate-800 border-slate-500 shadow-lg'
                  : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'
              )}
              style={{
                borderColor: isSelected ? factor.color : undefined,
                backgroundColor: isSelected ? `${factor.color}15` : undefined
              }}
            >
              <span className="text-xl">{content.emoji}</span>
              <span className={cn(
                'text-xs font-bold uppercase',
                isSelected ? 'text-white' : 'text-slate-400'
              )}>
                {content.label}
              </span>
              <span className="text-[10px] text-slate-500 text-center leading-tight">
                {content.title}
              </span>
              
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: factor.color }}
                >
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>
      
      {/* Cinema Display */}
      <AnimatePresence mode="wait">
        {selectedContent && (
          <motion.div
            key={selectedLevel}
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
              
              {/* Tesla Line */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden"
              >
                <motion.div
                  className="w-full h-full"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${factor.color}, transparent)`,
                    boxShadow: `0 0 10px ${factor.color}`
                  }}
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
              
              {/* Watermark */}
              <div 
                className="absolute -bottom-2 -right-1 text-[80px] font-black leading-none pointer-events-none select-none"
                style={{ color: factor.color, opacity: 0.05 }}
              >
                {selectedLevel}
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                <p className="text-sm text-slate-300 mb-2">
                  {selectedContent.description}
                </p>
                <ul className="space-y-1">
                  {selectedContent.indicators.map((indicator, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-2 text-xs text-slate-400"
                    >
                      <Check className="w-3 h-3 flex-shrink-0" style={{ color: factor.color }} />
                      {indicator}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
```

---

## 📝 ARCHIVO 4: components/potential/DiamondPotentialRenderer.tsx

```typescript
// src/components/potential/DiamondPotentialRenderer.tsx
'use client'

import { memo, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Sparkles, ChevronRight, ChevronLeft } from 'lucide-react'
import { calculatePotentialScore } from '@/lib/potential-assessment'
import { POTENTIAL_FACTORS, FACTOR_ORDER, type PotentialFactorKey, type PotentialFactorLevel } from '@/lib/potential-content'
import DiamondVisual from './DiamondVisual'
import FactorSelector from './FactorSelector'

interface DiamondPotentialRendererProps {
  employeeName: string
  performanceScore: number
  existingAspiration?: 1 | 2 | 3
  existingAbility?: 1 | 2 | 3
  existingEngagement?: 1 | 2 | 3
  existingNotes?: string
  onSave: (data: {
    aspiration: 1 | 2 | 3
    ability: 1 | 2 | 3
    engagement: 1 | 2 | 3
    notes: string
  }) => Promise<void>
  onCancel?: () => void
  isSaving?: boolean
}

export default memo(function DiamondPotentialRenderer({
  employeeName,
  performanceScore,
  existingFactors,
  existingNotes,
  onSave,
  onCancel,
  isSaving = false
}: DiamondPotentialRendererProps) {
  
  const [factors, setFactors] = useState<Partial<Record<PotentialFactorKey, PotentialFactorLevel>>>({
    aspiration: existingFactors?.aspiration,
    ability: existingFactors?.ability,
    engagement: existingFactors?.engagement
  })
  const [activeFactor, setActiveFactor] = useState<PotentialFactorKey>('aspiration')
  const [notes, setNotes] = useState(existingNotes || '')
  
  // Calcular score en tiempo real
  const calculatedScore = useMemo(() => {
    const { aspiration, ability, engagement } = factors
    if (!aspiration || !ability || !engagement) {
      // Score parcial
      const filled = [aspiration, ability, engagement].filter(Boolean) as number[]
      if (filled.length === 0) return 0
      const avg = filled.reduce((a, b) => a + b, 0) / filled.length
      return Math.round((1 + (avg - 1) * 2) * 10) / 10
    }
    return calculatePotentialScore({ aspiration, ability, engagement })
  }, [factors])
  
  const isComplete = factors.aspiration && factors.ability && factors.engagement
  
  // Auto-avance al siguiente factor
  const handleSelectLevel = useCallback((level: PotentialFactorLevel) => {
    setFactors(prev => ({ ...prev, [activeFactor]: level }))
    
    const currentIdx = FACTOR_ORDER.indexOf(activeFactor)
    if (currentIdx < 2) {
      const nextFactor = FACTOR_ORDER[currentIdx + 1]
      if (!factors[nextFactor]) {
        setTimeout(() => setActiveFactor(nextFactor), 300)
      }
    }
  }, [activeFactor, factors])
  
  const handleSave = useCallback(async () => {
    if (!factors.aspiration || !factors.ability || !factors.engagement) return
    
    await onSave({
      factors: {
        aspiration: factors.aspiration,
        ability: factors.ability,
        engagement: factors.engagement
      },
      notes
    })
  }, [factors, notes, onSave])
  
  // Navegación manual entre factores
  const goToPrevFactor = () => {
    const idx = FACTOR_ORDER.indexOf(activeFactor)
    if (idx > 0) setActiveFactor(FACTOR_ORDER[idx - 1])
  }
  
  const goToNextFactor = () => {
    const idx = FACTOR_ORDER.indexOf(activeFactor)
    if (idx < 2) setActiveFactor(FACTOR_ORDER[idx + 1])
  }
  
  const currentIdx = FACTOR_ORDER.indexOf(activeFactor)
  
  return (
    <div className="flex flex-col gap-4">
      
      {/* Header con nombre y desempeño */}
      <div className="text-center mb-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          Evaluando potencial de
        </p>
        <h2 className="text-lg font-bold text-white">{employeeName}</h2>
        <p className="text-sm text-cyan-400">
          Desempeño: {performanceScore.toFixed(1)}
        </p>
      </div>
      
      {/* Diamond Visual */}
      <DiamondVisual
        score={calculatedScore}
        factors={factors}
        activeFactor={activeFactor}
        onFactorClick={setActiveFactor}
      />
      
      {/* Factor Selector con navegación */}
      <div className="relative">
        {/* Flechas de navegación */}
        <button
          onClick={goToPrevFactor}
          disabled={currentIdx === 0}
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full',
            'bg-slate-800 border border-slate-700',
            currentIdx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-700'
          )}
        >
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
        
        <button
          onClick={goToNextFactor}
          disabled={currentIdx === 2}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full',
            'bg-slate-800 border border-slate-700',
            currentIdx === 2 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-700'
          )}
        >
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
        
        <div className="px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFactor}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <FactorSelector
                factorKey={activeFactor}
                selectedLevel={factors[activeFactor]}
                onSelect={handleSelectLevel}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Textarea para notas */}
      <div className="mt-2">
        <label className="text-xs text-slate-500 mb-1 block">
          Comentarios confidenciales (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones sobre el potencial..."
          rows={2}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm resize-none',
            'bg-slate-900/50 border border-slate-700/50',
            'text-slate-300 placeholder-slate-600',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500/30'
          )}
        />
      </div>
      
      {/* Preview 9-Box (cuando completo) */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Preview 9-Box:</span>
                <span className="text-sm font-bold text-cyan-400">
                  {calculatedScore >= 4 && performanceScore >= 4 ? '⭐ ESTRELLA' :
                   calculatedScore >= 4 ? '🚀 Alto Potencial' :
                   performanceScore >= 4 ? '📈 Alto Desempeño' : '🎯 Pilar'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Botones */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-700/50">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
          >
            Cancelar
          </button>
        )}
        
        <button
          onClick={handleSave}
          disabled={!isComplete || isSaving}
          className={cn(
            'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
            'flex items-center justify-center gap-2',
            isComplete
              ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-500/25'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          )}
        >
          {isSaving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Guardar Potencial
            </>
          )}
        </button>
      </div>
    </div>
  )
})
```

---

## 📝 ARCHIVO 5: Página /ratings con Cinema Mode

```typescript
// src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx
// REEMPLAZAR COMPLETAMENTE con Cinema Mode
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Users, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculatePotentialScore } from '@/lib/potential-assessment'
import DiamondPotentialRenderer from '@/components/potential/DiamondPotentialRenderer'
import { getPerformanceClassification } from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface RatingEmployee {
  id: string
  ratingId: string
  fullName: string
  position: string
  department: string
  performanceScore: number
  performanceLevel: string
  potentialScore: number | null
  potentialAspiration: 1 | 2 | 3 | null   // Campos separados
  potentialAbility: 1 | 2 | 3 | null
  potentialEngagement: 1 | 2 | 3 | null
  potentialNotes: string | null
  nineBoxPosition: string | null
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function RatingsPageCinema() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const cycleId = params.cycleId as string
  const highlightId = searchParams.get('highlight')
  
  const [employees, setEmployees] = useState<RatingEmployee[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [cycleName, setCycleName] = useState('')
  
  // Cargar datos
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('focalizahr_token')
        const res = await fetch(`/api/performance-cycles/${cycleId}/ratings-for-potential`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!res.ok) throw new Error('Error cargando')
        
        const data = await res.json()
        setEmployees(data.ratings || [])
        setCycleName(data.cycleName || '')
        
        // Si viene highlight, seleccionar ese empleado
        if (highlightId) {
          setSelectedId(highlightId)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [cycleId, highlightId])
  
  const selectedEmployee = useMemo(() => 
    employees.find(e => e.id === selectedId),
    [employees, selectedId]
  )
  
  // Stats
  const stats = useMemo(() => ({
    total: employees.length,
    withPotential: employees.filter(e => e.potentialScore != null).length,
    pending: employees.filter(e => e.potentialScore == null).length
  }), [employees])
  
  // Guardar potencial
  const handleSave = useCallback(async (data: { 
    aspiration: 1 | 2 | 3
    ability: 1 | 2 | 3
    engagement: 1 | 2 | 3
    notes: string 
  }) => {
    if (!selectedEmployee) return
    
    setIsSaving(true)
    try {
      const token = localStorage.getItem('focalizahr_token')
      const res = await fetch(`/api/performance-ratings/${selectedEmployee.ratingId}/potential`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aspiration: data.aspiration,
          ability: data.ability,
          engagement: data.engagement,
          notes: data.notes || undefined
        })
      })
      
      if (!res.ok) throw new Error('Error guardando')
      
      const result = await res.json()
      
      // Actualizar estado local
      setEmployees(prev => prev.map(e => 
        e.id === selectedId 
          ? { 
              ...e, 
              potentialScore: result.data.potentialScore,
              potentialAspiration: data.aspiration,
              potentialAbility: data.ability,
              potentialEngagement: data.engagement,
              potentialNotes: data.notes,
              nineBoxPosition: result.data.nineBoxPosition
            }
          : e
      ))
      
      // Pasar al siguiente pendiente o volver
      const nextPending = employees.find(e => e.id !== selectedId && e.potentialScore == null)
      if (nextPending) {
        setSelectedId(nextPending.id)
      } else {
        // Todos completos, volver a evaluaciones
        router.push('/dashboard/evaluaciones')
      }
      
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }, [selectedEmployee, selectedId, employees, router])
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/evaluaciones')}
              className="p-2 rounded-lg hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Asignar Potencial</h1>
              <p className="text-xs text-slate-400">{cycleName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400">
                {stats.withPotential}/{stats.total} asignados
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-6">
          
          {/* CARRUSEL / LISTA */}
          <div className={cn(
            'transition-all duration-300',
            selectedId ? 'w-1/3' : 'w-full'
          )}>
            <div className="grid gap-3">
              {employees.map((emp) => {
                const isSelected = emp.id === selectedId
                const hasPotential = emp.potentialScore != null
                const perfClass = getPerformanceClassification(emp.performanceScore)
                
                return (
                  <motion.button
                    key={emp.id}
                    onClick={() => setSelectedId(emp.id)}
                    className={cn(
                      'w-full p-4 rounded-xl text-left transition-all',
                      'border',
                      isSelected
                        ? 'bg-slate-800 border-cyan-500'
                        : hasPotential
                          ? 'bg-slate-900/50 border-emerald-500/30 hover:border-emerald-500/50'
                          : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                    )}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{emp.fullName}</p>
                        <p className="text-xs text-slate-400">{emp.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: perfClass.color }}>
                          {emp.performanceScore.toFixed(1)}
                        </p>
                        {hasPotential ? (
                          <span className="text-xs text-emerald-400">✓ Potencial</span>
                        ) : (
                          <span className="text-xs text-amber-400">Pendiente</span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
          
          {/* SPOTLIGHT CON DIAMOND */}
          <AnimatePresence>
            {selectedId && selectedEmployee && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="flex-1"
              >
                <div className="sticky top-24 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-2xl p-6">
                  <DiamondPotentialRenderer
                    employeeName={selectedEmployee.fullName}
                    performanceScore={selectedEmployee.performanceScore}
                    existingAspiration={selectedEmployee.potentialAspiration || undefined}
                    existingAbility={selectedEmployee.potentialAbility || undefined}
                    existingEngagement={selectedEmployee.potentialEngagement || undefined}
                    existingNotes={selectedEmployee.potentialNotes || undefined}
                    onSave={handleSave}
                    onCancel={() => setSelectedId(null)}
                    isSaving={isSaving}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </div>
      </div>
    </div>
  )
}
```

---

## 📝 NUEVA API: /api/performance-cycles/[id]/ratings-for-potential

```typescript
// src/app/api/performance-cycles/[id]/ratings-for-potential/route.ts
// Endpoint específico para la página de asignación de potencial

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const cycleId = params.id

    const cycle = await prisma.performanceCycle.findUnique({
      where: { id: cycleId },
      select: { id: true, name: true, accountId: true }
    })

    if (!cycle) {
      return NextResponse.json({ success: false, error: 'Ciclo no encontrado' }, { status: 404 })
    }

    // Obtener ratings con score > 0 (ya evaluados)
    const ratings = await prisma.performanceRating.findMany({
      where: {
        cycleId,
        calculatedScore: { gt: 0 }  // Solo los que tienen evaluación completa
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: {
              select: { displayName: true }
            }
          }
        }
      },
      orderBy: [
        { potentialScore: 'asc' },  // Pendientes primero (null)
        { employee: { fullName: 'asc' } }
      ]
    })

    const mapped = ratings.map(r => ({
      id: r.employee.id,
      ratingId: r.id,
      fullName: r.employee.fullName,
      position: r.employee.position || 'Sin cargo',
      department: r.employee.department?.displayName || 'Sin departamento',
      performanceScore: r.finalScore ?? r.calculatedScore,
      performanceLevel: r.finalLevel ?? r.calculatedLevel,
      potentialScore: r.potentialScore,
      potentialAspiration: r.potentialAspiration,
      potentialAbility: r.potentialAbility,
      potentialEngagement: r.potentialEngagement,
      potentialNotes: r.potentialNotes,
      nineBoxPosition: r.nineBoxPosition
    }))

    return NextResponse.json({
      success: true,
      cycleName: cycle.name,
      ratings: mapped
    })

  } catch (error) {
    console.error('[API ERROR] ratings-for-potential:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}
```

---

## 📋 PASOS DE IMPLEMENTACIÓN

```yaml
1. Crear librería de contenido (15 min):
   - src/lib/potential-content.ts

2. Crear componentes Diamond (2 hrs):
   - DiamondVisual.tsx
   - FactorSelector.tsx
   - DiamondPotentialRenderer.tsx

3. Crear API ratings-for-potential (30 min):
   - Nuevo endpoint GET

4. Reemplazar página /ratings (1 hr):
   - Cinema Mode con lista + spotlight
   - Integrar DiamondPotentialRenderer

5. Testing (1 hr):
   - Flujo completo
   - Navegación desde /evaluaciones
   - Guardar y pasar al siguiente
```

---

## 🏁 ENTREGABLES

```yaml
Archivos Nuevos:
  - src/lib/potential-content.ts
  - src/components/potential/DiamondVisual.tsx
  - src/components/potential/FactorSelector.tsx
  - src/components/potential/DiamondPotentialRenderer.tsx
  - src/app/api/performance-cycles/[id]/ratings-for-potential/route.ts

Archivos Modificados:
  - src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx (reemplazar)
```

---

**FIN DE TASK C**
**Siguiente: TASK D (Modal 9-Box en Summary)**
