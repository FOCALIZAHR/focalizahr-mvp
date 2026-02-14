# TASK_03C-v2: JobClassificationCinema + Draft State

## 🎯 OBJETIVO

Crear el sistema de draft state para clasificación de cargos que evita persistencia prematura a Employee. El usuario puede clasificar, revisar y cancelar sin afectar la base de datos hasta confirmar explícitamente.

## 📋 CONTEXTO

### Problema Actual
```yaml
BUG ARQUITECTÓNICO:
  - JobClassificationGate.tsx guarda DIRECTO a Employee
  - Cada "guardar" llama POST /api/job-classification/assign
  - Si usuario cancela wizard → datos huérfanos en BD
  - No hay rollback posible

IMPACTO:
  - UX rota: cambios irreversibles antes de confirmar
  - Datos inconsistentes si cancela a mitad
  - No cumple filosofía FocalizaHR de "cambios solo al confirmar"
```

### Solución
```yaml
DRAFT STATE:
  - Clasificaciones en localStorage hasta "Continuar"
  - Batch API al confirmar (transacción atómica)
  - Cancelar = descartar draft (sin tocar BD)
  - Reentrar wizard = recuperar draft si existe
```

## 🏗️ ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────────┐
│                    WIZARD PASO 3B                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           JobClassificationCinema                        │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │        useClassificationDraft                    │    │   │
│  │  │  ┌─────────────────────────────────────────┐    │    │   │
│  │  │  │       localStorage                       │    │    │   │
│  │  │  │   classification-draft-{accountId}       │    │    │   │
│  │  │  └─────────────────────────────────────────┘    │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │Classification│  │Approval      │  │Review        │  │   │
│  │  │Summary       │  │Preview       │  │Wizard        │  │   │
│  │  │(reutiliza)   │  │(TASK_03D)    │  │(TASK_03E)    │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Cancelar]                              [Continuar →]          │
│      │                                        │                 │
│      ▼                                        ▼                 │
│  clearDraft()                         handleContinue()          │
│  localStorage.remove()                POST /batch-assign        │
│  goBack()                             persist to Employee       │
│                                       goNextStep()              │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```typescript
// 1. CARGA INICIAL
GET /api/job-classification/review?accountId=xxx
→ Retorna Employee[] con clasificación actual
→ Hook inicializa draft desde API o localStorage (si existe)

// 2. USUARIO CLASIFICA
updateClassification(employeeId, track)
→ Actualiza draft en memoria
→ Persiste a localStorage (debounced)
→ NO toca BD

// 3. USUARIO CONFIRMA
handleContinue()
→ Valida pendingCount === 0
→ POST /api/job-classification/batch-assign (TASK_03F)
→ Limpia localStorage
→ Navega siguiente paso

// 4. USUARIO CANCELA
handleCancel()
→ Limpia localStorage
→ Navega paso anterior
→ NO toca BD
```

## 📁 ARCHIVOS

### CREAR

```yaml
src/hooks/useClassificationDraft.ts:
  - Hook principal de draft state
  - localStorage management
  - Métodos: approveAll, updateOne, handleContinue, handleCancel

src/components/job-classification/JobClassificationCinema.tsx:
  - Orquestador principal (reemplaza JobClassificationGate)
  - Consume useClassificationDraft
  - Renderiza Hero + CTAs + subcomponentes

src/types/job-classification.ts:
  - Interfaces TypeScript
  - ClassificationDraft, ClassificationEmployee, etc.
```

### MODIFICAR

```yaml
src/app/dashboard/campaigns/new/page.tsx:
  - Importar JobClassificationCinema en lugar de JobClassificationGate
  - Pasar onComplete y onCancel

src/components/job-classification/index.ts:
  - Exportar nuevos componentes
  - Marcar JobClassificationGate como @deprecated
```

### REUTILIZAR

```yaml
src/components/job-classification/ClassificationSummary.tsx:
  - Gauge circular + distribución por track
  - Sin cambios necesarios

src/components/job-classification/PositionAssignmentCard.tsx:
  - Card individual de posición
  - Modificar para aceptar onUpdate callback (sin persist)
```

## 🔧 IMPLEMENTACIÓN DETALLADA

### Paso 1: Crear tipos TypeScript

```typescript
// src/types/job-classification.ts

export type PerformanceTrack = 'COLABORADOR' | 'MANAGER' | 'EJECUTIVO';

export interface ClassificationEmployee {
  id: string;
  fullName: string;
  position: string;
  departmentName: string | null;
  directReportsCount: number;
  
  // Clasificación actual (de Employee)
  currentTrack: PerformanceTrack | null;
  currentJobLevel: string | null;
  
  // Clasificación en draft
  draftTrack: PerformanceTrack | null;
  draftJobLevel: string | null;
  
  // Metadata
  suggestedTrack: PerformanceTrack;
  confidence: number;
  anomalyType: 'NONE' | 'NO_MATCH' | 'CONFLICT' | null;
  isReviewed: boolean;
}

export interface ClassificationDraft {
  accountId: string;
  createdAt: string;
  updatedAt: string;
  employees: ClassificationEmployee[];
}

export interface ClassificationSummary {
  total: number;
  classified: number;
  pending: number;
  byTrack: {
    EJECUTIVO: number;
    MANAGER: number;
    COLABORADOR: number;
  };
  anomalies: number;
}

export interface UseClassificationDraftReturn {
  // Estado
  draft: ClassificationDraft | null;
  summary: ClassificationSummary;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  
  // Acciones
  approveAll: () => void;
  approveByTrack: (track: PerformanceTrack) => void;
  updateClassification: (employeeId: string, track: PerformanceTrack, jobLevel: string) => void;
  resetEmployee: (employeeId: string) => void;
  
  // Persistencia
  handleContinue: () => Promise<boolean>;
  handleCancel: () => void;
  
  // Helpers
  getEmployee: (employeeId: string) => ClassificationEmployee | undefined;
  getPendingEmployees: () => ClassificationEmployee[];
  getClassifiedEmployees: () => ClassificationEmployee[];
}
```

### Paso 2: Crear useClassificationDraft Hook

```typescript
// src/hooks/useClassificationDraft.ts

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/toast-system';
import type {
  ClassificationDraft,
  ClassificationEmployee,
  ClassificationSummary,
  PerformanceTrack,
  UseClassificationDraftReturn
} from '@/types/job-classification';

const STORAGE_KEY_PREFIX = 'fhr-classification-draft-';
const DEBOUNCE_MS = 500;

interface UseClassificationDraftOptions {
  accountId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function useClassificationDraft({
  accountId,
  onComplete,
  onCancel
}: UseClassificationDraftOptions): UseClassificationDraftReturn {
  const { showSuccess, showError } = useToast();
  
  const [draft, setDraft] = useState<ClassificationDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const storageKey = `${STORAGE_KEY_PREFIX}${accountId}`;
  
  // ══════════════════════════════════════════════════════════════════════════
  // INICIALIZACIÓN
  // ══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    async function initialize() {
      setIsLoading(true);
      setError(null);
      
      try {
        // 1. Intentar cargar draft existente de localStorage
        const savedDraft = localStorage.getItem(storageKey);
        
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft) as ClassificationDraft;
          // Validar que no esté expirado (24h max)
          const createdAt = new Date(parsed.createdAt);
          const now = new Date();
          const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff < 24) {
            setDraft(parsed);
            setIsLoading(false);
            return;
          } else {
            // Draft expirado, limpiar
            localStorage.removeItem(storageKey);
          }
        }
        
        // 2. Cargar datos frescos de API
        const response = await fetch(`/api/job-classification/review?mode=draft`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Error cargando clasificaciones');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Error desconocido');
        }
        
        // 3. Crear draft inicial
        const newDraft: ClassificationDraft = {
          accountId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          employees: data.employees.map((emp: any) => ({
            id: emp.id,
            fullName: emp.fullName,
            position: emp.position || '',
            departmentName: emp.departmentName,
            directReportsCount: emp.directReportsCount || 0,
            currentTrack: emp.performanceTrack,
            currentJobLevel: emp.standardJobLevel,
            draftTrack: emp.performanceTrack,
            draftJobLevel: emp.standardJobLevel,
            suggestedTrack: emp.suggestedTrack || 'COLABORADOR',
            confidence: emp.confidence || 0,
            anomalyType: emp.anomalyType || 'NONE',
            isReviewed: emp.standardJobLevel !== null
          }))
        };
        
        setDraft(newDraft);
        
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error inicializando';
        setError(message);
        showError(message);
      } finally {
        setIsLoading(false);
      }
    }
    
    initialize();
  }, [accountId, storageKey, showError]);
  
  // ══════════════════════════════════════════════════════════════════════════
  // PERSISTENCIA LOCAL (Debounced)
  // ══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (!draft || !isDirty) return;
    
    const timeout = setTimeout(() => {
      const toSave = {
        ...draft,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(toSave));
      setIsDirty(false);
    }, DEBOUNCE_MS);
    
    return () => clearTimeout(timeout);
  }, [draft, isDirty, storageKey]);
  
  // ══════════════════════════════════════════════════════════════════════════
  // SUMMARY COMPUTADO
  // ══════════════════════════════════════════════════════════════════════════
  
  const summary = useMemo<ClassificationSummary>(() => {
    if (!draft) {
      return {
        total: 0,
        classified: 0,
        pending: 0,
        byTrack: { EJECUTIVO: 0, MANAGER: 0, COLABORADOR: 0 },
        anomalies: 0
      };
    }
    
    const employees = draft.employees;
    const classified = employees.filter(e => e.draftTrack !== null);
    const pending = employees.filter(e => e.draftTrack === null);
    const anomalies = employees.filter(e => e.anomalyType && e.anomalyType !== 'NONE');
    
    return {
      total: employees.length,
      classified: classified.length,
      pending: pending.length,
      byTrack: {
        EJECUTIVO: classified.filter(e => e.draftTrack === 'EJECUTIVO').length,
        MANAGER: classified.filter(e => e.draftTrack === 'MANAGER').length,
        COLABORADOR: classified.filter(e => e.draftTrack === 'COLABORADOR').length
      },
      anomalies: anomalies.length
    };
  }, [draft]);
  
  // ══════════════════════════════════════════════════════════════════════════
  // ACCIONES
  // ══════════════════════════════════════════════════════════════════════════
  
  const updateClassification = useCallback((
    employeeId: string,
    track: PerformanceTrack,
    jobLevel: string
  ) => {
    setDraft(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        employees: prev.employees.map(emp =>
          emp.id === employeeId
            ? { ...emp, draftTrack: track, draftJobLevel: jobLevel, isReviewed: true }
            : emp
        )
      };
    });
    setIsDirty(true);
  }, []);
  
  const approveAll = useCallback(() => {
    setDraft(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        employees: prev.employees.map(emp => ({
          ...emp,
          draftTrack: emp.draftTrack || emp.suggestedTrack,
          isReviewed: true
        }))
      };
    });
    setIsDirty(true);
  }, []);
  
  const approveByTrack = useCallback((track: PerformanceTrack) => {
    setDraft(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        employees: prev.employees.map(emp =>
          emp.suggestedTrack === track && !emp.isReviewed
            ? { ...emp, draftTrack: track, isReviewed: true }
            : emp
        )
      };
    });
    setIsDirty(true);
  }, []);
  
  const resetEmployee = useCallback((employeeId: string) => {
    setDraft(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        employees: prev.employees.map(emp =>
          emp.id === employeeId
            ? { ...emp, draftTrack: emp.currentTrack, draftJobLevel: emp.currentJobLevel, isReviewed: false }
            : emp
        )
      };
    });
    setIsDirty(true);
  }, []);
  
  // ══════════════════════════════════════════════════════════════════════════
  // PERSISTENCIA FINAL
  // ══════════════════════════════════════════════════════════════════════════
  
  const handleContinue = useCallback(async (): Promise<boolean> => {
    if (!draft) return false;
    
    // Validar que no hay pendientes
    const pending = draft.employees.filter(e => e.draftTrack === null);
    if (pending.length > 0) {
      showError(`Aún hay ${pending.length} empleados sin clasificar`);
      return false;
    }
    
    try {
      // Preparar payload para batch API
      const classifications = draft.employees
        .filter(emp => emp.draftTrack !== emp.currentTrack || emp.draftJobLevel !== emp.currentJobLevel)
        .map(emp => ({
          employeeId: emp.id,
          performanceTrack: emp.draftTrack!,
          standardJobLevel: emp.draftJobLevel!
        }));
      
      if (classifications.length === 0) {
        // No hay cambios, solo continuar
        localStorage.removeItem(storageKey);
        showSuccess('Clasificación confirmada');
        onComplete?.();
        return true;
      }
      
      // Llamar batch API (TASK_03F)
      const response = await fetch('/api/job-classification/batch-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ classifications })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error guardando clasificaciones');
      }
      
      // Limpiar draft
      localStorage.removeItem(storageKey);
      
      showSuccess(`${classifications.length} clasificaciones guardadas`);
      onComplete?.();
      return true;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error guardando';
      showError(message);
      return false;
    }
  }, [draft, storageKey, showSuccess, showError, onComplete]);
  
  const handleCancel = useCallback(() => {
    localStorage.removeItem(storageKey);
    setDraft(null);
    onCancel?.();
  }, [storageKey, onCancel]);
  
  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════
  
  const getEmployee = useCallback((employeeId: string) => {
    return draft?.employees.find(e => e.id === employeeId);
  }, [draft]);
  
  const getPendingEmployees = useCallback(() => {
    return draft?.employees.filter(e => e.draftTrack === null) || [];
  }, [draft]);
  
  const getClassifiedEmployees = useCallback(() => {
    return draft?.employees.filter(e => e.draftTrack !== null) || [];
  }, [draft]);
  
  // ══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ══════════════════════════════════════════════════════════════════════════
  
  return {
    draft,
    summary,
    isLoading,
    error,
    isDirty,
    approveAll,
    approveByTrack,
    updateClassification,
    resetEmployee,
    handleContinue,
    handleCancel,
    getEmployee,
    getPendingEmployees,
    getClassifiedEmployees
  };
}
```

### Paso 3: Crear JobClassificationCinema

```typescript
// src/components/job-classification/JobClassificationCinema.tsx

'use client';

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClassificationDraft } from '@/hooks/useClassificationDraft';
import { ClassificationSummary } from './ClassificationSummary';
import { ClassificationApprovalPreview } from './ClassificationApprovalPreview';
import { ClassificationReviewWizard } from './ClassificationReviewWizard';
import { Loader2, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface JobClassificationCinemaProps {
  mode: 'client' | 'admin';
  onComplete?: () => void;
  onCancel?: () => void;
  accountId?: string; // Solo para admin
}

type ViewState = 'hero' | 'approval' | 'review';

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export const JobClassificationCinema = memo(function JobClassificationCinema({
  mode,
  onComplete,
  onCancel,
  accountId
}: JobClassificationCinemaProps) {
  const [viewState, setViewState] = useState<ViewState>('hero');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    draft,
    summary,
    isLoading,
    error,
    approveAll,
    updateClassification,
    handleContinue,
    handleCancel,
    getPendingEmployees,
    getClassifiedEmployees
  } = useClassificationDraft({
    accountId: accountId || '',
    onComplete,
    onCancel
  });
  
  // ════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════════════════════════════════
  
  const handleApproveAll = useCallback(() => {
    approveAll();
    // Si no hay pendientes, ir directo a confirmar
    if (summary.pending === 0) {
      handleFinalConfirm();
    } else {
      setViewState('approval');
    }
  }, [approveAll, summary.pending]);
  
  const handleReviewPending = useCallback(() => {
    setViewState('review');
  }, []);
  
  const handleBackToHero = useCallback(() => {
    setViewState('hero');
  }, []);
  
  const handleFinalConfirm = useCallback(async () => {
    setIsSubmitting(true);
    const success = await handleContinue();
    setIsSubmitting(false);
    
    if (success) {
      // 🎉 Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22D3EE', '#A78BFA', '#10B981']
      });
    }
  }, [handleContinue]);
  
  const handleCancelFlow = useCallback(() => {
    if (window.confirm('¿Seguro que deseas cancelar? Los cambios no guardados se perderán.')) {
      handleCancel();
    }
  }, [handleCancel]);
  
  // ════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ════════════════════════════════════════════════════════════════════════
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-slate-400">Cargando clasificaciones...</p>
      </div>
    );
  }
  
  // ════════════════════════════════════════════════════════════════════════
  // ERROR STATE
  // ════════════════════════════════════════════════════════════════════════
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-red-400 text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="fhr-btn-secondary"
        >
          Reintentar
        </button>
      </div>
    );
  }
  
  // ════════════════════════════════════════════════════════════════════════
  // COMPLETE STATE (100%)
  // ════════════════════════════════════════════════════════════════════════
  
  if (summary.pending === 0 && viewState === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Hero Card */}
        <div className="fhr-card p-8 text-center">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full animate-pulse" />
            <div className="absolute inset-2 bg-slate-800 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
          
          <h2 className="fhr-title-gradient text-2xl font-bold mb-2">
            ¡Clasificación Completa!
          </h2>
          <p className="text-slate-400 mb-6">
            {summary.total} empleados clasificados correctamente
          </p>
          
          {/* Distribución */}
          <ClassificationSummary
            total={summary.total}
            byTrack={summary.byTrack}
            variant="compact"
          />
        </div>
        
        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={handleCancelFlow}
            className="fhr-btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancelar
          </button>
          
          <button
            onClick={handleFinalConfirm}
            disabled={isSubmitting}
            className="fhr-btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continuar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    );
  }
  
  // ════════════════════════════════════════════════════════════════════════
  // HERO VIEW (Pendientes > 0)
  // ════════════════════════════════════════════════════════════════════════
  
  if (viewState === 'hero') {
    const classifiedCount = summary.classified;
    const pendingCount = summary.pending;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Hero Card */}
        <div className="fhr-card p-8">
          <h2 className="fhr-title-gradient text-2xl font-bold text-center mb-6">
            Clasificación Inteligente de Cargos
          </h2>
          
          {/* Summary Gauge */}
          <ClassificationSummary
            total={summary.total}
            classified={summary.classified}
            pending={summary.pending}
            byTrack={summary.byTrack}
            anomalies={summary.anomalies}
          />
          
          {/* Info Boxes */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">{classifiedCount} clasificados</span>
              </div>
              <p className="text-xs text-slate-400">Con 95%+ confianza</p>
            </div>
            
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-semibold">{pendingCount} pendientes</span>
              </div>
              <p className="text-xs text-slate-400">Requieren tu decisión</p>
            </div>
          </div>
        </div>
        
        {/* CTAs */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleApproveAll}
            className="fhr-card p-6 text-left hover:border-emerald-500/50 transition-colors group"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-white mb-1">Aprobar {classifiedCount}</h3>
            <p className="text-sm text-slate-400">
              Confirmar clasificaciones con alta confianza
            </p>
          </button>
          
          <button
            onClick={handleReviewPending}
            className="fhr-card p-6 text-left hover:border-amber-500/50 transition-colors group"
          >
            <AlertTriangle className="w-8 h-8 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-white mb-1">Revisar {pendingCount}</h3>
            <p className="text-sm text-slate-400">
              Clasificar cargos que requieren decisión
            </p>
          </button>
        </div>
        
        {/* Cancel */}
        <div className="flex justify-start">
          <button
            onClick={handleCancelFlow}
            className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancelar y volver
          </button>
        </div>
      </motion.div>
    );
  }
  
  // ════════════════════════════════════════════════════════════════════════
  // APPROVAL VIEW
  // ════════════════════════════════════════════════════════════════════════
  
  if (viewState === 'approval') {
    return (
      <ClassificationApprovalPreview
        employees={getClassifiedEmployees()}
        onApproveAll={handleFinalConfirm}
        onBack={handleBackToHero}
        isSubmitting={isSubmitting}
      />
    );
  }
  
  // ════════════════════════════════════════════════════════════════════════
  // REVIEW VIEW
  // ════════════════════════════════════════════════════════════════════════
  
  if (viewState === 'review') {
    return (
      <ClassificationReviewWizard
        employees={getPendingEmployees()}
        onClassify={updateClassification}
        onComplete={() => {
          if (summary.pending === 0) {
            setViewState('hero');
          }
        }}
        onBack={handleBackToHero}
      />
    );
  }
  
  return null;
});

export default JobClassificationCinema;
```

### Paso 4: Actualizar index.ts

```typescript
// src/components/job-classification/index.ts

// NUEVOS (v2 - Draft State)
export { JobClassificationCinema } from './JobClassificationCinema';
export { ClassificationApprovalPreview } from './ClassificationApprovalPreview';
export { ClassificationReviewWizard } from './ClassificationReviewWizard';

// REUTILIZADOS
export { ClassificationSummary } from './ClassificationSummary';
export { PositionAssignmentCard } from './PositionAssignmentCard';

// DEPRECATED - No usar en nuevas implementaciones
/** @deprecated Use JobClassificationCinema instead */
export { JobClassificationGate } from './JobClassificationGate';
```

## ✅ CRITERIOS DE ACEPTACIÓN

### Funcionales
- [ ] Draft se guarda en localStorage al modificar clasificación
- [ ] Draft se recupera al reentrar al paso 3B (dentro de 24h)
- [ ] Draft se elimina al cancelar
- [ ] Draft se elimina al confirmar exitosamente
- [ ] No se llama a ningún endpoint de persistencia hasta "Continuar"
- [ ] handleContinue llama batch-assign con todas las clasificaciones
- [ ] Error en batch-assign NO elimina el draft (permite reintentar)

### Técnicos
- [ ] TypeScript strict mode sin errores
- [ ] Hook useClassificationDraft exportado correctamente
- [ ] localStorage key incluye accountId para multi-tenant
- [ ] Debounce de 500ms en guardado a localStorage
- [ ] Draft expira después de 24h

### UX
- [ ] Loading state mientras carga datos iniciales
- [ ] Error state con botón reintentar
- [ ] Confirmación antes de cancelar (si hay cambios)
- [ ] Confetti al completar clasificación exitosa
- [ ] Responsive desde 320px
- [ ] Navegable con teclado

## 🧪 TESTING

### Unit Tests (Jest)

```typescript
// src/hooks/__tests__/useClassificationDraft.test.ts

describe('useClassificationDraft', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  
  it('should load from localStorage if draft exists', async () => {
    // Arrange
    const mockDraft = { accountId: 'test', employees: [], createdAt: new Date().toISOString() };
    localStorage.setItem('fhr-classification-draft-test', JSON.stringify(mockDraft));
    
    // Act
    const { result } = renderHook(() => useClassificationDraft({ accountId: 'test' }));
    
    // Assert
    await waitFor(() => expect(result.current.draft).toBeDefined());
  });
  
  it('should save to localStorage on updateClassification', () => {
    // ...
  });
  
  it('should clear localStorage on handleCancel', () => {
    // ...
  });
  
  it('should NOT call API until handleContinue', () => {
    // ...
  });
});
```

### Component Tests (RTL)

```typescript
// src/components/job-classification/__tests__/JobClassificationCinema.test.tsx

describe('JobClassificationCinema', () => {
  it('should show hero view initially', () => {
    render(<JobClassificationCinema mode="client" />);
    expect(screen.getByText('Clasificación Inteligente de Cargos')).toBeInTheDocument();
  });
  
  it('should navigate to review on "Revisar N" click', () => {
    // ...
  });
  
  it('should show confetti on successful submit', () => {
    // ...
  });
});
```

### Edge Cases

```yaml
CASO 1: Usuario cierra browser sin guardar
  Esperado: localStorage persiste draft
  Al reabrir: Draft se recupera automáticamente

CASO 2: Draft expirado (>24h)
  Esperado: Se descarta draft viejo
  Se cargan datos frescos de API

CASO 3: API batch-assign falla
  Esperado: Draft NO se elimina
  Usuario puede reintentar
  Error toast visible

CASO 4: Múltiples tabs abiertas
  Esperado: Última escritura gana (localStorage)
  No hay conflictos críticos
```

## 🤖 PROMPT PARA CLAUDE CODE

```
Implementa TASK_03C-v2: JobClassificationCinema + Draft State

CONTEXTO:
El componente actual JobClassificationGate.tsx tiene un bug arquitectónico:
guarda clasificaciones directamente a Employee antes de confirmar el wizard.
Necesitamos reemplazarlo con un sistema de draft state.

ARCHIVOS A CREAR:

1. src/types/job-classification.ts
   - Interfaces ClassificationDraft, ClassificationEmployee, ClassificationSummary
   - Type PerformanceTrack
   - Interface UseClassificationDraftReturn

2. src/hooks/useClassificationDraft.ts
   - localStorage con key: fhr-classification-draft-{accountId}
   - Métodos: approveAll, updateClassification, handleContinue, handleCancel
   - NO llamar APIs de persistencia hasta handleContinue
   - Debounce 500ms para guardar a localStorage
   - Expiración de draft: 24h

3. src/components/job-classification/JobClassificationCinema.tsx
   - Reemplaza JobClassificationGate
   - Estados: hero | approval | review
   - Consume useClassificationDraft
   - Confetti al completar (canvas-confetti)

4. Actualizar src/components/job-classification/index.ts
   - Exportar nuevos componentes
   - Marcar JobClassificationGate como @deprecated

REFERENCIAS:
- src/components/job-classification/ClassificationSummary.tsx (reutilizar)
- src/components/job-classification/PositionAssignmentCard.tsx (reutilizar)
- src/hooks/useParticipantUpload.ts (patrón similar)

CRITERIOS:
- TypeScript strict sin errores
- No persistir a BD hasta handleContinue
- localStorage multi-tenant (incluir accountId en key)
- Responsive desde 320px

NOTA: ClassificationApprovalPreview y ClassificationReviewWizard se crean en TASKs separadas (03D y 03E).
Por ahora, importarlos pero pueden ser stubs vacíos.
```

## 📚 REFERENCIAS

- Componente actual: `src/components/job-classification/JobClassificationGate.tsx`
- Patrón draft similar: `src/hooks/useParticipantUpload.ts`
- API existente: `src/app/api/job-classification/review/route.ts`
- Design system: `FILOSOFIA_DISENO_FOCALIZAHR_v2.md`
- Documentación arquitectura: `GUIA_MAESTRA_TECNICA_FOCALIZAHR_ENTERPRISE_v3_5_2.md`
