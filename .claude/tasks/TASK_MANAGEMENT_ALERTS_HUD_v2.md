# 🔧 TASK: ManagementAlertsHUD como Consola de Inteligencia v2.0

## ARCHIVO A REESCRIBIR COMPLETAMENTE
```
src/components/performance/ManagementAlertsHUD.tsx
```

## ARCHIVO DE SERVICIO (ya refactorizado)
```
src/lib/management-insights.ts  ← v2.0 con employeeName
```

---

# ⚠️ CAMBIO CRÍTICO EN management-insights.ts v2.0

## Nueva firma de funciones (REQUERIDO):
```typescript
// ANTES (v1)
getManagementInsights(competencies)

// AHORA (v2.0) - employeeName es OBLIGATORIO
getManagementInsights(competencies, employeeName)
getHighlightInsights(competencies, employeeName)
getInsightsSummary(competencies, employeeName)
```

## Nuevos Thresholds (alineados con performanceClassification.ts):
```typescript
const THRESHOLDS = {
  CRITICAL: 2.5,    // < 2.5 = Requiere Atención (rojo)
  MONITOR: 3.5,     // < 3.5 = En Desarrollo (amarillo)
  STRENGTH: 4.5     // >= 4.5 = Excepcional (verde)
}

// Scores < 1.0 se EXCLUYEN automáticamente (preguntas sin nota)
```

## Mensajes ahora incluyen nombre + score:
```
"Agenda una conversación con María para entender por qué 
esta competencia está en 1.8. Puede ser que no tuvo 
oportunidad de demostrarla o hay una brecha real."
```

---

# 🎨 DISEÑO: Consola de Inteligencia Unificada

## Principios (NO lista de post-its):
1. **Monolito/Chasis único** - Todo dentro de UN contenedor
2. **Línea de circuito vertical** - Conecta todas las secciones visualmente
3. **Secciones integradas** - Parte del informe, no cards flotantes
4. **Colores por clasificación** - Rojo/Verde/Amarillo según threshold

## Estructura Visual:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🚨 ALERTAS DE GESTIÓN - María García                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ║  ┌─────────────────────────────────────────────────────────┐ │
│ ║  │ 🔴 REQUIERE TU ATENCIÓN INMEDIATA                       │ │
│ ║  │                                                         │ │
│ ║  │ 📊 Feedback y Coaching: 1.8/5 (Requiere Atención)       │ │
│ ║  │                                                         │ │
│ ║  │ 💡 RECOMENDACIÓN PARA TI:                               │ │
│ ║  │ "Agenda una conversación con María para entender        │ │
│ ║  │ por qué esta competencia está en 1.8..."                │ │
│ ║  │                                                         │ │
│ ║  │ 🎯 Pregunta sugerida para el 1:1:                       │ │
│ ║  │ "¿Cómo te sientes dando feedback a tu equipo?"          │ │
│ ║  └─────────────────────────────────────────────────────────┘ │
│ ║                                                               │
│ ║  ┌─────────────────────────────────────────────────────────┐ │
│ ║  │ 🟢 FORTALEZA PARA APROVECHAR                            │ │
│ ║  │                                                         │ │
│ ║  │ 📊 Gestión del Cambio: 4.8/5 (Excepcional)              │ │
│ ║  │                                                         │ │
│ ║  │ 💡 OPORTUNIDAD DE GESTIÓN:                              │ │
│ ║  │ "María tiene habilidad excepcional. Considera           │ │
│ ║  │ asignarle el liderazgo de la próxima iniciativa."       │ │
│ ║  │                                                         │ │
│ ║  │ 🎯 Acción sugerida:                                     │ │
│ ║  │ • Delegar liderazgo de próxima iniciativa de cambio     │ │
│ ║  │ • Incluirla como mentora en temas de transformación     │ │
│ ║  └─────────────────────────────────────────────────────────┘ │
│ ║                                                               │
│ ║  ┌─────────────────────────────────────────────────────────┐ │
│ ║  │ 🟡 MONITOREAR                                           │ │
│ ║  │                                                         │ │
│ ║  │ • Orientación al Cliente: 3.2/5 - En Desarrollo         │ │
│ ║  │ • Comunicación: 3.0/5 - En Desarrollo                   │ │
│ ║  │                                                         │ │
│ ║  │ 💡 "Observa estas competencias en el próximo ciclo"     │ │
│ ║  └─────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 📦 CÓDIGO COMPLETO DEL COMPONENTE

```tsx
'use client'

// ════════════════════════════════════════════════════════════════════════════
// MANAGEMENT ALERTS HUD - Consola de Inteligencia Unificada v2.0
// src/components/performance/ManagementAlertsHUD.tsx
// ════════════════════════════════════════════════════════════════════════════
// FILOSOFÍA: Un "cerebro" que procesa datos y presenta informe estructurado
// NO ES: Lista de post-its flotantes
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { AlertTriangle, TrendingUp, Flame, Eye } from 'lucide-react'
import { 
  getManagementInsights, 
  type ManagementInsight 
} from '@/lib/management-insights'
import { getPerformanceClassification } from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════════════════

interface CompetencyInput {
  name: string
  score: number  // Escala 1-5
  code?: string
}

interface ManagementAlertsHUDProps {
  competencies: CompetencyInput[]
  employeeName: string
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function ManagementAlertsHUD({
  competencies,
  employeeName,
  className = ''
}: ManagementAlertsHUDProps) {
  
  // Generar insights usando el servicio v2.0 (con employeeName)
  const insights = useMemo(() => {
    return getManagementInsights(competencies, employeeName)
  }, [competencies, employeeName])
  
  // Agrupar por tipo
  const critical = insights.filter(i => i.type === 'critical')
  const strengths = insights.filter(i => i.type === 'strength')
  const monitor = insights.filter(i => i.type === 'monitor')
  
  // Si no hay insights relevantes, mostrar mensaje positivo
  if (insights.length === 0) {
    return (
      <div className={`fhr-card p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-200">
              Sin alertas para {employeeName}
            </h3>
            <p className="text-xs text-slate-400">
              Todas las competencias están en rango saludable
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`fhr-card relative overflow-hidden ${className}`}>
      
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          ALERTAS DE GESTIÓN - {employeeName}
        </h3>
        
        {/* Contador de alertas críticas */}
        {critical.length > 0 && (
          <span className="px-2 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 rounded">
            {critical.length} crítica{critical.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* BODY CON LÍNEA DE CIRCUITO */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="p-4 relative">
        
        {/* Línea vertical de circuito (gradiente según secciones presentes) */}
        <div 
          className="absolute left-6 top-0 bottom-0 w-0.5 rounded-full opacity-60"
          style={{
            background: `linear-gradient(to bottom, 
              ${critical.length > 0 ? '#EF4444' : '#10B981'} 0%, 
              ${strengths.length > 0 ? '#10B981' : '#F59E0B'} 50%, 
              ${monitor.length > 0 ? '#F59E0B' : '#10B981'} 100%
            )`
          }}
        />
        
        {/* Contenido con padding para la línea */}
        <div className="space-y-4">
          
          {/* ════════════════════════════════════════════════════════════ */}
          {/* SECCIÓN: CRÍTICOS */}
          {/* ════════════════════════════════════════════════════════════ */}
          {critical.map((insight, idx) => (
            <CriticalSection key={`critical-${idx}`} insight={insight} />
          ))}
          
          {/* ════════════════════════════════════════════════════════════ */}
          {/* SECCIÓN: FORTALEZAS */}
          {/* ════════════════════════════════════════════════════════════ */}
          {strengths.map((insight, idx) => (
            <StrengthSection key={`strength-${idx}`} insight={insight} />
          ))}
          
          {/* ════════════════════════════════════════════════════════════ */}
          {/* SECCIÓN: MONITOREAR (agrupados) */}
          {/* ════════════════════════════════════════════════════════════ */}
          {monitor.length > 0 && (
            <MonitorSection insights={monitor} />
          )}
          
        </div>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTES DE SECCIÓN
// ════════════════════════════════════════════════════════════════════════════

function CriticalSection({ insight }: { insight: ManagementInsight }) {
  const classification = getPerformanceClassification(insight.score)
  
  return (
    <div className="relative pl-8">
      {/* Indicador en línea de circuito */}
      <div className="absolute left-4 top-4 w-3 h-3 rounded-full bg-red-500 border-2 border-slate-900 shadow-lg shadow-red-500/50" />
      
      {/* Contenido */}
      <div className="bg-red-500/5 rounded-lg p-4 border-l-2 border-red-500/50">
        
        {/* Header de sección */}
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-red-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">
            Requiere tu atención inmediata
          </span>
        </div>
        
        {/* Competencia + Score + Clasificación */}
        <div className="mb-3">
          <span className="text-sm text-slate-300">{insight.competencyName}: </span>
          <span className="text-sm font-semibold text-red-400">
            {insight.score.toFixed(1)}/5
          </span>
          <span className="text-xs text-slate-500 ml-2">
            ({classification.label})
          </span>
        </div>
        
        {/* Recomendación (viene personalizada del servicio v2.0) */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-400 mb-1">
            💡 RECOMENDACIÓN PARA TI:
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            "{insight.insight}"
          </p>
        </div>
        
        {/* Acción sugerida */}
        {insight.action && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-400 mb-1">
              🎬 Acción concreta:
            </p>
            <p className="text-sm text-slate-300">
              {insight.action}
            </p>
          </div>
        )}
        
        {/* Pregunta para 1:1 */}
        {insight.question && (
          <div className="pt-2 border-t border-red-500/20">
            <p className="text-xs font-semibold text-slate-400 mb-1">
              🎯 Pregunta sugerida para el 1:1:
            </p>
            <p className="text-sm text-slate-300 italic">
              "{insight.question}"
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StrengthSection({ insight }: { insight: ManagementInsight }) {
  const classification = getPerformanceClassification(insight.score)
  
  return (
    <div className="relative pl-8">
      {/* Indicador en línea de circuito */}
      <div className="absolute left-4 top-4 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-lg shadow-emerald-500/50" />
      
      {/* Contenido */}
      <div className="bg-emerald-500/5 rounded-lg p-4 border-l-2 border-emerald-500/50">
        
        {/* Header de sección */}
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Fortaleza para aprovechar
          </span>
        </div>
        
        {/* Competencia + Score */}
        <div className="mb-3">
          <span className="text-sm text-slate-300">{insight.competencyName}: </span>
          <span className="text-sm font-semibold text-emerald-400">
            {insight.score.toFixed(1)}/5
          </span>
          <span className="text-xs text-slate-500 ml-2">
            ({classification.label})
          </span>
        </div>
        
        {/* Oportunidad (viene personalizada del servicio v2.0) */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-400 mb-1">
            💡 OPORTUNIDAD DE GESTIÓN:
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            "{insight.insight}"
          </p>
        </div>
        
        {/* Acciones sugeridas */}
        {insight.suggestedActions && insight.suggestedActions.length > 0 && (
          <div className="pt-2 border-t border-emerald-500/20">
            <p className="text-xs font-semibold text-slate-400 mb-1">
              🎯 Acciones sugeridas:
            </p>
            <ul className="space-y-1">
              {insight.suggestedActions.map((action, idx) => (
                <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function MonitorSection({ insights }: { insights: ManagementInsight[] }) {
  return (
    <div className="relative pl-8">
      {/* Indicador en línea de circuito */}
      <div className="absolute left-4 top-4 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900 shadow-lg shadow-amber-500/50" />
      
      {/* Contenido */}
      <div className="bg-amber-500/5 rounded-lg p-4 border-l-2 border-amber-500/50">
        
        {/* Header de sección */}
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Monitorear
          </span>
        </div>
        
        {/* Lista compacta de competencias a monitorear */}
        <div className="space-y-2 mb-3">
          {insights.map((insight, idx) => {
            const classification = getPerformanceClassification(insight.score)
            return (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">
                  {insight.competencyName}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-amber-400 font-medium">
                    {insight.score.toFixed(1)}/5
                  </span>
                  <span className="text-xs text-slate-500">
                    {classification.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Mensaje general */}
        <p className="text-xs text-slate-400 italic pt-2 border-t border-amber-500/20">
          💡 "Observa estas competencias en el próximo ciclo. Si no mejoran, considera un plan de desarrollo."
        </p>
      </div>
    </div>
  )
}
```

---

# 📋 CHECKLIST DE IMPLEMENTACIÓN

```
□ 1. Verificar que src/lib/management-insights.ts es v2.0 (con employeeName)
□ 2. Reemplazar COMPLETAMENTE ManagementAlertsHUD.tsx con código de arriba
□ 3. Verificar imports:
     - getManagementInsights de '@/lib/management-insights'
     - getPerformanceClassification de '@/config/performanceClassification'
□ 4. Probar en browser:
     - Verificar línea de circuito vertical
     - Verificar colores por tipo (rojo/verde/amarillo)
     - Verificar mensajes personalizados con nombre
     - Verificar que scores < 1.0 no generan alertas falsas
```

---

# 🎯 DIFERENCIAS vs VERSIÓN ANTERIOR

| Aspecto | Antes (post-its) | Ahora (Consola) |
|---------|------------------|-----------------|
| Layout | Cards flotantes separadas | Monolito con línea de circuito |
| Conexión visual | Ninguna | Línea vertical gradiente |
| Mensajes | Genéricos | Personalizados con nombre + score |
| Thresholds | Hardcodeados | Alineados con performanceClassification |
| Scores < 1.0 | Generaban alertas falsas | Excluidos automáticamente |
| Sensación | "Pedazos de papel" | "Sistema de inteligencia" |
