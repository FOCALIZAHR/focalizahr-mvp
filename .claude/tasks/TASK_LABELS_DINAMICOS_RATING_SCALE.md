# 🎯 TASK: Labels Dinámicos para Rating Scale

## CONTEXTO MÍNIMO

Sistema de encuestas FocalizaHR tiene `RatingScaleRenderer` con labels **hardcodeados**:
```typescript
const scaleLabels = ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo'];
```

**Problema:** Algunas encuestas necesitan labels diferentes (ej: "Nunca" → "Siempre").

**Solución:** Labels configurables con cascade de fallbacks.

---

## ARQUITECTURA APROBADA

```
PRIORIDAD 1: question.minLabel / question.maxLabel (override por pregunta)
     ↓ si null
PRIORIDAD 2: config.uiSettings.defaultLabels[responseType] (default por campaign_type)
     ↓ si null  
PRIORIDAD 3: Hardcoded fallback (comportamiento actual)
```

---

## PASO 1: Schema Prisma

**Archivo:** `prisma/schema.prisma`

**Buscar modelo `Question`** y agregar 3 campos después de `maxValue`:

```prisma
model Question {
  // ... campos existentes hasta maxValue ...
  minValue   Int     @default(1) @map("min_value")
  maxValue   Int     @default(5) @map("max_value")

  // ═══════════════════════════════════════════════════
  // LABELS DINÁMICOS UI (NUEVO)
  // ═══════════════════════════════════════════════════
  minLabel    String? @map("min_label")    // "Nunca", "Muy en desacuerdo", etc.
  maxLabel    String? @map("max_label")    // "Siempre", "Muy de acuerdo", etc.
  scaleLabels Json?   @map("scale_labels") // ["Nunca","Rara vez","A veces","Frecuente","Siempre"]
  // Si scaleLabels existe, se usa completo. Si no, se interpola min/max.

  // ... resto de campos existentes ...
```

**Ejecutar migración:**
```bash
npx prisma migrate dev --name add_question_ui_labels
```

---

## PASO 2: Tipos TypeScript

**Archivo:** `src/hooks/useSurveyEngine.ts`

**Buscar `export interface Question`** y agregar campos:

```typescript
export interface Question {
  id: string;
  text: string;
  category: string;
  questionOrder: number;
  responseType: 'text_open' | 'multiple_choice' | 'rating_matrix_conditional' | 'rating_scale' | 'single_choice' | 'nps_scale';
  choiceOptions?: string[] | null;
  conditionalLogic?: any;
  minValue?: number;
  maxValue?: number;
  
  // ═══════════════════════════════════════════════════
  // LABELS DINÁMICOS UI (NUEVO)
  // ═══════════════════════════════════════════════════
  minLabel?: string | null;
  maxLabel?: string | null;
  scaleLabels?: string[] | null;
}
```

---

## PASO 3: Helper Function

**Archivo NUEVO:** `src/lib/survey/getScaleLabels.ts`

```typescript
// src/lib/survey/getScaleLabels.ts

import type { Question } from '@/hooks/useSurveyEngine';
import type { SurveyConfiguration } from '@/hooks/useSurveyConfiguration';

/**
 * LABELS POR DEFECTO (fallback final)
 * Mismo comportamiento que antes de este cambio
 */
const DEFAULT_LABELS: Record<string, { min: string; max: string; scale?: string[] }> = {
  rating_scale: {
    min: 'Muy en desacuerdo',
    max: 'Muy de acuerdo',
    scale: ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo']
  },
  nps_scale: {
    min: 'Nada probable',
    max: 'Muy probable'
  }
};

export interface ScaleLabels {
  min: string;
  max: string;
  scale: string[];
}

/**
 * Obtiene labels para una pregunta con cascade de fallbacks:
 * 1. Override por pregunta (question.minLabel/maxLabel/scaleLabels)
 * 2. Default por campaign_type (config.uiSettings.defaultLabels)
 * 3. Fallback hardcoded (comportamiento legacy)
 */
export function getScaleLabels(
  question: Pick<Question, 'responseType' | 'minLabel' | 'maxLabel' | 'scaleLabels' | 'minValue' | 'maxValue'>,
  config?: SurveyConfiguration | null
): ScaleLabels {
  const responseType = question.responseType;
  const scaleSize = (question.maxValue || 5) - (question.minValue || 1) + 1;

  // ═══════════════════════════════════════════════════
  // PRIORIDAD 1: Override completo por pregunta (scaleLabels)
  // ═══════════════════════════════════════════════════
  if (question.scaleLabels && Array.isArray(question.scaleLabels) && question.scaleLabels.length > 0) {
    return {
      min: question.scaleLabels[0],
      max: question.scaleLabels[question.scaleLabels.length - 1],
      scale: question.scaleLabels
    };
  }

  // ═══════════════════════════════════════════════════
  // PRIORIDAD 2: Override parcial por pregunta (min/max)
  // ═══════════════════════════════════════════════════
  if (question.minLabel || question.maxLabel) {
    const min = question.minLabel || DEFAULT_LABELS[responseType]?.min || 'Muy en desacuerdo';
    const max = question.maxLabel || DEFAULT_LABELS[responseType]?.max || 'Muy de acuerdo';
    return {
      min,
      max,
      scale: interpolateScale(min, max, scaleSize)
    };
  }

  // ═══════════════════════════════════════════════════
  // PRIORIDAD 3: Default por campaign_type (uiSettings)
  // ═══════════════════════════════════════════════════
  const configLabels = config?.uiSettings?.defaultLabels?.[responseType];
  if (configLabels) {
    if (configLabels.scale && Array.isArray(configLabels.scale)) {
      return {
        min: configLabels.min || configLabels.scale[0],
        max: configLabels.max || configLabels.scale[configLabels.scale.length - 1],
        scale: configLabels.scale
      };
    }
    if (configLabels.min || configLabels.max) {
      const min = configLabels.min || DEFAULT_LABELS[responseType]?.min || 'Muy en desacuerdo';
      const max = configLabels.max || DEFAULT_LABELS[responseType]?.max || 'Muy de acuerdo';
      return {
        min,
        max,
        scale: interpolateScale(min, max, scaleSize)
      };
    }
  }

  // ═══════════════════════════════════════════════════
  // PRIORIDAD 4: Fallback hardcoded (legacy)
  // ═══════════════════════════════════════════════════
  const fallback = DEFAULT_LABELS[responseType] || DEFAULT_LABELS.rating_scale;
  return {
    min: fallback.min,
    max: fallback.max,
    scale: fallback.scale || interpolateScale(fallback.min, fallback.max, scaleSize)
  };
}

/**
 * Interpola labels intermedios entre min y max
 * Para escala 5: ["Muy en desacuerdo", "En desacuerdo", "Neutral", "De acuerdo", "Muy de acuerdo"]
 */
function interpolateScale(min: string, max: string, size: number): string[] {
  if (size <= 2) return [min, max];
  
  // Labels intermedios genéricos
  const middleLabels: Record<number, string[]> = {
    3: ['Neutral'],
    5: ['En desacuerdo', 'Neutral', 'De acuerdo'],
    7: ['Bastante en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Bastante de acuerdo'],
  };

  const middle = middleLabels[size] || middleLabels[5];
  return [min, ...middle.slice(0, size - 2), max];
}

export default getScaleLabels;
```

---

## PASO 4: Modificar RatingScaleRenderer

**Archivo:** `src/components/survey/renderers/RatingScaleRenderer.tsx`

**REEMPLAZAR contenido completo:**

```typescript
// src/components/survey/renderers/RatingScaleRenderer.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { scaleIn } from '../constants/animations';
import type { SurveyResponse } from '@/hooks/useSurveyEngine';

export interface RatingScaleLabels {
  min: string;
  max: string;
  scale: string[];
}

interface RatingScaleRendererProps {
  response: SurveyResponse;
  updateResponse: (update: Partial<SurveyResponse>) => void;
  labels?: RatingScaleLabels;
}

// Fallback por si no se pasan labels (retrocompatibilidad)
const DEFAULT_SCALE_LABELS: RatingScaleLabels = {
  min: 'Muy en desacuerdo',
  max: 'Muy de acuerdo',
  scale: ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo']
};

export const RatingScaleRenderer: React.FC<RatingScaleRendererProps> = ({ 
  response, 
  updateResponse,
  labels = DEFAULT_SCALE_LABELS
}) => {
  const scaleLabels = labels.scale || DEFAULT_SCALE_LABELS.scale;

  return (
    <motion.div 
      variants={scaleIn} 
      initial="initial" 
      animate="animate" 
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Botones de escala */}
      <div className="flex justify-center gap-3">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => updateResponse({ rating: value })}
            className={`survey-scale-button ${
              response?.rating === value ? 'selected' : ''
            }`}
            aria-label={`${value} - ${scaleLabels[value - 1]}`}
          >
            <span className="survey-scale-button-number">{value}</span>
            {response?.rating === value && (
              <span className="survey-scale-ripple" />
            )}
          </button>
        ))}
      </div>

      {/* Labels de extremos */}
      <div className="flex justify-between max-w-md mx-auto px-2">
        <span className="text-xs text-slate-500">{labels.min}</span>
        <span className="text-xs text-slate-500">{labels.max}</span>
      </div>

      {/* Mostrar label del valor seleccionado */}
      {response?.rating && (
        <div className="text-center">
          <span className="text-sm text-cyan-400 font-medium">
            {scaleLabels[response.rating - 1]}
          </span>
        </div>
      )}
    </motion.div>
  );
};
```

---

## PASO 5: Modificar UnifiedSurveyComponent

**Archivo:** `src/components/survey/UnifiedSurveyComponent.tsx`

**Agregar import al inicio:**
```typescript
import { getScaleLabels } from '@/lib/survey/getScaleLabels';
```

**Buscar la función `renderQuestion`** y modificar el case `rating_scale`:

```typescript
const renderQuestion = () => {
  if (!currentQuestion) return null;
  const response = getCurrentResponse();
  const validationRule = getCurrentValidationRule();

  switch (currentQuestion.responseType) {
    case 'text_open':
      return <TextOpenRenderer response={response} updateResponse={updateResponse} />;

    case 'rating_scale':
      // ═══════════════════════════════════════════════════
      // NUEVO: Obtener labels dinámicos con cascade
      // ═══════════════════════════════════════════════════
      const ratingLabels = getScaleLabels(currentQuestion, config);
      return (
        <RatingScaleRenderer 
          response={response} 
          updateResponse={updateResponse}
          labels={ratingLabels}
        />
      );

    case 'single_choice':
      return <SingleChoiceRenderer question={currentQuestion} response={response} updateResponse={updateResponse} />;
    
    // ... resto de cases sin cambios ...
  }
};
```

---

## PASO 6: Actualizar Interface uiSettings

**Archivo:** `src/hooks/useSurveyConfiguration.ts`

**Buscar `export interface UISettings`** y agregar `defaultLabels`:

```typescript
export interface UISettings {
  showCategoryIntros: boolean;
  questionTransitions: 'slide' | 'fade' | 'none';
  progressDisplay: 'linear' | 'categorical' | 'minimal';
  breakAfterQuestions: number[];
  completionCelebration: boolean;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    showGradients?: boolean;
  };
  antiFatigueSettings?: {
    enableMicroBreaks?: boolean;
    showMotivationalMessages?: boolean;
    questionsPerPage?: number;
    breakDuration?: number;
  };
  
  // ═══════════════════════════════════════════════════
  // LABELS POR DEFECTO (NUEVO)
  // ═══════════════════════════════════════════════════
  defaultLabels?: {
    [responseType: string]: {
      min?: string;
      max?: string;
      scale?: string[];
    };
  };
}
```

---

## VALIDACIÓN

### Test 1: Sin configurar (debe usar fallback legacy)
```sql
-- Pregunta sin labels configurados
SELECT id, text, min_label, max_label, scale_labels 
FROM questions 
WHERE response_type = 'rating_scale' 
LIMIT 1;
-- min_label: NULL, max_label: NULL → debe mostrar "Muy en desacuerdo" / "Muy de acuerdo"
```

### Test 2: Con override por pregunta
```sql
-- Configurar labels custom en una pregunta
UPDATE questions 
SET min_label = 'Nunca', max_label = 'Siempre'
WHERE id = 'ALGUNA_PREGUNTA_ID';
-- Debe mostrar "Nunca" / "Siempre"
```

### Test 3: Con scaleLabels completo
```sql
UPDATE questions 
SET scale_labels = '["Nunca", "Rara vez", "A veces", "Frecuente", "Siempre"]'::jsonb
WHERE id = 'OTRA_PREGUNTA_ID';
-- Debe mostrar labels intermedios personalizados
```

---

## ARCHIVOS MODIFICADOS

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | +3 campos en Question |
| `src/hooks/useSurveyEngine.ts` | +3 props en interface Question |
| `src/hooks/useSurveyConfiguration.ts` | +defaultLabels en UISettings |
| `src/lib/survey/getScaleLabels.ts` | **NUEVO** - Helper function |
| `src/components/survey/renderers/RatingScaleRenderer.tsx` | +labels prop |
| `src/components/survey/UnifiedSurveyComponent.tsx` | Pasar labels a renderer |

---

## NOTAS IMPORTANTES

1. **Retrocompatibilidad:** Si `minLabel`, `maxLabel`, `scaleLabels` son NULL → comportamiento idéntico a antes
2. **No tocar:** `minValue`/`maxValue` son para rango numérico, NO confundir con labels
3. **No tocar:** `responseValueMapping` es para normalización analytics, NO para UI
4. **Performance:** La función `getScaleLabels` es O(1), sin queries adicionales

---

## FIN TASK
