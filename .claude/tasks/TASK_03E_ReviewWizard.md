# TASK_03E: Review Wizard - ClassificationReviewWizard

## 🎯 OBJETIVO

Crear el wizard de revisión focalizada que permite al usuario clasificar manualmente los empleados pendientes (anomalías o sin clasificar) de forma intuitiva, uno a uno, con sugerencias inteligentes y contexto completo.

## 📋 CONTEXTO

### Problema Actual
```yaml
UX ACTUAL (UnmappedPositionsDrawer):
  - Drawer con lista plana
  - Guardar uno a uno (persistencia prematura)
  - Sin sugerencias inteligentes
  - Sin contexto de empleado
  - Sin detección de conflictos

IMPACTO:
  - Tedioso con 7+ empleados
  - Sin guía para decidir
  - Errores de clasificación
```

### Solución
```yaml
REVIEW WIZARD:
  - Focus mode: 1 empleado a la vez (1/7)
  - Contexto completo (cargo, depto, reportes)
  - Sugerencia inteligente pre-seleccionada
  - Detección de conflictos (COLABORADOR con reportes)
  - Navegación fluida (anterior/siguiente)
  - Keyboard shortcuts
  - Progreso visible
```

## 🏗️ ARQUITECTURA

### Vista Focus Mode

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Cargos que necesitan tu decisión (1 de 7)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👤 Laura Sánchez                                               │
│  📋 Periodista Senior                                           │
│  🏢 Comunicaciones                                              │
│  👥 3 reportes directos                                         │
│                                                                 │
│  ❓ Este cargo no está en nuestra base de datos                │
│                                                                 │
│  💡 Sugerencia inteligente:                                     │
│     Como tiene 3 reportes, probablemente es MANAGER            │
│                                                                 │
│  ¿Cuál es el nivel correcto?                                   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐          │
│  │  EJECUTIVO   │  │ ✨ MANAGER   │  │ COLABORADOR │          │
│  │ C-Level Dir. │  │ Jefes, Supv. │  │ Analistas   │          │
│  └──────────────┘  └──────────────┘  └─────────────┘          │
│                        👆 Sugerido                             │
│                                                                 │
│  ℹ️  Esto afectará qué preguntas recibe en evaluación          │
│                                                                 │
│  [◀ Anterior]           [Guardar y Siguiente (1/7) ▶]          │
│                                                                 │
│  Progreso: ▓░░░░░░ 1/7                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Caso Conflicto Detectado

```
┌─────────────────────────────────────────────────────────────────┐
│  5/7  ⚠️  Inconsistencia detectada                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👤 Roberto Muñoz                                               │
│  📋 Analista de Operaciones                                     │
│  🏢 Logística                                                   │
│  👥 5 reportes directos  ⚠️                                    │
│                                                                 │
│  🤔 Detectamos algo inusual:                                    │
│                                                                 │
│  Su cargo dice "Analista" (típicamente COLABORADOR)            │
│  PERO tiene 5 personas a cargo (típico de MANAGER)             │
│                                                                 │
│  ¿Cuál describe mejor su rol real?                             │
│                                                                 │
│  ○  Es analista individual (sin equipo real)                   │
│      └─ Reclasificar como COLABORADOR                          │
│                                                                 │
│  ●  Lidera equipo de analistas                                 │
│      └─ Reclasificar como MANAGER ✨                           │
│                                                                 │
│  💡 Tip: Si toma decisiones de equipo, es MANAGER              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 ARCHIVOS

### CREAR

```yaml
src/components/job-classification/ClassificationReviewWizard.tsx:
  - Wizard principal con navegación
  - Estado de posición actual (1/N)
  - Keyboard shortcuts

src/components/job-classification/EmployeeClassificationCard.tsx:
  - Card individual con contexto
  - Selector de track
  - Sugerencia inteligente
  - Detección de conflictos
```

### MODIFICAR

```yaml
src/components/job-classification/index.ts:
  - Exportar nuevos componentes
```

### REUTILIZAR

```yaml
src/lib/services/PositionAdapter.ts:
  - Para sugerencias de track
  - Detectar anomalías

src/types/job-classification.ts:
  - ClassificationEmployee interface
```

## 🔧 IMPLEMENTACIÓN DETALLADA

### Paso 1: Crear EmployeeClassificationCard

```typescript
// src/components/job-classification/EmployeeClassificationCard.tsx

'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Briefcase, Building2, Users, AlertTriangle, 
  Lightbulb, HelpCircle, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClassificationEmployee, PerformanceTrack } from '@/types/job-classification';

// ══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════

const TRACK_OPTIONS: Array<{
  track: PerformanceTrack;
  label: string;
  description: string;
  examples: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = [
  {
    track: 'EJECUTIVO',
    label: 'Ejecutivo',
    description: 'Alta dirección',
    examples: 'CEO, Gerentes, Directores',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500'
  },
  {
    track: 'MANAGER',
    label: 'Manager',
    description: 'Líderes de equipo',
    examples: 'Jefes, Supervisores, Coordinadores',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500'
  },
  {
    track: 'COLABORADOR',
    label: 'Colaborador',
    description: 'Contribuidores individuales',
    examples: 'Analistas, Especialistas, Técnicos',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500'
  }
];

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface EmployeeClassificationCardProps {
  employee: ClassificationEmployee;
  onClassify: (track: PerformanceTrack) => void;
  selectedTrack?: PerformanceTrack | null;
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export const EmployeeClassificationCard = memo(function EmployeeClassificationCard({
  employee,
  onClassify,
  selectedTrack
}: EmployeeClassificationCardProps) {
  const [localTrack, setLocalTrack] = useState<PerformanceTrack | null>(
    selectedTrack || employee.draftTrack || null
  );
  
  const isConflict = employee.anomalyType === 'CONFLICT';
  const isNoMatch = employee.anomalyType === 'NO_MATCH';
  const hasReports = employee.directReportsCount > 0;
  
  // Determinar sugerencia
  const suggestedTrack = employee.suggestedTrack;
  
  // Generar explicación de sugerencia
  const getSuggestionReason = useCallback(() => {
    if (hasReports && employee.directReportsCount >= 3) {
      return `Como tiene ${employee.directReportsCount} reportes directos, probablemente es MANAGER`;
    }
    if (employee.position?.toLowerCase().includes('gerente') || 
        employee.position?.toLowerCase().includes('director')) {
      return 'El cargo sugiere rol de alta dirección';
    }
    if (employee.position?.toLowerCase().includes('jefe') || 
        employee.position?.toLowerCase().includes('supervisor')) {
      return 'El cargo sugiere rol de liderazgo de equipo';
    }
    return 'Clasificación basada en el tipo de cargo';
  }, [employee, hasReports]);
  
  // Generar explicación de conflicto
  const getConflictExplanation = useCallback(() => {
    if (isConflict && hasReports) {
      return {
        title: 'Inconsistencia detectada',
        description: `Su cargo dice "${employee.position}" (típicamente COLABORADOR) pero tiene ${employee.directReportsCount} personas a cargo (típico de MANAGER)`,
        question: '¿Cuál describe mejor su rol real?',
        options: [
          {
            label: 'Es contribuidor individual',
            description: 'No lidera equipo realmente',
            track: 'COLABORADOR' as PerformanceTrack
          },
          {
            label: 'Lidera equipo',
            description: 'Toma decisiones de equipo',
            track: 'MANAGER' as PerformanceTrack,
            suggested: true
          }
        ]
      };
    }
    return null;
  }, [employee, isConflict, hasReports]);
  
  const conflictData = getConflictExplanation();
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') {
        setLocalTrack('EJECUTIVO');
        onClassify('EJECUTIVO');
      } else if (e.key === '2') {
        setLocalTrack('MANAGER');
        onClassify('MANAGER');
      } else if (e.key === '3') {
        setLocalTrack('COLABORADOR');
        onClassify('COLABORADOR');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClassify]);
  
  const handleSelectTrack = (track: PerformanceTrack) => {
    setLocalTrack(track);
    onClassify(track);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Employee Info */}
      <div className="fhr-card p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Nombre */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <User className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Nombre</p>
              <p className="font-medium text-white">{employee.fullName}</p>
            </div>
          </div>
          
          {/* Cargo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Briefcase className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Cargo</p>
              <p className="font-medium text-white">{employee.position || 'Sin cargo'}</p>
            </div>
          </div>
          
          {/* Departamento */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Departamento</p>
              <p className="font-medium text-white">{employee.departmentName || 'Sin asignar'}</p>
            </div>
          </div>
          
          {/* Reportes */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              hasReports ? 'bg-amber-500/10' : 'bg-slate-500/10'
            )}>
              <Users className={cn(
                'w-5 h-5',
                hasReports ? 'text-amber-400' : 'text-slate-400'
              )} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Reportes</p>
              <p className={cn(
                'font-medium',
                hasReports ? 'text-amber-400' : 'text-slate-400'
              )}>
                {employee.directReportsCount} personas
                {hasReports && isConflict && ' ⚠️'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Conflict Alert (si aplica) */}
      {conflictData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-400 mb-1">
                {conflictData.title}
              </h4>
              <p className="text-sm text-slate-300">
                {conflictData.description}
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Suggestion (si no hay conflicto) */}
      {!conflictData && (
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-cyan-400 mb-1">
                Sugerencia inteligente
              </h4>
              <p className="text-sm text-slate-300">
                {getSuggestionReason()}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Question */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-white mb-2">
          {conflictData ? conflictData.question : '¿Cuál es el nivel correcto?'}
        </h3>
        <p className="text-sm text-slate-400">
          Presiona 1, 2 o 3 para selección rápida
        </p>
      </div>
      
      {/* Track Selection */}
      <div className="grid grid-cols-3 gap-3">
        {TRACK_OPTIONS.map((option, index) => {
          const isSelected = localTrack === option.track;
          const isSuggested = suggestedTrack === option.track;
          
          return (
            <motion.button
              key={option.track}
              onClick={() => handleSelectTrack(option.track)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative p-4 rounded-xl border-2 transition-all duration-200',
                'flex flex-col items-center text-center gap-2',
                isSelected
                  ? `${option.bgColor} ${option.borderColor}`
                  : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
              )}
            >
              {/* Suggested badge */}
              {isSuggested && !isSelected && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-cyan-500 text-white text-xs font-medium rounded-full">
                  Sugerido
                </span>
              )}
              
              {/* Selected checkmark */}
              {isSelected && (
                <span className="absolute top-2 right-2">
                  <Check className={cn('w-5 h-5', option.color)} />
                </span>
              )}
              
              {/* Number shortcut */}
              <span className="text-xs text-slate-500 font-mono">
                {index + 1}
              </span>
              
              {/* Label */}
              <span className={cn(
                'text-lg font-semibold',
                isSelected ? option.color : 'text-white'
              )}>
                {option.label}
              </span>
              
              {/* Description */}
              <span className="text-xs text-slate-400">
                {option.description}
              </span>
              
              {/* Examples */}
              <span className="text-xs text-slate-500 mt-1">
                {option.examples}
              </span>
            </motion.button>
          );
        })}
      </div>
      
      {/* Impact info */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <HelpCircle className="w-4 h-4" />
        <span>Esta clasificación afecta qué preguntas recibirá en su evaluación</span>
      </div>
    </motion.div>
  );
});

export default EmployeeClassificationCard;
```

### Paso 2: Crear ClassificationReviewWizard

```typescript
// src/components/job-classification/ClassificationReviewWizard.tsx

'use client';

import { memo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2,
  Sparkles
} from 'lucide-react';
import { EmployeeClassificationCard } from './EmployeeClassificationCard';
import { cn } from '@/lib/utils';
import type { ClassificationEmployee, PerformanceTrack } from '@/types/job-classification';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface ClassificationReviewWizardProps {
  employees: ClassificationEmployee[];
  onClassify: (employeeId: string, track: PerformanceTrack, jobLevel: string) => void;
  onComplete: () => void;
  onBack: () => void;
}

// ══════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════

function trackToJobLevel(track: PerformanceTrack): string {
  switch (track) {
    case 'EJECUTIVO':
      return 'gerente_director';
    case 'MANAGER':
      return 'jefe';
    case 'COLABORADOR':
    default:
      return 'profesional_analista';
  }
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export const ClassificationReviewWizard = memo(function ClassificationReviewWizard({
  employees,
  onClassify,
  onComplete,
  onBack
}: ClassificationReviewWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [classifiedIds, setClassifiedIds] = useState<Set<string>>(new Set());
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  
  const total = employees.length;
  const currentEmployee = employees[currentIndex];
  const completed = classifiedIds.size;
  const progress = (completed / total) * 100;
  
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;
  const allCompleted = completed === total;
  
  // ════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════════════════════════════════
  
  const handleClassify = useCallback((track: PerformanceTrack) => {
    if (!currentEmployee) return;
    
    const jobLevel = trackToJobLevel(track);
    onClassify(currentEmployee.id, track, jobLevel);
    
    setClassifiedIds(prev => {
      const newSet = new Set(prev);
      newSet.add(currentEmployee.id);
      return newSet;
    });
  }, [currentEmployee, onClassify]);
  
  const handleNext = useCallback(() => {
    if (isLast) {
      if (allCompleted) {
        onComplete();
      }
      return;
    }
    
    setDirection('next');
    setCurrentIndex(prev => prev + 1);
  }, [isLast, allCompleted, onComplete]);
  
  const handlePrev = useCallback(() => {
    if (isFirst) {
      onBack();
      return;
    }
    
    setDirection('prev');
    setCurrentIndex(prev => prev - 1);
  }, [isFirst, onBack]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onBack();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onBack]);
  
  // ════════════════════════════════════════════════════════════════════════
  // EMPTY STATE
  // ════════════════════════════════════════════════════════════════════════
  
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-400" />
        <h3 className="text-xl font-semibold text-white">
          ¡Todo clasificado!
        </h3>
        <p className="text-slate-400">
          No hay empleados pendientes de revisión
        </p>
        <button onClick={onComplete} className="fhr-btn-primary">
          Continuar
        </button>
      </div>
    );
  }
  
  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Cargos que necesitan tu decisión
            </h2>
            <p className="text-sm text-slate-400">
              {currentIndex + 1} de {total}
            </p>
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-slate-400">Completados</p>
            <p className="text-lg font-semibold text-emerald-400">
              {completed}/{total}
            </p>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Step indicators */}
        <div className="absolute inset-0 flex items-center justify-between px-1">
          {employees.map((emp, idx) => (
            <button
              key={emp.id}
              onClick={() => {
                setDirection(idx > currentIndex ? 'next' : 'prev');
                setCurrentIndex(idx);
              }}
              className={cn(
                'w-3 h-3 rounded-full transition-all duration-200',
                idx === currentIndex
                  ? 'bg-white scale-125 shadow-lg'
                  : classifiedIds.has(emp.id)
                    ? 'bg-emerald-400'
                    : 'bg-slate-600 hover:bg-slate-500'
              )}
              title={emp.fullName}
            />
          ))}
        </div>
      </div>
      
      {/* Employee Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentEmployee.id}
          initial={{ 
            opacity: 0, 
            x: direction === 'next' ? 50 : -50 
          }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ 
            opacity: 0, 
            x: direction === 'next' ? -50 : 50 
          }}
          transition={{ duration: 0.2 }}
        >
          <EmployeeClassificationCard
            employee={currentEmployee}
            onClassify={handleClassify}
            selectedTrack={currentEmployee.draftTrack}
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <button
          onClick={handlePrev}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isFirst ? 'Cancelar' : 'Anterior'}
        </button>
        
        <div className="flex items-center gap-2">
          {/* Batch action hint */}
          {completed >= 3 && completed < total && (
            <span className="text-xs text-cyan-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Tip: Presiona → para avanzar rápido
            </span>
          )}
        </div>
        
        <button
          onClick={handleNext}
          disabled={!classifiedIds.has(currentEmployee.id) && !currentEmployee.draftTrack}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
            classifiedIds.has(currentEmployee.id) || currentEmployee.draftTrack
              ? 'bg-cyan-500 text-white hover:bg-cyan-600'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          )}
        >
          {isLast ? (
            allCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Finalizar
              </>
            ) : (
              <>
                Clasifica para continuar
              </>
            )
          ) : (
            <>
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
      
      {/* Keyboard hints */}
      <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">→</kbd>
          Navegar
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">1</kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">2</kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">3</kbd>
          Seleccionar
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">Enter</kbd>
          Confirmar
        </span>
      </div>
    </div>
  );
});

export default ClassificationReviewWizard;
```

## ✅ CRITERIOS DE ACEPTACIÓN

### Funcionales
- [ ] Muestra 1 empleado a la vez con contexto completo
- [ ] Navegación anterior/siguiente funciona correctamente
- [ ] Selección de track actualiza draft (NO persiste a BD)
- [ ] Progreso visual muestra empleados completados
- [ ] Detección de conflictos muestra alerta especial
- [ ] Sugerencia inteligente basada en reportes/cargo
- [ ] Finalizar solo habilitado cuando todos clasificados

### Técnicos
- [ ] TypeScript strict mode sin errores
- [ ] Keyboard shortcuts (1,2,3,←,→,Enter,Esc)
- [ ] Animaciones con framer-motion (0.2s)
- [ ] Memoización en componentes

### UX
- [ ] Focus mode reduce cognitive load
- [ ] Indicadores de progreso claros
- [ ] Navegación fluida entre empleados
- [ ] Feedback visual al seleccionar
- [ ] Responsive desde 320px
- [ ] Accesible con teclado

## 🧪 TESTING

### Component Tests

```typescript
// src/components/job-classification/__tests__/ClassificationReviewWizard.test.tsx

describe('ClassificationReviewWizard', () => {
  const mockEmployees: ClassificationEmployee[] = [
    { id: '1', fullName: 'Juan', position: 'CEO', anomalyType: 'NO_MATCH', directReportsCount: 0 },
    { id: '2', fullName: 'María', position: 'Analista', anomalyType: 'CONFLICT', directReportsCount: 5 },
  ];
  
  it('should show first employee initially', () => {
    render(<ClassificationReviewWizard employees={mockEmployees} {...handlers} />);
    expect(screen.getByText('Juan')).toBeInTheDocument();
  });
  
  it('should navigate to next on arrow key', () => {
    render(<ClassificationReviewWizard employees={mockEmployees} {...handlers} />);
    
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('María')).toBeInTheDocument();
  });
  
  it('should show conflict alert for anomaly CONFLICT', () => {
    // Navigate to María (conflict)
    render(<ClassificationReviewWizard employees={mockEmployees} {...handlers} />);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    
    expect(screen.getByText('Inconsistencia detectada')).toBeInTheDocument();
  });
  
  it('should call onClassify when track selected', () => {
    const onClassify = jest.fn();
    render(<ClassificationReviewWizard employees={mockEmployees} onClassify={onClassify} {...handlers} />);
    
    fireEvent.keyDown(document, { key: '2' }); // MANAGER
    expect(onClassify).toHaveBeenCalledWith('1', 'MANAGER', 'jefe');
  });
});
```

### Edge Cases

```yaml
CASO 1: Solo 1 empleado pendiente
  Esperado: Sin navegación, solo "Finalizar"

CASO 2: Empleado ya tiene draftTrack
  Esperado: Track pre-seleccionado, puede cambiar

CASO 3: Navegación rápida (teclas rápidas)
  Esperado: Animaciones no se acumulan

CASO 4: Cerrar y reabrir wizard
  Esperado: Draft preservado, progreso mantenido
```

## 🤖 PROMPT PARA CLAUDE CODE

```
Implementa TASK_03E: Review Wizard - ClassificationReviewWizard

CONTEXTO:
Parte del sistema de clasificación v2 con draft state.
Este componente permite revisar empleados pendientes uno a uno
con sugerencias inteligentes y detección de conflictos.

ARCHIVOS A CREAR:

1. src/components/job-classification/EmployeeClassificationCard.tsx
   - Card con contexto completo del empleado
   - Grid: nombre, cargo, departamento, reportes
   - Selector de track (3 botones: EJECUTIVO, MANAGER, COLABORADOR)
   - Sugerencia inteligente basada en reportes/cargo
   - Detección de conflictos (COLABORADOR con reportes)
   - Keyboard shortcuts: 1, 2, 3

2. src/components/job-classification/ClassificationReviewWizard.tsx
   - Wizard de navegación (1 de N)
   - Barra de progreso con indicadores clickeables
   - Navegación: Anterior/Siguiente
   - Keyboard: ←, →, Enter, Esc
   - AnimatePresence para transiciones
   - Solo permite avanzar si track seleccionado

TIPOS:
- Usa ClassificationEmployee de src/types/job-classification.ts
- anomalyType: 'NONE' | 'NO_MATCH' | 'CONFLICT'
- directReportsCount para detectar conflictos

LÓGICA DE CONFLICTO:
Si anomalyType === 'CONFLICT' && directReportsCount > 0:
  → Mostrar alerta especial
  → Explicar: "cargo dice X pero tiene Y reportes"
  → Dos opciones claras

DISEÑO:
- Clases FocalizaHR premium
- Colores track: red (EJECUTIVO), amber (MANAGER), emerald (COLABORADOR)
- Framer-motion para animaciones
- Iconos lucide-react

CRITERIOS:
- TypeScript strict sin errores
- NO llama APIs directamente (usa callback onClassify)
- Keyboard navegable
- Responsive desde 320px
```

## 📚 REFERENCIAS

- TASK_03C-v2: Hook useClassificationDraft (proporciona employees)
- Componente existente: `src/components/job-classification/UnmappedPositionsDrawer.tsx` (reemplaza)
- PositionAdapter: `src/lib/services/PositionAdapter.ts` (lógica de sugerencia)
- Design system: `FILOSOFIA_DISENO_FOCALIZAHR_v2.md`
