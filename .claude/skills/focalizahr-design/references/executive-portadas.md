# 🎭 EXECUTIVE PORTADAS (Landing Cards / Spotlight Cards)

> **Patrón único FocalizaHR:** Portada de contexto que aparece al hacer clic en cualquier persona/entidad del rail del Smart Router.
> **Filosofía:** "Cero clics ciegos - Contexto ANTES de formulario"

---

## ANATOMÍA: SPLIT 35/65

```tsx
// Estructura completa copiable
<div className="relative bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl flex flex-col md:flex-row overflow-hidden">
  
  {/* ════════════════════════════════════════════════════════════════
      LÍNEA TESLA DINÁMICA - Color según estado/urgencia
      ════════════════════════════════════════════════════════════════ */}
  <div
    className="absolute top-0 left-0 right-0 h-[1px] z-20"
    style={{
      background: `linear-gradient(90deg, transparent, ${teslaColor}, transparent)`,
      boxShadow: `0 0 15px ${teslaColor}`
    }}
  />

  {/* Botón Volver */}
  <button
    onClick={onBack}
    className="absolute top-4 left-4 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
  >
    <ArrowLeft className="w-3 h-3" /> Volver
  </button>

  {/* ════════════════════════════════════════════════════════════════
      COLUMNA IZQUIERDA (35%) - IDENTIDAD
      Avatar + Status Badge + Info básica
      ════════════════════════════════════════════════════════════════ */}
  <div className="w-full md:w-[35%] bg-slate-900/50 p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
    
    {/* Avatar con iniciales */}
    <div className="relative mb-6">
      <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-2xl md:text-3xl font-bold text-slate-400 border border-slate-700 shadow-2xl">
        {initials}
      </div>
      
      {/* Status Badge debajo del avatar */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <StatusBadge status={employee.status} />
      </div>
    </div>

    {/* Info */}
    <h2 className="text-xl font-bold text-white tracking-tight">{employee.fullName}</h2>
    <p className="text-sm text-slate-400 mt-1">{employee.position}</p>
    <p className="text-sm text-slate-400">{employee.department}</p>
    <p className="text-xs text-slate-500 mt-2">{employee.tenure}</p>
  </div>

  {/* ════════════════════════════════════════════════════════════════
      COLUMNA DERECHA (65%) - NARRATIVA + ACCIÓN
      Timeline + Narrativa ejecutiva + CTA dinámico
      ════════════════════════════════════════════════════════════════ */}
  <div className="w-full md:w-[65%] p-10 flex flex-col items-center justify-center">
    
    {/* Timeline Visual (opcional) */}
    <StageTimeline stages={stages} current={currentStage} />
    
    {/* Narrativa Ejecutiva */}
    <ExecutiveNarrative firstName={firstName} data={data} />
    
    {/* CTA Dinámico */}
    <DynamicCTA state={employee.state} onAction={onAction} />
  </div>
</div>
```

---

## 🎨 SISTEMA SEMÁNTICO DE COLOR EN NARRATIVAS

### Regla de Oro

```typescript
// CYAN (#22D3EE) → Nombres, categorías, entidades
// PURPLE (#A78BFA) → Números, métricas, porcentajes
// WHITE → Conectores y contexto
```

### Patrón Correcto

```tsx
// ❌ INCORRECTO:
<p>
  56% de desalineamiento en 28 evaluados.
</p>

// ✅ CORRECTO:
<p className="text-2xl font-light text-white">
  <span className="text-purple-400 font-medium">56%</span>
  {' de desalineamiento en '}
  <span className="text-purple-400 font-medium">28</span>
  {' de tus '}
  <span className="text-cyan-400 font-medium">50 evaluados</span>
  {'.'}
</p>
```

### Ejemplos por Tipo de Narrativa

```tsx
// CASO 1: Sin evaluación
<>
  <span className="text-cyan-400 font-medium">{firstName}</span>
  {' aún no tiene evaluación de desempeño.'}
</>

// CASO 2: Con métrica crítica
<>
  <span className="text-cyan-400 font-medium">{firstName}</span>
  {' tiene '}
  <span className="text-purple-400 font-medium">{totalBrechas} brechas</span>
  {' que debes conocer antes de tu próxima conversación.'}
</>

// CASO 3: Doble variable (categoría + métrica)
<>
  <span className="text-purple-400 font-medium">{percentage}%</span>
  {' de '}
  <span className="text-cyan-400 font-medium">{categoria}</span>
  {' no alcanza el estándar esperado.'}
</>

// CASO 4: Misión directa
<>
  {'A '}
  <span className="text-cyan-400 font-medium">{firstName}</span>
  {' le falta un '}
  <span className="text-purple-400 font-medium">{percentage}%</span>
  {' para completar su plan.'}
</>
```

---

## 🎯 CTA DINÁMICO SEGÚN ESTADO

```tsx
// Configuración por estado
const CTA_CONFIG = {
  NO_EVAL: {
    label: 'Iniciar Evaluación',
    color: '#22D3EE',      // Cyan
    icon: Play
  },
  NO_POTENTIAL: {
    label: 'Evaluar Potencial',
    color: '#A78BFA',      // Purple
    icon: Zap
  },
  NO_PDI: {
    label: 'Crear Plan de Desarrollo',
    color: '#10B981',      // Green
    icon: Target
  },
  ALERT: {
    label: 'Revisar Ahora',
    color: '#F59E0B',      // Amber
    icon: AlertTriangle
  },
  CRITICAL: {
    label: 'Acción Inmediata',
    color: '#EF4444',      // Red
    icon: AlertCircle
  },
  COMPLETE: {
    label: 'Ver Resumen',
    color: '#22D3EE',      // Cyan
    icon: CheckCircle
  }
}

// Implementación
<motion.button
  onClick={onAction}
  className="flex items-center gap-3 px-8 py-3 rounded-xl font-medium text-base"
  style={{
    background: `linear-gradient(135deg, ${config.color}, ${config.color}DD)`,
    color: isLightBg ? '#0F172A' : '#FFFFFF',
    boxShadow: `0 8px 24px -6px ${config.color}40`
  }}
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
>
  <span>{config.label}</span>
  <config.icon className="w-4 h-4" />
</motion.button>
```

---

## 📊 TIMELINE VISUAL DE ETAPAS

```tsx
// Componente Timeline con dots conectados
<div className="flex items-center justify-center gap-0 mb-8">
  <div className="relative flex items-center">
    
    {/* Línea conectora gradiente */}
    <div
      className="absolute top-1/2 left-8 right-8 h-[1px] -translate-y-1/2"
      style={{
        background: 'linear-gradient(90deg, rgba(34,211,238,0.3) 0%, rgba(167,139,250,0.2) 50%, rgba(16,185,129,0.1) 100%)'
      }}
    />

    {/* Dots por etapa */}
    {stages.map((stage, idx) => {
      const isActive = idx === currentStage
      const isComplete = idx < currentStage
      const color = STAGE_COLORS[stage.key]

      return (
        <div key={stage.key} className="flex flex-col items-center">
          <div
            className={`w-4 h-4 rounded-full border-2 transition-all z-10 ${isActive ? 'shadow-lg' : ''}`}
            style={{
              backgroundColor: isActive || isComplete ? color : '#334155',
              borderColor: isActive || isComplete ? color : '#475569',
              boxShadow: isActive ? `0 0 12px ${color}50` : 'none'
            }}
          />
          <span
            className="text-[10px] font-bold mt-2 uppercase tracking-wider"
            style={{
              color: isActive || isComplete ? color : '#64748B'
            }}
          >
            {stage.label}
          </span>
        </div>
      )
    })}
  </div>
</div>
```

### Colores por Tipo de Etapa

```tsx
const STAGE_COLORS = {
  EVAL_DESEMPENO: '#22D3EE',    // Cyan
  EVAL_POTENCIAL: '#A78BFA',    // Purple
  PDI: '#10B981',               // Green
  DIAGNOSTICO: '#22D3EE',
  CONVERSACION: '#A78BFA',
  DESARROLLO: '#10B981'
}
```

---

## 🏷️ STATUS BADGES

```tsx
// Badge debajo del avatar
const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    color: '#F59E0B',
    icon: Clock
  },
  in_progress: {
    label: 'En Proceso',
    color: '#22D3EE',
    icon: RefreshCw
  },
  completed: {
    label: 'Completado',
    color: '#10B981',
    icon: CheckCircle2
  },
  ready: {
    label: 'Listo',
    color: '#22D3EE',
    icon: Sparkles
  },
  alert: {
    label: 'Requiere Atención',
    color: '#EF4444',
    icon: AlertTriangle
  }
}

// Implementación
<span
  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
  style={{
    backgroundColor: `${config.color}15`,
    borderColor: `${config.color}40`,
    color: config.color
  }}
>
  {config.icon && <config.icon className="w-3 h-3" />}
  {config.label}
</span>
```

---

## ⚡ LÍNEA TESLA DINÁMICA

```tsx
// Color según urgencia/clasificación
const getTeslaColor = (score?: number, status?: string) => {
  if (status === 'critical') return '#EF4444'  // Red
  if (status === 'alert') return '#F59E0B'     // Amber
  
  if (!score) return '#22D3EE'                 // Cyan default
  
  // Por score (1-5 o 0-100)
  const scoreOn5 = score <= 5 ? score : score / 20
  
  if (scoreOn5 >= 4.5) return '#10B981'       // Verde
  if (scoreOn5 >= 3.5) return '#22D3EE'       // Cyan
  if (scoreOn5 >= 2.5) return '#F59E0B'       // Amber
  return '#EF4444'                             // Red
}

// Implementación
<div
  className="absolute top-0 left-0 right-0 h-[1px] z-20"
  style={{
    background: `linear-gradient(90deg, transparent, ${teslaColor}, transparent)`,
    boxShadow: `0 0 15px ${teslaColor}`
  }}
/>
```

---

## 🎨 VARIANTES SEGÚN MÓDULO

### Performance/Evaluaciones
```tsx
// SpotlightCard - Evaluación + Potencial + PDI
stages: ['ED', 'PT', 'PDI']
teslaColor: basado en score
```

### Metas/Goals
```tsx
// GoalSpotlightCard - % completado
teslaColor: cyan (en progreso) | green (completo) | amber (alerta)
```

### Executive Hub
```tsx
// PanelPortada - Insights ejecutivos
teslaColor: red (crítico) | amber (alerta) | cyan (info)
```

---

## 📐 CÓDIGO PATRÓN COMPLETO

```tsx
'use client'
import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from 'lucide-react'

interface ExecutivePortadaProps {
  employee: {
    fullName: string
    position: string
    department: string
    tenure?: string
    status: 'pending' | 'in_progress' | 'completed'
  }
  stages?: Array<{ label: string; complete: boolean }>
  narrative: {
    firstName: string
    mainMetric?: number | string
    category?: string
    message: string
  }
  cta: {
    label: string
    color: string
    urgency: 'low' | 'medium' | 'high' | 'critical'
  }
  onBack: () => void
  onAction: () => void
}

export const ExecutivePortada = memo(function ExecutivePortada({
  employee,
  stages,
  narrative,
  cta,
  onBack,
  onAction
}: ExecutivePortadaProps) {
  
  const initials = employee.fullName
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
  
  const teslaColor = cta.color
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl flex flex-col md:flex-row overflow-hidden"
    >
      
      {/* Línea Tesla */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] z-20"
        style={{
          background: `linear-gradient(90deg, transparent, ${teslaColor}, transparent)`,
          boxShadow: `0 0 15px ${teslaColor}`
        }}
      />
      
      {/* Volver */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
      >
        <ArrowLeft className="w-3 h-3" /> Volver
      </button>
      
      {/* COLUMNA IZQ (35%) */}
      <div className="w-full md:w-[35%] bg-slate-900/50 p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
        
        <div className="relative mb-6">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-2xl md:text-3xl font-bold text-slate-400 border border-slate-700 shadow-2xl">
            {initials}
          </div>
          
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-cyan-500/15 border-cyan-500/40 text-cyan-400">
              <CheckCircle2 className="w-3 h-3" />
              {employee.status === 'completed' ? 'Completado' : 'En Proceso'}
            </span>
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-white tracking-tight text-center">
          {employee.fullName}
        </h2>
        <p className="text-sm text-slate-400 mt-1 text-center">{employee.position}</p>
        <p className="text-sm text-slate-400 text-center">{employee.department}</p>
        {employee.tenure && (
          <p className="text-xs text-slate-500 mt-2 text-center">{employee.tenure}</p>
        )}
      </div>
      
      {/* COLUMNA DER (65%) */}
      <div className="w-full md:w-[65%] p-10 flex flex-col items-center justify-center">
        
        {/* Timeline (opcional) */}
        {stages && (
          <div className="flex items-center gap-4 mb-8">
            {stages.map((stage, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor: stage.complete ? teslaColor : '#334155',
                    borderColor: stage.complete ? teslaColor : '#475569'
                  }}
                />
                <span
                  className="text-[10px] font-bold mt-2 uppercase tracking-wider"
                  style={{ color: stage.complete ? teslaColor : '#64748B' }}
                >
                  {stage.label}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Narrativa */}
        <p className="text-2xl md:text-3xl font-light text-white leading-relaxed text-center max-w-lg mb-8">
          <span className="text-cyan-400 font-medium">{narrative.firstName}</span>
          {narrative.mainMetric && (
            <>
              {' tiene '}
              <span className="text-purple-400 font-medium">{narrative.mainMetric}</span>
            </>
          )}
          {' '}
          {narrative.message}
        </p>
        
        {/* CTA */}
        <motion.button
          onClick={onAction}
          className="flex items-center gap-3 px-8 py-3 rounded-xl font-medium text-base"
          style={{
            background: `linear-gradient(135deg, ${cta.color}, ${cta.color}DD)`,
            color: '#FFFFFF',
            boxShadow: `0 8px 24px -6px ${cta.color}40`
          }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>{cta.label}</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )
})
```

---

## 🎯 PRINCIPIOS DE DISEÑO EXECUTIVE PORTADAS

1. **Elegancia Minimalista** - Solo lo esencial, nada decorativo
2. **Color Semántico** - CYAN categorías, PURPLE métricas
3. **Contexto Primero** - Siempre narrativa antes de acción
4. **Un CTA, Un Camino** - Solo 1 botón principal
5. **Responsive Natural** - Split horizontal → vertical
6. **Feedback Inmediato** - Hover/tap con animaciones sutiles
7. **Estado Visual** - Tesla line + badges + timeline
8. **Glassmorphism Sutil** - backdrop-blur sin excesos

---

## ✅ CHECKLIST PORTADAS EXECUTIVE

```yaml
ESTRUCTURA:
  □ Split 35/65 (izq: identidad | der: acción)
  □ Línea Tesla dinámica arriba
  □ Botón Volver arriba izquierda
  □ Glassmorphism: backdrop-blur-2xl

COLUMNA IZQUIERDA (35%):
  □ Avatar 28-36px con iniciales
  □ Status badge debajo avatar
  □ Nombre (bold white)
  □ Cargo + Depto (slate-400)
  □ Antigüedad (slate-500, opcional)

COLUMNA DERECHA (65%):
  □ Timeline visual (si aplica)
  □ Narrativa con color semántico
  □ UN ÚNICO CTA dinámico
  □ Padding p-10

NARRATIVA:
  □ Nombres/categorías en CYAN
  □ Números/métricas en PURPLE
  □ Conectores en WHITE
  □ Font: text-2xl md:text-3xl font-light
  □ Max 3 líneas

CTA DINÁMICO:
  □ Color según urgencia/estado
  □ Shadow con glow del color
  □ Hover: scale 1.02 + y -2px
  □ Icon a la derecha
  □ px-8 py-3 rounded-xl

RESPONSIVE:
  □ Mobile: columnas verticales
  □ Desktop: split horizontal
  □ Avatar 28px mobile / 36px desktop
```
