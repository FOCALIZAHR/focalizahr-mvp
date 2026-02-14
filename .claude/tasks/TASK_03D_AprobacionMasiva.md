# TASK_03D: Aprobación Masiva - ClassificationApprovalPreview

## 🎯 OBJETIVO

Crear el componente de preview y aprobación masiva que permite al usuario revisar y aprobar todas las clasificaciones automáticas con alta confianza en un solo click, optimizando el camino feliz (90% de usuarios).

## 📋 CONTEXTO

### Problema Actual
```yaml
UX ACTUAL:
  - Solo muestra los 7 pendientes en drawer
  - No muestra los 43 clasificados correctamente
  - Usuario no puede validar clasificaciones automáticas
  - No hay acción "Aprobar todos"

IMPACTO:
  - Usuario asume clasificación es correcta (sin validar)
  - No hay transparencia sobre decisiones del sistema
  - Proceso más lento que lo necesario
```

### Solución
```yaml
APPROVAL PREVIEW:
  - Vista completa de clasificados (5 visibles + expandir)
  - Agrupado por track (EJECUTIVO, MANAGER, COLABORADOR)
  - "Aprobar todas y continuar" = 1 click
  - Opción "Revisar uno por uno" para power users
```

## 🏗️ ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────────┐
│              ClassificationApprovalPreview                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Vista previa rápida: Clasificación automática          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Empleado              Cargo             → Track        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  Juan Pérez            CEO               → EJECUTIVO ✓  │   │
│  │  María González        Jefa Ventas       → MANAGER ✓    │   │
│  │  Pedro Soto            Supervisor RRHH   → MANAGER ✓    │   │
│  │  Ana Martínez          Analista Senior   → COLABORADOR ✓│   │
│  │  Carlos Ruiz           Desarrollador     → COLABORADOR ✓│   │
│  │                                                          │   │
│  │  [▼ Ver todos (43)]                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  💡 Estas clasificaciones tienen 95%+ confianza                │
│     Puedes aprobarlas todas o revisar individualmente          │
│                                                                 │
│  ┌──────────────────┐  ┌───────────────────────────────────┐  │
│  │ Revisar uno a uno│  │ ✓ Aprobar todas y continuar      │  │
│  └──────────────────┘  └───────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Agrupación por Track

```
┌─────────────────────────────────────────────────────────────────┐
│  🔴 EJECUTIVO (1)                                    [Expandir] │
├─────────────────────────────────────────────────────────────────┤
│  Juan Pérez • CEO • Gerencia General                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🟠 MANAGER (27)                                     [Expandir] │
├─────────────────────────────────────────────────────────────────┤
│  María González • Jefa Ventas • Comercial                       │
│  Pedro Soto • Supervisor RRHH • Recursos Humanos                │
│  ... y 25 más                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🟢 COLABORADOR (22)                                 [Expandir] │
├─────────────────────────────────────────────────────────────────┤
│  Ana Martínez • Analista Senior • Finanzas                      │
│  Carlos Ruiz • Desarrollador • TI                               │
│  ... y 20 más                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 ARCHIVOS

### CREAR

```yaml
src/components/job-classification/ClassificationApprovalPreview.tsx:
  - Componente principal de preview
  - Lista expandible por track
  - Botones de acción

src/components/job-classification/TrackGroupCard.tsx:
  - Card colapsable por track
  - Lista de empleados
  - Contador + badge de track
```

### MODIFICAR

```yaml
src/components/job-classification/index.ts:
  - Exportar ClassificationApprovalPreview
  - Exportar TrackGroupCard
```

### REUTILIZAR

```yaml
src/components/job-classification/PositionAssignmentCard.tsx:
  - Para mostrar empleado individual (versión compacta)
```

## 🔧 IMPLEMENTACIÓN DETALLADA

### Paso 1: Crear TrackGroupCard

```typescript
// src/components/job-classification/TrackGroupCard.tsx

'use client';

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClassificationEmployee, PerformanceTrack } from '@/types/job-classification';

// ══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════

const TRACK_CONFIG: Record<PerformanceTrack, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  EJECUTIVO: {
    label: 'Ejecutivo',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: '🔴'
  },
  MANAGER: {
    label: 'Manager',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: '🟠'
  },
  COLABORADOR: {
    label: 'Colaborador',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: '🟢'
  }
};

const INITIAL_VISIBLE = 3;

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface TrackGroupCardProps {
  track: PerformanceTrack;
  employees: ClassificationEmployee[];
  defaultExpanded?: boolean;
  onEmployeeClick?: (employee: ClassificationEmployee) => void;
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export const TrackGroupCard = memo(function TrackGroupCard({
  track,
  employees,
  defaultExpanded = false,
  onEmployeeClick
}: TrackGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);
  
  const config = TRACK_CONFIG[track];
  const visibleEmployees = showAll ? employees : employees.slice(0, INITIAL_VISIBLE);
  const hasMore = employees.length > INITIAL_VISIBLE;
  const remainingCount = employees.length - INITIAL_VISIBLE;
  
  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-all duration-200',
      config.borderColor,
      isExpanded ? config.bgColor : 'bg-slate-800/40'
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{config.icon}</span>
          <span className={cn('font-semibold', config.color)}>
            {config.label}
          </span>
          <span className="text-slate-500">
            ({employees.length})
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>
      
      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {visibleEmployees.map((employee, index) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onEmployeeClick?.(employee)}
                  className={cn(
                    'p-3 rounded-lg bg-slate-800/60 border border-slate-700/50',
                    'flex items-center justify-between',
                    onEmployeeClick && 'cursor-pointer hover:border-slate-600 transition-colors'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {employee.fullName}
                    </p>
                    <p className="text-sm text-slate-400 truncate">
                      {employee.position}
                      {employee.departmentName && (
                        <span className="text-slate-500"> • {employee.departmentName}</span>
                      )}
                    </p>
                  </div>
                  
                  {/* Confidence indicator */}
                  {employee.confidence >= 0.95 && (
                    <span className="text-emerald-400 text-xs font-medium px-2 py-1 bg-emerald-500/10 rounded">
                      95%+
                    </span>
                  )}
                </motion.div>
              ))}
              
              {/* Show more button */}
              {hasMore && !showAll && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAll(true);
                  }}
                  className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Ver {remainingCount} más...
                </button>
              )}
              
              {showAll && hasMore && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAll(false);
                  }}
                  className="w-full py-2 text-sm text-slate-500 hover:text-slate-400 transition-colors"
                >
                  Mostrar menos
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default TrackGroupCard;
```

### Paso 2: Crear ClassificationApprovalPreview

```typescript
// src/components/job-classification/ClassificationApprovalPreview.tsx

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Eye, Loader2, Sparkles } from 'lucide-react';
import { TrackGroupCard } from './TrackGroupCard';
import type { ClassificationEmployee, PerformanceTrack } from '@/types/job-classification';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface ClassificationApprovalPreviewProps {
  employees: ClassificationEmployee[];
  onApproveAll: () => void;
  onReviewIndividual?: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export const ClassificationApprovalPreview = memo(function ClassificationApprovalPreview({
  employees,
  onApproveAll,
  onReviewIndividual,
  onBack,
  isSubmitting = false
}: ClassificationApprovalPreviewProps) {
  
  // Agrupar por track
  const groupedByTrack = useMemo(() => {
    const groups: Record<PerformanceTrack, ClassificationEmployee[]> = {
      EJECUTIVO: [],
      MANAGER: [],
      COLABORADOR: []
    };
    
    employees.forEach(emp => {
      const track = emp.draftTrack || emp.suggestedTrack || 'COLABORADOR';
      groups[track].push(emp);
    });
    
    return groups;
  }, [employees]);
  
  // Estadísticas
  const stats = useMemo(() => {
    const highConfidence = employees.filter(e => e.confidence >= 0.95).length;
    const percentage = Math.round((highConfidence / employees.length) * 100);
    return { highConfidence, percentage };
  }, [employees]);
  
  const trackOrder: PerformanceTrack[] = ['EJECUTIVO', 'MANAGER', 'COLABORADOR'];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="fhr-card p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl">
            <Eye className="w-6 h-6 text-cyan-400" />
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-1">
              Vista Previa: Clasificación Automática
            </h2>
            <p className="text-slate-400">
              {employees.length} empleados clasificados • {stats.percentage}% con alta confianza
            </p>
          </div>
        </div>
        
        {/* Confidence indicator */}
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400 text-sm">
            <strong>{stats.highConfidence}</strong> clasificaciones con 95%+ confianza
          </span>
        </div>
      </div>
      
      {/* Track Groups */}
      <div className="space-y-3">
        {trackOrder.map(track => {
          const trackEmployees = groupedByTrack[track];
          if (trackEmployees.length === 0) return null;
          
          return (
            <TrackGroupCard
              key={track}
              track={track}
              employees={trackEmployees}
              defaultExpanded={trackEmployees.length <= 5}
            />
          );
        })}
      </div>
      
      {/* Info */}
      <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-lg">
        <p className="text-sm text-slate-400 flex items-start gap-2">
          <span className="text-cyan-400">💡</span>
          <span>
            Estas clasificaciones fueron realizadas por nuestro motor de inteligencia artificial 
            con base en el cargo y estructura organizacional. Puedes aprobarlas todas o revisar 
            individualmente si deseas ajustar alguna.
          </span>
        </p>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        
        <div className="flex items-center gap-3">
          {onReviewIndividual && (
            <button
              onClick={onReviewIndividual}
              disabled={isSubmitting}
              className="fhr-btn-secondary"
            >
              Revisar una por una
            </button>
          )}
          
          <button
            onClick={onApproveAll}
            disabled={isSubmitting}
            className="fhr-btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Aprobar todas y continuar
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default ClassificationApprovalPreview;
```

### Paso 3: Actualizar exports

```typescript
// src/components/job-classification/index.ts

// NUEVOS (v2 - Draft State)
export { JobClassificationCinema } from './JobClassificationCinema';
export { ClassificationApprovalPreview } from './ClassificationApprovalPreview';
export { TrackGroupCard } from './TrackGroupCard';
export { ClassificationReviewWizard } from './ClassificationReviewWizard';

// REUTILIZADOS
export { ClassificationSummary } from './ClassificationSummary';
export { PositionAssignmentCard } from './PositionAssignmentCard';

// DEPRECATED
/** @deprecated Use JobClassificationCinema instead */
export { JobClassificationGate } from './JobClassificationGate';
```

## ✅ CRITERIOS DE ACEPTACIÓN

### Funcionales
- [ ] Muestra todos los empleados clasificados agrupados por track
- [ ] Cada grupo muestra primeros 3, con "Ver más" para expandir
- [ ] Click en "Aprobar todas" llama onApproveAll (no persiste directo)
- [ ] "Volver" regresa a vista Hero sin perder datos
- [ ] Indicador de confianza (95%+) visible en empleados
- [ ] Estadística de confianza en header

### Técnicos
- [ ] TypeScript strict mode sin errores
- [ ] Framer-motion para animaciones (0.2s)
- [ ] Memoización en componentes de lista
- [ ] Sin llamadas API directas (usa callbacks)

### UX
- [ ] Grupos colapsables por track
- [ ] Animación suave al expandir/colapsar
- [ ] Loading state en botón durante submit
- [ ] Deshabilitado de acciones durante submit
- [ ] Responsive desde 320px

## 🧪 TESTING

### Component Tests

```typescript
// src/components/job-classification/__tests__/ClassificationApprovalPreview.test.tsx

describe('ClassificationApprovalPreview', () => {
  const mockEmployees: ClassificationEmployee[] = [
    { id: '1', fullName: 'Juan', position: 'CEO', draftTrack: 'EJECUTIVO', confidence: 0.98 },
    { id: '2', fullName: 'María', position: 'Jefa', draftTrack: 'MANAGER', confidence: 0.95 },
    { id: '3', fullName: 'Pedro', position: 'Dev', draftTrack: 'COLABORADOR', confidence: 0.92 }
  ];
  
  it('should group employees by track', () => {
    render(<ClassificationApprovalPreview employees={mockEmployees} onApproveAll={jest.fn()} onBack={jest.fn()} />);
    
    expect(screen.getByText('Ejecutivo')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Colaborador')).toBeInTheDocument();
  });
  
  it('should call onApproveAll when button clicked', () => {
    const onApproveAll = jest.fn();
    render(<ClassificationApprovalPreview employees={mockEmployees} onApproveAll={onApproveAll} onBack={jest.fn()} />);
    
    fireEvent.click(screen.getByText('Aprobar todas y continuar'));
    expect(onApproveAll).toHaveBeenCalled();
  });
  
  it('should show loading state during submit', () => {
    render(<ClassificationApprovalPreview employees={mockEmployees} onApproveAll={jest.fn()} onBack={jest.fn()} isSubmitting={true} />);
    
    expect(screen.getByText('Guardando...')).toBeInTheDocument();
  });
});
```

### Edge Cases

```yaml
CASO 1: Solo 1 empleado en track
  Esperado: Grupo se muestra expandido por defecto
  
CASO 2: Más de 50 empleados en un track
  Esperado: Scroll interno, performance OK

CASO 3: Empleado sin confianza
  Esperado: No muestra badge de confianza

CASO 4: Click rápido en "Aprobar"
  Esperado: Solo una llamada a onApproveAll
```

## 🤖 PROMPT PARA CLAUDE CODE

```
Implementa TASK_03D: Aprobación Masiva - ClassificationApprovalPreview

CONTEXTO:
Parte del sistema de clasificación v2 con draft state.
Este componente muestra preview de clasificaciones automáticas y permite
aprobarlas todas con un solo click.

ARCHIVOS A CREAR:

1. src/components/job-classification/TrackGroupCard.tsx
   - Card colapsable por track (EJECUTIVO, MANAGER, COLABORADOR)
   - Colores: rojo, naranja, verde
   - Muestra 3 primeros + "Ver más"
   - Animación expand/collapse con framer-motion

2. src/components/job-classification/ClassificationApprovalPreview.tsx
   - Header con stats de confianza
   - Lista de TrackGroupCard por cada track
   - Botones: "Volver" y "Aprobar todas y continuar"
   - Loading state durante submit
   - NO llama APIs directamente (usa callbacks)

3. Actualizar src/components/job-classification/index.ts
   - Exportar nuevos componentes

DEPENDENCIAS:
- Usa tipos de src/types/job-classification.ts (TASK_03C-v2)
- Recibe employees[] con draftTrack y confidence

DISEÑO:
- Clases FocalizaHR: fhr-card, fhr-btn-primary, fhr-btn-secondary
- Colores track: emerald (COLABORADOR), amber (MANAGER), red (EJECUTIVO)
- Framer-motion para animaciones (0.2s)
- Iconos de lucide-react

CRITERIOS:
- TypeScript strict sin errores
- Memoización con memo()
- Responsive desde 320px
- Sin llamadas API directas
```

## 📚 REFERENCIAS

- TASK_03C-v2: Hook useClassificationDraft (proporciona employees)
- Design system: `FILOSOFIA_DISENO_FOCALIZAHR_v2.md`
- Patrón colapsable: `src/components/ui/collapsible.tsx`
- Componente existente: `src/components/job-classification/ClassificationSummary.tsx`
