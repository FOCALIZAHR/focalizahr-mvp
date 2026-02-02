# TASK: EvaluationReviewModal v2.0 Premium - Refinamiento UX

## Contexto
Modal de revisión pre-envío para evaluaciones de desempeño 360°.
**Filosofía:** "Entender 3s, Decidir 10s, Actuar 1 clic"

## Archivos a Modificar
- `src/components/evaluation/EvaluationReviewModal.tsx`
- **CREAR**: `src/lib/validators/responseValidator.ts`

## Archivos de Referencia (LEER PRIMERO)
- `src/styles/focalizahr-unified.css` → Variables y clases .fhr-*
- `src/components/ui/PremiumButton.tsx` → Botones sólidos
- `src/config/exitAlertConfig.ts` → Función getScale5Classification

---

## PARTE 1: Validador Compartido

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

---

## PARTE 2: Sistema de Clasificación (Alineado al Motor)

**Usar iconos Lucide profesionales, NO emojis.**
**Alinear umbrales con `getScale5Classification` del motor.**

```typescript
import { Star, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';

// Clasificación oficial FocalizaHR - Escala 1-5
const PERFORMANCE_CLASSIFICATION = {
  exceptional: {
    min: 4.5,
    label: 'Excepcional',
    Icon: Star,
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/30'
  },
  good: {
    min: 4.0,  // Alineado con motor: >= 4.0 = healthy
    label: 'Buen Desempeño',
    Icon: CheckCircle,
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30'
  },
  meets: {
    min: 3.5,  // Alineado con motor: 3.5-4.0 = neutral
    label: 'Cumple Expectativas',
    Icon: CheckCircle,
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30'
  },
  developing: {
    min: 2.5,  // Alineado con motor: 2.5-3.5 = problematic
    label: 'En Desarrollo',
    Icon: TrendingUp,
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30'
  },
  needs: {
    min: 0,    // Alineado con motor: < 2.5 = toxic
    label: 'Requiere Atención',
    Icon: AlertTriangle,
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30'
  }
} as const;

function getPerformanceClassification(score: number) {
  if (score >= 4.5) return PERFORMANCE_CLASSIFICATION.exceptional;
  if (score >= 4.0) return PERFORMANCE_CLASSIFICATION.good;
  if (score >= 3.5) return PERFORMANCE_CLASSIFICATION.meets;
  if (score >= 2.5) return PERFORMANCE_CLASSIFICATION.developing;
  return PERFORMANCE_CLASSIFICATION.needs;
}
```

---

## PARTE 3: Props e Imports

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

// Botones Premium FocalizaHR (sólidos con gradiente)
import { PrimaryButton, GhostButton, ButtonGroup } from '@/components/ui/PremiumButton';

// Validador compartido
import { isResponseAnswered } from '@/lib/validators/responseValidator';

interface EvaluationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  
  // Contexto del evaluado
  evaluateeName: string;
  evaluateePosition?: string;
  evaluateeDepartment?: string;
  
  // Data
  questions: Question[];
  responses: SurveyResponse[];
  validation: {
    isComplete: boolean;
    answered: number;
    total: number;
    unanswered: number;
  };
}
```

---

## PARTE 4: Header con Línea Tesla + Contexto

**Usar clase `.fhr-top-line` del design system.**

```tsx
{/* MODAL CONTAINER */}
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Overlay */}
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
    onClick={onClose}
  />

  {/* Modal Content */}
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 20 }}
    className="relative w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
  >
    {/* LÍNEA TESLA - Clase del design system */}
    <div className="fhr-top-line" />

    {/* HEADER */}
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
              {evaluateePosition}
              {evaluateePosition && evaluateeDepartment && ' · '}
              {evaluateeDepartment}
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

    {/* MENSAJE GUÍA */}
    <div className="px-6 pt-4">
      <p className="text-sm text-slate-400 text-center">
        Estás a punto de enviar formalmente tu evaluación.
        <br />
        <span className="text-slate-500">Puedes revisar cada respuesta antes de confirmar.</span>
      </p>
    </div>
```

---

## PARTE 5: Progress Bar + Card Resumen

**Usar estilos survey premium de FocalizaHR.**

```tsx
    {/* PROGRESS BAR */}
    <div className="px-6 pt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">Progreso</span>
        <span className="text-sm font-medium text-cyan-400">
          {validation.answered}/{validation.total}
        </span>
      </div>
      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(validation.answered / validation.total) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>

    {/* CARD RESUMEN - Protagonista */}
    <div className="mx-6 mt-4 p-5 rounded-xl bg-slate-800/50 border border-slate-700/50">
      {/* Score y Clasificación */}
      <div className="flex items-center justify-center gap-8 mb-4">
        {/* Promedio */}
        <div className="text-center">
          <div className="text-3xl font-light text-cyan-400">
            {summary.average.toFixed(1)}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
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
          <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
            Clasificación
          </div>
        </div>
      </div>

      {/* Barras por categoría/competencia */}
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
              <span className="text-xs font-medium text-slate-300 w-8 text-right">
                {cat.average.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
```

---

## PARTE 6: Progressive Disclosure

```tsx
    {/* TOGGLE DETALLE */}
    <button
      onClick={() => setShowDetails(!showDetails)}
      className="w-full px-6 py-3 flex items-center justify-between text-sm text-slate-400 hover:text-cyan-400 transition-colors"
    >
      <span>Ver detalle por pregunta</span>
      <ChevronDown
        className={`w-4 h-4 transition-transform duration-200 ${
          showDetails ? 'rotate-180' : ''
        }`}
      />
    </button>

    {/* DETALLE COLAPSABLE */}
    <AnimatePresence>
      {showDetails && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-t border-slate-700/50"
        >
          <div className="px-6 py-4 max-h-60 overflow-y-auto">
            {/* Aquí va el contenido actual de groupedResponses */}
            {/* Mantener estructura existente */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
```

---

## PARTE 7: Footer con Botones Premium Sólidos

**Usar componentes de `@/components/ui/PremiumButton`**

```tsx
    {/* FOOTER */}
    <div className="px-6 py-4 border-t border-slate-700/50">
      <ButtonGroup spacing={12}>
        {/* Botón secundario - Ghost */}
        <GhostButton
          icon={ArrowLeft}
          onClick={onClose}
        >
          Volver a editar
        </GhostButton>

        {/* CTA Principal - Primary (cyan gradient sólido) */}
        <PrimaryButton
          icon={Send}
          iconPosition="right"
          onClick={onConfirm}
          disabled={!validation.isComplete}
          isLoading={isSubmitting}
          glow={true}
        >
          {isSubmitting ? 'Enviando...' : 'Confirmar y Enviar'}
        </PrimaryButton>
      </ButtonGroup>

      {/* Warning SOLO si hay incompletas */}
      {!validation.isComplete && (
        <p className="text-xs text-amber-400 text-center mt-3">
          Completa las {validation.unanswered} pregunta
          {validation.unanswered !== 1 ? 's' : ''} restante
          {validation.unanswered !== 1 ? 's' : ''} para enviar
        </p>
      )}
    </div>

  </motion.div>
</div>
```

---

## PARTE 8: useMemo para Summary

```typescript
const summary = useMemo(() => {
  // Filtrar solo preguntas de rating (competencias)
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

  // Usar función alineada al motor
  const classification = getPerformanceClassification(average);

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

  return {
    average,
    classification,
    categoryAverages,
    totalRatings: ratings.length
  };
}, [questions, responses]);

const [showDetails, setShowDetails] = useState(false);
```

---

## Checklist de Validación

```yaml
ICONOGRAFÍA:
  ✅ Lucide icons: Star, CheckCircle, TrendingUp, AlertTriangle
  ❌ NO emojis

CLASES CSS:
  ✅ .fhr-top-line (línea Tesla)
  ✅ bg-slate-900, bg-slate-800/50 (fondos survey)
  ✅ border-slate-700/50 (bordes sutiles)
  ✅ Gradiente barras: from-cyan-500 to-purple-500

BOTONES PREMIUM:
  ✅ PrimaryButton (cyan gradient sólido) para CTA
  ✅ GhostButton (transparente + border) para secundario
  ✅ ButtonGroup para agrupar

CLASIFICACIÓN:
  ✅ Alineada al motor (getScale5Classification)
  ✅ >= 4.5 Excepcional
  ✅ >= 4.0 Buen Desempeño
  ✅ >= 3.5 Cumple Expectativas
  ✅ >= 2.5 En Desarrollo
  ✅ < 2.5 Requiere Atención

FILOSOFÍA UX:
  ✅ Above the fold: Score + Clasificación visible
  ✅ UN CTA principal: "Confirmar y Enviar"
  ✅ Progressive disclosure: Detalle colapsado
  ✅ Header: Nombre + Cargo + Departamento
  ✅ Mensaje guía: "Estás a punto de enviar..."
```

---

## Estructura Final Esperada

```
┌─────────────────────────────────────────────────────────────┐
│ ═══════════════════════════════════════════ (línea Tesla)   │
│                                                             │
│ TU EVALUACIÓN DE                                    [X]     │
│ María González                                              │
│ Analista Senior · Finanzas                                  │
│                                                             │
│        Estás a punto de enviar formalmente tu evaluación.   │
│        Puedes revisar cada respuesta antes de confirmar.    │
│                                                             │
│ Progreso                                           20/20    │
│ ████████████████████████████████████████████████████████    │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │       4.4              │    ✓ Buen Desempeño            │ │
│ │     PROMEDIO           │      CLASIFICACIÓN             │ │
│ │                                                         │ │
│ │  ─────────────────────────────────────────────────────  │ │
│ │  POR COMPETENCIA                                        │ │
│ │  Liderazgo    ████████████████████████████████    4.5   │ │
│ │  Comunicación ██████████████████████████████      4.2   │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Ver detalle por pregunta                              ∨     │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│   ← Volver a editar          [ Confirmar y Enviar  ➤ ]     │
└─────────────────────────────────────────────────────────────┘
```
