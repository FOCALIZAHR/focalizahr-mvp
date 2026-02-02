# TASK: Rediseño Cinema Mode SpotlightCard - 4 Cards FocalizaHR

## 🎯 OBJETIVO
Rediseñar las 4 cards del Cinema Mode para seguir la filosofía de diseño FocalizaHR.

## 📁 ARCHIVOS A MODIFICAR
```
src/components/evaluator/cinema/InsightCard.tsx      # Rediseño completo
src/components/evaluator/cinema/SpotlightCard.tsx    # Ajustes menores si necesario
src/components/performance/PerformanceResultCard.tsx # Agregar borde dinámico
```

## 📐 DISEÑO APROBADO

### CARD 1: ANTIGÜEDAD
```
┌─────────────────────┐
│ 👤 ANTIGÜEDAD       │  ← Label 10px slate-500 uppercase + ícono User
│                     │
│         4           │  ← Número HERO 32px white font-light
│       años          │  ← Unidad 14px slate-400
│   ════════░░░       │  ← Barra progreso cyan (max 10 años)
│    4 años 4 meses   │  ← Detalle 12px slate-500
└─────────────────────┘
```
- **Fondo:** slate-800/40
- **Borde:** slate-700/30
- **Lógica:** Extraer años del string "X años Y meses", barra = (años/10)*100%

### CARD 2: TIPO
```
┌─────────────────────┐
│ 📋 TIPO             │  ← Label 10px slate-500 uppercase + ícono ClipboardList
│                     │
│       👤✓          │  ← Ícono grande 32px (dinámico según tipo)
│                     │
│  Evaluación del     │  ← Texto 16px white centrado
│       Jefe          │
└─────────────────────┘
```
- **Fondo:** slate-800/40
- **Borde:** slate-700/30
- **Mapeo obligatorio:**

```typescript
const EVALUATION_TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
  'SELF': { label: 'Autoevaluación', icon: User },
  'MANAGER_TO_EMPLOYEE': { label: 'Evaluación del Jefe', icon: UserCheck },
  'MANAGER': { label: 'Evaluación del Jefe', icon: UserCheck },
  'PEER': { label: 'Entre Pares', icon: Users },
  'EMPLOYEE_TO_MANAGER': { label: 'Evaluación Ascendente', icon: ArrowUp },
  'UPWARD': { label: 'Evaluación Ascendente', icon: ArrowUp }
}
```

### CARD 3: RESULTADO (ya implementada)
```
┌═════════════════════┐
│▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│  ← Línea Tesla (color dinámico)
│ RESULTADO           │
│                     │
│ Supera Expectativas │  ← Clasificación (color dinámico)
│ ████████░░ 4.0      │  ← Barra + Score
└═════════════════════┘
```
- **Fondo:** slate-800/60
- **Borde:** DINÁMICO según clasificación (usar classification.color con /30)
- **Acción:** Solo agregar borde al `PerformanceResultCard.tsx` variante compact

### CARD 4: COMPLETADA
```
┌─────────────────────┐
│ ✓ COMPLETADA        │  ← Label 10px slate-500 uppercase + ícono CheckCircle pequeño
│                     │
│        ◯           │  ← Círculo 40px contenedor
│       ✓            │     CheckCircle 24px emerald-400
│                     │     Fondo círculo: emerald-500/10
│                     │
│   1 feb 2026        │  ← Fecha 16px white
│   hace 2 días       │  ← Tiempo relativo 12px slate-500
└─────────────────────┘
```
- **Fondo:** emerald-950/10
- **Borde:** emerald-500/20
- **Lógica tiempo relativo:**

```typescript
const getRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'hoy'
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} días`
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`
  return `hace ${Math.floor(diffDays / 30)} meses`
}
```

## 🔧 IMPLEMENTACIÓN RECOMENDADA

### Opción A: Modificar InsightCard.tsx (RECOMENDADA)

Hacer que `InsightCard` renderice diferente según `insight.type`:

```typescript
// src/components/evaluator/cinema/InsightCard.tsx
'use client'

import { memo } from 'react'
import { 
  User, UserCheck, Users, ArrowUp, 
  ClipboardList, Calendar, CheckCircle 
} from 'lucide-react'

interface InsightCardProps {
  type: 'tenure' | 'evaluationType' | 'resultado' | 'completedAt'
  label: string
  value: string
  icon?: any
  // ... otros props existentes
}

export default memo(function InsightCard({ type, label, value, ...props }: InsightCardProps) {
  
  // Renderizado condicional por tipo
  switch (type) {
    case 'tenure':
      return <TenureCard value={value} />
      
    case 'evaluationType':
      return <EvaluationTypeCard value={value} />
      
    case 'completedAt':
      return <CompletedCard value={value} />
      
    default:
      return <DefaultCard label={label} value={value} />
  }
})

// Subcomponentes internos para cada tipo...
```

### Opción B: Crear componentes separados

Si InsightCard es muy complejo, crear:
- `TenureCard.tsx`
- `EvaluationTypeCard.tsx`  
- `CompletedCard.tsx`

Y usarlos directamente en `SpotlightCard.tsx`.

## ⚠️ NOTAS IMPORTANTES

1. **NO modificar** `calculateInsights.ts` - solo el renderizado visual
2. **Mantener** compatibilidad con props existentes de InsightCard
3. **Íconos Lucide** ya disponibles, solo importar los necesarios
4. **La card RESULTADO** ya usa `PerformanceResultCard` - solo agregar borde
5. **Colores** usar Tailwind existente, NO crear clases nuevas

## ✅ CRITERIOS DE ACEPTACIÓN

- [ ] ANTIGÜEDAD muestra número HERO + barra de progreso
- [ ] TIPO muestra ícono dinámico + label humanizado (NO "MANAGER_TO_EMPLOYEE")
- [ ] RESULTADO tiene borde dinámico según clasificación
- [ ] COMPLETADA muestra círculo con check + fecha + tiempo relativo
- [ ] Las 4 cards tienen bordes consistentes
- [ ] TypeScript compila sin errores
- [ ] Diseño responsive (funciona en móvil)

## 📚 REFERENCIAS

- `FILOSOFIA_DISENO_FOCALIZAHR_v1.md` - Principios de diseño
- `GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md` - Clases CSS, íconos Lucide
- `src/components/performance/PerformanceResultCard.tsx` - Ejemplo de card premium
