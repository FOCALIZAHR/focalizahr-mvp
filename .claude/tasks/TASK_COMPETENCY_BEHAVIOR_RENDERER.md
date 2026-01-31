# TASK: CompetencyBehaviorRenderer - Renderer Premium para Evaluaciones

## 📋 CONTEXTO

FocalizaHR necesita un nuevo renderer especializado para evaluaciones de desempeño/competencias. Este renderer mostrará 5 cards premium con efecto "Spotlight + Focus Mode" en lugar de los botones circulares tradicionales del `RatingScaleRenderer`.

### Arquitectura v2.2 Existente

El sistema ya soporta labels dinámicos via:
- `question.scaleLabels`: Array de strings (puede incluir formato "Título: Descripción")
- `getScaleLabels()`: Helper que resuelve labels con cascade de 4 prioridades
- `ScaleLabels`: Interface `{ min, max, scale: string[] }`

### Principio Clave: NO ROMPE NADA

El renderer solo cambia la **UI**. El valor guardado sigue siendo `rating: 1-5`, que es lo que usan:
- `calculateNormalizedScore()` para métricas
- Sistema de alertas
- Todos los reportes

---

## 🎯 OBJETIVO

Crear `CompetencyBehaviorRenderer.tsx` que:
1. Muestre 5 cards premium con efecto Spotlight
2. Parse automático de formato "Título: Descripción" en labels
3. Dark mode obligatorio (fondos slate-800/900)
4. Mobile-first (stack en mobile, grid en desktop)
5. Use colores corporativos (purple para activo, cyan para energía)
6. Integre con arquitectura v2.2 existente

---

## 📐 ESPECIFICACIONES DE DISEÑO

### Filosofía FocalizaHR (OBLIGATORIO)

```yaml
MOBILE-FIRST:
  - Base: 1 columna (stack vertical)
  - sm (640px+): 2 columnas
  - lg (1024px+): 5 columnas
  - Touch targets: mínimo 44px

DARK MODE:
  - Fondo cards: rgba(30, 41, 59, 0.6) con backdrop-blur
  - Fondo activo: rgba(15, 23, 42, 0.95)
  - Textos: slate-300/400 pasivos, white activo

COLORES CORPORATIVOS:
  - Purple (#A78BFA / #8B5CF6): Borde y glow de card activa
  - Cyan (#22D3EE): Energy beam superior
  - NO usar colores termodinámicos (un solo color para activo)

ANIMACIONES:
  - Transiciones suaves (0.3-0.5s)
  - Focus mode: grayscale + opacity 50% en no seleccionados
  - Card activa: scale 1.03, translateY -10px
  - Energy beam: width 0% → 100% al seleccionar
```

### UX Spotlight + Focus Mode

```
ESTADO INICIAL (nada seleccionado):
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│  1  │ │  2  │ │  3  │ │  4  │ │  5  │
│     │ │     │ │     │ │     │ │     │
│ 100%│ │ 100%│ │ 100%│ │ 100%│ │ 100%│
└─────┘ └─────┘ └─────┘ └─────┘ └─────┘

ESTADO CON SELECCIÓN (card 3 activa):
┌─────┐ ┌─────┐ ┌═════┐ ┌─────┐ ┌─────┐
│░░░░░│ │░░░░░│ ║  3  ║ │░░░░░│ │░░░░░│
│ dim │ │ dim │ ║ ✓   ║ │ dim │ │ dim │
│ 50% │ │ 50% │ ║GLOW ║ │ 50% │ │ 50% │
└─────┘ └─────┘ └═════┘ └─────┘ └─────┘
  gray    gray   PURPLE   gray    gray
```

---

## 🔧 IMPLEMENTACIÓN

### Archivo: `src/components/survey/renderers/CompetencyBehaviorRenderer.tsx`

```typescript
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════
// TYPES - Alineado con arquitectura v2.2
// ═══════════════════════════════════════════════════════════════════════

export interface CompetencyLabels {
  min: string;
  max: string;
  scale: string[];
}

interface CompetencyBehaviorRendererProps {
  response: {
    questionId: string;
    rating?: number;
  };
  updateResponse: (update: { rating: number }) => void;
  labels?: CompetencyLabels;
}

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const DEFAULT_LABELS: CompetencyLabels = {
  min: "Nunca demuestra",
  max: "Siempre demuestra",
  scale: [
    "Nunca demuestra",
    "Rara vez demuestra",
    "A veces demuestra",
    "Frecuentemente demuestra",
    "Siempre demuestra"
  ]
};

// ═══════════════════════════════════════════════════════════════════════
// HELPER: Parse "Título: Descripción" format
// ═══════════════════════════════════════════════════════════════════════

interface ParsedLabel {
  title: string;
  description: string;
}

function parseLabel(labelString: string, index: number): ParsedLabel {
  const hasTitle = labelString.includes(":");
  if (hasTitle) {
    const [title, ...descParts] = labelString.split(":");
    return {
      title: title.trim(),
      description: descParts.join(":").trim()
    };
  }
  return {
    title: `Nivel ${index + 1}`,
    description: labelString
  };
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const CompetencyBehaviorRenderer: React.FC<CompetencyBehaviorRendererProps> = ({
  response,
  updateResponse,
  labels = DEFAULT_LABELS
}) => {
  const selectedValue = response?.rating;
  const hasSelection = selectedValue !== undefined && selectedValue > 0;

  return (
    <div className="w-full space-y-6">
      {/* Grid de Cards - Mobile First */}
      <div 
        className={cn(
          "grid gap-4",
          "grid-cols-1",           // Mobile: stack
          "sm:grid-cols-2",        // Tablet: 2 columnas
          "lg:grid-cols-5"         // Desktop: 5 columnas
        )}
      >
        {labels.scale.map((labelString, index) => {
          const score = index + 1;
          const isSelected = selectedValue === score;
          const isBlurred = hasSelection && !isSelected;
          const { title, description } = parseLabel(labelString, index);

          return (
            <motion.div
              key={score}
              onClick={() => updateResponse({ rating: score })}
              initial={false}
              animate={{
                scale: isSelected ? 1.03 : 1,
                y: isSelected ? -10 : 0,
                opacity: isBlurred ? 0.5 : 1,
                filter: isBlurred ? "grayscale(100%)" : "grayscale(0%)"
              }}
              whileHover={!isSelected ? { 
                y: -4, 
                scale: 1.01,
                transition: { duration: 0.2 }
              } : {}}
              transition={{
                duration: 0.4,
                ease: [0.25, 1, 0.5, 1] // Apple ease
              }}
              className={cn(
                // Base
                "relative cursor-pointer rounded-xl overflow-hidden",
                "min-h-[200px] lg:min-h-[280px]",
                "p-5 lg:p-6",
                "flex flex-col justify-between",
                "backdrop-blur-md",
                "transition-colors duration-300",
                
                // Estados
                isSelected
                  ? [
                      "bg-slate-900/95",
                      "border-2 border-purple-500",
                      "shadow-xl shadow-purple-500/20",
                      "ring-2 ring-purple-500/30",
                      "z-10"
                    ]
                  : [
                      "bg-slate-800/60",
                      "border border-slate-700/50",
                      "hover:bg-slate-800/80",
                      "hover:border-slate-600"
                    ]
              )}
            >
              {/* Energy Beam (Cyan) - Top */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-700/50 overflow-hidden">
                <motion.div
                  className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                  initial={{ width: "0%" }}
                  animate={{ width: isSelected ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Watermark Number */}
              <motion.div
                className={cn(
                  "absolute -bottom-8 -right-4",
                  "text-[120px] lg:text-[160px] font-black",
                  "leading-none pointer-events-none select-none",
                  "transition-colors duration-500",
                  isSelected ? "text-purple-500/15" : "text-white/5"
                )}
                animate={{
                  scale: isSelected ? 1.05 : 1,
                  x: isSelected ? -5 : 0
                }}
                transition={{ duration: 0.5 }}
              >
                {score}
              </motion.div>

              {/* Content Layer */}
              <div className="relative z-10 flex flex-col h-full">
                {/* Header: Tech Label + Check */}
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={cn(
                      "font-mono text-[10px] tracking-[0.15em] uppercase",
                      "px-2 py-1 rounded",
                      isSelected
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-slate-700/50 text-slate-500"
                    )}
                  >
                    Nivel 0{score}
                  </span>

                  {/* Animated Check */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className={cn(
                          "w-8 h-8 rounded-full",
                          "bg-purple-500 text-white",
                          "flex items-center justify-center",
                          "shadow-lg shadow-purple-500/30"
                        )}
                      >
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Title & Description */}
                <div className="flex-1">
                  <h4
                    className={cn(
                      "font-bold text-base lg:text-lg mb-2",
                      "transition-colors duration-300",
                      isSelected ? "text-white" : "text-slate-300"
                    )}
                  >
                    {title}
                  </h4>
                  <p
                    className={cn(
                      "text-sm leading-relaxed",
                      "transition-colors duration-300",
                      isSelected ? "text-slate-300" : "text-slate-500"
                    )}
                  >
                    {description}
                  </p>
                </div>

                {/* Trigger Button (Mobile affordance) */}
                <div
                  className={cn(
                    "mt-4 w-9 h-9 rounded-full",
                    "flex items-center justify-center",
                    "transition-all duration-300",
                    "lg:opacity-0 lg:group-hover:opacity-100", // Hide on desktop unless hover
                    isSelected
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                      : "bg-slate-700/50 border border-slate-600 text-transparent"
                  )}
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Labels de extremos (guía visual) */}
      <div className="flex justify-between px-2 text-[10px] uppercase tracking-[0.2em] text-slate-600 font-medium">
        <span>← {labels.min}</span>
        <span>{labels.max} →</span>
      </div>
    </div>
  );
};

export default CompetencyBehaviorRenderer;
```

---

## 📦 INTEGRACIÓN

### 1. Agregar al Barrel Export

```typescript
// src/components/survey/renderers/index.ts

export { RatingScaleRenderer } from './RatingScaleRenderer';
export { TextOpenRenderer } from './TextOpenRenderer';
export { SingleChoiceRenderer } from './SingleChoiceRenderer';
export { MultipleChoiceRenderer } from './MultipleChoiceRenderer';
export { RatingMatrixRenderer } from './RatingMatrixRenderer';
export { NPSScaleRenderer } from './NPSScaleRenderer';
export { CompetencyBehaviorRenderer } from './CompetencyBehaviorRenderer'; // NUEVO
```

### 2. Agregar Case en UnifiedSurveyComponent

```typescript
// src/components/survey/UnifiedSurveyComponent.tsx

import { CompetencyBehaviorRenderer } from './renderers';

// En la función renderQuestion(), agregar nuevo case:

case 'competency_behavior':
  const competencyLabels = getScaleLabels(currentQuestion, config);
  return (
    <CompetencyBehaviorRenderer
      response={response}
      updateResponse={updateResponse}
      labels={competencyLabels}
    />
  );
```

### 3. Agregar Tipo en useSurveyEngine

```typescript
// src/hooks/useSurveyEngine.ts

export interface Question {
  // ... campos existentes ...
  responseType:
    | 'text_open'
    | 'multiple_choice'
    | 'rating_matrix_conditional'
    | 'rating_scale'
    | 'single_choice'
    | 'nps_scale'
    | 'competency_behavior';  // NUEVO
}

// En isCurrentResponseValid(), agregar:
case 'competency_behavior':
  return response.rating !== undefined && 
         response.rating >= 1 && 
         response.rating <= 5;
```

---

## 🗄️ CONFIGURACIÓN EN BD

### Opción A: Nueva pregunta con labels custom

```sql
INSERT INTO questions (
  id, campaign_type_id, text, category,
  question_order, response_type, is_required,
  scale_labels
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM campaign_types WHERE slug = 'evaluacion-desempeno'),
  '¿Cómo evalúas la colaboración de este colaborador?',
  'competencias',
  1,
  'competency_behavior',  -- Nuevo tipo
  true,
  '[
    "Aislado: Trabaja de forma individual, rara vez comparte información o busca ayuda.",
    "Reactivo: Colabora solo cuando se le solicita específicamente.",
    "Colaborativo: Participa activamente en dinámicas de equipo y comparte conocimientos.",
    "Integrador: Fomenta la colaboración entre diferentes áreas y resuelve conflictos.",
    "Sinergístico: Crea un ecosistema donde el todo es mayor que la suma de las partes."
  ]'::jsonb
);
```

### Opción B: Default por campaign_type

```sql
UPDATE survey_configurations
SET ui_settings = jsonb_set(
  ui_settings,
  '{defaultLabels,competency_behavior}',
  '{
    "min": "Nunca demuestra",
    "max": "Siempre demuestra",
    "scale": [
      "Aislado: Trabaja de forma individual.",
      "Reactivo: Colabora cuando se le pide.",
      "Colaborativo: Participa activamente.",
      "Integrador: Fomenta colaboración.",
      "Sinergístico: Crea ecosistemas."
    ]
  }'::jsonb
)
WHERE campaign_type_id = (SELECT id FROM campaign_types WHERE slug = 'evaluacion-desempeno');
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Funcionalidad
- [ ] Click en card actualiza `response.rating` correctamente (1-5)
- [ ] Solo una card puede estar activa a la vez
- [ ] Cards no activas se difuminan (grayscale + opacity)
- [ ] Energy beam se llena al 100% en card activa
- [ ] Check animado aparece solo en card activa
- [ ] Labels se parsean correctamente (formato "Título: Descripción")
- [ ] Fallback funciona si no hay ":" en label

### Diseño
- [ ] Dark mode correcto (fondos slate-800/900)
- [ ] Purple para borde/glow activo
- [ ] Cyan para energy beam
- [ ] Mobile: Stack vertical (1 columna)
- [ ] Tablet: 2 columnas
- [ ] Desktop: 5 columnas
- [ ] Touch targets mínimo 44px
- [ ] Watermark number visible pero sutil

### Integración
- [ ] Export en `renderers/index.ts`
- [ ] Case en `UnifiedSurveyComponent`
- [ ] Type en `useSurveyEngine`
- [ ] Validación en `isCurrentResponseValid()`
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit` sin errores

### Retrocompatibilidad
- [ ] RatingScaleRenderer sigue funcionando igual
- [ ] Otras encuestas no afectadas
- [ ] normalizedScore se calcula correctamente (el renderer no lo afecta)

---

## 📊 RESULTADO ESPERADO

### Mobile (375px)
```
┌─────────────────────────┐
│ ══════════════════════  │ ← Energy beam
│        1                │ ← Watermark
│ ┌───────────────────┐   │
│ │ NIVEL 01      [✓] │   │
│ │                   │   │
│ │ Aislado           │   │
│ │ Trabaja de forma  │   │
│ │ individual...     │   │
│ │                   │   │
│ │ [●]               │   │ ← Trigger button
│ └───────────────────┘   │
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│ (Card 2)                │
└─────────────────────────┘
         ↓
        ...
```

### Desktop (1024px+)
```
┌─────┐ ┌─────┐ ┌═════┐ ┌─────┐ ┌─────┐
│░░░░░│ │░░░░░│ ║  3  ║ │░░░░░│ │░░░░░│
│ dim │ │ dim │ ║ ✓   ║ │ dim │ │ dim │
│ 50% │ │ 50% │ ║GLOW ║ │ 50% │ │ 50% │
│gray │ │gray │ ║purpl║ │gray │ │gray │
└─────┘ └─────┘ └═════┘ └─────┘ └─────┘

← Nunca demuestra          Siempre demuestra →
```

---

## 🚀 COMANDO DE EJECUCIÓN

```bash
# Ejecutar esta tarea
# 1. Crear el archivo del renderer
# 2. Actualizar barrel export
# 3. Agregar case en UnifiedSurveyComponent  
# 4. Agregar tipo en useSurveyEngine
# 5. Compilar y verificar
```

---

**VERSIÓN:** 1.0  
**FECHA:** Enero 2026  
**DEPENDENCIAS:** framer-motion, lucide-react, cn (utils)
