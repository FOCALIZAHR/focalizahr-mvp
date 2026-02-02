# TASK: Refactorizar EvaluationReviewModal.tsx v2.0 Premium

## Contexto
Modal de revisión pre-envío para evaluaciones de desempeño 360°.
Filosofía: "Entender 3s, Decidir 10s, Actuar 1 clic"

## Archivos a Modificar
- `src/components/evaluation/EvaluationReviewModal.tsx`
- **CREAR**: `src/lib/validators/responseValidator.ts`

## Archivos de Referencia (LEER PRIMERO)
- `src/styles/focalizahr-unified.css` - Design system
- `src/components/ui/PremiumButton.tsx` - Botones premium (si existe)
- Componentes existentes en `/components/evaluation/`

---

## PARTE 1: Extraer Validador Compartido

**Crear** `src/lib/validators/responseValidator.ts`:

```typescript
import type { Question, SurveyResponse } from '@/types/survey';

export function isResponseAnswered(
  question: Question,
  response: SurveyResponse | undefined
): boolean {
  if (!response) return false;

  switch (question.responseType) {
    case 'rating_scale':
      return response.rating != null && response.rating >= 1;
    case 'nps_scale':
      return response.rating != null && response.rating >= 0;
    case 'text_open':
      return !!response.textResponse && response.textResponse.trim().length >= 10;
    case 'single_choice':
    case 'multiple_choice':
      return !!response.choiceResponse && response.choiceResponse.length > 0;
    case 'rating_matrix_conditional':
      return !!response.matrixResponses && Object.keys(response.matrixResponses).length > 0;
    case 'competency_behavior':
      return response.rating != null && response.rating >= 1 && response.rating <= 5;
    default:
      return false;
  }
}
```

**Usar en**: `useSurveyEngine.ts` y `EvaluationReviewModal.tsx`

---

## PARTE 2: Header con Línea Tesla

**Props requeridas**:
```typescript
interface EvaluationReviewModalProps {
  evaluateeName: string;
  evaluateePosition?: string;
  evaluateeDepartment?: string;
  evaluationType?: 'SELF' | 'MANAGER_TO_SUBORDINATE' | 'PEER' | 'SUBORDINATE_TO_MANAGER';
  // ... resto
}
```

**Header**:
```tsx
{/* Línea Tesla - usar clase del design system */}
<div className="fhr-top-line" />

<div className="px-6 py-5 border-b border-slate-700/50">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
        Tu evaluación de
      </p>
      <h2 className="text-xl font-light text-slate-100">
        {evaluateeName}
      </h2>
      {(evaluateePosition || evaluateeDepartment) && (
        <p className="text-sm text-slate-400 mt-0.5">
          {evaluateePosition}{evaluateePosition && evaluateeDepartment && ' · '}{evaluateeDepartment}
        </p>
      )}
    </div>
    <button 
      onClick={onClose} 
      className="p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-700/50"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
</div>
```

---

## PARTE 3: Sistema de Clasificación (SIN EMOJIS)

**⚠️ CRÍTICO**: FocalizaHR usa iconos Lucide, NO emojis.

```typescript
import { Star, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';

// Clasificación con iconos Lucide profesionales
const CLASSIFICATION_CONFIG = {
  outstanding: {
    label: 'Destacado',
    color: 'cyan',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/30',
    Icon: Star
  },
  meets: {
    label: 'Cumple Expectativas',
    color: 'green',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    Icon: CheckCircle
  },
  developing: {
    label: 'En Desarrollo',
    color: 'yellow',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    Icon: TrendingUp
  },
  needsImprovement: {
    label: 'Necesita Mejora',
    color: 'red',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
    Icon: AlertTriangle
  }
} as const;

function getClassification(avg: number) {
  if (avg >= 4.5) return CLASSIFICATION_CONFIG.outstanding;
  if (avg >= 3.5) return CLASSIFICATION_CONFIG.meets;
  if (avg >= 2.5) return CLASSIFICATION_CONFIG.developing;
  return CLASSIFICATION_CONFIG.needsImprovement;
}
```

---

## PARTE 4: Card Resumen Protagonista

```tsx
const summary = useMemo(() => {
  const ratingQuestions = questions.filter(q =>
    q.responseType === 'rating_scale' ||
    q.responseType === 'competency_behavior'
  );

  const ratings = ratingQuestions
    .map((q, idx) => responses[idx]?.rating)
    .filter((r): r is number => r != null && r >= 1);

  const average = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 0;

  const classification = getClassification(average);

  // Promedios por categoría
  const byCategory: Record<string, { sum: number; count: number }> = {};
  ratingQuestions.forEach((q, idx) => {
    const rating = responses[idx]?.rating;
    if (rating != null && rating >= 1) {
      const cat = q.subcategory || q.category || 'General';
      if (!byCategory[cat]) byCategory[cat] = { sum: 0, count: 0 };
      byCategory[cat].sum += rating;
      byCategory[cat].count++;
    }
  });

  const categoryAverages = Object.entries(byCategory)
    .map(([name, data]) => ({
      name,
      average: data.count > 0 ? data.sum / data.count : 0,
      count: data.count
    }))
    .sort((a, b) => b.average - a.average);

  return { average, classification, categoryAverages, totalRatings: ratings.length };
}, [questions, responses]);
```

**Render Card**:
```tsx
{/* Card Resumen - PROTAGONISTA */}
<div className="fhr-card mx-6 mt-4 p-5">
  {/* Score y Clasificación */}
  <div className="flex items-center justify-center gap-8 mb-4">
    {/* Promedio */}
    <div className="text-center">
      <div className="text-3xl font-light text-cyan-400">
        {summary.average.toFixed(1)}
      </div>
      <div className="text-xs text-slate-500 uppercase tracking-wider">
        Promedio
      </div>
    </div>

    {/* Separador */}
    <div className="w-px h-12 bg-slate-700" />

    {/* Clasificación con icono Lucide */}
    <div className="text-center">
      <div className={`flex items-center justify-center gap-2 ${summary.classification.textClass}`}>
        <summary.classification.Icon className="w-5 h-5" />
        <span className="text-lg font-medium">
          {summary.classification.label}
        </span>
      </div>
      <div className="text-xs text-slate-500 uppercase tracking-wider">
        Clasificación
      </div>
    </div>
  </div>

  {/* Barras por categoría */}
  {summary.categoryAverages.length > 0 && (
    <div className="space-y-2 pt-4 border-t border-slate-700/50">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
        Por Competencia
      </p>
      {summary.categoryAverages.slice(0, 4).map(cat => (
        <div key={cat.name} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-24 truncate capitalize">
            {cat.name.replace(/_/g, ' ')}
          </span>
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${(cat.average / 5) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-300 w-8">
            {cat.average.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  )}
</div>
```

---

## PARTE 5: Progressive Disclosure

```tsx
const [showDetails, setShowDetails] = useState(false);

{/* Toggle de detalle */}
<button
  onClick={() => setShowDetails(!showDetails)}
  className="w-full px-6 py-3 flex items-center justify-between text-sm text-slate-400 hover:text-cyan-400 transition-colors"
>
  <span>Ver detalle por pregunta</span>
  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
</button>

{/* Detalle colapsable */}
<AnimatePresence>
  {showDetails && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      {/* Contenido actual de groupedResponses */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## PARTE 6: Footer Simplificado

```tsx
<div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
  <button
    onClick={onClose}
    className="fhr-btn fhr-btn-ghost"
  >
    <ArrowLeft className="w-4 h-4" />
    Volver a editar
  </button>

  <button
    onClick={onConfirm}
    disabled={!validation.isComplete || isSubmitting}
    className="fhr-btn fhr-btn-primary"
  >
    {isSubmitting ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        Enviando...
      </>
    ) : (
      <>
        Confirmar y Enviar
        <Send className="w-4 h-4" />
      </>
    )}
  </button>
</div>

{/* Warning SOLO si hay incompletas */}
{!validation.isComplete && (
  <div className="px-6 pb-4">
    <p className="text-xs text-amber-400 text-center">
      Completa las {validation.unanswered} pregunta{validation.unanswered !== 1 ? 's' : ''} restante{validation.unanswered !== 1 ? 's' : ''} para enviar
    </p>
  </div>
)}
```

---

## Checklist de Validación

```yaml
ICONOGRAFÍA:
  ✅ Iconos Lucide (Star, CheckCircle, TrendingUp, AlertTriangle)
  ❌ NO usar emojis (🌟, 🟢, 🟡, 🔴)

CLASES CSS:
  ✅ Usar clases .fhr-* del design system
  ✅ .fhr-top-line para línea Tesla
  ✅ .fhr-card para cards
  ✅ .fhr-btn .fhr-btn-primary para CTA
  ✅ .fhr-btn .fhr-btn-ghost para secundario

COLORES (no dinámicos):
  ✅ Definir clases completas en config
  ❌ NO usar template literals para clases Tailwind

FILOSOFÍA:
  ✅ Above the fold: Score + Clasificación visible
  ✅ UN CTA principal: "Confirmar y Enviar"
  ✅ Progressive disclosure: Detalle colapsado
  ✅ Jerarquía clara: Nombre evaluado → Score → Acción
```

---

## Imports Necesarios

```typescript
'use client';

import { memo, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronDown,
  ArrowLeft,
  Send,
  Loader2,
  Star,
  CheckCircle,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { isResponseAnswered } from '@/lib/validators/responseValidator';
```
